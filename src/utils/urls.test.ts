import { describe, expect, it } from 'vitest';
import { isSafeUrl, normalizeUrl } from './urls';

describe('URL utilities', () => {
  it('removes fragments and normalizes trailing slash', () => expect(normalizeUrl('https://example.com/path/#x')).toBe('https://example.com/path'));
  it('rejects unsafe protocols', () => expect(isSafeUrl('javascript:alert(1)')).toBe(false));
});
