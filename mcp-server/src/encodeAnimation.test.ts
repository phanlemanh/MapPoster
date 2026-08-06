import { describe, it, expect } from 'vitest';
import { encodeArgs, ffmpegBin, checkFfmpegAvailable, type EncodeOpts } from './encodeAnimation';

describe('encodeArgs', () => {
  it('GIF: scales, palettegen/paletteuse in one graph, loops forever', () => {
    const args = encodeArgs('/tmp/f/frame-%03d.png', { fps: 12, format: 'gif', outPath: '/out/a.gif', gifWidth: 540 });
    const vf = args[args.indexOf('-vf') + 1];
    expect(vf).toContain('scale=540:-1');
    expect(vf).toContain('palettegen');
    expect(vf).toContain('paletteuse');
    expect(args).toContain('-loop');
    expect(args[args.length - 1]).toBe('/out/a.gif');
    expect(args[args.indexOf('-framerate') + 1]).toBe('12');
  });

  it('GIF without gifWidth keeps native size', () => {
    const args = encodeArgs('f-%03d.png', { fps: 10, format: 'gif', outPath: 'a.gif' });
    expect(args[args.indexOf('-vf') + 1].startsWith('split')).toBe(true);
  });

  it('MP4: libx264 + yuv420p + faststart with even-dimension guard', () => {
    const args = encodeArgs('f-%03d.png', { fps: 24, format: 'mp4', outPath: '/out/a.mp4' });
    expect(args).toContain('libx264');
    expect(args).toContain('yuv420p');
    expect(args).toContain('+faststart');
    expect(args[args.indexOf('-vf') + 1]).toContain('trunc(iw/2)*2');
    expect(args[args.length - 1]).toBe('/out/a.mp4');
  });
});

describe('ffmpegBin', () => {
  it('honours MAPPOSTER_FFMPEG', () => {
    const prev = process.env.MAPPOSTER_FFMPEG;
    process.env.MAPPOSTER_FFMPEG = '/opt/bin/ffmpeg';
    expect(ffmpegBin()).toBe('/opt/bin/ffmpeg');
    if (prev === undefined) delete process.env.MAPPOSTER_FFMPEG;
    else process.env.MAPPOSTER_FFMPEG = prev;
    expect(ffmpegBin()).toBe(prev === undefined ? 'ffmpeg' : prev);
  });
});

describe('checkFfmpegAvailable (startup probe, Finding A)', () => {
  it('resolves false for a binary that does not exist, without throwing', async () => {
    await expect(checkFfmpegAvailable('/definitely/not/a/real/binary-xyz-mapposter')).resolves.toBe(false);
  });

  it('resolves true for a resolvable binary', async () => {
    // Stand in for ffmpeg with the current Node binary — this test must not
    // depend on ffmpeg actually being installed on the machine running it.
    await expect(checkFfmpegAvailable(process.execPath, ['--version'])).resolves.toBe(true);
  });
});

describe('encodeArgs quality (PR #3)', () => {
  const base = { fps: 18, format: 'mp4' as const, outPath: '/tmp/x.mp4' };
  const crfOf = (o: Partial<EncodeOpts>) => {
    const a = encodeArgs('f%04d.png', { ...base, ...o });
    return a[a.indexOf('-crf') + 1];
  };

  it('defaults to exactly the crf the encoder used before this knob existed', () => {
    // Nếu mặc định lệch khỏi 20 thì mọi clip đang chạy đổi dung lượng lẫn chất
    // lượng mà không ai yêu cầu — đó là đổi hành vi, không phải thêm tuỳ chọn.
    expect(crfOf({})).toBe('20');
    expect(encodeArgs('f%04d.png', { ...base, quality: 'standard' })).toEqual(encodeArgs('f%04d.png', base));
  });

  it('maps each quality to a distinct crf and encoder preset', () => {
    expect(crfOf({ quality: 'draft' })).toBe('28');
    expect(crfOf({ quality: 'standard' })).toBe('20');
    expect(crfOf({ quality: 'high' })).toBe('16');
    expect(encodeArgs('f%04d.png', { ...base, quality: 'draft' })).toContain('veryfast');
    expect(encodeArgs('f%04d.png', { ...base, quality: 'high' })).toContain('slow');
  });

  it('leaves GIF args untouched — crf has no meaning on that branch', () => {
    const gif = { fps: 12, format: 'gif' as const, outPath: '/tmp/x.gif' };
    expect(encodeArgs('f%04d.png', { ...gif, quality: 'high' })).toEqual(encodeArgs('f%04d.png', gif));
    expect(encodeArgs('f%04d.png', { ...gif, quality: 'draft' })).not.toContain('-crf');
  });
});
