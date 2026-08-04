import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';

export type AnimationFormat = 'gif' | 'mp4';

export interface EncodeOpts {
  fps: number;
  format: AnimationFormat;
  /** absolute output path, extension included */
  outPath: string;
  /** GIF only: downscale to this width (256-color GIFs at full poster size are enormous) */
  gifWidth?: number;
}

/** `ffmpeg` from PATH, overridable for machines that keep it elsewhere. */
export function ffmpegBin(): string {
  return process.env.MAPPOSTER_FFMPEG || 'ffmpeg';
}

/**
 * Startup probe (Finding A): resolve whether the configured ffmpeg actually
 * runs, WITHOUT throwing — a missing encoder must never crash the server
 * (image rendering via `render_map`/`/render` doesn't touch ffmpeg at all),
 * but it should be loud at boot rather than discovered per-request via a
 * silent settle-only degrade on the first `/render-clip` call. Callers log a
 * warning when this resolves `false`; see http.ts's/stdio.ts's startup block.
 */
export function checkFfmpegAvailable(bin: string = ffmpegBin(), probeArgs: string[] = ['-version']): Promise<boolean> {
  return new Promise((resolve) => {
    execFile(bin, probeArgs, { timeout: 5_000 }, (err) => resolve(!err));
  });
}

function run(bin: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { maxBuffer: 64 * 1024 * 1024 }, (err, _stdout, stderr) => {
      if (!err) return resolve();
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
        return reject(new Error(`ffmpeg not found (looked for "${bin}") — install ffmpeg or set MAPPOSTER_FFMPEG to its path`));
      }
      reject(new Error(`ffmpeg failed: ${String(stderr).slice(-800)}`));
    });
  });
}

/**
 * Build the ffmpeg argument list — pure so tests can pin the encoding choices
 * without spawning anything.
 *
 * GIF goes through palettegen/paletteuse in one filtergraph (the naive path
 * dithers against a generic palette and bands the dark themes to mush). MP4 is
 * libx264 + yuv420p + faststart — the container TikTok/social actually wants;
 * yuv420p needs even dimensions, so trunc(n/2)*2 guards odd custom formats.
 */
export function encodeArgs(framePattern: string, opts: EncodeOpts): string[] {
  const base = ['-y', '-framerate', String(opts.fps), '-i', framePattern];
  if (opts.format === 'gif') {
    const scale = opts.gifWidth ? `scale=${opts.gifWidth}:-1:flags=lanczos,` : '';
    return [
      ...base,
      '-vf',
      `${scale}split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle`,
      '-loop',
      '0',
      opts.outPath,
    ];
  }
  return [
    ...base,
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-c:v',
    'libx264',
    '-pix_fmt',
    'yuv420p',
    '-crf',
    '20',
    '-movflags',
    '+faststart',
    opts.outPath,
  ];
}

/** Write PNG frames to a temp dir, encode with ffmpeg, clean up the frames. */
export async function encodeAnimation(frames: Buffer[], opts: EncodeOpts): Promise<string> {
  if (!frames.length) throw new Error('encodeAnimation: no frames');
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'mapposter-anim-'));
  try {
    await Promise.all(frames.map((buf, i) => fs.writeFile(path.join(dir, `frame-${String(i).padStart(3, '0')}.png`), buf)));
    await fs.mkdir(path.dirname(opts.outPath), { recursive: true });
    await run(ffmpegBin(), encodeArgs(path.join(dir, 'frame-%03d.png'), opts));
    return opts.outPath;
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
