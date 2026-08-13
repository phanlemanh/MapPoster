import { resolveLocation, resolveBoundary, resolveCountryAt } from './geocode';
import { LAYOUTS } from '../../src/data/layouts';
import { THEMES, DEFAULT_THEME_ID } from '../../src/data/themes';
import type { FontKey, GeoJSONFeatureCollection, LayerKey, LayerState, MarkerIconKey } from '../../src/types';
import type { Chrome, RenderCamera, RenderConfig, RenderHighlightRegion, RenderMarker, RenderRoute } from '../../src/render/renderConfig';
import { resolveRoute, type RouteMode } from './route';
import { haversineMeters, initialBearingDeg, polylineLengthMeters, geometryAreaM2, spanKmOf, type LngLat } from './geometry';
import { FONTS } from '../../src/data/fonts';
import { MARKER_ICONS } from '../../src/data/markers';

export type FormatInput = string | { width: number; height: number };

/** One polyline to draw. Exactly one of `geojson` / `coords` — the Zod layer
 * refines that, and `resolveRoutes` re-checks it for callers who bypass Zod. */
export interface RouteInput {
  geojson?: GeoJSONFeatureCollection;
  coords?: [number, number][];
  /** Hỏi router đường đi THỰC TẾ bám đường. from/to nhận toạ độ hoặc tên địa danh. */
  route?: {
    from: [number, number] | string;
    to: [number, number] | string;
    via?: ([number, number] | string)[];
    mode?: RouteMode;
  };
  color?: string;
  width?: number;
}

