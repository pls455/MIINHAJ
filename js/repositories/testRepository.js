import { db } from '../services/firebase.js';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const MAX_TESTS = 30;
const MAX_QUESTIONS = 100;
const TYPES = new Set(['mcq','true_false','multi_select','ordering']);

function cleanQuestion(q, index) {
  const type = TYPES.has(q?.type) ? q.type : 'mcq';
  const options = Array.isArray(q?.options) ? q.options.map(v => String(v ?? '').trim()).filter(Boolean).slice(0, 8) : [];
  const rawAnswer = q?.answer;
  if (!q?.question) throw new Error(`TEST_QUESTION_${index + 1}_INVALID`);
  if (type === 'ordering') {
    const answer = Array.isArray(rawAnswer) ? rawAnswer.map(v => String(v ?? '').trim()).filter(Boolean) : [];
    if (options.length < 2 || answer.length !== options.length || new Set(answer).size !== answer.length || answer.some(v => !options.includes(v))) throw new Error(`TEST_QUESTION_${index + 1}_ANSWER_INVALID`);
    return { id: String(q.id || `q${index + 1}`), question: String(q.question).trim(), type, options, answer, explanation: String(q.explanation ?? '').trim().slice(0, 2000), points: Math.max(1, Math.min(100, Number(q.points) || 1)) };
  }
  if (!options.length) throw new Error(`TEST_QUESTION_${index + 1}_OPTIONS_REQUIRED`);
  let answer;
  if (type === 'multi_select') {
    answer = Array.isArray(rawAnswer) ? [...new Set(rawAnswer.map(v => String(v ?? '').trim()).filter(Boolean))] : [];
    if (!answer.length || answer.some(v => !options.includes(v))) throw new Error(`TEST_QUESTION_${index + 1}_ANSWER_INVALID`);
  } else {
    answer = String(rawAnswer ?? '').trim();
    if (!answer) throw new Error(`TEST_QUESTION_${index + 1}_INVALID`);
    if (type === 'true_false' && !['true','false','صح','خطأ'].includes(answer.toLowerCase())) throw new Error(`TEST_QUESTION_${index + 1}_ANSWER_INVALID`);
    if (type === 'mcq' && options.length < 2) throw new Error(`TEST_QUESTION_${index + 1}_OPTIONS_REQUIRED`);
    if (type === 'mcq' && !options.includes(answer)) throw new Error(`TEST_QUESTION_${index + 1}_ANSWER_INVALID`);
  }
  return { id: String(q.id || `q${index + 1}`), question: String(q.question).trim(), type, options, answer, explanation: String(q.explanation ?? '').trim().slice(0, 2000), points: Math.max(1, Math.min(100, Number(q.points) || 1)) };
}

export function validateTest(input) {
  const title = String(input?.title ?? '').trim();
  const description = String(input?.description ?? '').trim();
  const questions = Array.isArray(input?.questions) ? input.questions.slice(0, MAX_QUESTIONS).map(cleanQuestion) : [];
  if (!title || title.length > 200) throw new Error('TEST_TITLE_INVALID');
  if (description.length > 3000) throw new Error('TEST_DESCRIPTION_TOO_LONG');
  if (!questions.length) throw new Error('TEST_QUESTIONS_REQUIRED');
  const ids = new Set();
  questions.forEach(q => { if (ids.has(q.id)) throw new Error('TEST_QUESTION_ID_DUPLICATE'); ids.add(q.id); });
  return { title, description, subjectId: String(input?.subjectId ?? '').trim(), branchIds: Array.isArray(input?.branchIds) ? [...new Set(input.branchIds.map(v => String(v).trim()).filter(Boolean))].slice(0, 20) : [], durationMinutes: Math.max(0, Math.min(300, Number(input?.durationMinutes) || 0)), questions, active: input?.active !== false, order: Math.max(0, Number(input?.order) || 0) };
}

export async function getTest(id) {
  if (!id || typeof id !== 'string' || id.length > 128) throw new Error('DOCUMENT_ID_INVALID');
  const snap = await getDoc(doc(db, 'tests', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function getActiveTests() {
  const snap = await getDocs(query(collection(db, 'tests'), where('active', '==', true), limit(MAX_TESTS)));
  return snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));
}
