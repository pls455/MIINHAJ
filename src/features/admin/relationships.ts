export interface RelationshipOption { id: string; label: string; active?: boolean }

export interface ResourceRelationships {
  branchId?: string;
  branchIds?: string[];
  subjectId?: string;
  categoryId?: string;
}

export interface RelationshipValidationOptions {
  branches: RelationshipOption[];
  subjects: RelationshipOption[];
  categories: RelationshipOption[];
}

function normalizeIds(single?: string, multiple?: string[]): string[] {
  const ids = [...(multiple ?? [])];
  if (single && !ids.includes(single)) ids.push(single);
  return ids.filter(Boolean);
}

function validateIds(
  ids: string[],
  options: RelationshipOption[],
  label: string,
): string | undefined {
  const invalid = ids.find((id) => !options.some((option) => option.id === id));
  return invalid ? `${label} المحدد غير موجود.` : undefined;
}

export function validateRelationshipIds(
  values: ResourceRelationships,
  options: RelationshipValidationOptions,
): Record<string, string> {
  const errors: Record<string, string> = {};

  const branchIds = normalizeIds(values.branchId, values.branchIds);
  const branchError = validateIds(branchIds, options.branches, 'الفرع');
  if (branchError) {
    errors.branchIds = branchError;
    if (values.branchId) errors.branchId = branchError;
  }

  const subjectError = validateIds(normalizeIds(values.subjectId), options.subjects, 'المادة');
  if (subjectError) errors.subjectId = subjectError;

  const categoryError = validateIds(normalizeIds(values.categoryId), options.categories, 'التصنيف');
  if (categoryError) errors.categoryId = categoryError;

  return errors;
}
