export type Permission =
  | 'manageBranches'
  | 'manageSubjects'
  | 'manageCategories'
  | 'manageResources'
  | 'manageFoundations'
  | 'manageFlashcards'
  | 'manageSolutions'
  | 'manageSuggestions'
  | 'manageProblemReports'
  | 'manageContributors'
  | 'manageTemplates'
  | 'manageAdmins'
  | 'manageLogs'
  | 'manageSettings'
  | 'manageDrive'
  | 'manageAI';

export type AdminRole = 'reviewer' | 'content_admin' | 'superadmin';

const CONTENT_PERMISSIONS: readonly Permission[] = [
  'manageSubjects', 'manageCategories', 'manageResources', 'manageFoundations',
  'manageFlashcards', 'manageSolutions', 'manageContributors', 'manageTemplates',
];

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  reviewer: ['manageSuggestions', 'manageProblemReports', 'manageLogs'],
  content_admin: [...CONTENT_PERMISSIONS, 'manageSuggestions', 'manageProblemReports', 'manageDrive', 'manageAI'],
  superadmin: [
    'manageBranches', ...CONTENT_PERMISSIONS, 'manageSuggestions', 'manageProblemReports',
    'manageContributors', 'manageTemplates', 'manageAdmins', 'manageLogs', 'manageSettings', 'manageDrive', 'manageAI',
  ],
};

export function hasPermission(role: AdminRole | undefined, permission: Permission): boolean {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false;
}
