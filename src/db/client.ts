import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';

import * as schema from './schema';

const expoDb = openDatabaseSync('jobtracker.db', { enableChangeListener: true });
expoDb.execSync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

/** The app database. Only repositories and feature hooks import this. */
export const db = drizzle(expoDb, { schema });
