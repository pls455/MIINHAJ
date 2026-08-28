import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, orderBy, query, serverTimestamp, startAfter, updateDoc, where, type DocumentData, type QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { BaseDocument, ListOptions, Page } from '../types';

interface Cursor { order: number; id: string }
const mapDoc = <T extends BaseDocument>(snapshot: { id: string; data: () => DocumentData }): T => ({ id: snapshot.id, ...(snapshot.data() as Omit<T, 'id'>) });
const encodeCursor = (cursor: Cursor): string => btoa(JSON.stringify(cursor));
const decodeCursor = (value: string): Cursor => JSON.parse(atob(value)) as Cursor;

export function createRepository<T extends BaseDocument>(name: string) {
  return {
    async get(id: string) { const snapshot = await getDoc(doc(db, name, id)); return snapshot.exists() ? mapDoc<T>(snapshot) : null; },
    async list(options: ListOptions = {}): Promise<Page<T>> {
      const size = Math.min(Math.max(options.pageSize ?? 20, 1), 50);
      const constraints: QueryConstraint[] = [];
      if (options.active !== undefined) constraints.push(where('active', '==', options.active));
      if (options.subjectId) constraints.push(where('subjectId', '==', options.subjectId));
      if (options.branchId) constraints.push(where('branchId', '==', options.branchId));
      if (options.categoryId) constraints.push(where('categoryId', '==', options.categoryId));
      constraints.push(orderBy('order', 'asc'), orderBy('__name__', 'asc'));
      if (options.cursor) { const cursor = decodeCursor(options.cursor); constraints.push(startAfter(cursor.order, cursor.id)); }
      const snapshot = await getDocs(query(collection(db, name), ...constraints, limit(size)));
      const items = snapshot.docs.map((item) => mapDoc<T>(item));
      const last = snapshot.docs.at(-1); const lastOrder = last?.data().order;
      const nextCursor = last && typeof lastOrder === 'number' ? encodeCursor({ order: lastOrder, id: last.id }) : undefined;
      return { items, nextCursor, hasMore: items.length === size };
    },
    async create(data: Record<string, unknown>): Promise<string> { const result = await addDoc(collection(db, name), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); return result.id; },
    async update(id: string, data: Record<string, unknown>): Promise<void> { await updateDoc(doc(db, name, id), { ...data, updatedAt: serverTimestamp() }); },
    async remove(id: string): Promise<void> { await deleteDoc(doc(db, name, id)); },
  };
}
