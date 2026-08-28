import { describe, expect, it } from 'vitest';
import { validateRelationshipIds, type RelationshipValidationOptions } from './relationships';

const options: RelationshipValidationOptions = {
  branches: [
    { id: 'branch-a', label: 'A' },
    { id: 'branch-b', label: 'B' },
  ],
  subjects: [{ id: 'subject-a', label: 'Math' }],
  categories: [{ id: 'category-a', label: 'Books' }],
};

describe('validateRelationshipIds', () => {
  it('accepts the legacy single branchId schema', () => {
    expect(validateRelationshipIds({ branchId: 'branch-a', subjectId: 'subject-a', categoryId: 'category-a' }, options)).toEqual({});
  });

  it('accepts the new branchIds array schema', () => {
    expect(validateRelationshipIds({ branchIds: ['branch-a', 'branch-b'], subjectId: 'subject-a', categoryId: 'category-a' }, options)).toEqual({});
  });

  it('rejects an unknown legacy branchId', () => {
    expect(validateRelationshipIds({ branchId: 'missing' }, options)).toEqual({ branchId: 'الفرع المحدد غير موجود.' });
  });

  it('rejects an unknown branchId inside branchIds', () => {
    expect(validateRelationshipIds({ branchIds: ['branch-a', 'missing'] }, options)).toEqual({ branchIds: 'الفرع المحدد غير موجود.' });
  });

  it('validates every id when both legacy and new fields are present', () => {
    expect(validateRelationshipIds({ branchId: 'branch-a', branchIds: ['branch-b', 'missing'] }, options)).toEqual({
      branchIds: 'الفرع المحدد غير موجود.',
      branchId: 'الفرع المحدد غير موجود.',
    });
  });

  it('accepts an empty optional relationship', () => {
    expect(validateRelationshipIds({}, options)).toEqual({});
  });

  it('rejects invalid subject and category ids', () => {
    expect(validateRelationshipIds({ subjectId: 'missing-subject', categoryId: 'missing-category' }, options)).toEqual({
      subjectId: 'المادة المحددة غير موجودة.',
      categoryId: 'التصنيف المحدد غير موجود.',
    });
  });
});
