import http from 'node:http';
import { promises as fs } from 'node:fs';
import path from 'node:path';

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

export interface AppServer {
  url: string;
  close(): Promise<void>;
}

/** Serve the built web app (dist/, containing render.html) over HTTP so the
 * headless pages load app code locally instead of from the internet. */
export async function startAppServer(cfg: { appDistDir: string; appPort: number }): Promise<AppServer> {
  const root = path.resolve(cfg.appDistDir);
  const server = http.createServer(async (req, res) => {
    try {
      const u = new URL(req.url ?? '/', 'http://localhost');
      let pathname = decodeURIComponent(u.pathname);
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
  await new Promise<void>((resolve) => server.listen(cfg.appPort, resolve));
  const addr = server.address();
  const port = typeof addr === 'object' && addr ? addr.port : cfg.appPort;
  return {
    url: `http://localhost:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
