import { asc } from 'drizzle-orm';

import { stages } from '@/db/schema';
import { createApplicationsRepo } from '@/features/applications/repo';
import { createTestDb } from '@/test/db';

import { parseCsv } from './csv';
import {
  applicationsToCsv,
  CSV_COLUMNS,
  ImportError,
  importApplications,
  parseApplicationsCsv,
} from './transfer';

function setup() {
  const db = createTestDb();
  const repo = createApplicationsRepo(db);
  const stageList = db.select().from(stages).orderBy(asc(stages.position)).all();
  const names = (s: (typeof stageList)[number]) => [
    s.name,
    s.key === 'interview' ? 'Interview' : '',
  ];
  const label = (id: string) => {
    const s = stageList.find((x) => x.id === id)!;
    return s.name || s.key || '';
  };
  return { db, repo, stageList, names, label };
}

describe('CSV export and import', () => {
  it('exports every column and escapes formulas', () => {
    const { repo, label } = setup();
    repo.create({ title: '=HYPERLINK("x")', company: 'ACME', stack: ['React', 'TS'] });
    const [header, row] = parseCsv(applicationsToCsv(repo.list(), label));
    expect(header).toEqual([...CSV_COLUMNS]);
    expect(row![0]).toBe('\'=HYPERLINK("x")');
    expect(row![CSV_COLUMNS.indexOf('stack')]).toBe('React; TS');
  });

  it('round-trips into a fresh database without duplicates', async () => {
    const a = setup();
    a.repo.create({
      title: 'Frontend Dev',
      company: 'ACME',
      url: 'https://jobs.example.com/1',
      stageId: a.stageList.find((s) => s.key === 'interview')!.id,
      salaryMin: 50000,
      salaryPeriod: 'year',
      notes: 'line 1\nline 2',
    });
    a.repo.create({ title: 'Backend Dev', company: 'Beta' });
    const csv = applicationsToCsv(a.repo.list(), a.label);

    const b = setup();
    const parsed = parseApplicationsCsv(csv, b.stageList, b.names);
    expect(await importApplications(b.repo, parsed)).toEqual({ added: 2, skipped: 0, invalid: 0 });
    const imported = b.repo.list().find((x) => x.company === 'ACME')!;
    expect(imported).toMatchObject({
      title: 'Frontend Dev',
      salaryMin: 50000,
      salaryPeriod: 'year',
      notes: 'line 1\nline 2',
      stageId: b.stageList.find((s) => s.key === 'interview')!.id,
    });
    expect(imported.urlHash).toBeTruthy();
    expect(imported.createdAt).toBe(a.repo.list().find((x) => x.company === 'ACME')!.createdAt);

    // Importing the same file again adds nothing.
    expect(
      await importApplications(b.repo, parseApplicationsCsv(csv, b.stageList, b.names)),
    ).toEqual({ added: 0, skipped: 2, invalid: 0 });
  });

  it('counts rows without title or company as invalid and drops bad values', async () => {
    const { repo, stageList, names } = setup();
    const csv =
      'company,title,work_mode,salary_min,url\nACME,,remote,1,\nBeta,Dev,space,abc,javascript:alert(1)\n';
    const parsed = parseApplicationsCsv(csv, stageList, names);
    expect(parsed.invalid).toBe(1);
    expect(parsed.rows[0]!.input).toMatchObject({ workMode: null, salaryMin: null, url: null });
    expect((await importApplications(repo, parsed)).added).toBe(1);
  });

  it('rejects files that are not our CSV', () => {
    const { stageList, names } = setup();
    expect(() => parseApplicationsCsv('foo,bar\n1,2', stageList, names)).toThrow(ImportError);
    expect(() => parseApplicationsCsv('', stageList, names)).toThrow(ImportError);
  });
});
