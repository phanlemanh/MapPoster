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

// --- I3: cả ba bề mặt thật sự phát ra MỘT TRONG HAI ------------------------
// `resolvedOfClip` bắt buộc tham số outcome — bỏ sót là lỗi biên dịch chứ
// không phải một khối `resolved` thiếu trường mà test hành vi vẫn xanh.
const requiredParam = /export const resolvedOfClip = \(cfg: RenderConfig, outcome: ClipAnchorsOutcome\)/.test(toolsSrc);
note(requiredParam, 'I3', `resolvedOfClip nhận outcome BẮT BUỘC (không dấu ?): ${requiredParam}`);

// Union PHÂN BIỆT, không phải hai trường optional: `?: never` ở cả hai nhánh là
// thứ khiến trạng thái "vắng cả hai" không dựng lên được.
const discriminated =
  /\{ anchors: ClipAnchors; anchorsUnavailable\?: never \}/.test(frameSrc) && /\{ anchors\?: never; anchorsUnavailable: string \}/.test(frameSrc);
note(discriminated, 'I3', `ClipAnchorsOutcome là union phân biệt (?: never ở cả hai nhánh): ${discriminated}`);

// CHẠY THẬT, không đọc regex: với mỗi nhánh outcome, khối `resolved` phải mang
// ĐÚNG MỘT trong hai. Regex không nói được "cả hai" hay "không gì cả" — chỉ
// gọi hàm mới nói được.
const { resolvedOfClip } = (await import(path.join(repoRoot, 'mcp-server/src/tools.ts'))) as {
  resolvedOfClip: (cfg: unknown, outcome: unknown) => Record<string, unknown>;
};
const probeCfg = {
  camera: { center: [106.7, 10.78], zoom: 12 },
  size: { width: 320, height: 568 },
  theme: 'midnight-blue',
  chrome: 'clean',
  place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
  markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }],
};
const probes: [string, unknown][] = [
  ['đo được', { anchors: { camera: { center: [106.7, 10.78], zoom: 13, bearing: 0, pitch: 0 }, points: [], regions: [] } }],
  ['không đo được', { anchorsUnavailable: 'camera.pitch is 30 — anchors require pitch 0.' }],
];
for (const [label, outcome] of probes) {
  const r = resolvedOfClip(probeCfg, outcome);
  const hasAnchors = 'anchors' in r;
  const hasReason = 'anchorsUnavailable' in r;
  note(
    hasAnchors !== hasReason,
    'I3',
    `resolvedOfClip(${label}) phát ra ĐÚNG MỘT: anchors=${hasAnchors}, anchorsUnavailable=${hasReason}`,
  );
  // `camera` là số đo của cùng lần đọc anchors — nó phải đi và vắng cùng nhau.
  note(('camera' in r) === hasAnchors, 'I3', `resolvedOfClip(${label}): camera đi cùng anchors (${'camera' in r})`);
}

const SURFACES: [string, string][] = [
  ['tools.ts (MCP render_clip)', toolsSrc],
  ['http.ts (REST /render-clip)', httpSrc],
  ['jobRunner.ts (/jobs)', jobSrc],
];
for (const [name, src] of SURFACES) {
  const uses = (src.match(/resolvedOfClip\(cfg, clipOut\)/g) ?? []).length;
  // Mỗi bề mặt có ĐÚNG một lời gọi renderClip, và outcome của chính lời gọi đó
  // phải được truyền NGUYÊN — đây là chốt chống lớp lỗi "dùng sai biến".
  const renderCalls = (src.match(/deps\.renderClip\(/g) ?? []).length;
  const bound = (src.match(/const clipOut = await deps\.renderClip\(cfg\);/g) ?? []).length;
  // Tháo rời union trước khi tới `resolvedOfClip` là mở lại đúng khe đó.
  const tornApart = /anchors(?:Unavailable)?\s*[,}][^\n]*= await deps\.renderClip\(/.test(src);
  note(uses >= 1, 'I3', `${name}: ${uses} lối ra dùng resolvedOfClip(cfg, clipOut)`);
  note(
    renderCalls === 1 && bound === 1 && !tornApart,
    'I3',
    `${name}: ${renderCalls} lời gọi deps.renderClip, ${bound} chỗ giữ NGUYÊN outcome, tháo rời=${tornApart} (phải là 1/1/false)`,
  );
}

// Không lối ra clip nào còn dùng resolvedOf(cfg) trần: một khối `resolved`
// thiếu camera/anchors trên MỘT nhánh degrade là đúng thứ không ai đối chiếu.
for (const [name, src] of SURFACES) {
  const clipBody = name.startsWith('tools')
    ? bodyOf(src, 'async render_clip(')
    : name.startsWith('jobRunner')
      ? bodyOf(src, 'async function runClip(')
      : src.slice(src.indexOf("if (req.url === '/render-clip')"), src.indexOf("if (jobs && (req.url === '/jobs'"));
  const bare = (clipBody.match(/resolvedOf\(cfg\)/g) ?? []).length;
  note(bare === 0, 'I3', `${name}: ${bare} lối ra clip còn dùng resolvedOf(cfg) trần (phải là 0)`);
}

// ClipFrames mang outcome — kiểu là thứ bắt được thiếu sót ở BIÊN DỊCH.
const clipFramesHasOutcome = /export type ClipFrames = \{[^}]*\} & ClipAnchorsOutcome;/s.test(frameSrc);
note(clipFramesHasOutcome, 'I3', `ClipFrames giao với ClipAnchorsOutcome: ${clipFramesHasOutcome}`);

