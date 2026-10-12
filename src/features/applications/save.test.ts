import { createTestDb } from '@/test/db';

import { emptyFormValues } from './formSchema';
import { createApplicationsRepo } from './repo';
import { createFromForm, updateFromForm } from './save';

function setup() {
  const repo = createApplicationsRepo(createTestDb());
  const stageId = repo.create({ title: 'tmp', company: 'tmp' }).stageId;
  return { repo, values: { ...emptyFormValues(stageId), title: 'Dev', company: 'ACME' } };
}

describe('saving from the form', () => {
  it('creates with canonical url, hash and field sources', async () => {
    const { repo, values } = setup();
    const result = await createFromForm(
      repo,
      { ...values, url: 'https://a.at/job/1?utm_source=x' },
      {
        fieldSources: { title: 'markup', company: 'meta' },
        dirty: { company: true },
        extras: { description: 'Text', language: 'de' },
      },
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.application).toMatchObject({
      url: 'https://a.at/job/1',
      source: 'a.at',
      description: 'Text',
      language: 'de',
      fieldSources: { title: 'markup', company: 'user' },
    });
    expect(result.application.urlHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('reports a duplicate link instead of adding it twice', async () => {
    const { repo, values } = setup();
    const first = await createFromForm(repo, { ...values, url: 'https://a.at/job/1' });
    const again = await createFromForm(repo, { ...values, url: 'https://A.at/job/1#apply' });
    expect(again).toEqual({ ok: false, duplicate: first.ok && first.application });
    const forced = await createFromForm(
      repo,
      { ...values, url: 'https://a.at/job/1' },
      { allowDuplicate: true },
    );
    expect(forced.ok).toBe(true);
  });

  it('updates and marks edited fields', async () => {
    const { repo, values } = setup();
    const created = await createFromForm(repo, values, { fieldSources: { title: 'markup' } });
    if (!created.ok) throw new Error('unexpected');
    const updated = await updateFromForm(
      repo,
      created.application,
      { ...values, title: 'Senior Dev' },
      { title: true },
    );
    expect(updated.title).toBe('Senior Dev');
    expect(updated.fieldSources).toEqual({ title: 'user' });
  });
});
