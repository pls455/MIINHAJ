import { doc, getDoc, getDocs, collection, query, where, limit, serverTimestamp, setDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db, auth } from '../services/firebase.js';
import { getStudentProfile } from '../services/studentAuth.js';

const NAME = 'adminApplications';
const MAX_ANSWER = 2000;
const clean = value => String(value ?? '').trim();
const QUESTIONS = Object.freeze([
  ['motivation', 'لماذا تريد الانضمام إلى فريق مِنهَاج؟'],
  ['contribution', 'ما الذي تستطيع تقديمه للمنصة؟'],
  ['experience', 'هل لديك خبرة في التعليم أو مراجعة المحتوى أو إدارة المنصات؟ وضّح.'],
  ['area', 'في أي مجال تفضّل المساهمة؟ ولماذا؟'],
  ['quality', 'إذا وجدت معلومة أو مصدرًا خاطئًا في المنصة، ماذا ستفعل؟'],
  ['disagreement', 'إذا اختلفت مع مراجع أو إداري آخر، كيف تتعامل مع الموقف؟'],
  ['commitment', 'كيف تضمن أن المحتوى الذي تراجعه دقيق ومناسب للطلاب؟'],
  ['scenario', 'لو طلب منك نشر محتوى غير موثوق لأنه مستعجل، ماذا ستفعل؟']
]);

function validateAnswers(answers) {
  if (!answers || typeof answers !== 'object') throw Error('ADMIN_APPLICATION_ANSWERS_REQUIRED');
  const cleanAnswers = {};
  for (const [id] of QUESTIONS) {
    const value = clean(answers[id]).slice(0, MAX_ANSWER);
    if (!value) throw Error('ADMIN_APPLICATION_ANSWERS_REQUIRED');
    cleanAnswers[id] = value;
  }
  return cleanAnswers;
}

export function getAdminApplicationQuestions() { return QUESTIONS.map(([id, label]) => ({ id, label })); }

async function currentIdentity() {
  const user = auth.currentUser;
  if (!user) throw Error('STUDENT_LOGIN_REQUIRED');
  const profile = await getStudentProfile(user.uid);
  const identity = clean(profile?.identityNumber);
  if (!identity) throw Error('STUDENT_ID_REQUIRED');
  return { user, profile, identity };
}

export async function getMyAdminApplication() {
  const user = auth.currentUser;
  if (!user) return null;
  const snap = await getDoc(doc(db, NAME, user.uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function submitAdminApplication(answers) {
  const { user, profile, identity } = await currentIdentity();
  const cleanAnswers = validateAnswers(answers);
  const ref = doc(db, NAME, user.uid);
  const existing = await getDoc(ref);
  if (existing.exists()) {
    const status = existing.data()?.status;
    if (status === 'pending') throw Error('ADMIN_APPLICATION_PENDING');
    if (status === 'approved') throw Error('ADMIN_APPLICATION_APPROVED');
  }
  await setDoc(ref, {
    studentUid: user.uid,
    studentEmail: user.email || profile?.email || '',
    studentName: clean(profile?.name || user.displayName || ''),
    studentId: identity,
    answers: cleanAnswers,
    status: 'pending',
    reviewerUid: null,
    reviewerEmail: null,
    reviewerNote: null,
    reviewedAt: null,
    createdAt: existing.exists() ? (existing.data()?.createdAt || serverTimestamp()) : serverTimestamp(),
    updatedAt: serverTimestamp()
  }, { merge: false });
  return user.uid;
}

export async function getAdminApplications({ status = null, pageSize = 50 } = {}) {
  const constraints = [];
  if (status) constraints.push(where('status', '==', status));
  constraints.push(limit(Math.min(Math.max(Number(pageSize) || 50, 1), 100)));
  const snap = await getDocs(query(collection(db, NAME), ...constraints));
  const items = snap.docs.map(item => ({ id: item.id, ...item.data() }));
  items.sort((a, b) => {
    const at = a.createdAt?.toMillis?.() || 0;
    const bt = b.createdAt?.toMillis?.() || 0;
    return bt - at;
  });
  return items;
}
