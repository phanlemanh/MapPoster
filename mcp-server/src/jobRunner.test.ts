import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fsp, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

// resolveConfig reaches into ./geocode for anything that isn't a bare {lng,lat}.
// Mocked so the runner's own behaviour is what's under test, not Nominatim.
// `importActual` chứ không thay trọn gói: lớp `GeocodeUpstreamError` phải là
// lớp THẬT, nếu không `instanceof` trong jobRunner so với `undefined` và ném
// TypeError — mọi ca lỗi người gọi sẽ âm thầm bị gán nhầm thành lỗi máy chủ.
vi.mock('./geocode', async () => {
  const actual = await vi.importActual<typeof import('./geocode')>('./geocode');
  return {
    ...actual,
    resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) => {
      if (typeof input === 'string' && input.toLowerCase().startsWith('zzz')) throw new Error(`No geocoding result for "${input}"`);
      // "upstream-…" giả lập Nominatim NGÃ (503 / mạng hỏng) — khác hẳn "tra
      // không ra": đầu vào đúng, bên ngoài hỏng.
      if (typeof input === 'string' && input.toLowerCase().startsWith('upstream-')) {
        throw new actual.GeocodeUpstreamError(new Error('Geocoding failed: 503'));
      }
      return typeof input === 'string'
        ? { center: [106.7, 10.78], zoom: 12, place: { name: input, country: 'Vietnam', lat: 10.78, lng: 106.7 } }
        : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } };
    }),
    searchCandidates: vi.fn(async () => []),
    resolveBoundary: vi.fn(async () => null),
    resolveCountryAt: vi.fn(async () => 'Vietnam'),
  };
});

import { createJobStore } from './jobStore';
import { createJobRunner } from './jobRunner';
import { resetClipGateForTests, acquireClipSlot } from './motionCompiler';
import type { ToolDeps } from './tools';
import type { RenderConfig } from '../../src/render/renderConfig';
import type { ClipAnchors } from '../../src/render/anchors';

/** A real 1×1 PNG — `deliver` reads width/height out of the IHDR chunk. */
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

let sinkDir: string;

/** Fixture việc clip dùng chung: `pushIn` cần một điểm được tô sáng. */
const clipJobFixture = {
  kind: 'clip' as const,
  params: { location: 'Đà Lạt', highlight: { points: [{ lng: 108.44, lat: 11.94 }] } },
  motionInput: { preset: 'pushIn' },
};

function makeDeps(over: Partial<ToolDeps> = {}): ToolDeps {
  return {
    sinkDir,
    defaultDelivery: 'url',
    render: vi.fn(async () => PNG_1x1),
    ...over,
  } as ToolDeps;
}

/**
 * Anchors mà một lần render clip thật trả về, DẪN XUẤT TỪ `cfg`: điểm đầu tiên
 * mang chính toạ độ của việc này, và `zoom + 1` để `resolved.camera` không thể
 * trùng `resolved.zoom` một cách tình cờ. Nhờ vậy "dùng nhầm biến" — lỗi đã
 * xảy ra HAI LẦN ở jobRunner với 22/22 test vẫn xanh — hiện thành sai số cụ
 * thể chứ không phải một trường vắng mặt mà chẳng ai đối chiếu.
 */
function fakeAnchors(cfg: RenderConfig): ClipAnchors {
  return {
    camera: { center: cfg.camera.center, zoom: cfg.camera.zoom + 1, bearing: 0, pitch: 0 },
    points: (cfg.markers ?? []).map((m, index) => ({ index, lng: m.lng, lat: m.lat, xPct: 25, yPct: 75, onScreen: true })),
    regions: [],
  };
}

/**
 * ĐÚNG MỘT trong `anchors` / `anchorsUnavailable`, đo tại TỪNG lối ra.
 *
 * "resolved có anchors" chỉ là nửa khẳng định — nó không loại trừ khối
 * `resolved` mang CẢ HAI, và khi đó caller không có cách nào biết tin cái nào.
 * Đo được: cho `resolvedOfClip` phát cả hai ở nhánh đo-được thì tools.test.ts
 * đỏ 2 ca, còn lane jobRunner này vẫn 28/28 xanh trước khi có chốt này.
 */
