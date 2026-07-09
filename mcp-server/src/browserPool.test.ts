import { describe, it, expect, vi } from 'vitest';
import { createResourcePool } from './browserPool';

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
