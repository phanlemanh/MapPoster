/**
 * road-routing — bất biến cấu trúc không unit test nào diễn tả được.
 *
 *   I1  t3_path không đụng (src/lib/export.ts, src/lib/mapStyle.ts).
 *   I2  Host router CHỈ đến từ env. Đây là bất biến BẢO MẬT: `route.ts` là lời
 *       gọi mạng ra ngoài đầu tiên mà nội dung do caller ảnh hưởng, nên một
 *       đường nào đó cho caller đặt host là SSRF vào chính tiến trình đang giữ
 *       browser pool và cổng loopback. Unit test không diễn tả được "không tồn
 *       tại đường nào" — chỉ đọc mã mới nói được.
 *   I3  Mọi `fetch` trong route.ts mang `signal`. Không có signal thì không thể
 *       timeout, mà resolveConfig chạy TRONG clip slot (concurrency 1).
 *   I4  route.ts không import export.ts/mapStyle.ts — attribution đã có sẵn
 *       "© OpenStreetMap contributors", không có lý do kéo t3_path vào.
 *
 * Exit 0 = mọi bất biến còn giữ. Exit 1 = ít nhất một cái vỡ.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const read = (p: string): string => readFileSync(path.join(repoRoot, p), 'utf8');

const failures: string[] = [];
const note = (ok: boolean, id: string, msg: string): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}  ${msg}`);
  if (!ok) failures.push(`${id}: ${msg}`);
};

// --- I1 --------------------------------------------------------------------
const T3_PATHS = ['src/lib/export.ts', 'src/lib/mapStyle.ts'];
let base = 'origin/main';
try {
  execFileSync('git', ['rev-parse', '--verify', base], { cwd: repoRoot, stdio: 'pipe' });
} catch {
  base = execFileSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}
const mergeBase = execFileSync('git', ['merge-base', base, 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}..HEAD`], { cwd: repoRoot, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const t3Touched = T3_PATHS.filter((p) => changed.includes(p));
note(
  t3Touched.length === 0,
  'I1',
  t3Touched.length === 0 ? `t3_path untouched vs ${mergeBase.slice(0, 8)} (${changed.length} file đổi)` : `t3_path BỊ SỬA: ${t3Touched.join(', ')}`,
);

const routeSrc = read('mcp-server/src/route.ts');

// --- I2: host chỉ từ env ---------------------------------------------------
const envSourced = /env\.MAPPOSTER_OSRM_URL\s*\|\|\s*DEFAULT_OSRM_URL/.test(routeSrc);
note(envSourced, 'I2', `base URL lấy từ env.MAPPOSTER_OSRM_URL: ${envSourced}`);

// Không được có tham số công khai nào mang tên gợi ý host/url/endpoint/baseUrl.
const publicSigs = [...routeSrc.matchAll(/export (?:async )?function \w+\(([^)]*)\)/gs)].map((m) => m[1]);
const leaky = publicSigs.filter((sig) => /\b(baseUrl|host|url|endpoint|origin)\s*[?:]/i.test(sig));
note(
  leaky.length === 0,
  'I2',
  leaky.length === 0 ? 'không hàm export nào nhận host/url từ caller' : `SSRF: chữ ký export nhận host — ${leaky.join(' | ').slice(0, 120)}`,
);

// Chuỗi URL không được nội suy trực tiếp giá trị caller ngoài toạ độ đã validate.
const buildsFromValidated = /const coordPair = .*Number\(c\[0\]\)/s.test(routeSrc);
note(buildsFromValidated, 'I2', `toạ độ vào URL đi qua Number() sau khi validate: ${buildsFromValidated}`);

// --- I3: mọi fetch có signal ------------------------------------------------
const fetchCalls: string[] = [];
let from = 0;
for (;;) {
  const at = routeSrc.indexOf('fetch(', from);
  if (at < 0) break;
  const close = routeSrc.indexOf(');', at);
  fetchCalls.push(routeSrc.slice(at, close > 0 ? close + 2 : at + 300));
  from = at + 1;
}
const allSignalled = fetchCalls.length > 0 && fetchCalls.every((c) => /signal:/.test(c));
note(allSignalled, 'I3', `${fetchCalls.length} lời gọi fetch, tất cả mang signal = ${allSignalled}`);

const hasTimeoutMsg = /timed out/i.test(routeSrc) && /MAPPOSTER_ROUTE_TIMEOUT_MS/.test(routeSrc);
note(hasTimeoutMsg, 'I3', `lỗi timeout nêu được env chỉnh: ${hasTimeoutMsg}`);

// --- I4: không kéo t3_path vào ---------------------------------------------
const importsT3 = /from '.*(export|mapStyle)'/.test(routeSrc);
note(!importsT3, 'I4', `route.ts KHÔNG import export.ts/mapStyle.ts: ${!importsT3}`);

console.log('');
if (failures.length) {
  console.log(`routing-invariants: ${failures.length} vi phạm`);
  process.exit(1);
}
console.log('routing-invariants: mọi bất biến còn giữ');
