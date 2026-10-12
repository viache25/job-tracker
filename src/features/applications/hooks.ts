import { and, asc, eq, isNull } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { db } from '@/db/client';
import { applications, stageEvents, type Application, type StageEvent } from '@/db/schema';

import { applyFilter, type ListFilter, type SortKey } from './filter';
import { createApplicationsRepo } from './repo';

export const applicationsRepo = createApplicationsRepo(db);

/** All applications that are not deleted, live. */
export function useAllApplications(): Application[] {
  const { data } = useLiveQuery(
    db.select().from(applications).where(isNull(applications.deletedAt)),
  );
  return data;
}

/** Applications matching a filter, sorted, live. */
export function useApplications(filter: ListFilter, sort: SortKey): Application[] {
  const all = useAllApplications();
  return useMemo(() => applyFilter(all, filter, sort), [all, filter, sort]);
}

export function useApplication(id: string): {
  application: Application | undefined;
  loaded: boolean;
} {
  const { data, updatedAt } = useLiveQuery(
    db
      .select()
      .from(applications)
      .where(and(eq(applications.id, id), isNull(applications.deletedAt))),
    [id],
  );
  return { application: data[0], loaded: updatedAt !== undefined };
}

export function useStageEvents(applicationId: string): StageEvent[] {
  const { data } = useLiveQuery(
    db
      .select()
      .from(stageEvents)
      .where(eq(stageEvents.applicationId, applicationId))
      .orderBy(asc(stageEvents.at)),
    [applicationId],
  );
  return data;
}
