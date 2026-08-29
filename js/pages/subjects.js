import { mountShell } from '../components/layout.js';
import { getPage } from '../repositories/resourceRepository.js';
import { qs } from '../core/utils.js';

mountShell('المواد', '<div class="toolbar"><input id="search" type="search" placeholder="ابحث عن مادة..." autocomplete="off"><select id="branch"><option value="">كل الفروع</option></select></div><div id="list" class="grid"></div><div id="pagination" class="actions"></div>');
const search = document.getElementById('search');
const branch = document.getElementById('branch');
const list = document.getElementById('list');
const pagination = document.getElementById('pagination');
let branchRows = [], cursor = null;

function renderBranches() {
  branch.replaceChildren(new Option('كل الفروع', ''));
  branchRows.forEach(x => branch.append(new Option(x.name || 'بدون اسم', x.id)));
  branch.value = qs.get('branch') || '';
}

async function loadBranches() {
  const page = await getPage('branches', { active: true }, 50);
  branchRows = page.rows;
  renderBranches();
}

async function loadSubjects(reset = true) {
  if (reset) cursor = null;
  list.innerHTML = '<div class="loading">جاري تحميل المواد...</div>';
  try {
    const filters = { active: true };
    if (branch.value) filters.branchId = branch.value;
    const page = await getPage('subjects', filters, 24, cursor);
    list.replaceChildren();
    const q = search.value.trim().toLocaleLowerCase('ar');
    const rows = q ? page.rows.filter(x => `${x.name || ''} ${x.description || ''}`.toLocaleLowerCase('ar').includes(q)) : page.rows;
    if (!rows.length) list.innerHTML = '<div class="empty">لا توجد مواد مطابقة.</div>';
    rows.forEach(x => {
      const card = document.createElement('a'); card.className='card subject-card';
      const branchId = branch.value || x.branchIds?.[0] || x.branchId || '';
      card.href=`resources.html?branch=${encodeURIComponent(branchId)}&subject=${encodeURIComponent(x.id)}`;
      const icon=document.createElement('span'); icon.textContent=x.icon||'📚';
      const title=document.createElement('h3'); title.textContent=x.name||'بدون اسم';
      const desc=document.createElement('p'); desc.textContent=x.description||'مصادر ومراجع دراسية';
      card.append(icon,title,desc); list.append(card);
    });
    pagination.replaceChildren();
    if (page.hasMore) { const next=document.createElement('button'); next.className='button'; next.textContent='التالي'; next.onclick=async()=>{cursor=page.nextCursor;await loadSubjects(false)}; pagination.append(next); }
  } catch(e) { console.error(e); list.innerHTML='<div class="error-box">تعذر تحميل المواد.</div>'; }
}

branch.addEventListener('change',()=>loadSubjects(true));
search.addEventListener('input',()=>loadSubjects(true));
try { await loadBranches(); await loadSubjects(); } catch(e) { console.error(e); list.innerHTML='<div class="error-box">تعذر تحميل البيانات.</div>'; }
