import { getAllSmall, getOne, resourceRepository } from '../repositories/resourceRepository.js';
import { db } from '../services/firebase.js';
import { currentAdmin, hasRole } from '../services/firebase/adminCore.js';
import { firebaseConfig } from '../config/firebaseConfig.js';
import { configs } from './data.js';
import { collection, doc, addDoc, updateDoc, setDoc, serverTimestamp, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const $ = (id) => document.getElementById(id);
const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
let activeCollection = 'branches';

async function options(name) {
  try {
    const snap = await getDocs(query(collection(db, name), orderBy('order')));
    return snap.docs.map(d => ({id:d.id, ...d.data()})).sort((a,b) => (Number(a.order)||0)-(Number(b.order)||0));
  } catch {
    try { return await getAllSmall(name, 1000, true); } catch { return []; }
  }
}

const labels = {
  name:'اسم العنصر', description:'الوصف', icon:'الأيقونة', order:'الترتيب',
  title:'عنوان المحتوى', url:'رابط المحتوى', type:'نوع المحتوى', author:'المؤلف', level:'المستوى',
  category:'التصنيف', problem:'السؤال / المشكلة', solution:'الحل', steps:'خطوات الحل',
  notes:'ملاحظات', keywords:'الكلمات المفتاحية', tags:'الوسوم', status:'الحالة', sourceId:'معرّف المصدر',
  contentType:'نوع المحتوى', reviewerNote:'ملاحظة المراجع', foundationType:'نوع التأسيس', question:'السؤال', answer:'الإجابة',
  explanation:'الشرح', email:'البريد الإلكتروني', role:'الصلاحية', target:'هدف القالب', fields:'الحقول',
  instructions:'التعليمات', sourceTitle:'عنوان المصدر', sourceUrl:'رابط المصدر', kind:'نوع البلاغ',
  adminNote:'ملاحظة المشرف', needsReview:'بحاجة لمراجعة', branchIds:'الفروع', branchId:'الفرع', subjectId:'المادة', categoryId:'التصنيف'
};

const descriptions = {
  name:'الاسم الذي سيظهر للطالب.', title:'العنوان الذي سيظهر للطالب.', url:'الرابط الذي سيفتحه الطالب عند الضغط على المحتوى.',
  description:'وصف مختصر يساعد الطالب على فهم المحتوى.', branchIds:'اختر الفروع التي يرتبط بها هذا المحتوى.', branchId:'اختر الفرع المرتبط بهذا المحتوى.',
  subjectId:'اختر المادة المرتبط بها هذا المحتوى.', categoryId:'اختر التصنيف المناسب.', type:'حدد نوع المحتوى.', level:'حدد المستوى الدراسي عند الحاجة.',
  keywords:'كلمات تساعد في البحث، افصل بينها بفواصل.', tags:'وسوم إضافية، افصل بينها بفواصل.', order:'رقم ترتيب الظهور. يمكن تركه 0.',
  status:'الحالة الحالية للعنصر.', active:'حدد إذا كان العنصر ظاهرًا للطلاب.', question:'نص السؤال الذي سيظهر للطالب.', answer:'الإجابة الصحيحة أو المحتوى الذي سيظهر بعد السؤال.'
};

const placeholders = {
  name:'مثال: الفرع العلمي', title:'مثال: مراجعة الوحدة الأولى', url:'https://example.com', author:'اسم المؤلف إن وجد',
  keywords:'مثال: التفاضل، المشتقات، رياضيات', tags:'مثال: مراجعة، مهم، توجيهي', order:'مثال: 1',
  question:'اكتب السؤال هنا...', answer:'اكتب الإجابة هنا...', explanation:'شرح إضافي إن وجد',
  problem:'اكتب السؤال أو المشكلة...', solution:'اكتب الحل...', steps:'اكتب خطوات الحل بالتفصيل...', notes:'ملاحظات داخلية إن وجدت',
  sourceId:'معرّف المصدر الأصلي إن وجد', reviewerNote:'اكتب ملاحظة المراجع هنا...'
};

async function getRelationOptions(name) { return (await options(name)).filter(Boolean); }

function textField(key, type, value) {
  const label = labels[key] || key;
  const v = Array.isArray(value) ? value.join(', ') : (value ?? '');
  const placeholder = placeholders[key] || '';
  const optional = ['icon','author','keywords','tags','order','notes','reviewerNote','adminNote','description','sourceId','explanation','category','categoryName'].includes(key) ? ' <small class="muted">اختياري</small>' : '';
  const hint = descriptions[key] ? `<small class="field-hint muted">${esc(descriptions[key])}</small>` : '';
  if (type === 'checkbox') return `<label class="check"><input name="${esc(key)}" type="checkbox" ${value ? 'checked' : ''}> ${esc(label)}${hint}</label>`;
  if (type === 'textarea') return `<label><span>${esc(label)}${optional}</span>${hint}<textarea name="${esc(key)}" placeholder="${esc(placeholder)}">${esc(v)}</textarea></label>`;
  return `<label><span>${esc(label)}${optional}</span>${hint}<input name="${esc(key)}" type="${type === 'url' || type === 'email' ? type : 'text'}" value="${esc(v)}" placeholder="${esc(placeholder)}"></label>`;
}

function selectField(key, label, items, value, multiple=false, required=false) {
  const values = multiple ? (Array.isArray(value) ? value : String(value||'').split(',').map(x=>x.trim()).filter(Boolean)) : [value];
  const selected = new Set(values.map(String));
  const empty = multiple ? '' : `<option value="">${required ? 'اختر ' + esc(label) : 'غير محدد'}</option>`;
  const optionsHtml = items.map(x => {
    const name = x.name || x.title || x.sourceTitle || x.id;
    const inactive = x.active === false ? ' (غير نشط)' : '';
    return `<option value="${esc(x.id)}" ${selected.has(String(x.id))?'selected':''}>${esc(name)}${inactive}</option>`;
  }).join('');
  const hint = descriptions[key] ? `<small class="field-hint muted">${esc(descriptions[key])}</small>` : '';
  return `<label><span>${esc(label)}${required ? ' <small class="muted">مطلوب</small>' : ''}</span>${hint}<select name="${esc(key)}" ${multiple ? 'multiple size="6"' : ''} ${required?'required':''}>${empty}${optionsHtml}</select></label>`;
}

function enumField(key, label, value, items, required=false) {
  const selected = String(value ?? '');
  return `<label><span>${esc(label)}${required ? ' <small class="muted">مطلوب</small>' : ''}</span><small class="field-hint muted">${esc(descriptions[key]||'اختر القيمة المناسبة.')}</small><select name="${esc(key)}" ${required?'required':''}><option value="">${required?'اختر '+esc(label):'غير محدد'}</option>${items.map(([v,n])=>`<option value="${esc(v)}" ${selected===v?'selected':''}>${esc(n)}</option>`).join('')}</select></label>`;
}

async function buildFields(collectionName, row) {
  const cfg = configs[collectionName]; if (!cfg) return '';
  const [branches, subjects, categories] = await Promise.all([getRelationOptions('branches'), getRelationOptions('subjects'), getRelationOptions('categories')]);
  let html = '<div class="form-grid">';
  for (const [key,type] of Object.entries(cfg.fields)) {
    if (key === 'branchIds') html += selectField(key, 'الفروع', branches, row[key], true, collectionName === 'resources' || collectionName === 'foundations');
    else if (key === 'branchId') html += selectField(key, 'الفرع', branches, row[key], false, false);
    else if (key === 'subjectId') html += selectField(key, 'المادة', subjects, row[key], false, ['resources','foundations','flashcards'].includes(collectionName));
    else if (key === 'categoryId') html += selectField(key, 'التصنيف', categories, row[key], false, false);
    else if (collectionName === 'resources' && key === 'type') html += enumField(key,'نوع المحتوى',row[key],[['book','كتاب'],['lesson','درس'],['summary','ملخص'],['worksheet','ورقة عمل'],['video','فيديو'],['file','ملف'],['other','أخرى']]);
    else if (collectionName === 'foundations' && key === 'type') html += enumField(key,'نوع التأسيس',row[key],[['lesson','درس'],['book','كتاب'],['video','فيديو'],['file','ملف'],['other','أخرى']]);
    else if (collectionName === 'suggestions' && key === 'status') html += enumField(key,'الحالة',row[key],[['pending','قيد المراجعة'],['approved','مقبول'],['rejected','مرفوض']]);
    else if (collectionName === 'problemReports' && key === 'status') html += enumField(key,'الحالة',row[key],[['open','مفتوح'],['reviewed','تمت المراجعة'],['resolved','تم الحل'],['rejected','مرفوض']]);
    else if (collectionName === 'sourceRegistry' && key === 'status') html += enumField(key,'الحالة',row[key],[['pending_review','قيد المراجعة'],['approved','مقبول'],['published','منشور'],['rejected','مرفوض'],['archived','مؤرشف']]);
    else if (collectionName === 'solutions' && key === 'status') html += enumField(key,'الحالة',row[key],[['draft','مسودة'],['published','منشور'],['archived','مؤرشف']]);
    else if (collectionName === 'solutions' && key === 'category') html += enumField(key,'التصنيف',row[key],[['math','رياضيات'],['physics','فيزياء'],['chemistry','كيمياء'],['arabic','لغة عربية'],['english','لغة إنجليزية'],['other','أخرى']]);
    else if (collectionName === 'admins' && key === 'role') html += `<label><span>الصلاحية <small class="muted">مطلوب</small></span><select name="role" required><option value="reviewer" ${row.role==='reviewer'?'selected':''}>مراجع</option><option value="content_admin" ${row.role==='content_admin'?'selected':''}>مدير محتوى</option><option value="super_admin" ${['super_admin','superadmin'].includes(row.role)?'selected':''}>مدير النظام</option></select></label>`;
    else if (key === 'level') html += enumField(key,'المستوى',row[key],['الأول','الثاني','الثالث','الرابع','الخامس','السادس','السابع','الثامن','التاسع','العاشر','الحادي عشر','الثاني عشر'].map(x=>[x,x]));
    else html += textField(key,type,row[key]);
  }
  html += '</div>';
  if (collectionName === 'admins' && !row.id) html += `<label><span>كلمة المرور <small class="muted">مطلوبة، 6 أحرف على الأقل</small></span><small class="field-hint muted">تُستخدم لإنشاء حساب المشرف في Firebase Authentication.</small><input name="password" type="password" minlength="6" autocomplete="new-password" required placeholder="أدخل كلمة مرور الحساب"></label>`;
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
  if (['branches','subjects','categories'].includes(collectionName) && !out.stableId && out.name) out.stableId = out.name.trim().toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,'-').replace(/^-|-$/g,'') || `item-${Date.now()}`;
  if (collectionName === 'admins' && form.elements.password) out.password = form.elements.password.value;
  return out;
}

