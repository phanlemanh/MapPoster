import { describe, it, expect, vi } from 'vitest';
import path from 'node:path';
import { ensureDist } from './ensureDist';

const cwd = '/repo';
const defaultDist = path.join(cwd, 'dist');

describe('ensureDist', () => {
  it('does nothing when the harness already exists', () => {
    const build = vi.fn();
    ensureDist({ appDistDir: defaultDist }, { cwd, exists: () => true, build, log: () => {} });
    expect(build).not.toHaveBeenCalled();
  });

  it('builds once when the default dist is missing, then it exists', () => {
    // exists: false before the build, true after — the fresh-clone happy path.
    let built = false;
    const build = vi.fn(() => {
      built = true;
    });
    ensureDist({ appDistDir: defaultDist }, { cwd, exists: () => built, build, log: () => {} });
    expect(build).toHaveBeenCalledTimes(1);
  });

  it('refuses to auto-build a CUSTOM dist dir — vite build only writes ./dist', () => {
    const build = vi.fn();
    expect(() =>
      ensureDist({ appDistDir: '/some/custom/out' }, { cwd, exists: () => false, build, log: () => {} }),
    ).toThrow(/MAPPOSTER_DIST|npm run setup/);
    expect(build).not.toHaveBeenCalled();
  });

  it('throws a clear message if the build ran but the harness is still missing', () => {
    // build "succeeds" but produces nothing — a misconfigured toolchain
    expect(() =>
      ensureDist({ appDistDir: defaultDist }, { cwd, exists: () => false, build: () => {}, log: () => {} }),
    ).toThrow(/still missing.*npm run setup/i);
  });
});
