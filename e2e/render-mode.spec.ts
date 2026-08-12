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

  // Finding E (sibling fill): the assertion above only proves region 1's thin
  // blurred OUTLINE (highlight-soft-edge, line-opacity 0.45) survives the
  // reveal — it cannot see whether region 1's FILL (highlight-fill,
  // fill-opacity 0.26) also stayed up, because applyGeoAt used to zero
  // fill-opacity for the WHOLE highlight-fill layer any time ANY region's
  // reveal hadn't finished, which the outline-only pixel count is blind to.
  // A filled ~140×140px square's INTERIOR alone dwarfs its own perimeter, so
  // a count this much higher than the outline-only floor above can only be
  // explained by the interior fill actually being drawn, not just the edge.
  expect(blueCount).toBeGreaterThan(2000); // region 1's FILL, not just its outline, must still be drawn mid-reveal
});

/** Config chung cho nhóm test `anchors()`: một marker ở ĐÚNG tâm camera nghỉ,
 * một marker xa hẳn ra ngoài khung, và một vùng vuông bao quanh tâm. */
function anchorsConfig(over: { pitch?: number } = {}) {
  return {
    camera: { center: [106.7, 10.78], zoom: 13, ...(over.pitch != null ? { pitch: over.pitch } : {}) },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    highlight: { regions: [region(0, '#ff0000')], color: null, fill: true, dim: false },
    markers: [
      { lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }, // tâm khung nghỉ
      { lng: 108.2, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }, // xa hẳn sang phải
    ],
    motion: {
      fps: 12,
      durationSec: 2,
      restAtSec: 1.4,
      camera: [
        { t: 0, center: [106.7, 10.78], zoom: 11.5 },
        { t: 1.1, center: [106.7, 10.78], zoom: 13, ease: 'easeInOut' },
      ],
      tracks: [{ kind: 'pinDrop', at: 1.1, dur: 0.3 }],
    },
  };
}

test('anchors: phần trăm dùng MẪU SỐ RIÊNG từng trục, đo trên map thật (bẫy 1)', async ({ page }) => {
  await page.goto('/render.html?config=' + b64url(anchorsConfig()));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const out = await page.evaluate(async () => {
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    await api.renderMotionFrame(1.4, { pulsePhase: 0 }); // đúng thứ tự thật: chụp settle rồi mới đo
    const anchors = api.anchors();
    // Số liệu THÔ đọc thẳng từ MapLibre, để đối chiếu với công thức chứ không
    // tin vào chính hàm đang được kiểm.
    const map = (window as unknown as { __map: { project(ll: [number, number]): { x: number; y: number }; getCanvas(): HTMLCanvasElement } }).__map;
    const c = map.getCanvas();
    const p0 = map.project([106.7, 10.78]);
    const p1 = map.project([108.2, 10.78]);
    return { anchors, cssW: c.clientWidth, cssH: c.clientHeight, p0, p1 };
  });

  // Điều kiện tiên quyết: khung KHÔNG vuông, nếu không phép thử này không phân biệt được gì
  expect(out.cssW).not.toBe(out.cssH);

  const [center, far] = out.anchors.points;
  expect(center.xPct).toBeCloseTo((out.p0.x / out.cssW) * 100, 3);
  expect(center.yPct).toBeCloseTo((out.p0.y / out.cssH) * 100, 3);
  // marker ở tâm camera nghỉ ⇒ đúng giữa khung theo cả hai trục
  expect(center.xPct).toBeCloseTo(50, 1);
  expect(center.yPct).toBeCloseTo(50, 1);
  expect(center.onScreen).toBe(true);

  // Chốt phân biệt: cùng MỘT toạ độ pixel y, hai mẫu số cho hai con số khác
  // hẳn nhau — một hệ số chung sẽ trả về con số của trục kia.
  expect(Math.abs((out.p0.y / out.cssW) * 100 - center.yPct)).toBeGreaterThan(1);

  // Điểm ngoài khung: cờ onScreen tắt, phần trăm VẪN có nghĩa (>100)
  expect(far.onScreen).toBe(false);
  expect(far.xPct).toBeGreaterThan(100);
  expect(far.xPct).toBeCloseTo((out.p1.x / out.cssW) * 100, 3);

  // Vùng: hộp bao ôm lấy tâm khung
  const [x0, y0, x1, y1] = out.anchors.regions[0].bboxPct;
  expect(x0).toBeLessThan(50);
  expect(x1).toBeGreaterThan(50);
  expect(y0).toBeLessThan(50);
  expect(y1).toBeGreaterThan(50);
  expect(out.anchors.regions[0].bboxCenterPct[0]).toBeCloseTo(50, 1);
  expect(out.anchors.regions[0].bboxCenterPct[1]).toBeCloseTo(50, 1);

  // camera nghỉ = keyframe cuối (zoom 13), pitch 0
  expect(out.anchors.camera.zoom).toBeCloseTo(13, 6);
  expect(out.anchors.camera.center[0]).toBeCloseTo(106.7, 6);
  expect(out.anchors.camera.pitch).toBe(0);
});

