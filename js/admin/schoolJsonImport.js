import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { requireAdmin, ROLES } from '../services/firebase/adminCore.js';
import { writeAdminLog } from '../services/firebase/adminLogRepository.js';

await requireAdmin(ROLES.CONTENT_ADMIN);

const $=id=>document.getElementById(id);
const template={
  directorates:[
    {code:'NGS-01',name:'اسم المديرية',governorate:'المحافظة',area:'المنطقة',manager:'اسم المدير',phone:'',email:'',address:'',notes:'',active:true}
  ],
  schools:[
    {code:'SCH-0001',name:'اسم المدرسة',directorateCode:'NGS-01',governorateName:'المحافظة',area:'المنطقة',type:'حكومية',gender:'ذكور',stages:'أساسي، ثانوي',manager:'اسم المدير',phone:'',email:'',address:'',notes:'',active:true}
  ]
};

const templateText=JSON.stringify(template,null,2);
$('json-template-preview').textContent=templateText;
$('json-import-input').value=templateText;

$('copy-json-template')?.addEventListener('click',async()=>{
  try{await navigator.clipboard.writeText(templateText);show('تم نسخ قالب JSON. الصقه في GPT مع بيانات المدارس الخام.','ok');}
  catch{show('تعذر النسخ تلقائيًا. انسخ القالب من المعاينة بالأسفل.','error');}
});
$('import-json')?.addEventListener('click',()=>document.getElementById('json-tools')?.scrollIntoView({behavior:'smooth',block:'center'}));
$('clear-json')?.addEventListener('click',()=>{$('json-import-input').value='';$('json-import-message').textContent='';});
$('import-json-submit')?.addEventListener('click',importJson);

function show(text,type='ok'){$('json-import-message').textContent=text;$('json-import-message').dataset.state=type;}
const clean=v=>String(v??'').trim();
const norm=v=>clean(v).toLocaleLowerCase('ar');
function directoratePayload(x){return {name:clean(x.name),code:clean(x.code),governorate:clean(x.governorate),area:clean(x.area),manager:clean(x.manager),phone:clean(x.phone),email:clean(x.email),address:clean(x.address),notes:clean(x.notes),active:x.active!==false,updatedAt:serverTimestamp()};}
function schoolPayload(x,d){return {name:clean(x.name),code:clean(x.code),directorateId:d.id,directorateName:d.name||'',governorateName:clean(x.governorateName||d.governorate),area:clean(x.area||d.area),type:clean(x.type||'أخرى'),gender:clean(x.gender||'مختلطة'),stages:clean(x.stages),manager:clean(x.manager),phone:clean(x.phone),email:clean(x.email),address:clean(x.address),notes:clean(x.notes),active:x.active!==false,updatedAt:serverTimestamp()};}

async function importJson(){
  const button=$('import-json-submit');button.disabled=true;show('جاري استيراد البيانات...','ok');
  try{
    const parsed=JSON.parse($('json-import-input').value||'{}');
    if(!parsed||!Array.isArray(parsed.directorates)||!Array.isArray(parsed.schools))throw new Error('JSON_STRUCTURE');
    const [ds,ss]=await Promise.all([getDocs(collection(db,'directorates')),getDocs(collection(db,'schools'))]);
    const existingD=ds.docs.map(d=>({id:d.id,...d.data()}));
    const existingS=ss.docs.map(d=>({id:d.id,...d.data()}));
    const dMap=new Map();existingD.forEach(d=>{if(d.code)dMap.set(`code:${norm(d.code)}`,d);if(d.name)dMap.set(`name:${norm(d.name)}`,d);});
    let directoratesAdded=0,directoratesUpdated=0,schoolsAdded=0,schoolsUpdated=0,skipped=0;
    for(const x of parsed.directorates){
      const name=clean(x.name),code=clean(x.code);if(!name)continue;
      const found=(code&&dMap.get(`code:${norm(code)}`))||dMap.get(`name:${norm(name)}`);
      if(found){await updateDoc(doc(db,'directorates',found.id),directoratePayload(x));Object.assign(found,x);found.name=name;found.code=code;found.governorate=clean(x.governorate);found.area=clean(x.area);directoratesUpdated++;}
      else{const r=await addDoc(collection(db,'directorates'),{...directoratePayload(x),createdAt:serverTimestamp()});const created={id:r.id,...x,name,code,governorate:clean(x.governorate),area:clean(x.area)};if(code)dMap.set(`code:${norm(code)}`,created);dMap.set(`name:${norm(name)}`,created);directoratesAdded++;}
    }
    const sMap=new Map();existingS.forEach(s=>{if(s.code)sMap.set(norm(s.code),s);});
    for(const x of parsed.schools){
      const code=clean(x.code),name=clean(x.name);if(!code||!name){skipped++;continue;}
      const d=(x.directorateCode&&dMap.get(`code:${norm(x.directorateCode)}`))||(x.directorateName&&dMap.get(`name:${norm(x.directorateName)}`));
      if(!d){skipped++;continue;}
      const found=sMap.get(norm(code));
      if(found){await updateDoc(doc(db,'schools',found.id),schoolPayload(x,d));schoolsUpdated++;}
      else{const r=await addDoc(collection(db,'schools'),{...schoolPayload(x,d),createdAt:serverTimestamp()});sMap.set(norm(code),{id:r.id,...x});schoolsAdded++;}
    }
    try{await writeAdminLog({action:'import',collectionName:'schools',targetId:'json',details:{directoratesAdded,directoratesUpdated,schoolsAdded,schoolsUpdated,skipped}})}catch(e){console.warn('[school-json.log]',e)}
    show(`تم الاستيراد: ${directoratesAdded} مديرية جديدة، ${directoratesUpdated} محدثة، ${schoolsAdded} مدرسة جديدة، ${schoolsUpdated} محدثة، ${skipped} متجاوزة. أعد تحميل قائمة المدارس لرؤية النتائج.`,'ok');
    window.dispatchEvent(new CustomEvent('schools-json-imported'));
  }catch(e){console.error('[school-json]',e);show(e.message==='JSON_STRUCTURE'?'صيغة JSON يجب أن تحتوي على directorates و schools كمصفوفتين.':e instanceof SyntaxError?'الـ JSON غير صالح. تأكد من الأقواس والفواصل.':'تعذر استيراد البيانات. تحقق من الصلاحيات والبيانات.','error');}
  finally{button.disabled=false;}
}
