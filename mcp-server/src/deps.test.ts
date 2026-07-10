import { describe, it, expect, vi } from 'vitest';

// the render primitive itself is covered by renderFrame.test.ts (real browser)
vi.mock('./renderFrame', () => ({ renderFrame: vi.fn(async () => Buffer.alloc(1)) }));

import { memoizeSuccess, makeRenderDeps, type Runtime } from './deps';
import type { ServerConfig } from '../config';

describe('memoizeSuccess', () => {
  it('caches a success and never calls the factory again', async () => {
    const factory = vi.fn(async () => 'ok');
    const get = memoizeSuccess(factory);
    expect(await get()).toBe('ok');
    expect(await get()).toBe('ok');
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('does NOT cache a rejection — one transient failure must not brick the process', async () => {
    // `cached ??= factory()` stores the promise before it settles; a rejected
    // promise is not null, so the next `??=` keeps it and re-throws forever.
    // Realistic trigger: EADDRINUSE on the app port, or a flaky chromium.launch().
    let attempt = 0;
    const factory = vi.fn(async () => {
      if (++attempt === 1) throw new Error('EADDRINUSE :4180');
      return 'ok';
    });
    const get = memoizeSuccess(factory);

    await expect(get()).rejects.toThrow(/EADDRINUSE/);
    expect(await get()).toBe('ok'); // upstream recovered — we must retry
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('shares one in-flight attempt between concurrent callers', async () => {
    const factory = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10));
      return 'ok';
    });
    const get = memoizeSuccess(factory);
    expect(await Promise.all([get(), get(), get()])).toEqual(['ok', 'ok', 'ok']);
    expect(factory).toHaveBeenCalledTimes(1);
  });

  it('reset() forces the next call to rebuild', async () => {
    const factory = vi.fn(async () => 'ok');
    const get = memoizeSuccess(factory);
    await get();
    get.reset();
    await get();
    expect(factory).toHaveBeenCalledTimes(2);
  });
});

describe('makeRenderDeps', () => {
  const cfg = { sinkDir: '/tmp', poolSize: 1 } as ServerConfig;

  /** A fake runtime whose pool reports the health we dictate. */
  function fakeRuntime(healthy: () => boolean) {
    const close = vi.fn(async () => {});
    const rt: Runtime = {
      appUrl: 'http://127.0.0.1:1',
      pool: { acquire: vi.fn(), release: vi.fn(), discard: vi.fn(), healthy, close: vi.fn() } as never,
      close,
    };
    return { rt, close };
  }

  it('rebuilds the runtime once the browser has died', async () => {
    let alive = true;
    const built: { close: ReturnType<typeof vi.fn> }[] = [];
    const start = vi.fn(async () => {
      const r = fakeRuntime(() => alive);
      built.push({ close: r.close });
      return r.rt;
    });

    const deps = makeRenderDeps(cfg, start);
    await deps.render({} as never);
    expect(start).toHaveBeenCalledTimes(1); // healthy → reuse

    // chromium dies. This render still runs against the old runtime — death is
    // only observable afterwards — but the corpse must not survive the call.
    alive = false;
    await deps.render({} as never);
    expect(start).toHaveBeenCalledTimes(1);
    expect(built[0].close).toHaveBeenCalled();

    // the memo was dropped, so the next render builds a live runtime
    alive = true;
    await deps.render({} as never);
    expect(start).toHaveBeenCalledTimes(2);
    expect(built).toHaveLength(2);
  });

  it('keeps the runtime while the browser is alive', async () => {
    const start = vi.fn(async () => fakeRuntime(() => true).rt);
    const deps = makeRenderDeps(cfg, start);
    await deps.render({} as never);
    await deps.render({} as never);
    expect(start).toHaveBeenCalledTimes(1);
  });
});
