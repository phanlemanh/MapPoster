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
