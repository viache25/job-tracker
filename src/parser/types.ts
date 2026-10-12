import { z } from 'zod';

import { EMPLOYMENT_TYPES, SALARY_PERIODS, WORK_MODES, type FieldSource } from '@/db/schema';

export const MAX_DESCRIPTION_LENGTH = 20_000;
export const MAX_SHORT_FIELD_LENGTH = 300;

const shortText = z.string().trim().min(1).max(MAX_SHORT_FIELD_LENGTH);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Everything the parser may extract from a vacancy. Validated before it leaves the parser. */
export const vacancyFieldsSchema = z
  .object({
    title: shortText,
    company: shortText,
    city: shortText,
    country: z.string().regex(/^[A-Z]{2}$/),
    workMode: z.enum(WORK_MODES),
    salaryMin: z.number().positive().finite(),
    salaryMax: z.number().positive().finite(),
    salaryCurrency: z.string().regex(/^[A-Z]{3}$/),
    salaryPeriod: z.enum(SALARY_PERIODS),
    salaryIsNet: z.boolean(),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    stack: z.array(z.string().min(1).max(60)).max(60),
    language: z.string().regex(/^[a-z]{2}$/),
    postedAt: isoDate,
    deadline: isoDate,
    description: z.string().min(1).max(MAX_DESCRIPTION_LENGTH),
  })
  .partial();

export type VacancyFields = z.infer<typeof vacancyFieldsSchema>;
export type VacancyField = keyof VacancyFields;

export const VACANCY_FIELDS = Object.keys(vacancyFieldsSchema.shape) as VacancyField[];

/** Fields the user must not have to type for a parse to count as a success. */
export const KEY_FIELDS: readonly VacancyField[] = ['title', 'company'];

export type ParsedVacancy = {
  /** Canonical URL (no tracking params or fragment). */
  url: string;
  urlHash: string;
  source: string;
  fields: VacancyFields;
  fieldSources: Partial<Record<VacancyField, FieldSource>>;
};

export type ParseErrorCode =
  | 'invalid_url'
  | 'timeout'
  | 'network'
  | 'http_error'
  | 'not_html'
  | 'too_large'
  | 'login_required'
  | 'nothing_found';

export type ParseResult =
  | { ok: true; vacancy: ParsedVacancy; complete: boolean }
  | { ok: false; error: ParseErrorCode; url?: string; status?: number };
