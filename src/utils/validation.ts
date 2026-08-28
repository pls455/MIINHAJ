import { z } from 'zod';
import type { ResourceType } from '../types';

export const urlSchema = z.string().trim().url().refine(v => ['http:','https:'].includes(new URL(v).protocol), 'الرابط يجب أن يبدأ بـ http أو https');
export const resourceSchema = z.object({
  title: z.string().trim().min(1).max(200), description: z.string().trim().max(2000).optional(), url: urlSchema,
  type: z.custom<ResourceType>(), branchId: z.string().optional(), subjectId: z.string().optional(), categoryId: z.string().optional(), active: z.boolean(), order: z.number().int().min(0).max(100000)
});
export const submissionSchema = z.object({ title: z.string().trim().min(1).max(200), description: z.string().trim().min(1).max(3000), url: urlSchema.optional() });
export const normalizeArabic = (value: string): string => value.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '').replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/ـ/g,'').trim();
export const normalizeSearchText = (value: string): string => normalizeArabic(value).toLocaleLowerCase('ar').replace(/\s+/g,' ');
export const normalizeUrl = (value: string): string => { const url = new URL(value.trim()); url.hash=''; if (url.pathname.length>1) url.pathname=url.pathname.replace(/\/+$/,''); return url.toString(); };
