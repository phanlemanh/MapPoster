import { describe, it, expect, vi } from 'vitest';
import { createResourcePool } from './browserPool';

describe('createResourcePool: discarding a broken resource', () => {
  const seq = () => {
    let n = 0;
    return vi.fn(async () => ({ id: ++n }));
  };

  it('frees the slot so the next acquire gets a FRESH resource, not the corpse', async () => {
    // release() pushes a dead page back into `idle`; the next acquire pops the
    // same corpse and goto throws again — that slot is poisoned for the process
    // lifetime. Exactly the crash-loop the pool was supposed to survive.
    const factory = seq();
    const pool = createResourcePool(1, factory);

    const first = await pool.acquire();
    expect(first).toEqual({ id: 1 });
    pool.discard(first);

    expect(await pool.acquire()).toEqual({ id: 2 });
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('destroys the discarded resource', async () => {
    const destroyItem = vi.fn(async () => {});
    const pool = createResourcePool(1, seq(), undefined, { destroyItem });
    pool.discard(await pool.acquire());
    await new Promise((r) => setTimeout(r, 0));
    expect(destroyItem).toHaveBeenCalledWith({ id: 1 });
  });

  it('mints a replacement for whoever is queued behind the discarded resource', async () => {
    // the waiter is parked on release(); dropping the item would strand it forever
    const factory = seq();
    const pool = createResourcePool(1, factory);

    const held = await pool.acquire();
    const queued = pool.acquire(); // no slot free — parks

    pool.discard(held);
    expect(await queued).toEqual({ id: 2 });
  });

  it('rejects the queued waiter when the replacement cannot be created', async () => {
    let n = 0;
    const factory = vi.fn(async () => {
      if (++n === 2) throw new Error('chromium is gone');
      return { id: n };
    });
    const pool = createResourcePool(1, factory);

    const held = await pool.acquire();
    const queued = pool.acquire();

    pool.discard(held);
    await expect(queued).rejects.toThrow(/chromium is gone/);

    expect(await pool.acquire()).toEqual({ id: 3 }); // the slot was freed, not wedged
  });

  it('reports the underlying browser health', async () => {
    let alive = true;
    const pool = createResourcePool(1, seq(), undefined, { healthy: () => alive });
    expect(pool.healthy()).toBe(true);
    alive = false;
    expect(pool.healthy()).toBe(false);
  });

  it('defaults to healthy when no probe is supplied', () => {
    expect(createResourcePool(1, seq()).healthy()).toBe(true);
  });

  it('rejects parked waiters on close instead of hanging them', async () => {
    const pool = createResourcePool(1, seq());
    await pool.acquire();
    const queued = pool.acquire();
    await pool.close();
    await expect(queued).rejects.toThrow(/pool closed/);
  });
});

describe('createResourcePool', () => {
  it('never creates more than `size` resources under concurrent acquires (F5)', async () => {
    let n = 0;
    const factory = vi.fn(async () => {
      await new Promise((r) => setTimeout(r, 10)); // the await that used to lose the race
      return { id: ++n };
    });
    const pool = createResourcePool(2, factory);

    // four concurrent acquires against a pool of 2
    const a = pool.acquire();
    const b = pool.acquire();
    const c = pool.acquire();
    const d = pool.acquire();

    const [r1, r2] = await Promise.all([a, b]);
    expect(factory).toHaveBeenCalledTimes(2); // c and d must WAIT, not create

    pool.release(r1);
    pool.release(r2);
    const [r3, r4] = await Promise.all([c, d]);

    expect(factory).toHaveBeenCalledTimes(2); // still capped
    expect([r3, r4]).toEqual(expect.arrayContaining([r1, r2])); // handed the released ones
  });

  it('frees the reserved slot when the factory throws', async () => {
    const factory = vi.fn(async () => {
      throw new Error('boom');
    });
    const pool = createResourcePool(1, factory);
    await expect(pool.acquire()).rejects.toThrow('boom');
    await expect(pool.acquire()).rejects.toThrow('boom'); // slot was released, so it retries
    expect(factory).toHaveBeenCalledTimes(2);
  });

  it('hands a released resource to the longest-waiting acquirer', async () => {
    const factory = vi.fn(async () => ({ id: 1 }));
    const pool = createResourcePool(1, factory);
    const first = await pool.acquire();
    const queued = pool.acquire();
    pool.release(first);
    await expect(queued).resolves.toBe(first);
    expect(factory).toHaveBeenCalledTimes(1);
  });
});

describe('renderFrame returns a broken page via discard, not release', () => {
  it('discards the page when the render throws, and releases it when it succeeds', async () => {
    const { renderFrame } = await import('./renderFrame');
    const { createConfigStore } = await import('./configStore');
    const configStore = createConfigStore();
    const page = { goto: vi.fn(), waitForFunction: vi.fn(), evaluate: vi.fn() };
    const pool = { acquire: vi.fn(async () => page), release: vi.fn(), discard: vi.fn(), healthy: () => true, close: vi.fn() };

    // a page that crashed mid-navigation
    page.goto.mockRejectedValueOnce(new Error('Target page, context or browser has been closed'));
    await expect(
      renderFrame({ size: { width: 1, height: 1 } } as never, { appUrl: 'http://x', pool, configStore } as never),
    ).rejects.toThrow(/has been closed/);
    expect(pool.discard).toHaveBeenCalledWith(page);
    expect(pool.release).not.toHaveBeenCalled();

    // the URL carries only an id, and the entry is released even on failure
    const url = String(page.goto.mock.calls[0][0]);
    expect(url).toMatch(/\/render\.html\?configId=[0-9a-f]{32}$/);
    expect(configStore.size()).toBe(0);
  });

  it('never puts the payload in the URL — that capped every render at 16 KB', async () => {
    const { renderFrame } = await import('./renderFrame');
    const { createConfigStore } = await import('./configStore');
    const configStore = createConfigStore();
    const bigConfig = { size: { width: 1, height: 1 }, pad: 'x'.repeat(40_000) };
    const page = {
      goto: vi.fn(),
      waitForFunction: vi.fn(),
      evaluate: vi.fn().mockRejectedValueOnce(new Error('stop here')),
    };
    const pool = { acquire: vi.fn(async () => page), release: vi.fn(), discard: vi.fn(), healthy: () => true, close: vi.fn() };

    await expect(renderFrame(bigConfig as never, { appUrl: 'http://x', pool, configStore } as never)).rejects.toThrow();
    const url = String(page.goto.mock.calls[0][0]);
    expect(url.length).toBeLessThan(200);
    expect(url).not.toContain('pad');
  });
});
