import type { Permission } from '../../app/permissions';

export interface AdminModuleDefinition {
  id: string;
  label: string;
  path: string;
  permission: Permission;
  description: string;
}

export const ADMIN_MODULES: readonly AdminModuleDefinition[] = [
  { id: 'dashboard', label: 'لوحة التحكم', path: '/admin', permission: 'viewDashboard', description: 'الإحصائيات والنشاط الأخير' },
  { id: 'branches', label: 'الفروع', path: '/admin/branches', permission: 'manageBranches', description: 'إدارة الفروع وترتيبها وحالتها' },
  { id: 'subjects', label: 'المواد', path: '/admin/subjects', permission: 'manageSubjects', description: 'إدارة المواد وعلاقات الفروع' },
  { id: 'categories', label: 'التصنيفات', path: '/admin/categories', permission: 'manageCategories', description: 'إدارة التصنيفات والتحقق من العلاقات' },
  { id: 'resources', label: 'المصادر', path: '/admin/resources', permission: 'manageResources', description: 'إدارة المصادر والروابط والمحتوى' },
  { id: 'foundations', label: 'التأسيس', path: '/admin/foundations', permission: 'manageFoundations', description: 'إدارة محتوى التأسيس' },
  { id: 'flashcards', label: 'البطاقات', path: '/admin/flashcards', permission: 'manageFlashcards', description: 'إدارة مجموعات البطاقات' },
  { id: 'solutions', label: 'الحلول', path: '/admin/solutions', permission: 'manageSolutions', description: 'إدارة الحلول والمشاكل' },
  { id: 'suggestions', label: 'الاقتراحات', path: '/admin/suggestions', permission: 'reviewSuggestions', description: 'مراجعة اقتراحات الطلاب' },
  { id: 'reports', label: 'البلاغات', path: '/admin/reports', permission: 'reviewReports', description: 'مراجعة بلاغات المصادر والمشاكل' },
  { id: 'contributors', label: 'المساهمون', path: '/admin/contributors', permission: 'manageContributors', description: 'إدارة بيانات المساهمين' },
  { id: 'templates', label: 'القوالب', path: '/admin/templates', permission: 'manageTemplates', description: 'إدارة قوالب الإدخال' },
  { id: 'drive', label: 'Google Drive', path: '/admin/drive', permission: 'manageDrive', description: 'الفحص والمراجعة والاستيراد' },
  { id: 'ai', label: 'الذكاء الاصطناعي', path: '/admin/ai', permission: 'manageAI', description: 'إعدادات وتصنيف AI' },
  { id: 'admins', label: 'المشرفون', path: '/admin/admins', permission: 'manageAdmins', description: 'المستخدمون والصلاحيات' },
  { id: 'logs', label: 'السجلات', path: '/admin/logs', permission: 'viewLogs', description: 'سجل العمليات الحساسة' },
  { id: 'analytics', label: 'التحليلات', path: '/admin/analytics', permission: 'viewAnalytics', description: 'مؤشرات الاستخدام والتكلفة' },
  { id: 'settings', label: 'الإعدادات', path: '/admin/settings', permission: 'manageSettings', description: 'إعدادات المنصة والتكاملات' },
] as const;

export function modulesForPermissions(can: (permission: Permission) => boolean): AdminModuleDefinition[] {
  return ADMIN_MODULES.filter((module) => can(module.permission));
}
