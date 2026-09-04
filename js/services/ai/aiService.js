const AI_URL = String(window.MINHAJ_AI_URL || '').trim().replace(/\/$/, '');

if (!AI_URL) console.warn('[ai] MINHAJ_AI_URL is not configured. AI features are disabled.');

async function request(action, payload = {}) {
  if (!AI_URL) throw new Error('AI_NOT_CONFIGURED');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(`${AI_URL}/ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok) throw new Error(data.error || `AI HTTP ${response.status}`);
    return data.result;
  } catch (error) {
    console.error('[ai]', error);
    if (error.name === 'AbortError') throw new Error('انتهت مهلة الاتصال بمساعد منهاج.');
    if (error.message === 'AI_NOT_CONFIGURED') throw new Error('مساعد منهاج غير مهيأ حاليًا.');
    throw error;
  } finally { clearTimeout(timer); }
}

export const askStudyQuestion = (question, context = '') => request('ask', { question, context });
export const searchResourcesWithAI = (question, resources = []) => request('resource_search', {
  question,
  resources: JSON.stringify(Array.isArray(resources) ? resources : [])
});
export const classifyResource = (input) => request('classify', input);
export const generateQuestions = (input) => request('generate_questions', input);
export const assessLevel = (input) => request('assess_level', input);
export const generateStudyPlan = (input) => request('study_plan', input);
