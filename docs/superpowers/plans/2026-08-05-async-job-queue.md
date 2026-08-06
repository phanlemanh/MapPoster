# Async Job Queue Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cho phép người gọi gửi một yêu cầu render rồi nhận ngay một mã việc, thay vì giữ kết nối HTTP mở suốt vài phút.

**Architecture:** Hai cửa REST mới (`POST /jobs`, `POST /jobs/status`) ghi vào một sổ việc thuần dữ liệu trong bộ nhớ; một vòng thợ chạy nền rút việc, gọi thao tác render đã có, ghi kết quả xuống `sinkDir`. Bộ đếm slot clip hiện có được nâng thành bộ cấp-phát hai chính sách: đường đồng bộ giữ lối ném-ngay, thợ dùng lối xếp-hàng-có-hạn. Trần đồng thời vẫn nằm ở đúng một chỗ.

**Tech Stack:** TypeScript, Node `node:http`, Zod, Vitest. Không thêm dependency mới.

## Global Constraints

- **Đường đồng bộ `/render` và `/render-clip` giữ nguyên hành vi từng chữ**, kể cả `429` khi chạm trần. Test 429 sẵn có phải xanh nguyên vẹn (AC-9).
- **Bất biến immutability của repo**: không mutate object đã có; tạo object mới bằng spread. Đã áp ở `prepareClipRender` (`{ ...resolvedBase, chrome: 'clean' }`).
- **`jobStore.ts` KHÔNG BAO GIỜ import `node:fs`.** Thợ (`jobRunner.ts`) là đơn vị duy nhất chạm đĩa, cả lúc ghi lẫn lúc xoá (AC-12).
- **Mọi núm chỉnh đọc qua `envNumber`** (`mcp-server/config.ts`) với cận dưới — không `Number(process.env.X ?? D)`.
- **Không `console.log`** trong mã sản phẩm; `console.error` cho log khởi động là nếp đã có.
- **Mã HTTP nói về *câu hỏi*, thân nói về *việc*.** Hỏi một việc đã hỏng vẫn là `200`. Ngoại lệ duy nhất: mã việc không tồn tại → `404`.
- Bốn núm mới, tên chính xác: `MAPPOSTER_JOB_WORKERS` · `MAPPOSTER_MAX_QUEUED_JOBS` (mặc định 50) · `MAPPOSTER_JOB_TTL_MS` (mặc định 30 phút) · `MAPPOSTER_JOB_SLOT_WAIT_MS` (mặc định 10 phút).
- Ít nhất một ca test ở mỗi tầng dùng địa danh tiếng Việt **có dấu**.

## File Structure

| File | Trách nhiệm |
|---|---|
| `mcp-server/config.ts` (sửa) | Ba hằng mặc định mới cho hàng đợi |
| `mcp-server/src/jobStore.ts` (tạo) | Sổ việc thuần dữ liệu: bản ghi, trạng thái, trần hàng chờ, phát danh sách hết hạn. Không `fs`, không `Date.now()` ngầm |
| `mcp-server/src/jobStore.test.ts` (tạo) | Test cho trên |
| `mcp-server/src/motionCompiler.ts` (sửa) | Bộ đếm slot clip hai chính sách; tách `prepareClipRender` thành phần-có-slot và phần-không-slot |
| `mcp-server/src/motionCompiler.test.ts` (sửa) | Thêm test lối chờ; giữ nguyên test lối ném-ngay |
| `mcp-server/src/jobRunner.ts` (tạo) | Vòng thợ: rút việc, render, ghi đĩa, dọn tệp hết hạn |
| `mcp-server/src/jobRunner.test.ts` (tạo) | Test cho trên |
| `mcp-server/src/http.ts` (sửa) | Hai cửa `POST` mới, sau chuỗi guard sẵn có |
| `mcp-server/src/http.test.ts` (sửa) | Test hai cửa mới + bảng guard chung ba cửa |

## Task Dependency

- **Task 1** và **Task 2** độc lập nhau (`independent: true`) — khác file, không chia sẻ ký hiệu nào.
- **Task 3** cần Task 1 + Task 2 (`independent: false`).
- **Task 4** cần Task 1 + Task 3 (`independent: false`).

---

### Task 1: Sổ việc thuần dữ liệu

**independent:** `true` (song song được với Task 2)

**Files:**
- Modify: `mcp-server/config.ts` (thêm hằng, cuối khối hằng hiện có quanh dòng 48)
- Create: `mcp-server/src/jobStore.ts`
- Test: `mcp-server/src/jobStore.test.ts`

**Verify command:** `npx vitest run mcp-server/src/jobStore.test.ts`

**Phục vụ eval:** E4 (AC-3 — trần là bất biến của chính sổ), E17 (AC-12 — phát danh sách hết hạn, và sổ không chạm đĩa)

**Interfaces:**
- Consumes: `envNumber` từ `../config` (không dùng ở task này, nhưng hằng mặc định khai ở đó).
- Produces — Task 3 và Task 4 dựa vào ĐÚNG các tên này:
  - `type JobKind = 'render' | 'clip'`
  - `type JobStatus = 'queued' | 'running' | 'done' | 'failed'`
  - `type JobErrorKind = 'input' | 'server'`
  - `interface JobArtifact { path: string; role: 'image' | 'clip' | 'settle'; format: 'png' | 'mp4'; width: number; height: number; bytes: number }`
  - `interface JobRecord { id: string; kind: JobKind; status: JobStatus; params: unknown; motionInput?: unknown; createdAt: number; startedAt?: number; finishedAt?: number; artifacts: JobArtifact[]; resolved?: unknown; motion?: unknown; error?: string; errorKind?: JobErrorKind; degradeNote?: string }`
  - `class JobQueueFullError extends Error { constructor(limit: number) }`
  - `interface JobStore { create(input: {kind: JobKind; params: unknown; motionInput?: unknown; nowMs: number}): JobRecord; get(id: string): JobRecord | undefined; claimNext(nowMs: number): JobRecord | undefined; finish(id: string, patch: JobFinishPatch, nowMs: number): void; takeExpired(nowMs: number): JobRecord[]; pendingCount(): number; size(): number }`
  - `interface JobFinishPatch { status: 'done' | 'failed'; artifacts?: JobArtifact[]; resolved?: unknown; motion?: unknown; error?: string; errorKind?: JobErrorKind; degradeNote?: string }`
  - `function createJobStore(opts?: { maxQueued?: number; ttlMs?: number; newId?: () => string }): JobStore`

- [ ] **Step 1: Thêm ba hằng mặc định vào `mcp-server/config.ts`**

Chèn ngay SAU khối `DEFAULT_CLIP_CONCURRENCY` (quanh dòng 48), TRƯỚC hàm `envNumber`:

```typescript
/** 50 việc đang chờ: hàng chờ không trần là OOM có hẹn giờ. Bản ghi rẻ, nhưng
 * mỗi việc chờ giữ nguyên `params` của người gọi (có thể chứa GeoJSON inline). */
export const DEFAULT_MAX_QUEUED_JOBS = 50;

/** 30 phút giữ một việc đã kết thúc: đủ để người gọi hỏi lại vài nhịp, đủ ngắn
 * để `sinkDir` không phình. Hết hạn thì bản ghi rời sổ VÀ tệp của nó bị xoá. */
export const DEFAULT_JOB_TTL_MS = 30 * 60 * 1000;

/** 10 phút chờ một slot clip: khớp `DEFAULT_POOL_ACQUIRE_TIMEOUT_MS` ngay trên.
 * Chờ không hạn không phải kiên nhẫn — nó là treo vĩnh viễn đội lốt "đang chờ". */
export const DEFAULT_JOB_SLOT_WAIT_MS = 10 * 60 * 1000;
```

