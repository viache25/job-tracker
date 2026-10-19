import { z } from 'zod';

import {
  EMPLOYMENT_TYPES,
  SALARY_PERIODS,
  WORK_MODES,
  type Application,
  type FieldSource,
} from '@/db/schema';
import { canonicalizeUrl, isHttpUrl, sourceOf } from '@/lib/url';
import { parseAmount } from '@/parser/heuristics';
import type { VacancyFields } from '@/parser/types';

import type { ApplicationInput } from './repo';

/** Translation keys for validation messages (rendered with t()). */
export const FORM_ERRORS = {
  required: 'form.errors.required',
  url: 'form.errors.url',
  number: 'form.errors.number',
  date: 'form.errors.date',
  email: 'form.errors.email',
  range: 'form.errors.range',
} as const;

const optionalText = z.string().trim().max(300);

function parseNumber(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return parseAmount(trimmed.replace(/[€$£]|eur|chf/gi, '').trim());
}

/** Accepts YYYY-MM-DD or DD.MM.YYYY (also D.M.YY); returns ISO YYYY-MM-DD. */
export function parseDateInput(value: string): string | undefined {
  const v = value.trim();
  if (!v) return undefined;
  let y: number, m: number, d: number;
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(v);
  const dotted = /^(\d{1,2})[./](\d{1,2})[./](\d{2}|\d{4})$/.exec(v);
  if (iso) [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  else if (dotted) {
    [d, m, y] = [Number(dotted[1]), Number(dotted[2]), Number(dotted[3])];
    if (y < 100) y += 2000;
  } else return undefined;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d)
    return undefined;
  return date.toISOString().slice(0, 10);
}

/** ISO date → what the user sees in the field (DD.MM.YYYY). */
export function formatDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : '';
}

export const applicationFormSchema = z
  .object({
    url: z
      .string()
      .trim()
      .refine((v) => v === '' || isHttpUrl(v), FORM_ERRORS.url),
    title: z.string().trim().min(1, FORM_ERRORS.required).max(300),
    company: z.string().trim().min(1, FORM_ERRORS.required).max(300),
    city: optionalText,
    country: z.string(),
    workMode: z.enum(WORK_MODES).nullable(),
    salaryMin: z
      .string()
      .refine((v) => v.trim() === '' || parseNumber(v) !== undefined, FORM_ERRORS.number),
    salaryMax: z
      .string()
      .refine((v) => v.trim() === '' || parseNumber(v) !== undefined, FORM_ERRORS.number),
    salaryCurrency: z.string(),
    salaryPeriod: z.enum(SALARY_PERIODS),
    salaryIsNet: z.boolean(),
    employmentType: z.enum(EMPLOYMENT_TYPES).nullable(),
    stack: z.array(z.string().trim().min(1).max(60)).max(60),
    deadline: z
      .string()
      .refine((v) => v.trim() === '' || parseDateInput(v) !== undefined, FORM_ERRORS.date),
    contactName: optionalText,
    contactEmail: z
      .string()
      .trim()
      .refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), FORM_ERRORS.email),
    notes: z.string().max(20_000),
    stageId: z.string().min(1, FORM_ERRORS.required),
  })
  .refine(
    (v) => {
      const min = parseNumber(v.salaryMin);
      const max = parseNumber(v.salaryMax);
      return min === undefined || max === undefined || min <= max;
    },
    { message: FORM_ERRORS.range, path: ['salaryMax'] },
  );

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export function emptyFormValues(stageId: string): ApplicationFormValues {
  return {
    url: '',
    title: '',
    company: '',
    city: '',
    country: '',
    workMode: null,
    salaryMin: '',
    salaryMax: '',
    salaryCurrency: 'EUR',
    salaryPeriod: 'month',
    salaryIsNet: false,
    employmentType: null,
    stack: [],
    deadline: '',
    contactName: '',
    contactEmail: '',
    notes: '',
    stageId,
  };
}

