import { loadServerConfig, type ServerConfig } from '../config';
import { startAppServer } from './appServer';
import { createPool, type Pool } from './browserPool';
import { createConfigStore, type ConfigStore } from './configStore';
import { renderFrame, renderAnimationFrames, renderClipFrames, type AnimationPulse } from './renderFrame';
import { encodeAnimation } from './encodeAnimation';
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
  /** Invalidate — but only the given attempt, so a concurrent rebuild survives. */
  reset(attempt?: Promise<T>): void;
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
  get.reset = (attempt?: Promise<T>) => {
    // Guarded exactly like the catch above. Without the guard: renders A and B
    // share runtime R1, the browser dies, A resets and closes R1, C rebuilds a
    // healthy R2 — then B's finally resets again and evicts R2 while C is still
    // using it. Nobody closes R2, so its browser and app-server port leak.
    if (!attempt || cached === attempt) cached = null;
  };
  return get;
}

export interface Runtime {
  appUrl: string;
  pool: Pool;
  configStore: ConfigStore;
  close(): Promise<void>;
}

const startReal = async (c: ServerConfig): Promise<Runtime> => {
  const configStore = createConfigStore();
  const app = await startAppServer(c, configStore);
  const pool = await createPool(c.poolSize);
  return {
    appUrl: app.url,
    pool,
    configStore,
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
      const attempt = ensure();
      const rt = await attempt;
      try {
        return await renderFrame(config, { appUrl: rt.appUrl, pool: rt.pool, configStore: rt.configStore });
      } finally {
        // If the browser itself died, the memoized runtime is a corpse and every
        // later render would resolve the same dead pool. Drop THIS attempt and
        // rebuild — passing `attempt` so we never evict a rebuild someone else
        // is already using.
        if (!rt.pool.healthy()) {
          ensure.reset(attempt);
          void rt.close();
        }
      }
    },
    renderAnimation: async (config: RenderConfig, opts: { frames: number; pulse?: AnimationPulse }) => {
      const attempt = ensure();
      const rt = await attempt;
      try {
        return await renderAnimationFrames(config, opts, { appUrl: rt.appUrl, pool: rt.pool, configStore: rt.configStore });
      } finally {
        // same corpse-runtime rule as render above
        if (!rt.pool.healthy()) {
          ensure.reset(attempt);
          void rt.close();
        }
      }
    },
    renderClip: async (config: RenderConfig) => {
      const attempt = ensure();
      const rt = await attempt;
      try {
        return await renderClipFrames(config, { appUrl: rt.appUrl, pool: rt.pool, configStore: rt.configStore });
      } finally {
        // same corpse-runtime rule as render/renderAnimation above
        if (!rt.pool.healthy()) {
          ensure.reset(attempt);
          void rt.close();
        }
      }
    },
    encodeAnimation,
  };
}
