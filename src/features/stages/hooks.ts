import { asc } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { stages, type Stage } from '@/db/schema';

import { createStagesRepo } from './repo';

export const stagesRepo = createStagesRepo(db);

/** All stages in funnel order, live. */
export function useStages(): Stage[] {
  const { data } = useLiveQuery(db.select().from(stages).orderBy(asc(stages.position)));
  return data;
}

export function useStageMap(): Map<string, Stage> {
  const list = useStages();
  return useMemo(() => new Map(list.map((s) => [s.id, s])), [list]);
}
