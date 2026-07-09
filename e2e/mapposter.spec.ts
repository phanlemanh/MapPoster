import { test, expect, type Page } from '@playwright/test';

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
  await page.locator('.maplibregl-canvas').click({ position: { x: 300, y: 300 } });
  await expect(page.locator('.marker-list li')).toHaveCount(1);
  await expect(page.locator('.poster-marker')).toHaveCount(1);
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
