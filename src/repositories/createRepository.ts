import { addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, limit, orderBy, query, serverTimestamp, startAfter, updateDoc, where, type DocumentData, type QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';
import type { BaseDocument, ListOptions, Page } from '../types';
import { normalizeArabicSearch } from '../utils/arabicSearch';

interface Cursor { value: string; id: string }
const mapDoc = <T extends BaseDocument>(snapshot: { id: string; data: () => DocumentData }): T => ({ id: snapshot.id, ...(snapshot.data() as Omit<T, 'id'>) });
const encodeCursor = (cursor: Cursor): string => btoa(JSON.stringify(cursor));
const decodeCursor = (value: string): Cursor => JSON.parse(atob(value)) as Cursor;

function searchableText(data: Record<string, unknown>): string {
  for (const key of ['title', 'name', 'question']) {
    if (typeof data[key] === 'string') return normalizeArabicSearch(data[key]);
  }
  return '';
}

export function createRepository<T extends BaseDocument>(name: string) {
  return {
    async get(id: string) { const snapshot = await getDoc(doc(db, name, id)); return snapshot.exists() ? mapDoc<T>(snapshot) : null; },
    async count(options: Pick<ListOptions, 'active'|'branchId'|'subjectId'|'categoryId'> = {}): Promise<number> {
      const constraints: QueryConstraint[] = [];
      if (options.active !== undefined) constraints.push(where('active', '==', options.active));
      if (options.subjectId) constraints.push(where('subjectId', '==', options.subjectId));
      if (options.branchId) constraints.push(where('branchId', '==', options.branchId));
      if (options.categoryId) constraints.push(where('categoryId', '==', options.categoryId));
      return (await getCountFromServer(query(collection(db, name), ...constraints))).data().count;
    },
    async list(options: ListOptions = {}): Promise<Page<T>> {
      const size = Math.min(Math.max(options.pageSize ?? 20, 1), 50);
      const constraints: QueryConstraint[] = [];
      if (options.active !== undefined) constraints.push(where('active', '==', options.active));
      if (options.subjectId) constraints.push(where('subjectId', '==', options.subjectId));
      if (options.branchId) constraints.push(where('branchId', '==', options.branchId));
      if (options.categoryId) constraints.push(where('categoryId', '==', options.categoryId));
      const search = options.search ? normalizeArabicSearch(options.search) : '';
      if (search) {
        constraints.push(where('searchNormalized', '>=', search), where('searchNormalized', '<=', `${search}\uf8ff`), orderBy('searchNormalized', 'asc'), orderBy('__name__', 'asc'));
        if (options.cursor) { const cursor = decodeCursor(options.cursor); constraints.push(startAfter(cursor.value, cursor.id)); }
      } else {
        constraints.push(orderBy('order', 'asc'), orderBy('__name__', 'asc'));
        if (options.cursor) { const cursor = decodeCursor(options.cursor); constraints.push(startAfter(cursor.value, cursor.id)); }
      }
      const snapshot = await getDocs(query(collection(db, name), ...constraints, limit(size)));
      const items = snapshot.docs.map((item) => mapDoc<T>(item));
      const last = snapshot.docs.at(-1);
      const lastValue = search ? String(last?.data().searchNormalized ?? '') : String(last?.data().order ?? '');
      const nextCursor = last ? encodeCursor({ value: lastValue, id: last.id }) : undefined;
      return { items, nextCursor, hasMore: items.length === size };
    },
    async create(data: Record<string, unknown>): Promise<string> { const payload = { ...data, searchNormalized: searchableText(data), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }; const result = await addDoc(collection(db, name), payload); return result.id; },
    async update(id: string, data: Record<string, unknown>): Promise<void> { await updateDoc(doc(db, name, id), { ...data, ...(searchableText(data) ? { searchNormalized: searchableText(data) } : {}), updatedAt: serverTimestamp() }); },
    async remove(id: string): Promise<void> { await deleteDoc(doc(db, name, id)); },
  };
}
