/**
 * Tier 0 — chứng minh phần CHUYỂN ĐỘNG bằng video thật.
 *
 * Năm clip, mỗi clip trả lời một câu:
 *   C1 approach   — bay vào rồi VẼ DẦN ranh giới vùng
 *   C2 pushIn     — đẩy vào một điểm, có nhịp pulse
 *   C3 drift      — trôi chậm, dùng làm nền
 *   C4/C5 bearing — CẶP ĐỐI CHỨNG cho bug đã vá: cùng preset, cùng mọi thứ,
 *                   chỉ khác camera.bearing 0 vs 45. TRƯỚC gói này hai clip
 *                   này ra GIỐNG HỆT nhau vì compiler nuốt mất bearing.
 *
 * Chạy trong TIẾN TRÌNH MỚI — server MCP trong .mcp.json sống lâu, tsx nạp
 * source một lần lúc khởi động nên phiên dài render bằng code trước nhánh.
 *
 * Chạy:  npx tsx _acceptance/tier0-agent-params/scripts/demo-clips.ts
 */
import { promises as fs, readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { makeRenderDeps } from '../../../mcp-server/src/deps';
import { resolveConfig } from '../../../mcp-server/src/resolveConfig';
import { compileMotion } from '../../../mcp-server/src/motionCompiler';
import type { RenderMapParams } from '../../../mcp-server/src/resolveConfig';
import type { MotionPreset } from '../../../mcp-server/src/motionCompiler';

const OUT = path.join(process.cwd(), '_acceptance/tier0-agent-params/demo');
const SIZE = { width: 540, height: 720 };
const HK = { lng: 105.8524, lat: 21.0285, zoom: 14 } as const;

const deps = makeRenderDeps();
const clips: { file: string; title: string; note: string; meta: string }[] = [];

/** Ô chữ nhật quanh Hoàn Kiếm — tránh phụ thuộc geocode. */
const box = (w: number, s: number, e: number, n: number): unknown => ({
  type: 'FeatureCollection',
  features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[w, s], [e, s], [e, n], [w, n], [w, s]]] } }],
});

async function clip(
  file: string,
  title: string,
  note: string,
  preset: MotionPreset,
  params: RenderMapParams,
): Promise<string> {
  const cfg = await resolveConfig({ format: SIZE, theme: 'midnight-blue', ...params });
  const script = compileMotion(preset, cfg);
  const cfgWithMotion = { ...cfg, motion: script };

  if (!deps.renderClip || !deps.encodeAnimation) throw new Error('clip deps chưa nối dây');
  const { frames, settle } = await deps.renderClip(cfgWithMotion);

  const mp4 = path.join(OUT, file);
  await deps.encodeAnimation(frames, { fps: script.fps, format: 'mp4', outPath: mp4 });
  await fs.writeFile(mp4.replace(/\.mp4$/, '-settle.png'), settle);

  const { size } = await fs.stat(mp4);
  // vân tay nội dung: dùng để CHỨNG MINH cặp bearing khác nhau thật, không phải nói suông
  const fp = createHash('sha256').update(Buffer.concat(frames)).digest('hex').slice(0, 12);
  const bearings = [...new Set(script.camera.map((k) => k.bearing ?? 0))].join('/');

  const meta = `${frames.length} khung @${script.fps}fps · nghỉ từ ${script.restAtSec}s · ${(size / 1024 / 1024).toFixed(1)} MB · bearing ${bearings}`;
  clips.push({ file, title, note, meta });
  console.log(`  ✓ ${file.padEnd(22)} ${meta}  vân tay=${fp}`);
  return fp;
}

