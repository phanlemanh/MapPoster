// Manual probe (real network, self-throttled to Nominatim's 1 req/s).
// Run: npx tsx mcp-server/scripts/check-vn-addresses.ts
import { resolveLocation } from '../src/geocode';

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
