import path from 'node:path';

export interface ServerConfig {
  /** built web dist to serve (render.html lives here) */
  appDistDir: string;
  /** static app server port */
  appPort: number;
  /** number of headless browser pages in the pool */
  poolSize: number;
  /** directory where rendered files are written */
  sinkDir: string;
}

export function loadServerConfig(env: NodeJS.ProcessEnv = process.env): ServerConfig {
  const root = process.cwd();
  return {
    appDistDir: env.MAPPOSTER_DIST ?? path.resolve(root, 'dist'),
    appPort: Number(env.MAPPOSTER_APP_PORT ?? 4180),
    poolSize: Number(env.MAPPOSTER_POOL ?? 2),
    sinkDir: env.MAPPOSTER_SINK ?? path.resolve(root, '_render-out'),
  };
}
