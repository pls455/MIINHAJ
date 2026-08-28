import type { AdminFieldDefinition } from './managerConfig';

export type AdminFormValue = string | number | boolean | string[];
export type AdminFormValues = Record<string, AdminFormValue>;

function emptyValue(field: AdminFieldDefinition): AdminFormValue {
  if (field.type === 'checkbox') return false;
  if (field.multiple) return [];
  if (field.type === 'number') return '';
  return '';
}

export function createEmptyForm(fields: readonly AdminFieldDefinition[]): AdminFormValues {
  return Object.fromEntries(fields.map((field) => [field.key, emptyValue(field)]));
}

export function createFormFromDocument(fields: readonly AdminFieldDefinition[], document: Record<string, unknown>): AdminFormValues {
  return Object.fromEntries(fields.map((field) => {
    const value = document[field.key];
    if (field.multiple) return [field.key, Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : typeof value === 'string' ? [value] : []];
    if (field.type === 'checkbox') return [field.key, Boolean(value)];
    if (field.type === 'number') return [field.key, typeof value === 'number' ? value : ''];
    return [field.key, typeof value === 'string' ? value : ''];
  }));
}

export function toFirestoreValues(fields: readonly AdminFieldDefinition[], values: AdminFormValues): Record<string, unknown> {
  return Object.fromEntries(fields.map((field) => {
    const value = values[field.key];
    if (field.multiple) return [field.key, Array.isArray(value) ? value : []];
    if (field.type === 'number') return [field.key, value === '' ? 0 : Number(value)];
    if (field.type === 'checkbox') return [field.key, Boolean(value)];
    return [field.key, typeof value === 'string' ? value.trim() : value];
  }));
}
