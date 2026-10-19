import { drizzle, type ExpoSQLiteDatabase } from 'drizzle-orm/expo-sqlite';
import { openDatabaseAsync } from 'expo-sqlite';

import * as schema from './schema';

type AppDb = ExpoSQLiteDatabase<typeof schema>;

let instance: AppDb | undefined;

/**
 * The app database. Only repositories and feature hooks import this. It becomes usable after
 * openDatabase() resolved (the root layout waits for that before rendering any screen).
 */
export const db = new Proxy({} as AppDb, {
  get(_target, prop) {
    if (!instance) throw new Error('Database is not open yet');
    const value: unknown = Reflect.get(instance, prop, instance);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/** Opens the database file asynchronously (on web the SQLite worker needs time to start). */
export async function openDatabase(): Promise<AppDb> {
  if (instance) return instance;
  const expoDb = await openDatabaseAsync('jobtracker.db', { enableChangeListener: true });
  await expoDb.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  instance = drizzle(expoDb, { schema });
  return instance;
}
