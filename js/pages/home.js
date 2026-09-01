import { mountShell } from '../components/layout.js';

mountShell('منصة تعليمية مرتبة', `<section class="hero"><div><span class="eyebrow">Minhaj 2.0</span><h2>كل ما تحتاجه للدراسة، مرتب في مكان واحد.</h2><p>فروع، مواد، مصادر، تأسيس، حلول، بطاقات ومساعد ذكي. لأن الطالب لديه امتحان، وليس وقتًا لتفقد أثر 5000 ملف.</p><div class="actions"><a class="button primary" href="subjects.html">ابدأ من المواد</a><a class="button" href="account.html">👤 حساب الطالب</a><a class="button" href="ai.html">✦ مركز الذكاء</a></div></div><div class="hero-art">مِنهَاج<br><small>تعلم · راجع · أنجز</small></div></section><section><div class="section-head"><h2>الفروع</h2><a href="subjects.html">كل المواد</a></div><div id="homeBranches" class="grid"><div class="empty">جاري تحميل الفروع...</div></div></section><section class="feature-grid"><a class="feature card" href="resources.html"><b>📚 المصادر</b><span>بحث وفلترة مع pagination حقيقية.</span></a><a class="feature card" href="foundation.html"><b>🧠 التأسيس</b><span>ابدأ من المستوى المناسب لك.</span></a><a class="feature card" href="flashcards.html"><b>🗂️ البطاقات</b><span>مراجعة سريعة على الهاتف.</span></a><a class="feature card" href="solutions.html"><b>✅ الحلول</b><span>أسئلة وحلول مرتبة.</span></a><a class="feature card" href="account.html"><b>👤 حساب الطالب</b><span>تسجيل اختياري لفتح ميزات التخصيص وحفظ التجربة.</span></a></section>`);

const root = document.getElementById('homeBranches');

function showState(className, text) {
  const state = document.createElement('div');
  state.className = className;
  state.setAttribute('role', className === 'error-box' ? 'alert' : 'status');
  state.textContent = text;
  root.replaceChildren(state);
}

async function loadBranches() {
  showState('loading', 'جاري تحميل الفروع...');
  try {
    const { getAllSmall } = await import('../repositories/resourceRepository.js');
    const rows = await getAllSmall('branches');
    root.replaceChildren();
    if (!rows.length) { showState('empty', 'لا توجد فروع متاحة.'); return; }
    rows.forEach(x => {
      const card = document.createElement('a');
      card.className = 'card branch-card';
      card.href = `subjects.html?branch=${encodeURIComponent(x.id)}`;
      const icon = document.createElement('span'); icon.textContent = x.icon || '🌿';
      const title = document.createElement('h3'); title.textContent = x.name || 'بدون اسم';
      const description = document.createElement('p'); description.textContent = x.description || 'مواد ومصادر الفرع';
      card.append(icon, title, description);
      root.append(card);
    });
  } catch (e) {
    console.error('[home] branches failed', e);
    showState('error-box', 'تعذر تحميل الفروع. يمكنك متابعة التصفح من القائمة.');
  }
}

loadBranches();
