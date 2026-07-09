import { describe, it, expect, beforeEach } from 'vitest';
import { usePosterStore, migrateState } from './usePosterStore';
import type { HighlightRegion } from '../types';

const initial = usePosterStore.getState();
beforeEach(() => {
  usePosterStore.setState(initial, true);
});

const region = (id: string, color: string | null = null): HighlightRegion => ({
  id,
  name: id,
  color,
  geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } }] },
});

describe('migrateState', () => {
  it('converts a v1 single highlight into the v2 regions list', () => {
    const v1 = {
      highlightEnabled: true,
      highlightName: 'Ho Chi Minh City',
      highlightData: { type: 'FeatureCollection', features: [{ type: 'Feature', geometry: {} }] },
    };
    const out = migrateState({ ...v1 }, 1);
    expect(out.highlightRegions).toHaveLength(1);
    expect(out.highlightRegions[0].name).toBe('Ho Chi Minh City');
    expect(out.highlightData).toBeUndefined();
    expect(out.highlightName).toBeUndefined();
  });

  it('produces an empty regions list when v1 had no highlight data', () => {
    const out = migrateState({ highlightEnabled: false }, 1);
    expect(out.highlightRegions).toEqual([]);
  });

  it('passes v2 state through untouched', () => {
    const v2 = { highlightRegions: [region('a')] };
    expect(migrateState(v2, 2)).toBe(v2);
  });
});

describe('layer + location actions', () => {
  it('toggleLayer flips a single layer', () => {
    expect(usePosterStore.getState().layers.water).toBe(true);
    usePosterStore.getState().toggleLayer('water');
    expect(usePosterStore.getState().layers.water).toBe(false);
    expect(usePosterStore.getState().layers.roads).toBe(true);
  });

  it('setLocation recenters the view and keeps OSM ids', () => {
    usePosterStore.getState().setLocation({ name: 'HCMC', country: 'Vietnam', lng: 106.7, lat: 10.77, zoom: 11, osmType: 'relation', osmId: 1973756 });
    const s = usePosterStore.getState();
    expect(s.view.center).toEqual([106.7, 10.77]);
    expect(s.view.zoom).toBe(11);
    expect(s.view.bearing).toBe(0);
    expect(s.location.osmId).toBe(1973756);
  });
});

describe('highlight region actions', () => {
  it('adds and dedupes regions by id', () => {
    const { addHighlightRegion } = usePosterStore.getState();
    addHighlightRegion(region('hl-a'));
    addHighlightRegion(region('hl-a')); // duplicate id -> ignored
    addHighlightRegion(region('hl-b'));
    expect(usePosterStore.getState().highlightRegions.map((r) => r.id)).toEqual(['hl-a', 'hl-b']);
  });

  it('updates a region color and removes by id', () => {
    const s = usePosterStore.getState();
    s.addHighlightRegion(region('hl-a'));
    s.updateHighlightRegion('hl-a', { color: '#ff8a3d' });
    expect(usePosterStore.getState().highlightRegions[0].color).toBe('#ff8a3d');
    s.removeHighlightRegion('hl-a');
    expect(usePosterStore.getState().highlightRegions).toHaveLength(0);
  });

  it('disabling highlight clears the loading flag', () => {
    usePosterStore.getState().setHighlightLoading(true);
    usePosterStore.getState().setHighlightEnabled(false);
    expect(usePosterStore.getState().highlightLoading).toBe(false);
    expect(usePosterStore.getState().highlightEnabled).toBe(false);
  });
});

describe('markers + routes', () => {
  it('adds a marker (selected) and updates it', () => {
    usePosterStore.getState().addMarker('heart', 106.7, 10.77);
    const s = usePosterStore.getState();
    expect(s.markers).toHaveLength(1);
    expect(s.markers[0].icon).toBe('heart');
    expect(s.selectedMarkerId).toBe(s.markers[0].id);

    usePosterStore.getState().updateMarker(s.markers[0].id, { size: 80 });
    expect(usePosterStore.getState().markers[0].size).toBe(80);
  });

  it('adds and updates a route', () => {
    usePosterStore.getState().addRoute({ id: 'r1', name: 'Ride', color: '#000', width: 4, geojson: { type: 'FeatureCollection', features: [] } });
    usePosterStore.getState().updateRoute('r1', { color: '#1e63ff', width: 7 });
    const r = usePosterStore.getState().routes[0];
    expect(r.color).toBe('#1e63ff');
    expect(r.width).toBe(7);
  });
});