- [ ] **Step 2: Viết test thất bại cho sổ việc**

Tạo `mcp-server/src/jobStore.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { createJobStore, JobQueueFullError } from './jobStore';

/** Ids đếm tăng nên assert đọc được; production dùng crypto.randomUUID. */
function seqIds() {
  let n = 0;
  return () => `job-${++n}`;
}

describe('createJobStore', () => {
  it('nhận việc rồi trả bản ghi tra lại được ngay — không có cửa sổ trống', () => {
    const store = createJobStore({ newId: seqIds() });
    const rec = store.create({ kind: 'render', params: { location: 'Đà Nẵng' }, nowMs: 1000 });

    expect(rec.id).toBe('job-1');
    expect(rec.status).toBe('queued');
    expect(store.get('job-1')).toEqual(rec);
    expect(store.pendingCount()).toBe(1);
  });

  it('giữ nguyên từng ký tự của tên địa danh có dấu đi qua sổ', () => {
    const store = createJobStore({ newId: seqIds() });
    const rec = store.create({ kind: 'render', params: { location: 'Thừa Thiên Huế' }, nowMs: 1 });
    expect((store.get(rec.id)!.params as { location: string }).location).toBe('Thừa Thiên Huế');
  });

  it('trả undefined cho mã lạ — không đoán, không dựng bản ghi rỗng', () => {
    const store = createJobStore({ newId: seqIds() });
    expect(store.get('khong-co-that')).toBeUndefined();
  });

  it('TỪ CHỐI khi hàng chờ chạm trần — trần là bất biến của chính sổ, không nhờ tầng HTTP', () => {
    const store = createJobStore({ maxQueued: 2, newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 1 });
    store.create({ kind: 'render', params: {}, nowMs: 2 });

    expect(() => store.create({ kind: 'render', params: {}, nowMs: 3 })).toThrow(JobQueueFullError);
    expect(store.size()).toBe(2); // không bản ghi thứ ba nào được tạo
  });

  it('chỉ ĐANG CHỜ mới tính vào trần — việc đã chạy nhả chỗ cho việc mới', () => {
    const store = createJobStore({ maxQueued: 1, newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 1 });
    expect(store.claimNext(2)!.id).toBe('job-1');

    expect(() => store.create({ kind: 'render', params: {}, nowMs: 3 })).not.toThrow();
  });

  it('rút việc theo ĐÚNG thứ tự nhận, và chỉ rút việc đang chờ', () => {
    const store = createJobStore({ newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 1 });
    store.create({ kind: 'clip', params: {}, nowMs: 2 });

    expect(store.claimNext(3)!.id).toBe('job-1');
    expect(store.claimNext(4)!.id).toBe('job-2');
    expect(store.claimNext(5)).toBeUndefined();
    expect(store.get('job-1')!.status).toBe('running');
    expect(store.get('job-1')!.startedAt).toBe(3);
  });

  it('kết thúc việc thì ghi trạng thái cuối kèm lý do và lỗi tại ai', () => {
    const store = createJobStore({ newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 1 });
    store.claimNext(2);
    store.finish('job-1', { status: 'failed', error: 'khong tra duoc toa do', errorKind: 'input' }, 9);

    const rec = store.get('job-1')!;
    expect(rec.status).toBe('failed');
    expect(rec.errorKind).toBe('input');
    expect(rec.finishedAt).toBe(9);
  });

  it('takeExpired chỉ lấy việc đã KẾT THÚC và quá hạn, rồi BỎ chúng khỏi sổ', () => {
    const store = createJobStore({ ttlMs: 100, newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 0 });   // job-1 -> done lúc 10
    store.create({ kind: 'render', params: {}, nowMs: 0 });   // job-2 -> vẫn đang chờ
    store.claimNext(1);
    store.finish('job-1', { status: 'done' }, 10);

    expect(store.takeExpired(50)).toEqual([]);                // chưa quá hạn

    const gone = store.takeExpired(111);
    expect(gone.map((r) => r.id)).toEqual(['job-1']);
    expect(store.get('job-1')).toBeUndefined();               // đã rời sổ
    expect(store.get('job-2')).toBeDefined();                 // việc đang chờ KHÔNG bị dọn
  });

  it('takeExpired trả bản ghi KÈM đường dẫn tệp để bên khác đi xoá', () => {
    const store = createJobStore({ ttlMs: 1, newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 0 });
    store.claimNext(0);
    store.finish(
      'job-1',
      { status: 'done', artifacts: [{ path: '/tmp/x/job-1.png', role: 'image', format: 'png', width: 2, height: 3, bytes: 4 }] },
      0,
    );

    expect(store.takeExpired(100)[0].artifacts[0].path).toBe('/tmp/x/job-1.png');
  });

  it('KHÔNG BAO GIỜ chạm hệ thống tệp — sổ là thuần dữ liệu', () => {
    const src = readFileSync(new URL('./jobStore.ts', import.meta.url), 'utf8');
    expect(src).not.toMatch(/from ['"]node:fs['"]/);
    expect(src).not.toMatch(/require\(['"]node:fs['"]\)/);
  });
});
```

- [ ] **Step 3: Chạy test để chắc nó ĐỎ**

Run: `npx vitest run mcp-server/src/jobStore.test.ts`
Expected: FAIL — `Failed to resolve import "./jobStore"`.

- [ ] **Step 4: Viết `mcp-server/src/jobStore.ts`**

