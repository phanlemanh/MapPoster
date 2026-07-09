import { usePosterStore } from '../store/usePosterStore';
import { DEFAULT_FONT } from '../data/fonts';
import type { HighlightRegion, LayerState, MarkerItem } from '../types';
import type { RenderConfig } from './renderConfig';

const ALL_LAYERS_ON: LayerState = {
  landcover: true,
  buildings: true,
  water: true,
  parks: true,
  roads: true,
  rail: true,
  aeroway: true,
};

/**
 * Deterministically set the Zustand store from a fully-resolved RenderConfig.
 * Used by the headless render mode — bypasses onboarding, localStorage and any
 * geocoding (highlight regions arrive as concrete GeoJSON).
 */
export function applyRenderConfig(cfg: RenderConfig): void {
  const showText = cfg.chrome !== 'clean';
  const showCity = cfg.chrome === 'poster';

  const markers: MarkerItem[] = (cfg.markers ?? []).map((m, i) => ({
    id: `rm-${i}`,
    lng: m.lng,
    lat: m.lat,
    icon: m.icon,
    color: m.color,
    size: m.size,
  }));

  const highlightRegions: HighlightRegion[] = (cfg.highlight?.regions ?? []).map((r, i) => ({
    id: `hr-${i}`,
    name: '',
    geojson: r.geojson,
    color: r.color,
  }));

  usePosterStore.setState({
    location: { name: cfg.place.name, country: cfg.place.country, lng: cfg.place.lng, lat: cfg.place.lat, zoom: cfg.camera.zoom },
    view: { center: cfg.camera.center, zoom: cfg.camera.zoom, bearing: cfg.camera.bearing ?? 0, pitch: cfg.camera.pitch ?? 0 },
    themeId: cfg.theme,
    layers: { ...ALL_LAYERS_ON, ...(cfg.layers ?? {}) },
    detail: cfg.detail ?? 0.6,
    font: cfg.font ?? DEFAULT_FONT,
    showText,
    showCity,
    showCountry: showText,
    showCoords: showText,
    markers,
    highlightRegions,
    highlightEnabled: highlightRegions.length > 0,
    highlightFill: cfg.highlight?.fill ?? true,
    highlightDim: cfg.highlight?.dim ?? false,
    highlightColor: cfg.highlight?.color ?? null,
    onboardingDone: true,
  });
}
