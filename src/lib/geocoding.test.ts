import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  searchPlaces,
  reverseGeocode,
  fetchRegionBoundary,
  refineThreshold,
  mergeDuplicates,
  setGeocodeLanguage,
  getGeocodeLanguage,
  DEFAULT_GEOCODE_LANG,
  type GeoResult,
} from './geocoding';

function mockFetch(payload: unknown, ok = true) {
  const fn = vi.fn(async (_url?: string) => ({ ok, json: async () => payload }) as unknown as Response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  setGeocodeLanguage(DEFAULT_GEOCODE_LANG);
});

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
    // The value is configurable; that it is sent AT ALL is the invariant — omit it
    // and the browser (Accept-Language) and Node (none) get different names back.
    expect(String(fn.mock.calls[0][0])).toContain('accept-language=');
  });

  it('defaults to Vietnamese names with an English fallback', async () => {
    const fn = mockFetch([hcmcSearchItem]);
    await searchPlaces('Paris');
    expect(getGeocodeLanguage()).toBe('vi,en');
    expect(String(fn.mock.calls[0][0])).toContain(`accept-language=${encodeURIComponent('vi,en')}`);
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
    // Two DISTINCT places (far apart, so de-duplication leaves both) that share a
    // name — element 0 and element 1 must be labelled by the same rule.
    const withName = { ...hcmcSearchItem, name: 'Feature', address: { city: 'Admin', country: 'Vietnam' } };
    mockFetch([
      { ...withName, place_id: 1, boundingbox: ['10.34', '11.16', '106.35', '107.03'] },
      { ...withName, place_id: 2, boundingbox: ['20.34', '21.16', '105.35', '106.03'] },
    ]);
    const rs = await searchPlaces('some street');
    expect(rs.map((r) => r.name)).toEqual(['Feature', 'Feature']); // both, not ['Admin', 'Feature']
  });

  it('throws on a non-ok response', async () => {
    mockFetch([], false);
    await expect(searchPlaces('Paris')).rejects.toThrow(/geocoding failed/i);
  });
});

describe('geocoding language', () => {
  it('applies the configured language to search, reverse and boundary requests', async () => {
    setGeocodeLanguage('en');
    const fn = mockFetch([hcmcSearchItem]);
    await searchPlaces('Paris');
    await reverseGeocode(2.35, 48.85);
    await fetchRegionBoundary({ name: 'Paris', country: 'France', lng: 0, lat: 0, zoom: 12 });
    for (const call of fn.mock.calls) expect(String(call[0])).toContain('accept-language=en');
  });

  it('falls back to the default rather than sending an empty language', () => {
    setGeocodeLanguage('   ');
    expect(getGeocodeLanguage()).toBe(DEFAULT_GEOCODE_LANG);
  });
});

