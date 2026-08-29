import { renderNavbar, renderFooter } from "../components/layout.js";
import { requireAuth, currentAdmin } from "../services/auth.js";
import { getResources, getResourceCount } from "../repositories/resourceRepository.js";
import { getBranches } from "../repositories/branchRepository.js";
import { getSubjects } from "../repositories/subjectRepository.js";
import { getCategories } from "../repositories/categoryRepository.js";
import { ROLES, hasRole } from "../core/constants.js";

const PAGE_SIZE = 24;
let cursor = null;
let nextCursor = null;
let loading = false;

const $ = (id) => document.getElementById(id);

async function guard() {
  const user = await requireAuth();
  const admin = await currentAdmin();
  if (!admin || !hasRole(admin.role, ROLES.REVIEWER)) throw new Error("INSUFFICIENT_PERMISSIONS");
  return user;
}

function filters() {
  return {
    branchId: $("resource-branch").value || null,
    subjectId: $("resource-subject").value || null,
    categoryId: $("resource-category").value || null,
    type: $("resource-type").value || null,
    active: $("resource-active").value === "" ? null : $("resource-active").value === "true",
    search: $("resource-search").value.trim() || null
  };
}

function option(select, value, label) {
  const o = document.createElement("option"); o.value = value; o.textContent = label; select.append(o);
}

async function loadFilters() {
  const [branches, subjects, categories] = await Promise.all([getBranches(), getSubjects(), getCategories()]);
  branches.forEach(x => option($("resource-branch"), x.id, x.name));
  subjects.forEach(x => option($("resource-subject"), x.id, x.name));
  categories.forEach(x => option($("resource-category"), x.id, x.name));
  const types = [...new Set((await getResources({ limit: 50 })).items.map(x => x.type).filter(Boolean))].sort();
  types.forEach(x => option($("resource-type"), x, x));
}

function render(items) {
  const root = $("resource-list"); root.replaceChildren();
  if (!items.length) { root.innerHTML = '<div class="empty">لا توجد مصادر مطابقة.</div>'; return; }
  for (const item of items) {
    const article = document.createElement("article"); article.className = "card resource-card";
    const title = document.createElement("h3"); title.textContent = item.title || "مصدر بدون عنوان";
    const meta = document.createElement("p"); meta.textContent = [item.type, item.active === false ? "معطّل" : "مفعّل"].filter(Boolean).join(" • ");
    const cover = document.createElement("div"); cover.className = "resource-cover"; cover.textContent = "📚";
    const body = document.createElement("div"); body.append(title, meta);
    article.append(cover, body);
    root.append(article);
  }
}

async function load(reset = false) {
  if (loading) return; loading = true;
  if (reset) { cursor = null; nextCursor = null; }
  $("resource-list").innerHTML = '<div class="empty">جاري التحميل...</div>';
  try {
    const result = await getResources({ ...filters(), limit: PAGE_SIZE, cursor });
    nextCursor = result.nextCursor;
    render(result.items);
    const pager = $("resource-pagination"); pager.replaceChildren();
    const prev = document.createElement("button"); prev.className = "button"; prev.textContent = "السابق"; prev.disabled = !cursor;
    const next = document.createElement("button"); next.className = "button"; next.textContent = "التالي"; next.disabled = !nextCursor;
    prev.onclick = () => { cursor = null; load(true); };
    next.onclick = () => { cursor = nextCursor; load(false); };
    pager.append(prev, next);
  } catch (error) {
    console.error("Admin resources load failed", error);
    $("resource-list").innerHTML = '<div class="error-box">تعذر تحميل المصادر. تحقق من صلاحيات Firebase ثم أعد المحاولة.</div>';
  } finally { loading = false; }
}

await guard();
renderNavbar(); renderFooter();
await loadFilters();
await load(true);
let timer; $("resource-search").addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => load(true), 350); });
for (const id of ["resource-branch","resource-subject","resource-category","resource-type","resource-active"]) $(id).addEventListener("change", () => load(true));
