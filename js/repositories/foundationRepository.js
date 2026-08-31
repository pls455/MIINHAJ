import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const NAME = 'foundations';
const MAX_LIMIT = 50;

function normalizeLimit(value) { return Math.min(Math.max(Number(value) || 24, 1), MAX_LIMIT); }
function ref() { return collection(db, NAME); }

export async function getFoundations({ limit: pageSize = 24, cursor = null } = {}) {
  const constraints = [orderBy('order', 'asc')];
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(normalizeLimit(pageSize)));
  const snap = await getDocs(query(ref(), ...constraints));
  return { items: snap.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snap.docs.at(-1) || null };
}

export async function getFoundation(id) {
  const snap = await getDoc(doc(db, NAME, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createFoundation(data) {
  const refDoc = await addDoc(ref(), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'create', collectionName: NAME, targetId: refDoc.id, details: { title: String(data?.title ?? '').slice(0, 200) } });
  return refDoc;
}

export async function updateFoundation(id, data) {
  await updateDoc(doc(db, NAME, id), { ...data, updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'update', collectionName: NAME, targetId: id, details: { title: String(data?.title ?? '').slice(0, 200) } });
}

export async function deleteFoundation(id) {
  await deleteDoc(doc(db, NAME, id));
  await writeAdminLog({ action: 'delete', collectionName: NAME, targetId: id, details: {} });
}
