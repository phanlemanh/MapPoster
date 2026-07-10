import { searchPlaces, fetchRegionBoundary } from '../../src/lib/geocoding';
import { queryCandidates, relaxedCandidates, requiredCity, normalizeVnQuery } from './vnQuery';
import type { GeoJSONFeatureCollection } from '../../src/types';

export interface ResolvedLocation {
  center: [number, number];
  zoom: number;
  place: { name: string; country: string; lat: number; lng: number };
}

// --- caches + a serialized rate-limiter (Nominatim policy: <= 1 req/s) ---
const locCache = new Map<string, ResolvedLocation>();
const boundaryCache = new Map<string, GeoJSONFeatureCollection | null>();

let minSpacingMs = 1000;
let lastUpstreamAt = 0;
/** Tail of the serialization chain. Every throttle() links onto it, so overlapping
 * callers queue instead of all reading the same `lastUpstreamAt` and bursting. */
let queue: Promise<void> = Promise.resolve();

/** Test seam: shrink the rate-limit spacing so suites don't wait a second. */
export function __setRateLimitMs(ms: number): void {
  minSpacingMs = ms;
}
export function __resetGeoCache(): void {
  locCache.clear();
  boundaryCache.clear();
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

/** Resolve a place string (geocoded + cached) or explicit coordinates. */
export async function resolveLocation(
  input: string | { lng: number; lat: number; zoom?: number },
): Promise<ResolvedLocation> {
  if (typeof input !== 'string') {
    return {
      center: [input.lng, input.lat],
      zoom: input.zoom ?? 15,
      place: { name: '', country: '', lat: input.lat, lng: input.lng },
    };
  }
  const key = input.trim().toLowerCase();
  const cached = locCache.get(key);
  if (cached) return cached;

  const searchOnce = async (q: string) => {
    await throttle(); // each upstream attempt takes its own rate-limited turn
    return searchPlaces(q);
  };

  // Try the query as written, then progressively canonicalised/relaxed forms.
  // If the query names a city, discard hits that fall outside it — relaxation
  // otherwise happily matches a same-named street in another province.
  const inCity = cityGuard(input);

  let results: Awaited<ReturnType<typeof searchPlaces>> = [];
  for (const candidate of queryCandidates(input)) {
    const found = (await searchOnce(candidate)).filter(inCity);
    if (found.length) {
      results = found;
      break;
    }
  }
  if (!results.length) throw new Error(`No geocoding result for "${input}"`);
  const r = results[0];
  const resolved: ResolvedLocation = {
    center: [r.lng, r.lat],
    zoom: r.zoom,
    place: { name: r.name, country: r.country, lat: r.lat, lng: r.lng },
  };
  locCache.set(key, resolved);
  return resolved;
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
  const inCity = cityGuard(query);
  for (const candidate of relaxedCandidates(query)) {
    await throttle();
    const results = (await searchPlaces(candidate)).filter(inCity);
    if (results.length) {
      return results.slice(0, limit).map((r) => ({
        name: r.name,
        country: r.country,
        lng: r.lng,
        lat: r.lat,
        zoom: r.zoom,
        displayName: r.displayName,
      }));
    }
  }
  return [];
}

/** Resolve a place's administrative boundary GeoJSON (cached). */
export async function resolveBoundary(place: string): Promise<GeoJSONFeatureCollection | null> {
  const key = place.trim().toLowerCase();
  if (boundaryCache.has(key)) return boundaryCache.get(key) ?? null;

  await throttle();
  // fetchRegionBoundary THROWS on a transient upstream failure and returns null
  // only for a definitive "no polygon". So a throw here skips the cache write —
  // an outage must never be memoized as "this region does not exist".
  const b = await fetchRegionBoundary({ name: place, country: '', lng: 0, lat: 0, zoom: 12 });
  const geojson = b ? b.geojson : null;
  boundaryCache.set(key, geojson);
  return geojson;
}
