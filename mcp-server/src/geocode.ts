import { searchPlaces, fetchRegionBoundary } from '../../src/lib/geocoding';
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

/** Test seam: shrink the rate-limit spacing so suites don't wait a second. */
export function __setRateLimitMs(ms: number): void {
  minSpacingMs = ms;
}
export function __resetGeoCache(): void {
  locCache.clear();
  boundaryCache.clear();
  lastUpstreamAt = 0;
}

async function throttle(): Promise<void> {
  const wait = Math.max(0, lastUpstreamAt + minSpacingMs - Date.now());
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastUpstreamAt = Date.now();
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

  await throttle();
  const results = await searchPlaces(input);
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

/** Resolve a place's administrative boundary GeoJSON (cached). */
export async function resolveBoundary(place: string): Promise<GeoJSONFeatureCollection | null> {
  const key = place.trim().toLowerCase();
  if (boundaryCache.has(key)) return boundaryCache.get(key) ?? null;

  await throttle();
  const b = await fetchRegionBoundary({ name: place, country: '', lng: 0, lat: 0, zoom: 12 });
  const geojson = b ? b.geojson : null;
  boundaryCache.set(key, geojson);
  return geojson;
}
