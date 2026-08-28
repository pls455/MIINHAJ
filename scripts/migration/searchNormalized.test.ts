import { describe, expect, it } from 'vitest';
import { normalizeArabic, sourceText } from './searchNormalized';

describe('normalizeArabic', () => {
  it('normalizes common Arabic variants without changing source text', () => {
    expect(normalizeArabic('إِختبار آمن، مُهم')).toBe('اختبار امن، مهم');
    expect(normalizeArabic('مدرسة هدى')).toBe('مدرسه هدي');
  });
  it('collapses whitespace and lowercases text', () => {
    expect(normalizeArabic('  HELLO   World  ')).toBe('hello world');
  });
});

describe('sourceText', () => {
  it('combines searchable fields and ignores non-string values', () => {
    expect(sourceText({ title: 'رياضيات', description: 'توجيهي', order: 1, active: true })).toBe('رياضيات توجيهي');
  });
});

describe('migration safety contract', () => {
  it('produces deterministic values suitable for idempotent updates', () => {
    const data = { title: 'إحصاء', description: '  الدرس  ' };
    const first = normalizeArabic(sourceText(data));
    const second = normalizeArabic(sourceText(data));
    expect(first).toBe(second);
    expect(first).toBe('احصاء الدرس');
  });
});
