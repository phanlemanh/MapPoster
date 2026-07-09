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
 * Serve the MCP server over Streamable HTTP (stateless). Per MCP's stateless
 * pattern, each request gets a fresh McpServer + transport; the render deps
 * (browser pool) are shared across requests.
 */
export async function startHttpServer(port = 4181, deps: ToolDeps = makeRenderDeps()): Promise<HttpServer> {
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405).end('method not allowed');
      return;
    }
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', async () => {
      let body: unknown;
      try {
        body = data ? JSON.parse(data) : undefined;
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
    });
  });

  await new Promise<void>((resolve) => server.listen(port, resolve));
  const addr = server.address();
  const p = typeof addr === 'object' && addr ? addr.port : port;
  return {
    url: `http://localhost:${p}/mcp`,
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
