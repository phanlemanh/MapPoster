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

// --- I3: every new Zod-boundary field has a runtime assert ----------------
const resolveConfigSrc = read('mcp-server/src/resolveConfig.ts');
const REQUIRED_ASSERTS = [
  { fn: 'assertLayers', field: 'layers' },
  { fn: 'assertDetail', field: 'detail' },
  { fn: 'assertFont', field: 'font' },
  { fn: 'assertMarkerSize', field: 'highlight.points[].size' },
  { fn: 'assertMarkerIcon', field: 'highlight.points[].icon / highlight.pointIcon' },
  { fn: 'assertPitch', field: 'camera.pitch' },
];
for (const a of REQUIRED_ASSERTS) {
  // defined AND actually called — a declared-but-unused guard is not a guard
  const defined = new RegExp(`function ${a.fn}\\b`).test(resolveConfigSrc);
  const called = new RegExp(`${a.fn}\\(`).test(resolveConfigSrc.replace(new RegExp(`function ${a.fn}\\b`, 'g'), ''));
  note(defined && called, 'I3', `${a.field} guarded by ${a.fn} (defined: ${defined}, called: ${called})`);
}
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
