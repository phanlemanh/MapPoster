# Map Motion Clip — Gói 1 (MapPoster) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** MapPoster sinh clip bản đồ chuyển động (MP4 text-free + settle still) qua REST `/render-clip` và MCP tool `render_clip`, theo spec `docs/superpowers/specs/2026-08-03-map-motion-clip-design.md`.

**Architecture:** MotionScript (JSON tất định, 5 bất biến zod) được compiler biên dịch từ 3 preset (`approach`/`pushIn`/`drift`) dựa trên hình học đã resolve. Render-page mở rộng `window.__mapposter` với `renderMotionFrame(t)` — hàm thuần theo thời gian (jumpTo tự nội suy, sliceRing cho reveal, pulse phase=t). Node driver chụp `i/fps` → ffmpeg mp4 (encoder sẵn có). `/render` giữ nguyên từng byte.

**Tech Stack:** TypeScript strict, zod 4, MapLibre GL, Playwright pool (sẵn có), ffmpeg libx264 (sẵn có), Vitest.

## Global Constraints

- `/render` (REST) và mọi tool MCP hiện có: KHÔNG đổi hành vi — mọi thay đổi là additive.
- Clip TEXT-FREE tuyệt đối: đường clip ép `chrome: 'clean'`; lớp chữ duy nhất được phép là `layers.roadLabels` (nhãn OSM). (AC-9)
- Bất biến MotionScript (spec §3): R `restAtSec ≤ 0.72 × durationSec` · O one-shot tracks và keyframe camera cuối kết thúc ≤ `restAtSec` · L `pulse` là loop-track được chạy sau rest · B `fps × durationSec ≤ 288` khung (env `MAPPOSTER_MAX_CLIP_FRAMES`) · I index track phải trỏ vào region/route/point tồn tại trong RenderConfig.
- Trần clip REST: `MAPPOSTER_CLIP_MAX_BYTES` mặc định `12 * 1024 * 1024` — vượt → 422 TRƯỚC khi base64.
- Camera: `map.jumpTo()` mỗi khung, tự nội suy — KHÔNG BAO GIỜ `flyTo`/`easeTo`.
- Không retry nửa clip: page chết giữa dãy → fail sạch cả request (spec §9).
- `src/render/motionScript.ts` và `src/render/motionMath.ts` phải browser-safe: KHÔNG đọc `process.env`; main.tsx chỉ import type từ motionScript (zod không được vào bundle web).
- Repo rules: immutability, không `console.log`, file < 800 dòng, TS strict cả hai tsconfig.
- Mapping AC của spec: AC-1→Task 1 · AC-3→Task 2 · AC-2→Task 3 · AC-5→Task 5 · AC-6→Task 6 · AC-9→Task 6+8 · AC-4→đã thoả bởi `encodeArgs` pure test sẵn có trong `encodeAnimation.test.ts` (tái dùng encoder nguyên trạng, không viết encoder mới).

---

### Task 1: MotionScript schema + 5 bất biến

**Files:**
- Create: `src/render/motionScript.ts`
- Test: `src/render/motionScript.test.ts`

**Interfaces:**
- Consumes: không gì — module lá, chỉ import `zod`.
- Produces (Task 2–7 dùng):
  - `type EaseId = 'linear' | 'easeInOut' | 'easeOut' | 'expoOut'`
  - `interface CameraKeyframe { t: number; center: [number, number]; zoom: number; bearing?: number; ease?: EaseId }`
  - `type MotionTrack = { kind:'regionReveal'; t0:number; t1:number; regionIndex?:number; ease?:EaseId } | { kind:'routeDraw'; t0:number; t1:number; routeIndex?:number } | { kind:'pinDrop'; at:number; dur?:number; pointIndex?:number } | { kind:'pulse'; from:number; periodSec?:number; rings?:number }`
  - `interface MotionScript { fps:number; durationSec:number; restAtSec:number; camera:CameraKeyframe[]; tracks:MotionTrack[] }`
  - `interface MotionContext { regionCount:number; routeCount:number; pointCount:number; maxFrames?:number }`
  - `const DEFAULT_MAX_CLIP_FRAMES = 288`
  - `const REST_RATIO = 0.72`
  - `function validateMotionScript(value: unknown, ctx: MotionContext): MotionScript` — throw `Error` có message bắt đầu bằng tên luật vỡ (`'R:'`/`'O:'`/`'L:'`/`'B:'`/`'I:'`), trả script đã parse khi hợp lệ.

- [ ] **Step 1: Viết test fail**

```ts
// src/render/motionScript.test.ts
import { describe, it, expect } from 'vitest';
import { validateMotionScript, DEFAULT_MAX_CLIP_FRAMES, REST_RATIO, type MotionScript } from './motionScript';

const CTX = { regionCount: 1, routeCount: 0, pointCount: 1 };

/** Script hợp lệ tối thiểu — mỗi test vi phạm bẻ đúng MỘT luật từ đây. */
const base: MotionScript = {
  fps: 24,
  durationSec: 6,
  restAtSec: 4.2,
  camera: [
    { t: 0, center: [106.7, 10.78], zoom: 11 },
    { t: 2.6, center: [106.7, 10.78], zoom: 14.5, ease: 'easeInOut' },
  ],
  tracks: [
    { kind: 'regionReveal', t0: 1.8, t1: 3.2 },
    { kind: 'pinDrop', at: 3.5, dur: 0.5 },
    { kind: 'pulse', from: 2.6, periodSec: 1.8, rings: 2 },
  ],
};

describe('validateMotionScript', () => {
  it('accepts a valid script and returns it parsed', () => {
    expect(validateMotionScript(base, CTX)).toMatchObject({ fps: 24, restAtSec: 4.2 });
  });

  it('R: rejects restAtSec beyond 0.72×duration — and accepts the exact boundary', () => {
    expect(() => validateMotionScript({ ...base, restAtSec: 4.33 }, CTX)).toThrow(/^R:/);
    // đúng biên 0.72×6 = 4.32 phải PASS (camera/tracks đều ≤ 4.2 < 4.32)
    expect(() => validateMotionScript({ ...base, restAtSec: 6 * REST_RATIO }, CTX)).not.toThrow();
  });

  it('O: rejects a one-shot track ending after restAtSec', () => {
    const tracks = [{ kind: 'regionReveal', t0: 1, t1: 4.5 }];
    expect(() => validateMotionScript({ ...base, tracks }, CTX)).toThrow(/^O:/);
  });

  it('O: rejects pinDrop whose at+dur crosses restAtSec', () => {
    const tracks = [{ kind: 'pinDrop', at: 4.0, dur: 0.5 }];
    expect(() => validateMotionScript({ ...base, tracks }, CTX)).toThrow(/^O:/);
  });

  it('O: rejects a camera keyframe after restAtSec', () => {
    const camera = [...base.camera, { t: 5.0, center: [106.7, 10.78] as [number, number], zoom: 15 }];
    expect(() => validateMotionScript({ ...base, camera }, CTX)).toThrow(/^O:/);
  });

  it('O: rejects camera keyframes out of order', () => {
    const camera = [base.camera[1], base.camera[0]];
    expect(() => validateMotionScript({ ...base, camera }, CTX)).toThrow(/^O:/);
  });

  it('L: pulse MAY run past restAtSec (loop track)', () => {
    const tracks = [{ kind: 'pulse', from: 4.0 }];
    expect(() => validateMotionScript({ ...base, tracks }, CTX)).not.toThrow();
  });

  it('L: rejects pulse starting at/after the end of the clip', () => {
    const tracks = [{ kind: 'pulse', from: 6 }];
    expect(() => validateMotionScript({ ...base, tracks }, CTX)).toThrow(/^L:/);
  });

  it('B: rejects fps×duration over the frame budget — boundary passes', () => {
    expect(() => validateMotionScript({ ...base, fps: 30, durationSec: 10 }, CTX)).toThrow(/^B:/); // 300 > 288
    // restAtSec phải hợp lệ với duration mới: 12×0.72=8.64 ≥ 4.2 ✓; 24×12=288 đúng biên
    expect(() => validateMotionScript({ ...base, fps: 24, durationSec: 12 }, CTX)).not.toThrow();
    expect(() => validateMotionScript({ ...base, fps: 30, durationSec: 10 }, { ...CTX, maxFrames: 300 })).not.toThrow();
  });

  it('I: rejects a regionIndex outside the config', () => {
    const tracks = [{ kind: 'regionReveal', t0: 1, t1: 3, regionIndex: 1 }];
    expect(() => validateMotionScript({ ...base, tracks }, CTX)).toThrow(/^I:/);
  });

  it('I: rejects routeDraw when the config carries no routes (reserved for v2)', () => {
    const tracks = [{ kind: 'routeDraw', t0: 1, t1: 3 }];
    expect(() => validateMotionScript({ ...base, tracks }, CTX)).toThrow(/^I:/);
  });

  it('I: rejects pinDrop/pulse when there are no points', () => {
    expect(() => validateMotionScript(base, { ...CTX, pointCount: 0 })).toThrow(/^I:/);
  });

  it('rejects malformed input (zod layer): fps/duration out of range, empty camera', () => {
    expect(() => validateMotionScript({ ...base, fps: 8 }, CTX)).toThrow();
    expect(() => validateMotionScript({ ...base, durationSec: 1 }, CTX)).toThrow();
    expect(() => validateMotionScript({ ...base, camera: [] }, CTX)).toThrow();
  });

  it('exports the documented defaults', () => {
    expect(DEFAULT_MAX_CLIP_FRAMES).toBe(288);
    expect(REST_RATIO).toBe(0.72);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/render/motionScript.test.ts`
