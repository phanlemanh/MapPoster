import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  FontKey,
  HighlightRegion,
  LayerKey,
  LayerState,
  LocationInfo,
  MarkerIconKey,
  MarkerItem,
  PanelKey,
  RouteItem,
} from '../types';
import { DEFAULT_THEME_ID, getTheme } from '../data/themes';
import { DEFAULT_LAYOUT_ID } from '../data/layouts';
import { DEFAULT_FONT } from '../data/fonts';

export interface MapView {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
}

interface PosterState {
  // --- persisted content ---
  location: LocationInfo;
  view: MapView;
  themeId: string;
  layoutId: string;
  layers: LayerState;
  detail: number; // 0..1
  showText: boolean;
  showCity: boolean;
  showCountry: boolean;
  showCoords: boolean;
  font: FontKey;
  markers: MarkerItem[];
  routes: RouteItem[];
  lockMap: boolean;
  enableRotation: boolean;
  onboardingDone: boolean;

  // region highlight (a managed list of regions)
  highlightEnabled: boolean;
  highlightRegions: HighlightRegion[];
  highlightColor: string | null; // global default; null => use theme accent
  highlightFill: boolean;
  highlightDim: boolean;
  highlightLoading: boolean;

  // --- transient (not persisted) ---
  activePanel: PanelKey | null;
  selectedMarkerId: string | null;
  placingIcon: MarkerIconKey | null;

  // --- actions ---
  setLocation: (loc: LocationInfo) => void;
  setView: (view: Partial<MapView>) => void;
  setTheme: (id: string) => void;
  setLayout: (id: string) => void;
  toggleLayer: (key: LayerKey) => void;
  setDetail: (v: number) => void;
  setStyleFlags: (flags: Partial<Pick<PosterState, 'showText' | 'showCity' | 'showCountry' | 'showCoords'>>) => void;
  setFont: (f: FontKey) => void;
  addMarker: (icon: MarkerIconKey, lng: number, lat: number) => void;
  updateMarker: (id: string, patch: Partial<MarkerItem>) => void;
  removeMarker: (id: string) => void;
  selectMarker: (id: string | null) => void;
  clearMarkers: () => void;
  setPlacingIcon: (icon: MarkerIconKey | null) => void;
  addRoute: (route: RouteItem) => void;
  updateRoute: (id: string, patch: Partial<RouteItem>) => void;
  removeRoute: (id: string) => void;
  clearRoutes: () => void;
  setLock: (v: boolean) => void;
  setRotation: (v: boolean) => void;
  setHighlightEnabled: (v: boolean) => void;
  addHighlightRegion: (region: HighlightRegion) => void;
  removeHighlightRegion: (id: string) => void;
  updateHighlightRegion: (id: string, patch: Partial<HighlightRegion>) => void;
  clearHighlightRegions: () => void;
  setHighlightColor: (c: string | null) => void;
  setHighlightFill: (v: boolean) => void;
  setHighlightDim: (v: boolean) => void;
  setHighlightLoading: (v: boolean) => void;
  openPanel: (p: PanelKey) => void;
  togglePanel: (p: PanelKey) => void;
  closePanel: () => void;
  completeOnboarding: () => void;
}

const DEFAULT_LAYERS: LayerState = {
  landcover: true,
  buildings: true,
  water: true,
  parks: true,
  roads: true,
  rail: true,
  aeroway: true,
};

const DEFAULT_LOCATION: LocationInfo = {
  name: 'Paris',
  country: 'France',
  lng: 2.3522,
  lat: 48.8566,
  zoom: 12.5,
};