// Nhánh không-đo-được BỎ QUA anchors(), không gọi-rồi-nuốt-lỗi: một `catch`
// quanh anchors() nuốt luôn chốt camera-ở-restAtSec.
const skipsNotCatches =
  /if \(anchorsUnavailable !== undefined\) \{\s*return \{ frames, settle, anchorsUnavailable \};/.test(frameSrc) &&
  !/catch[^\n]*\n[^\n]*anchorsUnavailable/.test(frameSrc);
note(skipsNotCatches, 'I3', `renderClipFrames BỎ QUA anchors() khi biết trước không đo được (không catch): ${skipsNotCatches}`);

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

// Gọi ngay SAU lần chụp settle: giữa hai chỗ đó KHÔNG được có lời gọi nào vào
// trang. Kiểm bằng cách cắt đúng đoạn ở giữa rồi soi, thay vì một regex dài
// khoá cứng từng dòng — đoạn giữa được phép chứa toán thuần (dựng Buffer,
// nhánh anchorsUnavailable), nhưng không được chứa một lượt vào trang nào.
const settleEnd = frameSrc.indexOf('}, motion.restAtSec);');
const anchorsCall = frameSrc.indexOf('const anchors: ClipAnchors = await page.evaluate(');
const gap = settleEnd >= 0 && anchorsCall > settleEnd ? frameSrc.slice(settleEnd, anchorsCall) : null;
const gapClean = gap !== null && !/page\.evaluate|renderMotionFrame|jumpTo|setCamera/.test(stripComments(gap));
note(
  gapClean,
  'I5',
  gap === null
    ? 'KHÔNG tìm được cặp settle→anchors trong renderFrame.ts'
    : `giữa lần chụp settle và anchors() không có lượt vào trang nào (${gap.length} ký tự đệm)`,
);

// ── I6: không test nào bị tắt LẶNG LẼ ────────────────────────────────────────
// E20 là eval hồi quy tổng, và `exit 0` của vitest canh đúng MỘT điều: không ca
// nào ĐỎ. Nó KHÔNG phân biệt được "xanh" với "bị tắt" — đổi một `it(` thành
// `it.skip(` vẫn cho exit 0, chỉ tụt số ca. Vòng chấm đã chứng minh đúng vậy:
// 541 pass / 11 skip mà lane vẫn xanh.
//
// Nên mệnh đề "mọi ca skip đều thuộc khối gated" phải có người canh, không thể
// nằm suông trong `expected` — đó chính là lớp lỗi cả năm vòng chấm đi bịt.
// Kiểm tĩnh, rẻ: `.skip`/`.only` chỉ được xuất hiện trong các tệp có cổng
// `MCP_INTEGRATION`, và `.only` thì không được ở đâu cả (nó làm CI chạy đúng
// một ca rồi báo xanh — im lặng và tệ hơn skip).
const GATED = ['mcp-server/src/renderFrame.test.ts', 'mcp-server/src/renderClip.test.ts', 'mcp-server/src/stdioChannel.test.ts'];
const testFiles = execFileSync('git', ['ls-files', '*.test.ts', '*.spec.ts'], { cwd: repoRoot, encoding: 'utf8' })
  .split('\n')
  .filter(Boolean);
const skipOffenders: string[] = [];
const onlyOffenders: string[] = [];
for (const f of testFiles) {
  const src = stripComments(read(f));
  if (/\b(it|test|describe)\.only\s*\(/.test(src)) onlyOffenders.push(f);
  if (GATED.includes(f)) continue;
  if (/\b(it|test|describe)\.skip\s*\(/.test(src)) skipOffenders.push(f);
}
note(
  skipOffenders.length === 0,
  'I6',
  skipOffenders.length
    ? `test bị TẮT ngoài khối gated: ${skipOffenders.join(', ')} — exit 0 không phân biệt được xanh với bị tắt`
    : `không .skip nào ngoài ${GATED.length} tệp gated (quét ${testFiles.length} tệp test)`,
);
note(
  onlyOffenders.length === 0,
  'I6',
  onlyOffenders.length ? `\`.only\` bỏ quên ở: ${onlyOffenders.join(', ')} — CI sẽ chạy đúng một ca rồi báo xanh` : 'không `.only` bỏ quên ở đâu',
);

console.log('');
if (failures.length) {
  console.log(`anchors-invariants: ${failures.length} vi phạm`);
  process.exit(1);
}
console.log('anchors-invariants: mọi bất biến còn giữ');
