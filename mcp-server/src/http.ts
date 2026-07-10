import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server';
import { makeRenderDeps } from './deps';
import type { ToolDeps } from './tools';

export interface HttpServer {
  url: string;
  close(): Promise<void>;
}

/**
 * Collect the request body as BYTES before decoding.
 *
 * `data += chunk` decodes each Buffer independently, so a multibyte UTF-8
 * sequence straddling a chunk boundary is mangled into replacement chars —
 * very reachable here (Vietnamese place names, inline GeoJSON > one chunk).
 */
export function readJsonBody(req: NodeJS.ReadableStream): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer | string) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
    req.on('error', reject);
    req.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text) return resolve(undefined);
      try {
        resolve(JSON.parse(text));
      } catch (e) {
        reject(e);
      }
    });
  });
}

/**
 * Serve the MCP server over Streamable HTTP (stateless). Per MCP's stateless
 * pattern, each request gets a fresh McpServer + transport; the render deps
 * (browser pool) are shared across requests.
 *
 * Binds to loopback by default: these tools have side effects (drive a headless
 * browser, write files to the sink). Hosted deployments opt in explicitly with
 * MAPPOSTER_HTTP_HOST=0.0.0.0.
 */
export async function startHttpServer(
  port = 4181,
  deps: ToolDeps = makeRenderDeps(),
  host: string = process.env.MAPPOSTER_HTTP_HOST ?? '127.0.0.1',
): Promise<HttpServer> {
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405).end('method not allowed');
      return;
    }
    void (async () => {
      let body: unknown;
      try {
        body = await readJsonBody(req);
      } catch {
        res.writeHead(400).end('invalid json');
        return;
      }
      const mcp = createServer(deps);
      const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
      res.on('close', () => {
        void transport.close();
        void mcp.close();
      });
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body);
    })();
  });

  await new Promise<void>((resolve) => server.listen(port, host, resolve));
  const addr = server.address();
  const p = typeof addr === 'object' && addr ? addr.port : port;
  const dialHost = host === '0.0.0.0' || host === '::' ? 'localhost' : host;
  return {
    url: `http://${dialHost}:${p}/mcp`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

const isMain = Boolean(process.argv[1]) && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  startHttpServer(Number(process.env.MCP_HTTP_PORT ?? 4181))
    .then((s) => console.error(`MapPoster MCP (HTTP) listening at ${s.url}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
