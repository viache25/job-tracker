import { sql } from 'drizzle-orm';

import { newId } from '@/lib/id';

import { DEFAULT_STAGES } from './defaults';
import { stages } from './schema';
import type { Db } from './types';

/** Inserts the default stages on a fresh database. Safe to call on every start. */
export function seedDefaults(db: Db): void {
  const row = db
    .select({ count: sql<number>`count(*)` })
    .from(stages)
    .get();
  if ((row?.count ?? 0) > 0) return;

  db.insert(stages)
    .values(
      DEFAULT_STAGES.map((stage, position) => ({
        id: newId(),
        key: stage.key,
        name: '',
        color: stage.color,
        position,
        kind: stage.kind,
        needsAction: stage.needsAction,
      })),
    )
    .run();
}
