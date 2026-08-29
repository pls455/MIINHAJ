import { requireAuth, currentAdmin } from "../auth.js";
import { ROLES, hasRole } from "../../core/constants.js";

export async function requireAdmin(role = ROLES.REVIEWER) {
  const user = await requireAuth();
  const admin = await currentAdmin();
  if (!admin || !hasRole(admin.role, role)) {
    const error = new Error("INSUFFICIENT_PERMISSIONS");
    error.code = "INSUFFICIENT_PERMISSIONS";
    throw error;
  }
  return { user, admin };
}

export { ROLES, hasRole };