Expected: FAIL — "Cannot find module './motionScript'"

- [ ] **Step 3: Implement**

```ts
// src/render/motionScript.ts
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
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npx vitest run src/render/motionScript.test.ts`
Expected: PASS toàn bộ

- [ ] **Step 5: Typecheck + commit**

```bash
npx tsc -b && npx tsc -p mcp-server/tsconfig.json
git add src/render/motionScript.ts src/render/motionScript.test.ts
git commit -m "feat(motion): MotionScript schema + 5 bất biến R/O/L/B/I (AC-1)"
```

---

### Task 2: Motion math — nội suy camera, ease, sliceRing, tiến độ track

**Files:**
- Create: `src/render/motionMath.ts`
- Test: `src/render/motionMath.test.ts`

**Interfaces:**
- Consumes: `import type { CameraKeyframe, EaseId, MotionScript, MotionTrack } from './motionScript'` (type-only — module này browser-safe, không zod).
- Produces (Task 4 evaluator + Task 3 compiler test dùng):
  - `const EASINGS: Record<EaseId, (t: number) => number>`
  - `function lerpAngle(a: number, b: number, k: number): number` — cung ngắn nhất
  - `function cameraAt(kfs: CameraKeyframe[], t: number): { center: [number, number]; zoom: number; bearing: number }`
  - `function trackProgress(t: number, t0: number, t1: number, ease?: EaseId): number` — clamp [0,1] rồi ease
  - `function sliceRing(ring: [number, number][], p: number): [number, number][] | null` — null khi p≤0, nguyên vòng khi p≥1
  - `function pulsePhase(t: number, from: number, periodSec?: number): number | null` — null khi t < from; ∈ [0,1)

- [ ] **Step 1: Viết test fail**

```ts
// src/render/motionMath.test.ts
import { describe, it, expect } from 'vitest';
import { EASINGS, lerpAngle, cameraAt, trackProgress, sliceRing, pulsePhase } from './motionMath';
import type { CameraKeyframe } from './motionScript';

describe('EASINGS', () => {
  it('all easings pin 0→0 and 1→1', () => {
    for (const e of Object.values(EASINGS)) {
      expect(e(0)).toBeCloseTo(0, 6);
      expect(e(1)).toBeCloseTo(1, 6);
    }
  });
});

describe('lerpAngle', () => {
  it('takes the short arc across 360: 359°→1° passes through 0, not 180', () => {
    expect(lerpAngle(359, 1, 0.5)).toBeCloseTo(0, 6);
  });
  it('interpolates plainly when no wrap is involved', () => {
    expect(lerpAngle(10, 30, 0.5)).toBeCloseTo(20, 6);
  });
});

describe('cameraAt', () => {
  const kfs: CameraKeyframe[] = [
    { t: 0, center: [100, 10], zoom: 10 },
    { t: 2, center: [102, 12], zoom: 14, ease: 'linear' },
  ];
  it('clamps before the first and after the last keyframe', () => {
    expect(cameraAt(kfs, -1).zoom).toBe(10);
    expect(cameraAt(kfs, 99).zoom).toBe(14);
  });
  it('interpolates linearly at the midpoint under linear ease', () => {
    const v = cameraAt(kfs, 1);
    expect(v.center[0]).toBeCloseTo(101, 6);
    expect(v.zoom).toBeCloseTo(12, 6);
  });
  it("uses the SEGMENT-END keyframe's ease (default easeInOut)", () => {
    const eased = cameraAt([kfs[0], { ...kfs[1], ease: undefined }], 0.5);
    // easeInOut(0.25) = 4·0.25³ = 0.0625 → zoom 10 + 4·0.0625
    expect(eased.zoom).toBeCloseTo(10.25, 6);
  });
  it('a single keyframe is a constant camera', () => {
    expect(cameraAt([kfs[0]], 5).center).toEqual([100, 10]);
  });
});

describe('trackProgress', () => {
  it('clamps outside the window and eases inside it', () => {
    expect(trackProgress(0, 1, 3)).toBe(0);
    expect(trackProgress(4, 1, 3)).toBe(1);
    expect(trackProgress(2, 1, 3, 'linear')).toBeCloseTo(0.5, 6);
  });
});

describe('sliceRing', () => {
  // hình vuông đơn vị, chu vi 4 — mỗi cạnh dài 1
  const ring: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
  it('p≤0 → null, p≥1 → the full ring untouched', () => {
    expect(sliceRing(ring, 0)).toBeNull();
    expect(sliceRing(ring, 1)).toEqual(ring);
  });
  it('p=0.5 cuts halfway round with an interpolated end point', () => {
    const half = sliceRing(ring, 0.5)!;
    expect(half[0]).toEqual([0, 0]);
    expect(half[half.length - 1][0]).toBeCloseTo(1, 6);
    expect(half[half.length - 1][1]).toBeCloseTo(1, 6); // 2/4 chu vi = hết cạnh thứ hai
  });
  it('p=0.375 ends mid-edge', () => {
    const part = sliceRing(ring, 0.375)!;
    expect(part[part.length - 1][0]).toBeCloseTo(1, 6);
    expect(part[part.length - 1][1]).toBeCloseTo(0.5, 6);
  });
});

describe('pulsePhase', () => {
  it('null before `from`, cyclic afterwards', () => {
    expect(pulsePhase(1, 2)).toBeNull();
    expect(pulsePhase(2, 2, 1.8)).toBeCloseTo(0, 6);
    expect(pulsePhase(2.9, 2, 1.8)).toBeCloseTo(0.5, 6);
    expect(pulsePhase(3.8, 2, 1.8)).toBeCloseTo(0, 6);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run src/render/motionMath.test.ts`
