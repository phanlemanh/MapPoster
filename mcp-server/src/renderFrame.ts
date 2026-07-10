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
