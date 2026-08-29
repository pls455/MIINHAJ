import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { getFoundations } from '../repositories/foundationRepository.js';
import { renderNavbar, renderFooter } from '../components/layout.js';
import { persist, erase, setAdmin } from './data.js';

const admin = await requireAdmin(ROLES.CONTENT_ADMIN);
setAdmin(admin);
renderNavbar(); renderFooter();
const $ = id => document.getElementById(id);
let cursor = null, editingId = null, nextCursor = null, loading = false;

function validUrl(value) {
  if (!value) return true;
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol); }
  catch { return false; }
}

function render(items) {
  const root = $('foundation-list');
  root.replaceChildren();
  if (!items.length) { root.innerHTML = '<div class="empty">لا يوجد محتوى تأسيس.</div>'; return; }
  items.forEach(x => {
    const card = document.createElement('article'); card.className = 'card admin-row';
    const info = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = x.title || 'بدون عنوان';
    const p = document.createElement('p'); p.textContent = [x.type, x.level, x.active === false ? 'معطّل' : 'مفعّل'].filter(Boolean).join(' • ');
    info.append(h, p);
    const actions = document.createElement('div'); actions.className = 'actions';
    const edit = document.createElement('button'); edit.className = 'button'; edit.textContent = 'تعديل'; edit.onclick = () => open(x);
    const del = document.createElement('button'); del.className = 'button danger'; del.textContent = 'حذف'; del.onclick = () => remove(x);
    actions.append(edit, del); card.append(info, actions); root.append(card);
  });
}

function open(x = null) {
  editingId = x?.id || null;
  $('form-title').textContent = editingId ? 'تعديل التأسيس' : 'إضافة تأسيس';
  $('title').value = x?.title || '';
  $('description').value = x?.description || '';
  $('url').value = x?.url || '';
  $('type').value = x?.type || '';
  $('order').value = Number(x?.order) || 0;
  $('active').checked = x?.active !== false;
  $('foundation-dialog').showModal();
}
function close() { if ($('foundation-dialog').open) $('foundation-dialog').close(); editingId = null; }

async function load(reset = true) {
  if (loading) return; loading = true; if (reset) cursor = null;
  try {
    const r = await getFoundations({ limit: 24, cursor });
    nextCursor = r.nextCursor; render(r.items);
    const p = $('foundation-pagination'); p.replaceChildren();
    const next = document.createElement('button'); next.className = 'button'; next.textContent = 'التالي'; next.disabled = !nextCursor;
    next.onclick = async () => { cursor = nextCursor; await load(false); };
    p.append(next);
  } catch (e) { console.error('[admin/foundations]', e); $('foundation-list').innerHTML = '<div class="error-box">تعذر تحميل التأسيس.</div>'; }
  finally { loading = false; }
}

async function remove(x) {
  if (!confirm(`تأكيد حذف «${x.title || ''}»؟`)) return;
  try { await erase('foundations', x.id); await load(true); }
  catch (e) { console.error('[admin/foundations.delete]', e); alert('تعذر الحذف. تحقق من الصلاحيات ثم حاول مرة أخرى.'); }
}

$('add-foundation').onclick = () => open();
$('cancel').onclick = close;
$('foundation-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = $('title').value.trim(), url = $('url').value.trim(), order = Number($('order').value);
  if (!title) return alert('العنوان مطلوب.');
  if (title.length > 200) return alert('العنوان طويل جدًا.');
  if (!Number.isInteger(order) || order < 0) return alert('الترتيب غير صحيح.');
  if (!validUrl(url)) return alert('الرابط يجب أن يكون http أو https.');
  const data = { title, description: $('description').value.trim(), url, type: $('type').value.trim(), order, active: $('active').checked };
  try { await persist('foundations', editingId, data); close(); await load(true); }
  catch (err) { console.error('[admin/foundations.save]', err); alert('تعذر حفظ التأسيس. تحقق من الصلاحيات والبيانات.'); }
});

await load();
