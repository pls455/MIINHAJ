import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const NAME = 'flashcards';
const clamp = value => Math.min(Math.max(Number(value) || 24, 1), 50);
const text = value => String(value ?? '').trim();

function validate(input) {
  const data = {
    question: text(input.question), answer: text(input.answer), explanation: text(input.explanation),
    branchId: text(input.branchId), subjectId: text(input.subjectId),
    order: Number(input.order), active: input.active !== false
  };
  if (!data.question) throw new Error('FLASHCARD_QUESTION_REQUIRED');
  if (!data.answer) throw new Error('FLASHCARD_ANSWER_REQUIRED');
  if (!data.branchId) throw new Error('FLASHCARD_BRANCH_REQUIRED');
  if (!data.subjectId) throw new Error('FLASHCARD_SUBJECT_REQUIRED');
  if (!Number.isInteger(data.order) || data.order < 0) throw new Error('FLASHCARD_ORDER_INVALID');
  return data;
}

export async function getFlashcards({ pageSize = 24, cursor = null, branchId = null, subjectId = null } = {}) {
  const clauses = [];
  if (branchId) clauses.push(where('branchId', '==', branchId));
  if (subjectId) clauses.push(where('subjectId', '==', subjectId));
  clauses.push(where('active', '==', true), orderBy('order', 'asc'), limit(clamp(pageSize)));
  if (cursor) clauses.splice(clauses.length - 1, 0, startAfter(cursor));
  const snapshot = await getDocs(query(collection(db, NAME), ...clauses));
  return { items: snapshot.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snapshot.docs.at(-1) || null };
}

export async function getFlashcard(id) {
  const snapshot = await getDocs(query(collection(db, NAME), where('__name__', '==', id), limit(1)));
  const d = snapshot.docs[0];
  return d ? { id: d.id, ...d.data() } : null;
}

export async function createFlashcard(input) {
  const data = validate(input);
  const result = await addDoc(collection(db, NAME), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'create', collectionName: NAME, targetId: result.id, details: { question: data.question } });
  return result.id;
}

export async function updateFlashcard(id, input) {
  const data = validate(input);
  await updateDoc(doc(db, NAME, id), { ...data, updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'update', collectionName: NAME, targetId: id, details: { question: data.question } });
}

export async function deleteFlashcard(id) {
  await deleteDoc(doc(db, NAME, id));
  await writeAdminLog({ action: 'delete', collectionName: NAME, targetId: id });
}
