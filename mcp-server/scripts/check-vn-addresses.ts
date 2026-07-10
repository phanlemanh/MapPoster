// Manual probe (real network, self-throttled to Nominatim's 1 req/s).
// Run: npx tsx mcp-server/scripts/check-vn-addresses.ts
//
// Probes BOTH paths. Unit tests mock `fetch` and hand back a polygon regardless
// of the query, so only a live run can tell whether a VN region name actually
// resolves to the right boundary.
import { resolveLocation, resolveBoundary } from '../src/geocode';

const QUERIES = [
  'Võ Văn Tần, Quận 3, TP.HCM',
  'Vo Van Tan, Quan 3, TP HCM', // no diacritics
  'Đường Lê Lợi, Quận 1, TPHCM',
  '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
  'Phường Bến Nghé, Quận 1, TP.HCM',
  'Quận 3, TP.HCM',
  'Q.7, TP.HCM',
  'Số 1 Đại Cồ Việt, Hai Bà Trưng, Hà Nội',
  'Hồ Hoàn Kiếm, Hà Nội',
  'Thành phố Đà Nẵng',
];

/** Regions an agent would ask to highlight, written the way Vietnamese users write them. */
const REGIONS = [
  'Thành phố Hồ Chí Minh',
  'Quận 3, TP.HCM',
  'Quận 3, HCMC',
  'Q.7, TP.HCM',
  'Phường Bến Nghé, Quận 1, TP.HCM',
  'Hà Nội',
  'Thành phố Đà Nẵng',
];

/** Rough centroid + extent, enough to eyeball whether the polygon is the right place. */
function describe(gj: { features: { geometry: unknown }[] }) {
  const coords: number[][] = [];
  const walk = (c: unknown): void => {
    if (Array.isArray(c) && typeof c[0] === 'number') coords.push(c as number[]);
    else if (Array.isArray(c)) c.forEach(walk);
  };
  gj.features.forEach((f) => walk((f.geometry as { coordinates: unknown }).coordinates));
  const lngs = coords.map((c) => c[0]);
  const lats = coords.map((c) => c[1]);
  const mid = (xs: number[]) => (Math.min(...xs) + Math.max(...xs)) / 2;
  const span = (xs: number[]) => Math.max(...xs) - Math.min(...xs);
  return `centroid ${mid(lats).toFixed(4)}, ${mid(lngs).toFixed(4)}  span ${span(lats).toFixed(3)}°×${span(lngs).toFixed(3)}°  (${coords.length} pts)`;
}

console.log('═══ POINTS (resolveLocation) ═══');
for (const q of QUERIES) {
  try {
    const r = await resolveLocation(q);
    const [lng, lat] = r.center;
    console.log(
      [
        `QUERY   : ${q}`,
        `  name  : ${r.place.name}`,
        `  country: ${r.place.country || '(none)'}`,
        `  coords : ${lat.toFixed(5)}, ${lng.toFixed(5)}   zoom=${r.zoom}`,
      ].join('\n'),
    );
  } catch (e) {
    console.log(`QUERY   : ${q}\n  ERROR : ${(e as Error).message}`);
  }
}

console.log('\n═══ REGIONS (resolveBoundary) ═══');
for (const q of REGIONS) {
  try {
    const gj = await resolveBoundary(q);
    console.log(`REGION  : ${q}\n  ${gj ? describe(gj) : 'NO BOUNDARY'}`);
  } catch (e) {
    console.log(`REGION  : ${q}\n  ERROR : ${(e as Error).message}`);
  }
}
