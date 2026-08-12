/**
 * tier0-agent-params — structural invariants no unit test can express.
 *
 * Three checks, each a whole-repo property rather than a behaviour of one module:
 *   I1  t3_path untouched — src/lib/export.ts and src/lib/mapStyle.ts must be
 *       byte-identical to the merge base. The whole "these were free wins on
 *       already-paid-for engine code" thesis rests on this.
 *   I2  all three clip surfaces echo motion.script — MCP, REST and async /jobs
 *       each build their own motionOut literal, so nothing but a cross-file
 *       check can prove they agree.
 *   I3  every new Zod-boundary field has a runtime assert — makeTools is called
 *       directly (tests, render_variants merges), bypassing Zod entirely, so a
 *       Zod-only field is unguarded on the path that matters.
 *
 * Exit 0 = all invariants hold. Exit 1 = at least one violated (details on stdout).
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

// --- I1: t3_path untouched ------------------------------------------------
const T3_PATHS = ['src/lib/export.ts', 'src/lib/mapStyle.ts'];
// Compare against the upstream default branch; fall back to the tracking ref.
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
    ? `t3_path untouched vs ${mergeBase.slice(0, 8)} (${changed.length} files changed, none in t3_paths)`
    : `t3_path MODIFIED: ${t3Touched.join(', ')} — escalates the gate to per-criterion human judgment`,
);

// --- I2: all three clip surfaces echo motion.script ------------------------
const CLIP_SURFACES = [
  { file: 'mcp-server/src/tools.ts', what: 'MCP render_clip' },
  { file: 'mcp-server/src/http.ts', what: 'REST POST /render-clip' },
  { file: 'mcp-server/src/jobRunner.ts', what: 'async POST /jobs' },
];
for (const s of CLIP_SURFACES) {
  const src = read(s.file);
  // The echo must live on the single shared motionOut binding — every return
  // path (success, encode-degrade, oversize-reject) reuses it, so binding-level
  // presence is what proves all three paths carry it.
  //
  // Match on the binding's own LINE rather than brace-balancing: the literal
  // nests (`...(preset ? { preset } : {})`), so a naive `\{[^}]*\}` stops at the
  // inner `}` and reports a false negative.
  const bindingLines = src.split('\n').filter((l) => l.includes('const motionOut ='));
  const hasEcho = bindingLines.length > 0 && bindingLines.every((l) => /\bscript:\s*motion\b/.test(l));
  note(hasEcho, 'I2', `${s.what} (${s.file}) ${hasEcho ? 'echoes' : 'DOES NOT echo'} motion.script on its motionOut binding`);
}

// --- I3: every runtime guard is registered, called, and keeps every label --
//
// The first version of I3 was a HARDCODED list of six guard names. That list is
// exactly the kind of thing that falls behind: this package's own two colour
// fields (highlight.regions[].color, highlight.points[].color) were never added,
// so stripping `assertColor` from both call sites left I3 at exit 0 — the same
// defect class that failed anchors-camera E2 in round 1.
//
// So nothing here is a bare hand-written list any more:
//   (a) the guard SET is derived from `function assert…` in resolveConfig.ts and
//       must equal the registry below — a new guard cannot arrive unregistered,
//       and a deleted one cannot stay registered;
//   (b) every guard must actually be CALLED (a declared-but-unused guard is not
//       a guard);
//   (c) every guard that takes a LABEL must still carry every registered label —
//       this is what a shared guard needs, since `assertColor` stays "called"
//       while losing three of its four call sites;
//   (d) the Zod boundary field NAMES are derived from tools.ts and pinned, so a
//       new input field cannot enter without this invariant being re-reviewed.
const resolveConfigSrc = read('mcp-server/src/resolveConfig.ts');
const toolsSrc = read('mcp-server/src/tools.ts');

interface GuardEntry {
  /** Đường dẫn trường mà chốt này canh — để đọc, không dùng để kiểm. */
  fields: string[];
  /** Nhãn literal PHẢI còn ở lời gọi (chỉ với chốt nhận nhãn). */
  labels?: string[];
}
const GUARDS: Record<string, GuardEntry> = {
  assertDim: { fields: ['format.width', 'format.height'], labels: ['width', 'height'] },
  assertLngLat: { fields: ['location.{lng,lat}', 'camera.center', 'routes[].coords[]', 'highlight.points[].{lng,lat}'] },
  assertZoom: { fields: ['location.zoom', 'camera.zoom'] },
  assertPitch: { fields: ['camera.pitch'] },
  assertPaddingPct: { fields: ['camera.focus.paddingPct'] },
  assertDetail: { fields: ['detail'] },
  assertFont: { fields: ['font'] },
  assertLayers: { fields: ['layers'] },
  assertTheme: { fields: ['theme'] },
  assertGeojson: { fields: ['routes[].geojson', 'highlight.regions[].geojson'], labels: ['routes[].geojson'] },
  assertRouteWidth: { fields: ['routes[].width'] },
  assertColor: {
    fields: ['highlight.color', 'highlight.regions[].color', 'highlight.points[].color', 'routes[].color'],
    labels: ['highlight.color', 'highlight.regions[].color', 'highlight.points[].color', 'routes[].color'],
  },
  assertMarkerSize: { fields: ['highlight.points[].size'] },
  assertMarkerIcon: { fields: ['highlight.points[].icon', 'highlight.pointIcon'], labels: ['highlight.pointIcon'] },
};

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// (a) tập chốt ĐỊNH NGHĨA phải khớp đúng sổ đăng ký
const defined = [...resolveConfigSrc.matchAll(/function (assert\w+)\b/g)].map((m) => m[1]).sort();
const registered = Object.keys(GUARDS).sort();
const unregistered = defined.filter((f) => !registered.includes(f));
const missing = registered.filter((f) => !defined.includes(f));
note(
  unregistered.length === 0 && missing.length === 0,
  'I3',
  unregistered.length || missing.length
    ? `sổ chốt lệch mã: chưa đăng ký [${unregistered.join(', ')}], đăng ký thừa [${missing.join(', ')}]`
    : `${defined.length} chốt định nghĩa khớp đúng sổ đăng ký (không tên nào cứng ngoài sổ)`,
);

