import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useMemo } from 'react';

import migrations from '../../drizzle/migrations';
import { db } from './client';
import { seedDefaults } from './seed';

/** Applies pending migrations and seeds defaults; `ready` flips once the database is usable. */
export function useDatabaseReady(): { ready: boolean; error?: Error } {
  const { success, error } = useMigrations(db, migrations);

  // Seeding is synchronous and idempotent, so it runs right after migrations succeed.
  const seedError = useMemo(() => {
    if (!success) return undefined;
    try {
      seedDefaults(db);
      return undefined;
    } catch (e) {
      return e instanceof Error ? e : new Error(String(e));
    }
  }, [success]);

  return { ready: success && !seedError, error: error ?? seedError };
}
