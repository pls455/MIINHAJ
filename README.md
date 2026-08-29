# مِنهَاج | Minhaj 2.0

إعادة بناء كاملة لمنصة مِنهَاج باستخدام HTML5 وCSS3 وVanilla JavaScript ES Modules وFirebase وCloudflare Workers/Gemini.

## المبدأ
- لا React.
- لا TypeScript.
- لا SPA framework.
- لا build step للموقع static.
- لا Mock data في الإنتاج.
- لا حذف destructive لبيانات Firebase.

## المعمارية
- `*.html`: صفحات مستقلة مناسبة لـ GitHub Pages.
- `css/`: design tokens، layout، components، responsive، admin.
- `js/components/`: واجهات مشتركة مثل shell/navigation/UI states.
- `js/services/firebase/`: auth، permissions، Firestore access.
- `js/services/ai/`: عميل Cloudflare Worker.
- `js/repositories/`: طبقة البيانات والاستعلامات والـ pagination.
- `js/pages/`: منطق صفحات الطلاب.
- `js/admin/`: منطق لوحة الإدارة.
- `cloudflare-worker/`: gateway إلى Gemini.
- `tests/`: smoke checks للمشروع static.

## Firebase
المشروع يستخدم Firebase الحالي `minhaj-1be6f`. إعداد Firebase client ليس secret. **لا تضع Gemini API key في frontend أو GitHub.**

القواعد موجودة في `firestore.rules`. الأدوار: `reviewer`، `content_admin`، `superadmin`.

### Collections
الطبقة المركزية تدعم: `branches`, `subjects`, `categories`, `resources`, `foundations`, `solutions`, `flashcards`, `suggestions`, `problemReports`, `templates`, `sourceRegistry`, `admins`, `adminLogs`.

لا تعتمد العلاقات على أسماء العناصر، بل على IDs مستقرة حيث يدعمها النموذج.

## Resources & Performance
استعلامات المصادر bounded وليست تحميلًا كاملًا للمجموعة. استخدم `limit` وcursors وfilters، والبحث النصي الكامل يجب ألا يُنفذ عبر تحميل آلاف الوثائق للمتصفح. عند الحاجة إلى full-text search، أضف search index/service مخصص بدل تحويل Firestore إلى محرك بحث بالقوة.

## Admin
الأدوار:
- **Reviewer:** مراجعة المحتوى والاقتراحات والبلاغات وفق الصلاحيات.
- **Content Admin:** إدارة المحتوى.
- **Super Admin:** إدارة كاملة وصلاحيات الإدارة العليا.

التحكم في الصلاحيات يجب أن يكون موجودًا في JavaScript لتجربة المستخدم **وفي Firestore Rules للحماية الفعلية**.

## AI / Gemini
التدفق:

`User → AI Service → Cloudflare Worker → Gemini`

ولا تُرسل قاعدة البيانات كاملة إلى Gemini. استخدم retrieval/filtering ثم أرسل فقط السياق المرتبط بالسؤال.

الـ Worker يدعم حسب النسخة الحالية endpoints مثل `/health` و`/ai` وعمليات البحث/الخطة والتصنيف. اضبط:

```text
GEMINI_API_KEY   Worker Secret
GEMINI_MODEL     Worker environment variable
ALLOWED_ORIGIN   Worker environment variable
```

### Cloudflare deployment
من مجلد الـ Worker:

```bash
wrangler secret put GEMINI_API_KEY
wrangler deploy
```

بعد النشر، ضع عنوان الـ Worker الفعلي في إعداد عميل AI بدل أي placeholder.

## التشغيل المحلي
لأن الصفحات تستخدم ES Modules، استخدم static server بدل `file://`:

```bash
python3 -m http.server 8080
```

ثم افتح `http://localhost:8080`.

## GitHub Pages
الموقع static ويتم نشره من `main` عبر `.github/workflows/pages.yml`.

في GitHub:
1. `Settings` → `Pages`.
2. اختر `GitHub Actions` كمصدر النشر.
3. ادفع التغييرات إلى `main`.
4. راقب workflow حتى يصبح `success`.

## Smoke Test
الاختبار الموجود في `tests/smoke-test.mjs` يفحص الملفات الأساسية ومراجع frontend الممنوعة. إذا أردت تشغيله محليًا:

```bash
node tests/smoke-test.mjs
```

## Bulk Import
التدفق المقصود:

`JSON → Validation → Preview/Dry Run → Duplicate Detection → Execute`

لا تنفذ import على بيانات حقيقية قبل مراجعة الـ preview.

## Security checklist
- Gemini key خارج frontend.
- Firestore Rules هي طبقة الحماية النهائية.
- Escape للبيانات المعروضة.
- تحقق من روابط المصادر قبل حفظها.
- لا تستخدم `catch {}` لإخفاء الأخطاء.
- تجنب listeners realtime على collections ضخمة بلا حاجة.
- لا تحمل آلاف المصادر إلى المتصفح للبحث.

## Migration
لم تُنفذ عملية حذف لبيانات Firebase الحقيقية. أي تغيير schema يجب أن يكون migration منفصلًا، non-destructive، idempotent، ومسجلًا قبل تطبيقه على الإنتاج.

## Status
Deployment الخاص بـ GitHub Pages تم التحقق منه كـ `success` بعد ضبط Pages على GitHub Actions. يبقى نشر Cloudflare Worker وربط عنوانه الفعلي خطوة تشغيلية منفصلة عن GitHub Pages.
