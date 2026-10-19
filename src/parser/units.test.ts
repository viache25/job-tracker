import { decodeEntities, extractMeta, htmlToText, looksLikeLoginPage } from './html';
import { parseJsonLd } from './jsonld';
import { mergeFields, normalizeFields } from './merge';
import { isJobBoard, parseMeta, parseTitlePattern } from './meta';
import { parseText } from './parseVacancy';

const ld = (data: unknown) =>
  `<html><head><script type="application/ld+json">${JSON.stringify(data)}</script></head></html>`;

describe('html helpers', () => {
  it('decodes named and numeric entities', () => {
    expect(decodeEntities('&auml;&#246;&#xFC; &amp; &euro; &unknown; &#0;')).toBe(
      'äöü & € &unknown; &#0;',
    );
  });

  it('turns HTML into readable text', () => {
    expect(
      htmlToText(
        '<h2>Profil</h2><ul><li>React</li><li></li></ul><script>alert(1)</script><p>Bye&nbsp;now</p>',
      ),
    ).toBe('Profil\n\n• React\n\nBye now');
  });

  it('reads meta tags in any attribute order and quoting', () => {
    const meta = extractMeta(
      `<meta content='A' property="og:title"><meta name=description content="B &amp; C">`,
    );
    expect(meta.get('og:title')).toBe('A');
    expect(meta.get('description')).toBe('B & C');
  });

  it('only treats short pages with a password field as login walls', () => {
    expect(looksLikeLoginPage('<input type="password">')).toBe(true);
    expect(looksLikeLoginPage(`<input type=password><p>${'x'.repeat(5000)}</p>`)).toBe(false);
    expect(looksLikeLoginPage('<p>hi</p>')).toBe(false);
  });
});

describe('parseJsonLd', () => {
  it('reads salary given as a plain number and weekly units', () => {
    expect(
      parseJsonLd(
        ld({
          '@type': 'JobPosting',
          title: 'A',
          baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'eur',
            value: '1.000',
            unitText: 'WEEK',
          },
        }),
      ),
    ).toMatchObject({
      salaryMin: 4333,
      salaryMax: 4333,
      salaryPeriod: 'month',
      salaryCurrency: 'EUR',
    });
  });

  it('finds postings nested in mainEntity and handles schema.org URLs as types', () => {
    expect(
      parseJsonLd(
        ld({
          '@type': 'WebPage',
          mainEntity: {
            '@type': 'http://schema.org/JobPosting',
            name: 'Nested',
            inLanguage: 'en-GB',
          },
        }),
      ),
    ).toEqual({ title: 'Nested', language: 'en' });
  });

  it('uses addressRegion and non-ISO dates', () => {
    expect(
      parseJsonLd(
        ld({
          '@type': 'JobPosting',
          title: 'A',
          datePosted: 'October 3, 2026',
          jobLocation: { address: { addressRegion: 'Tirol', addressCountry: 'AUT' } },
          employmentType: 'Vollzeit',
        }),
      ),
    ).toMatchObject({
      city: 'Tirol',
      country: 'AT',
      postedAt: '2026-10-03',
      employmentType: 'full_time',
    });
  });

  it('returns nothing without a JobPosting', () => {
    expect(parseJsonLd(ld({ '@type': 'Organization', name: 'X' }))).toEqual({});
    expect(parseJsonLd('<p>no scripts</p>')).toEqual({});
  });
});

describe('meta', () => {
  it('splits common title patterns', () => {
    expect(parseTitlePattern('Senior Dev at Foo Inc')).toEqual({
      title: 'Senior Dev',
      company: 'Foo Inc',
    });
    expect(parseTitlePattern('Jobs | StepStone')).toEqual({});
    expect(parseTitlePattern('Data Engineer – Foo – karriere.at')).toEqual({
      title: 'Data Engineer',
      company: 'Foo',
    });
  });

  it('knows job boards', () => {
    expect(isJobBoard('StepStone')).toBe(true);
    expect(isJobBoard('Muster GmbH')).toBe(false);
  });

  it('uses the site name as company for career sites only', () => {
    expect(
      parseMeta(
        '<meta property="og:title" content="Tester"><meta property="og:site_name" content="Foo AG">',
      ),
    ).toMatchObject({ title: 'Tester', company: 'Foo AG' });
    expect(
      parseMeta(
        '<meta property="og:title" content="Tester"><meta property="og:site_name" content="Indeed">',
      ),
    ).toEqual({ title: 'Tester' });
  });
});

describe('merge', () => {
  it('keeps the first source per field and salary as a group', () => {
    const { fields, fieldSources } = mergeFields([
      { source: 'markup', fields: { title: 'A', salaryCurrency: 'CHF' } },
      { source: 'meta', fields: { title: 'B', company: 'C' } },
      {
        source: 'heuristic',
        fields: { salaryMin: 3000, salaryCurrency: 'EUR', salaryPeriod: 'month' },
      },
    ]);
    expect(fields).toEqual({
      title: 'A',
      company: 'C',
      salaryMin: 3000,
      salaryCurrency: 'EUR',
      salaryPeriod: 'month',
    });
    expect(fieldSources).toEqual({
      title: 'markup',
      company: 'meta',
      salaryMin: 'heuristic',
      salaryCurrency: 'heuristic',
      salaryPeriod: 'heuristic',
    });
  });

  it('cleans and bounds values and drops invalid ones', () => {
    const long = `${'Sentence. '.repeat(2500)}`;
    const out = normalizeFields({
      title: '  A \n B ',
      country: 'Austria',
      salaryMin: 5000,
      salaryMax: 4000,
      description: long,
      stack: ['React', 'React'],
    });
    expect(out.title).toBe('A B');
    expect(out.country).toBeUndefined();
    expect([out.salaryMin, out.salaryMax]).toEqual([4000, 5000]);
    expect(out.description!.length).toBeLessThanOrEqual(20000);
    expect(out.stack).toEqual(['React']);
  });
});

describe('parseText', () => {
  it('extracts fields from pasted text', () => {
    const { fields, fieldSources } = parseText(
      'Backend Developer (m/w/d)\nWir in Wien suchen Verstärkung mit Java und Spring Boot.\nGehalt ab € 4.000 brutto/Monat, Vollzeit, Hybrid.',
    );
    expect(fields).toMatchObject({
      title: 'Backend Developer (m/w/d)',
      city: 'Wien',
      country: 'AT',
      salaryMin: 4000,
      employmentType: 'full_time',
      workMode: 'hybrid',
      stack: ['Java', 'Spring Boot'],
    });
    expect(fieldSources.title).toBe('heuristic');
  });
});
