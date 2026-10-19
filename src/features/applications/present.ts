import type { TFunction } from 'i18next';

import type { Application } from '@/db/schema';
import { formatMoneyRange } from '@/lib/format';

/** "3.600–4.200 € /мес" style salary text, or null. */
export function salaryText(a: Application, t: TFunction, locale: string): string | null {
  const range = formatMoneyRange(a.salaryMin, a.salaryMax, a.salaryCurrency ?? 'EUR', locale, {
    from: t('money.from'),
    upTo: t('money.upTo'),
  });
  if (!range) return null;
  const period = a.salaryPeriod ? ` ${t(`salaryPeriod.${a.salaryPeriod}`)}` : '';
  const net = a.salaryIsNet ? ` · ${t('money.net')}` : '';
  return `${range}${period}${net}`;
}

/** Normalised gross per month for the table, or null. */
export function monthlyText(a: Application, locale: string): string | null {
  if (a.salaryMonthlyGross == null) return null;
  return formatMoneyRange(
    a.salaryMonthlyGross,
    a.salaryMonthlyGross,
    a.salaryCurrency ?? 'EUR',
    locale,
    {
      from: '',
      upTo: '',
    },
  );
}

export function locationText(a: Application): string | null {
  return [a.city, a.country].filter(Boolean).join(', ') || null;
}
