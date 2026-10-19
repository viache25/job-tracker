import { canonicalizeUrl, extractUrl, isHttpUrl, parseHttpUrl, sourceOf } from './url';

describe('parseHttpUrl', () => {
  it('parses http(s) URLs', () => {
    expect(parseHttpUrl('https://WWW.Karriere.at:443/jobs/123?x=1#top')).toEqual({
      protocol: 'https',
      host: 'www.karriere.at',
      port: '',
      path: '/jobs/123',
      query: [['x', '1']],
      hash: 'top',
    });
  });

  it('adds https to bare hosts', () => {
    expect(parseHttpUrl('karriere.at/jobs/1')?.protocol).toBe('https');
  });

  it.each([
    'javascript:alert(1)',
    'file:///etc/passwd',
    'ftp://example.com',
    'data:text/html,hi',
    'mailto:a@b.c',
    '',
    'not a url',
    'https://',
    'https://exa mple.com',
    'https://example.com:99999/',
  ])('rejects %s', (input) => {
    expect(isHttpUrl(input)).toBe(false);
  });
});

describe('canonicalizeUrl', () => {
  it('strips tracking params, fragment and default port and lowercases the host', () => {
    expect(
      canonicalizeUrl(
        'HTTPS://Jobs.Example.COM:443/de/job/42?utm_source=li&b=2&gclid=x&a=1&fbclid=y&UTM_Medium=z#apply',
      ),
    ).toBe('https://jobs.example.com/de/job/42?a=1&b=2');
  });

  it('keeps meaningful parameters and paths as they are', () => {
    expect(canonicalizeUrl('https://boards.greenhouse.io/acme/jobs/123?gh_jid=123')).toBe(
      'https://boards.greenhouse.io/acme/jobs/123?gh_jid=123',
    );
  });

  it('makes equivalent links equal', () => {
    const a = canonicalizeUrl('https://www.stepstone.de/job/1?utm_campaign=x&b=1&a=2');
    const b = canonicalizeUrl('https://WWW.stepstone.de/job/1?a=2&b=1#x');
    expect(a).toBe(b);
  });

  it('returns null for unsupported input', () => {
    expect(canonicalizeUrl('javascript:void(0)')).toBeNull();
  });
});

describe('helpers', () => {
  it('derives the source domain', () => {
    expect(sourceOf('https://www.karriere.at/jobs/1')).toBe('karriere.at');
  });

  it('extracts the first link from shared text', () => {
    expect(extractUrl('Schau mal: https://devjobs.at/job/abc. Cool, oder?')).toBe(
      'https://devjobs.at/job/abc',
    );
    expect(extractUrl('karriere.at/jobs/1')).toBe('karriere.at/jobs/1');
    expect(extractUrl('no link here')).toBeNull();
  });
});
