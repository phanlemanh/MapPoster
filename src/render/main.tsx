import { createRoot } from 'react-dom/client';
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
  ready: Promise<void>;
  renderFrame(): Promise<{ dataUrl: string; width: number; height: number }>;
  setCamera(cam: RenderCamera): Promise<void>;
}

declare global {
  interface Window {
    __mapposter?: MapPosterApi;
  }
}

/** Decode `#config=<base64url json>` into a RenderConfig. */
function parseConfig(): RenderConfig {
  const params = new URLSearchParams(location.hash.replace(/^#/, ''));
  const b64 = params.get('config');
  if (!b64) throw new Error('render mode: missing #config');
  const bin = atob(b64.replace(/-/g, '+').replace(/_/g, '/'));
  const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
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

const cfg = parseConfig();
applyRenderConfig(cfg);
createRoot(document.getElementById('root')!).render(<RenderApp width={cfg.size.width} height={cfg.size.height} />);

// ready = map idle after config applied + fonts loaded
const ready = new Promise<void>((resolve, reject) => {
  const start = Date.now();
  const wait = async () => {
    while (!getMapInstance() && Date.now() - start < 8000) await new Promise((r) => setTimeout(r, 50));
    const map = getMapInstance();
    if (!map) return reject(new Error('render mode: map never initialized'));
    await new Promise<void>((res) => {
      map.once('idle', () => res());
      map.triggerRepaint();
    });
    await (document as unknown as { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    resolve();
  };
  void wait();
});

window.__mapposter = {
  ready,
  async renderFrame() {
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
    await new Promise<void>((res) => map.once('idle', () => res()));
  },
};
