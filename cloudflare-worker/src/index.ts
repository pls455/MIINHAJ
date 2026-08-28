import { z } from 'zod';

interface Env { GEMINI_API_KEY: string; GEMINI_MODEL?: string; }
interface GeminiPart { text?: string }
interface GeminiResponse { candidates?: Array<{ content?: { parts?: GeminiPart[] } }> }

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: corsHeaders });
const ChatRequestSchema = z.object({ question: z.string().trim().min(1).max(2000), context: z.string().trim().max(12000).optional() });
const ClassifyRequestSchema = z.object({ prompt: z.string().trim().min(1).max(6000) });

async function callGemini(prompt: string, env: Env, jsonMode = false): Promise<{ model: string; text: string }> {
  if (!env.GEMINI_API_KEY) throw new Error('AI service is not configured');
  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const upstream = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2, ...(jsonMode ? { responseMimeType: 'application/json' } : {}) } }), signal: controller.signal });
    const raw = await upstream.json().catch(() => ({})) as GeminiResponse;
    if (!upstream.ok) throw new Error(upstream.status === 429 ? 'AI rate limit reached' : 'AI provider request failed');
    const text = (raw.candidates?.[0]?.content?.parts ?? []).map((part) => part.text ?? '').join('').trim();
    if (!text) throw new Error('AI returned an empty response');
    return { model, text };
  } finally { clearTimeout(timeout); }
}

async function chat(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: 'Invalid request' }, 400);
  try {
    const context = parsed.data.context ? `\n\nالمصادر المرشحة من النظام:\n${parsed.data.context}` : '';
    const result = await callGemini(`أنت مساعد تعليمي لمنصة منهاج. أجب بالعربية بوضوح، ولا تخترع مصادر أو معلومات غير موجودة. السؤال: ${parsed.data.question}${context}`, env);
    return json({ ok: true, answer: result.text, resources: [], model: result.model });
  } catch (error) { return json({ ok: false, error: error instanceof Error ? error.message : 'AI error' }, 502); }
}

async function classify(request: Request, env: Env): Promise<Response> {
  const body = await request.json().catch(() => null);
  const parsed = ClassifyRequestSchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, error: 'Invalid request' }, 400);
  try {
    const result = await callGemini(`Return JSON only. Suggest classification for the supplied content. IDs must come only from the supplied options; if uncertain use empty IDs and needsReview=true.\n${parsed.data.prompt}`, env, true);
    const clean = result.text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const value: unknown = JSON.parse(clean);
    return json({ ok: true, model: result.model, result: value });
  } catch (error) { return json({ ok: false, error: error instanceof Error ? error.message : 'AI error' }, 502); }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, service: 'minhaj-api' });
    if (request.method === 'POST' && url.pathname === '/api/ai/chat') return chat(request, env);
    if (request.method === 'POST' && url.pathname === '/api/ai/classify') return classify(request, env);
    return json({ ok: false, error: 'Not found' }, 404);
  },
};
