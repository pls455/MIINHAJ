import { mountShell } from '../components/layout.js';
import { resourceCard } from '../components/resourceCard.js';
import { qs, debounce } from '../core/utils.js';

mountShell('المصادر', `
  <div id="resource-filters" class="toolbar"></div>
  <div id="resource-list" class="grid" aria-live="polite"></div>
  <button id="moreResources" class="button" hidden type="button">تحميل المزيد</button>
`);

const controls = document.getElementById('resource-filters');
const root = document.getElementById('resource-list');
const more = document.getElementById('moreResources');
let cursor = null;
let busy = false;
let repositoryPromise;
let seenIds = new Set();

function getRepository() { return repositoryPromise ??= import('../repositories/resourceRepository.js'); }
function filters() { return { search: document.getElementById('resourceSearch')?.value.trim() || '', searchField: 'title', branchId: document.getElementById('branchFilter')?.value || '', subjectId: document.getElementById('subjectFilter')?.value || '', categoryId: document.getElementById('categoryFilter')?.value || '' }; }
function setLoading() { root.replaceChildren(); const state=document.createElement('div'); state.className='loading'; state.textContent='جاري تحميل المصادر...'; root.append(state); }
function appendRows(rows) { rows.forEach(row=>{if(seenIds.has(row.id))return;seenIds.add(row.id);const wrapper=document.createElement('div');wrapper.innerHTML=resourceCard(row);const node=wrapper.firstElementChild;if(node)root.append(node);}); }
async function buildControls(getAllSmall) { const [branches,subjects,categories]=await Promise.all([getAllSmall('branches'),getAllSmall('subjects'),getAllSmall('categories')]);controls.replaceChildren();const search=document.createElement('input');search.id='resourceSearch';search.type='search';search.placeholder='ابحث بالعنوان...';search.setAttribute('aria-label','بحث بالمصادر');const branch=document.createElement('select');branch.id='branchFilter';branch.setAttribute('aria-label','الفرع');const subject=document.createElement('select');subject.id='subjectFilter';subject.setAttribute('aria-label','المادة');const category=document.createElement('select');category.id='categoryFilter';category.setAttribute('aria-label','التصنيف');branch.append(new Option('كل الفروع',''));subject.append(new Option('كل المواد',''));category.append(new Option('كل التصنيفات',''));branches.forEach(x=>branch.append(new Option(x.name||'',String(x.id))));subjects.forEach(x=>subject.append(new Option(x.name||'',String(x.id))));categories.forEach(x=>category.append(new Option(x.name||'',String(x.id))));controls.append(search,branch,subject,category);branch.value=qs.get('branch')||'';subject.value=qs.get('subject')||'';category.value=qs.get('category')||'';['resourceSearch','branchFilter','subjectFilter','categoryFilter'].forEach(id=>{const el=document.getElementById(id);el.addEventListener('input',apply);el.addEventListener('change',apply);});}
async function load(reset=false){if(busy)return;busy=true;if(reset){cursor=null;seenIds=new Set();setLoading();more.hidden=true;}try{const {resourceRepository,getAllSmall}=await getRepository();if(!controls.children.length)await buildControls(getAllSmall);const result=await resourceRepository.searchResources(filters(),24,cursor);if(reset)root.replaceChildren();const before=seenIds.size;appendRows(result.rows);cursor=result.nextCursor;const added=seenIds.size-before;more.hidden=!result.hasMore||(added===0&&!result.nextCursor);if(!result.rows.length&&!root.children.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='لا توجد مصادر مطابقة.';root.append(empty);}}catch(error){console.error('[resources]',error);if(reset)root.replaceChildren();const state=document.createElement('div');state.className='error-box';state.textContent='تعذر تحميل المصادر. حاول مرة أخرى.';root.append(state);more.hidden=true;}finally{busy=false;}}
const apply=debounce(()=>load(true),300);more.addEventListener('click',()=>load(false));load(true);
