import { createApplicationsRepo } from '@/features/applications/repo';
import { createTestDb } from '@/test/db';

import { createStagesRepo } from './repo';

function setup() {
  const db = createTestDb();
  return { stagesRepo: createStagesRepo(db), apps: createApplicationsRepo(db) };
}

describe('stages repo', () => {
  it('adds a stage at the end', () => {
    const { stagesRepo } = setup();
    const created = stagesRepo.create({ name: 'Phone screen', color: 'pink', kind: 'active' });
    const list = stagesRepo.list();
    expect(list.at(-1)).toMatchObject({ id: created.id, name: 'Phone screen', key: null });
  });

  it('renames, recolors and hides', () => {
    const { stagesRepo } = setup();
    const first = stagesRepo.list()[0]!;
    stagesRepo.update(first.id, { name: 'Ideas', color: 'pink', hidden: true });
    expect(stagesRepo.list()[0]).toMatchObject({ name: 'Ideas', color: 'pink', hidden: true });
  });

  it('moves stages up and down', () => {
    const { stagesRepo } = setup();
    const [a, b] = stagesRepo.list();
    stagesRepo.move(a!.id, 1);
    expect(
      stagesRepo
        .list()
        .slice(0, 2)
        .map((s) => s.id),
    ).toEqual([b!.id, a!.id]);
    stagesRepo.move(a!.id, -1);
    expect(stagesRepo.list()[0]!.id).toBe(a!.id);
    stagesRepo.move(a!.id, -1);
    expect(stagesRepo.list()[0]!.id).toBe(a!.id);
  });

  it('deletes an empty stage', () => {
    const { stagesRepo } = setup();
    const before = stagesRepo.list().length;
    stagesRepo.remove(stagesRepo.list()[2]!.id);
    expect(stagesRepo.list()).toHaveLength(before - 1);
  });

  it('requires a target stage when applications exist', () => {
    const { stagesRepo, apps } = setup();
    const [from, to] = stagesRepo.list();
    const app = apps.create({ title: 'x', company: 'y', stageId: from!.id });
    expect(() => stagesRepo.remove(from!.id)).toThrow();
    expect(() => stagesRepo.remove(from!.id, from!.id)).toThrow();
    stagesRepo.remove(from!.id, to!.id);
    expect(apps.get(app.id)!.stageId).toBe(to!.id);
    expect(stagesRepo.list().find((s) => s.id === from!.id)).toBeUndefined();
  });
});
