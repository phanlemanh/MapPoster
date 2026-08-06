import { describe, it, expect, vi } from 'vitest';
import { resolveConfig, formatSize, summarizeHighlights, assertColor, assertGeojson, MAX_GEOJSON_BYTES, FORMATS } from './resolveConfig';
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
