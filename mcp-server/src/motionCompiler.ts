// Biên dịch preset → MotionScript từ hình học ĐÃ resolve (spec §4). Compiler sống
// phía server vì keyframe cần toạ độ thật — thứ chỉ có sau resolveConfig.
import { z } from 'zod';
import { validateMotionScript, DEFAULT_MAX_CLIP_FRAMES, type MotionContext, type MotionScript, type MotionTrack } from '../../src/render/motionScript';
import type { RenderConfig } from '../../src/render/renderConfig';
import { resolveConfig, type RenderMapParams } from './resolveConfig';
import { envNumber, DEFAULT_CLIP_CONCURRENCY, DEFAULT_JOB_SLOT_WAIT_MS } from '../config';

export type MotionPreset = 'approach' | 'pushIn' | 'drift';
export interface PresetOverrides {
  fps?: number;
  durationSec?: number;
}

export function motionContextOf(cfg: RenderConfig, maxFrames?: number): MotionContext {
  return {
    regionCount: cfg.highlight?.regions.length ?? 0,
    routeCount: 0, // RenderConfig chưa mang routes — reserved v2 (spec §11)
    pointCount: cfg.markers?.length ?? 0,
    maxFrames,
  };
}

// Measured, not guessed (spec §3): Task 5 clocked ~902ms/frame cold / ~400ms/frame
// warm at a small 320×568 test canvas and flagged that a real poster size would
// be slower. Task 9 re-measured at the actual TikTok production size (1080×1920,
// 12-frame clip, same M4 Max dev machine): ~1108ms/frame cold, ~644ms/frame warm.
// Cold is the number that matters — it's what every process's first clip pays,
// and it is worse than the ~0.7s/frame threshold the plan sets, so the default
// drops from 24 to 18 to keep total render wall-time down for a given duration.
const FPS_DEFAULT = 18;

/** Mốc thời gian chuẩn của mỗi preset (spec §4 storyboard) — scale theo durationSec override. */
const APPROACH = { dur: 6, rest: 4.2, arrive: 2.6, reveal0: 1.8, reveal1: 3.2, pin: 3.5, pinDur: 0.5, zoomOut: 3.5 };
const PUSH_IN = { dur: 5.5, rest: 3.9, arrive: 2.4, pin: 0.9, pinDur: 0.5, pulseFrom: 2.6, period: 1.8, rings: 2, zoomIn: 1.8 };
const DRIFT = { dur: 6, rest: 4.2, reveal0: 1.5, reveal1: 3.0, zoomDelta: 0.35 };

// motionScript.ts keyframe.zoom schema bound: z.number().min(0).max(22).
// Every zoom in this file is a resolved camera.zoom plus/minus a fixed preset
// offset, and at the ends of the legal zoom domain (near 0 or near 22) that
// arithmetic alone can land outside [0,22] — clamp every computed zoom through
// this before it reaches a keyframe (Findings 1, 2, 3).
const ZOOM_MIN = 0;
const ZOOM_MAX = 22;
function clampZoom(zoom: number): number {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
}

// motionScript.ts keyframe.center[0] schema bound: z.number().min(-180).max(180).
// pushIn offsets the start centre by a fraction of the viewport's longitude
// span, and for a resolved centre near the antimeridian (lng ≈ ±180) that
// offset alone can push the result past -180/180 — wrap every computed
// longitude through this before it reaches a keyframe (Finding 4).
const LNG_MIN = -180;
const LNG_MAX = 180;
const LNG_RANGE = LNG_MAX - LNG_MIN;
function wrapLng(lng: number): number {
  return ((((lng - LNG_MIN) % LNG_RANGE) + LNG_RANGE) % LNG_RANGE) + LNG_MIN;
}

// A fly-in preset (approach, pushIn) starts wide of its target zoom and moves
// in. Below this delta the start/target keyframes round to visually the same
// zoom — a smaller change is not perceptible as motion, so the clip reads as
// frozen even though it "validates" as a two-keyframe script.
const MIN_ZOOM_DELTA = 0.5;

