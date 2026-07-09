import type { RenderConfig } from '../../src/render/renderConfig';
import type { Pool } from './browserPool';

export interface RenderDeps {
  /** base URL of the served app (from startAppServer) */
  appUrl: string;
  pool: Pool;
}

function encodeConfig(config: RenderConfig): string {
  return Buffer.from(JSON.stringify(config)).toString('base64url');
}

/**
 * The single render primitive: drive the headless render mode with a fully
 * resolved config and return the composed PNG as a Buffer. Every MCP tool
 * routes through here (keeps a future native engine swap non-breaking).
 *
 * The config travels as a QUERY param so that a reused pooled page performs a
 * real document reload (a hash-only change would be a same-document navigation
 * and the page would silently re-serve the previous frame). We additionally
 * assert the loaded page reports our exact config key before composing, so a
 * stale page fails loudly instead of returning the wrong image.
 */
export async function renderFrame(config: RenderConfig, deps: RenderDeps): Promise<Buffer> {
  const page = await deps.pool.acquire();
  const key = encodeConfig(config);
  try {
    await page.goto(`${deps.appUrl}/render.html?config=${key}`, { waitUntil: 'load' });
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
  } finally {
    deps.pool.release(page);
  }
}