Expected: FAIL — module chưa tồn tại

- [ ] **Step 3: Implement**

```ts
// src/render/motionMath.ts
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

/** Cung ngắn nhất giữa hai góc độ — 359°→1° đi qua 0°, không quay 358° ngược. */
export function lerpAngle(a: number, b: number, k: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * k;
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
  return ((t - from) % periodSec) / periodSec;
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npx vitest run src/render/motionMath.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/render/motionMath.ts src/render/motionMath.test.ts
git commit -m "feat(motion): motion math — cameraAt/lerpAngle/sliceRing/pulsePhase (AC-3)"
```

---

### Task 3: Compiler 3 preset

**Files:**
- Create: `mcp-server/src/motionCompiler.ts`
- Test: `mcp-server/src/motionCompiler.test.ts`

**Interfaces:**
- Consumes: `validateMotionScript`, `type MotionScript`, `REST_RATIO` từ `../../src/render/motionScript`; `type RenderConfig` từ `../../src/render/renderConfig`.
- Produces (Task 6, 7 dùng):
  - `type MotionPreset = 'approach' | 'pushIn' | 'drift'`
  - `interface PresetOverrides { fps?: number; durationSec?: number }`
  - `function motionContextOf(cfg: RenderConfig, maxFrames?: number): MotionContext` — `{ regionCount: cfg.highlight?.regions.length ?? 0, routeCount: 0, pointCount: cfg.markers?.length ?? 0, maxFrames }`
  - `function compileMotion(preset: MotionPreset, cfg: RenderConfig, overrides?: PresetOverrides, maxFrames?: number): MotionScript` — throw `Error('preset approach needs highlight.regions')` / `Error('preset pushIn needs a highlight point')` khi thiếu tư liệu. **Kết quả LUÔN qua validateMotionScript trước khi trả.**

- [ ] **Step 1: Viết test fail**

```ts
// mcp-server/src/motionCompiler.test.ts
import { describe, it, expect } from 'vitest';
import { compileMotion, motionContextOf, type MotionPreset } from './motionCompiler';
import { validateMotionScript } from '../../src/render/motionScript';
import type { RenderConfig } from '../../src/render/renderConfig';

const SQUARE = {
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
};

function cfg(over: Partial<RenderConfig> = {}): RenderConfig {
  return {
    camera: { center: [106.7, 10.78], zoom: 14.5 },
    size: { width: 1080, height: 1920 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'Test', country: 'Vietnam', lat: 10.78, lng: 106.7 },
    highlight: { regions: [{ geojson: SQUARE, color: null }], color: null, fill: true, dim: false },
    markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 42 }],
    ...over,
  };
}

describe('compileMotion', () => {
  it('every preset self-validates against its own invariants (AC-2)', () => {
    for (const p of ['approach', 'pushIn', 'drift'] as MotionPreset[]) {
      const s = compileMotion(p, cfg());
      // validate lại từ ngoài — compiler không được sinh script mà validator từ chối
      expect(() => validateMotionScript(s, motionContextOf(cfg()))).not.toThrow();
    }
  });

  it('approach: wide→fit flight ends at the resolved camera, region reveal + pin', () => {
    const s = compileMotion('approach', cfg());
    expect(s.durationSec).toBe(6);
    expect(s.restAtSec).toBeCloseTo(4.2, 6);
    expect(s.camera[0].zoom).toBeLessThan(s.camera[s.camera.length - 1].zoom);
    expect(s.camera[s.camera.length - 1].zoom).toBe(14.5);
    expect(s.tracks.map((t) => t.kind)).toEqual(['regionReveal', 'pinDrop']);
  });

  it('approach without regions throws a material error', () => {
    expect(() => compileMotion('approach', cfg({ highlight: undefined }))).toThrow(/approach needs highlight\.regions/);
  });

  it('approach without markers still compiles (reveal-only)', () => {
    const s = compileMotion('approach', cfg({ markers: [] }));
    expect(s.tracks.map((t) => t.kind)).toEqual(['regionReveal']);
  });

  it('pushIn: needs a point; offsets the start centre; pulse loops past rest', () => {
    const s = compileMotion('pushIn', cfg());
    expect(s.durationSec).toBe(5.5);
    expect(s.camera[0].center[0]).not.toBeCloseTo(s.camera[1].center[0], 6);
    const pulse = s.tracks.find((t) => t.kind === 'pulse');
    expect(pulse).toBeDefined();
    expect(() => compileMotion('pushIn', cfg({ markers: [] }))).toThrow(/pushIn needs a highlight point/);
  });

  it('drift: camera-only glide; regionReveal appears only when regions exist', () => {
    expect(compileMotion('drift', cfg({ highlight: undefined, markers: [] })).tracks).toEqual([]);
    expect(compileMotion('drift', cfg()).tracks.map((t) => t.kind)).toEqual(['regionReveal']);
  });

  it('durationSec override scales every timestamp proportionally and keeps invariant R', () => {
    const s = compileMotion('approach', cfg(), { durationSec: 3 });
    expect(s.durationSec).toBe(3);
    expect(s.restAtSec).toBeCloseTo(2.1, 6); // 4.2 × (3/6)
    expect(s.camera[s.camera.length - 1].t).toBeCloseTo(1.3, 6); // 2.6 × 0.5
    expect(() => validateMotionScript(s, motionContextOf(cfg()))).not.toThrow();
  });

  it('fps override flows through and still respects the frame budget', () => {
    expect(compileMotion('drift', cfg(), { fps: 12 }).fps).toBe(12);
  });
});
```

- [ ] **Step 2: Chạy test, xác nhận FAIL**

Run: `npx vitest run mcp-server/src/motionCompiler.test.ts`
Expected: FAIL — module chưa tồn tại

- [ ] **Step 3: Implement**

```ts
// mcp-server/src/motionCompiler.ts
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
const MIN_START_ZOOM = 6;

/** Mốc thời gian chuẩn của mỗi preset (spec §4 storyboard) — scale theo durationSec override. */
const APPROACH = { dur: 6, rest: 4.2, arrive: 2.6, reveal0: 1.8, reveal1: 3.2, pin: 3.5, pinDur: 0.5, zoomOut: 3.5 };
const PUSH_IN = { dur: 5.5, rest: 3.9, arrive: 2.4, pin: 0.9, pinDur: 0.5, pulseFrom: 2.6, period: 1.8, rings: 2, zoomIn: 1.8 };
const DRIFT = { dur: 6, rest: 4.2, reveal0: 1.5, reveal1: 3.0, zoomDelta: 0.35 };

function compile(preset: MotionPreset, cfg: RenderConfig, o?: PresetOverrides): MotionScript {
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
        { t: 0, center: [...center], zoom: Math.max(zoom - APPROACH.zoomOut, MIN_START_ZOOM) },
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
        { t: 0, center: [center[0] - lngSpan * 0.15, center[1]], zoom: zoom - PUSH_IN.zoomIn },
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
      { t: 0, center: [...center], zoom: zoom - DRIFT.zoomDelta },
      { t: DRIFT.rest * k, center: [...center], zoom: zoom + DRIFT.zoomDelta, ease: 'easeInOut' },
    ],
    tracks,
  };
}

/** Compiler KHÔNG BAO GIỜ được sinh script mà validator của chính nó từ chối (AC-2). */
export function compileMotion(preset: MotionPreset, cfg: RenderConfig, overrides?: PresetOverrides, maxFrames?: number): MotionScript {
  return validateMotionScript(compile(preset, cfg, overrides), motionContextOf(cfg, maxFrames));
}
```

