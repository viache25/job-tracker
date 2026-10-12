import type { FieldSource } from '@/db/schema';

import {
  MAX_DESCRIPTION_LENGTH,
  MAX_SHORT_FIELD_LENGTH,
  VACANCY_FIELDS,
  vacancyFieldsSchema,
  type VacancyField,
  type VacancyFields,
} from './types';

export type SourcedFields = { source: FieldSource; fields: Partial<VacancyFields> };

const SALARY_FIELDS: readonly VacancyField[] = [
  'salaryMin',
  'salaryMax',
  'salaryCurrency',
  'salaryPeriod',
  'salaryIsNet',
];

function isPresent(value: unknown): boolean {
  if (value === undefined || value === null) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

function cut(value: string, max: number): string {
  if (value.length <= max) return value;
  const slice = value.slice(0, max);
  const lastBreak = Math.max(slice.lastIndexOf('\n'), slice.lastIndexOf('. '));
  return (lastBreak > max * 0.8 ? slice.slice(0, lastBreak + 1) : slice).trimEnd();
}

/** Trims and bounds field values so they pass the schema. Invalid values are dropped. */
export function normalizeFields(fields: Partial<VacancyFields>): Partial<VacancyFields> {
  const draft: Record<string, unknown> = { ...fields };
  for (const key of ['title', 'company', 'city'] as const) {
    const v = draft[key];
    if (typeof v === 'string')
      draft[key] = cut(v.replace(/\s+/g, ' ').trim(), MAX_SHORT_FIELD_LENGTH);
  }
  if (typeof draft.description === 'string') {
    draft.description = cut(draft.description.trim(), MAX_DESCRIPTION_LENGTH);
  }
  if (Array.isArray(draft.stack)) draft.stack = [...new Set(draft.stack)].slice(0, 60);

  // Validate field by field so one bad value doesn't throw the others away.
  const out: Record<string, unknown> = {};
  for (const key of VACANCY_FIELDS) {
    if (!isPresent(draft[key])) continue;
    const parsed = vacancyFieldsSchema.shape[key].safeParse(draft[key]);
    if (parsed.success) out[key] = parsed.data;
  }
  const result = out as Partial<VacancyFields>;
  if (
    result.salaryMin !== undefined &&
    result.salaryMax !== undefined &&
    result.salaryMin > result.salaryMax
  ) {
    [result.salaryMin, result.salaryMax] = [result.salaryMax, result.salaryMin];
  }
  return result;
}

/**
 * Merges sources in priority order (markup > meta > heuristics): the first source that has
 * a field wins and is remembered in fieldSources. Salary fields travel as one group so a
 * range from one source never mixes with a currency from another.
 */
export function mergeFields(sources: readonly SourcedFields[]): {
  fields: Partial<VacancyFields>;
  fieldSources: Partial<Record<VacancyField, FieldSource>>;
} {
  const fields: Record<string, unknown> = {};
  const fieldSources: Partial<Record<VacancyField, FieldSource>> = {};
  const normalized = sources.map((s) => ({ source: s.source, fields: normalizeFields(s.fields) }));

  const salarySource = normalized.find(
    (s) => s.fields.salaryMin !== undefined || s.fields.salaryMax !== undefined,
  );
  if (salarySource) {
    for (const key of SALARY_FIELDS) {
      const value = salarySource.fields[key];
      if (value !== undefined) {
        fields[key] = value;
        fieldSources[key] = salarySource.source;
      }
    }
  }

  for (const key of VACANCY_FIELDS) {
    if (SALARY_FIELDS.includes(key)) continue;
    for (const { source, fields: candidate } of normalized) {
      const value = candidate[key];
      if (isPresent(value)) {
        fields[key] = value;
        fieldSources[key] = source;
        break;
      }
    }
  }
  return { fields: fields as Partial<VacancyFields>, fieldSources };
}
