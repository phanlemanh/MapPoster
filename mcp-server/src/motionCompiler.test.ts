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

  it('seeds cfg.camera.bearing into every compiled keyframe (production bug: bearing silently dropped)', () => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom: 14.5, bearing: 45 } });
    const s = compileMotion('pushIn', c);
    expect(s.camera.length).toBeGreaterThan(1);
    for (const k of s.camera) expect(k.bearing).toBe(45);
  });

  it('DETERMINISM: config KHÔNG bearing biên dịch ra y nguyên — early return, không dựng lại script', () => {
    // Nửa "gieo bearing" ở trên đã được canh. Nửa còn lại — bất biến xác định
    // của repo trên khung đã render — thì chưa: `seedBearing` phải TRẢ VỀ CHÍNH
    // object cũ khi bearing là null/0, chứ không map lại một mảng keyframe mới.
    // Một bản map-vô-điều-kiện vẫn cho giá trị bằng nhau, nên `toEqual` không
    // phân biệt được; chỉ khác biệt quan sát được là bearing KHÔNG được thêm
    // vào như một khoá mang undefined.
    for (const bearing of [undefined, 0, null as unknown as undefined]) {
      const c = cfg({ camera: { center: [106.7, 10.78], zoom: 14.5, bearing } });
      const s = compileMotion('pushIn', c);
      expect(s.camera.length).toBeGreaterThan(1);
      for (const k of s.camera) {
        // KHÔNG `toBeUndefined()`: nó xanh cả khi khoá được thêm mang undefined,
        // tức chính cái "dựng lại script" mà mệnh đề này loại trừ.
        expect(Object.hasOwn(k, 'bearing'), `bearing=${String(bearing)}`).toBe(false);
      }
    }

    // và hai lần biên dịch cùng một config cho ra kết quả bằng nhau từng phần
    const c = cfg({ camera: { center: [106.7, 10.78], zoom: 14.5 } });
    expect(compileMotion('pushIn', c)).toEqual(compileMotion('pushIn', c));
  });

  // --- Boundary-value tests across the legal zoom/longitude domain (Findings 1-5) ---
  // The suite above only ever exercises zoom 14.5 / lng 106.7, which is why
  // none of the arithmetic overflows below were caught before.

  // zoom=0 used to be the fixture here, but pushIn's zoomIn offset (1.8) means
  // a target zoom of 0 no longer compiles — it fails the fly-in headroom
  // guard below (delta 0 < MIN_ZOOM_DELTA). 1.0 still exercises the same
  // clamp-at-zero branch (1.0 - 1.8 = -0.8, clamped to 0) while leaving a
  // legal 1.0 delta, so the clamping behaviour is still covered without
  // relying on the degenerate zero-motion case.
  it.each([1, 22])('pushIn clamps its start zoom into [0,22] at camera.zoom = %d', (zoom) => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom } });
    const s = compileMotion('pushIn', c);
    expect(s.camera[0].zoom).toBeGreaterThanOrEqual(0);
    expect(s.camera[0].zoom).toBeLessThanOrEqual(22);
  });

  it.each([0, 22])('drift clamps both start and end zoom into [0,22] at camera.zoom = %d', (zoom) => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom } });
    const s = compileMotion('drift', c);
    for (const kf of s.camera) {
      expect(kf.zoom).toBeGreaterThanOrEqual(0);
      expect(kf.zoom).toBeLessThanOrEqual(22);
    }
  });

  it.each([2, 5, 6])('approach never starts above its target zoom at camera.zoom = %d', (zoom) => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom } });
    const s = compileMotion('approach', c);
    const start = s.camera[0].zoom;
    const target = s.camera[s.camera.length - 1].zoom;
    expect(target).toBe(zoom);
    expect(start).toBeLessThanOrEqual(target); // equality only allowed when clamped at 0
  });

  // Only negative-longitude cases can ever regress here: the offset is always
  // SUBTRACTED from the centre (`center[0] - lngSpan * 0.15`), so the result
  // only ever moves further negative — it can never overflow past +180. The
  // two 179.5 cases this replaced could not fail under any implementation and
  // were dropped in favour of more negative/low-zoom combinations, which is
  // where lngSpan is largest and the wrap actually has to do work.
  it.each([
    [-179.5, 5],
    [-179.5, 14.5],
    [-179.99, 1],
    [-179.999, 3],
  ])('pushIn wraps the start centre longitude near the antimeridian (lng=%d, zoom=%d)', (lng, zoom) => {
    const c = cfg({ camera: { center: [lng, 10.78], zoom } });
    expect(() => compileMotion('pushIn', c)).not.toThrow();
    const s = compileMotion('pushIn', c);
    expect(s.camera[0].center[0]).toBeGreaterThanOrEqual(-180);
    expect(s.camera[0].center[0]).toBeLessThanOrEqual(180);
  });

  // --- Fly-in headroom guard (approach/pushIn must not silently emit a frozen clip) ---

  it.each([0, 0.4])('approach at camera.zoom = %d throws — not enough headroom to fly in from', (zoom) => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom } });
    expect(() => compileMotion('approach', c)).toThrow(/approach needs a target zoom of at least 0\.5 to fly in from — got/);
  });

  it('approach at camera.zoom = 0.5 succeeds with a start zoom strictly less than target', () => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom: 0.5 } });
    const s = compileMotion('approach', c);
    const start = s.camera[0].zoom;
    const target = s.camera[s.camera.length - 1].zoom;
    expect(target).toBe(0.5);
    expect(start).toBeLessThan(target);
  });

  it('pushIn at a zoom too low for its fly-in delta throws the same class of error', () => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom: 0 } });
    expect(() => compileMotion('pushIn', c)).toThrow(/pushIn needs a target zoom of at least 0\.5 to fly in from — got 0/);
  });

  it('out-of-range durationSec override throws a clear, field-named error (not a raw ZodError)', () => {
    expect(() => compileMotion('drift', cfg(), { durationSec: 1 })).toThrow(/durationSec=1 is out of range/);
  });

  it('out-of-range fps override throws a clear, field-named error (not a raw ZodError)', () => {
    expect(() => compileMotion('drift', cfg(), { fps: 60 })).toThrow(/fps=60 is out of range/);
  });
});

