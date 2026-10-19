/**
 * Regex-based HTML helpers. Pages are untrusted: we never build a DOM or run scripts,
 * only pull out text, meta tags and JSON-LD blocks.
 */

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  hellip: '…',
  laquo: '«',
  raquo: '»',
  bdquo: '„',
  ldquo: '“',
  rdquo: '”',
  lsquo: '‘',
  rsquo: '’',
  sbquo: '‚',
  euro: '€',
  pound: '£',
  copy: '©',
  reg: '®',
  trade: '™',
  middot: '·',
  bull: '•',
  shy: '',
  zwnj: '',
  zwj: '',
  auml: 'ä',
  ouml: 'ö',
  uuml: 'ü',
  Auml: 'Ä',
  Ouml: 'Ö',
  Uuml: 'Ü',
  szlig: 'ß',
  eacute: 'é',
  egrave: 'è',
  agrave: 'à',
  aacute: 'á',
  ccedil: 'ç',
  times: '×',
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);?/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code =
        entity[1] === 'x' || entity[1] === 'X'
          ? parseInt(entity.slice(2), 16)
          : parseInt(entity.slice(1), 10);
      if (!Number.isFinite(code) || code <= 0 || code > 0x10ffff) return match;
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    const named = NAMED_ENTITIES[entity] ?? NAMED_ENTITIES[entity.toLowerCase()];
    return named ?? match;
  });
}

const BLOCK_TAGS =
  'address|article|aside|blockquote|br|dd|div|dl|dt|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|li|main|nav|ol|p|pre|section|table|tr|td|th|ul';

/** HTML fragment → readable plain text with paragraphs and bullet points. */
export function htmlToText(html: string): string {
  let text = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|template|svg|iframe|object|head)\b[\s\S]*?<\/\1\s*>/gi, ' ')
    .replace(/<li\b[^>]*>/gi, '\n• ')
    .replace(new RegExp(`<\\/?(?:${BLOCK_TAGS})\\b[^>]*>`, 'gi'), '\n')
    .replace(/<[^>]*>/g, ' ');
  text = decodeEntities(text)
    .replace(/ /g, ' ')
    .replace(/[ \t\f\v\r]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n• *(?=\n|$)/g, '')
    .replace(/\n{3,}/g, '\n\n');
  return text.trim();
}

/** Text that may itself be entity-encoded HTML (common in JSON-LD descriptions). */
export function richTextToPlain(value: string): string {
  const once = /&lt;\/?[a-z]/i.test(value) ? decodeEntities(value) : value;
  return htmlToText(once);
}

/** Single-line clean text for short fields like titles. */
export function cleanInline(value: string): string {
  return htmlToText(value).replace(/\s+/g, ' ').trim();
}

function attr(tag: string, name: string): string | undefined {
  const m = new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i').exec(tag);
  if (!m) return undefined;
  return decodeEntities(m[1] ?? m[2] ?? m[3] ?? '');
}

/** Raw contents of every <script type="application/ld+json"> block. */
export function extractJsonLdBlocks(html: string): string[] {
  const blocks: string[] = [];
  const re = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const type = attr(m[1] ?? '', 'type');
    if (type && type.trim().toLowerCase() === 'application/ld+json') blocks.push(m[2] ?? '');
  }
  return blocks;
}

/** Meta tags keyed by lower-cased `property` or `name` (first occurrence wins). */
export function extractMeta(html: string): Map<string, string> {
  const meta = new Map<string, string>();
  const re = /<meta\b[^>]*>/gi;
  for (let m = re.exec(html); m; m = re.exec(html)) {
    const tag = m[0];
    const key = (
      attr(tag, 'property') ??
      attr(tag, 'name') ??
      attr(tag, 'itemprop')
    )?.toLowerCase();
    const content = attr(tag, 'content');
    if (key && content && !meta.has(key)) meta.set(key, content.trim());
  }
  return meta;
}

export function extractTitle(html: string): string | undefined {
  const m = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(html);
  const value = m ? cleanInline(m[1] ?? '') : '';
  return value || undefined;
}

export function extractHtmlLang(html: string): string | undefined {
  const m = /<html\b[^>]*>/i.exec(html);
  const lang = m ? attr(m[0], 'lang') : undefined;
  const short = lang?.toLowerCase().split(/[-_]/)[0];
  return short && /^[a-z]{2}$/.test(short) ? short : undefined;
}

/** Visible text of the whole page (body only, without scripts, nav chrome is kept). */
export function pageText(html: string): string {
  const body = /<body\b[^>]*>([\s\S]*)<\/body\s*>/i.exec(html)?.[1] ?? html;
  return htmlToText(body);
}

/** Heuristic login wall: password field or a login-only page with little content. */
export function looksLikeLoginPage(html: string): boolean {
  if (!/<input\b[^>]*type\s*=\s*["']?password/i.test(html)) return false;
  return pageText(html).length < 4000;
}