/**
 * Fly-in presets subtract a fixed offset from the resolved target zoom to get
 * their start zoom, then clampZoom floors that at 0 (Finding: legal resolved
 * zoom can be 0 — a whole-earth view, see resolveConfig.ts assertZoom). When
 * the target zoom is itself smaller than the offset, clamping silently
 * collapses start toward (or onto) the target instead of failing, producing
 * a motionless "fly-in" or, for pushIn, a globe-spanning longitude jump that
 * still passes schema validation. Fail loudly instead of manufacturing a
 * degenerate clip or silently altering the caller's target framing.
 */
function assertFlyInHeadroom(preset: 'approach' | 'pushIn', startZoom: number, targetZoom: number): void {
  const delta = targetZoom - startZoom;
  if (delta < MIN_ZOOM_DELTA) {
    throw new Error(`preset ${preset} needs a target zoom of at least ${MIN_ZOOM_DELTA} to fly in from — got ${targetZoom}`);
  }
}

const FPS_MIN = 12;
const FPS_MAX = 30;
const DURATION_MIN = 2;
const DURATION_MAX = 12;

/**
 * Give an out-of-range preset override a clear, field-named error instead of
 * letting it fall through as a raw ZodError from validateMotionScript
 * (Finding 6) — matches the style of the "needs highlight.regions" /
 * "needs a highlight point" material-input errors above.
 */
function assertValidOverrides(preset: MotionPreset, o?: PresetOverrides): void {
  if (o?.fps !== undefined && (!Number.isInteger(o.fps) || o.fps < FPS_MIN || o.fps > FPS_MAX)) {
    throw new Error(`preset ${preset} override fps=${o.fps} is out of range — fps must be an integer between ${FPS_MIN} and ${FPS_MAX}`);
  }
  if (o?.durationSec !== undefined && (o.durationSec < DURATION_MIN || o.durationSec > DURATION_MAX)) {
    throw new Error(`preset ${preset} override durationSec=${o.durationSec} is out of range — durationSec must be between ${DURATION_MIN} and ${DURATION_MAX}`);
  }
}

function compile(preset: MotionPreset, cfg: RenderConfig, o?: PresetOverrides): MotionScript {
  assertValidOverrides(preset, o);
  const fps = o?.fps ?? FPS_DEFAULT;
  const { center, zoom } = cfg.camera;
  const hasRegion = (cfg.highlight?.regions.length ?? 0) > 0;
  const hasPoint = (cfg.markers?.length ?? 0) > 0;

  if (preset === 'approach') {
    if (!hasRegion) throw new Error('preset approach needs highlight.regions — it flies to and reveals a boundary');
    const k = (o?.durationSec ?? APPROACH.dur) / APPROACH.dur;
    const tracks: MotionTrack[] = [{ kind: 'regionReveal', t0: APPROACH.reveal0 * k, t1: APPROACH.reveal1 * k }];
    if (hasPoint) tracks.push({ kind: 'pinDrop', at: APPROACH.pin * k, dur: APPROACH.pinDur * k });
    // Clamped (not floored at MIN_START_ZOOM): a floor above 0 can exceed the
    // target zoom for wide country/continent views, making "approach" start
    // past where it ends (Finding 5) — clamping only at the true schema
    // bounds guarantees start ≤ target for every legal zoom. assertFlyInHeadroom
    // then rejects the case where that clamp collapses the flight into no
    // perceptible motion instead of silently emitting a frozen clip.
    const startZoom = clampZoom(zoom - APPROACH.zoomOut);
    assertFlyInHeadroom('approach', startZoom, zoom);
    return {
      fps,
      durationSec: APPROACH.dur * k,
      restAtSec: APPROACH.rest * k,
      camera: [
        { t: 0, center: [...center], zoom: startZoom },
        { t: APPROACH.arrive * k, center: [...center], zoom, ease: 'easeInOut' },
      ],
      tracks,
    };
  }

  if (preset === 'pushIn') {
    if (!hasPoint) throw new Error('preset pushIn needs a highlight point — it pushes into and pulses around one');
    const k = (o?.durationSec ?? PUSH_IN.dur) / PUSH_IN.dur;
    // Lệch tâm mở đầu ~15% bề ngang khung nhìn ở zoom đích (360° / 2^z, chuẩn tile 512px).
    const lngSpan = (360 / Math.pow(2, zoom)) * (cfg.size.width / 512);
    const startZoom = clampZoom(zoom - PUSH_IN.zoomIn);
    assertFlyInHeadroom('pushIn', startZoom, zoom);
    return {
      fps,
      durationSec: PUSH_IN.dur * k,
      restAtSec: PUSH_IN.rest * k,
      camera: [
        { t: 0, center: [wrapLng(center[0] - lngSpan * 0.15), center[1]], zoom: startZoom },
        { t: PUSH_IN.arrive * k, center: [...center], zoom, ease: 'easeOut' },
      ],
      tracks: [
        { kind: 'pinDrop', at: PUSH_IN.pin * k, dur: PUSH_IN.pinDur * k },
        { kind: 'pulse', from: PUSH_IN.pulseFrom * k, periodSec: PUSH_IN.period, rings: PUSH_IN.rings },
      ],
    };
  }

  // drift
  const k = (o?.durationSec ?? DRIFT.dur) / DRIFT.dur;
  const tracks: MotionTrack[] = hasRegion ? [{ kind: 'regionReveal', t0: DRIFT.reveal0 * k, t1: DRIFT.reveal1 * k }] : [];
  return {
    fps,
    durationSec: DRIFT.dur * k,
    restAtSec: DRIFT.rest * k,
    camera: [
      { t: 0, center: [...center], zoom: clampZoom(zoom - DRIFT.zoomDelta) },
      { t: DRIFT.rest * k, center: [...center], zoom: clampZoom(zoom + DRIFT.zoomDelta), ease: 'easeInOut' },
    ],
    tracks,
  };
}