import { afterEach, beforeEach, vi } from 'vitest';
import {
  acquireClipSlot,
  acquireClipSlotWaiting,
  ClipConcurrencyError,
  ClipSlotWaitTimeoutError,
  resetClipGateForTests,
  prepareClipRenderWithSlot,
} from './motionCompiler';

describe('cổng slot clip — hai chính sách trên MỘT bộ đếm', () => {
  beforeEach(() => {
    resetClipGateForTests();
    process.env.MAPPOSTER_CLIP_CONCURRENCY = '1';
  });
  afterEach(() => {
    resetClipGateForTests();
    delete process.env.MAPPOSTER_CLIP_CONCURRENCY;
    vi.useRealTimers();
  });

  it('lối NÉM-NGAY giữ nguyên hành vi: hết chỗ là ném, không chờ', () => {
    const release = acquireClipSlot();
    expect(() => acquireClipSlot()).toThrow(ClipConcurrencyError);
    release();
    expect(() => acquireClipSlot()).not.toThrow();
  });

  it('lối CHỜ: người chờ được đánh thức khi slot được trả', async () => {
    const first = acquireClipSlot();
    let woke = false;
    const waiting = acquireClipSlotWaiting({ timeoutMs: 60_000 }).then((r) => {
      woke = true;
      return r;
    });

    await Promise.resolve();
    expect(woke).toBe(false); // vẫn đang chờ, chưa ai nhả

    first();
    const release = await waiting;
    expect(woke).toBe(true);
    release();
  });

  it('đánh thức theo ĐÚNG thứ tự xếp hàng', async () => {
    const first = acquireClipSlot();
    const order: number[] = [];

    const a = acquireClipSlotWaiting({ timeoutMs: 60_000 }).then((r) => { order.push(1); return r; });
    const b = acquireClipSlotWaiting({ timeoutMs: 60_000 }).then((r) => { order.push(2); return r; });
    const c = acquireClipSlotWaiting({ timeoutMs: 60_000 }).then((r) => { order.push(3); return r; });

    first();
    (await a)();
    (await b)();
    (await c)();

    expect(order).toEqual([1, 2, 3]);
  });

  it('slot được ĐƯỜNG SẢN XUẤT trả khi bên giữ nó ném lỗi — không phải test tự gọi', async () => {
    // Bản cũ tự viết `try { throw } catch { release() }`: chính TEST gọi
    // release, nên nó chỉ chứng minh bộ đếm biết đếm — gỡ sạch `releaseClipSlot()`
    // khỏi mã sản xuất thì ca đó VẪN xanh. Ở đây slot được đưa cho
    // `prepareClipRenderWithSlot` và chỉ mã sản xuất mới có thể trả nó.
    const release = acquireClipSlot();
    let releasedByTest = false;

    await expect(
      prepareClipRenderWithSlot(
        { location: { lng: 106.7, lat: 10.78 } } as never,
        { preset: 'khong-co-preset-nay' }, // hỏng ngay ở parseMotionParam, trước mọi lời gọi mạng
        () => {
          releasedByTest = true;
          release();
        },
      ),
    ).rejects.toThrow();

    expect(releasedByTest).toBe(true); // chính nó gọi hàm nhả, không phải ca test
    // và chỗ đã thật sự về: người chờ kế tiếp lấy được ngay
    await expect(acquireClipSlotWaiting({ timeoutMs: 10 })).resolves.toBeTypeOf('function');
  });

  it('slot được ĐƯỜNG SẢN XUẤT giao lại khi chuẩn bị THÀNH CÔNG — kèm trong ClipPreparation', async () => {
    // NHÁNH CHẾT ĐÃ GỠ: bản cũ truyền `{ script: { fps: 12, durationSec: 1,
    // camera: [] } }` — script đó KHÔNG BAO GIỜ hợp lệ (durationSec < 2, thiếu
    // restAtSec, camera rỗng, thiếu tracks), nên `prepareClipRenderWithSlot`
    // luôn reject, `.catch(() => undefined)` nuốt lỗi, `prep` luôn `undefined`
    // và cả khối `if (prep)` không bao giờ chạy. Ba khẳng định mang đúng tên
    // mệnh đề của ca test này là trang trí trong một lane nghiệm thu. Đầu vào
    // dưới đây HỢP LỆ, và `prep` được khẳng định là có thật thay vì được canh
    // sau một `if`.
    const release = acquireClipSlot();
    const prep = await prepareClipRenderWithSlot(
      {
        location: { lng: 106.7, lat: 10.78 },
        size: { width: 540, height: 960 },
        highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      } as never,
      { preset: 'pushIn' },
      release,
    );

    // Nhánh THÀNH CÔNG thật sự chạy tới đây — không còn `if` nào bọc ngoài.
    expect(prep).toBeDefined();
    expect(prep.motion.camera.length).toBeGreaterThan(1); // đã compile ra script thật
    expect(prep.releaseClipSlot).toBeTypeOf('function');
    // slot vẫn ĐANG được giữ: chuẩn bị xong không có nghĩa là nhả chỗ, chỗ
    // phải theo lời gọi cho tới lúc render xong.
    expect(() => acquireClipSlot()).toThrow(ClipConcurrencyError);

    prep.releaseClipSlot();
    expect(() => acquireClipSlot()).not.toThrow(); // trả rồi thì lấy lại được
  });

  it('release là idempotent — gọi hai lần không cấp thừa một chỗ', async () => {
    const release = acquireClipSlotWaiting({ timeoutMs: 10 });
    const r = await release;
    r();
    r();
    const second = acquireClipSlot();
    expect(() => acquireClipSlot()).toThrow(ClipConcurrencyError); // trần vẫn đúng là 1
    second();
  });

  it('CHỜ CÓ HẠN: quá hạn thì ném, và người đã hết hạn KHÔNG còn tồn trong hàng', async () => {
    vi.useFakeTimers();
    const first = acquireClipSlot();

    const late = acquireClipSlotWaiting({ timeoutMs: 5_000 });
    const expectation = expect(late).rejects.toBeInstanceOf(ClipSlotWaitTimeoutError);
    await vi.advanceTimersByTimeAsync(5_001);
    await expectation;

    // người hết hạn đã rời hàng: slot được trả phải rơi vào người chờ CÒN SỐNG
    const alive = acquireClipSlotWaiting({ timeoutMs: 60_000 });
    first();
    await vi.advanceTimersByTimeAsync(0);
    const release = await alive;
    expect(release).toBeTypeOf('function');
    release();
  });
});

