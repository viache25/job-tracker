import type { Application, Stage } from '@/db/schema';

let seq = 0;

export function makeApplication(overrides: Partial<Application> = {}): Application {
  seq += 1;
  const at =
    overrides.updatedAt ?? `2026-10-${String((seq % 28) + 1).padStart(2, '0')}T10:00:00.000Z`;
  return {
    id: `app-${seq}`,
    url: null,
    urlHash: null,
    source: null,
    title: `Developer ${seq}`,
    company: `Company ${seq}`,
    city: null,
    country: null,
    workMode: null,
    salaryMin: null,
    salaryMax: null,
    salaryCurrency: null,
    salaryPeriod: null,
    salaryIsNet: null,
    salaryMonthlyGross: null,
    employmentType: null,
    stack: [],
    language: null,
    postedAt: null,
    deadline: null,
    description: null,
    stageId: 'applied',
    notes: null,
    contactName: null,
    contactEmail: null,
    custom: {},
    fieldSources: {},
    createdAt: at,
    updatedAt: at,
    archivedAt: null,
    deletedAt: null,
    ...overrides,
  };
}

export function makeStage(overrides: Partial<Stage> & { id: string }): Stage {
  return {
    key: overrides.id,
    name: '',
    color: 'blue',
    position: 0,
    kind: 'active',
    needsAction: false,
    hidden: false,
    ...overrides,
  };
}
