import { makeApplication, makeStage } from '@/test/factories';

import {
  applyFilter,
  countActiveFilters,
  EMPTY_FILTER,
  groupByStage,
  isFilterActive,
} from './filter';

const now = new Date(2026, 9, 12, 12, 0);

describe('applyFilter', () => {
  const rows = [
    makeApplication({
      id: 'a',
      company: 'Österreichische Post',
      title: 'Frontend Entwickler',
      workMode: 'hybrid',
      salaryMin: 3600,
      salaryMonthlyGross: 3600,
      deadline: '2026-10-14',
      updatedAt: '2026-10-10T10:00:00Z',
      createdAt: '2026-10-01T10:00:00Z',
    }),
    makeApplication({
      id: 'b',
      company: 'ACME',
      title: 'Backend Developer',
      notes: 'Рекрутер Анна',
      workMode: 'remote',
      salaryMax: 6000,
      salaryMonthlyGross: 6000,
      deadline: '2026-10-30',
      updatedAt: '2026-10-11T10:00:00Z',
      createdAt: '2026-09-01T10:00:00Z',
    }),
    makeApplication({
      id: 'c',
      company: 'Globex',
      title: 'QA',
      stageId: 'interview',
      updatedAt: '2026-10-09T10:00:00Z',
      createdAt: '2026-10-05T10:00:00Z',
    }),
  ];
  const ids = (filter = EMPTY_FILTER, sort: Parameters<typeof applyFilter>[2] = 'updated') =>
    applyFilter(rows, filter, sort, now).map((a) => a.id);

  it('sorts by updated by default', () => {
    expect(ids()).toEqual(['b', 'a', 'c']);
  });

  it('searches company, title and notes ignoring case and accents', () => {
    expect(ids({ ...EMPTY_FILTER, search: 'osterreich' })).toEqual(['a']);
    expect(ids({ ...EMPTY_FILTER, search: 'анна' })).toEqual(['b']);
    expect(ids({ ...EMPTY_FILTER, search: 'developer acme' })).toEqual(['b']);
    expect(ids({ ...EMPTY_FILTER, search: 'nothing' })).toEqual([]);
  });

  it('filters by stage, work mode, salary and deadline', () => {
    expect(ids({ ...EMPTY_FILTER, stageIds: ['interview'] })).toEqual(['c']);
    expect(ids({ ...EMPTY_FILTER, workModes: ['remote', 'hybrid'] })).toEqual(['b', 'a']);
    expect(ids({ ...EMPTY_FILTER, hasSalary: true })).toEqual(['b', 'a']);
    expect(ids({ ...EMPTY_FILTER, deadlineSoon: true })).toEqual(['a']);
  });

  it('sorts by created, salary and deadline with empty values last', () => {
    expect(ids(EMPTY_FILTER, 'created')).toEqual(['c', 'a', 'b']);
    expect(ids(EMPTY_FILTER, 'salary')).toEqual(['b', 'a', 'c']);
    expect(ids(EMPTY_FILTER, 'deadline')).toEqual(['a', 'b', 'c']);
  });

  it('reports active filters', () => {
    expect(isFilterActive(EMPTY_FILTER)).toBe(false);
    expect(isFilterActive({ ...EMPTY_FILTER, search: ' x ' })).toBe(true);
    expect(countActiveFilters({ ...EMPTY_FILTER, hasSalary: true, stageIds: ['x'] })).toBe(2);
  });
});

describe('groupByStage', () => {
  const stageList = [
    makeStage({ id: 'applied', position: 0 }),
    makeStage({ id: 'interview', position: 1 }),
    makeStage({ id: 'offer', position: 2 }),
    makeStage({ id: 'rejected', position: 3, kind: 'closed' }),
  ];

  it('groups active stages in funnel order and archives the rest', () => {
    const rows = [
      makeApplication({ id: '1', stageId: 'interview' }),
      makeApplication({ id: '2', stageId: 'applied' }),
      makeApplication({ id: '3', stageId: 'rejected' }),
      makeApplication({ id: '4', stageId: 'applied', archivedAt: '2026-10-01' }),
      makeApplication({ id: '5', stageId: 'deleted-stage' }),
    ];
    const { groups, archive } = groupByStage(rows, stageList);
    expect(groups.map((g) => [g.stage.id, g.items.map((a) => a.id)])).toEqual([
      ['applied', ['2']],
      ['interview', ['1']],
    ]);
    expect(archive.map((a) => a.id)).toEqual(['3', '4', '5']);
  });
});
