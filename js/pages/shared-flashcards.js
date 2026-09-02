import { mountShell } from '../components/layout.js';
import { auth } from '../services/firebase.js';
import { initStudentAuth } from '../services/studentAuth.js';
import { escapeHtml } from '../core/utils.js';
import { copySharedFlashcardSet, getSharedFlashcardSet } from '../repositories/studentFlashcardRepository.js';

mountShell('مجموعة بطاقات مشتركة', `<style>
.shared{max-width:820px;margin:auto}.shared-card{padding:24px;border:1px solid var(--color-border);border-radius:22px;background:var(--color-surface);box-shadow:var(--shadow-md);margin-bottom:16px}.study{display:flex;flex-direction:column;gap:18px}.study-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}.study-counter{font-weight:700;color:var(--color-muted)}.shared-flip{perspective:1100px;min-height:300px;cursor:pointer;outline:none}.shared-flip-inner{position:relative;width:100%;min-height:300px;transition:transform .65s cubic-bezier(.2,.7,.2,1);transform-style:preserve-3d}.shared-flip.is-flipped .shared-flip-inner{transform:rotateY(180deg)}.shared-face{position:absolute;inset:0;box-sizing:border-box;padding:32px;border-radius:26px;color:#fff;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;flex-direction:column;justify-content:center;box-shadow:0 18px 44px rgba(20,10,45,.22);overflow:hidden}.shared-face:before{content:'';position:absolute;inset:0 0 auto;height:6px;background:rgba(255,255,255,.45)}.shared-question{background:var(--card-bg)}.shared-answer{background:var(--card-answer-bg);transform:rotateY(180deg)}.shared-face h3{margin:12px 0;font-size:25px;line-height:1.8;position:relative}.shared-answer-text{font-size:21px;line-height:1.9;white-space:pre-wrap;position:relative}.shared-hint{margin-top:20px;color:rgba(255,255,255,.78);font-size:13px;position:relative}.study-actions{display:flex;justify-content:space-between;gap:10px}.study-actions .button{min-width:120px}.muted{color:var(--color-muted)}.actions{display:flex;gap:8px;flex-wrap:wrap}
</style><div id="shared" class="shared"></div>`);

const root=document.getElementById('shared');
const id=new URLSearchParams(location.search).get('set');
const palettes=[
  ['linear-gradient(135deg,#4f46e5,#7c3aed)','linear-gradient(135deg,#4338ca,#6d28d9)'],
  ['linear-gradient(135deg,#0284c7,#06b6d4)','linear-gradient(135deg,#0369a1,#0e7490)'],
  ['linear-gradient(135deg,#059669,#14b8a6)','linear-gradient(135deg,#047857,#0f766e)'],
  ['linear-gradient(135deg,#db2777,#ef4444)','linear-gradient(135deg,#be185d,#dc2626)'],
  ['linear-gradient(135deg,#ea580c,#f59e0b)','linear-gradient(135deg,#c2410c,#d97706)']
];

function cardMarkup(card,index,total){
  const [bg,answerBg]=palettes[index%palettes.length];
  return `<article class="shared-flip" tabindex="0" role="button" aria-label="اضغط لقلب البطاقة" style="--card-bg:${bg};--card-answer-bg:${answerBg}" data-flip>
    <div class="shared-flip-inner">
      <div class="shared-face shared-question"><span class="eyebrow">السؤال · ${index+1} من ${total}</span><h3>${escapeHtml(card.question)}</h3><span class="shared-hint">اضغط على البطاقة لإظهار الإجابة</span></div>
      <div class="shared-face shared-answer"><span class="eyebrow">الإجابة · ${index+1} من ${total}</span><div class="shared-answer-text">${escapeHtml(card.answer)}</div><span class="shared-hint">اضغط على البطاقة للعودة للسؤال</span></div>
    </div>
  </article>`;
}

function renderStudy(set){
  const cards=Array.isArray(set.cards)?set.cards.filter(c=>c&&c.question&&c.answer):[];
  let index=0;
  let flipped=false;
  const total=cards.length;

  if(!total){
    root.innerHTML=`<section class="shared-card"><h2>لا توجد بطاقات في هذه المجموعة</h2><p class="muted">المجموعة مشتركة، لكن يبدو أن البطاقات أخذت إجازة جماعية.</p></section>`;
    return;
  }

  const draw=()=>{
    const card=cards[index];
    flipped=false;
    root.innerHTML=`<section class="shared-card">
      <div class="study-head"><div><span class="eyebrow">مجموعة مشتركة</span><h1>${escapeHtml(set.title)}</h1></div><span class="study-counter">البطاقة ${index+1} من ${total}</span></div>
      <p class="muted">${escapeHtml(set.description||'بطاقات مشتركة من مِنهَاج.')}</p>
      <div class="study">
        ${cardMarkup(card,index,total)}
        <div class="study-actions"><button id="prev" class="button" type="button" ${index===0?'disabled':''}>السابق</button><button id="next" class="button primary" type="button" ${index===total-1?'disabled':''}>التالي</button></div>
      </div>
    </section>
    <section class="shared-card"><div class="actions"><button id="copy" class="button primary" type="button">إضافة إلى بطاقاتي</button><a class="button" href="account.html">تسجيل الدخول / إنشاء حساب</a></div><p id="msg" class="message"></p></section>`;

    const cardEl=root.querySelector('[data-flip]');
    const flip=()=>{flipped=!flipped;cardEl.classList.toggle('is-flipped',flipped)};
    cardEl.onclick=flip;
    cardEl.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();flip()}};
    root.querySelector('#prev').onclick=()=>{if(index>0){index--;draw()}};
    root.querySelector('#next').onclick=()=>{if(index<total-1){index++;draw()}};
    root.querySelector('#copy').onclick=async()=>{
      const msg=root.querySelector('#msg');
      if(!auth.currentUser){msg.textContent='سجّل الدخول أولًا حتى نضيف المجموعة إلى بطاقاتك.';msg.classList.add('error');return}
      try{
        const newId=await copySharedFlashcardSet(id);
        msg.textContent='تمت إضافة نسخة إلى بطاقاتك.';
        setTimeout(()=>location.href=`my-flashcards.html?set=${encodeURIComponent(newId)}`,500);
      }catch(err){
        msg.textContent=`تعذر نسخ المجموعة: ${err?.code||err?.message||'خطأ غير معروف'}`;
        msg.classList.add('error');
      }
    };
  };

  draw();
}

await initStudentAuth();
try{
  const set=await getSharedFlashcardSet(id);
  if(!set)root.innerHTML='<section class="shared-card"><h2>المجموعة غير موجودة</h2><p class="muted">قد يكون الرابط غير صحيح أو تم إلغاء المشاركة.</p></section>';
  else renderStudy(set);
}catch(error){
  console.error(error);
  root.innerHTML=`<section class="shared-card"><h2>تعذر تحميل المجموعة</h2><p class="muted">${escapeHtml(error?.code||'حاول تحديث الصفحة.')}</p></section>`;
}
