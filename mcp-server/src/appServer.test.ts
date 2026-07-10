import { describe, it, expect } from 'vitest';
import os from 'node:os';
import nodeHttp from 'node:http';
import { startAppServer, CONFIG_ROUTE } from './appServer';
import { createConfigStore } from './configStore';
import { loadServerConfig } from '../config';

/** This machine's first non-internal IPv4 address, if it has one. */
function lanAddress(): string | undefined {
  return Object.values(os.networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
}

function get(host: string, port: number, path = '/render.html'): Promise<number | 'refused'> {
  return new Promise((resolve) => {
    const req = nodeHttp.get({ host, port, path, timeout: 2000 }, (res) => {
      res.resume();
      resolve(res.statusCode ?? 0);
    });
    req.on('error', () => resolve('refused'));
    req.on('timeout', () => {
      req.destroy();
      resolve('refused');
    });
  });
}

describe('startAppServer bind', () => {
  it('defaults to loopback', () => {
    expect(loadServerConfig({} as NodeJS.ProcessEnv).appHost).toBe('127.0.0.1');
  });

  it('is not reachable from the LAN by default', async () => {
    // `server.listen(port, cb)` puts the callback where the host belongs and binds
    // `::`. This listener serves dist/ with no access control, and makeRenderDeps
    // starts it for BOTH transports — so that bug exposed every deployment.
    const lan = lanAddress();
    if (!lan) return; // CI container with only loopback: nothing to prove

    const app = await startAppServer({ appDistDir: 'dist', appPort: 0, appHost: '127.0.0.1' });
    const port = Number(new URL(app.url).port);
    try {
      expect(await get('127.0.0.1', port)).not.toBe('refused'); // our own pooled browser still reaches it
      expect(await get(lan, port)).toBe('refused');
    } finally {
      await app.close();
    }
  });

  it('can be opened deliberately', async () => {
    const lan = lanAddress();
    if (!lan) return;

    const app = await startAppServer({ appDistDir: 'dist', appPort: 0, appHost: '0.0.0.0' });
    const port = Number(new URL(app.url).port);
    try {
      expect(await get(lan, port)).not.toBe('refused');
    } finally {
      await app.close();
    }
  });
});

describe('the config route', () => {
  function fetchPath(port: number, path: string): Promise<{ status: number; body: string }> {
    return new Promise((resolve) => {
      nodeHttp.get({ host: '127.0.0.1', port, path, timeout: 2000 }, (res) => {
        let body = '';
        res.on('data', (d) => (body += d));
        res.on('end', () => resolve({ status: res.statusCode ?? 0, body }));
      }).on('error', () => resolve({ status: 0, body: '' }));
    });
  }

  it('serves a parked config and 404s an id it never minted', async () => {
    // The config used to ride in the URL, capping every render at Node's 16 KB
    // request-head limit — a city boundary is ~20 KB, so the server said 431.
    const store = createConfigStore();
    const big = JSON.stringify({ pad: 'x'.repeat(40_000) });
    const id = store.put(big);

    const app = await startAppServer({ appDistDir: 'dist', appPort: 0, appHost: '127.0.0.1' }, store);
    const port = Number(new URL(app.url).port);
    try {
      const ok = await fetchPath(port, `${CONFIG_ROUTE}${id}`);
      expect(ok.status).toBe(200);
      expect(ok.body).toBe(big); // 40 KB, far past what a URL could carry

      expect((await fetchPath(port, `${CONFIG_ROUTE}nope`)).status).toBe(404);
      // the route must never fall through to the static file handler
      expect((await fetchPath(port, `${CONFIG_ROUTE}../../package.json`)).status).toBe(404);
    } finally {
      await app.close();
    }
  });

  it('404s every config id when no store is wired in', async () => {
    const app = await startAppServer({ appDistDir: 'dist', appPort: 0, appHost: '127.0.0.1' });
    const port = Number(new URL(app.url).port);
    try {
      expect((await fetchPath(port, `${CONFIG_ROUTE}anything`)).status).toBe(404);
    } finally {
      await app.close();
    }
  });
});
