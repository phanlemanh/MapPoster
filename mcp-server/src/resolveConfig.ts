import { resolveLocation, resolveBoundary } from './geocode';
import { LAYOUTS } from '../../src/data/layouts';
import type { GeoJSONFeatureCollection, MarkerIconKey } from '../../src/types';
import type { Chrome, RenderCamera, RenderConfig, RenderHighlightRegion, RenderMarker } from '../../src/render/renderConfig';

export type FormatInput = string | { width: number; height: number };

export interface RenderMapParams {
  location: string | { lng: number; lat: number; zoom?: number };
  highlight?: {
    regions?: (string | { geojson: GeoJSONFeatureCollection })[];
    points?: (string | { lng: number; lat: number })[];
    color?: string;
    fill?: boolean;
    dim?: boolean;
    pointIcon?: MarkerIconKey;
  };
  format?: FormatInput;
  theme?: string;
  chrome?: Chrome;
  camera?: Partial<RenderCamera>;
}

/** Named format presets (video-first). Layout ids also resolve via getLayout. */
export const FORMATS: Record<string, { width: number; height: number }> = {
  tiktok: { width: 1080, height: 1920 },
  story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  landscape: { width: 1920, height: 1080 },
  portrait: { width: 1080, height: 1350 },
  '4k': { width: 3840, height: 2160 },
};

export function formatSize(format?: FormatInput): { width: number; height: number } {
  if (!format) return FORMATS.tiktok;
  if (typeof format === 'object') return { width: format.width, height: format.height };
  if (FORMATS[format]) return FORMATS[format];
  const layout = LAYOUTS.find((l) => l.id === format);
  if (layout) return { width: layout.width, height: layout.height };
  throw new Error(`Unknown format: ${format}`);
}

/** List every format name an agent may pass. */
export function listFormats(): { name: string; width: number; height: number }[] {
  const out = Object.entries(FORMATS).map(([name, s]) => ({ name, ...s }));
  for (const l of LAYOUTS) out.push({ name: l.id, width: l.width, height: l.height });
  return out;
}

function bboxOfRegions(regions: RenderHighlightRegion[]): [number, number, number, number] | null {
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
  const visit = (geom: { type: string; coordinates: unknown }) => {
    const flat = (arr: unknown): void => {
      if (Array.isArray(arr) && typeof arr[0] === 'number') {
        const [lng, lat] = arr as number[];
        if (lng < w) w = lng; if (lng > e) e = lng; if (lat < s) s = lat; if (lat > n) n = lat;
      } else if (Array.isArray(arr)) arr.forEach(flat);
    };
    flat(geom.coordinates);
  };
  for (const r of regions) for (const f of r.geojson?.features ?? []) if (f.geometry) visit(f.geometry);
  return isFinite(w) ? [w, s, e, n] : null;
}

function zoomFromSpan(span: number): number {
  if (!isFinite(span) || span <= 0) return 12;
  return Math.min(15, Math.max(3, Math.round((Math.log2(360 / span) + 0.2) * 10) / 10));
}

const STREET_ZOOM = 16; // within the 14–17 street band

/** Turn tool params into a fully-resolved RenderConfig (geocode + auto-frame). */
export async function resolveConfig(params: RenderMapParams): Promise<RenderConfig> {
  const base = await resolveLocation(params.location);
  const size = formatSize(params.format);
  const theme = params.theme ?? 'midnight-blue';
  const chrome: Chrome = params.chrome ?? 'clean';

  const regions: RenderHighlightRegion[] = [];
  for (const r of params.highlight?.regions ?? []) {
    if (typeof r === 'string') {
      const gj = await resolveBoundary(r);
      if (gj) regions.push({ geojson: gj, color: null });
    } else {
      regions.push({ geojson: r.geojson, color: null });
    }
  }

  const markers: RenderMarker[] = [];
  for (const p of params.highlight?.points ?? []) {
    const center = typeof p === 'string' ? (await resolveLocation(p)).center : ([p.lng, p.lat] as [number, number]);
    markers.push({
      lng: center[0],
      lat: center[1],
      icon: params.highlight?.pointIcon ?? 'pin',
      color: params.highlight?.color ?? '#ffffff',
      size: 44,
    });
  }

  const cam = params.camera ?? {};
  let center = cam.center ?? base.center;
  let zoom = cam.zoom ?? base.zoom;
  if (cam.zoom == null) {
    if (regions.length) {
      const bbox = bboxOfRegions(regions);
      if (bbox) {
        if (!cam.center) center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2];
        zoom = zoomFromSpan(Math.max(Math.abs(bbox[3] - bbox[1]), Math.abs(bbox[2] - bbox[0])));
      }
    } else if (markers.length) {
      zoom = STREET_ZOOM;
      if (!cam.center) center = [markers[0].lng, markers[0].lat];
    }
  }

  const highlight = regions.length
    ? { regions, color: params.highlight?.color ?? null, fill: params.highlight?.fill ?? true, dim: params.highlight?.dim ?? false }
    : undefined;

  return {
    camera: { center, zoom, bearing: cam.bearing, pitch: cam.pitch },
    size,
    theme,
    chrome,
    place: base.place,
    highlight,
    markers: markers.length ? markers : undefined,
  };
}
