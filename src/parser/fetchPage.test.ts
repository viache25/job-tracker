import { fetchPage } from './fetchPage';

type Init = { status?: number; headers?: Record<string, string>; url?: string };

function respond(body: string, init: Init = {}) {
  return jest.fn(async (input: string) => {
    const response = new Response(body, {
      status: init.status ?? 200,
      headers: { 'content-type': 'text/html; charset=utf-8', ...init.headers },
    });
    Object.defineProperty(response, 'url', { value: init.url ?? input });
    return response;
  });
}

describe('fetchPage', () => {
  it('downloads HTML', async () => {
    const fetchImpl = respond('<html><title>Job</title></html>');
    const result = await fetchPage('https://example.com/job', { fetchImpl });
    expect(result).toEqual({
      ok: true,
      html: '<html><title>Job</title></html>',
      finalUrl: 'https://example.com/job',
      status: 200,
      truncated: false,
    });
    const init = fetchImpl.mock.calls[0]![1 as never] as RequestInit;
    expect((init.headers as Record<string, string>)['User-Agent']).toMatch(/JobTracker/);
    expect(init.credentials).toBe('omit');
  });

  it.each(['javascript:alert(1)', 'file:///etc/hosts', 'ftp://example.com/a', 'example.com'])(
    'refuses %s without fetching',
    async (url) => {
      const fetchImpl = respond('');
      expect(await fetchPage(url, { fetchImpl })).toEqual({ ok: false, error: 'invalid_url' });
      expect(fetchImpl).not.toHaveBeenCalled();
    },
  );

  it('refuses a redirect to a non-http scheme', async () => {
    const fetchImpl = respond('<html></html>', { url: 'file:///etc/passwd' });
    expect(await fetchPage('https://example.com/r', { fetchImpl })).toEqual({
      ok: false,
      error: 'invalid_url',
    });
  });

  it('times out', async () => {
    const fetchImpl = jest.fn(
      (_input: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init.signal!.addEventListener('abort', () => reject(new Error('aborted')));
        }),
    );
    expect(await fetchPage('https://slow.example.com', { fetchImpl, timeoutMs: 20 })).toEqual({
      ok: false,
      error: 'timeout',
    });
  });

  it('rejects non-HTML content', async () => {
    const fetchImpl = respond('%PDF', { headers: { 'content-type': 'application/pdf' } });
    expect(await fetchPage('https://example.com/cv.pdf', { fetchImpl })).toMatchObject({
      ok: false,
      error: 'not_html',
    });
  });

  it('does not download when Content-Length is too large', async () => {
    const fetchImpl = respond('x', { headers: { 'content-length': String(4 * 1024 * 1024) } });
    expect(await fetchPage('https://example.com/big', { fetchImpl })).toMatchObject({
      ok: false,
      error: 'too_large',
    });
  });

  it('truncates a large body without Content-Length', async () => {
    const fetchImpl = respond('a'.repeat(5000));
    const result = await fetchPage('https://example.com/big', { fetchImpl, maxBytes: 1000 });
    expect(result).toMatchObject({ ok: true, truncated: true });
    expect(result.ok && result.html.length).toBe(1000);
  });

  it('reports HTTP errors with the status', async () => {
    const fetchImpl = respond('nope', { status: 403 });
    expect(await fetchPage('https://example.com/x', { fetchImpl })).toEqual({
      ok: false,
      error: 'http_error',
      status: 403,
    });
  });

  it('reports network errors', async () => {
    const fetchImpl = jest.fn(async () => {
      throw new TypeError('Network request failed');
    });
    expect(await fetchPage('https://offline.example.com', { fetchImpl })).toEqual({
      ok: false,
      error: 'network',
    });
  });
});
