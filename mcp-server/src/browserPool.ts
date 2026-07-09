import { chromium, type Browser, type Page } from '@playwright/test';

// Software WebGL so MapLibre renders in headless Chromium (matches playwright.config).
const LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export interface Pool<T = Page> {
  acquire(): Promise<T>;
  release(item: T): void;
  close(): Promise<void>;
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
): Pool<T> {
  const idle: T[] = [];
  const waiters: ((item: T) => void)[] = [];
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
      return new Promise<T>((resolve) => waiters.push(resolve));
    },
    release(item) {
      const waiter = waiters.shift();
      if (waiter) waiter(item);
      else idle.push(item);
    },
    async close() {
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
  );
}
