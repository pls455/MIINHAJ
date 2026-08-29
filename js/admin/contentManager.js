import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { listAdminCollection, saveAdminItem, removeAdminItem } from './adminDataRepository.js';

const params = new URLSearchParams(location.search);
const collectionName = params.get('collection') || 'branches';
const labels = { branches: 'الفروع', subjects: 'المواد', categories: 'التصنيفات' };
const label = labels[collectionName];
if (!label) throw new Error('UNSUPPORTED_ADMIN_COLLECTION');
const $ = id => document.getElementById(id);
let editingId = null;
let rows = [];

function render() {
  const root = $('content-list'); root.replaceChildren();
  if (!rows.length) { root.innerHTML = '<div class="empty">لا توجد بيانات.</div>'; return; }
  rows.forEach(item => {
    const row = document.createElement('article'); row.className = 'card admin-row';
    const info = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = item.name || 'بدون اسم';
    const p = document.createElement('p'); p.textContent = `${item.active === false ? 'معطّل' : 'مفعّل'} • الترتيب ${item.order ?? 0}`;
    info.append(h,p);
    const actions = document.createElement('div'); actions.className = 'actions';
    const edit = document.createElement('button'); edit.className='button'; edit.textContent='تعديل'; edit.onclick=()=>openForm(item);
    const del = document.createElement('button'); del.className='button danger'; del.textContent='حذف'; del.onclick=()=>remove(item);
    actions.append(edit,del); row.append(info,actions); root.append(row);
  });
}

function openForm(item = null) {
  editingId = item?.id || null;
  $('form-title').textContent = editingId ? `تعديل ${label}` : `إضافة ${label.slice(0,-1)}`;
  $('item-name').value = item?.name || '';
  $('item-description').value = item?.description || '';
  $('item-icon').value = item?.icon || '';
  $('item-order').value = item?.order ?? 0;
  $('item-active').checked = item?.active !== false;
  if ($('item-stable')) $('item-stable').value = item?.stableId || '';
  if ($('item-branches')) $('item-branches').value = Array.isArray(item?.branchIds) ? item.branchIds.join(', ') : '';
  if ($('stable-wrap')) $('stable-wrap').hidden = collectionName !== 'categories';
  if ($('branches-wrap')) $('branches-wrap').hidden = collectionName !== 'subjects';
  $('item-form').showModal();
  $('item-name').focus();
}

function closeForm() { if ($('item-form').open) $('item-form').close(); editingId = null; }
async function load() { rows = await listAdminCollection(collectionName); render(); }
async function remove(item) {
  if (!confirm(`تأكيد حذف «${item.name || ''}»؟`)) return;
  try { await removeAdminItem(collectionName, item.id); await load(); }
  catch (e) { console.error(e); alert('تعذر الحذف. قد تكون هناك علاقات مرتبطة بهذا العنصر.'); }
}

await requireAdmin(ROLES.CONTENT_ADMIN);

document.title = `إدارة ${label} | مِنهَاج`;
$('page-title').textContent = `إدارة ${label}`;
$('add-item').textContent = `إضافة ${label.slice(0,-1)}`;
$('add-item').onclick = () => openForm();
$('cancel-form').onclick = closeForm;
$('item-form').addEventListener('submit', async event => {
  event.preventDefault();
  const data = { name: $('item-name').value, description: $('item-description').value, icon: $('item-icon').value, order: $('item-order').value, active: $('item-active').checked };
  if (collectionName === 'categories') data.stableId = $('item-stable').value;
  if (collectionName === 'subjects') data.branchIds = $('item-branches').value.split(',').map(v => v.trim()).filter(Boolean);
  try { await saveAdminItem(collectionName, editingId, data); closeForm(); await load(); }
  catch (e) { console.error(e); alert(e.message === 'ADMIN_NAME_REQUIRED' ? 'الاسم مطلوب.' : e.message === 'CATEGORY_STABLE_ID_REQUIRED' ? 'stableId مطلوب للتصنيف.' : 'تعذر الحفظ.'); }
});
await load();