async function createFirebaseUser(email,password){
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(firebaseConfig.apiKey)}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password,returnSecureToken:false})});
  const d = await r.json().catch(()=>({}));
  if(!r.ok){const code=d?.error?.message||'';const map={EMAIL_EXISTS:'البريد مستخدم مسبقًا.',INVALID_EMAIL:'البريد الإلكتروني غير صالح.',WEAK_PASSWORD:'كلمة المرور ضعيفة. استخدم 6 أحرف على الأقل.'};throw Error(map[code]||'تعذر إنشاء حساب المشرف في Firebase Authentication.');}
  return d.localId;
}

async function saveAdmin(row,p){
  const email=String(p.email||'').trim().toLowerCase(), password=String(p.password||'');
  if(!email) throw Error('أدخل البريد الإلكتروني للمشرف.');
  if(!row?.id && password.length<6) throw Error('كلمة المرور يجب أن تحتوي على 6 أحرف على الأقل.');
  const role=['reviewer','content_admin','super_admin'].includes(p.role)?p.role:'reviewer';
  if(row?.id){await updateDoc(doc(db,'admins',row.id),{email,role,active:Boolean(p.active),updatedAt:serverTimestamp()});return row.id;}
  const uid=await createFirebaseUser(email,password);await setDoc(doc(db,'admins',uid),{email,role,active:p.active!==false,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});return uid;
}

