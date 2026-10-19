import { eq } from 'drizzle-orm';
import type { z } from 'zod';

import { settings } from '@/db/schema';
import type { Db } from '@/db/types';

export function createSettingsRepo(db: Db) {
  return {
    /** Reads a setting, validating it; invalid or missing values give the fallback. */
    get<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
      const row = db.select().from(settings).where(eq(settings.key, key)).get();
      if (!row) return fallback;
      const parsed = schema.safeParse(row.value);
      return parsed.success ? parsed.data : fallback;
    },

    set(key: string, value: unknown): void {
      db.insert(settings)
        .values({ key, value })
        .onConflictDoUpdate({ target: settings.key, set: { value } })
        .run();
    },

    remove(key: string): void {
      db.delete(settings).where(eq(settings.key, key)).run();
    },
  };
}

export type SettingsRepo = ReturnType<typeof createSettingsRepo>;
