const DIACRITICS = /[\u0617-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;

export function normalizeArabic(input: string): string {
  return input
    .normalize('NFKC')
    .replace(DIACRITICS, '')
    .replace(/[إأآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/[ـ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLocaleLowerCase('ar');
}

export function matchesArabic(query: string, value: string): boolean {
  const q = normalizeArabic(query);
  return !q || normalizeArabic(value).includes(q);
}
