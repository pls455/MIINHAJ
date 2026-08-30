import { mountShell } from '../components/layout.js';
import { escapeHtml } from '../core/utils.js';

mountShell('منصة تعليمية مرتبة', `<section class="hero"><div><span class="eyebrow">Minhaj 2.0</span><h2>كل ما تحتاجه للدراسة، مرتب في مكان واحد.</h2><p>فروع، مواد، مصادر، تأسيس، حلول، بطاقات ومساعد ذكي. لأن الطالب لديه امتحان، وليس وقتًا لتفقد أثر 5000 ملف.</p><div class="actions"><a class="button primary" href="subjects.html">ابدأ من المواد</a><a class="button" href="ai.html">✦ مركز الذكاء</a></div></div><div class="hero-art">مِنهَاج<br><small>تعلم · راجع · أنجز</small></div></section><section><div class="section-head"><h2>الفروع</h2><a href="subjects.html">كل المواد</a></div><div id="homeBranches" class="grid"><div class="empty">جاري تحميل الفروع...</div></div></section><section class="feature-grid"><a class="feature card" href="resources.html"><b>📚 المصادر</b><span>بحث وفلترة مع pagination حقيقية.</span></a><a class="feature card" href="foundation.html"><b>🧠 التأسيس</b><span>ابدأ من المستوى المناسب لك.</span></a><a class="feature card" href="flashcards.html"><b>🗂️ البطاقات</b><span>مراجعة سريعة على الهاتف.</span></a><a class="feature card" href="solutions.html"><b>✅ الحلول</b><span>أسئلة وحلول مرتبة.</span></a></section>`);

const root = document.getElementById('homeBranches');

async function loadBranches() {
  try {
    const { getAllSmall } = await import('../repositories/resourceRepository.js');
    const rows = await getAllSmall('branches');
    root.innerHTML = rows.map(x => `<a class="card branch-card" href="subjects.html?branch=${encodeURIComponent(x.id)}"><span>${escapeHtml(x.icon || '🌿')}</span><h3>${escapeHtml(x.name)}</h3><p>${escapeHtml(x.description || 'مواد ومصادر الفرع')}</p></a>`).join('') || '<div class="empty">لا توجد فروع متاحة.</div>';
  } catch (e) {
    console.error('[home] branches failed', e);
    root.innerHTML = '<div class="error-box">تعذر تحميل الفروع. يمكنك متابعة التصفح من القائمة.</div>';
  }
}

loadBranches();
