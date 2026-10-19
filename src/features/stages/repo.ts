import { asc, eq, max, sql } from 'drizzle-orm';

import { applications, stages, type Stage, type StageKind } from '@/db/schema';
import type { Db } from '@/db/types';
import { newId } from '@/lib/id';
import type { StageColor } from '@/ui/tokens';

export type StagePatch = Partial<{
  name: string;
  color: StageColor;
  kind: StageKind;
  needsAction: boolean;
  hidden: boolean;
}>;

export function createStagesRepo(db: Db) {
  function list(): Stage[] {
    return db.select().from(stages).orderBy(asc(stages.position)).all();
  }

  return {
    list,

    create(input: {
      name: string;
      color: StageColor;
      kind: StageKind;
      needsAction?: boolean;
    }): Stage {
      const top = db
        .select({ value: max(stages.position) })
        .from(stages)
        .get();
      const stage = {
        id: newId(),
        key: null,
        name: input.name,
        color: input.color,
        kind: input.kind,
        needsAction: input.needsAction ?? false,
        hidden: false,
        position: (top?.value ?? -1) + 1,
      };
      db.insert(stages).values(stage).run();
      return stage;
    },

    update(id: string, patch: StagePatch): void {
      db.update(stages).set(patch).where(eq(stages.id, id)).run();
    },

    /** Persists a new order given the full list of stage ids. */
    reorder(orderedIds: readonly string[]): void {
      db.transaction((tx) => {
        orderedIds.forEach((id, position) => {
          tx.update(stages).set({ position }).where(eq(stages.id, id)).run();
        });
      });
    },

    /** Moves `id` one step up (-1) or down (+1). */
    move(id: string, direction: -1 | 1): void {
      const ids = list().map((s) => s.id);
      const from = ids.indexOf(id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= ids.length) return;
      [ids[from], ids[to]] = [ids[to]!, ids[from]!];
      this.reorder(ids);
    },

    countApplications(id: string): number {
      const row = db
        .select({ count: sql<number>`count(*)` })
        .from(applications)
        .where(eq(applications.stageId, id))
        .get();
      return row?.count ?? 0;
    },

    /**
     * Deletes a stage. If applications are still in it, `moveTo` is required and they are moved
     * there first (their history keeps the old stage id).
     */
    remove(id: string, moveTo?: string): void {
      const count = this.countApplications(id);
      if (count > 0 && !moveTo)
        throw new Error('Stage has applications; choose where to move them');
      if (moveTo === id) throw new Error('Cannot move applications into the stage being deleted');
      db.transaction((tx) => {
        if (moveTo) {
          tx.update(applications)
            .set({ stageId: moveTo })
            .where(eq(applications.stageId, id))
            .run();
        }
        tx.delete(stages).where(eq(stages.id, id)).run();
      });
    },
  };
}

export type StagesRepo = ReturnType<typeof createStagesRepo>;
