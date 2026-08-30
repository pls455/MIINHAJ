// Admin bootstrap: optional admin modules must not block initial dashboard rendering.
import { requireAdmin } from './auth.js';
import { initAdminDashboard } from './dashboard.js';

async function bootstrapAdmin() {
  const root = document.querySelector('[data-admin-root]');
  if (!root) return;

  try {
    const admin = await requireAdmin();
    await initAdminDashboard(root, admin);
  } catch (error) {
    console.error('[Admin] bootstrap failed:', error);
    root.innerHTML = `
      <section class="admin-error" role="alert">
        <h1>تعذر تحميل صفحة الإدارة</h1>
        <p>حدث خطأ أثناء تحميل لوحة الإدارة. حاول تحديث الصفحة.</p>
      </section>`;
  }
}

bootstrapAdmin();
