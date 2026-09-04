import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { getAdminApplications, reviewAdminApplication, getAdminApplicationQuestions } from '../repositories/adminApplicationRepository.js';
import { renderNavbar, renderFooter } from '../components/layout.js';

await requireAdmin(ROLES.SUPER_ADMIN);
renderNavbar(); renderFooter();
const $ = id => document.getElementById(id);
const questions = getAdminApplicationQuestions();
const roleLabels = { reviewer: 'مراجع', content_admin: 'مدير محتوى', super_admin: 'سوبر أدمن' };

function message(text, error=false) { const el=document.createElement('div'); el.className=error?'message error':'message'; el.textContent=text; el.setAttribute('role',error?'alert':'status'); return el; }
function render(items) {
  const root=$('applications-list'); root.replaceChildren();
  if(!items.length){ root.append(message('لا توجد طلبات بهذه الحالة.')); return; }
  for(const item of items){
    const card=document.createElement('article'); card.className='card admin-row';
    const info=document.createElement('div');
    const h=document.createElement('h3'); h.textContent=item.studentName||'طالب بدون اسم';
    const meta=document.createElement('p'); meta.textContent=`البريد: ${item.studentEmail||'غير متوفر'} • الهوية: ${item.studentId||'غير متوفرة'} • الحالة: ${item.status||'pending'}`;
    info.append(h,meta);
    for(const q of questions){ const p=document.createElement('p'); const strong=document.createElement('strong'); strong.textContent=`${q.label} `; p.append(strong,document.createTextNode(item.answers?.[q.id]||'—')); info.append(p); }
    if(item.reviewerNote){ const note=document.createElement('p'); note.textContent=`ملاحظة المراجع: ${item.reviewerNote}`; info.append(note); }
    const actions=document.createElement('div'); actions.className='actions';
    if(item.status==='pending'){
      const role=document.createElement('select'); role.innerHTML='<option value="reviewer">مراجع</option><option value="content_admin">مدير محتوى</option><option value="super_admin">سوبر أدمن</option>';
      const note=document.createElement('textarea'); note.maxLength=1000; note.placeholder='ملاحظة اختيارية';
      const approve=document.createElement('button'); approve.className='button primary'; approve.type='button'; approve.textContent='قبول ومنح الصلاحية'; approve.onclick=()=>change(item,'approved',role.value,note.value);
      const reject=document.createElement('button'); reject.className='button'; reject.type='button'; reject.textContent='رفض الطلب'; reject.onclick=()=>change(item,'rejected','',note.value);
      actions.append(role,note,approve,reject);
    }
    card.append(info,actions); root.append(card);
  }
}
async function change(item,status,role,note){
  if(!confirm(status==='approved'?`تأكيد قبول طلب ${item.studentName||''} ومنحه صلاحية «${roleLabels[role]}»؟`:'تأكيد رفض الطلب؟')) return;
  try { await reviewAdminApplication(item.id,status,role,note); await load(); }
  catch(error){ console.error('[admin/applications.review]',error); alert('تعذر تحديث الطلب. تحقق من الصلاحيات وحاول مرة أخرى.'); }
}
async function load(){ $('status').replaceChildren(message('جاري التحميل...')); try{ const items=await getAdminApplications({status:$('filter').value||null}); render(items); $('status').replaceChildren(); }catch(error){console.error('[admin/applications.load]',error);$('status').replaceChildren(message('تعذر تحميل طلبات الانضمام.',true));} }
$('filter').addEventListener('change',load);
load();
