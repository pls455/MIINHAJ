import { requireAuthenticatedAdmin, signOutUser } from '../services/firebase/auth.js';
import { permissions } from '../services/firebase/permissions.js';

const content = document.getElementById('adminContent');
const identity = document.getElementById('adminIdentity');

function card(label, value) {
  const article = document.createElement('article');
  article.className = 'admin-stat';
  const span = document.createElement('span'); span.textContent = label;
  const strong = document.createElement('strong'); strong.textContent = Number(value || 0).toLocaleString('ar-EG');
  article.append(span, strong);
  return article;
}

function sectionLinks(admin) {
  const nav = document.createElement('nav');
  nav.className = 'admin-nav-grid';
  nav.setAttribute('aria-label', 'أقسام الإدارة');
  const links = [];
  if (permissions.review(admin.role)) links.push(['suggestions.html','الاقتراحات'],['problem-reports.html','بلاغات المشاكل']);
  if (permissions.content(admin.role)) links.push(['resources.html','المصادر'],['solutions.html','الحلول'],['subjects.html','المواد'],['branches.html','الفروع'],['categories.html','التصنيفات'],['foundations.html','التأسيس'],['flashcards.html','البطاقات التعليمية'],['content-manager.html','مدير المحتوى']);
  links.forEach(([href, label]) => { const a = document.createElement('a'); a.className = 'admin-nav-card'; a.href = href; a.textContent = label; nav.append(a); });
  return nav;
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
      count('branches', { active: true }), count('subjects', { active: true }), count('categories', { active: true }), count('resources', { active: true }), count('foundations', { active: true })
    ]);
    const stats = document.createElement('div'); stats.className = 'admin-stats';
    [['الفروع',branches],['المواد',subjects],['التصنيفات',categories],['المصادر',resources],['التأسيس',foundations]].forEach(([label,value]) => stats.append(card(label,value)));
    content.replaceChildren(stats, sectionLinks(admin));
  } catch (error) {
    console.error('[admin-dashboard]', error);
    const box = document.createElement('div'); box.className = 'error-box'; box.setAttribute('role','alert'); box.textContent = 'تعذر التحقق من صلاحيات الإدارة أو تحميل الإحصائيات.';
    content.replaceChildren(box);
  }
}
load();
