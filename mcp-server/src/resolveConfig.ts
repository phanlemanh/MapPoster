import { resolveLocation, resolveBoundary, resolveCountryAt } from './geocode';
import { LAYOUTS } from '../../src/data/layouts';
import { THEMES, DEFAULT_THEME_ID } from '../../src/data/themes';
import type { GeoJSONFeatureCollection, MarkerIconKey } from '../../src/types';
import type { Chrome, RenderCamera, RenderConfig, RenderHighlightRegion, RenderMarker } from '../../src/render/renderConfig';

export type FormatInput = string | { width: number; height: number };

export interface RenderMapParams {
  location: string | { lng: number; lat: number; zoom?: number };
  highlight?: {
    regions?: (string | { geojson: GeoJSONFeatureCollection })[];
    points?: (string | { lng: number; lat: number })[];
    color?: string;
    fill?: boolean;
    dim?: boolean;
    pointIcon?: MarkerIconKey;
  };
  format?: FormatInput;
  theme?: string;
  chrome?: Chrome;
  camera?: Partial<RenderCamera>;
  /** Override the poster label. Geocoder naming is a heuristic — let the caller win. */
  placeName?: string;
}

/** Named format presets (video-first). Layout ids also resolve via getLayout. */
export const FORMATS: Record<string, { width: number; height: number }> = {
  tiktok: { width: 1080, height: 1920 },
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  '4k': { width: 3840, height: 2160 },
};

/** Max edge, matching the WebGL canvas budget the layouts are designed against. */
export const MAX_EDGE = 4096;

function assertDim(n: number, label: string): number {
  if (!Number.isInteger(n) || n <= 0 || n > MAX_EDGE) {
    throw new Error(`Invalid ${label}: ${n} (must be an integer between 1 and ${MAX_EDGE})`);
  }
  return n;
}

/** Runtime bounds, enforced even for callers that bypass the Zod layer
 * (e.g. render_variants overrides merged onto a validated base). */
function assertLngLat(lng: number, lat: number): [number, number] {
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) throw new Error(`Invalid longitude: ${lng} (must be between -180 and 180)`);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) throw new Error(`Invalid latitude: ${lat} (must be between -90 and 90)`);
  return [lng, lat];
}

function assertZoom(zoom: number): number {
  if (!Number.isFinite(zoom) || zoom < 0 || zoom > 22) throw new Error(`Invalid zoom: ${zoom} (must be between 0 and 22)`);
  return zoom;
}

export function formatSize(format?: FormatInput): { width: number; height: number } {
  if (!format) return FORMATS.tiktok;
  if (typeof format === 'object') {
    return { width: assertDim(format.width, 'width'), height: assertDim(format.height, 'height') };
  }
  if (FORMATS[format]) return FORMATS[format];
  const layout = LAYOUTS.find((l) => l.id === format);
  if (layout) return { width: layout.width, height: layout.height };
  throw new Error(`Unknown format: ${format}`);
}

/**
 * Reject an unknown theme rather than fall back to the default.
 *
 * `getTheme` answers `THEMES[0]` for anything it doesn't recognise, and the
 * agent calling this server never sees the image — so `theme: 'rubby'` would
 * return a midnight-blue poster with no error and no signal. Every other
 * discrete parameter here (`format`, `chrome`, `pointIcon`) refuses bad input.
 */
function assertTheme(id: string): string {
  if (THEMES.some((t) => t.id === id)) return id;
  throw new Error(`Unknown theme: ${id}. Known themes: ${THEMES.map((t) => t.id).join(', ')}`);
}

/** List every format name an agent may pass. */
export function listFormats(): { name: string; width: number; height: number }[] {
  const out = Object.entries(FORMATS).map(([name, s]) => ({ name, ...s }));
  for (const l of LAYOUTS) out.push({ name: l.id, width: l.width, height: l.height });
  return out;
}

function bboxOfRegions(regions: RenderHighlightRegion[]): [number, number, number, number] | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const visit = (geom: { type: string; coordinates: unknown }) => {
    const flat = (arr: unknown): void => {
      if (Array.isArray(arr) && typeof arr[0] === 'number') {
        const [lng, lat] = arr as number[];
        if (lng < w) w = lng; if (lng > e) e = lng; if (lat < s) s = lat; if (lat > n) n = lat;
      } else if (Array.isArray(arr)) arr.forEach(flat);
    };
    flat(geom.coordinates);
  };
  for (const r of regions) for (const f of r.geojson?.features ?? []) if (f.geometry) visit(f.geometry);
  return isFinite(w) ? [w, s, e, n] : null;
}

export interface ResolvedHighlights {
  regions: { bbox: [number, number, number, number] | null; center: [number, number] | null }[];
  points: { lng: number; lat: number }[];
}

