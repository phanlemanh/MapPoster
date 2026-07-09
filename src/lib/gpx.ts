import { gpx } from '@tmcw/togeojson';
import type { GeoJSONFeatureCollection } from '../types';

export interface ParsedGpx {
  geojson: GeoJSONFeatureCollection;
  name: string;
  /** [west, south, east, north] bounds of all coordinates, or null if empty */
  bounds: [number, number, number, number] | null;
}

function collectCoords(geometry: any, out: number[][]) {
  if (!geometry) return;
  const { type, coordinates } = geometry;
  if (type === 'Point') out.push(coordinates);
  else if (type === 'LineString' || type === 'MultiPoint') out.push(...coordinates);
  else if (type === 'MultiLineString' || type === 'Polygon') coordinates.forEach((l: number[][]) => out.push(...l));
  else if (type === 'MultiPolygon') coordinates.forEach((p: number[][][]) => p.forEach((l) => out.push(...l)));
  else if (type === 'GeometryCollection') geometry.geometries.forEach((g: any) => collectCoords(g, out));
}

export function parseGpx(text: string, fallbackName: string): ParsedGpx {
  const dom = new DOMParser().parseFromString(text, 'text/xml');
  const parseError = dom.querySelector('parsererror');
  if (parseError) throw new Error('Invalid GPX file');

  const geojson = gpx(dom) as GeoJSONFeatureCollection;
  const features = geojson?.features ?? [];
  if (!features.length) throw new Error('No tracks or routes found in GPX');

  // Keep only line geometries for the drawn route (drop waypoints as lines).
  const lineFeatures = features.filter(
    (f: any) => f.geometry && (f.geometry.type === 'LineString' || f.geometry.type === 'MultiLineString'),
  );
  const usable = lineFeatures.length ? lineFeatures : features;

  const coords: number[][] = [];
  usable.forEach((f: any) => collectCoords(f.geometry, coords));

  let bounds: [number, number, number, number] | null = null;
  if (coords.length) {
    let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity;
    for (const [lng, lat] of coords) {
      if (lng < w) w = lng;
      if (lng > e) e = lng;
      if (lat < s) s = lat;
      if (lat > n) n = lat;
    }
    bounds = [w, s, e, n];
  }

  const trackName =
    features.find((f: any) => f.properties?.name)?.properties?.name || fallbackName;

  return {
    geojson: { type: 'FeatureCollection', features: usable },
    name: trackName,
    bounds,
  };
}
