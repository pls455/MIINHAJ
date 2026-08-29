import { watchAuth, login, logout, currentAdmin, can } from '../services/auth.js';
import { configs, setAdmin, getAdmin, allowed, canWrite, loadPage, persist, erase, stats, state, toPayload, initialValue } from './data.js';
import { updateStatus } from './audit.js';
import { renderBulk } from './bulk.js';
import { escapeHtml, setMessage, setBusy } from '../core/utils.js';

const root = document.getElementById('adminApp');
let currentRows = [];
let filter = {};

function nav() { return Object.entries(configs).filter(([k]) => allowed(k)).map(([k, v]) => `<button class="admin-nav" data-collection="${escapeHtml(k)}">${escapeHtml(v.label)}</button>`).join(''); }

function shell() {
  root.innerHTML = `<div class="admin-shell"><aside><a class="brand" href="../index.html"><img src="../assets/logo.svg" alt=""> مِنهَاج</a><div id="adminNav"><button class="admin-nav active" data-dashboard="1">نظرة عامة</button>${nav()}${can(getAdmin().role, 'content_admin') ? '<button class="admin-nav" data-bulk="1">Bulk Import</button>' : ''}</div><button id="logout" class="button">خروج</button></aside><section class="admin-main"><header class="admin-top"><div><span class="eyebrow">Minhaj 2.0</span><h1>لوحة الإدارة</h1></div><span id="who"></span></header><div id="adminContent"></div></section></div>`;
  document.getElementById('logout').onclick = logout;
  document.getElementById('adminNav').onclick = e => { const b = e.target.closest('button'); if (!b) return; if (b.dataset.dashboard) dashboard(); else if (b.dataset.bulk) renderBulk(document.getElementById('adminContent')); else { state.collection = b.dataset.collection; state.cursor = null; filter = {}; section(); } };
}

async function dashboard() {
  const c = document.getElementById('adminContent');
  c.innerHTML = '<div class="loading">جارٍ تحميل الإحصائيات...</div>';
  try {
    const s = await stats();
    c.innerHTML = `<div class="stat-grid">${Object.entries({ branches: 'الفروع', subjects: 'المواد', categories: 'التصنيفات', resources: 'المصادر', foundations: 'التأسيس', suggestions: 'اقتراحات معلقة', problemReports: 'بلاغات مفتوحة' }).map(([k, l]) => `<div class="stat"><span>${l}</span><b>${Number(s[k]) || 0}</b></div>`).join('')}</div><div class="card"><h2>Minhaj 2.0</h2><p>المحتوى يُحمّل عند الحاجة، والمصادر تستخدم cursor pagination. الكتابة محمية بـ Firestore Rules، والذكاء الاصطناعي يمر عبر Worker.</p></div>`;
  } catch (error) { console.error('[admin.dashboard]', error); c.innerHTML = '<div class="error-box">تعذر تحميل لوحة الإدارة.</div>'; }
}

function inputField(key, type, value) { const v = initialValue(type, value); if (type === 'checkbox') return `<label class="check"><input name="${escapeHtml(key)}" type="checkbox" ${v ? 'checked' : ''}> ${escapeHtml(key)}</label>`; return `<label>${escapeHtml(key)}${type === 'textarea' ? `<textarea name="${escapeHtml(key)}">${escapeHtml(v)}</textarea>` : `<input name="${escapeHtml(key)}" type="${type}" value="${escapeHtml(v)}">`}</label>`; }

async function section() {
  const c = document.getElementById('adminContent'), cfg = configs[state.collection], write = canWrite(state.collection);
  if (!allowed(state.collection)) { c.innerHTML = '<div class="error-box">ليس لديك صلاحية لهذا القسم.</div>'; return; }
  c.innerHTML = `<div class="section-head"><div><h2>${escapeHtml(cfg.label)}</h2><p class="muted">إدارة مقسمة، لا تحميل جماعي للبيانات.</p></div>${write ? '<button id="add" class="button primary">+ إضافة</button>' : ''}</div><div class="toolbar"><input id="adminSearch" placeholder="بحث..." autocomplete="off"><button id="searchBtn" class="button">بحث</button></div><div id="table" class="admin-table"></div><button id="more" class="button" hidden>تحميل المزيد</button><div id="editor"></div>`;
  if (write) document.getElementById('add').onclick = () => edit();
  document.getElementById('searchBtn').onclick = () => { filter = { search: document.getElementById('adminSearch').value.trim() }; state.cursor = null; load(true); };
  document.getElementById('more').onclick = () => load(false);
  await load(true);
}

