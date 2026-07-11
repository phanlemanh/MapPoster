import { describe, it, expect } from 'vitest';
import { buildMapStyle } from './mapStyle';
import { getTheme } from '../data/themes';
import type { LayerState, RouteItem } from '../types';

const theme = getTheme('midnight-blue');
const allLayers: LayerState = {
  landcover: true,
  buildings: true,
  water: true,
  parks: true,
  roads: true,
  rail: true,
  aeroway: true,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const layer = (style: any, id: string) => style.layers.find((l: any) => l.id === id);

const polygonFC = (coords: number[][]) => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [coords] } }],
});

const square = [
  [106.6, 10.7],
  [106.8, 10.7],
  [106.8, 10.9],
  [106.6, 10.9],
  [106.6, 10.7],
];

describe('buildMapStyle base', () => {
  it('uses the OpenFreeMap vector source and theme background', () => {
    const style = buildMapStyle({ theme, layers: allLayers, detail: 0.6, routes: [] });
    expect(style.version).toBe(8);
    expect(style.sources.openmaptiles.url).toContain('tiles.openfreemap.org/planet');
    expect(layer(style, 'background').paint['background-color']).toBe(theme.colors.background);
  });

  it('emits no symbol/text layers (label-free poster) and needs no glyphs', () => {
    const style = buildMapStyle({ theme, layers: allLayers, detail: 0.6, routes: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(style.layers.some((l: any) => l.type === 'symbol')).toBe(false);
    expect(style.glyphs).toBeUndefined();
  });
});

describe('layer toggles', () => {
  it('hides water + waterway when water is off', () => {
    const style = buildMapStyle({ theme, layers: { ...allLayers, water: false }, detail: 0.6, routes: [] });
    expect(layer(style, 'water').layout.visibility).toBe('none');
    expect(layer(style, 'waterway').layout.visibility).toBe('none');
  });

  it('keeps buildings visible when on', () => {
    const style = buildMapStyle({ theme, layers: allLayers, detail: 0.6, routes: [] });
    expect(layer(style, 'building').layout.visibility).toBe('visible');
  });

  it('hides all road classes when roads is off', () => {
    const style = buildMapStyle({ theme, layers: { ...allLayers, roads: false }, detail: 0.6, routes: [] });
    expect(layer(style, 'road-highway').layout.visibility).toBe('none');
    expect(layer(style, 'road-major').layout.visibility).toBe('none');
    expect(layer(style, 'road-minor').layout.visibility).toBe('none');
  });
});

describe('detail level', () => {
  it('hides minor roads at very low detail', () => {
    const low = buildMapStyle({ theme, layers: allLayers, detail: 0, routes: [] });
    expect(layer(low, 'road-minor').layout.visibility).toBe('none');
  });

  it('shows minor roads at higher detail', () => {
    const high = buildMapStyle({ theme, layers: allLayers, detail: 0.6, routes: [] });
    expect(layer(high, 'road-minor').layout.visibility).toBe('visible');
  });
});

describe('routes', () => {
  it('puts each route feature into the routes geojson source with style props', () => {
    const routes: RouteItem[] = [
      {
        id: 'r1',
        name: 'Ride',
        color: '#1e63ff',
        width: 7,
        geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[0, 0], [1, 1]] } }] },
      },
    ];
    const style = buildMapStyle({ theme, layers: allLayers, detail: 0.6, routes });
    const feats = style.sources.routes.data.features;
    expect(feats).toHaveLength(1);
    expect(feats[0].properties).toEqual({ color: '#1e63ff', width: 7 });
    expect(layer(style, 'route-line')).toBeTruthy();
  });
});

