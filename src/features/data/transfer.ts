import { z } from 'zod';

import {
  EMPLOYMENT_TYPES,
  SALARY_PERIODS,
  WORK_MODES,
  type Application,
  type Stage,
} from '@/db/schema';
import type { ApplicationInput, ApplicationsRepo } from '@/features/applications/repo';
import { sha256 } from '@/lib/crypto';

import { parseCsv, toCsv, unescapeFormula } from './csv';

/** Column order of the export; the import accepts any order and ignores unknown columns. */
export const CSV_COLUMNS = [
  'title',
  'company',
  'stage',
  'url',
  'city',
  'country',
  'work_mode',
  'employment_type',
  'salary_min',
  'salary_max',
  'salary_currency',
  'salary_period',
  'salary_is_net',
  'stack',
  'language',
  'posted_at',
  'deadline',
  'notes',
  'contact_name',
  'contact_email',
  'created_at',
  'archived_at',
] as const;
type Column = (typeof CSV_COLUMNS)[number];

/** Import limits: files are untrusted. */
export const IMPORT_LIMITS = { bytes: 5 * 1024 * 1024, rows: 10_000, cell: 20_000 } as const;

const str = (v: string | number | boolean | null | undefined) =>
  v === null || v === undefined ? '' : String(v);

export function applicationsToCsv(
  list: readonly Application[],
  stageLabel: (stageId: string) => string,
): string {
  const rows = list.map((a) => {
    const cells: Record<Column, string> = {
      title: a.title,
      company: a.company,
      stage: stageLabel(a.stageId),
      url: str(a.url),
      city: str(a.city),
      country: str(a.country),
      work_mode: str(a.workMode),
      employment_type: str(a.employmentType),
      salary_min: str(a.salaryMin),
      salary_max: str(a.salaryMax),
      salary_currency: str(a.salaryCurrency),
      salary_period: str(a.salaryPeriod),
      salary_is_net: a.salaryIsNet === null ? '' : a.salaryIsNet ? 'true' : 'false',
      stack: a.stack.join('; '),
      language: str(a.language),
      posted_at: str(a.postedAt),
      deadline: str(a.deadline),
      notes: str(a.notes),
      contact_name: str(a.contactName),
      contact_email: str(a.contactEmail),
      created_at: a.createdAt,
      archived_at: str(a.archivedAt),
    };
    return CSV_COLUMNS.map((c) => cells[c]);
  });
  return toCsv(CSV_COLUMNS, rows);
}

const text = (max: number = IMPORT_LIMITS.cell) =>
  z
    .string()
    .transform((v) => unescapeFormula(v.trim()).slice(0, max))
    .transform((v) => (v === '' ? null : v));
const required = z
  .string()
  .transform((v) => unescapeFormula(v.trim()))
  .pipe(z.string().min(1).max(500));
const oneOf = <T extends readonly [string, ...string[]]>(values: T) =>
  z.string().transform((v) => {
    const parsed = z.enum(values).safeParse(v.trim());
    return parsed.success ? parsed.data : null;
  });
const number = z.string().transform((v) => {
  const n = Number(v.trim().replace(',', '.'));
  return v.trim() === '' || !Number.isFinite(n) ? null : n;
});
const date = z.string().transform((v) => {
  const s = v.trim();
  return s && !Number.isNaN(Date.parse(s)) ? s : null;
});
const url = z.string().transform((v) => {
  const s = v.trim();
  return /^https?:\/\/\S+$/i.test(s) ? s.slice(0, 2048) : null;
});

const rowSchema = z.object({
  title: required,
  company: required,
  stage: z.string(),
  url: url,
  city: text(200),
  country: text(2),
  work_mode: oneOf(WORK_MODES),
  employment_type: oneOf(EMPLOYMENT_TYPES),
  salary_min: number,
  salary_max: number,
  salary_currency: text(3),
  salary_period: oneOf(SALARY_PERIODS),
  salary_is_net: z
    .string()
    .transform((v) => (v.trim() === 'true' ? true : v.trim() === 'false' ? false : null)),
  stack: z.string().transform((v) =>
    v
      .split(/[;,]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 50),
  ),
  language: text(10),
  posted_at: date,
  deadline: date,
  notes: text(),
  contact_name: text(200),
  contact_email: text(320),
  created_at: date,
  archived_at: date,
});