export interface RenderMapParams {
  location: string | { lng: number; lat: number; zoom?: number };
  basemap?: 'vector' | 'satellite';
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
  camera?: Partial<RenderCamera> & {
    /** Frame one specific object instead of the default union auto-frame. */
    focus?: { kind: 'point' | 'region' | 'route'; index: number; paddingPct?: number };
  };
  /** Override the poster label. Geocoder naming is a heuristic — let the caller win. */
  placeName?: string;
  /** Show names along major roads (motorway/trunk/primary/secondary). Off by default: poster first. */
  labels?: boolean;
  routes?: RouteInput[];
  /** Geometry questions answered from the resolved config — no extra network. */
  measure?: { pairs?: [number, number][] };
  /** Encoder knobs. mp4-only — GIF ignores crf. */
  output?: { quality?: 'draft' | 'standard' | 'high' };
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

/**
 * Category per `FORMATS` entry, judged on what each preset actually is rather
 * than inherited wholesale from a single 'Video' default (Finding 4: that
 * default mislabeled every image-first social preset, and hid the Wallpaper
 * '4k' this table dedupes away behind a mislabeled Video one). Uses the same
 * vocabulary `LAYOUTS` uses (`LAYOUT_CATEGORIES`), plus 'Video' where a
 * preset is genuinely video-first.
 */
const FORMAT_CATEGORY: Record<keyof typeof FORMATS, FormatInfo['category']> = {
  tiktok: 'Video', // vertical short-form video
  story: 'Social', // 1080x1920 — an Instagram/Facebook Story post
  square: 'Social', // 1080x1080 — an Instagram square post
  landscape: 'Video', // horizontal video (e.g. YouTube)
  portrait: 'Social', // 1080x1350 — Instagram's 4:5 portrait post ratio
  // Wins the name collision with LAYOUTS's Desktop 4K Wallpaper entry
  // (identical 3840x2160) — its category must match what it dedupes away.
  '4k': 'Wallpaper',
};

/** Max edge, matching the WebGL canvas budget the layouts are designed against. */
export const MAX_EDGE = 4096;

/**
 * Max entries in `highlight.regions` / `highlight.points`, per array.
 *
 * Not a deployment knob like `MAPPOSTER_MAX_QUEUED_JOBS`: every *named* entry
 * costs one Nominatim lookup, and those are serialised behind the ≥1 req/s
 * limiter the geocoder holds to stay inside Nominatim's usage policy. So the
 * cost of a long array is not our CPU — it is sustained traffic at a shared
 * public service under someone else's name, which no deployment gets to opt
 * into by raising an env var. 32 clears every real use (the widest sweep on
 * the roadmap is a ~20-POI amenities scene) and bounds one call at ~32s of
 * third-party lookups per array instead of the ~28h an unbounded 100k-name
 * array would have cost.
 */
export const MAX_HIGHLIGHTS = 32;

function assertDim(n: number, label: string): number {
  if (!Number.isInteger(n) || n <= 0 || n > MAX_EDGE) {
    throw new Error(`Invalid ${label}: ${n} (must be an integer between 1 and ${MAX_EDGE})`);
  }
  return n;
}

/**
 * Bound an array whose every element costs a network round trip.
 *
 * Mirrored from the Zod `.max()` in tools.ts for the same reason
 * `assertLayers`/`assertMarkerSize` are: `makeTools` and `resolveConfig` are
 * both called directly (render_variants merges overrides onto an
 * already-validated base, and the tests construct params by hand), so the
 * schema boundary is bypassable and cannot be the only guard.
 */
/**
 * `basemap: 'satellite'` chỉ phục vụ được khi có nguồn tile — TỪ CHỐI thẳng khi
 * chưa cấu hình, không lặng lẽ rơi về vector.
 *
 * Đây là chỗ đường agent KHÁC đường web có chủ đích: ứng dụng web rơi về vector
 * (người dùng nhìn thấy ngay và tự hiểu), còn caller ở đây là agent KHÔNG nhìn
 * thấy ảnh — một nền im lặng rơi về vector sẽ trả về clip "thành công" với nội
 * dung sai và không tầng nào phía sau bắt được. Cùng chính sách `theme` lạ bị
 * từ chối thay vì rơi về mặc định.
 */
function assertBasemap(b: 'vector' | 'satellite' | undefined): 'vector' | 'satellite' | undefined {
  if (b === 'satellite' && !process.env.MAPPOSTER_SATELLITE_TILES) {
    throw new Error(
      'basemap "satellite" requires MAPPOSTER_SATELLITE_TILES (a {z}/{x}/{y} tile URL template) — refusing rather than silently falling back to the vector basemap',
    );
  }
  return b;
}

function assertHighlightCount(n: number, label: string): void {
  if (n > MAX_HIGHLIGHTS) {
    throw new Error(`Too many ${label}: ${n} (max ${MAX_HIGHLIGHTS} — each named entry costs one geocoding request)`);
  }
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

/**
 * Bearing has no engine-imposed range: MapLibre renders `bearing: -45`
 * correctly today, and `lerpAngle` (src/render/motionMath.ts) already
 * normalizes an arbitrary angle to `[0,360)` for the clip-motion path.
 * Rejecting anything outside 0..360 (as an earlier version of this function
 * did) is a regression — a caller passing a perfectly valid `-45` gets a
 * refusal instead of a picture. Normalize instead, so every consumer of
 * `RenderConfig.camera.bearing` sees the same `[0,360)` convention lerpAngle
 * already uses. Non-finite input is still rejected — there is no angle to
 * normalize it to.
 */
function normalizeBearing(b: number): number {
  if (!Number.isFinite(b)) throw new Error(`Invalid bearing: ${b} (must be a finite number)`);
  return ((b % 360) + 360) % 360;
}

/** 60, không phải 85: maxPitch mặc định của MapLibre là 60 — nhận 85 rồi để engine clamp là nhận-rồi-vứt. */
function assertPitch(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 60) throw new Error(`Invalid pitch: ${p} (must be between 0 and 60)`);
  return p;
}

/** 0..200%: 0 ôm sát bbox, 100 nới gấp đôi span. Trên 200 thì zoom clamp nuốt mất. */
function assertPaddingPct(p: number): number {
  if (!Number.isFinite(p) || p < 0 || p > 200) throw new Error(`Invalid camera.focus.paddingPct: ${p} (must be between 0 and 200)`);
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
  // `Object.hasOwn`, not a truthiness test: FORMATS is a plain object literal,
  // so `FORMATS['constructor']` walks up to Object.prototype and answers the
  // Object function — truthy, and returned as if it were a size. The caller
  // then got `{width: undefined}` and died later inside the renderer with an
  // opaque TypeError instead of "Unknown format" here. Same shape of lookup
  // the LAYOUTS/THEMES branches below already get right by using `.find`.
  if (Object.hasOwn(FORMATS, format)) return FORMATS[format];
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

/**
 * Cap TỔNG hình học nội tuyến, ngoài cap MỖI payload.
 *
 * `MAX_GEOJSON_BYTES` chặn một FeatureCollection khổng lồ, nhưng 40 tuyến mỗi
 * tuyến 1,9 MiB thì lọt qua từng cái một rồi cộng lại thành 76 MiB đi thẳng vào
 * trang render. Đường MCP stdio KHÔNG có cap body nào, nên đây là chốt duy nhất.
 */
export const MAX_TOTAL_GEOJSON_BYTES = 8 * 1024 * 1024;

/** Khớp `coalesce`-fallback của mapStyle (line-width 4) khi caller không khai. */
const DEFAULT_ROUTE_WIDTH = 4;

function assertRouteWidth(n: number): number {
  if (!Number.isFinite(n) || n < 1 || n > 16) throw new Error(`Invalid routes[].width: ${n} (must be between 1 and 16)`);
  return n;
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
    out.set(name, { name, ...s, aspect: aspectOf(s.width, s.height), category: FORMAT_CATEGORY[name as keyof typeof FORMATS] });
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

/**
 * Bbox bao mọi toạ độ trong danh sách FeatureCollection.
 *
 * Flatten đệ quy MÙ là CỐ Ý: bbox không cần biết đâu là outer ring, đâu là lỗ,
 * đâu là LineString — mọi toạ độ đều phải nằm trong khung. Diện tích thì ngược
 * lại và KHÔNG được tái dùng hàm này (xem `geometry.ts`).
 */
function bboxOfGeojsons(list: (GeoJSONFeatureCollection | undefined)[]): [number, number, number, number] | null {
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
  for (const gj of list) for (const f of gj?.features ?? []) if (f.geometry) visit(f.geometry);
  return isFinite(w) ? [w, s, e, n] : null;
}

/**
 * Biến `RouteInput` của caller thành `RenderRoute` cụ thể (geojson + màu + độ dày).
 * `theme` truyền vào để lấy accent làm màu mặc định — giữ tuyến hợp tông với bản đồ
 * thay vì đóng cứng một màu.
 */
export async function resolveRoutes(
  inputs: RouteInput[] | undefined,
  themeId: string,
  anchor?: string,
): Promise<RenderRoute[]> {
  const accent = THEMES.find((t) => t.id === themeId)?.colors.accent ?? '#e8b04b';
  const out: RenderRoute[] = [];

  for (const r of inputs ?? []) {
    const forms = [r.geojson != null, r.coords != null, r.route != null].filter(Boolean).length;
    if (forms !== 1) {
      throw new Error('Invalid routes[]: pass exactly one of routes[].geojson, routes[].coords or routes[].route');
    }

    const style = {
      color: r.color != null ? assertColor(r.color, 'routes[].color') : accent,
      width: r.width != null ? assertRouteWidth(r.width) : DEFAULT_ROUTE_WIDTH,
    };

    if (r.route) {
      // Tên địa danh đi qua ĐÚNG anchor quốc gia mà highlight dùng — nếu không,
      // "Bến Thành" có thể thành một chỗ trùng tên ở nước khác và tuyến sẽ vắt
      // ngang địa cầu mà không có lỗi nào.
      const at = async (v: [number, number] | string, label: string): Promise<[number, number]> =>
        typeof v === 'string' ? (await resolveLocation(v, anchor)).center : assertLngLat(v[0], v[1]);

      const routed = await resolveRoute({
        from: await at(r.route.from, 'routes[].route.from'),
        to: await at(r.route.to, 'routes[].route.to'),
        via: await Promise.all((r.route.via ?? []).map((v, i) => at(v, `routes[].route.via[${i}]`))),
        mode: r.route.mode,
      });
      out.push({ geojson: routed.geojson, ...style, distanceKm: routed.distanceKm, durationMin: routed.durationMin, provider: routed.provider });
      continue;
    }

    const geojson = r.coords ? coordsToLineString(r.coords) : assertGeojson(r.geojson, 'routes[].geojson');
    out.push({ geojson, ...style });
  }

  return out;
}

function coordsToLineString(coords: [number, number][]): GeoJSONFeatureCollection {
  if (!Array.isArray(coords) || coords.length < 2) {
    throw new Error(`Invalid routes[].coords: needs at least 2 positions, got ${Array.isArray(coords) ? coords.length : 0}`);
  }
  for (const c of coords) assertLngLat(c[0], c[1]);
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: coords } }],
  };
}

