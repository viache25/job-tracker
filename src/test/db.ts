import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';

import * as schema from '@/db/schema';
import { seedDefaults } from '@/db/seed';
import type { Db } from '@/db/types';

/** Fresh in-memory database with real migrations applied, optionally seeded. */
export function createTestDb({ seed = true }: { seed?: boolean } = {}): Db {
  const sqlite = new Database(':memory:');
  sqlite.pragma('foreign_keys = ON');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: path.join(__dirname, '../../drizzle') });
  if (seed) seedDefaults(db);
  return db;
}