- [ ] **Step 4: Chạy test, xác nhận PASS**

Run: `npx vitest run mcp-server/src/motionCompiler.test.ts`
Expected: PASS

- [ ] **Step 5: Typecheck cả hai project + commit**

```bash
npx tsc -b && npx tsc -p mcp-server/tsconfig.json
git add mcp-server/src/motionCompiler.ts mcp-server/src/motionCompiler.test.ts
git commit -m "feat(motion): compiler 3 preset approach/pushIn/drift (AC-2)"
```

---

### Task 4: Evaluator phía trang render — `renderMotionFrame` + `prefetchMotion`

**Files:**
- Modify: `src/render/renderConfig.ts` (thêm field `motion`)
- Modify: `src/render/main.tsx` (API mới trên `window.__mapposter`)
- Test: `e2e/render-mode.spec.ts` (thêm 1 test Playwright — trang render chạy thật, không cần MCP server)

**Interfaces:**
- Consumes: `cameraAt`, `trackProgress`, `sliceRing`, `pulsePhase` từ `./motionMath`; `import type { MotionScript } from './motionScript'` (type-only); `composeOverlays`, `snapshotMap` từ `../lib/export` (sẵn có); source MapLibre id **`highlight`** + layer **`highlight-fill`** (tên thật trong `src/lib/mapStyle.ts`).
- Produces (Task 5 dùng qua `page.evaluate`):
  - `RenderConfig.motion?: MotionScript` — additive, đường `renderFrame()` cũ bỏ qua nó.
  - `window.__mapposter.renderMotionFrame(tSec: number, opts?: { pulsePhase?: number }): Promise<{ dataUrl: string; width: number; height: number }>`
  - `window.__mapposter.prefetchMotion(): Promise<void>` — bay lướt các keyframe nạp tile cache, best-effort.

- [ ] **Step 1: Thêm field vào RenderConfig**

```ts
// src/render/renderConfig.ts — thêm import và field (additive):
import type { MotionScript } from './motionScript';
// ... trong interface RenderConfig, sau `markers?`:
  /** Kịch bản chuyển động cho clip — renderFrame() tĩnh bỏ qua field này. */
  motion?: MotionScript;
```

- [ ] **Step 2: Viết test Playwright fail**

Thêm vào `e2e/render-mode.spec.ts` (giữ nguyên test hiện có; dùng đúng mẫu dựng URL `?config=<base64url>` inline của file đó — đọc helper encode sẵn có trong file trước khi viết):

```ts
test('motion: renderMotionFrame is a pure function of t — same t twice = same pixels, rest ≠ start', async ({ page }) => {
  const config = {
    camera: { center: [106.7, 10.78], zoom: 13 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    highlight: {
      regions: [{ geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.69, 10.77], [106.71, 10.77], [106.71, 10.79], [106.69, 10.79], [106.69, 10.77]]] } }] }, color: null }],
      color: null, fill: true, dim: false,
    },
    markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }],
    motion: {
      fps: 12, durationSec: 2, restAtSec: 1.4,
      camera: [
        { t: 0, center: [106.7, 10.78], zoom: 11.5 },
        { t: 1.1, center: [106.7, 10.78], zoom: 13, ease: 'easeInOut' },
      ],
      tracks: [
        { kind: 'regionReveal', t0: 0.4, t1: 1.0 },
        { kind: 'pinDrop', at: 1.1, dur: 0.3 },
      ],
    },
  };
  await page.goto(renderUrl(config)); // dùng helper encode base64url sẵn có của file này
  await page.waitForFunction(() => Boolean(window.__mapposter));
  const [a, b, rest] = await page.evaluate(async () => {
    const api = window.__mapposter!;
    await api.ready;
    const f0a = await api.renderMotionFrame(0.5);
    const f0b = await api.renderMotionFrame(0.5);
    const fr = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    return [f0a.dataUrl, f0b.dataUrl, fr.dataUrl];
  });
  expect(a).toBe(b);        // thuần theo t — hai lần cùng t, cùng pixel
  expect(rest).not.toBe(a); // trạng thái nghỉ khác khung giữa chuyến bay
});
```

- [ ] **Step 3: Chạy test, xác nhận FAIL**

Run: `npx playwright test e2e/render-mode.spec.ts`
Expected: FAIL — `renderMotionFrame is not a function`

- [ ] **Step 4: Implement trong main.tsx**

