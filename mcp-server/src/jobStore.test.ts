import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
    // Môi trường test là jsdom, nên `URL` toàn cục giải đường dẫn tương đối theo
    // địa chỉ tài liệu (http://localhost) chứ không theo `import.meta.url` —
    // phải ghép đường dẫn bằng `node:path` mới đọc đúng chính tệp nguồn.
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'jobStore.ts'), 'utf8');
    expect(src).not.toMatch(/from ['"]node:fs['"]/);
    expect(src).not.toMatch(/require\(['"]node:fs['"]\)/);
  });
});
