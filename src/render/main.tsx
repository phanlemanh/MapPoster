import { createRoot } from 'react-dom/client';
import type { Map as MlMap } from 'maplibre-gl';
import '../index.css';
import RenderApp from './RenderApp';
import { applyRenderConfig } from './applyRenderConfig';
import type { RenderConfig, RenderCamera } from './renderConfig';
import { usePosterStore } from '../store/usePosterStore';
import { getMapInstance } from '../lib/mapRef';
import { composePoster, composeOverlays, snapshotMap, type PulseOpts } from '../lib/export';
import { getFont } from '../data/fonts';
import { getTheme } from '../data/themes';
import { formatCoords } from '../lib/format';
import { cameraAt, trackProgress, sliceRing, pulsePhase } from './motionMath';
import type { GeoJSONFeatureCollection } from '../types';

interface MapPosterApi {
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
}

declare global {
  interface Window {
    __mapposter?: MapPosterApi;
  }
}

const MAP_INIT_TIMEOUT_MS = 8_000;
const IDLE_TIMEOUT_MS = 20_000;
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
 */
const RESTYLE_SETTLE_MS = 150;

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
  // See RESTYLE_SETTLE_MS doc comment — absorbs MapView's post-'load' style-rebuild effect.
  await new Promise((r) => setTimeout(r, RESTYLE_SETTLE_MS));
  await idleOnce(map);
  await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready;

  // Capture the highlight source's real (tagged + smoothed) data once, at
  // page-ready time — see highlightBaseData doc comment above.
  const highlightSrc = (map.getStyle().sources as Record<string, { data?: unknown } | undefined>).highlight;
  if (highlightSrc && highlightSrc.data) highlightBaseData = highlightSrc.data as GeoJSONFeatureCollection;
})();
// keep the rejection from surfacing as an unhandled error; callers still see it via `await ready`
ready.catch(() => {});

/** FeatureCollection ranh giới đã cắt theo tiến độ reveal — LineString khi đang
 * vẽ dở (fill layer không tô được đường hở, đúng ý), polygon gốc khi khép vòng. */
function revealFC(full: GeoJSONFeatureCollection, p: number): GeoJSONFeatureCollection {
  if (p >= 1) return full;
  const feats: GeoJSONFeatureCollection['features'] = [];
  for (const f of full.features) {
    if (!f.geometry) continue;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    for (const poly of polys) {
      const sliced = sliceRing(poly[0] as [number, number][], p);
      if (sliced) feats.push({ type: 'Feature', properties: f.properties ?? {}, geometry: { type: 'LineString', coordinates: sliced } });
    }
  }
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

/** Áp trạng thái địa lý tại tClamped vào map (nguồn highlight + opacity fill). */
async function applyGeoAt(map: MlMap, tClamped: number): Promise<void> {
  const motion = cfg.motion;
  if (!motion) return;
  const reveal = motion.tracks.find((t) => t.kind === 'regionReveal');
  if (!reveal || reveal.kind !== 'regionReveal' || !cfg.highlight?.regions.length) return;
  const src = map.getSource('highlight') as { setData(d: unknown): void } | undefined;
  if (!src) return;
  const full = cfg.highlight.regions[reveal.regionIndex ?? 0].geojson;
  const p = trackProgress(tClamped, reveal.t0, reveal.t1, reveal.ease);
  const loaded = waitSourceLoaded(map, 'highlight');
  // p>=1: restore the REAL combined+smoothed data captured at ready time, not
  // the raw single-region config geojson — only fall back to it if the capture
  // came back empty (e.g. no highlight source at all).
  src.setData(p >= 1 ? (highlightBaseData ?? full) : revealFC(full, p));
  // fill only appears once the ring has closed (spec §4: "vòng khép, fill mờ vào")
  if (map.getLayer('highlight-fill')) map.setPaintProperty('highlight-fill', 'fill-opacity', p >= 1 ? 0.26 : 0);
  await loaded;
}

/** Composite pinDrop scale-in + pulse (phase = t, deterministic) over a base snapshot. */
async function composeMotionOverlay(
  map: MlMap,
  base: HTMLCanvasElement,
  motion: NonNullable<RenderConfig['motion']>,
  tSec: number,
  opts?: { pulsePhase?: number },
) {
  const pin = motion.tracks.find((t) => t.kind === 'pinDrop');
  const pulse = motion.tracks.find((t) => t.kind === 'pulse');
  const markers = usePosterStore
    .getState()
    .markers.map((m) => {
      if (!pin || pin.kind !== 'pinDrop') return m;
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
      await applyGeoAt(map, tClamped);
      await idleOnce(map);
      const snap = await snapshotMap(map, cfg.size.width, cfg.size.height);
      if (atRest) restBase = snap; // tail of the clip: camera settled, only the pulse changes → reuse
      else restBase = null;
      return composeMotionOverlay(map, snap, motion, tSec, opts);
    }
    return composeMotionOverlay(map, restBase, motion, tSec, opts);
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
};
