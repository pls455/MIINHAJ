import { mountShell } from '../components/layout.js';
import { escapeHtml, safeUrl } from '../core/utils.js';

mountShell('الحلول', `
  <section class="page-head"><span class="eyebrow">مِنهَاج</span><h1>الحلول</h1><p>ابحث عن الحلول والشروحات المتاحة للطلاب.</p></section>
  <section class="card"><div class="toolbar"><input id="search" type="search" placeholder="ابحث في الحلول..." autocomplete="off"></div><div id="status" class="message" role="status"></div><div id="list" class="grid"></div><button id="more" class="button" hidden>تحميل المزيد</button></section>
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
  const cards = rows.map(x => {
    const title = x.title || x.question || 'حل';
    const body = x.solution || x.answer || x.description || '';
    const problem = x.problem ? `<p class="muted">${escapeHtml(x.problem)}</p>` : '';
    const steps = Array.isArray(x.steps) ? `<ol>${x.steps.map(s => `<li>${escapeHtml(String(s))}</li>`).join('')}</ol>` : (x.steps ? `<p>${escapeHtml(x.steps)}</p>` : '');
    const url = safeUrl(x.url || '');
    return `<article class="card"><span class="card-icon" aria-hidden="true">✅</span><h3>${escapeHtml(title)}</h3>${problem}<p>${escapeHtml(body)}</p>${steps}${url !== '#' ? `<a class="button" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">فتح المصدر</a>` : ''}</article>`;
  }).join('');
  if (append) list.insertAdjacentHTML('beforeend', cards); else list.innerHTML = cards;
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

document.getElementById('search').addEventListener('input', () => { clearTimeout(load.timer); load.timer = setTimeout(() => load(true), 300); });
more.addEventListener('click', () => load(false));
load(true);
