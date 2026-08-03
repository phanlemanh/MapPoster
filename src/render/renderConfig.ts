import type { FontKey, GeoJSONFeatureCollection, LayerState, MarkerIconKey } from '../types';
import type { MotionScript } from './motionScript';

/** A fully-resolved render request. Produced in Node (mcp-server), consumed by
 * the headless render mode. Everything is concrete (coords + GeoJSON) — no
 * name lookups happen inside the page. */
export interface RenderCamera {
  center: [number, number];
  zoom: number;
  bearing?: number;
  pitch?: number;
}

export interface RenderHighlightRegion {
  geojson: GeoJSONFeatureCollection;
  color: string | null;
}

export interface RenderMarker {
  lng: number;
  lat: number;
  icon: MarkerIconKey;
  color: string;
  size: number;
}

export type Chrome = 'clean' | 'label' | 'poster';

export interface RenderConfig {
  camera: RenderCamera;
  /** target export pixel dimensions */
  size: { width: number; height: number };
  theme: string;
  layers?: Partial<LayerState>;
  detail?: number;
  chrome: Chrome;
  font?: FontKey;
  place: { name: string; country: string; lat: number; lng: number };
  highlight?: {
    regions: RenderHighlightRegion[];
    color: string | null;
    fill: boolean;
    dim: boolean;
  };
  markers?: RenderMarker[];
  /** Motion clip script — the static renderFrame() path ignores this field. */
  motion?: MotionScript;
}
