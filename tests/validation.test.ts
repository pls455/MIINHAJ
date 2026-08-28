import { describe,expect,it } from 'vitest';
import { normalizeArabic,normalizeUrl } from '../src/utils/validation';
describe('validation utilities',()=>{it('normalizes Arabic search variants',()=>expect(normalizeArabic('إختبارٌة')).toBe('اختباره'));it('normalizes URL trailing slash and hash',()=>expect(normalizeUrl('https://example.com/file/#x')).toBe('https://example.com/file'));});
