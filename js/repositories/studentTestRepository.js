import { db } from '../services/firebase.js';
import { auth } from '../services/firebase.js';
import { collection, doc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, limit } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const MAX_QUESTIONS=50, MAX_OPTIONS=8;
const TYPES=new Set(['mcq','true_false','multi_select','ordering']);
const clean=v=>String(v??'').trim();

function question(q,i){
  const type=TYPES.has(q?.type)?q.type:'mcq';
  const text=clean(q?.question); if(!text||text.length>4000)throw Error(`STUDENT_TEST_Q_${i+1}_INVALID`);
  const options=Array.isArray(q?.options)?q.options.map(clean).filter(Boolean).slice(0,MAX_OPTIONS):[];
  if(type==='ordering'){
    const answer=Array.isArray(q?.answer)?q.answer.map(clean).filter(Boolean):[];
    if(options.length<2||answer.length!==options.length||new Set(answer).size!==answer.length||answer.some(x=>!options.includes(x)))throw Error(`STUDENT_TEST_Q_${i+1}_ANSWER_INVALID`);
    return {id:clean(q?.id)||`q${i+1}`,question:text,type,options,answer,explanation:clean(q?.explanation).slice(0,2000),points:Math.max(1,Math.min(100,Number(q?.points)||1))};
  }
  if(type==='true_false'){
    const answer=clean(q?.answer).toLowerCase(); if(!['true','false','صح','خطأ'].includes(answer))throw Error(`STUDENT_TEST_Q_${i+1}_ANSWER_INVALID`);
    return {id:clean(q?.id)||`q${i+1}`,question:text,type,options:['صح','خطأ'],answer,explanation:clean(q?.explanation).slice(0,2000),points:Math.max(1,Math.min(100,Number(q?.points)||1))};
  }
  if(options.length<2)throw Error(`STUDENT_TEST_Q_${i+1}_OPTIONS_REQUIRED`);
  if(type==='multi_select'){
    const answer=Array.isArray(q?.answer)?[...new Set(q.answer.map(clean).filter(Boolean))]:[];
    if(!answer.length||answer.some(x=>!options.includes(x)))throw Error(`STUDENT_TEST_Q_${i+1}_ANSWER_INVALID`);
    return {id:clean(q?.id)||`q${i+1}`,question:text,type,options,answer,explanation:clean(q?.explanation).slice(0,2000),points:Math.max(1,Math.min(100,Number(q?.points)||1))};
  }
  const answer=clean(q?.answer); if(!options.includes(answer))throw Error(`STUDENT_TEST_Q_${i+1}_ANSWER_INVALID`);
  return {id:clean(q?.id)||`q${i+1}`,question:text,type,options,answer,explanation:clean(q?.explanation).slice(0,2000),points:Math.max(1,Math.min(100,Number(q?.points)||1))};
}

export function validateStudentTest(input={}){
  const title=clean(input.title); if(!title||title.length>200)throw Error('STUDENT_TEST_TITLE_INVALID');
  const description=clean(input.description).slice(0,3000);
  const raw=Array.isArray(input.questions)?input.questions:[]; if(!raw.length||raw.length>MAX_QUESTIONS)throw Error('STUDENT_TEST_QUESTIONS_LIMIT');
  const questions=raw.map(question); const ids=new Set(); for(const q of questions){if(ids.has(q.id))throw Error('STUDENT_TEST_QUESTION_ID_DUPLICATE');ids.add(q.id);}
  const branchIds=Array.isArray(input.branchIds)?[...new Set(input.branchIds.map(clean).filter(Boolean))].slice(0,20):[];
  const subjectId=clean(input.subjectId);
  return {title,description,branchIds,subjectId,durationMinutes:Math.max(0,Math.min(300,Number(input.durationMinutes)||0)),passingScore:Math.max(0,Math.min(100,Number(input.passingScore)||0)),randomizeQuestions:input.randomizeQuestions===true,showResults:input.showResults!==false,questions,questionCount:questions.length,active:true};
}
function user(){if(!auth.currentUser)throw Error('AUTH_REQUIRED');return auth.currentUser.uid;}
export async function listMyStudentTests(){const uid=user();const snap=await getDocs(query(collection(db,'studentTests'),where('ownerId','==',uid),orderBy('updatedAt','desc'),limit(100)));return snap.docs.map(d=>({id:d.id,...d.data()}));}
export async function getMyStudentTest(id){const uid=user();const s=await getDoc(doc(db,'studentTests',id));if(!s.exists()||s.data().ownerId!==uid)return null;return{id:s.id,...s.data()};}
export async function createStudentTest(input){const uid=user();const data=validateStudentTest(input);const ref=await addDoc(collection(db,'studentTests'),{...data,ownerId:uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return ref.id;}
export async function updateStudentTest(id,input){const uid=user();const current=await getMyStudentTest(id);if(!current)throw Error('STUDENT_TEST_NOT_FOUND');const data=validateStudentTest(input);await updateDoc(doc(db,'studentTests',id),{...data,ownerId:uid,updatedAt:serverTimestamp()});return id;}
export async function deleteStudentTest(id){const uid=user();const current=await getMyStudentTest(id);if(!current)throw Error('STUDENT_TEST_NOT_FOUND');await deleteDoc(doc(db,'studentTests',id));}
export async function createStudentTestShare(id){const uid=user();const test=await getMyStudentTest(id);if(!test)throw Error('STUDENT_TEST_NOT_FOUND');const data={title:test.title,description:test.description,subjectId:test.subjectId,branchIds:test.branchIds||[],durationMinutes:test.durationMinutes||0,passingScore:test.passingScore||0,randomizeQuestions:test.randomizeQuestions===true,showResults:test.showResults!==false,questions:test.questions,questionCount:test.questions.length,ownerId:uid,createdAt:serverTimestamp(),updatedAt:serverTimestamp()};const existing=await getDocs(query(collection(db,'studentTestShares'),where('ownerId','==',uid),where('sourceTestId','==',id),limit(1)));if(!existing.empty){await updateDoc(doc(db,'studentTestShares',existing.docs[0].id),data);return existing.docs[0].id;}const ref=await addDoc(collection(db,'studentTestShares'),{...data,sourceTestId:id});return ref.id;}
export async function getSharedStudentTest(id){const s=await getDoc(doc(db,'studentTestShares',id));return s.exists()?{id:s.id,...s.data()}:null;}
export const MAX_STUDENT_TEST_QUESTIONS=MAX_QUESTIONS;