function expectAnchorsXor(resolved: unknown, label: string): void {
  const r = (resolved ?? {}) as Record<string, unknown>;
  const hasAnchors = 'anchors' in r;
  const hasReason = 'anchorsUnavailable' in r;
  expect(hasAnchors !== hasReason, `${label}: anchors=${hasAnchors}, anchorsUnavailable=${hasReason}`).toBe(true);
  expect('camera' in r, `${label}: camera đi cùng anchors`).toBe(hasAnchors);
}

/** Clip deps that succeed: two frames + a settle still, encoder writes a real file. */
function clipDeps(over: Partial<ToolDeps> = {}): ToolDeps {
  return makeDeps({
    renderClip: vi.fn(async (cfg: RenderConfig) => ({ frames: [PNG_1x1, PNG_1x1], settle: PNG_1x1, anchors: fakeAnchors(cfg) })),
    encodeAnimation: vi.fn(async (_frames, opts: { outPath: string }) => {
      await fsp.writeFile(opts.outPath, Buffer.alloc(64, 7));
      return opts.outPath;
    }),
    ...over,
  } as Partial<ToolDeps>);
}

beforeEach(async () => {
  resetClipGateForTests();
  sinkDir = await fsp.mkdtemp(path.join(tmpdir(), 'mapposter-jobs-'));
});

afterEach(async () => {
  resetClipGateForTests();
  await fsp.rm(sinkDir, { recursive: true, force: true });
  delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
  delete process.env.MAPPOSTER_CLIP_CONCURRENCY;
});

