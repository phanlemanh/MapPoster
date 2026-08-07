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
  it('AC-11: layers / detail / font CHẠM TỚI PIXEL THẬT, không dừng ở resolver', async () => {
    // Ba tham số đầu bảng của hợp đồng Tier-0 không xuất hiện trong BẤT KỲ tệp
    // nào của `test:mcp` trước đây — chúng chỉ được kiểm ở tầng resolver, tức
    // "config mang đúng giá trị", chứ chưa ai chứng minh trang render đọc tới.
    // Phép kiểm mạnh nhất ở lane này: cùng một khung, đổi tham số thì PIXEL
    // phải khác. Một tham số bị bỏ qua trên đường render cho ra PNG TRÙNG BYTE.
    const opts = { appUrl: app.url, pool, configStore };
    const base = baseConfig(600, 600);
    const png = (cfg: RenderConfig): Promise<Buffer> => renderFrame(cfg, opts);

    const plain = await png(base);

    // NEO CHỐNG PASS RỖNG: mọi khẳng định dưới đây có dạng "hai PNG KHÁC nhau".
    // Nếu render vốn không xác định thì chúng khác nhau bất kể tham số, và cả ca
    // test thành vô nghĩa mà vẫn xanh. Chứng minh cùng config cho ra ĐÚNG cùng
    // byte trước, rồi mọi khác biệt phía sau mới quy được về tham số.
    expect((await png(base)).equals(plain), 'render KHÔNG xác định — mọi so sánh dưới đây vô nghĩa').toBe(true);

    // layers: tắt nước + đường + nhà thì bức ảnh phải đổi hẳn
    const noLayers = await png({ ...base, layers: { water: false, roads: false, buildings: false } });
    expect(noLayers.equals(plain), 'layers không chạm tới pixel').toBe(false);

    // detail: mức chi tiết khác nhau vẽ ra lượng hình khác nhau
    const coarse = await png({ ...base, detail: 0 });
    expect(coarse.equals(plain), 'detail không chạm tới pixel').toBe(false);

    // font: đổi mặt chữ phải đổi pixel — nhưng CHỈ khi có chữ trên khung, nên
    // dùng chrome 'poster' để tiêu đề địa danh thật sự được vẽ.
    const titled = { ...base, chrome: 'poster' as const };
    const fontA = await png({ ...titled, font: 'Space Grotesk' });
    const fontB = await png({ ...titled, font: 'Playfair Display' });
    expect(fontB.equals(fontA), 'font không chạm tới pixel').toBe(false);

    // --- marker icon / color / size, và màu RIÊNG của vùng --------------
    // Bốn trường còn lại mà hợp đồng nói là "engine đã tiêu thụ từ lâu nhưng
    // không tham số tool nào chạm tới": RenderMarker.{icon,color,size} và
    // RenderHighlightRegion.color. Ở tầng resolver chúng đã có người gác, còn
    // ở đây phải chứng minh trang render ĐỌC TỚI — cùng phép kiểm: đổi trường
    // thì PNG phải khác byte.
    const withMarker = (icon: 'pin' | 'heart', color: string, markerSize: number): RenderConfig => ({
      ...base,
      markers: [{ lng: 106.7, lat: 10.78, icon, color, size: markerSize }],
    });
    const markerBase = await png(withMarker('pin', '#f43f5e', 44));
    expect(markerBase.equals(plain), 'markers không được vẽ gì cả').toBe(false);

    const markerColor = await png(withMarker('pin', '#22d3ee', 44));
    expect(markerColor.equals(markerBase), 'marker.color không chạm tới pixel').toBe(false);

    const markerSize = await png(withMarker('pin', '#f43f5e', 96));
    expect(markerSize.equals(markerBase), 'marker.size không chạm tới pixel').toBe(false);

    const markerIcon = await png(withMarker('heart', '#f43f5e', 44));
    expect(markerIcon.equals(markerBase), 'marker.icon không chạm tới pixel').toBe(false);

    // màu RIÊNG của một vùng: cùng polygon, chỉ đổi `color` của chính nó.
    const ring: [number, number][] = [
      [106.65, 10.74], [106.75, 10.74], [106.75, 10.82], [106.65, 10.82], [106.65, 10.74],
    ];
    const withRegion = (color: string): RenderConfig => ({
      ...base,
      highlight: {
        regions: [{ geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [ring] } }] } as never, color }],
        color: null,
        fill: true,
        dim: false,
      },
    });
    const regionRed = await png(withRegion('#ff0000'));
    const regionGreen = await png(withRegion('#00ff00'));
    expect(regionRed.equals(plain), 'highlight.regions không được vẽ gì cả').toBe(false);
    expect(regionGreen.equals(regionRed), 'màu riêng của region không chạm tới pixel').toBe(false);

    // và mọi biến thể vẫn là PNG đúng kích thước — đổi tham số không được làm hỏng khung
    for (const b of [noLayers, coarse, fontA, fontB, markerBase, markerColor, markerSize, markerIcon, regionRed, regionGreen]) {
      expect(b.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
      expect(b.readUInt32BE(16)).toBe(600);
      expect(b.readUInt32BE(20)).toBe(600);
    }
  }, 120_000);

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

