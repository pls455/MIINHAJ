import { mountShell } from '../components/layout.js';
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
  const requestedBranch = qs.get('branch') || '';
  branch.value = branchRows.some(x => x.id === requestedBranch) ? requestedBranch : '';
}

async function loadBranches() {
  const { getPage } = await import('../repositories/resourceRepository.js');
  const page = await getPage('branches', { active: true }, 50);
  branchRows = page.rows;
  renderBranches();
}

function matchesBranch(subject, branchId) {
  if (!branchId) return true;
  const ids = Array.isArray(subject.branchIds) ? subject.branchIds : [];
  return ids.map(String).includes(String(branchId)) || String(subject.branchId || '') === String(branchId);
}

async function loadSubjects(reset = true) {
  if (reset) cursor = null;
  list.innerHTML = '<div class="loading">جاري تحميل المواد...</div>';
  try {
    const { getPage } = await import('../repositories/resourceRepository.js');
    const page = await getPage('subjects', { active: true }, 50, cursor);
    const q = search.value.trim().toLocaleLowerCase('ar');
    const rows = page.rows.filter(x => matchesBranch(x, branch.value) && (!q || `${x.name || ''} ${x.description || ''}`.toLocaleLowerCase('ar').includes(q)));
    list.replaceChildren();
    if (!rows.length) list.innerHTML = '<div class="empty">لا توجد مواد مطابقة.</div>';
    rows.forEach(x => {
      const card = document.createElement('a'); card.className = 'card subject-card';
      const branchId = branch.value || x.branchIds?.[0] || x.branchId || '';
      card.href = `resources.html?branch=${encodeURIComponent(branchId)}&subject=${encodeURIComponent(x.id)}`;
      const icon = document.createElement('span'); icon.textContent = x.icon || '📚';
      const title = document.createElement('h3'); title.textContent = x.name || 'بدون اسم';
      const desc = document.createElement('p'); desc.textContent = x.description || 'مصادر ومراجع دراسية';
      card.append(icon, title, desc); list.append(card);
    });
    pagination.replaceChildren();
    if (page.hasMore) {
      const next = document.createElement('button'); next.className = 'button'; next.textContent = 'التالي';
      next.onclick = async () => { cursor = page.nextCursor; await loadSubjects(false); };
      pagination.append(next);
    }
  } catch (e) {
    console.error(e);
    list.innerHTML = '<div class="error-box">تعذر تحميل المواد. تأكد من الاتصال ثم حاول مرة أخرى.</div>';
  }
}

branch.addEventListener('change', () => loadSubjects(true));
search.addEventListener('input', () => loadSubjects(true));
try {
  await loadBranches();
  await loadSubjects();
} catch (e) {
  console.error(e);
  list.innerHTML = '<div class="error-box">تعذر تحميل البيانات. تأكد من الاتصال ثم حاول مرة أخرى.</div>';
}
