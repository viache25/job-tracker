import fs from 'fs';
import path from 'path';

import { parseHtml, parseVacancy } from './parseVacancy';

function fixture(name: string): string {
  return fs.readFileSync(path.join(__dirname, '__fixtures__', name), 'utf8');
}

async function parse(name: string, url = `https://example.com/${name}`) {
  const result = await parseHtml(fixture(name), url);
  if (!result.ok) throw new Error(`parse failed: ${result.error}`);
  return result;
}

describe('parser on fixtures', () => {
  it('karriere.at style @graph with Austrian salary text', async () => {
    const { vacancy, complete } = await parse(
      'karriere-at-graph.html',
      'https://www.karriere.at/jobs/123?utm_source=newsletter#apply',
    );
    expect(complete).toBe(true);
    expect(vacancy.url).toBe('https://www.karriere.at/jobs/123');
    expect(vacancy.urlHash).toMatch(/^[0-9a-f]{64}$/);
    expect(vacancy.source).toBe('karriere.at');
    expect(vacancy.fields).toMatchObject({
      title: 'Frontend Developer (m/w/d)',
      company: 'Muster Software GmbH',
      city: 'Wien',
      country: 'AT',
      workMode: 'hybrid',
      employmentType: 'full_time',
      postedAt: '2026-10-01',
      deadline: '2026-11-15',
      salaryMin: 3600,
      salaryPeriod: 'month',
      salaryCurrency: 'EUR',
      language: 'de',
    });
    expect(vacancy.fields.salaryMax).toBeUndefined();
    expect(vacancy.fields.stack).toEqual(['React', 'TypeScript', 'Jest', 'CI/CD']);
    expect(vacancy.fields.description).toContain('• Entwicklung mit React und TypeScript');
    expect(vacancy.fields.description).not.toContain('<');
    expect(vacancy.fieldSources).toMatchObject({
      title: 'markup',
      company: 'markup',
      city: 'markup',
      salaryMin: 'heuristic',
      workMode: 'heuristic',
      stack: 'heuristic',
    });
  });

  it('Greenhouse with entity-encoded description and country object', async () => {
    const { vacancy } = await parse('greenhouse-basic.html');
    expect(vacancy.fields).toMatchObject({
      title: 'Senior Backend Engineer',
      company: 'Acme Robotics',
      city: 'Berlin',
      country: 'DE',
      workMode: 'onsite',
      employmentType: 'full_time',
      stack: ['Go', 'PostgreSQL', 'Kubernetes', 'AWS'],
    });
    expect(vacancy.fields.description).toMatch(/^We are looking for a backend engineer/);
  });

  it('Personio with yearly salary range and @type array', async () => {
    const { vacancy } = await parse('personio-salary-range.html');
    expect(vacancy.fields).toMatchObject({
      title: 'Data Analyst (w/m/d)',
      company: 'Beispiel AG',
      city: 'Graz',
      country: 'AT',
      salaryMin: 48000,
      salaryMax: 56000,
      salaryCurrency: 'EUR',
      salaryPeriod: 'year',
      stack: ['Python', 'SQL', 'Power BI'],
    });
    expect(vacancy.fieldSources.salaryMin).toBe('markup');
  });

  it('StepStone with several blocks, string organisation and string address', async () => {
    const { vacancy } = await parse('stepstone-array.html');
    expect(vacancy.fields).toMatchObject({
      title: 'Projektmanager IT (m/w/d)',
      company: 'Nordlicht Logistik GmbH',
      city: 'Hamburg',
      country: 'DE',
      salaryMin: 65000,
      salaryMax: 75000,
      salaryPeriod: 'year',
      workMode: 'hybrid',
      deadline: '2026-12-31',
      stack: ['Scrum', 'Jira'],
    });
  });

  it('Lever page without JSON-LD falls back to meta tags', async () => {
    const { vacancy, complete } = await parse(
      'lever-meta-only.html',
      'https://jobs.lever.co/bergwerk/1',
    );
    expect(complete).toBe(true);
    expect(vacancy.fields).toMatchObject({
      title: 'Product Designer',
      company: 'Bergwerk Games',
      city: 'Linz',
      workMode: 'hybrid',
      stack: ['Figma'],
    });
    expect(vacancy.fieldSources.title).toBe('meta');
  });

  it('company page with "Title bei Company | Karriere"', async () => {
    const { vacancy } = await parse(
      'company-title-only.html',
      'https://karriere.alpenmolkerei.at/job/7',
    );
    expect(vacancy.fields).toMatchObject({
      title: 'Buchhalter:in (Teilzeit 25h)',
      company: 'Alpenmolkerei eGen',
      city: 'Salzburg',
      country: 'AT',
      employmentType: 'part_time',
      salaryMin: 2450,
      salaryPeriod: 'month',
      stack: ['SAP', 'Excel'],
    });
    expect(vacancy.fieldSources.title).toBe('meta');
    expect(vacancy.fieldSources.city).toBe('heuristic');
  });

  it('survives broken JSON-LD', async () => {
    const { vacancy } = await parse('broken-jsonld.html');
    expect(vacancy.fields).toMatchObject({
      title: 'DevOps Engineer',
      company: 'Cloudhaus',
      workMode: 'remote',
    });
    expect(vacancy.fieldSources.title).toBe('markup');
  });

  it('remote Swiss job in CHF', async () => {
    const { vacancy } = await parse('swiss-chf-remote.html');
    expect(vacancy.fields).toMatchObject({
      title: 'Machine Learning Engineer',
      company: 'Helvetic AI SA',
      country: 'CH',
      workMode: 'remote',
      salaryMin: 120000,
      salaryMax: 140000,
      salaryCurrency: 'CHF',
      salaryPeriod: 'year',
      employmentType: 'full_time',
      stack: ['LLM', 'PyTorch', 'Python'],
    });
  });

  it('hourly part-time pay', async () => {
    const { vacancy } = await parse('hourly-parttime.html');
    expect(vacancy.fields).toMatchObject({
      salaryMin: 19.5,
      salaryMax: 19.5,
      salaryPeriod: 'hour',
      employmentType: 'part_time',
      city: 'Innsbruck',
      country: 'AT',
    });
  });

  it('detects a login wall', async () => {
    expect(
      await parseHtml(fixture('login-wall.html'), 'https://www.linkedin.com/jobs/view/1'),
    ).toEqual({
      ok: false,
      error: 'login_required',
      url: 'https://www.linkedin.com/jobs/view/1',
    });
  });
});