/** Mọi toạ độ của một tuyến, theo thứ tự vẽ — dùng để đo chiều dài. */
function routeCoords(gj: GeoJSONFeatureCollection | undefined): LngLat[] {
  const out: LngLat[] = [];
  for (const f of gj?.features ?? []) {
    const g = f?.geometry;
    if (g?.type === 'LineString') out.push(...(g.coordinates as LngLat[]));
    else if (g?.type === 'MultiLineString') for (const part of g.coordinates as LngLat[][]) out.push(...part);
  }
  return out;
}

export interface ResolvedRoute {
  bbox: [number, number, number, number] | null;
  /** Chiều dài polyline — tổng các đoạn, KHÔNG phải đường chim bay đầu-cuối. */
  lengthKm: number;
  pointCount: number;
  /**
   * Chỉ có khi tuyến đi qua router. `distanceKm` là quãng đường ROUTER báo,
   * khác `lengthKm` mà ta tự đo trên polyline đã decimate — hai phép đo khác
   * nhau, cùng tồn tại thay vì gộp làm một con số mập mờ.
   */
  distanceKm?: number;
  durationMin?: number;
  provider?: string;
}

export function summarizeRoutes(cfg: RenderConfig): ResolvedRoute[] {
  return (cfg.routes ?? []).map((r) => ({
    bbox: bboxOfGeojsons([r.geojson]),
    lengthKm: polylineLengthMeters(routeCoords(r.geojson)) / 1000,
    pointCount: routeCoords(r.geojson).length,
    // Chỉ đính khi tuyến ĐI QUA router — đây là sự thật của router, không phải
    // thứ suy ra được từ một polyline caller tự vẽ.
    ...(r.distanceKm != null ? { distanceKm: r.distanceKm, durationMin: r.durationMin, provider: r.provider } : {}),
  }));
}