async function main(): Promise<void> {
  await fs.mkdir(OUT, { recursive: true });
  console.log('\nRender clip (mỗi clip ~1 phút)\n');

  const region = { regions: [{ geojson: box(105.840, 21.018, 105.865, 21.040), color: '#e8b04b' }], fill: true, dim: true };

  await clip('C1-approach.mp4', 'approach', 'bay vào từ khung rộng rồi VẼ DẦN ranh giới — không bung đột ngột', 'approach', {
    location: HK,
    highlight: region,
  });

  await clip('C2-pushIn.mp4', 'pushIn', 'đẩy vào một điểm, thả ghim rồi pulse quanh nó', 'pushIn', {
    location: HK,
    highlight: { points: [{ lng: HK.lng, lat: HK.lat, icon: 'star', color: '#e8b04b', size: 90 }] },
  });

  await clip('C3-drift.mp4', 'drift', 'trôi chậm — clip nền cho lớp chữ phủ lên', 'drift', {
    location: HK,
    highlight: region,
  });

  // ── cặp đối chứng cho bug bearing ────────────────────────────────────────
  const base: RenderMapParams = {
    location: HK,
    highlight: { points: [{ lng: HK.lng, lat: HK.lat, icon: 'star', color: '#e8b04b', size: 90 }] },
  };
  const fp0 = await clip('C4-bearing-0.mp4', 'bearing 0', 'ĐỐI CHỨNG — camera thẳng hướng bắc', 'pushIn', {
    ...base,
    camera: { center: [HK.lng, HK.lat], zoom: HK.zoom, bearing: 0 },
  });
  const fp45 = await clip('C5-bearing-45.mp4', 'bearing 45', 'BUG ĐÃ VÁ — cùng preset, chỉ khác bearing. Trước đây clip này ra y hệt ô bên trái', 'pushIn', {
    ...base,
    camera: { center: [HK.lng, HK.lat], zoom: HK.zoom, bearing: 45 },
  });

  const differs = fp0 !== fp45;
  console.log(`\n  ${differs ? '✓' : '✗'} cặp bearing KHÁC NHAU thật: ${fp0} vs ${fp45}`);
  console.log(`     ${differs ? 'Trước gói này hai vân tay sẽ TRÙNG — compiler nuốt mất camera.bearing.' : 'TRÙNG NHAU — bug chưa được vá!'}`);

  // ── trang xem ────────────────────────────────────────────────────────────
  const card = (c: typeof clips[number]): string =>
    `<figure><video src="${c.file}" autoplay loop muted playsinline></video>
     <figcaption><b>${c.title}</b><span>${c.note}</span><em>${c.meta}</em></figcaption></figure>`;

  const html = `<!doctype html><meta charset="utf-8"><title>Tier 0 — clip</title><style>
body{margin:0;padding:28px;background:#0d1b2a;color:#f0d9a8;font:14px/1.55 -apple-system,system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}p.sub{margin:0 0 22px;color:#8fa8c0;font-size:13px}
h2{font-size:15px;color:#e8b04b;margin:30px 0 14px;font-weight:600}
.g{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
.pair{display:grid;grid-template-columns:repeat(2,1fr);gap:20px;max-width:760px}
figure{margin:0}video{width:100%;border-radius:8px;display:block;border:1px solid #1c3e60;background:#0a1520}
figcaption{margin-top:8px}b{color:#e8b04b;display:block;font-size:14px}
span{color:#a8c0d8;font-size:12.5px;display:block;margin-top:2px}
em{color:#6b8299;font-size:11.5px;font-style:normal;display:block;margin-top:5px;font-variant-numeric:tabular-nums}
.proof{margin-top:14px;padding:12px 14px;border-radius:8px;background:#12304a;border-left:3px solid #e8b04b;font-size:13px;max-width:760px}
code{font-family:ui-monospace,monospace;color:#7bd88f}
</style>
<h1>Tier 0 — chuyển động, render cục bộ</h1>
<p class="sub">Hồ Hoàn Kiếm 105.8524, 21.0285 · toạ độ tường minh nên không cần geocode · ${SIZE.width}×${SIZE.height} · text-free theo AC-9, chỉ có dòng attribution giấy phép</p>

<h2>Ba preset chuyển động</h2>
<div class="g">${clips.slice(0, 3).map(card).join('')}</div>

<h2>Bug đã vá — cặp đối chứng bearing</h2>
<div class="pair">${clips.slice(3).map(card).join('')}</div>
<div class="proof">Vân tay nội dung mọi khung hình: <code>${fp0}</code> so với <code>${fp45}</code> — ${differs ? 'KHÁC NHAU' : 'TRÙNG NHAU'}.
Hai clip này chỉ khác đúng một tham số. Trước gói này bộ biên dịch preset sinh keyframe không mang <code>bearing</code>,
nên <code>camera.bearing</code> bị nuốt im lặng và hai vân tay sẽ trùng nhau.</div>`;

  await fs.writeFile(path.join(OUT, 'clips.html'), html);

  console.log(`\n${'─'.repeat(72)}`);
  console.log(`CLIP: ${clips.length} video → _acceptance/tier0-agent-params/demo/clips.html`);
  console.log('─'.repeat(72));
  process.exit(differs ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
