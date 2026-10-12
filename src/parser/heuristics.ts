import type { EmploymentType, SalaryPeriod, WorkMode } from '@/db/schema';

import { STACK_DICTIONARY } from './stack-dictionary';
import type { VacancyFields } from './types';

// ---------------------------------------------------------------------------
// Salary

const CURRENCY = String.raw`(?:€|EUR|Euro|CHF|SFr\.?|Fr\.|\$|USD|£|GBP)`;
const AMOUNT = String.raw`\d{1,3}(?:[.,'   ’]\d{3})+(?:[.,]\d{1,2})?(?:,-)?|\d+(?:[.,]\d{1,2})?(?:,-)?(?:\s?(?:k|K|Tsd\.?|tausend))?`;
const RANGE_SEP = String.raw`\s?(?:[-–—]|bis|to|und|and)\s?`;

const CURRENCY_FIRST = new RegExp(
  String.raw`(${CURRENCY})\s?(${AMOUNT})(?:${RANGE_SEP}(?:${CURRENCY})?\s?(${AMOUNT}))?`,
  'gi',
);
const CURRENCY_LAST = new RegExp(
  String.raw`(${AMOUNT})(?:\s?(?:${CURRENCY})?${RANGE_SEP}(${AMOUNT}))?\s?(${CURRENCY})(?![a-z])`,
  'gi',
);
const KEYWORD_FIRST = new RegExp(
  String.raw`(?:gehalt|bruttogehalt|jahresgehalt|monatsgehalt|salary|vergütung|entlohnung|lohn|bezahlung|compensation|pay)\b[^\d\n]{0,30}?(${AMOUNT})(?:${RANGE_SEP}(?:${CURRENCY})?\s?(${AMOUNT}))?`,
  'gi',
);

const SALARY_CONTEXT =
  /gehalt|salary|vergütung|entlohnung|lohn|brutto|gross|kollektivvertrag|kv|compensation|pay/i;

function currencyCode(token: string | undefined): string | undefined {
  if (!token) return undefined;
  const t = token.toLowerCase();
  if (t === '€' || t === 'eur' || t === 'euro') return 'EUR';
  if (t === 'chf' || t.startsWith('sfr') || t === 'fr.') return 'CHF';
  if (t === '$' || t === 'usd') return 'USD';
  if (t === '£' || t === 'gbp') return 'GBP';
  return undefined;
}

