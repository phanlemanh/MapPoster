import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { startAppServer, type AppServer } from './appServer';
import { createPool, type Pool } from './browserPool';
import { createConfigStore, type ConfigStore } from './configStore';
import { renderClipFrames } from './renderFrame';
import { loadServerConfig } from '../config';
import type { RenderConfig } from '../../src/render/renderConfig';

// Heavy: builds the app + launches a browser + loads tiles from the network.
// Gated so the default `npm test` stays fast and offline. Run with:
//   MCP_INTEGRATION=1 npx vitest run --fileParallelism=false mcp-server/src/renderClip.test.ts
const RUN = process.env.MCP_INTEGRATION === '1';
const suite = RUN ? describe : describe.skip;

suite('renderClipFrames (integration)', () => {
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

  const SQUARE = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [106.69, 10.77],
              [106.71, 10.77],
              [106.71, 10.79],
              [106.69, 10.79],
              [106.69, 10.77],
            ],
          ],
        },
      },
    ],
  };

  const config: RenderConfig = {
    camera: { center: [106.7, 10.78], zoom: 13 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    highlight: { regions: [{ geojson: SQUARE, color: null }], color: null, fill: true, dim: false },
    markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }],
    motion: {
      fps: 12,
      durationSec: 2,
      restAtSec: 1.4,
      camera: [
        { t: 0, center: [106.7, 10.78], zoom: 11.5 },
        { t: 1.1, center: [106.7, 10.78], zoom: 13, ease: 'easeInOut' },
      ],
      tracks: [
        { kind: 'regionReveal', t0: 0.4, t1: 1.0 },
        { kind: 'pinDrop', at: 1.1, dur: 0.3 },
      ],
    },
  };

  it('renders fps×duration frames plus a settle still (AC-5)', async () => {
    const start = Date.now();
    const { frames, settle } = await renderClipFrames(config, { appUrl: app.url, pool, configStore });
    const elapsedMs = Date.now() - start;
    // eslint-disable-next-line no-console
    console.error(`[timing] 24 frames @ 320x568 took ${elapsedMs}ms (${(elapsedMs / 24).toFixed(1)}ms/frame)`);

    expect(frames).toHaveLength(24); // 12 × 2
    for (const f of frames) {
      expect(f.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])); // PNG magic
    }
    expect(settle.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    // first frame (flying) differs from the last frame (rest)
    expect(frames[0].equals(frames[frames.length - 1])).toBe(false);
  }, 120_000);

  it('is deterministic — the same config twice yields byte-identical frames (AC-5)', async () => {
    const a = await renderClipFrames(config, { appUrl: app.url, pool, configStore });
    const b = await renderClipFrames(config, { appUrl: app.url, pool, configStore });
    expect(a.frames.length).toBe(b.frames.length);
    for (let i = 0; i < a.frames.length; i++) {
      expect(a.frames[i].equals(b.frames[i]), `frame ${i}`).toBe(true);
    }
    expect(a.settle.equals(b.settle)).toBe(true);
  }, 240_000);

  it('trả anchors đo tại restAtSec cùng với khung (PR #6)', async () => {
    const { anchors } = await renderClipFrames(config, { appUrl: app.url, pool, configStore });

    // camera nghỉ = keyframe cuối (zoom 13 tại t=1.1, restAtSec=1.4 ⇒ clamp)
    expect(anchors.camera.zoom).toBeCloseTo(13, 6);
    expect(anchors.camera.center[0]).toBeCloseTo(106.7, 6);
    expect(anchors.camera.pitch).toBe(0);

    // marker trùng tâm camera ⇒ đúng giữa khung trên CẢ HAI trục
    expect(anchors.points).toHaveLength(1);
    expect(anchors.points[0]).toMatchObject({ index: 0, lng: 106.7, lat: 10.78, onScreen: true });
    expect(anchors.points[0].xPct).toBeCloseTo(50, 1);
    expect(anchors.points[0].yPct).toBeCloseTo(50, 1);

    // vùng vuông quanh tâm ⇒ hộp bao ôm lấy 50%/50%
    expect(anchors.regions).toHaveLength(1);
    const [x0, y0, x1, y1] = anchors.regions[0].bboxPct;
    expect(x0).toBeLessThan(50);
    expect(x1).toBeGreaterThan(50);
    expect(y0).toBeLessThan(50);
    expect(y1).toBeGreaterThan(50);
  }, 120_000);

  it('từ chối pitch != 0 TRƯỚC khi tiêu một khung nào, nêu đích danh pitch', async () => {
    await expect(
      renderClipFrames({ ...config, camera: { ...config.camera, pitch: 45 } }, { appUrl: app.url, pool, configStore }),
    ).rejects.toThrow(/pitch/i);
  });

  it('throws a clear error when config has no motion script', async () => {
    await expect(renderClipFrames({ ...config, motion: undefined }, { appUrl: app.url, pool, configStore })).rejects.toThrow(/no motion/i);
  });
});
