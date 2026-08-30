import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { getFlashcards, createFlashcard, updateFlashcard, deleteFlashcard } from '../repositories/flashcardRepository.js';
import { renderNavbar, renderFooter } from '../components/layout.js';

await requireAdmin(ROLES.CONTENT_ADMIN);
renderNavbar(); renderFooter();
const $ = id => document.getElementById(id);
let cursor = null, editingId = null, loading = false;

function render(items) {
  const root = $('card-list'); root.replaceChildren();
  if (!items.length) { root.innerHTML = '<div class="empty">لا توجد بطاقات تعليمية.</div>'; return; }
  for (const item of items) {
    const card = document.createElement('article'); card.className = 'card admin-row';
    const info = document.createElement('div');
    const h = document.createElement('h3'); h.textContent = item.question || 'بدون سؤال';
    const p = document.createElement('p'); p.textContent = `${item.branchId || 'بدون فرع'} • ${item.subjectId || 'بدون مادة'} • ${item.active === false ? 'معطّلة' : 'مفعّلة'}`;
    info.append(h, p);
    const actions = document.createElement('div'); actions.className = 'actions';
    const edit = document.createElement('button'); edit.className = 'button'; edit.textContent = 'تعديل'; edit.onclick = () => open(item);
    const del = document.createElement('button'); del.className = 'button danger'; del.textContent = 'حذف'; del.onclick = () => remove(item);
    actions.append(edit, del); card.append(info, actions); root.append(card);
  }
}

function open(item = null) {
  editingId = item?.id || null; $('form-title').textContent = editingId ? 'تعديل البطاقة' : 'إضافة بطاقة';
  $('question').value = item?.question || ''; $('answer').value = item?.answer || ''; $('explanation').value = item?.explanation || '';
  $('branchId').value = item?.branchId || ''; $('subjectId').value = item?.subjectId || ''; $('order').value = Number(item?.order) || 0; $('active').checked = item?.active !== false;
  $('card-dialog').showModal(); $('question').focus();
}
function close() { if ($('card-dialog').open) $('card-dialog').close(); editingId = null; }
async function load() {
  if (loading) return; loading = true; $('status').textContent = 'جاري تحميل البطاقات...';
  try { const r = await getFlashcards({ pageSize: 24, cursor }); render(r.items); const p=$('pagination'); p.replaceChildren(); const next=document.createElement('button'); next.className='button'; next.textContent='التالي'; next.disabled=!r.nextCursor; next.onclick=async()=>{cursor=r.nextCursor;await load()}; p.append(next); $('status').textContent=''; }
  catch (e) { console.error('[admin/flashcards.load]', e); $('status').textContent='تعذر تحميل البطاقات.'; $('status').className='message error'; }
  finally { loading=false; }
}
async function remove(item) { if (!confirm(`تأكيد حذف البطاقة «${item.question || ''}»؟`)) return; try { await deleteFlashcard(item.id); cursor=null; await load(); } catch(e) { console.error('[admin/flashcards.delete]',e); alert('تعذر الحذف.'); } }
$('add-card').onclick=()=>open(); $('cancel').onclick=close;
$('card-form').addEventListener('submit', async event => { event.preventDefault(); const order=Number($('order').value); if(!$('question').value.trim()||!$('answer').value.trim()) return alert('السؤال والإجابة مطلوبان.'); if(!$('branchId').value.trim()||!$('subjectId').value.trim()) return alert('الفرع والمادة مطلوبان.'); if(!Number.isInteger(order)||order<0)return alert('الترتيب غير صحيح.'); const data={question:$('question').value.trim(),answer:$('answer').value.trim(),explanation:$('explanation').value.trim(),branchId:$('branchId').value.trim(),subjectId:$('subjectId').value.trim(),order,active:$('active').checked}; try { if(editingId) await updateFlashcard(editingId,data); else await createFlashcard(data); close(); cursor=null; await load(); } catch(e){console.error('[admin/flashcards.save]',e);alert('تعذر حفظ البطاقة. تحقق من البيانات والصلاحيات.');} });
await load();
