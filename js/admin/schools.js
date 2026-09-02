import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { renderNavbar, renderFooter } from '../components/layout.js';
import { escapeHtml, setBusy } from '../core/utils.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

await requireAdmin(ROLES.CONTENT_ADMIN);
renderNavbar(); renderFooter();
const $=id=>document.getElementById(id);
let schools=[],directorates=[];
const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLocaleLowerCase('ar');

function errorText(e){const key=e?.message||e?.code||'';return ({SCHOOL_NAME_REQUIRED:'اسم المدرسة مطلوب',SCHOOL_CODE_REQUIRED:'رقم / كود المدرسة مطلوب',SCHOOL_DIRECTORATE_REQUIRED:'اختر المديرية',SCHOOL_DUPLICATE_CODE:'رقم / كود المدرسة مستخدم مسبقًا',DIRECTORATE_NOT_FOUND:'المديرية غير موجودة',PERMISSION_DENIED:'ليس لديك صلاحية'}[key]||'تعذر تنفيذ العملية.').toString()}
async function loadData(){
  const [schoolSnap,directorateSnap]=await Promise.all([getDocs(collection(db,'schools')),getDocs(collection(db,'directorates'))]);
  schools=schoolSnap.docs.map(d=>({id:d.id,...d.data()}));
  directorates=directorateSnap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>norm(a.name).localeCompare(norm(b.name),'ar'));
  fillDirectorates(); render();
}
function fillDirectorates(){
  const filter=$('school-directorate'), form=$('school-directorate-id'); filter.innerHTML='<option value="">كل المديريات</option>'; form.innerHTML='<option value="">اختر المديرية</option>';
  directorates.forEach(d=>{const a=document.createElement('option');a.value=d.id;a.textContent=d.name;filter.append(a);const b=a.cloneNode(true);form.append(b)});
}
function syncDirectorate(){
  const d=directorates.find(x=>x.id===$('school-directorate-id').value); if(!d)return;
  $('school-directorate-name').value=d.name||''; $('school-governorate-name').value=d.governorate||''; $('school-area').value=d.area||'';
}
function resetForm(){['school-id','school-name','school-code','school-directorate-name','school-governorate-name','school-area','school-stages','school-manager','school-phone','school-email','school-address','school-notes'].forEach(id=>$(id).value='');$('school-directorate-id').value='';$('school-type').value='حكومية';$('school-gender').value='ذكور';$('school-active').checked=true;$('school-error').textContent='';$('school-form-title').textContent='إضافة مدرسة';}
function openForm(item=null){
  resetForm();
  if(item){$('school-id').value=item.id;['name','code','directorate-name','governorate-name','area','stages','manager','phone','email','address','notes'].forEach(k=>$("school-"+k).value=item[k]||'');$('school-directorate-id').value=item.directorateId||'';$('school-type').value=item.type||'حكومية';$('school-gender').value=item.gender||'ذكور';$('school-active').checked=item.active!==false;$('school-form-title').textContent='تعديل المدرسة';}
  syncDirectorate(); $('school-modal').showModal(); $('school-name').focus();
}
function closeForm(){if($('school-modal').open)$('school-modal').close()}
function render(){
  const q=norm($('school-search').value),d=$('school-directorate').value,g=$('school-governorate').value,root=$('school-list');root.replaceChildren();
  const filtered=schools.filter(x=>(!d||x.directorateId===d)&&(!g||x.governorateName===g)&&(!q||[x.name,x.code,x.manager,x.directorateName,x.governorateName,x.area].some(v=>norm(v).includes(q)))).sort((a,b)=>norm(a.name).localeCompare(norm(b.name),'ar'));
  if(!filtered.length){root.innerHTML='<div class="empty">لا توجد مدارس مطابقة.</div>';return;}
  for(const item of filtered){const row=document.createElement('article');row.className='card admin-row';const info=document.createElement('div');info.innerHTML=`<b>${escapeHtml(item.name||'بدون اسم')}</b><small><strong>رقم المدرسة:</strong> ${escapeHtml(item.code||'غير محدد')} • ${escapeHtml(item.type||'')} • ${escapeHtml(item.gender||'')}</small><small><strong>المديرية:</strong> ${escapeHtml(item.directorateName||'غير محددة')} • <strong>المحافظة:</strong> ${escapeHtml(item.governorateName||'')} • <strong>المنطقة:</strong> ${escapeHtml(item.area||'')}</small><small>${escapeHtml(item.manager?`المدير: ${item.manager}`:'لم يحدد مدير المدرسة')} ${item.active===false?'• غير نشطة':'• نشطة'}</small>`;const actions=document.createElement('div');actions.className='row-actions';const edit=document.createElement('button');edit.className='button';edit.type='button';edit.textContent='تعديل';edit.onclick=()=>openForm(item);const del=document.createElement('button');del.className='button danger';del.type='button';del.textContent='حذف';del.onclick=()=>remove(item);actions.append(edit,del);row.append(info,actions);root.append(row)}
}
async function remove(item){if(!confirm(`حذف مدرسة «${item.name||''}»؟`))return;try{await deleteDoc(doc(db,'schools',item.id));try{await writeAdminLog({action:'delete',collectionName:'schools',targetId:item.id,details:{name:item.name,code:item.code}})}catch(e){console.warn('[schools.log]',e)}await loadData()}catch(e){console.error('[schools.delete]',e);alert(errorText(e))}}
$('add-school').onclick=()=>openForm();$('close-school').onclick=closeForm;$('cancel-school').onclick=closeForm;$('school-directorate-id').onchange=syncDirectorate;$('school-search').oninput=render;$('school-directorate').onchange=render;$('school-governorate').onchange=render;
$('school-form').onsubmit=async e=>{e.preventDefault();const button=e.submitter;setBusy(button,true,'جاري الحفظ...');$('school-error').textContent='';try{
  const id=clean($('school-id').value)||null,name=clean($('school-name').value),code=clean($('school-code').value),directorateId=$('school-directorate-id').value,d=directorates.find(x=>x.id===directorateId);
  if(!name)throw new Error('SCHOOL_NAME_REQUIRED');if(!code)throw new Error('SCHOOL_CODE_REQUIRED');if(!d)throw new Error('SCHOOL_DIRECTORATE_REQUIRED');
  if(schools.some(x=>x.id!==id&&norm(x.code)===norm(code)))throw new Error('SCHOOL_DUPLICATE_CODE');
  const data={name,code,directorateId,directorateName:d.name||'',governorateName:d.governorate||'',area:d.area||'',type:$('school-type').value,gender:$('school-gender').value,stages:clean($('school-stages').value),manager:clean($('school-manager').value),phone:clean($('school-phone').value),email:clean($('school-email').value),address:clean($('school-address').value),notes:clean($('school-notes').value),active:$('school-active').checked};
  if(id){await updateDoc(doc(db,'schools',id),{...data,updatedAt:serverTimestamp()});try{await writeAdminLog({action:'update',collectionName:'schools',targetId:id,details:{name,code}})}catch(e){console.warn('[schools.log]',e)}}else{const result=await addDoc(collection(db,'schools'),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});try{await writeAdminLog({action:'create',collectionName:'schools',targetId:result.id,details:{name,code}})}catch(e){console.warn('[schools.log]',e)}}
  closeForm();await loadData();
}catch(err){console.error('[schools.save]',err);$('school-error').textContent=errorText(err)}finally{setBusy(button,false)}};
loadData().catch(e=>{$('school-list').innerHTML=`<div class="error-box">${escapeHtml(errorText(e))}</div>`});
