import { describe, it, expect, vi, afterEach } from 'vitest';
import { Readable } from 'node:stream';
import nodeHttp from 'node:http';
import { tmpdir } from 'node:os';
import { promises as fsp } from 'node:fs';

// resolveConfig (used by every /render test) reaches into ./geocode for anything
// that isn't a bare {lng,lat} — mocked so a region highlight resolved *by name*
// (the whole point of Task 1) doesn't need a real Nominatim round trip.
vi.mock('./geocode', () => ({
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) => {
    if (typeof input === 'string' && input.toLowerCase().startsWith('zzz')) throw new Error(`No geocoding result for "${input}"`);
    return typeof input === 'string'
      ? { center: [106.7, 10.78], zoom: 12, place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } };
  }),
  searchCandidates: vi.fn(async () => []),
  resolveBoundary: vi.fn(async () => ({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
  })),
  resolveCountryAt: vi.fn(async () => 'Vietnam'),
}));

import { readJsonBody, isAllowedRequest, startHttpServer, PayloadTooLargeError, type HttpServer } from './http';
import type { ToolDeps } from './tools';
import type { RenderConfig } from '../../src/render/renderConfig';

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

// set by fakeDeps().render on every call, so a test can inspect what resolveConfig
// actually produced (e.g. did `labels: true` reach `cfg.layers.roadLabels`).
let lastCfg: RenderConfig | undefined;
function fakeDeps(): ToolDeps {
  return {
    render: async (cfg) => {
      lastCfg = cfg;
      return PNG_1x1;
    },
    sinkDir: tmpdir(),
    defaultDelivery: 'inline',
  };
}

