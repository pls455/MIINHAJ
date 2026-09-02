import { observeAuth } from '../services/firebase/auth.js';
import { currentAdmin, hasRole, ROLES } from '../services/firebase/adminCore.js';

observeAuth(async user => {
  if (!user) return;
  try {
    const admin = await currentAdmin();
    if (!admin?.active || !hasRole(admin.role, ROLES.SUPER_ADMIN)) return;
    const nav = document.getElementById('adminNav');
    if (!nav || nav.querySelector('[data-students-link]')) return;
    const link = document.createElement('a');
    link.className = 'admin-nav';
    link.href = 'students.html';
    link.textContent = 'الطلاب المسجلون';
    link.dataset.studentsLink = '1';
    nav.prepend(link);
  } catch (error) {
    console.error('[admin.students-link]', error);
  }
});
