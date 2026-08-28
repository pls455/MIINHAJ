import type { AdminRole } from '../../types';

export type Permission = 'canManageResources' | 'canManageSubjects' | 'canManageDrive' | 'canManageAI' | 'canManageAdmins' | 'canViewLogs';

const permissions: Record<AdminRole, ReadonlySet<Permission>> = {
  reviewer: new Set([]),
  content_admin: new Set(['canManageResources', 'canManageSubjects']),
  superadmin: new Set(['canManageResources', 'canManageSubjects', 'canManageDrive', 'canManageAI', 'canManageAdmins', 'canViewLogs']),
};

export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return permissions[role]?.has(permission) ?? false;
}