describe('motionContextOf đọc routeCount từ cfg.routes', () => {
  // Ca này tồn tại vì một negative control chỉ ra rằng thay đổi một dòng ở tâm
  // PR routeDraw — bỏ hằng `routeCount: 0` — KHÔNG có test nào phủ: mọi ca
  // khác dựng `ctx` bằng tay nên đi vòng qua đúng hàm này. Hằng số cũ có thể
  // quay lại mà cả bộ vẫn xanh.
  const withRoutes = (n: number) =>
    ({
      highlight: { regions: [] },
      markers: [],
      routes: Array.from({ length: n }, () => ({
        geojson: { type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[105.8, 21.0], [105.9, 21.1]] } }] },
        color: '#e8b04b',
        width: 4,
      })),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }) as any;

  it('không có routes ⇒ 0', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(motionContextOf({ highlight: { regions: [] }, markers: [] } as any).routeCount).toBe(0);
  });

  it('có N routes ⇒ N — KHÔNG phải hằng số 0', () => {
    expect(motionContextOf(withRoutes(1)).routeCount).toBe(1);
    expect(motionContextOf(withRoutes(3)).routeCount).toBe(3);
  });

  it('một routeDraw đi qua validate được khi cfg mang tuyến thật', () => {
    const script = {
      fps: 12,
      durationSec: 4,
      restAtSec: 2.8,
      camera: [{ t: 0, center: [105.85, 21.03] as [number, number], zoom: 12 }],
      tracks: [{ kind: 'routeDraw' as const, t0: 0.5, t1: 2.5 }],
    };
    expect(() => validateMotionScript(script, motionContextOf(withRoutes(1)))).not.toThrow();
    expect(() => validateMotionScript(script, motionContextOf(withRoutes(0)))).toThrow(/routeDraw/);
  });
});
