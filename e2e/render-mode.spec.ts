import { test, expect, type Page } from '@playwright/test';
import type { MapPosterApi } from '../src/render/main';

/** `window.__mapposter` typed via the now-exported `MapPosterApi`, instead of
 * the `any` cast this spec used before. Inlined at each `page.evaluate` call
 * site (not hoisted into a shared helper) because Playwright serializes each
 * evaluate callback independently — a helper defined outside it would not
 * exist in the browser context the callback actually runs in. */
type MapPosterWindow = { __mapposter: MapPosterApi };

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

/**
 * Decode a PNG data URL (produced by renderMotionFrame) inside the page and
 * count pixels where blue clearly dominates red and green — used to detect
 * whether a pure-blue-tagged highlight region's line is drawn ANYWHERE in the
 * frame, without needing to hand-compute the Web Mercator projection of a geo
 * coordinate to pixels.
 *
 * A plain Euclidean distance to pure (0,0,255) does NOT work here: the
 * `highlight-soft-edge` line layer is heavily blurred and only 45% opaque
 * (see mapStyle.ts's comment on why — a soft "this area", not a hard
 * border), blended over the theme's dark-navy basemap (water/background
 * pixels measured at up to (37,43,59) in this theme — themselves blue-leaning
 * but low-magnitude). Empirically, the blended line pixels land around
 * (20,44,124) — nowhere near pure blue by Euclidean distance, but with a blue
 * channel far higher than anything the basemap alone produces and clearly
 * outstripping its own red/green. That gap is what this checks.
 */
async function countDominantBluePixels(page: Page, dataUrl: string): Promise<number> {
  return page.evaluate(async (dataUrl) => {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('render-mode.spec: PNG decode failed'));
      img.src = dataUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, 0, 0);
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let count = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (b > 90 && b - r > 40 && b - g > 40) count++;
    }
    return count;
  }, dataUrl);
}

/** One square highlight region, offset from the shared center by `lngOffset`
 * degrees and tagged with `color` — shared by the sibling-region tests below
 * so two regions can sit side by side, each independently identifiable. */
function region(lngOffset: number, color: string) {
  return {
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [106.7 + lngOffset - 0.01, 10.78 - 0.01],
              [106.7 + lngOffset + 0.01, 10.78 - 0.01],
              [106.7 + lngOffset + 0.01, 10.78 + 0.01],
              [106.7 + lngOffset - 0.01, 10.78 + 0.01],
              [106.7 + lngOffset - 0.01, 10.78 - 0.01],
            ]],
          },
        },
      ],
    },
    color,
  };
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
    const api = (window as unknown as MapPosterWindow).__mapposter;
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
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    const f0a = await api.renderMotionFrame(0.5);
    const f0b = await api.renderMotionFrame(0.5);
    const fr = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    return [f0a.dataUrl, f0b.dataUrl, fr.dataUrl];
  });
  expect(a).toBe(b);        // pure function of t — same t twice, same pixels
  expect(rest).not.toBe(a); // rest state differs from mid-flight frame
});

test('motion: regionReveal keeps a sibling region visible, in its own colour, mid-reveal (Finding 2)', async ({ page }) => {
  // Two highlight regions, side by side, each with a distinct colour.
  // `regionReveal` (no explicit regionIndex ⇒ 0) only animates region 0 — the
  // bug this guards against: applyGeoAt used to replace the ENTIRE highlight
  // source with just region 0's sliced-so-far geometry, so region 1 (and its
  // own colour) vanished for the whole reveal instead of staying visible.
  const config = {
    camera: { center: [106.7, 10.78], zoom: 12.3 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    highlight: {
      regions: [region(-0.025, '#ff0000'), region(0.025, '#0000ff')],
      color: null, fill: true, dim: false,
    },
    markers: [],
    motion: {
      fps: 12, durationSec: 2, restAtSec: 1.4,
      camera: [{ t: 0, center: [106.7, 10.78], zoom: 12.3 }],
      tracks: [{ kind: 'regionReveal', t0: 0.2, t1: 1.2, regionIndex: 0 }],
    },
  };
  await page.goto('/render.html?config=' + b64url(config));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const midDataUrl = await page.evaluate(async () => {
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    // t0=0.2, t1=1.2 ⇒ progress at t=0.7 is 0.5 — mid-reveal, region 0's ring
    // is half-drawn and unfilled; region 1 should be fully present throughout.
    const frame = await api.renderMotionFrame(0.7);
    return frame.dataUrl;
  });

  const blueCount = await countDominantBluePixels(page, midDataUrl);
  // Empirically ~650 on this basemap/theme with the fix, 0 without it (verified
  // by temporarily reverting applyGeoAt to the pre-fix single-region setData) —
  // 50 is a conservative floor that tolerates basemap/tile variance.
  expect(blueCount).toBeGreaterThan(50); // region 1 (blue, untouched by the reveal) must still be drawn
});

test('motion: verifyAndReapplyGeoAt guards a reverted highlight source even when highlight.fill is false (Finding 1)', async ({ page }) => {
  // `fill: false` ⇒ mapStyle.ts never creates the `highlight-fill` layer (see
  // its `if (highlight.fill)` gate) — the exact configuration the PRE-FIX
  // guard could not protect at all: `verifyAndReapplyGeoAt` short-circuited on
  // `applied.fillOpacityTarget === null || !map.getLayer('highlight-fill')`,
  // both of which are true whenever there's no fill layer, so it returned
  // immediately without reading anything back. `highlight-soft-edge` (the
  // line layer that actually draws the reveal) is added unconditionally
  // whenever any region exists, so the reveal is still fully live here.
  const config = {
    camera: { center: [106.7, 10.78], zoom: 12.3 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    highlight: {
      regions: [region(-0.025, '#ff0000'), region(0.025, '#0000ff')],
      color: null, fill: false, dim: false,
    },
    markers: [],
    motion: {
      fps: 12, durationSec: 2, restAtSec: 1.4,
      camera: [{ t: 0, center: [106.7, 10.78], zoom: 12.3 }],
      tracks: [{ kind: 'regionReveal', t0: 0.2, t1: 1.2, regionIndex: 0 }],
    },
  };
  await page.goto('/render.html?config=' + b64url(config));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const { baselineUrl, repeatUrl, healedUrl } = await page.evaluate(async () => {
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    // t0=0.2, t1=1.2 ⇒ progress at t=0.7 is 0.5 — mid-reveal.
    const baseline = await api.renderMotionFrame(0.7);
    const repeat = await api.renderMotionFrame(0.7); // same t twice ⇒ must be byte-identical

    // Deterministically reproduce the exact corruption `verifyAndReapplyGeoAt`
    // guards against (MapView's setStyle({diff:true}) reverting the
    // `highlight` source to its full/un-revealed geometry) instead of
    // depending on real race timing. Requesting the SAME t again afterwards
    // means applyGeoAt's own progress cache (keyed on p, unchanged here) will
    // skip rewriting the source itself — catching and repairing this
    // corruption is verifyAndReapplyGeoAt's job alone.
    api.simulateHighlightRevertForTest();
    const healed = await api.renderMotionFrame(0.7);

    return { baselineUrl: baseline.dataUrl, repeatUrl: repeat.dataUrl, healedUrl: healed.dataUrl };
  });

  expect(repeatUrl).toBe(baselineUrl); // pure function of t
  expect(healedUrl).toBe(baselineUrl); // guard detected + repaired the simulated revert, fill:false notwithstanding

  const blueCount = await countDominantBluePixels(page, baselineUrl);
  expect(blueCount).toBeGreaterThan(50); // the soft-edge reveal is drawn even with fill:false
});
