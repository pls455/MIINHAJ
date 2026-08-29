import { escapeHtml } from '../core/utils.js';

export function navbar() {
  return `<header class="site-header">
    <a class="brand" href="index.html" aria-label="مِنهَاج - الصفحة الرئيسية"><img src="assets/logo.svg" alt=""><span>مِنهَاج</span></a>
    <div class="nav-actions">
      <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-navigation" aria-label="فتح القائمة">☰</button>
      <button class="theme-toggle" type="button" aria-label="تبديل المظهر">☾</button>
    </div>
    <nav id="site-navigation" aria-label="التنقل الرئيسي">
      <a href="branches.html">الفروع</a><a href="subjects.html">المواد</a><a href="resources.html">المصادر</a><a href="foundation.html">التأسيس</a><a href="solutions.html">الحلول</a><a href="flashcards.html">البطاقات</a><a href="tools.html">الأدوات</a><a href="ai.html">الذكاء</a><a href="suggestions.html">اقتراح</a>
    </nav>
  </header>`;
}

export function footer() {
  return `<footer><div><strong>مِنهَاج | Minhaj</strong><p>مصادر تعليمية مرتبة لطلاب التوجيهي.</p></div><a href="admin/index.html">الإدارة</a></footer>`;
}

export function mountShell(title, content) {
  document.title = `${title} | مِنهَاج`;
  document.getElementById('app').innerHTML = `${navbar()}<main class="container"><div class="page-head"><span class="eyebrow">مِنهَاج</span><h1>${escapeHtml(title)}</h1></div>${content}</main>${footer()}`;
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-navigation');
  menu?.addEventListener('click', () => {
    const open = nav?.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(Boolean(open)));
  });
  const saved = localStorage.getItem('minhaj-theme');
  if (saved) document.documentElement.dataset.theme = saved;
  document.querySelector('.theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('minhaj-theme', next);
  });
}
