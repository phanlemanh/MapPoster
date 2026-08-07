/**
 * routes-measurements — bất biến cấu trúc không unit test nào diễn tả được.
 *
 *   I1  t3_path không đụng — src/lib/export.ts và src/lib/mapStyle.ts phải
 *       byte-identical với merge-base. Cả luận điểm "mapStyle đã đủ năng lực,
 *       chỉ thiếu dây" đứng trên đó, và nó là thứ giữ gói này ở T2.
 *   I2  mọi field mới có runtime assert vừa ĐỊNH NGHĨA vừa ĐƯỢC GỌI — một guard
 *       khai rồi không gọi thì không phải guard, mà makeTools được gọi thẳng,
 *       bỏ qua toàn bộ tầng Zod.
 *   I3  không có tên số đo TRẦN. `km:` / `distance:` / `area:` không nói được
 *       phép đo là gì; phía tiêu thụ sẽ đọc thành "khoảng cách" rồi in lên video.
 *       Chỉ chấp nhận lengthKm / straightLineKm / areaKm2 / spanKm.
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

// --- I1: t3_path untouched -------------------------------------------------
const T3_PATHS = ['src/lib/export.ts', 'src/lib/mapStyle.ts'];
let base = 'origin/main';
try {
  execFileSync('git', ['rev-parse', '--verify', base], { cwd: repoRoot, stdio: 'pipe' });
} catch {
  base = execFileSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
}
const mergeBase = execFileSync('git', ['merge-base', base, 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}..HEAD`], { cwd: repoRoot, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const t3Touched = T3_PATHS.filter((p) => changed.includes(p));
note(
  t3Touched.length === 0,
  'I1',
  t3Touched.length === 0
    ? `t3_path untouched vs ${mergeBase.slice(0, 8)} (${changed.length} file đổi, không cái nào trong t3_paths)`
    : `t3_path BỊ SỬA: ${t3Touched.join(', ')} — gói này lẽ ra không cần chạm mapStyle/export`,
);

// --- I2: every new field has a guard that is defined AND called -------------
const resolverSrc = read('mcp-server/src/resolveConfig.ts');
const REQUIRED_GUARDS = [
  { fn: 'assertRouteWidth', field: 'routes[].width' },
  { fn: 'coordsToLineString', field: 'routes[].coords (>=2 vị trí)' },
  { fn: 'assertGeojson', field: 'routes[].geojson' },
  { fn: 'assertColor', field: 'routes[].color' },
];
for (const g of REQUIRED_GUARDS) {
  const defined = new RegExp(`function ${g.fn}\\b`).test(resolverSrc);
  const called = new RegExp(`${g.fn}\\(`).test(resolverSrc.replace(new RegExp(`function ${g.fn}\\b`, 'g'), ''));
  note(defined && called, 'I2', `${g.field} có guard ${g.fn} (định nghĩa: ${defined}, được gọi: ${called})`);
}
// Phải soi PHÉP SO SÁNH, không phải sự tồn tại của hằng và chuỗi lỗi: vô hiệu
// hoá điều kiện thành `if (false)` vẫn để cả hai chuỗi đó nằm nguyên trong file.
// (Phát hiện bằng chính negative control của script này.)
const totalCapEnforced = /if \(totalBytes > MAX_TOTAL_GEOJSON_BYTES\)/.test(resolverSrc) && /total inline GeoJSON/.test(resolverSrc);
note(totalCapEnforced, 'I2', `cap TỔNG geometry được SO SÁNH thật trong resolver: ${totalCapEnforced}`);

// Cùng lý do: kiểm phép so sánh chỉ số, không chỉ thông điệp lỗi.
const pairsGuarded = /a >= markers\.length \|\| b >= markers\.length/.test(resolverSrc) && /index out of range/.test(resolverSrc);
note(pairsGuarded, 'I2', `measure.pairs SO SÁNH chỉ số với số marker: ${pairsGuarded}`);

// --- I3: no bare measurement names ----------------------------------------
// Chỉ soi khai báo field trong hai file số đo, không soi comment/chuỗi.
const BARE = /^\s*(km|distance|area|length|span)\s*:/gm;
for (const f of ['mcp-server/src/resolveConfig.ts', 'mcp-server/src/geometry.ts']) {
  const hits = [...read(f).matchAll(BARE)].map((m) => m[1]);
  note(hits.length === 0, 'I3', `${f}: ${hits.length === 0 ? 'không có tên số đo trần' : `tên trần: ${hits.join(', ')}`}`);
}
const namesOk = ['lengthKm', 'straightLineKm', 'areaKm2', 'spanKm'].every((n) => resolverSrc.includes(n));
note(namesOk, 'I3', `bốn tên đủ nghĩa đều có mặt (lengthKm, straightLineKm, areaKm2, spanKm): ${namesOk}`);

console.log('');
if (failures.length) {
  console.log(`routes-invariants: ${failures.length} vi phạm`);
  process.exit(1);
}
console.log('routes-invariants: mọi bất biến còn giữ');
