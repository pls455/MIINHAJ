import { requireAuthenticatedAdmin, signOutUser } from '../services/firebase/auth.js';
import { permissions } from '../services/firebase/permissions.js';

const content = document.getElementById('adminContent');
const identity = document.getElementById('adminIdentity');

document.getElementById('logoutButton')?.addEventListener('click', async () => {
  await signOutUser();
  location.href = '../admin/index.html';
});

function card(label, value) {
  return `<article class="admin-stat"><span>${label}</span><strong>${value.toLocaleString('ar-EG')}</strong></article>`;
}

function sectionLinks(admin) {
  const links = [];
  if (permissions.review(admin.role)) links.push('<a class="admin-nav-card" href="suggestions.html">الاقتراحات والبلاغات</a>');
  if (permissions.content(admin.role)) {
    links.push('<a class="admin-nav-card" href="resources.html">المصادر</a>');
    links.push('<a class="admin-nav-card" href="subjects.html">المواد</a>');
    links.push('<a class="admin-nav-card" href="branches.html">الفروع</a>');
    links.push('<a class="admin-nav-card" href="categories.html">التصنيفات</a>');
    links.push('<a class="admin-nav-card" href="foundations.html">التأسيس</a>');
    links.push('<a class="admin-nav-card" href="flashcards.html">Flashcards</a>');
    links.push('<a class="admin-nav-card" href="templates.html">Templates</a>');
    links.push('<a class="admin-nav-card" href="bulk-import.html">Bulk Import</a>');
  }
  if (permissions.system(admin.role)) links.push('<a class="admin-nav-card" href="logs.html">سجلات الإدارة</a>');
  return links.join('');
}

async function load() {
  try {
    const { user, admin } = await requireAuthenticatedAdmin();
    identity.textContent = `${user.email || admin.email || 'حساب الإدارة'} • ${admin.role || 'reviewer'}`;

    const { count } = await import('../repositories/resourceRepository.js');
    const [branches, subjects, categories, resources, foundations] = await Promise.all([
      count('branches', { active: true }),
      count('subjects', { active: true }),
      count('categories', { active: true }),
      count('resources', { active: true }),
      count('foundations', { active: true })
    ]);

    content.innerHTML = `<div class="admin-stats">${card('الفروع', branches)}${card('المواد', subjects)}${card('التصنيفات', categories)}${card('المصادر', resources)}${card('التأسيس', foundations)}</div><nav class="admin-nav-grid" aria-label="أقسام الإدارة">${sectionLinks(admin)}</nav>`;
  } catch (error) {
    console.error('[admin-dashboard]', error);
    content.innerHTML = '<div class="error-box">تعذر التحقق من صلاحيات الإدارة أو تحميل الإحصائيات.</div>';
  }
}

load();