```ts
// src/render/main.tsx — thêm import:
import { cameraAt, trackProgress, sliceRing, pulsePhase } from './motionMath';
import type { GeoJSONFeatureCollection } from '../types';

// Mở rộng interface MapPosterApi (cạnh renderAnimationFrame):
  /** Một khung motion tại tSec — HÀM THUẦN theo thời gian: jumpTo + reveal + overlay. */
  renderMotionFrame(tSec: number, opts?: { pulsePhase?: number }): Promise<{ dataUrl: string; width: number; height: number }>;
  /** Bay lướt keyframe nạp tile cache trước khi chụp thật — best-effort. */
  prefetchMotion(): Promise<void>;

// Thêm state cạnh `animBase` (giữ nguyên animBase cho renderAnimationFrame cũ):
/** snapshot tại TRẠNG THÁI NGHỈ — tái dùng cho các khung đuôi (chỉ pulse đổi) */
let restBase: HTMLCanvasElement | null = null;

/** FeatureCollection ranh giới đã cắt theo tiến độ reveal — LineString khi đang
 * vẽ dở (fill layer không tô được đường hở, đúng ý), polygon gốc khi khép vòng. */
function revealFC(full: GeoJSONFeatureCollection, p: number): GeoJSONFeatureCollection {
  if (p >= 1) return full;
  const feats = [];
  for (const f of full.features) {
    if (!f.geometry) continue;
    const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [];
    for (const poly of polys) {
      const sliced = sliceRing(poly[0] as [number, number][], p);
      if (sliced) feats.push({ type: 'Feature' as const, properties: f.properties ?? {}, geometry: { type: 'LineString' as const, coordinates: sliced } });
    }
  }
  return { type: 'FeatureCollection', features: feats };
}

/** Áp trạng thái địa lý tại tClamped vào map (nguồn highlight + opacity fill). */
function applyGeoAt(map: MlMap, tClamped: number): void {
  const motion = cfg.motion!;
  const reveal = motion.tracks.find((t) => t.kind === 'regionReveal');
  if (!reveal || reveal.kind !== 'regionReveal' || !cfg.highlight?.regions.length) return;
  const src = map.getSource('highlight') as { setData(d: unknown): void } | undefined;
  if (!src) return;
  const full = cfg.highlight.regions[reveal.regionIndex ?? 0].geojson;
  const p = trackProgress(tClamped, reveal.t0, reveal.t1, reveal.ease);
  src.setData(p >= 1 ? (fullHighlightData(map) ?? full) : revealFC(full, p));
  // fill chỉ hiện khi vòng đã khép (spec §4: "vòng khép, fill mờ vào")
  if (map.getLayer('highlight-fill')) map.setPaintProperty('highlight-fill', 'fill-opacity', p >= 1 ? 0.26 : 0);
}

// LƯU Ý implementer: buildMapStyle gộp MỌI region vào một FeatureCollection có
// property `color` từng feature (src/lib/mapStyle.ts, source 'highlight'). Khi
// p>=1 phải restore ĐÚNG dữ liệu gộp đó chứ không phải geojson của một region.
// Viết helper fullHighlightData(map): dựng lại combined FC y hệt mapStyle (tag
// color) từ cfg.highlight — đặt cạnh applyGeoAt, ~15 dòng, thuần.

// Thêm hai method vào object window.__mapposter:
  async renderMotionFrame(tSec, opts) {
    await ready;
    const motion = cfg.motion;
    if (!motion) throw new Error('render mode: config has no motion script');
    const map = getMapInstance();
    if (!map) throw new Error('render mode: no map');
    const tClamped = Math.min(tSec, motion.restAtSec);
    const atRest = tSec >= motion.restAtSec;
    if (!atRest || !restBase) {
      map.jumpTo(cameraAt(motion.camera, tClamped));
      applyGeoAt(map, tClamped);
      await idleOnce(map);
      const snap = await snapshotMap(map, cfg.size.width, cfg.size.height);
      if (atRest) restBase = snap; // đuôi clip: camera đứng, chỉ pulse đổi → tái dùng
      else restBase = null;
      return composeMotionOverlay(map, snap, motion, tSec, opts);
    }
    return composeMotionOverlay(map, restBase, motion, tSec, opts);
  },
  async prefetchMotion() {
    await ready;
    const motion = cfg.motion;
    const map = getMapInstance();
    if (!motion || !map) return;
    for (const kf of motion.camera) {
      map.jumpTo({ center: kf.center, zoom: kf.zoom, bearing: kf.bearing ?? 0 });
      await idleOnce(map).catch(() => {}); // best-effort — lỗi prefetch không phải lỗi render
    }
  },

// Helper composite (đặt cạnh textFromStore) — pinDrop scale-in + pulse phase=t:
async function composeMotionOverlay(
  map: MlMap,
  base: HTMLCanvasElement,
  motion: NonNullable<RenderConfig['motion']>,
  tSec: number,
  opts?: { pulsePhase?: number },
) {
  const pin = motion.tracks.find((t) => t.kind === 'pinDrop');
  const pulse = motion.tracks.find((t) => t.kind === 'pulse');
  const markers = usePosterStore.getState().markers.map((m) => {
    if (!pin || pin.kind !== 'pinDrop') return m;
    const k = trackProgress(tSec, pin.at, pin.at + (pin.dur ?? 0.5), 'expoOut');
    return { ...m, size: m.size * k };
  }).filter((m) => m.size >= 1);
  const phase = pulse && pulse.kind === 'pulse'
    ? (opts?.pulsePhase ?? pulsePhase(tSec, pulse.from, pulse.periodSec))
    : null;
  const canvas = await composeOverlays(map, base, {
    width: cfg.size.width,
    height: cfg.size.height,
    markers,
    text: textFromStore(), // chrome='clean' ⇒ show:false — không chữ nào được vẽ
    ...(phase !== null ? { pulse: { t: phase, rings: pulse && pulse.kind === 'pulse' ? pulse.rings : undefined } } : {}),
  });
  return { dataUrl: canvas.toDataURL('image/png'), width: cfg.size.width, height: cfg.size.height };
}
```

- [ ] **Step 5: Chạy test, xác nhận PASS + soát bundle**

Run: `npx playwright test e2e/render-mode.spec.ts`
Expected: PASS (cả test cũ lẫn test motion mới)

Run: `npx vite build && grep -l "zod" dist/assets/render-*.js || echo "zod NOT in render bundle (đúng)"`
Expected: `zod NOT in render bundle (đúng)` — motionScript chỉ được import type.

- [ ] **Step 6: Commit**

```bash
git add src/render/renderConfig.ts src/render/main.tsx e2e/render-mode.spec.ts
git commit -m "feat(motion): renderMotionFrame + prefetchMotion trên trang render — hàm thuần theo t"
```

---

### Task 5: Node driver `renderClipFrames` + integration test

**Files:**
- Modify: `mcp-server/src/renderFrame.ts` (thêm hàm — giữ nguyên `renderFrame`/`renderAnimationFrames`)
- Modify: `package.json` (thêm file vào script `test:mcp`)
- Test: `mcp-server/src/renderClip.test.ts` (gated `MCP_INTEGRATION=1` — mở `mcp-server/src/renderFrame.test.ts` xem đúng mẫu gate + cách dựng `RenderDeps` thật rồi copy nguyên khuôn)

**Interfaces:**
- Consumes: `RenderDeps` (sẵn có), `window.__mapposter.renderMotionFrame`/`prefetchMotion` (Task 4), `type MotionScript`.
- Produces (Task 6, 7 dùng):
  - `interface ClipFrames { frames: Buffer[]; settle: Buffer }`
  - `async function renderClipFrames(config: RenderConfig, deps: RenderDeps): Promise<ClipFrames>` — `config.motion` bắt buộc (throw nếu vắng); frames.length = `round(fps × durationSec)`; settle render tại `restAtSec` với `pulsePhase: 0`.

- [ ] **Step 1: Viết integration test**

```ts
// mcp-server/src/renderClip.test.ts — copy nguyên khuôn describe.skipIf(!process.env.MCP_INTEGRATION)
// và cách dựng deps (appServer + pool + configStore) từ renderFrame.test.ts, rồi:
const SQUARE = { /* FeatureCollection vuông nhỏ như Task 3 */ };
const config: RenderConfig = {
  camera: { center: [106.7, 10.78], zoom: 13 },
  size: { width: 320, height: 568 },
  theme: 'midnight-blue',
  chrome: 'clean',
  place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
  highlight: { regions: [{ geojson: SQUARE, color: null }], color: null, fill: true, dim: false },
  markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 }],
  motion: {
    fps: 12, durationSec: 2, restAtSec: 1.4,
    camera: [{ t: 0, center: [106.7, 10.78], zoom: 11.5 }, { t: 1.1, center: [106.7, 10.78], zoom: 13, ease: 'easeInOut' }],
    tracks: [{ kind: 'regionReveal', t0: 0.4, t1: 1.0 }, { kind: 'pinDrop', at: 1.1, dur: 0.3 }],
  },
};

it('renders fps×duration frames plus a settle still (AC-5)', async () => {
  const { frames, settle } = await renderClipFrames(config, deps);
  expect(frames).toHaveLength(24); // 12 × 2
  for (const f of frames) expect(f.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])); // PNG magic
  expect(settle.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  // khung đầu (bay) khác khung chót (nghỉ)
  expect(frames[0].equals(frames[frames.length - 1])).toBe(false);
}, 120_000);

it('is deterministic — the same config twice yields byte-identical frames (AC-5)', async () => {
  const a = await renderClipFrames(config, deps);
  const b = await renderClipFrames(config, deps);
  expect(a.frames.length).toBe(b.frames.length);
  for (let i = 0; i < a.frames.length; i++) {
    expect(a.frames[i].equals(b.frames[i]), `frame ${i}`).toBe(true);
  }
  expect(a.settle.equals(b.settle)).toBe(true);
}, 240_000);

it('throws a clear error when config has no motion script', async () => {
  await expect(renderClipFrames({ ...config, motion: undefined }, deps)).rejects.toThrow(/no motion/i);
});
```

