import { describe, it, expect, vi } from 'vitest';
import { resolveConfig, formatSize, summarizeHighlights, summarizeRoutes, summarizeMeasures, assertColor, assertGeojson, MAX_GEOJSON_BYTES, MAX_HIGHLIGHTS, FORMATS } from './resolveConfig';
import * as geocode from './geocode';

vi.mock('./geocode', () => ({
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) =>
    typeof input === 'string'
      ? { center: [106.7, 10.78], zoom: 12, place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } },
  ),
  resolveBoundary: vi.fn(async () => ({
    geojson: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
    },
    osmType: 'relation',
    osmId: 1973756,
    displayName: 'District 1, Ho Chi Minh City, Vietnam',
    placeRank: 18,
  })),
  resolveCountryAt: vi.fn(async () => 'Vietnam'),
}));

vi.mock('./route', () => ({
  resolveRoute: vi.fn(async (req: { mode?: string }) => ({
    geojson: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[105.8, 21.0], [105.85, 21.05], [105.9, 21.1]] } }],
    },
    distanceKm: 12.4,
    durationMin: 28,
    provider: `osrm/${req.mode === 'walk' ? 'foot' : 'driving'}`,
    pointCount: 3,
  })),
}));

describe('formatSize', () => {
  it('resolves tiktok to 1080×1920 and passes custom dims through', () => {
    expect(formatSize('tiktok')).toEqual({ width: 1080, height: 1920 });
    expect(formatSize({ width: 1234, height: 567 })).toEqual({ width: 1234, height: 567 });
    expect(FORMATS.tiktok).toEqual({ width: 1080, height: 1920 });
  });
  it('defaults to tiktok when omitted', () => {
    expect(formatSize(undefined)).toEqual({ width: 1080, height: 1920 });
  });

  it('rejects non-positive, non-integer and oversized custom dims (F4)', () => {
    expect(() => formatSize({ width: 0, height: 0 })).toThrow(/invalid width/i);
    expect(() => formatSize({ width: 1080, height: -5 })).toThrow(/invalid height/i);
    expect(() => formatSize({ width: 99999, height: 100 })).toThrow(/invalid width/i);
    expect(() => formatSize({ width: 10.5, height: 100 })).toThrow(/invalid width/i);
  });

  it('refuses inherited Object.prototype keys instead of answering with a function (issue #3)', () => {
    // FORMATS is a plain object literal, so a truthiness lookup walked up the
    // prototype chain: formatSize('constructor') answered the Object function —
    // truthy, `width: undefined` — and the render died later inside the
    // renderer with an opaque TypeError instead of failing here by name.
    for (const key of ['constructor', 'toString', 'valueOf', 'hasOwnProperty', '__proto__', 'isPrototypeOf']) {
      expect(() => formatSize(key)).toThrow(new RegExp(`Unknown format: ${key.replace('__', '__')}`));
    }
  });

  it('a refused format never leaks a non-size shape to the caller', () => {
    // The regression this locks: the old branch RETURNED rather than threw, so
    // asserting only "it throws" would pass again if someone reintroduced a
    // fallback that returns something truthy but sizeless.
    for (const key of ['constructor', '__proto__']) {
      let out: unknown = 'not-called';
      try {
        out = formatSize(key);
      } catch {
        out = 'threw';
      }
      expect(out).toBe('threw');
    }
  });
});