/** "3.600" → 3600, "50,400" → 50400, "3.600,50" → 3600.5, "60k" → 60000, "25,50" → 25.5. */
export function parseAmount(raw: string): number | undefined {
  let s = raw.trim().replace(/,-$/, '');
  let factor = 1;
  const k = /\s?(k|tsd\.?|tausend)$/i.exec(s);
  if (k) {
    factor = 1000;
    s = s.slice(0, k.index);
  }
  s = s.replace(/['   ’]/g, (m) => (m === ' ' ? ' ' : '')).replace(/ /g, '');
  let n: number;
  const grouped = /^(\d{1,3})([.,])(\d{3})((?:\2\d{3})*)(?:([.,])(\d{1,2}))?$/.exec(s);
  if (grouped && (!grouped[5] || grouped[5] !== grouped[2])) {
    const intPart = s
      .slice(0, grouped[5] ? s.lastIndexOf(grouped[5]) : s.length)
      .replace(/[.,]/g, '');
    n = parseFloat(intPart + (grouped[6] ? `.${grouped[6]}` : ''));
  } else if (/^\d+[.,]\d{1,2}$/.test(s)) {
    n = parseFloat(s.replace(',', '.'));
  } else if (/^\d+$/.test(s)) {
    n = parseInt(s, 10);
  } else {
    return undefined;
  }
  n *= factor;
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function detectPeriod(after: string, before: string): SalaryPeriod | undefined {
  const tests: [SalaryPeriod, RegExp][] = [
    ['hour', /stunde|stündlich|hour|hourly|\/\s?h\b|\bstd\.|stundenlohn/i],
    [
      'year',
      /p\.\s?a\.|\bp\.?a\b|pro jahr|per year|per annum|jährlich|jahres|annual|yearly|\/\s?(?:year|jahr|yr)\b|im jahr/i,
    ],
    ['month', /monat|month|monthly|\bp\.\s?m\.|\/\s?mo\b|\bmtl\.?/i],
  ];
  for (const text of [after, before]) {
    for (const [period, re] of tests) if (re.test(text)) return period;
  }
  return undefined;
}

function guessPeriod(amount: number): SalaryPeriod {
  if (amount <= 200) return 'hour';
  if (amount < 20_000) return 'month';
  return 'year';
}

function plausible(amount: number, period: SalaryPeriod): boolean {
  if (period === 'hour') return amount >= 5 && amount <= 500;
  if (period === 'month') return amount >= 300 && amount <= 60_000;
  return amount >= 5_000 && amount <= 1_000_000;
}

type SalaryCandidate = {
  index: number;
  min?: number;
  max?: number;
  currency?: string;
  hasContext: boolean;
  end: number;
};

function candidates(text: string): SalaryCandidate[] {
  const found: SalaryCandidate[] = [];
  const push = (index: number, end: number, a?: string, b?: string, cur?: string) => {
    const min = a ? parseAmount(a) : undefined;
    const max = b ? parseAmount(b) : undefined;
    if (min === undefined) return;
    const around = text.slice(Math.max(0, index - 60), Math.min(text.length, end + 60));
    found.push({
      index,
      end,
      min,
      max,
      currency: currencyCode(cur),
      hasContext: SALARY_CONTEXT.test(around),
    });
  };
  for (const m of text.matchAll(CURRENCY_FIRST))
    push(m.index, m.index + m[0].length, m[2], m[3], m[1]);
  for (const m of text.matchAll(CURRENCY_LAST))
    push(m.index, m.index + m[0].length, m[1], m[2], m[3]);
  for (const m of text.matchAll(KEYWORD_FIRST)) {
    const cur = new RegExp(CURRENCY, 'i').exec(m[0])?.[0];
    push(m.index, m.index + m[0].length, m[1], m[2], cur);
  }
  // Earliest first; for the same statement prefer the reading with a range and a currency.
  const score = (c: SalaryCandidate) => (c.max !== undefined ? 2 : 0) + (c.currency ? 1 : 0);
  return found.sort((a, b) => {
    const overlap = a.index < b.end && b.index < a.end;
    return overlap ? score(b) - score(a) : a.index - b.index;
  });
}

const MIN_ONLY =
  /(?:\bab|mindestens|mind\.|from|starting at|at least|minimum(?: of)?)\s*(?:€|eur|euro|chf|\$|usd|£)?\s*$/i;
const MAX_ONLY = /(?:bis zu|up to|max\.|maximal|höchstens)\s*(?:€|eur|euro|chf|\$|usd|£)?\s*$/i;

export type SalaryGuess = Pick<
  VacancyFields,
  'salaryMin' | 'salaryMax' | 'salaryCurrency' | 'salaryPeriod' | 'salaryIsNet'
>;

/** Finds the most likely salary statement in free text (German or English). */
export function findSalary(text: string): SalaryGuess {
  const list = candidates(text);
  const ordered = [...list.filter((c) => c.hasContext), ...list.filter((c) => !c.hasContext)];
  for (const c of ordered) {
    const before = text.slice(Math.max(0, c.index - 40), c.index);
    const after = text.slice(c.end, Math.min(text.length, c.end + 60));
    const first = c.min!;
    const period = detectPeriod(after, before) ?? guessPeriod(first);
    const values = [c.min, c.max].filter((v): v is number => v !== undefined);
    if (!values.every((v) => plausible(v, period))) continue;
    if (!c.currency && !c.hasContext) continue;

    let min: number | undefined = Math.min(...values);
    let max: number | undefined = Math.max(...values);
    const matchText = text.slice(c.index, c.end);
    const lead = before + matchText.slice(0, matchText.search(/\d/));
    const window = `${before} ${matchText} ${after}`;
    if (values.length === 1) {
      if (MIN_ONLY.test(lead) || /überzahlung|mindest|kollektivvertrag/i.test(window))
        max = undefined;
      else if (MAX_ONLY.test(lead)) min = undefined;
    }
    const result: SalaryGuess = { salaryPeriod: period };
    if (min !== undefined) result.salaryMin = min;
    if (max !== undefined) result.salaryMax = max;
    result.salaryCurrency = c.currency ?? 'EUR';
    if (/\bnetto\b|\bnet\b/i.test(window) && !/\bbrutto\b|\bgross\b/i.test(window)) {
      result.salaryIsNet = true;
    }
    return result;
  }
  return {};
}

// ---------------------------------------------------------------------------
// Work mode and employment type

const STRONG_REMOTE =
  /100\s?%\s?(?:remote|home[- ]?office)|fully remote|full[- ]remote|remote[- ]first|remote[- ]only|vollständig remote|komplett remote|work from anywhere|ortsunabhängig|nur remote/i;
const HYBRID =
  /\bhybrid|teilweise (?:im )?home[- ]?office|remote[- ](?:tage|days)|\d\s?(?:tage|days)\s?(?:\/\s?woche\s)?(?:home[- ]?office|remote)|mobiles arbeiten/i;
const WEAK_REMOTE = /\bremote\b/i;
const HOME_OFFICE = /home[- ]?office/i;
const ONSITE = /\bvor ort\b|\bon[- ]?site\b|\bonsite\b|\bim büro\b|\bin[- ]office\b|\bpräsenz/i;

export function findWorkMode(text: string): WorkMode | undefined {
  if (STRONG_REMOTE.test(text)) return 'remote';
  if (HYBRID.test(text)) return 'hybrid';
  if (WEAK_REMOTE.test(text)) return 'remote';
  if (HOME_OFFICE.test(text)) return 'hybrid';
  if (ONSITE.test(text)) return 'onsite';
  return undefined;
}

const EMPLOYMENT_TESTS: Record<EmploymentType, RegExp> = {
  internship: /praktikum|praktikant|internship|\bintern\b|werkstudent|working student|trainee/i,
  part_time: /teilzeit|part[- ]?time|geringfügig/i,
  full_time: /vollzeit|full[- ]?time|\bfulltime/i,
  contract: /freelance|freiberuf|contractor|\bcontract\b|projektbasis|befristet/i,
  other: /(?!)/,
};

export function findEmploymentType(title: string, text: string): EmploymentType | undefined {
  for (const type of ['internship', 'part_time', 'full_time', 'contract'] as const) {
    if (EMPLOYMENT_TESTS[type].test(title)) return type;
  }
  for (const type of ['full_time', 'part_time', 'internship', 'contract'] as const) {
    if (EMPLOYMENT_TESTS[type].test(text)) return type;
  }
  return undefined;
}

// ---------------------------------------------------------------------------
// Stack

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}

const STACK_PATTERNS = STACK_DICTIONARY.map((term) => {
  const aliases = (term.aliases ?? [term.name]).map(escapeRe).join('|');
  return {
    name: term.name,
    re: new RegExp(
      `(?:^|[^A-Za-z0-9+#.\\-])(?:${aliases})(?=$|[^A-Za-z0-9+#])`,
      term.caseSensitive ? 'g' : 'gi',
    ),
  };
});

/** Technologies mentioned in the text, in order of first mention. */
export function findStack(text: string, limit = 25): string[] {
  const spans = STACK_PATTERNS.map(({ name, re }) => {
    re.lastIndex = 0;
    const found: { start: number; end: number }[] = [];
    for (const m of text.matchAll(re)) {
      // The match may include one leading boundary character.
      const lead = /^[A-Za-z0-9+#.-]/.test(m[0]) ? 0 : 1;
      found.push({ start: m.index + lead, end: m.index + m[0].length });
    }
    return { name, found };
  });
  const all = spans.flatMap((s) => s.found);
  const inside = (a: { start: number; end: number }) =>
    all.some(
      (b) => b !== a && b.start <= a.start && b.end >= a.end && b.end - b.start > a.end - a.start,
    );

  const hits: { name: string; index: number }[] = [];
  for (const { name, found } of spans) {
    const first = found.find((span) => !inside(span));
    if (first) hits.push({ name, index: first.start });
  }
  return hits
    .sort((a, b) => a.index - b.index)
    .map((h) => h.name)
    .slice(0, limit);
}

// ---------------------------------------------------------------------------
// Language

const DE_WORDS =
  /\b(und|der|die|das|mit|für|wir|sie|ist|ein|eine|bei|auf|du|dich|deine|unser|ihre)\b/gi;
const EN_WORDS = /\b(and|the|with|for|we|you|is|our|your|to|of|in|are|will)\b/gi;

export function detectLanguage(text: string): 'de' | 'en' | undefined {
  const sample = text.slice(0, 5000);
  const de = sample.match(DE_WORDS)?.length ?? 0;
  const en = sample.match(EN_WORDS)?.length ?? 0;
  if (de + en < 8) return undefined;
  return de >= en ? 'de' : 'en';
}

// ---------------------------------------------------------------------------

/** Everything the heuristics can tell from the title and the text of a vacancy. */
export function parseHeuristics(title: string, text: string): Partial<VacancyFields> {
  const fields: Partial<VacancyFields> = {};
  const all = `${title}\n${text}`;
  Object.assign(fields, findSalary(all));
  const workMode = findWorkMode(all);
  if (workMode) fields.workMode = workMode;
  const employment = findEmploymentType(title, text);
  if (employment) fields.employmentType = employment;
  const stack = findStack(all);
  if (stack.length > 0) fields.stack = stack;
  const language = detectLanguage(text);
  if (language) fields.language = language;
  return fields;
}
