/**
 * routes + measurements — chứng minh chạy cục bộ.
 *
 * Chạy trong TIẾN TRÌNH MỚI: server MCP trong .mcp.json sống lâu, tsx nạp
 * TypeScript một lần lúc khởi động, nên một phiên dài sẽ render bằng code
 * TRƯỚC nhánh mà output nhìn vẫn hoàn toàn hợp lệ.
 *
 * Chạy:  MAPPOSTER_APP_PORT=0 MAPPOSTER_POOL=1 npx tsx _acceptance/routes-measurements/scripts/demo-routes.ts
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { makeRenderDeps } from '../../../mcp-server/src/deps';
import { resolveConfig, summarizeRoutes, summarizeMeasures, type RenderMapParams } from '../../../mcp-server/src/resolveConfig';

const OUT = path.join(process.cwd(), '_acceptance/routes-measurements/demo');
const SIZE = { width: 640, height: 800 };
const deps = makeRenderDeps();
const shots: { file: string; title: string; note: string }[] = [];

// Bốn điểm quanh Hà Nội — toạ độ tường minh nên KHÔNG cần geocode.
const HK: [number, number] = [105.8524, 21.0285]; // Hồ Hoàn Kiếm
const NBA: [number, number] = [105.8047, 21.0227]; // ga Hà Nội
const WEST: [number, number] = [105.8180, 21.0570]; // Hồ Tây
const LONGBIEN: [number, number] = [105.8600, 21.0430]; // cầu Long Biên

async function shot(file: string, title: string, note: string, params: RenderMapParams): Promise<void> {
  const cfg = await resolveConfig({ format: SIZE, theme: 'midnight-blue', ...params });
  const png = await deps.render(cfg);
  await fs.writeFile(path.join(OUT, file), png);
  shots.push({ file, title, note });
  console.log(`  ✓ ${file.padEnd(24)} ${title}`);
}

async function main(): Promise<void> {
  await fs.mkdir(OUT, { recursive: true });
  let pass = 0;
  let fail = 0;
  const check = (ok: boolean, label: string, detail: string): void => {
    console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(46)} ${detail}`);
    ok ? pass++ : fail++;
  };

  console.log('\nPHẦN A — tuyến tới được pixel\n');

  await shot('A0-no-routes.png', 'Gốc', 'chưa có tuyến nào', { location: { lng: HK[0], lat: HK[1], zoom: 13 } });

  await shot('A1-one-route.png', 'một tuyến', 'dạng coords, màu + độ dày do caller đặt', {
    location: { lng: HK[0], lat: HK[1], zoom: 13 },
    routes: [{ coords: [NBA, HK, LONGBIEN], color: '#ff4d6d', width: 10 }],
  });

  await shot('A2-multi-route.png', 'ba tuyến, ba màu', 'mỗi tuyến style riêng — mapStyle gộp thành một source', {
    location: { lng: HK[0], lat: HK[1], zoom: 12.6 },
    routes: [
      { coords: [NBA, HK], color: '#ff4d6d', width: 9 },
      { coords: [HK, WEST], color: '#4fc3ff', width: 9 },
      { coords: [HK, LONGBIEN], color: '#7bd88f', width: 9 },
    ],
  });

  await shot('A3-default-style.png', 'không khai style', 'màu rơi về accent của theme, độ dày về 4', {
    location: { lng: HK[0], lat: HK[1], zoom: 13 },
    routes: [{ coords: [NBA, HK, LONGBIEN] }],
  });

  await shot('A4-route-only-frame.png', 'chỉ có tuyến', 'auto-frame ôm tuyến — trước đây khung vào tâm thành phố', {
    location: { lng: 105.0, lat: 20.0 }, // CỐ Ý xa tuyến
    routes: [{ coords: [WEST, LONGBIEN] }],
  });

  console.log('\nPHẦN B — số đo\n');

  const cfg = await resolveConfig({
    location: { lng: HK[0], lat: HK[1] },
    format: SIZE,
    highlight: { points: [{ lng: HK[0], lat: HK[1] }, { lng: WEST[0], lat: WEST[1] }] },
    routes: [{ coords: [NBA, HK, LONGBIEN] }],
    measure: { pairs: [[0, 1]] },
  });
  const r = summarizeRoutes(cfg);
  const m = summarizeMeasures(cfg);

  check(r[0].pointCount === 3, 'tuyến: đếm đúng số điểm', `pointCount=${r[0].pointCount}`);
  check(r[0].lengthKm > 4 && r[0].lengthKm < 12, 'tuyến: chiều dài polyline hợp lý', `lengthKm=${r[0].lengthKm.toFixed(2)}`);
  check(r[0].bbox !== null, 'tuyến: có bbox', `bbox=[${r[0].bbox?.map((n) => n.toFixed(3)).join(', ')}]`);

  const hkToWest = m.pairs[0];
  check(hkToWest.straightLineKm > 3 && hkToWest.straightLineKm < 6, 'cặp điểm: đường chim bay Hoàn Kiếm→Hồ Tây', `straightLineKm=${hkToWest.straightLineKm.toFixed(2)}`);
  // `&&`, KHÔNG phải `||`. `initialBearingDeg` chuẩn hoá bằng `(… + 360) % 360`
  // (geometry.ts:31) nên giá trị LUÔN thuộc [0,360): vế `< 360` một mình là
  // hằng đúng, và với `||` thì cả biểu thức đúng với MỌI phương vị, kể cả
  // đông-nam. Đó là một no-op đội lốt phép kiểm — 8 phép kiểm chứ không phải 9.
  check(hkToWest.bearingDeg > 270 && hkToWest.bearingDeg < 360, 'cặp điểm: phương vị tây-bắc', `bearingDeg=${hkToWest.bearingDeg.toFixed(1)}`);
  check(!('km' in hkToWest), 'không có tên số đo trần', 'chỉ straightLineKm / bearingDeg');

  // Chiều dài đi theo tuyến PHẢI dài hơn đường chim bay hai đầu tuyến —
  // đây là điểm mà một cài đặt nhầm hai phép đo sẽ lộ ra ngay.
  const routeEnds = summarizeMeasures(
    await resolveConfig({
      location: { lng: HK[0], lat: HK[1] },
      format: SIZE,
      highlight: { points: [{ lng: NBA[0], lat: NBA[1] }, { lng: LONGBIEN[0], lat: LONGBIEN[1] }] },
      measure: { pairs: [[0, 1]] },
    }),
  ).pairs[0].straightLineKm;
  check(r[0].lengthKm > routeEnds, 'polyline DÀI HƠN chim bay hai đầu', `${r[0].lengthKm.toFixed(2)} km > ${routeEnds.toFixed(2)} km`);

  // Vùng có lỗ: diện tích phải nhỏ hơn vùng đặc cùng ranh ngoài.
  const outer = [[105.80, 21.00], [105.90, 21.00], [105.90, 21.10], [105.80, 21.10], [105.80, 21.00]];
  const hole = [[105.83, 21.03], [105.87, 21.03], [105.87, 21.07], [105.83, 21.07], [105.83, 21.03]];
  const fcOf = (rings: number[][][]) => ({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: rings } }] });
  const areaOf = async (rings: number[][][]): Promise<number> =>
    summarizeMeasures(await resolveConfig({ location: { lng: 105.85, lat: 21.05 }, format: SIZE, highlight: { regions: [{ geojson: fcOf(rings) }] } })).regions[0].areaKm2;
  const solidKm2 = await areaOf([outer]);
  const holedKm2 = await areaOf([outer, hole]);
  check(holedKm2 < solidKm2, 'vùng: diện tích TRỪ LỖ', `${holedKm2.toFixed(1)} km² < ${solidKm2.toFixed(1)} km² (đặc)`);
  check(Math.abs(holedKm2 / solidKm2 - 0.84) < 0.03, 'vùng: tỉ lệ trừ đúng ~16%', `tỉ lệ=${(holedKm2 / solidKm2).toFixed(3)}`);

  const html = `<!doctype html><meta charset="utf-8"><title>routes + measurements</title><style>
body{margin:0;padding:28px;background:#0d1b2a;color:#f0d9a8;font:14px/1.55 -apple-system,system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}p.sub{margin:0 0 22px;color:#8fa8c0;font-size:13px}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
figure{margin:0}img{width:100%;border-radius:8px;display:block;border:1px solid #1c3e60}
figcaption{margin-top:8px}b{color:#e8b04b;display:block;font-size:14px}
span{color:#a8c0d8;font-size:12.5px;display:block;margin-top:2px}
</style><h1>routes + measurements — render cục bộ</h1>
<p class="sub">Hà Nội · toạ độ tường minh nên không cần geocode · ${SIZE.width}×${SIZE.height} · <code>src/lib/mapStyle.ts</code> không đổi một dòng</p>
<div class="g">${shots.map((s) => `<figure><img src="${s.file}"><figcaption><b>${s.title}</b><span>${s.note}</span></figcaption></figure>`).join('')}</div>`;
  await fs.writeFile(path.join(OUT, 'index.html'), html);

  console.log(`\n${'─'.repeat(72)}`);
  console.log(`ẢNH:  ${shots.length} render → _acceptance/routes-measurements/demo/index.html`);
  console.log(`KIỂM: ${pass} đạt · ${fail} trượt`);
  console.log('─'.repeat(72));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
