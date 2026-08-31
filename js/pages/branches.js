import { mountShell } from '../components/layout.js';

mountShell('الفروع', '<div id="list" class="grid"></div><div id="pagination" class="actions"></div>');
const list = document.getElementById('list');
const pagination = document.getElementById('pagination');
let cursor = null;
let loading = false;

function showState(className, text) {
  const state = document.createElement('div');
  state.className = className;
  state.setAttribute('role', className === 'error-box' ? 'alert' : 'status');
  state.textContent = text;
  list.replaceChildren(state);
}

async function load(reset = true) {
  if (loading) return;
  loading = true;
  if (reset) cursor = null;
  pagination.replaceChildren();
  showState('loading', 'جاري تحميل الفروع...');
  try {
    const { getPage } = await import('../repositories/resourceRepository.js');
    const page = await getPage('branches', { active: true }, 24, cursor);
    list.replaceChildren();
    if (!page.rows.length) {
      showState('empty', 'لا توجد فروع متاحة.');
      return;
    }
    page.rows.forEach(x => {
      const card = document.createElement('a');
      card.className = 'card branch-card';
      card.href = `subjects.html?branch=${encodeURIComponent(x.id)}`;
      const icon = document.createElement('span'); icon.textContent = x.icon || '🌿';
      const title = document.createElement('h2'); title.textContent = x.name || 'بدون اسم';
      const desc = document.createElement('p'); desc.textContent = x.description || '';
      card.append(icon, title, desc); list.append(card);
    });
    if (page.hasMore) {
      const next = document.createElement('button');
      next.className = 'button'; next.type = 'button'; next.textContent = 'التالي';
      next.addEventListener('click', () => { cursor = page.nextCursor; load(false); });
      pagination.append(next);
    }
  } catch (e) {
    console.error('[branches]', e);
    showState('error-box', 'تعذر تحميل الفروع. تأكد من الاتصال ثم حاول مرة أخرى.');
  } finally {
    loading = false;
  }
}

await load();
