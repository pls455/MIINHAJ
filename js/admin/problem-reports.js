import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { getProblemReports, updateProblemReportStatus } from '../repositories/problemReportRepository.js';
import { renderNavbar, renderFooter } from '../components/layout.js';

await requireAdmin(ROLES.CONTENT_ADMIN);
renderNavbar(); renderFooter();
const $ = id => document.getElementById(id);
let cursor = null;

function render(items) {
  const root = $('report-list'); root.replaceChildren();
  if (!items.length) { root.innerHTML = '<div class="empty">لا توجد بلاغات.</div>'; return; }
  for (const item of items) {
    const card = document.createElement('article'); card.className = 'card admin-row';
    const body = document.createElement('div');
    const title = document.createElement('h3'); title.textContent = item.sourceTitle || item.kind || 'بلاغ';
    const desc = document.createElement('p'); desc.textContent = item.description || '';
    const status = document.createElement('small'); status.textContent = item.status || 'open';
    body.append(title, desc, status);
    const actions = document.createElement('div'); actions.className = 'actions';
    if (item.status !== 'resolved') { const b=document.createElement('button'); b.className='button'; b.textContent='تم الحل'; b.onclick=()=>change(item,'resolved'); actions.append(b); }
    if (item.status !== 'dismissed') { const b=document.createElement('button'); b.className='button danger'; b.textContent='استبعاد'; b.onclick=()=>change(item,'dismissed'); actions.append(b); }
    card.append(body, actions); root.append(card);
  }
}

async function load() {
  $('message').textContent='جاري التحميل...';
  try { const r=await getProblemReports({pageSize:24,cursor,status:$('status').value||null}); render(r.items); cursor=r.nextCursor; $('message').textContent=''; const p=$('pagination'); p.replaceChildren(); if(r.nextCursor){const b=document.createElement('button');b.className='button';b.textContent='التالي';b.onclick=load;p.append(b);} }
  catch(e){console.error('[admin/problem-reports.load]',e);$('message').textContent='تعذر تحميل البلاغات.';}
}
async function change(item,status){const note=prompt('ملاحظة إدارية (اختياري):','');if(note===null)return;try{await updateProblemReportStatus(item.id,status,note);cursor=null;await load();}catch(e){console.error('[admin/problem-reports.update]',e);alert('تعذر تحديث البلاغ.');}}
$('status').onchange=()=>{cursor=null;load();}; $('reload').onclick=()=>{cursor=null;load();}; await load();
