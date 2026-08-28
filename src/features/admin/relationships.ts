export interface RelationshipOption { id: string; label: string; active?: boolean }

export interface ResourceRelationships {
  branchId?: string;
  subjectId?: string;
  categoryId?: string;
}

export function validateRelationshipIds(
  values: ResourceRelationships,
  options: { branches: RelationshipOption[]; subjects: RelationshipOption[]; categories: RelationshipOption[] },
): Record<string, string> {
  const errors: Record<string, string> = {};
  const checks: Array<[keyof ResourceRelationships, RelationshipOption[], string]> = [
    ['branchId', options.branches, 'الفرع'],
    ['subjectId', options.subjects, 'المادة'],
    ['categoryId', options.categories, 'التصنيف'],
  ];
  for (const [key, list, label] of checks) {
    const value = values[key];
    if (value && !list.some((item) => item.id === value)) errors[key] = `${label} المحدد غير موجود.`;
  }
  return errors;
}
