import { test, expect, type Page } from '@playwright/test';

declare global {
  interface Window {
    /** exposed by MapView in dev builds only */
    __map?: import('maplibre-gl').Map;
  }
}

// A small polygon roughly around Ho Chi Minh City, used for boundary lookups.
const POLY = {
  type: 'Polygon',
  coordinates: [[[106.5, 10.6], [106.9, 10.6], [106.9, 11.0], [106.5, 11.0], [106.5, 10.6]]],
};

const HCMC = {
  place_id: 1,
  osm_type: 'relation',
  osm_id: 1973756,
  lat: '10.7756587',
  lon: '106.7004238',
  display_name: 'Ho Chi Minh City, Vietnam',
  boundingbox: ['10.34', '11.16', '106.35', '107.03'],
  address: { city: 'Ho Chi Minh City', country: 'Vietnam' },
};

const THUDUC = {
  place_id: 2,
  osm_type: 'relation',
  osm_id: 9900001,
  lat: '10.8500',
  lon: '106.7700',
  display_name: 'Thủ Đức, Ho Chi Minh City, Vietnam',
  boundingbox: ['10.79', '10.90', '106.72', '106.83'],
  address: { city: 'Thủ Đức', country: 'Vietnam' },
};

/** Deterministic, offline Nominatim mock. */
async function mockNominatim(page: Page) {
  await page.route(/nominatim\.openstreetmap\.org/, (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.includes('/lookup')) {
      const ids = url.searchParams.get('osm_ids') || '';
      const name = ids.includes('9900001') ? 'Thủ Đức, Ho Chi Minh City' : 'Ho Chi Minh City, Vietnam';
      return route.fulfill({ json: [{ display_name: name, geojson: POLY }] });
    }
    if (url.pathname.includes('/reverse')) {
      return route.fulfill({ json: HCMC });
    }
    // /search
    const q = url.searchParams.get('q') || '';
    return route.fulfill({ json: /thu\s*duc|thủ\s*đức/i.test(q) ? [THUDUC] : [HCMC] });
  });
}

async function gotoFresh(page: Page) {
  await mockNominatim(page);
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
}

/** Complete onboarding by searching for and picking Ho Chi Minh City. */
async function pickHCMC(page: Page) {
  await gotoFresh(page);
  await page.locator('.onboard-card .search-box input').fill('Ho Chi Minh');
  await page.locator('.onboard-card .search-results li button').first().click();
  await expect(page.locator('.po-city')).toHaveText('Ho Chi Minh City');
}

const openPanel = (page: Page, name: string) => page.locator(`button[aria-label="${name}"]`).click();

const mapCenter = (page: Page) =>
  page.evaluate(() => { const c = window.__map!.getCenter(); return [c.lng, c.lat] as [number, number]; });

/**
 * The component's `ready` state is internal, and `map.loaded()` is not the same
 * thing — the effects re-run on the `load` EVENT. Arming marker placement makes
 * that gate observable: the crosshair appears only once the effect has re-run.
 */
async function waitForMapReady(page: Page) {
  await openPanel(page, 'Markers');
  await page.locator('.marker-pick').nth(1).click();
  await expect(page.locator('.maplibregl-canvas')).toHaveCSS('cursor', 'crosshair', { timeout: 20_000 });
}

test('onboarding: search and pick a city loads the editor', async ({ page }) => {
  await gotoFresh(page);
  await expect(page.locator('.onboard-card h1')).toHaveText('Where to?');

  await page.locator('.onboard-card .search-box input').fill('Ho Chi Minh');
  await page.locator('.onboard-card .search-results li button').first().click();

  await expect(page.locator('.onboard-overlay')).toHaveCount(0);
  await expect(page.locator('.po-city')).toHaveText('Ho Chi Minh City');
  await expect(page.locator('.settings-summary')).toContainText('Ho Chi Minh City');
});

test('theme switch re-tints and updates the summary', async ({ page }) => {
  await pickHCMC(page);
  await openPanel(page, 'Theme');
  await page.locator('.theme-swatch', { hasText: 'Terracotta' }).click();
  await expect(page.locator('.settings-summary')).toContainText('Terracotta');
});

test('layout switch updates the stage caption + summary', async ({ page }) => {
  await pickHCMC(page);
  await openPanel(page, 'Layout');
  await page.locator('.layout-item', { hasText: 'Desktop FHD' }).click();
  await expect(page.locator('.stage-caption')).toContainText('1920×1080');
  await expect(page.locator('.settings-summary')).toContainText('Desktop FHD');
});

test('style: toggling the city name hides the overlay title', async ({ page }) => {
  await pickHCMC(page);
  await openPanel(page, 'Style');
  await page.locator('.toggle-row', { hasText: 'City name' }).getByRole('switch').click();
  await expect(page.locator('.po-city')).toHaveCount(0);
});

