import { addDoc, collection, deleteDoc, doc, getDocs, limit, query, updateDoc, type DocumentData, type QueryConstraint } from 'firebase/firestore';
import { db } from '../../services/firebase';
import type { AdminRepository } from './types';

const ALLOWED_COLLECTIONS = new Set(['branches','subjects','categories','resources','foundations','flashcards','solutions','contributors','templates','suggestions','problemReports']);

const assertCollection = (name: string): void => {
  if (!ALLOWED_COLLECTIONS.has(name)) throw new Error('Unsupported admin collection');
};

export const firestoreAdminRepository: AdminRepository = {
  async list(collectionName, pageSize) {
    assertCollection(collectionName);
    const constraints: QueryConstraint[] = [limit(Math.min(Math.max(pageSize, 1), 50))];
    const snapshot = await getDocs(query(collection(db, collectionName), ...constraints));
    return snapshot.docs.map((item) => ({ id: item.id, ...(item.data() as DocumentData) }));
  },
  async create(collectionName, data) {
    assertCollection(collectionName);
    await addDoc(collection(db, collectionName), data);
  },
  async update(collectionName, id, data) {
    assertCollection(collectionName);
    await updateDoc(doc(db, collectionName, id), data);
  },
  async remove(collectionName, id) {
    assertCollection(collectionName);
    await deleteDoc(doc(db, collectionName, id));
  },
};
