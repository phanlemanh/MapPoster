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
  /** Còn việc nào đang chờ không — KHÔNG rút nó ra. Vòng thợ hỏi câu này để
   * biết mình đã rảnh thật hay chỉ đang giữa hai nhịp. */
  claimNextPeek(): boolean;
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

    claimNextPeek: () => countPending() > 0,
    pendingCount: countPending,
    size: () => jobs.size,
  };
}
