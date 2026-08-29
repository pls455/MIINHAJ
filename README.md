# مِنهَاج | Minhaj 2.0

إعادة بناء كاملة لمنصة مِنهَاج باستخدام HTML5 وCSS3 وVanilla JavaScript ES Modules وFirebase وCloudflare Workers/Gemini. لا React، لا TypeScript، ولا حفلة build لمجرد عرض `index.html`.

## المعمارية
- `*.html`: صفحات مستقلة، مناسبة لـ GitHub Pages.
- `css/`: متغيرات، مكونات، responsive، وإدارة.
- `js/components/`: واجهات مشتركة.
- `js/services/firebase/`: اتصال Firebase.
- `js/services/ai/`: عميل Cloudflare Worker.
- `js/repositories/`: طبقة Firestore مع pagination/cursors وfilters.
- `js/pages/`: منطق صفحات الطلاب.
- `js/admin/`: المصادقة، الصلاحيات، CRUD، السجل والاستيراد.
- `cloudflare-worker/`: Gateway إلى Gemini.

## Firebase
المشروع يستخدم Firebase الحالي `minhaj-1be6f`. إعداد العميل الموجود في `js/services/firebase.js` ليس سرًا، أما مفاتيح Gemini فلا توضع في المستودع.

القواعد موجودة في `firestore.rules`. الأدوار: `reviewer`، `content_admin`، `superadmin`.

## البيانات
الطبقة المركزية تدعم: branches, subjects, categories, resources, foundations, solutions, flashcards, suggestions, problemReports, templates, sourceRegistry, admins وadminLogs، مع دعم IDs مستقرة وعلاقات قائمة على IDs.

## الأداء
صفحات المصادر لا تستخدم `getDocs(collection(resources))` ولا تحمل آلاف المستندات. الاستعلامات تستخدم filters داخل Firestore و`limit` و`startAfter`، والواجهة تعرض 20-24 عنصرًا في الدفعة. البحث النصي الكامل داخل Firestore محدود بطبيعة Firestore، لذلك البحث المدعوم هنا هو prefix على الحقل المناسب، مع filters منظمة.

## AI / Gemini
الواجهة تتصل بـ Cloudflare Worker. الـ Worker يوفّر `/health` و`/ai` و`/resource-search` و`/study-plan` و`/classify`. ضع `GEMINI_API_KEY` كـ Worker Secret، ويمكن ضبط `GEMINI_MODEL` و`ALLOWED_ORIGIN` كمتغيرات بيئة.

مثال إعداد الأسرار عبر Wrangler:
```bash
wrangler secret put GEMINI_API_KEY
```
ثم انشر Worker من مجلد `cloudflare-worker`.

## التشغيل
لا يوجد build مطلوب للموقع. افتح عبر خادم static محلي عند الحاجة، أو انشر الجذر مباشرة على GitHub Pages. لا تفتح صفحات ES Modules من `file://` في بعض المتصفحات.

## Bulk Import
من لوحة الإدارة استخدم Bulk Import: ألصق JSON، نفّذ Preview، راجع الأخطاء والتكرارات، ثم نفّذ الاستيراد. التنفيذ يتم على دفعات 400 عملية كحد أقصى لكل batch.

## ملاحظات الهجرة
لم تُنفّذ أي عملية حذف على بيانات Firebase الحقيقية. إعادة البناء تستخدم الـ schema والـ collections الموجودة كمرجع، وتجنب migrations destructive. قبل أي تغيير schema فعلي، نفّذ migration منفصلًا ومُسجلًا.

## GitHub Pages
الموقع static بالكامل. استخدم branch `main` كمصدر النشر. Worker مستقل عن GitHub Pages.
