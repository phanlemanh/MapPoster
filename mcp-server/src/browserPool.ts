import { chromium, type Browser, type Page } from '@playwright/test';

// Software WebGL so MapLibre renders in headless Chromium (matches playwright.config).
const LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export interface Pool<T = Page> {
  acquire(): Promise<T>;
  /** Hand a healthy resource back. */
  release(item: T): void;
  /** Hand a BROKEN resource back: destroy it and free its slot. */
  discard(item: T): void;
  /** False once the underlying browser has died — the whole pool is a corpse. */
  healthy(): boolean;
  close(): Promise<void>;
}

interface Waiter<T> {
  resolve(item: T): void;
  reject(err: unknown): void;
}

/**
 * Thrown by `acquire()` when a caller waits longer than `acquireTimeoutMs`
 * for a free pool slot. Without a bound, two concurrent clip renders (each
 * pinning a page for up to a few minutes — spec §3) queue every OTHER
 * request behind them indefinitely: an ordinary `/render` never times out,
 * it just hangs until a slot frees. Failing loudly here turns that hang into
 * a clear, catchable server-side error instead.
 */
export class PoolAcquireTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Timed out waiting ${timeoutMs}ms for a free browser-pool slot (MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS) — the pool is saturated`);
    this.name = 'PoolAcquireTimeoutError';
  }
}

/**
 * Generic bounded pool. The factory is injected so the queueing/capping logic
 * is unit-testable without launching a browser.
 *
 * The slot is reserved SYNCHRONOUSLY before awaiting the factory — otherwise
 * concurrent acquires all read the same pre-increment counter, all pass the cap
 * check, and the pool overshoots `size` (defeating its whole purpose).
 */
export function createResourcePool<T>(
  size: number,
  factory: () => Promise<T>,
  destroy: () => Promise<void> = async () => {},
  opts: { destroyItem?: (item: T) => Promise<void>; healthy?: () => boolean; acquireTimeoutMs?: number } = {},
): Pool<T> {
  const idle: T[] = [];
  const waiters: Waiter<T>[] = [];
  let created = 0;

  return {
    async acquire() {
      const free = idle.pop();
      if (free) return free;
      if (created < size) {
        created++; // reserve the slot before any await
        try {
          return await factory();
        } catch (e) {
          created--; // release the reservation on failure
          throw e;
        }
      }
      return new Promise<T>((resolve, reject) => {
        // Wrapped so EVERY settlement path (release, discard's mint, close,
        // or the timeout below) clears the pending timer — an un-cleared
        // timer would fire against an already-settled promise (harmless) but
        // keep the event loop alive and, if the waiter had already been
        // spliced out for another reason, double-remove a no-longer-present
        // entry (guarded by the `indexOf` check below either way).
        let timer: ReturnType<typeof setTimeout> | undefined;
        const waiter: Waiter<T> = {
          resolve: (item) => {
            if (timer) clearTimeout(timer);
            resolve(item);
          },
          reject: (err) => {
            if (timer) clearTimeout(timer);
            reject(err);
          },
        };
        waiters.push(waiter);
        const timeoutMs = opts.acquireTimeoutMs;
        if (timeoutMs !== undefined && timeoutMs > 0) {
          timer = setTimeout(() => {
            const idx = waiters.indexOf(waiter);
            if (idx !== -1) waiters.splice(idx, 1);
            waiter.reject(new PoolAcquireTimeoutError(timeoutMs));
          }, timeoutMs);
          timer.unref?.();
        }
      });
    },
    release(item) {
      const waiter = waiters.shift();
      if (waiter) waiter.resolve(item);
      else idle.push(item);
    },
    /**
     * A crashed page handed back via `release` poisons its slot for the process
     * lifetime: it lands in `idle`, the next `acquire` pops the same corpse, and
     * `goto` throws again. Drop it instead — and if someone is queued behind it,
     * mint a replacement rather than leave them waiting on a resource that is gone.
     */
    discard(item) {
      created--;
      void opts.destroyItem?.(item).catch(() => {});
      const waiter = waiters.shift();
      if (!waiter) return;
      created++;
      factory().then(waiter.resolve, (e) => {
        created--;
        waiter.reject(e);
      });
    },
    healthy: opts.healthy ?? (() => true),
    async close() {
      const err = new Error('pool closed');
      while (waiters.length) waiters.shift()!.reject(err);
      await destroy();
    },
  };
}

/** A pool of headless pages. Each render navigates fresh via goto. */
export async function createPool(size: number, opts: { acquireTimeoutMs?: number } = {}): Promise<Pool<Page>> {
  const browser: Browser = await chromium.launch({ args: LAUNCH_ARGS });
  return createResourcePool<Page>(
    size,
    async () => {
      const ctx = await browser.newContext({ viewport: { width: 800, height: 1400 }, deviceScaleFactor: 1 });
      return ctx.newPage();
    },
    () => browser.close(),
    {
      destroyItem: (page) => page.context().close(),
      healthy: () => browser.isConnected(),
      acquireTimeoutMs: opts.acquireTimeoutMs,
    },
  );
}
