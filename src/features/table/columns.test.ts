import { makeApplication, makeStage } from '@/test/factories';

import {
  DEFAULT_COLUMNS,
  moveColumn,
  nextSort,
  normalizeColumns,
  sortRows,
  summarize,
  type ColumnConfig,
} from './columns';

const stageById = new Map([
  ['applied', makeStage({ id: 'applied', position: 1 })],
  ['offer', makeStage({ id: 'offer', position: 6 })],
]);

describe('table columns', () => {
  it('normalizes stored config', () => {
    const stored: ColumnConfig = [
      { id: 'title', visible: false, width: 'narrow' },
      { id: 'company', visible: false, width: 'wide' },
      { id: 'title', visible: true, width: 'wide' },
    ];
    const cols = normalizeColumns(stored);
    expect(cols[0]).toEqual({ id: 'company', visible: true, width: 'wide' });
    expect(cols[1]).toEqual({ id: 'title', visible: false, width: 'narrow' });
    expect(cols).toHaveLength(DEFAULT_COLUMNS.length);
  });

  it('moves columns but never the pinned one', () => {
    const cols = normalizeColumns(DEFAULT_COLUMNS);
    expect(
      moveColumn(cols, 'stage', -1)
        .map((c) => c.id)
        .slice(0, 3),
    ).toEqual(['company', 'stage', 'title']);
    expect(moveColumn(cols, 'title', -1)).toBe(cols);
    expect(moveColumn(cols, 'company', 1)).toBe(cols);
    expect(moveColumn(cols, 'source', 1)).toBe(cols);
  });

  it('cycles sort direction', () => {
    expect(nextSort({ column: 'title', direction: 'asc' }, 'title')).toEqual({
      column: 'title',
      direction: 'desc',
    });
    expect(nextSort({ column: 'title', direction: 'asc' }, 'salary')).toEqual({
      column: 'salary',
      direction: 'desc',
    });
    expect(nextSort({ column: 'salary', direction: 'desc' }, 'company')).toEqual({
      column: 'company',
      direction: 'asc',
    });
  });

  it('sorts with empty values last', () => {
    const rows = [
      makeApplication({ id: 'a', company: 'beta', salaryMonthlyGross: 3000, stageId: 'offer' }),
      makeApplication({ id: 'b', company: 'Alpha', salaryMonthlyGross: null, stageId: 'applied' }),
      makeApplication({ id: 'c', company: 'Ölwerk', salaryMonthlyGross: 5000, stageId: 'applied' }),
    ];
    const ids = (column: Parameters<typeof sortRows>[1]['column'], direction: 'asc' | 'desc') =>
      sortRows(rows, { column, direction }, stageById).map((r) => r.id);
    expect(ids('salary', 'desc')).toEqual(['c', 'a', 'b']);
    expect(ids('salary', 'asc')).toEqual(['a', 'c', 'b']);
    expect(ids('company', 'asc')).toEqual(['b', 'a', 'c']);
    expect(ids('stage', 'desc')[0]).toBe('a');
  });

  it('summarizes count and median salary', () => {
    expect(
      summarize([
        makeApplication({ salaryMonthlyGross: 3000 }),
        makeApplication({ salaryMonthlyGross: 5000 }),
        makeApplication({ salaryMonthlyGross: null }),
      ]),
    ).toEqual({ count: 3, medianSalary: 4000 });
    expect(summarize([])).toEqual({ count: 0, medianSalary: null });
  });
});
