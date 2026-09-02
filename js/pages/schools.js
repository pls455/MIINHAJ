import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { mountShell } from '../components/layout.js';
import { escapeHtml } from '../core/utils.js';

mountShell('المدارس', `
<style>
.school-directory-hero{background:linear-gradient(145deg,#111827,#312e81);color:#fff;border:1px solid rgba(255,255,255,.1);overflow:hidden;position:relative}.school-directory-hero h2{margin:0 0 .5rem}.school-directory-hero p{color:#e2e8f0;margin:0}.school-public-card{display:block;color:inherit;text-decoration:none;border:1px solid #cbd5e1;background:#fff;box-shadow:0 10px 28px rgba(15,23,42,.08);transition:transform .18s ease,box-shadow .18s ease}.school-public-card:hover{transform:translateY(-3px);box-shadow:0 16px 34px rgba(15,23,42,.14)}.school-public-badge{width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:#eef2ff;font-size:1.35rem;margin-bottom:.75rem}.school-public-card h2{margin:.2rem 0;color:#0f172a}.school-code{font-weight:800;color:#4338ca;margin:.35rem 0 1rem}.school-meta{display:grid;gap:.45rem}.school-meta span{display:block;color:#334155;font-size:.92rem}.school-meta span::before{content:'• ';color:#4f46e5;font-weight:900}.school-directory-hero + .card{margin-top:1rem}.school-directory-hero + .card .toolbar{align-items:stretch}.school-directory-hero + .card input,.school-directory-hero + .card select{min-height:46px}.school-directory-hero + .card #school-count{font-weight:700;color:#334155;margin:.75rem 0}.school-directory-hero + .card .grid{margin-top:.5rem}@media(max-width:700px){.school-public-card{padding:1rem}.school-meta{gap:.35rem}}
</style>
<section class="card school-directory-hero"><h2>دليل المدارس</h2><p>ابحث عن المدرسة بالاسم أو الرقم أو المديرية أو المحافظة أو المنطقة. هذه الصفحة عامة ولا تربط المدرسة بحساب الطالب.</p></section>
<section class="card"><div class="toolbar"><input id="school-search" type="search" placeholder="ابحث باسم المدرسة، الرقم، المدير، المديرية..." autocomplete="off"><select id="school-directorate"><option value="">كل المديريات</option></select><select id="school-governorate"><option value="">كل المحافظات</option></select></div><div id="school-count" class="muted"></div><div id="school-list" class="grid"></div></section>`);

const search=document.getElementById('school-search');
const directorateFilter=document.getElementById('school-directorate');
const governorateFilter=document.getElementById('school-governorate');
const list=document.getElementById('school-list');
const count=document.getElementById('school-count');
const norm=v=>String(v??'').trim().toLocaleLowerCase('ar');
let schools=[],directorates=[];

function renderFilters(){
  directorateFilter.replaceChildren(new Option('كل المديريات',''));
  directorates.forEach(d=>directorateFilter.append(new Option(d.name||'بدون اسم',d.id)));
  const governors=[...new Set(directorates.map(d=>String(d.governorate||'').trim()).filter(Boolean))].sort((a,b)=>norm(a).localeCompare(norm(b),'ar'));
  governorateFilter.replaceChildren(new Option('كل المحافظات',''));
  governors.forEach(g=>governorateFilter.append(new Option(g,g)));
}
function render(){
  const q=norm(search.value),did=directorateFilter.value,gov=governorateFilter.value;
  const rows=schools.filter(x=>{
    const d=directorates.find(z=>z.id===x.directorateId);
    const dn=d?.name||x.directorateName||'',gn=d?.governorate||x.governorateName||'',area=d?.area||x.area||'';
    return (!did||x.directorateId===did)&&(!gov||gn===gov)&&(!q||[x.name,x.code,x.manager,dn,gn,area,x.type,x.gender,x.stages].some(v=>norm(v).includes(q)));
  }).sort((a,b)=>norm(a.name).localeCompare(norm(b.name),'ar'));
  count.textContent=`${rows.length.toLocaleString('ar-EG')} مدرسة`;
  list.replaceChildren();
  if(!rows.length){list.innerHTML='<div class="empty">لا توجد مدارس مطابقة.</div>';return;}
  rows.forEach(x=>{
    const d=directorates.find(z=>z.id===x.directorateId),dn=d?.name||x.directorateName||'غير محددة',gn=d?.governorate||x.governorateName||'غير محددة',area=d?.area||x.area||'غير محددة';
    const card=document.createElement('article');card.className='card school-public-card';
    card.innerHTML=`<div class="school-public-badge">🏫</div><h2>${escapeHtml(x.name||'بدون اسم')}</h2><p class="school-code">رقم المدرسة: ${escapeHtml(x.code||'غير محدد')}</p><div class="school-meta"><span>المديرية: ${escapeHtml(dn)}</span><span>المحافظة: ${escapeHtml(gn)}</span><span>المنطقة: ${escapeHtml(area)}</span><span>النوع: ${escapeHtml(x.type||'غير محدد')}</span><span>الجنس: ${escapeHtml(x.gender||'غير محدد')}</span>${x.manager?`<span>المدير: ${escapeHtml(x.manager)}</span>`:''}${x.stages?`<span>المراحل: ${escapeHtml(x.stages)}</span>`:''}</div>${x.address?`<p class="muted">${escapeHtml(x.address)}</p>`:''}`;
    list.append(card);
  });
}

async function init(){
  list.innerHTML='<div class="loading">جاري تحميل المدارس...</div>';
  try{
    const [ss,ds]=await Promise.all([getDocs(collection(db,'schools')),getDocs(collection(db,'directorates'))]);
    schools=ss.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);
    directorates=ds.docs.map(d=>({id:d.id,...d.data()})).filter(x=>x.active!==false);
    renderFilters();render();
  }catch(e){console.error('[schools-public]',e);list.innerHTML='<div class="error-box">تعذر تحميل دليل المدارس. حاول مرة أخرى.</div>';}
}
search.addEventListener('input',render);directorateFilter.addEventListener('change',render);governorateFilter.addEventListener('change',render);
init();
