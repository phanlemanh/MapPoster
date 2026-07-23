import { describe, it, expect, afterEach } from 'vitest';
import { Readable } from 'node:stream';
import nodeHttp from 'node:http';
import { tmpdir } from 'node:os';
import { readJsonBody, isAllowedRequest, startHttpServer, PayloadTooLargeError, type HttpServer } from './http';
import type { ToolDeps } from './tools';

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

  /** POST a raw buffer, optionally declaring Content-Length (else chunked). */
  function postBody(port: number, body: Buffer, declareLength: boolean): Promise<number> {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = { 'content-type': 'application/json', host: `127.0.0.1:${port}` };
      if (declareLength) headers['content-length'] = String(body.length);
      const req = nodeHttp.request({ host: '127.0.0.1', port, path: '/mcp', method: 'POST', headers }, (res) => {
        res.resume();
        resolve(res.statusCode ?? 0);
      });
      req.on('error', () => resolve(413)); // server destroyed the socket mid-upload
      req.end(body);
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

  it('413s an oversized body rather than buffering it', async () => {
    const deps = { renderFrame: () => { throw new Error('dispatched'); } } as never;
    const srv = await startHttpServer(0, deps, '127.0.0.1', { allowedHosts: [], allowedOrigins: [] }, 1024);
    const port = Number(new URL(srv.url).port);
    try {
      // declared up-front: refused before a byte is read
      expect(await postBody(port, Buffer.alloc(4096, 0x61), true)).toBe(413);
      // chunked: no Content-Length to check, so the byte counter has to catch it
      expect(await postBody(port, Buffer.alloc(4096, 0x61), false)).toBe(413);
    } finally {
      await srv.close();
    }
  });
});

describe('readJsonBody size cap', () => {
  it('rejects a body over the cap instead of buffering it to OOM', async () => {
    const big = Buffer.alloc(2048, 0x61);
    await expect(readJsonBody(Readable.from([big]), 1024)).rejects.toBeInstanceOf(PayloadTooLargeError);
  });

  it('counts bytes across chunks — a chunked body declares no Content-Length', async () => {
    const chunks = Array.from({ length: 8 }, () => Buffer.alloc(200, 0x61)); // 1600 bytes total
    await expect(readJsonBody(Readable.from(chunks), 1024)).rejects.toThrow(/exceeds 1024 bytes/);
  });

  it('lets a body at the limit through', async () => {
    const payload = Buffer.from(JSON.stringify({ location: 'HCMC' }), 'utf8');
    await expect(readJsonBody(Readable.from([payload]), payload.length)).resolves.toEqual({ location: 'HCMC' });
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

// 1×1 PNG hợp lệ (deliver đọc IHDR để lấy width/height)
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64',
);

function fakeDeps(): ToolDeps {
  return { render: async () => PNG_1x1, sinkDir: tmpdir(), defaultDelivery: 'inline' };
}

describe('POST /render (REST)', () => {
  let srv: HttpServer | undefined;
  afterEach(async () => { await srv?.close(); delete process.env.MAPPOSTER_TOKEN; });

  // srv.url is the MCP transport endpoint (".../mcp"); /render is a sibling
  // path on the same server, so build off the origin rather than srv.url itself.
  function renderUrl(server: HttpServer): string {
    return `${new URL(server.url).origin}/render`;
  }

  it('renders a map from JSON params and returns inline base64', async () => {
    srv = await startHttpServer(0, fakeDeps());
    const res = await fetch(renderUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: { lng: 106.7, lat: 10.78, zoom: 13 }, format: 'tiktok' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; base64?: string; width?: number; height?: number };
    expect(body.ok).toBe(true);
    expect(body.base64).toBe(PNG_1x1.toString('base64'));
    expect(body.width).toBe(1);
  });

  it('returns ok:false on resolve error (unknown theme) instead of throwing', async () => {
    srv = await startHttpServer(0, fakeDeps());
    const res = await fetch(renderUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: { lng: 106.7, lat: 10.78 }, theme: 'khong-ton-tai' }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/theme/i);
  });

  it('rejects when MAPPOSTER_TOKEN set and bearer missing/wrong', async () => {
    process.env.MAPPOSTER_TOKEN = 's3cret';
    srv = await startHttpServer(0, fakeDeps());
    const res = await fetch(renderUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer sai' },
      body: JSON.stringify({ location: { lng: 106.7, lat: 10.78 } }),
    });
    expect(res.status).toBe(401);
  });
});
