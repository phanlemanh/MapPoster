import path from 'node:path';
import { promises as fs } from 'node:fs';
import { envNumber, DEFAULT_CLIP_MAX_BYTES } from '../config';
import { deliver } from './delivery';
import { resolveConfig, type RenderMapParams } from './resolveConfig';
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
  /** Chờ tới khi không còn việc nào đang chạy hoặc đang chờ. */
  drain(): Promise<void>;
  /** Thôi nhận việc mới; việc đang chạy vẫn chạy nốt. */
  stop(): void;
}

/**
 * Bất cứ thứ gì hỏng trong PHA GIẢI — phân giải chính đầu vào của người gọi.
 *
 * Đây là cùng ranh giới `/render` đã dựng giữa 400 và 500 (xem hai khối chú
 * thích "Resolve phase" / "Render phase" trong `http.ts`), chỉ khác chỗ sống:
 * ở đường đồng bộ nó là mã HTTP, ở đây nó là một trường trong thân phản hồi,
 * vì mã HTTP của lệnh HỎI luôn nói về câu hỏi chứ không về việc.
 */
class JobInputError extends Error {
  constructor(cause: unknown) {
    super((cause as Error)?.message ?? String(cause));
    this.name = 'JobInputError';
  }
}

/**
 * Chạy pha giải và gắn nhãn "lỗi tại người gọi" cho mọi thứ ném ra từ đó.
 *
 * Phân loại theo PHA chứ không theo chuỗi trong thông điệp. Bản đầu tiên khớp
 * chuỗi (`/No geocoding result|.../`) và đã sai ngay: `resolveConfig` ném
 * `Unknown theme: …`, `Unknown format: …`, `Invalid highlight.regions[].geojson: …`
 * — không cái nào khớp, nên cả ba bị gán "lỗi tại máy chủ" và người gọi được
 * bảo thử lại một yêu cầu không bao giờ thành công. Một danh sách chuỗi luôn
 * trôi khỏi thông điệp mà code thật phát ra; ranh giới pha thì không.
 */
async function resolvePhase<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (e) {
    // MotionParamError đã tự nói nó là lỗi đầu vào rồi — giữ nguyên kiểu.
    throw e instanceof MotionParamError ? e : new JobInputError(e);
  }
}

const isCallerFault = (e: unknown): boolean => e instanceof MotionParamError || e instanceof JobInputError;

let counter = 0;
const fileNameFor = (kind: string, placeName: string): string =>
  `mapposter-job-${kind}-${slugify(placeName || 'map')}-${counter++}`;

export function createJobRunner({
  store,
  deps,
  workers = 1,
  slotWaitMs,
  now = Date.now,
  env = process.env,
}: JobRunnerOptions): JobRunner {
  let live = 0;
  let stopped = false;
  const idleWaiters: (() => void)[] = [];

  const isIdle = (): boolean => live === 0 && !store.claimNextPeek();

  const settleIdle = (): void => {
    if (!isIdle()) return;
    while (idleWaiters.length) idleWaiters.shift()!();
  };

  async function runRender(job: JobRecord): Promise<JobFinishPatch> {
    const cfg = await resolvePhase(() => resolveConfig(job.params as RenderMapParams));
    const png = await deps.render(cfg);
    // 'url' chứ không phải 'both': kết quả sống trên ĐĨA, thân phản hồi được
    // dựng lúc HỎI. Giữ base64 trong sổ là đúng thứ thiết kế đi tránh — một
    // clip sát trần nằm ở hàng chục MB, instance chỉ có 2 GB chia với Chromium.
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

    // Lối CHỜ, không phải lối ném-ngay: thợ được xếp hàng, đường đồng bộ thì
    // không. Cùng MỘT bộ đếm, hai chính sách lấy chỗ.
    // Hết hạn chờ slot là lỗi TẠI MÁY CHỦ — nằm NGOÀI `resolvePhase` có chủ ý:
    // đầu vào của người gọi không có lỗi gì, chỉ là mình đang nghẽn.
    const release = await acquireClipSlotWaiting({ timeoutMs: slotWaitMs, env });
    const { cfg, motion, preset, releaseClipSlot } = await resolvePhase(() =>
      prepareClipRenderWithSlot(job.params as RenderMapParams, job.motionInput, release, env),
    );
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
        // giờ vứt nó đi vì encoder hỏng. Dọn tệp mp4 dở dang (ffmpeg thật để
        // lại một tệp cụt khi chết giữa lúc ghi); lỗi dọn không được che lỗi gốc.
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
        // Hỏng vì chính sách kích thước — người gọi sửa được (hạ fps/durationSec/
        // size), NHƯNG ảnh tĩnh đã dựng vẫn nằm nguyên trong artifacts. Cùng
        // hình dạng mà `/render-clip` đồng bộ trả ở 422.
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
      // Trả chỗ dù kết thúc bằng lối nào. Một slot rò rỉ trong hệ CÓ hàng chờ
      // không phải là chậm — nó là treo vĩnh viễn cho mọi người phía sau.
      releaseClipSlot();
    }
  }

  async function runOne(job: JobRecord): Promise<void> {
    try {
      const patch = job.kind === 'clip' ? await runClip(job) : await runRender(job);
      store.finish(job.id, patch, now());
    } catch (e) {
      // MỘT việc hỏng không được giết vòng thợ. Ở đường đồng bộ một lỗi chỉ
      // giết một yêu cầu; ở đây nó có thể giết cả hàng đợi nếu để lọt ra ngoài.
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
        if (isIdle()) return resolve();
        idleWaiters.push(resolve);
      }),

    sweep: async () => {
      for (const rec of store.takeExpired(now())) {
        for (const a of rec.artifacts) {
          // Chỉ xoá tệp GHI TRONG BẢN GHI — không quét thư mục theo khuôn tên:
          // `sinkDir` còn chứa sản phẩm của các công cụ MCP khác, và một khuôn
          // tên trùng sẽ nuốt mất chúng.
          await fs.rm(a.path, { force: true }).catch(() => {});
        }
      }
    },
  };
}
