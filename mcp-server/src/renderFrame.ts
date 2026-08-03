import type { RenderConfig } from '../../src/render/renderConfig';
import type { Pool } from './browserPool';
import type { ConfigStore } from './configStore';

export interface RenderDeps {
  /** base URL of the served app (from startAppServer) */
  appUrl: string;
  pool: Pool;
  /** hands the config to the page out-of-band; the URL carries only its id */
  configStore: ConfigStore;
}

/**
 * The single render primitive: drive the headless render mode with a fully
 * resolved config and return the composed PNG as a Buffer. Every MCP tool
 * routes through here (keeps a future native engine swap non-breaking).
 *
 * The config's ID travels as a QUERY param so that a reused pooled page performs
 * a real document reload (a hash-only change would be a same-document navigation
 * and the page would silently re-serve the previous frame). We additionally
 * assert the loaded page reports our exact config key before composing, so a
 * stale page fails loudly instead of returning the wrong image. The payload
 * itself is fetched from the app server — see configStore.ts for why.
 */
export interface AnimationPulse {
  rings?: number;
  radiusScale?: number;
  color?: string;
}

/**
 * Capture a whole radar-pulse sequence from ONE page load: the map renders
 * once, then each frame is a cheap 2D composite at phase t = i/frames. Same
 * lifecycle contract as renderFrame — a failure poisons the page, so discard it.
 */
export async function renderAnimationFrames(
  config: RenderConfig,
  opts: { frames: number; pulse?: AnimationPulse },
  deps: RenderDeps,
): Promise<Buffer[]> {
  const page = await deps.pool.acquire();
  const key = deps.configStore.put(JSON.stringify(config));
  let broken = false;
  try {
    await page.goto(`${deps.appUrl}/render.html?configId=${key}`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, {
      timeout: 20_000,
    });
    const loadedKey = await page.evaluate(() => (window as unknown as { __mapposter: { configKey: string } }).__mapposter.configKey);
    if (loadedKey !== key) {
      throw new Error('render mode: page did not reload with the requested config (stale page)');
    }

    const buffers: Buffer[] = [];
    for (let i = 0; i < opts.frames; i++) {
      const dataUrl: string = await page.evaluate(
        async ({ t, pulse }: { t: number; pulse?: AnimationPulse }) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const api = (window as any).__mapposter;
          await api.ready;
          const r = await api.renderAnimationFrame(t, pulse);
          return r.dataUrl as string;
        },
        { t: i / opts.frames, pulse: opts.pulse },
      );
      buffers.push(Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64'));
    }
    return buffers;
  } catch (e) {
    broken = true;
    deps.pool.discard(page);
    throw e;
  } finally {
    deps.configStore.drop(key);
    if (!broken) deps.pool.release(page);
  }
}

export interface ClipFrames {
  frames: Buffer[];
  settle: Buffer;
}

const PNG_DATA_URL_PREFIX = /^data:image\/png;base64,/;

/**
 * Capture a whole MotionScript clip from ONE page load: prefetch tiles along
 * the flight path (best-effort), then each frame is renderMotionFrame(i/fps) —
 * a pure function of t (Task 4). The settle still is captured at restAtSec
 * with pulsePhase 0 (the pulse ring at its minimum — spec §3).
 *
 * NO retry of a partial clip: if the page dies mid-sequence we fail the whole
 * request (spec §9) rather than re-running the tail. A second page load would
 * warm a different tile cache than the first, so splicing frames from two
 * runs would mix two different tile-cache states and destroy determinism —
 * the one property this function exists to guarantee.
 */
export async function renderClipFrames(config: RenderConfig, deps: RenderDeps): Promise<ClipFrames> {
  const motion = config.motion;
  if (!motion) {
    throw new Error('renderClipFrames: config has no motion script');
  }

  const page = await deps.pool.acquire();
  const key = deps.configStore.put(JSON.stringify(config));
  let broken = false;
  try {
    await page.goto(`${deps.appUrl}/render.html?configId=${key}`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, {
      timeout: 20_000,
    });

    const loadedKey = await page.evaluate(() => (window as unknown as { __mapposter: { configKey: string } }).__mapposter.configKey);
    if (loadedKey !== key) {
      throw new Error('render mode: page did not reload with the requested config (stale page)');
    }

    // Best-effort: a prefetch failure must not fail the render — the frames
    // below still resolve correctly, just possibly slower on cache misses.
    await page
      .evaluate(async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const api = (window as any).__mapposter;
        await api.ready;
        await api.prefetchMotion();
      })
      .catch(() => {});

    const total = Math.round(motion.fps * motion.durationSec);
    const frames: Buffer[] = [];
    for (let i = 0; i < total; i++) {
      const dataUrl: string = await page.evaluate(async (t: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const api = (window as any).__mapposter;
        await api.ready;
        const r = await api.renderMotionFrame(t);
        return r.dataUrl as string;
      }, i / motion.fps);
      frames.push(Buffer.from(dataUrl.replace(PNG_DATA_URL_PREFIX, ''), 'base64'));
    }

    const settleUrl: string = await page.evaluate(async (t: number) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = (window as any).__mapposter;
      await api.ready;
      const r = await api.renderMotionFrame(t, { pulsePhase: 0 });
      return r.dataUrl as string;
    }, motion.restAtSec);

    return { frames, settle: Buffer.from(settleUrl.replace(PNG_DATA_URL_PREFIX, ''), 'base64') };
  } catch (e) {
    broken = true;
    deps.pool.discard(page);
    throw e;
  } finally {
    deps.configStore.drop(key);
    if (!broken) deps.pool.release(page);
  }
}

export async function renderFrame(config: RenderConfig, deps: RenderDeps): Promise<Buffer> {
  const page = await deps.pool.acquire();
  // The config travels out-of-band. Putting it in the URL capped the whole render
  // at Node's 16 KB request-head limit — the boundary for a city, never mind a
  // country, blows straight past that and the page answers 431.
  const key = deps.configStore.put(JSON.stringify(config));
  let broken = false;
  try {
    await page.goto(`${deps.appUrl}/render.html?configId=${key}`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, {
      timeout: 20_000,
    });

    const loadedKey = await page.evaluate(() => (window as unknown as { __mapposter: { configKey: string } }).__mapposter.configKey);
    if (loadedKey !== key) {
      throw new Error('render mode: page did not reload with the requested config (stale page)');
    }

    const dataUrl: string = await page.evaluate(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const api = (window as any).__mapposter;
      await api.ready;
      const r = await api.renderFrame();
      return r.dataUrl as string;
    });
    return Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');
  } catch (e) {
    // Any failure leaves this page in an unknown state — it may have crashed (a
    // 4k poster can OOM SwiftShader) or be stuck mid-navigation. Reusing it
    // poisons the slot for the process lifetime; a fresh page costs milliseconds.
    broken = true;
    deps.pool.discard(page);
    throw e;
  } finally {
    deps.configStore.drop(key);
    if (!broken) deps.pool.release(page);
  }
}
