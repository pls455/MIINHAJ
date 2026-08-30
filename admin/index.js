// Admin bootstrap: keep the dashboard available even when an optional module fails to parse.
// Optional admin modules should be loaded lazily by their feature entry points.
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
