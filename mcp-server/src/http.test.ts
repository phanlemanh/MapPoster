import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { Readable } from 'node:stream';
import nodeHttp from 'node:http';
import { tmpdir } from 'node:os';
import { promises as fsp } from 'node:fs';

// resolveConfig (used by every /render test) reaches into ./geocode for anything
// that isn't a bare {lng,lat} — mocked so a region highlight resolved *by name*
// (the whole point of Task 1) doesn't need a real Nominatim round trip.
// `importActual` chứ không thay trọn gói — jobRunner so `instanceof` với lớp
// lỗi thật của mô-đun này; thay trọn thì nó thành undefined và phép so ném lỗi.
vi.mock('./geocode', async () => ({
  ...(await vi.importActual<typeof import('./geocode')>('./geocode')),
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) => {
    if (typeof input === 'string' && input.toLowerCase().startsWith('zzz')) throw new Error(`No geocoding result for "${input}"`);
    return typeof input === 'string'
      // Echo tên caller gửi làm place.name, đúng như một geocoder thật trả về
      // tên địa danh nó khớp được. Hằng 'HCMC' cũ khiến KHÔNG lane nào kiểm
      // được tên có dấu đi trọn đường ra phản hồi — AC-1 đòi đúng điều đó.
      ? { center: [106.7, 10.78], zoom: 12, place: { name: input, country: 'Vietnam', lat: 10.78, lng: 106.7 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } };
  }),
  searchCandidates: vi.fn(async () => []),
  resolveBoundary: vi.fn(async () => ({
    geojson: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
    },
    osmType: 'relation',
    osmId: 1973756,
    displayName: 'District 1, Ho Chi Minh City, Vietnam',
    placeRank: 18,
  })),
  resolveCountryAt: vi.fn(async () => 'Vietnam'),
}));

import { readJsonBody, isAllowedRequest, startHttpServer, PayloadTooLargeError, type HttpServer } from './http';
import type { ToolDeps } from './tools';
import type { RenderConfig } from '../../src/render/renderConfig';
import type { ClipAnchors } from '../../src/render/anchors';

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

describe('auth: cửa /mcp và luật fail-closed (P0)', () => {
  let srv: HttpServer | undefined;
  afterEach(async () => {
    await srv?.close();
    srv = undefined;
    delete process.env.MAPPOSTER_TOKEN;
  });

  const mcpBody = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

  it('gác /mcp bằng CÙNG bearer với /render — trước đây nhánh này không kiểm gì', async () => {
    process.env.MAPPOSTER_TOKEN = 'secret';
    srv = await startHttpServer(0, fakeDeps());

    const noAuth = await fetch(srv.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: mcpBody,
    });
    expect(noAuth.status).toBe(401);

    const wrong = await fetch(srv.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: 'Bearer nope' },
      body: mcpBody,
    });
    expect(wrong.status).toBe(401);
  });

  it('vẫn cho qua khi bearer đúng — cổng không được chặn người gọi hợp lệ', async () => {
    process.env.MAPPOSTER_TOKEN = 'secret';
    srv = await startHttpServer(0, fakeDeps());
    const ok = await fetch(srv.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream', authorization: 'Bearer secret' },
      body: mcpBody,
    });
    expect(ok.status).toBe(200);
  });

  it('KHÔNG đòi bearer khi không đặt token — dev cục bộ trên loopback vẫn chạy', async () => {
    // Nửa should-NOT-fire: siết auth không được biến việc chạy thử cục bộ
    // thành phải cấu hình.
    srv = await startHttpServer(0, fakeDeps());
    const res = await fetch(srv.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
      body: mcpBody,
    });
    expect(res.status).toBe(200);
  });

  it('TỪ CHỐI KHỞI ĐỘNG khi bind ngoài loopback mà không có token', async () => {
    // Fail-closed. `if (token && ...)` nghĩa là quên đặt token = mở toang, và
    // production bind 0.0.0.0 (render.yaml) nên đây là cấu hình có thật.
    await expect(
      startHttpServer(0, fakeDeps(), '0.0.0.0', { allowedHosts: ['example.com'], allowedOrigins: [] }),
    ).rejects.toThrow(/MAPPOSTER_TOKEN/);
  });

  it('cho phép bind ngoài loopback KHI đã có token', async () => {
    // Phải bind host NGOÀI loopback thật. Bản đầu của test này dùng '127.0.0.1'
    // — chính là loopback — nên nó chưa bao giờ chạy qua nhánh đang cần chứng
    // minh, dù vẫn xanh. Đúng kiểu eval khai một độ phủ không tồn tại.
    process.env.MAPPOSTER_TOKEN = 'secret';
    srv = await startHttpServer(0, fakeDeps(), '0.0.0.0', { allowedHosts: ['127.0.0.1'], allowedOrigins: [] });
    expect(srv.url).toContain('/mcp');
  });
});

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

  it('returns 400 + ok:false on a resolve-phase error (unknown theme) instead of throwing or answering 200 (Decision 3)', async () => {
    srv = await startHttpServer(0, fakeDeps());
    const res = await fetch(renderUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: { lng: 106.7, lat: 10.78 }, theme: 'khong-ton-tai' }),
    });
    // A bad theme is the CALLER's fault — 400, not 200. The body shape
    // ({ ok:false, error }) is unchanged; this is backward compatible with a
    // consumer that only checks `body.ok`, per Decision 3's stated contract.
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/theme/i);
  });

  it('400: an unresolvable location (geocoding found nothing) is the caller\'s fault, not ours (Decision 3)', async () => {
    srv = await startHttpServer(0, fakeDeps());
    const res = await fetch(renderUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: 'zzz-nowhere-on-earth' }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { ok: boolean; error?: string };
    // {ok:false, error} is unchanged in a 4xx body — Decision 3 only changes
    // the HTTP status, never the response shape.
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/no geocoding result/i);
  });

  it('500: a failure while actually rendering (not resolving) is OUR fault, not the caller\'s (Decision 3)', async () => {
    srv = await startHttpServer(0, {
      render: async () => {
        throw new Error('page crashed mid-render');
      },
      sinkDir: tmpdir(),
      defaultDelivery: 'inline',
    });
    const res = await fetch(renderUrl(srv), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ location: { lng: 106.7, lat: 10.78 } }),
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as { ok: boolean; error?: string };
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/page crashed mid-render/);
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

