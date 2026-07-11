import type { GeoJSONFeatureCollection, LocationInfo } from '../types';

const NOMINATIM = 'https://nominatim.openstreetmap.org';

// Nominatim's usage policy requires identification. Browsers forbid overriding
// the `User-Agent` fetch header (silently dropped) and send a Referer instead;
// Node has no Referer and Nominatim 403s its default UA, so we set an explicit
// User-Agent here — ignored by browsers, honored by Node. We also pass the
// optional `email` param, which Nominatim explicitly supports for contact.
const CONTACT_EMAIL = 'hello@mapposter.app';
const NOMINATIM_HEADERS = {
  Accept: 'application/json',
  'User-Agent': 'MapPoster/1.0 (+hello@mapposter.app)',
};

// Pin the response language explicitly. Without it Nominatim answers in the
// caller's language: a browser sends Accept-Language and gets "Vietnam", while
// Node sends none and gets "Việt Nam" — the same place resolving to two
// different names depending on who asked.
const LANG = 'en';
const langParam = `accept-language=${LANG}`;

export interface GeoResult extends LocationInfo {
  id: string;
  /** Nominatim's own relevance score — the results array is NOT sorted by it. */
  importance?: number;
  /** Nominatim granularity (city ~16, road ~26, POI ~30). */
  placeRank?: number;
}

/** Estimate a reasonable map zoom from a Nominatim bounding box. */
function zoomFromBbox(bbox?: string[]): number {
  if (!bbox || bbox.length < 4) return 12;
  const south = parseFloat(bbox[0]);
  const north = parseFloat(bbox[1]);
  const west = parseFloat(bbox[2]);
  const east = parseFloat(bbox[3]);
  const span = Math.max(Math.abs(north - south), Math.abs(east - west));
  if (!isFinite(span) || span <= 0) return 12;
  const zoom = Math.log2(360 / span) + 0.2;
  return Math.min(15, Math.max(3, Math.round(zoom * 10) / 10));
}

/**
 * `preferFeatureName` — for a SEARCH, the thing the user asked for is the matched
 * feature: "Võ Văn Tần" (a street), "Quận 3" (a district), "Hồ Hoàn Kiếm" (a lake).
 * Walking the `address.*` admin chain first labels all of them with whatever
 * administrative unit OSM nests them under (in HCMC today: "Thủ Đức"), which is
 * wrong. For a REVERSE lookup ("where am I?") the admin unit IS the answer.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toResult(item: any, preferFeatureName = false): GeoResult {
  const a = item.address ?? {};
  const admin = a.city || a.town || a.village || a.municipality || a.hamlet || a.suburb || a.county || a.state;
  const feature = item.name || a.road;
  const name =
    (preferFeatureName ? feature || admin : admin || feature) || String(item.display_name || '').split(',')[0];
  return {
    id: String(item.place_id),
    importance: typeof item.importance === 'number' ? item.importance : 0,
    placeRank: typeof item.place_rank === 'number' ? item.place_rank : 0,
    name: name || 'Unknown',
    country: a.country || '',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    zoom: zoomFromBbox(item.boundingbox),
    displayName: item.display_name,
    osmType: item.osm_type,
    osmId: item.osm_id,
  };
}

export interface RegionBoundary {
  /** FeatureCollection with a single Polygon/MultiPolygon feature */
  geojson: GeoJSONFeatureCollection;
  name: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBoundary(item: any): RegionBoundary | null {
  const g = item?.geojson;
  if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return null; // areas only
  return {
    geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: g }] },
    name: String(item.display_name || '').split(',')[0],
  };
}

const OSM_PREFIX: Record<string, string> = { node: 'N', way: 'W', relation: 'R' };

/** Douglas-Peucker tolerance (degrees) for the FIRST boundary fetch. ~165 m —
 * harmless for a province, but see refineThreshold for what it does to a lake. */
const COARSE_THRESHOLD = 0.0015;

/** Nominatim's absolute usage floor is 1 request/second. */
const REFINE_DELAY_MS = 1100;

/**
 * The fixed COARSE_THRESHOLD exists to bound the payload of country-sized
 * polygons — but it is measured in degrees, not in feature sizes. Hoàn Kiếm
 * Lake spans 0.0057°, so simplifying it with a 0.0015° tolerance collapses its
 * 172-point shoreline to 13 points: the poster draws a pentagon visibly offset
 * from the water the basemap renders. Scale the tolerance to the feature
 * instead (~200 segments across its bbox) and refetch when that is meaningfully
 * finer than the coarse pass. Small feature ⇒ small payload, so the refetch
 * cannot reintroduce the megabyte problem the threshold was guarding against.
 *
 * Returns the finer tolerance, or null when the coarse pass is already fine
 * enough (large features) or the bbox is unusable.
 */
export function refineThreshold(bbox?: string[]): number | null {
  if (!bbox || bbox.length < 4) return null;
  const span = Math.max(Math.abs(parseFloat(bbox[1]) - parseFloat(bbox[0])), Math.abs(parseFloat(bbox[3]) - parseFloat(bbox[2])));
  if (!isFinite(span) || span <= 0) return null;
  const thr = span / 200;
  return thr < COARSE_THRESHOLD ? Math.max(thr, 1e-6) : null;
}

function boundaryParams(threshold: number): string {
  return `polygon_geojson=1&polygon_threshold=${threshold}&${langParam}&email=${encodeURIComponent(CONTACT_EMAIL)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function lookupBoundaryItem(osmRef: string, threshold: number, signal?: AbortSignal): Promise<any | null> {
  const url = `${NOMINATIM}/lookup?format=jsonv2&osm_ids=${osmRef}&${boundaryParams(threshold)}`;
  const res = await fetch(url, { signal, headers: NOMINATIM_HEADERS });
  // Same rule as the search branch below: a transient failure is not an answer.
  // Falling through to the name search on a 429 would quietly swap the exact
  // entity we asked for with whatever Nominatim ranks first for its name.
  if (!res.ok) throw new Error(`Boundary lookup failed: ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data[0] : null;
}

