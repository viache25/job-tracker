import { median, monthlyGross, paymentsPerYear, toMonthly } from './salary';

describe('salary', () => {
  it('uses 14 payments for Austria', () => {
    expect(paymentsPerYear('AT')).toBe(14);
    expect(paymentsPerYear('at')).toBe(14);
    expect(paymentsPerYear('DE')).toBe(12);
    expect(paymentsPerYear(undefined)).toBe(12);
  });

  it('converts periods to months', () => {
    expect(toMonthly(50400, 'year', 'AT')).toBe(3600);
    expect(toMonthly(60000, 'year', 'DE')).toBe(5000);
    expect(toMonthly(3000, 'month', 'DE')).toBe(3000);
    expect(Math.round(toMonthly(25, 'hour', 'DE'))).toBe(4333);
  });

  it('takes the midpoint of a range', () => {
    expect(monthlyGross({ salaryMin: 3000, salaryMax: 4000, salaryPeriod: 'month' })).toBe(3500);
    expect(
      monthlyGross({ salaryMin: 50400, salaryMax: null, salaryPeriod: 'year', country: 'AT' }),
    ).toBe(3600);
  });

  it('defaults to monthly and ignores net or missing salaries', () => {
    expect(monthlyGross({ salaryMax: 4200 })).toBe(4200);
    expect(monthlyGross({ salaryMin: 3000, salaryIsNet: true })).toBeNull();
    expect(monthlyGross({})).toBeNull();
    expect(monthlyGross({ salaryMin: 0 })).toBeNull();
  });

  it('computes medians', () => {
    expect(median([])).toBeNull();
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 3, 2])).toBe(2.5);
  });
});
