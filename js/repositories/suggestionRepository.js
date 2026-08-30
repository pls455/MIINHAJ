import { collection, doc, getDocs, addDoc, updateDoc, query, orderBy, limit, startAfter, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const NAME = 'suggestions';
const clean = value => String(value ?? '').trim();

function validate(input) {
  const data = {
    title: clean(input.title), contentType: input.contentType === 'foundation' ? 'foundation' : 'resource',
    studentName: clean(input.studentName).slice(0, 80), url: clean(input.url),
    branchId: clean(input.branchId), subjectId: clean(input.subjectId),
    level: clean(input.level), foundationType: clean(input.foundationType),
    type: clean(input.type), description: clean(input.description).slice(0, 3000),
    keywords: Array.isArray(input.keywords) ? [...new Set(input.keywords.map(clean).filter(Boolean))].slice(0, 30) : [],
    status: ['pending','approved','rejected','archived'].includes(input.status) ? input.status : 'pending'
  };
  if (!data.title) throw new Error('SUGGESTION_TITLE_REQUIRED');
  if (!/^https?:\/\//i.test(data.url)) throw new Error('SUGGESTION_URL_INVALID');
  if (!data.branchId || !data.subjectId) throw new Error('SUGGESTION_ACADEMIC_CONTEXT_REQUIRED');
  return data;
}

export async function createSuggestion(input) {
  const data = validate(input);
  const ref = await addDoc(collection(db, NAME), { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  return ref.id;
}

export async function getSuggestions({ pageSize = 24, cursor = null, status = null } = {}) {
  const clauses = [];
  if (status) clauses.push(where('status', '==', status));
  clauses.push(orderBy('createdAt', 'desc'));
  if (cursor) clauses.push(startAfter(cursor));
  clauses.push(limit(Math.min(Math.max(Number(pageSize) || 24, 1), 50)));
  const snap = await getDocs(query(collection(db, NAME), ...clauses));
  return { items: snap.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snap.docs.at(-1) || null };
}

export async function updateSuggestionStatus(id, status, note = '') {
  if (!['pending','approved','rejected','archived'].includes(status)) throw new Error('SUGGESTION_STATUS_INVALID');
  await updateDoc(doc(db, NAME, id), { status, reviewNote: clean(note).slice(0, 1000), reviewedAt: serverTimestamp(), updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'update', collectionName: NAME, targetId: id, details: { status } });
}
