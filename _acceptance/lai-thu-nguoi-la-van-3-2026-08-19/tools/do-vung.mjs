#!/usr/bin/env node
/* do-vung.mjs — cùng phép đo tự tương quan, nhưng trên MỘT VÙNG của khung.
 *
 *   node do-vung.mjs <clip.mp4> "<biểu-thức-crop-ffmpeg hoặc chuỗi rỗng>" "<nhãn>"
 *
 * Dùng để tách NGUỒN của nhịp giật. Nếu nhịp chu kỳ còn nguyên ở GÓC khung — nơi
 * tuyến không đi qua — thì nó đến từ chuyển động camera; nếu nó biến mất ở góc và
 * chỉ có ở vùng có tuyến thì nó đến từ nét vẽ tuyến tiến từng bước.
 *
 * Ví dụ:
 *   node do-vung.mjs clip.mp4 "" "toàn khung"
 *   node do-vung.mjs clip.mp4 "crop=340:340:0:0" "góc trên-trái"
 */
import { spawnSync } from 'node:child_process';

const [clip, crop, label] = process.argv.slice(2);
const W = 96, H = 170, N = W * H;
const vf = crop ? `${crop},scale=${W}:${H},format=gray` : `scale=${W}:${H},format=gray`;

const r = spawnSync('ffmpeg', ['-v', 'error', '-i', clip, '-vf', vf, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
const all = r.stdout;
const nf = Math.floor(all.length / N);
const mad = [];
for (let f = 1; f < nf; f++) {
  let s = 0; const a = f * N, b = (f - 1) * N;
  for (let i = 0; i < N; i++) s += Math.abs(all[a + i] - all[b + i]);
  mad.push(s / N);
}

const max = Math.max(...mad), thr = max * 0.02;
let last = 0;
for (let i = mad.length - 1; i >= 0; i--) if (mad[i] > thr) { last = i; break; }
const seg = mad.slice(0, last + 1);
const mean = seg.reduce((a, b) => a + b, 0) / seg.length;
const c = seg.map((v) => v - mean);
const den = c.reduce((a, b) => a + b * b, 0);
const ac = (l) => { let s = 0; for (let i = 0; i + l < c.length; i++) s += c[i] * c[i + l]; return s / den; };

console.log(`${label.padEnd(34)} lag1=${ac(1).toFixed(3)} lag4=${ac(4).toFixed(3)} lag7=${ac(7).toFixed(3)}  MAD_tb=${mean.toFixed(2)}`);
