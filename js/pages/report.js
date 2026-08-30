import { mountShell } from '../components/layout.js';
import { createProblemReport } from '../repositories/problemReportRepository.js';
import { setMessage, setBusy, qs } from '../core/utils.js';

mountShell('الإبلاغ عن مشكلة', `
  <section class="page-header"><span class="eyebrow">ساعدنا نحافظ على جودة المحتوى</span><h1>🚩 الإبلاغ عن مشكلة</h1><p>إذا وجدت رابطًا لا يعمل أو مصدرًا مصنفًا بشكل خاطئ، أرسل لنا البلاغ.</p></section>
  <form id="form" class="form-card">
    <label>المصدر<input id="title" readonly></label>
    <label>نوع المشكلة<select id="kind"><option>الرابط لا يعمل</option><option>المصدر مصنف بشكل خاطئ</option><option>محتوى غير مناسب</option><option>أخرى</option></select></label>
    <label>التفاصيل<textarea id="description" required maxlength="5000" placeholder="اشرح المشكلة باختصار"></textarea></label>
    <button class="button primary" type="submit">إرسال البلاغ</button>
    <p id="msg" class="message"></p>
  </form>
`);

const title = qs.get('title') || qs.get('sourceId') || '';
document.getElementById('title').value = title;
document.getElementById('form').addEventListener('submit', async event => {
  event.preventDefault();
  const btn = event.submitter;
  setBusy(btn, true);
  try {
    await createProblemReport({ sourceId: qs.get('sourceId') || '', sourceTitle: title, kind: document.getElementById('kind').value, description: document.getElementById('description').value });
    setMessage(document.getElementById('msg'), 'تم تسجيل البلاغ، شكرًا.');
    document.getElementById('description').value = '';
  } catch (error) {
    console.error('[report.submit]', error);
    setMessage(document.getElementById('msg'), 'تعذر تسجيل البلاغ. تحقق من البيانات والصلاحيات.', true);
  } finally { setBusy(btn, false); }
});
