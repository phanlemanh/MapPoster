import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { resolveLocation, resolveBoundary, __resetGeoCache, __setRateLimitMs } from './geocode';

function mockFetch(payload: unknown) {
  const fn = vi.fn(async (_url?: string) => ({ ok: true, json: async () => payload }) as unknown as Response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

const searchItem = {
  place_id: 1, osm_type: 'relation', osm_id: 9, lat: '21.03', lon: '105.85',
  display_name: 'Hanoi, Vietnam', boundingbox: ['20.9', '21.1', '105.7', '105.9'],
  address: { city: 'Hanoi', country: 'Vietnam' },
};
const boundaryItem = { display_name: 'Quận 3, HCMC', geojson: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } };

beforeEach(() => __setRateLimitMs(0));
afterEach(() => { vi.unstubAllGlobals(); __resetGeoCache(); });

describe('resolveLocation', () => {
  it('caches identical queries and misses on different ones (AC-4)', async () => {
    const fn = mockFetch([searchItem]);
    await resolveLocation('Hanoi');
    await resolveLocation('Hanoi'); // cached — no upstream
    await resolveLocation('Paris'); // different — upstream
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('maps a result into center/zoom/place', async () => {
    mockFetch([searchItem]);
    const r = await resolveLocation('Hanoi');
    expect(r.center[0]).toBeCloseTo(105.85, 2);
    expect(r.place.country).toBe('Vietnam');
    expect(r.zoom).toBeGreaterThanOrEqual(3);
  });

  it('passes explicit coordinates through without any upstream call', async () => {
    const fn = mockFetch([searchItem]);
    const r = await resolveLocation({ lng: 106.7, lat: 10.78, zoom: 16 });
    expect(r.center).toEqual([106.7, 10.78]);
    expect(r.zoom).toBe(16);
    expect(fn).not.toHaveBeenCalled();
  });

  it('throws a clear error when nothing is found', async () => {
    mockFetch([]);
    await expect(resolveLocation('zzzzz-not-a-place')).rejects.toThrow(/no geocoding result/i);
  });

  it('serializes concurrent upstream calls and spaces them (F3/F6)', async () => {
    __setRateLimitMs(40);
    const times: number[] = [];
    const fn = vi.fn(async (_url?: string) => {
      times.push(Date.now());
      return { ok: true, json: async () => [searchItem] } as unknown as Response;
    });
    vi.stubGlobal('fetch', fn);

    // three DISTINCT queries fired at once — a read-then-stamp limiter lets all
    // three fire in the same millisecond; a serialized one spaces them.
    await Promise.all([resolveLocation('alpha'), resolveLocation('beta'), resolveLocation('gamma')]);

    expect(fn).toHaveBeenCalledTimes(3);
    times.sort((a, b) => a - b);
    expect(times[1] - times[0]).toBeGreaterThanOrEqual(30);
    expect(times[2] - times[1]).toBeGreaterThanOrEqual(30);
  });
});

describe('resolveBoundary', () => {
  it('returns the region FeatureCollection and caches it', async () => {
    const fn = mockFetch([boundaryItem]);
    const b1 = await resolveBoundary('Quận 3, HCMC');
    const b2 = await resolveBoundary('Quận 3, HCMC');
    expect(b1?.features[0].geometry.type).toBe('Polygon');
    expect(b2).toBe(b1);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
