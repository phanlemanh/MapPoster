import { createRoot } from 'react-dom/client';
import type { Map as MlMap } from 'maplibre-gl';
import '../index.css';
import RenderApp from './RenderApp';
import { applyRenderConfig } from './applyRenderConfig';
import type { RenderConfig, RenderCamera, RenderHighlightRegion } from './renderConfig';
import { usePosterStore } from '../store/usePosterStore';
import { getMapInstance } from '../lib/mapRef';
import { composePoster, composeOverlays, snapshotMap, type PulseOpts } from '../lib/export';
import { getFont } from '../data/fonts';
import { getTheme } from '../data/themes';
import { formatCoords } from '../lib/format';
import { cameraAt, trackProgress, sliceRing, pulsePhase } from './motionMath';
import { assertCameraAtRest, assertNoPitch, collectCoords, pctOf, regionAnchorOf, type ClipAnchors, type ResolvedCamera } from './anchors';
import type { GeoJSONFeatureCollection } from '../types';

export interface MapPosterApi {
  /** the exact base64url config string this document was loaded with */
  configKey: string;
  ready: Promise<void>;
  renderFrame(): Promise<{ dataUrl: string; width: number; height: number }>;
  /**
   * One animation frame at phase t ∈ [0,1) — radar ripples around the markers.
   * The expensive map snapshot is taken on the first call and reused, so a
   * whole sequence costs one map render plus N cheap 2D composites.
   */
  renderAnimationFrame(t: number, pulse?: Omit<PulseOpts, 't'>): Promise<{ dataUrl: string; width: number; height: number }>;
  setCamera(cam: RenderCamera): Promise<void>;
  /** One motion clip frame at tSec — a PURE function of time: jumpTo + reveal + overlay. */
  renderMotionFrame(tSec: number, opts?: { pulsePhase?: number }): Promise<{ dataUrl: string; width: number; height: number }>;
  /** Fly through the camera keyframes to warm the tile cache before real capture — best-effort. */
  prefetchMotion(): Promise<void>;
  /**
   * CHỈ ĐỌC. Nơi các điểm/vùng quan tâm nằm trên khung, theo PHẦN TRĂM, tại
   * TRẠNG THÁI NGHỈ (`motion.restAtSec`) — khung mà tầng DOM đặt chữ lên.
   *
   * Không `jumpTo`, không đụng `restBase`/`animBase`/`lastApplied*`. Đây là
   * điều kiện tồn tại của hàm này, không phải một chi tiết hiện thực:
   * `renderMotionFrame` cache ảnh nền vào `restBase` ở `restAtSec` rồi mọi
   * khung đuôi tái dùng cache đó và chỉ vẽ lại overlay bằng camera HIỆN TẠI
   * của map — nên một hàm nào đó chiếu ở `t` tuỳ ý (một `anchorsAt(t)`) buộc
   * phải `jumpTo` và sẽ để camera ở chỗ khác, khiến khung đuôi kế tiếp vẽ
   * marker bằng camera SAI lên ảnh nền ĐÚNG. Chính lớp hỏng mà `setCamera`
   * phải reset `restBase` để phòng.
   *
   * ĐỒNG BỘ có chủ ý: một hàm không `await` thì không thể bị chèn một lời gọi
   * khác vào giữa lúc nó đang đọc camera.
   *
   * Tự KHẲNG ĐỊNH camera đang ở `restAtSec` thay vì tin vào thứ tự gọi — sai
   * chỗ thì ném, không bao giờ trả toạ độ tính từ một camera bất ngờ.
   * `pitch != 0` bị từ chối (xem `assertNoPitch`).
   */
  anchors(): ClipAnchors;
  /**
   * TEST-ONLY. Simulates the exact corruption class `verifyAndReapplyGeoAt`
   * guards against — MapView's post-load `setStyle({diff:true})` reverting
   * the `highlight` source's data to the full, un-revealed geometry — by
   * writing `highlightBaseData` straight to the source, bypassing
   * `applyGeoAt`'s progress cache. Lets e2e tests reproduce the race
   * deterministically instead of depending on real timing. Not reachable
   * from `renderFrame`, `renderAnimationFrame`, or the normal
   * `renderMotionFrame` path — has no effect on their behaviour. Returns
   * `false` if there is no `highlight` source or no captured base data.
   *
   * DEV-ONLY (Finding H): only attached when `import.meta.env.DEV` — Vite
   * dead-code-eliminates the whole branch out of a production build (`vite
   * build`, what the Dockerfile / mcp-server serve), so a fault-injection
   * hook never ships in the bundle anyone statically hosting `dist/` would
   * publish. e2e (`npm run test:e2e` / `playwright test`) runs against `vite`
   * the DEV server (see playwright.config.ts), where DEV is always true, so
   * the hook stays available there. Optional so a production build — where
   * it is genuinely absent from the object, not just a no-op — still
   * satisfies this interface.
   */
  simulateHighlightRevertForTest?(): boolean;
}

declare global {
  interface Window {
    __mapposter?: MapPosterApi;
  }
}

const MAP_INIT_TIMEOUT_MS = 8_000;
const IDLE_TIMEOUT_MS = 20_000;
/** Fallback for the `highlight-fill` layer's opacity, used ONLY if the ready-time
 * capture below finds no `highlight-fill` layer to read from (see
 * `highlightFillOpacity`). Mirrors `src/lib/mapStyle.ts`'s literal default —
 * kept as a last resort, not the source of truth. */
