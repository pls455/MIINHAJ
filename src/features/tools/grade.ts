export interface GradeConversion { input: number; percentage: number; outOf: number; }

export function convertGrade(input: number, outOf: number): GradeConversion {
  if (!Number.isFinite(input) || !Number.isFinite(outOf) || outOf <= 0 || input < 0) throw new Error('القيم المدخلة غير صالحة.');
  const percentage = Math.min(100, (input / outOf) * 100);
  return { input, percentage, outOf };
}
