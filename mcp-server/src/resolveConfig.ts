import { resolveLocation, resolveBoundary, resolveCountryAt } from './geocode';
import { LAYOUTS } from '../../src/data/layouts';
import { THEMES, DEFAULT_THEME_ID } from '../../src/data/themes';
import type { FontKey, GeoJSONFeatureCollection, LayerKey, LayerState, MarkerIconKey } from '../../src/types';
import type { Chrome, RenderCamera, RenderConfig, RenderHighlightRegion, RenderMarker } from '../../src/render/renderConfig';
import { FONTS } from '../../src/data/fonts';
import { MARKER_ICONS } from '../../src/data/markers';

export type FormatInput = string | { width: number; height: number };

export interface RenderMapParams {
  location: string | { lng: number; lat: number; zoom?: number };
  highlight?: {
    regions?: (string | { name: string; color?: string } | { geojson: GeoJSONFeatureCollection; color?: string })[];
    points?: (
      | string
      | { lng: number; lat: number; icon?: MarkerIconKey; color?: string; size?: number }
      | { query: string; icon?: MarkerIconKey; color?: string; size?: number }
    )[];
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
  /** Show names along major roads (motorway/trunk/primary/secondary). Off by default: poster first. */
  labels?: boolean;
  /** Per-layer visibility. Mutually exclusive with `labels` for roadLabels. */
  layers?: Partial<LayerState>;
  /** 0..1 map detail (road-width ramp; minor roads appear strictly above 0.12). */
  detail?: number;
  font?: FontKey;
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

function assertBearing(b: number): number {
  if (!Number.isFinite(b) || b < 0 || b > 360) throw new Error(`Invalid bearing: ${b} (must be between 0 and 360)`);
  return b;
}

/** 60, không phải 85: maxPitch mặc định của MapLibre là 60 — nhận 85 rồi để engine clamp là nhận-rồi-vứt. */
function assertPitch(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 60) throw new Error(`Invalid pitch: ${p} (must be between 0 and 60)`);
  return p;
}

function assertDetail(d: number): number {
  if (!Number.isFinite(d) || d < 0 || d > 1) throw new Error(`Invalid detail: ${d} (must be between 0 and 1)`);
  return d;
}

function assertFont(key: string): FontKey {
  if (FONTS.some((f) => f.key === key)) return key as FontKey;
  throw new Error(`Unknown font: ${key}. Known fonts: ${FONTS.map((f) => f.key).join(', ')}`);
}

/** Mirror `layerStateSchema` in tools.ts — do not let the two drift. */
const LAYER_KEYS: LayerKey[] = ['landcover', 'buildings', 'water', 'parks', 'roads', 'rail', 'aeroway', 'roadLabels'];

/**
 * `layers` is spread straight into `applyRenderConfig`'s `{ ...ALL_LAYERS_ON,
 * ...(cfg.layers ?? {}) }` merge, producing a `LayerState` (typed
 * `Record<LayerKey, boolean>`). Bound it here as well as at the Zod boundary —
 * every runtime guard in this file exists because the boundary can be
 * bypassed (`makeTools` is called directly).
 */
function assertLayers(value: Partial<LayerState>): Partial<LayerState> {
  for (const [key, v] of Object.entries(value)) {
    if (!LAYER_KEYS.includes(key as LayerKey)) {
      throw new Error(`Unknown layer: ${key}. Known layers: ${LAYER_KEYS.join(', ')}`);
    }
    if (typeof v !== 'boolean') {
      throw new Error(`Invalid layer value for ${key}: ${JSON.stringify(v)} (must be a boolean)`);
    }
  }
  return value;
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

/** Inline region GeoJSON travels to the render page and into MapLibre. Bound it. */
export const MAX_GEOJSON_BYTES = 2 * 1024 * 1024;

/**
 * The only boundary field that used to accept anything at all (`z.any()`).
 * A minimal shape check plus a size bound: it is consumed as data, never as a
 * script sink, so the risk is a malformed source that MapLibre rejects (surfacing
 * 20 s later as a render timeout) or a payload large enough to hurt.
 */
export function assertGeojson(value: unknown, label = 'highlight.regions[].geojson'): GeoJSONFeatureCollection {
  const gj = value as GeoJSONFeatureCollection | null;
  if (!gj || typeof gj !== 'object' || gj.type !== 'FeatureCollection' || !Array.isArray(gj.features)) {
    throw new Error(`Invalid ${label}: expected a GeoJSON FeatureCollection`);
  }
  for (const f of gj.features) {
    if (!f || typeof f !== 'object' || !f.geometry) throw new Error(`Invalid ${label}: a feature has no geometry`);
  }
  const bytes = Buffer.byteLength(JSON.stringify(gj));
  if (bytes > MAX_GEOJSON_BYTES) {
    throw new Error(`Invalid ${label}: ${bytes} bytes exceeds the ${MAX_GEOJSON_BYTES}-byte limit`);
  }
  return gj;
}

const HEX_COLOR = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/**
 * The highlight colour is the one discrete visual parameter that reaches
 * `innerHTML`: it is interpolated raw into the marker SVG's `fill="…"`, so a
 * value like `"/><img src=x onerror=…>` is injected into the render page. Bound
 * it here as well as at the Zod boundary — every runtime guard in this file
 * exists because the boundary can be bypassed (`makeTools` is called directly).
 */
export function assertColor(value: string, label = 'color'): string {
  if (HEX_COLOR.test(value)) return value;
  throw new Error(`Invalid ${label}: ${JSON.stringify(value)} — expected a hex colour like "#e8b04b"`);
}

/**
 * `drawMarker` does no clamping of its own: a size of 5000 paints over the
 * whole canvas, a size of 0 is invisible. Bound it here as well as at the Zod
 * boundary — every runtime guard in this file exists because the boundary can
 * be bypassed (`makeTools` is called directly).
 */
function assertMarkerSize(n: number): number {
  if (!Number.isFinite(n) || n < 18 || n > 140) {
    throw new Error(`Invalid highlight.points[].size: ${n} (must be between 18 and 140)`);
  }
  return n;
}

/**
 * Reject an unknown marker icon rather than fall back to the default.
 *
 * `getMarkerIcon` answers `MARKER_ICONS[0]` ('pin') for anything it doesn't
 * recognise, and the agent calling this server never sees the image — so
 * `icon: 'rocket'` would silently render a pin with no error and no signal.
 * Same defect class as `assertTheme` above; bound it here as well as at the
 * Zod boundary — every runtime guard in this file exists because the
 * boundary can be bypassed (`makeTools` is called directly).
 */
function assertMarkerIcon(key: string, label = 'highlight.points[].icon'): MarkerIconKey {
  if (MARKER_ICONS.some((m) => m.key === key)) return key as MarkerIconKey;
  throw new Error(`Invalid ${label}: ${key}. Known icons: ${MARKER_ICONS.map((m) => m.key).join(', ')}`);
}

export interface FormatInfo {
  name: string;
  width: number;
  height: number;
  /** reduced ratio, e.g. '9:16' */
  aspect: string;
  category: 'Video' | 'Print' | 'Social' | 'Wallpaper' | 'Web';
  print?: { w: number; h: number; unit: 'mm' | 'in' };
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
const aspectOf = (w: number, h: number): string => {
  const g = gcd(w, h);
  return `${w / g}:${h / g}`;
};

/** List every format name an agent may pass. FORMATS wins a name collision ('4k' exists in both). */
export function listFormats(): FormatInfo[] {
  const out = new Map<string, FormatInfo>();
  for (const [name, s] of Object.entries(FORMATS)) {
    out.set(name, { name, ...s, aspect: aspectOf(s.width, s.height), category: 'Video' });
  }
  for (const l of LAYOUTS) {
    if (out.has(l.id)) continue;
    out.set(l.id, {
      name: l.id, width: l.width, height: l.height,
      aspect: aspectOf(l.width, l.height), category: l.category,
      ...(l.print ? { print: l.print } : {}),
    });
  }
  return [...out.values()];
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
  if (params.camera?.bearing != null) assertBearing(params.camera.bearing);
  if (params.camera?.pitch != null) assertPitch(params.camera.pitch);

  // Validate everything cheap BEFORE the first network call: a bad theme or
  // colour should not cost a Nominatim request against our rate limit.
  const size = formatSize(params.format);
  const theme = assertTheme(params.theme ?? DEFAULT_THEME_ID);
  const chrome: Chrome = params.chrome ?? 'clean';
  const color = params.highlight?.color != null ? assertColor(params.highlight.color, 'highlight.color') : undefined;
  if (params.labels !== undefined && params.layers?.roadLabels !== undefined) {
    throw new Error('Pass either labels or layers.roadLabels, not both — they set the same switch');
  }
  const layers = params.layers != null ? assertLayers(params.layers) : undefined;
  const detail = params.detail != null ? assertDetail(params.detail) : undefined;
  const font = params.font != null ? assertFont(params.font) : undefined;
  const pointIcon =
    params.highlight?.pointIcon != null
      ? assertMarkerIcon(params.highlight.pointIcon, 'highlight.pointIcon')
      : undefined;

  // Single read of `params.highlight?.regions` — the colour pass and the region
  // loop below both index into the same array, and that index alignment is
  // load-bearing. Binding it once removes the implicit invariant that nothing
  // mutates `params` between two separate reads.
  const rawRegions = params.highlight?.regions ?? [];

  // Validate every per-region colour here too — the region loop below hits the
  // network once per named region (resolveBoundary), so without this a bad
  // colour on region 3 would only surface after regions 1 and 2 already spent
  // a request. Pre-validating up front keeps the same "fail before network"
  // guarantee the global colour and theme checks above already have.
  const regionColors = rawRegions.map((r) =>
    typeof r === 'object' && r.color != null ? assertColor(r.color, 'highlight.regions[].color') : null,
  );

  // Single read of `params.highlight?.points` — same reasoning as `rawRegions`
  // above: the colour/size pass and the marker loop below both index into the
  // same array, and that index alignment is load-bearing.
  const rawPoints = params.highlight?.points ?? [];

  // Validate every per-point colour and size here too, before the base
  // location lookup below and before the marker loop's per-point
  // resolveLocation calls (bare-string and {query} forms both hit the
  // network). Without this a bad size or colour on a later point would only
  // surface after earlier points already spent a geocoding request.
  const pointColors = rawPoints.map((p) =>
    typeof p !== 'string' && p.color != null ? assertColor(p.color, 'highlight.points[].color') : null,
  );
  const pointSizes = rawPoints.map((p) => (typeof p !== 'string' && p.size != null ? assertMarkerSize(p.size) : null));
  const pointIcons = rawPoints.map((p) => (typeof p !== 'string' && p.icon != null ? assertMarkerIcon(p.icon) : null));

  const base = await resolveLocation(params.location);

  // Anchor every highlight to the country of the location being rendered. Region
  // auto-framing (below) follows the region's bbox, so an unanchored "District 1"
  // — whose top Nominatim hit is in Liberia — would silently relocate the poster.
  //
  // An explicit {lng,lat} location carries no country, so look one up rather than
  // let the guard pass everything. Fail closed: if we cannot say what country the
  // map is in, we cannot vouch for a highlight resolved by name.
  const namedHighlight =
    rawRegions.some((r) => typeof r === 'string' || 'name' in r) ||
    rawPoints.some((p) => typeof p === 'string' || 'query' in p);

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
  for (let i = 0; i < rawRegions.length; i++) {
    const r = rawRegions[i];
    const rColor = regionColors[i];
    if (typeof r === 'string' || 'name' in r) {
      const name = typeof r === 'string' ? r : r.name;
      const gj = await resolveBoundary(name, anchor);
      // Fail loudly, matching the point path (resolveLocation throws). Silently
      // dropping the region would return a "successful" poster missing the very
      // highlight the caller asked for.
      if (!gj) throw new Error(`No boundary found for region "${name}"${anchor ? ` in ${anchor}` : ''}`);
      regions.push({ geojson: gj, color: rColor });
    } else {
      regions.push({ geojson: assertGeojson(r.geojson), color: rColor });
    }
  }

  const markers: RenderMarker[] = [];
  for (let i = 0; i < rawPoints.length; i++) {
    const p = rawPoints[i];
    const center =
      typeof p === 'string'
        ? (await resolveLocation(p, anchor)).center
        : 'query' in p
          ? (await resolveLocation(p.query, anchor)).center
          : assertLngLat(p.lng, p.lat);
    markers.push({
      lng: center[0],
      lat: center[1],
      icon: pointIcons[i] ?? pointIcon ?? 'pin',
      color: pointColors[i] ?? color ?? '#ffffff',
      size: pointSizes[i] ?? 44,
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
    ? { regions, color: color ?? null, fill: params.highlight?.fill ?? true, dim: params.highlight?.dim ?? false }
    : undefined;

  return {
    camera: { center, zoom, bearing: cam.bearing, pitch: cam.pitch },
    size,
    theme,
    chrome,
    place: params.placeName ? { ...base.place, name: params.placeName } : base.place,
    highlight,
    markers: markers.length ? markers : undefined,
    layers:
      layers || params.labels
        ? { ...(layers ?? {}), ...(params.labels ? { roadLabels: true } : {}) }
        : undefined,
    detail,
    font,
  };
}