async function openEditor(id=null){
  const admin=await currentAdmin(), cfg=configs[activeCollection];
  if(!cfg || !hasRole(admin?.role,cfg.writeRole||cfg.role)) return;
  const row=id ? await getOne(activeCollection,id) : {};
  if(id && !row){alert('العنصر غير موجود.');return;}
  const editor=$('editor'); if(!editor)return;
  editor.innerHTML=`<form class="form-card admin-editor" id="fixedEditForm" autocomplete="off"><div class="section-head"><div><h3>${id?'تعديل':'إضافة'} ${esc(cfg.label)}</h3><p class="muted">أدخل المعلومات الأساسية فقط. الحقول التقنية غير الضرورية مخفية.</p></div><button type="button" id="fixedClose" class="button">إغلاق</button></div><div id="fixedFields">جارٍ تجهيز الحقول...</div><button class="button primary" type="submit">حفظ</button><p id="fixedMsg" class="message"></p></form>`;
  try{$('fixedFields').innerHTML=await buildFields(activeCollection,row||{});}catch(err){console.error('[admin.fixed-editor.fields]',err);$('fixedFields').innerHTML='<div class="error-box">تعذر تحميل قوائم الفروع والمواد والتصنيفات. تحقق من اتصال Firebase.</div>';return;}
  $('fixedClose').onclick=()=>editor.replaceChildren();
  $('fixedEditForm').onsubmit=async e=>{e.preventDefault();const msg=$('fixedMsg'),p=payload(e.currentTarget,activeCollection);try{if(activeCollection==='admins') await saveAdmin(row,p);else if(activeCollection==='resources') await resourceRepository.saveResource(id,p);else if(id) await updateDoc(doc(db,activeCollection,id),{...p,updatedAt:serverTimestamp()});else await addDoc(collection(db,activeCollection),{...p,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});msg.textContent='تم الحفظ بنجاح.';setTimeout(()=>editor.replaceChildren(),350);document.querySelector('#searchBtn')?.click();}catch(err){console.error('[admin.fixed-editor]',err);msg.textContent=err?.message||'تعذر حفظ البيانات.';msg.className='message error';}};
  editor.querySelector('input,textarea,select')?.focus();
}

document.addEventListener('click',event=>{const nav=event.target.closest('[data-collection]');if(nav) activeCollection=nav.dataset.collection;},true);
document.addEventListener('click',event=>{const edit=event.target.closest('[data-edit]'), add=event.target.closest('#add');if(!edit&&!add)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openEditor(edit?.dataset.edit||null).catch(err=>{console.error(err);alert(err?.message||'تعذر فتح المحرر.')});},true);
