/**
 * Small, strict URL handling. React Native's URL class is incomplete, so we parse
 * http(s) URLs ourselves and never touch other schemes.
 */

export type HttpUrl = {
  protocol: 'http' | 'https';
  host: string;
  port: string;
  path: string;
  /** Raw (still encoded) query pairs in original order. */
  query: [key: string, value: string | null][];
  hash: string;
};

const URL_RE =
  /^(https?):\/\/(?:[^@/?#\s]*@)?([^:/?#\s]+)(?::(\d{1,5}))?([^?#\s]*)(?:\?([^#\s]*))?(?:#(\S*))?$/i;
const HOST_RE =
  /^(?:[a-z0-9¡-￿](?:[a-z0-9¡-￿-]{0,61}[a-z0-9¡-￿])?\.)+[a-z¡-￿]{2,}$|^localhost$|^\d{1,3}(?:\.\d{1,3}){3}$/i;

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch {
    return value;
  }
}

/** Parses an http(s) URL. A bare "example.com/x" gets https://. Anything else is null. */
export function parseHttpUrl(input: string): HttpUrl | null {
  let value = input.trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:/i.test(value)) {
    if (!/^[^\s/]+\.[^\s/]+/.test(value)) return null;
    value = `https://${value.replace(/^\/\//, '')}`;
  }
  const m = URL_RE.exec(value);
  if (!m) return null;
  const protocol = m[1]!.toLowerCase() as 'http' | 'https';
  const host = m[2]!.toLowerCase().replace(/\.$/, '');
  if (!HOST_RE.test(host)) return null;
  let port = m[3] ?? '';
  if ((protocol === 'http' && port === '80') || (protocol === 'https' && port === '443')) port = '';
  if (port && Number(port) > 65535) return null;
  const query: HttpUrl['query'] = (m[5] ?? '')
    .split('&')
    .filter(Boolean)
    .map((pair) => {
      const i = pair.indexOf('=');
      return i < 0 ? [pair, null] : [pair.slice(0, i), pair.slice(i + 1)];
    });
  return { protocol, host, port, path: m[4] || '/', query, hash: m[6] ?? '' };
}

export function formatHttpUrl(url: HttpUrl): string {
  const query = url.query.map(([k, v]) => (v === null ? k : `${k}=${v}`)).join('&');
  return (
    `${url.protocol}://${url.host}${url.port ? `:${url.port}` : ''}${url.path}` +
    (query ? `?${query}` : '') +
    (url.hash ? `#${url.hash}` : '')
  );
}

export function isHttpUrl(input: string): boolean {
  return parseHttpUrl(input) !== null;
}

const TRACKING_PARAMS = new Set([
  'gclid',
  'gclsrc',
  'dclid',
  'fbclid',
  'msclkid',
  'yclid',
  'igshid',
  'mc_cid',
  'mc_eid',
  '_hsenc',
  '_hsmkt',
  'trk',
  'trackingid',
  'refid',
]);

function isTrackingParam(key: string): boolean {
  const k = safeDecode(key).toLowerCase();
  return k.startsWith('utm_') || TRACKING_PARAMS.has(k);
}

/**
 * Canonical form used for storage and duplicate detection: lower-case host, no default port,
 * no fragment, no tracking parameters (utm_*, gclid, fbclid…), remaining parameters sorted.
 */
export function canonicalizeUrl(input: string): string | null {
  const url = parseHttpUrl(input);
  if (!url) return null;
  const query = url.query
    .filter(([k]) => !isTrackingParam(k))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return formatHttpUrl({ ...url, query, hash: '' });
}

/** Host without "www.", used as the application's source. */
export function sourceOf(input: string): string | null {
  const url = parseHttpUrl(input);
  return url ? url.host.replace(/^www\./, '') : null;
}

/** First http(s) link inside a piece of text (shared text often wraps the link in prose). */
export function extractUrl(text: string): string | null {
  const m = /https?:\/\/[^\s<>"'«»]+/i.exec(text);
  if (!m) return isHttpUrl(text.trim()) ? text.trim() : null;
  return m[0].replace(/[),.;:!?]+$/, '');
}
