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

  // Regression: result must stay in [0, 360) — Task 4 consumes this directly
  // as a map bearing, so a stray negative value or a 360 would be a real bug,
  // not just a cosmetic one. `((result % 360) + 360) % 360` is the fix under
  // test; a naive `a + d * k` without normalization would fail this.
  it('stays within [0, 360) across a sweep of inputs, including negative angles and seam crossings', () => {
    const cases: Array<[number, number]> = [
      [350, 160], // seam crossing: shortest arc goes 350→360/0→160
      [10, -20], // negative target
      [-45, 45], // negative start
      [0, 359],
      [-370, 10], // start well outside [0,360)
      [180, -180],
    ];
    for (const [a, b] of cases) {
      for (let k = 0; k <= 1; k += 0.1) {
        const result = lerpAngle(a, b, k);
        expect(result).toBeGreaterThanOrEqual(0);
        expect(result).toBeLessThan(360);
      }
    }
  });

  it('lands exactly on the normalized target angle at k=1', () => {
    expect(lerpAngle(10, -20, 1)).toBeCloseTo(340, 6); // -20 normalized → 340
    expect(lerpAngle(350, 160, 1)).toBeCloseTo(160, 6);
    expect(lerpAngle(-45, 45, 1)).toBeCloseTo(45, 6);
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

  // Regression: several exact whole-cycle times that are inexact in binary
  // (e.g. 3.8 - 2 === 1.7999999999999998, and 0.3 * 7 === 2.1000000000000005…)
  // must read as phase 0 (fresh ring at centre), never ~1 (ring at max radius
  // about to vanish) — those are visually OPPOSITE states for a sawtooth ripple.
  it('returns 0 (not ~1) at whole-cycle boundaries that are inexact in binary', () => {
    expect(pulsePhase(3.8, 2, 1.8)).toBe(0); // 3.8 - 2 = 1.7999999999999998 (1 cycle)
    expect(pulsePhase(0.3 * 7, 0, 0.3)).toBe(0); // 0.3*7 lands one FP ulp past 7 cycles
    expect(pulsePhase(1.8 * 5, 0, 1.8)).toBe(0); // 5 cycles
    expect(pulsePhase(1.8 * 10, 0, 1.8)).toBe(0); // 10 cycles
  });

  // Regression: the whole point of a RELATIVE tolerance. With a small periodSec
  // (the schema has no minimum), a phase can be legitimately at 0.99999999995 —
  // a hair before completing a cycle — without that being floating-point noise.
  // A fixed 1e-10 epsilon can't tell the two apart and would wrongly snap this
  // to 0, drawing a fresh ring instead of one at (near) maximum radius.
  it('does NOT collapse a legitimately near-complete phase to 0 for a small periodSec', () => {
    const periodSec = 0.001;
    const from = 0;
    // cycles = 4.99999999995 — i.e. 5e-11 short of 5 whole cycles.
    const t = periodSec * 4.99999999995;

    const phase = pulsePhase(t, from, periodSec)!;

    // The relative tolerance here is EPSILON*8*max(1, cycles) ≈ 8.9e-15 for
    // cycles≈5 — far tighter than the 5e-11 gap, so this must NOT clamp to 0.
    expect(phase).not.toBe(0);
    expect(phase).toBeGreaterThan(0.999);
    expect(phase).toBeCloseTo(0.99999999995, 9);

    // Sanity check against the old, rejected approach: a fixed 1e-10 epsilon
    // WOULD have swallowed this legitimate near-complete phase into 0 — proof
    // that the fix must be relative, not a bigger/smaller fixed constant.
    const fixedEpsilonPhase = ((t - from) % periodSec) / periodSec;
    expect(Math.abs(1 - fixedEpsilonPhase)).toBeLessThan(1e-10);
  });
});