describe('resolveConfig', () => {
  it('anchors every highlight to the country of the location being rendered', async () => {
    // Region auto-framing follows the region bbox, so an unanchored "District 1"
    // (whose top Nominatim hit is in Liberia) would silently relocate the poster.
    vi.mocked(geocode.resolveBoundary).mockClear();
    vi.mocked(geocode.resolveLocation).mockClear();

    await resolveConfig({
      location: 'Ho Chi Minh City',
      highlight: { regions: ['District 1'], points: ['Võ Văn Tần'] },
    });

    expect(geocode.resolveBoundary).toHaveBeenCalledWith('District 1', 'Vietnam');
    expect(geocode.resolveLocation).toHaveBeenCalledWith('Võ Văn Tần', 'Vietnam');
  });

  it.each(['regions', 'points'] as const)(
    'refuses an over-cap highlight.%s before spending a single geocoding request (issue #2)',
    async (key) => {
      vi.mocked(geocode.resolveBoundary).mockClear();
      vi.mocked(geocode.resolveLocation).mockClear();

      await expect(
        resolveConfig({
          location: 'Ho Chi Minh City',
          highlight: { [key]: Array.from({ length: MAX_HIGHLIGHTS + 1 }, (_, i) => `place ${i}`) },
        }),
      ).rejects.toThrow(new RegExp(`Too many highlight\\.${key}: ${MAX_HIGHLIGHTS + 1} \\(max ${MAX_HIGHLIGHTS}`));

      // The whole point of the cap is the traffic it does NOT send to
      // Nominatim. A guard placed after the base lookup would still have
      // spent one request per call; one placed inside the loop would have
      // spent MAX_HIGHLIGHTS of them.
      expect(geocode.resolveLocation).not.toHaveBeenCalled();
      expect(geocode.resolveBoundary).not.toHaveBeenCalled();
    },
  );

  it.each(['regions', 'points'] as const)('still resolves highlight.%s exactly at the cap', async (key) => {
    const cfg = await resolveConfig({
      location: 'Ho Chi Minh City',
      highlight: { [key]: Array.from({ length: MAX_HIGHLIGHTS }, (_, i) => `place ${i}`) },
    });
    expect(key === 'regions' ? cfg.highlight?.regions : cfg.markers).toHaveLength(MAX_HIGHLIGHTS);
  });

  it('names the anchor country when a region cannot be found in it', async () => {
    vi.mocked(geocode.resolveBoundary).mockResolvedValueOnce(null);
    await expect(
      resolveConfig({ location: 'Ho Chi Minh City', highlight: { regions: ['District 1'] } }),
    ).rejects.toThrow(/No boundary found for region "District 1" in Vietnam/);
  });

  it('looks the country up when location is coordinates, which carry none', async () => {
    // The README tells agents to pass explicit {lng,lat} for precision — so this is
    // the path that matters, and it used to bypass the anchor entirely (→ Liberia).
    vi.mocked(geocode.resolveBoundary).mockClear();
    vi.mocked(geocode.resolveCountryAt).mockClear();

    await resolveConfig({ location: { lng: 106.7, lat: 10.78 }, highlight: { regions: ['District 1'] } });

    expect(geocode.resolveCountryAt).toHaveBeenCalledWith(106.7, 10.78);
    expect(geocode.resolveBoundary).toHaveBeenCalledWith('District 1', 'Vietnam');
  });

  it('fails closed when the country at those coordinates cannot be determined', async () => {
    vi.mocked(geocode.resolveCountryAt).mockResolvedValueOnce(null);
    await expect(
      resolveConfig({ location: { lng: 106.7, lat: 10.78 }, highlight: { regions: ['District 1'] } }),
    ).rejects.toThrow(/Cannot determine the country at 10.78, 106.7/);
  });

  it('does not pay for a country lookup when no highlight is resolved by name', async () => {
    vi.mocked(geocode.resolveCountryAt).mockClear();
    await resolveConfig({
      location: { lng: 106.7, lat: 10.78 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] }, // already coordinates
    });
    expect(geocode.resolveCountryAt).not.toHaveBeenCalled();
  });

  it('rejects an unknown theme instead of silently rendering the default', async () => {
    // getTheme() answers THEMES[0] for anything it doesn't know, and the agent
    // never sees the image — a typo would return midnight-blue with no signal.
    await expect(resolveConfig({ location: 'HCMC', theme: 'rubby' })).rejects.toThrow(/Unknown theme: rubby/);
    await expect(resolveConfig({ location: 'HCMC', theme: 'ruby' })).resolves.toMatchObject({ theme: 'ruby' });
    await expect(resolveConfig({ location: 'HCMC' })).resolves.toMatchObject({ theme: 'midnight-blue' });
  });

  it('summarizes each resolved region so the caller can tell which one it got', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', highlight: { regions: ['District 1'] } });
    const { regions, points } = summarizeHighlights(cfg);
    expect(regions).toHaveLength(1);
    expect(regions[0].bbox).toEqual([106.6, 10.7, 106.8, 10.9]);
    expect(regions[0].center![0]).toBeCloseTo(106.7, 6);
    expect(regions[0].center![1]).toBeCloseTo(10.8, 6);
    expect(points).toEqual([]);
  });

  it('echoes the matched OSM identity in resolved.highlights.regions', async () => {
    const cfg = await resolveConfig({ location: 'Ho Chi Minh City', highlight: { regions: ['District 1'] } });
    const summary = summarizeHighlights(cfg);
    expect(summary.regions[0]).toMatchObject({
      osmType: 'relation',
      osmId: 1973756,
      displayName: 'District 1, Ho Chi Minh City, Vietnam',
      placeRank: 18,
    });
    expect(summary.regions[0].bbox).not.toBeNull();
  });

  it('refuses a highlight colour that is not a hex colour', async () => {
    // markerSvg interpolates the colour raw into `fill="${color}"`, and MapView
    // assigns that string to el.innerHTML — so an unvalidated colour is a DOM
    // injection into the headless render page.
    const xss = '"/><img src=x onerror=alert(1)>';
    expect(() => assertColor(xss)).toThrow(/Invalid color/);
    await expect(resolveConfig({ location: 'HCMC', highlight: { color: xss, points: ['x'] } })).rejects.toThrow(
      /Invalid highlight\.color/,
    );
  });

  it('accepts the hex forms a caller would actually use', () => {
    for (const c of ['#fff', '#FFFF', '#e8b04b', '#E8B04BFF']) expect(assertColor(c)).toBe(c);
    for (const c of ['red', 'rgb(1,2,3)', '#ggg', '#12345', 'url(x)']) expect(() => assertColor(c)).toThrow();
  });

  it('rejects a bad colour BEFORE spending a geocoding request', async () => {
    vi.mocked(geocode.resolveLocation).mockClear();
    await expect(resolveConfig({ location: 'HCMC', theme: 'nope' })).rejects.toThrow(/Unknown theme/);
    await expect(resolveConfig({ location: 'HCMC', highlight: { color: 'red' } })).rejects.toThrow(/Invalid highlight\.color/);
    expect(geocode.resolveLocation).not.toHaveBeenCalled();
  });

  it('bounds inline region GeoJSON — the one boundary field that accepted anything', () => {
    const good = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [1, 2] } }] };
    expect(assertGeojson(good)).toBe(good);

    expect(() => assertGeojson(null)).toThrow(/expected a GeoJSON FeatureCollection/);
    expect(() => assertGeojson('a string')).toThrow(/FeatureCollection/);
    expect(() => assertGeojson({ type: 'Polygon', coordinates: [] })).toThrow(/FeatureCollection/);
    expect(() => assertGeojson({ type: 'FeatureCollection', features: [{ properties: {} }] })).toThrow(/no geometry/);
  });

  it('refuses a GeoJSON payload past the size limit', () => {
    // It now really does reach the render page — the URL no longer caps it at 16 KB.
    const huge = {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: { pad: 'x'.repeat(MAX_GEOJSON_BYTES) }, geometry: { type: 'Point', coordinates: [1, 2] } }],
    };
    expect(() => assertGeojson(huge)).toThrow(/exceeds the \d+-byte limit/);
  });

  it('geocodes the location and picks the format size (AC-1)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', format: 'tiktok' });
    expect(cfg.size).toEqual({ width: 1080, height: 1920 });
    expect(cfg.camera.center).toEqual([106.7, 10.78]);
    expect(cfg.theme).toBe('midnight-blue');
    expect(cfg.chrome).toBe('clean');
    expect(cfg.place.country).toBe('Vietnam');
  });

  it('point highlight → marker + street-level zoom 14–17 (AC-3)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', highlight: { points: ['Võ Văn Tần, HCMC'] } });
    expect(cfg.markers).toHaveLength(1);
    expect(cfg.markers![0].lng).toBe(106.7);
    expect(cfg.camera.zoom).toBeGreaterThanOrEqual(14);
    expect(cfg.camera.zoom).toBeLessThanOrEqual(17);
  });

  it('region highlight → boundary geojson + fitted camera (AC-2)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', highlight: { regions: ['Quận 3, HCMC'] } });
    expect(cfg.highlight?.regions).toHaveLength(1);
    expect(cfg.highlight!.regions[0].geojson.features[0].geometry.type).toBe('Polygon');
    expect(cfg.camera.center[0]).toBeGreaterThan(106.5);
    expect(cfg.camera.center[0]).toBeLessThan(106.9);
    expect(cfg.camera.zoom).toBeGreaterThan(0);
  });

  it('custom format dims flow through (AC-8)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', format: { width: 1234, height: 567 } });
    expect(cfg.size).toEqual({ width: 1234, height: 567 });
  });

  it('explicit camera zoom overrides auto-framing', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', highlight: { points: ['x'] }, camera: { zoom: 9 } });
    expect(cfg.camera.zoom).toBe(9);
  });

  it('chrome defaults to clean, poster is honored (AC-9)', async () => {
    expect((await resolveConfig({ location: 'HCMC' })).chrome).toBe('clean');
    expect((await resolveConfig({ location: 'HCMC', chrome: 'poster' })).chrome).toBe('poster');
  });

  it('throws when a requested region has no boundary — never silently drops it (F2)', async () => {
    vi.mocked(geocode.resolveBoundary).mockResolvedValueOnce(null);
    await expect(resolveConfig({ location: 'HCMC', highlight: { regions: ['Nowhere-with-no-polygon'] } })).rejects.toThrow(
      /no boundary found for region/i,
    );
  });

  it('enforces coordinate/zoom bounds at runtime, not only in Zod (R2-MEDIUM)', async () => {
    await expect(resolveConfig({ location: { lng: 999, lat: 0 } })).rejects.toThrow(/invalid longitude/i);
    await expect(resolveConfig({ location: { lng: 0, lat: 99 } })).rejects.toThrow(/invalid latitude/i);
    await expect(resolveConfig({ location: 'HCMC', camera: { zoom: 99 } })).rejects.toThrow(/invalid zoom/i);
    await expect(resolveConfig({ location: 'HCMC', camera: { center: [999, 0] } })).rejects.toThrow(/invalid longitude/i);
    await expect(resolveConfig({ location: 'HCMC', highlight: { points: [{ lng: 500, lat: 0 }] } })).rejects.toThrow(/invalid longitude/i);
  });

  it('bounds camera pitch to 0..60 (MapLibre maxPitch — 85 used to be accept-then-discard)', async () => {
    await expect(resolveConfig({ location: 'HCMC', camera: { pitch: 200 } })).rejects.toThrow(/invalid pitch/i);
    await expect(resolveConfig({ location: 'HCMC', camera: { pitch: -1 } })).rejects.toThrow(/invalid pitch/i);
  });

  it('normalizes bearing to [0,360) instead of rejecting out-of-range values (F3)', async () => {
    // MapLibre renders `bearing: -45` correctly today, and lerpAngle
    // (src/render/motionMath.ts) already normalizes to [0,360) — rejecting it
    // here would be a regression, not a fix. Normalize instead.
    const cfg = await resolveConfig({ location: 'HCMC', camera: { bearing: -45, pitch: 30 } });
    expect(cfg.camera).toMatchObject({ bearing: 315, pitch: 30 });

    const wrapped = await resolveConfig({ location: 'HCMC', camera: { bearing: 405 } });
    expect(wrapped.camera.bearing).toBe(45);

    const exact = await resolveConfig({ location: 'HCMC', camera: { bearing: 45 } });
    expect(exact.camera.bearing).toBe(45);
  });

  it('still rejects a non-finite bearing', async () => {
    await expect(resolveConfig({ location: 'HCMC', camera: { bearing: Infinity } })).rejects.toThrow(/invalid bearing/i);
    await expect(resolveConfig({ location: 'HCMC', camera: { bearing: NaN } })).rejects.toThrow(/invalid bearing/i);
  });

  it('passes layers, detail and font through to the render config', async () => {
    const cfg = await resolveConfig({
      location: { lng: 106.7, lat: 10.78 },
      layers: { buildings: false, parks: false },
      detail: 0.9,
      font: 'Oswald',
    });
    expect(cfg.layers).toEqual({ buildings: false, parks: false });
    expect(cfg.detail).toBe(0.9);
    expect(cfg.font).toBe('Oswald');
  });

  it('merges labels:true into layers.roadLabels but refuses both at once', async () => {
    const cfg = await resolveConfig({ location: { lng: 106.7, lat: 10.78 }, labels: true, layers: { water: false } });
    expect(cfg.layers).toEqual({ water: false, roadLabels: true });
    await expect(
      resolveConfig({ location: { lng: 106.7, lat: 10.78 }, labels: true, layers: { roadLabels: false } }),
    ).rejects.toThrow(/either labels or layers\.roadLabels, not both/);
  });

  it('rejects out-of-range detail and unknown font', async () => {
    await expect(resolveConfig({ location: { lng: 106.7, lat: 10.78 }, detail: 1.5 })).rejects.toThrow(/invalid detail/i);
    // Nửa NHẬN của biên — eval khai có mà trước đây không hề tồn tại test nào.
    await expect(resolveConfig({ location: { lng: 106.7, lat: 10.78 }, detail: 0 })).resolves.toMatchObject({ detail: 0 });
    await expect(resolveConfig({ location: { lng: 106.7, lat: 10.78 }, detail: 1 })).resolves.toMatchObject({ detail: 1 });
    await expect(resolveConfig({ location: { lng: 106.7, lat: 10.78 }, font: 'Comic Sans' as never })).rejects.toThrow(/unknown font/i);
  });

  it('rejects an unknown layer key and a non-boolean layer value (Zod-bypass guard)', async () => {
    await expect(
      resolveConfig({ location: { lng: 106.7, lat: 10.78 }, layers: { foo: true } as never }),
    ).rejects.toThrow(/unknown layer/i);
    await expect(
      resolveConfig({ location: { lng: 106.7, lat: 10.78 }, layers: { buildings: 'yes' } as never }),
    ).rejects.toThrow(/invalid layer/i);
  });

  it('carries per-region color through and validates it', async () => {
    const gj = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[1, 1], [2, 1], [2, 2], [1, 1]]] } }] };
    const cfg = await resolveConfig({
      location: 'Ho Chi Minh City',
      highlight: { regions: [{ name: 'District 1', color: '#ff0000' }, { geojson: gj, color: '#00ff00' }, 'District 3'] },
    });
    expect(cfg.highlight?.regions.map((r) => r.color)).toEqual(['#ff0000', '#00ff00', null]);
    await expect(
      resolveConfig({ location: 'Ho Chi Minh City', highlight: { regions: [{ name: 'District 1', color: 'red' }] } }),
    ).rejects.toThrow(/highlight\.regions\[\]\.color/);
  });

  it('rejects a bad colour on a LATER region before any resolveBoundary call fires', async () => {
    // The whole reason per-region colours are validated in an up-front pass
    // (ahead of the region loop's network calls) rather than inline inside the
    // loop is so a bad colour on a later region is caught before an earlier
    // region ever pays for a resolveBoundary request. Assert that property
    // directly, not just the resulting error message.
    vi.mocked(geocode.resolveBoundary).mockClear();
    await expect(
      resolveConfig({
        location: 'Ho Chi Minh City',
        highlight: { regions: [{ name: 'District 1' }, { name: 'District 2', color: 'red' }] },
      }),
    ).rejects.toThrow(/highlight\.regions\[\]\.color/);
    expect(geocode.resolveBoundary).not.toHaveBeenCalled();
  });

  it('carries per-point icon/color/size and geocodes the query form', async () => {
    const cfg = await resolveConfig({
      location: 'Ho Chi Minh City',
      highlight: {
        points: [
          { lng: 106.7, lat: 10.78, icon: 'star', color: '#ff00ff', size: 60 },
          { query: 'Bến Thành Market', icon: 'heart' },
          'Võ Văn Tần',
        ],
        pointIcon: 'home',
        color: '#e8b04b',
      },
    });
    expect(cfg.markers).toHaveLength(3);
    expect(cfg.markers?.[0]).toMatchObject({ icon: 'star', color: '#ff00ff', size: 60 });
    expect(cfg.markers?.[1]).toMatchObject({ icon: 'heart', color: '#e8b04b', size: 44 }); // fallback màu chung
    expect(cfg.markers?.[2]).toMatchObject({ icon: 'home', color: '#e8b04b', size: 44 }); // fallback pointIcon
  });

  it('rejects out-of-range point size and bad point color', async () => {
    await expect(
      resolveConfig({ location: 'HCMC', highlight: { points: [{ lng: 106.7, lat: 10.78, size: 500 }] } }),
    ).rejects.toThrow(/highlight\.points\[\]\.size/);
    await expect(
      resolveConfig({ location: 'HCMC', highlight: { points: [{ lng: 106.7, lat: 10.78, color: 'javascript:x' }] } }),
    ).rejects.toThrow(/highlight\.points\[\]\.color/);
  });

  it('rejects a bad size/colour on a LATER point before any resolveLocation call for a point fires', async () => {
    // Mirrors the region test above: per-point colour/size are validated in an
    // up-front pass (ahead of the marker loop's network calls), so a bad value
    // on a later point is caught before an earlier query-form point ever pays
    // for a resolveLocation request.
    vi.mocked(geocode.resolveLocation).mockClear();
    await expect(
      resolveConfig({
        location: 'Ho Chi Minh City',
        highlight: { points: [{ query: 'Bến Thành Market' }, { lng: 106.7, lat: 10.78, size: 500 }] },
      }),
    ).rejects.toThrow(/highlight\.points\[\]\.size/);
    // Only the base-location lookup should have fired, never a per-point one.
    expect(geocode.resolveLocation).not.toHaveBeenCalledWith('Bến Thành Market', expect.anything());
  });

  it('rejects an unknown per-point icon instead of silently falling back to the default marker', async () => {
    // getMarkerIcon() answers MARKER_ICONS[0] ('pin') for anything it doesn't
    // know, and the agent never sees the rendered image — the same defect
    // class assertTheme's comment describes for `theme`.
    await expect(
      resolveConfig({ location: 'HCMC', highlight: { points: [{ lng: 106.7, lat: 10.78, icon: 'rocket' as never }] } }),
    ).rejects.toThrow(/highlight\.points\[\]\.icon/);
  });

  it('rejects an unknown top-level pointIcon instead of silently falling back to the default marker', async () => {
    await expect(
      resolveConfig({ location: 'HCMC', highlight: { points: ['x'], pointIcon: 'rocket' as never } }),
    ).rejects.toThrow(/highlight\.pointIcon/);
  });

  it('rejects a bad icon on a LATER point before any resolveLocation call for a point fires', async () => {
    vi.mocked(geocode.resolveLocation).mockClear();
    await expect(
      resolveConfig({
        location: 'Ho Chi Minh City',
        highlight: { points: [{ query: 'Bến Thành Market' }, { lng: 106.7, lat: 10.78, icon: 'rocket' as never }] },
      }),
    ).rejects.toThrow(/highlight\.points\[\]\.icon/);
    // Only the base-location lookup should have fired, never a per-point one.
    expect(geocode.resolveLocation).not.toHaveBeenCalledWith('Bến Thành Market', expect.anything());
  });
});