/** Compiler KHÔNG BAO GIỜ được sinh script mà validator của chính nó từ chối (AC-2). */
export function compileMotion(preset: MotionPreset, cfg: RenderConfig, overrides?: PresetOverrides, maxFrames?: number): MotionScript {
  return validateMotionScript(compile(preset, cfg, overrides), motionContextOf(cfg, maxFrames));
}

export interface ResolvedMotion {
  motion: MotionScript;
  preset?: MotionPreset;
}

/**
 * The `motion` param's compile-or-validate branch: REST `/render-clip`
 * (http.ts) and the MCP `render_clip` tool (tools.ts) both make EXACTLY this
 * decision — a preset compiles through compileMotion, a raw script goes
 * straight through validateMotionScript — so it lives here ONCE. Duplicating
 * this branch in both surfaces would let them silently drift.
 */
export function resolveMotion(
  motionParam: { preset: MotionPreset; fps?: number; durationSec?: number } | { script: unknown },
  cfg: RenderConfig,
  maxFrames?: number,
): ResolvedMotion {
  if ('preset' in motionParam) {
    return {
      preset: motionParam.preset,
      motion: compileMotion(motionParam.preset, cfg, { fps: motionParam.fps, durationSec: motionParam.durationSec }, maxFrames),
    };
  }
  return { motion: validateMotionScript(motionParam.script, motionContextOf(cfg, maxFrames)) };
}

// --- Shared `motion` param parsing + clip-pipeline preparation (Findings C, F) ---
//
// Before this, both public surfaces (REST /render-clip in http.ts, MCP
// render_clip in tools.ts) independently: parsed `motion`'s shape, forced
// chrome:'clean' (AC-9), read MAPPOSTER_MAX_CLIP_FRAMES, and shaped
// ZodError-vs-invariant errors — and had already drifted (MAPPOSTER_CLIP_MAX_BYTES
// was enforced only in REST; fixed alongside this in both files). One
// implementation now backs both; each surface keeps only its own delivery
// (REST inline base64 vs MCP file-under-sinkDir) and its own encode-failure
// degrade.

export const MOTION_REQUIRED_MSG = 'motion is required: { preset: "approach"|"pushIn"|"drift", fps?, durationSec? } or { script }';

