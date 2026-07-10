import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server';
import { makeRenderDeps } from './deps';
import { DEFAULT_MAX_BODY_BYTES, envNumber } from '../config';
import type { ToolDeps } from './tools';

export interface HttpServer {
  url: string;
  close(): Promise<void>;
}

/** Thrown when a body exceeds the cap, so the handler can answer 413 not 400. */
export class PayloadTooLargeError extends Error {
  constructor(limit: number) {
    super(`Request body exceeds ${limit} bytes`);
    this.name = 'PayloadTooLargeError';
  }
}

/**
 * Collect the request body as BYTES before decoding, bounded by `maxBytes`.
 *
 * `data += chunk` decodes each Buffer independently, so a multibyte UTF-8
 * sequence straddling a chunk boundary is mangled into replacement chars —
 * very reachable here (Vietnamese place names, inline GeoJSON > one chunk).
 */
export function readJsonBody(req: NodeJS.ReadableStream, maxBytes = DEFAULT_MAX_BODY_BYTES): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let done = false;

    req.on('data', (chunk: Buffer | string) => {
      if (done) return;
      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buf.length;
      // Stop at the cap instead of buffering to OOM. A chunked body declares no
      // Content-Length, so counting bytes as they land is the only real bound.
      if (size > maxBytes) {
        done = true;
        chunks.length = 0;
        reject(new PayloadTooLargeError(maxBytes));
        (req as unknown as { destroy?: () => void }).destroy?.();
        return;
      }
      chunks.push(buf);
    });
    req.on('error', (e) => {
      if (!done) {
        done = true;
        reject(e);
      }
    });
    req.on('end', () => {
      if (done) return;
      done = true;
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

function parseList(v: string | undefined): string[] {
  return (v ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export interface OriginPolicy {
  allowedHosts: string[];
  allowedOrigins: string[];
}

/**
 * Guard a side-effecting, unauthenticated endpoint against DNS rebinding.
 *
 * Binding to loopback is not enough: an attacker's domain can resolve to
 * 127.0.0.1, so the socket looks local while the browser still attaches the
 * attacker's `Host` — and, cross-site, an `Origin`. Both must be vouched for.
 *
 * A server-to-server MCP client sends no `Origin` at all, so anything carrying
 * an `Origin` we don't recognise is a web page and is refused.
 */
export function isAllowedRequest(
  headers: { host?: string; origin?: string },
  { allowedHosts, allowedOrigins }: OriginPolicy,
): boolean {
  const origin = headers.origin?.toLowerCase();
  if (origin && !allowedOrigins.includes(origin)) return false;

  const host = headers.host?.toLowerCase();
  if (!host) return false; // HTTP/1.1 requires Host; absent means hand-rolled
  // strip the port, keeping a bracketed IPv6 literal intact ("[::1]:4181")
  const name = host.startsWith('[') ? host.slice(0, host.indexOf(']') + 1) : host.split(':')[0];
  return allowedHosts.includes(name);
}

const LOOPBACK_HOSTS = ['127.0.0.1', 'localhost', '[::1]'];

/**
 * Serve the MCP server over Streamable HTTP (stateless). Per MCP's stateless
 * pattern, each request gets a fresh McpServer + transport; the render deps
 * (browser pool) are shared across requests.
 *
 * Binds to loopback by default: these tools have side effects (drive a headless
 * browser, write files to the sink). Hosted deployments opt in explicitly with
 * MAPPOSTER_HTTP_HOST=0.0.0.0, and must then declare the names they answer to in
 * MAPPOSTER_HTTP_ALLOWED_HOSTS (browser callers also need ALLOWED_ORIGINS).
 */
export async function startHttpServer(
  port = 4181,
  deps: ToolDeps = makeRenderDeps(),
  host: string = process.env.MAPPOSTER_HTTP_HOST ?? '127.0.0.1',
  policy: OriginPolicy = {
    allowedHosts: parseList(process.env.MAPPOSTER_HTTP_ALLOWED_HOSTS),
    allowedOrigins: parseList(process.env.MAPPOSTER_HTTP_ALLOWED_ORIGINS),
  },
  maxBodyBytes = envNumber(process.env, 'MAPPOSTER_HTTP_MAX_BODY', DEFAULT_MAX_BODY_BYTES, { min: 1024 }),
): Promise<HttpServer> {
  const allowedHosts = policy.allowedHosts.length ? policy.allowedHosts : LOOPBACK_HOSTS;
  const server = http.createServer((req, res) => {
    if (req.method !== 'POST') {
      res.writeHead(405).end('method not allowed');
      return;
    }
    if (!isAllowedRequest(req.headers, { allowedOrigins: policy.allowedOrigins, allowedHosts })) {
      res.writeHead(403).end('forbidden');
      return;
    }
    // Refuse an oversized body before reading a byte of it. A chunked request
    // declares no length, so readJsonBody counts as it goes — this is the cheap
    // path, not the only one.
    const declared = Number(req.headers['content-length'] ?? 0);
    if (Number.isFinite(declared) && declared > maxBodyBytes) {
      res.writeHead(413).end('payload too large');
      return;
    }
    void (async () => {
      let body: unknown;
      try {
        body = await readJsonBody(req, maxBodyBytes);
      } catch (e) {
        if (e instanceof PayloadTooLargeError) res.writeHead(413).end('payload too large');
        else res.writeHead(400).end('invalid json');
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

  if (!LOOPBACK_HOSTS.includes(host) && !policy.allowedHosts.length) {
    // Fail closed, but say so — otherwise this reads as "the server is broken".
    console.error(
      `[mapposter] bound to ${host} with no MAPPOSTER_HTTP_ALLOWED_HOSTS; ` +
        `only loopback Host headers will be accepted (every other request → 403).`,
    );
  }
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
  startHttpServer(envNumber(process.env, 'MCP_HTTP_PORT', 4181, { min: 0, max: 65535 }))
    .then((s) => console.error(`MapPoster MCP (HTTP) listening at ${s.url}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