```typescript
import { DEFAULT_JOB_TTL_MS, DEFAULT_MAX_QUEUED_JOBS } from '../config';

export type JobKind = 'render' | 'clip';
export type JobStatus = 'queued' | 'running' | 'done' | 'failed';
/** Lỗi tại ai: đầu vào của người gọi, hay hạ tầng của mình. Cùng phân biệt mà
 * `/render` đã dựng ra giữa 400 và 500 — ở đây nó sống trong THÂN phản hồi,
 * vì mã HTTP của lệnh hỏi luôn là 200. */
export type JobErrorKind = 'input' | 'server';

export interface JobArtifact {
  /** Đường dẫn tuyệt đối THỢ đã ghi. Là nguồn duy nhất để dọn sau này. */
  path: string;
  role: 'image' | 'clip' | 'settle';
  format: 'png' | 'mp4';
  width: number;
  height: number;
  bytes: number;
}

export interface JobRecord {
  id: string;
  kind: JobKind;
  status: JobStatus;
  params: unknown;
  motionInput?: unknown;
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  artifacts: JobArtifact[];
  resolved?: unknown;
  motion?: unknown;
  error?: string;
  errorKind?: JobErrorKind;
  /** Kết thúc một phần: clip hỏng nhưng ảnh tĩnh vẫn còn (giao ước xuống-cấp). */
  degradeNote?: string;
}

export interface JobFinishPatch {
  status: 'done' | 'failed';
  artifacts?: JobArtifact[];
  resolved?: unknown;
  motion?: unknown;
  error?: string;
  errorKind?: JobErrorKind;
  degradeNote?: string;
}

export class JobQueueFullError extends Error {
  constructor(limit: number) {
    super(`Job queue is full (limit ${limit}, MAPPOSTER_MAX_QUEUED_JOBS) — retry shortly.`);
    this.name = 'JobQueueFullError';
  }
}

export interface JobStore {
  create(input: { kind: JobKind; params: unknown; motionInput?: unknown; nowMs: number }): JobRecord;
  get(id: string): JobRecord | undefined;
  /** Việc đang chờ CŨ NHẤT → chuyển sang đang chạy. Không còn việc chờ thì undefined. */
  claimNext(nowMs: number): JobRecord | undefined;
  finish(id: string, patch: JobFinishPatch, nowMs: number): void;
  /**
   * Bản ghi đã KẾT THÚC và quá hạn giữ: bỏ khỏi sổ và TRẢ VỀ cho bên gọi.
   * Sổ không xoá tệp — nó chỉ nói cái nào hết hạn; thợ mới là bên chạm đĩa.
   */
  takeExpired(nowMs: number): JobRecord[];
  pendingCount(): number;
  size(): number;
}

const isTerminal = (s: JobStatus): boolean => s === 'done' || s === 'failed';

export function createJobStore(
  opts: { maxQueued?: number; ttlMs?: number; newId?: () => string } = {},
): JobStore {
  const maxQueued = opts.maxQueued ?? DEFAULT_MAX_QUEUED_JOBS;
  const ttlMs = opts.ttlMs ?? DEFAULT_JOB_TTL_MS;
  const newId = opts.newId ?? (() => crypto.randomUUID());

  // Map giữ THỨ TỰ chèn, nên `claimNext` chỉ cần quét tới việc đang chờ đầu tiên
  // — thứ tự phục vụ là thứ tự nhận, không cần sắp xếp gì thêm.
  const jobs = new Map<string, JobRecord>();

  const countPending = (): number => {
    let n = 0;
    for (const r of jobs.values()) if (r.status === 'queued') n++;
    return n;
  };

  return {
    create({ kind, params, motionInput, nowMs }) {
      // Trần đếm việc ĐANG CHỜ, không phải tổng bản ghi: một việc đã chạy hoặc
      // đã xong không chiếm chỗ của người mới, nó chỉ còn chờ hết hạn.
      if (countPending() >= maxQueued) throw new JobQueueFullError(maxQueued);

      const rec: JobRecord = { id: newId(), kind, status: 'queued', params, motionInput, createdAt: nowMs, artifacts: [] };
      jobs.set(rec.id, rec);
      return rec;
    },

    get(id) {
      return jobs.get(id);
    },

    claimNext(nowMs) {
      for (const rec of jobs.values()) {
        if (rec.status !== 'queued') continue;
        const next: JobRecord = { ...rec, status: 'running', startedAt: nowMs };
        jobs.set(next.id, next);
        return next;
      }
      return undefined;
    },

    finish(id, patch, nowMs) {
      const rec = jobs.get(id);
      if (!rec) return; // đã bị dọn trong lúc chạy — không dựng lại bản ghi ma
      jobs.set(id, { ...rec, ...patch, artifacts: patch.artifacts ?? rec.artifacts, finishedAt: nowMs });
    },

    takeExpired(nowMs) {
      const expired: JobRecord[] = [];
      for (const rec of jobs.values()) {
        if (!isTerminal(rec.status)) continue;
        if (rec.finishedAt === undefined) continue;
        if (nowMs - rec.finishedAt < ttlMs) continue;
        expired.push(rec);
      }
      for (const rec of expired) jobs.delete(rec.id);
      return expired;
    },

    pendingCount: countPending,
    size: () => jobs.size,
  };
}
```

- [ ] **Step 5: Chạy test để chắc nó XANH**

Run: `npx vitest run mcp-server/src/jobStore.test.ts`
Expected: PASS — 10 test.

- [ ] **Step 6: Typecheck**

Run: `npx tsc -p mcp-server/tsconfig.json`
Expected: không output, exit 0.

- [ ] **Step 7: Commit**

```bash
git add mcp-server/config.ts mcp-server/src/jobStore.ts mcp-server/src/jobStore.test.ts
git commit -m "feat(jobs): sổ việc thuần dữ liệu — trần hàng chờ, thứ tự nhận, phát danh sách hết hạn"
```

---

### Task 2: Bộ đếm slot clip hai chính sách

**independent:** `true` (song song được với Task 1)

**Files:**
- Modify: `mcp-server/src/motionCompiler.ts:292-380` (khối `ClipConcurrencyError` → `prepareClipRender`)
- Test: `mcp-server/src/motionCompiler.test.ts` (thêm một `describe` mới, KHÔNG sửa test cũ)

**Verify command:** `npx vitest run mcp-server/src/motionCompiler.test.ts mcp-server/src/http.test.ts mcp-server/src/tools.test.ts`

**Phục vụ eval:** E13 (AC-10 — đánh thức đúng thứ tự, trả slot trên mọi lối ra), E19 (AC-14 — chờ có hạn), và **chống thụt lùi** E11/E12 (AC-9 — lối ném-ngay không đổi hành vi)

**Interfaces:**
- Consumes: `envNumber`, `DEFAULT_CLIP_CONCURRENCY` từ `../config` (đã import sẵn trong file); thêm `DEFAULT_JOB_SLOT_WAIT_MS` từ Task 1.
- Produces — Task 3 dựa vào ĐÚNG các tên này:
  - `class ClipSlotWaitTimeoutError extends Error { constructor(timeoutMs: number) }`
  - `function acquireClipSlotWaiting(opts?: { timeoutMs?: number; env?: NodeJS.ProcessEnv }): Promise<() => void>`
  - `function prepareClipRenderWithSlot(params: RenderMapParams, motionInput: unknown, releaseClipSlot: () => void, env?: NodeJS.ProcessEnv): Promise<ClipPreparation>`
  - `function resetClipGateForTests(): void`
  - `acquireClipSlot` và `prepareClipRender` giữ NGUYÊN chữ ký và hành vi.

- [ ] **Step 1: Viết test thất bại cho lối chờ**

Thêm vào CUỐI `mcp-server/src/motionCompiler.test.ts` (giữ nguyên mọi test đang có):

```typescript
import { afterEach, beforeEach, vi } from 'vitest';
import {
  acquireClipSlot,
  acquireClipSlotWaiting,
  ClipConcurrencyError,
  ClipSlotWaitTimeoutError,
  resetClipGateForTests,
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

  it('slot được trả trên MỌI lối ra — kể cả khi bên giữ ném lỗi', async () => {
    const release = acquireClipSlot();
    try {
      throw new Error('bên giữ slot nổ giữa chừng');
    } catch {
      release();
    }
    // slot đã về, người chờ tiếp theo lấy được ngay
    await expect(acquireClipSlotWaiting({ timeoutMs: 10 })).resolves.toBeTypeOf('function');
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
```

- [ ] **Step 2: Chạy test để chắc nó ĐỎ**

Run: `npx vitest run mcp-server/src/motionCompiler.test.ts`
Expected: FAIL — `acquireClipSlotWaiting is not a function` (và `ClipSlotWaitTimeoutError` undefined).

- [ ] **Step 3: Thay khối cổng slot trong `mcp-server/src/motionCompiler.ts`**

Thay TOÀN BỘ đoạn từ `let clipsInFlight = 0;` tới hết `acquireClipSlot` bằng:

```typescript
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
```

Thêm `DEFAULT_JOB_SLOT_WAIT_MS` vào dòng import sẵn có từ `../config`.

- [ ] **Step 4: Tách `prepareClipRender` thành phần-có-slot và phần-không-slot**