const DEFAULT_HIGHLIGHT_FILL_OPACITY = 0.26;
/**
 * MapView (shared with the interactive app) has a `useEffect` keyed on
 * `ready` that re-applies `map.setStyle(buildMapStyle(...), {diff:true})` the
 * moment the map's `load` event flips its local `ready` state — a one-time,
 * content-identical re-application in render mode, since every style-affecting
 * store field is already set (via applyRenderConfig) before the map ever
 * mounts. React schedules that effect as a passive effect (a macrotask), which
 * does not necessarily run before our own `idleOnce` below observes the map's
 * first 'idle'. Confirmed experimentally: without this settle window,
 * `renderMotionFrame` calling `setPaintProperty('highlight-fill', ...)` on its
 * very first invocation could be silently reverted moments later when that
 * effect's setStyle() finally landed — a real, reproducible determinism bug,
 * not a WebGL/network flake. This margin gives the effect time to dispatch and
 * land before the second `idleOnce` below waits out whatever re-tiling it
 * triggers; it only costs time once, at page startup.
 *
 * IMPORTANT: this timer is a cheap head start, not the correctness guarantee —
 * a reviewer measured the first 'idle' firing ~0.1ms after 'load', so 150ms had
 * been carrying the ENTIRE guarantee with zero incidental cushion. The real
 * guarantee is `verifyAndReapplyGeoAt` in `renderMotionFrame`, which reads back
 * the applied state after every frame and reapplies if this window wasn't
 * enough (e.g. a slow CI machine). Kept as an upper bound and to avoid paying
 * a reapply-and-rewait tax on every clip's first frame.
 */
const RESTYLE_SETTLE_MS = 150;

/** Resolve once `event` fires on `map` — used to race the restyle settle
 * window below so the common case (effect dispatches quickly) doesn't pay the
 * full fixed timeout. Returns a `dispose()` alongside the promise so a caller
 * that raced this against something else (e.g. `Promise.race` with `delay`)
 * can unregister the listener when this promise turns out to be the loser —
 * `map.off()` on an already-fired `once()` listener is a harmless no-op
 * (maplibre's `Evented.fire` already removes one-time listeners before
 * invoking them), so calling `dispose()` unconditionally after the race is
 * always safe. */
