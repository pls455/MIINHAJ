import { requireAuthenticatedAdmin } from './auth.js';
import { ROLES, ROLE_LEVELS } from '../../core/constants.js';

function normalizeRole(role) {
  if (role === 'superadmin' || role === 'admin') return ROLES.SUPER_ADMIN;
  return role;
}

export function level(role) {
  return ROLE_LEVELS[normalizeRole(role)] || 0;
}

export function hasRole(role, requiredRole = ROLES.REVIEWER) {
  return level(role) >= level(requiredRole);
}

export async function currentAdmin() {
  const { admin } = await requireAuthenticatedAdmin();
  return { ...admin, role: normalizeRole(admin.role) };
}

export async function requireAdmin(requiredRole = ROLES.REVIEWER) {
  const { user, admin } = await requireAuthenticatedAdmin();
  const normalizedAdmin = { ...admin, role: normalizeRole(admin.role) };
  if (!hasRole(normalizedAdmin.role, requiredRole)) {
    const error = new Error('INSUFFICIENT_PERMISSIONS');
    error.code = 'INSUFFICIENT_PERMISSIONS';
    throw error;
  }
  return { user, admin: normalizedAdmin };
}

export { ROLES };
