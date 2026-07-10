// One-off: render the AC-12 example (real geocode + browser) as judge evidence.
// Run: npx vite build && npx tsx mcp-server/scripts/gen-example.ts
import { promises as fs } from 'node:fs';
import { loadServerConfig } from '../config';
import { resolveConfig } from '../src/resolveConfig';
import { startAppServer } from '../src/appServer';
import { createPool } from '../src/browserPool';
import { createConfigStore } from '../src/configStore';
import { renderFrame } from '../src/renderFrame';

const cfg = loadServerConfig({ ...process.env, MAPPOSTER_APP_PORT: '0' } as NodeJS.ProcessEnv);
const configStore = createConfigStore();
const app = await startAppServer(cfg, configStore);
const pool = await createPool(1);
try {
  const rc = await resolveConfig({
    location: 'Võ Văn Tần, Quận 3, Ho Chi Minh City',
    highlight: { points: ['Võ Văn Tần, Quận 3, Ho Chi Minh City'] },
    format: 'tiktok',
    theme: 'midnight-blue',
    chrome: 'label',
  });
  const png = await renderFrame(rc, { appUrl: app.url, pool, configStore });
  await fs.mkdir('_acceptance/mcp-map-render/evidence', { recursive: true });
  await fs.writeFile('_acceptance/mcp-map-render/evidence/E12-example.png', png);
  console.log(`wrote E12-example.png (${png.length} bytes) size=${rc.size.width}x${rc.size.height} center=${rc.camera.center} zoom=${rc.camera.zoom} place=${rc.place.name}`);
} finally {
  await pool.close();
  await app.close();
}
