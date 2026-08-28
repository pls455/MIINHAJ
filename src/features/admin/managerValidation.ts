import { z } from 'zod';
import { isSafeUrl } from '../../utils/urls';
import type { AdminFieldDefinition } from './managerConfig';

const textSchema = z.string().trim().max(5000);

export function validateAdminForm(fields: readonly AdminFieldDefinition[], values: Record<string, unknown>): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.key];
    if (field.required && (typeof value !== 'string' || !value.trim())) {
      errors[field.key] = 'هذا الحقل مطلوب.';
      continue;
    }
    if (field.type === 'url' && typeof value === 'string' && value.trim() && !isSafeUrl(value.trim())) {
      errors[field.key] = 'الرابط غير صالح. استخدم http أو https.';
    }
    if (field.type === 'number' && value !== undefined && value !== '' && !Number.isFinite(Number(value))) {
      errors[field.key] = 'يجب أن تكون القيمة رقمًا.';
    }
    if ((field.type === 'text' || field.type === 'textarea') && typeof value === 'string') {
      const result = textSchema.safeParse(value);
      if (!result.success) errors[field.key] = 'النص أطول من الحد المسموح.';
    }
  }
  return errors;
}
