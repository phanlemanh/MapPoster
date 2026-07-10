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

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const root = process.cwd();
  return {
    appDistDir: env.MAPPOSTER_DIST ?? path.resolve(root, 'dist'),
    appPort: Number(env.MAPPOSTER_APP_PORT ?? 4180),
    appHost: env.MAPPOSTER_APP_HOST ?? '127.0.0.1',
    poolSize: Number(env.MAPPOSTER_POOL ?? 2),
    sinkDir: env.MAPPOSTER_SINK ?? path.resolve(root, '_render-out'),
    maxBodyBytes: Number(env.MAPPOSTER_HTTP_MAX_BODY ?? DEFAULT_MAX_BODY_BYTES),
  };
}
