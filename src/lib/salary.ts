import type { SalaryPeriod } from '@/db/schema';

/** Monthly payments per year: Austria pays 14 salaries, everyone else 12 (PRD 4.3). */
export function paymentsPerYear(country: string | null | undefined): number {
  return country?.toUpperCase() === 'AT' ? 14 : 12;
}

/** Full-time hours per month (40 h × 52 weeks / 12). */
export const HOURS_PER_MONTH = (40 * 52) / 12;

export type SalaryInput = {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryPeriod?: SalaryPeriod | null;
  salaryIsNet?: boolean | null;
  country?: string | null;
};

/** Converts one amount to a monthly amount for the given period. */
export function toMonthly(
  amount: number,
  period: SalaryPeriod,
  country: string | null | undefined,
): number {
  switch (period) {
    case 'month':
      return amount;
    case 'year':
      return amount / paymentsPerYear(country);
    case 'hour':
      return amount * HOURS_PER_MONTH;
  }
}

/**
 * Gross monthly salary used for sorting and the table median: midpoint of the range
 * (or the single bound), converted to a month. Net salaries can't be compared, so null.
 */
export function monthlyGross(input: SalaryInput): number | null {
  if (input.salaryIsNet) return null;
  const values = [input.salaryMin, input.salaryMax].filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0,
  );
  if (values.length === 0) return null;
  const mid = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.round(toMonthly(mid, input.salaryPeriod ?? 'month', input.country));
}

export function median(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}
