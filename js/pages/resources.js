import { mountShell } from '../components/layout.js';
import { resourceRepository, getAllSmall } from '../repositories/resourceRepository.js';
import { resourceCard } from '../components/resourceCard.js';
import { escapeHtml, qs, debounce } from '../core/utils.js';

mountShell('المصادر', `
  <div id="resource-filters" class="toolbar"></div>
  <div id="resource-list" class="grid" aria-live="polite"></div>
  <button id="moreResources" class="button" hidden>تحميل المزيد</button>
`);

const [branches, subjects, categories] = await Promise.all([
  getAllSmall('branches'), getAllSmall('subjects'), getAllSmall('categories')
]);

const controls = document.getElementById('resource-filters');
const root = document.getElementById('resource-list');
controls.innerHTML = `
  <input id="resourceSearch" type="search" placeholder="ابحث بالعنوان..." aria-label="بحث بالمصادر">
  <select id="branchFilter" aria-label="الفرع"><option value="">كل الفروع</option>${branches.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('')}</select>
  <select id="subjectFilter" aria-label="المادة"><option value="">كل المواد</option>${subjects.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('')}</select>
  <select id="categoryFilter" aria-label="التصنيف"><option value="">كل التصنيفات</option>${categories.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('')}</select>
`;

const initialBranch = qs.get('branch') || '';
const initialSubject = qs.get('subject') || '';
document.getElementById('branchFilter').value = initialBranch;
document.getElementById('subjectFilter').value = initialSubject;

let cursor = null;
let busy = false;

function filters() {
  return {
    search: document.getElementById('resourceSearch').value.trim(),
    searchField: 'title',
    branchId: document.getElementById('branchFilter').value,
    subjectId: document.getElementById('subjectFilter').value,
    categoryId: document.getElementById('categoryFilter').value
  };
}

async function load(reset = false) {
  if (busy) return;
  busy = true;
  const more = document.getElementById('moreResources');
  if (reset) {
    cursor = null;
    root.replaceChildren();
    root.innerHTML = '<div class="loading">جاري تحميل المصادر...</div>';
  }
  try {
    const result = await resourceRepository.searchResources(filters(), 24, cursor);
    const html = result.rows.map(resourceCard).join('');
    if (reset) root.replaceChildren();
    if (html) root.insertAdjacentHTML('beforeend', html);
    cursor = result.nextCursor;
    more.hidden = !result.hasMore;
    if (!result.rows.length && !root.children.length) root.innerHTML = '<div class="empty">لا توجد مصادر مطابقة.</div>';
  } catch (error) {
    console.error('[resources]', error);
    if (reset) root.replaceChildren();
    root.innerHTML = '<div class="error-box">تعذر تحميل المصادر. حاول مرة أخرى.</div>';
    more.hidden = true;
  } finally {
    busy = false;
  }
}

const apply = debounce(() => load(true), 300);
['resourceSearch', 'branchFilter', 'subjectFilter', 'categoryFilter'].forEach((id) => {
  document.getElementById(id).addEventListener('input', apply);
  document.getElementById(id).addEventListener('change', apply);
});
document.getElementById('moreResources').addEventListener('click', () => load(false));
load(true);
