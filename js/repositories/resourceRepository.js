import { db } from '../services/firebase.js';
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, addDoc, updateDoc, deleteDoc, serverTimestamp, getCountFromServer } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const PAGE_SIZE = 24, MAX_PAGE_SIZE = 50;
const normalize = v => String(v ?? '').trim();
const clamp = v => Math.min(Math.max(Number(v) || PAGE_SIZE, 1), MAX_PAGE_SIZE);

function constraints(f = {}) {
  const w = [];
  if (f.active !== undefined && f.active !== null) w.push(where('active', '==', f.active));
  if (f.status) w.push(where('status', '==', f.status));
  if (f.branchId && !f._localBranchFilter) w.push(where('branchIds', 'array-contains', f.branchId));
  if (f.subjectId) w.push(where('subjectId', '==', f.subjectId));
  if (f.categoryId) w.push(where('categoryId', '==', f.categoryId));
  if (f.type) w.push(where('type', '==', f.type));
  if (f.level) w.push(where('level', '==', f.level));
  if (f.keyword) w.push(where('keywords', 'array-contains', normalize(f.keyword)));
  return w;
}
function build(name, f = {}, size = PAGE_SIZE, cursor = null, ordered = true) {
  const w = constraints(f), search = normalize(f.search), field = f.searchField || 'title';
  if (ordered) {
    if (search) w.push(where(field, '>=', search), where(field, '<=', search + '\uf8ff'), orderBy(field));
    else w.push(orderBy(f.orderField || 'order', f.sort === 'newest' ? 'desc' : 'asc'));
    if (cursor) w.push(startAfter(cursor));
  } else if (search) w.push(where(field, '>=', search), where(field, '<=', search + '\uf8ff'));
  w.push(limit(clamp(size) + 1));
  return query(collection(db, name), ...w);
}
function sortRows(rows, f = {}) {
  const field = f.orderField || 'order', dir = f.sort === 'newest' ? -1 : 1;
  return [...rows].sort((a, b) => { const av = a[field] ?? 0, bv = b[field] ?? 0; if (av < bv) return -1 * dir; if (av > bv) return 1 * dir; return String(a.id).localeCompare(String(b.id)); });
}
async function getSubjectPageWithBranch(f, size) {
  const s = await getDocs(query(collection(db, 'subjects'), where('active', '==', true), limit(100)));
  const branchId = String(f.branchId);
  let rows = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => (Array.isArray(x.branchIds) && x.branchIds.map(String).includes(branchId)) || String(x.branchId ?? '') === branchId);
  const q = normalize(f.search).toLocaleLowerCase('ar');
  if (q) rows = rows.filter(x => `${x.name || ''} ${x.description || ''}`.toLocaleLowerCase('ar').includes(q));
  rows = sortRows(rows, f); const n = clamp(size);
  return { rows: rows.slice(0, n), nextCursor: null, hasMore: false };
}
async function getPageInternal(name, f = {}, size = PAGE_SIZE, cursor = null) {
  const n = clamp(size);
  try {
    const s = await getDocs(build(name, f, n, cursor, true));
    const docs = s.docs, rows = docs.slice(0, n).map(d => ({ id: d.id, ...d.data() }));
    return { rows, nextCursor: docs.length > n ? docs[n - 1] : null, hasMore: docs.length > n };
  } catch (e) {
    console.warn('[repository] fallback query', e);
    const s = await getDocs(build(name, { ...f, _localBranchFilter: true }, n, null, false));
    let rows = s.docs.map(d => ({ id: d.id, ...d.data() }));
    const q = normalize(f.search).toLocaleLowerCase('ar'), field = f.searchField || 'title';
    if (q) rows = rows.filter(x => String(x[field] ?? '').toLocaleLowerCase('ar').includes(q));
    rows = sortRows(rows, f);
    return { rows: rows.slice(0, n), nextCursor: null, hasMore: false };
  }
}
export async function getPage(name, f = {}, size = PAGE_SIZE, cursor = null) {
  if (name === 'subjects' && f.branchId) return getSubjectPageWithBranch(f, size);
  const result = await getPageInternal(name, f, size, cursor);
  if (f.excludeStatuses?.length) { const excluded = new Set(f.excludeStatuses.map(String)); result.rows = result.rows.filter(r => !excluded.has(String(r.status))); result.hasMore = result.hasMore || (result.rows.length > 0 && result.rows.length === clamp(size)); }
  return result;
}
export async function getOne(name, id) { const s = await getDoc(doc(db, name, id)); return s.exists() ? { id: s.id, ...s.data() } : null; }
export async function getAllSmall(name, size = 100) { const n = Math.min(Math.max(Number(size) || 1, 1), 100); try { const s = await getDocs(query(collection(db, name), orderBy('order'), limit(n))); return s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => x.active !== false); } catch { const s = await getDocs(query(collection(db, name), limit(n))); return s.docs.map(d => ({ id: d.id, ...d.data() })).filter(x => x.active !== false).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0)); } }
function validateResource(i) { const d = { ...i }; d.title = normalize(d.title); d.url = normalize(d.url); d.description = normalize(d.description); d.type = normalize(d.type); d.categoryId = normalize(d.categoryId); d.subjectId = normalize(d.subjectId); d.branchIds = Array.isArray(d.branchIds) ? [...new Set(d.branchIds.map(normalize).filter(Boolean))] : []; d.keywords = Array.isArray(d.keywords) ? [...new Set(d.keywords.map(normalize).filter(Boolean))] : []; d.tags = Array.isArray(d.tags) ? [...new Set(d.tags.map(normalize).filter(Boolean))] : []; if (!d.title) throw Error('RESOURCE_TITLE_REQUIRED'); if (!d.url) throw Error('RESOURCE_URL_REQUIRED'); let u; try { u = new URL(d.url); } catch { throw Error('RESOURCE_URL_INVALID'); } if (!['http:', 'https:'].includes(u.protocol)) throw Error('RESOURCE_URL_PROTOCOL'); if (!d.branchIds.length) throw Error('RESOURCE_BRANCH_REQUIRED'); if (!d.subjectId) throw Error('RESOURCE_SUBJECT_REQUIRED'); d.order = Number.isFinite(Number(d.order)) ? Number(d.order) : 0; d.active = d.active !== false; return d; }
async function ensureUniqueUrl(url, exceptId = null) { const s = await getDocs(query(collection(db, 'resources'), where('url', '==', url), limit(2))); if (s.docs.some(d => d.id !== exceptId)) throw Error('RESOURCE_URL_DUPLICATE'); }
export async function saveResource(id, input) { const d = validateResource(input); await ensureUniqueUrl(d.url, id || null); if (id) { await updateDoc(doc(db, 'resources', id), { ...d, updatedAt: serverTimestamp() }); await writeAdminLog({ action: 'update', collectionName: 'resources', targetId: id, details: { title: d.title } }); return id; } const r = await addDoc(collection(db, 'resources'), { ...d, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }); await writeAdminLog({ action: 'create', collectionName: 'resources', targetId: r.id, details: { title: d.title, url: d.url } }); return r.id; }
export async function removeResource(id) { const e = await getOne('resources', id); if (!e) throw Error('RESOURCE_NOT_FOUND'); await deleteDoc(doc(db, 'resources', id)); await writeAdminLog({ action: 'delete', collectionName: 'resources', targetId: id, details: { title: e.title || '' } }); }
export async function setResourceActive(id, active) { const v = Boolean(active); await updateDoc(doc(db, 'resources', id), { active: v, updatedAt: serverTimestamp() }); await writeAdminLog({ action: v ? 'activate' : 'deactivate', collectionName: 'resources', targetId: id, details: { active: v } }); }
export async function count(name, f = {}) { return (await getCountFromServer(query(collection(db, name), ...constraints(f)))).data().count; }
export const save = saveResource, remove = removeResource;
export const resourceRepository = { getResources: (f = {}, s, c) => getPage('resources', { active: true, ...f }, s, c), getResource: id => getOne('resources', id), getResourcesBySubject: (id, s, c) => getPage('resources', { active: true, subjectId: id }, s, c), getResourcesByBranch: (id, s, c) => getPage('resources', { active: true, branchId: id }, s, c), getResourcesByCategory: (id, s, c) => getPage('resources', { active: true, categoryId: id }, s, c), searchResources: (f = {}, s, c) => getPage('resources', { active: true, ...f }, s, c), saveResource, removeResource, setResourceActive, validateResource };
export const repositories = { branches: { page: (f, s, c) => getPage('branches', { active: true, ...f }, s, c) }, subjects: { page: (f, s, c) => getPage('subjects', { active: true, ...f }, s, c) }, categories: { page: (f, s, c) => getPage('categories', { active: true, ...f }, s, c) }, resources: resourceRepository, foundations: { page: (f, s, c) => getPage('foundations', { active: true, ...f }, s, c) }, solutions: { page: (f, s, c) => getPage('solutions', { active: true, ...f }, s, c) }, flashcards: { page: (f, s, c) => getPage('flashcards', { active: true, ...f }, s, c) }, suggestions: { page: (f, s, c) => getPage('suggestions', f, s, c) }, reports: { page: (f, s, c) => getPage('problemReports', f, s, c) }, templates: { page: (f, s, c) => getPage('templates', f, s, c) }, sourceRegistry: { page: (f, s, c) => getPage('sourceRegistry', f, s, c) } };