Thay `export async function prepareClipRender(...)` bằng HAI hàm — giữ nguyên toàn bộ khối chú thích đang có phía trên:

```typescript
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
      const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
      throw new MotionParamError(message);
    }
    return { cfg: { ...resolvedBase, motion: resolved.motion }, motion: resolved.motion, preset: resolved.preset, releaseClipSlot };
  } catch (e) {
    releaseClipSlot();
    throw e;
  }
}
```

- [ ] **Step 5: Chạy test mới để chắc nó XANH**

Run: `npx vitest run mcp-server/src/motionCompiler.test.ts`
Expected: PASS — mọi test cũ vẫn xanh, cộng 6 test mới.

- [ ] **Step 6: Chạy test CHỐNG THỤT LÙI trên hai bề mặt đồng bộ**

Run: `npx vitest run mcp-server/src/http.test.ts mcp-server/src/tools.test.ts`
Expected: PASS. Đặc biệt phải xanh: test `429: MAPPOSTER_CLIP_CONCURRENCY=1 — a second /render-clip while one is still in flight is rejected` (`http.test.ts:570`). Test này ĐỎ nghĩa là hàng chờ đã rò sang đường đồng bộ — dừng lại và sửa, đừng đổi test.

- [ ] **Step 7: Typecheck rồi commit**

Run: `npx tsc -p mcp-server/tsconfig.json`

```bash
git add mcp-server/src/motionCompiler.ts mcp-server/src/motionCompiler.test.ts
git commit -m "feat(clip-gate): thêm lối lấy slot có hàng chờ, giữ nguyên lối ném-ngay của đường đồng bộ"
```

---

### Task 3: Vòng thợ chạy việc

**independent:** `false` — cần Task 1 (`jobStore`) và Task 2 (`acquireClipSlotWaiting`, `prepareClipRenderWithSlot`)

**Files:**
- Create: `mcp-server/src/jobRunner.ts`
- Test: `mcp-server/src/jobRunner.test.ts`

**Verify command:** `npx vitest run mcp-server/src/jobRunner.test.ts`

**Phục vụ eval:** E7 (AC-5 — seam đường-dẫn-ghi ↔ đường-dẫn-lưu), E9 (AC-7 — xuống cấp), E10 (AC-8 — xếp hàng đúng thứ tự), E14 (AC-10 — đỉnh đồng thời), E15 (AC-11 — một việc hỏng không giết vòng), E16 (AC-12 — thợ xoá đúng tệp của mình)

**Interfaces:**
- Consumes: mọi thứ Task 1 và Task 2 produce; `ToolDeps` từ `./tools`; `deliver` từ `./delivery`; `resolveConfig` từ `./resolveConfig`; `resolvedOf` từ `./tools`.
- Produces — Task 4 dựa vào ĐÚNG các tên này:
  - `interface JobRunnerOptions { store: JobStore; deps: ToolDeps; workers?: number; slotWaitMs?: number; now?: () => number; env?: NodeJS.ProcessEnv }`
  - `interface JobRunner { kick(): void; sweep(): Promise<void>; drain(): Promise<void>; stop(): void }`
  - `function createJobRunner(opts: JobRunnerOptions): JobRunner`

- [ ] **Step 1: Viết test thất bại cho vòng thợ**

Tạo `mcp-server/src/jobRunner.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fsp } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

vi.mock('./geocode', () => ({
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) => {
    if (typeof input === 'string' && input.toLowerCase().startsWith('zzz')) throw new Error(`No geocoding result for "${input}"`);
    return typeof input === 'string'
      ? { center: [106.7, 10.78], zoom: 12, place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } };
  }),
  searchCandidates: vi.fn(async () => []),
  resolveBoundary: vi.fn(async () => null),
  resolveCountryAt: vi.fn(async () => 'Vietnam'),
}));

import { createJobStore } from './jobStore';
import { createJobRunner } from './jobRunner';
import { resetClipGateForTests } from './motionCompiler';
import type { ToolDeps } from './tools';

/** PNG 1×1 hợp lệ — `deliver` đọc width/height từ khối IHDR nên header phải thật. */
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

let sinkDir: string;

function makeDeps(over: Partial<ToolDeps> = {}): ToolDeps {
  return {
    sinkDir,
    defaultDelivery: 'url',
    render: vi.fn(async () => PNG_1x1),
    ...over,
  } as ToolDeps;
}

beforeEach(async () => {
  resetClipGateForTests();
  sinkDir = await fsp.mkdtemp(path.join(tmpdir(), 'mapposter-jobs-'));
});

afterEach(async () => {
  resetClipGateForTests();
  await fsp.rm(sinkDir, { recursive: true, force: true });
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
    // tệp TỒN TẠI đúng đường dẫn ghi trong bản ghi, và nội dung là byte thợ ghi
    await expect(fsp.readFile(rec.artifacts[0].path)).resolves.toEqual(PNG_1x1);
    expect(rec.artifacts[0].bytes).toBe(PNG_1x1.length);
  });

  it("AC-5: trạng thái chỉ lật sang 'done' SAU khi ghi xong — không bao giờ đọc ra ENOENT", async () => {
    const store = createJobStore();
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1 });
    const job = store.create({ kind: 'render', params: { location: 'Huế' }, nowMs: 1 });

    runner.kick();
    await runner.drain();

    const rec = store.get(job.id)!;
    expect(rec.status).toBe('done');
    await expect(fsp.stat(rec.artifacts[0].path)).resolves.toBeDefined();
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

  it('AC-6: render nổ → hỏng vì MÁY CHỦ', async () => {
    const store = createJobStore();
    const deps = makeDeps({ render: vi.fn(async () => { throw new Error('trình duyệt chết'); }) });
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
    const a = store.create({ kind: 'render', params: { location: 'A' }, nowMs: 1 });
    const b = store.create({ kind: 'render', params: { location: 'B' }, nowMs: 2 });

    runner.kick();
    await runner.drain();

    expect(store.get(a.id)!.status).toBe('failed');
    expect(store.get(b.id)!.status).toBe('done');
  });

  it('AC-8: nhiều việc chạy ĐÚNG THỨ TỰ nhận', async () => {
    const store = createJobStore();
    const seen: string[] = [];
    const deps = makeDeps({
      render: vi.fn(async (cfg) => {
        seen.push((cfg as { place: { name: string } }).place.name || 'x');
        return PNG_1x1;
      }),
    });
    const runner = createJobRunner({ store, deps, workers: 1 });
    store.create({ kind: 'render', params: { location: { lng: 1, lat: 1 } , placeName: 'một' }, nowMs: 1 });
    store.create({ kind: 'render', params: { location: { lng: 2, lat: 2 }, placeName: 'hai' }, nowMs: 2 });
    store.create({ kind: 'render', params: { location: { lng: 3, lat: 3 }, placeName: 'ba' }, nowMs: 3 });

    runner.kick();
    await runner.drain();

    expect(seen).toEqual(['một', 'hai', 'ba']);
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
    expect(peak).toBeGreaterThan(1); // thật sự có chạy song song, không phải tuần tự trá hình
  });
});

describe('createJobRunner — dọn tệp hết hạn (AC-12)', () => {
  it('xoá đúng tệp của việc hết hạn, KHÔNG đụng tệp của công cụ khác', async () => {
    const store = createJobStore({ ttlMs: 0 });
    let clock = 1000;
    const runner = createJobRunner({ store, deps: makeDeps(), workers: 1, now: () => clock });

    const job = store.create({ kind: 'render', params: { location: 'Đắk Lắk' }, nowMs: clock });
    runner.kick();
    await runner.drain();
    const written = store.get(job.id)!.artifacts[0].path;

    const foreign = path.join(sinkDir, 'mapposter-cua-cong-cu-khac.png');
    await fsp.writeFile(foreign, PNG_1x1);

    clock += 10_000;
    await runner.sweep();

    expect(store.get(job.id)).toBeUndefined();                       // bản ghi rời sổ
    await expect(fsp.stat(written)).rejects.toThrow();                // tệp của nó đã xoá
    await expect(fsp.stat(foreign)).resolves.toBeDefined();           // tệp lạ CÒN NGUYÊN
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
});
```

