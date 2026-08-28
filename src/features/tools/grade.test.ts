import { describe, expect, it } from 'vitest';
import { convertGrade } from './grade';

describe('convertGrade', () => {
  it('converts a grade to percentage', () => expect(convertGrade(18, 20).percentage).toBe(90));
  it('rejects invalid totals', () => expect(() => convertGrade(5, 0)).toThrow());
});