- [ ] **Step 2: Chạy, xác nhận FAIL**

Run: `MCP_INTEGRATION=1 npx vitest run --fileParallelism=false mcp-server/src/renderClip.test.ts`
Expected: FAIL — `renderClipFrames` chưa tồn tại

- [ ] **Step 3: Implement trong renderFrame.ts**

```ts
// mcp-server/src/renderFrame.ts — thêm sau renderAnimationFrames:
export interface ClipFrames {
  frames: Buffer[];
  settle: Buffer;
}

const PNG_PREFIX = /^data:image\/png;base64,/;

/**
 * Chụp trọn một MotionScript từ MỘT lần load trang: prefetch tile theo đường bay
 * (best-effort), rồi mỗi khung là renderMotionFrame(i/fps) — hàm thuần theo t.
 * Settle chụp tại restAtSec với pulsePhase=0 (vòng pulse ở cực tiểu — spec §3).
 * KHÔNG retry nửa clip: page hỏng giữa dãy → fail cả request (spec §9), vì tile
 * cache của lần chạy lại khác lần đầu — ghép dãy là mở cửa phi-tất-định.
 */
export async function renderClipFrames(config: RenderConfig, deps: RenderDeps): Promise<ClipFrames> {
  const motion = config.motion;
  if (!motion) throw new Error('renderClipFrames: config has no motion script');
  const page = await deps.pool.acquire();
  const key = deps.configStore.put(JSON.stringify(config));
  let broken = false;
  try {
    await page.goto(`${deps.appUrl}/render.html?configId=${key}`, { waitUntil: 'load' });
    await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 20_000 });
    const loadedKey = await page.evaluate(() => (window as unknown as { __mapposter: { configKey: string } }).__mapposter.configKey);
    if (loadedKey !== key) throw new Error('render mode: page did not reload with the requested config (stale page)');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.evaluate(async () => { await (window as any).__mapposter.prefetchMotion(); }).catch(() => {});

    const total = Math.round(motion.fps * motion.durationSec);
    const frames: Buffer[] = [];
    for (let i = 0; i < total; i++) {
      const dataUrl: string = await page.evaluate(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        async (t: number) => (await (window as any).__mapposter.renderMotionFrame(t)).dataUrl,
        i / motion.fps,
      );
      frames.push(Buffer.from(dataUrl.replace(PNG_PREFIX, ''), 'base64'));
    }
    const settleUrl: string = await page.evaluate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (t: number) => (await (window as any).__mapposter.renderMotionFrame(t, { pulsePhase: 0 })).dataUrl,
      motion.restAtSec,
    );
    return { frames, settle: Buffer.from(settleUrl.replace(PNG_PREFIX, ''), 'base64') };
  } catch (e) {
    broken = true;
    deps.pool.discard(page);
    throw e;
  } finally {
    deps.configStore.drop(key);
    if (!broken) deps.pool.release(page);
  }
}
```

Trong `package.json`, sửa script `test:mcp` thành:

```
"test:mcp": "MCP_INTEGRATION=1 vitest run --fileParallelism=false mcp-server/src/renderFrame.test.ts mcp-server/src/renderClip.test.ts mcp-server/src/stdioChannel.test.ts",
```

- [ ] **Step 4: Chạy integration, xác nhận PASS — GHI LẠI số đo**

Run: `npm run test:mcp`
Expected: PASS. **Ghi vào commit message: thời gian render 24 khung** (số đo này quyết định fps mặc định — spec §3 "Không đoán — đo").

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/renderFrame.ts mcp-server/src/renderClip.test.ts package.json
git commit -m "feat(motion): renderClipFrames — chụp dãy khung + settle, tất định (AC-5). Đo: <X>s/24 khung"
```

---

### Task 6: REST `POST /render-clip`

**Files:**
- Modify: `mcp-server/src/http.ts`
- Modify: `mcp-server/src/tools.ts` (thêm `renderClip`/`encodeAnimation` vào `ToolDeps` nếu chưa có + schema `motionParam`)
- Modify: `mcp-server/src/deps.ts` (bind `renderClipFrames` — mở file xem mẫu bind `renderAnimation` sẵn có rồi thêm y hệt)
- Modify: `mcp-server/config.ts` (thêm 2 env qua `envNumber` — xem mẫu `DEFAULT_MAX_BODY_BYTES`)
- Test: `mcp-server/src/http.test.ts` (thêm describe mới — xem mẫu inject fake `deps.render` sẵn có trong file)

**Interfaces:**
- Consumes: `resolveConfig`, `resolvedOf`, `readJsonBody`, `PayloadTooLargeError`, `compileMotion`, `motionContextOf`, `validateMotionScript`, `renderClipFrames` (qua `deps.renderClip`), `deps.encodeAnimation` (sẵn có trong ToolDeps).
- Produces:
  - `ToolDeps.renderClip?: (config: RenderConfig) => Promise<{ frames: Buffer[]; settle: Buffer }>`
  - Env: `MAPPOSTER_CLIP_MAX_BYTES` (default `12_582_912`), `MAPPOSTER_MAX_CLIP_FRAMES` (default `288`)
  - Response 200: `{ ok: true, clip: { base64, format: 'mp4', width, height, durationSec, fps, bytes }, settle: { base64, format: 'png', width, height }, motion: { preset?, restAtSec }, resolved }`
  - Degrade encode: `{ ok: true, settle, clipError, motion, resolved }` — settle luôn có mặt.
  - 422: `{ ok: false, error }` khi motion vắng/preset lạ/bất biến vỡ (message nguyên văn từ validate) hoặc clip oversize. 401/405/413 như `/render`.

- [ ] **Step 1: Viết test fail** (thêm vào `http.test.ts`, dùng đúng cách dựng server + fake deps của file; fake `renderClip` trả 2 khung PNG 1×1 + settle; fake `encodeAnimation` ghi file mp4 giả `Buffer.from('mp4!')` vào `outPath`)

```ts
describe('POST /render-clip', () => {
  it('200: đủ khối clip/settle/motion/resolved; chrome bị ép clean', async () => {
    // fake deps.renderClip ghi lại config nhận được
    const res = await postJson(`${url}/render-clip`, { location: { lng: 106.7, lat: 10.78, zoom: 14 }, chrome: 'poster', highlight: { points: [{ lng: 106.7, lat: 10.78 }] }, motion: { preset: 'pushIn' } });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.clip.format).toBe('mp4');
    expect(body.clip.base64).toBe(Buffer.from('mp4!').toString('base64'));
    expect(body.settle.format).toBe('png');
    expect(body.motion.preset).toBe('pushIn');
    expect(body.motion.restAtSec).toBeCloseTo(3.9, 3);
    expect(body.resolved.center).toBeDefined();
    expect(seenConfig.chrome).toBe('clean'); // AC-9: caller xin 'poster' vẫn bị ép clean
    expect(seenConfig.motion.fps).toBe(24);
  });

  it('422: preset lạ, thiếu motion, và script vỡ bất biến R — message nêu tên luật', async () => {
    expect((await postJson(`${url}/render-clip`, { location: { lng: 1, lat: 1 }, motion: { preset: 'spin' } })).status).toBe(422);
    expect((await postJson(`${url}/render-clip`, { location: { lng: 1, lat: 1 } })).status).toBe(422);
    const bad = await postJson(`${url}/render-clip`, { location: { lng: 1, lat: 1, zoom: 14 }, motion: { script: { fps: 24, durationSec: 6, restAtSec: 5.9, camera: [{ t: 0, center: [1, 1], zoom: 10 }], tracks: [] } } });
    expect(bad.status).toBe(422);
    expect((await bad.json()).error).toMatch(/^R:/);
  });

  it('degrade: encode hỏng → ok:true + settle + clipError, KHÔNG có clip', async () => {
    // dựng server với fake encodeAnimation ném lỗi
    const body = await (await postJson(`${urlBrokenEncoder}/render-clip`, { location: { lng: 106.7, lat: 10.78, zoom: 14 }, highlight: { points: [{ lng: 106.7, lat: 10.78 }] }, motion: { preset: 'pushIn' } })).json();
    expect(body.ok).toBe(true);
    expect(body.clip).toBeUndefined();
    expect(body.settle.base64).toBeTruthy();
    expect(body.clipError).toMatch(/encode/i);
  });

  it('422 khi mp4 vượt MAPPOSTER_CLIP_MAX_BYTES', async () => {
    // dựng server với fake encodeAnimation ghi file lớn hơn cap test (đặt env cap nhỏ khi start server test này)
    expect((await postJson(`${urlTinyCap}/render-clip`, { location: { lng: 106.7, lat: 10.78, zoom: 14 }, highlight: { points: [{ lng: 106.7, lat: 10.78 }] }, motion: { preset: 'pushIn' } })).status).toBe(422);
  });

  it('401 khi MAPPOSTER_TOKEN đặt mà thiếu bearer (dùng lại khuôn test /render)', async () => {
    /* copy khuôn test 401 của /render, đổi path */
  });
});
```

- [ ] **Step 2: Chạy, xác nhận FAIL**

Run: `npx vitest run mcp-server/src/http.test.ts`
Expected: FAIL — 404/handler chưa có

- [ ] **Step 3: Implement**

Trong `mcp-server/config.ts` thêm (theo mẫu `DEFAULT_MAX_BODY_BYTES`):

```ts
export const DEFAULT_CLIP_MAX_BYTES = 12 * 1024 * 1024;
```

Trong `tools.ts`: thêm vào `ToolDeps`:

```ts
  /** Injected clip primitive (real = renderClipFrames bound to the pool). */
  renderClip?: (config: RenderConfig) => Promise<{ frames: Buffer[]; settle: Buffer }>;
