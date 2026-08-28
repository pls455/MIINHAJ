import { z } from 'zod';
import { isSafeUrl } from '../../utils/urls';

export const resourceImportSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().max(2000).optional(),
  url: z.string().trim().min(1).refine(isSafeUrl, 'رابط غير صالح'),
  type: z.string().trim().min(1),
  branchId: z.string().trim().optional(),
  subjectId: z.string().trim().optional(),
  categoryId: z.string().trim().optional(),
  active: z.boolean().default(true),
  order: z.number().finite().default(0),
});

export type ImportRow = z.input<typeof resourceImportSchema>;
export type ImportResult = { valid: ImportRow[]; invalid: Array<{ index: number; errors: string[] }>; duplicates: number[] };

export function validateResourceImport(rows: unknown[]): ImportResult {
  const valid: ImportRow[] = [];
  const invalid: ImportResult['invalid'] = [];
  const duplicates: number[] = [];
  const urls = new Set<string>();
  rows.forEach((row, index) => {
    const parsed = resourceImportSchema.safeParse(row);
    if (!parsed.success) {
      invalid.push({ index, errors: parsed.error.issues.map((issue) => issue.message) });
      return;
    }
    try {
      const normalized = new URL(parsed.data.url).toString().replace(/\/$/, '');
      if (urls.has(normalized)) { duplicates.push(index); return; }
      urls.add(normalized);
    } catch {
      invalid.push({ index, errors: ['رابط غير صالح'] });
      return;
    }
    valid.push(parsed.data);
  });
  return { valid, invalid, duplicates };
}
