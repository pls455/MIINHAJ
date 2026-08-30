import { collection, addDoc, getDocs, doc, updateDoc, query, orderBy, limit, startAfter, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

const NAME = 'problemReports';
const clean = value => String(value ?? '').trim();

function validate(input) {
  const data = {
    sourceId: clean(input.sourceId), sourceTitle: clean(input.sourceTitle).slice(0, 200),
    kind: clean(input.kind).slice(0, 100), description: clean(input.description).slice(0, 2000)
  };
  if (!data.description) throw new Error('REPORT_DESCRIPTION_REQUIRED');
  if (!data.kind) throw new Error('REPORT_KIND_REQUIRED');
  return data;
}

export async function createProblemReport(input) {
  const data = validate(input);
  const ref = await addDoc(collection(db, NAME), { ...data, status: 'open', createdAt: serverTimestamp() });
  return ref.id;
}

export async function getProblemReports({ pageSize = 24, cursor = null, status = null } = {}) {
  const clauses = [];
  if (status) clauses.push(where('status', '==', status));
  clauses.push(orderBy('createdAt', 'desc'));
  if (cursor) clauses.push(startAfter(cursor));
  clauses.push(limit(Math.min(Math.max(Number(pageSize) || 24, 1), 50)));
  const snap = await getDocs(query(collection(db, NAME), ...clauses));
  return { items: snap.docs.map(d => ({ id: d.id, ...d.data() })), nextCursor: snap.docs.at(-1) || null };
}

export async function updateProblemReportStatus(id, status, note = '') {
  if (!['open', 'resolved', 'dismissed'].includes(status)) throw new Error('REPORT_STATUS_INVALID');
  await updateDoc(doc(db, NAME, id), { status, adminNote: clean(note).slice(0, 1000), updatedAt: serverTimestamp() });
  await writeAdminLog({ action: 'update', collectionName: NAME, targetId: id, details: { status } });
}
