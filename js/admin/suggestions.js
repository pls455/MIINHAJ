import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { getSuggestions, updateSuggestionStatus } from '../repositories/suggestionRepository.js';
import { renderNavbar, renderFooter } from '../components/layout.js';

await requireAdmin(ROLES.REVIEWER);
renderNavbar(); renderFooter();
const $ = id => document.getElementById(id);
let cursor = null, busy = false;

function esc(value) { const el = document.createElement('div'); el.textContent = String(value ?? ''); return el.innerHTML; }
function render(items) {
  const root = $('suggestions-list'); root.replaceChildren();
  if (!items.length) { root.innerHTML = '<div class="empty">لا توجد اقتراحات بهذه الحالة.</div>'; return; }
  for (const item of items) {
    const card = document.createElement('article'); card.className = 'card admin-row';
    card.innerHTML = `<div><h3>${esc(item.title || 'بدون عنوان')}</h3><p>${esc(item.contentType)} • ${esc(item.branchId)} • ${esc(item.subjectId)}</p><p>${esc(item.description || '')}</p><a href="${/^https?:\/\//i.test(item.url || '') ? esc(item.url) : '#'}" target="_blank" rel="noopener noreferrer">فتح الرابط</a><small> الحالة: ${esc(item.status || 'pending')}</small></div>`;
    const actions = document.createElement('div'); actions.className = 'actions';
    for (const [status,label] of [['approved','قبول'],['rejected','رفض'],['archived','أرشفة']]) { const b=document.createElement('button'); b.className=`button ${status==='approved'?'primary':''}`; b.textContent=label; b.onclick=()=>change(item,status); actions.append(b); }
    card.append(actions); root.append(card);
  }
}
async function change(item, status) {
  if (busy || !confirm(`تأكيد تغيير حالة الاقتراح إلى «${status}»؟`)) return;
  busy=true;
  try { await updateSuggestionStatus(item.id,status); cursor=null; await load(); }
  catch(error){ console.error('[admin/suggestions.status]',error); alert('تعذر تحديث حالة الاقتراح.'); }
  finally{ busy=false; }
}
async function load(){
  $('status').textContent='جاري التحميل...';
  try { const r=await getSuggestions({pageSize:24,cursor,status:$('filter').value||null}); render(r.items); const p=$('pagination'); p.replaceChildren(); if(r.nextCursor){const b=document.createElement('button');b.className='button';b.textContent='التالي';b.onclick=()=>{cursor=r.nextCursor;load()};p.append(b)} $('status').textContent=''; }
  catch(error){ console.error('[admin/suggestions.load]',error); $('status').textContent='تعذر تحميل الاقتراحات.'; }
}
$('filter').addEventListener('change',()=>{cursor=null;load()});
load();
