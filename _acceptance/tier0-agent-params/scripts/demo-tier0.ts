/**
 * Tier 0 — chứng minh chạy cục bộ.
 *
 * Bài toán của gói này: 12 năng lực engine ĐÃ tiêu thụ được nhưng không tham số
 * tool nào chạm tới, cộng 3 defect. Script này chạy trong TIẾN TRÌNH MỚI (nạp
 * source hiện thời — server MCP trong .mcp.json là tiến trình sống lâu và sẽ
 * render bằng code cũ mà không có dấu hiệu gì) và chứng minh từng mục:
 *
 *   PHẦN A — pixel: mỗi tham số mới làm ĐỔI ảnh render thật
 *   PHẦN B — từ chối: mọi guard bắn đúng, kèm thông điệp
 *   PHẦN C — hợp đồng: motion.script echo, resolved identity, list_* shape
 *
 * Toạ độ dùng {lng,lat} tường minh để KHÔNG cần geocode — chỉ tile là cần mạng.
 *
 * Chạy:  npx tsx _acceptance/tier0-agent-params/scripts/demo-tier0.ts
 */
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { makeRenderDeps } from '../../../mcp-server/src/deps';
import { resolveConfig, listFormats } from '../../../mcp-server/src/resolveConfig';
import { compileMotion } from '../../../mcp-server/src/motionCompiler';
import { makeTools } from '../../../mcp-server/src/tools';
import type { RenderMapParams } from '../../../mcp-server/src/resolveConfig';

const OUT = path.join(process.cwd(), '_acceptance/tier0-agent-params/demo');
const SIZE = { width: 540, height: 720 };
// Hồ Hoàn Kiếm — toạ độ tường minh, không cần geocode.
const HERE = { lng: 105.8524, lat: 21.0285, zoom: 15 } as const;

const deps = makeRenderDeps();
const shots: { file: string; title: string; note: string }[] = [];

async function shot(file: string, title: string, note: string, params: RenderMapParams): Promise<void> {
  const cfg = await resolveConfig({ format: SIZE, theme: 'midnight-blue', ...params });
  const png = await deps.render(cfg);
  await fs.writeFile(path.join(OUT, file), png);
  shots.push({ file, title, note });
  console.log(`  ✓ ${file.padEnd(26)} ${title}`);
}

