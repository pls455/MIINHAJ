import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const NAME = 'solutions';
const MAX_LIMIT = 50;

function normalizeLimit(value) { return Math.min(Math.max(Number(value) || 24, 1), MAX_LIMIT); }
function collectionRef() { return collection(db, NAME); }
function normalizeSolution(data = {}) {
  const title = String(data.title ?? '').trim();
  if (!title) throw new Error('SOLUTION_TITLE_REQUIRED');
  return { ...data, title: title.slice(0, 300), ...(data.active !== undefined ? { active: Boolean(data.active) } : {}) };
}

export async function getSolutions({ pageSize = 24, cursor = null, subjectId = null, activeOnly = false } = {}) {
  const constraints = [];
  if (subjectId) constraints.push(where('subjectId', '==', subjectId));
  if (activeOnly) constraints.push(where('active', '==', true));
  constraints.push(orderBy('order', 'asc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(normalizeLimit(pageSize)));
  const snap = await getDocs(query(collectionRef(), ...constraints));
  return { items: snap.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snap.docs.at(-1) || null };
}

export async function getSolution(id) {
  const snap = await getDoc(doc(db, NAME, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createSolution(data) {
  const normalized = normalizeSolution(data);
  const refDoc = await addDoc(collectionRef(), { ...normalized, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'create', collectionName: NAME, targetId: refDoc.id, details: { title: normalized.title } });
  return refDoc;
}

export async function updateSolution(id, data) {
  const normalized = normalizeSolution(data);
  await updateDoc(doc(db, NAME, id), { ...normalized, updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'update', collectionName: NAME, targetId: id, details: { title: normalized.title } });
}

export async function deleteSolution(id) {
  await deleteDoc(doc(db, NAME, id));
  await writeAdminLog({ action: 'delete', collectionName: NAME, targetId: id, details: {} });
}