```

và export schema dùng chung cho REST + MCP (cạnh `renderMapSchema`):

```ts
export const motionParamSchema = z.union([
  z.object({
    preset: z.enum(['approach', 'pushIn', 'drift']),
    fps: z.number().int().min(12).max(30).optional(),
    durationSec: z.number().min(2).max(12).optional(),
  }),
  z.object({ script: z.unknown() }), // script validate sâu bằng validateMotionScript (giữ MỘT nguồn luật)
]);
```

Trong `http.ts` — handler mới NGAY SAU khối `/render` (dùng lại bearer + readJsonBody y hệt):

```ts
    if (req.url === '/render-clip') {
      const token = process.env.MAPPOSTER_TOKEN;
      if (token && req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401).end('unauthorized');
        return;
      }
      try {
        const body = (await readJsonBody(req, maxBodyBytes)) as Record<string, unknown>;
        const motionParam = motionParamSchema.safeParse(body.motion);
        if (!motionParam.success) {
          res.writeHead(422, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'motion is required: { preset: approach|pushIn|drift } or { script }' }));
          return;
        }
        const params = renderMapSchema.parse({ ...body, motion: undefined });
        const cfg = await resolveConfig(params);
        cfg.chrome = 'clean'; // AC-9: clip text-free — chữ poster không bao giờ vào clip
        const maxFrames = envNumber(process.env, 'MAPPOSTER_MAX_CLIP_FRAMES', DEFAULT_MAX_CLIP_FRAMES, { min: 24 });
        let preset: string | undefined;
        try {
          if ('preset' in motionParam.data) {
            preset = motionParam.data.preset;
            cfg.motion = compileMotion(motionParam.data.preset, cfg, { fps: motionParam.data.fps, durationSec: motionParam.data.durationSec }, maxFrames);
          } else {
            cfg.motion = validateMotionScript(motionParam.data.script, motionContextOf(cfg, maxFrames));
          }
        } catch (e) {
          res.writeHead(422, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: (e as Error).message }));
          return;
        }
        if (!deps.renderClip || !deps.encodeAnimation) throw new Error('clip rendering not wired (renderClip/encodeAnimation deps missing)');
        const { frames, settle } = await deps.renderClip(cfg);
        const settleOut = { base64: settle.toString('base64'), format: 'png' as const, width: cfg.size.width, height: cfg.size.height };
        const motionOut = { ...(preset ? { preset } : {}), restAtSec: cfg.motion.restAtSec };
        try {
          const outPath = path.join(os.tmpdir(), `mapposter-clip-${Date.now()}.mp4`);
          await deps.encodeAnimation(frames, { fps: cfg.motion.fps, format: 'mp4', outPath });
          const mp4 = await fs.readFile(outPath);
          await fs.rm(outPath, { force: true });
          const cap = envNumber(process.env, 'MAPPOSTER_CLIP_MAX_BYTES', DEFAULT_CLIP_MAX_BYTES, { min: 1 });
          if (mp4.length > cap) {
            res.writeHead(422, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: `clip is ${mp4.length} bytes, over MAPPOSTER_CLIP_MAX_BYTES=${cap} — lower fps/durationSec or size` }));
            return;
          }
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({
            ok: true,
            clip: { base64: mp4.toString('base64'), format: 'mp4', width: cfg.size.width, height: cfg.size.height, durationSec: cfg.motion.durationSec, fps: cfg.motion.fps, bytes: mp4.length },
            settle: settleOut,
            motion: motionOut,
            resolved: resolvedOf(cfg),
          }));
        } catch (e) {
          // Khung đã chụp xong — encode hỏng KHÔNG được nuốt settle (spec §5 degrade).
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, settle: settleOut, motion: motionOut, resolved: resolvedOf(cfg), clipError: `encode failed: ${(e as Error).message}` }));
        }
      } catch (e) {
        const status = e instanceof PayloadTooLargeError ? 413 : 200;
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }));
      }
      return;
    }
```

(Imports mới trong http.ts: `os`/`path`/`fs/promises`, `compileMotion`, `motionContextOf`, `validateMotionScript`, `DEFAULT_MAX_CLIP_FRAMES`, `motionParamSchema`, `DEFAULT_CLIP_MAX_BYTES`.)

Trong `deps.ts`: bind theo đúng mẫu `renderAnimation` sẵn có:

```ts
  renderClip: (cfg) => renderClipFrames(cfg, renderDeps),