/** Refetch the same entity at feature-scaled tolerance when the coarse pass
 * over-simplified it. Best-effort: any refinement failure keeps the coarse
 * polygon rather than failing a render that already has a usable answer. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refineBoundary(item: any, coarse: RegionBoundary, signal?: AbortSignal): Promise<RegionBoundary> {
  const thr = refineThreshold(item?.boundingbox);
  const osmRef = item?.osm_type && item?.osm_id && OSM_PREFIX[item.osm_type] ? `${OSM_PREFIX[item.osm_type]}${item.osm_id}` : null;
  if (thr === null || !osmRef) return coarse;
  await new Promise((r) => setTimeout(r, REFINE_DELAY_MS));
  try {
    const fine = toBoundary(await lookupBoundaryItem(osmRef, thr, signal));
    return fine ?? coarse;
  } catch {
    return coarse;
  }
}

/**
 * Fetch the administrative boundary polygon of a location. Tries a precise OSM
 * lookup first (exact same entity), then falls back to a name search. Nominatim
 * simplifies the polygon via `polygon_threshold` to keep the payload small; a
 * second feature-scaled pass restores detail for small features (see
 * refineThreshold).
 */
export async function fetchRegionBoundary(loc: LocationInfo, signal?: AbortSignal): Promise<RegionBoundary | null> {
  if (loc.osmType && loc.osmId && OSM_PREFIX[loc.osmType]) {
    const item = await lookupBoundaryItem(`${OSM_PREFIX[loc.osmType]}${loc.osmId}`, COARSE_THRESHOLD, signal);
    const b = toBoundary(item);
    if (b) return refineBoundary(item, b, signal); // a non-area entity (Point) falls through to the name search
  }

  const q = [loc.name, loc.country].filter(Boolean).join(', ');
  if (!q) return null;
  const url = `${NOMINATIM}/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}&${boundaryParams(COARSE_THRESHOLD)}`;
  const res = await fetch(url, { signal, headers: NOMINATIM_HEADERS });
  // A transient upstream failure (429/503/403) is NOT the same as "this place has
  // no polygon". Throw so callers can retry; returning null here would let the
  // caller cache a temporary outage as a permanent "region does not exist".
  // (Mirrors searchPlaces, which already throws on !res.ok.)
  if (!res.ok) throw new Error(`Boundary lookup failed: ${res.status}`);
  const data = await res.json();
  const item = Array.isArray(data) && data[0] ? data[0] : null;
  const b = toBoundary(item);
  return b ? refineBoundary(item, b, signal) : null;
}

/**
 * Order same-granularity hits by `importance`, leaving Nominatim's own
 * cross-granularity order alone.
 *
 * Do NOT express this as `.sort((a,b) => sameRank ? byImportance : 0)`. That
 * comparator is not a valid ordering — it calls A==C and C==B while A!=B — and
 * sort stability cannot rescue an inconsistent comparator: V8 never compares A
 * against B when a different-rank C sits between them, so `results[0]` depends
 * on the order Nominatim happened to send. Measured: the real "Nguyễn Huệ,
 * District 1" response puts a rank-30 pedestrian-street POI between the two
 * rank-26 roads, which is exactly that case.
 *
 * Bucketing by rank keeps every comparison inside one bucket. `Map` iterates in
 * key-insertion order, so buckets emerge in first-seen rank order.
 */
function rankThenImportance(results: GeoResult[]): GeoResult[] {
  const buckets = new Map<number, GeoResult[]>();
  for (const r of results) {
    const bucket = buckets.get(r.placeRank ?? 0);
    if (bucket) bucket.push(r);
    else buckets.set(r.placeRank ?? 0, [r]);
  }
  return [...buckets.values()].flatMap((b) => b.sort((a, z) => (z.importance ?? 0) - (a.importance ?? 0)));
}

/** Autocomplete search. Pass an AbortSignal so stale requests can be cancelled. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6&${langParam}` +
    `&q=${encodeURIComponent(q)}&email=${encodeURIComponent(CONTACT_EMAIL)}`;
  const res = await fetch(url, {
    signal,
    headers: NOMINATIM_HEADERS,
  });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  // NOT `data.map(toResult)` — Array.map passes the index as the 2nd arg, which
  // would set preferFeatureName from the element position.
  //
  // Nominatim does not order same-granularity hits by `importance`. Measured: for
  // "Nguyễn Huệ, District 1, Ho Chi Minh City" the correct Nguyen Hue Boulevard
  // (0.05340) came back 3rd, behind rural same-named roads (0.05338) 60km away.
  // Re-ordering globally by importance instead would let a city (high importance)
  // outrank the district you asked for — measured: "Q.7, TP.HCM" then resolved to
  // all of Ho Chi Minh City.
  return rankThenImportance(data.map((item) => toResult(item, true)));
}

/** Reverse-geocode a coordinate into a place name / country. */
export async function reverseGeocode(lng: number, lat: number, signal?: AbortSignal): Promise<GeoResult | null> {
  const url =
    `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=12&${langParam}` +
    `&lat=${lat}&lon=${lng}&email=${encodeURIComponent(CONTACT_EMAIL)}`;
  const res = await fetch(url, { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const item = await res.json();
  if (!item || item.error) return null;
  const r = toResult(item);
  // reverse results have no bbox -> keep a city-level zoom
  r.zoom = 12;
  r.lat = lat;
  r.lng = lng;
  return r;
}
