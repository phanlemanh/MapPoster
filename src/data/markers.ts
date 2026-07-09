import type { MarkerIconKey } from '../types';

export interface MarkerIconDef {
  key: MarkerIconKey;
  label: string;
  /** SVG path drawn inside a 24x24 viewBox */
  path: string;
  /** anchor point (within 24x24) that sits on the geographic coordinate */
  anchor: { x: number; y: number };
  /** whether the icon should get a white outline for contrast */
  outline: boolean;
}

export const MARKER_ICONS: MarkerIconDef[] = [
  {
    key: 'pin',
    label: 'Pin',
    path: 'M12 1.5c-3.87 0-7 3.13-7 7 0 5.05 6.16 13.14 6.42 13.48a.73.73 0 0 0 1.16 0C13.84 21.64 20 13.55 20 8.5c0-3.87-3.13-7-7-7zm0 9.7a2.7 2.7 0 1 1 0-5.4 2.7 2.7 0 0 1 0 5.4z',
    anchor: { x: 12, y: 23 },
    outline: true,
  },
  {
    key: 'heart',
    label: 'Heart',
    path: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
    anchor: { x: 12, y: 12 },
    outline: true,
  },
  {
    key: 'home',
    label: 'Home',
    path: 'M12 3L2 12h3v8h5v-6h4v6h5v-8h3L12 3z',
    anchor: { x: 12, y: 12 },
    outline: true,
  },
  {
    key: 'star',
    label: 'Star',
    path: 'M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z',
    anchor: { x: 12, y: 12 },
    outline: true,
  },
  {
    key: 'circle',
    label: 'Circle',
    path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z',
    anchor: { x: 12, y: 12 },
    outline: true,
  },
  {
    key: 'square',
    label: 'Square',
    path: 'M3 3h18v18H3z',
    anchor: { x: 12, y: 12 },
    outline: true,
  },
];

export function getMarkerIcon(key: MarkerIconKey): MarkerIconDef {
  return MARKER_ICONS.find((m) => m.key === key) ?? MARKER_ICONS[0];
}

/** Build a standalone SVG string for a marker icon (used by DOM markers). */
export function markerSvg(key: MarkerIconKey, color: string, sizePx: number): string {
  const def = getMarkerIcon(key);
  const stroke = def.outline
    ? '<path d="' + def.path + '" fill="none" stroke="white" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>'
    : '';
  return (
    `<svg width="${sizePx}" height="${sizePx}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" ` +
    `style="display:block;overflow:visible;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))">` +
    stroke +
    `<path d="${def.path}" fill="${color}"/>` +
    `</svg>`
  );
}
