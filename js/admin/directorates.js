import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { renderNavbar, renderFooter } from '../components/layout.js';
import { escapeHtml, setBusy } from '../core/utils.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

await requireAdmin(ROLES.CONTENT_ADMIN);
renderNavbar(); renderFooter();
const $=id=>document.getElementById(id);
let rows=[];
const clean=v=>String(v??'').trim();
const normalize=v=>clean(v).toLocaleLowerCase('ar');
const fields=['name','code','governorate','area','manager','phone','email','address','notes'];

function errorText(e){const key=e?.message||e?.code||'';return ({DIRECTORATE_NAME_REQUIRED:'اسم المديرية مطلوب',DIRECTORATE_DUPLICATE:'هذه المديرية موجودة مسبقًا',DIRECTORATE_CODE_DUPLICATE:'كود المديرية مستخدم مسبقًا',DIRECTORATE_HAS_SCHOOLS:'لا يمكن حذف مديرية مرتبطة بمدارس',PERMISSION_DENIED:'ليس لديك صلاحية'}[key]||'تعذر تنفيذ العملية.').toString()}
function resetForm(){ $('directorate-id').value=''; fields.forEach(k=>{if($("directorate-"+k))$("directorate-"+k).value=''}); $('directorate-active').checked=true; $('directorate-form-title').textContent='إضافة مديرية'; $('directorate-error').textContent=''; }
function openForm(item=null){
  resetForm();
  if(item){ $('directorate-id').value=item.id; fields.forEach(k=>{if($("directorate-"+k))$("directorate-"+k).value=item[k]||''}); $('directorate-active').checked=item.active!==false; $('directorate-form-title').textContent='تعديل المديرية'; }
  $('directorate-modal').showModal(); $('directorate-name').focus();
}
function closeForm(){if($('directorate-modal').open)$('directorate-modal').close()}
async function load(){
  const root=$('directorate-list'); root.innerHTML='<div class="loading">جاري تحميل المديريات...</div>';
  const snap=await getDocs(collection(db,'directorates'));
  rows=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>normalize(a.name).localeCompare(normalize(b.name),'ar'));
  render();
}
function render(){
  const q=normalize($('directorate-search').value); const root=$('directorate-list'); root.replaceChildren();
  const filtered=rows.filter(x=>!q||[x.name,x.code,x.governorate,x.area,x.manager].some(v=>normalize(v).includes(q)));
  if(!filtered.length){root.innerHTML='<div class="empty">لا توجد مديريات مطابقة.</div>';return;}
  for(const item of filtered){
    const row=document.createElement('article'); row.className='card admin-row';
    const info=document.createElement('div');
    info.innerHTML=`<b>${escapeHtml(item.name||'بدون اسم')}</b><small>${escapeHtml([item.code,item.governorate,item.area].filter(Boolean).join(' • '))}</small><small>${escapeHtml(item.manager?`مدير المديرية: ${item.manager}`:'لم يحدد مدير المديرية')}</small>`;
    const actions=document.createElement('div'); actions.className='row-actions';
    const edit=document.createElement('button'); edit.className='button'; edit.type='button'; edit.textContent='تعديل'; edit.onclick=()=>openForm(item);
    const del=document.createElement('button'); del.className='button danger'; del.type='button'; del.textContent='حذف'; del.onclick=()=>remove(item);
    actions.append(edit,del); row.append(info,actions); root.append(row);
  }
}
async function remove(item){
  if(!confirm(`حذف مديرية «${item.name||''}»؟`))return;
  const schools=await getDocs(collection(db,'schools'));
  if(schools.docs.some(d=>d.data().directorateId===item.id)){alert(errorText({message:'DIRECTORATE_HAS_SCHOOLS'}));return;}
  try{await deleteDoc(doc(db,'directorates',item.id));try{await writeAdminLog({action:'delete',collectionName:'directorates',targetId:item.id,details:{name:item.name}})}catch(e){console.warn('[directorates.log]',e)}await load();}
  catch(e){console.error('[directorates.delete]',e);alert(errorText(e));}
}
$('add-directorate').onclick=()=>openForm(); $('close-directorate').onclick=closeForm; $('cancel-directorate').onclick=closeForm; $('directorate-search').oninput=render;
$('directorate-form').onsubmit=async e=>{
  e.preventDefault(); const button=e.submitter; setBusy(button,true,'جاري الحفظ...'); $('directorate-error').textContent='';
  try{
    const id=clean($('directorate-id').value)||null;
    const data={}; fields.forEach(k=>data[k]=clean($("directorate-"+k)?.value)); data.active=$('directorate-active').checked;
    if(!data.name)throw new Error('DIRECTORATE_NAME_REQUIRED');
    const sameName=rows.some(x=>x.id!==id&&normalize(x.name)===normalize(data.name)); if(sameName)throw new Error('DIRECTORATE_DUPLICATE');
    const sameCode=data.code&&rows.some(x=>x.id!==id&&normalize(x.code)===normalize(data.code)); if(sameCode)throw new Error('DIRECTORATE_CODE_DUPLICATE');
    if(id){await updateDoc(doc(db,'directorates',id),{...data,updatedAt:serverTimestamp()});try{await writeAdminLog({action:'update',collectionName:'directorates',targetId:id,details:{name:data.name}})}catch(e){console.warn('[directorates.log]',e)}}
    else{const result=await addDoc(collection(db,'directorates'),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});try{await writeAdminLog({action:'create',collectionName:'directorates',targetId:result.id,details:{name:data.name}})}catch(e){console.warn('[directorates.log]',e)}}
    closeForm(); await load();
  }catch(err){console.error('[directorates.save]',err);$('directorate-error').textContent=errorText(err)}finally{setBusy(button,false)}
};
load().catch(e=>{$('directorate-list').innerHTML=`<div class="error-box">${escapeHtml(errorText(e))}</div>`});
