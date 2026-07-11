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
  // the one exception to "all on": labels stay opt-in (cfg.layers overrides)
  roadLabels: false,
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
    // A headless render IS a locked map, and saying so is what preserves the
    // camera. With `lockMap: false` plus the store's default `enableRotation:
    // false`, MapView's interaction effect calls setBearing(0)/setPitch(0) on
    // load — so `camera.bearing: 45` produced a byte-identical flat poster: a
    // parameter accepted at the boundary and then silently discarded. The lock
    // branch disables the handlers without ever touching the camera.
    lockMap: true,
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
