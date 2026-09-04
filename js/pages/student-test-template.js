import { getAllSmall } from '../repositories/resourceRepository.js';
import { createStudentTest } from '../repositories/studentTestRepository.js';
import { escapeHtml } from '../core/utils.js';

const root = document.getElementById('root');
const templateBtn = document.getElementById('templateBtn');

const withTimeout = (promise, ms = 10000) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('انتهى وقت تحميل الفروع والمواد.')), ms))
]);

async function loadAcademicForTemplate() {
  const [branches, subjects] = await withTimeout(Promise.all([
    getAllSmall('branches', 500),
    getAllSmall('subjects', 500)
  ]));
  return {
    branches: Array.isArray(branches) ? branches : [],
    subjects: Array.isArray(subjects) ? subjects : []
  };
}

const templateCss = `
<style>
.template-box{display:grid;gap:16px;padding:22px;border:1px solid var(--color-border);border-radius:24px;background:var(--color-surface);box-shadow:var(--shadow-sm)}
.template-section{display:grid;gap:10px;padding:18px;border:1px solid var(--color-border);border-radius:20px;background:var(--color-surface-solid)}
.template-title{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.template-title h2,.template-section h3{margin:0}
.template-help{margin:0;color:var(--color-muted);line-height:1.7}
.template-box textarea{width:100%;box-sizing:border-box;min-height:260px;padding:14px;border:1px solid var(--color-border);border-radius:16px;background:var(--color-surface-solid);color:var(--color-text);font:13px/1.7 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;direction:ltr;text-align:left;resize:vertical;outline:none}
.template-box textarea:focus{border-color:var(--color-primary,#4f46e5);box-shadow:0 0 0 3px color-mix(in srgb,var(--color-primary,#4f46e5) 15%,transparent)}
.template-import{min-height:230px}
.template-note{padding:12px 14px;border-radius:14px;background:var(--color-surface);border:1px solid var(--color-border);color:var(--color-muted);font-size:13px}
.template-msg{min-height:22px;margin:0;font-weight:700}
@media(max-width:600px){.template-box,.template-section{padding:16px}.template-box textarea{min-height:220px;font-size:12px}.template-title{align-items:flex-start}}
</style>`;