/**
 * What the agent actually got, per the tool contract's `resolved.highlights`.
 * Region names are resolved server-side, so echo each one's extent — that is the
 * only way a caller can tell which "District 1" it ended up with.
 */
export function summarizeHighlights(cfg: RenderConfig): ResolvedHighlights {
  const regions = (cfg.highlight?.regions ?? []).map((r) => {
    const bbox = bboxOfRegions([r]);
    const center: [number, number] | null = bbox ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] : null;
    return { bbox, center };
  });
  return { regions, points: (cfg.markers ?? []).map((m) => ({ lng: m.lng, lat: m.lat })) };
}

function zoomFromSpan(span: number): number {
  if (!isFinite(span) || span <= 0) return 12;
  return Math.min(15, Math.max(3, Math.round((Math.log2(360 / span) + 0.2) * 10) / 10));
}

const STREET_ZOOM = 16; // within the 14–17 street band

/** Turn tool params into a fully-resolved RenderConfig (geocode + auto-frame). */
export async function resolveConfig(params: RenderMapParams): Promise<RenderConfig> {
  if (typeof params.location === 'object') {
    assertLngLat(params.location.lng, params.location.lat);
    if (params.location.zoom != null) assertZoom(params.location.zoom);
  }
  if (params.camera?.center) assertLngLat(params.camera.center[0], params.camera.center[1]);
  if (params.camera?.zoom != null) assertZoom(params.camera.zoom);

  const base = await resolveLocation(params.location);
  const size = formatSize(params.format);
  const theme = assertTheme(params.theme ?? DEFAULT_THEME_ID);
  const chrome: Chrome = params.chrome ?? 'clean';

  // Anchor every highlight to the country of the location being rendered. Region
  // auto-framing (below) follows the region's bbox, so an unanchored "District 1"
  // — whose top Nominatim hit is in Liberia — would silently relocate the poster.
  //
  // An explicit {lng,lat} location carries no country, so look one up rather than
  // let the guard pass everything. Fail closed: if we cannot say what country the
  // map is in, we cannot vouch for a highlight resolved by name.
  const namedHighlight =
    (params.highlight?.regions ?? []).some((r) => typeof r === 'string') ||
    (params.highlight?.points ?? []).some((p) => typeof p === 'string');

  let anchor = base.place.country || undefined;
  if (namedHighlight && !anchor) {
    const [lng, lat] = base.center;
    anchor = (await resolveCountryAt(lng, lat)) ?? undefined;
    if (!anchor) {
      throw new Error(
        `Cannot determine the country at ${lat}, ${lng} to anchor the highlight. ` +
          `Pass highlight regions/points as explicit coordinates or GeoJSON.`,
      );
    }
  }

  const regions: RenderHighlightRegion[] = [];
  for (const r of params.highlight?.regions ?? []) {
    if (typeof r === 'string') {
      const gj = await resolveBoundary(r, anchor);
      // Fail loudly, matching the point path (resolveLocation throws). Silently
      // dropping the region would return a "successful" poster missing the very
      // highlight the caller asked for.
      if (!gj) throw new Error(`No boundary found for region "${r}"${anchor ? ` in ${anchor}` : ''}`);
      regions.push({ geojson: gj, color: null });
    } else {
      regions.push({ geojson: r.geojson, color: null });
    }
  }

  const markers: RenderMarker[] = [];
  for (const p of params.highlight?.points ?? []) {
    const center = typeof p === 'string' ? (await resolveLocation(p, anchor)).center : assertLngLat(p.lng, p.lat);
    markers.push({
      lng: center[0],
      lat: center[1],
      icon: params.highlight?.pointIcon ?? 'pin',
      color: params.highlight?.color ?? '#ffffff',
      size: 44,
    });
  }

  const cam = params.camera ?? {};
  let center = cam.center ?? base.center;
  let zoom = cam.zoom ?? base.zoom;
  if (cam.zoom == null) {
    if (regions.length) {
      const bbox = bboxOfRegions(regions);
      if (bbox) {
        if (!cam.center) center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
        zoom = zoomFromSpan(Math.max(Math.abs(bbox[3] - bbox[1]), Math.abs(bbox[2] - bbox[0])));
      }
    } else if (markers.length) {
      zoom = STREET_ZOOM;
      if (!cam.center) center = [markers[0].lng, markers[0].lat];
    }
  }

  const highlight = regions.length
    ? { regions, color: params.highlight?.color ?? null, fill: params.highlight?.fill ?? true, dim: params.highlight?.dim ?? false }
    : undefined;

  return {
    camera: { center, zoom, bearing: cam.bearing, pitch: cam.pitch },
    size,
    theme,
    chrome,
    place: params.placeName ? { ...base.place, name: params.placeName } : base.place,
    highlight,
    markers: markers.length ? markers : undefined,
  };
}
