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

export interface GeoResult extends LocationInfo {
  id: string;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toResult(item: any): GeoResult {
  const a = item.address ?? {};
  const name =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.hamlet ||
    a.suburb ||
    a.county ||
    a.state ||
    item.name ||
    String(item.display_name || '').split(',')[0];
  return {
    id: String(item.place_id),
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

/**
 * Fetch the administrative boundary polygon of a location. Tries a precise OSM
 * lookup first (exact same entity), then falls back to a name search. Nominatim
 * simplifies the polygon via `polygon_threshold` to keep the payload small.
 */
export async function fetchRegionBoundary(loc: LocationInfo, signal?: AbortSignal): Promise<RegionBoundary | null> {
  const common = `polygon_geojson=1&polygon_threshold=0.0015&email=${encodeURIComponent(CONTACT_EMAIL)}`;

  if (loc.osmType && loc.osmId && OSM_PREFIX[loc.osmType]) {
    const url = `${NOMINATIM}/lookup?format=jsonv2&osm_ids=${OSM_PREFIX[loc.osmType]}${loc.osmId}&${common}`;
    const res = await fetch(url, { signal, headers: NOMINATIM_HEADERS });
    if (res.ok) {
      const data = await res.json();
      const b = Array.isArray(data) ? toBoundary(data[0]) : null;
      if (b) return b;
    }
  }

  const q = [loc.name, loc.country].filter(Boolean).join(', ');
  if (!q) return null;
  const url = `${NOMINATIM}/search?format=jsonv2&limit=1&q=${encodeURIComponent(q)}&${common}`;
  const res = await fetch(url, { signal, headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const data = await res.json();
  return Array.isArray(data) && data[0] ? toBoundary(data[0]) : null;
}

/** Autocomplete search. Pass an AbortSignal so stale requests can be cancelled. */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<GeoResult[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=6` +
    `&q=${encodeURIComponent(q)}&email=${encodeURIComponent(CONTACT_EMAIL)}`;
  const res = await fetch(url, {
    signal,
    headers: NOMINATIM_HEADERS,
  });
  if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(toResult);
}

/** Reverse-geocode a coordinate into a place name / country. */
export async function reverseGeocode(lng: number, lat: number, signal?: AbortSignal): Promise<GeoResult | null> {
  const url =
    `${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&zoom=12` +
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
