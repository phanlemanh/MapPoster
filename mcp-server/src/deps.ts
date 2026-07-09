import { loadServerConfig, type ServerConfig } from '../config';
import { startAppServer } from './appServer';
import { createPool, type Pool } from './browserPool';
import { renderFrame } from './renderFrame';
import type { ToolDeps } from './tools';
import type { RenderConfig } from '../../src/render/renderConfig';

/**
 * Real tool deps: the app server + browser pool start LAZILY on the first
 * render, so `listTools` / discovery tools work instantly without a browser.
 */
export function makeRenderDeps(cfg: ServerConfig = loadServerConfig()): ToolDeps {
  let started: Promise<{ appUrl: string; pool: Pool }> | null = null;
  const ensure = () =>
    (started ??= (async () => {
      const app = await startAppServer(cfg);
      const pool = await createPool(cfg.poolSize);
      return { appUrl: app.url, pool };
    })());

  return {
    sinkDir: cfg.sinkDir,
    defaultDelivery: 'both',
    render: async (config: RenderConfig) => {
      const { appUrl, pool } = await ensure();
      return renderFrame(config, { appUrl, pool });
    },
  };
}
