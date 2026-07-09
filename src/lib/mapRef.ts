import type { Map as MlMap } from 'maplibre-gl';

// Singleton holder for the live preview map so far-away UI (Download button)
// can reach it without prop-drilling.
let instance: MlMap | null = null;

export function setMapInstance(map: MlMap | null) {
  instance = map;
}

export function getMapInstance(): MlMap | null {
  return instance;
}
