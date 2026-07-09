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
