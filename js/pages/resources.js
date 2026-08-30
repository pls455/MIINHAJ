import { mountShell } from '../components/layout.js';
import { resourceCard } from '../components/resourceCard.js';
import { escapeHtml, qs, debounce } from '../core/utils.js';

mountShell('المصادر', `
  <div id="resource-filters" class="toolbar"></div>
  <div id="resource-list" class="grid" aria-live="polite"></div>
  <button id="moreResources" class="button" hidden>تحميل المزيد</button>
`);

const controls = document.getElementById('resource-filters');
const root = document.getElementById('resource-list');
const more = document.getElementById('moreResources');
let cursor = null;
let busy = false;
let repositoryPromise;

function getRepository() {
  return repositoryPromise ??= import('../repositories/resourceRepository.js');
}

function filters() {
  return {
    search: document.getElementById('resourceSearch').value.trim(),
    searchField: 'title',
    branchId: document.getElementById('branchFilter').value,
    subjectId: document.getElementById('subjectFilter').value,
    categoryId: document.getElementById('categoryFilter').value
  };
}

function setLoading() {
  root.replaceChildren();
  const state = document.createElement('div');
  state.className = 'loading';
  state.textContent = 'جاري تحميل المصادر...';
  root.append(state);
}

function appendRows(rows) {
  rows.forEach((row) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = resourceCard(row);
    const node = wrapper.firstElementChild;
    if (node) root.append(node);
  });
}

async function load(reset = false) {
  if (busy) return;
  busy = true;
  if (reset) { cursor = null; setLoading(); }
  try {
    const { resourceRepository, getAllSmall } = await getRepository();
    if (!controls.children.length) {
      const [branches, subjects, categories] = await Promise.all([
        getAllSmall('branches'), getAllSmall('subjects'), getAllSmall('categories')
      ]);
      controls.innerHTML = `<input id="resourceSearch" type="search" placeholder="ابحث بالعنوان..." aria-label="بحث بالمصادر"><select id="branchFilter" aria-label="الفرع"><option value="">كل الفروع</option>${branches.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('')}</select><select id="subjectFilter" aria-label="المادة"><option value="">كل المواد</option>${subjects.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('')}</select><select id="categoryFilter" aria-label="التصنيف"><option value="">كل التصنيفات</option>${categories.map(x => `<option value="${escapeHtml(x.id)}">${escapeHtml(x.name)}</option>`).join('')}</select>`;
      document.getElementById('branchFilter').value = qs.get('branch') || '';
      document.getElementById('subjectFilter').value = qs.get('subject') || '';
      ['resourceSearch', 'branchFilter', 'subjectFilter', 'categoryFilter'].forEach((id) => {
        document.getElementById(id).addEventListener('input', apply);
        document.getElementById(id).addEventListener('change', apply);
      });
    }
    const result = await resourceRepository.searchResources(filters(), 24, cursor);
    if (reset) root.replaceChildren();
    appendRows(result.rows);
    cursor = result.nextCursor;
    more.hidden = !result.hasMore;
    if (!result.rows.length && !root.children.length) {
      const empty = document.createElement('div'); empty.className = 'empty'; empty.textContent = 'لا توجد مصادر مطابقة.'; root.append(empty);
    }
  } catch (error) {
    console.error('[resources]', error);
    if (reset) root.replaceChildren();
    const state = document.createElement('div'); state.className = 'error-box'; state.textContent = 'تعذر تحميل المصادر. حاول مرة أخرى.'; root.append(state); more.hidden = true;
  } finally { busy = false; }
}

const apply = debounce(() => load(true), 300);
more.addEventListener('click', () => load(false));
load(true);
