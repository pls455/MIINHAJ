import { describe, expect, it } from 'vitest';
import { validateRelationshipIds } from './relationships';

describe('validateRelationshipIds', () => {
  const options = {
    branches: [{ id: 'b1', label: 'علمي' }],
    subjects: [{ id: 's1', label: 'رياضيات' }],
    categories: [{ id: 'c1', label: 'كتب' }],
  };
  it('accepts existing relationship ids', () => {
    expect(validateRelationshipIds({ branchId: 'b1', subjectId: 's1', categoryId: 'c1' }, options)).toEqual({});
  });
  it('rejects unknown relationship ids', () => {
    const errors = validateRelationshipIds({ branchId: 'missing' }, options);
    expect(errors.branchId).toBeTruthy();
  });
});