describe('createJobRunner — chạy việc', () => {
  it('AC-5 seam: đường dẫn THỢ ghi trùng khít đường dẫn lưu trong bản ghi', async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1 });
    const job = store.create({ kind: 'render', params: { location: 'Đà Nẵng' }, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('done');
    expect(rec.artifacts).toHaveLength(1);
    // Tệp TỒN TẠI đúng đường dẫn ghi trong bản ghi, và nội dung là byte thợ ghi
    // — không phải byte do test tự đặt sẵn ở đâu đó.
    await expect(fsp.readFile(rec.artifacts[0].path)).resolves.toEqual(PNG_1x1);
    expect(rec.artifacts[0].bytes).toBe(PNG_1x1.length);
    expect(rec.artifacts[0].width).toBe(1);
  });

  it("AC-5: trạng thái chỉ lật sang 'done' SAU khi ghi xong — không bao giờ đọc ra ENOENT", async () => {
    // Đo ĐÚNG LÚC lật, không phải sau `drain()`.
    //
    // Bản cũ đọc tệp sau khi `drain()` trả về, tức sau CẢ hai sự kiện — thứ tự
    // giữa chúng không quan sát được, nên một hiện thực gọi
    // `store.finish({status:'done'})` RỒI MỚI `await deliver(...)` vẫn xanh.
    // Và `fsp.stat(...).resolves.toBeDefined()` không hề chạm mệnh đề "nội
    // dung rỗng": nó không đọc byte nào, không xem cả `size`.
    //
    // Bọc `store.finish` là điểm quan sát duy nhất trùng khít khoảnh khắc lật:
    // mọi thứ hợp đồng hứa phải ĐÃ đúng ngay trước khi nó chạy.
    const inner = createJobStore();
    const atFinish: { path: string; bytes: Buffer | Error }[] = [];
    const store = {
      ...inner,
      create: inner.create.bind(inner),
      get: inner.get.bind(inner),
      finish: (id: string, patch: Parameters<typeof inner.finish>[1], t: number) => {
        for (const a of patch.artifacts ?? []) {
          // readFileSync CỐ Ý: một `await` ở đây nhường lượt cho event loop và
          // cho phép một lần ghi đang bay về đích trước khi ta nhìn — đúng thứ
          // phép kiểm này đi loại trừ.
          try {
            atFinish.push({ path: a.path, bytes: readFileSync(a.path) });
          } catch (e) {
            atFinish.push({ path: a.path, bytes: e as Error });
          }
        }
        return inner.finish(id, patch, t);
      },
    } as unknown as ReturnType<typeof createJobStore>;

    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1 });
    const job = store.create({ kind: 'render', params: { location: 'Thừa Thiên Huế' }, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('done');

    // Điểm quan sát thật sự chạy — không phải một khối chết.
    expect(atFinish).toHaveLength(1);
    expect(atFinish[0].path).toBe(rec.artifacts[0].path);
    // NGAY LÚC lật trạng thái: tệp đã tồn tại (không ENOENT) và đã ĐỦ BYTE
    // (không rỗng, không ghi dở) — cả hai nửa của lời hứa, đo tại chỗ.
    expect(atFinish[0].bytes, `ENOENT lúc finish: ${String(atFinish[0].bytes)}`).toBeInstanceOf(Buffer);
    expect(atFinish[0].bytes).toEqual(PNG_1x1);
  });

  it('AC-6: địa danh không tra được → hỏng vì NGƯỜI GỌI', async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1 });
    const job = store.create({ kind: 'render', params: { location: 'zzz-khong-co' }, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('failed');
    expect(rec.errorKind).toBe('input');
  });

  // Ba ca dưới đây đến từ vòng soi code round 1: bản phân loại đầu tiên khớp
  // CHUỖI trong thông điệp lỗi, mà `resolveConfig` lại ném "Unknown theme: …",
  // "Unknown format: …", "Invalid highlight.regions[].geojson: …" — không cái
  // nào khớp, nên cả ba bị gán nhầm là lỗi máy chủ và người gọi được bảo thử
  // lại một yêu cầu không đời nào thành công. Cùng thân đó gửi vào `/render`
  // đồng bộ thì trả 400, nên hai bề mặt còn bất đồng với nhau về lỗi tại ai.
  it.each([
    ['chủ đề lạ', { location: 'Huế', theme: 'rubby' }],
    ['khổ ảnh lạ', { location: 'Huế', format: 'wat' }],
    ['geojson hỏng', { location: 'Huế', highlight: { regions: [{ geojson: { khong: 'phai geojson' } }] } }],
  ])('AC-6: %s → hỏng vì NGƯỜI GỌI, không phải máy chủ', async (_ten, params) => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1 });
    const job = store.create({ kind: 'render', params, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('failed');
    expect(rec.errorKind).toBe('input');
  });

  it('AC-6: render nổ → hỏng vì MÁY CHỦ', async () => {
    const store = createJobStore();
    const deps = makeDeps({
      render: vi.fn(async () => {
        throw new Error('trình duyệt chết giữa chừng');
      }),
    });
    const runner = createJobRunner({ store, deps, workers: 1 });
    const job = store.create({ kind: 'render', params: { location: 'Hà Nội' }, nowMs: 1 });

    runner.kick();
    await runner.drain();

    expect(store.get(job.id)!.status).toBe('failed');
    expect(store.get(job.id)!.errorKind).toBe('server');
  });

  it('AC-11: một việc nổ KHÔNG chặn việc kế tiếp — vòng thợ còn sống', async () => {
    const store = createJobStore();
    let call = 0;
    const deps = makeDeps({
      render: vi.fn(async () => {
        call++;
        if (call === 1) throw new Error('nổ bất ngờ');
        return PNG_1x1;
      }),
    });
    const runner = createJobRunner({ store, deps, workers: 1 });
    const a = store.create({ kind: 'render', params: { location: { lng: 1, lat: 1 } }, nowMs: 1 });
    const b = store.create({ kind: 'render', params: { location: { lng: 2, lat: 2 } }, nowMs: 2 });

    runner.kick();
    await runner.drain();

    expect(store.get(a.id)!.status).toBe('failed');
    expect(store.get(b.id)!.status).toBe('done');
  });

  it('AC-8: nhiều việc chạy ĐÚNG THỨ TỰ nhận', async () => {
    const store = createJobStore();
    const seen: number[] = [];
    const deps = makeDeps({
      render: vi.fn(async (cfg: RenderConfig) => {
        seen.push(cfg.camera.center[0]);
        return PNG_1x1;
      }),
    });
    const runner = createJobRunner({ store, deps, workers: 1 });
    store.create({ kind: 'render', params: { location: { lng: 1, lat: 1 } }, nowMs: 1 });
    store.create({ kind: 'render', params: { location: { lng: 2, lat: 2 } }, nowMs: 2 });
    store.create({ kind: 'render', params: { location: { lng: 3, lat: 3 } }, nowMs: 3 });

    runner.kick();
    await runner.drain();

    expect(seen).toEqual([1, 2, 3]);
  });

  it('AC-8: chạm TRẦN CLIP thì xếp hàng đúng thứ tự nhận — không ai bị đá ra', async () => {
    // Ca FIFO ở trên đo runner nói chung (việc `render`, một thợ). Chủ đề THẬT
    // của AC-8 là việc clip xếp sau một trần clip đã đầy — khác bộ đếm, khác
    // đường mã. `workers: 4` cố ý để SỐ THỢ không phải thứ giới hạn: bỏ trần
    // clip đi thì cả ba chạy chồng nhau và `peak` vọt lên 3.
    const CAP = 1;
    const store = createJobStore();
    const started: number[] = [];
    let live = 0;
    let peak = 0;
    const deps = clipDeps({
      renderClip: vi.fn(async (cfg: RenderConfig) => {
        started.push(cfg.camera.center[0]);
        live++;
        peak = Math.max(peak, live);
        await new Promise((r) => setTimeout(r, 5));
        live--;
        return { frames: [PNG_1x1, PNG_1x1], settle: PNG_1x1, anchors: fakeAnchors(cfg) };
      }),
    });
    const runner = createJobRunner({
      store,
      deps,
      workers: 4,
      slotWaitMs: 5000,
      env: { MAPPOSTER_CLIP_CONCURRENCY: String(CAP) } as unknown as NodeJS.ProcessEnv,
    });
    const ids = [1, 2, 3].map(
      (i) =>
        store.create({
          kind: 'clip',
          params: { location: { lng: i, lat: 1 }, highlight: { points: [{ lng: i, lat: 1 }] } },
          motionInput: { preset: 'pushIn' },
          nowMs: i,
        }).id,
    );

    runner.kick();
    await runner.drain();

    expect(peak).toBeLessThanOrEqual(CAP);
    expect(started).toEqual([1, 2, 3]); // K việc chờ rồi chạy ĐÚNG thứ tự nhận
    for (const id of ids) {
      const rec = store.get(id)!;
      expect(rec.status).toBe('done'); // không việc nào 'failed' vì quá tải
      expect(rec.error).toBeUndefined(); // và không lỗi concurrency nào ném ra ở lối việc
    }
  });

  it('AC-10: số việc chạy CÙNG LÚC không bao giờ vượt số thợ', async () => {
    const store = createJobStore();
    let live = 0;
    let peak = 0;
    const deps = makeDeps({
      render: vi.fn(async () => {
        live++;
        peak = Math.max(peak, live);
        await new Promise((r) => setTimeout(r, 5));
        live--;
        return PNG_1x1;
      }),
    });
    const runner = createJobRunner({ store, deps, workers: 2 });
    for (let i = 0; i < 6; i++) store.create({ kind: 'render', params: { location: { lng: i, lat: 1 } }, nowMs: i });

    runner.kick();
    await runner.drain();

    expect(peak).toBeLessThanOrEqual(2);
    expect(peak).toBeGreaterThan(1); // thật sự song song, không phải tuần tự trá hình
  });

  it('AC-10: TRỘN đồng bộ + việc — đỉnh clip đồng thời không vượt TRẦN ĐÃ CẤU HÌNH', async () => {
    // Ca trên đo số THỢ. AC-10 nói về trần clip, và trần đó dùng chung giữa
    // đường đồng bộ (/render-clip) và thợ chạy việc — nên một ca chỉ có việc
    // không chứng minh được gì: nó không bao giờ chạm vào vế đồng bộ.
    const CAP = 2;
    const env = { MAPPOSTER_CLIP_CONCURRENCY: String(CAP) } as unknown as NodeJS.ProcessEnv;
    const store = createJobStore();
    let live = 0;
    let peak = 0;
    const bump = (d: number): void => {
      live += d;
      peak = Math.max(peak, live);
    };

    const deps = clipDeps({
      renderClip: vi.fn(async (cfg: RenderConfig) => {
        bump(1);
        await new Promise((r) => setTimeout(r, 10));
        bump(-1);
        return { frames: [PNG_1x1, PNG_1x1], settle: PNG_1x1, anchors: fakeAnchors(cfg) };
      }),
    });

    // Một lời gọi ĐỒNG BỘ đang giữ một chỗ thật, qua đúng API mà /render-clip
    // dùng — cùng bộ đếm mà thợ phải tôn trọng.
    const releaseSync = acquireClipSlot(env);
    bump(1);

    const runner = createJobRunner({ store, deps, workers: 4, slotWaitMs: 5000, env });
    for (let i = 1; i <= 4; i++) {
      store.create({
        kind: 'clip',
        params: { location: { lng: i, lat: 1 }, highlight: { points: [{ lng: i, lat: 1 }] } },
        motionInput: { preset: 'pushIn' },
        nowMs: i,
      });
    }
    runner.kick();

    // cho thợ thời gian THỬ chen vào trong lúc chỗ đồng bộ còn bị giữ
    await new Promise((r) => setTimeout(r, 30));
    expect(peak).toBeLessThanOrEqual(CAP);

    bump(-1);
    releaseSync();
    await runner.drain();

    expect(peak).toBeLessThanOrEqual(CAP);
    expect(peak).toBeGreaterThan(1); // có chồng lấn thật, không phải tuần tự trá hình
  });
});

