/**
 * anchors-camera — bất biến cấu trúc không unit test nào diễn tả được.
 *
 *   I1  t3_path không đụng (src/lib/export.ts, src/lib/mapStyle.ts). Sửa
 *       `export.ts` đổi pixel đầu ra, tức phá bằng chứng determinism
 *       byte-identical của map-motion-clip — kể cả khi "sửa cho đúng".
 *   I2  KHÔNG tồn tại `anchorsAt` hay bất kỳ đường nào cho phép chiếu ở `t`
 *       tuỳ ý. Đây là bất biến "không tồn tại": chỉ đọc mã mới nói được. Một
 *       hàm nhận `t` buộc phải `jumpTo` để chiếu, và jumpTo đó để camera ở chỗ
 *       khác trong khi `restBase` vẫn là ảnh chụp ở `restAtSec` — khung đuôi kế
 *       tiếp sẽ vẽ marker bằng camera SAI lên ảnh nền ĐÚNG.
 *   I3  `anchors` phát ra ở CẢ BA bề mặt (MCP render_clip / REST /render-clip /
 *       jobs), ĐẾM trên mã chứ không tin test hành vi: `jobRunner.ts` đã hai
 *       lần dùng sai biến mà 22/22 test vẫn xanh.
 *   I4  Công thức phần trăm dùng HAI mẫu số khác nhau, và bộ test có ca phân
 *       biệt được (cssW ≠ cssH) — với khung vuông thì một mẫu số chung vẫn xanh.
 *   I5  Thân `anchors()` không `jumpTo` và không gán `restBase`/`animBase`/
 *       `lastApplied*`, cũng không `await` (không có điểm nhường lượt để một
 *       lời gọi khác chen vào giữa lúc nó đang đọc camera).
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

/**
 * Bỏ chú thích trước khi soi MÃ. Kế hoạch và doc comment ở main.tsx nhắc tên
 * `anchorsAt(t)` để giải thích vì sao KHÔNG được có nó — đọc cả chú thích thì
 * chính lời giải thích trở thành vi phạm, và cách duy nhất để xanh là xoá lời
 * giải thích. Bỏ chú thích khối và những dòng chỉ chứa chú thích.
 */
const stripComments = (s: string): string =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => {
      const t = line.trim();
      return !t.startsWith('//') && !t.startsWith('*');
    })
    .join('\n');

