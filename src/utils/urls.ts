const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

export function normalizeUrl(input: string): string {
  const raw = input.trim();
  const parsed = new URL(raw);
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) throw new Error('الرابط يجب أن يبدأ بـ http أو https.');
  parsed.hash = '';
  parsed.pathname = parsed.pathname.replace(/\/+$/, '') || '/';
  return parsed.toString();
}

export function isSafeUrl(input: string): boolean {
  try { normalizeUrl(input); return true; } catch { return false; }
}