/**
 * `fps`/`durationSec` are intentionally NOT range-bounded here — only type
 * checked. The range lives in ONE place, `assertValidOverrides` above, so its
 * carefully worded message ("preset X override fps=999 is out of range...")
 * is what a caller actually sees.
 *
 * Finding F: when this schema (or the REST/MCP copies that used to exist
 * separately) ALSO bounded fps/durationSec to [FPS_MIN,FPS_MAX] /
 * [DURATION_MIN,DURATION_MAX], a well-typed-but-out-of-range override
 * (`{ preset: 'approach', fps: 999 }`) failed the schema here, and both
 * surfaces reported the generic MOTION_REQUIRED_MSG instead — true even
 * though a preset object WAS supplied — making assertValidOverrides's message
 * unreachable from either public surface.
 */
const presetMotionParamSchema = z.object({
  preset: z.enum(['approach', 'pushIn', 'drift']),
  fps: z.number().int().optional(),
  durationSec: z.number().optional(),
});
const scriptMotionParamSchema = z.object({ script: z.unknown() });

export type MotionParam = z.infer<typeof presetMotionParamSchema> | z.infer<typeof scriptMotionParamSchema>;

/**
 * The `motion` param's declared shape — used as the MCP `render_clip` tool's
 * registered inputSchema (tools.ts), so a real MCP client's introspected
 * contract and this file's actual runtime acceptance (parseMotionParam,
 * below) never drift apart.
 */
export const motionParamSchema = z.union([presetMotionParamSchema, scriptMotionParamSchema]);

/**
 * Branch on `'preset' in motion` BEFORE parsing (Finding F) instead of
 * z.union's own "both branches failed, blend into one error" behaviour:
 * picking the ONE schema that matches the input's shape keeps a parse
 * failure specific to that branch, so a well-typed-but-out-of-range preset
 * override reaches `resolveMotion` → `assertValidOverrides` instead of being
 * swallowed into MOTION_REQUIRED_MSG.
 */
export function parseMotionParam(input: unknown): { success: true; data: MotionParam } | { success: false; error: string } {
  if (!input || typeof input !== 'object') return { success: false, error: MOTION_REQUIRED_MSG };
  if ('preset' in input) {
    const r = presetMotionParamSchema.safeParse(input);
    return r.success ? { success: true, data: r.data } : { success: false, error: z.prettifyError(r.error) };
  }
  if ('script' in input) {
    const r = scriptMotionParamSchema.safeParse(input);
    return r.success ? { success: true, data: r.data } : { success: false, error: z.prettifyError(r.error) };
  }
  return { success: false, error: MOTION_REQUIRED_MSG };
}

/**
 * Thrown by `prepareClipRender` for motion-parameter problems specifically —
 * a bad `motion` shape, or a `compileMotion`/`validateMotionScript` invariant
 * violation. Callers map this ONE type to their surface's error shape (REST:
 * 422; MCP: `fail()`). A `resolveConfig` failure on the same call is a
 * distinct, pre-existing kind of error and is deliberately NOT wrapped in
 * this — it keeps propagating exactly as it did before this refactor (REST:
 * falls through to the outer catch; MCP: caught by render_clip's own
 * catch-all, same as always).
 */
export class MotionParamError extends Error {}

// --- Shared clip-render concurrency gate (owner decision, 2026-08-04) ---
//
// A clip render is the expensive path — ~1108ms/frame measured cold at
// 1080×1920 (spec §3), so a 6s/18fps clip runs ~2 minutes end to end. A full
// async job queue is explicitly deferred to a later package; for now the gate
// is a simple in-process counter, ONE instance shared by both public surfaces
// (REST `/render-clip` in http.ts, MCP `render_clip` in tools.ts) so neither
// can independently saturate the browser pool out from under the other.
// Colocated with `prepareClipRender` below — the helper both surfaces already
// call — so a third surface calling it inherits the same gate automatically.

export class ClipConcurrencyError extends Error {
  constructor(limit: number) {
    super(
      `Too many concurrent clip renders (limit ${limit}, MAPPOSTER_CLIP_CONCURRENCY). ` +
        `/render-clip and render_clip are synchronous and can take minutes at production sizes — retry shortly.`,
    );
    this.name = 'ClipConcurrencyError';
  }
}

export class ClipSlotWaitTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(
      `Waited ${timeoutMs}ms for a free clip slot (MAPPOSTER_JOB_SLOT_WAIT_MS) and gave up — the gate is saturated.`,
    );
    this.name = 'ClipSlotWaitTimeoutError';
  }
}

