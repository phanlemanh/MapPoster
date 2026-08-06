/**
 * Ad hoc ui-check capture for mcp-map-render E10 (AC-10) — round re-verification.
 * Mirrors e2e/render-mode.spec.ts's AC-10 test manually so we can save the
 * three step screenshots the eval's `steps` field calls for. Not wired into
 * config.yaml as an executor — a one-off verify-time capture script, not a
 * standing eval command.
 */
import { chromium } from '@playwright/test';
import path from 'node:path';
import { promises as fs } from 'node:fs';

const OUT = path.join(process.cwd(), '_acceptance/mcp-map-render/evidence');

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

const tiktokConfig = {
  camera: { center: [106.7, 10.78], zoom: 12 },
  size: { width: 1080, height: 1920 },
  theme: 'midnight-blue',
  chrome: 'clean',
  place: { name: 'Ho Chi Minh City', country: 'Vietnam', lat: 10.78, lng: 106.7 },
};

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await page.goto('http://localhost:5173/render.html?config=' + b64url(tiktokConfig));

  const onboardCount = await page.locator('.onboard-overlay').count();
  const posterVisible = await page.locator('.poster-frame').isVisible();
  await page.screenshot({ path: path.join(OUT, 'E10-step1.png') });
  console.log('step1: onboardCount=', onboardCount, 'posterVisible=', posterVisible);

  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });
  await page.screenshot({ path: path.join(OUT, 'E10-step2.png') });

  const result = await page.evaluate(async () => {
    const api = (window as unknown as { __mapposter: { ready: Promise<void>; renderFrame: () => Promise<{ width: number; height: number; dataUrl: string }> } }).__mapposter;
    await api.ready;
    const r = await api.renderFrame();
    return { w: r.width, h: r.height, isPng: r.dataUrl.startsWith('data:image/png'), len: r.dataUrl.length, dataUrl: r.dataUrl };
  });
  console.log('renderFrame result:', { w: result.w, h: result.h, isPng: result.isPng, len: result.len });

  const base64 = result.dataUrl.replace(/^data:image\/png;base64,/, '');
  await fs.writeFile(path.join(OUT, 'E10-step3.png'), Buffer.from(base64, 'base64'));

  await browser.close();
  console.log(JSON.stringify({ onboardCount, posterVisible, w: result.w, h: result.h, isPng: result.isPng, len: result.len }));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
