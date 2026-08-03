// MotionScript — hợp đồng chuyển động tất định cho clip bản đồ (spec 2026-08-03 §3).
// Browser-safe: KHÔNG đọc process.env; ngưỡng động đi qua MotionContext.
import { z } from 'zod';

export type EaseId = 'linear' | 'easeInOut' | 'easeOut' | 'expoOut';

export interface CameraKeyframe {
  t: number;
  center: [number, number];
  zoom: number;
  bearing?: number;
  ease?: EaseId;
}

export type MotionTrack =
  | { kind: 'regionReveal'; t0: number; t1: number; regionIndex?: number; ease?: EaseId }
  | { kind: 'routeDraw'; t0: number; t1: number; routeIndex?: number }
  | { kind: 'pinDrop'; at: number; dur?: number; pointIndex?: number }
  | { kind: 'pulse'; from: number; periodSec?: number; rings?: number };

export interface MotionScript {
  fps: number;
  durationSec: number;
  restAtSec: number;
  camera: CameraKeyframe[];
  tracks: MotionTrack[];
}

/** Số lượng thực thể trong RenderConfig mà index của track được phép trỏ vào. */
export interface MotionContext {
  regionCount: number;
  routeCount: number;
  pointCount: number;
  /** Bất biến B — caller (mcp-server) truyền env MAPPOSTER_MAX_CLIP_FRAMES vào đây. */
  maxFrames?: number;
}

export const DEFAULT_MAX_CLIP_FRAMES = 288;
/** SETTLE gate của cổng chấm chụp tại start + dur×0.72 — clip phải nghỉ trước đó. */
export const REST_RATIO = 0.72;

const easeId = z.enum(['linear', 'easeInOut', 'easeOut', 'expoOut']);
const keyframe = z.object({
  t: z.number().min(0),
  center: z.tuple([z.number().min(-180).max(180), z.number().min(-90).max(90)]),
  zoom: z.number().min(0).max(22),
  bearing: z.number().optional(),
  ease: easeId.optional(),
});
const track = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('regionReveal'), t0: z.number().min(0), t1: z.number().positive(), regionIndex: z.number().int().min(0).optional(), ease: easeId.optional() }),
  z.object({ kind: z.literal('routeDraw'), t0: z.number().min(0), t1: z.number().positive(), routeIndex: z.number().int().min(0).optional() }),
  z.object({ kind: z.literal('pinDrop'), at: z.number().min(0), dur: z.number().positive().optional(), pointIndex: z.number().int().min(0).optional() }),
  z.object({ kind: z.literal('pulse'), from: z.number().min(0), periodSec: z.number().positive().optional(), rings: z.number().int().min(1).max(4).optional() }),
]);

export const motionScriptSchema = z.object({
  fps: z.number().int().min(12).max(30),
  durationSec: z.number().min(2).max(12),
  restAtSec: z.number().positive(),
  camera: z.array(keyframe).min(1),
  tracks: z.array(track),
});

/**
 * Compile-time guard: the zod schema and the exported interfaces are two
 * declarations of one contract, and the `as MotionScript` cast in
 * validateMotionScript would silently paper over any drift between them.
 * This assertion fails the build in BOTH directions instead — add a variant to
 * MotionTrack without a matching schema branch (or loosen a schema bound) and
 * `npx tsc -b` stops you here.
 */
type Assert<T extends true> = T;
// Exported (not @ts-ignore'd) on purpose: an export is never "unused", and a
// blanket @ts-ignore here would swallow the very TS2344 this guard exists to
// raise — it only failed to today because tsc happens to report that error on
// the type-argument line rather than the declaration line.
export type SchemaMatchesInterface = Assert<
  z.infer<typeof motionScriptSchema> extends MotionScript
    ? (MotionScript extends z.infer<typeof motionScriptSchema> ? true : false)
    : false
>;

const PIN_DUR_DEFAULT = 0.5;

/** Thời điểm một track one-shot HOÀN TẤT — pulse (loop) trả null. */
function oneShotEnd(t: MotionTrack): number | null {
  switch (t.kind) {
    case 'regionReveal':
    case 'routeDraw':
      return t.t1;
    case 'pinDrop':
      return t.at + (t.dur ?? PIN_DUR_DEFAULT);
    case 'pulse':
      return null;
  }
}

/**
 * Parse + kiểm 5 bất biến R/O/L/B/I của spec §3. Message lỗi bắt đầu bằng tên
 * luật vỡ ('R:'…) — REST 422 trả nguyên văn cho caller sửa đúng chỗ.
 */
export function validateMotionScript(value: unknown, ctx: MotionContext): MotionScript {
  const s = motionScriptSchema.parse(value) as MotionScript;

  const restCap = s.durationSec * REST_RATIO;
  if (s.restAtSec > restCap + 1e-9) {
    throw new Error(`R: restAtSec ${s.restAtSec} exceeds ${REST_RATIO}×durationSec = ${restCap.toFixed(3)}`);
  }

  for (let i = 1; i < s.camera.length; i++) {
    if (s.camera[i].t <= s.camera[i - 1].t) throw new Error(`O: camera keyframes must be strictly increasing (index ${i})`);
  }
  const lastKf = s.camera[s.camera.length - 1].t;
  if (lastKf > s.restAtSec + 1e-9) throw new Error(`O: last camera keyframe at ${lastKf}s is after restAtSec ${s.restAtSec}s`);
  for (const t of s.tracks) {
    if (t.kind === 'regionReveal' || t.kind === 'routeDraw') {
      if (t.t1 <= t.t0) throw new Error(`O: ${t.kind} needs t1 > t0`);
    }
    const end = oneShotEnd(t);
    if (end !== null && end > s.restAtSec + 1e-9) {
      throw new Error(`O: ${t.kind} ends at ${end.toFixed(3)}s, after restAtSec ${s.restAtSec}s`);
    }
    if (t.kind === 'pulse' && t.from >= s.durationSec) {
      throw new Error(`L: pulse starts at ${t.from}s, at/after the clip end ${s.durationSec}s`);
    }
  }

  const frames = Math.round(s.fps * s.durationSec);
  const maxFrames = ctx.maxFrames ?? DEFAULT_MAX_CLIP_FRAMES;
  if (frames > maxFrames) throw new Error(`B: ${frames} frames (fps×duration) exceeds the budget of ${maxFrames}`);

  for (const t of s.tracks) {
    if (t.kind === 'regionReveal' && (t.regionIndex ?? 0) >= ctx.regionCount) {
      throw new Error(`I: regionReveal regionIndex ${t.regionIndex ?? 0} but config has ${ctx.regionCount} region(s)`);
    }
    if (t.kind === 'routeDraw') {
      // RenderConfig chưa mang routes — reserved cho v2 (spec §11); mọi routeDraw bị chặn ở validate.
      if ((t.routeIndex ?? 0) >= ctx.routeCount) {
        throw new Error(`I: routeDraw routeIndex ${t.routeIndex ?? 0} but config has ${ctx.routeCount} route(s) — reserved for v2`);
      }
    }
    if ((t.kind === 'pinDrop' || t.kind === 'pulse') && (('pointIndex' in t ? (t.pointIndex ?? 0) : 0) >= ctx.pointCount)) {
      throw new Error(`I: ${t.kind} needs a highlight point but config has ${ctx.pointCount}`);
    }
  }
  return s;
}
