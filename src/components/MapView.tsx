import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { usePosterStore } from '../store/usePosterStore';
import { buildMapStyle } from '../lib/mapStyle';
import { getTheme } from '../data/themes';
import { setMapInstance } from '../lib/mapRef';
import { markerSvg, getMarkerIcon } from '../data/markers';
import type { MarkerItem } from '../types';

function applyInteractions(map: maplibregl.Map, lock: boolean, rotation: boolean) {
  const handlers = [map.dragPan, map.scrollZoom, map.boxZoom, map.doubleClickZoom, map.keyboard, map.touchZoomRotate];
  if (lock) {
    handlers.forEach((h) => h.disable());
    map.dragRotate.disable();
  } else {
    handlers.forEach((h) => h.enable());
    if (rotation) {
      map.dragRotate.enable();
      map.touchZoomRotate.enableRotation();
    } else {
      map.dragRotate.disable();
      map.touchZoomRotate.disableRotation();
      // setBearing/setPitch call map.stop(), which cancels an in-flight flyTo.
      // This runs in an effect right after the one that starts the flight, so
      // resetting unconditionally would kill every camera animation at t=0.
      if (map.getBearing() !== 0) map.setBearing(0);
      if (map.getPitch() !== 0) map.setPitch(0);
    }
  }
}

export default function MapView() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  /**
   * Reactive, NOT a ref. Every effect below is a no-op until the map fires
   * `load`, so each one must re-run when that happens. A ref cannot schedule
   * that re-run: state arriving before `load` — a chosen marker icon, a
   * highlight region, a new location — would be dropped silently and forever.
   */
  const [ready, setReady] = useState(false);
  /** Location the camera has already been flown to; seeded at mount so a reload keeps the persisted view. */
  const flownToRef = useRef<string | null>(null);

  // subscribe to style-affecting state
  const themeId = usePosterStore((s) => s.themeId);
  const layers = usePosterStore((s) => s.layers);
  const detail = usePosterStore((s) => s.detail);
  const routes = usePosterStore((s) => s.routes);
  const location = usePosterStore((s) => s.location);
  const lockMap = usePosterStore((s) => s.lockMap);
  const enableRotation = usePosterStore((s) => s.enableRotation);
  const markers = usePosterStore((s) => s.markers);
  const selectedMarkerId = usePosterStore((s) => s.selectedMarkerId);
  const placingIcon = usePosterStore((s) => s.placingIcon);
  const highlightEnabled = usePosterStore((s) => s.highlightEnabled);
  const highlightRegions = usePosterStore((s) => s.highlightRegions);
  const highlightColor = usePosterStore((s) => s.highlightColor);
  const highlightFill = usePosterStore((s) => s.highlightFill);
  const highlightDim = usePosterStore((s) => s.highlightDim);

  // --- create map once ---
  useEffect(() => {
    if (!containerRef.current) return;
    const s = usePosterStore.getState();
    const theme = getTheme(s.themeId);
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: buildMapStyle({
        theme,
        layers: s.layers,
        detail: s.detail,
        routes: s.routes,
        highlight: {
          enabled: s.highlightEnabled,
          regions: s.highlightRegions,
          color: s.highlightColor,
          fill: s.highlightFill,
          dim: s.highlightDim,
        },
      }),
      center: s.view.center,
      zoom: s.view.zoom,
      bearing: s.view.bearing,
      pitch: s.view.pitch,
      attributionControl: false,
      // preserveDrawingBuffer is required so the WebGL canvas can be read back
      // for high-res export (MapLibre v5 nests it under canvasContextAttributes).
      canvasContextAttributes: { preserveDrawingBuffer: true, antialias: true },
      maxCanvasSize: [8192, 8192],
      fadeDuration: 0,
      dragRotate: false,
    });
    mapRef.current = map;
    flownToRef.current = `${s.location.lng},${s.location.lat},${s.location.zoom}`;
    setMapInstance(map);
    if (import.meta.env.DEV) {
      map.on('error', (e) => console.error('[maplibre error]', e.error?.message ?? e));
      (window as unknown as { __map?: maplibregl.Map }).__map = map;
    }

    map.on('load', () => {
      setReady(true);
      applyInteractions(map, s.lockMap, s.enableRotation);
    });

    // persist camera on move (does not re-render this component)
    const persist = () => {
      const c = map.getCenter();
      usePosterStore.getState().setView({
        center: [c.lng, c.lat],
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    };
    map.on('moveend', persist);

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      setMapInstance(null);
      map.remove();
      mapRef.current = null;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- rebuild style on theme / layers / detail / routes change ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const theme = getTheme(themeId);
    map.setStyle(
      buildMapStyle({
        theme,
        layers,
        detail,
        routes,
        highlight: { enabled: highlightEnabled, regions: highlightRegions, color: highlightColor, fill: highlightFill, dim: highlightDim },
      }),
      { diff: true },
    );
  }, [ready, themeId, layers, detail, routes, highlightEnabled, highlightRegions, highlightColor, highlightFill, highlightDim]);

  // --- fly to a newly chosen location ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const key = `${location.lng},${location.lat},${location.zoom}`;
    // The map opens at the persisted `view` (where the user last panned), which
    // is not the same as `location`. Flying on the ready-transition would throw
    // that camera away on every reload, so only fly once the location changes.
    if (flownToRef.current === key) return;
    flownToRef.current = key;
    map.flyTo({ center: [location.lng, location.lat], zoom: location.zoom, duration: 900, essential: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, location.lng, location.lat, location.zoom]);

  // --- interactions (lock / rotation) ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    applyInteractions(map, lockMap, enableRotation);
  }, [ready, lockMap, enableRotation]);

  // --- marker placement mode: next map click drops the chosen marker ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const canvas = map.getCanvas();
    if (!placingIcon) {
      canvas.style.cursor = '';
      return;
    }
    canvas.style.cursor = 'crosshair';
    const onClick = (e: maplibregl.MapMouseEvent) => {
      usePosterStore.getState().addMarker(placingIcon, e.lngLat.lng, e.lngLat.lat);
      usePosterStore.getState().setPlacingIcon(null);
    };
    map.once('click', onClick);
    return () => {
      map.off('click', onClick);
      canvas.style.cursor = '';
    };
  }, [ready, placingIcon]);

  // --- reconcile DOM markers ---
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const store = usePosterStore.getState();
    const existing = markersRef.current;

    // remove deleted
    for (const [id, mk] of existing) {
      if (!markers.find((m) => m.id === id)) {
        mk.remove();
        existing.delete(id);
      }
    }

    for (const item of markers) {
      let mk = existing.get(item.id);
      if (!mk) {
        const el = document.createElement('div');
        el.className = 'poster-marker';
        const def = getMarkerIcon(item.icon);
        mk = new maplibregl.Marker({ element: el, draggable: true, anchor: 'center' });
        mk.setLngLat([item.lng, item.lat]).addTo(map);
        mk.on('dragend', () => {
          const ll = mk!.getLngLat();
          store.updateMarker(item.id, { lng: ll.lng, lat: ll.lat });
        });
        el.addEventListener('mousedown', (e) => {
          // select on press (before drag)
          if (!(e.target as HTMLElement).closest('.marker-resize')) {
            usePosterStore.getState().selectMarker(item.id);
          }
        });
        // anchor offset so bottom-anchored icons (pin) sit correctly
        void def;
        existing.set(item.id, mk);
      }
      updateMarkerEl(mk, item, item.id === selectedMarkerId);
      const cur = mk.getLngLat();
      if (cur.lng !== item.lng || cur.lat !== item.lat) mk.setLngLat([item.lng, item.lat]);
    }
  }, [markers, selectedMarkerId]);

  return <div ref={containerRef} className="map-view" />;
}

