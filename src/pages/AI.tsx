import { useRef, useState } from 'react';
import { askAI } from '../services/ai';
import type { AIResponse } from '../types';

export function AI() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestRef = useRef<AbortController | null>(null);

  async function ask() {
    const value = question.trim();
    if (!value || loading) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true); setError('');
    try { setAnswer(await askAI({ question: value }, controller.signal)); }
    catch (e) { if ((e as Error).name !== 'AbortError') setError(e instanceof Error ? e.message : 'تعذر تنفيذ الطلب.'); }
    finally { if (requestRef.current === controller) { requestRef.current = null; setLoading(false); } }
  }

  return <section className="narrow">
    <h1>مساعد منهاج</h1>
    <p>يستقبل المساعد السؤال عبر Cloudflare Worker بدل كشف مفتاح Gemini للمتصفح.</p>
    <textarea value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={2000} placeholder="اكتب سؤالك الدراسي..." aria-label="السؤال" />
    <button className="button" disabled={loading || !question.trim()} onClick={() => void ask()}>{loading ? 'جارٍ التفكير...' : 'اسأل'}</button>
    {error && <div className="error" role="alert">{error}</div>}
    {answer && <article className="card"><p>{answer.answer}</p>{answer.resources.length > 0 && <ul>{answer.resources.map((resource) => <li key={resource.id}><a href={resource.url} target="_blank" rel="noopener noreferrer">{resource.title}</a></li>)}</ul>}</article>}
  </section>;
}