describe('boundary halves the evals claimed but no test proved (verify round 1 finding)', () => {
  const at = { location: { lng: 105.85, lat: 21.02 } };

  it('ACCEPTS marker size exactly at both bounds, and REFUSES 0 rather than reading it as unset', async () => {
    // `size != null` chứ không phải truthiness: 0 là giá trị khai tường minh và
    // sai, không phải "chưa đặt". Một cài đặt dùng `size || 44` sẽ im lặng biến
    // 0 thành 44 — và agent không nhìn thấy ảnh để phát hiện.
    for (const size of [18, 140]) {
      const cfg = await resolveConfig({ ...at, highlight: { points: [{ lng: 105.85, lat: 21.02, size }] } });
      expect(cfg.markers?.[0].size).toBe(size);
    }
    await expect(
      resolveConfig({ ...at, highlight: { points: [{ lng: 105.85, lat: 21.02, size: 0 }] } }),
    ).rejects.toThrow(/highlight\.points\[\]\.size/);
  });

  it('falls back through the whole marker style chain to its terminal defaults', async () => {
    // Điểm không khai gì VÀ highlight không khai gì => 'pin' / '#ffffff' / 44.
    const cfg = await resolveConfig({ ...at, highlight: { points: [{ lng: 105.85, lat: 21.02 }] } });
    expect(cfg.markers?.[0]).toMatchObject({ icon: 'pin', color: '#ffffff', size: 44 });
  });

  it('ACCEPTS route width exactly at both bounds', async () => {
    const coords: [number, number][] = [[105.85, 21.02], [105.86, 21.02]];
    for (const width of [1, 16]) {
      const cfg = await resolveConfig({ ...at, routes: [{ coords, width }] });
      expect(cfg.routes?.[0].width).toBe(width);
    }
  });
});

