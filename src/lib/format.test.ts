import { daysSince, formatDate, formatMoney, formatMoneyRange, toIsoDay } from './format';

const words = { from: 'ab', upTo: 'bis' };

describe('format', () => {
  it('formats dates per locale', () => {
    const d = new Date(2026, 9, 12);
    expect(formatDate(d, 'en')).toBe('Oct 12, 2026');
    expect(formatDate(d, 'de')).toContain('2026');
  });

  it('counts calendar days', () => {
    const now = new Date(2026, 9, 12, 9, 0);
    expect(daysSince(new Date(2026, 9, 12, 23, 0), now)).toBe(0);
    expect(daysSince(new Date(2026, 9, 10, 1, 0), now)).toBe(2);
    expect(daysSince(new Date(2026, 9, 14), now)).toBe(-2);
  });

  it('formats money without fractions', () => {
    expect(formatMoney(3600, 'EUR', 'en')).toBe('€3,600');
    expect(formatMoney(3600.4, 'EUR', 'de')).toMatch(/^3\.600\s€$/);
  });

  it('falls back on unknown currency codes', () => {
    expect(formatMoney(10, 'NOPE1', 'en')).toBe('10 NOPE1');
  });

  it('formats ranges', () => {
    expect(formatMoneyRange(3600, 4200, 'EUR', 'en', words)).toBe('3,600–€4,200');
    expect(formatMoneyRange(3600, 3600, 'EUR', 'en', words)).toBe('€3,600');
    expect(formatMoneyRange(3600, null, 'EUR', 'en', words)).toBe('ab €3,600');
    expect(formatMoneyRange(null, 4000, 'EUR', 'en', words)).toBe('bis €4,000');
    expect(formatMoneyRange(null, undefined, 'EUR', 'en', words)).toBeNull();
  });

  it('builds ISO days', () => {
    expect(toIsoDay(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
