import { describe, expect, it } from 'vitest';
import { createEmptyForm, createFormFromDocument, toFirestoreValues } from './entityForm';
import { ADMIN_ENTITIES } from './managerConfig';

describe('admin entity form mapping', () => {
  it('creates empty values with correct primitive defaults', () => {
    const fields = ADMIN_ENTITIES[0].fields;
    const form = createEmptyForm(fields);
    expect(form.active).toBe(false);
    expect(form.name).toBe('');
  });

  it('hydrates edit forms from the current document', () => {
    const fields = ADMIN_ENTITIES[0].fields;
    const form = createFormFromDocument(fields, { name: 'علمي', active: true, order: 3 });
    expect(form.name).toBe('علمي');
    expect(form.active).toBe(true);
    expect(form.order).toBe(3);
  });

  it('normalizes values before persistence', () => {
    const fields = ADMIN_ENTITIES[0].fields;
    const values = createFormFromDocument(fields, { name: '  علمي  ', active: true, order: 4 });
    expect(toFirestoreValues(fields, values)).toMatchObject({ name: 'علمي', order: 4, active: true });
  });
});