function renderTemplate(data) {
  root.innerHTML = `${templateCss}
  <div class="template-box">
    <div class="template-title">
      <div><h2>قالب الاختبارات</h2><p class="template-help">قالب ديناميكي يحتوي على UIDs الحالية للفروع والمواد، ومجهز للنسخ إلى ChatGPT.</p></div>
      <span class="badge">${data.branchCatalog.length} فرع • ${data.subjectCatalog.length} مادة</span>
    </div>

    <section class="template-section">
      <h3>📋 القالب العام</h3>
      <p class="template-help">انسخ القالب، أضف الأسئلة والمحتوى، ثم أعد JSON الناتج إلى خانة الاستيراد أدناه.</p>
      <textarea id="studentTestTemplate" readonly spellcheck="false">${escapeHtml(JSON.stringify(data, null, 2))}</textarea>
      <div class="actions">
        <button id="copyStudentTestTemplate" class="button primary">نسخ القالب</button>
        <button id="refreshStudentTestTemplate" class="button">تحديث UIDs</button>
        <button id="backStudentTestTemplate" class="button">رجوع</button>
      </div>
    </section>

    <section class="template-section">
      <h3>📥 استيراد قالب الاختبار</h3>
      <p class="template-help">الصق هنا JSON الناتج من القالب. سيتم التحقق منه ثم إنشاء الاختبار في حسابك.</p>
      <textarea id="studentTestImport" class="template-import" spellcheck="false" placeholder='الصق JSON الاختبار هنا...'></textarea>
      <div class="actions">
        <button id="importStudentTest" class="button primary">استيراد وإنشاء الاختبار</button>
        <button id="clearStudentTestImport" class="button">مسح</button>
      </div>
      <p id="templateMsg" class="template-msg message"></p>
      <div class="template-note">يدعم القالب أنواع الأسئلة: اختيار واحد، صح/خطأ، اختيارات متعددة، وترتيب. الحد الأقصى 50 سؤالًا.</div>
    </section>
  </div>`;

  const area = document.getElementById('studentTestTemplate');
  const importArea = document.getElementById('studentTestImport');
  const msg = document.getElementById('templateMsg');
  const importBtn = document.getElementById('importStudentTest');

  document.getElementById('copyStudentTestTemplate').onclick = async () => {
    try {
      await navigator.clipboard.writeText(area.value);
    } catch {
      area.select();
      document.execCommand('copy');
    }
    msg.textContent = 'تم نسخ القالب.';
  };

  document.getElementById('refreshStudentTestTemplate').onclick = buildTemplate;
  document.getElementById('backStudentTestTemplate').onclick = () => location.reload();
  document.getElementById('clearStudentTestImport').onclick = () => {
    importArea.value = '';
    msg.textContent = '';
  };

  importBtn.onclick = async () => {
    msg.textContent = '';
    importBtn.disabled = true;
    try {
      const raw = importArea.value.trim();
      if (!raw) throw new Error('ألصق JSON الاختبار أولًا.');
      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('JSON غير صالح. تأكد من نسخ القالب كاملًا.');
      }
      if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
        throw new Error('صيغة القالب غير صحيحة. يجب أن يكون JSON عبارة عن كائن اختبار.');
      }
      if (parsed.templateType && !String(parsed.templateType).startsWith('minhaj-student-test-')) {
        throw new Error('نوع قالب غير مدعوم. استخدم قالب اختبار من صفحة اختباراتي.');
      }
      const id = await createStudentTest(parsed);
      msg.textContent = `تم استيراد الاختبار بنجاح. رقم الاختبار: ${id}`;
      importArea.value = '';
      setTimeout(() => location.reload(), 500);
    } catch (e) {
      msg.textContent = `تعذر الاستيراد: ${e?.message || e?.code || 'تحقق من JSON.'}`;
    } finally {
      importBtn.disabled = false;
    }
  };
}

async function buildTemplate() {
  if (!root || !templateBtn) return;
  templateBtn.disabled = true;
  templateBtn.textContent = 'جاري تحميل الفروع والمواد…';
  root.innerHTML = '<div class="empty">جاري تحميل الفروع والمواد…</div>';
  try {
    const { branches, subjects } = await loadAcademicForTemplate();
    const data = {
      templateType: 'minhaj-student-test-v2',
      instructions: 'استخدم UIDs الموجودة في branchCatalog وsubjectCatalog. لا تضع أسماء الفروع أو المواد مكان الـ UID. branchIds مصفوفة UIDs، وsubjectId UID واحد أو فارغ.',
      title: 'اختبار تجريبي',
      description: 'وصف الاختبار',
      branchIds: branches.length ? [branches[0].id] : [],
      subjectId: subjects[0]?.id || '',
      durationMinutes: 30,
      passingScore: 50,
      randomizeQuestions: false,
      showResults: true,
      questions: [{id:'q1',question:'نص السؤال',type:'mcq',options:['الخيار الأول','الخيار الثاني','الخيار الثالث'],answer:'الخيار الأول',explanation:'',points:1}],
      branchCatalog: branches.map(x => ({uid:x.id,name:x.name||x.title||x.id})),
      subjectCatalog: subjects.map(x => ({uid:x.id,name:x.name||x.title||x.id,branchIds:Array.isArray(x.branchIds)?x.branchIds:[]}))
    };
    renderTemplate(data);
  } catch (e) {
    root.innerHTML = `<div class="empty"><h3>تعذر تحميل قالب الاختبارات</h3><p>${escapeHtml(e?.message || e?.code || 'حدث خطأ أثناء تحميل الفروع والمواد.')}</p><button id="retryStudentTestTemplate" class="button primary">إعادة المحاولة</button></div>`;
    document.getElementById('retryStudentTestTemplate').onclick = buildTemplate;
  } finally {
    templateBtn.disabled = false;
    templateBtn.textContent = 'قالب الاختبارات';
  }
}

if (templateBtn) {
  templateBtn.onclick = event => { event.preventDefault(); buildTemplate(); };
}
