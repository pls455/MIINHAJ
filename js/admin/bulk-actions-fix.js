import { doc, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
import { db } from '../services/firebase.js';
import { currentAdmin, hasRole, ROLES } from '../services/firebase/adminCore.js';
import { writeAdminLog } from './adminLogRepository.js';
import { updateStatus } from './audit.js';

function collectionName(){
  const heading=document.querySelector('#adminContent h2')?.textContent?.trim()||'';
  if(heading.includes('سجل المصادر'))return 'sourceRegistry';
  if(heading.includes('الاقتراحات'))return 'suggestions';
  if(heading.includes('البلاغات'))return 'problemReports';
  return '';
}

function selectedIds(){
  return [...document.querySelectorAll('#table [data-select-row]:checked')]
    .map(input=>String(input.value||'').trim())
    .filter(Boolean);
}

function buttonBusy(button,busy){
  if(!button)return;
  button.disabled=busy;
  if(busy){button.dataset.originalText=button.textContent;button.textContent='جارٍ التنفيذ...';}
  else if(button.dataset.originalText){button.textContent=button.dataset.originalText;delete button.dataset.originalText;}
}

async function bulkDelete(ids,collection){
  const actor=await currentAdmin();
  if(!hasRole(actor.role,ROLES.REVIEWER))throw Error('ليس لديك صلاحية للحذف');
  const results=[];
  for(const id of ids){
    try{
      await deleteDoc(doc(db,collection,id));
      try{await writeAdminLog({action:'delete',collectionName:collection,targetId:id,details:{message:'حذف جماعي',actorUid:actor.uid,actorEmail:actor.email||''}})}catch(logError){console.warn('[bulk.delete.audit]',logError)}
      results.push({id,ok:true});
    }catch(error){
      console.error('[bulk.delete]',id,error);
      results.push({id,ok:false,error});
    }
  }
  return results;
}

async function bulkApprove(ids){
  const results=[];
  for(const id of ids){
    try{
      await updateStatus('sourceRegistry',id,'approved');
      results.push({id,ok:true});
    }catch(error){
      console.error('[bulk.approve]',id,error);
      results.push({id,ok:false,error});
    }
  }
  return results;
}

function report(action,results){
  const success=results.filter(x=>x.ok).length;
  const failed=results.length-success;
  if(!failed)return `تم ${action} ${success} عنصر بنجاح.`;
  const messages=results.filter(x=>!x.ok).map(x=>x.error?.message||x.error?.code||'خطأ غير معروف');
  return `تم ${action} ${success} عنصر، وتعذر تنفيذ العملية على ${failed} عنصر.\n${[...new Set(messages)].join('\n')}`;
}

async function run(button,action){
  const ids=selectedIds();
  if(!ids.length)return;
  const collection=collectionName();
  if(!collection){alert('تعذر تحديد القسم الحالي.');return;}
  if(action==='delete'&&!confirm(`تأكيد حذف ${ids.length} عنصر؟`))return;
  buttonBusy(button,true);
  try{
    const results=action==='delete'?await bulkDelete(ids,collection):await bulkApprove(ids);
    alert(report(action==='delete'?'حذف':'اعتماد',results));
    window.location.reload();
  }catch(error){
    console.error('[admin.bulk-fix]',error);
    alert(error?.message||error?.code||'تعذر تنفيذ العملية.');
  }finally{buttonBusy(button,false)}
}

document.addEventListener('click',event=>{
  const button=event.target.closest('#bulkApprove,#bulkDelete');
  if(!button)return;
  event.preventDefault();
  event.stopImmediatePropagation();
  run(button,button.id==='bulkApprove'?'approve':'delete');
},true);
