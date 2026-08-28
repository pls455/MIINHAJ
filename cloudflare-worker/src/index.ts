import { z } from 'zod';

interface Env {
  GEMINI_API_KEY: string;
  GEMINI_MODEL?: string;
}

const corsHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const AiRequestSchema = z.object({ prompt: z.string().trim().min(1).max(6000) });
const json = (data: unknown, status = 200) => new Response(JSON.stringify(data), { status, headers: corsHeaders });

async function classify(request: Request, env: Env): Promise<Response> {
  if (!env.GEMINI_API_KEY) return json({ ok: false, error: 'AI service is not configured' }, 503);

  const contentLength = Number(request.headers.get('content-length') ?? 0);
  if (contentLength > 20_000) return json({ ok: false, error: 'Request too large' }, 413);

  const body = await request.json().catch(() => null);
  const parsedRequest = AiRequestSchema.safeParse(body);
  if (!parsedRequest.success) return json({ ok: false, error: 'Invalid request' }, 400);

  const model = env.GEMINI_MODEL || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const upstream = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: parsedRequest.data.prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
      }),
      signal: controller.signal,
    });
    const raw: unknown = await upstream.json().catch(() => ({}));
    if (!upstream.ok) return json({ ok: false, error: 'AI provider request failed' }, upstream.status === 429 ? 429 : 502);

    const output = ((raw as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }).candidates?.[0]?.content?.parts ?? [])
      .map((part) => part.text ?? '').join('').trim();
    const clean = output.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
    const result: unknown = JSON.parse(clean || '{}');
    return json({ ok: true, model, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'unknown';
    return json({ ok: false, error: message === 'The operation was aborted.' ? 'AI request timed out' : 'Unexpected AI error' }, 502);
  } finally {
    clearTimeout(timeout);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    if (request.method === 'GET' && url.pathname === '/health') return json({ ok: true, service: 'minhaj-api' });
    if (request.method === 'POST' && url.pathname === '/api/ai/classify') return classify(request, env);
    return json({ ok: false, error: 'Not found' }, 404);
  },
};
