import { cleanInline, extractHtmlLang, extractMeta, extractTitle } from './html';
import type { VacancyFields } from './types';

/** Job boards: their site name is never the employer. */
const JOB_BOARDS = [
  'karriere.at',
  'stepstone',
  'linkedin',
  'indeed',
  'xing',
  'devjobs',
  'glassdoor',
  'monster',
  'jobs.at',
  'jobs.ch',
  'jobup',
  'willhaben',
  'hokify',
  'ams',
  'jobted',
  'kununu',
  'stellenanzeigen',
  'arbeitsagentur',
  'greenhouse',
  'lever',
  'personio',
  'workday',
  'smartrecruiters',
  'join.com',
  'join',
  'recruitee',
  'softgarden',
  'workable',
  'ashby',
  'bamboohr',
  'jobvite',
  'successfactors',
  'talent.io',
  'wellfound',
  'welcome to the jungle',
];

export function isJobBoard(name: string | undefined): boolean {
  if (!name) return false;
  const n = name.toLowerCase();
  return JOB_BOARDS.some((b) => n === b || n.includes(b));
}

const JOB_WORDS =
  /\b(developer|engineer|entwickler|designer|manager|analyst|consultant|berater|specialist|spezialist|architect|architekt|lead|head of|director|leiter|officer|assistant|assistenz|administrator|technician|techniker|scientist|accountant|buchhalter|sachbearbeiter|mitarbeiter|referent|intern|praktik|werkstudent|trainee|junior|senior|recruiter|product owner|scrum master|tester|support|sales|marketing|koordinator|coordinator)|\((?:m\/w\/d|w\/m\/d|m\/f\/d|all genders|d\/m\/w)\)|:in\b/i;

export function looksLikeJobTitle(value: string): boolean {
  return JOB_WORDS.test(value);
}

const SEPARATORS = [' – ', ' — ', ' | ', ' - ', ' · ', ' :: '];

function splitTitle(raw: string): string[] {
  let parts = [raw];
  for (const sep of SEPARATORS) parts = parts.flatMap((p) => p.split(sep));
  return parts.map((p) => p.trim()).filter(Boolean);
}

const NOISE_RE =
  /^(sign in|sign up|log ?in|anmelden|einloggen|registrieren|jobs?|stellenangebot|stellenanzeige|karriere|careers?|job ?offer|vacancy|apply now|jetzt bewerben|\d+ jobs?.*)$/i;

/**
 * Splits "Title – Company | Site", "Title at Company", "Title bei Company (m/w/d)"
 * into title and company. Parts that are the site name or a job board are dropped.
 */
export function parseTitlePattern(
  raw: string,
  siteName?: string,
): { title?: string; company?: string } {
  const site = siteName?.toLowerCase();
  const parts = splitTitle(cleanInline(raw)).filter((p) => {
    const lower = p.toLowerCase();
    return !(site && lower === site) && !isJobBoard(p) && !NOISE_RE.test(p);
  });
  if (parts.length === 0) return {};

  const first = parts[0]!;
  const atMatch = /^(.+?)\s+(?:at|bei|@|chez|в компанию|в)\s+(.+)$/i.exec(first);
  if (atMatch && !/\(m\/w\/d\)|\(w\/m\/d\)/i.test(atMatch[2] ?? '')) {
    return { title: atMatch[1]!.trim(), company: atMatch[2]!.trim() };
  }
  const second = parts[1];
  const company = second && !isJobBoard(second) ? second : undefined;
  // "Company - Title" (Lever and many career sites): swap when only the second part reads like a job.
  if (company && looksLikeJobTitle(company) && !looksLikeJobTitle(first)) {
    return { title: company, company: first };
  }
  return { title: first, company };
}

/** Fallback fields from Open Graph / Twitter meta tags and <title>. */
export function parseMeta(html: string): Partial<VacancyFields> {
  const meta = extractMeta(html);
  const siteName = meta.get('og:site_name') ?? meta.get('application-name');
  const rawTitle = meta.get('og:title') ?? meta.get('twitter:title') ?? extractTitle(html);
  const fields: Partial<VacancyFields> = {};

  if (rawTitle) {
    const { title, company } = parseTitlePattern(rawTitle, siteName);
    if (title) fields.title = title;
    if (company) fields.company = company;
  }
  if (!fields.company && siteName && !isJobBoard(siteName)) {
    fields.company = cleanInline(siteName);
  }
  const description =
    meta.get('og:description') ?? meta.get('description') ?? meta.get('twitter:description');
  if (description) fields.description = cleanInline(description);

  const lang = extractHtmlLang(html) ?? meta.get('og:locale')?.slice(0, 2).toLowerCase();
  if (lang && /^[a-z]{2}$/.test(lang)) fields.language = lang;
  return fields;
}