function updateMarkerEl(mk: maplibregl.Marker, item: MarkerItem, selected: boolean) {
  const el = mk.getElement();
  const def = getMarkerIcon(item.icon);
  el.style.width = `${item.size}px`;
  el.style.height = `${item.size}px`;
  el.style.cursor = 'grab';
  el.classList.toggle('selected', selected);

  // For a bottom-anchored pin, shift the element up by half its height so the
  // tip lands on the coordinate even though the Marker anchor is 'center'.
  const bottomAnchor = def.anchor.y > 18;
  mk.setOffset(bottomAnchor ? [0, -item.size / 2] : [0, 0]);

  el.innerHTML =
    markerSvg(item.icon, item.color, item.size) +
    (selected
      ? `<div class="marker-resize" title="Drag to resize"></div>`
      : '');

  if (selected) {
    const handle = el.querySelector('.marker-resize') as HTMLElement | null;
    if (handle) attachResize(handle, mk, item);
  }
}

/** Manual resize via a corner handle; suspends Marker dragging while resizing. */
function attachResize(handle: HTMLElement, mk: maplibregl.Marker, item: MarkerItem) {
  handle.onpointerdown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    mk.setDraggable(false);
    const startSize = item.size;
    const startX = e.clientX;
    const startY = e.clientY;
    const move = (ev: PointerEvent) => {
      const d = (ev.clientX - startX + (ev.clientY - startY)) / 2;
      const size = Math.min(140, Math.max(18, Math.round(startSize + d)));
      usePosterStore.getState().updateMarker(item.id, { size });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      mk.setDraggable(true);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
}
