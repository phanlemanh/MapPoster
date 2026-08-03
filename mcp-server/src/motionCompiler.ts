// Biên dịch preset → MotionScript từ hình học ĐÃ resolve (spec §4). Compiler sống
// phía server vì keyframe cần toạ độ thật — thứ chỉ có sau resolveConfig.
import { validateMotionScript, type MotionContext, type MotionScript, type MotionTrack } from '../../src/render/motionScript';
import type { RenderConfig } from '../../src/render/renderConfig';

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

const FPS_DEFAULT = 24;

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
    return {
      fps,
      durationSec: APPROACH.dur * k,
      restAtSec: APPROACH.rest * k,
      camera: [
        // Clamped (not floored at MIN_START_ZOOM): a floor above 0 can exceed
        // the target zoom for wide country/continent views, making "approach"
        // start past where it ends (Finding 5) — clamping only at the true
        // schema bounds guarantees start ≤ target for every legal zoom.
        { t: 0, center: [...center], zoom: clampZoom(zoom - APPROACH.zoomOut) },
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
    return {
      fps,
      durationSec: PUSH_IN.dur * k,
      restAtSec: PUSH_IN.rest * k,
      camera: [
        { t: 0, center: [wrapLng(center[0] - lngSpan * 0.15), center[1]], zoom: clampZoom(zoom - PUSH_IN.zoomIn) },
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