describe('createJobRunner — clip và giao ước xuống-cấp (AC-7)', () => {
  // `pushIn` chứ không phải `approach`: approach bay tới rồi vẽ dần một ranh
  // giới nên nó ĐÒI highlight.regions — dùng nó ở đây là kiểm sai thứ.
  const clipJob = {
    kind: 'clip' as const,
    params: { location: 'Đà Lạt', highlight: { points: [{ lng: 108.44, lat: 11.94 }] } },
    motionInput: { preset: 'pushIn' },
  };

  it('AC-10: slot clip được trả cả trên ĐƯỜNG XUỐNG-CẤP (encoder ngã) — không rò rỉ', async () => {
    // Nhánh xuống-cấp không với tới được từ motionCompiler.test.ts, nên mệnh đề
    // "slot được trả … bằng đường xuống-cấp" phải được canh ở đây. Rò một slot
    // trong hệ CÓ hàng chờ không phải là chậm — nó là treo vĩnh viễn cho mọi
    // việc clip phía sau.
    process.env.MAPPOSTER_CLIP_CONCURRENCY = '1';
    const store = createJobStore();
    const deps = clipDeps({
      encodeAnimation: vi.fn(async () => {
        throw new Error('ffmpeg ngã giữa chừng');
      }),
    });
    const runner = createJobRunner({ store, deps, workers: 1 });
    const job = store.create({ ...clipJob, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.degradeNote).toMatch(/encode failed/); // đã đi ĐÚNG nhánh xuống-cấp
    expect(rec.artifacts.map((a) => a.role)).toContain('settle'); // và không vứt ảnh tĩnh

    // chỗ đã về: trần là 1, nên nếu slot rò thì lời gọi này ném.
    expect(() => acquireClipSlot()).not.toThrow();
  });

  it('clip chạy trọn vẹn thì giữ CẢ ảnh tĩnh lẫn clip', async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: clipDeps(), workers: 1 });
    const job = store.create({ ...clipJob, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.error).toBeUndefined();
    expect(rec.status).toBe('done');
    expect(rec.artifacts.map((a) => a.role).sort()).toEqual(['clip', 'settle']);
  });

  it('motion echo lại MotionScript đã biên dịch — cùng hình dạng hai đường đồng bộ (tools.ts/http.ts) trả', async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: clipDeps(), workers: 1 });
    const job = store.create({ ...clipJob, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('done');
    const motion = rec.motion as { preset?: string; restAtSec: number; script?: { fps: number; camera: unknown[] } };
    expect(motion.preset).toBe('pushIn');
    expect(motion.script).toBeDefined();
    expect(Array.isArray(motion.script?.camera)).toBe(true);
    expect(motion.script?.fps).toBeGreaterThan(0);
  });

  it('PR #6: mỗi việc mang anchors + camera của CHÍNH nó, không phải của việc chạy trước', async () => {
    // Hai việc, hai toạ độ khác nhau, chạy tuần tự trên MỘT thợ. Đây là hình
    // dạng mà lỗi "dùng sai biến" ở jobRunner (đã xảy ra hai lần, 22/22 test
    // vẫn xanh) hiện ra: dùng nhầm cfg/anchors của việc kia thì lng lệch.
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: clipDeps(), workers: 1 });
    const a = store.create({ ...clipJob, nowMs: 1 });
    const b = store.create({
      kind: 'clip' as const,
      params: { location: 'Nha Trang', highlight: { points: [{ lng: 109.19, lat: 12.24 }] } },
      motionInput: { preset: 'pushIn' },
      nowMs: 2,
    });

    runner.kick();
    await runner.drain();

    const resolvedOf = (id: string) =>
      store.get(id)!.resolved as { zoom: number; camera: ClipAnchors['camera']; anchors: { points: ClipAnchors['points']; regions: ClipAnchors['regions'] } };

    expect(resolvedOf(a.id).anchors.points).toEqual([{ index: 0, lng: 108.44, lat: 11.94, xPct: 25, yPct: 75, onScreen: true }]);
    expect(resolvedOf(b.id).anchors.points).toEqual([{ index: 0, lng: 109.19, lat: 12.24, xPct: 25, yPct: 75, onScreen: true }]);
    // camera là camera NGHỈ mà renderer đo, không phải `cfg.camera` echo lại
    expect(resolvedOf(a.id).camera.zoom).toBe(resolvedOf(a.id).zoom + 1);
    expect(resolvedOf(b.id).camera.zoom).toBe(resolvedOf(b.id).zoom + 1);
    expectAnchorsXor(store.get(a.id)!.resolved, 'việc a');
    expectAnchorsXor(store.get(b.id)!.resolved, 'việc b');
  });

  it('PR #6: renderer không đo được anchors ⇒ việc VẪN xong, resolved mang anchorsUnavailable', async () => {
    const REASON = 'camera.pitch is 30 — anchors require pitch 0.';
    const store = createJobStore();
    const deps = clipDeps({
      renderClip: vi.fn(async () => ({ frames: [PNG_1x1, PNG_1x1], settle: PNG_1x1, anchorsUnavailable: REASON })),
    } as Partial<ToolDeps>);
    const runner = createJobRunner({ store, deps, workers: 1 });
    const job = store.create({ ...clipJob, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('done'); // pitch không làm hỏng việc
    expect(rec.artifacts.map((a) => a.role).sort()).toEqual(['clip', 'settle']);
    const resolved = rec.resolved as Record<string, unknown>;
    expect(resolved.anchorsUnavailable).toBe(REASON);
    expect('anchors' in resolved).toBe(false);
    expect('camera' in resolved).toBe(false);
    expectAnchorsXor(resolved, 'không đo được');
  });

  it('PR #6: degrade encoder và từ chối quá cỡ VẪN mang camera + anchors', async () => {
    const store = createJobStore();
    const degradeDeps = clipDeps({
      encodeAnimation: vi.fn(async () => {
        throw new Error('ffmpeg vắng mặt');
      }),
    } as Partial<ToolDeps>);
    const degradeRunner = createJobRunner({ store, deps: degradeDeps, workers: 1 });
    const degraded = store.create({ ...clipJob, nowMs: 1 });
    degradeRunner.kick();
    await degradeRunner.drain();
    const dRec = store.get(degraded.id)!.resolved as { anchors?: { points: unknown[] }; camera?: unknown };
    expect(store.get(degraded.id)!.degradeNote).toMatch(/encode failed/);
    expect(dRec.camera).toBeDefined();
    expect(dRec.anchors?.points).toHaveLength(1);
    expectAnchorsXor(store.get(degraded.id)!.resolved, 'degrade encode');

    process.env.MAPPOSTER_CLIP_MAX_BYTES = '1';
    const overRunner = createJobRunner({ store, deps: clipDeps(), workers: 1 });
    const over = store.create({ ...clipJob, nowMs: 2 });
    overRunner.kick();
    await overRunner.drain();
    const oRec = store.get(over.id)!.resolved as { anchors?: { points: unknown[] }; camera?: unknown };
    expect(store.get(over.id)!.status).toBe('failed');
    expect(oRec.camera).toBeDefined();
    expect(oRec.anchors?.points).toHaveLength(1);
    expectAnchorsXor(store.get(over.id)!.resolved, '422 quá cỡ');
  });

  it('encoder nổ → việc vẫn XONG, ảnh tĩnh còn nguyên, kèm lý do; không sót tệp mp4 dở', async () => {
    const store = createJobStore();
    let outPath = '';
    const deps = clipDeps({
      encodeAnimation: vi.fn(async (_f, opts: { outPath: string }) => {
        outPath = opts.outPath;
        await fsp.writeFile(opts.outPath, Buffer.alloc(8)); // ffmpeg thật để lại tệp dở
        throw new Error('ffmpeg vắng mặt');
      }),
    } as Partial<ToolDeps>);
    const runner = createJobRunner({ store, deps, workers: 1 });
    const job = store.create({ ...clipJob, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('done');
    expect(rec.artifacts.map((a) => a.role)).toEqual(['settle']); // ảnh tĩnh KHÔNG bị vứt
    expect(rec.degradeNote).toMatch(/encode failed/);
    await expect(fsp.stat(outPath)).rejects.toThrow(); // tệp dở đã dọn
  });

  it('clip vượt trần dung lượng → HỎNG, nhưng ảnh tĩnh vẫn được giữ', async () => {
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '1';
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: clipDeps(), workers: 1 });
    const job = store.create({ ...clipJob, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('failed');
    expect(rec.errorKind).toBe('input'); // người gọi sửa được: hạ fps/size
    expect(rec.artifacts.map((a) => a.role)).toEqual(['settle']);
    expect(rec.error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
  });

  it('AC-10: slot clip được trả trên MỌI lối ra — việc clip kế tiếp vẫn chạy được', async () => {
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '1'; // việc đầu chắc chắn hỏng
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: clipDeps(), workers: 1 });
    const a = store.create({ ...clipJob, nowMs: 1 });
    runner.kick();
    await runner.drain();
    expect(store.get(a.id)!.status).toBe('failed');

    delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
    const b = store.create({ ...clipJob, nowMs: 2 });
    runner.kick();
    await runner.drain();
    // Slot của việc hỏng đã về; nếu rò thì việc này treo tới hết hạn chờ.
    expect(store.get(b.id)!.status).toBe('done');
  });
});

describe('createJobRunner — dọn tệp hết hạn (AC-12)', () => {
  it('xoá đúng tệp của việc hết hạn, KHÔNG đụng tệp của công cụ khác', async () => {
    const store = createJobStore({ ttlMs: 0 });
    let clock = 1000;
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1, now: () => clock });

    // Tên có dấu đi xuyên tới TÊN TỆP — chỗ chuẩn hoá unicode hay cắn nhất.
    const job = store.create({ kind: 'render', params: { location: 'Đắk Lắk' }, nowMs: clock });
    runner.kick();
    await runner.drain();
    const written = store.get(job.id)!.artifacts[0].path;
    await expect(fsp.stat(written)).resolves.toBeDefined();

    const foreign = path.join(sinkDir, 'mapposter-cua-cong-cu-khac.png');
    await fsp.writeFile(foreign, PNG_1x1);

    clock += 10_000;
    await runner.sweep();

    expect(store.get(job.id)).toBeUndefined(); // bản ghi rời sổ
    await expect(fsp.stat(written)).rejects.toThrow(); // tệp của nó đã xoá
    await expect(fsp.stat(foreign)).resolves.toBeDefined(); // tệp lạ CÒN NGUYÊN
  });

  it('một tệp đã biến mất không làm hỏng cả lượt dọn', async () => {
    const store = createJobStore({ ttlMs: 0 });
    let clock = 1000;
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1, now: () => clock });

    const job = store.create({ kind: 'render', params: { location: 'Cà Mau' }, nowMs: clock });
    runner.kick();
    await runner.drain();
    await fsp.rm(store.get(job.id)!.artifacts[0].path); // ai đó xoá trước

    clock += 10_000;
    await expect(runner.sweep()).resolves.toBeUndefined();
  });

  it('KHÔNG dọn việc đang chờ hay đang chạy, dù sổ đã quá hạn', async () => {
    const store = createJobStore({ ttlMs: 0 });
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1, now: () => 9_999 });
    const waiting = store.create({ kind: 'render', params: { location: 'Sa Pa' }, nowMs: 0 });

    await runner.sweep();

    expect(store.get(waiting.id)).toBeDefined();
  });
});

