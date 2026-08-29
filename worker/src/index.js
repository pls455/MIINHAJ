const ALLOWED_ORIGINS = new Set((globalThis.ALLOWED_ORIGINS || '').split(',').map((v) => v.trim()).filter(Boolean));
const MAX_BODY = 20000;
const MAX_CONTEXT = 12000;

function cors(origin) {
  const allowed = ALLOWED_ORIGINS.size === 0 || ALLOWED_ORIGINS.has(origin) ? origin || '*' : '';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin'
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) } });
}

function normalizeAction(value) {
  return ['ask', 'classify', 'generate_questions', 'assess_level', 'study_plan'].includes(value) ? value : null;
}

function promptFor(action, data) {
  const context = String(data.context || '').slice(0, MAX_CONTEXT);
  if (action === 'ask') return `أنت مساعد "منهاج" التعليمي. أجب بالعربية بوضوح. استخدم السياق فقط عندما يكون متعلقًا بالسؤال، ولا تدّعِ قراءة محتوى غير موجود. السؤال: ${String(data.question || '').slice(0, 3000)}\nالسياق: ${context || 'لا يوجد'}\nأعد JSON فقط: {"answer":"...","confidence":0,"usedContext":true,"sources":[]}`;
  if (action === 'classify') return `صنّف مصدرًا تعليميًا اعتمادًا فقط على الأدلة. لا تخترع IDs أو معلومات. الاسم: ${String(data.name || '').slice(0,500)}\nالمسار: ${String(data.path || '').slice(0,2000)}\nالوصف: ${String(data.description || '').slice(0,2000)}\nالملفات القريبة: ${JSON.stringify(Array.isArray(data.siblings) ? data.siblings.slice(0,40) : [])}\nأعد JSON فقط: {"branch":"غير محدد","subject":"غير محدد","category":"غير محدد","confidence":{"branch":0,"subject":0,"category":0,"overall":0},"evidence":[],"needsReview":true,"reason":"..."}`;
  if (action === 'generate_questions') return `أنشئ أسئلة من المحتوى فقط. المادة: ${String(data.subject || '').slice(0,300)}. العدد: ${Math.min(Math.max(Number(data.count) || 10,1),20)}. الصعوبة: ${String(data.difficulty || 'متوسط').slice(0,30)}. المحتوى: ${context}\nأعد JSON فقط: {"questions":[{"question":"...","type":"mcq|true_false|short","options":[],"answer":"...","explanation":"..."}]}`;
  if (action === 'assess_level') return `قيّم إجابات الطالب مقارنة بالأسئلة المقدمة فقط. المادة: ${String(data.subject || '').slice(0,300)}\nالأسئلة: ${String(data.questions || '').slice(0,9000)}\nالإجابات: ${String(data.answers || '').slice(0,9000)}\nأعد JSON فقط: {"score":0,"level":"مبتدئ","strengths":[],"weaknesses":[],"recommendations":[]}`;
  return `أنشئ خطة دراسة واقعية. المواد: ${String(data.subjects || '').slice(0,2500)}. الأيام: ${Math.min(Math.max(Number(data.days)||7,1),30)}. ساعات يوميًا: ${Math.min(Math.max(Number(data.hoursPerDay)||2,0.5),12)}. المستوى: ${String(data.level||'متوسط').slice(0,100)}. الهدف: ${String(data.goal||'تحسين التحصيل').slice(0,1000)}. أعد JSON فقط: {"summary":"...","days":[],"tips":[]}`;
}

async function callGemini(env, prompt) {
  if (!env.GEMINI_API_KEY) throw new Error('AI service is not configured');
  const model = env.GEMINI_MODEL || 'gemini-3.6-flash';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST', signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } })
    });
    if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
    const body = await response.json();
    const text = body?.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    if (!text) throw new Error('Empty Gemini response');
    try { return JSON.parse(text.replace(/^```json\s*|\s*```$/g, '')); } catch { throw new Error('Invalid Gemini JSON'); }
  } finally { clearTimeout(timeout); }
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
    if (new URL(request.url).pathname === '/health' && request.method === 'GET') return json({ ok: true, service: 'minhaj-ai' }, 200, origin);
    if (request.method !== 'POST' || new URL(request.url).pathname !== '/ai') return json({ ok: false, error: 'Not found' }, 404, origin);
    if (ALLOWED_ORIGINS.size && !ALLOWED_ORIGINS.has(origin)) return json({ ok: false, error: 'Origin not allowed' }, 403, origin);
    if (!env.GEMINI_API_KEY) return json({ ok: false, error: 'AI service unavailable' }, 503, origin);
    let data;
    try {
      const length = Number(request.headers.get('content-length') || 0);
      if (length > MAX_BODY) return json({ ok:false, error:'Request too large' }, 413, origin);
      data = await request.json();
    } catch { return json({ ok:false, error:'Invalid JSON' }, 400, origin); }
    const action = normalizeAction(data.action);
    if (!action) return json({ ok:false, error:'Invalid action' }, 400, origin);
    if (action === 'ask' && !String(data.question || '').trim()) return json({ ok:false, error:'Question is required' }, 400, origin);
    try {
      const result = await callGemini(env, promptFor(action, data));
      return json({ ok:true, result, ai:{ provider:'Gemini', model:env.GEMINI_MODEL || 'gemini-3.6-flash', action } }, 200, origin);
    } catch (error) {
      console.error(error);
      const message = error?.name === 'AbortError' ? 'AI request timed out' : 'AI request failed';
      return json({ ok:false, error:message }, 502, origin);
    }
  }
};