export interface ResolvedMeasures {
  /** Đường chim bay giữa hai điểm highlight — KHÔNG phải quãng đường đi. */
  pairs: { from: number; to: number; straightLineKm: number; bearingDeg: number }[];
  routes: { index: number; lengthKm: number }[];
  regions: { index: number; areaKm2: number; spanKm: { ew: number; ns: number }; centroid: LngLat | null }[];
}

/**
 * Trả lời các câu hỏi hình học từ config ĐÃ resolve — không tốn thêm lời gọi mạng.
 *
 * Tên trường nói rõ PHÉP ĐO: `straightLineKm` (chim bay) khác hẳn quãng đường đi,
 * `lengthKm` là tổng polyline. Một trường tên `km` trần sẽ được phía tiêu thụ đọc
 * thành "khoảng cách" rồi in lên video — đó là cách một con số đúng trở thành một
 * khẳng định sai.
 */
export function summarizeMeasures(cfg: RenderConfig): ResolvedMeasures {
  const markers = cfg.markers ?? [];
  const pairs = (cfg.measure?.pairs ?? []).map(([a, b]) => {
    const p1: LngLat = [markers[a].lng, markers[a].lat];
    const p2: LngLat = [markers[b].lng, markers[b].lat];
    return { from: a, to: b, straightLineKm: haversineMeters(p1, p2) / 1000, bearingDeg: initialBearingDeg(p1, p2) };
  });

  const routes = (cfg.routes ?? []).map((r, index) => ({
    index,
    lengthKm: polylineLengthMeters(routeCoords(r.geojson)) / 1000,
  }));

  const regions = (cfg.highlight?.regions ?? []).map((r, index) => {
    const bbox = bboxOfGeojsons([r.geojson]);
    const areaM2 = (r.geojson?.features ?? []).reduce(
      (acc: number, f: { geometry?: { type: string; coordinates: unknown } }) => acc + geometryAreaM2(f?.geometry),
      0,
    );
    return {
      index,
      areaKm2: areaM2 / 1_000_000,
      spanKm: bbox ? spanKmOf(bbox) : { ew: 0, ns: 0 },
      centroid: bbox ? ([(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] as LngLat) : null,
    };
  });

  return { pairs, routes, regions };
}

export interface ResolvedHighlights {
  regions: {
    bbox: [number, number, number, number] | null;
    center: [number, number] | null;
    osmType?: 'node' | 'way' | 'relation';
    osmId?: number;
    displayName?: string;
    placeRank?: number;
  }[];
  points: { lng: number; lat: number }[];
}

/**
 * What the agent actually got, per the tool contract's `resolved.highlights`.
 * Region names are resolved server-side, so echo each one's extent — that is the
 * only way a caller can tell which "District 1" it ended up with. For a named
 * region we also echo the matched OSM entity's identity; inline-geojson regions
 * carry no such identity, so the fields are omitted rather than `undefined`.
 */
export function summarizeHighlights(cfg: RenderConfig): ResolvedHighlights {
  const regions = (cfg.highlight?.regions ?? []).map((r) => {
    const bbox = bboxOfGeojsons([r.geojson]);
    const center: [number, number] | null = bbox ? [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2] : null;
    return {
      bbox,
      center,
      ...(r.osmType != null ? { osmType: r.osmType, osmId: r.osmId, displayName: r.displayName, placeRank: r.placeRank } : {}),
    };
  });
  return { regions, points: (cfg.markers ?? []).map((m) => ({ lng: m.lng, lat: m.lat })) };
}

function zoomFromSpan(span: number): number {
  if (!isFinite(span) || span <= 0) return 12;
  return Math.min(15, Math.max(3, Math.round((Math.log2(360 / span) + 0.2) * 10) / 10));
}

/** Nới nhẹ để đối tượng không dính sát mép khung. */
const DEFAULT_FOCUS_PADDING_PCT = 12;

const STREET_ZOOM = 16; // within the 14–17 street band

/** Turn tool params into a fully-resolved RenderConfig (geocode + auto-frame). */
export async function resolveConfig(params: RenderMapParams): Promise<RenderConfig> {
  if (typeof params.location === 'object') {
    assertLngLat(params.location.lng, params.location.lat);
    if (params.location.zoom != null) assertZoom(params.location.zoom);
  }
  if (params.camera?.center) assertLngLat(params.camera.center[0], params.camera.center[1]);
  if (params.camera?.zoom != null) assertZoom(params.camera.zoom);
  const bearing = params.camera?.bearing != null ? normalizeBearing(params.camera.bearing) : undefined;
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
  assertHighlightCount(rawRegions.length, 'highlight.regions');

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
  assertHighlightCount(rawPoints.length, 'highlight.points');

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
      const b = await resolveBoundary(name, anchor);
      // Fail loudly, matching the point path (resolveLocation throws). Silently
      // dropping the region would return a "successful" poster missing the very
      // highlight the caller asked for.
      if (!b) throw new Error(`No boundary found for region "${name}"${anchor ? ` in ${anchor}` : ''}`);
      regions.push({ geojson: b.geojson, color: rColor, osmType: b.osmType, osmId: b.osmId, displayName: b.displayName, placeRank: b.placeRank });
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

  const routes = await resolveRoutes(params.routes, theme, anchor);

  // Cap TỔNG: từng payload đã qua MAX_GEOJSON_BYTES, nhưng nhiều payload hợp lệ
  // cộng lại vẫn đủ giết trang render. Tính sau khi resolve để đo đúng thứ sẽ đi
  // qua dây, không phải thứ caller gửi.
  const totalBytes = [...regions.map((r) => r.geojson), ...routes.map((r) => r.geojson)]
    .reduce((acc, gj) => acc + Buffer.byteLength(JSON.stringify(gj)), 0);
  if (totalBytes > MAX_TOTAL_GEOJSON_BYTES) {
    throw new Error(`Invalid request: total inline GeoJSON is ${totalBytes} bytes, over the ${MAX_TOTAL_GEOJSON_BYTES}-byte limit`);
  }

  // Chỉ số trỏ vào markers ĐÃ resolve, nên phải kiểm sau vòng markers. Từ chối
  // thay vì lặng lẽ bỏ cặp sai: agent không nhìn thấy ảnh, một phép đo biến mất
  // là một phép đo không thể phát hiện.
  for (const pair of params.measure?.pairs ?? []) {
    const [a, b] = pair;
    if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0 || a >= markers.length || b >= markers.length) {
      throw new Error(`Invalid measure.pairs entry [${a}, ${b}]: index out of range (${markers.length} point(s) available)`);
    }
  }

  const cam = params.camera ?? {};
  const focus = cam.focus;
  if (focus && (cam.center || cam.zoom != null)) {
    // Từ chối thay vì chọn bên thắng: hai cách chỉ định khung mà im lặng ưu tiên
    // một bên là đúng lớp lỗi agent không thể phát hiện (nó không thấy ảnh).
    throw new Error('Invalid camera.focus: mutually exclusive with camera.center / camera.zoom — pass one or the other');
  }

  let center = cam.center ?? base.center;
  let zoom = cam.zoom ?? base.zoom;

  if (focus) {
    const pad = focus.paddingPct != null ? assertPaddingPct(focus.paddingPct) : DEFAULT_FOCUS_PADDING_PCT;
    const pool = focus.kind === 'region' ? regions.map((r) => r.geojson)
               : focus.kind === 'route' ? routes.map((r) => r.geojson)
               : null;
    if (focus.kind === 'point') {
      if (!Number.isInteger(focus.index) || focus.index < 0 || focus.index >= markers.length) {
        throw new Error(`Invalid camera.focus: index out of range (${markers.length} point(s) available)`);
      }
      center = [markers[focus.index].lng, markers[focus.index].lat];
      zoom = STREET_ZOOM;
    } else {
      const list = pool as GeoJSONFeatureCollection[];
      if (!Number.isInteger(focus.index) || focus.index < 0 || focus.index >= list.length) {
        throw new Error(`Invalid camera.focus: index out of range (${list.length} ${focus.kind}(s) available)`);
      }
      const bbox = bboxOfGeojsons([list[focus.index]]);
      if (!bbox) throw new Error(`Invalid camera.focus: ${focus.kind}[${focus.index}] has no coordinates to frame`);
      center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
      const span = Math.max(Math.abs(bbox[3] - bbox[1]), Math.abs(bbox[2] - bbox[0]));
      zoom = zoomFromSpan(span * (1 + pad / 100));
    }
  } else if (cam.zoom == null) {
    // Chỉ có tuyến mà không có vùng/điểm thì vẫn phải ôm được tuyến — nếu không
    // một lời gọi route-only sẽ khung vào tâm thành phố và tuyến nằm ngoài mép.
    const framed = regions.length ? regions.map((r) => r.geojson) : routes.length ? routes.map((r) => r.geojson) : null;
    if (framed) {
      const bbox = bboxOfGeojsons(framed);
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
    camera: { center, zoom, bearing, pitch: cam.pitch },
    size,
    theme,
    chrome,
    place: params.placeName ? { ...base.place, name: params.placeName } : base.place,
    highlight,
    markers: markers.length ? markers : undefined,
    routes: routes.length ? routes : undefined,
    basemap: assertBasemap(params.basemap),
    satelliteTiles: params.basemap === 'satellite' ? process.env.MAPPOSTER_SATELLITE_TILES : undefined,
    measure: params.measure,
    layers:
      layers || params.labels
        ? { ...(layers ?? {}), ...(params.labels ? { roadLabels: true } : {}) }
        : undefined,
    detail,
    font,
  };
}
