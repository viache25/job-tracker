import type { EmploymentType, SalaryPeriod } from '@/db/schema';

import { normalizeCountry } from './geo';
import { parseAmount } from './heuristics';
import { cleanInline, extractJsonLdBlocks, richTextToPlain } from './html';
import type { VacancyFields } from './types';

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };
type JsonObject = { [key: string]: Json };

function isObject(value: Json | undefined): value is JsonObject {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: Json | undefined): Json[] {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function str(value: Json | undefined): string | undefined {
  if (typeof value === 'string') return value.trim() || undefined;
  if (typeof value === 'number') return String(value);
  return undefined;
}

function num(value: Json | undefined): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) && value > 0 ? value : undefined;
  if (typeof value === 'string') return parseAmount(value.replace(/[^\d.,' ]/g, '').trim());
  return undefined;
}

function hasType(node: JsonObject, type: string): boolean {
  return asArray(node['@type']).some(
    (t) => typeof t === 'string' && t.replace(/^.*[/#]/, '').toLowerCase() === type.toLowerCase(),
  );
}

/**
 * JSON with a few common defects repaired: raw control characters inside strings and
 * trailing commas. Returns undefined if it still doesn't parse.
 */
function parseLenient(raw: string): Json | undefined {
  const text = raw
    .trim()
    .replace(/^<!--|-->$/g, '')
    .replace(/^\/\*<!\[CDATA\[\*\/|\/\*\]\]>\*\/$/g, '');
  try {
    return JSON.parse(text) as Json;
  } catch {
    try {
      const repaired = text.replace(/[\u0000-\u001f]+/g, ' ').replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(repaired) as Json;
    } catch {
      return undefined;
    }
  }
}

/** Every JobPosting object in the page, wherever it is nested (arrays, @graph, mainEntity…). */
export function findJobPostings(html: string): JsonObject[] {
  const found: JsonObject[] = [];
  const visit = (node: Json | undefined, depth: number) => {
    if (depth > 8 || node === undefined || node === null) return;
    if (Array.isArray(node)) {
      node.forEach((n) => visit(n, depth + 1));
      return;
    }
    if (!isObject(node)) return;
    if (hasType(node, 'JobPosting')) {
      found.push(node);
      return;
    }
    for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'item']) {
      visit(node[key], depth + 1);
    }
  };
  for (const block of extractJsonLdBlocks(html)) visit(parseLenient(block), 0);
  return found;
}

function organizationName(value: Json | undefined): string | undefined {
  for (const org of asArray(value)) {
    const name = typeof org === 'string' ? org : isObject(org) ? str(org.name) : undefined;
    if (name) return cleanInline(name);
  }
  return undefined;
}

function location(value: Json | undefined): { city?: string; country?: string } {
  for (const place of asArray(value)) {
    if (!isObject(place)) continue;
    const address = place.address;
    if (typeof address === 'string') {
      const parts = address.split(',').map((p) => p.trim());
      const country = normalizeCountry(parts.at(-1));
      return { city: parts.length > 1 ? parts.at(-2) : parts[0], country };
    }
    for (const a of asArray(address)) {
      if (!isObject(a)) continue;
      const city = str(a.addressLocality) ?? str(a.addressRegion);
      const countryValue = isObject(a.addressCountry)
        ? (str(a.addressCountry.name) ?? str(a.addressCountry.identifier))
        : str(a.addressCountry);
      const country = normalizeCountry(countryValue);
      if (city || country) return { city: city && cleanInline(city), country };
    }
  }
  return {};
}

const UNIT_PERIOD: Record<string, { period: SalaryPeriod; factor: number }> = {
  hour: { period: 'hour', factor: 1 },
  day: { period: 'month', factor: (52 * 5) / 12 },
  week: { period: 'month', factor: 52 / 12 },
  month: { period: 'month', factor: 1 },
  year: { period: 'year', factor: 1 },
  annual: { period: 'year', factor: 1 },
};

function salary(value: Json | undefined): Partial<VacancyFields> {
  for (const amount of asArray(value)) {
    if (!isObject(amount)) {
      const n = num(amount);
      if (n) return { salaryMin: n, salaryMax: n };
      continue;
    }
    const currency = str(amount.currency)?.toUpperCase();
    const inner = amount.value;
    let min: number | undefined;
    let max: number | undefined;
    let unit = str(amount.unitText);
    if (isObject(inner)) {
      const single = num(inner.value);
      min = num(inner.minValue) ?? single;
      max = num(inner.maxValue) ?? single;
      unit = str(inner.unitText) ?? unit;
    } else {
      const single = num(inner);
      min = num(amount.minValue) ?? single;
      max = num(amount.maxValue) ?? single;
    }
    if (min === undefined && max === undefined) continue;
    const mapped = unit ? UNIT_PERIOD[unit.toLowerCase().replace(/ly$/, '')] : undefined;
    const factor = mapped?.factor ?? 1;
    const round = (n: number | undefined) =>
      n === undefined ? undefined : factor === 1 ? n : Math.round(n * factor);
    const result: Partial<VacancyFields> = {
      salaryMin: round(min ?? max),
      salaryMax: round(max ?? min),
    };
    if (currency && /^[A-Z]{3}$/.test(currency)) result.salaryCurrency = currency;
    if (mapped) result.salaryPeriod = mapped.period;
    return result;
  }
  return {};
}

const EMPLOYMENT: Record<string, EmploymentType> = {
  full_time: 'full_time',
  fulltime: 'full_time',
  vollzeit: 'full_time',
  part_time: 'part_time',
  parttime: 'part_time',
  teilzeit: 'part_time',
  contractor: 'contract',
  contract: 'contract',
  temporary: 'contract',
  freelance: 'contract',
  intern: 'internship',
  internship: 'internship',
  praktikum: 'internship',
  per_diem: 'other',
  volunteer: 'other',
  other: 'other',
};

function employmentType(value: Json | undefined): EmploymentType | undefined {
  for (const v of asArray(value)) {
    const key = str(v)
      ?.toLowerCase()
      .replace(/[\s-]+/g, '_');
    if (key && EMPLOYMENT[key]) return EMPLOYMENT[key];
  }
  return undefined;
}

function isoDate(value: Json | undefined): string | undefined {
  const s = str(value);
  if (!s) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10);
}

function isRemote(posting: JsonObject): boolean {
  const type = asArray(posting.jobLocationType).map((t) => str(t)?.toUpperCase());
  return type.includes('TELECOMMUTE');
}

function language(value: Json | undefined): string | undefined {
  const code = (isObject(value) ? str(value.alternateName) : str(value))?.toLowerCase().slice(0, 2);
  return code && /^[a-z]{2}$/.test(code) ? code : undefined;
}

/** Fields from the first usable JobPosting in the page's JSON-LD. */
export function parseJsonLd(html: string): Partial<VacancyFields> {
  const postings = findJobPostings(html);
  const posting = postings.find((p) => str(p.title) ?? str(p.name)) ?? postings[0];
  if (!posting) return {};

  const fields: Partial<VacancyFields> = {};
  const title = str(posting.title) ?? str(posting.name);
  if (title) fields.title = cleanInline(title);
  const company = organizationName(posting.hiringOrganization);
  if (company) fields.company = company;

  const { city, country } = location(posting.jobLocation);
  if (city) fields.city = city;
  if (country) fields.country = country;
  if (!country) {
    for (const req of asArray(posting.applicantLocationRequirements)) {
      const c = normalizeCountry(isObject(req) ? str(req.name) : str(req));
      if (c) {
        fields.country = c;
        break;
      }
    }
  }
  if (isRemote(posting)) fields.workMode = 'remote';

  Object.assign(fields, salary(posting.baseSalary ?? posting.estimatedSalary));

  const posted = isoDate(posting.datePosted);
  if (posted) fields.postedAt = posted;
  const deadline = isoDate(posting.validThrough);
  if (deadline) fields.deadline = deadline;
  const employment = employmentType(posting.employmentType);
  if (employment) fields.employmentType = employment;
  const lang = language(posting.inLanguage);
  if (lang) fields.language = lang;

  const description = str(posting.description);
  if (description) {
    const text = richTextToPlain(description);
    if (text) fields.description = text;
  }
  return fields;
}

/** Extra text from JSON-LD (skills, qualifications) that helps the stack heuristics. */
export function jsonLdSkillsText(html: string): string {
  const posting = findJobPostings(html)[0];
  if (!posting) return '';
  return ['skills', 'qualifications', 'experienceRequirements', 'occupationalCategory']
    .flatMap((k) => asArray(posting[k]).map((v) => (isObject(v) ? str(v.name) : str(v)) ?? ''))
    .map(richTextToPlain)
    .join('\n');
}
