import { requireAuthenticatedAdmin } from './auth.js?v=20260904-authfix';
import { ROLES, ROLE_LEVELS } from '../../core/constants.js';

function normalizeRole(role) {
  const value = String(role || '').trim().toLowerCase();
  if (['superadmin','super_admin','admin','super-admin','مدير النظام','المدير العام'].includes(value)) return ROLES.SUPER_ADMIN;
  if (['contentadmin','content_admin','content-admin','مدير المحتوى'].includes(value)) return ROLES.CONTENT_ADMIN;
  if (['reviewer','مراجع','مراجع المصادر'].includes(value)) return ROLES.REVIEWER;
  return role;
}

export function level(role) { return ROLE_LEVELS[normalizeRole(role)] || 0; }
export function hasRole(role, requiredRole = ROLES.REVIEWER) { return level(role) >= level(requiredRole); }
export async function currentAdmin() { const { admin } = await requireAuthenticatedAdmin(); return { ...admin, role: normalizeRole(admin.role) }; }
export async function requireAdmin(requiredRole = ROLES.REVIEWER) {
  const { user, admin } = await requireAuthenticatedAdmin();
  const normalizedAdmin = { ...admin, role: normalizeRole(admin.role) };
  if (!hasRole(normalizedAdmin.role, requiredRole)) { const error = new Error('INSUFFICIENT_PERMISSIONS'); error.code = 'INSUFFICIENT_PERMISSIONS'; throw error; }
  return { user, admin: normalizedAdmin };
}
export { ROLES };
