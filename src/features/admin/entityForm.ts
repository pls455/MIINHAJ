import type { AdminFieldDefinition } from './managerConfig';

export type AdminFormValues = Record<string, string | number | boolean>;

export function createEmptyForm(fields: readonly AdminFieldDefinition[]): AdminFormValues {
  return Object.fromEntries(fields.map((field) => [field.key, field.type === 'checkbox' ? false : ''])) as AdminFormValues;
}

export function createFormFromDocument(fields: readonly AdminFieldDefinition[], document: Record<string, unknown>): AdminFormValues {
  return Object.fromEntries(fields.map((field) => {
    const value = document[field.key];
    if (field.type === 'checkbox') return [field.key, Boolean(value)];
    if (field.type === 'number') return [field.key, typeof value === 'number' ? value : ''];
    return [field.key, typeof value === 'string' ? value : ''];
  })) as AdminFormValues;
}

export function toFirestoreValues(fields: readonly AdminFieldDefinition[], values: AdminFormValues): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => {
    const value = values[field.key];
    if (field.type === 'number') return [field.key, value === '' ? 0 : Number(value)];
    if (field.type === 'checkbox') return [field.key, Boolean(value)];
    return [field.key, typeof value === 'string' ? value.trim() : value];
  }));
}
