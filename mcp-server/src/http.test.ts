import { describe, it, expect } from 'vitest';
import { Readable } from 'node:stream';
import nodeHttp from 'node:http';
import { readJsonBody, isAllowedRequest, startHttpServer } from './http';

describe('isAllowedRequest (DNS-rebinding guard)', () => {
  const loopback = { allowedHosts: ['127.0.0.1', 'localhost', '[::1]'], allowedOrigins: [] as string[] };

  it('accepts a server-to-server call: loopback Host, no Origin', () => {
    expect(isAllowedRequest({ host: '127.0.0.1:4181' }, loopback)).toBe(true);
    expect(isAllowedRequest({ host: 'localhost:4181' }, loopback)).toBe(true);
    expect(isAllowedRequest({ host: '[::1]:4181' }, loopback)).toBe(true);
  });

  it('refuses a rebound Host even though the socket is loopback', () => {
    // attacker.example resolves to 127.0.0.1; the browser still sends its own Host
    expect(isAllowedRequest({ host: 'attacker.example:4181' }, loopback)).toBe(false);
  });

  it('refuses any request carrying an unknown Origin', () => {
    expect(isAllowedRequest({ host: '127.0.0.1:4181', origin: 'https://evil.example' }, loopback)).toBe(false);
  });

  it('accepts an Origin that was explicitly allowed', () => {
    const policy = { ...loopback, allowedOrigins: ['https://studio.internal'] };
    expect(isAllowedRequest({ host: '127.0.0.1:4181', origin: 'https://studio.internal' }, policy)).toBe(true);
    expect(isAllowedRequest({ host: '127.0.0.1:4181', origin: 'https://evil.example' }, policy)).toBe(false);
  });

  it('refuses a request with no Host header at all', () => {
    expect(isAllowedRequest({}, loopback)).toBe(false);
  });

  it('lets a hosted deployment declare the name it answers to', () => {
    const policy = { allowedHosts: ['maps.internal'], allowedOrigins: [] as string[] };
    expect(isAllowedRequest({ host: 'maps.internal' }, policy)).toBe(true);
    expect(isAllowedRequest({ host: '127.0.0.1:4181' }, policy)).toBe(false);
  });
});

describe('startHttpServer enforces the guard', () => {
  /** node:http, not fetch — fetch refuses to let us forge a Host header. */
  function post(port: number, headers: Record<string, string>): Promise<number> {
    return new Promise((resolve, reject) => {
      const req = nodeHttp.request(
        { host: '127.0.0.1', port, path: '/mcp', method: 'POST', headers: { 'content-type': 'application/json', ...headers } },
        (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        },
      );
      req.on('error', reject);
      req.end(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }));
    });
  }

  it('403s a rebound Host and an unknown Origin before any tool is dispatched', async () => {
    // deps must never be touched: the refusal has to happen before dispatch
    const deps = {
      renderFrame: () => {
        throw new Error('tool dispatched on a forbidden request');
      },
    } as never;
    const srv = await startHttpServer(0, deps);
    const port = Number(new URL(srv.url).port);
    try {
      expect(await post(port, { host: 'attacker.example' })).toBe(403);
      expect(await post(port, { origin: 'https://evil.example' })).toBe(403);
      expect(await post(port, { host: `127.0.0.1:${port}` })).not.toBe(403); // the legitimate caller still gets through
    } finally {
      await srv.close();
    }
  });
});

describe('readJsonBody', () => {
  it('decodes multibyte UTF-8 split across chunk boundaries (R2-LOW)', async () => {
    const location = 'Võ Văn Tần, Quận 3, TP.HCM';
    const buf = Buffer.from(JSON.stringify({ location }), 'utf8');

    // split INSIDE the multibyte 'ậ' of "Quận" — `data += chunk` would decode each
    // half separately and produce U+FFFD replacement characters
    const marker = Buffer.from('ậ', 'utf8');
    const cut = buf.indexOf(marker) + 1;
    expect(cut).toBeGreaterThan(0);

    const stream = Readable.from([buf.subarray(0, cut), buf.subarray(cut)]);
    await expect(readJsonBody(stream)).resolves.toEqual({ location });
  });

  it('handles an inline GeoJSON payload spread over many chunks', async () => {
    const geojson = { type: 'FeatureCollection', features: Array.from({ length: 200 }, () => ({ type: 'Feature', properties: { name: 'Phường Bến Nghé' }, geometry: { type: 'Point', coordinates: [106.7, 10.78] } })) };
    const buf = Buffer.from(JSON.stringify({ geojson }), 'utf8');
    const chunks: Buffer[] = [];
    for (let i = 0; i < buf.length; i += 137) chunks.push(buf.subarray(i, i + 137)); // odd size ⇒ splits multibyte chars
    const parsed = (await readJsonBody(Readable.from(chunks))) as typeof geojson extends unknown ? { geojson: { features: unknown[] } } : never;
    expect(parsed.geojson.features).toHaveLength(200);
  });

  it('rejects invalid JSON', async () => {
    await expect(readJsonBody(Readable.from([Buffer.from('{oops')]))).rejects.toThrow();
  });

  it('resolves undefined for an empty body', async () => {
    await expect(readJsonBody(Readable.from([]))).resolves.toBeUndefined();
  });
});