export type ImportRow = {
  input: ApplicationInput;
  createdAt: string | null;
  archivedAt: string | null;
};

export type ParsedImport = { rows: ImportRow[]; invalid: number };

/** Validates CSV text into application inputs. Stage names are matched case-insensitively. */
export function parseApplicationsCsv(
  csv: string,
  stages: readonly Stage[],
  stageNames: (stage: Stage) => string[],
): ParsedImport {
  if (csv.length > IMPORT_LIMITS.bytes) throw new ImportError('tooLarge');
  let table: string[][];
  try {
    table = parseCsv(csv);
  } catch {
    throw new ImportError('format');
  }
  const [header, ...body] = table;
  if (!header) throw new ImportError('empty');
  const columns = header.map((h) => h.trim().toLowerCase());
  if (!columns.includes('title') || !columns.includes('company')) throw new ImportError('format');
  if (body.length > IMPORT_LIMITS.rows) throw new ImportError('tooLarge');

  const byName = new Map<string, string>();
  for (const s of stages) {
    for (const n of [s.key ?? '', ...stageNames(s)]) {
      const k = n.trim().toLowerCase();
      if (k && !byName.has(k)) byName.set(k, s.id);
    }
  }

  const rows: ImportRow[] = [];
  let invalid = 0;
  for (const cells of body) {
    // Missing columns read as empty cells.
    const record: Record<string, string> = Object.fromEntries(CSV_COLUMNS.map((c) => [c, '']));
    columns.forEach((c, i) => {
      if (c in record) record[c] = cells[i] ?? '';
    });
    const parsed = rowSchema.safeParse(record);
    if (!parsed.success) {
      invalid++;
      continue;
    }
    const r = parsed.data;
    const stageId = byName.get(r.stage.trim().toLowerCase());
    rows.push({
      input: {
        title: r.title,
        company: r.company,
        ...(stageId ? { stageId } : {}),
        url: r.url,
        city: r.city,
        country: r.country?.toUpperCase() ?? null,
        workMode: r.work_mode,
        employmentType: r.employment_type,
        salaryMin: r.salary_min,
        salaryMax: r.salary_max,
        salaryCurrency: r.salary_currency?.toUpperCase() ?? null,
        salaryPeriod: r.salary_period,
        salaryIsNet: r.salary_is_net,
        stack: r.stack,
        language: r.language,
        postedAt: r.posted_at,
        deadline: r.deadline,
        notes: r.notes,
        contactName: r.contact_name,
        contactEmail: r.contact_email,
        fieldSources: {},
      },
      createdAt: r.created_at,
      archivedAt: r.archived_at,
    });
  }
  return { rows, invalid };
}

export class ImportError extends Error {
  constructor(public readonly reason: 'tooLarge' | 'format' | 'empty') {
    super(reason);
  }
}

export type ImportResult = { added: number; skipped: number; invalid: number };

const identity = (a: { company: string; title: string; createdAt?: string | null }) =>
  `${a.company.trim().toLowerCase()}|${a.title.trim().toLowerCase()}|${(a.createdAt ?? '').slice(0, 10)}`;

/**
 * Adds parsed rows, skipping duplicates: same link as an existing application, or
 * same company, title and creation day (also within the file itself).
 */
export async function importApplications(
  repo: ApplicationsRepo,
  parsed: ParsedImport,
): Promise<ImportResult> {
  const existing = repo.list();
  const hashes = new Set(existing.map((a) => a.urlHash).filter((h): h is string => !!h));
  const keys = new Set(existing.map(identity));
  let added = 0;
  let skipped = 0;
  for (const row of parsed.rows) {
    const urlHash = row.input.url ? await sha256(row.input.url) : null;
    const key = identity({ ...row.input, createdAt: row.createdAt });
    if ((urlHash && hashes.has(urlHash)) || (row.createdAt && keys.has(key))) {
      skipped++;
      continue;
    }
    const created = repo.create(
      { ...row.input, urlHash },
      row.createdAt ? { createdAt: row.createdAt } : {},
    );
    if (row.archivedAt) repo.archive(created.id);
    if (urlHash) hashes.add(urlHash);
    keys.add(identity(created));
    added++;
  }
  return { added, skipped, invalid: parsed.invalid };
}
