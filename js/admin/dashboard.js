import { requireAuthenticatedAdmin, signOutUser } from '../services/firebase/auth.js';
import { permissions } from '../services/firebase/permissions.js';

const content = document.getElementById('adminContent');
const identity = document.getElementById('adminIdentity');

function card(label, value) {
  return `<article class="admin-stat"><span>${label}</span><strong>${Number(value || 0).toLocaleString('ar-EG')}</strong></article>`;
}

function sectionLinks(admin) {
  const links = [];
  if (permissions.review(admin.role)) {
    links.push('<a class="admin-nav-card" href="suggestions.html">الاقتراحات</a>');
    links.push('<a class="admin-nav-card" href="problem-reports.html">بلاغات المشاكل</a>');
  }
  if (permissions.content(admin.role)) {
    links.push('<a class="admin-nav-card" href="resources.html">المصادر</a>');
    links.push('<a class="admin-nav-card" href="solutions.html">الحلول</a>');
    links.push('<a class="admin-nav-card" href="subjects.html">المواد</a>');
    links.push('<a class="admin-nav-card" href="branches.html">الفروع</a>');
    links.push('<a class="admin-nav-card" href="categories.html">التصنيفات</a>');
    links.push('<a class="admin-nav-card" href="foundations.html">التأسيس</a>');
    links.push('<a class="admin-nav-card" href="flashcards.html">البطاقات التعليمية</a>');
    links.push('<a class="admin-nav-card" href="content-manager.html">مدير المحتوى</a>');
  }
  return links.join('');
}

document.getElementById('logoutButton')?.addEventListener('click', async () => {
  await signOutUser();
  location.href = 'index.html';
});

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
      count('foundations', { active: true }),
    ]);

    content.innerHTML = `<div class="admin-stats">${card('الفروع', branches)}${card('المواد', subjects)}${card('التصنيفات', categories)}${card('المصادر', resources)}${card('التأسيس', foundations)}</div><nav class="admin-nav-grid" aria-label="أقسام الإدارة">${sectionLinks(admin)}</nav>`;
  } catch (error) {
    console.error('[admin-dashboard]', error);
    content.innerHTML = '<div class="error-box">تعذر التحقق من صلاحيات الإدارة أو تحميل الإحصائيات.</div>';
  }
}

load();
