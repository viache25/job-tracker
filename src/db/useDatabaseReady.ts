import { migrate } from 'drizzle-orm/expo-sqlite/migrator';
import { useEffect, useState } from 'react';

import migrations from '../../drizzle/migrations';
import { openDatabase } from './client';
import { seedDefaults } from './seed';

async function prepare(): Promise<void> {
  const db = await openDatabase();
  await migrate(db, migrations);
  seedDefaults(db);
}

let preparing: Promise<void> | undefined;

/** Applies pending migrations and seeds defaults; `ready` flips once the database is usable. */
export function useDatabaseReady(): { ready: boolean; error?: Error } {
  const [state, setState] = useState<{ ready: boolean; error?: Error }>({ ready: false });

  useEffect(() => {
    let active = true;
    preparing ??= prepare();
    preparing.then(
      () => active && setState({ ready: true }),
      (e: unknown) =>
        active && setState({ ready: false, error: e instanceof Error ? e : new Error(String(e)) }),
    );
    return () => {
      active = false;
    };
  }, []);

  return state;
}
