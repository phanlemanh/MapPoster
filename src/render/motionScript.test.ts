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

  it('L: pulse BẮT ĐẦU SAU restAtSec vẫn được chấp nhận (AC-3)', () => {
    // Ca trên bắt đầu ở 4.0 — TRƯỚC mốc nghỉ 4.2 — nên nó chỉ chứng minh "chạy
    // vượt qua restAtSec", một mệnh đề khác. AC-3 nói về việc BẮT ĐẦU sau mốc
    // nghỉ: luật O ràng buộc điểm KẾT của track one-shot, còn pulse là loop
    // track (oneShotEnd trả null) nên restAtSec không ràng buộc nó chút nào.
    // Một hiện thực áp luật O cho cả pulse sẽ đỏ ở đây mà xanh ở ca trên.
    expect(() => validateMotionScript({ ...base, tracks: [{ kind: 'pulse', from: 4.5 }] }, CTX)).not.toThrow();
    // Trần thật của pulse là ĐUÔI CLIP, không phải mốc nghỉ — nửa còn lại của
    // cùng ranh giới, để "chấp nhận mọi from" cũng không lọt.
    expect(() => validateMotionScript({ ...base, tracks: [{ kind: 'pulse', from: 5.999 }] }, CTX)).not.toThrow();
    expect(() => validateMotionScript({ ...base, tracks: [{ kind: 'pulse', from: 6 }] }, CTX)).toThrow(/^L:/);
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

  it('O: rejects a second track of the same one-shot kind — main.tsx would silently drop it via tracks.find()', () => {
    const dupPinDrop = [...base.tracks, { kind: 'pinDrop' as const, at: 0.2, dur: 0.3 }];
    expect(() => validateMotionScript({ ...base, tracks: dupPinDrop }, CTX)).toThrow(/^O:/);

    const dupRegionReveal = [...base.tracks, { kind: 'regionReveal' as const, t0: 0.1, t1: 0.3 }];
    expect(() => validateMotionScript({ ...base, tracks: dupRegionReveal }, CTX)).toThrow(/^O:/);

    const dupRouteDraw = [
      { kind: 'routeDraw' as const, t0: 0.1, t1: 0.3 },
      { kind: 'routeDraw' as const, t0: 1.0, t1: 1.1 },
    ];
    expect(() => validateMotionScript({ ...base, tracks: dupRouteDraw }, CTX)).toThrow(/^O:/);
  });

  it('O: a single instance of each one-shot kind still passes — and pulse (a loop track) is exempt and may repeat', () => {
    expect(() => validateMotionScript(base, CTX)).not.toThrow(); // base already carries one of each one-shot kind
    const withTwoPulses = [...base.tracks, { kind: 'pulse' as const, from: 3.0, periodSec: 1.0 }];
    expect(() => validateMotionScript({ ...base, tracks: withTwoPulses }, CTX)).not.toThrow();
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
