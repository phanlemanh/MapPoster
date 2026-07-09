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
 */
export async function renderFrame(config: RenderConfig, deps: RenderDeps): Promise<Buffer> {
  const page = await deps.pool.acquire();
  try {
    await page.goto(`${deps.appUrl}/render.html#config=${encodeConfig(config)}`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, {
      timeout: 20_000,
    });
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
