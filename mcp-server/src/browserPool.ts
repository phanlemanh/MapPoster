import { chromium, type Browser, type Page } from '@playwright/test';

// Software WebGL so MapLibre renders in headless Chromium (matches playwright.config).
const LAUNCH_ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

export interface Pool {
  acquire(): Promise<Page>;
  release(page: Page): void;
  close(): Promise<void>;
}

/** A small pool of headless pages. Pages are reused across renders (each render
 * navigates fresh via goto), capped at `size` concurrent pages. */
export async function createPool(size: number): Promise<Pool> {
  const browser: Browser = await chromium.launch({ args: LAUNCH_ARGS });
  const idle: Page[] = [];
  const waiters: ((page: Page) => void)[] = [];
  let created = 0;

  async function makePage(): Promise<Page> {
    const ctx = await browser.newContext({ viewport: { width: 800, height: 1400 }, deviceScaleFactor: 1 });
    created++;
    return ctx.newPage();
  }

  return {
    async acquire() {
      const free = idle.pop();
      if (free) return free;
      if (created < size) return makePage();
      return new Promise<Page>((resolve) => waiters.push(resolve));
    },
    release(page) {
      const waiter = waiters.shift();
      if (waiter) waiter(page);
      else idle.push(page);
    },
    async close() {
      await browser.close();
    },
  };
}
