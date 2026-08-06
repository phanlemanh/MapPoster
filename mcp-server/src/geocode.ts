import {
  searchPlaces as searchPlacesUpstream,
  fetchRegionBoundary as fetchRegionBoundaryUpstream,
  reverseGeocode as reverseGeocodeUpstream,
} from '../../src/lib/geocoding';
import { queryCandidates, relaxedCandidates, requiredCity, normalizeVnQuery } from './vnQuery';
import { envNumber } from '../config';
import type { GeoJSONFeatureCollection } from '../../src/types';

export interface ResolvedLocation {
  center: [number, number];
  zoom: number;
  place: { name: string; country: string; lat: number; lng: number };
}

export interface ResolvedBoundary {
  geojson: GeoJSONFeatureCollection;
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
  displayName?: string;
  /** Nominatim granularity (city ~16, road ~26). Search doesn't return admin_level. */
  placeRank?: number;
}

// --- caches + a serialized rate-limiter (Nominatim policy: <= 1 req/s) ---

/**
 * Bounded LRU. The HTTP transport is a long-lived process (README `mcp:http`),
 * and `boundaryCache` holds whole region GeoJSON FeatureCollections — so an
 * unbounded Map means a client issuing many distinct region names grows resident
 * memory without limit, and the memory pressure takes the shared browser pool
 * down with it.
 *
 * `Map` iterates in insertion order, so the oldest key is simply the first one.
 * A hit re-inserts to refresh recency.
 */
export const CACHE_MAX = envNumber(process.env, 'MAPPOSTER_GEO_CACHE_MAX', 500, { min: 1 });

function lruGet<K, V>(m: Map<K, V>, k: K): V | undefined {
  if (!m.has(k)) return undefined;
  const v = m.get(k) as V;
  m.delete(k);
  m.set(k, v); // most-recently used
  return v;
}
function lruSet<K, V>(m: Map<K, V>, k: K, v: V): void {
  m.delete(k);
  m.set(k, v);
  while (m.size > CACHE_MAX) m.delete(m.keys().next().value as K);
}

const locCache = new Map<string, ResolvedLocation>();
/** `null` is a REAL value here ("this place has no polygon"), so presence is checked with `has`. */
const boundaryCache = new Map<string, ResolvedBoundary | null>();
const countryCache = new Map<string, string>();

let minSpacingMs = 1000;
let lastUpstreamAt = 0;
/** Tail of the serialization chain. Every throttle() links onto it, so overlapping
 * callers queue instead of all reading the same `lastUpstreamAt` and bursting. */
let queue: Promise<void> = Promise.resolve();

/** Test seam: shrink the rate-limit spacing so suites don't wait a second. */
/**
 * Nominatim NGÃ — không phải người gọi sai.
 *
 * Ranh giới "pha giải = lỗi người gọi" mà `jobRunner` dùng có một chỗ hở: pha
 * đó bao luôn một lời gọi ra bên thứ ba. Nominatim trả 503 cho `{location:
 * "Hà Nội"}` thì đầu vào chẳng có lỗi gì, chỉ là bên ngoài đang hỏng — bảo
 * người gọi "sửa đầu vào đi" là bảo họ chữa một thứ không bệnh, và họ sẽ KHÔNG
 * thử lại một yêu cầu mà lẽ ra một giây sau là chạy được.
 *
 * Phân biệt nằm ở ĐÂY, tại chỗ duy nhất biết mình vừa gọi ra ngoài mạng:
 * — mạng hỏng / HTTP không ok  → lỗi này (tại máy chủ)
 * — mạng ổn nhưng không có kết quả → lỗi thường (tại người gọi)
 */
export class GeocodeUpstreamError extends Error {
  constructor(cause: unknown) {
    super((cause as Error)?.message ?? String(cause));
    this.name = 'GeocodeUpstreamError';
  }
}

const viaUpstream = async <T>(run: () => Promise<T>): Promise<T> => {
  try {
    return await run();
  } catch (e) {
    throw e instanceof GeocodeUpstreamError ? e : new GeocodeUpstreamError(e);
  }
};