describe('routes', () => {
  const lineFc = (coords: [number, number][]) => ({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }],
  });

  it('accepts both route forms and fills style defaults from the theme', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      routes: [
        { coords: [[105.85, 21.02], [105.86, 21.02]], color: '#ff0000', width: 8 },
        { geojson: lineFc([[105.8, 21.0], [105.81, 21.01]]) },
      ],
    });

    expect(cfg.routes).toHaveLength(2);
    expect(cfg.routes?.[0]).toMatchObject({ color: '#ff0000', width: 8 });
    expect(cfg.routes?.[1]).toMatchObject({ width: 4 });
    expect(cfg.routes?.[1].color).toBe('#e8b04b'); // accent của midnight-blue
  });

  it('leaves routes UNDEFINED when the call has none — not an empty array', async () => {
    // Nửa suppression của AC-1: một mảng rỗng sẽ đi qua dây tới applyRenderConfig
    // và tới resolvedOf, làm response phình thêm khoá cho mọi lời gọi không dùng.
    const cfg = await resolveConfig({ location: { lng: 105.85, lat: 21.02 } });
    expect(cfg.routes).toBeUndefined();
    expect(summarizeRoutes(cfg)).toEqual([]);
  });

  it('summarises each route with a length name that says WHICH measurement it is', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.85, 21.02], [105.86, 21.02], [105.86, 21.03]] }],
    });
    const [r] = summarizeRoutes(cfg);

    expect(r.pointCount).toBe(3);
    expect(r.bbox).toEqual([105.85, 21.02, 105.86, 21.03]);
    expect(r.lengthKm).toBeGreaterThan(2);
    expect('km' in r).toBe(false); // tên trần bị cấm — không nói được đo kiểu gì
  });

  it('frames on routes when there is no region and no point', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.0, 21.0], [106.0, 22.0]] }],
    });

    expect(cfg.camera.center[0]).toBeCloseTo(105.5, 3);
    expect(cfg.camera.center[1]).toBeCloseTo(21.5, 3);
  });

  it('rejects a route with fewer than two coords, a bad colour, or a width out of range', async () => {
    const at = { location: { lng: 105.85, lat: 21.02 } };
    const ok: [number, number][] = [[105.85, 21.02], [105.86, 21.02]];
    await expect(resolveConfig({ ...at, routes: [{ coords: [[105.85, 21.02]] }] } as never)).rejects.toThrow(/routes\[\]\.coords/);
    await expect(resolveConfig({ ...at, routes: [{ coords: ok, color: 'red' }] } as never)).rejects.toThrow(/routes\[\]\.color/);
    await expect(resolveConfig({ ...at, routes: [{ coords: ok, width: 99 }] } as never)).rejects.toThrow(/routes\[\]\.width/);
    await expect(resolveConfig({ ...at, routes: [{}] } as never)).rejects.toThrow(/exactly one of/);
  });

  it('caps TOTAL inline geometry, not merely each payload on its own', async () => {
    // 40 tuyến × 20 000 điểm = 310 KiB mỗi tuyến (thoải mái dưới cap-mỗi-payload
    // 2 MiB) nhưng cộng lại 12,1 MiB — vượt cap tổng 8 MiB. Đây chính là lỗ mà
    // cap-mỗi-payload một mình không bịt được.
    const big = () => ({ coords: Array.from({ length: 20000 }, (_, i) => [105 + i * 1e-6, 21] as [number, number]) });
    await expect(
      resolveConfig({ location: { lng: 105.85, lat: 21.02 }, routes: Array.from({ length: 40 }, big) } as never),
    ).rejects.toThrow(/total inline GeoJSON/i);
  });

  it('lets a single large-but-legal payload through — the total cap is not a stealth per-payload cap', async () => {
    // Nửa còn lại: 1 tuyến 310 KiB phải ĐƯỢC NHẬN. Không có test này thì một cap
    // tổng đặt quá thấp vẫn "xanh" ở test trên.
    const one = { coords: Array.from({ length: 20000 }, (_, i) => [105 + i * 1e-6, 21] as [number, number]) };
    const cfg = await resolveConfig({ location: { lng: 105.85, lat: 21.02 }, routes: [one] } as never);
    expect(cfg.routes).toHaveLength(1);
  });
});