describe('region highlight', () => {
  const baseArgs = { theme, layers: allLayers, detail: 0.6, routes: [] };

  it('adds no highlight layers when disabled', () => {
    const style = buildMapStyle({ ...baseArgs, highlight: { enabled: false, regions: [], color: null, fill: true, dim: false } });
    expect(layer(style, 'highlight-soft-edge')).toBeUndefined();
    expect(style.sources.highlight).toBeUndefined();
  });

  it('adds soft-edge + fill layers for one region, defaulting to theme accent', () => {
    const style = buildMapStyle({
      ...baseArgs,
      highlight: { enabled: true, regions: [{ geojson: polygonFC(square), color: null }], color: null, fill: true, dim: false },
    });
    expect(layer(style, 'highlight-soft-edge')).toBeTruthy();
    expect(layer(style, 'highlight-fill')).toBeTruthy();
    // per-feature color property resolves to the theme accent
    const feat = style.sources.highlight.data.features[0];
    expect(feat.properties.color).toBe(theme.colors.accent);
  });

  it('omits the fill layer when fill is off but keeps the soft edge', () => {
    const style = buildMapStyle({
      ...baseArgs,
      highlight: { enabled: true, regions: [{ geojson: polygonFC(square), color: null }], color: null, fill: false, dim: false },
    });
    expect(layer(style, 'highlight-fill')).toBeUndefined();
    expect(layer(style, 'highlight-soft-edge')).toBeTruthy();
  });

  it('never draws a crisp boundary line — the edge is fully feathered', () => {
    const style = buildMapStyle({
      ...baseArgs,
      highlight: { enabled: true, regions: [{ geojson: polygonFC(square), color: null }], color: null, fill: true, dim: false },
    });
    expect(layer(style, 'highlight-outline')).toBeUndefined();
    const edge = layer(style, 'highlight-soft-edge');
    // blur stops mirror width stops → no solid core anywhere in the zoom range
    expect(edge.paint['line-blur']).toEqual(edge.paint['line-width']);
    expect(edge.paint['line-opacity']).toBeLessThan(0.6);
  });

  it('builds a spotlight mask (world polygon with region holes) when dim is on', () => {
    const style = buildMapStyle({
      ...baseArgs,
      highlight: { enabled: true, regions: [{ geojson: polygonFC(square), color: null }], color: null, fill: true, dim: true },
    });
    expect(layer(style, 'highlight-dim')).toBeTruthy();
    const mask = style.sources['highlight-mask'].data.features[0].geometry;
    expect(mask.type).toBe('Polygon');
    // ring[0] = world bounds, ring[1] = the region hole — the hole must match
    // the (smoothed) outline geometry exactly or the spotlight leaks
    expect(mask.coordinates.length).toBe(2);
    expect(mask.coordinates[1]).toEqual(style.sources.highlight.data.features[0].geometry.coordinates[0]);
  });

  it('smooths region rings and layers the soft edge above the fill', () => {
    const style = buildMapStyle({
      ...baseArgs,
      highlight: { enabled: true, regions: [{ geojson: polygonFC(square), color: null }], color: null, fill: true, dim: false },
    });
    const ring = style.sources.highlight.data.features[0].geometry.coordinates[0];
    expect(ring.length).toBeGreaterThan(square.length); // Chaikin multiplied the points
    expect(ring[0]).toEqual(ring[ring.length - 1]); // still a closed ring
    const ids = style.layers.map((l: { id: string }) => l.id);
    expect(ids.indexOf('highlight-fill')).toBeLessThan(ids.indexOf('highlight-soft-edge'));
  });

  it('combines multiple regions with per-region colors', () => {
    const style = buildMapStyle({
      ...baseArgs,
      highlight: {
        enabled: true,
        color: '#ffffff',
        fill: true,
        dim: false,
        regions: [
          { geojson: polygonFC(square), color: null }, // -> global #ffffff
          { geojson: polygonFC(square), color: '#ff8a3d' }, // -> own color
        ],
      },
    });
    const feats = style.sources.highlight.data.features;
    expect(feats).toHaveLength(2);
    expect(feats[0].properties.color).toBe('#ffffff');
    expect(feats[1].properties.color).toBe('#ff8a3d');
  });
});
