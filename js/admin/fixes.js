import { getAllSmall, getOne, resourceRepository } from '../repositories/resourceRepository.js';
import { db } from '../services/firebase.js';
import { currentAdmin, hasRole } from '../services/firebase/adminCore.js';
import { collection, doc, addDoc, updateDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { configs } from './data.js';

let activeCollection = 'branches';
const $ = (id) => document.getElementById(id);
const esc = (v='') => String(v).replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

function canWrite(admin, collectionName) {
  const cfg = configs[collectionName];
  return !!cfg && !cfg.readOnly && hasRole(admin.role, cfg.writeRole || cfg.role);
}

async function options(name) {
  try { return await getAllSmall(name, 100); } catch { return []; }
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
  return `<label>${esc(label)}<select name="${esc(key)}" ${multiple ? 'multiple size="5"' : ''}>${items.map(x=>`<option value="${esc(x.id)}" ${selected.has(String(x.id))?'selected':''}>${esc(x.name || x.title || x.id)}</option>`).join('')}</select></label>`;
}

async function buildFields(collectionName, row) {
  const cfg = configs[collectionName];
  const branches = await options('branches');
  const subjects = await options('subjects');
  const categories = await options('categories');
  let html = '';
  for (const [key,type] of Object.entries(cfg.fields)) {
    if (key === 'branchIds') html += selectField(key, 'الفروع', branches, row[key], true);
    else if (key === 'branchId') html += selectField(key, 'الفرع', branches, row[key], false);
    else if (key === 'subjectId') html += selectField(key, 'المادة', subjects, row[key], false);
    else if (key === 'categoryId') html += selectField(key, 'التصنيف', categories, row[key], false);
    else html += textField(key,type,row[key]);
  }
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
  return out;
}

async function openEditor(id=null) {
  const admin = await currentAdmin();
  if (!canWrite(admin, activeCollection)) return;
  const row = id ? await getOne(activeCollection, id) : {};
  if (id && !row) { alert('العنصر غير موجود.'); return; }
  const cfg = configs[activeCollection];
  const editor = $('editor'); if (!editor) return;
  editor.innerHTML = `<form class="form-card admin-editor" id="fixedEditForm"><div class="section-head"><h3>${id?'تعديل':'إضافة'} ${esc(cfg.label)}</h3><button type="button" id="fixedClose" class="button">إغلاق</button></div><p class="muted">اختر العلاقات من القوائم بدل كتابة المعرّفات يدويًا.</p><div id="fixedFields">جاري تجهيز الحقول...</div><button class="button primary" type="submit">حفظ</button><p id="fixedMsg" class="message"></p></form>`;
  $('fixedFields').innerHTML = await buildFields(activeCollection, row || {});
  $('fixedClose').onclick = () => editor.replaceChildren();
  $('fixedEditForm').onsubmit = async (e) => {
    e.preventDefault();
    const msg = $('fixedMsg'), p = payload(e.currentTarget, activeCollection);
    try {
      const saved = activeCollection === 'resources'
        ? await resourceRepository.saveResource(id, p)
        : id
          ? (await updateDoc(doc(db, activeCollection, id), {...p, updatedAt: serverTimestamp()}), id)
          : (await addDoc(collection(db, activeCollection), {...p, createdAt: serverTimestamp(), updatedAt: serverTimestamp()})).id;
      msg.textContent = 'تم الحفظ بنجاح.';
      setTimeout(() => editor.replaceChildren(), 350);
      document.querySelector('#searchBtn')?.click();
      return saved;
    } catch (err) {
      console.error('[admin.fixed-editor]', err);
      msg.textContent = err?.message || 'تعذر حفظ البيانات.';
      msg.style.color = 'var(--color-danger, #ef4444)';
    }
  };
  editor.querySelector('input,textarea,select')?.focus();
}

document.addEventListener('click', (event) => {
  const nav = event.target.closest('[data-collection]');
  if (nav) activeCollection = nav.dataset.collection;
}, true);

document.addEventListener('click', (event) => {
  const edit = event.target.closest('[data-edit]');
  const add = event.target.closest('#add');
  if (!edit && !add) return;
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
  openEditor(edit?.dataset.edit || null).catch(err => { console.error(err); alert(err?.message || 'تعذر فتح المحرر.'); });
}, true);
