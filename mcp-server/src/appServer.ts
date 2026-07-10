import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { ServerConfig } from '../config';
import type { ConfigStore } from './configStore';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.map': 'application/json',
};

/** Where the render page fetches its config. Must match src/render/main.tsx. */
export const CONFIG_ROUTE = '/__config/';

export interface AppServer {
  url: string;
  close(): Promise<void>;
}

/** Serve the built web app (dist/, containing render.html) over HTTP so the
 * headless pages load app code locally instead of from the internet. */
export async function startAppServer(
  cfg: Pick<ServerConfig, 'appDistDir' | 'appPort' | 'appHost'>,
  configStore?: ConfigStore,
): Promise<AppServer> {
  const root = path.resolve(cfg.appDistDir);
  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url ?? '/', 'http://localhost');
      let pathname = decodeURIComponent(u.pathname);

      // The render config, handed to the page out-of-band. Only ids this process
      // minted resolve; anything else is a plain 404 and never touches the disk.
      if (pathname.startsWith(CONFIG_ROUTE)) {
        const json = configStore?.get(pathname.slice(CONFIG_ROUTE.length));
        if (!json) {
          res.writeHead(404).end('unknown config id');
          return;
        }
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8' }).end(json);
        return;
      }

      if (pathname === '/') pathname = '/index.html';
      const file = path.resolve(path.join(root, pathname));
      if (file !== root && !file.startsWith(root + path.sep)) {
        res.writeHead(403);
        res.end('forbidden');
        return;
      }
      const data = await fs.readFile(file);
      res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('not found');
    }
  });
  // Bind the host explicitly. `listen(port, resolve)` puts the callback where the
  // host belongs, so Node binds `::` — and this listener has no access control
  // beyond a path-traversal guard. It was reachable from the LAN on every
  // deployment, including the stdio one.
  await new Promise<void>((resolve) => server.listen(cfg.appPort, cfg.appHost, resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : cfg.appPort;
  const dialHost = cfg.appHost === '0.0.0.0' || cfg.appHost === '::' ? 'localhost' : cfg.appHost;
  return {
    url: `http://${dialHost}:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