/** Thân của một hàm/method bắt đầu tại `header`, cắt bằng cách đếm ngoặc. */
function bodyOf(src: string, header: string): string {
  const start = src.indexOf(header);
  if (start < 0) return '';
  let depth = 0;
  for (let i = src.indexOf('{', start); i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return '';
}

// --- I1: t3_path 0 dòng thay đổi -------------------------------------------
const T3 = ['src/lib/export.ts', 'src/lib/mapStyle.ts'];
let base = 'origin/main';
try {
  execFileSync('git', ['rev-parse', '--verify', base], { cwd: repoRoot, stdio: 'pipe' });
} catch {
  base = execFileSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}
const mergeBase = execFileSync('git', ['merge-base', base, 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}..HEAD`], { cwd: repoRoot, encoding: 'utf8' }).split('\n').filter(Boolean);
const touched = T3.filter((p) => changed.includes(p));
note(
  touched.length === 0,
  'I1',
  touched.length === 0 ? `t3_path untouched vs ${mergeBase.slice(0, 8)} (${changed.length} file đổi)` : `t3_path BỊ SỬA: ${touched.join(', ')}`,
);

const mainSrc = read('src/render/main.tsx');
const anchorsSrc = read('src/render/anchors.ts');
const anchorsTest = read('src/render/anchors.test.ts');
const frameSrc = read('mcp-server/src/renderFrame.ts');
const toolsSrc = read('mcp-server/src/tools.ts');
const httpSrc = read('mcp-server/src/http.ts');
const jobSrc = read('mcp-server/src/jobRunner.ts');
const ALL = { mainSrc, anchorsSrc, frameSrc, toolsSrc, httpSrc, jobSrc };

// --- I2: không có đường chiếu ở `t` tuỳ ý -----------------------------------
const CODE = Object.fromEntries(Object.entries(ALL).map(([k, v]) => [k, stripComments(v)]));
const anchorsAtHits = Object.entries(CODE).filter(([, s]) => /anchorsAt/.test(s)).map(([k]) => k);
note(anchorsAtHits.length === 0, 'I2', anchorsAtHits.length === 0 ? 'không tệp nào nhắc tới `anchorsAt`' : `TỒN TẠI anchorsAt trong: ${anchorsAtHits.join(', ')}`);

// Khai báo trong interface KHÔNG nhận tham số nào.
const declNoArg = /\n\s*anchors\(\)\s*:\s*ClipAnchors;/.test(mainSrc);
note(declNoArg, 'I2', `MapPosterApi.anchors khai báo KHÔNG tham số: ${declNoArg}`);

// Hiện thực cũng không nhận tham số nào — một tham số `t` là đúng thứ bị cấm.
const implNoArg = /\n\s*anchors\(\)\s*\{/.test(mainSrc);
note(implNoArg, 'I2', `hiện thực anchors() KHÔNG tham số: ${implNoArg}`);

// Mọi lời gọi anchors() trong repo đều gọi rỗng.
const calls = [...Object.values(CODE).join('\n').matchAll(/\banchors\(([^)]*)\)/g)].map((m) => m[1].trim());
const withArgs = calls.filter(Boolean);
note(withArgs.length === 0, 'I2', withArgs.length === 0 ? `${calls.length} lời gọi anchors(), tất cả rỗng` : `lời gọi anchors() MANG tham số: ${withArgs.join(' | ')}`);

// --- I3: cả ba bề mặt thật sự phát ra anchors -------------------------------
// `resolvedOfClip` bắt buộc tham số anchors — bỏ sót là lỗi biên dịch chứ
// không phải một khối `resolved` thiếu trường mà test hành vi vẫn xanh.
const requiredParam = /export const resolvedOfClip = \(cfg: RenderConfig, anchors: ClipAnchors\)/.test(toolsSrc);
note(requiredParam, 'I3', `resolvedOfClip nhận anchors BẮT BUỘC (không dấu ?): ${requiredParam}`);
const emitsBoth = /camera: anchors\.camera/.test(toolsSrc) && /anchors: \{ points: anchors\.points, regions: anchors\.regions \}/.test(toolsSrc);
note(emitsBoth, 'I3', `resolvedOfClip phát ra CẢ camera lẫn anchors: ${emitsBoth}`);

const SURFACES: [string, string][] = [
  ['tools.ts (MCP render_clip)', toolsSrc],
  ['http.ts (REST /render-clip)', httpSrc],
  ['jobRunner.ts (/jobs)', jobSrc],
];
for (const [name, src] of SURFACES) {
  const uses = (src.match(/resolvedOfClip\(cfg, anchors\)/g) ?? []).length;
  // Mỗi bề mặt có ĐÚNG một lời gọi renderClip, và `anchors` phải được bóc ra
  // từ chính lời gọi đó — đây là chốt chống lớp lỗi "dùng sai biến".
  const renderCalls = (src.match(/deps\.renderClip\(/g) ?? []).length;
  const destructured = (src.match(/const \{ frames, settle[^}]*anchors \} = await deps\.renderClip\(cfg\);/g) ?? []).length;
  note(uses >= 1, 'I3', `${name}: ${uses} lối ra dùng resolvedOfClip(cfg, anchors)`);
  note(
    renderCalls === 1 && destructured === 1,
    'I3',
    `${name}: ${renderCalls} lời gọi deps.renderClip, ${destructured} chỗ bóc anchors ra từ chính nó (phải là 1/1 — nguồn khác là lớp lỗi "sai biến")`,
  );
}

// Không lối ra clip nào còn dùng resolvedOf(cfg) trần: một khối `resolved`
// thiếu camera/anchors trên MỘT nhánh degrade là đúng thứ không ai đối chiếu.
for (const [name, src] of SURFACES) {
  const clipBody = name.startsWith('tools') ? bodyOf(src, 'async render_clip(') : name.startsWith('jobRunner') ? bodyOf(src, 'async function runClip(') : src.slice(src.indexOf("if (req.url === '/render-clip')"), src.indexOf("if (jobs && (req.url === '/jobs'"));
  const bare = (clipBody.match(/resolvedOf\(cfg\)/g) ?? []).length;
  note(bare === 0, 'I3', `${name}: ${bare} lối ra clip còn dùng resolvedOf(cfg) trần (phải là 0)`);
}

// ClipFrames mang anchors — kiểu là thứ bắt được thiếu sót ở BIÊN DỊCH.
const clipFramesHasAnchors = /export interface ClipFrames \{[^}]*anchors: ClipAnchors;/s.test(frameSrc);
note(clipFramesHasAnchors, 'I3', `ClipFrames khai báo anchors bắt buộc: ${clipFramesHasAnchors}`);

// --- I4: hai mẫu số, và bộ test phân biệt được ------------------------------
const twoDenominators = /const xPct = \(p\.x \/ frame\.cssW\) \* 100;/.test(anchorsSrc) && /const yPct = \(p\.y \/ frame\.cssH\) \* 100;/.test(anchorsSrc);
note(twoDenominators, 'I4', `pctOf chia x cho cssW và y cho cssH: ${twoDenominators}`);

// Không có một "hệ số chung" nào trong anchors.ts — đó chính là hình dạng của lỗi.
const sharedRatio = /const ratio\b|\* ratio\b|\/ ratio\b/.test(anchorsSrc);
note(!sharedRatio, 'I4', `anchors.ts KHÔNG có hệ số tỉ lệ chung: ${!sharedRatio}`);

// Khung được đo bằng HAI thuộc tính khác nhau của canvas, không phải một.
const frameFromBothAxes = /cssW: canvasEl\.clientWidth \|\| canvasEl\.width, cssH: canvasEl\.clientHeight \|\| canvasEl\.height/.test(mainSrc);
note(frameFromBothAxes, 'I4', `main.tsx dựng frame từ clientWidth VÀ clientHeight: ${frameFromBothAxes}`);

// Bộ test phải có ít nhất một ca cssW ≠ cssH: với khung vuông, một mẫu số
// chung vẫn xanh và bất biến này không được canh gác bởi gì cả.
const frames = [...anchorsTest.matchAll(/cssW:\s*(-?[\d.]+),\s*cssH:\s*(-?[\d.]+)/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
const discriminating = frames.filter(([w, h]) => Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0 && w !== h);
note(
  discriminating.length > 0,
  'I4',
  discriminating.length > 0
    ? `${discriminating.length}/${frames.length} ca test có cssW ≠ cssH (vd ${discriminating[0][0]}×${discriminating[0][1]})`
    : 'MỌI ca test dùng khung vuông — một mẫu số chung sẽ vẫn xanh',
);

// --- I5: anchors() chỉ đọc --------------------------------------------------
const body = bodyOf(mainSrc, '\n  anchors() {');
note(body.length > 0, 'I5', `trích được thân anchors() (${body.length} ký tự)`);
const FORBIDDEN: [string, RegExp][] = [
  ['jumpTo', /jumpTo/],
  ['gán restBase', /restBase\s*=/],
  ['gán animBase', /animBase\s*=/],
  ['gán lastApplied*', /lastApplied\w*\s*=/],
  ['setData', /setData/],
  ['setPaintProperty', /setPaintProperty/],
  ['await (điểm nhường lượt)', /\bawait\b/],
];
for (const [label, re] of FORBIDDEN) {
  note(!re.test(body), 'I5', `thân anchors() KHÔNG chứa ${label}: ${!re.test(body)}`);
}

// Gọi ngay SAU lần chụp settle, không có lời gọi nào chen giữa.
const settleThenAnchors = /const settleUrl: string = await page\.evaluate\([\s\S]*?\}, motion\.restAtSec\);\s*(?:\/\/[^\n]*\n\s*)*const anchors: ClipAnchors = await page\.evaluate\(/.test(frameSrc);
note(settleThenAnchors, 'I5', `renderFrame.ts gọi anchors() NGAY SAU lần chụp settle: ${settleThenAnchors}`);

console.log('');
if (failures.length) {
  console.log(`anchors-invariants: ${failures.length} vi phạm`);
  process.exit(1);
}
console.log('anchors-invariants: mọi bất biến còn giữ');
