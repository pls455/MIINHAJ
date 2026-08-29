import { ROLE_LEVELS, ROLES } from "../../core/constants.js";

export function getRoleLevel(role) {
  return ROLE_LEVELS[role] ?? 0;
}

export function hasRole(userRole, requiredRole) {
  return getRoleLevel(userRole) >= getRoleLevel(requiredRole);
}

export function isReviewer(role) {
  return hasRole(role, ROLES.REVIEWER);
}

export function isContentAdmin(role) {
  return hasRole(role, ROLES.CONTENT_ADMIN);
}

export function isSuperAdmin(role) {
  return hasRole(role, ROLES.SUPER_ADMIN);
}

export function assertRole(userRole, requiredRole) {
  if (!hasRole(userRole, requiredRole)) {
    const error = new Error("INSUFFICIENT_PERMISSIONS");
    error.code = "permission-denied";
    throw error;
  }
  return true;
}

export async function requireAdmin(requiredRole = ROLES.REVIEWER) {
  const { currentAdmin } = await import("../auth.js");
  const admin = await currentAdmin();
  if (!admin) {
    const error = new Error("AUTH_REQUIRED");
    error.code = "AUTH_REQUIRED";
    throw error;
  }
  assertRole(admin.role, requiredRole);
  return admin;
}

export const permissions = Object.freeze({
  review: isReviewer,
  content: isContentAdmin,
  system: isSuperAdmin,
});
