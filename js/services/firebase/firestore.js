import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
import { db } from "../firebase.js";

export function collectionRef(name) {
  return collection(db, name);
}

export function documentRef(name, id) {
  return doc(db, name, id);
}

export async function getDocument(name, id) {
  const snapshot = await getDoc(documentRef(name, id));
  return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null;
}

export async function getPage(name, constraints = [], pageSize = 24, cursor = null) {
  const safeSize = Math.max(1, Math.min(Number(pageSize) || 24, 50));
  const clauses = [...constraints];
  if (cursor) clauses.push(startAfter(cursor));
  clauses.push(limit(safeSize));

  const snapshot = await getDocs(query(collectionRef(name), ...clauses));
  const rows = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
  const nextCursor = snapshot.docs.at(-1) ?? null;

  return { rows, nextCursor, hasMore: rows.length === safeSize };
}

export function activeConstraint() {
  return where("active", "==", true);
}

export function orderedConstraint(field = "order", direction = "asc") {
  return orderBy(field, direction);
}

export async function createDocument(name, data) {
  const timestamped = {
    ...data,
    createdAt: data.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const result = await addDoc(collectionRef(name), timestamped);
  return result.id;
}

export async function updateDocument(name, id, data) {
  await updateDoc(documentRef(name, id), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDocument(name, id) {
  await deleteDoc(documentRef(name, id));
}
