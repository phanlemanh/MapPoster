import { describe, it, expect, beforeEach } from 'vitest';
import { usePosterStore } from '../store/usePosterStore';
import { applyRenderConfig } from './applyRenderConfig';
import type { RenderConfig } from './renderConfig';

const initial = usePosterStore.getState();

const baseCfg: RenderConfig = {
  camera: { center: [106.7, 10.78], zoom: 15 },
  size: { width: 1080, height: 1920 },
  theme: 'midnight-blue',
  chrome: 'clean',
  place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 },
  markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#ffffff', size: 40 }],
};

const fc = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] } }] };

describe('applyRenderConfig', () => {
  beforeEach(() => usePosterStore.setState(initial, true));

  it('hydrates the store deterministically and skips onboarding', () => {
    applyRenderConfig(baseCfg);
    const s = usePosterStore.getState();
    expect(s.onboardingDone).toBe(true);
    expect(s.themeId).toBe('midnight-blue');
    expect(s.view.center).toEqual([106.7, 10.78]);
    expect(s.view.zoom).toBe(15);
    expect(s.location.name).toBe('HCMC');
    expect(s.markers).toHaveLength(1);
    expect(s.markers[0].icon).toBe('pin');
  });

  it('chrome=clean hides all poster text', () => {
    applyRenderConfig({ ...baseCfg, chrome: 'clean' });
    const s = usePosterStore.getState();
    expect(s.showText).toBe(false);
  });

  it('chrome=poster enables the city title', () => {
    applyRenderConfig({ ...baseCfg, chrome: 'poster' });
    const s = usePosterStore.getState();
    expect(s.showText).toBe(true);
    expect(s.showCity).toBe(true);
  });

  it('chrome=label shows text but not the big city title', () => {
    applyRenderConfig({ ...baseCfg, chrome: 'label' });
    const s = usePosterStore.getState();
    expect(s.showText).toBe(true);
    expect(s.showCity).toBe(false);
  });

  it('maps highlight regions into the store and enables highlight', () => {
    applyRenderConfig({ ...baseCfg, highlight: { regions: [{ geojson: fc, color: '#ff8a3d' }], color: null, fill: true, dim: true } });
    const s = usePosterStore.getState();
    expect(s.highlightEnabled).toBe(true);
    expect(s.highlightRegions).toHaveLength(1);
    expect(s.highlightRegions[0].color).toBe('#ff8a3d');
    expect(s.highlightDim).toBe(true);
  });

  it('merges partial layer overrides onto an all-on base', () => {
    applyRenderConfig({ ...baseCfg, layers: { buildings: false } });
    const s = usePosterStore.getState();
    expect(s.layers.buildings).toBe(false);
    expect(s.layers.water).toBe(true);
  });
});
