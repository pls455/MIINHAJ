# searchNormalized Migration

هذه migration غير مدمرة لإضافة `searchNormalized` إلى السجلات القديمة حتى يعمل بحث Firestore الجديد مع البيانات الموجودة.

## قبل التشغيل

1. تأكد أن credentials الخاصة بـ Firebase Admin متاحة للبيئة التي ستشغل منها السكربت.
2. خذ backup مناسبًا لقاعدة الإنتاج.
3. شغّل الاختبارات:

```bash
npm test -- scripts/migration/searchNormalized.test.ts
```

## Dry run

ابدأ دائمًا بدون كتابة:

```bash
npx tsx scripts/migration/searchNormalized.ts --dry-run
```

سيقرأ السجلات ويعرض لكل collection عدد `scanned`, `updated`, و`skipped` بدون تعديل Firestore.

## التنفيذ الفعلي

بعد مراجعة نتيجة الـ dry run:

```bash
npx tsx scripts/migration/searchNormalized.ts
```

السكربت يعالج البيانات على صفحات 100 سجل ويكتب batches بحد أقصى 400 عملية. لا يحذف documents ولا يستبدل fields أخرى.

## Idempotency

تشغيل migration أكثر من مرة آمن. إذا كانت قيمة `searchNormalized` مساوية للقيمة المحسوبة، يتم تجاوز السجل بدل الكتابة مرة أخرى.

## Rollback

هذه migration تضيف field فقط. لا يوجد rollback تلقائي يحذف `searchNormalized`، لأن الحذف قد يتعارض مع البحث الجديد. إذا لزم rollback، أوقف استخدام query الجديدة أولًا ثم نفّذ إزالة الحقل عبر migration منفصلة بعد مراجعة الأثر.

## ملاحظة

الـ script يستخدم Firebase Admin SDK ويجب تشغيله في بيئة server-side موثوقة، وليس من المتصفح. لا تضع service-account credentials داخل المستودع.