let clipsInFlight = 0;

interface SlotWaiter {
  grant(release: () => void): void;
  /** Đã hết hạn hoặc đã được cấp — bỏ qua khi quét hàng. */
  settled: boolean;
}

/** Hàng chờ FIFO. Chỉ lối `acquireClipSlotWaiting` xếp vào đây; lối ném-ngay
 * không bao giờ chờ, nên hai chính sách dùng chung bộ đếm mà không chung hàng. */
const waiters: SlotWaiter[] = [];

const limitOf = (env: NodeJS.ProcessEnv): number =>
  envNumber(env, 'MAPPOSTER_CLIP_CONCURRENCY', DEFAULT_CLIP_CONCURRENCY, { min: 1 });

/** Một hàm nhả dùng-một-lần. Nhả xong thì lập tức đánh thức người chờ kế tiếp,
 * nếu không người cuối hàng sẽ ngồi đó tới hết hạn dù chỗ đã trống. */
function makeRelease(env: NodeJS.ProcessEnv): () => void {
  let released = false;
  return () => {
    if (released) return; // idempotent — bên gọi có thể nhả ở nhiều lối ra
    released = true;
    clipsInFlight--;
    pumpWaiters(env);
  };
}

function pumpWaiters(env: NodeJS.ProcessEnv): void {
  const limit = limitOf(env);
  while (clipsInFlight < limit) {
    const next = waiters.shift();
    if (!next) return;
    if (next.settled) continue; // đã hết hạn và rời hàng — bỏ qua, không tiêu chỗ
    clipsInFlight++;
    next.settled = true;
    next.grant(makeRelease(env));
  }
}

/**
 * Reserve one of the shared clip slots, or throw `ClipConcurrencyError`
 * immediately — no internal queueing. Đây là chính sách của ĐƯỜNG ĐỒNG BỘ
 * (`/render-clip`, MCP `render_clip`): xếp hàng ở đó chỉ biến một lỗi
 * caller-actionable thành một cái treo dài hơn. Hành vi KHÔNG đổi so với
 * trước gói async-job-queue. Returns a release function the caller MUST
 * invoke exactly once, in a `finally`, once the render + encode this slot was
 * reserved for has fully finished.
 */
export function acquireClipSlot(env: NodeJS.ProcessEnv = process.env): () => void {
  const limit = limitOf(env);
  if (clipsInFlight >= limit) throw new ClipConcurrencyError(limit);
  clipsInFlight++;
  return makeRelease(env);
}

/**
 * Chính sách của THỢ CHẠY VIỆC: xếp hàng chờ tới lượt, nhưng CÓ HẠN.
 *
 * Chờ không hạn không phải là kiên nhẫn — nó là treo vĩnh viễn đội lốt "đang
 * chờ": một slot rò rỉ thì việc nằm trong hàng mãi mãi, người gọi hỏi lại mãi
 * vẫn thấy *đang chờ*, và bản ghi hết hạn giữ trước khi kịp chạy. Repo đã trả
 * giá đúng lớp lỗi này một lần ở `browserPool`'s `PoolAcquireTimeoutError`.
 */
export function acquireClipSlotWaiting(
  { timeoutMs, env = process.env }: { timeoutMs?: number; env?: NodeJS.ProcessEnv } = {},
): Promise<() => void> {
  const wait = timeoutMs ?? envNumber(env, 'MAPPOSTER_JOB_SLOT_WAIT_MS', DEFAULT_JOB_SLOT_WAIT_MS, { min: 1 });

  if (clipsInFlight < limitOf(env) && waiters.length === 0) {
    clipsInFlight++;
    return Promise.resolve(makeRelease(env));
  }

  return new Promise<() => void>((resolve, reject) => {
    const waiter: SlotWaiter = {
      settled: false,
      grant: (release) => {
        clearTimeout(timer);
        resolve(release);
      },
    };
    const timer = setTimeout(() => {
      if (waiter.settled) return;
      // Đánh dấu đã xử xong TẠI CHỖ thay vì tìm-và-xoá khỏi mảng: `pumpWaiters`
      // bỏ qua mọi waiter `settled`, nên hàng không bao giờ tiêu một chỗ trống
      // cho người đã bỏ cuộc.
      waiter.settled = true;
      reject(new ClipSlotWaitTimeoutError(wait));
    }, wait);
    // `unref` để một hạn chờ đang treo không giữ tiến trình sống khi tắt server.
    timer.unref?.();
    waiters.push(waiter);
  });
}

