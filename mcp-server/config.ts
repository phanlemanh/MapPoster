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
    sinkDir: env.MAPPOSTER_SINK ?? path.resolve(root, '_render-out'),
    maxBodyBytes: envNumber(env, 'MAPPOSTER_HTTP_MAX_BODY', DEFAULT_MAX_BODY_BYTES, { min: 1024 }),
  };
}