for (const [fn, entry] of Object.entries(GUARDS)) {
  // (b) được GỌI thật, không chỉ khai báo
  const callSites = resolveConfigSrc.replace(new RegExp(`function ${fn}\\b`, 'g'), '');
  const called = new RegExp(`\\b${fn}\\(`).test(callSites);
  note(called, 'I3', `${fn} canh ${entry.fields.join(' + ')} — có lời gọi: ${called}`);

  // (c) mỗi nhãn đã đăng ký còn nguyên ở một lời gọi
  for (const label of entry.labels ?? []) {
    const kept = new RegExp(`\\b${fn}\\([^)]*'${escapeRe(label)}'`).test(resolveConfigSrc);
    note(kept, 'I3', `${fn} còn giữ nhãn '${label}': ${kept}`);
  }
}

// (d) tập TÊN trường của hợp đồng Zod ở tools.ts — ghim lại, không tự sinh ra
// từ danh sách chốt: mục đích là không cho một trường đầu vào MỚI lọt vào mà
// I3 không được xem lại. Lệch tập ⇒ FAIL kèm tên trường lệch.
const stripForKeys = (s: string): string =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => !l.trim().startsWith('//'))
    .join('\n')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""')
    .replace(/`[^`\n]*`/g, '``')
    .replace(/\/\^[^\n]*?\/[gimsuy]*/g, 'RE');
const schemaRegion = (() => {
  const code = stripForKeys(toolsSrc);
  const from = code.indexOf('const zoomLevel =');
  const to = code.indexOf('export const renderMapSchema');
  return from >= 0 && to > from ? code.slice(from, to) : '';
})();
const PINNED_ZOD_FIELDS = [
  'aeroway', 'bearing', 'buildings', 'camera', 'center', 'chrome', 'color', 'coords', 'delivery', 'detail',
  'dim', 'fill', 'focus', 'font', 'format', 'from', 'geojson', 'height', 'highlight', 'icon', 'index', 'kind',
  'labels', 'landcover', 'layers', 'location', 'measure', 'message', 'mode', 'name', 'output', 'paddingPct',
  'pairs', 'parks', 'pitch', 'placeName', 'pointIcon', 'points', 'quality', 'query', 'rail', 'regions',
  'roadLabels', 'roads', 'route', 'routes', 'size', 'theme', 'to', 'via', 'water', 'width', 'zoom',
];
const zodFields = [...new Set([...schemaRegion.matchAll(/(?:^|[{,(\s])(\w+)\s*:/gm)].map((m) => m[1]))].sort();
const added = zodFields.filter((f) => !PINNED_ZOD_FIELDS.includes(f));
const removed = PINNED_ZOD_FIELDS.filter((f) => !zodFields.includes(f));
note(
  schemaRegion.length > 0 && added.length === 0 && removed.length === 0,
  'I3',
  schemaRegion.length === 0
    ? 'KHÔNG cắt được vùng schema trong tools.ts — phép kiểm ghim trường Zod đã mù'
    : added.length || removed.length
      ? `hợp đồng Zod đổi trường: thêm [${added.join(', ')}], bỏ [${removed.join(', ')}] — xem lại I3 rồi ghim lại`
      : `${zodFields.length} tên trường Zod khớp đúng bản ghim (trường mới không lọt vào mà I3 không được xem lại)`,
);
// bearing is deliberately NORMALIZED, not rejected — bounding it would remove a
// working MapLibre capability (bearing: -45 renders correctly). Assert the
// normalizer exists instead of an assertBearing.
const normalizesBearing = /%\s*360/.test(resolveConfigSrc);
note(normalizesBearing, 'I3', `camera.bearing normalized (not rejected) — modulo-360 present: ${normalizesBearing}`);

console.log('');
if (failures.length) {
  console.log(`tier0-invariants: ${failures.length} violation(s)`);
  process.exit(1);
}
console.log('tier0-invariants: all invariants hold');
