import type { Permission } from '../../app/permissions';

export interface AdminFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'url' | 'number' | 'checkbox' | 'select';
  required?: boolean;
  placeholder?: string;
  relation?: 'branches' | 'subjects' | 'categories';
  multiple?: boolean;
}

export interface AdminEntityDefinition {
  id: string;
  collection: string;
  label: string;
  permission: Permission;
  fields: readonly AdminFieldDefinition[];
}

const activeOrder = [
  { key: 'order', label: 'الترتيب', type: 'number' as const },
  { key: 'active', label: 'نشط', type: 'checkbox' as const },
];

export const ADMIN_ENTITIES: readonly AdminEntityDefinition[] = [
  { id: 'branches', collection: 'branches', label: 'الفروع', permission: 'manageBranches', fields: [{ key: 'name', label: 'الاسم', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, { key: 'icon', label: 'الأيقونة', type: 'text' }, ...activeOrder] },
  { id: 'subjects', collection: 'subjects', label: 'المواد', permission: 'manageSubjects', fields: [{ key: 'name', label: 'اسم المادة', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, { key: 'icon', label: 'الأيقونة', type: 'text' }, { key: 'branchIds', label: 'الفروع', type: 'select', relation: 'branches', multiple: true }, ...activeOrder] },
  { id: 'categories', collection: 'categories', label: 'التصنيفات', permission: 'manageCategories', fields: [{ key: 'name', label: 'اسم التصنيف', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, ...activeOrder] },
  { id: 'resources', collection: 'resources', label: 'المصادر', permission: 'manageResources', fields: [{ key: 'title', label: 'العنوان', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, { key: 'url', label: 'الرابط', type: 'url', required: true }, { key: 'type', label: 'النوع', type: 'text', required: true }, { key: 'branchIds', label: 'الفروع', type: 'select', relation: 'branches', multiple: true }, { key: 'subjectId', label: 'المادة', type: 'select', relation: 'subjects' }, { key: 'categoryId', label: 'التصنيف', type: 'select', relation: 'categories' }, ...activeOrder] },
  { id: 'foundations', collection: 'foundations', label: 'التأسيس', permission: 'manageFoundations', fields: [{ key: 'title', label: 'العنوان', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, { key: 'url', label: 'الرابط', type: 'url' }, ...activeOrder] },
  { id: 'flashcards', collection: 'flashcards', label: 'البطاقات', permission: 'manageFlashcards', fields: [{ key: 'question', label: 'السؤال', type: 'textarea', required: true }, { key: 'answer', label: 'الإجابة', type: 'textarea', required: true }, { key: 'group', label: 'المجموعة', type: 'text' }, ...activeOrder] },
  { id: 'solutions', collection: 'solutions', label: 'الحلول', permission: 'manageSolutions', fields: [{ key: 'title', label: 'العنوان', type: 'text', required: true }, { key: 'category', label: 'التصنيف', type: 'text' }, { key: 'content', label: 'المحتوى', type: 'textarea', required: true }, { key: 'links', label: 'الروابط', type: 'textarea' }, ...activeOrder] },
  { id: 'contributors', collection: 'contributors', label: 'المساهمون', permission: 'manageContributors', fields: [{ key: 'name', label: 'الاسم', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, { key: 'image', label: 'الصورة', type: 'url' }, { key: 'link', label: 'الرابط', type: 'url' }, ...activeOrder] },
  { id: 'templates', collection: 'templates', label: 'القوالب', permission: 'manageTemplates', fields: [{ key: 'name', label: 'الاسم', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, { key: 'type', label: 'النوع', type: 'text', required: true }, { key: 'schema', label: 'Schema', type: 'textarea', required: true }, ...activeOrder] },
  { id: 'suggestions', collection: 'suggestions', label: 'الاقتراحات', permission: 'manageSuggestions', fields: [{ key: 'type', label: 'النوع', type: 'text', required: true }, { key: 'title', label: 'العنوان', type: 'text', required: true }, { key: 'description', label: 'الوصف', type: 'textarea' }, { key: 'url', label: 'الرابط', type: 'url' }, { key: 'status', label: 'الحالة', type: 'text', required: true }] },
  { id: 'problemReports', collection: 'problemReports', label: 'بلاغات المشاكل', permission: 'manageProblemReports', fields: [{ key: 'type', label: 'النوع', type: 'text', required: true }, { key: 'title', label: 'العنوان', type: 'text' }, { key: 'description', label: 'الوصف', type: 'textarea', required: true }, { key: 'status', label: 'الحالة', type: 'text', required: true }] },
];
