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
  /** OSM identity of the matched boundary — echoed into resolved.highlights, ignored by the render page. */
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
  displayName?: string;
  placeRank?: number;
}

export interface RenderMarker {
  lng: number;
  lat: number;
  icon: MarkerIconKey;
  color: string;
  size: number;
}

/** A polyline drawn over the map. `buildMapStyle` merges every route into one
 * FeatureCollection carrying per-feature `color`/`width`, so both are concrete
 * here — the resolver fills the theme accent and the default width. */
export interface RenderRoute {
  geojson: GeoJSONFeatureCollection;
  color: string;
  width: number;
  /** Router facts, echoed into `resolved.routes`; the render page ignores them. */
  distanceKm?: number;
  durationMin?: number;
  provider?: string;
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
  routes?: RenderRoute[];
  /** Echoed back through `resolved.measures`; the render page ignores it. */
  measure?: { pairs?: [number, number][] };
  /** Motion clip script — the static renderFrame() path ignores this field. */
  motion?: MotionScript;
}