describe('routes[].route — đường đi thực tế (PR #5)', () => {
  it('accepts a route request and echoes distance/duration beside the geometry', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ route: { from: [105.8, 21.0], to: [105.9, 21.1], mode: 'car' }, color: '#ff0000' }],
    } as never);

    expect(cfg.routes).toHaveLength(1);
    expect(cfg.routes?.[0].color).toBe('#ff0000');

    const [r] = summarizeRoutes(cfg);
    expect(r.distanceKm).toBeCloseTo(12.4, 1);
    expect(r.durationMin).toBeCloseTo(28, 1);
    expect(r.provider).toMatch(/osrm/i);
    // lengthKm (ta tự đo trên polyline) KHÁC distanceKm (router báo). Hai phép
    // đo khác nhau, phải cùng tồn tại chứ không được gộp thành một con số.
    expect(r.lengthKm).toBeGreaterThan(0);
  });

  it('omits distance/duration for a route the caller drew by hand — those are router facts', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.8, 21.0], [105.9, 21.1]] }],
    } as never);
    const [r] = summarizeRoutes(cfg);
    expect(r.lengthKm).toBeGreaterThan(0);
    expect(r.distanceKm).toBeUndefined();
    expect(r.durationMin).toBeUndefined();
    expect(r.provider).toBeUndefined();
  });

  it('refuses an entry carrying more than one of coords/geojson/route', async () => {
    await expect(
      resolveConfig({
        location: { lng: 105.85, lat: 21.02 },
        routes: [{ coords: [[1, 1], [2, 2]], route: { from: [1, 1], to: [2, 2] } }],
      } as never),
    ).rejects.toThrow(/exactly one of/);
  });

  it('geocodes a named from/to through the same country anchor as highlights', async () => {
    vi.mocked(geocode.resolveLocation).mockClear();
    const cfg = await resolveConfig({
      location: 'Ho Chi Minh City',
      routes: [{ route: { from: 'Bến Thành', to: 'Tân Sơn Nhất' } }],
    } as never);
    expect(geocode.resolveLocation).toHaveBeenCalledWith('Bến Thành', 'Vietnam');
    expect(geocode.resolveLocation).toHaveBeenCalledWith('Tân Sơn Nhất', 'Vietnam');
    expect(cfg.routes).toHaveLength(1);
  });

  it('lets camera.focus frame a routed line like any other route', async () => {
    const cfg = await resolveConfig({
      location: { lng: 100, lat: 10 },
      routes: [{ route: { from: [105.8, 21.0], to: [105.9, 21.1] } }],
      camera: { focus: { kind: 'route', index: 0 } },
    } as never);
    expect(cfg.camera.center[0]).toBeCloseTo(105.85, 2);
  });
});