// AC-17 — vòng soi code round 3: `pump()` tăng số thợ bận NGAY khi rút việc,
// rồi runClip mới đi chờ chỗ. Với mặc định (2 thợ, trần clip 1) chỉ hai clip
// liên tiếp là khoá sạch cả hai thợ, và mọi việc dựng ẢNH xếp sau — vốn chẳng
// cần chỗ clip nào — nằm chờ tới 10 phút. Không phép đo nào chạm tới, vì AC-8
// chỉ đo thứ tự TRONG hàng clip.
describe('AC-17: việc clip đang chờ chỗ KHÔNG được bỏ đói việc dựng ảnh', () => {
  it('với 2 thợ và trần clip 1: clip thứ hai nằm chờ, việc dựng ảnh vẫn chạy xong', async () => {
    process.env.MAPPOSTER_CLIP_CONCURRENCY = '1';
    const store = createJobStore();

    let openTheGate: () => void = () => {};
    const gate = new Promise<void>((r) => { openTheGate = r; });
    let firstClipStarted: () => void = () => {};
    const clipIsHoldingTheSlot = new Promise<void>((r) => { firstClipStarted = r; });

    const deps = clipDeps({
      renderClip: vi.fn(async (cfg: RenderConfig) => {
        firstClipStarted();
        await gate; // giữ chặt chỗ clip cho tới khi test cho phép
        return { frames: [PNG_1x1, PNG_1x1], settle: PNG_1x1, anchors: fakeAnchors(cfg) };
      }),
    } as Partial<ToolDeps>);

    const runner = createJobRunner({ store, deps, workers: 2 });
    const clipA = store.create({ ...clipJobFixture, nowMs: 1 });
    const clipB = store.create({ ...clipJobFixture, nowMs: 2 });
    const render = store.create({ kind: 'render', params: { location: 'Nha Trang' }, nowMs: 3 });

    runner.kick();
    await clipIsHoldingTheSlot;

    // Chỗ then chốt: việc dựng ảnh phải xong TRONG KHI clip A còn đang giữ chỗ.
    await vi.waitFor(() => expect(store.get(render.id)!.status).toBe('done'), { timeout: 2000 });
    expect(store.get(clipB.id)!.status).toBe('queued'); // clip B chờ, KHÔNG ăn chỗ thợ

    openTheGate();
    await runner.drain();
    expect(store.get(clipA.id)!.status).toBe('done');
    expect(store.get(clipB.id)!.status).toBe('done');
  });
});

