import { getPage, save, remove, count } from '../repositories/resourceRepository.js';
import { logAction } from './audit.js';
import { can } from '../services/auth.js';

export const configs = {
  branches: { label: 'الفروع', role: 'superadmin', searchField: 'name', fields: { name:'text', stableId:'text', description:'textarea', icon:'text', order:'number', active:'checkbox' } },
  subjects: { label: 'المواد', role: 'content_admin', searchField: 'name', fields: { name:'text', stableId:'text', description:'textarea', branchIds:'ids', icon:'text', order:'number', active:'checkbox' } },
  categories: { label: 'التصنيفات', role: 'superadmin', searchField: 'name', fields: { name:'text', stableId:'text', description:'textarea', icon:'text', order:'number', active:'checkbox' } },
  resources: { label: 'المصادر', role:'content_admin', searchField:'title', fields: { title:'text', url:'url', description:'textarea', type:'text', subjectId:'text', categoryId:'text', branchIds:'ids', keywords:'ids', tags:'ids', author:'text', order:'number', active:'checkbox' } },
  foundations: { label:'التأسيس', role:'content_admin', searchField:'title', fields: { title:'text', url:'url', description:'textarea', type:'text', level:'text', subjectId:'text', branchIds:'ids', keywords:'ids', author:'text', order:'number', active:'checkbox' } },
  solutions: { label:'الحلول', role:'content_admin', searchField:'title', fields: { title:'text', category:'text', categoryName:'text', problem:'textarea', solution:'textarea', steps:'textarea', notes:'textarea', keywords:'ids', order:'number', status:'text', active:'checkbox' } },
  flashcards: { label:'البطاقات', role:'content_admin', searchField:'question', fields: { question:'textarea', answer:'textarea', explanation:'textarea', subjectId:'text', branchIds:'ids', order:'number', active:'checkbox' } },
  templates: { label:'Templates', role:'content_admin', searchField:'name', fields: { name:'text', target:'text', description:'textarea', fields:'ids', instructions:'ids' } },
  sourceRegistry: { label:'Source Registry', role:'reviewer', writeRole:'content_admin', searchField:'name', orderField:'createdAt', fields: { sourceId:'text', name:'text', path:'text', mimeType:'text', status:'text', branchIds:'ids', subjectId:'text', categoryId:'text', needsReview:'checkbox' } },
  suggestions: { label:'الاقتراحات', role:'reviewer', searchField:'title', orderField:'createdAt', fields: { title:'text', url:'url', description:'textarea', contentType:'text', status:'text' } },
  problemReports: { label:'البلاغات', role:'reviewer', writeRole:'content_admin', searchField:'sourceTitle', orderField:'createdAt', fields: { sourceId:'text', sourceTitle:'text', kind:'text', description:'textarea', status:'text' } },
  admins: { label:'المشرفون', role:'superadmin', searchField:'email', orderField:'createdAt', fields: { email:'email', role:'text', active:'checkbox' } },
  adminLogs: { label:'سجل الإدارة', role:'superadmin', readOnly:true, searchField:'collection', orderField:'createdAt', fields: { action:'text', collection:'text', targetId:'text', details:'textarea', adminUid:'text', adminEmail:'email', role:'text' } }
};

let state = { collection:'branches', cursor:null, admin:null };
export function setAdmin(a){ state.admin=a; }
export function getAdmin(){ return state.admin; }
export function allowed(c){ return !!state.admin && can(state.admin.role, configs[c]?.role || 'reviewer'); }
export function canWrite(c){ const cfg=configs[c]; return allowed(c) && !cfg.readOnly && can(state.admin.role, cfg.writeRole || cfg.role); }
export async function loadPage(c, filters={}) { const cfg=configs[c]; return getPage(c,{...filters,searchField:cfg.searchField,orderField:cfg.orderField},20,state.cursor); }
export async function persist(c,id,payload){ if(!canWrite(c)) throw Error('ليس لديك صلاحية للكتابة'); const saved=await save(c,id,payload); await logAction(state.admin,id?'update':'create',c,saved,payload.title||payload.name||payload.question||payload.email||''); return saved; }
export async function erase(c,id){ if(!canWrite(c)) throw Error('ليس لديك صلاحية للحذف'); await remove(c,id); await logAction(state.admin,'delete',c,id,''); }
export async function stats(){ const names=['branches','subjects','categories','resources','foundations','suggestions','problemReports']; const out={}; await Promise.all(names.map(async n=>{const f=n==='suggestions'?{status:'pending'}:n==='problemReports'?{status:'open'}:{active:true};out[n]=await count(n,f)}));return out; }
export function toPayload(c,form){
  const p={};
  for(const [key,type] of Object.entries(configs[c].fields)){
    const el=form.elements[key]; if(!el) continue;
    if(type==='checkbox') p[key]=el.checked;
    else if(type==='number'){const n=Number(el.value);if(!Number.isInteger(n)||n<0)throw Error('الترتيب يجب أن يكون رقمًا صحيحًا غير سالب');p[key]=n;}
    else if(type==='ids') p[key]=el.value.split(',').map(x=>x.trim()).filter(Boolean);
    else{
      const value=el.value.trim();
      if(key==='url'&&value){try{const u=new URL(value);if(!['http:','https:'].includes(u.protocol))throw 0;}catch{throw Error('الرابط يجب أن يبدأ بـ http أو https');}}
      p[key]=value;
    }
  }
  if(c==='flashcards'){
    if(!p.question || p.question.length < 2) throw Error('السؤال مطلوب ويجب أن يحتوي على حرفين على الأقل');
    if(!p.answer || p.answer.length < 1) throw Error('الإجابة مطلوبة');
    if(p.question.length > 5000 || p.answer.length > 10000 || (p.explanation||'').length > 10000) throw Error('محتوى البطاقة أطول من الحد المسموح');
    if(p.subjectId && !/^[A-Za-z0-9_-]+$/.test(p.subjectId)) throw Error('معرّف المادة غير صالح');
  }
  return p;
}
export function initialValue(type,v){if(type==='checkbox')return !!v;if(type==='ids')return Array.isArray(v)?v.join(', '):String(v||'');return String(v??'');}
export { state };