const searchPlaces = (...args: Parameters<typeof searchPlacesUpstream>) => viaUpstream(() => searchPlacesUpstream(...args));
const fetchRegionBoundary = (...args: Parameters<typeof fetchRegionBoundaryUpstream>) =>
  viaUpstream(() => fetchRegionBoundaryUpstream(...args));
const reverseGeocode = (...args: Parameters<typeof reverseGeocodeUpstream>) => viaUpstream(() => reverseGeocodeUpstream(...args));

export function __setRateLimitMs(ms: number): void {
  minSpacingMs = ms;
}
export function __resetGeoCache(): void {
  locCache.clear();
  boundaryCache.clear();
  countryCache.clear();
  lastUpstreamAt = 0;
  queue = Promise.resolve();
}

/**
 * Serialize upstream calls and space them by at least `minSpacingMs`.
 * A plain read-then-stamp is NOT enough: concurrent callers would all observe
 * the same `lastUpstreamAt`, compute the same (possibly zero) wait, and fire
 * simultaneously.
 */
function throttle(): Promise<void> {
  const turn = queue.then(async () => {
    const wait = Math.max(0, lastUpstreamAt + minSpacingMs - Date.now());
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastUpstreamAt = Date.now();
  });
  queue = turn.catch(() => {}); // a failed turn must not poison the chain
  return turn;
}

/**
 * Is a hit inside the city the query named? Compare through the SAME normaliser:
 * `accept-language=en` renders "Ho Chi Minh City" but leaves "Hà Nội"/"Đà Nẵng"
 * untranslated, so a raw substring test would reject correct Hanoi results.
 */
function cityGuard(query: string) {
  const city = requiredCity(query);
  if (!city) return () => true;
  const want = city.toLowerCase();
  return (r: { displayName?: string }) => normalizeVnQuery(r.displayName ?? '').toLowerCase().includes(want);
}

/**
 * A highlight must live in the country of the location being rendered.
 *
 * The city guard only fires when the query names a VN city, so a bare "District 1"
 * passes it — and Nominatim's top hit for that is a district in *Liberia*, with a
 * real polygon. Since auto-framing follows the region's bbox, the poster would
 * silently render Liberia while its label still said Ho Chi Minh City.
 *
 * Compare countries rather than distances: "location: Vietnam, highlight: HCMC" is
 * legitimate and 800 km apart, while the Liberia hit is simply a different country.
 * Hits with no country are allowed through — absence of evidence isn't evidence.
 */
function countryGuard(expect?: string) {
  const want = expect?.trim().toLowerCase();
  if (!want) return () => true;
  return (r: { country?: string }) => !r.country || r.country.toLowerCase() === want;
}

/**
 * Walk `candidates` — the query as written, then progressively canonicalised /
 * relaxed forms — until one yields hits inside the city the query named. Each
 * attempt takes its own rate-limited turn. Without the city guard, relaxation
 * happily matches a same-named street in another province.
 *
 * Shared by the point, region and disambiguation paths: a region string is the
 * same kind of user input as a point string, and used to reach Nominatim raw.
 */
async function searchLadder(query: string, candidates: string[], expectCountry?: string) {
  const inCity = cityGuard(query);
  const inCountry = countryGuard(expectCountry);
  for (const candidate of candidates) {
    await throttle();
    const found = (await searchPlaces(candidate)).filter(inCity).filter(inCountry);
    if (found.length) return found;
  }
  return [];
}

/**
 * Resolve a place string (geocoded + cached) or explicit coordinates.
 * `expectCountry` anchors a highlight to the country of the map being rendered.
 */
