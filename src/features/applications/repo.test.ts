import { asc } from 'drizzle-orm';

import { stages } from '@/db/schema';
import type { Db } from '@/db/types';
import { createTestDb } from '@/test/db';

import { createApplicationsRepo } from './repo';

function setup() {
  const db: Db = createTestDb();
  let tick = 0;
  const clock = () => new Date(Date.UTC(2026, 9, 12, 10, 0, tick++)).toISOString();
  const repo = createApplicationsRepo(db, clock);
  const stageList = db.select().from(stages).orderBy(asc(stages.position)).all();
  const stage = (key: string) => stageList.find((s) => s.key === key)!;
  return { db, repo, stage };
}

describe('applications repo', () => {
  it('creates an application in the default stage with a first event', () => {
    const { repo, stage } = setup();
    const app = repo.create({ title: 'Frontend Developer', company: 'ACME' });
    expect(app.stageId).toBe(stage('wishlist').id);
    expect(app.createdAt).toBe(app.updatedAt);
    expect(app.stack).toEqual([]);
    const events = repo.events(app.id);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({ fromStageId: null, toStageId: stage('wishlist').id });
  });

  it('computes the normalized monthly salary', () => {
    const { repo } = setup();
    const app = repo.create({
      title: 'x',
      company: 'y',
      country: 'AT',
      salaryMin: 50400,
      salaryPeriod: 'year',
    });
    expect(app.salaryMonthlyGross).toBe(3600);
    const updated = repo.update(app.id, { country: 'DE' });
    expect(updated.salaryMonthlyGross).toBe(4200);
  });

  it('changes stage, writes history and bumps updatedAt atomically', () => {
    const { repo, stage } = setup();
    const app = repo.create({ title: 'x', company: 'y', stageId: stage('applied').id });
    const moved = repo.changeStage(app.id, stage('interview').id);
    expect(moved.stageId).toBe(stage('interview').id);
    expect(moved.updatedAt > app.updatedAt).toBe(true);
    expect(repo.events(app.id).map((e) => [e.fromStageId, e.toStageId])).toEqual([
      [null, stage('applied').id],
      [stage('applied').id, stage('interview').id],
    ]);
  });

  it('does nothing when the stage is unchanged', () => {
    const { repo, stage } = setup();
    const app = repo.create({ title: 'x', company: 'y', stageId: stage('applied').id });
    repo.changeStage(app.id, stage('applied').id);
    expect(repo.events(app.id)).toHaveLength(1);
  });

  it('rolls back the stage change when the event cannot be written', () => {
    const { repo } = setup();
    const app = repo.create({ title: 'x', company: 'y' });
    expect(() => repo.changeStage(app.id, 'missing-stage')).toThrow();
    expect(repo.get(app.id)!.stageId).toBe(app.stageId);
    expect(repo.events(app.id)).toHaveLength(1);
  });

  it('records a stage change made through update', () => {
    const { repo, stage } = setup();
    const app = repo.create({ title: 'x', company: 'y' });
    repo.update(app.id, { title: 'Senior x', stageId: stage('offer').id });
    expect(repo.get(app.id)!.title).toBe('Senior x');
    expect(repo.events(app.id)).toHaveLength(2);
  });

  it('archives, unarchives and removes', () => {
    const { repo } = setup();
    const app = repo.create({ title: 'x', company: 'y' });
    repo.archive(app.id);
    expect(repo.get(app.id)!.archivedAt).not.toBeNull();
    repo.unarchive(app.id);
    expect(repo.get(app.id)!.archivedAt).toBeNull();
    repo.remove(app.id);
    expect(repo.get(app.id)).toBeUndefined();
    expect(repo.events(app.id)).toEqual([]);
  });

  it('finds duplicates by url hash', () => {
    const { repo } = setup();
    const app = repo.create({ title: 'x', company: 'y', url: 'https://a.at/1', urlHash: 'abc' });
    expect(repo.findByUrlHash('abc')?.id).toBe(app.id);
    expect(repo.findByUrlHash('nope')).toBeUndefined();
  });

  it('lists newest first', () => {
    const { repo } = setup();
    const a = repo.create({ title: 'a', company: 'a' });
    const b = repo.create({ title: 'b', company: 'b' });
    expect(repo.list().map((x) => x.id)).toEqual([b.id, a.id]);
  });

  it('throws on unknown ids', () => {
    const { repo } = setup();
    expect(() => repo.update('nope', { title: 'x' })).toThrow('not found');
  });
});
