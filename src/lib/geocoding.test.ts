import { describe, it, expect, vi, afterEach } from 'vitest';
import { searchPlaces, reverseGeocode, fetchRegionBoundary } from './geocoding';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn(async (_url?: string) => ({ ok, json: async () => payload }) as unknown as Response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

const hcmcSearchItem = {
  place_id: 123,
  osm_type: 'relation',
  osm_id: 1973756,
  lat: '10.7756587',
  lon: '106.7004238',
  display_name: 'Ho Chi Minh City, Vietnam',
  boundingbox: ['10.34', '11.16', '106.35', '107.03'],
  address: { city: 'Ho Chi Minh City', country: 'Vietnam' },
};

describe('searchPlaces', () => {
  it('returns [] and does not fetch for queries shorter than 2 chars', async () => {
    const fn = mockFetch([]);
    expect(await searchPlaces('a')).toEqual([]);
    expect(fn).not.toHaveBeenCalled();
  });

  it('maps a Nominatim result into a GeoResult with OSM ids', async () => {
    mockFetch([hcmcSearchItem]);
    const [r] = await searchPlaces('Ho Chi Minh City');
    expect(r.name).toBe('Ho Chi Minh City');
    expect(r.country).toBe('Vietnam');
    expect(r.lat).toBeCloseTo(10.7756, 3);
    expect(r.lng).toBeCloseTo(106.7004, 3);
    expect(r.osmType).toBe('relation');
    expect(r.osmId).toBe(1973756);
    expect(r.zoom).toBeGreaterThanOrEqual(3);
    expect(r.zoom).toBeLessThanOrEqual(15);
  });

  it('sends an identifying email param (Nominatim policy)', async () => {
    const fn = mockFetch([hcmcSearchItem]);
    await searchPlaces('Paris');
    expect(String(fn.mock.calls[0][0])).toContain('email=');
  });

  it('pins the response language so Node and the browser agree', async () => {
    const fn = mockFetch([hcmcSearchItem]);
    await searchPlaces('Paris');
    expect(String(fn.mock.calls[0][0])).toContain('accept-language=en');
  });

  it('labels a search hit with the matched feature, not its parent district', async () => {
    // a street in HCMC: OSM nests it under city "Thủ Đức", but the user asked for the street
    mockFetch([
      { ...hcmcSearchItem, name: 'Võ Văn Tần', address: { road: 'Võ Văn Tần', city: 'Thủ Đức', country: 'Vietnam' } },
    ]);
    const [r] = await searchPlaces('Võ Văn Tần, Quận 3');
    expect(r.name).toBe('Võ Văn Tần');
  });

  it('falls back to the admin chain when the feature has no name', async () => {
    mockFetch([hcmcSearchItem]); // no `name` field
    const [r] = await searchPlaces('Ho Chi Minh City');
    expect(r.name).toBe('Ho Chi Minh City');
  });

  it('breaks ties by importance within one place_rank (the API does not)', async () => {
    // real values: the correct Nguyen Hue Boulevard (0.05340) came back BEHIND
    // rural same-named roads (0.05338) sitting 60 km away — both place_rank 26
    mockFetch([
      { ...hcmcSearchItem, place_id: 1, place_rank: 26, importance: 0.05338, name: 'Nguyễn Huệ', lat: '10.579', lon: '107.071' },
      { ...hcmcSearchItem, place_id: 2, place_rank: 26, importance: 0.0534, name: 'Nguyen Hue Boulevard', lat: '10.773', lon: '106.704' },
    ]);
    const rs = await searchPlaces('Nguyễn Huệ, District 1, Ho Chi Minh City');
    expect(rs[0].name).toBe('Nguyen Hue Boulevard');
    expect(rs[0].lat).toBeCloseTo(10.773, 2);
  });

  it('breaks ties within a rank for EVERY input order, not just lucky ones', async () => {
    // Nominatim chooses the raw order; we do not. The real response for this query
    // interleaves a rank-30 pedestrian-street POI between the two rank-26 roads.
    // A comparator that answers 0 for cross-rank pairs then never compares the two
    // roads against each other at all, and results[0] becomes order-dependent.
    const rural = { ...hcmcSearchItem, place_id: 1, place_rank: 26, importance: 0.05338, name: 'Nguyễn Huệ', lat: '10.579', lon: '107.071' };
    const poi = { ...hcmcSearchItem, place_id: 3, place_rank: 30, importance: 0.1, name: 'Nguyen Hue Walking Street', lat: '10.773', lon: '106.704' };
    const road = { ...hcmcSearchItem, place_id: 2, place_rank: 26, importance: 0.0534, name: 'Nguyen Hue Boulevard', lat: '10.773', lon: '106.704' };

    const permute = <T>(xs: T[]): T[][] =>
      xs.length <= 1 ? [xs] : xs.flatMap((x, i) => permute([...xs.slice(0, i), ...xs.slice(i + 1)]).map((p) => [x, ...p]));

    for (const order of permute([rural, poi, road])) {
      mockFetch(order);
      const rs = await searchPlaces('Nguyễn Huệ, District 1, Ho Chi Minh City');
      const roads = rs.filter((r) => r.placeRank === 26);
      expect(roads.map((r) => r.name), `raw order: ${order.map((o) => o.place_id).join(',')}`).toEqual([
        'Nguyen Hue Boulevard',
        'Nguyễn Huệ',
      ]);
    }
  });

  it("preserves Nominatim's cross-granularity order (first-seen rank wins)", async () => {
    // We re-order *within* a granularity only. Promoting the rank-30 POI just
    // because its importance is highest would answer a different question.
    mockFetch([
      { ...hcmcSearchItem, place_id: 1, place_rank: 26, importance: 0.05, name: 'Road' },
      { ...hcmcSearchItem, place_id: 2, place_rank: 30, importance: 0.9, name: 'POI' },
    ]);
    const rs = await searchPlaces('Nguyễn Huệ, District 1, Ho Chi Minh City');
    expect(rs.map((r) => r.name)).toEqual(['Road', 'POI']);
  });

  it('never lets a high-importance city outrank the district that was asked for', async () => {
    // "Q.7, TP.HCM": the city has far higher importance but a coarser place_rank.
    // Sorting globally by importance would return all of Ho Chi Minh City.
    mockFetch([
      { ...hcmcSearchItem, place_id: 1, place_rank: 18, importance: 0.3, name: 'District 7', lat: '10.737', lon: '106.729' },
      { ...hcmcSearchItem, place_id: 2, place_rank: 16, importance: 0.8, name: 'Ho Chi Minh City', lat: '10.773', lon: '106.716' },
    ]);
    const rs = await searchPlaces('District 7, Ho Chi Minh City');
    expect(rs[0].name).toBe('District 7');
  });

  it('does not let Array.map pass the index in as preferFeatureName', async () => {
    const withName = { ...hcmcSearchItem, name: 'Feature', address: { city: 'Admin', country: 'Vietnam' } };
    mockFetch([withName, withName]);
    const rs = await searchPlaces('some street');
    expect(rs.map((r) => r.name)).toEqual(['Feature', 'Feature']); // both, not ['Admin', 'Feature']
  });

  it('throws on a non-ok response', async () => {
    mockFetch([], false);
    await expect(searchPlaces('Paris')).rejects.toThrow(/geocoding failed/i);
  });
});

describe('reverseGeocode', () => {
  it('resolves a coordinate to a place, forcing the passed lng/lat', async () => {
    mockFetch({ ...hcmcSearchItem, address: { suburb: 'District 1', country: 'Vietnam' } });
    const r = await reverseGeocode(106.7, 10.77);
    expect(r?.name).toBe('District 1');
    expect(r?.lng).toBe(106.7);
    expect(r?.lat).toBe(10.77);
  });

  it('returns null on an error payload', async () => {
    mockFetch({ error: 'Unable to geocode' });
    expect(await reverseGeocode(0, 0)).toBeNull();
  });
});

describe('fetchRegionBoundary', () => {
  const poly = { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.7]]] };

  it('wraps an OSM lookup polygon into a single-feature FeatureCollection', async () => {
    const fn = mockFetch([{ display_name: 'Ho Chi Minh City, Vietnam', geojson: poly }]);
    const b = await fetchRegionBoundary({ name: 'HCMC', country: 'Vietnam', lng: 0, lat: 0, zoom: 12, osmType: 'relation', osmId: 1973756 });
    expect(b).not.toBeNull();
    expect(b!.geojson.type).toBe('FeatureCollection');
    expect(b!.geojson.features[0].geometry.type).toBe('Polygon');
    expect(b!.name).toBe('Ho Chi Minh City');
    // used the precise lookup endpoint
    expect(String(fn.mock.calls[0][0])).toContain('/lookup?');
    expect(String(fn.mock.calls[0][0])).toContain('R1973756');
  });

  it('returns null for a non-area (Point) result', async () => {
    mockFetch([{ display_name: 'x', geojson: { type: 'Point', coordinates: [1, 2] } }]);
    const b = await fetchRegionBoundary({ name: 'x', country: '', lng: 0, lat: 0, zoom: 12, osmType: 'node', osmId: 42 });
    expect(b).toBeNull();
  });

  it('falls back to a name search when no OSM id is provided', async () => {
    const fn = mockFetch([{ display_name: 'Paris, France', geojson: poly }]);
    const b = await fetchRegionBoundary({ name: 'Paris', country: 'France', lng: 0, lat: 0, zoom: 12 });
    expect(b).not.toBeNull();
    expect(String(fn.mock.calls[0][0])).toContain('/search?');
  });
});