describe('parseVacancy', () => {
  const page = (html: string, finalUrl = 'https://example.com/job') =>
    jest.fn(async () => ({ ok: true as const, html, finalUrl, status: 200, truncated: false }));

  it('fetches, parses and canonicalizes', async () => {
    const fetchPage = page(fixture('personio-salary-range.html'));
    const result = await parseVacancy('https://beispiel.jobs.personio.de/job/1?utm_medium=x', {
      fetchPage,
    });
    expect(fetchPage).toHaveBeenCalledWith('https://beispiel.jobs.personio.de/job/1?utm_medium=x');
    expect(result).toMatchObject({
      ok: true,
      complete: true,
      vacancy: {
        url: 'https://beispiel.jobs.personio.de/job/1',
        source: 'beispiel.jobs.personio.de',
      },
    });
  });

  it('maps 401/403 to login_required', async () => {
    const fetchPage = jest.fn(async () => ({
      ok: false as const,
      error: 'http_error' as const,
      status: 403,
    }));
    expect(await parseVacancy('https://www.linkedin.com/jobs/view/1', { fetchPage })).toEqual({
      ok: false,
      error: 'login_required',
      url: 'https://www.linkedin.com/jobs/view/1',
      status: 403,
    });
  });

  it('passes fetch errors through with the canonical url', async () => {
    const fetchPage = jest.fn(async () => ({ ok: false as const, error: 'timeout' as const }));
    expect(await parseVacancy('https://slow.example.com/a#b', { fetchPage })).toEqual({
      ok: false,
      error: 'timeout',
      url: 'https://slow.example.com/a',
    });
  });

  it('rejects invalid urls without fetching', async () => {
    const fetchPage = jest.fn();
    expect(await parseVacancy('javascript:alert(1)', { fetchPage })).toEqual({
      ok: false,
      error: 'invalid_url',
    });
    expect(fetchPage).not.toHaveBeenCalled();
  });

  it('reports pages without anything useful', async () => {
    const fetchPage = page('<html><body></body></html>');
    expect(await parseVacancy('https://example.com/empty', { fetchPage })).toMatchObject({
      ok: false,
      error: 'nothing_found',
    });
  });
});