describe('camera.focus', () => {
  const boxFc = (w: number, s2: number, e: number, n: number) => ({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s2], [e, s2], [e, n], [w, n], [w, s2]]] } }],
  });
  const two = {
    location: { lng: 105.85, lat: 21.02 },
    highlight: {
      points: [{ lng: 105.0, lat: 21.0 }, { lng: 106.0, lat: 22.0 }],
      regions: [{ geojson: boxFc(105.0, 21.0, 105.2, 21.2) }, { geojson: boxFc(106.0, 22.0, 106.4, 22.4) }],
    },
  };

  it('frames the region at the given index, not the union of every region', async () => {
    const cfg = await resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 1 } } } as never);
    expect(cfg.camera.center[0]).toBeCloseTo(106.2, 2);
    expect(cfg.camera.center[1]).toBeCloseTo(22.2, 2);
  });

  it('frames the point at the given index', async () => {
    const cfg = await resolveConfig({ ...two, camera: { focus: { kind: 'point', index: 1 } } } as never);
    expect(cfg.camera.center).toEqual([106.0, 22.0]);
  });

  it('frames the route at the given index', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[100.0, 10.0], [100.2, 10.2]] }, { coords: [[108.0, 15.0], [108.4, 15.4]] }],
      camera: { focus: { kind: 'route', index: 1 } },
    } as never);
    expect(cfg.camera.center[0]).toBeCloseTo(108.2, 2);
    expect(cfg.camera.center[1]).toBeCloseTo(15.2, 2);
  });

  it('zooms OUT as paddingPct grows — the knob does something measurable', async () => {
    const tight = await resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 0, paddingPct: 0 } } } as never);
    const loose = await resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 0, paddingPct: 150 } } } as never);
    expect(loose.camera.zoom).toBeLessThan(tight.camera.zoom);
  });

  it('refuses focus together with an explicit center or zoom rather than picking a winner', async () => {
    await expect(resolveConfig({ ...two, camera: { focus: { kind: 'point', index: 0 }, zoom: 12 } } as never))
      .rejects.toThrow(/camera\.focus/);
    await expect(resolveConfig({ ...two, camera: { focus: { kind: 'point', index: 0 }, center: [1, 2] } } as never))
      .rejects.toThrow(/camera\.focus/);
  });

  it('refuses an index with nothing at it, naming how many exist', async () => {
    await expect(resolveConfig({ ...two, camera: { focus: { kind: 'region', index: 9 } } } as never))
      .rejects.toThrow(/index out of range \(2 region/);
    await expect(resolveConfig({ location: { lng: 105.85, lat: 21.02 }, camera: { focus: { kind: 'route', index: 0 } } } as never))
      .rejects.toThrow(/index out of range \(0 route/);
  });
});

