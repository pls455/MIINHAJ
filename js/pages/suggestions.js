import { mountShell } from '../components/layout.js';
import { db } from '../services/firebase.js';
import { collection, addDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';
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
    <label>العنوان *<input id="title" required maxlength="160" placeholder="اسم الكتاب أو الدرس"></label>
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

typeSelect.addEventListener('change', () => foundationFields.classList.toggle('hidden', typeSelect.value !== 'foundation'));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const btn = event.submitter;
  setBusy(btn, true);
  try {
    await addDoc(collection(db, 'suggestions'), {
      title: document.getElementById('title').value.trim(),
      contentType: typeSelect.value,
      studentName: document.getElementById('studentName').value.trim(),
      url: document.getElementById('url').value.trim(),
      branchId: document.getElementById('branch').value,
      subjectId: document.getElementById('subject').value,
      level: document.getElementById('level').value,
      foundationType: document.getElementById('foundationType').value,
      type: document.getElementById('type').value.trim(),
      description: document.getElementById('description').value.trim(),
      keywords: document.getElementById('keywords').value.trim().split(',').map(v => v.trim()).filter(Boolean),
      status: 'pending',
      createdAt: serverTimestamp()
    });
    setMessage(document.getElementById('msg'), 'تم إرسال الاقتراح للمراجعة.');
    form.reset();
    foundationFields.classList.add('hidden');
  } catch (error) {
    console.error('suggestion submission failed', error);
    setMessage(document.getElementById('msg'), 'تعذر إرسال الاقتراح. حاول مرة أخرى.', true);
  } finally {
    setBusy(btn, false);
  }
});
