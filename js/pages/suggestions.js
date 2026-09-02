import { mountShell } from '../components/layout.js';
import { createSuggestion } from '../repositories/suggestionRepository.js';
import { getAllSmall } from '../repositories/resourceRepository.js';
import { setMessage, setBusy } from '../core/utils.js';

mountShell('إرسال اقتراح', `
  <section class="page-header">
    <span class="eyebrow">ساهم في تطوير منهاج</span>
    <h1>➕ اقتراح محتوى</h1>
    <p>عندك كتاب أو ملزمة أو مصدر مفيد؟ أرسل الرابط وسنراجعه قبل أن يصل لباقي الطلاب.</p>
    <div class="suggest-tip"><span>✦</span><div><strong>ملاحظة:</strong> تأكد من أن الرابط يعمل وأن المحتوى متعلق بالتوجيهي قبل الإرسال.</div></div>
  </section>
  <form id="form" class="form-card suggest-form">
    <div class="form-grid">
      <label>نوع المحتوى<select id="contentType"><option value="resource">📚 مصدر</option><option value="foundation">🧠 تأسيس</option></select></label>
      <label>اسمك (اختياري)<input id="studentName" maxlength="80" placeholder="اسم مستعار"></label>
    </div>
    <label>العنوان *<input id="title" required maxlength="200" placeholder="اسم الكتاب أو الدرس"></label>
    <label>الرابط *<input id="url" type="url" required placeholder="https://example.com/"></label>
    <div class="form-grid">
      <label>الفرع *<select id="branch" required><option value="">اختر الفرع</option></select></label>
      <label>المادة *<select id="subject" required><option value="">اختر المادة</option></select></label>
    </div>
    <div id="foundationFields" class="hidden">
      <div class="form-grid">
        <label>مستوى التأسيس<select id="level"><option value="beginner">مبتدئ</option><option value="intermediate">متوسط</option><option value="advanced">متقدم</option></select></label>
        <label>نوع التأسيس<select id="foundationType"><option value="lesson">شرح</option><option value="video">فيديو</option><option value="summary">ملخص</option><option value="exercise">تمارين</option></select></label>
      </div>
    </div>
    <label>النوع / التصنيف<input id="type" placeholder="مثال: ملزمة، كتاب، أسئلة"></label>
    <label>الوصف<textarea id="description" rows="4" maxlength="3000" placeholder="معلومة مختصرة عن المحتوى"></textarea></label>
    <label>الكلمات المفتاحية<input id="keywords" placeholder="رياضيات، جبر، توجيهي"></label>
    <button id="submitSuggestBtn" class="button primary" type="submit">🚀 إرسال للمراجعة</button>
    <p id="msg" class="message"></p>
  </form>
`);

const form = document.getElementById('form');
const typeSelect = document.getElementById('contentType');
const foundationFields = document.getElementById('foundationFields');
const branchSelect = document.getElementById('branch');
const subjectSelect = document.getElementById('subject');

async function loadAcademicOptions() {
  try {
    const [branches, subjects] = await Promise.all([
      getAllSmall('branches', 100),
      getAllSmall('subjects', 100)
    ]);
    branchSelect.replaceChildren(new Option('اختر الفرع', ''));
    subjectSelect.replaceChildren(new Option('اختر المادة', ''));
    for (const item of branches) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name || item.title || item.id;
      branchSelect.append(option);
    }
    for (const item of subjects) {
      const option = document.createElement('option');
      option.value = item.id;
      option.textContent = item.name || item.title || item.id;
      subjectSelect.append(option);
    }
  } catch (error) {
    console.error('[suggestions.options]', error);
    setMessage(document.getElementById('msg'), 'تعذر تحميل الفروع والمواد.', true);
  }
}

typeSelect.addEventListener('change', () => foundationFields.classList.toggle('hidden', typeSelect.value !== 'foundation'));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const btn = event.submitter;
  setBusy(btn, true);
  try {
    await createSuggestion({
      title: document.getElementById('title').value,
      contentType: typeSelect.value,
      studentName: document.getElementById('studentName').value,
      url: document.getElementById('url').value,
      branchId: branchSelect.value,
      subjectId: subjectSelect.value,
      level: document.getElementById('level').value,
      foundationType: document.getElementById('foundationType').value,
      type: document.getElementById('type').value,
      description: document.getElementById('description').value,
      keywords: document.getElementById('keywords').value.split(',')
    });
    setMessage(document.getElementById('msg'), 'تم إرسال الاقتراح للمراجعة.');
    form.reset();
    foundationFields.classList.add('hidden');
  } catch (error) {
    console.error('[suggestions.submit]', error);
    const message = error.message === 'SUGGESTION_URL_INVALID' ? 'الرابط يجب أن يبدأ بـ http أو https.' : 'تعذر إرسال الاقتراح. تحقق من البيانات والصلاحيات.';
    setMessage(document.getElementById('msg'), message, true);
  } finally {
    setBusy(btn, false);
  }
});

await loadAcademicOptions();
