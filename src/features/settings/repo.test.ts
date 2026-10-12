import { z } from 'zod';

import { createTestDb } from '@/test/db';

import { createSettingsRepo } from './repo';

describe('settings repo', () => {
  const schema = z.enum(['light', 'dark', 'system']);

  it('returns the fallback when missing or invalid', () => {
    const repo = createSettingsRepo(createTestDb());
    expect(repo.get('theme', schema, 'system')).toBe('system');
    repo.set('theme', 'purple');
    expect(repo.get('theme', schema, 'system')).toBe('system');
  });

  it('stores and overwrites JSON values', () => {
    const repo = createSettingsRepo(createTestDb());
    repo.set('theme', 'dark');
    repo.set('theme', 'light');
    expect(repo.get('theme', schema, 'system')).toBe('light');
    repo.set('columns', [{ id: 'title', visible: true }]);
    expect(repo.get('columns', z.array(z.object({ id: z.string() })), [])).toEqual([
      { id: 'title' },
    ]);
    repo.remove('theme');
    expect(repo.get('theme', schema, 'system')).toBe('system');
  });
});
