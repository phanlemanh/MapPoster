import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'node:child_process';
import { startAppServer, type AppServer } from './appServer';
import { createPool, type Pool } from './browserPool';
import { renderFrame } from './renderFrame';
import { loadServerConfig } from '../config';
import type { RenderConfig } from '../../src/render/renderConfig';

// Heavy: builds the app + launches a browser + loads tiles from the network.
// Gated so the default `npm test` stays fast and offline. Run with:
//   MCP_INTEGRATION=1 npx vitest run mcp-server/src/renderFrame.test.ts
const RUN = process.env.MCP_INTEGRATION === '1';
const suite = RUN ? describe : describe.skip;

suite('renderFrame (integration)', () => {
  let app: AppServer;
  let pool: Pool;

  beforeAll(async () => {
    execSync('npx vite build', { stdio: 'inherit' }); // produce dist/ incl render.html
    const cfg = loadServerConfig({ ...process.env, MAPPOSTER_APP_PORT: '0' } as NodeJS.ProcessEnv);
    app = await startAppServer(cfg);
    pool = await createPool(1);
  }, 180_000);

  afterAll(async () => {
    await pool?.close();
    await app?.close();
  });

  it('renders a resolved config to an exact-size PNG (AC-1, AC-10)', async () => {
    const config: RenderConfig = {
      camera: { center: [106.7, 10.78], zoom: 12 },
      size: { width: 1080, height: 1920 },
      theme: 'midnight-blue',
      chrome: 'clean',
      place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 },
    };
    const png = await renderFrame(config, { appUrl: app.url, pool });
    expect(png.length).toBeGreaterThan(2000);
    expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a'); // PNG signature
    expect(png.readUInt32BE(16)).toBe(1080); // IHDR width
    expect(png.readUInt32BE(20)).toBe(1920); // IHDR height
  }, 60_000);
});
