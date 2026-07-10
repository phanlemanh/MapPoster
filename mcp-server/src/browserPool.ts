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
  opts: { destroyItem?: (item: T) => Promise<void>; healthy?: () => boolean } = {},
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
      return new Promise<T>((resolve, reject) => waiters.push({ resolve, reject }));
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
export async function createPool(size: number): Promise<Pool<Page>> {
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
    },
  );
}
