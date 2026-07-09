// Shared domain types for MapPoster

export interface LocationInfo {
  /** Primary place / city name shown large in the poster overlay */
  name: string;
  country: string;
  lng: number;
  lat: number;
  /** Preferred map zoom when this location is applied */
  zoom: number;
  displayName?: string;
  /** OSM identifiers, used to look up the region's boundary polygon */
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
}

export interface ThemeColors {
  background: string;
  water: string;
  waterway: string;
  green: string; // landcover / wood / grass
  landuse: string;
  park: string;
  building: string;
  roadHighway: string;
  roadMajor: string;
  roadMinor: string;
  rail: string;
  aeroway: string;
  boundary: string;
  /** Default overlay text color that reads well on this theme */
  text: string;
  /** Default accent used for markers / routes */
  accent: string;
}

export interface Theme {
  id: string;
  name: string;
  /** true when the background is dark (affects UI swatch styling) */
  dark: boolean;
  colors: ThemeColors;
}

export type LayoutCategory = 'Print' | 'Social' | 'Wallpaper' | 'Web';

export interface LayoutPreset {
  id: string;
  name: string;
  category: LayoutCategory;
  /** Export pixel dimensions */
  width: number;
  height: number;
  /** Physical size for print (used to size the PDF page) */
  print?: { w: number; h: number; unit: 'mm' | 'in' };
}

export type LayerKey =
  | 'landcover'
  | 'buildings'
  | 'water'
  | 'parks'
  | 'roads'
  | 'rail'
  | 'aeroway';

export type LayerState = Record<LayerKey, boolean>;

export type MarkerIconKey = 'pin' | 'heart' | 'home' | 'star' | 'circle' | 'square';

export interface MarkerItem {
  id: string;
  lng: number;
  lat: number;
  icon: MarkerIconKey;
  /** icon size in CSS pixels (relative to the preview map) */
  size: number;
  color: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GeoJSONFeatureCollection = any;

export interface RouteItem {
  id: string;
  name: string;
  geojson: GeoJSONFeatureCollection;
  color: string;
  width: number;
}

export interface HighlightRegion {
  id: string;
  name: string;
  /** FeatureCollection with a single Polygon/MultiPolygon feature */
  geojson: GeoJSONFeatureCollection;
  osmType?: 'node' | 'way' | 'relation';
  osmId?: number;
  /** per-region color; null falls back to the global highlight color / theme accent */
  color: string | null;
}

export type FontKey =
  | 'Space Grotesk'
  | 'Montserrat'
  | 'Playfair Display'
  | 'Oswald'
  | 'Bebas Neue'
  | 'Merriweather';

export type PanelKey =
  | 'location'
  | 'theme'
  | 'layout'
  | 'style'
  | 'layers'
  | 'markers'
  | 'routes'
  | 'settings';
