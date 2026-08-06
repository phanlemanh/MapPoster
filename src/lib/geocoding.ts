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

/**
 * The response language MUST be pinned explicitly. Without it Nominatim answers
 * in the caller's language: a browser sends Accept-Language and gets "Vietnam",
 * while Node sends none and gets "Việt Nam" — the same place resolving to two
 * different names depending on who asked.
 *
 * Which language is a product choice, not an invariant, so it is configurable.
 * The default asks for Vietnamese and falls back to English, because a single
 * name per feature is what makes de-duplication possible at all: under `en`,
 * Nominatim returns the eight ways of one bridge as a mix of "Cầu Thủ Thiêm"
 * and "Thủ Thiêm Bridge", and no name-keyed merge can see them as one thing.
 */
export const DEFAULT_GEOCODE_LANG = 'vi,en';
let geocodeLang: string = DEFAULT_GEOCODE_LANG;

/**
 * Set the `accept-language` sent to Nominatim. Blank input restores the default.
 *
 * PROCESS-WIDE, startup-only configuration (same contract as __setRateLimitMs in
 * mcp-server/src/geocode.ts). The HTTP transport serves concurrent requests off
 * this one module instance, so wiring this to a per-request value would race —
 * if per-request language is ever needed, thread it as a parameter instead.
 */
export function setGeocodeLanguage(lang: string): void {
  geocodeLang = lang.trim() || DEFAULT_GEOCODE_LANG;
}

export function getGeocodeLanguage(): string {
  return geocodeLang;
}

function langParam(): string {
  return `accept-language=${encodeURIComponent(geocodeLang)}`;
}

/** Nominatim's `boundingbox`, parsed. Same order the API uses. */
export type Bbox = [south: number, north: number, west: number, east: number];

export interface GeoResult extends LocationInfo {
  id: string;
  /** Nominatim's own relevance score — the results array is NOT sorted by it. */
  importance?: number;
  /** Nominatim granularity (city ~16, road ~26, POI ~30). */
  placeRank?: number;
  /** Parsed extent, kept so duplicate segments can be merged into one frame. */
  bbox?: Bbox;
}

function parseBbox(raw?: string[]): Bbox | undefined {
  if (!raw || raw.length < 4) return undefined;
  // Number('') === 0 is finite — a malformed empty coordinate would silently
  // become a bogus (0,0,0,0) "null island" bbox, so reject blanks explicitly.
  const n = raw.slice(0, 4).map((s) => (typeof s === 'string' && s.trim() !== '' ? Number(s) : NaN)) as Bbox;
  return n.every((v) => isFinite(v)) ? n : undefined;
}

/** Estimate a reasonable map zoom from a bounding box. */
function zoomFromBbox(bbox?: Bbox): number {
  if (!bbox) return 12;
  const [south, north, west, east] = bbox;
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
  const bbox = parseBbox(item.boundingbox);
  return {
    id: String(item.place_id),
    importance: typeof item.importance === 'number' ? item.importance : 0,
    placeRank: typeof item.place_rank === 'number' ? item.place_rank : 0,
    name: name || 'Unknown',
    country: a.country || '',
    lat: parseFloat(item.lat),
    lng: parseFloat(item.lon),
    zoom: zoomFromBbox(bbox),
    bbox,
    displayName: item.display_name,
    osmType: item.osm_type,
    osmId: item.osm_id,
  };
}

export interface RegionBoundary {
  /** FeatureCollection with a single Polygon/MultiPolygon feature */
  geojson: GeoJSONFeatureCollection;
  name: string;
  /**
   * Identity of the OSM entity `geojson` actually came from — NOT necessarily
   * the entity `fetchRegionBoundary` was asked to look up. The exact-lookup
   * path (`loc.osmType`/`loc.osmId`) and the name-search fallback below can
   * resolve to different OSM objects, so this must always describe whichever
   * one produced the polygon, or a caller echoing it as "the matched entity"
   * would be naming something other than what got drawn.
   */
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
  displayName?: string;
  /** Nominatim granularity (city ~16, road ~26). */
  placeRank?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toBoundary(item: any): RegionBoundary | null {
  const g = item?.geojson;
  if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return null; // areas only
  return {
    geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: g }] },
    name: String(item.display_name || '').split(',')[0],
    osmType: item.osm_type,
    osmId: item.osm_id,
    displayName: item.display_name,
    placeRank: typeof item.place_rank === 'number' ? item.place_rank : undefined,
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
  return `polygon_geojson=1&polygon_threshold=${threshold}&${langParam()}&email=${encodeURIComponent(CONTACT_EMAIL)}`;
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

/**
 * Two bboxes are the same feature's neighbours when they overlap or nearly do.
 * ~110 m of slack: measured, the eight ways Nominatim returns for "cầu Thủ Thiêm"
 * chain end-to-end with no gap, so this only has to tolerate rounding — widening
 * it further would start swallowing genuinely distinct same-named streets.
 */
const MERGE_GAP_DEG = 0.001;

