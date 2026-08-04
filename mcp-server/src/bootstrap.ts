import { checkFfmpegAvailable, ffmpegBin } from './encodeAnimation';
import { setGeocodeLanguage } from '../../src/lib/geocoding';

/**
 * Process-wide, startup-only side effects shared by BOTH transports
 * (stdio.ts, http.ts) — kept in one place so the two entry points cannot
 * drift the way the clip pipeline itself once did (see motionCompiler.ts's
 * prepareClipRender doc comment).
 *
 * Finding I: wires `MAPPOSTER_GEOCODE_LANG` to `setGeocodeLanguage`
 * (src/lib/geocoding.ts) — that knob was exported and documented but nothing
 * in production ever called it, only tests. `setGeocodeLanguage`'s own doc
 * comment says it is "PROCESS-WIDE, startup-only configuration" (same
 * contract as `__setRateLimitMs` in geocode.ts), so it belongs here, called
 * once before either transport starts serving.
 */
export function applyStartupEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (env.MAPPOSTER_GEOCODE_LANG) setGeocodeLanguage(env.MAPPOSTER_GEOCODE_LANG);
}

/**
 * Finding A: resolve whether the configured ffmpeg actually runs and log
 * loudly (never throw) if it does not — a missing encoder must never crash
 * the server (image rendering via render_map/`/render` never touches
 * ffmpeg), but silently discovering it per-request via a settle-only degrade
 * on the first `/render-clip` call is exactly the failure mode this closes.
 * Fire-and-forget: does not delay startup, the warning just lands within a
 * few ms of the "listening" log either way.
 */
export function probeFfmpegAtStartup(): void {
  void checkFfmpegAvailable().then((ok) => {
    if (!ok) {
      console.error(
        `[mapposter] ffmpeg not found (looked for "${ffmpegBin()}") — image rendering (render_map, /render) is ` +
          `unaffected, but every clip encode (render_clip, /render-clip) will degrade to settle-only until ffmpeg ` +
          `is installed or MAPPOSTER_FFMPEG points at its path.`,
      );
    }
  });
}
