import { sha256 } from '@/lib/crypto';
import { canonicalizeUrl, sourceOf } from '@/lib/url';

import { fetchPage, type FetchPageResult } from './fetchPage';
import { countryFromHost, countryOfCity, findCity } from './geo';
import { parseHeuristics } from './heuristics';
import { looksLikeLoginPage, pageText } from './html';
import { jsonLdSkillsText, parseJsonLd } from './jsonld';
import { mergeFields, type SourcedFields } from './merge';
import { parseMeta } from './meta';
import { KEY_FIELDS, type ParsedVacancy, type ParseResult, type VacancyFields } from './types';

/** Parses already downloaded HTML. Pure apart from hashing the URL. */
export async function parseHtml(html: string, url: string): Promise<ParseResult> {
  const canonical = canonicalizeUrl(url);
  if (!canonical) return { ok: false, error: 'invalid_url' };

  const markup = parseJsonLd(html);
  if (!markup.title && !markup.company && looksLikeLoginPage(html)) {
    return { ok: false, error: 'login_required', url: canonical };
  }
  const meta = parseMeta(html);
  const body = pageText(html);
  const text = markup.description ?? body;
  // A short markup description may miss details (remote, salary) that the page itself has.
  const heuristicText =
    markup.description && markup.description.length < 500 ? `${markup.description}\n${body}` : text;
  const title = markup.title ?? meta.title ?? '';
  const heuristic: Partial<VacancyFields> = parseHeuristics(
    title,
    `${heuristicText}\n${jsonLdSkillsText(html)}`,
  );

  // Location fallbacks: city mentioned in the text, country from the city or the domain.
  if (!markup.city) {
    const found = findCity(`${title}\n${text.slice(0, 3000)}`);
    if (found) heuristic.city = found.city;
  }
  const host = sourceOf(canonical);
  heuristic.country =
    countryOfCity(markup.city ?? heuristic.city) ?? countryFromHost(host) ?? heuristic.country;

  const sources: SourcedFields[] = [
    { source: 'markup', fields: markup },
    { source: 'meta', fields: meta },
    { source: 'heuristic', fields: heuristic },
  ];
  // A meta description is only a teaser; prefer full page text over it.
  if (!markup.description && text.length > (meta.description?.length ?? 0)) {
    sources[1] = { source: 'meta', fields: { ...meta, description: undefined } };
    sources.push({ source: 'heuristic', fields: { description: text } });
  }

  const { fields, fieldSources } = mergeFields(sources);
  const hasKeyField = KEY_FIELDS.some((k) => fields[k] !== undefined);
  if (!hasKeyField && !fields.description) {
    return { ok: false, error: 'nothing_found', url: canonical };
  }

  const vacancy: ParsedVacancy = {
    url: canonical,
    urlHash: await sha256(canonical),
    source: host ?? '',
    fields,
    fieldSources,
  };
  return { ok: true, vacancy, complete: KEY_FIELDS.every((k) => fields[k] !== undefined) };
}

/** Parses pasted vacancy text (no page available). Only heuristics apply. */
export function parseText(text: string): {
  fields: Partial<VacancyFields>;
  fieldSources: ParsedVacancy['fieldSources'];
} {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const title = lines[0] ?? '';
  const heuristic = parseHeuristics(title, text);
  const city = findCity(text.slice(0, 3000));
  const { fields, fieldSources } = mergeFields([
    {
      source: 'heuristic',
      fields: {
        ...heuristic,
        title: title.length <= 120 ? title : undefined,
        city: city?.city,
        country: city?.country,
        description: text.trim(),
      },
    },
  ]);
  return { fields, fieldSources };
}

const FETCH_ERRORS: Record<
  Exclude<FetchPageResult, { ok: true }>['error'],
  ParseResult & { ok: false }
> = {
  invalid_url: { ok: false, error: 'invalid_url' },
  timeout: { ok: false, error: 'timeout' },
  network: { ok: false, error: 'network' },
  http_error: { ok: false, error: 'http_error' },
  not_html: { ok: false, error: 'not_html' },
  too_large: { ok: false, error: 'too_large' },
};

/** Public entry point: URL in, validated vacancy (or a clear error) out. */
export async function parseVacancy(
  url: string,
  deps: { fetchPage?: typeof fetchPage } = {},
): Promise<ParseResult> {
  const canonical = canonicalizeUrl(url);
  if (!canonical) return { ok: false, error: 'invalid_url' };
  // Fetch the address the user gave (tracking params can matter for redirects), store the canonical one.
  const target = /^https?:\/\//i.test(url.trim()) ? url.trim() : canonical;
  const page = await (deps.fetchPage ?? fetchPage)(target);
  if (!page.ok) {
    const status = page.status;
    if (page.error === 'http_error' && (status === 401 || status === 403)) {
      return { ok: false, error: 'login_required', url: canonical, status };
    }
    return { ...FETCH_ERRORS[page.error], url: canonical, ...(status ? { status } : {}) };
  }
  if (
    /\/(login|signin|sign-in|anmelden|auth)\b/i.test(page.finalUrl) &&
    looksLikeLoginPage(page.html)
  ) {
    return { ok: false, error: 'login_required', url: canonical };
  }
  const result = await parseHtml(page.html, canonical);
  return result;
}