function onceEvent(map: MlMap, event: string): { promise: Promise<void>; dispose: () => void } {
  let handler: () => void = () => {};
  const promise = new Promise<void>((resolve) => {
    handler = () => resolve();
    map.once(event, handler);
  });
  return { promise, dispose: () => map.off(event, handler) };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function decodeConfig(b64: string): RenderConfig {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/**
 * Where this document gets its config.
 *
 * `?configId=<id>` — the id names a payload parked on the app server. Carrying
 * the config itself in the URL put it in the request *head*, which Node caps at
 * 16 KB; a city boundary encodes to ~20 KB, so the server answered 431, the page
 * never loaded, and the render timed out. See mcp-server/src/configStore.ts.
 *
 * `?config=<base64url>` — inline, for small configs and for tests that drive
 * render.html directly with no app server behind it.
 *
 * Either way it MUST be a query param, never a hash: a pooled page navigating
 * from `#a` to `#b` is a same-document navigation, so the document never reloads,
 * this module never re-runs, and the page keeps serving the FIRST config's frame.
 */
function readConfigSource(): { key: string; load: () => Promise<RenderConfig> } {
  const params = new URLSearchParams(location.search);

  const id = params.get('configId');
  if (id) {
    return {
      key: id,
      load: async () => {
        const res = await fetch(`/__config/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`render mode: config ${id} not found (${res.status})`);
        return (await res.json()) as RenderConfig;
      },
    };
  }

  const b64 = params.get('config');
  if (b64) return { key: b64, load: async () => decodeConfig(b64) };

  throw new Error('render mode: missing ?configId or ?config');
}

/** Wait for the map to settle, bounded so a stalled tile fetch cannot hang forever. */
function idleOnce(map: MlMap, ms = IDLE_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      map.off('idle', finish);
      reject(new Error('render mode: timed out waiting for map idle'));
    }, ms);
    map.once('idle', finish);
    map.triggerRepaint();
  });
}

function textFromStore() {
  const s = usePosterStore.getState();
  return {
    city: s.location.name,
    country: s.location.country,
    coords: formatCoords(s.location.lat, s.location.lng),
    show: s.showText,
    showCity: s.showCity,
    showCountry: s.showCountry,
    showCoords: s.showCoords,
    font: getFont(s.font),
    color: getTheme(s.themeId).colors.text,
  };
}

const { key: configKey, load } = readConfigSource();

let cfg: RenderConfig;
/** map snapshot reused across animation frames (invalidated on camera change) */
let animBase: HTMLCanvasElement | null = null;
/** snapshot at REST STATE — reused for tail frames (only the pulse changes) */
let restBase: HTMLCanvasElement | null = null;

/** The combined highlight FeatureCollection mapStyle actually built (features
 * tagged with a resolved colour and geometry already smoothed). Captured rather
 * than rebuilt — rebuilding would duplicate mapStyle's colour resolution and
 * smoothing, and drift from it silently.
 *
 * Captured via `map.getStyle().sources.highlight.data`: verified experimentally
 * (this MapLibre version, ^5.24.0) that GeoJSONSource.serialize() returns the
 * exact object last passed to the source — tagged `color` per feature and
 * smoothed coordinates intact — so this is the same data buildMapStyle() built,
 * not a fresh reconstruction. */
let highlightBaseData: GeoJSONFeatureCollection | null = null;

/** The `highlight-fill` layer's real configured opacity, captured once at
 * ready time (see below) instead of hardcoding mapStyle.ts's literal —
 * `DEFAULT_HIGHLIGHT_FILL_OPACITY` is only a last-resort fallback if the
 * capture finds no such layer. */
let highlightFillOpacity: number | null = null;

/** Progress last actually WRITTEN to the highlight source/paint property by
 * `applyGeoAt` (see Finding 5 in that function) — `null` means nothing has
 * been applied yet, or `setCamera` reset it. Keyed on the applied value, not
 * on `t`, so purity holds: any `t` mapping to the same progress still yields
 * identical rendered data, we just don't redundantly rewrite it. */
let lastAppliedRevealProgress: number | null = null;

/** The exact FeatureCollection object last passed to the `highlight` source's
 * `setData()` by `applyGeoAt` — what `verifyAndReapplyGeoAt` reads the map
 * back against (see `AppliedGeoState.sourceData` doc). `null` until the first
 * write. MapLibre's `GeoJSONSource.serialize()` returns the exact object
 * reference last passed to `setData()` (verified experimentally — see
 * `highlightBaseData`'s doc comment above), so a restyle's
 * `setStyle({diff:true})` — which rebuilds the source data from scratch via
 * `buildMapStyle()` — always sets a NEW object, never this one. Reference
 * inequality is therefore a reliable "something else touched this source"
 * signal, independent of whether the `highlight-fill` layer exists at all. */
let lastAppliedHighlightData: GeoJSONFeatureCollection | null = null;

/** Bản sao `routes` của `highlightBaseData`: dữ liệu THẬT mà mapStyle đã dựng
 * cho source `routes` (mỗi feature đã mang `properties.color`/`width`), chụp
 * một lần lúc trang sẵn sàng. `routeDraw` cắt từ ĐÂY chứ không từ
 * `cfg.routes[i].geojson` thô, vì cùng lý do Finding 2 đã ghi cho vùng: cắt
 * từ dữ liệu thô thì màu và hình sẽ "pop" ở p=1 khi dữ liệu thật quay lại. */
let routesBaseData: GeoJSONFeatureCollection | null = null;
/** Cặp cache cho `applyRouteAt`, đúng vai trò `lastAppliedRevealProgress` và
 * `lastAppliedHighlightData` — xem doc của hai biến đó. Tách riêng chứ không
 * dùng chung: một khung có thể có CẢ regionReveal lẫn routeDraw ở hai tiến
 * độ khác nhau, gộp cache là để một track ghi đè cache của track kia. */
let lastAppliedRouteProgress: number | null = null;
let lastAppliedRouteData: GeoJSONFeatureCollection | null = null;

const ready = (async () => {
  cfg = await load();
  applyRenderConfig(cfg);
  createRoot(document.getElementById('root')!).render(<RenderApp width={cfg.size.width} height={cfg.size.height} />);

  const start = Date.now();
  while (!getMapInstance() && Date.now() - start < MAP_INIT_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, 50));
  }
  const map = getMapInstance();
  if (!map) throw new Error('render mode: map never initialized');
  await idleOnce(map);
  // See RESTYLE_SETTLE_MS doc comment — absorbs MapView's post-'load' style-rebuild
  // effect. Event-driven in the common case (the effect usually dispatches its
  // setStyle() well within the window via 'styledata'), with the fixed timeout
  // as an upper bound since the effect firing at all is not guaranteed. This is
  // a head start only — `verifyAndReapplyGeoAt` is the actual correctness net.
  const settle = onceEvent(map, 'styledata');
  await Promise.race([settle.promise, delay(RESTYLE_SETTLE_MS)]);
  settle.dispose();
  await idleOnce(map);
  await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready;

  // Capture the highlight source's real (tagged + smoothed) data once, at
  // page-ready time — see highlightBaseData doc comment above.
  const highlightSrc = (map.getStyle().sources as Record<string, { data?: unknown } | undefined>).highlight;
  if (highlightSrc && highlightSrc.data) highlightBaseData = highlightSrc.data as GeoJSONFeatureCollection;

  // Cùng lý do, cùng thời điểm, cho source `routes` — xem doc `routesBaseData`.
  const routesSrc = (map.getStyle().sources as Record<string, { data?: unknown } | undefined>).routes;
  if (routesSrc && routesSrc.data) routesBaseData = routesSrc.data as GeoJSONFeatureCollection;

  // Capture the highlight-fill layer's real configured opacity — see
  // highlightFillOpacity doc comment above (Finding 3: stop duplicating
  // mapStyle.ts's literal).
  if (map.getLayer('highlight-fill')) {
    const opacity = map.getPaintProperty('highlight-fill', 'fill-opacity');
    if (typeof opacity === 'number') highlightFillOpacity = opacity;
  }
})();
// keep the rejection from surfacing as an unhandled error; callers still see it via `await ready`
ready.catch(() => {});

/** Slice one ring-bearing feature's geometry into the in-progress LineString
 * shape, preserving its `properties` (carries the resolved `color` tag when
 * the feature comes from `highlightBaseData`). Returns `[]` when nothing has
 * been drawn yet (p<=0) or the feature has no polygon geometry. */
function sliceFeatureForReveal(f: GeoJSONFeatureCollection['features'][number], p: number): GeoJSONFeatureCollection['features'] {
  if (!f.geometry) return [];
  const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
  const out: GeoJSONFeatureCollection['features'] = [];
  for (const poly of polys) {
    // Every ring, not just poly[0] (the outer boundary) — poly[1+] are
    // interior holes. Slicing only the outer ring made a hole's boundary
    // vanish for the whole reveal and pop back in at p>=1 (Finding E);
    // drawing every ring's own in-progress slice at the SAME p keeps holes
    // present (as their own partial outline) throughout.
    for (const ring of poly) {
      const sliced = sliceRing(ring as [number, number][], p);
      if (sliced) out.push({ type: 'Feature', properties: f.properties ?? {}, geometry: { type: 'LineString', coordinates: sliced } });
    }
  }
  return out;
}

/**
 * Fallback path used ONLY if the `highlightBaseData` capture (see its doc
 * comment) came back empty — e.g. no highlight source existed at ready time.
 * Reveals the RAW single-region config geometry: unsmoothed, untagged (no
 * `color` property), and blind to sibling regions. This is strictly worse than
 * the primary path below (see Finding 2) but keeps `regionReveal` from
 * crashing when there is nothing better to read state back from.
 */
function revealRawFallback(full: GeoJSONFeatureCollection, p: number): GeoJSONFeatureCollection {
  if (p >= 1) return full;
  const feats: GeoJSONFeatureCollection['features'] = [];
  for (const f of full.features) feats.push(...sliceFeatureForReveal(f, p));
  return { type: 'FeatureCollection', features: feats };
}

/**
 * Index range `[start, end)` that `regionIndex`'s features occupy inside
 * `highlightBaseData.features` — a flat concatenation of every region's
 * geometry-bearing features, IN REGION ORDER (mirrors mapStyle.ts's `feats`
 * loop: `for (const region of highlight.regions) for (const f of
 * region.geojson.features) if (f?.geometry) feats.push(...)`). Counting each
 * earlier region's geometry-bearing features gives this region's offset.
 */
function regionFeatureRange(regions: RenderHighlightRegion[], regionIndex: number): [number, number] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const geometryCount = (r: RenderHighlightRegion | undefined) => (r?.geojson?.features ?? []).filter((f: any) => f?.geometry).length;
  let start = 0;
  for (let i = 0; i < regionIndex; i++) start += geometryCount(regions[i]);
  return [start, start + geometryCount(regions[regionIndex])];
}

/**
 * Reveal built from `highlightBaseData` (the combined, smoothed, colour-tagged
 * FeatureCollection mapStyle actually built) instead of the raw config
 * geojson — fixes Finding 2's three visual pops:
 *  - shape pop: the outline now follows the SAME smoothed ring throughout,
 *    not an unsmoothed one that snaps to smoothed at completion;
 *  - colour pop: each sliced feature keeps its source `properties.color`, so
 *    `['coalesce', ['get','color'], globalColor]` in mapStyle.ts resolves the
 *    region's own colour for the whole reveal, not just at p=1;
 *  - sibling pop: features OUTSIDE `range` (other regions) are passed through
 *    unsliced so they stay visible for the whole reveal instead of vanishing.
 */
function revealFromBase(baseFeatures: GeoJSONFeatureCollection['features'], range: [number, number], p: number): GeoJSONFeatureCollection {
  const [start, end] = range;
  const feats: GeoJSONFeatureCollection['features'] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseFeatures.forEach((f: any, i: number) => {
    if (i < start || i >= end) {
      feats.push(f); // sibling region — untouched, visible for the whole reveal
      return;
    }
    feats.push(...sliceFeatureForReveal(f, p));
  });
  return { type: 'FeatureCollection', features: feats };
}

/**
 * Wait for a GeoJSON source's worker-side re-tiling to finish after `setData()`.
 *
 * `idleOnce()` alone is NOT enough here: `map.once('idle', …)` registered right
 * after `setData()` can resolve on an 'idle' tick that predates the source's
 * async (Web Worker) re-tiling reply — `setData` posts to a worker and the main
 * thread's "am I idle" check doesn't necessarily see the pending update in the
 * same tick. Confirmed experimentally: two back-to-back `renderMotionFrame`
 * calls at an IDENTICAL t (same camera, same reveal progress) produced
 * different pixels around the highlighted region — call 1 (a fresh `setData`)
 * raced ahead of its own re-tiling, call 2 (source already loaded) did not.
 * Waiting for `sourcedata` with `isSourceLoaded` on the SPECIFIC source id
 * before proceeding removed the race in repeated local runs.
 */
function waitSourceLoaded(map: MlMap, sourceId: string, ms = IDLE_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve, reject) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      map.off('sourcedata', handler);
      clearTimeout(timer);
      resolve();
    };
    const handler = (e: { sourceId?: string; isSourceLoaded?: boolean }) => {
      if (e.sourceId === sourceId && e.isSourceLoaded) finish();
    };
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      map.off('sourcedata', handler);
      reject(new Error(`render mode: timed out waiting for source '${sourceId}' to load`));
    }, ms);
    map.on('sourcedata', handler);
  });
}

/** Result of `applyGeoAt` — what it intended the map's geo state to be, so
 * `verifyAndReapplyGeoAt` can read the map back and confirm it stuck. */
interface AppliedGeoState {
  /** intended `highlight-fill` fill-opacity, or `null` if there's no such layer */
  fillOpacityTarget: number | null;
  /** the exact object `applyGeoAt` intended (or last knew) to be written to
   * the `highlight` source — `null` only when no `regionReveal` track is
   * active this call (nothing to verify). Present regardless of
   * `highlight.fill`, unlike `fillOpacityTarget`. */
  sourceData: GeoJSONFeatureCollection | null;
}

/**
 * Compute the reveal FeatureCollection for progress `p` — from
 * `highlightBaseData` when available (Finding 2's fixed path), falling back
 * to the raw config geojson only if that capture came back empty.
 */
function computeRevealData(regions: RenderHighlightRegion[], regionIndex: number, rawFull: GeoJSONFeatureCollection | undefined, p: number): GeoJSONFeatureCollection {
  if (p >= 1) return highlightBaseData ?? rawFull ?? { type: 'FeatureCollection', features: [] };
  if (highlightBaseData) return revealFromBase(highlightBaseData.features, regionFeatureRange(regions, regionIndex), p);
  return rawFull ? revealRawFallback(rawFull, p) : { type: 'FeatureCollection', features: [] };
}

/** Cắt một feature tuyến theo tiến độ chiều dài.
 *
 * Đơn giản hơn `sliceFeatureForReveal` một bậc: vùng phải bóc Polygon →
 * MultiPolygon → từng ring rồi mới cắt được, còn tuyến ĐÃ là chuỗi toạ độ.
 * `sliceRing` nhận `[number, number][]` nên dùng lại nguyên vẹn — nó không có
 * gì riêng cho vòng khép kín, tên gọi chỉ phản ánh nơi nó ra đời.
 *
 * `p >= 1` trả về feature GỐC (tham chiếu cũ, không phải bản sao) để đuôi clip
 * không tích luỹ sai số — cùng khế ước `sliceRing` giữ ở p>=1. */
function sliceRouteFeature(f: GeoJSONFeatureCollection['features'][number], p: number): GeoJSONFeatureCollection['features'] {
  if (p >= 1) return [f];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (f as any)?.geometry;
  const lines: [number, number][][] =
    g?.type === 'LineString' ? [g.coordinates] : g?.type === 'MultiLineString' ? g.coordinates : [];
  const out: GeoJSONFeatureCollection['features'] = [];
  for (const line of lines) {
    const sliced = sliceRing(line, p);
    // Cắt TỪNG nhánh ở CÙNG p, giống cách vùng cắt từng ring — nếu chỉ vẽ
    // nhánh đầu thì một MultiLineString sẽ có nhánh biến mất suốt lúc vẽ rồi
    // bật lại ở p=1 (đúng Finding E của vùng).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (sliced) out.push({ type: 'Feature', properties: (f as any).properties ?? {}, geometry: { type: 'LineString', coordinates: sliced } } as never);
  }
  return out;
}

/** Dải feature mà route thứ `routeIndex` chiếm trong `routesBaseData`.
 *
 * mapStyle gộp MỌI tuyến vào một FeatureCollection duy nhất, mỗi tuyến đóng
 * góp N feature, nên phải cộng dồn đúng như `regionFeatureRange` làm cho vùng. */
function routeFeatureRange(routes: NonNullable<RenderConfig['routes']>, routeIndex: number): [number, number] {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const count = (r: (typeof routes)[number] | undefined) => (r?.geojson?.features ?? []).filter((f: any) => f?.geometry).length;
  let start = 0;
  for (let i = 0; i < routeIndex; i++) start += count(routes[i]);
  return [start, start + count(routes[routeIndex])];
}

/** Tuyến ĐANG vẽ thì cắt; mọi tuyến khác đi qua nguyên vẹn — đúng cách
 * `revealFromBase` giữ vùng anh em hiện suốt lúc vẽ (Finding 2). */
function routeDrawFromBase(baseFeatures: GeoJSONFeatureCollection['features'], range: [number, number], p: number): GeoJSONFeatureCollection {
  const [start, end] = range;
  const feats: GeoJSONFeatureCollection['features'] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseFeatures.forEach((f: any, i: number) => {
    if (i < start || i >= end) {
      feats.push(f);
      return;
    }
    feats.push(...sliceRouteFeature(f, p));
  });
  return { type: 'FeatureCollection', features: feats };
}

/** Áp tiến độ `routeDraw` tại tClamped vào source `routes`.
 *
 * Bản sao có chủ đích của `applyGeoAt`, gồm cả cache bỏ-ghi-nếu-không-đổi
 * (Finding 5) và khế ước trả về đối tượng ĐÃ ghi để lưới an toàn đọc lại được.
 * Không gộp hai hàm: chúng ghi hai source khác nhau, và một khung có thể có cả
 * hai track ở hai tiến độ khác nhau. */
async function applyRouteAt(map: MlMap, tClamped: number, force = false): Promise<GeoJSONFeatureCollection | null> {
  const motion = cfg.motion;
  if (!motion) return null;
  const draw = motion.tracks.find((t) => t.kind === 'routeDraw');
  const routes = cfg.routes;
  if (!draw || draw.kind !== 'routeDraw' || !routes?.length) return null;
  const src = map.getSource('routes') as { setData(d: unknown): void } | undefined;
  if (!src || !routesBaseData) return null;

  // KHÔNG có `draw.ease`: track `routeDraw` không khai trường đó, khác
  // `regionReveal` (motionScript.ts:16-17 và :51-52). `trackProgress` mặc
  // định `easeInOut`, tức tuyến vẫn vào/ra mượt như vùng. Thêm `ease` cho
  // routeDraw là ĐỔI HỢP ĐỒNG công khai của MotionScript, nên để thành quyết
  // định riêng chứ không kèm lén vào gói này.
  const p = trackProgress(tClamped, draw.t0, draw.t1);
  if (!force && lastAppliedRouteProgress === p) return lastAppliedRouteData;

  const dataToApply = p >= 1 ? routesBaseData : routeDrawFromBase(routesBaseData.features, routeFeatureRange(routes, draw.routeIndex ?? 0), p);
  src.setData(dataToApply);
  lastAppliedRouteProgress = p;
  lastAppliedRouteData = dataToApply;
  await waitSourceLoaded(map, 'routes');
  return dataToApply;
}

/** Lưới an toàn cho `applyRouteAt`, cùng lớp lỗi mà `verifyAndReapplyGeoAt`
 * đóng cho vùng: một `setStyle({diff:true})` chen vào sau lượt ghi sẽ dựng lại
 * TOÀN BỘ style từ `buildMapStyle()`, tức đặt một đối tượng MỚI cho source
 * `routes` và xoá sạch tiến độ vừa áp. So bằng THAM CHIẾU vì MapLibre trả về
 * đúng đối tượng cuối cùng được `setData()`. */
async function verifyAndReapplyRouteAt(map: MlMap, tClamped: number, applied: GeoJSONFeatureCollection | null): Promise<void> {
  if (applied === null) return; // không có routeDraw ở lượt này — không có gì để kiểm
  const sources = map.getStyle().sources as Record<string, { data?: unknown } | undefined>;
  if (sources.routes?.data === applied) return;
  await applyRouteAt(map, tClamped, true);
  await idleOnce(map);
}

/** Áp trạng thái địa lý tại tClamped vào map (nguồn highlight + opacity fill).
 *
 * `force`, when true, bypasses the Finding 5 skip-if-unchanged cache — used by
 * `verifyAndReapplyGeoAt` when the map's actual state no longer matches what
 * the cache believes (a restyle raced in and reverted it), so the cache must
 * not suppress the necessary rewrite. */
async function applyGeoAt(map: MlMap, tClamped: number, force = false): Promise<AppliedGeoState> {
  const motion = cfg.motion;
  if (!motion) return { fillOpacityTarget: null, sourceData: null };
  const reveal = motion.tracks.find((t) => t.kind === 'regionReveal');
  const regions = cfg.highlight?.regions;
  if (!reveal || reveal.kind !== 'regionReveal' || !regions?.length) return { fillOpacityTarget: null, sourceData: null };
  const src = map.getSource('highlight') as { setData(d: unknown): void } | undefined;
  if (!src) return { fillOpacityTarget: null, sourceData: null };

  const regionIndex = reveal.regionIndex ?? 0;
  const rawFull = regions[regionIndex]?.geojson;
  const p = trackProgress(tClamped, reveal.t0, reveal.t1, reveal.ease);
  const hasFillLayer = Boolean(map.getLayer('highlight-fill'));
  // Finding E (sibling fill): this used to force fill-opacity to 0 for the
  // WHOLE `highlight-fill` layer whenever p<1, then back up once the active
  // region's ring closed (spec §4: "vòng khép, fill mờ vào" / "fill fades in
  // once the ring closes"). That's a LAYER-WIDE toggle, so it also blanked
  // every SIBLING region's fill for the whole reveal — Finding 2 already
  // fixed the sibling *outline* (revealFromBase passes sibling features
  // through untouched) but missed the fill. It isn't needed for the active
  // region either: sliceFeatureForReveal turns it into a LineString while
  // p<1, and a `fill`-type layer only ever draws Polygon/MultiPolygon
  // geometry, so the active region's own fill is already suppressed by
  // geometry alone — the "fades in once closed" behaviour falls out for free
  // once its real Polygon data returns at p>=1. Keep fill-opacity steady at
  // its configured value throughout instead of toggling the whole layer.
  const fillOpacityTarget = hasFillLayer ? (highlightFillOpacity ?? DEFAULT_HIGHLIGHT_FILL_OPACITY) : null;

  // Finding 5: once p>=1 every remaining tail frame recomputed and re-wrote
  // IDENTICAL data, paying a full worker re-tile + sourcedata wait each time.
  // Skip the write entirely when the progress is identical to what's already
  // on the map — keyed on the applied value (p), not on t, so purity holds.
  // `lastAppliedHighlightData` (the object that write left in place) is what
  // we hand back here — verifyAndReapplyGeoAt still checks it stuck.
  if (!force && lastAppliedRevealProgress === p) return { fillOpacityTarget, sourceData: lastAppliedHighlightData };

  const dataToApply = computeRevealData(regions, regionIndex, rawFull, p);
  // Finding 7: build the wait promise AFTER the mutations that precede it, not
  // before — if setData/setPaintProperty throws, the promise (and its 20s
  // timer) is simply never created, instead of being left to reject unheeded
  // later. Safe to register after: setData()'s worker round-trip cannot fire
  // 'sourcedata' before this synchronous block finishes.
  src.setData(dataToApply);
  if (hasFillLayer) map.setPaintProperty('highlight-fill', 'fill-opacity', fillOpacityTarget ?? 0);
  lastAppliedRevealProgress = p;
  lastAppliedHighlightData = dataToApply;
  await waitSourceLoaded(map, 'highlight');
  return { fillOpacityTarget, sourceData: dataToApply };
}

/**
 * Finding 1: `RESTYLE_SETTLE_MS` is a cheap head start, not a guarantee — on a
 * slow enough machine MapView's post-load `setStyle(..., {diff:true})` could
 * still land between `applyGeoAt`'s writes and here, reverting them (it
 * diffs+rebuilds the WHOLE style, so both the source data and the paint
 * property can be reverted together). This guard verifies the SOURCE DATA
 * itself — read back via `map.getStyle().sources.highlight.data`, the same
 * accessor already used to capture `highlightBaseData` — by reference against
 * `applied.sourceData`, independent of whether a `highlight-fill` layer
 * exists at all. That closes the gap left by relying solely on
 * `fill-opacity`: `highlight.fill: false` (no fill layer ever created — see
 * mapStyle.ts's `if (highlight.fill)`) previously left the whole guard
 * unreachable, since `fillOpacityTarget` is `null` whenever there's no fill
 * layer to target.
 *
 * The `fill-opacity` read-back is kept as an ADDITIONAL, independent check —
 * not replaced — when a fill layer does exist: a restyle could in principle
 * revert only the paint property (or only the source) depending on how
 * MapLibre's style diff batches its ops, so neither check alone subsumes the
 * other.
 *
 * On any mismatch, force a full re-apply (bypassing the Finding 5 cache,
 * since the map's real state no longer matches what the cache believes) and
 * re-wait ONCE. Corrupt-pixel failure mode this closes: a region shown
 * reverted to its full/un-revealed geometry (or filled while its outline is
 * still mid-draw), cached into `restBase` and inherited by every later tail
 * frame.
 */
async function verifyAndReapplyGeoAt(map: MlMap, tClamped: number, applied: AppliedGeoState): Promise<AppliedGeoState> {
  if (applied.sourceData === null) return applied; // no regionReveal active this call — nothing to verify
  const sources = map.getStyle().sources as Record<string, { data?: unknown } | undefined>;
  const currentSourceData = sources.highlight?.data;
  const sourceReverted = currentSourceData !== applied.sourceData;

  const hasFillLayer = Boolean(map.getLayer('highlight-fill'));
  const fillReverted = applied.fillOpacityTarget !== null && hasFillLayer && map.getPaintProperty('highlight-fill', 'fill-opacity') !== applied.fillOpacityTarget;

  if (!sourceReverted && !fillReverted) return applied;
  const reapplied = await applyGeoAt(map, tClamped, true);
  await idleOnce(map);
  return reapplied;
}

/** Composite pinDrop scale-in + pulse (phase = t, deterministic) over a base snapshot. */
async function composeMotionOverlay(
  map: MlMap,
  base: HTMLCanvasElement,
  motion: NonNullable<RenderConfig['motion']>,
  tSec: number,
  opts?: { pulsePhase?: number },
): Promise<{ dataUrl: string; width: number; height: number }> {
  const pin = motion.tracks.find((t) => t.kind === 'pinDrop');
  const pulse = motion.tracks.find((t) => t.kind === 'pulse');
  // Finding 6: pointIndex declares WHICH marker the pin-drop addresses
  // (validator range-checks it against pointCount, defaulting to 0 when
  // omitted — see motionScript.ts's `t.pointIndex ?? 0` range check). Only
  // that marker animates; the rest stay at full size the whole clip.
  const pinTargetIndex = pin && pin.kind === 'pinDrop' ? (pin.pointIndex ?? 0) : -1;
  const markers = usePosterStore
    .getState()
    .markers.map((m, i) => {
      if (!pin || pin.kind !== 'pinDrop' || i !== pinTargetIndex) return m;
      const k = trackProgress(tSec, pin.at, pin.at + (pin.dur ?? 0.5), 'expoOut');
      return { ...m, size: m.size * k };
    })
    .filter((m) => m.size >= 1);
  const phase = pulse && pulse.kind === 'pulse' ? (opts?.pulsePhase ?? pulsePhase(tSec, pulse.from, pulse.periodSec)) : null;
  const canvas = await composeOverlays(map, base, {
    width: cfg.size.width,
    height: cfg.size.height,
    markers,
    text: textFromStore(), // chrome='clean' ⇒ show:false — no text is ever drawn
    ...(phase !== null ? { pulse: { t: phase, rings: pulse && pulse.kind === 'pulse' ? pulse.rings : undefined } } : {}),
  });
  return { dataUrl: canvas.toDataURL('image/png'), width: cfg.size.width, height: cfg.size.height };
}

// Published synchronously, BEFORE the config has loaded. renderFrame() polls for
// this object and would otherwise sit out its whole timeout waiting for a fetch —
// and a config that fails to load must surface as `await ready` rejecting with a
// real message, not as an opaque "waitForFunction timed out".
window.__mapposter = {
  configKey,
  ready,
  async renderFrame() {
    await ready;
    const map = getMapInstance();
    if (!map) throw new Error('render mode: no map');
    const canvas = await composePoster(map, {
      width: cfg.size.width,
      height: cfg.size.height,
      markers: usePosterStore.getState().markers,
      text: textFromStore(),
    });
    return { dataUrl: canvas.toDataURL('image/png'), width: cfg.size.width, height: cfg.size.height };
  },
  async renderAnimationFrame(t, pulse) {
    await ready;
    const map = getMapInstance();
    if (!map) throw new Error('render mode: no map');
    if (!animBase) animBase = await snapshotMap(map, cfg.size.width, cfg.size.height);
    const canvas = await composeOverlays(map, animBase, {
      width: cfg.size.width,
      height: cfg.size.height,
      markers: usePosterStore.getState().markers,
      text: textFromStore(),
      pulse: { ...pulse, t },
    });
    return { dataUrl: canvas.toDataURL('image/png'), width: cfg.size.width, height: cfg.size.height };
  },
  async setCamera(cam) {
    const map = getMapInstance();
    if (!map) throw new Error('render mode: no map');
    map.jumpTo(cam);
    animBase = null; // camera moved — the cached snapshot no longer matches
    // Finding 4: not reachable from today's callers, but nulling one cache and
    // not the other is exactly the latent order-dependency this task exists to
    // rule out — reset every piece of state a subsequent renderMotionFrame call
    // could otherwise read stale.
    restBase = null;
    lastAppliedRevealProgress = null;
    lastAppliedHighlightData = null;
    await idleOnce(map);
  },
  async renderMotionFrame(tSec, opts) {
    await ready;
    const motion = cfg.motion;
    if (!motion) throw new Error('render mode: config has no motion script');
    const map = getMapInstance();
    if (!map) throw new Error('render mode: no map');
    const tClamped = Math.min(tSec, motion.restAtSec);
    const atRest = tSec >= motion.restAtSec;
    if (!atRest || !restBase) {
      map.jumpTo(cameraAt(motion.camera, tClamped));
      // Finding 4 (D): symmetric with setCamera's reset below — jumpTo moves
      // the camera, so any snapshot taken before this call no longer matches
      // what the map shows. Not reachable from today's drivers (one page load
      // per operation, renderMotionFrame never interleaves with
      // renderAnimationFrame), but leaving animBase stale here is the exact
      // latent cross-API order-dependency setCamera's own reset exists to
      // rule out — a later renderAnimationFrame call would otherwise composite
      // over a pre-motion snapshot.
      animBase = null;
      const applied = await applyGeoAt(map, tClamped);
      // routeDraw ghi source `routes`, độc lập với source `highlight` — áp
      // TRƯỚC lượt `idleOnce` chung để cả hai lượt re-tile của worker cùng
      // lắng trong một lần chờ, thay vì trả tiền chờ hai lần mỗi khung.
      const appliedRoute = await applyRouteAt(map, tClamped);
      await idleOnce(map);
      // Finding 1: idempotent restyle guard — see verifyAndReapplyGeoAt doc.
      await verifyAndReapplyGeoAt(map, tClamped, applied);
      await verifyAndReapplyRouteAt(map, tClamped, appliedRoute);
      const snap = await snapshotMap(map, cfg.size.width, cfg.size.height);
      if (atRest) restBase = snap; // tail of the clip: camera settled, only the pulse changes → reuse
      else restBase = null;
      return composeMotionOverlay(map, snap, motion, tSec, opts);
    }
    return composeMotionOverlay(map, restBase, motion, tSec, opts);
  },
  // CHỈ ĐỌC — xem doc của `MapPosterApi.anchors`. Mọi dòng dưới đây hoặc là
  // `map.get*()`, hoặc là `map.project()`, hoặc là toán thuần trong anchors.ts.
  anchors() {
    const motion = cfg?.motion;
    if (!motion) throw new Error('render mode: anchors() needs a motion script — it reports the rest state of a clip');
    const map = getMapInstance();
    if (!map) throw new Error('render mode: no map');

    const canvasEl = map.getCanvas();
    // HAI mẫu số, đọc riêng từng trục. `cssW` được lấy đúng như
    // `composeOverlays` lấy nó (export.ts) để x của anchors và x của marker
    // được vẽ nói về cùng một khung.
    const frame = { cssW: canvasEl.clientWidth || canvasEl.width, cssH: canvasEl.clientHeight || canvasEl.height };

    const c = map.getCenter();
    const camera: ResolvedCamera = {
      center: [c.lng, c.lat],
      zoom: map.getZoom(),
      // MapLibre trả bearing trong (-180, 180]; chuẩn hoá về [0, 360) cho khớp
      // quy ước của `normalizeBearing`/`lerpAngle` mà phần còn lại của repo dùng.
      bearing: ((map.getBearing() % 360) + 360) % 360,
      pitch: map.getPitch(),
    };
    assertNoPitch(camera.pitch);
    assertCameraAtRest(camera, cameraAt(motion.camera, motion.restAtSec), motion.restAtSec);

    // `cfg.markers`, KHÔNG phải store: giữ `index` khớp một-một với
    // `resolved.highlights.points`, thứ mà caller đối chiếu sang.
    const points = (cfg.markers ?? []).map((m, index) => ({
      index,
      lng: m.lng,
      lat: m.lat,
      ...pctOf(map.project([m.lng, m.lat]), frame),
    }));

    const regions: ClipAnchors['regions'] = [];
    (cfg.highlight?.regions ?? []).forEach((r, index) => {
      const projected = collectCoords(r.geojson).map((ll) => map.project(ll));
      const anchor = regionAnchorOf(index, projected, frame);
      if (anchor) regions.push(anchor);
    });

    return { camera, points, regions };
  },
  async prefetchMotion() {
    await ready;
    const motion = cfg.motion;
    const map = getMapInstance();
    if (!motion || !map) return;
    for (const kf of motion.camera) {
      map.jumpTo({ center: kf.center, zoom: kf.zoom, bearing: kf.bearing ?? 0 });
      await idleOnce(map).catch(() => {}); // best-effort — a prefetch failure is not a render failure
    }
  },
  // Finding H: DEV-only — see the interface's doc comment above. `import.meta.env.DEV`
  // is a compile-time constant Vite inlines and dead-code-eliminates, so this
  // whole property (and the closure it captures) is stripped from a
  // production `vite build` output, not merely disabled at runtime.
  ...(import.meta.env.DEV
    ? {
        simulateHighlightRevertForTest() {
          const map = getMapInstance();
          if (!map || !highlightBaseData) return false;
          const src = map.getSource('highlight') as { setData(d: unknown): void } | undefined;
          if (!src) return false;
          // Same shape a real restyle would set: buildMapStyle() has no notion of
          // reveal progress, so MapView's setStyle({diff:true}) always writes the
          // FULL combined FeatureCollection — exactly what highlightBaseData is.
          src.setData(highlightBaseData);
          return true;
        },
      }
    : {}),
};
