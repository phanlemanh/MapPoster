import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { startAppServer, type AppServer } from './appServer';
import { createPool, type Pool } from './browserPool';
import { createConfigStore, type ConfigStore } from './configStore';
import { renderFrame, renderClipFrames } from './renderFrame';
import { loadServerConfig } from '../config';
import type { RenderConfig } from '../../src/render/renderConfig';
import type { ClipAnchors } from '../../src/render/anchors';

// Heavy: builds the app + launches a browser + loads tiles from the network.
// Gated so the default `npm test` stays fast and offline. Run with:
//   MCP_INTEGRATION=1 npx vitest run mcp-server/src/renderFrame.test.ts
const RUN = process.env.MCP_INTEGRATION === '1';
const suite = RUN ? describe : describe.skip;

suite('renderFrame (integration)', () => {
  let app: AppServer;
  let pool: Pool;
  let configStore: ConfigStore;

  beforeAll(async () => {
    // --mode production + explicit NODE_ENV override (Finding H): pinned so
    // this integration build behaves the same as the real deployment path
    // regardless of vitest's own NODE_ENV=test — measured, `--mode` ALONE is
    // not enough on this Vite version (8.1.4): an inherited NODE_ENV wins for
    // import.meta.env.DEV/PROD, which would otherwise leave the test-only
    // fault-injection hook (src/render/main.tsx) in a dist meant to exercise
    // the production path.
    execSync('npx vite build --mode production', { stdio: 'inherit', env: { ...process.env, NODE_ENV: 'production' } }); // produce dist/ incl render.html
    const cfg = loadServerConfig({ ...process.env, MAPPOSTER_APP_PORT: '0' } as NodeJS.ProcessEnv);
    configStore = createConfigStore();
    app = await startAppServer(cfg, configStore);
    pool = await createPool(1);
  }, 180_000);

  afterAll(async () => {
    await pool?.close();
    await app?.close();
  });

  const baseConfig = (width: number, height: number, theme = 'midnight-blue'): RenderConfig => ({
    camera: { center: [106.7, 10.78], zoom: 12 },
    size: { width, height },
    theme,
    chrome: 'clean',
    place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 },
  });

  it('renders a resolved config to an exact-size PNG (AC-1, AC-10)', async () => {
    const png = await renderFrame(baseConfig(1080, 1920), { appUrl: app.url, pool, configStore });
    expect(png.length).toBeGreaterThan(2000);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature
    expect(png.readUInt32BE(16)).toBe(1080); // IHDR width
    expect(png.readUInt32BE(20)).toBe(1920); // IHDR height
  }, 60_000);

  /**
   * Regression for the config-in-URL defect. The config used to ride in the query
   * string, so the whole render was capped at Node's default 16 KB request head.
   * Measured: the boundary polygon for "Ho Chi Minh City" encodes to 20,698 bytes
   * — the app server answered 431, the page never loaded, and renderFrame waited
   * out its full 20 s timeout before failing with an opaque message. Region
   * highlighting was broken for anything bigger than a district, and nine review
   * rounds missed it because every eval used "Quận 3" (876 bytes).
   */
  it('renders a config far larger than a URL could carry (>16 KB)', async () => {
    const ring: [number, number][] = Array.from({ length: 2_000 }, (_, i) => {
      const t = (i / 2000) * Math.PI * 2;
      return [106.7 + Math.cos(t) * 0.2, 10.78 + Math.sin(t) * 0.2];
    });
    ring.push(ring[0]);

    const cfg: RenderConfig = {
      ...baseConfig(600, 600),
      highlight: {
        regions: [{ geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }] }, color: null }],
        color: null,
        fill: true,
        dim: false,
      },
    };
    expect(Buffer.byteLength(JSON.stringify(cfg))).toBeGreaterThan(16 * 1024);

    const png = await renderFrame(cfg, { appUrl: app.url, pool, configStore });
    expect(png.readUInt32BE(16)).toBe(600);
    expect(png.readUInt32BE(20)).toBe(600);
    expect(configStore.size()).toBe(0); // the entry was released
  }, 60_000);

  // Regression for the stale-frame defect: the pool (size 1) hands the SAME page
  // back for the second render. With the config in the URL hash this was a
  // same-document navigation, so the page never reloaded and returned render #1's
  // frame. Every prior test rendered exactly once on a fresh page, so none saw it.
  it('a reused pooled page renders each config fresh, never a stale frame (F1 / AC-5)', async () => {
    const first = await renderFrame(baseConfig(1080, 1920), { appUrl: app.url, pool, configStore });
    const second = await renderFrame(baseConfig(1080, 1080, 'ocean'), { appUrl: app.url, pool, configStore });

    expect(first.readUInt32BE(16)).toBe(1080);
    expect(first.readUInt32BE(20)).toBe(1920);
    expect(second.readUInt32BE(16)).toBe(1080);
    expect(second.readUInt32BE(20)).toBe(1080); // would be 1920 if the page went stale
    expect(Buffer.compare(first, second)).not.toBe(0);
  }, 90_000);
});

