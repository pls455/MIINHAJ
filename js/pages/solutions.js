import { mountShell } from '../components/layout.js';
import { escapeHtml, safeUrl, debounce } from '../core/utils.js';

mountShell('الحلول', `
  <section class="page-head"><span class="eyebrow">مِنهَاج</span><h1>الحلول</h1><p>ابحث عن الحلول والشروحات المتاحة للطلاب.</p></section>
  <section class="card"><div class="toolbar"><input id="search" type="search" placeholder="ابحث في الحلول..." autocomplete="off"></div><div id="status" class="message" role="status" aria-live="polite"></div><div id="list" class="grid"></div><button id="more" class="button" hidden type="button">تحميل المزيد</button></section>
`);

const list = document.getElementById('list');
const status = document.getElementById('status');
const more = document.getElementById('more');
let cursor = null;
let loading = false;
let requestId = 0;
let repositoriesPromise;
let seenIds = new Set();

function getRepositories() { return repositoriesPromise ??= import('../repositories/resourceRepository.js').then(m => m.repositories); }

function render(rows, append = true) {
  const fragment = document.createDocumentFragment();
  rows.forEach((x) => {
    const article = document.createElement('article');
    article.className = 'card';
    const icon = document.createElement('span'); icon.className = 'card-icon'; icon.setAttribute('aria-hidden', 'true'); icon.textContent = '✅';
    const title = document.createElement('h3'); title.textContent = x.title || x.question || 'حل';
    article.append(icon, title);
    if (x.problem) { const p = document.createElement('p'); p.className = 'muted'; p.textContent = x.problem; article.append(p); }
    const body = document.createElement('p'); body.textContent = x.solution || x.answer || x.description || ''; article.append(body);
    if (Array.isArray(x.steps)) {
      const ol = document.createElement('ol'); x.steps.forEach(s => { const li = document.createElement('li'); li.textContent = String(s); ol.append(li); }); article.append(ol);
    } else if (x.steps) { const p = document.createElement('p'); p.textContent = x.steps; article.append(p); }
    const url = safeUrl(x.url || '');
    if (url !== '#') { const a = document.createElement('a'); a.className = 'button'; a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; a.textContent = 'فتح المصدر'; article.append(a); }
    fragment.append(article);
  });
  if (append) list.append(fragment); else list.replaceChildren(fragment);
}

async function load(reset = false) {
  if (loading) return;
  const id = ++requestId;
  loading = true;
  if (reset) { cursor = null; seenIds = new Set(); list.replaceChildren(); more.hidden = true; }
  status.textContent = 'جارٍ تحميل النتائج...';
  try {
    const repositories = await getRepositories();
    if (id !== requestId) return;
    const q = document.getElementById('search').value.trim();
    const r = await repositories.solutions.page(q ? { title: q } : {}, 20, cursor);
    if (id !== requestId) return;
    const fresh = r.rows.filter(x => !seenIds.has(x.id));
    fresh.forEach(x => seenIds.add(x.id));
    render(fresh, !reset);
    cursor = r.nextCursor;
    more.hidden = !r.hasMore || (fresh.length === 0 && !r.nextCursor);
    status.textContent = !list.children.length ? 'لا توجد حلول مطابقة.' : '';
  } catch (error) { if (id !== requestId) return; console.error('[solutions]', error); status.textContent = 'تعذر تحميل الحلول. حاول مرة أخرى.'; }
  finally { if (id === requestId) loading = false; }
}

document.getElementById('search').addEventListener('input', debounce(() => load(true), 300));
more.addEventListener('click', () => load(false));
load(true);
