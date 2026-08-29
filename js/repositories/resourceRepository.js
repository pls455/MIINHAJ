import { db } from '../services/firebase.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, setDoc, addDoc, updateDoc, deleteDoc, serverTimestamp, getCountFromServer } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 50;
const normalize = (v) => String(v ?? '').trim();
const clamp = (v) => Math.min(Math.max(Number(v) || PAGE_SIZE, 1), MAX_PAGE_SIZE);

function build(name, filters = {}, size = PAGE_SIZE, cursor = null) {
  const w = [];
  if (filters.active !== undefined && filters.active !== null) w.push(where('active', '==', filters.active));
  if (filters.status) w.push(where('status', '==', filters.status));
  if (filters.branchId) w.push(where('branchIds', 'array-contains', filters.branchId));
  if (filters.subjectId) w.push(where('subjectId', '==', filters.subjectId));
  if (filters.categoryId) w.push(where('categoryId', '==', filters.categoryId));
  if (filters.type) w.push(where('type', '==', filters.type));
  if (filters.level) w.push(where('level', '==', filters.level));
  if (filters.keyword) w.push(where('keywords', 'array-contains', normalize(filters.keyword)));
  const search = normalize(filters.search);
  const field = filters.searchField || 'title';
  if (search) w.push(where(field, '>=', search), where(field, '<=', search + '\uf8ff'), orderBy(field));
  else w.push(orderBy(filters.orderField || 'order', filters.sort === 'newest' ? 'desc' : 'asc'));
  if (cursor) w.push(startAfter(cursor));
  w.push(limit(clamp(size)));
  return query(collection(db, name), ...w);
}

export async function getPage(name, filters = {}, size = PAGE_SIZE, cursor = null) {
  const snapshot = await getDocs(build(name, filters, size, cursor));
  return { rows: snapshot.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snapshot.docs.at(-1) || null, hasMore: snapshot.docs.length === clamp(size) };
}
export async function getOne(name, id) { const snapshot = await getDoc(doc(db, name, id)); return snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null; }
export async function getAllSmall(name, size = 100) { const safeSize = Math.min(Math.max(Number(size) || 1, 1), 100); const snapshot = await getDocs(query(collection(db, name), where('active', '==', true), orderBy('order'), limit(safeSize))); return snapshot.docs.map(d => ({ id: d.id, ...d.data() })); }

function validateResource(input) {
  const data = { ...input };
  data.title = normalize(data.title);
  data.url = normalize(data.url);
  data.description = normalize(data.description);
  data.type = normalize(data.type);
  data.categoryId = normalize(data.categoryId);
  data.subjectId = normalize(data.subjectId);
  data.branchIds = Array.isArray(data.branchIds) ? [...new Set(data.branchIds.map(normalize).filter(Boolean))] : [];
  data.keywords = Array.isArray(data.keywords) ? [...new Set(data.keywords.map(normalize).filter(Boolean))] : [];
  data.tags = Array.isArray(data.tags) ? [...new Set(data.tags.map(normalize).filter(Boolean))] : [];
  if (!data.title) throw new Error('RESOURCE_TITLE_REQUIRED');
  if (!data.url) throw new Error('RESOURCE_URL_REQUIRED');
  let parsed;
  try { parsed = new URL(data.url); } catch { throw new Error('RESOURCE_URL_INVALID'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('RESOURCE_URL_PROTOCOL');
  if (!data.branchIds.length) throw new Error('RESOURCE_BRANCH_REQUIRED');
  if (!data.subjectId) throw new Error('RESOURCE_SUBJECT_REQUIRED');
  if (data.order !== undefined && (!Number.isFinite(Number(data.order)) || Number(data.order) < 0)) throw new Error('RESOURCE_ORDER_INVALID');
  data.order = Number.isFinite(Number(data.order)) ? Number(data.order) : 0;
  data.active = data.active !== false;
  return data;
}

async function ensureUniqueUrl(url, exceptId = null) {
  const snapshot = await getDocs(query(collection(db, 'resources'), where('url', '==', url), limit(2)));
  if (snapshot.docs.some(d => d.id !== exceptId)) throw new Error('RESOURCE_URL_DUPLICATE');
}

export async function saveResource(id, input) {
  const data = validateResource(input);
  await ensureUniqueUrl(data.url, id || null);
  if (id) {
    await updateDoc(doc(db, 'resources', id), { ...data, updatedAt: serverTimestamp() });
    await writeAdminLog({ action: 'update', collectionName: 'resources', targetId: id, details: { title: data.title } });
    return id;
  }
  const result = await addDoc(collection(db, 'resources'), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'create', collectionName: 'resources', targetId: result.id, details: { title: data.title, url: data.url } });
  return result.id;
}

export async function removeResource(id) {
  const existing = await getOne('resources', id);
  if (!existing) throw new Error('RESOURCE_NOT_FOUND');
  await deleteDoc(doc(db, 'resources', id));
  await writeAdminLog({ action: 'delete', collectionName: 'resources', targetId: id, details: { title: existing.title || '' } });
}

export async function setResourceActive(id, active) {
  const value = Boolean(active);
  await updateDoc(doc(db, 'resources', id), { active: value, updatedAt: serverTimestamp() });
  await writeAdminLog({ action: value ? 'activate' : 'deactivate', collectionName: 'resources', targetId: id, details: { active: value } });
}

export async function count(name, filters = {}) { return (await getCountFromServer(build(name, filters, 1))).data().count; }

export const resourceRepository = {
  getResources: (filters = {}, size, cursor) => getPage('resources', { active: true, ...filters }, size, cursor),
  getResource: id => getOne('resources', id),
  getResourcesBySubject: (id, size, cursor) => getPage('resources', { active: true, subjectId: id }, size, cursor),
  getResourcesByBranch: (id, size, cursor) => getPage('resources', { active: true, branchId: id }, size, cursor),
  getResourcesByCategory: (id, size, cursor) => getPage('resources', { active: true, categoryId: id }, size, cursor),
  searchResources: (filters = {}, size, cursor) => getPage('resources', { active: true, ...filters }, size, cursor),
  saveResource,
  removeResource,
  setResourceActive,
  validateResource
};

export const repositories = {
  branches: { page: (f, s, c) => getPage('branches', { active: true, ...f }, s, c) },
  subjects: { page: (f, s, c) => getPage('subjects', { active: true, ...f }, s, c) },
  categories: { page: (f, s, c) => getPage('categories', { active: true, ...f }, s, c) },
  resources: resourceRepository,
  foundations: { page: (f, s, c) => getPage('foundations', { active: true, ...f }, s, c) },
  solutions: { page: (f, s, c) => getPage('solutions', { active: true, ...f }, s, c) },
  flashcards: { page: (f, s, c) => getPage('flashcards', { active: true, ...f }, s, c) },
  suggestions: { page: (f, s, c) => getPage('suggestions', f, s, c) },
  reports: { page: (f, s, c) => getPage('problemReports', f, s, c) },
  templates: { page: (f, s, c) => getPage('templates', f, s, c) },
  sourceRegistry: { page: (f, s, c) => getPage('sourceRegistry', f, s, c) }
};
