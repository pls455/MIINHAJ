import { requireAuthenticatedAdmin, logout } from '../services/firebase/auth.js';
import { repositories } from '../repositories/resourceRepository.js';
import { can } from '../services/firebase/permissions.js';

const content = document.getElementById('adminContent');
const identity = document.getElementById('adminIdentity');

document.getElementById('logoutButton').addEventListener('click', async () => {
  await logout();
  location.href = '../admin/index.html';
});

function card(label, value) {
  return `<article class="admin-stat"><span>${label}</span><strong>${value}</strong></article>`;
}

function sectionLinks(admin) {
  const links = [];
  if (can(admin.role, 'review')) links.push('<a class="admin-nav-card" href="suggestions.html">الاقتراحات والبلاغات</a>');
  if (can(admin.role, 'manageContent')) {
    links.push('<a class="admin-nav-card" href="resources.html">المصادر</a>');
    links.push('<a class="admin-nav-card" href="subjects.html">المواد</a>');
    links.push('<a class="admin-nav-card" href="branches.html">الفروع</a>');
    links.push('<a class="admin-nav-card" href="categories.html">التصنيفات</a>');
    links.push('<a class="admin-nav-card" href="foundations.html">التأسيس</a>');
    links.push('<a class="admin-nav-card" href="flashcards.html">Flashcards</a>');
    links.push('<a class="admin-nav-card" href="templates.html">Templates</a>');
    links.push('<a class="admin-nav-card" href="bulk-import.html">Bulk Import</a>');
  }
  if (can(admin.role, 'manageAdmins')) links.push('<a class="admin-nav-card" href="logs.html">سجلات الإدارة</a>');
  return links.join('');
}

async function load() {
  try {
    const admin = await requireAuthenticatedAdmin();
    identity.textContent = `${admin.email || 'حساب الإدارة'} • ${admin.role}`;
    const [branches, subjects, categories, resources, foundations] = await Promise.all([
      repositories.branches.page({}, 1),
      repositories.subjects.page({}, 1),
      repositories.categories.page({}, 1),
      repositories.resources.getResources({}, 1),
      repositories.foundations.page({}, 1)
    ]);
    content.innerHTML = `<div class="admin-stats">${card('الفروع', branches.rows.length)}${card('المواد', subjects.rows.length)}${card('التصنيفات', categories.rows.length)}${card('المصادر', resources.rows.length)}${card('التأسيس', foundations.rows.length)}</div><nav class="admin-nav-grid" aria-label="أقسام الإدارة">${sectionLinks(admin)}</nav>`;
  } catch (error) {
    console.error('[admin-dashboard]', error);
    content.innerHTML = '<div class="error-box">تعذر التحقق من صلاحيات الإدارة.</div>';
  }
}

load();