- [ ] **Step 2: Chạy test để chắc nó ĐỎ**

Run: `npx vitest run mcp-server/src/jobRunner.test.ts`
Expected: FAIL — `Failed to resolve import "./jobRunner"`.

- [ ] **Step 3: Viết `mcp-server/src/jobRunner.ts`**

```typescript
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { envNumber, DEFAULT_CLIP_MAX_BYTES } from '../config';
import { deliver } from './delivery';
import { resolveConfig } from './resolveConfig';
import { resolvedOf, type ToolDeps } from './tools';
import { acquireClipSlotWaiting, prepareClipRenderWithSlot, MotionParamError } from './motionCompiler';
import { slugify } from '../../src/lib/format';
import type { JobArtifact, JobFinishPatch, JobRecord, JobStore } from './jobStore';

export interface JobRunnerOptions {
  store: JobStore;
  deps: ToolDeps;
  /** Số việc chạy cùng lúc. Mặc định 1 — bên gọi nên đặt bằng sức chứa hồ trình duyệt. */
  workers?: number;
  slotWaitMs?: number;
  now?: () => number;
  env?: NodeJS.ProcessEnv;
}

export interface JobRunner {
  /** Báo có việc mới; thợ rảnh sẽ rút. An toàn khi gọi nhiều lần. */
  kick(): void;
  /** Một lượt dọn: lấy việc hết hạn khỏi sổ rồi xoá tệp của chúng. */
  sweep(): Promise<void>;
  /** Chờ tới khi không còn việc nào đang chạy hoặc đang chờ (dùng trong test). */
  drain(): Promise<void>;
  /** Thôi nhận việc mới; việc đang chạy vẫn chạy nốt. */
  stop(): void;
}

/** Lỗi của NGƯỜI GỌI, không phải của mình: đầu vào không dựng được. */
const isCallerFault = (e: unknown): boolean =>
  e instanceof MotionParamError || /No geocoding result|not resolve|invalid/i.test((e as Error)?.message ?? '');

let counter = 0;
const fileNameFor = (kind: string, placeName: string): string =>
  `mapposter-job-${kind}-${slugify(placeName || 'map')}-${counter++}`;

export function createJobRunner({ store, deps, workers = 1, slotWaitMs, now = Date.now, env = process.env }: JobRunnerOptions): JobRunner {
  let live = 0;
  let stopped = false;
  const idleWaiters: (() => void)[] = [];

  const settleIdle = (): void => {
    if (live > 0) return;
    while (idleWaiters.length) idleWaiters.shift()!();
  };

  async function runRender(job: JobRecord): Promise<JobFinishPatch> {
    const cfg = await resolveConfig(job.params as Parameters<typeof resolveConfig>[0]);
    const png = await deps.render(cfg);
    // 'url' chứ không phải 'both': kết quả sống trên ĐĨA, thân phản hồi được
    // dựng lúc HỎI. Giữ base64 trong sổ là đúng thứ thiết kế đi tránh.
    const out = await deliver(png, fileNameFor('render', cfg.place.name), 'url', { sinkDir: deps.sinkDir });
    const artifact: JobArtifact = {
      path: out.path!,
      role: 'image',
      format: 'png',
      width: out.width,
      height: out.height,
      bytes: png.length,
    };
    return { status: 'done', artifacts: [artifact], resolved: resolvedOf(cfg) };
  }

  async function runClip(job: JobRecord): Promise<JobFinishPatch> {
    if (!deps.renderClip || !deps.encodeAnimation) throw new Error('clip rendering not wired (renderClip/encodeAnimation deps missing)');

    // Lối CHỜ, không phải lối ném-ngay: thợ được xếp hàng, đường đồng bộ thì không.
    const release = await acquireClipSlotWaiting({ timeoutMs: slotWaitMs, env });
    const prep = await prepareClipRenderWithSlot(job.params as Parameters<typeof resolveConfig>[0], job.motionInput, release, env);
    const { cfg, motion, preset, releaseClipSlot } = prep;
    try {
      const { frames, settle } = await deps.renderClip(cfg);
      const name = fileNameFor('clip', cfg.place.name);
      const settleOut = await deliver(settle, `${name}-settle`, 'url', { sinkDir: deps.sinkDir });
      const settleArtifact: JobArtifact = {
        path: settleOut.path!,
        role: 'settle',
        format: 'png',
        width: settleOut.width,
        height: settleOut.height,
        bytes: settle.length,
      };
      const motionOut = { ...(preset ? { preset } : {}), restAtSec: motion.restAtSec };
      const outPath = path.join(deps.sinkDir, `${name}.mp4`);

      let bytes: number;
      try {
        await deps.encodeAnimation(frames, { fps: motion.fps, format: 'mp4', outPath });
        ({ size: bytes } = await fs.stat(outPath));
      } catch (e) {
        // Giao ước xuống-cấp: khung đã chụp xong, ảnh tĩnh đã ghi — không bao
        // giờ vứt nó đi vì encoder hỏng. Dọn tệp mp4 dở dang; lỗi dọn không
        // được che lỗi gốc.
        await fs.rm(outPath, { force: true }).catch(() => {});
        return {
          status: 'done',
          artifacts: [settleArtifact],
          resolved: resolvedOf(cfg),
          motion: motionOut,
          degradeNote: `encode failed: ${(e as Error).message ?? String(e)}`,
        };
      }

      const cap = envNumber(env, 'MAPPOSTER_CLIP_MAX_BYTES', DEFAULT_CLIP_MAX_BYTES, { min: 1 });
      if (bytes > cap) {
        await fs.rm(outPath, { force: true }).catch(() => {});
        // Hỏng vì chính sách kích thước — lỗi người gọi sửa được (hạ fps/size),
        // NHƯNG ảnh tĩnh đã dựng vẫn giữ nguyên trong artifacts.
        return {
          status: 'failed',
          artifacts: [settleArtifact],
          resolved: resolvedOf(cfg),
          motion: motionOut,
          error: `clip is ${bytes} bytes, over MAPPOSTER_CLIP_MAX_BYTES=${cap} — lower fps/durationSec or size`,
          errorKind: 'input',
        };
      }

      const clipArtifact: JobArtifact = {
        path: outPath,
        role: 'clip',
        format: 'mp4',
        width: cfg.size.width,
        height: cfg.size.height,
        bytes,
      };
      return { status: 'done', artifacts: [settleArtifact, clipArtifact], resolved: resolvedOf(cfg), motion: motionOut };
    } finally {
      releaseClipSlot();
    }
  }

  async function runOne(job: JobRecord): Promise<void> {
    try {
      const patch = job.kind === 'clip' ? await runClip(job) : await runRender(job);
      store.finish(job.id, patch, now());
    } catch (e) {
      // MỘT việc hỏng không được giết vòng thợ: mọi lỗi dừng ở đây và trở
      // thành trạng thái của chính việc đó.
      store.finish(
        job.id,
        { status: 'failed', error: (e as Error).message ?? String(e), errorKind: isCallerFault(e) ? 'input' : 'server' },
        now(),
      );
    }
  }

  function pump(): void {
    if (stopped) return;
    while (live < workers) {
      const job = store.claimNext(now());
      if (!job) break;
      live++;
      void runOne(job).finally(() => {
        live--;
        pump();
        settleIdle();
      });
    }
    settleIdle();
  }

  return {
    kick: pump,
    stop: () => {
      stopped = true;
    },
    drain: () =>
      new Promise<void>((resolve) => {
        if (live === 0 && !store.claimNextPeek()) return resolve();
        idleWaiters.push(resolve);
      }),
    sweep: async () => {
      for (const rec of store.takeExpired(now())) {
        for (const a of rec.artifacts) {
          // Chỉ xoá tệp GHI TRONG BẢN GHI — không quét thư mục theo khuôn tên;
          // sinkDir còn chứa sản phẩm của các công cụ MCP khác.
          await fs.rm(a.path, { force: true }).catch(() => {});
        }
      }
    },
  };
}
```

