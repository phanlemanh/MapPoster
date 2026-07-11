import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import type { ServerConfig } from '../config';

/**
 * Make sure the render harness (`dist/render.html`) exists before the server
 * starts serving it to its headless browser.
 *
 * Without this, a fresh clone that points an MCP client straight at the server
 * has no `dist/`, so `startAppServer` 404s `/render.html`, the page never loads,
 * and every render dies with an opaque 20 s timeout — the worst possible first
 * run. So build it once, on demand, with a visible log line.
 *
 * `vite build` always writes `./dist`, so we only auto-build when the configured
 * dist IS that default. A custom `MAPPOSTER_DIST` that is missing is the operator's
 * to populate — we say so rather than silently building the wrong directory.
 *
 * Deps are injected so this is unit-testable without touching the filesystem or
 * spawning a build.
 */
export function ensureDist(
  cfg: Pick<ServerConfig, 'appDistDir'>,
  deps: { exists?: (p: string) => boolean; build?: () => void; cwd?: string; log?: (m: string) => void } = {},
): void {
  const exists = deps.exists ?? existsSync;
  const log = deps.log ?? ((m: string) => console.error(m));
  const cwd = deps.cwd ?? process.cwd();

  const harness = path.join(cfg.appDistDir, 'render.html');
  if (exists(harness)) return;

  const defaultDist = path.resolve(cwd, 'dist');
  if (path.resolve(cfg.appDistDir) !== defaultDist) {
    throw new Error(
      `[mapposter] render harness not found at ${harness}. ` +
        `Build the app into MAPPOSTER_DIST, or run \`npm run setup\` from the repo root.`,
    );
  }

  log('[mapposter] render harness not built yet — running `vite build` once (~10s)…');
  const build = deps.build ?? (() => execSync('npx vite build', { stdio: 'inherit', cwd }));
  build();

  if (!exists(harness)) {
    throw new Error(`[mapposter] build finished but ${harness} is still missing. Run \`npm run setup\`.`);
  }
}