/**
 * KHÔNG gated. Chốt "trang dùng lại nạp lại đúng config" (F1 / AC-5) sống ở
 * khối integration phía trên, mà khối đó là `describe.skip` dưới `npm test` —
 * lane của E5 (mcp-map-render) chạy đúng `npm test`, nên phép kiểm ấy được bộ
 * reporter ghi là SKIPPED và mệnh đề "no stale frame" của E5 không có ai canh
 * trong chính lane của nó.
 *
 * Ở đây trang được thay bằng một `__mapposter` giả nên hai CƠ CHẾ giữ tính
 * chất đó đo được offline, trong vài mili giây:
 *   1. id config đi bằng QUERY param — `#configId=` là điều hướng cùng tài
 *      liệu, trang không nạp lại và trả lại khung của lần render trước.
 *   2. trang nạp xong phải TỰ KHAI đúng key; khai sai thì ném to tiếng và
 *      trang bị VỨT khỏi hồ, chứ không trả ảnh sai một cách lặng lẽ.
 */
describe('renderFrame — trang dùng lại phải nạp lại đúng config (F1 / AC-5, trang giả)', () => {
  const PNG_1x1 = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
  );
  const KEY = 'cfg-key-1';

  function harness(reportedKey: string) {
    const gotoUrls: string[] = [];
    const released: unknown[] = [];
    const discarded: unknown[] = [];
    (window as unknown as { __mapposter: unknown }).__mapposter = {
      configKey: reportedKey,
      ready: Promise.resolve(),
      renderFrame: async () => ({ dataUrl: `data:image/png;base64,${PNG_1x1.toString('base64')}` }),
    };
    const page = {
      goto: async (url: string) => {
        gotoUrls.push(url);
      },
      waitForFunction: async () => {},
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      evaluate: async (fn: (arg?: unknown) => unknown, arg?: unknown) => fn(arg),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;
    const deps = {
      appUrl: 'http://fake',
      pool: {
        acquire: async () => page,
        release: (p: unknown) => released.push(p),
        discard: (p: unknown) => discarded.push(p),
        healthy: () => true,
        close: async () => {},
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
      configStore: { put: () => KEY, get: () => undefined, drop: () => {}, size: () => 0 },
    };
    return { gotoUrls, released, discarded, deps };
  }

  const cfg = (): RenderConfig => ({
    camera: { center: [106.7, 10.78], zoom: 12 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
  });

  it('id config đi bằng QUERY param, KHÔNG phải hash — hash là điều hướng cùng tài liệu', async () => {
    const { gotoUrls, released, discarded, deps } = harness(KEY);
    const png = await renderFrame(cfg(), deps);

    expect(png.equals(PNG_1x1)).toBe(true);
    expect(gotoUrls).toHaveLength(1);
    const url = new URL(gotoUrls[0]);
    expect(url.searchParams.get('configId')).toBe(KEY);
    expect(url.hash, 'config trong hash ⇒ trang không nạp lại ⇒ khung cũ').toBe('');
    // Lần render trót lọt trả trang về hồ, không vứt.
    expect(released).toHaveLength(1);
    expect(discarded).toHaveLength(0);
  });

  it('trang khai SAI key ⇒ ném to tiếng và bị vứt khỏi hồ, không trả khung cũ', async () => {
    // Đây là chốt thứ hai, độc lập với chốt query param: kể cả khi điều hướng
    // vì lý do nào đó không nạp lại, hàm vẫn không được trả ảnh của config
    // trước. Gỡ so sánh `loadedKey !== key` làm ca này đỏ.
    const { released, discarded, deps } = harness('config-cua-lan-truoc');

    await expect(renderFrame(cfg(), deps)).rejects.toThrow(/stale page/i);
    expect(discarded).toHaveLength(1);
    expect(released).toHaveLength(0);
  });
});
