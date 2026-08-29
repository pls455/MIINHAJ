const AI_URL = window.MINHAJ_AI_URL || 'https://minhaj-ai.example.workers.dev';

async function request(action, payload = {}) {
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
    throw error;
  } finally { clearTimeout(timer); }
}

export const askStudyQuestion = (question, context = '') => request('ask', { question, context });
export const searchResourcesWithAI = (question, resources = []) => request('ask', { question, context: resources });
export const classifyResource = (input) => request('classify', input);
export const generateQuestions = (input) => request('generate_questions', input);
export const assessLevel = (input) => request('assess_level', input);
export const generateStudyPlan = (input) => request('study_plan', input);
