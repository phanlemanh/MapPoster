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

  const hcmcHit = {
    ...searchItem,
    lat: '10.7748',
    lon: '106.7038',
    display_name: 'Nguyen Hue Boulevard, District 1, Ho Chi Minh City, Vietnam',
    address: { road: 'Nguyen Hue Boulevard', city: 'Ho Chi Minh City', country: 'Vietnam' },
  };

  it('escalates through canonicalised/relaxed queries for a VN address', async () => {
    // Measured live: only the form without the house number AND without the
    // district returns hits. Each attempt takes its own throttled turn.
    const fn = vi.fn(async (url?: string) => {
      const u = decodeURIComponent(String(url));
      const hits = !u.includes('123');
      return { ok: true, json: async () => (hits ? [hcmcHit] : []) } as unknown as Response;
    });
    vi.stubGlobal('fetch', fn);

    const r = await resolveLocation('123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh');
    expect(r.place.country).toBe('Vietnam');
    expect(fn).toHaveBeenCalledTimes(3); // raw → normalized → no-house (district kept)
    const lastUrl = decodeURIComponent(String(fn.mock.calls[2][0]));
    expect(lastUrl).toContain('Nguyễn Huệ, District 1, Ho Chi Minh City');
  });

  it('rejects a relaxed hit that lands outside the requested city', async () => {
    // a same-named street in another province — relaxation must NOT accept it
    const wrongProvince = { ...searchItem, lat: '10.5790', lon: '107.0713', display_name: 'Nguyễn Huệ, Bà Rịa – Vũng Tàu, Vietnam', address: { road: 'Nguyễn Huệ', country: 'Vietnam' } };
    const fn = vi.fn(async (_url?: string) => ({ ok: true, json: async () => [wrongProvince] }) as unknown as Response);
    vi.stubGlobal('fetch', fn);

    await expect(resolveLocation('123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh')).rejects.toThrow(/no geocoding result/i);
  });

  it('applies no city guard when the query names no city', async () => {
    mockFetch([searchItem]); // display_name: 'Hanoi, Vietnam'
    const r = await resolveLocation('Some Unnamed Street');
    expect(r.place.country).toBe('Vietnam');
  });

  it('does not escalate when the query as written already hits', async () => {
    const fn = mockFetch([searchItem]);
    await resolveLocation('456 Lê Lợi, Quận 1');
    expect(fn).toHaveBeenCalledTimes(1);
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

  it('rejects on a transient upstream error and never caches it (R2-HIGH)', async () => {
    // Nominatim rate-limits us
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url?: string) => ({ ok: false, status: 429, json: async () => ({}) }) as unknown as Response),
    );
    await expect(resolveBoundary('Quận 3, HCMC')).rejects.toThrow(/boundary lookup failed: 429/i);

    // upstream recovers — a poisoned cache would keep throwing "no boundary" forever
    vi.unstubAllGlobals();
    const okFn = mockFetch([boundaryItem]);
    const b = await resolveBoundary('Quận 3, HCMC');
    expect(b?.features[0].geometry.type).toBe('Polygon');
    expect(okFn).toHaveBeenCalledTimes(1);
  });

  it('caches a definitive "no polygon" (ok response, no result)', async () => {
    const fn = mockFetch([]);
    expect(await resolveBoundary('Nowhere-with-no-polygon')).toBeNull();
    expect(await resolveBoundary('Nowhere-with-no-polygon')).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1); // definitive answers ARE cached
  });
});
