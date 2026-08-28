import { describe, expect, it } from 'vitest';
import { matchesArabic, normalizeArabic } from './arabic';

describe('Arabic normalization', () => {
  it('normalizes common Arabic variants', () => expect(normalizeArabic('إختبارٌ')).toBe('اختبار'));
  it('matches normalized search terms', () => expect(matchesArabic('رياضيات', 'الرّياضيات')).toBe(true));
});
