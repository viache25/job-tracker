import { eq } from 'drizzle-orm';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useCallback, useMemo } from 'react';
import type { z } from 'zod';

import { db } from '@/db/client';
import { settings } from '@/db/schema';

import { createSettingsRepo } from './repo';

export const settingsRepo = createSettingsRepo(db);

/** A validated setting with a setter; re-renders when the value changes anywhere. */
export function useSetting<T>(
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): [value: T, setValue: (value: T) => void] {
  const { data } = useLiveQuery(db.select().from(settings).where(eq(settings.key, key)), [key]);
  const raw = data[0]?.value;
  const value = useMemo(() => {
    if (raw === undefined) return fallback;
    const parsed = schema.safeParse(raw);
    return parsed.success ? parsed.data : fallback;
    // `fallback` and `schema` are expected to be stable module constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
  const setValue = useCallback((next: T) => settingsRepo.set(key, next), [key]);
  return [value, setValue];
}
