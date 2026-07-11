// Chaikin corner-cutting for highlight geometry. OSM boundaries are often
// angular at poster zoom (a lake traced with a dozen nodes reads as a blob of
// straight edges); one or two rounds of corner cutting turns them into the
// soft outline a poster wants, at the cost of hugging the true boundary a
// little tighter on each pass.

type Pt = [number, number];

/** Rings above this size are already detailed enough that smoothing only
 * multiplies point count (each pass doubles it) for no visible gain. */
const MAX_SMOOTH_POINTS = 1200;

function chaikinRing(points: Pt[], closed: boolean): Pt[] {
  const out: Pt[] = [];
  const n = points.length;
  const last = closed ? n : n - 1;
  if (!closed) out.push(points[0]);
  for (let i = 0; i < last; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[(i + 1) % n];
    out.push([x0 * 0.75 + x1 * 0.25, y0 * 0.75 + y1 * 0.25]);
    out.push([x0 * 0.25 + x1 * 0.75, y0 * 0.25 + y1 * 0.75]);
  }
  if (!closed) out.push(points[n - 1]);
  return out;
}

function smoothRing(ring: Pt[]): Pt[] {
  // GeoJSON polygon rings repeat the first point at the end — strip it,
  // smooth as a closed loop, close it again.
  const open = ring.slice(0, -1);
  if (open.length < 4 || open.length > MAX_SMOOTH_POINTS) return ring;
  const iterations = open.length < 300 ? 2 : 1;
  let pts = open;
  for (let i = 0; i < iterations; i++) pts = chaikinRing(pts, true);
  return [...pts, pts[0]];
}

function smoothLine(line: Pt[]): Pt[] {
  if (line.length < 3 || line.length > MAX_SMOOTH_POINTS) return line;
  const iterations = line.length < 300 ? 2 : 1;
  let pts = line;
  for (let i = 0; i < iterations; i++) pts = chaikinRing(pts, false);
  return pts;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function smoothGeometry(geom: any): any {
  if (!geom) return geom;
  switch (geom.type) {
    case 'Polygon':
      return { ...geom, coordinates: geom.coordinates.map((r: Pt[]) => smoothRing(r)) };
    case 'MultiPolygon':
      return { ...geom, coordinates: geom.coordinates.map((poly: Pt[][]) => poly.map((r) => smoothRing(r))) };
    case 'LineString':
      return { ...geom, coordinates: smoothLine(geom.coordinates) };
    case 'MultiLineString':
      return { ...geom, coordinates: geom.coordinates.map((l: Pt[]) => smoothLine(l)) };
    default:
      return geom;
  }
}
