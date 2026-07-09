import { createRoot } from 'react-dom/client';
import type { Map as MlMap } from 'maplibre-gl';
import '../index.css';
import RenderApp from './RenderApp';
import { applyRenderConfig } from './applyRenderConfig';
import type { RenderConfig, RenderCamera } from './renderConfig';
import { usePosterStore } from '../store/usePosterStore';
import { getMapInstance } from '../lib/mapRef';
import { composePoster } from '../lib/export';
import { getFont } from '../data/fonts';
import { getTheme } from '../data/themes';
import { formatCoords } from '../lib/format';

interface MapPosterApi {
  /** the exact base64url config string this document was loaded with */
  configKey: string;
  ready: Promise<void>;
  renderFrame(): Promise<{ dataUrl: string; width: number; height: number }>;
  setCamera(cam: RenderCamera): Promise<void>;
}

declare global {
  interface Window {
    __mapposter?: MapPosterApi;
  }
}

const MAP_INIT_TIMEOUT_MS = 8_000;
const IDLE_TIMEOUT_MS = 20_000;

/**
 * Read `?config=<base64url json>`.
 *
 * It MUST be a query param, not a hash: a pooled page navigating from
 * `#config=A` to `#config=B` is a same-document navigation, so the document
 * never reloads, this module never re-runs, and the page would keep serving the
 * FIRST config's frame. A query change forces a real reload.
 */
function readConfigParam(): string {
  const b64 = new URLSearchParams(location.search).get('config');
  if (!b64) throw new Error('render mode: missing ?config');
  return b64;
}

function decodeConfig(b64: string): RenderConfig {
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
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

const configKey = readConfigParam();
const cfg = decodeConfig(configKey);
applyRenderConfig(cfg);
createRoot(document.getElementById('root')!).render(<RenderApp width={cfg.size.width} height={cfg.size.height} />);

const ready = (async () => {
  const start = Date.now();
  while (!getMapInstance() && Date.now() - start < MAP_INIT_TIMEOUT_MS) {
    await new Promise((r) => setTimeout(r, 50));
  }
  const map = getMapInstance();
  if (!map) throw new Error('render mode: map never initialized');
  await idleOnce(map);
  await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
})();
// keep the rejection from surfacing as an unhandled error; callers still see it via `await ready`
ready.catch(() => {});

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
  async setCamera(cam) {
    const map = getMapInstance();
    if (!map) throw new Error('render mode: no map');
    map.jumpTo(cam);
    await idleOnce(map);
  },
};