- [ ] **Step 4: Thêm `claimNextPeek` vào sổ việc**

`drain()` cần biết còn việc đang chờ không mà KHÔNG rút nó ra. Thêm vào `JobStore` (interface + hiện thực) trong `mcp-server/src/jobStore.ts`:

```typescript
  /** Còn việc nào đang chờ không — KHÔNG rút nó ra. Dùng cho vòng thợ và test. */
  claimNextPeek(): boolean;
```

```typescript
    claimNextPeek: () => countPending() > 0,
```

Và thêm một test vào `jobStore.test.ts`:

```typescript
  it('claimNextPeek nhìn mà không rút', () => {
    const store = createJobStore({ newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 1 });
    expect(store.claimNextPeek()).toBe(true);
    expect(store.get('job-1')!.status).toBe('queued'); // vẫn đang chờ
    store.claimNext(2);
    expect(store.claimNextPeek()).toBe(false);
  });
```

- [ ] **Step 5: Chạy test để chắc nó XANH**

Run: `npx vitest run mcp-server/src/jobRunner.test.ts mcp-server/src/jobStore.test.ts`
Expected: PASS — 9 test của jobRunner, 11 test của jobStore.

- [ ] **Step 6: Typecheck rồi commit**

Run: `npx tsc -p mcp-server/tsconfig.json`

```bash
git add mcp-server/src/jobRunner.ts mcp-server/src/jobRunner.test.ts mcp-server/src/jobStore.ts mcp-server/src/jobStore.test.ts
git commit -m "feat(jobs): vòng thợ chạy nền — ghi đĩa, giữ giao ước xuống cấp, dọn đúng tệp của mình"
```

---

### Task 4: Hai cửa REST

**independent:** `false` — cần Task 1 (`jobStore`) và Task 3 (`jobRunner`)

**Files:**
- Modify: `mcp-server/src/http.ts` (thêm hai nhánh route SAU nhánh `/render-clip`, TRƯỚC nhánh kiểm `content-length` quanh dòng 378; sửa chữ ký `startHttpServer`; sửa khối `isMain` cuối file)
- Test: `mcp-server/src/http.test.ts` (thêm hai `describe` mới)

**Verify command:** `npx vitest run mcp-server/src/http.test.ts`

**Phục vụ eval:** E1, E2, E3, E5, E6, E8, E18 (AC-1, AC-2, AC-3, AC-4, AC-5 đầu-cuối, AC-6, AC-13)

**Interfaces:**
- Consumes: `createJobStore`, `JobQueueFullError`, `type JobStore`, `type JobRecord` (Task 1); `createJobRunner`, `type JobRunner` (Task 3); `renderMapSchema` và `motionParamSchema` đã có sẵn.
- Produces: `startHttpServer` nhận thêm tham số tuỳ chọn thứ sáu `jobs?: { store: JobStore; runner: JobRunner }`.

- [ ] **Step 1: Viết test thất bại cho hai cửa mới**

Thêm vào CUỐI `mcp-server/src/http.test.ts`:

```typescript
import { createJobStore } from './jobStore';
import { createJobRunner } from './jobRunner';

describe('POST /jobs + POST /jobs/status', () => {
  let server: HttpServer;
  let sink: string;
  let base: string;

  const submit = (body: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}/jobs`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const ask = (id: string) =>
    fetch(`${base}/jobs/status`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ id }) });

  async function boot(over: { maxQueued?: number; render?: ToolDeps['render'] } = {}) {
    sink = await fsp.mkdtemp(`${tmpdir()}/mapposter-http-jobs-`);
    const store = createJobStore({ maxQueued: over.maxQueued });
    const deps = {
      sinkDir: sink,
      defaultDelivery: 'url',
      render: over.render ?? (async () => PNG_1x1_HTTP),
    } as unknown as ToolDeps;
    const runner = createJobRunner({ store, deps, workers: 1 });
    server = await startHttpServer(0, deps, '127.0.0.1', { allowedHosts: [], allowedOrigins: [] }, undefined, { store, runner });
    base = server.url.replace(/\/mcp$/, '');
    return { store, runner };
  }

  afterEach(async () => {
    await server?.close();
    await fsp.rm(sink, { recursive: true, force: true });
    delete process.env.MAPPOSTER_TOKEN;
  });

  it('AC-1: nhận việc trả 202 + mã, và hỏi NGAY đã thấy — không cửa sổ trống', async () => {
    await boot();
    const res = await submit({ kind: 'render', params: { location: 'Đà Nẵng' } });
    expect(res.status).toBe(202);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.id).toBe('string');

    const first = await (await ask(body.id)).json();
    expect(['queued', 'running', 'done']).toContain(first.status);
  });

  it('AC-2: thân sai khuôn → 400 câu đọc được, và KHÔNG bản ghi nào được tạo', async () => {
    const { store } = await boot();
    for (const bad of [{ kind: 'render' }, { kind: 'render', params: { location: { lng: 999, lat: 0 } } }, { kind: 'la-lam', params: { location: 'x' } }]) {
      const res = await submit(bad);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.ok).toBe(false);
      expect(body.error).not.toMatch(/^\[\s*\{/); // không phải ZodError thô
    }
    expect(store.size()).toBe(0);
  });

  it('AC-3: hàng chờ đầy → 429 và sổ KHÔNG tăng', async () => {
    const { store } = await boot({ maxQueued: 1, render: async () => new Promise(() => PNG_1x1_HTTP) as Promise<Buffer> });
    await submit({ kind: 'render', params: { location: 'A' } });
    await submit({ kind: 'render', params: { location: 'B' } }); // lấp chỗ chờ
    const before = store.size();

    const res = await submit({ kind: 'render', params: { location: 'C' } });
    expect(res.status).toBe(429);
    expect(store.size()).toBe(before);
  });

  it('AC-4: mã lạ → 404, không đoán', async () => {
    await boot();
    const res = await ask('khong-ton-tai');
    expect(res.status).toBe(404);
    expect((await res.json()).ok).toBe(false);
  });

  it('AC-5 đầu-cuối: việc xong trả base64 ĐÚNG byte thợ đã ghi', async () => {
    const { store, runner } = await boot();
    const id = (await (await submit({ kind: 'render', params: { location: 'Thừa Thiên Huế' } })).json()).id;
    runner.kick();
    await runner.drain();

    const body = await (await ask(id)).json();
    expect(body.status).toBe('done');
    expect(Buffer.from(body.image.base64, 'base64')).toEqual(PNG_1x1_HTTP);
    // và đúng tệp thợ ghi, không phải tệp test tự đặt
    await expect(fsp.readFile(store.get(id)!.artifacts[0].path)).resolves.toEqual(PNG_1x1_HTTP);
    expect(body.resolved).toBeDefined();
  });

  it('AC-6: việc hỏng vẫn hỏi ra HTTP 200 — mã nói về câu hỏi, thân nói về việc', async () => {
    const { runner } = await boot({ render: async () => { throw new Error('trình duyệt chết'); } });
    const id = (await (await submit({ kind: 'render', params: { location: 'Hà Nội' } })).json()).id;
    runner.kick();
    await runner.drain();

    const res = await ask(id);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('failed');
    expect(body.errorKind).toBe('server');
  });
});