function crossesAntimeridian(b: Bbox): boolean {
  return b[2] > b[3]; // Nominatim emits west > east for Fiji/Chukotka/Aleutian features
}

function overlaps(a: Bbox, b: Bbox): boolean {
  // An antimeridian-crossing bbox never merges: naive min/max union would span
  // most of the globe instead of the true sliver at the dateline, and the zoom
  // computed from it would frame the whole planet. Opting those rare features
  // out of merging keeps them listed as-is rather than framed wrongly.
  if (crossesAntimeridian(a) || crossesAntimeridian(b)) return false;
  return a[0] - MERGE_GAP_DEG <= b[1] && b[0] - MERGE_GAP_DEG <= a[1] && a[2] - MERGE_GAP_DEG <= b[3] && b[2] - MERGE_GAP_DEG <= a[3];
}

function unionBbox(a: Bbox, b: Bbox): Bbox {
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1]), Math.min(a[2], b[2]), Math.max(a[3], b[3])];
}

// NFC first: Vietnamese diacritics arriving in mixed normalization forms (NFC vs
// NFD) would otherwise compare unequal for the exact names this merge exists for.
const nameKey = (name: string): string => name.normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');

/**
 * Only ways/relations take part in merging. OSM splits ROADS AND BRIDGES (ways)
 * into identically-named segments — that is the duplication being repaired. Two
 * same-named NODES within the merge gap are usually two real places (branches of
 * one chain store on a street); collapsing them would silently delete a result.
 */
const canMerge = (r: GeoResult): boolean => Boolean(r.bbox) && (r.osmType === 'way' || r.osmType === 'relation');

/**
 * Collapse the rows that are one real-world feature.
 *
 * OSM splits a long way wherever its tags change, so a single bridge or street
 * comes back as many identically-named hits. Measured: "cầu Thủ Thiêm" fills the
 * whole result list with eight slivers of the same bridge, and picking any one of
 * them frames the poster on a ~20 m fragment instead of the bridge.
 *
 * Identity is `same name AND touching extents` — NOT distance between centres.
 * Segments of one road chain end-to-end (so the growing union absorbs a whole
 * chain even when its two ends never touch each other), while the two Nguyễn Huệ
 * streets that this file works hard to keep apart sit 48 km away and never merge.
 *
 * A group of one is returned untouched: Nominatim's point for a lone POI is often
 * deliberate (an entrance, not a centroid) and re-centring it would lose that.
 */
function mergePass(results: GeoResult[]): GeoResult[] {
  const groups: { rep: GeoResult; key: string; mergeable: boolean; bbox?: Bbox; members: number }[] = [];
  for (const r of results) {
    const mergeable = canMerge(r);
    const g = mergeable && groups.find((g) => g.mergeable && g.key === nameKey(r.name) && overlaps(g.bbox as Bbox, r.bbox as Bbox));
    if (!g) {
      groups.push({ rep: r, key: nameKey(r.name), mergeable, bbox: r.bbox, members: 1 });
      continue;
    }
    g.bbox = unionBbox(g.bbox as Bbox, r.bbox as Bbox);
    g.members += 1;
  }
  // `bbox!` is safe by construction: members only exceeds 1 on the merge branch
  // above, which requires canMerge (bbox present) for both group and member.
  return groups.map(({ rep, bbox, members }) =>
    members === 1
      ? rep
      : { ...rep, bbox, lat: (bbox![0] + bbox![1]) / 2, lng: (bbox![2] + bbox![3]) / 2, zoom: zoomFromBbox(bbox) },
  );
}

export function mergeDuplicates(results: GeoResult[]): GeoResult[] {
  // Fixpoint, not a single pass: one greedy pass is ORDER-DEPENDENT. With input
  // [A, C, B] where B bridges two ends that never touch each other, A and C open
  // separate groups before B arrives, B joins A, and the A∪B union that now
  // reaches C cannot absorb it — two rows for one street. Each pass either
  // strictly shrinks the list or the loop exits, so termination is guaranteed;
  // with n ≤ UPSTREAM_LIMIT (12) the worst case is trivially cheap either way.
  let out = mergePass(results);
  for (let prev = results.length; out.length < prev; ) {
    prev = out.length;
    out = mergePass(out);
  }
  return out;
}

/** Ask upstream for more than we show — merging collapses rows, often many-to-one. */
const UPSTREAM_LIMIT = 12;
const MAX_RESULTS = 8;

/** Autocomplete search. Pass an AbortSignal so stale requests can be cancelled. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=${UPSTREAM_LIMIT}&${langParam()}` +
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
  // Merge AFTER ranking, so the survivor of each group is its best-ranked member
  // and the list keeps the cross-granularity order rankThenImportance preserved.
  return mergeDuplicates(rankThenImportance(data.map((item) => toResult(item, true)))).slice(0, MAX_RESULTS);
}

/** Reverse-geocode a coordinate into a place name / country. */
export async function reverseGeocode(lng: number, lat: number, signal?: AbortSignal): Promise<GeoResult | null> {
  const url =
    `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=12&${langParam()}` +
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
