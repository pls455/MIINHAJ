import { getAllSmall, getOne, resourceRepository } from '../repositories/resourceRepository.js';
import { db } from '../services/firebase.js';
import { currentAdmin, hasRole } from '../services/firebase/adminCore.js';
import { firebaseConfig } from '../config/firebaseConfig.js';
import { configs } from './data.js';
import { collection, doc, addDoc, updateDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const $ = (id) => document.getElementById(id);
const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
let activeCollection = 'branches';

async function options(name) {
  try { return await getAllSmall(name, 100, true); } catch { return []; }
}

function textField(key, type, value) {
  const label = ({name:'الاسم',stableId:'المعرّف الثابت',description:'الوصف',icon:'الأيقونة',order:'الترتيب',title:'العنوان',url:'الرابط',type:'النوع',author:'المؤلف',level:'المستوى',category:'التصنيف',categoryName:'اسم التصنيف',problem:'المشكلة',solution:'الحل',steps:'الخطوات',notes:'الملاحظات',keywords:'الكلمات المفتاحية',tags:'الوسوم',status:'الحالة',sourceId:'معرّف المصدر',path:'المسار',mimeType:'نوع الملف',contentType:'نوع المحتوى',provider:'المزوّد',createdByEmail:'بريد المنشئ',publishedResourceId:'معرّف المصدر المنشور',reviewedBy:'المراجع',reviewerNote:'ملاحظة المراجع',foundationType:'نوع التأسيس',question:'السؤال',answer:'الإجابة',explanation:'الشرح',email:'البريد الإلكتروني',role:'الدور',target:'الهدف',fields:'الحقول',instructions:'التعليمات',sourceTitle:'عنوان المصدر',sourceUrl:'رابط المصدر',kind:'النوع',createdBy:'المنشئ',studentName:'اسم الطالب',adminNote:'ملاحظة المشرف',needsReview:'بحاجة لمراجعة'})[key] || key;
  const v = Array.isArray(value) ? value.join(', ') : (value ?? '');
  if (type === 'checkbox') return `<label class="check"><input name="${esc(key)}" type="checkbox" ${value ? 'checked' : ''}> ${esc(label)}</label>`;
  if (type === 'textarea') return `<label>${esc(label)}<textarea name="${esc(key)}">${esc(v)}</textarea></label>`;
  return `<label>${esc(label)}<input name="${esc(key)}" type="${type === 'url' || type === 'email' ? type : 'text'}" value="${esc(v)}"></label>`;
}

function selectField(key, label, items, value, multiple=false) {
  const selected = new Set((multiple ? (Array.isArray(value) ? value : String(value||'').split(',').map(x=>x.trim()).filter(Boolean)) : [value]).map(String));
  return `<label>${esc(label)}<select name="${esc(key)}" ${multiple ? 'multiple size="6"' : ''}>${multiple?'': '<option value="">غير محدد</option>'}${items.map(x=>`<option value="${esc(x.id)}" ${selected.has(String(x.id))?'selected':''}>${esc(x.name || x.title || x.id)}${x.active===false?' (غير نشط)':''}</option>`).join('')}</select></label>`;
}

async function buildFields(collectionName, row) {
  const cfg = configs[collectionName];
  if (!cfg) return '';
  const [branches, subjects, categories] = await Promise.all([options('branches'),options('subjects'),options('categories')]);
  const resources = collectionName==='sourceRegistry' ? await options('resources') : [];
  let html = '';
  for (const [key,type] of Object.entries(cfg.fields)) {
    if (key === 'branchIds') html += selectField(key, 'الفروع', branches, row[key], true);
    else if (key === 'branchId') html += selectField(key, 'الفرع', branches, row[key], false);
    else if (key === 'subjectId') html += selectField(key, 'المادة', subjects, row[key], false);
    else if (key === 'categoryId') html += selectField(key, 'التصنيف', categories, row[key], false);
    else if (key === 'sourceId' && collectionName==='sourceRegistry') html += selectField(key, 'المصدر', resources, row[key], false);
    else if (collectionName==='admins' && key==='role') html += `<label>الصلاحية<select name="role"><option value="reviewer" ${row.role==='reviewer'?'selected':''}>مراجع</option><option value="content_admin" ${row.role==='content_admin'?'selected':''}>مدير محتوى</option><option value="super_admin" ${['super_admin','superadmin'].includes(row.role)?'selected':''}>مدير النظام</option></select></label>`;
    else html += textField(key,type,row[key]);
  }
  if(collectionName==='admins' && !row.id) html += `<label>كلمة المرور<input name="password" type="password" minlength="6" autocomplete="new-password" required placeholder="6 أحرف على الأقل"></label>`;
  return html;
}

function payload(form, collectionName) {
  const cfg = configs[collectionName], out = {};
  for (const [key,type] of Object.entries(cfg.fields)) {
    const el = form.elements[key]; if (!el) continue;
    if (type === 'checkbox') out[key] = el.checked;
    else if (type === 'number') out[key] = Math.max(0, Number(el.value) || 0);
    else if (el.multiple) out[key] = [...el.selectedOptions].map(o=>o.value).filter(Boolean);
    else if (type === 'ids') out[key] = el.value.split(',').map(x=>x.trim()).filter(Boolean);
    else out[key] = el.value.trim();
  }
  if(collectionName==='admins' && form.elements.password) out.password=form.elements.password.value;
  return out;
}

async function createFirebaseUser(email,password){
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(firebaseConfig.apiKey)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:false})});
  const d=await r.json().catch(()=>({}));
  if(!r.ok){const code=d?.error?.message||'';const map={EMAIL_EXISTS:'البريد مستخدم مسبقًا.',INVALID_EMAIL:'البريد الإلكتروني غير صالح.',WEAK_PASSWORD:'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.'};throw Error(map[code]||'تعذر إنشاء حساب المشرف في Firebase Authentication.');}
  return d.localId;
}

