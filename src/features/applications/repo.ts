import { and, asc, desc, eq, isNull } from 'drizzle-orm';

import { DEFAULT_STAGE_KEY } from '@/db/defaults';
import {
  applications,
  stageEvents,
  stages,
  type Application,
  type NewApplication,
  type StageEvent,
} from '@/db/schema';
import type { Db } from '@/db/types';
import { newId, nowIso } from '@/lib/id';
import { monthlyGross } from '@/lib/salary';

/** Everything a user or the parser can set on an application. */
export type ApplicationInput = Omit<
  NewApplication,
  'id' | 'createdAt' | 'updatedAt' | 'archivedAt' | 'deletedAt' | 'salaryMonthlyGross' | 'stageId'
> & { stageId?: string };

export type ApplicationPatch = Partial<ApplicationInput>;

const SALARY_FIELDS = ['salaryMin', 'salaryMax', 'salaryPeriod', 'salaryIsNet', 'country'] as const;

export function createApplicationsRepo(db: Db, clock: () => string = nowIso) {
  function defaultStageId(): string {
    const byKey = db.select().from(stages).where(eq(stages.key, DEFAULT_STAGE_KEY)).get();
    const stage =
      byKey ??
      db.select().from(stages).where(eq(stages.kind, 'active')).orderBy(asc(stages.position)).get();
    if (!stage) throw new Error('No stages available');
    return stage.id;
  }

  function get(id: string): Application | undefined {
    return db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), isNull(applications.deletedAt)))
      .get();
  }

  function require(id: string): Application {
    const row = get(id);
    if (!row) throw new Error(`Application ${id} not found`);
    return row;
  }

  return {
    get,

    list(): Application[] {
      return db
        .select()
        .from(applications)
        .where(isNull(applications.deletedAt))
        .orderBy(desc(applications.updatedAt))
        .all();
    },

    findByUrlHash(urlHash: string): Application | undefined {
      return db
        .select()
        .from(applications)
        .where(and(eq(applications.urlHash, urlHash), isNull(applications.deletedAt)))
        .get();
    },

    /**
     * Creates an application and its first stage event in one transaction.
     * `createdAt` keeps the original date when importing.
     */
    create(input: ApplicationInput, { createdAt }: { createdAt?: string } = {}): Application {
      const now = clock();
      const created = createdAt ?? now;
      const id = newId();
      const stageId = input.stageId ?? defaultStageId();
      const row: NewApplication = {
        ...input,
        id,
        stageId,
        salaryMonthlyGross: monthlyGross(input),
        createdAt: created,
        updatedAt: now,
      };
      db.transaction((tx) => {
        tx.insert(applications).values(row).run();
        tx.insert(stageEvents)
          .values({
            id: newId(),
            applicationId: id,
            fromStageId: null,
            toStageId: stageId,
            at: created,
          })
          .run();
      });
      return require(id);
    },

    /** Updates fields; a changed stage is recorded in the history like changeStage. */
    update(id: string, patch: ApplicationPatch): Application {
      const current = require(id);
      const now = clock();
      const next = { ...current, ...patch };
      const salaryChanged = SALARY_FIELDS.some((f) => f in patch);
      db.transaction((tx) => {
        tx.update(applications)
          .set({
            ...patch,
            ...(salaryChanged ? { salaryMonthlyGross: monthlyGross(next) } : {}),
            updatedAt: now,
          })
          .where(eq(applications.id, id))
          .run();
        if (patch.stageId && patch.stageId !== current.stageId) {
          tx.insert(stageEvents)
            .values({
              id: newId(),
              applicationId: id,
              fromStageId: current.stageId,
              toStageId: patch.stageId,
              at: now,
            })
            .run();
        }
      });
      return require(id);
    },

    /** Moves an application to another stage, writing the event and updatedAt together. */
    changeStage(id: string, toStageId: string): Application {
      const current = require(id);
      if (current.stageId === toStageId) return current;
      const now = clock();
      db.transaction((tx) => {
        tx.update(applications)
          .set({ stageId: toStageId, updatedAt: now })
          .where(eq(applications.id, id))
          .run();
        tx.insert(stageEvents)
          .values({
            id: newId(),
            applicationId: id,
            fromStageId: current.stageId,
            toStageId,
            at: now,
          })
          .run();
      });
      return require(id);
    },

    archive(id: string): void {
      const now = clock();
      db.update(applications)
        .set({ archivedAt: now, updatedAt: now })
        .where(eq(applications.id, id))
        .run();
    },

    unarchive(id: string): void {
      db.update(applications)
        .set({ archivedAt: null, updatedAt: clock() })
        .where(eq(applications.id, id))
        .run();
    },

    /** Deletes an application and its history for good. */
    remove(id: string): void {
      db.delete(applications).where(eq(applications.id, id)).run();
    },

    events(id: string): StageEvent[] {
      return db
        .select()
        .from(stageEvents)
        .where(eq(stageEvents.applicationId, id))
        .orderBy(asc(stageEvents.at))
        .all();
    },
  };
}

export type ApplicationsRepo = ReturnType<typeof createApplicationsRepo>;