describe('mergeDuplicates', () => {
  // Measured against the live API for "cầu Thủ Thiêm": OSM models the bridge as
  // eight separate ways, so Nominatim returns eight rows that are one structure.
  // Their bboxes chain end-to-end — that adjacency is what identifies them.
  const seg = (
    id: number,
    south: number,
    north: number,
    west: number,
    east: number,
    placeRank = 26,
    importance = 0.0534,
  ): GeoResult => ({
    id: String(id),
    name: 'Cầu Thủ Thiêm',
    country: 'Việt Nam',
    lat: (south + north) / 2,
    lng: (west + east) / 2,
    zoom: 15,
    bbox: [south, north, west, east],
    placeRank,
    importance,
    osmType: 'way',
    osmId: id,
  });

  const bridge: GeoResult[] = [
    seg(1, 10.78224, 10.78881, 106.71674, 106.72026),
    seg(2, 10.78851, 10.79078, 106.71507, 106.71705),
    seg(3, 10.78851, 10.7894, 106.71421, 106.71705),
    seg(4, 10.78724, 10.78851, 106.71705, 106.71773),
    seg(5, 10.78881, 10.78921, 106.71653, 106.71674),
    seg(6, 10.78724, 10.7886, 106.71711, 106.71773, 27, 0.0401),
    seg(7, 10.78881, 10.78908, 106.71607, 106.71674, 27, 0.0401),
    seg(8, 10.7828, 10.78751, 106.71743, 106.72012, 30, 0.0001),
  ];

  it('collapses the way segments of one feature into a single row', () => {
    expect(mergeDuplicates(bridge)).toHaveLength(1);
  });

  it('frames the whole feature, not whichever sliver ranked first', () => {
    const [m] = mergeDuplicates(bridge);
    expect(m.bbox).toEqual([10.78224, 10.79078, 106.71421, 106.72026]);
    expect(m.lat).toBeCloseTo((10.78224 + 10.79078) / 2, 5);
    expect(m.lng).toBeCloseTo((106.71421 + 106.72026) / 2, 5);
  });

  it('keeps the first (best-ranked) member as the representative identity', () => {
    const [m] = mergeDuplicates(bridge);
    expect(m.osmId).toBe(1); // so a follow-up boundary lookup still asks for a real entity
    expect(m.osmType).toBe('way');
  });

  it('chains transitively — segments that only touch through a third one still merge', () => {
    // A and C are 0.0019° apart (> the 0.001° gap) and NEVER touch directly;
    // only B bridges them. Adversarial order [A, C, B]: a single greedy pass
    // opens separate groups for A and C before B arrives, B joins A, and the
    // A∪B union that now reaches C cannot absorb it — the fixpoint pass must.
    const a = seg(21, 10.78, 10.782, 106.71, 106.712);
    const b = seg(22, 10.78, 10.782, 106.7119, 106.714);
    const c = seg(23, 10.78, 10.782, 106.7139, 106.716);
    for (const order of [
      [a, c, b],
      [c, a, b],
      [b, a, c],
    ]) {
      const merged = mergeDuplicates(order);
      expect(merged, order.map((s) => s.id).join(',')).toHaveLength(1);
      expect(merged[0].bbox).toEqual([10.78, 10.782, 106.71, 106.716]);
    }
  });

  it('does NOT merge same-named features that are far apart', () => {
    // The rural Nguyễn Huệ sits 48 km from the boulevard. Merging them would
    // silently frame a poster on empty countryside.
    const boulevard = { ...seg(10, 10.7725, 10.7785, 106.7015, 106.7055), name: 'Nguyễn Huệ' };
    const rural = { ...seg(11, 10.576, 10.582, 107.068, 107.074), name: 'Nguyễn Huệ' };
    expect(mergeDuplicates([boulevard, rural])).toHaveLength(2);
  });

  it('does not merge different names that happen to overlap', () => {
    const other = { ...bridge[1], id: '99', name: 'Cầu Ba Son' };
    expect(mergeDuplicates([bridge[0], other])).toHaveLength(2);
  });

  it('leaves a lone result byte-for-byte alone (no re-centring)', () => {
    const one = seg(1, 10.78224, 10.78881, 106.71674, 106.72026);
    // toBe, not toEqual: the SAME reference must come back — a copy would pass
    // deep equality while quietly breaking the "untouched" guarantee.
    expect(mergeDuplicates([one])[0]).toBe(one);
  });

  it('never merges results that carry no bbox', () => {
    const a: GeoResult = { ...bridge[0], bbox: undefined };
    const b: GeoResult = { ...bridge[1], bbox: undefined };
    expect(mergeDuplicates([a, b])).toHaveLength(2);
  });

  it('never merges nodes — two same-named POIs 50 m apart are two real places', () => {
    // Two branches of one chain café on the same street: same name, tiny bboxes
    // well inside the merge gap. Collapsing them would silently delete a result.
    const shop = (id: number, lat: number, lng: number): GeoResult => ({
      ...seg(id, lat, lat + 0.0002, lng, lng + 0.0002),
      name: 'Highlands Coffee',
      osmType: 'node',
    });
    expect(mergeDuplicates([shop(1, 10.7756, 106.7002), shop(2, 10.776, 106.7006)])).toHaveLength(2);
  });

  it('never merges antimeridian-crossing bboxes (west > east)', () => {
    // Fiji-style: Nominatim emits west > east for features straddling 180°.
    // A naive min/max union would span most of the globe; such features must
    // stay listed as separate rows instead.
    const fiji = (id: number): GeoResult => ({
      ...seg(id, -17.8, -17.7, 179.99, -179.98),
      name: 'Kings Road',
    });
    expect(mergeDuplicates([fiji(1), fiji(2)])).toHaveLength(2);
  });

  it('merges names that differ only in Unicode normalization form (NFC vs NFD)', () => {
    // Vietnamese diacritics arriving decomposed from another system must still
    // key to the same group — this is the exact case the merge exists for.
    const nfd = { ...bridge[1], name: 'Cầu Thủ Thiêm'.normalize('NFD') };
    expect(mergeDuplicates([bridge[0], nfd])).toHaveLength(1);
  });
});

