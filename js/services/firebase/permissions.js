import { ROLES, hasRole, requireAdmin as requireAdminCore } from './adminCore.js';

export { hasRole };
export function getRoleLevel(role) {
  if (role === 'superadmin' || role === 'admin') return 3;
  return hasRole(role, ROLES.SUPER_ADMIN) ? 3 : hasRole(role, ROLES.CONTENT_ADMIN) ? 2 : hasRole(role, ROLES.REVIEWER) ? 1 : 0;
}
export const isReviewer = role => hasRole(role, ROLES.REVIEWER);
export const isContentAdmin = role => hasRole(role, ROLES.CONTENT_ADMIN);
export const isSuperAdmin = role => hasRole(role, ROLES.SUPER_ADMIN);
export function assertRole(userRole, requiredRole) {
  if (!hasRole(userRole, requiredRole)) {
    const error = new Error('INSUFFICIENT_PERMISSIONS');
    error.code = 'permission-denied';
    throw error;
  }
  return true;
}
export const requireAdmin = requireAdminCore;
export const permissions = Object.freeze({ review: isReviewer, content: isContentAdmin, system: isSuperAdmin });
