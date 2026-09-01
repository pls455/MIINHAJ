import { requireAuthenticatedAdmin, signOutUser } from '../services/firebase/auth.js';
import { collection, getDocs, query, orderBy } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';

const content = document.getElementById('studentsContent');
const identity = document.getElementById('adminIdentity');
let students = [];

const esc = value => String(value ?? '').replace(/[&<>\"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
const dateValue = value => value?.toDate ? value.toDate() : value ? new Date(value) : null;
const dateText = value => { const d=dateValue(value); return d && !Number.isNaN(d.getTime()) ? d.toLocaleString('ar-EG',{dateStyle:'medium',timeStyle:'short'}) : 'غير متوفر'; };

function render() {
  const term = (document.getElementById('studentSearch')?.value || '').trim().toLowerCase();
  const filtered = students.filter(s => [s.name,s.email,s.identityNumber,s.id].some(v => String(v||'').toLowerCase().includes(term)));
  const rows = filtered.map((s, i) => `
    <article class="admin-row student-row">
      <div class="student-main">
        <b>${esc(s.name || 'بدون اسم')}</b>
        <small>${esc(s.email || 'بدون بريد')} · ${esc(s.identityNumber || 'لا توجد هوية')}</small>
        <small>التسجيل: ${esc(dateText(s.createdAt))} · آخر دخول: ${esc(dateText(s.lastLoginAt))}</small>
      </div>
      <div class="row-actions">
        <button class="button button--secondary student-details" data-index="${students.indexOf(s)}" type="button">عرض كل البيانات</button>
      </div>
    </article>`).join('');
  const total = students.length;
  const today = new Date(); today.setHours(0,0,0,0);
  const todayCount = students.filter(s => { const d=dateValue(s.createdAt); return d && d >= today; }).length;
  content.innerHTML = `
    <div class="stat-grid">
      <article class="stat"><span>إجمالي الطلاب</span><b>${total.toLocaleString('ar-EG')}</b></article>
      <article class="stat"><span>المسجلون اليوم</span><b>${todayCount.toLocaleString('ar-EG')}</b></article>
      <article class="stat"><span>نتيجة البحث</span><b>${filtered.length.toLocaleString('ar-EG')}</b></article>
      <article class="stat"><span>الطلاب ذوو الهوية</span><b>${students.filter(s=>s.identityNumber).length.toLocaleString('ar-EG')}</b></article>
    </div>
    <div class="toolbar">
      <input id="studentSearch" type="search" placeholder="ابحث بالاسم أو البريد أو رقم الهوية أو UID" value="${esc(term)}">
      <button id="exportStudents" class="button" type="button">تصدير CSV</button>
    </div>
    <div class="section-head"><h2>سجل الطلاب</h2><span class="message">البيانات المتاحة في ملف الطالب</span></div>
    <div class="admin-table">${rows || '<div class="loading">لا توجد نتائج.</div>'}</div>`;
  content.querySelector('#studentSearch')?.addEventListener('input', render);
  content.querySelector('#exportStudents')?.addEventListener('click', exportCsv);
  content.querySelectorAll('.student-details').forEach(btn => btn.addEventListener('click', () => showDetails(students[Number(btn.dataset.index)])));
}

function showDetails(student) {
  const existing = document.getElementById('studentDetailModal');
  existing?.remove();
  const fields = [
    ['UID', student.id], ['الاسم', student.name], ['البريد الإلكتروني', student.email],
    ['رقم الهوية', student.identityNumber || 'غير مسجل'], ['الدور', student.role],
    ['تاريخ التسجيل', dateText(student.createdAt)], ['آخر دخول', dateText(student.lastLoginAt)], ['آخر تحديث', dateText(student.updatedAt)]
  ];
  const modal = document.createElement('div'); modal.id='studentDetailModal'; modal.className='student-modal';
  modal.innerHTML = `<div class="student-modal-card" role="dialog" aria-modal="true" aria-label="بيانات الطالب"><div class="section-head"><h2>بيانات الطالب</h2><button class="button button--secondary" id="closeStudentModal" type="button">إغلاق</button></div><div class="student-details-grid">${fields.map(([k,v])=>`<div><small>${esc(k)}</small><b>${esc(v || 'غير متوفر')}</b></div>`).join('')}</div></div>`;
  document.body.append(modal);
  modal.querySelector('#closeStudentModal').addEventListener('click',()=>modal.remove());
  modal.addEventListener('click', e=>{if(e.target===modal) modal.remove();});
}

function exportCsv() {
  const headers=['uid','name','email','identityNumber','role','createdAt','lastLoginAt','updatedAt'];
  const lines=[headers,...students.map(s=>headers.map(h=>{ const v=h.endsWith('At')?dateText(s[h]):(s[h]??''); return String(v).replaceAll('"','""'); }))]
    .map(row=>row.map(v=>`"${v}"`).join(','));
  const blob=new Blob(['\uFEFF'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`minhaj-students-${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url);
}

document.getElementById('logoutButton')?.addEventListener('click', async () => { await signOutUser(); location.href='index.html'; });

async function load(){
  try {
    const { user, admin } = await requireAuthenticatedAdmin();
    if (!['super_admin','superadmin','admin'].includes(admin.role)) throw new Error('INSUFFICIENT_PERMISSIONS');
    identity.textContent=`${user.email || admin.email || 'حساب الإدارة'} • ${admin.role}`;
    const snap=await getDocs(query(collection(db,'users'),orderBy('createdAt','desc')));
    students=snap.docs.map(d=>({id:d.id,...d.data()}));
    render();
  } catch(error){
    console.error('[admin-students]',error);
    content.innerHTML='<div class="error-box" role="alert">لا يمكن عرض سجل الطلاب. يجب أن يكون الحساب Super Admin وأن تكون صلاحيات Firestore منشورة.</div>';
  }
}
load();