let markerCounter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(markerCounter++).toString(36)}`;

/**
 * Persisted-state migration. v1 stored a single highlight
 * (highlightData/highlightName); v2 uses the highlightRegions list.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function migrateState(persisted: any, version: number): any {
  const s = persisted;
  if (s && version < 2) {
    const regions = [];
    if (s.highlightData && s.highlightData.features?.length) {
      regions.push({ id: 'legacy-region', name: s.highlightName || '', geojson: s.highlightData, color: null });
    }
    s.highlightRegions = regions;
    delete s.highlightData;
    delete s.highlightName;
  }
  return s;
}

export const usePosterStore = create<PosterState>()(
  persist(
    (set, get) => ({
      location: DEFAULT_LOCATION,
      view: { center: [DEFAULT_LOCATION.lng, DEFAULT_LOCATION.lat], zoom: DEFAULT_LOCATION.zoom, bearing: 0, pitch: 0 },
      themeId: DEFAULT_THEME_ID,
      layoutId: DEFAULT_LAYOUT_ID,
      layers: DEFAULT_LAYERS,
      detail: 0.6,
      showText: true,
      showCity: true,
      showCountry: true,
      showCoords: true,
      font: DEFAULT_FONT,
      markers: [],
      routes: [],
      lockMap: false,
      enableRotation: false,
      onboardingDone: false,

      highlightEnabled: false,
      highlightRegions: [],
      highlightColor: null,
      highlightFill: true,
      highlightDim: false,
      highlightLoading: false,

      activePanel: null,
      selectedMarkerId: null,
      placingIcon: null,

      setLocation: (loc) =>
        set({
          location: loc,
          view: { center: [loc.lng, loc.lat], zoom: loc.zoom, bearing: 0, pitch: 0 },
        }),
      setView: (view) => set((s) => ({ view: { ...s.view, ...view } })),
      setTheme: (id) => set({ themeId: id }),
      setLayout: (id) => set({ layoutId: id }),
      toggleLayer: (key) => set((s) => ({ layers: { ...s.layers, [key]: !s.layers[key] } })),
      setDetail: (v) => set({ detail: Math.min(1, Math.max(0, v)) }),
      setStyleFlags: (flags) => set(flags),
      setFont: (f) => set({ font: f }),

      addMarker: (icon, lng, lat) => {
        const accent = getTheme(get().themeId).colors.accent;
        const marker: MarkerItem = { id: nextId('mk'), icon, lng, lat, size: 40, color: accent };
        set((s) => ({ markers: [...s.markers, marker], selectedMarkerId: marker.id }));
      },
      updateMarker: (id, patch) =>
        set((s) => ({ markers: s.markers.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
      removeMarker: (id) =>
        set((s) => ({
          markers: s.markers.filter((m) => m.id !== id),
          selectedMarkerId: s.selectedMarkerId === id ? null : s.selectedMarkerId,
        })),
      selectMarker: (id) => set({ selectedMarkerId: id }),
      clearMarkers: () => set({ markers: [], selectedMarkerId: null }),
      setPlacingIcon: (icon) => set({ placingIcon: icon }),

      addRoute: (route) => set((s) => ({ routes: [...s.routes, route] })),
      updateRoute: (id, patch) => set((s) => ({ routes: s.routes.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      removeRoute: (id) => set((s) => ({ routes: s.routes.filter((r) => r.id !== id) })),
      clearRoutes: () => set({ routes: [] }),

      setLock: (v) => set({ lockMap: v }),
      setRotation: (v) => set({ enableRotation: v }),

      setHighlightEnabled: (v) => set(v ? { highlightEnabled: true } : { highlightEnabled: false, highlightLoading: false }),
      addHighlightRegion: (region) =>
        set((s) =>
          s.highlightRegions.some((r) => r.id === region.id)
            ? { highlightLoading: false }
            : { highlightRegions: [...s.highlightRegions, region], highlightLoading: false },
        ),
      removeHighlightRegion: (id) => set((s) => ({ highlightRegions: s.highlightRegions.filter((r) => r.id !== id) })),
      updateHighlightRegion: (id, patch) =>
        set((s) => ({ highlightRegions: s.highlightRegions.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      clearHighlightRegions: () => set({ highlightRegions: [] }),
      setHighlightColor: (c) => set({ highlightColor: c }),
      setHighlightFill: (v) => set({ highlightFill: v }),
      setHighlightDim: (v) => set({ highlightDim: v }),
      setHighlightLoading: (v) => set({ highlightLoading: v }),

      openPanel: (p) => set({ activePanel: p }),
      togglePanel: (p) => set((s) => ({ activePanel: s.activePanel === p ? null : p })),
      closePanel: () => set({ activePanel: null }),
      completeOnboarding: () => set({ onboardingDone: true }),
    }),
    {
      name: 'mapposter-store',
      version: 2,
      migrate: (persisted, version) => migrateState(persisted, version),
      partialize: (s) => ({
        location: s.location,
        view: s.view,
        themeId: s.themeId,
        layoutId: s.layoutId,
        layers: s.layers,
        detail: s.detail,
        showText: s.showText,
        showCity: s.showCity,
        showCountry: s.showCountry,
        showCoords: s.showCoords,
        font: s.font,
        markers: s.markers,
        routes: s.routes,
        lockMap: s.lockMap,
        enableRotation: s.enableRotation,
        onboardingDone: s.onboardingDone,
        highlightEnabled: s.highlightEnabled,
        highlightRegions: s.highlightRegions,
        highlightColor: s.highlightColor,
        highlightFill: s.highlightFill,
        highlightDim: s.highlightDim,
      }),
    },
  ),
);

export const nextRouteId = () => nextId('rt');