/**
 * KHÔNG gated: cùng câu hỏi mà bộ integration ở trên trả lời bằng một trình
 * duyệt thật, nhưng ở đây trang được thay bằng một `__mapposter` giả và
 * `page.evaluate` chạy thẳng callback trong jsdom. Đổi lại vài chục giây lấy
 * một thứ integration KHÔNG nói được: `anchors()` có được GỌI hay không.
 *
 * Đó là khác biệt then chốt giữa "bỏ qua vì biết trước" và "gọi rồi nuốt lỗi":
 * hai cách cho ra cùng một chuỗi `anchorsUnavailable`, nhưng cách thứ hai đặt
 * một `catch` quanh `anchors()` và nuốt luôn chốt camera-ở-restAtSec.
 */
describe('renderClipFrames — nhánh anchorsUnavailable (trang giả)', () => {
  const PNG_1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const DATA_URL = `data:image/png;base64,${PNG_1x1.toString('base64')}`;
  const KEY = 'fake-config-key';

  const ANCHORS: ClipAnchors = {
    camera: { center: [106.7, 10.78], zoom: 13, bearing: 0, pitch: 0 },
    points: [{ index: 0, lng: 106.7, lat: 10.78, xPct: 50, yPct: 50, onScreen: true }],
    regions: [],
  };

  const clipConfig = (pitch?: number): RenderConfig => ({
    camera: { center: [106.7, 10.78], zoom: 13, ...(pitch != null ? { pitch } : {}) },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }],
    motion: {
      fps: 4,
      durationSec: 1,
      restAtSec: 0.75,
      camera: [{ t: 0, center: [106.7, 10.78], zoom: 13 }],
      tracks: [],
    },
  });

  /** Trang giả + đếm số lần `anchors()` thật sự được gọi. */
  function harness() {
    const calls = { anchors: 0, motionFrames: 0 };
    // `page.evaluate(fn, arg)` ở đây gọi thẳng `fn(arg)` trong jsdom, nên
    // callback đọc `window.__mapposter` đúng như trong trình duyệt thật.
    (window as unknown as { __mapposter: unknown }).__mapposter = {
      configKey: KEY,
      ready: Promise.resolve(),
      prefetchMotion: async () => {},
      renderMotionFrame: async () => {
        calls.motionFrames++;
        return { dataUrl: DATA_URL };
      },
      anchors: () => {
        calls.anchors++;
        return ANCHORS;
      },
    };
    const page = {
      goto: async () => {},
      waitForFunction: async () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      evaluate: async (fn: (arg?: unknown) => unknown, arg?: unknown) => fn(arg),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const deps = {
      appUrl: 'http://fake',
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pool: { acquire: async () => page, release: () => {}, discard: () => {}, healthy: () => true, close: async () => {} } as any,
      configStore: { put: () => KEY, get: () => undefined, drop: () => {}, size: () => 0 },
    };
    return { calls, deps };
  }

  it('pitch 0: đo anchors, gọi anchors() ĐÚNG một lần, không có anchorsUnavailable', async () => {
    const { calls, deps } = harness();
    const out = await renderClipFrames(clipConfig(), deps);

    expect(out.frames).toHaveLength(4); // fps 4 × 1s
    expect(calls.anchors).toBe(1);
    expect(out.anchors).toEqual(ANCHORS);
    expect(out.anchorsUnavailable).toBeUndefined();
  });

  it('pitch 30: clip render ĐỦ khung + settle, anchors() KHÔNG hề được gọi, lý do nêu đích danh pitch', async () => {
    const { calls, deps } = harness();
    const out = await renderClipFrames(clipConfig(30), deps);

    // Năng lực cũ không bị gỡ: đủ khung, đủ settle.
    expect(out.frames).toHaveLength(4);
    expect(out.settle).toEqual(PNG_1x1);
    expect(calls.motionFrames).toBe(5); // 4 khung + 1 settle

    // Bỏ QUA, không phải gọi-rồi-nuốt-lỗi: một `catch` quanh anchors() cho ra
    // cùng chuỗi này nhưng cũng nuốt luôn chốt camera-ở-restAtSec.
    expect(calls.anchors).toBe(0);
    expect(out.anchors).toBeUndefined();
    expect(out.anchorsUnavailable).toMatch(/pitch/i);
    expect(out.anchorsUnavailable).toMatch(/30/);
  });

  it('không bao giờ có CẢ HAI, và không bao giờ KHÔNG CÓ GÌ', async () => {
    for (const pitch of [undefined, 0, 15, 60]) {
      const { deps } = harness();
      const out = await renderClipFrames(clipConfig(pitch), deps);
      const hasAnchors = out.anchors !== undefined;
      const hasReason = out.anchorsUnavailable !== undefined;
      expect(hasAnchors !== hasReason, `pitch=${pitch}: anchors=${hasAnchors}, anchorsUnavailable=${hasReason}`).toBe(true);
    }
  });
});
