import { describe, it, expect, vi, afterEach } from 'vitest';
import { getGeocodeLanguage, setGeocodeLanguage, DEFAULT_GEOCODE_LANG } from '../../src/lib/geocoding';
import { applyStartupEnv, probeFfmpegAtStartup } from './bootstrap';

afterEach(() => {
  setGeocodeLanguage(DEFAULT_GEOCODE_LANG); // don't leak state into other test files
});

describe('applyStartupEnv (Finding I: MAPPOSTER_GEOCODE_LANG wiring)', () => {
  it('wires MAPPOSTER_GEOCODE_LANG through to setGeocodeLanguage', () => {
    applyStartupEnv({ MAPPOSTER_GEOCODE_LANG: 'en' } as NodeJS.ProcessEnv);
    expect(getGeocodeLanguage()).toBe('en');
  });

  it('leaves the default in place when MAPPOSTER_GEOCODE_LANG is unset', () => {
    applyStartupEnv({} as NodeJS.ProcessEnv);
    expect(getGeocodeLanguage()).toBe(DEFAULT_GEOCODE_LANG);
  });
});

describe('probeFfmpegAtStartup (Finding A)', () => {
  it('never throws, even when ffmpeg cannot be resolved', async () => {
    const prev = process.env.MAPPOSTER_FFMPEG;
    process.env.MAPPOSTER_FFMPEG = '/definitely/not/a/real/binary-xyz-mapposter';
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      expect(() => probeFfmpegAtStartup()).not.toThrow();
      // the probe runs async (fire-and-forget) — give its promise a turn
      await new Promise((r) => setTimeout(r, 50));
      expect(errSpy).toHaveBeenCalledWith(expect.stringContaining('ffmpeg not found'));
    } finally {
      errSpy.mockRestore();
      if (prev === undefined) delete process.env.MAPPOSTER_FFMPEG;
      else process.env.MAPPOSTER_FFMPEG = prev;
    }
  });
});
