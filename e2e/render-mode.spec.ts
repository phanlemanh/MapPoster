import { test, expect } from '@playwright/test';

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

test('render mode: headless renderFrame yields exact target dims, no onboarding (AC-10)', async ({ page }) => {
  await page.goto('/render.html?config=' + b64url(tiktokConfig));

  // no onboarding UI in render mode
  await expect(page.locator('.onboard-overlay')).toHaveCount(0);
  await expect(page.locator('.poster-frame')).toBeVisible();

  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const result = await page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (window as any).__mapposter;
    await api.ready;
    const r = await api.renderFrame();
    return { w: r.width, h: r.height, isPng: r.dataUrl.startsWith('data:image/png'), len: r.dataUrl.length };
  });

  expect(result.w).toBe(1080);
  expect(result.h).toBe(1920);
  expect(result.isPng).toBe(true);
  expect(result.len).toBeGreaterThan(2000);
});

test('motion: renderMotionFrame is a pure function of t — same t twice = same pixels, rest ≠ start', async ({ page }) => {
  const config = {
    camera: { center: [106.7, 10.78], zoom: 13 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    highlight: {
      regions: [{ geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.69, 10.77], [106.71, 10.77], [106.71, 10.79], [106.69, 10.79], [106.69, 10.77]]] } }] }, color: null }],
      color: null, fill: true, dim: false,
    },
    markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }],
    motion: {
      fps: 12, durationSec: 2, restAtSec: 1.4,
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
  await page.goto('/render.html?config=' + b64url(config));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const [a, b, rest] = await page.evaluate(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (window as any).__mapposter;
    await api.ready;
    const f0a = await api.renderMotionFrame(0.5);
    const f0b = await api.renderMotionFrame(0.5);
    const fr = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    return [f0a.dataUrl, f0b.dataUrl, fr.dataUrl];
  });
  expect(a).toBe(b);        // pure function of t — same t twice, same pixels
  expect(rest).not.toBe(a); // rest state differs from mid-flight frame
});
