import path from 'node:path';

export interface ServerConfig {
  /** built web dist to serve (render.html lives here) */
  appDistDir: string;
  /** static app server port */
  appPort: number;
  /**
   * Interface the static app server binds. Loopback by default: it serves the
   * render harness to *our own* pooled browser and has no access control beyond
   * a path-traversal guard. `server.listen(port, cb)` binds every interface —
   * the callback silently occupies the host argument — which exposed dist/ on
   * the LAN for every deployment, including the stdio one the README calls local.
   */
  appHost: string;
  /** number of headless browser pages in the pool */
  poolSize: number;
  /**
   * Max time (ms) `pool.acquire()` will queue for a free page before it
   * fails loudly with `PoolAcquireTimeoutError`, instead of hanging forever.
   */
  poolAcquireTimeoutMs: number;
  /** directory where rendered files are written */
  sinkDir: string;
  /** hard cap on an MCP HTTP request body (bytes) */
  maxBodyBytes: number;
}

/** 8 MiB: comfortably above an inline GeoJSON region, far below "OOM the pool". */
export const DEFAULT_MAX_BODY_BYTES = 8 * 1024 * 1024;

/** 12 MiB: a several-second MP4 clip at poster resolution, capped before it hits the wire as base64. */
export const DEFAULT_CLIP_MAX_BYTES = 12 * 1024 * 1024;

/**
 * 10 minutes: comfortably above a single clip's own worst case
 * (`MAPPOSTER_MAX_CLIP_FRAMES` default 288 frames × ~1.1s/frame cold,
 * measured at 1080×1920 — spec §3 — is ~5.3 minutes), so a legitimate
 * request queued behind ONE in-flight clip is never falsely killed by this
 * timeout. It exists to bound a genuinely stuck pool (crashed browser,
 * deadlock), not to cap ordinary — if slow — queued work.
 */
export const DEFAULT_POOL_ACQUIRE_TIMEOUT_MS = 10 * 60 * 1000;

/** Clips are the expensive render path; only this many may run at once,
 * shared by REST `/render-clip` and MCP `render_clip` alike (see
 * `mcp-server/src/motionCompiler.ts`'s `acquireClipSlot`). Default 1: clips
 * are serialized on purpose — a full async job queue is a later package. */
export const DEFAULT_CLIP_CONCURRENCY = 1;

/**
 * Parse a numeric env var, or refuse to start.
 *
 * `Number(process.env.X ?? DEFAULT)` yields NaN for any non-numeric value, and
 * every subsequent comparison against NaN is false — so a typo in
 * MAPPOSTER_HTTP_MAX_BODY silently switches OFF the request-body cap that exists
 * to stop a caller OOM-ing the shared browser pool, and a typo in MAPPOSTER_POOL
 * makes `created < size` always false so the pool never mints a page and every
 * render deadlocks. Both fail OPEN, with no signal. Fail closed and say why.
 */
export function envNumber(
  env: NodeJS.ProcessEnv,
  name: string,
  fallback: number,
  { min = 0, max = Number.MAX_SAFE_INTEGER, integer = true }: { min?: number; max?: number; integer?: boolean } = {},
): number {
  const raw = env[name];
  if (raw === undefined || raw === '') return fallback;

  const n = Number(raw);
  if (!Number.isFinite(n) || (integer && !Number.isInteger(n)) || n < min || n > max) {
    throw new Error(
      `${name}=${JSON.stringify(raw)} is not a valid ${integer ? 'integer' : 'number'} in [${min}, ${max}]`,
    );
  }
  return n;
}

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const root = process.cwd();
  return {
    appDistDir: env.MAPPOSTER_DIST ?? path.resolve(root, 'dist'),
    // 0 is legal and useful: an ephemeral port sidesteps EADDRINUSE entirely.
    appPort: envNumber(env, 'MAPPOSTER_APP_PORT', 4180, { min: 0, max: 65535 }),
    appHost: env.MAPPOSTER_APP_HOST ?? '127.0.0.1',
    poolSize: envNumber(env, 'MAPPOSTER_POOL', 2, { min: 1, max: 64 }),
    poolAcquireTimeoutMs: envNumber(env, 'MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS', DEFAULT_POOL_ACQUIRE_TIMEOUT_MS, { min: 1000 }),
    sinkDir: env.MAPPOSTER_SINK ?? path.resolve(root, '_render-out'),
    maxBodyBytes: envNumber(env, 'MAPPOSTER_HTTP_MAX_BODY', DEFAULT_MAX_BODY_BYTES, { min: 1024 }),
  };
}
