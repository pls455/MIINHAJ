# Migration

المستودع القديم هو `pls455/Minhaj`. هذه النسخة لا تحذف بيانات Firebase ولا تعيد إنشاء المشروع.

## المرحلة الحالية
- تعريف domains وFirestore documents.
- فصل Firebase initialization.
- repository layer مع pagination.
- Auth + admin role guard.
- واجهة React أولية للمسارات الأساسية ولوحة الإدارة.

## المرحلة التالية
- قراءة schema الفعلي لكل collection ومطابقة الحقول.
- migration scripts غير مدمرة للحقول القديمة مثل `branchId` إلى `branchIds`.
- نقل Drive وGemini إلى Worker typed endpoints.
- استكمال CRUD المتخصص، bulk import، logs، analytics، واختبارات E2E.

لا تستخدم reset/delete على قاعدة الإنتاج أثناء migration.
