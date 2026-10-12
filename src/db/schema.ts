import { index, integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const WORK_MODES = ['onsite', 'hybrid', 'remote'] as const;
export type WorkMode = (typeof WORK_MODES)[number];

export const EMPLOYMENT_TYPES = [
  'full_time',
  'part_time',
  'contract',
  'internship',
  'other',
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const SALARY_PERIODS = ['hour', 'month', 'year'] as const;
export type SalaryPeriod = (typeof SALARY_PERIODS)[number];

export const FIELD_SOURCES = ['markup', 'meta', 'heuristic', 'ai', 'user'] as const;
export type FieldSource = (typeof FIELD_SOURCES)[number];

export const STAGE_KINDS = ['active', 'closed'] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export const stages = sqliteTable('stages', {
  id: text('id').primaryKey(),
  /** Stable key for built-in stages (wishlist, applied…); null for user-created ones. */
  key: text('key'),
  name: text('name').notNull(),
  color: text('color').notNull(),
  position: integer('position').notNull(),
  kind: text('kind', { enum: STAGE_KINDS }).notNull(),
  needsAction: integer('needs_action', { mode: 'boolean' }).notNull().default(false),
  hidden: integer('hidden', { mode: 'boolean' }).notNull().default(false),
});

export const applications = sqliteTable(
  'applications',
  {
    id: text('id').primaryKey(),
    url: text('url'),
    urlHash: text('url_hash'),
    source: text('source'),
    title: text('title').notNull(),
    company: text('company').notNull(),
    city: text('city'),
    country: text('country'),
    workMode: text('work_mode', { enum: WORK_MODES }),
    salaryMin: real('salary_min'),
    salaryMax: real('salary_max'),
    salaryCurrency: text('salary_currency'),
    salaryPeriod: text('salary_period', { enum: SALARY_PERIODS }),
    salaryIsNet: integer('salary_is_net', { mode: 'boolean' }),
    salaryMonthlyGross: real('salary_monthly_gross'),
    employmentType: text('employment_type', { enum: EMPLOYMENT_TYPES }),
    stack: text('stack', { mode: 'json' }).$type<string[]>().notNull().default([]),
    language: text('language'),
    postedAt: text('posted_at'),
    deadline: text('deadline'),
    description: text('description'),
    stageId: text('stage_id')
      .notNull()
      .references(() => stages.id),
    notes: text('notes'),
    contactName: text('contact_name'),
    contactEmail: text('contact_email'),
    custom: text('custom', { mode: 'json' }).$type<Record<string, unknown>>().notNull().default({}),
    fieldSources: text('field_sources', { mode: 'json' })
      .$type<Partial<Record<string, FieldSource>>>()
      .notNull()
      .default({}),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
    archivedAt: text('archived_at'),
    deletedAt: text('deleted_at'),
  },
  (t) => [
    index('applications_stage_idx').on(t.stageId),
    index('applications_url_hash_idx').on(t.urlHash),
    index('applications_updated_idx').on(t.updatedAt),
  ],
);

export const stageEvents = sqliteTable(
  'stage_events',
  {
    id: text('id').primaryKey(),
    applicationId: text('application_id')
      .notNull()
      .references(() => applications.id, { onDelete: 'cascade' }),
    fromStageId: text('from_stage_id'),
    toStageId: text('to_stage_id').notNull(),
    at: text('at').notNull(),
  },
  (t) => [index('stage_events_application_idx').on(t.applicationId)],
);

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<unknown>().notNull(),
});

export type Stage = typeof stages.$inferSelect;
export type NewStage = typeof stages.$inferInsert;
export type Application = typeof applications.$inferSelect;
export type NewApplication = typeof applications.$inferInsert;
export type StageEvent = typeof stageEvents.$inferSelect;
