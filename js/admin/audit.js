import { getDoc, getDocs, doc, query, where, limit, collection, addDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

export async function logAction(admin, action, targetCollection, targetId, details = '') {
  const previous = { uid: admin?.uid || '', email: admin?.email || '' };
  try {
    await writeAdminLog({action,collectionName:targetCollection,targetId,details:{message:String(details||''),actorUid:previous.uid,actorEmail:previous.email}});
  } catch(error){console.error('[adminLogs]',error);throw error;}
}

async function refId(collectionName,value){const s=String(value??'').trim();if(!s)return'';const snap=await getDocs(query(collection(db,collectionName),limit(2000)));const rows=snap.docs.map(d=>({id:d.id,...d.data()}));return rows.find(x=>String(x.id)===s)?.id||rows.find(x=>String(x.stableId||'')===s)?.id||rows.find(x=>String(x.name||'').trim()===s)?.id||'';}
async function normalizeRegistry(current,id){const rawBranches=Array.isArray(current.branchIds)?current.branchIds:(current.branchId?[current.branchId]:[]);const branchIds=[...new Set((await Promise.all(rawBranches.map(v=>refId('branches',v)))).filter(Boolean))];const subjectId=await refId('subjects',current.subjectId||current.subject||current.subjectStableId||'');const categoryId=await refId('categories',current.categoryId||current.category||current.categoryStableId||'');return{branchIds,subjectId,categoryId,sourceId:current.sourceId||current.id||id};}

export async function updateStatus(collectionName,id,status,admin){const ref=doc(db,collectionName,id);const snap=await getDoc(ref);if(!snap.exists())throw Error('العنصر المطلوب غير موجود.');const current=snap.data();
  if(collectionName==='sourceRegistry'){
    if(!['pending_review','approved','rejected'].includes(status))throw Error('حالة المراجعة غير صالحة.');
    if(status==='approved'){
      const normalized=await normalizeRegistry(current,id);const url=String(current.url||current.sourceUrl||current.link||'').trim();const name=String(current.name||current.title||current.originalTitle||'').trim();const existing=url?await getDocs(query(collection(db,'resources'),where('url','==',url),limit(1))):{empty:true};
      if(!url||!name||!normalized.subjectId||!normalized.branchIds.length)throw Error('لا يمكن اعتماد المصدر قبل اكتمال العنوان والرابط والفرع والمادة. افتح التعديل وأكمل البيانات المطلوبة.');
      if(!existing.empty)throw Error('هذا المصدر موجود مسبقًا ضمن المصادر المنشورة.');
      const published=await addDoc(collection(db,'resources'),{title:name,url,description:current.description||'',type:current.type||current.mimeType||'resource',subjectId:normalized.subjectId,categoryId:normalized.categoryId||'',branchIds:normalized.branchIds,keywords:Array.isArray(current.keywords)?current.keywords:[],tags:Array.isArray(current.tags)?current.tags:[],author:current.author||'',order:Number(current.order)||0,active:true,sourceId:normalized.sourceId,provider:current.provider||'google_drive',createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
      await updateDoc(ref,{name,title:name,url,branchIds:normalized.branchIds,subjectId:normalized.subjectId,categoryId:normalized.categoryId||'',status:'published',needsReview:false,active:false,publishedResourceId:published.id,publishedAt:serverTimestamp(),updatedAt:serverTimestamp()});
      await logAction(admin,'publish',collectionName,id,`نشر المصدر ${published.id}`);return;
    }
    await updateDoc(ref,{status,needsReview:status==='pending_review',active:false,updatedAt:serverTimestamp()});await logAction(admin,`status:${status}`,collectionName,id,status);return;
  }
  await updateDoc(ref,{status,updatedAt:serverTimestamp()});await logAction(admin,`status:${status}`,collectionName,id,status);
}
