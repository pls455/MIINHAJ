import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const NAME = 'flashcards';
const MAX_ID = 128, MAX_QUESTION = 4000, MAX_ANSWER = 8000, MAX_EXPLANATION = 8000;
const clamp = value => Math.min(Math.max(Number(value) || 24, 1), 50);
const text = value => String(value ?? '').trim();
const validId = id => typeof id === 'string' && id.length > 0 && id.length <= MAX_ID;

function validate(input = {}) {
  const data = {
    question: text(input.question), answer: text(input.answer), explanation: text(input.explanation),
    branchId: text(input.branchId), subjectId: text(input.subjectId),
    order: Number(input.order), active: input.active !== false
  };
  if (!data.question) throw new Error('FLASHCARD_QUESTION_REQUIRED');
  if (data.question.length > MAX_QUESTION) throw new Error('FLASHCARD_QUESTION_TOO_LONG');
  if (!data.answer) throw new Error('FLASHCARD_ANSWER_REQUIRED');
  if (data.answer.length > MAX_ANSWER) throw new Error('FLASHCARD_ANSWER_TOO_LONG');
  if (data.explanation.length > MAX_EXPLANATION) throw new Error('FLASHCARD_EXPLANATION_TOO_LONG');
  if (!data.branchId) throw new Error('FLASHCARD_BRANCH_REQUIRED');
  if (!data.subjectId) throw new Error('FLASHCARD_SUBJECT_REQUIRED');
  if (!Number.isInteger(data.order) || data.order < 0) throw new Error('FLASHCARD_ORDER_INVALID');
  return data;
}

export async function getFlashcards({ pageSize = 24, cursor = null, branchId = null, subjectId = null, includeInactive = false } = {}) {
  const clauses = [];
  if (branchId) clauses.push(where('branchId', '==', branchId));
  if (subjectId) clauses.push(where('subjectId', '==', subjectId));
  if (!includeInactive) clauses.push(where('active', '==', true));
  clauses.push(orderBy('order', 'asc'));
  if (cursor) clauses.push(startAfter(cursor));
  clauses.push(limit(clamp(pageSize)));
  const snapshot = await getDocs(query(collection(db, NAME), ...clauses));
  return { items: snapshot.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snapshot.docs.at(-1) || null };
}

export async function getFlashcard(id) {
  if (!validId(id)) throw new Error('DOCUMENT_ID_INVALID');
  const snapshot = await getDoc(doc(db, NAME, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function createFlashcard(input) {
  const data = validate(input);
  const result = await addDoc(collection(db, NAME), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  try { await writeAdminLog({ action: 'create', collectionName: NAME, targetId: result.id, details: { question: data.question } }); } catch (error) { console.warn('[flashcards] admin log failed', error); }
  return result.id;
}

export async function updateFlashcard(id, input) {
  if (!validId(id)) throw new Error('DOCUMENT_ID_INVALID');
  const data = validate(input);
  await updateDoc(doc(db, NAME, id), { ...data, updatedAt: serverTimestamp() });
  try { await writeAdminLog({ action: 'update', collectionName: NAME, targetId: id, details: { question: data.question } }); } catch (error) { console.warn('[flashcards] admin log failed', error); }
}

export async function deleteFlashcard(id) {
  if (!validId(id)) throw new Error('DOCUMENT_ID_INVALID');
  await deleteDoc(doc(db, NAME, id));
  try { await writeAdminLog({ action: 'delete', collectionName: NAME, targetId: id }); } catch (error) { console.warn('[flashcards] admin log failed', error); }
}