test('highlight: add multiple regions (city + district)', async ({ page }) => {
  await pickHCMC(page);
  await openPanel(page, 'Location');

  // enable -> auto-adds the current city
  await page.locator('.toggle-row', { hasText: 'Highlight regions' }).getByRole('switch').click();
  await expect(page.locator('.hl-region-list li')).toHaveCount(1);
  await expect(page.locator('.hl-region-list')).toContainText('Ho Chi Minh City');

  // add a district via the highlight search
  await page.locator('.hl-search input').fill('Thu Duc');
  await page.locator('.hl-search ~ .search-results li button, .panel .search-results li button').first().click();
  await expect(page.locator('.hl-region-list li')).toHaveCount(2);
});

test('markers: drop a marker on the map', async ({ page }) => {
  await pickHCMC(page);
  await openPanel(page, 'Markers');
  await page.locator('.marker-pick').nth(1).click(); // heart
  // the crosshair IS the signal that placement is armed — clicking before then
  // silently does nothing, which is what made this test flaky under load
  await expect(page.locator('.maplibregl-canvas')).toHaveCSS('cursor', 'crosshair');
  await page.locator('.maplibregl-canvas').click({ position: { x: 300, y: 300 } });
  await expect(page.locator('.marker-list li')).toHaveCount(1);
  await expect(page.locator('.poster-marker')).toHaveCount(1);
});

test('markers: an icon chosen before the map loads still arms placement', async ({ page }) => {
  // Hold the vector tiles so `load` fires long AFTER the icon is picked. The
  // placement effect used to gate on a ref, which cannot schedule a re-run: the
  // handler was never attached and the click was swallowed. On a fast machine
  // the map always won this race, so only a loaded box ever saw the bug.
  await page.route(/tiles\.openfreemap\.org/, async (route) => {
    await new Promise((r) => setTimeout(r, 2000));
    await route.continue();
  });

  await pickHCMC(page);
  await openPanel(page, 'Markers');
  await page.locator('.marker-pick').nth(1).click();

  await expect(page.locator('.maplibregl-canvas')).toHaveCSS('cursor', 'crosshair', { timeout: 15_000 });
  await page.locator('.maplibregl-canvas').click({ position: { x: 300, y: 300 } });
  await expect(page.locator('.marker-list li')).toHaveCount(1);
});

test('a city picked before the map loads is actually flown to, not cancelled', async ({ page }) => {
  // The app opens on Paris. Pick Ho Chi Minh City while the tiles are still in
  // flight, so the flyTo is triggered by the `load` transition — the moment the
  // interactions effect used to fire setBearing(0)/setPitch(0), each of which
  // calls map.stop() and killed the flight at t=0, stranding the map on Paris.
  await page.route(/tiles\.openfreemap\.org/, async (route) => {
    await new Promise((r) => setTimeout(r, 2000));
    await route.continue();
  });

  await pickHCMC(page);
  await waitForMapReady(page);
  await page.waitForTimeout(1600); // the flyTo lasts 900ms

  const [lng, lat] = await mapCenter(page);
  expect(Math.abs(lng - 106.7004)).toBeLessThan(0.05); // not Paris (2.35)
  expect(Math.abs(lat - 10.7757)).toBeLessThan(0.05);
});

test('reload keeps the camera the user panned to, rather than flying back to the location', async ({ page }) => {
  // NOT gotoFresh(): its addInitScript re-clears localStorage on every navigation,
  // including the reload this test depends on.
  await mockNominatim(page);
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
  await page.locator('.onboard-card .search-box input').fill('Ho Chi Minh');
  await page.locator('.onboard-card .search-results li button').first().click();
  await expect(page.locator('.po-city')).toHaveText('Ho Chi Minh City');

  const center = () => mapCenter(page);
  await page.waitForFunction(() => Boolean(window.__map?.loaded()), null, { timeout: 20_000 });

  // Move the camera away from the city centre and let `moveend` persist it.
  // jumpTo, not a drag: dragPan's inertia keeps easing after mouseup and makes
  // the "where did it settle" read racy. What is under test is the flyTo guard.
  const away: [number, number] = [106.55, 10.65];
  await page.evaluate((c) => window.__map!.jumpTo({ center: c, zoom: 11 }), away);
  await expect
    .poll(async () => (await center())[0], { timeout: 5_000 })
    .toBeCloseTo(away[0], 2);
  await page.waitForTimeout(300); // let the persist middleware flush

  await page.reload();

  // `map.loaded()` is NOT the component's `ready` state; the flyTo effect re-runs
  // on the `load` EVENT. waitForMapReady observes that same gate honestly.
  await waitForMapReady(page);
  await page.waitForTimeout(1400); // longer than the 900ms flyTo would take

  // A flyTo back to `location` would land us on the city centre (106.70).
  const [lng, lat] = await center();
  expect(Math.abs(lng - away[0])).toBeLessThan(0.05);
  expect(Math.abs(lat - away[1])).toBeLessThan(0.05);
});

test('export: Download → PNG triggers a file download', async ({ page }) => {
  await pickHCMC(page);
  await page.locator('.btn-download').click();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 20_000 }),
    page.locator('.download-menu button', { hasText: 'PNG' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^mapposter-.*\.png$/);
});