/** CHỈ dùng trong test: bộ đếm và hàng chờ là trạng thái cấp module, nên hai
 * test chạy nối nhau sẽ nhiễm nhau nếu không dọn. */
export function resetClipGateForTests(): void {
  clipsInFlight = 0;
  waiters.length = 0;
}

export interface ClipPreparation {
  cfg: RenderConfig;
  motion: MotionScript;
  preset?: MotionPreset;
  /**
   * Releases this call's clip-concurrency slot (see `acquireClipSlot` above).
   * The caller MUST invoke this exactly once, in a `finally`, after the
   * render + encode this preparation was for has finished (success or
   * failure) — the gate guards the FULL clip lifecycle, not just this cheap
   * preparation step.
   */
  releaseClipSlot: () => void;
}

/**
 * Shared clip-pipeline preparation (Finding C). Resolves `params` into a
 * `RenderConfig`, forces `chrome: 'clean'` (AC-9 — built as a NEW object, no
 * `cfg.chrome = ...` mutation, per this repo's immutability rule), reads the
 * `MAPPOSTER_MAX_CLIP_FRAMES` budget, and turns `motionInput` into a
 * validated `MotionScript`. Both REST `/render-clip` (http.ts) and the MCP
 * `render_clip` tool (tools.ts) call this instead of each reimplementing it.
 *
 * Also reserves the shared clip-concurrency slot (above) for the WHOLE call.
 * `ClipConcurrencyError` is thrown as-is (never wrapped in `MotionParamError`)
 * so callers can tell "over capacity" (429-worthy) apart from "bad motion
 * param" (422-worthy). If anything after the slot is reserved fails — a bad
 * `motion`, or `resolveConfig` itself — the slot is released immediately,
 * since the caller never receives a `ClipPreparation` to release it from.
 */
export async function prepareClipRender(
  params: RenderMapParams,
  motionInput: unknown,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ClipPreparation> {
  return prepareClipRenderWithSlot(params, motionInput, acquireClipSlot(env), env);
}

/**
 * Cùng phần chuẩn bị, nhưng slot do BÊN GỌI cấp. Thợ chạy việc lấy slot bằng
 * lối chờ (`acquireClipSlotWaiting`) rồi đưa hàm nhả vào đây, nên nó dùng
 * đúng một đường chuẩn bị với đường đồng bộ thay vì dựng bản sao thứ hai.
 */
export async function prepareClipRenderWithSlot(
  params: RenderMapParams,
  motionInput: unknown,
  releaseClipSlot: () => void,
  env: NodeJS.ProcessEnv = process.env,
): Promise<ClipPreparation> {
  try {
    const parsed = parseMotionParam(motionInput);
    if (!parsed.success) throw new MotionParamError(parsed.error);

    const base = await resolveConfig(params);
    const resolvedBase: RenderConfig = { ...base, chrome: 'clean' };
    const maxFrames = envNumber(env, 'MAPPOSTER_MAX_CLIP_FRAMES', DEFAULT_MAX_CLIP_FRAMES, { min: 24 });

    let resolved: ResolvedMotion;
    try {
      resolved = resolveMotion(parsed.data, resolvedBase, maxFrames);
    } catch (e) {
      // Same shape both surfaces already forwarded before this refactor: a raw
      // ZodError from validateMotionScript's own schema.parse() has no
      // R:/O:/L:/B:/I: prefix and dumps as a verbose issues array — prettify
      // it. An invariant violation is already a plain Error with that prefix;
      // forward its message verbatim so the caller can find the rule.
      const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
      throw new MotionParamError(message);
    }
    return { cfg: { ...resolvedBase, motion: resolved.motion }, motion: resolved.motion, preset: resolved.preset, releaseClipSlot };
  } catch (e) {
    releaseClipSlot();
    throw e;
  }
}
