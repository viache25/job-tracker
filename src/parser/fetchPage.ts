import { parseHttpUrl } from '@/lib/url';

export const FETCH_TIMEOUT_MS = 8_000;
export const MAX_PAGE_BYTES = 3 * 1024 * 1024;
export const USER_AGENT =
  'Mozilla/5.0 (compatible; JobTracker/0.1; +https://github.com/viache25/job-tracker)';

const HTML_TYPES = ['text/html', 'application/xhtml+xml'];

export type FetchPageResult =
  | { ok: true; html: string; finalUrl: string; status: number; truncated: boolean }
  | {
      ok: false;
      error: 'invalid_url' | 'timeout' | 'network' | 'http_error' | 'not_html' | 'too_large';
      status?: number;
    };

type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

async function readLimited(
  response: Response,
  limit: number,
): Promise<{ text: string; truncated: boolean }> {
  const reader = response.body?.getReader?.();
  if (!reader) {
    // React Native has no streaming bodies; the size was already checked via Content-Length.
    const text = await response.text();
    return text.length > limit
      ? { text: text.slice(0, limit), truncated: true }
      : { text, truncated: false };
  }
  const decoder = new TextDecoder('utf-8');
  let received = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    const remaining = limit - received;
    if (value.byteLength > remaining) {
      text += decoder.decode(value.subarray(0, remaining), { stream: false });
      await reader.cancel().catch(() => undefined);
      return { text, truncated: true };
    }
    received += value.byteLength;
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return { text, truncated: false };
}

/**
 * Downloads a vacancy page as untrusted HTML: http(s) only, 8 s timeout for the whole
 * transfer, at most 3 MB, HTML content types only, final URL re-checked after redirects.
 * Nothing on the page is executed.
 */
export async function fetchPage(
  url: string,
  {
    fetchImpl = fetch as FetchLike,
    timeoutMs = FETCH_TIMEOUT_MS,
    maxBytes = MAX_PAGE_BYTES,
  }: { fetchImpl?: FetchLike; timeoutMs?: number; maxBytes?: number } = {},
): Promise<FetchPageResult> {
  if (!parseHttpUrl(url) || !/^https?:\/\//i.test(url)) return { ok: false, error: 'invalid_url' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      credentials: 'omit',
      headers: {
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1',
        'Accept-Language': 'de-AT,de;q=0.9,en;q=0.8',
        'User-Agent': USER_AGENT,
      },
    });

    const finalUrl = response.url || url;
    if (!parseHttpUrl(finalUrl) || !/^https?:\/\//i.test(finalUrl)) {
      return { ok: false, error: 'invalid_url' };
    }
    if (!response.ok) return { ok: false, error: 'http_error', status: response.status };

    const type = response.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase();
    if (type && !HTML_TYPES.includes(type)) {
      return { ok: false, error: 'not_html', status: response.status };
    }
    const length = Number(response.headers.get('content-length'));
    if (Number.isFinite(length) && length > maxBytes) {
      return { ok: false, error: 'too_large', status: response.status };
    }

    const { text, truncated } = await readLimited(response, maxBytes);
    return { ok: true, html: text, finalUrl, status: response.status, truncated };
  } catch {
    return { ok: false, error: controller.signal.aborted ? 'timeout' : 'network' };
  } finally {
    clearTimeout(timer);
  }
}
