import { makeApplication } from '@/test/factories';

import {
  applicationFormSchema,
  emptyFormValues,
  formatDateInput,
  mergeFieldSources,
  parseDateInput,
  toApplicationInput,
  valuesFromApplication,
} from './formSchema';

const base = { ...emptyFormValues('stage-1'), title: 'Dev', company: 'ACME' };

function errors(values: unknown) {
  const result = applicationFormSchema.safeParse(values);
  return result.success
    ? {}
    : Object.fromEntries(result.error.issues.map((i) => [i.path.join('.'), i.message]));
}

describe('application form schema', () => {
  it('requires title and company', () => {
    expect(errors(emptyFormValues('s'))).toEqual({
      title: 'form.errors.required',
      company: 'form.errors.required',
    });
    expect(errors({ ...emptyFormValues('s'), title: '  ', company: 'x' })).toEqual({
      title: 'form.errors.required',
    });
  });

  it('validates url, numbers, dates, email and salary range', () => {
    expect(
      errors({
        ...base,
        url: 'javascript:alert(1)',
        salaryMin: 'abc',
        deadline: '31.02.2026',
        contactEmail: 'nope',
      }),
    ).toEqual({
      url: 'form.errors.url',
      salaryMin: 'form.errors.number',
      deadline: 'form.errors.date',
      contactEmail: 'form.errors.email',
    });
    expect(errors({ ...base, salaryMin: '5000', salaryMax: '4000' })).toEqual({
      salaryMax: 'form.errors.range',
    });
    expect(errors(base)).toEqual({});
  });

  it('converts values to repository input', () => {
    const input = toApplicationInput({
      ...base,
      url: 'https://www.karriere.at/jobs/1?utm_source=x',
      salaryMin: '3.600',
      salaryMax: '4.200 €',
      salaryPeriod: 'month',
      deadline: '15.11.2026',
      city: ' Wien ',
      country: 'AT',
      notes: '',
    });
    expect(input).toMatchObject({
      url: 'https://www.karriere.at/jobs/1',
      source: 'karriere.at',
      title: 'Dev',
      city: 'Wien',
      country: 'AT',
      salaryMin: 3600,
      salaryMax: 4200,
      salaryCurrency: 'EUR',
      salaryPeriod: 'month',
      deadline: '2026-11-15',
      notes: null,
      stageId: 'stage-1',
    });
  });

  it('drops salary meta when there is no salary', () => {
    expect(toApplicationInput(base)).toMatchObject({
      salaryMin: null,
      salaryCurrency: null,
      salaryPeriod: null,
      salaryIsNet: null,
    });
  });

  it('round-trips an application', () => {
    const a = makeApplication({ salaryMin: 3600, deadline: '2026-11-15', stack: ['React'] });
    const values = valuesFromApplication(a);
    expect(values.deadline).toBe('15.11.2026');
    expect(toApplicationInput(values)).toMatchObject({
      salaryMin: 3600,
      deadline: '2026-11-15',
      stack: ['React'],
    });
  });

  it('parses date input formats', () => {
    expect(parseDateInput('2026-11-05')).toBe('2026-11-05');
    expect(parseDateInput('5.11.26')).toBe('2026-11-05');
    expect(parseDateInput('05/11/2026')).toBe('2026-11-05');
    expect(parseDateInput('2026-13-01')).toBeUndefined();
    expect(formatDateInput('2026-11-05')).toBe('05.11.2026');
    expect(formatDateInput(null)).toBe('');
  });

  it('marks edited fields as user-provided', () => {
    expect(
      mergeFieldSources(
        { title: 'markup', company: 'markup' },
        { title: true, notes: true, stageId: true },
      ),
    ).toEqual({ title: 'user', company: 'markup' });
  });
});