async function saveAdmin(row,p){
  const email=String(p.email||'').trim().toLowerCase(),password=String(p.password||'');
  if(!email)throw Error('أدخل البريد الإلكتروني للمشرف.');
  if(!row?.id&&password.length<6)throw Error('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.');
  const role=['reviewer','content_admin','super_admin'].includes(p.role)?p.role:'reviewer';
  if(row?.id){await updateDoc(doc(db,'admins',row.id),{email,role,active:Boolean(p.active),updatedAt:serverTimestamp()});return row.id;}
  const uid=await createFirebaseUser(email,password);
  await setDoc(doc(db,'admins',uid),{email,role,active:p.active!==false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
  return uid;
}

async function openEditor(id=null){
  const admin=await currentAdmin(),cfg=configs[activeCollection];
  if(!cfg||!hasRole(admin?.role,cfg.writeRole||cfg.role))return;
  const row=id?await getOne(activeCollection,id):{};if(id&&!row){alert('العنصر غير موجود.');return;}
  const editor=$('editor');if(!editor)return;
  editor.innerHTML=`<form class="form-card admin-editor" id="fixedEditForm"><div class="section-head"><h3>${id?'تعديل':'إضافة'} ${esc(cfg.label)}</h3><button type="button" id="fixedClose" class="button">إغلاق</button></div><p class="muted">اختر العلاقات من القوائم بدل كتابة المعرّفات يدويًا.</p><div id="fixedFields">جاري تجهيز الحقول...</div><button class="button primary" type="submit">حفظ</button><p id="fixedMsg" class="message"></p></form>`;
  $('fixedFields').innerHTML=await buildFields(activeCollection,row||{});
  $('fixedClose').onclick=()=>editor.replaceChildren();
  $('fixedEditForm').onsubmit=async e=>{e.preventDefault();const msg=$('fixedMsg'),p=payload(e.currentTarget,activeCollection);try{if(activeCollection==='admins')await saveAdmin(row,p);else if(activeCollection==='resources')await resourceRepository.saveResource(id,p);else if(id)await updateDoc(doc(db,activeCollection,id),{...p,updatedAt:serverTimestamp()});else await addDoc(collection(db,activeCollection),{...p,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});msg.textContent='تم الحفظ بنجاح.';setTimeout(()=>editor.replaceChildren(),350);document.querySelector('#searchBtn')?.click();}catch(err){console.error('[admin.fixed-editor]',err);msg.textContent=err?.message||'تعذر حفظ البيانات.';msg.className='message error'}};
  editor.querySelector('input,textarea,select')?.focus();
}

document.addEventListener('click',event=>{const nav=event.target.closest('[data-collection]');if(nav)activeCollection=nav.dataset.collection;},true);
document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]'),add=event.target.closest('#add');if(!edit&&!add)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openEditor(edit?.dataset.edit||null).catch(err=>{console.error(err);alert(err?.message||'تعذر فتح المحرر.')});},true);
