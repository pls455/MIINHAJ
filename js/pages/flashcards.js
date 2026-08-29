import { mountShell } from '../components/layout.js';
import { repositories } from '../repositories/resourceRepository.js';
import { escapeHtml } from '../core/utils.js';

mountShell('البطاقات', `<div id="list" class="flashcard-wrap" aria-live="polite"></div><div class="actions"><button id="prev" class="button" type="button">السابق</button><button id="next" class="button primary" type="button">التالي</button></div>`);
const list = document.getElementById('list');
let rows = [], index = 0;

function render() {
  const item = rows[index];
  list.innerHTML = item
    ? `<article class="flashcard"><span class="eyebrow">${index + 1} / ${rows.length}</span><h2>${escapeHtml(item.question || '')}</h2><details><summary>إظهار الإجابة</summary><p>${escapeHtml(item.answer || '')}</p>${item.explanation ? `<small>${escapeHtml(item.explanation)}</small>` : ''}</details></article>`
    : '<div class="empty">لا توجد بطاقات متاحة حاليًا.</div>';
}

document.getElementById('prev').onclick = () => { if (rows.length) { index = (index - 1 + rows.length) % rows.length; render(); } };
document.getElementById('next').onclick = () => { if (rows.length) { index = (index + 1) % rows.length; render(); } };

try {
  const result = await repositories.flashcards.page({}, 50, null);
  rows = result.rows;
} catch (error) {
  console.error('[flashcards]', error);
}
render();
