import { describe, expect, it } from 'vitest';
import { validateAdminForm } from './managerValidation';

describe('validateAdminForm', () => {
  const fields = [
    { key: 'title', label: 'العنوان', type: 'text' as const, required: true },
    { key: 'url', label: 'الرابط', type: 'url' as const },
    { key: 'order', label: 'الترتيب', type: 'number' as const },
  ];

  it('requires required fields', () => expect(validateAdminForm(fields, {}).title).toBeTruthy());
  it('rejects unsafe URLs', () => expect(validateAdminForm(fields, { title: 'x', url: 'javascript:alert(1)' }).url).toBeTruthy());
  it('rejects non-numeric ordering', () => expect(validateAdminForm(fields, { title: 'x', order: 'abc' }).order).toBeTruthy());
});
