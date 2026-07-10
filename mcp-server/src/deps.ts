import { loadServerConfig, type ServerConfig } from '../config';
import { startAppServer } from './appServer';
import { createPool, type Pool } from './browserPool';
import { renderFrame } from './renderFrame';
import type { ToolDeps } from './tools';
import type { RenderConfig } from '../../src/render/renderConfig';

/**
 * Memoize an async factory — but only its SUCCESS.
 *
 * `cached ??= factory()` stores the promise before it settles, and a rejected
 * promise is not null, so one transient failure (EADDRINUSE on the app port, a
 * flaky `chromium.launch()`) is remembered for the life of the process: every
 * later call re-throws the same stale error and only a restart recovers. This is
 * the rule the geocode layer already follows — cache the answer, never the outage.
 */
export function memoizeSuccess<T>(factory: () => Promise<T>): {
  (): Promise<T>;
  reset(): void;
} {
  let cached: Promise<T> | null = null;
  const get = () => {
    if (!cached) {
      const attempt = factory();
      cached = attempt;
      // Drop the memo when it fails so the next caller retries. This `.catch`
      // also marks the rejection handled; callers still see it via `attempt`.
      attempt.catch(() => {
        if (cached === attempt) cached = null;
      });
    }
    return cached;
  };
  get.reset = () => {
    cached = null;
  };
  return get;
}

export interface Runtime {
  appUrl: string;
  pool: Pool;
  close(): Promise<void>;
}

const startReal = async (c: ServerConfig): Promise<Runtime> => {
  const app = await startAppServer(c);
  const pool = await createPool(c.poolSize);
  return {
    appUrl: app.url,
    pool,
    close: async () => {
      await pool.close().catch(() => {});
      await app.close().catch(() => {});
    },
  };
};

/**
 * Real tool deps: the app server + browser pool start LAZILY on the first
 * render, so `listTools` / discovery tools work instantly without a browser.
 */
export function makeRenderDeps(
  cfg: ServerConfig = loadServerConfig(),
  start: (c: ServerConfig) => Promise<Runtime> = startReal,
): ToolDeps {
  const ensure = memoizeSuccess(() => start(cfg));

  return {
    sinkDir: cfg.sinkDir,
    defaultDelivery: 'both',
    render: async (config: RenderConfig) => {
      const rt = await ensure();
      try {
        return await renderFrame(config, { appUrl: rt.appUrl, pool: rt.pool });
      } finally {
        // If the browser itself died, the memoized runtime is a corpse and every
        // later render would resolve the same dead pool. Drop it and rebuild.
        if (!rt.pool.healthy()) {
          ensure.reset();
          void rt.close();
        }
      }
    },
  };
}
