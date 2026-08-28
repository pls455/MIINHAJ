import { aiClassificationSchema } from '../features/ai/contracts';
import type { AIRequest, AIResponse, AIClassification } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function request<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error((data as { error?: string } | null)?.error || 'تعذر تنفيذ الطلب.');
  return data as T;
}

export function askAI(input: AIRequest, signal?: AbortSignal): Promise<AIResponse> {
  return request<AIResponse>('/api/ai/chat', input, signal);
}

export async function classifyWithAI(prompt: string, signal?: AbortSignal): Promise<AIClassification> {
  const response = await request<{ ok: boolean; result: unknown }>('/api/ai/classify', { prompt }, signal);
  return aiClassificationSchema.parse(response.result);
}
