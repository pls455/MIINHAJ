import { toggleTheme } from "../core/theme.js";

const links = [
  ["الفروع", "branches.html"],
  ["المصادر", "resources.html"],
  ["التأسيس", "foundation.html"],
  ["الحلول", "solutions.html"],
  ["البطاقات", "flashcards.html"],
  ["الأدوات", "tools.html"],
  ["مساعد AI", "ai.html"],
];

export function renderNavbar(root = document.body) {
  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="brand" href="index.html" aria-label="مِنهَاج - الصفحة الرئيسية">
      <span aria-hidden="true">مِ</span><span>نهَاج</span>
    </a>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-navigation">القائمة</button>
    <nav id="main-navigation" aria-label="التنقل الرئيسي">
      ${links.map(([label, href]) => `<a href="${href}">${label}</a>`).join("")}
    </nav>
    <button class="theme-toggle" type="button" aria-label="تبديل المظهر">◐</button>
  `;

  const menuButton = header.querySelector(".menu-toggle");
  const navigation = header.querySelector("nav");
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    navigation.classList.toggle("is-open", !open);
  });
  header.querySelector(".theme-toggle").addEventListener("click", toggleTheme);
  root.prepend(header);
  return header;
}