```

- [ ] **Step 4: Chạy toàn bộ http.test, xác nhận PASS (test cũ + mới)**

Run: `npx vitest run mcp-server/src/http.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/http.ts mcp-server/src/tools.ts mcp-server/src/deps.ts mcp-server/config.ts mcp-server/src/http.test.ts
git commit -m "feat(http): POST /render-clip — clip mp4 + settle + motion + resolved; 422 nêu tên luật vỡ (AC-6, AC-9)"
```

---

### Task 7: MCP tool `render_clip`

**Files:**
- Modify: `mcp-server/src/tools.ts` (method + registration — theo đúng khuôn `render_animation` trong cùng file)
- Test: `mcp-server/src/tools.test.ts` (thêm describe — xem mẫu fake deps của render_animation trong file)

**Interfaces:**
- Consumes: `deps.renderClip`, `deps.encodeAnimation`, `compileMotion`, `motionContextOf`, `validateMotionScript`, `motionParamSchema`, `resolvedOf`, `fileNameFor`, `deliver`.
- Produces: tool `render_clip` — params `RenderMapParams & { motion: <motionParamSchema>, delivery? }`; kết quả ok: `{ clip: { path, bytes, durationSec, fps, width, height }, settle: { path }, motion: { preset?, restAtSec }, resolved }` — mp4 + settle GHI FILE vào `sinkDir` (không base64 inline: clip nhiều MB làm phồng JSON-RPC stdio; `delivery` chỉ áp cho settle như các tool ảnh khác).

- [ ] **Step 1: Viết test fail** — fake `deps.renderClip` trả 2 PNG giả + settle; fake `encodeAnimation` ghi `Buffer.from('mp4!')`; assert: (a) kết quả có `clip.path` tồn tại trên đĩa với đúng bytes, `settle.path` tồn tại; (b) `motion.restAtSec` đúng 3.9 cho pushIn; (c) config chuyển cho renderClip có `chrome === 'clean'`; (d) thiếu cả preset lẫn script → `isError: true`; (e) preset `approach` mà config không region → `isError: true` message chứa `approach needs`.

- [ ] **Step 2: Chạy, xác nhận FAIL** — `npx vitest run mcp-server/src/tools.test.ts`

- [ ] **Step 3: Implement** — method `render_clip` trong `makeTools` (khuôn `render_animation`): resolveConfig → ép `chrome='clean'` → compile/validate (mẫu try/catch của Task 6, lỗi → `fail(message)`) → `deps.renderClip(cfg)` → `deps.encodeAnimation(frames, { fps, format: 'mp4', outPath: path.join(deps.sinkDir, fileNameFor(cfg) + '.mp4') })` → settle qua `deliver(settle, fileNameFor(cfg) + '-settle', mode, { sinkDir })` → `ok({ clip: {...}, settle, motion, resolved: resolvedOf(cfg) })`. Registration: `server.registerTool('render_clip', { description: 'Render a short text-free camera-motion map clip (MP4) + a rest-state settle still. motion: {preset: approach|pushIn|drift} or {script}.', inputSchema: ... }, handler)` — inputSchema = shape của renderMapSchema + `motion: motionParamSchema` (nhìn cách render_animation ghép schema trong cùng file).

- [ ] **Step 4: Chạy, xác nhận PASS** — `npx vitest run mcp-server/src/tools.test.ts`

- [ ] **Step 5: Commit**

```bash
git add mcp-server/src/tools.ts mcp-server/src/tools.test.ts
git commit -m "feat(mcp): tool render_clip — clip mp4 + settle qua sinkDir, cùng ruột REST"
```

---

### Task 8: AC-9 — guard style text-free ở tầng unit

**Files:**
- Test: `src/lib/mapStyle.test.ts` (thêm test — file test sẵn có)

**Interfaces:**
- Consumes: `buildMapStyle` (sẵn có).

- [ ] **Step 1: Viết test** (có thể pass ngay — guard hồi quy, chốt AC-9 ở tầng style)

```ts
it('AC-9: the ONLY symbol/text layer that can ever exist is road-label-major (opt-in)', () => {
  const argsBase = { theme: getTheme('midnight-blue'), detail: 0.6, routes: [], highlight: undefined };
  const allOn = Object.fromEntries(['landcover', 'buildings', 'water', 'parks', 'roads', 'rail', 'aeroway'].map((k) => [k, true]));
  const off = buildMapStyle({ ...argsBase, layers: { ...allOn, roadLabels: false } });
  expect(off.layers.filter((l: { type: string }) => l.type === 'symbol')).toHaveLength(0);
  const on = buildMapStyle({ ...argsBase, layers: { ...allOn, roadLabels: true } });
  expect(on.layers.filter((l: { type: string }) => l.type === 'symbol').map((l: { id: string }) => l.id)).toEqual(['road-label-major']);
});
```

(Chỉnh shape `argsBase` theo chữ ký thật của `buildMapStyle` trong `src/lib/mapStyle.ts:73` — đọc 10 dòng quanh đó trước khi viết; test hiện có trong file là mẫu đúng.)

- [ ] **Step 2: Chạy PASS + commit**

```bash
npx vitest run src/lib/mapStyle.test.ts
git add src/lib/mapStyle.test.ts
git commit -m "test(style): AC-9 — symbol layer duy nhất được phép là road-label-major"
```

---

### Task 9: README + full gate + số đo chốt fps

**Files:**
- Modify: `README.md` (mục MCP: thêm `render_clip`; mục REST: thêm `/render-clip` + 2 env mới)

- [ ] **Step 1: Viết docs** — thêm vào bảng tool MCP dòng `render_clip` (mô tả 1 câu + motion param), thêm dưới mục REST `/render`: request/response mẫu `/render-clip` (rút gọn từ spec §5), bảng env: `MAPPOSTER_CLIP_MAX_BYTES` (12MB), `MAPPOSTER_MAX_CLIP_FRAMES` (288).

- [ ] **Step 2: Full gate**

```bash
npm run verify        # tsc ×2 + vitest + playwright
npm run test:mcp      # integration thật — ghi lại giây/khung lần nữa
```

Expected: PASS toàn bộ.

- [ ] **Step 3: Quyết định fps từ số đo** — nếu Task 5 đo > ~0.7s/khung ở 320×568, đổi `FPS_DEFAULT` trong `motionCompiler.ts` từ 24 → 18 (một hằng số — spec §3: "spike/integration đo khung/giây thật → con số đó chốt fps mặc định") và chạy lại `npx vitest run mcp-server/src/motionCompiler.test.ts`. Ghi số đo + quyết định vào commit message.

- [ ] **Step 4: Commit**

```bash
git add README.md mcp-server/src/motionCompiler.ts
git commit -m "docs: render_clip + /render-clip + env; chốt fps mặc định theo số đo (<X> s/khung)"
```

---

## Self-Review (đã chạy)

1. **Spec coverage:** AC-1 (T1) · AC-2 (T3) · AC-3 (T2) · AC-4 (encoder tái dùng — `encodeArgs` pure test sẵn có, ghi ở Global Constraints) · AC-5 (T5) · AC-6 (T6) · AC-9 (T6 ép chrome + T7 ép chrome + T8 style guard). Spec §5 degrade settle-luôn-có (T6 step 1 test degrade) · §9 không-retry-nửa-clip (T5 comment + fail sạch) · prefetch best-effort (T4/T5) · routeDraw reserved (T1 test I-routes).
2. **Placeholder scan:** không TBD/TODO; Task 7 step 1/3 mô tả bằng hành vi + trỏ khuôn mẫu cùng file (render_animation) thay vì chép 120 dòng registration — implementer có khuôn thật ngay cạnh.
3. **Type consistency:** `renderMotionFrame(tSec, opts?: {pulsePhase?})` thống nhất T4/T5; `ClipFrames {frames, settle}` T5→T6/T7; `motionParamSchema` T6→T7; `compileMotion(preset, cfg, overrides?, maxFrames?)` T3→T6/T7; `MotionContext` T1→T3/T6.
