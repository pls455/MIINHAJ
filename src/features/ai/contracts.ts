import { z } from 'zod';

export const aiClassificationSchema = z.object({
  branchIds: z.array(z.string().min(1)).default([]),
  subjectId: z.string().default(''),
  categoryId: z.string().default(''),
  confidence: z.record(z.string(), z.number().min(0).max(1)).default({}),
  evidence: z.array(z.string().max(500)).default([]),
  conflicts: z.array(z.string().max(500)).default([]),
  needsReview: z.boolean().default(true),
});

export type AIClassification = z.infer<typeof aiClassificationSchema>;

export function parseAIClassification(value: unknown): AIClassification {
  return aiClassificationSchema.parse(value);
}
