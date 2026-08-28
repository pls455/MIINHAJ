import { z } from 'zod';

export const suggestionSchema = z.object({
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().max(3000).optional().default(''),
  url: z.string().trim().url().max(2048).optional().or(z.literal('')),
  type: z.enum(['resource', 'book', 'summary', 'deck', 'idea']).default('resource'),
});

export const problemReportSchema = z.object({
  resourceId: z.string().trim().max(128).optional().or(z.literal('')),
  type: z.enum(['broken_link', 'wrong_resource', 'duplicate', 'wrong_category', 'technical_issue']),
  description: z.string().trim().min(3).max(3000),
});

export type SuggestionInput = z.infer<typeof suggestionSchema>;
export type ProblemReportInput = z.infer<typeof problemReportSchema>;