/** Một guard ĐẠT khi nó NÉM — và ném đúng thông điệp. Im lặng chấp nhận là trượt. */
async function refuses(label: string, params: RenderMapParams, expect: RegExp): Promise<boolean> {
  try {
    await resolveConfig({ format: SIZE, ...params });
    console.log(`  ✗ ${label.padEnd(46)} KHÔNG ném — guard hỏng`);
    return false;
  } catch (e) {
    const msg = (e as Error).message;
    const ok = expect.test(msg);
    console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(46)} ${msg.slice(0, 62)}`);
    return ok;
  }
}

async function main(): Promise<void> {
  await fs.mkdir(OUT, { recursive: true });
  let pass = 0;
  let fail = 0;
  const tally = (ok: boolean): void => void (ok ? pass++ : fail++);

  // ─── PHẦN A — pixel ─────────────────────────────────────────────────────
  console.log('\nPHẦN A — mỗi tham số mới làm đổi pixel thật\n');

  await shot('A0-baseline.png', 'Gốc', 'chưa dùng tham số mới nào', { location: HERE });

  await shot('A1-layers.png', 'layers', 'tắt buildings + parks + water', {
    location: HERE,
    layers: { buildings: false, parks: false, water: false },
  });

  await shot('A2-detail-low.png', 'detail 0.05', 'dưới ngưỡng 0.12 → tắt đường nhỏ', {
    location: HERE,
    detail: 0.05,
  });
  await shot('A3-detail-high.png', 'detail 1.0', 'đường dày tối đa', { location: HERE, detail: 1 });

  await shot('A4-region-colors.png', 'màu riêng từng vùng', 'hai vùng, hai màu — trước đây luôn null', {
    location: HERE,
    highlight: {
      regions: [
        { geojson: box(105.838, 21.020, 105.850, 21.032), color: '#e8b04b' },
        { geojson: box(105.854, 21.024, 105.866, 21.036), color: '#4fc3ff' },
      ],
      fill: true,
    },
  });

  await shot('A5-points.png', 'icon/màu/cỡ từng điểm', 'bốn điểm, bốn icon/màu/cỡ — trước đây chung 1 icon, 1 màu, cỡ 44', {
    location: HERE,
    // zoom tường minh: auto-frame bám markers[0] ở zoom 16 sẽ đẩy ba điểm kia ra ngoài khung
    camera: { center: [105.8524, 21.0295], zoom: 13.4 },
    highlight: {
      points: [
        { lng: 105.8524, lat: 21.0285, icon: 'star', color: '#e8b04b', size: 120 },
        { lng: 105.8440, lat: 21.0250, icon: 'heart', color: '#ff4d6d', size: 60 },
        { lng: 105.8610, lat: 21.0320, icon: 'home', color: '#4fc3ff', size: 60 },
        { lng: 105.8470, lat: 21.0350, icon: 'square', color: '#7bd88f', size: 36 },
      ],
    },
  });

  await shot('A6-font.png', 'font + chrome poster', 'Bebas Neue thay vì mặc định', {
    location: HERE,
    chrome: 'poster',
    placeName: 'HOÀN KIẾM',
    font: 'Bebas Neue',
  });

  await shot('A7-bearing.png', 'bearing -45 → 315', 'BUG ĐÃ VÁ: âm được normalize, không bị từ chối', {
    location: HERE,
    camera: { center: [HERE.lng, HERE.lat], zoom: HERE.zoom, bearing: -45 },
  });

  await shot('A8-pitch.png', 'pitch 55', 'nghiêng — trước đây không có bound nào', {
    location: HERE,
    camera: { center: [HERE.lng, HERE.lat], zoom: HERE.zoom, pitch: 55 },
  });

  // ─── PHẦN B — từ chối ───────────────────────────────────────────────────
  console.log('\nPHẦN B — guard phải NÉM, không được im lặng thay giá trị\n');

  tally(await refuses('icon lạ (trước: âm thầm thành "pin")', { location: HERE, highlight: { points: [{ lng: 105.85, lat: 21.02, icon: 'rocket' as never }] } }, /Invalid highlight\.points\[\]\.icon/));
  tally(await refuses('size 500 (drawMarker không clamp gì)', { location: HERE, highlight: { points: [{ lng: 105.85, lat: 21.02, size: 500 }] } }, /size/i));
  tally(await refuses('size 0 (phải khác "chưa đặt")', { location: HERE, highlight: { points: [{ lng: 105.85, lat: 21.02, size: 0 }] } }, /size/i));
  tally(await refuses('pitch 200 (BUG: trước đây nhận rồi clamp)', { location: HERE, camera: { pitch: 200 } }, /Invalid pitch/));
  tally(await refuses('labels + layers.roadLabels cùng lúc', { location: HERE, labels: true, layers: { roadLabels: false } }, /not both/));
  tally(await refuses('detail 1.5 ngoài miền', { location: HERE, detail: 1.5 }, /Invalid detail/));
  tally(await refuses('font lạ', { location: HERE, font: 'Comic Sans' as never }, /Unknown font/));
  tally(await refuses('khoá layer lạ', { location: HERE, layers: { hologram: true } as never }, /layer/i));
  tally(await refuses('màu không phải hex', { location: HERE, highlight: { regions: [{ geojson: box(105.84, 21.02, 105.86, 21.04), color: 'red' }] } }, /color/i));

  // biên HỢP LỆ phải được NHẬN — nửa còn lại của quy tắc biên
  for (const [label, p] of [
    ['size 18 (biên dưới)', { location: HERE, highlight: { points: [{ lng: 105.85, lat: 21.02, size: 18 }] } }],
    ['size 140 (biên trên)', { location: HERE, highlight: { points: [{ lng: 105.85, lat: 21.02, size: 140 }] } }],
    ['detail 0', { location: HERE, detail: 0 }],
    ['detail 1', { location: HERE, detail: 1 }],
    ['pitch 60 (biên trên)', { location: HERE, camera: { pitch: 60 } }],
  ] as [string, RenderMapParams][]) {
    try {
      await resolveConfig({ format: SIZE, ...p });
      console.log(`  ✓ ${label.padEnd(46)} được nhận (đúng)`);
      pass++;
    } catch (e) {
      console.log(`  ✗ ${label.padEnd(46)} bị từ chối oan: ${(e as Error).message.slice(0, 40)}`);
      fail++;
    }
  }

  // ─── PHẦN C — hợp đồng ──────────────────────────────────────────────────
  console.log('\nPHẦN C — hợp đồng trả về\n');

  const cfgB = await resolveConfig({ location: HERE, format: SIZE, camera: { center: [HERE.lng, HERE.lat], zoom: 15, bearing: 45 }, highlight: { points: [{ lng: HERE.lng, lat: HERE.lat }] } });
  const seeded = compileMotion('pushIn', cfgB);
  const allSeeded = seeded.camera.every((k) => k.bearing === 45);
  console.log(`  ${allSeeded ? '✓' : '✗'} bearing seed vào MỌI keyframe          ${seeded.camera.map((k) => k.bearing).join(', ')}  (BUG: trước đây clip render ở bearing 0)`);
  tally(allSeeded);

  const cfgNo = await resolveConfig({ location: HERE, format: SIZE, highlight: { points: [{ lng: HERE.lng, lat: HERE.lat }] } });
  const plain = compileMotion('pushIn', cfgNo);
  const deterministic = plain.camera.every((k) => k.bearing === undefined);
  console.log(`  ${deterministic ? '✓' : '✗'} config không bearing → script không đổi   (giữ bất biến determinism)`);
  tally(deterministic);

  const tools = makeTools({ render: deps.render, sinkDir: OUT, defaultDelivery: 'url' });
  const themes = JSON.parse((await tools.list_themes()).content.at(-1).text).themes;
  const paletteOk = themes.length === 13 && Object.keys(themes[0].colors).length === 15 && typeof themes[0].dark === 'boolean';
  console.log(`  ${paletteOk ? '✓' : '✗'} list_themes: ${themes.length} theme × ${Object.keys(themes[0].colors).length} khoá màu + cờ dark  (trước: chỉ {id,name})`);
  tally(paletteOk);

  const fmts = listFormats();
  const dupes = fmts.filter((f) => f.name === '4k').length;
  const tiktok = fmts.find((f) => f.name === 'tiktok');
  const a4 = fmts.find((f) => f.name === 'a4');
  const fmtOk = dupes === 1 && tiktok?.aspect === '9:16' && a4?.print != null && tiktok?.print === undefined;
  console.log(`  ${fmtOk ? '✓' : '✗'} list_formats: '4k' ×${dupes}, tiktok=${tiktok?.aspect}/${tiktok?.category}, a4 có print, tiktok không`);
  tally(fmtOk);

  const echoed = ['tools.ts', 'http.ts', 'jobRunner.ts'].map((f) => {
    const src = readFileSync(path.join(process.cwd(), 'mcp-server/src', f), 'utf8');
    const bindings = src.split('\n').filter((l) => l.includes('const motionOut ='));
    return bindings.length > 0 && bindings.every((l) => /script:\s*motion/.test(l));
  });
  console.log(`  ${echoed.every(Boolean) ? '✓' : '✗'} motion.script echo trên cả 3 bề mặt      MCP=${echoed[0]} REST=${echoed[1]} jobs=${echoed[2]}`);
  tally(echoed.every(Boolean));

  // ─── contact sheet ──────────────────────────────────────────────────────
  const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:28px;background:#0d1b2a;color:#f0d9a8;font:14px/1.5 -apple-system,system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}p.sub{margin:0 0 24px;color:#8fa8c0;font-size:13px}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
figure{margin:0}img{width:100%;border-radius:8px;display:block;border:1px solid #1c3e60}
figcaption{margin-top:8px}b{color:#e8b04b;display:block;font-size:14px}
span{color:#8fa8c0;font-size:12.5px}
</style><h1>Tier 0 — mỗi tham số mới làm đổi pixel thật</h1>
<p class="sub">Render cục bộ, tiến trình sạch · Hồ Hoàn Kiếm 105.8524, 21.0285 · toạ độ tường minh nên không cần geocode · ${SIZE.width}×${SIZE.height}</p>
<div class="g">${shots.map((s) => `<figure><img src="${s.file}"><figcaption><b>${s.title}</b><span>${s.note}</span></figcaption></figure>`).join('')}</div>`;
  await fs.writeFile(path.join(OUT, 'index.html'), html);

  console.log(`\n${'─'.repeat(72)}`);
  console.log(`ẢNH:  ${shots.length} render → _acceptance/tier0-agent-params/demo/index.html`);
  console.log(`KIỂM: ${pass} đạt · ${fail} trượt`);
  console.log('─'.repeat(72));
  process.exit(fail ? 1 : 0);
}

/** FeatureCollection một ô chữ nhật — tránh phụ thuộc geocode. */
function box(w: number, s: number, e: number, n: number): unknown {
  return {
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } }],
  };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