export async function resolveLocation(
  input: string | { lng: number; lat: number; zoom?: number },
  expectCountry?: string,
): Promise<ResolvedLocation> {
  if (typeof input !== 'string') {
    return {
      center: [input.lng, input.lat],
      zoom: input.zoom ?? 15,
      place: { name: '', country: '', lat: input.lat, lng: input.lng },
    };
  }
  const key = `${input.trim().toLowerCase()}|${expectCountry?.toLowerCase() ?? ''}`;
  const cached = lruGet(locCache, key);
  if (cached) return cached;

  const results = await searchLadder(input, queryCandidates(input), expectCountry);
  if (!results.length) throw new Error(`No geocoding result for "${input}"${expectCountry ? ` in ${expectCountry}` : ''}`);
  const r = results[0];
  const resolved: ResolvedLocation = {
    center: [r.lng, r.lat],
    zoom: r.zoom,
    place: { name: r.name, country: r.country, lat: r.lat, lng: r.lng },
  };
  lruSet(locCache, key, resolved);
  return resolved;
}

/**
 * The country at a coordinate.
 *
 * A highlight is anchored to the country of the map being rendered, but an
 * explicit `{lng, lat}` location carries no country — so the anchor has to be
 * looked up, or the guard silently passes everything (measured: coords + a bare
 * "District 1" auto-framed the poster onto Liberia).
 *
 * Only a positive answer is cached. `reverseGeocode` returns null both for "no
 * country here" and for a transient upstream failure, and memoizing the latter
 * would break this coordinate for the life of the process.
 */
export async function resolveCountryAt(lng: number, lat: number): Promise<string | null> {
  const key = `${lng.toFixed(3)},${lat.toFixed(3)}`;
  const cached = lruGet(countryCache, key);
  if (cached) return cached;

  await throttle();
  const country = (await reverseGeocode(lng, lat))?.country || null;
  if (country) lruSet(countryCache, key, country);
  return country;
}

export interface GeoCandidate {
  name: string;
  country: string;
  lng: number;
  lat: number;
  zoom: number;
  displayName?: string;
}

/**
 * Candidates for agent disambiguation. Free-form ranking is unreliable for VN
 * addresses ("Lê Lợi, Quận 1" ranks City Hall first), so expose the list rather
 * than silently picking the top hit.
 */
export async function searchCandidates(query: string, limit = 5): Promise<GeoCandidate[]> {
  const results = await searchLadder(query, relaxedCandidates(query));
  return results.slice(0, limit).map((r) => ({
    name: r.name,
    country: r.country,
    lng: r.lng,
    lat: r.lat,
    zoom: r.zoom,
    displayName: r.displayName,
  }));
}

/** Resolve a place's administrative boundary GeoJSON, plus the matched OSM entity's
 * identity (cached). */
export async function resolveBoundary(place: string, expectCountry?: string): Promise<ResolvedBoundary | null> {
  const key = `${place.trim().toLowerCase()}|${expectCountry?.toLowerCase() ?? ''}`;
  if (boundaryCache.has(key)) return lruGet(boundaryCache, key) ?? null;

  // Geocode the region exactly as a point is geocoded — canonicalise "Quận 3,
  // TP.HCM" into a form Nominatim indexes, drop hits outside the named city, and
  // drop hits outside the country being rendered. Passing the raw string to a
  // global `/search?limit=1` (as this used to) could highlight a same-named
  // district abroad, and auto-framing would then follow it there.
  const hits = await searchLadder(place, queryCandidates(place), expectCountry);
  if (!hits.length) {
    lruSet(boundaryCache, key, null); // a definitive "nothing matches" IS cacheable
    return null;
  }
  // OSM models administrative boundaries as relations, so prefer one when the
  // hits mix a boundary with POIs/roads of the same name.
  const hit = hits.find((h) => h.osmType === 'relation') ?? hits[0];

  await throttle();
  // fetchRegionBoundary THROWS on a transient upstream failure and returns null
  // only for a definitive "no polygon". So a throw here skips the cache write —
  // an outage must never be memoized as "this region does not exist". Passing the
  // hit's osm_type/osm_id fetches the polygon of the entity we actually matched.
  const b = await fetchRegionBoundary(hit);
  const resolved: ResolvedBoundary | null = b
    ? { geojson: b.geojson, osmType: hit.osmType, osmId: hit.osmId, displayName: hit.displayName, placeRank: hit.placeRank }
    : null;
  lruSet(boundaryCache, key, resolved);
  return resolved;
}
