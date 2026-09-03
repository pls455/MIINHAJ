import { getAllSmall } from '../repositories/resourceRepository.js';
import { escapeHtml } from '../core/utils.js';

const root=document.getElementById('root');
const templateBtn=document.getElementById('templateBtn');
templateBtn&&(templateBtn.onclick=null);

async function buildTemplate(){
  try{
    templateBtn.disabled=true;
    templateBtn.textContent='جاري تحميل الفروع والمواد…';
    const [branches,subjects]=await Promise.all([getAllSmall('branches',500),getAllSmall('subjects',500)]);
    const data={
      templateType:'minhaj-student-test-v2',
      instructions:'استخدم UIDs الموجودة في branchCatalog وsubjectCatalog. لا تضع أسماء الفروع أو المواد مكان الـ UID. branchIds مصفوفة UIDs، وsubjectId UID واحد أو فارغ.',
      title:'اختبار تجريبي',description:'وصف الاختبار',
      branchIds:branches.length?[branches[0].id]:[],subjectId:subjects[0]?.id||'',
      durationMinutes:30,passingScore:50,randomizeQuestions:false,showResults:true,
      questions:[{id:'q1',question:'نص السؤال',type:'mcq',options:['الخيار الأول','الخيار الثاني','الخيار الثالث'],answer:'الخيار الأول',explanation:'',points:1}],
      branchCatalog:branches.map(x=>({uid:x.id,name:x.name||x.title||x.id})),
      subjectCatalog:subjects.map(x=>({uid:x.id,name:x.name||x.title||x.id,branchIds:Array.isArray(x.branchIds)?x.branchIds:[]}))
    };
    root.innerHTML=`<div class="template-box"><h2>قالب الاختبارات</h2><p>القالب يتحدث تلقائيًا ويضع UIDs الحالية للفروع والمواد.</p><textarea id="studentTestTemplate" readonly>${escapeHtml(JSON.stringify(data,null,2))}</textarea><div class="actions"><button id="copyStudentTestTemplate" class="button primary">نسخ القالب</button><button id="refreshStudentTestTemplate" class="button">تحديث UIDs</button><button id="backStudentTestTemplate" class="button">رجوع</button></div><p id="templateMsg" class="message"></p></div>`;
    const area=document.getElementById('studentTestTemplate');
    document.getElementById('copyStudentTestTemplate').onclick=async()=>{try{await navigator.clipboard.writeText(area.value)}catch{area.select();document.execCommand('copy')}document.getElementById('templateMsg').textContent='تم نسخ القالب.'};
    document.getElementById('refreshStudentTestTemplate').onclick=buildTemplate;
    document.getElementById('backStudentTestTemplate').onclick=()=>location.reload();
  }catch(e){templateBtn.disabled=false;templateBtn.textContent='قالب الاختبارات';root.innerHTML=`<div class="empty">تعذر تحميل UIDs للفروع والمواد. ${escapeHtml(e?.message||e?.code||'خطأ')}</div>`}
}

templateBtn?.addEventListener('click',e=>{e.preventDefault();buildTemplate()});
