import { describe, it, expect } from 'vitest';
import os from 'node:os';
import nodeHttp from 'node:http';
import { startAppServer } from './appServer';
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
