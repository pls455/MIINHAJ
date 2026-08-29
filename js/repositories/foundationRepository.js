import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, orderBy, limit, startAfter } from 'https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js';
import { db } from '../services/firebase/firebaseConfig.js';

const NAME = 'foundations';
const MAX_LIMIT = 50;

function normalizeLimit(value) { return Math.min(Math.max(Number(value) || 24, 1), MAX_LIMIT); }
function ref() { return collection(db, NAME); }

export async function getFoundations({ limit: pageSize = 24, cursor = null } = {}) {
  const constraints = [orderBy('order', 'asc'), limit(normalizeLimit(pageSize))];
  if (cursor) constraints.splice(1, 0, startAfter(cursor));
  const snap = await getDocs(query(ref(), ...constraints));
  return { items: snap.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snap.docs.at(-1) || null };
}

export async function getFoundation(id) {
  const snap = await getDoc(doc(db, NAME, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function createFoundation(data) { return addDoc(ref(), data); }
export async function updateFoundation(id, data) { return updateDoc(doc(db, NAME, id), data); }
export async function deleteFoundation(id) { return deleteDoc(doc(db, NAME, id)); }
