#!/usr/bin/env node
/* do-chu-ky.mjs — tự tương quan của dãy sai khác khung-liên-khung.
 *
 *   node do-chu-ky.mjs <clip.mp4> "<nhãn>"
 *
 * Biến "nhìn thấy răng cưa" thành một con số. Đọc dãy MAD (sai khác tuyệt đối
 * trung bình giữa hai khung liên tiếp, xem `do-nhip-chuyen-dong.sh`) rồi tính tự
 * tương quan ở các lag 1..12 khung:
 *   - có ĐỈNH PHỤ ở một lag ngắn  => nhịp lặp đều đặn, tức giật CÓ CHU KỲ;
 *   - GIẢM ĐƠN ĐIỆU từ lag 1      => đường cong trơn, KHÔNG có thành phần chu kỳ.
 * Dòng "đỉnh mạnh nhất" ở cuối chỉ có nghĩa khi dãy không đơn điệu — với dãy đơn
 * điệu nó chỉ là giá trị đầu của một đường đang tụt, nên phải đọc cả bảng.
 */
import { spawnSync } from 'node:child_process';

const [clip, label] = process.argv.slice(2);
const W = 96, H = 170, N = W * H, fps = 18;

const r = spawnSync('ffmpeg', ['-v', 'error', '-i', clip, '-vf', `scale=${W}:${H},format=gray`, '-f', 'rawvideo', '-'], { maxBuffer: 1 << 30 });
const all = r.stdout;
const nf = Math.floor(all.length / N);
const mad = [];
for (let f = 1; f < nf; f++) {
  let s = 0; const a = f * N, b = (f - 1) * N;
  for (let i = 0; i < N; i++) s += Math.abs(all[a + i] - all[b + i]);
  mad.push(s / N);
}

// Chỉ xét phần ĐANG CHUYỂN ĐỘNG: đuôi nghỉ toàn số 0 sẽ bóp méo tương quan.
const max = Math.max(...mad), thr = max * 0.02;
let last = 0;
for (let i = mad.length - 1; i >= 0; i--) if (mad[i] > thr) { last = i; break; }
const seg = mad.slice(0, last + 1);
const mean = seg.reduce((a, b) => a + b, 0) / seg.length;
const c = seg.map((v) => v - mean);
const denom = c.reduce((a, b) => a + b * b, 0);

console.log(`## ${label}`);
console.log('tự tương quan của phần đang chuyển động (lag = số khung):');
let best = { lag: 0, r: -2 };
for (let lag = 1; lag <= 12; lag++) {
  let s = 0;
  for (let i = 0; i + lag < c.length; i++) s += c[i] * c[i + lag];
  const rr = s / denom;
  if (lag >= 2 && rr > best.r) best = { lag, r: rr };
  console.log(`  lag ${String(lag).padStart(2)} (${(lag / fps * 1000).toFixed(0).padStart(3)} ms):  r = ${rr.toFixed(3)}`);
}
console.log(`=> đỉnh mạnh nhất ở lag ${best.lag} khung (${(best.lag / fps * 1000).toFixed(0)} ms), r = ${best.r.toFixed(3)}`);
console.log('   Đọc cả bảng: đỉnh PHỤ sau một chỗ tụt = chu kỳ thật; dãy giảm đều = trơn.\n');