/**
 * Anchors một lần render clip thật sẽ trả về, DẪN XUẤT TỪ `cfg`: `zoom + 1`
 * khiến `resolved.camera.zoom` không thể trùng `resolved.zoom` một cách tình
 * cờ, nên một hiện thực echo lại `cfg.camera` sẽ đỏ chứ không xanh nhầm.
 */
function fakeAnchors(cfg: RenderConfig): ClipAnchors {
  return {
    camera: { center: cfg.camera.center, zoom: cfg.camera.zoom + 1, bearing: 0, pitch: 0 },
    points: (cfg.markers ?? []).map((m, index) => ({ index, lng: m.lng, lat: m.lat, xPct: 25, yPct: 75, onScreen: true })),
    regions: (cfg.highlight?.regions ?? []).map((_r, index) => ({
      index,
      bboxCenterPct: [50, 50] as [number, number],
      bboxPct: [10, 20, 90, 80] as [number, number, number, number],
    })),
  };
}

function fakeClipDeps(overrides: Partial<ToolDeps> = {}): ToolDeps {
  return {
    render: async () => PNG_1x1,
    renderClip: async (cfg) => {
      seenClipConfig = cfg;
      return { frames: [PNG_1x1, PNG_1x1], settle: PNG_1x1, anchors: fakeAnchors(cfg) };
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
  motion?: { preset?: string; restAtSec: number; script?: { fps: number; camera: unknown[] } };
  resolved?: { center: [number, number]; zoom: number; camera?: ClipAnchors['camera']; anchors?: { points: ClipAnchors['points']; regions: ClipAnchors['regions'] }; anchorsUnavailable?: string };
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
    expect(Array.isArray(body.motion?.script?.camera)).toBe(true);
    expect(body.resolved?.center).toBeDefined();
    expect(seenClipConfig?.chrome).toBe('clean'); // AC-9: caller xin 'poster' vẫn bị ép clean
    expect(seenClipConfig?.motion?.fps).toBe(18); // FPS_DEFAULT (motionCompiler.ts) — measured, see Task 9 report
  });

  it('resolved mang camera + anchors trên CẢ BA lối ra: 200, degrade encode, và 422 quá cỡ (PR #6)', async () => {
    const body = {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }], regions: ['District 1'] },
      motion: { preset: 'pushIn' },
    };

    srv = await startHttpServer(0, fakeClipDeps());
    const okBody = (await (await postJson(clipUrl(srv), body)).json()) as ClipResBody;
    expect(okBody.ok).toBe(true);
    expect(okBody.resolved?.camera).toEqual({ center: seenClipConfig!.camera.center, zoom: seenClipConfig!.camera.zoom + 1, bearing: 0, pitch: 0 });
    // camera là camera NGHỈ, không phải camera trong config — nếu ai đó echo
    // `cfg.camera` cho tiện thì hai con số này bằng nhau và bất biến chết lặng.
    expect(okBody.resolved?.camera?.zoom).not.toBe(okBody.resolved?.zoom);
    expect(okBody.resolved?.anchors?.points).toEqual([{ index: 0, lng: 106.7, lat: 10.78, xPct: 25, yPct: 75, onScreen: true }]);
    expect(okBody.resolved?.anchors?.regions).toEqual([{ index: 0, bboxCenterPct: [50, 50], bboxPct: [10, 20, 90, 80] }]);
    await srv.close();

    // degrade: encoder ngã — khung đã chụp, anchors đã đo, không được vứt đi
    srv = await startHttpServer(
      0,
      fakeClipDeps({
        encodeAnimation: async () => {
          throw new Error('ffmpeg boom');
        },
      }),
    );
    const degraded = (await (await postJson(clipUrl(srv), body)).json()) as ClipResBody;
    expect(degraded.clipError).toBeDefined();
    expect(degraded.resolved?.camera?.zoom).toBe(seenClipConfig!.camera.zoom + 1);
    expect(degraded.resolved?.anchors?.points).toHaveLength(1);
    await srv.close();

    // 422 quá cỡ: cùng giao ước xuống-cấp
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '2';
    srv = await startHttpServer(0, fakeClipDeps());
    const over = await postJson(clipUrl(srv), body);
    expect(over.status).toBe(422);
    const overBody = (await over.json()) as ClipResBody;
    expect(overBody.resolved?.camera?.zoom).toBe(seenClipConfig!.camera.zoom + 1);
    expect(overBody.resolved?.anchors?.points).toHaveLength(1);
  });

  it('AC-11: output.quality ĐI TỚI encoder trên lối REST, và vắng mặt thì encoder giữ nguyên mặc định cũ', async () => {
    // Đây chính là nhánh mà `encodeQuality` phải được nâng ra ngoài `try`
    // resolve (http.ts:327): `params` là block-scope của try đó, còn pha encode
    // nằm ở try KHÁC. Đọc `params` ở đó là ReferenceError, và vì cả khối encode
    // nằm trong catch-degrade nên lỗi ấy biến thành 'clip hỏng' IM LẶNG —
    // response vẫn 200. Không phép kiểm nào của file này từng chạm `quality`,
    // nên hồi quy đó chạy được trọn vẹn dưới một lane 100% xanh.
    const seen: (string | undefined)[] = [];
    const spyDeps = () =>
      fakeClipDeps({
        encodeAnimation: async (_frames, opts) => {
          seen.push(opts.quality);
          await fsp.writeFile(opts.outPath, Buffer.from('mp4!'));
          return opts.outPath;
        },
      });
    const body = {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      motion: { preset: 'pushIn' },
    };

    srv = await startHttpServer(0, spyDeps());
    const withQuality = await postJson(clipUrl(srv), { ...body, output: { quality: 'high' } });
    expect(withQuality.status).toBe(200); // degrade im lặng cũng là 200 — nên KHÔNG đủ một mình
    expect(((await withQuality.json()) as ClipResBody).clipError).toBeUndefined();
    expect(seen).toEqual(['high']);
    await srv.close();

    // Nửa suppression của AC-11: không khai `quality` thì encoder KHÔNG được
    // nhận một giá trị bịa ra — nó phải thấy `undefined` và tự rơi về
    // 'standard' (crf 20), đúng tham số ffmpeg trước khi có núm này.
    srv = await startHttpServer(0, spyDeps());
    const withoutQuality = await postJson(clipUrl(srv), body);
    expect(withoutQuality.status).toBe(200);
    expect(seen).toEqual(['high', undefined]);
  });

  it('renderer không đo được anchors ⇒ 200 kèm anchorsUnavailable, clip vẫn ra đời (PR #6)', async () => {
    const REASON = 'camera.pitch is 30 — anchors require pitch 0.';
    srv = await startHttpServer(
      0,
      fakeClipDeps({
        renderClip: async (cfg) => {
          seenClipConfig = cfg;
          return { frames: [PNG_1x1], settle: PNG_1x1, anchorsUnavailable: REASON };
        },
      }),
    );
    const res = await postJson(clipUrl(srv), {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      camera: { pitch: 30 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      motion: { preset: 'pushIn' },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as ClipResBody;
    expect(body.ok).toBe(true);
    expect(body.clip?.format).toBe('mp4'); // pitch không làm hỏng clip
    expect(body.resolved?.anchorsUnavailable).toBe(REASON);
    expect('anchors' in (body.resolved as object)).toBe(false);
    expect('camera' in (body.resolved as object)).toBe(false);
  });

  it('400: an unresolvable location (geocoding found nothing) is the caller\'s fault, not ours (Decision 3)', async () => {
    srv = await startHttpServer(0, fakeClipDeps());
    const res = await postJson(clipUrl(srv), {
      location: 'zzz-nowhere-on-earth',
      motion: { preset: 'drift' },
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as ClipResBody;
    // {ok:false, error} is unchanged in a 4xx body — Decision 3 only changes
    // the HTTP status, never the response shape.
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/no geocoding result/i);
  });

  it('500: a failure while actually rendering the clip (not resolving) is OUR fault — distinct from the encode-failure degrade, which stays 200 (Decision 3)', async () => {
    srv = await startHttpServer(
      0,
      fakeClipDeps({
        renderClip: async () => {
          throw new Error('page crashed mid-capture');
        },
      }),
    );
    const res = await postJson(clipUrl(srv), {
      location: { lng: 106.7, lat: 10.78, zoom: 14 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      motion: { preset: 'pushIn' },
    });
    expect(res.status).toBe(500);
    const body = (await res.json()) as ClipResBody;
    expect(body.ok).toBe(false);
    expect(body.error).toMatch(/page crashed mid-capture/);
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
          return { frames: [PNG_1x1], settle: PNG_1x1, anchors: fakeAnchors(cfg) };
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

// ── Lối bất đồng bộ: POST /jobs + POST /jobs/status ────────────────────────
import { createJobStore } from './jobStore';
import { createJobRunner } from './jobRunner';

describe('POST /jobs + POST /jobs/status', () => {
  let server: HttpServer | undefined;
  let sink: string;
  let base: string;

  const submit = (body: unknown) =>
    fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const ask = (id: unknown) =>
    fetch(`${base}/jobs/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });

  async function boot(over: { maxQueued?: number; render?: ToolDeps['render']; clip?: boolean } = {}) {
    sink = await fsp.mkdtemp(`${tmpdir()}/mapposter-http-jobs-`);
    const store = createJobStore({ maxQueued: over.maxQueued });
    const deps = {
      sinkDir: sink,
      defaultDelivery: 'url',
      render: over.render ?? (async () => PNG_1x1),
      ...(over.clip
        ? {
            renderClip: async (cfg: RenderConfig) => ({ frames: [PNG_1x1], settle: PNG_1x1, anchors: fakeAnchors(cfg) }),
            encodeAnimation: async (_f: Buffer[], opts: { outPath: string }) => {
              await fsp.writeFile(opts.outPath, Buffer.from('mp4!'));
              return opts.outPath;
            },
          }
        : {}),
    } as unknown as ToolDeps;
    const runner = createJobRunner({ store, deps, workers: 1 });
    server = await startHttpServer(0, deps, '127.0.0.1', { allowedHosts: [], allowedOrigins: [] }, undefined, { store, runner });
    base = server.url.replace(/\/mcp$/, '');
    return { store, runner };
  }

  afterEach(async () => {
    await server?.close();
    server = undefined;
    await fsp.rm(sink, { recursive: true, force: true });
  });

  it('AC-1: nhận việc trả 202 + mã, và hỏi NGAY đã thấy — không cửa sổ trống', async () => {
    await boot();
    const res = await submit({ kind: 'render', params: { location: 'Đà Nẵng' } });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe('string');
    // `status` nằm trong hình dạng thân 202 mà AC-1 hứa. Không khẳng định nó thì
    // bỏ hẳn trường khỏi phản hồi vẫn xanh.
    expect(body.status).toBe('queued');

    const askRes = await ask(body.id);
    expect(askRes.status).toBe(200);
    const first = await askRes.json();
    // KHÔNG chấp nhận 'done': mệnh đề của AC-1 là "hỏi NGAY thì việc đã có mặt
    // và CHƯA xong". Nới biên sang 'done' làm khẳng định hết phân biệt — một
    // runner chạy đồng bộ ngay trong tay POST cũng lọt.
    expect(['queued', 'running']).toContain(first.status);
    expect(first.id).toBe(body.id);
  });

  it('AC-1: tên có dấu đi qua sổ rồi ra phản hồi, GIỮ NGUYÊN TỪNG KÝ TỰ', async () => {
    const { store, runner } = await boot();
    const NAME = 'Đà Nẵng';
    const id = (await (await submit({ kind: 'render', params: { location: NAME } })).json()).id;

    // chặng 1 — cửa HTTP giải JSON rồi ghi vào sổ: không hỏng mã hoá, không NFC/NFD hoá
    expect((store.get(id)!.params as { location: string }).location).toBe(NAME);
    expect([...(store.get(id)!.params as { location: string }).location]).toEqual([...NAME]);

    runner.kick();
    await runner.drain();

    // chặng 2 — sổ ra phản hồi
    const done = await (await ask(id)).json();
    expect(done.status).toBe('done');
    expect(done.resolved.place.name).toBe(NAME);
  });

  it('AC-2: thân sai khuôn → 400 câu đọc được, và KHÔNG bản ghi nào được tạo', async () => {
    const { store } = await boot();
    const bads: unknown[] = [
      { kind: 'render' },                                             // thiếu params
      { kind: 'render', params: { location: { lng: 999, lat: 0 } } }, // kinh độ ngoài dải
      // AC-2 nói "zoom ngoài dải → 400", nhưng bảng này trước đây chỉ có kinh
      // độ — không ca nào chạm `zoomLevel` (z.number().min(0).max(22)). Zoom
      // đi vào qua HAI cửa khác nhau, nên cả hai đều phải có ca:
      { kind: 'render', params: { location: { lng: 106.7, lat: 10.78, zoom: 99 } } }, // zoom trong location
      { kind: 'render', params: { location: 'x', camera: { zoom: 99 } } },            // zoom trong camera
      { kind: 'render', params: { location: 'x', camera: { zoom: -1 } } },            // và đầu dưới của dải
      { kind: 'la-lam', params: { location: 'x' } },                  // loại việc lạ
      { kind: 'clip', params: { location: 'x' } },                    // clip mà thiếu motion
    ];
    for (const bad of bads) {
      const res = await submit(bad);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(typeof body.error).toBe('string');
      expect(body.error).not.toMatch(/^\[\s*\{/); // không phải ZodError thô
    }
    expect(store.size()).toBe(0);
  });

  it('AC-3: hàng chờ đầy → 429 và sổ KHÔNG tăng', async () => {
    // Việc đầu chiếm thợ mãi mãi, việc thứ hai lấp chỗ chờ duy nhất.
    const { store } = await boot({ maxQueued: 1, render: (() => new Promise(() => {})) as unknown as ToolDeps['render'] });
    expect((await submit({ kind: 'render', params: { location: 'A' } })).status).toBe(202);
    expect((await submit({ kind: 'render', params: { location: 'B' } })).status).toBe(202);
    const before = store.size();

    const res = await submit({ kind: 'render', params: { location: 'C' } });
    expect(res.status).toBe(429);
    expect(store.size()).toBe(before);
  });

  it('AC-4: mã lạ → 404, không đoán', async () => {
    await boot();
    for (const id of ['khong-ton-tai', 42, null]) {
      const res = await ask(id);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.ok).toBe(false);
      // Mệnh đề "KHÔNG ca nào trả 200 với trạng thái rỗng/undefined" cần được
      // canh gác thật: một cửa trả 200 kèm `status: undefined` cũng thoả
      // `ok === false` nếu chỉ kiểm ok.
      expect(body.status).toBeUndefined();
    }
  });

  it('AC-4: mã ĐÃ BỊ DỌN cũng trả 404 — không phải 200 với trạng thái rỗng', async () => {
    // ttl 0 nên bản ghi vừa kết thúc là đã quá hạn giữ ngay nhịp quét kế tiếp.
    sink = await fsp.mkdtemp(`${tmpdir()}/mapposter-http-jobs-`);
    const store = createJobStore({ ttlMs: 0 });
    const deps = { sinkDir: sink, defaultDelivery: 'url', render: async () => PNG_1x1 } as unknown as ToolDeps;
    const runner = createJobRunner({ store, deps, workers: 1 });
    server = await startHttpServer(0, deps, '127.0.0.1', { allowedHosts: [], allowedOrigins: [] }, undefined, { store, runner });
    base = server.url.replace(/\/mcp$/, '');

    const id = (await (await submit({ kind: 'render', params: { location: 'Huế' } })).json()).id;
    runner.kick();
    await runner.drain();
    // trước khi dọn: mã có thật, hỏi ra 200
    expect((await ask(id)).status).toBe(200);

    // sổ bỏ bản ghi đã quá hạn giữ
    expect(store.takeExpired(Date.now() + 1).map((r) => r.id)).toContain(id);

    const res = await ask(id);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.status).toBeUndefined();
  });

  it('AC-5 đầu-cuối: việc xong trả base64 ĐÚNG byte thợ đã ghi', async () => {
    const { store, runner } = await boot();
    const id = (await (await submit({ kind: 'render', params: { location: 'Thừa Thiên Huế' } })).json()).id;
    runner.kick();
    await runner.drain();

    const body = await (await ask(id)).json();
    expect(body.status).toBe('done');
    expect(Buffer.from(body.image.base64, 'base64')).toEqual(PNG_1x1);
    // và đúng tệp THỢ ghi, không phải tệp test tự đặt sẵn
    await expect(fsp.readFile(store.get(id)!.artifacts[0].path)).resolves.toEqual(PNG_1x1);

    // width/height mà AC-5 nêu đích danh — `toBeDefined()` trên riêng `resolved`
    // để lọt cả một khối rỗng lẫn một khối thiếu hẳn hai trường kích thước.
    const art = store.get(id)!.artifacts[0];
    expect(body.image.width).toBe(art.width);
    expect(body.image.height).toBe(art.height);
    expect(typeof body.image.width).toBe('number');
    expect(typeof body.image.height).toBe('number');

    // và khối resolved CÙNG HÌNH DẠNG resolvedOf. Hai vế, vì mỗi vế bắt một lỗi
    // khác: (1) cửa đưa nguyên khối sổ giữ ra, không cắt xén dọc đường;
    // (2) khối đó mang đủ bộ trường resolvedOf hứa — bỏ sót một trường ở nguồn
    // là đỏ, chứ không trôi qua như `toBeDefined()` cũ.
    expect(body.resolved).toEqual(store.get(id)!.resolved);
    for (const k of ['center', 'zoom', 'place', 'theme', 'chrome', 'highlights']) {
      expect(Object.keys(body.resolved)).toContain(k);
    }
  });

  it('bề mặt thứ ba: một việc CLIP xong thì /jobs/status trả resolved.camera + resolved.anchors (PR #6)', async () => {
    const { runner } = await boot({ clip: true });
    const id = (
      await (
        await submit({
          kind: 'clip',
          params: { location: { lng: 106.7, lat: 10.78, zoom: 14 }, highlight: { points: [{ lng: 106.7, lat: 10.78 }] } },
          motion: { preset: 'pushIn' },
        })
      ).json()
    ).id;
    runner.kick();
    await runner.drain();

    const body = await (await ask(id)).json();
    expect(body.status).toBe('done');
    expect(body.resolved.camera).toBeDefined();
    // fakeAnchors đặt zoom = cfg.camera.zoom + 1: nếu jobRunner echo `cfg.camera`
    // (hoặc anchors của MỘT việc khác) thì đẳng thức này vỡ.
    expect(body.resolved.camera.zoom).toBe(body.resolved.zoom + 1);
    expect(body.resolved.anchors.points).toEqual([{ index: 0, lng: 106.7, lat: 10.78, xPct: 25, yPct: 75, onScreen: true }]);
  });

  it('AC-6: việc hỏng vẫn hỏi ra HTTP 200 — mã nói về câu hỏi, thân nói về việc', async () => {
    const { runner } = await boot({
      render: (async () => {
        throw new Error('trình duyệt chết');
      }) as ToolDeps['render'],
    });
    const id = (await (await submit({ kind: 'render', params: { location: 'Hà Nội' } })).json()).id;
    runner.kick();
    await runner.drain();

    const res = await ask(id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.errorKind).toBe('server');
  });

  it('AC-6: việc hỏng vì TRA TOẠ ĐỘ thất bại — vẫn 200, nhưng errorKind nói lỗi tại NGƯỜI GỌI', async () => {
    // Cặp với ca trên. Chỉ có một trong hai thì `errorKind` không chứng minh
    // được gì: một hiện thực đóng cứng 'server' cho MỌI lỗi vẫn xanh. Hai ca
    // cạnh nhau mới làm nó phân biệt được caller-fault vs server-fault.
    const { runner } = await boot();
    const id = (await (await submit({ kind: 'render', params: { location: 'zzz-khong-co-thuc' } })).json()).id;
    runner.kick();
    await runner.drain();

    const res = await ask(id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.errorKind).toBe('input');
    expect(body.errorKind).not.toBe('server');
    expect(body.error).toMatch(/No geocoding result/);
  });

  it('hỏi lặp cùng một mã luôn ra cùng câu trả lời', async () => {
    const { runner } = await boot();
    const id = (await (await submit({ kind: 'render', params: { location: 'Cần Thơ' } })).json()).id;
    runner.kick();
    await runner.drain();

    const a = await (await ask(id)).json();
    const b = await (await ask(id)).json();
    expect(b).toEqual(a);
  });
});

describe('AC-13: CÙNG một bảng ca guard cho cả ba cửa', () => {
  const DOORS = ['/render', '/jobs', '/jobs/status'];
  let server: HttpServer | undefined;
  let sink: string;
  let base: string;
  let store: ReturnType<typeof createJobStore>;

  beforeEach(async () => {
    process.env.MAPPOSTER_TOKEN = 'the-dung';
    sink = await fsp.mkdtemp(`${tmpdir()}/mapposter-guard-`);
    store = createJobStore();
    const deps = { sinkDir: sink, defaultDelivery: 'url', render: async () => PNG_1x1 } as unknown as ToolDeps;
    const runner = createJobRunner({ store, deps, workers: 1 });
    server = await startHttpServer(0, deps, '127.0.0.1', { allowedHosts: [], allowedOrigins: [] }, 200, { store, runner });
    base = server.url.replace(/\/mcp$/, '');
  });

  afterEach(async () => {
    await server?.close();
    server = undefined;
    await fsp.rm(sink, { recursive: true, force: true });
    delete process.env.MAPPOSTER_TOKEN;
  });

  const call = (door: string, headers: Record<string, string>, body: string) =>
    fetch(`${base}${door}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });

  const SMALL = JSON.stringify({ kind: 'render', params: { location: 'x' }, id: 'x', location: 'x' });

  it.each(DOORS)('%s — không thẻ thì 401 và sổ việc không tăng', async (door) => {
    const res = await call(door, {}, SMALL);
    expect(res.status).toBe(401);
    expect(store.size()).toBe(0);
  });

  it.each(DOORS)('%s — thẻ sai thì 401 và sổ việc không tăng', async (door) => {
    const res = await call(door, { authorization: 'Bearer sai-be-bet' }, SMALL);
    expect(res.status).toBe(401);
    expect(store.size()).toBe(0);
  });

  it.each(DOORS)('%s — thân vượt trần thì bị chặn TRƯỚC khi tạo việc', async (door) => {
    const huge = JSON.stringify({ kind: 'render', params: { location: 'x'.repeat(5000) }, id: 'x', location: 'x'.repeat(5000) });
    const res = await call(door, { authorization: 'Bearer the-dung' }, huge);
    expect(res.status).toBe(413);
    expect(store.size()).toBe(0);
  });
});
