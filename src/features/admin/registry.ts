export type AdminPermission =
  | 'viewDashboard'
  | 'manageBranches'
  | 'manageSubjects'
  | 'manageCategories'
  | 'manageResources'
  | 'manageFoundations'
  | 'manageFlashcards'
  | 'manageSolutions'
  | 'reviewSuggestions'
  | 'reviewReports'
  | 'manageContributors'
  | 'manageTemplates'
  | 'manageDrive'
  | 'manageAI'
  | 'manageAdmins'
  | 'viewLogs'
  | 'viewAnalytics'
  | 'manageSettings';

export interface AdminModuleDefinition {
  id: string;
  label: string;
  path: string;
  permission: AdminPermission;
  description: string;
}

export const ADMIN_MODULES: readonly AdminModuleDefinition[] = [
  ['dashboard', 'لوحة التحكم', '/admin', 'viewDashboard', 'الإحصائيات والنشاط الأخير'],
  ['branches', 'الفروع', '/admin/branches', 'manageBranches', 'إدارة الفروع وترتيبها وحالتها'],
  ['subjects', 'المواد', '/admin/subjects', 'manageSubjects', 'إدارة المواد وعلاقات الفروع'],
  ['categories', 'التصنيفات', '/admin/categories', 'manageCategories', 'إدارة التصنيفات والتحقق من العلاقات'],
  ['resources', 'المصادر', '/admin/resources', 'manageResources', 'إدارة المصادر والروابط والمحتوى'],
  ['foundations', 'التأسيس', '/admin/foundations', 'manageFoundations', 'إدارة محتوى التأسيس'],
  ['flashcards', 'البطاقات', '/admin/flashcards', 'manageFlashcards', 'إدارة مجموعات البطاقات'],
  ['solutions', 'الحلول', '/admin/solutions', 'manageSolutions', 'إدارة الحلول والمشاكل'],
  ['suggestions', 'الاقتراحات', '/admin/suggestions', 'reviewSuggestions', 'مراجعة اقتراحات الطلاب'],
  ['reports', 'البلاغات', '/admin/reports', 'reviewReports', 'مراجعة البلاغات'],
  ['contributors', 'المساهمون', '/admin/contributors', 'manageContributors', 'إدارة بيانات المساهمين'],
  ['templates', 'القوالب', '/admin/templates', 'manageTemplates', 'إدارة قوالب الإدخال'],
  ['drive', 'Google Drive', '/admin/drive', 'manageDrive', 'الفحص والمراجعة والاستيراد'],
  ['ai', 'الذكاء الاصطناعي', '/admin/ai', 'manageAI', 'إعدادات وتصنيف AI'],
  ['admins', 'المشرفون', '/admin/admins', 'manageAdmins', 'المستخدمون والصلاحيات'],
  ['logs', 'السجلات', '/admin/logs', 'viewLogs', 'سجل العمليات الحساسة'],
  ['analytics', 'التحليلات', '/admin/analytics', 'viewAnalytics', 'مؤشرات الاستخدام والتكلفة'],
  ['settings', 'الإعدادات', '/admin/settings', 'manageSettings', 'إعدادات المنصة والتكاملات'],
].map(([id, label, path, permission, description]) => ({ id, label, path, permission, description })) as readonly AdminModuleDefinition[];

export function modulesForPermissions(can: (permission: AdminPermission) => boolean): AdminModuleDefinition[] {
  return ADMIN_MODULES.filter(({ permission }) => can(permission));
}