async function load(reset = false) {
  const t = document.getElementById('table'); if (!t) return;
  if (reset) { state.cursor = null; t.innerHTML = ''; currentRows = []; }
  t.insertAdjacentHTML('beforeend', '<div class="loading" id="loadState">جارٍ التحميل...</div>');
  try {
    const r = await loadPage(state.collection, filter);
    document.getElementById('loadState')?.remove();
    currentRows = reset ? r.rows : [...currentRows, ...r.rows];
    const write = canWrite(state.collection);
    const html = r.rows.map(row => `<div class="admin-row"><div><b>${escapeHtml(row.title || row.name || row.question || row.id)}</b><small>${escapeHtml(row.status || row.type || row.description || '')}</small></div><div class="row-actions">${(state.collection === 'suggestions' || state.collection === 'problemReports') ? `<button class="button" data-status="${escapeHtml(row.id)}" data-next="${row.status === 'pending' ? 'approved' : row.status === 'open' ? 'resolved' : 'pending'}">تغيير الحالة</button>` : ''}${write ? `<button class="button" data-edit="${escapeHtml(row.id)}">تعديل</button><button class="button danger" data-delete="${escapeHtml(row.id)}">حذف</button>` : ''}</div></div>`).join('');
    if (reset) t.innerHTML = html || '<div class="empty">لا توجد نتائج.</div>'; else t.insertAdjacentHTML('beforeend', html);
    state.cursor = r.nextCursor; document.getElementById('more').hidden = !r.hasMore;
    t.onclick = async e => { const b = e.target.closest('button'); if (!b) return; try { if (b.dataset.edit) edit(b.dataset.edit); if (b.dataset.delete) { if (!confirm('تأكيد الحذف؟')) return; await erase(state.collection, b.dataset.delete); await load(true); } if (b.dataset.status) { await updateStatus(state.collection, b.dataset.status, b.dataset.next, getAdmin()); await load(true); } } catch (err) { console.error('[admin.action]', err); alert('تعذر تنفيذ العملية.'); } };
  } catch (e) { console.error('[admin.load]', e); document.getElementById('loadState')?.remove(); t.insertAdjacentHTML('beforeend', '<div class="error-box">تعذر تحميل القسم.</div>'); }
}

function edit(id = null) { const cfg = configs[state.collection]; if (!canWrite(state.collection)) return; const row = id ? currentRows.find(x => x.id === id) : {}; const editor = document.getElementById('editor'); editor.innerHTML = `<form class="form-card admin-editor" id="editForm"><div class="section-head"><h3>${id ? 'تعديل' : 'إضافة'} ${escapeHtml(cfg.label)}</h3><button type="button" id="close" class="button">إغلاق</button></div>${Object.entries(cfg.fields).map(([k, t]) => inputField(k, t, row[k])).join('')}<button class="button primary">حفظ</button><p id="editMsg" class="message"></p></form>`; document.getElementById('close').onclick = () => editor.replaceChildren(); document.getElementById('editForm').onsubmit = async e => { e.preventDefault(); const btn = e.submitter; setBusy(btn, true); try { await persist(state.collection, id, toPayload(state.collection, e.currentTarget)); setMessage(document.getElementById('editMsg'), 'تم الحفظ.'); editor.replaceChildren(); await load(true); } catch (err) { console.error('[admin.save]', err); setMessage(document.getElementById('editMsg'), 'تعذر الحفظ.', true); } finally { setBusy(btn, false); } }; }

function loginView(message = '') { root.innerHTML = `<main class="login"><div class="form-card"><img src="../assets/logo.svg" alt="" class="login-logo"><h1>دخول إدارة مِنهَاج</h1><label>البريد<input id="email" type="email" autocomplete="username" required></label><label>كلمة المرور<input id="password" type="password" autocomplete="current-password" required></label><button id="login" class="button primary">دخول</button><p id="msg" class="message">${escapeHtml(message)}</p></div></main>`; const submit = async () => { const button = document.getElementById('login'); const email = document.getElementById('email').value.trim(); const password = document.getElementById('password').value; if (!email || !password) return setMessage(document.getElementById('msg'), 'أدخل البريد وكلمة المرور.', true); setBusy(button, true); try { await login(email, password); } catch (err) { console.error('[admin.login]', err); setMessage(document.getElementById('msg'), 'بيانات الدخول غير صحيحة أو تعذر الاتصال.', true); } finally { setBusy(button, false); } }; document.getElementById('login').onclick = submit; document.getElementById('password').onkeydown = e => { if (e.key === 'Enter') submit(); }; }

watchAuth(async user => { if (!user) { loginView(); return; } try { const a = await currentAdmin(user); if (!a) { await logout(); loginView('الحساب غير مفعّل كأدمن.'); return; } setAdmin(a); shell(); document.getElementById('who').textContent = `${a.email} · ${a.role}`; dashboard(); } catch (e) { console.error('[admin.auth]', e); await logout(); loginView('تعذر التحقق من صلاحيات الحساب.'); } });
