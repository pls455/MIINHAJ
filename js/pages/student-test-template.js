import { getAllSmall } from '../repositories/resourceRepository.js';
import { escapeHtml } from '../core/utils.js';

const root = document.getElementById('root');
const templateBtn = document.getElementById('templateBtn');

const withTimeout = (promise, ms = 10000) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error('انتهى وقت تحميل الفروع والمواد.')), ms))
]);

async function loadAcademicForTemplate() {
  const [branches, subjects] = await withTimeout(
    Promise.all([
      getAllSmall('branches', 500),
      getAllSmall('subjects', 500)
    ])
  );
  return { branches: Array.isArray(branches) ? branches : [], subjects: Array.isArray(subjects) ? subjects : [] };
}

function renderTemplate(data) {
  root.innerHTML = `<div class="template-box">
    <h2>قالب الاختبارات</h2>
    <p class="muted">القالب محدث من بيانات الفروع والمواد الحالية، ويحتوي على UIDs لاستخدامها مع ChatGPT.</p>
    <textarea id="studentTestTemplate" readonly spellcheck="false">${escapeHtml(JSON.stringify(data, null, 2))}</textarea>
    <div class="actions">
      <button id="copyStudentTestTemplate" class="button primary">نسخ القالب</button>
      <button id="refreshStudentTestTemplate" class="button">تحديث UIDs</button>
      <button id="backStudentTestTemplate" class="button">رجوع</button>
    </div>
    <p id="templateMsg" class="message"></p>
  </div>`;

  const area = document.getElementById('studentTestTemplate');
  const msg = document.getElementById('templateMsg');

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
      questions: [{
        id: 'q1',
        question: 'نص السؤال',
        type: 'mcq',
        options: ['الخيار الأول', 'الخيار الثاني', 'الخيار الثالث'],
        answer: 'الخيار الأول',
        explanation: '',
        points: 1
      }],
      branchCatalog: branches.map(x => ({ uid: x.id, name: x.name || x.title || x.id })),
      subjectCatalog: subjects.map(x => ({
        uid: x.id,
        name: x.name || x.title || x.id,
        branchIds: Array.isArray(x.branchIds) ? x.branchIds : []
      }))
    };

    renderTemplate(data);
  } catch (e) {
    root.innerHTML = `<div class="empty">
      <h3>تعذر تحميل قالب الاختبارات</h3>
      <p>${escapeHtml(e?.message || e?.code || 'حدث خطأ أثناء تحميل الفروع والمواد.')}</p>
      <button id="retryStudentTestTemplate" class="button primary">إعادة المحاولة</button>
    </div>`;
    document.getElementById('retryStudentTestTemplate').onclick = buildTemplate;
  } finally {
    templateBtn.disabled = false;
    templateBtn.textContent = 'قالب الاختبارات';
  }
}

if (templateBtn) {
  templateBtn.onclick = (event) => {
    event.preventDefault();
    buildTemplate();
  };
}
