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
  /** The district relation Nominatim returns for a canonicalised "District 3" search. */
  const district3 = {
    ...searchItem,
    osm_type: 'relation',
    osm_id: 1234,
    name: 'District 3',
    display_name: 'District 3, Ho Chi Minh City, Vietnam',
    address: { city: 'Ho Chi Minh City', country: 'Vietnam' },
  };

  /** Route by endpoint: `/search?` geocodes, `/lookup?` fetches the polygon. */
  function routeFetch(search: (url: string) => unknown, lookup: (url: string) => unknown, lookupOk = true) {
    const urls: string[] = [];
    const fn = vi.fn(async (url?: string) => {
      const u = decodeURIComponent(String(url));
      urls.push(u);
      const isLookup = u.includes('/lookup?');
      return {
        ok: isLookup ? lookupOk : true,
        status: isLookup && !lookupOk ? 429 : 200,
        json: async () => (isLookup ? lookup(u) : search(u)),
      } as unknown as Response;
    });
    vi.stubGlobal('fetch', fn);
    return { fn, urls };
  }

  it('routes a region through the same canonicalisation + city guard as a point, then looks up the exact entity', async () => {
    // "Quận 3, HCMC" sent raw returns nothing useful; only the canonical form hits.
    const { urls } = routeFetch(
      (u) => (u.includes('District 3, Ho Chi Minh City') ? [district3] : []),
      () => [boundaryItem],
    );

    const gj = await resolveBoundary('Quận 3, HCMC');
    expect(gj?.features[0].geometry.type).toBe('Polygon');
    expect(urls.some((u) => u.includes('/search?') && u.includes('District 3, Ho Chi Minh City'))).toBe(true);
    // the polygon came from the relation we matched, not from a second global name search
    expect(urls.some((u) => u.includes('/lookup?') && u.includes('R1234'))).toBe(true);
  });

  it('rejects a region hit that lands outside the city the query named', async () => {
    // "District 1" exists in Cebu City too, and it HAS a polygon — so an unguarded
    // `/search?limit=1` happily returns it and the poster silently highlights the
    // Philippines. The guard must reject the hit, not merely fail to find one.
    const cebu = {
      ...district3,
      osm_id: 99,
      display_name: 'District 1, Cebu City, Philippines',
      address: { country: 'Philippines' },
      geojson: boundaryItem.geojson,
    };
    const { urls } = routeFetch(
      () => [cebu],
      () => [boundaryItem],
    );

    expect(await resolveBoundary('Quận 1, TP.HCM')).toBeNull();
    expect(urls.some((u) => u.includes('/lookup?'))).toBe(false); // never fetched its polygon
  });

  it('caches a resolved boundary', async () => {
    const { fn } = routeFetch(
      () => [district3],
      () => [boundaryItem],
    );
    const b1 = await resolveBoundary('Quận 3, HCMC');
    const b2 = await resolveBoundary('Quận 3, HCMC');
    expect(b1?.features[0].geometry.type).toBe('Polygon');
    expect(b2).toBe(b1);
    const callsAfterFirst = fn.mock.calls.length;
    expect(await resolveBoundary('Quận 3, HCMC')).toBe(b1);
    expect(fn).toHaveBeenCalledTimes(callsAfterFirst); // no further upstream
  });

  it('rejects a transient failure at the polygon lookup and never caches it (R2-HIGH)', async () => {
    // Nominatim rate-limits the /lookup call. Falling through to a name search —
    // or caching null — would permanently break this region for the process.
    routeFetch(
      () => [district3],
      () => ({}),
      false, // lookup → 429
    );
    await expect(resolveBoundary('Quận 3, HCMC')).rejects.toThrow(/boundary lookup failed: 429/i);

    vi.unstubAllGlobals();
    const { fn } = routeFetch(
      () => [district3],
      () => [boundaryItem],
    );
    const b = await resolveBoundary('Quận 3, HCMC');
    expect(b?.features[0].geometry.type).toBe('Polygon');
    expect(fn.mock.calls.length).toBeGreaterThan(0); // it really re-fetched
  });

  it('rejects a transient failure while geocoding the region name', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_url?: string) => ({ ok: false, status: 503, json: async () => ({}) }) as unknown as Response),
    );
    await expect(resolveBoundary('Quận 3, HCMC')).rejects.toThrow(/503/);
  });

  it('refuses a region in the wrong country, even with a real polygon', async () => {
    // Measured live: Nominatim's top hit for a bare "District 1" is a district in
    // Liberia, WITH a polygon. The city guard cannot help — the query names no VN
    // city — and auto-framing follows the region bbox, so the poster would render
    // Liberia while its label still said Ho Chi Minh City.
    const liberia = {
      ...district3,
      osm_id: 77,
      name: 'District 1',
      display_name: 'District 1, Grand Bassa County, 1000, Liberia',
      address: { country: 'Liberia' },
      geojson: boundaryItem.geojson,
    };
    const { urls } = routeFetch(
      () => [liberia],
      () => [boundaryItem],
    );

    expect(await resolveBoundary('District 1', 'Vietnam')).toBeNull();
    expect(urls.some((u) => u.includes('/lookup?'))).toBe(false);
  });

  it('allows a region whose country matches the anchor, and one with no country at all', async () => {
    routeFetch(
      () => [district3], // address.country === 'Vietnam'
      () => [boundaryItem],
    );
    expect(await resolveBoundary('Quận 3, HCMC', 'Vietnam')).not.toBeNull();

    vi.unstubAllGlobals();
    __resetGeoCache();
    __setRateLimitMs(0);
    routeFetch(
      () => [{ ...district3, address: {} }], // Nominatim omitted the country
      () => [boundaryItem],
    );
    expect(await resolveBoundary('Quận 3, HCMC', 'Vietnam')).not.toBeNull();
  });

  it('keys the cache on the anchor country, so one lookup cannot poison another', async () => {
    routeFetch(
      () => [district3],
      () => [boundaryItem],
    );
    expect(await resolveBoundary('District 1', 'Vietnam')).not.toBeNull();
    expect(await resolveBoundary('District 1', 'Liberia')).toBeNull(); // district3 is in Vietnam
  });

  it('caches a definitive "no such region" (ok response, no result)', async () => {
    const fn = mockFetch([]);
    expect(await resolveBoundary('Nowhere-with-no-polygon')).toBeNull();
    expect(await resolveBoundary('Nowhere-with-no-polygon')).toBeNull();
    expect(fn).toHaveBeenCalledTimes(1); // definitive answers ARE cached
  });
});
