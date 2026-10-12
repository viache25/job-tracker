import type { TFunction } from 'i18next';
import { z } from 'zod';

import type { Application, Stage } from '@/db/schema';
import { stageLabel } from '@/features/stages/label';
import { formatDate, formatMoney } from '@/lib/format';
import { median } from '@/lib/salary';
import type { columnWidth } from '@/ui/tokens';

export const COLUMN_IDS = [
  'company',
  'title',
  'stage',
  'salary',
  'workMode',
  'stack',
  'deadline',
  'updated',
  'city',
  'employmentType',
  'created',
  'source',
] as const;
export type ColumnId = (typeof COLUMN_IDS)[number];
export type ColumnWidth = keyof typeof columnWidth;

/** The first column is pinned and always visible. */
export const PINNED_COLUMN: ColumnId = 'company';

export const columnConfigSchema = z.array(
  z.object({
    id: z.enum(COLUMN_IDS),
    visible: z.boolean(),
    width: z.enum(['narrow', 'normal', 'wide']),
  }),
);
export type ColumnConfig = z.infer<typeof columnConfigSchema>;

/** Defaults from PRD 4.2; the extra columns start hidden. */
export const DEFAULT_COLUMNS: ColumnConfig = [
  { id: 'company', visible: true, width: 'normal' },
  { id: 'title', visible: true, width: 'wide' },
  { id: 'stage', visible: true, width: 'normal' },
  { id: 'salary', visible: true, width: 'normal' },
  { id: 'workMode', visible: true, width: 'narrow' },
  { id: 'stack', visible: true, width: 'wide' },
  { id: 'deadline', visible: true, width: 'normal' },
  { id: 'updated', visible: true, width: 'normal' },
  { id: 'city', visible: false, width: 'normal' },
  { id: 'employmentType', visible: false, width: 'normal' },
  { id: 'created', visible: false, width: 'normal' },
  { id: 'source', visible: false, width: 'normal' },
];

/**
 * Stored config merged with defaults: unknown or duplicate ids are dropped, new columns appended,
 * the pinned column kept first and visible.
 */
export function normalizeColumns(stored: ColumnConfig): ColumnConfig {
  const seen = new Set<ColumnId>();
  const out: ColumnConfig = [];
  for (const c of stored) {
    if (!seen.has(c.id)) {
      seen.add(c.id);
      out.push(c);
    }
  }
  for (const c of DEFAULT_COLUMNS) if (!seen.has(c.id)) out.push(c);
  const pinned = out.find((c) => c.id === PINNED_COLUMN)!;
  return [{ ...pinned, visible: true }, ...out.filter((c) => c.id !== PINNED_COLUMN)];
}

export function moveColumn(columns: ColumnConfig, id: ColumnId, direction: -1 | 1): ColumnConfig {
  const list = [...columns];
  const from = list.findIndex((c) => c.id === id);
  const to = from + direction;
  // Index 0 is the pinned column: nothing moves into or out of it.
  if (from <= 0 || to <= 0 || to >= list.length) return columns;
  [list[from], list[to]] = [list[to]!, list[from]!];
  return list;
}

export type SortState = { column: ColumnId; direction: 'asc' | 'desc' };
export const sortStateSchema = z.object({
  column: z.enum(COLUMN_IDS),
  direction: z.enum(['asc', 'desc']),
});
export const DEFAULT_TABLE_SORT: SortState = { column: 'updated', direction: 'desc' };

/** Next sort when a header is tapped: same column flips, a new column starts with its natural order. */
export function nextSort(current: SortState, column: ColumnId): SortState {
  if (current.column === column) {
    return { column, direction: current.direction === 'asc' ? 'desc' : 'asc' };
  }
  const descFirst: ColumnId[] = ['salary', 'updated', 'created'];
  return { column, direction: descFirst.includes(column) ? 'desc' : 'asc' };
}

type SortValue = string | number | null;

export function sortValue(
  a: Application,
  column: ColumnId,
  stageById: ReadonlyMap<string, Stage>,
): SortValue {
  switch (column) {
    case 'company':
      return a.company.toLocaleLowerCase();
    case 'title':
      return a.title.toLocaleLowerCase();
    case 'stage':
      return stageById.get(a.stageId)?.position ?? null;
    case 'salary':
      return a.salaryMonthlyGross;
    case 'workMode':
      return a.workMode;
    case 'stack':
      return a.stack.length > 0 ? a.stack.join(', ').toLocaleLowerCase() : null;
    case 'deadline':
      return a.deadline;
    case 'updated':
      return a.updatedAt;
    case 'city':
      return a.city?.toLocaleLowerCase() ?? null;
    case 'employmentType':
      return a.employmentType;
    case 'created':
      return a.createdAt;
    case 'source':
      return a.source;
  }
}

/** Sorts rows; empty values always go last. */
export function sortRows(
  rows: readonly Application[],
  sort: SortState,
  stageById: ReadonlyMap<string, Stage>,
): Application[] {
  const sign = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((x, y) => {
    const a = sortValue(x, sort.column, stageById);
    const b = sortValue(y, sort.column, stageById);
    if (a === null && b === null) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    if (typeof a === 'number' && typeof b === 'number') return (a - b) * sign;
    return String(a).localeCompare(String(b)) * sign;
  });
}

export function cellText(
  a: Application,
  column: ColumnId,
  ctx: { t: TFunction; locale: string; stageById: ReadonlyMap<string, Stage> },
): string {
  const { t, locale } = ctx;
  switch (column) {
    case 'company':
      return a.company;
    case 'title':
      return a.title;
    case 'stage':
      return stageLabel(ctx.stageById.get(a.stageId), t);
    case 'salary':
      return a.salaryMonthlyGross != null
        ? formatMoney(a.salaryMonthlyGross, a.salaryCurrency ?? 'EUR', locale)
        : a.salaryIsNet && (a.salaryMin ?? a.salaryMax) != null
          ? `${formatMoney((a.salaryMin ?? a.salaryMax)!, a.salaryCurrency ?? 'EUR', locale)} ${t('money.net')}`
          : '';
    case 'workMode':
      return a.workMode ? t(`workMode.${a.workMode}`) : '';
    case 'stack':
      return a.stack.join(', ');
    case 'deadline':
      return a.deadline ? formatDate(a.deadline, locale) : '';
    case 'updated':
      return formatDate(a.updatedAt, locale);
    case 'city':
      return a.city ?? '';
    case 'employmentType':
      return a.employmentType ? t(`employmentType.${a.employmentType}`) : '';
    case 'created':
      return formatDate(a.createdAt, locale);
    case 'source':
      return a.source ?? '';
  }
}

export function summarize(rows: readonly Application[]): {
  count: number;
  medianSalary: number | null;
} {
  const salaries = rows.map((r) => r.salaryMonthlyGross).filter((v): v is number => v != null);
  return { count: rows.length, medianSalary: median(salaries) };
}
