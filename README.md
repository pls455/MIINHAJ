# مِنهَاج | MINHAJ

إعادة بناء نظيفة لمنصة منهاج باستخدام React + TypeScript + Vite + Firebase + Cloudflare Workers + Gemini.

## مبادئ
- Firestore هو مصدر الحقيقة للمحتوى الديناميكي.
- Firebase initialization مرة واحدة.
- Repository layer بدل استدعاءات Firestore داخل الصفحات.
- Cursor pagination بدل تحميل المجموعات كاملة.
- Gemini وGoogle Drive عبر Cloudflare Worker، ولا توجد أسرار في الواجهة.
- TypeScript strict مع منع `any` في CI.

## التشغيل
1. `cp .env.example .env`
2. ضع Firebase public configuration في `.env`.
3. `npm install`
4. `npm run dev`

## البنية
`src/app` للتطبيق والحماية، `components` للمكونات، `pages` للواجهات، `repositories` للوصول للبيانات، `services` للتكاملات، `types` للعقود، و`utils` للمنطق النقي.

راجع `docs/` و`MIGRATION.md` قبل أي تغيير على schema الإنتاج.