// Vòng soi code round 4: ranh giới "pha giải = lỗi người gọi" bao luôn một lời
// gọi ra bên thứ ba. Nominatim trả 503 cho một địa danh HOÀN TOÀN HỢP LỆ thì
// người gọi bị bảo đi sửa đầu vào, và sẽ không thử lại một yêu cầu mà một giây
// sau là chạy được. Đúng lớp lỗi mà bản sửa round 1 tuyên bố đã diệt.
describe('AC-6: bên thứ ba ngã KHÔNG phải lỗi người gọi', () => {
  it('Nominatim trả 503 → lỗi tại MÁY CHỦ, dù nó xảy ra trong pha giải', async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1 });
    const job = store.create({ kind: 'render', params: { location: 'upstream-Hà Nội' }, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('failed');
    expect(rec.errorKind).toBe('server'); // KHÔNG phải 'input'
  });

  it('mạng ổn nhưng không có kết quả thì VẪN là lỗi người gọi — hai ca không được lẫn', async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1 });
    const job = store.create({ kind: 'render', params: { location: 'zzz-khong-co' }, nowMs: 1 });

    runner.kick();
    await runner.drain();

    expect(store.get(job.id)!.errorKind).toBe('input');
  });
});

describe('AC-15: đường mới không được đánh rơi trường mà đường cũ có', () => {
  it('khối clip mang cả durationSec và fps, đúng như /render-clip đồng bộ trả', async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: clipDeps(), workers: 1 });
    const job = store.create({ ...clipJobFixture, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const clip = store.get(job.id)!.artifacts.find((a) => a.role === 'clip')!;
    expect(clip.durationSec).toBeGreaterThan(0);
    expect(clip.fps).toBeGreaterThan(0);
  });
});
