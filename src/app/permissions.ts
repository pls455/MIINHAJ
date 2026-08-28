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
  | 'manageTemplates';

export type AdminRole = 'reviewer' | 'content_admin' | 'superadmin';

const ROLE_PERMISSIONS: Record<AdminRole, readonly Permission[]> = {
  reviewer: ['manageSuggestions', 'manageProblemReports'],
  content_admin: [
    'manageBranches', 'manageSubjects', 'manageCategories', 'manageResources',
    'manageFoundations', 'manageFlashcards', 'manageSolutions', 'manageContributors', 'manageTemplates',
    'manageSuggestions', 'manageProblemReports',
  ],
  superadmin: [
    'manageBranches', 'manageSubjects', 'manageCategories', 'manageResources',
    'manageFoundations', 'manageFlashcards', 'manageSolutions', 'manageSuggestions',
    'manageProblemReports', 'manageContributors', 'manageTemplates',
  ],
};

export function hasPermission(role: AdminRole | undefined, permission: Permission): boolean {
  return role ? ROLE_PERMISSIONS[role].includes(permission) : false;
}
