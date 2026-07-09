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
