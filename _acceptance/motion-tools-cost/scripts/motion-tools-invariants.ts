/**
 * motion-tools-cost — bất biến cấu trúc không unit test nào diễn tả được.
 *
 *   I1  t3_path không đụng (src/lib/export.ts, src/lib/mapStyle.ts).
 *   I2  `compile_motion` KHÔNG lấy clip slot và KHÔNG gọi renderClip. Đây là
 *       toàn bộ lý do tồn tại của nó ("xem trước mà không tốn gì"); một unit
 *       test có thể chứng minh nó không gọi `deps.render`, nhưng chỉ đọc mã
 *       mới chứng minh được nó không gọi `acquireClipSlot` — hàm đó không đi
 *       qua deps nên fake không thấy.
 *   I3  `quality` được nối ở CẢ BA bề mặt encode (tools/http/jobRunner). Vòng
 *       làm gói này đã tự chứng minh vì sao cần: lỗi ở http.ts bị test hiện có
 *       bắt, còn lỗi y hệt ở jobRunner.ts thì KHÔNG test nào bắt.
 *   I4  Tên số đo chi phí mang đơn vị — không `time:`/`size:` trần.
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
  t3Touched.length === 0
    ? `t3_path untouched vs ${mergeBase.slice(0, 8)} (${changed.length} file đổi)`
    : `t3_path BỊ SỬA: ${t3Touched.join(', ')}`,
);

// --- I2: compile_motion phải rẻ --------------------------------------------
const toolsSrc = read('mcp-server/src/tools.ts');
const compileBody = (() => {
  const start = toolsSrc.indexOf('async compile_motion(');
  if (start < 0) return null;
  // tới đầu hàm kế tiếp trong cùng object literal
  const rest = toolsSrc.slice(start);
  const end = rest.search(/\n {4}async \w+\(|\n {4}\w+\([^)]*\): Promise/);
  return end > 0 ? rest.slice(0, end) : rest;
})();
note(compileBody !== null, 'I2', `tìm thấy thân compile_motion: ${compileBody !== null}`);
if (compileBody) {
  for (const forbidden of ['acquireClipSlot', 'deps.renderClip', 'deps.render(', 'encodeAnimation']) {
    const used = compileBody.includes(forbidden);
    note(!used, 'I2', `compile_motion KHÔNG dùng ${forbidden}: ${!used}`);
  }
  const reuses = compileBody.includes('prepareClipRenderWithSlot');
  note(reuses, 'I2', `compile_motion tái dùng prepareClipRenderWithSlot (không chép nhánh resolve): ${reuses}`);
}

// --- I3: quality nối đủ ba bề mặt encode -----------------------------------
const ENCODE_SURFACES = [
  { file: 'mcp-server/src/tools.ts', what: 'MCP render_clip + render_animation' },
  { file: 'mcp-server/src/http.ts', what: 'REST POST /render-clip' },
  { file: 'mcp-server/src/jobRunner.ts', what: 'async POST /jobs' },
];
for (const s of ENCODE_SURFACES) {
  const src = read(s.file);
  // Soi KHỐI ĐỐI SỐ chứ không phải một dòng: lời gọi trong render_animation
  // trải nhiều dòng, nên phép kiểm theo-dòng cho false negative (đã dính đúng
  // lần chạy đầu của chính script này).
  const calls: string[] = [];
  let from = 0;
  for (;;) {
    const at = src.indexOf('encodeAnimation(', from);
    if (at < 0) break;
    // tới dấu `)` đóng lời gọi, đủ nông cho các call site hiện có
    const close = src.indexOf('});', at);
    calls.push(src.slice(at, close > 0 ? close + 3 : at + 400));
    from = at + 1;
  }
  const allCarry = calls.length > 0 && calls.every((c) => /quality:/.test(c));
  note(allCarry, 'I3', `${s.what} (${s.file}): ${calls.length} lời gọi encode, tất cả mang quality = ${allCarry}`);
}

// --- I4: tên số đo chi phí mang đơn vị -------------------------------------
const BARE_COST = /^\s*(time|size|duration|elapsed)\s*:/gm;
for (const f of ['mcp-server/src/tools.ts', 'mcp-server/src/encodeAnimation.ts']) {
  const hits = [...read(f).matchAll(BARE_COST)].map((m) => m[1]);
  note(hits.length === 0, 'I4', `${f}: ${hits.length === 0 ? 'không có tên chi phí trần' : `tên trần: ${hits.join(', ')}`}`);
}
const costNamesOk = ['renderMs', 'encodeMs', 'bytes', 'frames'].every((n) => toolsSrc.includes(n));
note(costNamesOk, 'I4', `bốn tên chi phí đủ nghĩa đều có mặt: ${costNamesOk}`);

console.log('');
if (failures.length) {
  console.log(`motion-tools-invariants: ${failures.length} vi phạm`);
  process.exit(1);
}
console.log('motion-tools-invariants: mọi bất biến còn giữ');
