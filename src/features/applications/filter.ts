import { z } from 'zod';

import { WORK_MODES, type Application, type Stage } from '@/db/schema';
import { daysSince } from '@/lib/format';

export const SORT_KEYS = ['updated', 'created', 'salary', 'deadline'] as const;
export type SortKey = (typeof SORT_KEYS)[number];

export const listFilterSchema = z.object({
  search: z.string().default(''),
  stageIds: z.array(z.string()).default([]),
  workModes: z.array(z.enum(WORK_MODES)).default([]),
  hasSalary: z.boolean().default(false),
  deadlineSoon: z.boolean().default(false),
});
export type ListFilter = z.infer<typeof listFilterSchema>;

export const EMPTY_FILTER: ListFilter = listFilterSchema.parse({});

export const sortSchema = z.enum(SORT_KEYS);
export const DEFAULT_SORT: SortKey = 'updated';

/** Days ahead that count as "deadline soon". */
export const DEADLINE_SOON_DAYS = 3;

export function isFilterActive(filter: ListFilter): boolean {
  return (
    filter.search.trim() !== '' ||
    filter.stageIds.length > 0 ||
    filter.workModes.length > 0 ||
    filter.hasSalary ||
    filter.deadlineSoon
  );
}

export function countActiveFilters(filter: ListFilter): number {
  return (
    (filter.stageIds.length > 0 ? 1 : 0) +
    (filter.workModes.length > 0 ? 1 : 0) +
    (filter.hasSalary ? 1 : 0) +
    (filter.deadlineSoon ? 1 : 0)
  );
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function hasSalary(a: Application): boolean {
  return a.salaryMin != null || a.salaryMax != null;
}

export function matchesFilter(a: Application, filter: ListFilter, now: Date): boolean {
  const query = normalize(filter.search.trim());
  if (query) {
    const haystack = normalize([a.company, a.title, a.notes ?? ''].join('\n'));
    if (!query.split(/\s+/).every((word) => haystack.includes(word))) return false;
  }
  if (filter.stageIds.length > 0 && !filter.stageIds.includes(a.stageId)) return false;
  if (filter.workModes.length > 0 && (!a.workMode || !filter.workModes.includes(a.workMode))) {
    return false;
  }
  if (filter.hasSalary && !hasSalary(a)) return false;
  if (filter.deadlineSoon) {
    if (!a.deadline) return false;
    const daysLeft = -daysSince(a.deadline, now);
    if (daysLeft < 0 || daysLeft > DEADLINE_SOON_DAYS) return false;
  }
  return true;
}

/** Nulls always go last, whatever the direction. */
function compareNullable<T>(
  a: T | null | undefined,
  b: T | null | undefined,
  cmp: (x: T, y: T) => number,
) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  return cmp(a, b);
}

const byString = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
const byNumber = (x: number, y: number) => x - y;

export function compareApplications(sort: SortKey) {
  return (a: Application, b: Application): number => {
    switch (sort) {
      case 'updated':
        return byString(b.updatedAt, a.updatedAt);
      case 'created':
        return byString(b.createdAt, a.createdAt);
      case 'salary':
        return (
          compareNullable(a.salaryMonthlyGross, b.salaryMonthlyGross, (x, y) => byNumber(y, x)) ||
          byString(b.updatedAt, a.updatedAt)
        );
      case 'deadline':
        return (
          compareNullable(a.deadline, b.deadline, byString) || byString(b.updatedAt, a.updatedAt)
        );
    }
  };
}

export function applyFilter(
  rows: readonly Application[],
  filter: ListFilter,
  sort: SortKey,
  now: Date = new Date(),
): Application[] {
  return rows.filter((a) => matchesFilter(a, filter, now)).sort(compareApplications(sort));
}

/** An application lives in the archive when it is archived or sits in a closed stage. */
export function isInArchive(a: Application, stageById: ReadonlyMap<string, Stage>): boolean {
  if (a.archivedAt) return true;
  return stageById.get(a.stageId)?.kind === 'closed';
}

export type StageGroup = { stage: Stage; items: Application[] };

/** Groups applications by active stage in funnel order; the rest goes to `archive`. */
export function groupByStage(
  rows: readonly Application[],
  stageList: readonly Stage[],
): { groups: StageGroup[]; archive: Application[] } {
  const stageById = new Map(stageList.map((s) => [s.id, s]));
  const groups = new Map<string, StageGroup>();
  for (const stage of stageList) {
    if (stage.kind === 'active') groups.set(stage.id, { stage, items: [] });
  }
  const archive: Application[] = [];
  for (const a of rows) {
    const group = groups.get(a.stageId);
    if (!isInArchive(a, stageById) && group) group.items.push(a);
    else archive.push(a);
  }
  return { groups: [...groups.values()].filter((g) => g.items.length > 0), archive };
}
