import { asc } from 'drizzle-orm';

import { createTestDb } from '@/test/db';

import { DEFAULT_STAGES } from './defaults';
import { applications, settings, stageEvents, stages } from './schema';
import { seedDefaults } from './seed';

describe('database', () => {
  it('migrations create all tables', () => {
    const db = createTestDb({ seed: false });
    expect(db.select().from(stages).all()).toEqual([]);
    expect(db.select().from(applications).all()).toEqual([]);
    expect(db.select().from(stageEvents).all()).toEqual([]);
    expect(db.select().from(settings).all()).toEqual([]);
  });

  it('seeds the default stages in funnel order', () => {
    const db = createTestDb();
    const rows = db.select().from(stages).orderBy(asc(stages.position)).all();
    expect(rows.map((s) => s.key)).toEqual(DEFAULT_STAGES.map((s) => s.key));
    expect(rows.filter((s) => s.kind === 'closed').map((s) => s.key)).toEqual([
      'rejected',
      'withdrawn',
    ]);
    expect(rows.filter((s) => s.needsAction).map((s) => s.key)).toEqual([
      'action',
      'test',
      'interview',
      'offer',
    ]);
  });

  it('seeding twice does not duplicate stages', () => {
    const db = createTestDb();
    seedDefaults(db);
    expect(db.select().from(stages).all()).toHaveLength(DEFAULT_STAGES.length);
  });

  it('stores JSON columns', () => {
    const db = createTestDb();
    const stage = db.select().from(stages).get()!;
    const now = new Date().toISOString();
    db.insert(applications)
      .values({
        id: 'a1',
        title: 'Frontend Developer',
        company: 'ACME',
        stageId: stage.id,
        stack: ['React', 'TypeScript'],
        fieldSources: { title: 'markup' },
        createdAt: now,
        updatedAt: now,
      })
      .run();
    const row = db.select().from(applications).get()!;
    expect(row.stack).toEqual(['React', 'TypeScript']);
    expect(row.custom).toEqual({});
    expect(row.fieldSources).toEqual({ title: 'markup' });
  });

  it('enforces the stage foreign key', () => {
    const db = createTestDb();
    const now = new Date().toISOString();
    expect(() =>
      db
        .insert(applications)
        .values({
          id: 'a1',
          title: 'x',
          company: 'y',
          stageId: 'missing',
          createdAt: now,
          updatedAt: now,
        })
        .run(),
    ).toThrow();
  });
});