describe('searchPlaces de-duplication', () => {
  const item = (id: number, bb: string[], rank = 26, imp = 0.0534) => ({
    ...hcmcSearchItem,
    place_id: id,
    osm_type: 'way',
    osm_id: id,
    name: 'Cầu Thủ Thiêm',
    place_rank: rank,
    importance: imp,
    boundingbox: bb,
    address: { road: 'Cầu Thủ Thiêm', city: 'Thủ Đức', country: 'Việt Nam' },
  });

  it('shows one row for a bridge that OSM splits into many ways', async () => {
    mockFetch([
      item(1, ['10.78224', '10.78881', '106.71674', '106.72026']),
      item(2, ['10.78851', '10.79078', '106.71507', '106.71705']),
      item(3, ['10.78851', '10.78940', '106.71421', '106.71705']),
      item(4, ['10.78724', '10.78851', '106.71705', '106.71773']),
      item(5, ['10.78881', '10.78921', '106.71653', '106.71674'], 27, 0.0401),
    ]);
    const rs = await searchPlaces('cầu Thủ Thiêm');
    expect(rs).toHaveLength(1);
    expect(rs[0].name).toBe('Cầu Thủ Thiêm');
  });

  it('asks upstream for more rows than it shows, because merging collapses them', async () => {
    const fn = mockFetch([hcmcSearchItem]);
    await searchPlaces('cầu Thủ Thiêm');
    expect(String(fn.mock.calls[0][0])).toContain('limit=12');
  });

  it('treats a blank-string boundingbox as absent, not as (0,0,0,0)', async () => {
    // Number('') === 0 is finite — without the explicit blank check, two
    // malformed rows would both get a fabricated "null island" bbox and merge.
    mockFetch([
      item(1, ['', '', '', '']),
      item(2, ['', '', '', '']),
    ]);
    const rs = await searchPlaces('cầu Thủ Thiêm');
    expect(rs).toHaveLength(2);
    expect(rs[0].bbox).toBeUndefined();
    expect(rs[0].zoom).toBe(12); // bbox-less default, not zoom-from-null-island
  });

  it('still caps what it hands to the UI', async () => {
    // 20 distinct places, none mergeable -> the list stays a list, not a scroll
    const many = Array.from({ length: 20 }, (_, i) => ({
      ...hcmcSearchItem,
      place_id: i,
      name: `Place ${i}`,
      boundingbox: [String(10 + i), String(10.1 + i), String(106 + i), String(106.1 + i)],
    }));
    mockFetch(many);
    expect((await searchPlaces('place')).length).toBeLessThanOrEqual(8);
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

describe('boundary refinement for small features', () => {
  // Hoàn Kiếm Lake: 0.0057° span — the coarse 0.0015° tolerance turns its
  // 172-point shoreline into a 13-point pentagon (measured against Nominatim).
  const lakeBbox = ['21.0259534', '21.0316445', '105.8511725', '105.8535692'];
  const coarsePoly = { type: 'Polygon', coordinates: [[[105.851, 21.026], [105.854, 21.026], [105.854, 21.032], [105.851, 21.026]]] };
  const finePoly = { type: 'Polygon', coordinates: [Array.from({ length: 30 }, (_, i) => [105.851 + i * 1e-4, 21.026 + i * 1e-4])] };
  const lakeItem = { osm_type: 'relation', osm_id: 198437, display_name: 'Hồ Hoàn Kiếm, Hà Nội', boundingbox: lakeBbox, geojson: coarsePoly };

  function mockFetchSeq(payloads: unknown[], okFlags?: boolean[]) {
    let i = 0;
    const fn = vi.fn(async (_url?: string) => {
      const idx = Math.min(i++, payloads.length - 1);
      return { ok: okFlags?.[idx] ?? true, json: async () => payloads[idx] } as unknown as Response;
    });
    vi.stubGlobal('fetch', fn);
    return fn;
  }

  it('refineThreshold scales to the feature and stands down for large ones', () => {
    const thr = refineThreshold(lakeBbox);
    expect(thr).not.toBeNull();
    expect(thr!).toBeLessThan(0.0015);
    expect(thr!).toBeCloseTo(0.0056911 / 200, 6);
    expect(refineThreshold(['10.34', '11.16', '106.35', '107.03'])).toBeNull(); // city-sized
    expect(refineThreshold(undefined)).toBeNull();
    expect(refineThreshold(['1', '1', '2', '2'])).toBeNull(); // zero span
  });

  it('refetches a small feature at feature-scaled tolerance and returns the detailed polygon', async () => {
    const fn = mockFetchSeq([[lakeItem], [{ ...lakeItem, geojson: finePoly }]]);
    const b = await fetchRegionBoundary({ name: 'Hồ Hoàn Kiếm', country: 'Vietnam', lng: 0, lat: 0, zoom: 15, osmType: 'relation', osmId: 198437 });
    expect(fn).toHaveBeenCalledTimes(2);
    const second = String(fn.mock.calls[1][0]);
    expect(second).toContain('/lookup?');
    expect(second).toContain('R198437');
    const thr = parseFloat(new URL(second).searchParams.get('polygon_threshold')!);
    expect(thr).toBeLessThan(0.0015);
    expect(b!.geojson.features[0].geometry).toEqual(finePoly);
  }, 15000);

  it('keeps the coarse polygon when the refinement pass fails', async () => {
    const fn = mockFetchSeq([[lakeItem], [lakeItem]], [true, false]);
    const b = await fetchRegionBoundary({ name: 'Hồ Hoàn Kiếm', country: 'Vietnam', lng: 0, lat: 0, zoom: 15, osmType: 'relation', osmId: 198437 });
    expect(fn).toHaveBeenCalledTimes(2);
    expect(b!.geojson.features[0].geometry).toEqual(coarsePoly);
  }, 15000);

  it('does not refetch city-sized features (coarse pass is already fine enough)', async () => {
    const cityItem = { ...hcmcSearchItem, geojson: coarsePoly };
    const fn = mockFetch([cityItem]);
    const b = await fetchRegionBoundary({ name: 'HCMC', country: 'Vietnam', lng: 0, lat: 0, zoom: 12, osmType: 'relation', osmId: 1973756 });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(b).not.toBeNull();
  });
});