describe('measure', () => {
  it('measures point pairs as straight-line distance plus a bearing', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      highlight: { points: [{ lng: 105.8342, lat: 21.0278 }, { lng: 106.6297, lat: 10.8231 }] },
      measure: { pairs: [[0, 1]] },
    });
    const m = summarizeMeasures(cfg);

    expect(m.pairs[0]).toMatchObject({ from: 0, to: 1 });
    expect(m.pairs[0].straightLineKm).toBeGreaterThan(1132);
    expect(m.pairs[0].straightLineKm).toBeLessThan(1143);
    expect(m.pairs[0].bearingDeg).toBeGreaterThan(90);  // Hà Nội → TP.HCM là hướng nam
    expect(m.pairs[0].bearingDeg).toBeLessThan(270);
    expect('km' in m.pairs[0]).toBe(false);
  });

  it('refuses a pair pointing at a point that does not exist', async () => {
    await expect(
      resolveConfig({
        location: { lng: 105.85, lat: 21.02 },
        highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
        measure: { pairs: [[0, 5]] },
      }),
    ).rejects.toThrow(/measure\.pairs/);
  });

  it('reports region area with holes SUBTRACTED, plus span and centroid', async () => {
    const outer = [[105.0, 21.0], [105.1, 21.0], [105.1, 21.1], [105.0, 21.1], [105.0, 21.0]];
    const hole = [[105.04, 21.04], [105.06, 21.04], [105.06, 21.06], [105.04, 21.06], [105.04, 21.04]];
    const withHole = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [outer, hole] } }] };
    const solid = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [outer] } }] };

    const holed = summarizeMeasures(await resolveConfig({ location: { lng: 105.05, lat: 21.05 }, highlight: { regions: [{ geojson: withHole }] } }));
    const full = summarizeMeasures(await resolveConfig({ location: { lng: 105.05, lat: 21.05 }, highlight: { regions: [{ geojson: solid }] } }));

    expect(holed.regions[0].areaKm2).toBeLessThan(full.regions[0].areaKm2);
    expect(holed.regions[0].spanKm.ew).toBeGreaterThan(9);
    expect(holed.regions[0].centroid?.[0]).toBeCloseTo(105.05, 2);
  });

  it('summarises route length under the routes key too', async () => {
    const cfg = await resolveConfig({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.85, 21.02], [105.9, 21.02]] }],
    });
    const m = summarizeMeasures(cfg);
    expect(m.routes[0]).toMatchObject({ index: 0 });
    expect(m.routes[0].lengthKm).toBeGreaterThan(4);
  });
});
