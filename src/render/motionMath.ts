// Toán chuyển động thuần — evaluator trang render và compiler cùng dùng.
// Học từ giải phẫu mapeffect (spec §0): nội suy piecewise + jumpTo, KHÔNG flyTo.
import type { CameraKeyframe, EaseId } from './motionScript';

export const EASINGS: Record<EaseId, (t: number) => number> = {
  linear: (t) => t,
  easeInOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOut: (t) => 1 - Math.pow(1 - t, 3),
  expoOut: (t) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t)),
};

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;

/**
 * Cung ngắn nhất giữa hai góc độ — 359°→1° đi qua 0°, không quay 358° ngược.
 * Kết quả LUÔN được chuẩn hoá về [0, 360) — Task 4 evaluator dùng giá trị này
 * trực tiếp làm map bearing nên không được trả về số âm hay ≥360.
 */
export function lerpAngle(a: number, b: number, k: number): number {
  const d = ((b - a + 540) % 360) - 180;
  const result = a + d * k;
  // Normalize to [0, 360) to handle angle wraparound
  return ((result % 360) + 360) % 360;
}

/** Camera tại thời điểm t — clamp ngoài biên, ease của KEYFRAME ĐÍCH mỗi đoạn. */
export function cameraAt(kfs: CameraKeyframe[], t: number): { center: [number, number]; zoom: number; bearing: number } {
  const view = (k: CameraKeyframe) => ({ center: [...k.center] as [number, number], zoom: k.zoom, bearing: k.bearing ?? 0 });
  if (t <= kfs[0].t || kfs.length === 1) return view(kfs[0]);
  const last = kfs[kfs.length - 1];
  if (t >= last.t) return view(last);
  let a = kfs[0];
  let b = kfs[1];
  for (let i = 0; i < kfs.length - 1; i++) {
    if (t >= kfs[i].t && t <= kfs[i + 1].t) {
      a = kfs[i];
      b = kfs[i + 1];
      break;
    }
  }
  const e = EASINGS[b.ease ?? 'easeInOut'](clamp01((t - a.t) / (b.t - a.t)));
  return {
    center: [lerp(a.center[0], b.center[0], e), lerp(a.center[1], b.center[1], e)],
    zoom: lerp(a.zoom, b.zoom, e),
    bearing: lerpAngle(a.bearing ?? 0, b.bearing ?? 0, e),
  };
}

/** Tiến độ một track trong cửa sổ [t0, t1], ease mặc định easeInOut. */
export function trackProgress(t: number, t0: number, t1: number, ease: EaseId = 'easeInOut'): number {
  return EASINGS[ease](clamp01((t - t0) / (t1 - t0)));
}

/**
 * Cắt một vòng khép kín theo tiến độ chiều dài (kỹ thuật sliceLine của mapeffect):
 * p≤0 → null (chưa vẽ gì), p≥1 → nguyên vòng (THAM CHIẾU GỐC — reveal xong trả
 * đúng hình cũ, không sai số tích luỹ). Điểm cuối nội suy trên cạnh đang vẽ dở.
 */
export function sliceRing(ring: [number, number][], p: number): [number, number][] | null {
  if (p <= 0) return null;
  if (p >= 1) return ring;
  const segLens: number[] = [];
  let total = 0;
  for (let i = 1; i < ring.length; i++) {
    const d = Math.hypot(ring[i][0] - ring[i - 1][0], ring[i][1] - ring[i - 1][1]);
    segLens.push(d);
    total += d;
  }
  if (total === 0) return ring;
  let remain = total * p;
  const out: [number, number][] = [ring[0]];
  for (let i = 0; i < segLens.length; i++) {
    if (remain >= segLens[i]) {
      remain -= segLens[i];
      out.push(ring[i + 1]);
      continue;
    }
    const k = segLens[i] === 0 ? 0 : remain / segLens[i];
    out.push([lerp(ring[i][0], ring[i + 1][0], k), lerp(ring[i][1], ring[i + 1][1], k)]);
    break;
  }
  return out.length >= 2 ? out : null;
}

/** Pha pulse ∈ [0,1) tại t — null trước `from`. Export: phase = t (tất định). */
export function pulsePhase(t: number, from: number, periodSec = 1.8): number | null {
  if (t < from) return null;
  const cycles = (t - from) / periodSec;
  const nearest = Math.round(cycles);
  // A whole number of cycles IS phase 0 — but (t - from) rarely divides exactly
  // in binary (3.8 - 2 === 1.7999999999999998), so it reads as 0.999…, which for
  // a sawtooth ripple draws a ring at MAXIMUM radius instead of a fresh one.
  // Tolerance scales with `cycles` because that is where the error accumulates;
  // a fixed absolute epsilon would be far too loose for a small periodSec and
  // could zero out a legitimately near-complete phase (periodSec has no
  // schema-enforced minimum).
  if (Math.abs(cycles - nearest) <= Number.EPSILON * 8 * Math.max(1, Math.abs(cycles))) return 0;
  return cycles - Math.floor(cycles);
}
