import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createJobStore, createJobStoreFromEnv, JobQueueFullError } from './jobStore';

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
    // Môi trường test là jsdom, nên `URL` toàn cục giải đường dẫn tương đối theo
    // địa chỉ tài liệu (http://localhost) chứ không theo `import.meta.url` —
    // phải ghép đường dẫn bằng `node:path` mới đọc đúng chính tệp nguồn.
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'jobStore.ts'), 'utf8');
    expect(src).not.toMatch(/from ['"]node:fs['"]/);
    expect(src).not.toMatch(/require\(['"]node:fs['"]\)/);
  });
});

describe('claimNextPeek', () => {
  it('nhìn mà không rút', () => {
    const store = createJobStore({ newId: seqIds() });
    store.create({ kind: 'render', params: {}, nowMs: 1 });

    expect(store.claimNextPeek()).toBe(true);
    expect(store.get('job-1')!.status).toBe('queued'); // vẫn đang chờ, chưa ai nhận

    store.claimNext(2);
    expect(store.claimNextPeek()).toBe(false);
  });
});

// AC-16 — vòng soi code round 3 tìm ra: hai núm này được KHAI trong spec, được
// NÊU ĐÍCH DANH trong thông điệp 429 trả về cho người vận hành, mà lại không hề
// đọc từ môi trường. Đặt biến, khởi động lại, không gì thay đổi, không tín hiệu.
describe('createJobStoreFromEnv — núm cấu hình phải có tác dụng THẬT (AC-16)', () => {
  it('trần hàng chờ nghe theo biến môi trường', () => {
    const store = createJobStoreFromEnv({ MAPPOSTER_MAX_QUEUED_JOBS: '2' } as NodeJS.ProcessEnv);
    store.create({ kind: 'render', params: {}, nowMs: 1 });
    store.create({ kind: 'render', params: {}, nowMs: 2 });

    expect(() => store.create({ kind: 'render', params: {}, nowMs: 3 })).toThrow(JobQueueFullError);
  });

  it('hạn giữ nghe theo biến môi trường', () => {
    const store = createJobStoreFromEnv({ MAPPOSTER_JOB_TTL_MS: '1000' } as NodeJS.ProcessEnv);
    const rec = store.create({ kind: 'render', params: {}, nowMs: 0 });
    store.claimNext(0);
    store.finish(rec.id, { status: 'done' }, 0);

    expect(store.takeExpired(999)).toEqual([]);          // chưa tới hạn
    expect(store.takeExpired(1001).map((r) => r.id)).toEqual([rec.id]);
  });

  it('môi trường trống thì rơi về mặc định, KHÔNG nổ', () => {
    const store = createJobStoreFromEnv({} as NodeJS.ProcessEnv);
    expect(() => store.create({ kind: 'render', params: {}, nowMs: 1 })).not.toThrow();
  });

  it('giá trị rác thì FAIL CLOSED — nói rõ tên biến, không âm thầm dùng mặc định', () => {
    expect(() => createJobStoreFromEnv({ MAPPOSTER_MAX_QUEUED_JOBS: 'khong-phai-so' } as NodeJS.ProcessEnv))
      .toThrow(/MAPPOSTER_MAX_QUEUED_JOBS/);
  });
});

describe('claimNextWhere — bỏ qua chứ không đảo thứ tự', () => {
  it('bỏ qua việc bị từ chối, lấy việc sau, và không đổi thứ tự việc cùng loại', () => {
    const store = createJobStore({ newId: seqIds() });
    store.create({ kind: 'clip', params: {}, nowMs: 1 });   // job-1
    store.create({ kind: 'clip', params: {}, nowMs: 2 });   // job-2
    store.create({ kind: 'render', params: {}, nowMs: 3 }); // job-3

    // Từ chối mọi clip → phải nhảy tới việc render, hai clip vẫn nằm chờ.
    expect(store.claimNextWhere(4, (j) => j.kind !== 'clip')!.id).toBe('job-3');
    expect(store.get('job-1')!.status).toBe('queued');
    expect(store.get('job-2')!.status).toBe('queued');

    // Mở lại cho clip → job-1 trước job-2, thứ tự nhận giữ nguyên.
    expect(store.claimNextWhere(5, () => true)!.id).toBe('job-1');
    expect(store.claimNextWhere(6, () => true)!.id).toBe('job-2');
  });
});