describe('POST /render (REST)', () => {
  let srv: HttpServer | undefined;
  afterEach(async () => {
    await srv?.close();
    delete process.env.MAPPOSTER_TOKEN;
    lastCfg = undefined;
  });

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

  it('413s an oversized body on /render', async () => {
    // small maxBodyBytes (5th param), same pattern as the /mcp 413 test above
    // (readJsonBody destroys the request mid-upload once it's over cap, which
    // undici's fetch surfaces as a socket error rather than a clean response —
    // use node:http directly, like the /mcp 413 test does, and treat the
    // destroyed-connection error as the 413 it is).
    srv = await startHttpServer(0, fakeDeps(), '127.0.0.1', { allowedHosts: [], allowedOrigins: [] }, 1024);
    const url = new URL(srv.url);
    const body = Buffer.from(JSON.stringify({ location: { lng: 106.7, lat: 10.78 }, placeName: 'x'.repeat(4096) }));
    const status = await new Promise<number>((resolve, reject) => {
      const req = nodeHttp.request(
        { host: url.hostname, port: url.port, path: '/render', method: 'POST', headers: { 'content-type': 'application/json' } },
        (res) => {
          res.resume();
          resolve(res.statusCode ?? 0);
        },
      );
      req.on('error', () => resolve(413)); // server destroyed the socket mid-upload
      req.end(body);
    });
    expect(status).toBe(413);
  });

  it('chuyển tiếp regions dạng tên + labels, và trả resolved', async () => {
    srv = await startHttpServer(0, fakeDeps());
    const res = await fetch(renderUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        location: 'Vinhomes Grand Park, TP Thủ Đức, TP.HCM',
        theme: 'midnight-blue',
        format: 'tiktok',
        highlight: { regions: ['TP Thủ Đức'] },
        labels: true,
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as {
      ok: boolean;
      resolved?: { place: { name: string }; highlights: { regions: { bbox: [number, number, number, number] | null }[] } };
    };
    expect(body.ok).toBe(true);
    expect(body.resolved).toBeDefined();
    const resolved = body.resolved!;
    expect(resolved.place.name).toEqual(expect.any(String));
    expect(resolved.highlights.regions[0].bbox).toHaveLength(4);
    expect(lastCfg?.layers?.roadLabels).toBe(true); // labels: true forwarded through
  });
});

// --- POST /render-clip (Task 6) ---

// set by fakeClipDeps().renderClip on every call, so a test can inspect the
// exact config renderClipFrames would have received (chrome forced clean, motion attached)
let seenClipConfig: RenderConfig | undefined;

function fakeClipDeps(overrides: Partial<ToolDeps> = {}): ToolDeps {
  return {
    render: async () => PNG_1x1,
    renderClip: async (cfg) => {
      seenClipConfig = cfg;
      return { frames: [PNG_1x1, PNG_1x1], settle: PNG_1x1 };
    },
    encodeAnimation: async (_frames, opts) => {
      await fsp.writeFile(opts.outPath, Buffer.from('mp4!'));
      return opts.outPath;
    },
    sinkDir: tmpdir(),
    defaultDelivery: 'inline',
    ...overrides,
  };
}

interface ClipResBody {
  ok: boolean;
  error?: string;
  clip?: { base64: string; format: string; width: number; height: number; durationSec: number; fps: number; bytes: number };
  settle?: { base64: string; format: string; width: number; height: number };
  motion?: { preset?: string; restAtSec: number };
  resolved?: { center: [number, number] };
  clipError?: string;
}

describe('POST /render-clip', () => {
  let srv: HttpServer | undefined;
  afterEach(async () => {
    await srv?.close();
    delete process.env.MAPPOSTER_TOKEN;
    delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
    delete process.env.MAPPOSTER_CLIP_CONCURRENCY;
    seenClipConfig = undefined;
  });

  function clipUrl(server: HttpServer): string {
    return `${new URL(server.url).origin}/render-clip`;
  }

  function postJson(url: string, body: unknown) {
    return fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  }

  it('200: đủ khối clip/settle/motion/resolved; chrome bị ép clean', async () => {
    srv = await startHttpServer(0, fakeClipDeps());
    const res = await postJson(clipUrl(srv), {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      chrome: 'poster',
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      motion: { preset: 'pushIn' },
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ClipResBody;
    expect(body.ok).toBe(true);
    expect(body.clip?.format).toBe('mp4');
    expect(body.clip?.base64).toBe(Buffer.from('mp4!').toString('base64'));
    expect(body.settle?.format).toBe('png');
    expect(body.motion?.preset).toBe('pushIn');
    expect(body.motion?.restAtSec).toBeCloseTo(3.9, 3);
    expect(body.resolved?.center).toBeDefined();
    expect(seenClipConfig?.chrome).toBe('clean'); // AC-9: caller xin 'poster' vẫn bị ép clean
    expect(seenClipConfig?.motion?.fps).toBe(18); // FPS_DEFAULT (motionCompiler.ts) — measured, see Task 9 report
  });

  it('422: preset lạ, thiếu motion, và script vỡ bất biến R — message nêu tên luật', async () => {
    srv = await startHttpServer(0, fakeClipDeps());
    const url = clipUrl(srv);
    expect((await postJson(url, { location: { lng: 1, lat: 1 }, motion: { preset: 'spin' } })).status).toBe(422);
    expect((await postJson(url, { location: { lng: 1, lat: 1 } })).status).toBe(422);
    const bad = await postJson(url, {
      location: { lng: 1, lat: 1, zoom: 14 },
      motion: { script: { fps: 24, durationSec: 6, restAtSec: 5.9, camera: [{ t: 0, center: [1, 1], zoom: 10 }], tracks: [] } },
    });
    expect(bad.status).toBe(422);
    const badBody = (await bad.json()) as ClipResBody;
    expect(badBody.error).toMatch(/^R:/);
  });

  it('422: preset hợp lệ nhưng override sai phạm vi → thông điệp range của assertValidOverrides lọt tới caller, không phải "motion is required" (Finding F)', async () => {
    srv = await startHttpServer(0, fakeClipDeps());
    const res = await postJson(clipUrl(srv), {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      motion: { preset: 'drift', fps: 999 },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as ClipResBody;
    expect(body.error).toMatch(/fps=999 is out of range/);
  });

  it('422: script vỡ schema (raw ZodError) → error vẫn là string dễ đọc, không phải JSON issues dump', async () => {
    srv = await startHttpServer(0, fakeClipDeps());
    // fps: 999 fails motionScriptSchema's z.number().int().min(12).max(30) —
    // motionScriptSchema.parse() throws a raw z.ZodError here, BEFORE any of
    // the R/O/L/B/I invariant checks (which throw plain Error with a prefix).
    const res = await postJson(clipUrl(srv), {
      location: { lng: 1, lat: 1, zoom: 14 },
      motion: {
        script: { fps: 999, durationSec: 6, restAtSec: 5.9, camera: [{ t: 0, center: [1, 1], zoom: 10 }], tracks: [] },
      },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as ClipResBody;
    expect(typeof body.error).toBe('string');
    expect(body.error?.length).toBeGreaterThan(0);
    // A raw ZodError serialized via String(e) / e.message would be a `[ { ... } ]`
    // issues array containing entries like `"code":"invalid_type"` — prettifyError
    // must turn that into readable prose instead.
    expect(body.error?.startsWith('[')).toBe(false);
    expect(body.error).not.toContain('"code":"invalid_type"');
  });

  it('degrade: encode hỏng → ok:true + settle + clipError, KHÔNG có clip; file mp4 tạm không bị rò rỉ', async () => {
    // Mimic a real encoder crashing mid-write (e.g. ffmpeg killed partway
    // through): the temp file exists on disk BEFORE the throw, so an
    // implementation that only cleans up on the success path would leak it.
    let leakedPath: string | undefined;
    srv = await startHttpServer(
      0,
      fakeClipDeps({
        encodeAnimation: async (_frames, opts) => {
          leakedPath = opts.outPath;
          await fsp.writeFile(opts.outPath, Buffer.from('partial mp4 bytes from a crashed encoder'));
          throw new Error('ffmpeg encode boom');
        },
      }),
    );
    const res = await postJson(clipUrl(srv), {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      motion: { preset: 'pushIn' },
    });
    const body = (await res.json()) as ClipResBody;
    expect(res.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.clip).toBeUndefined();
    expect(body.settle?.base64).toBeTruthy();
    expect(body.clipError).toMatch(/encode/i);

    expect(leakedPath).toBeDefined();
    await expect(fsp.access(leakedPath!)).rejects.toThrow(); // ENOENT — cleaned up, not orphaned in tmpdir
  });

  it('422 khi mp4 vượt MAPPOSTER_CLIP_MAX_BYTES — nhưng settle/motion/resolved vẫn có trong body (Finding G)', async () => {
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '10';
    srv = await startHttpServer(
      0,
      fakeClipDeps({
        encodeAnimation: async (_frames, opts) => {
          await fsp.writeFile(opts.outPath, Buffer.alloc(4096, 0x61));
          return opts.outPath;
        },
      }),
    );
    const res = await postJson(clipUrl(srv), {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      motion: { preset: 'pushIn' },
    });
    expect(res.status).toBe(422);
    const body = (await res.json()) as ClipResBody;
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
    // Finding G: the degrade contract ("a settle still that already exists
    // must never be thrown away") applies to oversize too, not only to an
    // encode-failure — this used to return 422 with NOTHING else.
    expect(body.settle?.base64).toBeTruthy();
    expect(body.motion?.preset).toBe('pushIn');
    expect(body.resolved?.center).toBeDefined();
  });

  it('401 khi MAPPOSTER_TOKEN đặt mà bearer sai', async () => {
    process.env.MAPPOSTER_TOKEN = 's3cret';
    srv = await startHttpServer(0, fakeClipDeps());
    const res = await fetch(clipUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer sai' },
      body: JSON.stringify({ location: { lng: 106.7, lat: 10.78 }, motion: { preset: 'drift' } }),
    });
    expect(res.status).toBe(401);
  });

  it('401 khi MAPPOSTER_TOKEN đặt mà KHÔNG có Authorization header', async () => {
    process.env.MAPPOSTER_TOKEN = 's3cret';
    srv = await startHttpServer(0, fakeClipDeps());
    const res = await fetch(clipUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: { lng: 106.7, lat: 10.78 }, motion: { preset: 'drift' } }),
    });
    expect(res.status).toBe(401);
  });

  it('429: MAPPOSTER_CLIP_CONCURRENCY=1 — a second /render-clip while one is still in flight is rejected (Decision 2), shared with MCP render_clip', async () => {
    process.env.MAPPOSTER_CLIP_CONCURRENCY = '1';
    let releaseFirst!: () => void;
    let firstCallStarted!: () => void;
    const started = new Promise<void>((resolve) => {
      firstCallStarted = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    srv = await startHttpServer(
      0,
      fakeClipDeps({
        renderClip: async (cfg) => {
          seenClipConfig = cfg;
          firstCallStarted();
          await gate;
          return { frames: [PNG_1x1], settle: PNG_1x1 };
        },
      }),
    );
    const body = {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      motion: { preset: 'pushIn' },
    };

    const first = postJson(clipUrl(srv), body);
    await started; // first request is provably mid-render before firing the second

    const second = await postJson(clipUrl(srv), body);
    expect(second.status).toBe(429);
    const secondBody = (await second.json()) as ClipResBody;
    expect(secondBody.ok).toBe(false);
    expect(secondBody.error).toMatch(/Too many concurrent clip renders/);

    releaseFirst();
    const firstRes = await first;
    expect(firstRes.status).toBe(200);

    // slot freed after the first request finished — a third now succeeds
    const third = await postJson(clipUrl(srv), body);
    expect(third.status).toBe(200);
  });
});
