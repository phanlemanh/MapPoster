/**
 * Video chứng minh cho ba gói đã merge sau Tier 0: routes+measurements,
 * motion-tools-cost, road-routing.
 *
 * Chạy trong TIẾN TRÌNH MỚI — server MCP trong `.mcp.json` sống lâu, `tsx` nạp
 * TypeScript một lần lúc khởi động, nên một phiên dài sẽ render bằng code TRƯỚC
 * nhánh mà output nhìn vẫn hoàn toàn hợp lệ.
 *
 * Mọi thứ đi vào `demo/`, KHÔNG vào `evidence/`: mp4, ba khung mốc, và trang phát.
 * `evidence-page.js` chỉ lấy khung cho eval `ui-check` hoặc khối đã khai
 * `screenshot:` — thêm một `screenshot:` giả vào khối của eval chạy test là khai
 * rằng nó sinh ra ảnh mà nó không sinh, nên `evidence/` giữ đúng nghĩa "thứ đã
 * được verify" và demo đứng riêng ở `demo/`.
 *
 * Chạy:
 *   MAPPOSTER_APP_PORT=0 MAPPOSTER_POOL=1 npx tsx _acceptance/demo-features.ts
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { makeRenderDeps } from '../mcp-server/src/deps';
import { resolveConfig, summarizeRoutes, summarizeMeasures, type RenderMapParams } from '../mcp-server/src/resolveConfig';
import { compileMotion } from '../mcp-server/src/motionCompiler';
import { encodeArgs } from '../mcp-server/src/encodeAnimation';

const ROOT = process.cwd();
const SIZE = { width: 540, height: 720 };
const deps = makeRenderDeps();

// Hà Nội — toạ độ tường minh, KHÔNG cần geocode.
const HK: [number, number] = [105.8524, 21.0285]; // Hồ Hoàn Kiếm
const NBA: [number, number] = [105.8047, 21.0227]; // ga Hà Nội
const WEST: [number, number] = [105.8180, 21.0570]; // Hồ Tây
const LB: [number, number] = [105.8600, 21.0430]; // cầu Long Biên

const box = (w: number, s: number, e: number, n: number): unknown => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } }],
});

interface Shot {
  slug: string;
  evalId: string;
  file: string;
  title: string;
  note: string;
  meta: string;
}
const shots: Shot[] = [];
let pass = 0;
let fail = 0;
const check = (ok: boolean, label: string, detail: string): void => {
  console.log(`  ${ok ? '✓' : '✗'} ${label.padEnd(52)} ${detail}`);
  ok ? pass++ : fail++;
};

/**
 * Render một clip: mp4 + ba khung mốc (đầu / giữa / nghỉ) vào `demo/` của đúng
 * hợp đồng — ba nhịp mà người đọc cần nhìn để nói clip có nghĩa hay không.
 */
async function clip(
  slug: string,
  evalId: string,
  file: string,
  title: string,
  note: string,
  preset: 'approach' | 'pushIn' | 'drift',
  params: RenderMapParams,
): Promise<number> {
  // Khung mốc đi vào `demo/`, KHÔNG vào `evidence/`. `evidence-page.js` chỉ
  // lấy khung cho eval `ui-check` hoặc khối đã khai `screenshot:` — và thêm một
  // `screenshot:` giả vào khối của eval chạy test là khai rằng nó sinh ra ảnh
  // mà nó không sinh. `evidence/` giữ đúng nghĩa: thứ đã được verify.
  const demoDir = path.join(ROOT, '_acceptance', slug, 'demo');
  await fs.mkdir(demoDir, { recursive: true });

  const cfg = await resolveConfig({ format: SIZE, theme: 'midnight-blue', ...params });
  const script = compileMotion(preset, cfg);
  if (!deps.renderClip || !deps.encodeAnimation) throw new Error('clip deps chưa nối dây');
  const { frames, settle } = await deps.renderClip({ ...cfg, motion: script });

  const mp4 = path.join(demoDir, file);
  await deps.encodeAnimation(frames, { fps: script.fps, format: 'mp4', outPath: mp4 });
  const { size } = await fs.stat(mp4);

  const mid = Math.floor(frames.length / 2);
  const stem = file.replace(/\.mp4$/, '');
  await fs.writeFile(path.join(demoDir, `${stem}-step1.png`), frames[0]);
  await fs.writeFile(path.join(demoDir, `${stem}-step2.png`), frames[mid]);
  await fs.writeFile(path.join(demoDir, `${stem}-step3.png`), settle);

  const meta = `${frames.length} khung @${script.fps}fps · nghỉ từ ${script.restAtSec}s · ${(size / 1024 / 1024).toFixed(1)} MB`;
  shots.push({ slug, evalId, file, title, note, meta });
  console.log(`  ✓ ${slug}/${file.padEnd(24)} ${meta}`);
  return size;
}

