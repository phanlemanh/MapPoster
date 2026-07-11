import type { LayerState, RouteItem, Theme } from '../types';
import { smoothGeometry } from './smoothGeojson';

// OpenFreeMap planet vector tiles (OpenMapTiles schema, no API key required).
export const OPENFREEMAP_TILEJSON = 'https://tiles.openfreemap.org/planet';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Expr = any;

/** interpolate-by-zoom line width with an overall scale factor */
function zoomWidth(stops: [number, number][], scale: number): Expr {
  const expr: Expr = ['interpolate', ['linear'], ['zoom']];
  for (const [z, wpx] of stops) {
    expr.push(z, Math.max(0.05, wpx * scale));
  }
  return expr;
}

const vis = (on: boolean) => ({ visibility: on ? 'visible' : ('none' as const) });

export interface HighlightArgs {
  enabled: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  regions: Array<{ geojson: any; color: string | null }>;
  color: string | null;
  fill: boolean;
  dim: boolean;
}

export interface BuildStyleArgs {
  theme: Theme;
  layers: LayerState;
  /** 0..1 map detail */
  detail: number;
  routes: RouteItem[];
  highlight?: HighlightArgs;
}

/** Build a world-sized polygon with the region punched out as holes (spotlight mask). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildMask(fc: any) {
  const world = [
    [-180, -85.05],
    [180, -85.05],
    [180, 85.05],
    [-180, 85.05],
    [-180, -85.05],
  ];
  const holes: number[][][] = [];
  for (const f of fc?.features ?? []) {
    const g = f?.geometry;
    if (!g) continue;
    if (g.type === 'Polygon' && g.coordinates[0]) holes.push(g.coordinates[0]);
    else if (g.type === 'MultiPolygon') for (const poly of g.coordinates) if (poly[0]) holes.push(poly[0]);
  }
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [world, ...holes] } }],
  };
}

// OpenFreeMap serves glyph PBFs keylessly alongside its tiles. Only referenced
// when road labels are enabled — a label-free poster still needs no glyphs.
export const OPENFREEMAP_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/**
 * Build a full MapLibre style from a theme + layer toggles. By default no
 * symbol/text layers are emitted (the poster title is a separate overlay), so
 * no glyphs are required and the map reads as a clean artistic base. The one
 * opt-in exception is `layers.roadLabels`: names along MAJOR roads only —
 * motorway/trunk/primary/secondary — because that is wayfinding, not clutter.
 */
