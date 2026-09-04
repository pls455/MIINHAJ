import { mountShell } from '../components/layout.js';
import { askStudyQuestion, searchResourcesWithAI } from '../services/ai/aiService.js';
import { resourceRepository } from '../repositories/resourceRepository.js';
import { auth, db } from '../services/firebase.js';
import { doc, runTransaction, serverTimestamp } from 'https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js';

const AI_LIMIT = 3;
const AI_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

async function reserveStudentAiQuestion() {
  const user = auth.currentUser;
  if (!user) throw new Error('AI_LOGIN_REQUIRED');
  const ref = doc(db, 'studentAiUsage', user.uid);
  return runTransaction(db, async transaction => {
    const snap = await transaction.get(ref);
    const now = Date.now();
    const data = snap.exists() ? snap.data() : null;
    const started = data?.windowStartedAt?.toMillis?.() || 0;
    const expired = !started || now - started >= AI_WINDOW_MS;
    const used = expired ? 0 : Number(data?.count || 0);
    if (used >= AI_LIMIT) return { allowed: false, used, remaining: 0, resetAt: started + AI_WINDOW_MS };
    const next = used + 1;
    transaction.set(ref, {
      count: next,
      windowStartedAt: expired ? serverTimestamp() : data.windowStartedAt,
      updatedAt: serverTimestamp()
    });
    return { allowed: true, used: next, remaining: AI_LIMIT - next, resetAt: (expired ? now : started) + AI_WINDOW_MS };
  });
}

function quotaMessage(info) {
  const date = new Date(info.resetAt);
  return `استنفدت أسئلة الذكاء الثلاثة. يمكنك استخدام المساعد مجددًا بعد ${date.toLocaleDateString('ar-PS')} الساعة ${date.toLocaleTimeString('ar-PS', { hour: '2-digit', minute: '2-digit' })}.`;
}

mountShell('مركز الذكاء', `<section class="ai-layout"><div class="ai-quota" id="aiQuota">3 أسئلة كل 3 أيام</div><div id="messages" class="chat"></div><form id="chat" class="chat-form"><textarea id="q" required maxlength="3000" placeholder="اكتب سؤالك الدراسي هنا..."></textarea><button class="button primary" type="submit">إرسال السؤال</button></form></section><p class="muted">السياق المسترجع محدود ومحدد، ولا تُرسل قاعدة البيانات كاملة إلى Gemini.</p>`);

const messages = document.getElementById('messages');
const quotaEl = document.getElementById('aiQuota');
const add = (text, who = 'bot') => { const d = document.createElement('div'); d.className = `chat-msg ${who}`; d.textContent = text; messages.appendChild(d); messages.scrollTop = messages.scrollHeight; return d; };
add('اسأل عن درس، اطلب شرحًا، أو ابحث عن مصدر.');

function setQuota(info) {
  if (!info) return;
  quotaEl.textContent = info.allowed ? `متبقي ${info.remaining} من ${AI_LIMIT} أسئلة خلال 3 أيام` : quotaMessage(info);
  quotaEl.classList.toggle('exhausted', !info.allowed);
}

document.getElementById('chat').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('q');
  const q = input.value.trim();
  if (!q) return;
  if (!auth.currentUser) { add('سجّل الدخول أولًا لاستخدام مساعد منهاج.', 'bot'); return; }
  input.value = '';
  add(q, 'user');
  const wait = add('جارٍ البحث...');
  try {
    const quota = await reserveStudentAiQuestion();
    setQuota(quota);
    if (!quota.allowed) { wait.textContent = quotaMessage(quota); return; }

    const resourceIntent = /مصدر|درايف|drive|ملزمه|ملزمة|كتاب|ملخص|دوسيه|دوسية|حلول|امتحان|رابط/i.test(q);
    if (resourceIntent) {
      const term = q.split(/\s+/).find(x => x.length > 2) || q;
      const found = await resourceRepository.searchResources({ keyword: term }, 10, null).catch(() => ({ rows: [] }));
      const ai = await searchResourcesWithAI(q, found.rows || []);
      const ids = ai?.selectedIds || ai?.result?.selectedIds || [];
      const chosen = (found.rows || []).filter(x => ids.includes(x.id));
      wait.textContent = chosen.length
        ? 'أفضل المصادر:\n' + chosen.map(x => `${x.title} → ${x.url}`).join('\n')
        : 'لم أجد مصدرًا مطابقًا ضمن النتائج المسترجعة.';
      return;
    }
    const data = await askStudyQuestion(q, '');
    wait.textContent = data?.answer || data?.result?.answer || 'تعذر الحصول على إجابة حاليًا.';
  } catch (err) {
    console.error(err);
    if (err.message === 'AI_LOGIN_REQUIRED') wait.textContent = 'سجّل الدخول أولًا لاستخدام مساعد منهاج.';
    else if (err.code === 'permission-denied') wait.textContent = 'تعذر تسجيل حد استخدام المساعد. حاول تسجيل الدخول من جديد.';
    else wait.textContent = err.message || 'تعذر الاتصال بالمساعد حاليًا. جرّب لاحقًا.';
  }
});