const num = (n: number | null | undefined) => (n == null ? '' : String(n));

export function valuesFromApplication(a: Application): ApplicationFormValues {
  return {
    url: a.url ?? '',
    title: a.title,
    company: a.company,
    city: a.city ?? '',
    country: a.country ?? '',
    workMode: a.workMode,
    salaryMin: num(a.salaryMin),
    salaryMax: num(a.salaryMax),
    salaryCurrency: a.salaryCurrency ?? 'EUR',
    salaryPeriod: a.salaryPeriod ?? 'month',
    salaryIsNet: a.salaryIsNet ?? false,
    employmentType: a.employmentType,
    stack: a.stack,
    deadline: formatDateInput(a.deadline),
    contactName: a.contactName ?? '',
    contactEmail: a.contactEmail ?? '',
    notes: a.notes ?? '',
    stageId: a.stageId,
  };
}

const orNull = (v: string) => (v.trim() === '' ? null : v.trim());

/**
 * Form values → repository input. `extras` carries what the form doesn't edit
 * (parsed description, dates, language, field sources). The URL hash is computed by the caller.
 */
export function toApplicationInput(
  values: ApplicationFormValues,
  extras: Partial<ApplicationInput> = {},
): ApplicationInput {
  const min = parseNumber(values.salaryMin) ?? null;
  const max = parseNumber(values.salaryMax) ?? null;
  const hasSalary = min !== null || max !== null;
  const url = values.url.trim() ? canonicalizeUrl(values.url) : null;
  return {
    ...extras,
    url,
    source: url ? sourceOf(url) : null,
    title: values.title.trim(),
    company: values.company.trim(),
    city: orNull(values.city),
    country: orNull(values.country),
    workMode: values.workMode,
    salaryMin: min,
    salaryMax: max,
    salaryCurrency: hasSalary ? values.salaryCurrency : null,
    salaryPeriod: hasSalary ? values.salaryPeriod : null,
    salaryIsNet: hasSalary ? values.salaryIsNet : null,
    employmentType: values.employmentType,
    stack: values.stack,
    deadline: parseDateInput(values.deadline) ?? null,
    contactName: orNull(values.contactName),
    contactEmail: orNull(values.contactEmail),
    notes: orNull(values.notes),
    stageId: values.stageId,
  };
}

const UNSOURCED: readonly string[] = ['stageId', 'notes'];

/** Marks fields the user edited as 'user', keeping the parser's sources for the rest. */
export function mergeFieldSources(
  initial: Partial<Record<string, FieldSource>>,
  dirty: Partial<Record<keyof ApplicationFormValues, unknown>>,
): Partial<Record<string, FieldSource>> {
  const out = { ...initial };
  for (const key of Object.keys(dirty)) {
    if (!UNSOURCED.includes(key)) out[key] = 'user';
  }
  return out;
}

/** Parsed vacancy fields → form values (+ the extras the form doesn't show). */
export function valuesFromParsed(
  fields: VacancyFields,
  url: string,
  stageId: string,
): { values: ApplicationFormValues; extras: Partial<ApplicationInput> } {
  const values: ApplicationFormValues = {
    ...emptyFormValues(stageId),
    url,
    title: fields.title ?? '',
    company: fields.company ?? '',
    city: fields.city ?? '',
    country: fields.country ?? '',
    workMode: fields.workMode ?? null,
    salaryMin: num(fields.salaryMin),
    salaryMax: num(fields.salaryMax),
    salaryCurrency: fields.salaryCurrency ?? 'EUR',
    salaryPeriod: fields.salaryPeriod ?? 'month',
    salaryIsNet: fields.salaryIsNet ?? false,
    employmentType: fields.employmentType ?? null,
    stack: fields.stack ?? [],
    deadline: formatDateInput(fields.deadline),
  };
  const extras: Partial<ApplicationInput> = {
    description: fields.description ?? null,
    language: fields.language ?? null,
    postedAt: fields.postedAt ?? null,
  };
  return { values, extras };
}
