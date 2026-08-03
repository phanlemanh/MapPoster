import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { promises as fs } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { z } from 'zod';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createServer } from './server';
import { makeRenderDeps } from './deps';
import { DEFAULT_MAX_BODY_BYTES, DEFAULT_CLIP_MAX_BYTES, envNumber, loadServerConfig } from '../config';
import { ensureDist } from './ensureDist';
import { renderMapSchema, resolvedOf, motionParamSchema, type ToolDeps } from './tools';
import { resolveConfig } from './resolveConfig';
import { deliver } from './delivery';
import { resolveMotion } from './motionCompiler';
import { DEFAULT_MAX_CLIP_FRAMES, type MotionScript } from '../../src/render/motionScript';
import type { RenderConfig } from '../../src/render/renderConfig';

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
    // Plain-REST sibling to the MCP transport below, for callers (e.g. OneHub)
    // that just want a PNG and don't speak JSON-RPC. Same origin guard above;
    // an optional bearer token gates it separately since, unlike /mcp, nothing
    // here requires a client library that could carry MCP auth.
    if (req.url === '/render') {
      const token = process.env.MAPPOSTER_TOKEN;
      if (token && req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401).end('unauthorized');
        return;
      }
      void (async () => {
        try {
          const body = await readJsonBody(req, maxBodyBytes);
          // Same contract render_map registers on the MCP transport — parsed
          // here rather than trusted as-is, and never a second hand-rolled
          // schema that could drift from it.
          const params = renderMapSchema.parse(body);
          const cfg = await resolveConfig(params);
          const png = await deps.render(cfg);
          const image = await deliver(png, `rest-${Date.now()}`, 'inline', { sinkDir: deps.sinkDir });
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: true,
              base64: image.base64,
              width: image.width,
              height: image.height,
              place: cfg.place.name,
              resolved: resolvedOf(cfg),
            }),
          );
        } catch (e) {
          const status = e instanceof PayloadTooLargeError ? 413 : 200;
          // A raw ZodError.message is a multi-line JSON issues dump; prettifyError
          // gives the same one-line human-readable clarity every other guard in
          // this codebase already throws (assertTheme, assertLngLat, ...).
          const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
          res.writeHead(status, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: message }));
        }
      })();
      return;
    }
    // Text-free animated clip: caller supplies `motion` (preset OR a raw
    // MotionScript) on top of the same render_map contract; chrome is forced
    // to 'clean' regardless of what's asked for (AC-9 — no text ever enters
    // a clip frame). Same bearer/body-cap guards as /render above.
    if (req.url === '/render-clip') {
      const token = process.env.MAPPOSTER_TOKEN;
      if (token && req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401).end('unauthorized');
        return;
      }
      void (async () => {
        try {
          const body = (await readJsonBody(req, maxBodyBytes)) as Record<string, unknown> | undefined;

          const motionParam = motionParamSchema.safeParse(body?.motion);
          if (!motionParam.success) {
            res.writeHead(422, { 'content-type': 'application/json' });
            res.end(
              JSON.stringify({
                ok: false,
                error: 'motion is required: { preset: "approach"|"pushIn"|"drift", fps?, durationSec? } or { script }',
              }),
            );
            return;
          }

          const params = renderMapSchema.parse(body);
          const base = await resolveConfig(params);
          const maxFrames = envNumber(process.env, 'MAPPOSTER_MAX_CLIP_FRAMES', DEFAULT_MAX_CLIP_FRAMES, { min: 24 });
          // AC-9: clips are text-free — force clean chrome, never the caller's choice.
          // Built as a NEW object (no `cfg.chrome = ...` mutation) per this repo's
          // immutability rule.
          const resolvedBase: RenderConfig = { ...base, chrome: 'clean' };

          let preset: string | undefined;
          let motion: MotionScript;
          try {
            const resolved = resolveMotion(motionParam.data, resolvedBase, maxFrames);
            motion = resolved.motion;
            preset = resolved.preset;
          } catch (e) {
            // A raw ZodError from validateMotionScript's own schema.parse() (bad
            // fps, empty camera, ...) has no R:/O:/L:/B:/I: prefix and dumps as a
            // verbose issues array — prettify it so 422 is always a readable
            // string. An invariant violation is already a plain Error with that
            // prefix; forward its message VERBATIM so the caller can find the rule.
            const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
            res.writeHead(422, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: message }));
            return;
          }

          const cfg: RenderConfig = { ...resolvedBase, motion };

          if (!deps.renderClip || !deps.encodeAnimation) throw new Error('clip rendering not wired (renderClip/encodeAnimation deps missing)');
          const { frames, settle } = await deps.renderClip(cfg);
          const settleOut = { base64: settle.toString('base64'), format: 'png' as const, width: cfg.size.width, height: cfg.size.height };
          const motionOut = { ...(preset ? { preset } : {}), restAtSec: motion.restAtSec };

          const outPath = path.join(os.tmpdir(), `mapposter-clip-${Date.now()}-${Math.random().toString(36).slice(2)}.mp4`);
          try {
            let mp4: Buffer;
            try {
              await deps.encodeAnimation(frames, { fps: motion.fps, format: 'mp4', outPath });
              mp4 = await fs.readFile(outPath);
            } finally {
              // Cleanup must run on EVERY path — clean success, an encoder crash
              // mid-write (real ffmpeg leaves a partial file behind), or a read
              // failure — so nothing is ever orphaned in os.tmpdir(). Swallow any
              // rm error itself: cleanup must never mask the original failure.
              await fs.rm(outPath, { force: true }).catch(() => {});
            }

            const cap = envNumber(process.env, 'MAPPOSTER_CLIP_MAX_BYTES', DEFAULT_CLIP_MAX_BYTES, { min: 1 });
            if (mp4.length > cap) {
              res.writeHead(422, { 'content-type': 'application/json' });
              res.end(
                JSON.stringify({
                  ok: false,
                  error: `clip is ${mp4.length} bytes, over MAPPOSTER_CLIP_MAX_BYTES=${cap} — lower fps/durationSec or size`,
                }),
              );
              return;
            }

            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(
              JSON.stringify({
                ok: true,
                clip: {
                  base64: mp4.toString('base64'),
                  format: 'mp4',
                  width: cfg.size.width,
                  height: cfg.size.height,
                  durationSec: motion.durationSec,
                  fps: motion.fps,
                  bytes: mp4.length,
                },
                settle: settleOut,
                motion: motionOut,
                resolved: resolvedOf(cfg),
              }),
            );
          } catch (e) {
            // Frames were already captured — an encoder failure (missing ffmpeg,
            // a corrupt frame) must never throw away the settle still that
            // already exists (degrade path, spec §5). The temp file at outPath
            // has already been swept up by the `finally` above either way.
            res.writeHead(200, { 'content-type': 'application/json' });
            res.end(
              JSON.stringify({
                ok: true,
                settle: settleOut,
                motion: motionOut,
                resolved: resolvedOf(cfg),
                clipError: `encode failed: ${(e as Error).message ?? String(e)}`,
              }),
            );
          }
        } catch (e) {
          const status = e instanceof PayloadTooLargeError ? 413 : 200;
          const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
          res.writeHead(status, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: message }));
        }
      })();
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
  try {
    ensureDist(loadServerConfig());
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  startHttpServer(envNumber(process.env, 'MCP_HTTP_PORT', 4181, { min: 0, max: 65535 }))
    .then((s) => console.error(`MapPoster MCP (HTTP) listening at ${s.url}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
