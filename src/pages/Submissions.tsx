import { FormEvent, useState } from 'react';
import { z } from 'zod';
import { problemReports, suggestions } from '../repositories';

const suggestionSchema = z.object({ type: z.string().trim().min(1).max(40), title: z.string().trim().min(2).max(200), description: z.string().trim().max(2000).optional(), url: z.string().trim().url().optional().or(z.literal('')) });
const reportSchema = z.object({ type: z.string().trim().min(1).max(40), title: z.string().trim().max(200).optional(), description: z.string().trim().min(5).max(2000) });

export function SuggestPage() { return <SubmissionForm mode="suggestion" />; }
export function ReportPage() { return <SubmissionForm mode="report" />; }

function SubmissionForm({ mode }: { mode: 'suggestion' | 'report' }) {
  const [type, setType] = useState(mode === 'suggestion' ? 'resource' : 'broken-link');
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [url, setUrl] = useState('');
  const [status, setStatus] = useState<string>(''); const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); setStatus('');
    const parsed = mode === 'suggestion' ? suggestionSchema.safeParse({ type, title, description, url }) : reportSchema.safeParse({ type, title, description });
    if (!parsed.success) { setStatus('تحقق من الحقول المدخلة.'); return; }
    setSaving(true);
    try {
      if (mode === 'suggestion') await suggestions.create({ ...parsed.data, status: 'pending' });
      else await problemReports.create({ ...parsed.data, status: 'pending' });
      setTitle(''); setDescription(''); setUrl(''); setStatus('تم إرسال الطلب للمراجعة.');
    } catch { setStatus('تعذر الإرسال. حاول مرة أخرى.'); } finally { setSaving(false); }
  }
  return <section className="narrow"><div className="page-head"><h1>{mode === 'suggestion' ? 'اقتراح جديد' : 'الإبلاغ عن مشكلة'}</h1></div><form className="card form" onSubmit={submit}>
    <label>النوع<select value={type} onChange={(e) => setType(e.target.value)}><option value="resource">مصدر</option><option value="book">كتاب</option><option value="summary">ملخص</option><option value="idea">فكرة</option><option value="broken-link">رابط لا يعمل</option><option value="wrong-resource">مصدر خاطئ</option><option value="duplicate">مكرر</option><option value="technical">مشكلة تقنية</option></select></label>
    <label>العنوان<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required={mode === 'suggestion'} /></label>
    <label>الوصف<textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} required /></label>
    {mode === 'suggestion' && <label>الرابط<input type="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={1000} /></label>}
    <button className="button" disabled={saving}>{saving ? 'جارٍ الإرسال...' : 'إرسال'}</button>{status && <p role="status">{status}</p>}
  </form></section>;
}
