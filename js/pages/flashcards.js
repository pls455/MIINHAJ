import { mountShell } from '../components/layout.js';
import { escapeHtml } from '../core/utils.js';

mountShell('البطاقات', `<section class="page-head"><span class="eyebrow">مِنهَاج</span><h1>البطاقات التعليمية</h1><p>راجع السؤال، ثم اكشف الإجابة واستخدم أزرار التنقل للمراجعة السريعة.</p></section><section class="card"><div id="status" class="message" role="status"></div><div id="list" class="flashcard-wrap" aria-live="polite"></div><div class="actions"><button id="prev" class="button" type="button">السابق</button><button id="next" class="button primary" type="button">التالي</button></div><button id="more" class="button" type="button" hidden>تحميل بطاقات إضافية</button></section>`);

const list = document.getElementById('list');
const status = document.getElementById('status');
const more = document.getElementById('more');
let rows = [], index = 0, cursor = null, loading = false;
let repositoriesPromise;
function getRepositories() { return repositoriesPromise ??= import('../repositories/resourceRepository.js').then(m => m.repositories); }

function render() {
  const item = rows[index];
  if (!item) { list.innerHTML = '<div class="empty">لا توجد بطاقات متاحة حاليًا.</div>'; document.getElementById('prev').disabled = true; document.getElementById('next').disabled = true; return; }
  document.getElementById('prev').disabled = false; document.getElementById('next').disabled = false;
  list.innerHTML = `<article class="flashcard"><span class="eyebrow">${index + 1} / ${rows.length}</span><h2>${escapeHtml(item.question || '')}</h2><details><summary>إظهار الإجابة</summary><p>${escapeHtml(item.answer || '')}</p>${item.explanation ? `<small>${escapeHtml(item.explanation)}</small>` : ''}</details></article>`;
}

async function loadMore() {
  if (loading || !cursor && rows.length) return;
  loading = true; more.disabled = true; status.textContent = 'جارٍ تحميل بطاقات إضافية...';
  try {
    const repositories = await getRepositories();
    const result = await repositories.flashcards.page({}, 30, cursor);
    rows.push(...result.rows); cursor = result.nextCursor; more.hidden = !result.hasMore; status.textContent = ''; render();
  } catch (error) { console.error('[flashcards.load]', error); status.textContent = 'تعذر تحميل البطاقات.'; }
  finally { loading = false; more.disabled = false; }
}

document.getElementById('prev').onclick = () => { if (rows.length) { index = index ? index - 1 : rows.length - 1; render(); } };
document.getElementById('next').onclick = () => { if (rows.length) { index = index + 1 < rows.length ? index + 1 : 0; render(); } };
more.onclick = loadMore;
loadMore();
