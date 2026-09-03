import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { signOutUser } from '../services/firebase/auth.js';
import { collection, getDocs, query, orderBy, limit, startAfter, where, countFromServer } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';

const content = document.getElementById('studentsContent');
const identity = document.getElementById('adminIdentity');
const PAGE_SIZE = 50;
let students = [];
let lastDoc = null;
let hasMore = true;
let loadingMore = false;
let totalCount = null;
let todayCount = null;
let identityCount = null;

const esc = value => String(value ?? '').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
const dateValue = value => value?.toDate ? value.toDate() : value ? new Date(value) : null;
const dateText = value => { const d=dateValue(value); return d && !Number.isNaN(d.getTime()) ? d.toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'}) : 'غير متوفر'; };

function filteredStudents() {
  const term = (document.getElementById('studentSearch')?.value || '').trim().toLowerCase();
  return term ? students.filter(s => [s.name,s.email,s.identityNumber,s.id].some(v => String(v||'').toLowerCase().includes(term))) : students;
}

function render() {
  const term = (document.getElementById('studentSearch')?.value || '').trim().toLowerCase();
  const filtered = filteredStudents();
  const rows = filtered.map(s => `
    <article class="admin-row student-row">
      <div class="student-main">
        <b>${esc(s.name || 'بدون اسم')}</b>
        <small>${esc(s.email || 'بدون بريد')} · ${esc(s.identityNumber || 'لا توجد هوية')}</small>
        <small>التسجيل: ${esc(dateText(s.createdAt))} · آخر دخول: ${esc(dateText(s.lastLoginAt))}</small>
      </div>
      <div class="row-actions"><button class="button button--secondary student-details" data-id="${esc(s.id)}" type="button">عرض كل البيانات</button></div>
    </article>`).join('');
  const total = totalCount ?? students.length;
  const today = todayCount ?? students.filter(s => { const d=dateValue(s.createdAt); const t=new Date(); t.setHours(0,0,0,0); return d && d >= t; }).length;
  const withIdentity = identityCount ?? students.filter(s=>s.identityNumber).length;
  content.innerHTML = `
    <div class="stat-grid">
      <article class="stat"><span>إجمالي الطلاب</span><b>${Number(total).toLocaleString('ar-EG')}</b></article>
      <article class="stat"><span>المسجلون اليوم</span><b>${Number(today).toLocaleString('ar-EG')}</b></article>
      <article class="stat"><span>نتيجة البحث</span><b>${filtered.length.toLocaleString('ar-EG')}</b></article>
      <article class="stat"><span>الطلاب ذوو الهوية</span><b>${Number(withIdentity).toLocaleString('ar-EG')}</b></article>
    </div>
    <div class="toolbar"><input id="studentSearch" type="search" placeholder="ابحث بالاسم أو البريد أو رقم الهوية أو UID" value="${esc(term)}"><button id="exportStudents" class="button" type="button">تصدير CSV</button></div>
    <div class="section-head"><h2>سجل الطلاب</h2><span class="message">تم تحميل ${students.length.toLocaleString('ar-EG')} من ${Number(total).toLocaleString('ar-EG')} طالب</span></div>
    <div class="admin-table">${rows || '<div class="loading">لا توجد نتائج.</div>'}</div>
    ${hasMore && !term ? '<div class="toolbar"><button id="loadMoreStudents" class="button button--secondary" type="button">تحميل المزيد</button></div>' : ''}`;
  content.querySelector('#studentSearch')?.addEventListener('input', render);
  content.querySelector('#exportStudents')?.addEventListener('click', exportCsv);
  content.querySelector('#loadMoreStudents')?.addEventListener('click', loadMore);
  content.querySelectorAll('.student-details').forEach(btn => btn.addEventListener('click', () => showDetails(students.find(s => s.id === btn.dataset.id))));
}

function showDetails(student) {
  if (!student) return;
  document.getElementById('studentDetailModal')?.remove();
  const fields = [['UID', student.id],['الاسم', student.name],['البريد الإلكتروني', student.email],['رقم الهوية', student.identityNumber || 'غير مسجل'],['الدور', student.role],['تاريخ التسجيل', dateText(student.createdAt)],['آخر دخول', dateText(student.lastLoginAt)],['آخر تحديث', dateText(student.updatedAt)]];
  const modal = document.createElement('div'); modal.id='studentDetailModal'; modal.className='student-modal';
  modal.innerHTML = `<div class="student-modal-card" role="dialog" aria-modal="true" aria-label="بيانات الطالب"><div class="section-head"><h2>بيانات الطالب</h2><button class="button button--secondary" id="closeStudentModal" type="button">إغلاق</button></div><div class="student-details-grid">${fields.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v || 'غير متوفر')}</b></div>`).join('')}</div></div>`;
  document.body.append(modal);
  modal.querySelector('#closeStudentModal').addEventListener('click',()=>modal.remove());
  modal.addEventListener('click', e=>{if(e.target===modal) modal.remove();});
}

function exportCsv() {
  const headers=['uid','name','email','identityNumber','role','createdAt','lastLoginAt','updatedAt'];
  const lines=[headers,...filteredStudents().map(s=>headers.map(h=>{const v=h.endsWith('At')?dateText(s[h]):(s[h]??'');return String(v).replaceAll('"','""');}))].map(row=>row.map(v=>`"${v}"`).join(','));
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`minhaj-students-${new Date().toISOString().slice(0,10)}.csv`; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

async function loadCounts() {
  const users = collection(db, 'users');
  const start = new Date(); start.setHours(0,0,0,0);
  const [totalSnap, todaySnap, identitySnap] = await Promise.all([
    countFromServer(users),
    countFromServer(query(users, where('createdAt', '>=', start))),
    countFromServer(query(users, where('identityNumber', '!=', '')))
  ]);
  totalCount = totalSnap.data().count;
  todayCount = todaySnap.data().count;
  identityCount = identitySnap.data().count;
}

async function fetchPage(after = null) {
  const base = query(collection(db,'users'), orderBy('createdAt','desc'), limit(PAGE_SIZE));
  const pageQuery = after ? query(collection(db,'users'), orderBy('createdAt','desc'), startAfter(after), limit(PAGE_SIZE)) : base;
  const snap = await getDocs(pageQuery);
  lastDoc = snap.docs.at(-1) || lastDoc;
  hasMore = snap.docs.length === PAGE_SIZE;
  return snap.docs.map(d=>({id:d.id,...d.data()}));
}

async function loadMore() {
  if (loadingMore || !hasMore) return;
  loadingMore = true;
  const button = document.getElementById('loadMoreStudents');
  if (button) { button.disabled = true; button.textContent = 'جارٍ التحميل...'; }
  try {
    const next = await fetchPage(lastDoc);
    const existing = new Set(students.map(s=>s.id));
    students.push(...next.filter(s=>!existing.has(s.id)));
    render();
  } catch (error) {
    console.error('[admin-students] load more', error);
    if (button) { button.disabled = false; button.textContent = 'تعذر التحميل، أعد المحاولة'; }
  } finally { loadingMore = false; }
}

document.getElementById('logoutButton')?.addEventListener('click', async () => { await signOutUser(); location.href='index.html'; });

async function load(){
  try {
    const { user, admin } = await requireAdmin(ROLES.SUPER_ADMIN);
    identity.textContent=`${user.email || admin.email || 'حساب الإدارة'} • Super Admin`;
    const [firstPage] = await Promise.all([fetchPage(), loadCounts()]);
    students=firstPage;
    render();
  } catch(error){
    console.error('[admin-students]',error);
    const code=error?.code || error?.message || '';
    const isAuth=['AUTH_REQUIRED','ADMIN_ACCESS_REQUIRED','INSUFFICIENT_PERMISSIONS'].includes(code);
    content.innerHTML=`<div class="error-box" role="alert"><h2>${isAuth ? 'لا تملك صلاحية الوصول' : 'تعذر تحميل سجل الطلاب'}</h2><p>${isAuth ? 'هذه الصفحة متاحة لـ Super Admin فقط.' : 'تحقق من نشر قواعد Firestore الحالية، ثم أعد تحميل الصفحة.'}</p><p class="muted">${esc(code)}</p></div>`;
  }
}
load();