test('anchors: CHỈ ĐỌC — gọi nó xong, khung đuôi vẫn byte-identical (bẫy 2)', async ({ page }) => {
  await page.goto('/render.html?config=' + b64url(anchorsConfig()));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const { before, after } = await page.evaluate(async () => {
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    const before = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    api.anchors();
    // Khung này đi nhánh CACHE (`restBase`): nếu anchors() đã `jumpTo` ở đâu
    // đó, overlay sẽ được vẽ bằng camera sai lên ảnh nền đúng và byte lệch.
    const after = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    return { before: before.dataUrl, after: after.dataUrl };
  });

  expect(after).toBe(before);
});

test('anchors: NỔ TO khi camera không ở restAtSec, thay vì trả toạ độ sai lặng lẽ', async ({ page }) => {
  await page.goto('/render.html?config=' + b64url(anchorsConfig()));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const message = await page.evaluate(async () => {
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    await api.setCamera({ center: [0, 0], zoom: 3 }); // ai đó chèn một lời gọi vào giữa
    try {
      api.anchors();
      return 'KHÔNG NÉM';
    } catch (e) {
      return (e as Error).message;
    }
  });

  expect(message).toMatch(/restAtSec/);
  expect(message).toMatch(/zoom|center/);
});

test('anchors: pitch != 0 — KHUNG VẪN RENDER, chỉ anchors() từ chối, nêu đích danh pitch', async ({ page }) => {
  // Camera nghiêng là một năng lực ĐANG CHẠY ĐƯỢC: `applyRenderConfig` áp pitch
  // lúc nạp trang và `cameraAt` không phát pitch, nên `jumpTo` mỗi khung không
  // reset nó. Test này khoá cả hai nửa lại — khung vẫn ra, anchors thì không.
  await page.goto('/render.html?config=' + b64url(anchorsConfig({ pitch: 45 })));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const out = await page.evaluate(async () => {
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    const mid = await api.renderMotionFrame(0.5);
    const rest = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    const pitch = (window as unknown as { __map: { getPitch(): number } }).__map.getPitch();
    let message: string;
    try {
      api.anchors();
      message = 'KHÔNG NÉM';
    } catch (e) {
      message = (e as Error).message;
    }
    return { mid: mid.dataUrl, rest: rest.dataUrl, pitch, message };
  });

  // nửa "năng lực còn nguyên": map thật sự nghiêng, và cả hai khung đều ra ảnh
  expect(out.pitch).toBeCloseTo(45, 6);
  expect(out.mid.startsWith('data:image/png')).toBe(true);
  expect(out.rest.startsWith('data:image/png')).toBe(true);
  expect(out.rest.length).toBeGreaterThan(2000);
  expect(out.rest).not.toBe(out.mid);

  // nửa "chốt còn nguyên": chỉ anchors() từ chối
  expect(out.message).toMatch(/pitch/i);
  expect(out.message).toMatch(/45/);
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
    // Finding H: DEV-only on main.tsx's side (stripped from a production
    // `vite build`) — optional chaining here since e2e always runs against
    // the Vite DEV server (playwright.config.ts), where it is always present;
    // the `?.` just keeps this file's types honest about that contract.
    api.simulateHighlightRevertForTest?.();
    const healed = await api.renderMotionFrame(0.7);

    return { baselineUrl: baseline.dataUrl, repeatUrl: repeat.dataUrl, healedUrl: healed.dataUrl };
  });

  expect(repeatUrl).toBe(baselineUrl); // pure function of t
  expect(healedUrl).toBe(baselineUrl); // guard detected + repaired the simulated revert, fill:false notwithstanding

  const blueCount = await countDominantBluePixels(page, baselineUrl);
  expect(blueCount).toBeGreaterThan(50); // the soft-edge reveal is drawn even with fill:false
});