describe('AC-13: cùng một bảng ca guard cho CẢ BA cửa', () => {
  const DOORS = ['/render', '/jobs', '/jobs/status'];
  let server: HttpServer;
  let sink: string;
  let base: string;
  let store: ReturnType<typeof createJobStore>;

  beforeEach(async () => {
    process.env.MAPPOSTER_TOKEN = 'the-dung';
    sink = await fsp.mkdtemp(`${tmpdir()}/mapposter-guard-`);
    store = createJobStore();
    const deps = { sinkDir: sink, defaultDelivery: 'url', render: async () => PNG_1x1_HTTP } as unknown as ToolDeps;
    const runner = createJobRunner({ store, deps, workers: 1 });
    server = await startHttpServer(0, deps, '127.0.0.1', { allowedHosts: [], allowedOrigins: [] }, 200, { store, runner });
    base = server.url.replace(/\/mcp$/, '');
  });

  afterEach(async () => {
    await server?.close();
    await fsp.rm(sink, { recursive: true, force: true });
    delete process.env.MAPPOSTER_TOKEN;
  });

  const call = (door: string, headers: Record<string, string>, body: string) =>
    fetch(`${base}${door}`, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body });

  it.each(DOORS)('%s — không thẻ thì 401', async (door) => {
    const res = await call(door, {}, JSON.stringify({ kind: 'render', params: { location: 'x' }, id: 'x', location: 'x' }));
    expect(res.status).toBe(401);
    expect(store.size()).toBe(0);
  });

  it.each(DOORS)('%s — thẻ sai thì 401', async (door) => {
    const res = await call(door, { authorization: 'Bearer sai' }, JSON.stringify({ kind: 'render', params: { location: 'x' }, id: 'x', location: 'x' }));
    expect(res.status).toBe(401);
    expect(store.size()).toBe(0);
  });

  it.each(DOORS)('%s — thân vượt trần thì bị chặn trước khi tạo việc', async (door) => {
    const huge = JSON.stringify({ kind: 'render', params: { location: 'x'.repeat(5000) }, id: 'x' });
    const res = await call(door, { authorization: 'Bearer the-dung' }, huge);
    expect(res.status).toBe(413);
    expect(store.size()).toBe(0);
  });
});
```

Thêm hằng PNG dùng chung ở đầu file test (ngay sau các import):

```typescript
/** PNG 1×1 hợp lệ — `deliver` đọc width/height từ khối IHDR. */
const PNG_1x1_HTTP = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);
```

- [ ] **Step 2: Chạy test để chắc nó ĐỎ**

Run: `npx vitest run mcp-server/src/http.test.ts`
Expected: FAIL — các ca mới trả `405`/`404` vì hai cửa chưa tồn tại; `startHttpServer` chưa nhận tham số thứ sáu.

- [ ] **Step 3: Thêm hai nhánh route vào `mcp-server/src/http.ts`**

Thêm import ở đầu file:

```typescript
import { createJobStore, JobQueueFullError, type JobRecord, type JobStore } from './jobStore';
import { createJobRunner, type JobRunner } from './jobRunner';
import { motionParamSchema } from './motionCompiler';
import { loadServerConfig } from '../config';
```

Thêm hàm dựng thân phản hồi (đặt ngay trên `startHttpServer`):

```typescript
const jobSubmitSchema = z.object({
  kind: z.enum(['render', 'clip']),
  params: z.unknown(),
  motion: z.unknown().optional(),
});

/**
 * Thân phản hồi cho một lệnh HỎI việc. Kết quả sống trên ĐĨA — đọc lên ở đây,
 * không giữ trong sổ: một clip sát trần nằm ở hàng chục MB, còn instance chỉ có
 * 2 GB chia với Chromium.
 */
async function jobStatusBody(rec: JobRecord): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ok: true, id: rec.id, kind: rec.kind, status: rec.status };
  if (rec.resolved) out.resolved = rec.resolved;
  if (rec.motion) out.motion = rec.motion;
  if (rec.error) out.error = rec.error;
  if (rec.errorKind) out.errorKind = rec.errorKind;
  if (rec.degradeNote) out.clipError = rec.degradeNote;

  for (const a of rec.artifacts) {
    // Một tệp đã bị dọn hoặc chưa kịp ghi không được làm hỏng cả câu trả lời:
    // phần siêu dữ liệu vẫn đúng, chỉ thiếu nội dung.
    const base64 = await fs.readFile(a.path).then((b) => b.toString('base64')).catch(() => undefined);
    const block = { base64, format: a.format, width: a.width, height: a.height, bytes: a.bytes };
    if (a.role === 'image') out.image = block;
    if (a.role === 'settle') out.settle = block;
    if (a.role === 'clip') out.clip = block;
  }
  return out;
}
```

Sửa chữ ký `startHttpServer` — thêm tham số thứ sáu:

```typescript
  maxBodyBytes: number = envNumber(process.env, 'MAPPOSTER_HTTP_MAX_BODY', DEFAULT_MAX_BODY_BYTES, { min: 1024 }),
  jobs?: { store: JobStore; runner: JobRunner },
): Promise<HttpServer> {
```

Thêm hai nhánh NGAY SAU nhánh `/render-clip` (tức sau dòng `return;` đóng nhánh đó, trước khối `const declared = Number(...)`):

```typescript
    // Lối bất đồng bộ: nhận việc rồi trả mã ngay. Đường `/render` và
    // `/render-clip` ở trên KHÔNG đổi một chữ — muốn hết 429 thì dọn sang đây.
    // Cả hai cửa đều POST nên luật 405 ở đầu handler không phải nới ra (và
    // quyết định không-khai-healthCheckPath ở render.yaml không phải xem lại).
    if (jobs && (req.url === '/jobs' || req.url === '/jobs/status')) {
      const token = process.env.MAPPOSTER_TOKEN;
      if (token && req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401).end('unauthorized');
        return;
      }
      const isSubmit = req.url === '/jobs';
      void (async () => {
        let body: unknown;
        try {
          body = await readJsonBody(req, maxBodyBytes);
        } catch (e) {
          const code = e instanceof PayloadTooLargeError ? 413 : 400;
          res.writeHead(code, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }));
          return;
        }

        if (!isSubmit) {
          const id = (body as { id?: unknown })?.id;
          const rec = typeof id === 'string' ? jobs.store.get(id) : undefined;
          if (!rec) {
            // Ngoại lệ DUY NHẤT của luật "mã HTTP nói về câu hỏi": mã không tồn
            // tại thì chính câu hỏi sai, không phải việc hỏng.
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: `no such job: ${String(id)}` }));
            return;
          }
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(await jobStatusBody(rec)));
          return;
        }

        // --- Nhận việc. Chỉ kiểm những gì kiểm được TỨC THÌ: khuôn dạng thuần.
        // Tra toạ độ là gọi mạng, độ trễ không chặn trên được — để lại cho thợ,
        // nếu không ta dựng lại đúng cái treo đang đi gỡ.
        let submit: z.infer<typeof jobSubmitSchema>;
        try {
          submit = jobSubmitSchema.parse(body);
          renderMapSchema.parse(submit.params);
          if (submit.kind === 'clip') motionParamSchema.parse(submit.motion);
        } catch (e) {
          const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
          res.writeHead(400, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: message }));
          return;
        }

        try {
          const rec = jobs.store.create({ kind: submit.kind, params: submit.params, motionInput: submit.motion, nowMs: Date.now() });
          jobs.runner.kick();
          res.writeHead(202, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, id: rec.id, kind: rec.kind, status: rec.status }));
        } catch (e) {
          if (e instanceof JobQueueFullError) {
            res.writeHead(429, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
            return;
          }
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }));
        }
      })();
      return;
    }