async function main(): Promise<void> {
  console.log('\n── routes-measurements: tuyến TRONG chuyển động ──\n');

  const routeStyle = [
    { coords: [NBA, HK], color: '#ff4d6d', width: 9 },
    { coords: [HK, WEST], color: '#4fc3ff', width: 9 },
    { coords: [HK, LB], color: '#7bd88f', width: 9 },
  ];
  await clip(
    'routes-measurements',
    'E16',
    'routes-in-motion.mp4',
    'Ba tuyến trên clip có chuyển động',
    'PR #2 đã chứng minh tuyến tới pixel ở ảnh tĩnh; đây là tuyến giữ đúng vị trí địa lý xuyên suốt camera bay',
    'approach',
    {
      location: { lng: HK[0], lat: HK[1], zoom: 12.6 },
      highlight: { regions: [{ geojson: box(105.83, 21.01, 105.88, 21.06), color: '#e8b04b' }], fill: true, dim: true },
      routes: routeStyle,
    },
  );

  const measured = await resolveConfig({
    location: { lng: HK[0], lat: HK[1] },
    format: SIZE,
    highlight: { points: [{ lng: HK[0], lat: HK[1] }, { lng: WEST[0], lat: WEST[1] }] },
    routes: [{ coords: [NBA, HK, LB] }],
    measure: { pairs: [[0, 1]] },
  });
  const mr = summarizeMeasures(measured);
  const rr = summarizeRoutes(measured)[0];
  check(rr.lengthKm > mr.pairs[0].straightLineKm * 0.5, 'polyline và chim bay là hai số khác nhau', `lengthKm=${rr.lengthKm.toFixed(2)} · straightLineKm=${mr.pairs[0].straightLineKm.toFixed(2)}`);
  check(rr.distanceKm === undefined, 'tuyến vẽ tay KHÔNG có distanceKm của router', 'undefined, không phải 0');

  console.log('\n── motion-tools-cost: camera.focus chọn đúng đối tượng ──\n');

  const twoRegions = {
    location: { lng: 105.8, lat: 21.0 },
    highlight: {
      regions: [
        { geojson: box(105.80, 21.00, 105.83, 21.03), color: '#ff4d6d' },
        { geojson: box(105.86, 21.05, 105.90, 21.09), color: '#4fc3ff' },
      ],
      fill: true,
    },
  } as RenderMapParams;

  await clip('motion-tools-cost', 'E6', 'focus-region-0.mp4', 'camera.focus → vùng 0', 'cùng một lời gọi, chỉ khác index — khung ôm vùng ĐỎ', 'approach', {
    ...twoRegions,
    camera: { focus: { kind: 'region', index: 0 } },
  } as RenderMapParams);

  await clip('motion-tools-cost', 'E7', 'focus-region-1.mp4', 'camera.focus → vùng 1', 'khung ôm vùng XANH — bằng chứng index thật sự chọn đối tượng', 'approach', {
    ...twoRegions,
    camera: { focus: { kind: 'region', index: 1 } },
  } as RenderMapParams);

  const cfgTight = await resolveConfig({ ...twoRegions, format: SIZE, camera: { focus: { kind: 'region', index: 0, paddingPct: 0 } } } as RenderMapParams);
  const cfgLoose = await resolveConfig({ ...twoRegions, format: SIZE, camera: { focus: { kind: 'region', index: 0, paddingPct: 150 } } } as RenderMapParams);
  check(cfgLoose.camera.zoom < cfgTight.camera.zoom, 'paddingPct lớn hơn → zoom nhỏ hơn', `${cfgTight.camera.zoom.toFixed(2)} → ${cfgLoose.camera.zoom.toFixed(2)}`);

  // quality: so tham số ffmpeg thật, không phải lời hứa
  const argOf = (q?: 'draft' | 'standard' | 'high') => {
    const a = encodeArgs('f%04d.png', { fps: 18, format: 'mp4', outPath: '/tmp/x.mp4', quality: q });
    return { crf: a[a.indexOf('-crf') + 1], preset: a[a.indexOf('-preset') + 1] };
  };
  const d = argOf('draft');
  const s = argOf('standard');
  const h = argOf('high');
  const none = argOf(undefined);
  check(d.crf === '28' && s.crf === '20' && h.crf === '16', 'quality → crf khác nhau thật', `draft=${d.crf}/${d.preset} · standard=${s.crf} · high=${h.crf}/${h.preset}`);
  check(none.crf === s.crf && none.preset === s.preset, 'bỏ trống quality KHÔNG đổi tham số nào', `crf=${none.crf} preset=${none.preset} — đúng giá trị trước khi có núm`);

  console.log('\n── road-routing: tuyến bám đường thật ──\n');

  // MỘT lời gọi thật tới router công cộng. Bộ eval thì tuyệt đối không chạm
  // (mọi test stub fetch); ở đây gọi một lần là có chủ ý — nó chứng minh thứ
  // test mock không chứng minh được: tích hợp chạy đầu-cuối với router thật.
  let routed = false;
  try {
    const cfgRoad = await resolveConfig({
      location: { lng: HK[0], lat: HK[1] },
      format: SIZE,
      routes: [{ route: { from: NBA, to: LB, mode: 'car' }, color: '#ff4d6d', width: 9 }],
    } as RenderMapParams);
    const [road] = summarizeRoutes(cfgRoad);
    check(road.distanceKm != null && road.durationMin != null, 'router trả km và phút thật', `${road.distanceKm?.toFixed(2)} km · ${road.durationMin?.toFixed(0)} phút · ${road.provider}`);
    check((road.pointCount ?? 0) > 10, 'tuyến bám đường có nhiều đỉnh, không phải đoạn thẳng', `${road.pointCount} điểm (đường chim bay chỉ có 2)`);
    routed = true;

    await clip('road-routing', 'E1', 'routed-line.mp4', 'Tuyến bám đường thật (OSRM)', 'ga Hà Nội → cầu Long Biên, đi theo phố chứ không cắt thẳng', 'approach', {
      location: { lng: HK[0], lat: HK[1], zoom: 13 },
      highlight: { regions: [{ geojson: box(105.80, 21.01, 105.87, 21.05), color: '#e8b04b' }], fill: true, dim: true },
      routes: [{ route: { from: NBA, to: LB, mode: 'car' }, color: '#ff4d6d', width: 9 }],
    } as RenderMapParams);
  } catch (e) {
    // Instance công cộng không có SLA — hỏng ở đây là tin tức, không phải lỗi
    // của gói này. Ghi ra thay vì giả vờ không có phần demo nào.
    console.log(`  ! router công cộng không trả lời: ${(e as Error).message.slice(0, 110)}`);
    console.log('    (đúng lý do README bảo tự host cho production — phần demo tuyến-thật bỏ qua)');
  }

  // --- trang phát cho từng hợp đồng ----------------------------------------
  const bySlug = new Map<string, Shot[]>();
  for (const sh of shots) bySlug.set(sh.slug, [...(bySlug.get(sh.slug) ?? []), sh]);

  for (const [slug, list] of bySlug) {
    const html = `<!doctype html><meta charset="utf-8"><title>${slug} — video</title><style>
body{margin:0;padding:28px;background:#0d1b2a;color:#f0d9a8;font:14px/1.55 -apple-system,system-ui,sans-serif}
h1{font-size:19px;margin:0 0 4px}p.sub{margin:0 0 22px;color:#8fa8c0;font-size:13px}
.g{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px;max-width:900px}
figure{margin:0}video{width:100%;border-radius:8px;display:block;border:1px solid #1c3e60;background:#0a1520}
figcaption{margin-top:8px}b{color:#e8b04b;display:block}
span{color:#a8c0d8;font-size:12.5px;display:block;margin-top:2px}
em{color:#6b8299;font-size:11.5px;font-style:normal;display:block;margin-top:5px;font-variant-numeric:tabular-nums}
</style><h1>${slug} — video chứng minh</h1>
<p class="sub">Render cục bộ, tiến trình sạch · ${SIZE.width}×${SIZE.height} · text-free theo AC-9, chỉ có dòng attribution giấy phép.
Ba khung mốc (đầu / giữa / nghỉ) nằm cạnh mỗi clip. Chúng KHÔNG nằm trong <code>evidence/</code>: trang bằng chứng
chỉ lấy khung cho eval <code>ui-check</code>, và khai một <code>screenshot:</code> giả trên eval chạy test là nói rằng
nó sinh ra ảnh mà nó không sinh.</p>
<div class="g">${list
      .map((c) => `<figure><video src="${c.file}" autoplay loop muted playsinline></video><figcaption><b>${c.title}</b><span>${c.note}</span><em>${c.meta} · khung mốc: ${c.file.replace(/\.mp4$/, '')}-step1..3.png</em></figcaption></figure>`)
      .join('')}</div>`;
    await fs.writeFile(path.join(ROOT, '_acceptance', slug, 'demo', 'index.html'), html);
  }

  console.log(`\n${'─'.repeat(74)}`);
  console.log(`CLIP: ${shots.length} video · ${bySlug.size} hợp đồng${routed ? '' : ' (thiếu phần tuyến-thật)'}`);
  console.log(`KIỂM: ${pass} đạt · ${fail} trượt`);
  console.log('─'.repeat(74));
  process.exit(fail ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