export function buildMapStyle({ theme, layers, detail, routes, highlight }: BuildStyleArgs) {
  const c = theme.colors;
  const widthScale = 0.6 + detail * 0.9; // 0.6x .. 1.5x
  const showMinor = detail > 0.12;

  // Merge every route into one FeatureCollection carrying per-feature style.
  const routeFeatures: Expr[] = [];
  for (const r of routes) {
    const fc = r.geojson;
    if (!fc || !Array.isArray(fc.features)) continue;
    for (const f of fc.features) {
      if (!f || !f.geometry) continue;
      routeFeatures.push({
        type: 'Feature',
        geometry: f.geometry,
        properties: { color: r.color, width: r.width },
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style: any = {
    version: 8,
    name: `MapPoster – ${theme.name}`,
    sources: {
      openmaptiles: { type: 'vector', url: OPENFREEMAP_TILEJSON },
      routes: {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: routeFeatures },
      },
    },
    layers: [
      {
        id: 'background',
        type: 'background',
        paint: { 'background-color': c.background },
      },
      // Landcover (wood / grass / natural) + landuse
      {
        id: 'landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        layout: vis(layers.landcover),
        paint: { 'fill-color': c.green, 'fill-opacity': 0.8 },
      },
      {
        id: 'landuse',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        layout: vis(layers.landcover),
        paint: { 'fill-color': c.landuse, 'fill-opacity': 0.5 },
      },
      // Parks
      {
        id: 'park',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        layout: vis(layers.parks),
        paint: { 'fill-color': c.park, 'fill-opacity': 0.75 },
      },
      // Water
      {
        id: 'water',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        layout: vis(layers.water),
        paint: { 'fill-color': c.water },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        layout: { ...vis(layers.water), 'line-cap': 'round' },
        paint: {
          'line-color': c.waterway,
          'line-width': zoomWidth([[8, 0.6], [12, 1.2], [16, 3]], widthScale),
        },
      },
      // Buildings
      {
        id: 'building',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 12,
        layout: vis(layers.buildings),
        paint: {
          'fill-color': c.building,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 12, 0, 14, 0.85],
        },
      },
      // Roads: minor -> major -> highway (paint order matters)
      {
        id: 'road-minor',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'minor', 'service', 'track', 'path', 'pedestrian', 'living_street'],
        minzoom: 12,
        layout: { ...vis(layers.roads && showMinor), 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': c.roadMinor,
          'line-width': zoomWidth([[12, 0.25], [14, 0.7], [16, 2], [18, 6]], widthScale),
        },
      },
      {
        id: 'road-major',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'primary', 'secondary', 'tertiary'],
        layout: { ...vis(layers.roads), 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': c.roadMajor,
          'line-width': zoomWidth([[8, 0.4], [12, 1], [16, 4], [18, 11]], widthScale),
        },
      },
      {
        id: 'road-highway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'motorway', 'trunk'],
        layout: { ...vis(layers.roads), 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': c.roadHighway,
          'line-width': zoomWidth([[5, 0.5], [10, 1.6], [14, 4.5], [18, 16]], widthScale),
        },
      },
      // Rail
      {
        id: 'rail',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', 'class', 'rail', 'transit'],
        layout: { ...vis(layers.rail), 'line-cap': 'round' },
        paint: {
          'line-color': c.rail,
          'line-width': zoomWidth([[10, 0.4], [14, 1.2], [18, 4]], widthScale),
        },
      },
      // Aeroway (runways / taxiways)
      {
        id: 'aeroway',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'aeroway',
        layout: vis(layers.aeroway),
        paint: {
          'line-color': c.aeroway,
          'line-width': zoomWidth([[11, 0.6], [14, 2.5], [18, 12]], widthScale),
        },
      },
      // Faint administrative boundaries (always on, subtle)
      {
        id: 'boundary',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'boundary',
        filter: ['<=', 'admin_level', 4],
        paint: {
          'line-color': c.boundary,
          'line-opacity': 0.5,
          'line-dasharray': [3, 2],
          'line-width': zoomWidth([[3, 0.4], [8, 1]], 1),
        },
      },
      // User routes (GPX)
      {
        id: 'route-line',
        type: 'line',
        source: 'routes',
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': ['coalesce', ['get', 'color'], c.accent],
          'line-width': ['coalesce', ['get', 'width'], 4],
        },
      },
    ],
  };

  // Major-road names, opt-in. Both the glyphs root and the symbol layer are
  // emitted together: MapLibre rejects a style whose text-field has no glyphs
  // endpoint even when the layer is hidden, so a vis() toggle can't gate this.
  if (layers.roadLabels) {
    style.glyphs = OPENFREEMAP_GLYPHS;
    style.layers.push({
      id: 'road-label-major',
      type: 'symbol',
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary', 'secondary'],
      layout: {
        'symbol-placement': 'line',
        'text-field': ['coalesce', ['get', 'name'], ['get', 'name:latin']],
        'text-font': ['Noto Sans Regular'],
        'text-size': zoomWidth([[12, 11], [14, 13], [16, 15]], 1),
        'text-letter-spacing': 0.06,
        'text-max-angle': 30,
        'text-padding': 4,
      },
      paint: {
        // The label lies ON the road line, and theme text is deliberately the
        // same hue family as the roads (1.5:1 against the azure highway — the
        // title this color was made for sits on the 13:1 background instead).
        // Legibility therefore comes from the halo carving the letterforms out
        // of the road: background-colored, and thick — MapLibre caps halos at
        // fontsize/4, which is also why the sizes above are not smaller.
        'text-color': c.text,
        'text-halo-color': c.background,
        'text-halo-width': 2.2,
        'text-halo-blur': 0.6,
        'text-opacity': 1,
      },
    });
  }

  // Region highlight — a list of regions, each optionally its own color.
  if (highlight?.enabled && highlight.regions?.length) {
    const globalColor = highlight.color || c.accent;

    // Combine every region into one FeatureCollection, tagging each feature
    // with its resolved color so fill/outline can be data-driven.
    const feats: Expr[] = [];
    for (const region of highlight.regions) {
      const rc = region.color || globalColor;
      for (const f of region.geojson?.features ?? []) {
        if (f?.geometry) feats.push({ type: 'Feature', properties: { color: rc }, geometry: smoothGeometry(f.geometry) });
      }
    }

    if (feats.length) {
      const combined = { type: 'FeatureCollection', features: feats };
      style.sources.highlight = { type: 'geojson', data: combined };
      const hlLayers: Expr[] = [];
      const colorExpr: Expr = ['coalesce', ['get', 'color'], globalColor];

      if (highlight.dim) {
        style.sources['highlight-mask'] = { type: 'geojson', data: buildMask(combined) };
        hlLayers.push({
          id: 'highlight-dim',
          type: 'fill',
          source: 'highlight-mask',
          paint: { 'fill-color': c.background, 'fill-opacity': 0.6 },
        });
      }
      if (highlight.fill) {
        hlLayers.push({
          id: 'highlight-fill',
          type: 'fill',
          source: 'highlight',
          paint: { 'fill-color': colorExpr, 'fill-opacity': 0.26 },
        });
      }
      // No crisp outline, by design: a hard line asserts "THIS is the exact
      // boundary", which invites arguments the poster doesn't need (and the
      // geocoded polygon, however good, is still an approximation). A fully
      // feathered edge — blur ≈ width leaves the line no solid core — reads as
      // "this area", not "this border", while keeping the region recognisable.
      hlLayers.push({
        id: 'highlight-soft-edge',
        type: 'line',
        source: 'highlight',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': colorExpr,
          'line-opacity': 0.45,
          'line-blur': zoomWidth([[3, 6], [12, 14], [16, 22]], 1),
          'line-width': zoomWidth([[3, 6], [12, 14], [16, 22]], 1),
        },
      });

      // keep routes/markers above the highlight
      const idx = style.layers.findIndex((l: Expr) => l.id === 'route-line');
      style.layers.splice(idx < 0 ? style.layers.length : idx, 0, ...hlLayers);
    }
  }

  return style;
}
