import { mountShell } from '../components/layout.js';
import { escapeHtml } from '../core/utils.js';

mountShell('الفروع', '<div id="list" class="grid"></div><div id="pagination" class="actions"></div>');
const list = document.getElementById('list');
const pagination = document.getElementById('pagination');
let cursor = null;

async function load(reset = true) {
  if (reset) cursor = null;
  list.innerHTML = '<div class="loading">جاري تحميل الفروع...</div>';
  try {
    const { getPage } = await import('../repositories/resourceRepository.js');
    const page = await getPage('branches', { active: true }, 24, cursor);
    list.replaceChildren();
    if (!page.rows.length) list.innerHTML = '<div class="empty">لا توجد فروع متاحة.</div>';
    page.rows.forEach(x => {
      const card = document.createElement('a');
      card.className = 'card branch-card';
      card.href = `subjects.html?branch=${encodeURIComponent(x.id)}`;
      const icon = document.createElement('span'); icon.textContent = x.icon || '🌿';
      const title = document.createElement('h2'); title.textContent = x.name || 'بدون اسم';
      const desc = document.createElement('p'); desc.textContent = x.description || '';
      card.append(icon, title, desc); list.append(card);
    });
    pagination.replaceChildren();
    if (page.hasMore) {
      const next = document.createElement('button');
      next.className = 'button'; next.textContent = 'التالي';
      next.onclick = async () => { cursor = page.nextCursor; await load(false); };
      pagination.append(next);
    }
  } catch (e) {
    console.error(e);
    list.innerHTML = '<div class="error-box">تعذر تحميل الفروع. تأكد من الاتصال ثم حاول مرة أخرى.</div>';
  }
}

await load();
