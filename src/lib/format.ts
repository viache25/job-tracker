/**
 * Locale-aware formatting. Screens never format dates or money by hand.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/** "12. Okt. 2026" / "12 окт. 2026 г." / "Oct 12, 2026". */
export function formatDate(value: string | Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(toDate(value));
}

/** Short date without the year: "12 окт.". */
export function formatShortDate(value: string | Date, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' }).format(toDate(value));
}

/** Whole calendar days between `value` and `now` (positive when `value` is in the past). */
export function daysSince(value: string | Date, now: Date = new Date()): number {
  const from = toDate(value);
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((b - a) / DAY_MS);
}

/** Money without fractions: "3.600 €", "3 600 €", "€3,600". */
export function formatMoney(amount: number, currency: string, locale: string): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Unknown currency code: fall back to a plain number with the code.
    return `${formatNumber(amount, locale)} ${currency}`;
  }
}

export function formatNumber(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

/** "3.600–4.200 €", "ab 3.600 €" style ranges; the "from"/"to" words come from i18n. */
export function formatMoneyRange(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string,
  locale: string,
  words: { from: string; upTo: string },
): string | null {
  const hasMin = min != null;
  const hasMax = max != null;
  if (hasMin && hasMax) {
    if (min === max) return formatMoney(min, currency, locale);
    return `${formatNumber(min, locale)}–${formatMoney(max, currency, locale)}`;
  }
  if (hasMin) return `${words.from} ${formatMoney(min, currency, locale)}`;
  if (hasMax) return `${words.upTo} ${formatMoney(max, currency, locale)}`;
  return null;
}

/** ISO date "YYYY-MM-DD" in local time. */
export function toIsoDay(value: Date): string {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, '0');
  const d = String(value.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