```

- [ ] **Step 4: Nối hàng đợi vào tiến trình thật**

Sửa khối `isMain` ở cuối `mcp-server/src/http.ts`:

```typescript
if (isMain) {
  const cfg = loadServerConfig();
  try {
    ensureDist(cfg);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  applyStartupEnv();
  probeFfmpegAtStartup();

  const deps = makeRenderDeps(cfg);
  const store = createJobStore();
  // Số thợ mặc định = sức chứa hồ trình duyệt: vượt lên là tự chuốc
  // PoolAcquireTimeoutError cho chính việc của mình.
  const runner = createJobRunner({
    store,
    deps,
    workers: envNumber(process.env, 'MAPPOSTER_JOB_WORKERS', cfg.poolSize, { min: 1 }),
  });
  const sweepTimer = setInterval(() => void runner.sweep(), 60_000);
  sweepTimer.unref();

  startHttpServer(envNumber(process.env, 'MCP_HTTP_PORT', 4181, { min: 0, max: 65535 }), deps, undefined, undefined, undefined, { store, runner })
    .then((s) => console.error(`MapPoster MCP (HTTP) listening at ${s.url}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
```

`startHttpServer` phải cho phép bỏ qua tham số giữa — đổi mặc định của `host`, `policy` và `maxBodyBytes` sang dạng chịu được `undefined`:

```typescript
  host: string = process.env.MAPPOSTER_HTTP_HOST ?? '127.0.0.1',
  policy: OriginPolicy = {
    allowedHosts: parseList(process.env.MAPPOSTER_HTTP_ALLOWED_HOSTS),
    allowedOrigins: parseList(process.env.MAPPOSTER_HTTP_ALLOWED_ORIGINS),
  },
  maxBodyBytes: number = envNumber(process.env, 'MAPPOSTER_HTTP_MAX_BODY', DEFAULT_MAX_BODY_BYTES, { min: 1024 }),
```

(Tham số mặc định của TypeScript đã tự áp khi truyền `undefined`, nên không cần đổi gì thêm — chỉ cần chắc chắn cả ba đều CÓ mặc định, và chúng đã có.)

- [ ] **Step 5: Chạy test để chắc nó XANH**

Run: `npx vitest run mcp-server/src/http.test.ts`
Expected: PASS — mọi test cũ vẫn xanh (đặc biệt ca `429` của `/render-clip` đồng bộ), cộng 6 ca hai cửa mới và 9 ca bảng guard (3 cửa × 3 ca).

- [ ] **Step 6: Chạy toàn bộ bộ đo của feature**

Run: `npx vitest run mcp-server/src/jobStore.test.ts mcp-server/src/jobRunner.test.ts mcp-server/src/motionCompiler.test.ts mcp-server/src/http.test.ts mcp-server/src/tools.test.ts`
Expected: PASS toàn bộ.

- [ ] **Step 7: Chạy ba bộ đang có + typecheck**

```bash
npx tsc -b && npx tsc -p mcp-server/tsconfig.json && npm test
```
Expected: exit 0.

- [ ] **Step 8: Commit**

```bash
git add mcp-server/src/http.ts mcp-server/src/http.test.ts
git commit -m "feat(http): POST /jobs và POST /jobs/status — nhận việc trả mã, hỏi kết quả sau"
```

---

## Self-Review

**1. Spec coverage** — đối chiếu từng mục của `2026-08-05-async-job-queue-design.md`:

| Mục spec | Task |
|---|---|
| §3.1 bốn đơn vị | Task 1 (`jobStore`), Task 2 (`motionCompiler`), Task 3 (`jobRunner`), Task 4 (`http`) |
| §3.1 sổ không import `fs` | Task 1 Step 2 (test đọc chính mã nguồn), Task 3 (thợ là bên gọi `fs.rm`) |
| §3.2 lối chờ chỉ cho clip | Task 3 `runClip` dùng `acquireClipSlotWaiting`; `runRender` không đụng cổng clip |
| §4 vòng đời bốn trạng thái | Task 1 `JobStatus` |
| §5 hai cửa | Task 4 |
| §5.1 kiểm lúc nhận vs lúc chạy | Task 4 Step 3 (khuôn dạng ở cửa) + Task 3 (`resolveConfig` trong thợ) |
| §5.2.1 mã HTTP nói về câu hỏi | Task 4 test AC-6 |
| §5.2.2 base64 đọc từ đĩa | Task 3 `deliver(..., 'url', ...)` + Task 4 `jobStatusBody` |
| §5.2.3 giao ước xuống cấp | Task 3 `runClip` nhánh encode-hỏng và nhánh vượt trần |
| §5.3 không mở `GET` | Task 4 — cả hai cửa đều `POST` |
| §6 một việc hỏng không giết vòng | Task 3 `runOne` bọc bắt lỗi |
| §6 trả slot mọi lối ra | Task 2 `makeRelease` idempotent + Task 3 `finally` |
| §6 chờ slot có hạn | Task 2 `acquireClipSlotWaiting` |
| §6 dọn đúng tệp của mình | Task 3 `sweep` |
| §7 bốn núm | Task 1 (ba hằng), Task 2 (`MAPPOSTER_JOB_SLOT_WAIT_MS`), Task 4 (`MAPPOSTER_JOB_WORKERS`) |
| §8 bảng kiểm thử | Test của cả bốn task |

Không mục nào không có task.

**2. Placeholder scan** — không có "TBD", "TODO", "xử lý lỗi phù hợp", hay bước nào mô tả mà không có mã. Mọi bước sửa mã đều có khối mã.

**3. Type consistency** — đã đối chiếu: `JobRecord`/`JobArtifact`/`JobFinishPatch` khai ở Task 1 và dùng đúng tên đó ở Task 3, Task 4. `acquireClipSlotWaiting` nhận object `{ timeoutMs, env }` ở cả nơi khai (Task 2) lẫn nơi gọi (Task 3). `prepareClipRenderWithSlot(params, motionInput, release, env)` đúng thứ tự bốn tham số ở cả hai nơi. `claimNextPeek()` được thêm ở Task 3 Step 4 vào cả interface lẫn hiện thực lẫn test — đây là bổ sung muộn cho `JobStore`, người làm Task 1 chưa thấy nó, nên Task 3 phải sửa `jobStore.ts` và commit kèm.
