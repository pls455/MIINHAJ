import { mountShell } from '../components/layout.js';
import { qs } from '../core/utils.js';

mountShell('المواد', '<div class="toolbar"><input id="search" type="search" placeholder="ابحث عن مادة..." autocomplete="off"><select id="branch"><option value="">كل الفروع</option></select></div><div id="list" class="grid"></div>');

const search = document.getElementById('search');
const branch = document.getElementById('branch');
const list = document.getElementById('list');
let branches = [];
let subjects = [];

function matchesBranch(subject, branchId) {
  if (!branchId) return true;
  const ids = Array.isArray(subject.branchIds) ? subject.branchIds.map(String) : [];
  return ids.includes(String(branchId)) || String(subject.branchId || '') === String(branchId);
}

function renderBranches() {
  branch.replaceChildren(new Option('كل الفروع', ''));
  branches.forEach(x => branch.append(new Option(x.name || 'بدون اسم', String(x.id))));
  const requested = String(qs.get('branch') || '');
  if (branches.some(x => String(x.id) === requested)) branch.value = requested;
}

function renderSubjects() {
  const branchId = branch.value;
  const q = search.value.trim().toLocaleLowerCase('ar');
  const rows = subjects.filter(x => matchesBranch(x, branchId) && (!q || `${x.name || ''} ${x.description || ''}`.toLocaleLowerCase('ar').includes(q)));
  list.replaceChildren();
  if (!rows.length) {
    list.innerHTML = '<div class="empty">لا توجد مواد مطابقة.</div>';
    return;
  }
  rows.forEach(x => {
    const card = document.createElement('a');
    card.className = 'card subject-card';
    const branchIdForCard = branchId || x.branchIds?.[0] || x.branchId || '';
    card.href = `resources.html?branch=${encodeURIComponent(branchIdForCard)}&subject=${encodeURIComponent(x.id)}`;
    const icon = document.createElement('span');
    icon.textContent = x.icon || '📚';
    const title = document.createElement('h3');
    title.textContent = x.name || 'بدون اسم';
    const desc = document.createElement('p');
    desc.textContent = x.description || 'مصادر ومراجع دراسية';
    card.append(icon, title, desc);
    list.append(card);
  });
}

async function init() {
  list.innerHTML = '<div class="loading">جاري تحميل المواد...</div>';
  try {
    const { getAllSmall } = await import('../repositories/resourceRepository.js');
    [branches, subjects] = await Promise.all([
      getAllSmall('branches', 100),
      getAllSmall('subjects', 100)
    ]);
    renderBranches();
    renderSubjects();
  } catch (e) {
    console.error('[subjects] load failed', e);
    list.innerHTML = '<div class="error-box">تعذر تحميل المواد. تأكد من الاتصال ثم حاول مرة أخرى.</div>';
  }
}

branch.addEventListener('change', renderSubjects);
search.addEventListener('input', renderSubjects);
init();
