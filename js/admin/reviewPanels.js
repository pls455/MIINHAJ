import { db } from '../services/firebase.js';
import { collection, getDocs, query, orderBy, limit, updateDoc, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const esc = (v='') => String(v ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const url = v => { try { const u=new URL(String(v||'')); return ['http:','https:'].includes(u.protocol) ? u.href : ''; } catch { return ''; } };
let lastKey='';

function panel(title, subtitle='') {
  return `<div class="section-head"><div><h2>${esc(title)}</h2><p class="muted">${esc(subtitle)}</p></div><button class="button" data-review-refresh>تحديث</button></div><div id="reviewPanelBody"><div class="loading">جارٍ التحميل...</div></div>`;
}
function details(row, fields) {
  return `<details class="review-details"><summary>عرض كل التفاصيل</summary><div class="details-grid">${fields.map(([k,l])=>{const v=row[k]; const text=Array.isArray(v)?v.join(', '):(v??''); const link=k.toLowerCase().includes('url')?url(text):''; return `<div><strong>${esc(l)}</strong>${link?`<a href="${esc(link)}" target="_blank" rel="noopener noreferrer" class="button">فتح الرابط</a>`:`<p>${esc(text||'غير متوفر')}</p>`}</div>`}).join('')}</div></details>`;
}
async function renderSourceRegistry(root){
  root.innerHTML=panel('سجل المصادر','يعرض المصادر التي ما زالت قيد المراجعة فقط. المصادر المنشورة لا تظهر هنا.');
  const body=root.querySelector('#reviewPanelBody');
  try {
    const snap=await getDocs(query(collection(db,'sourceRegistry'),orderBy('createdAt','desc'),limit(200)));
    const rows=snap.docs.map(d=>({id:d.id,...d.data()})).filter(r=>['pending_review','pending'].includes(String(r.status||'')));
    if(!rows.length){body.innerHTML='<div class="empty">لا توجد مصادر بانتظار المراجعة حاليًا.</div>';return;}
    body.innerHTML=rows.map(r=>`<article class="admin-row review-row"><div><b>${esc(r.name||r.title||r.originalTitle||'مصدر بدون عنوان')}</b><small>${esc(r.status||'pending_review')} · ${esc(r.provider||'')}</small>${details(r,[['name','العنوان'],['url','الرابط'],['originalTitle','العنوان الأصلي'],['path','المسار'],['mimeType','نوع الملف'],['branchIds','معرّفات الفروع'],['subjectId','معرّف المادة'],['categoryId','معرّف التصنيف'],['sourceId','معرّف المصدر'],['createdByEmail','أضيف بواسطة']])}</div><div class="row-actions"><button class="button" data-source-edit="${esc(r.id)}">تعديل</button><button class="button primary" data-source-approve="${esc(r.id)}">اعتماد ونشر</button><button class="button danger" data-source-reject="${esc(r.id)}">رفض</button><button class="button danger" data-source-delete="${esc(r.id)}">حذف</button></div></article>`).join('');
  } catch(e){console.error('[reviewPanels.sourceRegistry]',e);body.innerHTML='<div class="error-box">تعذر تحميل سجل المراجعة. تحقق من الصلاحيات والاتصال.</div>';}
}
async function renderSuggestions(root){
  root.innerHTML=panel('إدارة الاقتراحات','راجع الاقتراحات مع كامل تفاصيلها وروابطها، ثم غيّر حالتها أو احذفها.');
  const body=root.querySelector('#reviewPanelBody');
  try { const snap=await getDocs(query(collection(db,'suggestions'),orderBy('createdAt','desc'),limit(200))); const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    body.innerHTML=rows.length?rows.map(r=>`<article class="admin-row review-row"><div><b>${esc(r.title||'اقتراح بدون عنوان')}</b><small>الحالة: ${esc(r.status||'غير محددة')}</small>${details(r,[['title','العنوان'],['url','الرابط'],['description','الوصف'],['contentType','نوع المحتوى'],['studentName','اسم الطالب'],['branchId','معرّف الفرع'],['subjectId','معرّف المادة'],['level','المستوى'],['foundationType','نوع التأسيس'],['keywords','الكلمات المفتاحية'],['status','الحالة'],['createdAt','تاريخ الإضافة']])}</div><div class="row-actions"><button class="button" data-suggestion-status="${esc(r.id)}" data-next="${r.status==='pending'?'approved':'pending'}">${r.status==='pending'?'اعتماد':'إعادة للمراجعة'}</button><button class="button danger" data-suggestion-delete="${esc(r.id)}">حذف</button></div></article>`).join(''):'<div class="empty">لا توجد اقتراحات.</div>';
  } catch(e){console.error('[reviewPanels.suggestions]',e);body.innerHTML='<div class="error-box">تعذر تحميل الاقتراحات.</div>';}
}
async function renderReports(root){
  root.innerHTML=panel('إدارة البلاغات','راجع البلاغات، افتح الرابط المتعلق بها، ثم علّم البلاغ كمحلول أو احذفه.');
  const body=root.querySelector('#reviewPanelBody');
  try { const snap=await getDocs(query(collection(db,'problemReports'),orderBy('createdAt','desc'),limit(200))); const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
    body.innerHTML=rows.length?rows.map(r=>{const sourceUrl=r.sourceUrl||r.url||''; return `<article class="admin-row review-row"><div><b>${esc(r.sourceTitle||'بلاغ بدون مصدر')}</b><small>الحالة: ${esc(r.status||'open')} · ${esc(r.kind||'')}</small>${sourceUrl?`<a href="${esc(url(sourceUrl))}" target="_blank" rel="noopener noreferrer" class="button">فتح رابط المصدر</a>`:''}${details({...r,sourceUrl},[['sourceTitle','عنوان المصدر'],['sourceUrl','رابط المصدر'],['sourceId','معرّف المصدر'],['kind','نوع البلاغ'],['description','وصف البلاغ'],['status','الحالة'],['adminNote','ملاحظة الإدارة'],['createdAt','تاريخ البلاغ']])}</div><div class="row-actions"><button class="button primary" data-report-resolve="${esc(r.id)}">${r.status==='resolved'?'إعادة فتح':'تم الحل'}</button><button class="button danger" data-report-delete="${esc(r.id)}">حذف</button></div></article>`}).join(''):'<div class="empty">لا توجد بلاغات.</div>';
  } catch(e){console.error('[reviewPanels.reports]',e);body.innerHTML='<div class="error-box">تعذر تحميل البلاغات.</div>';}
}
async function action(e){const b=e.target.closest('button');if(!b)return;const root=document.getElementById('adminContent');try{
  if(b.dataset.reviewRefresh){return mount(root);}
  if(b.dataset.sourceDelete){if(!confirm('هل تريد حذف المصدر من سجل المراجعة؟'))return;await deleteDoc(doc(db,'sourceRegistry',b.dataset.sourceDelete));return renderSourceRegistry(root);}
  if(b.dataset.sourceReject){await updateDoc(doc(db,'sourceRegistry',b.dataset.sourceReject),{status:'rejected',needsReview:false,active:false,updatedAt:serverTimestamp()});return renderSourceRegistry(root);}
  if(b.dataset.sourceApprove){const {updateStatus}=await import('./audit.js');await updateStatus('sourceRegistry',b.dataset.sourceApprove,'approved',window.__minhajAdmin);return renderSourceRegistry(root);}
  if(b.dataset.suggestionDelete){if(!confirm('هل تريد حذف هذا الاقتراح؟'))return;await deleteDoc(doc(db,'suggestions',b.dataset.suggestionDelete));return renderSuggestions(root);}
  if(b.dataset.suggestionStatus){await updateDoc(doc(db,'suggestions',b.dataset.suggestionStatus),{status:b.dataset.next,reviewedAt:serverTimestamp(),reviewedBy:window.__minhajAdmin?.uid||'',updatedAt:serverTimestamp()});return renderSuggestions(root);}
  if(b.dataset.reportDelete){if(!confirm('هل تريد حذف هذا البلاغ؟'))return;await deleteDoc(doc(db,'problemReports',b.dataset.reportDelete));return renderReports(root);}
  if(b.dataset.reportResolve){const id=b.dataset.reportResolve;const current=b.textContent.trim()==='تم الحل';await updateDoc(doc(db,'problemReports',id),{status:current?'resolved':'open',adminNote:current?'تمت معالجة البلاغ من لوحة الإدارة.':'أعيد فتح البلاغ.',updatedAt:serverTimestamp()});return renderReports(root);}
} catch(err){console.error('[reviewPanels.action]',err);alert(err?.message||'تعذر تنفيذ العملية.');}}
async function mount(root){const h=root.querySelector('h2')?.textContent?.trim()||'';const key=h; if(key===lastKey&&root.querySelector('#reviewPanelBody'))return;lastKey=key;if(h==='سجل المصادر')await renderSourceRegistry(root);else if(h==='الاقتراحات')await renderSuggestions(root);else if(h==='البلاغات')await renderReports(root);}
const observer=new MutationObserver(()=>{const root=document.getElementById('adminContent');if(!root)return;const h=root.querySelector('h2')?.textContent?.trim()||'';if(['سجل المصادر','الاقتراحات','البلاغات'].includes(h))mount(root);});
observer.observe(document.body,{subtree:true,childList:true});
document.addEventListener('click',action);
window.__minhajReviewPanels={refresh:()=>{lastKey='';const r=document.getElementById('adminContent');if(r)mount(r)}};
