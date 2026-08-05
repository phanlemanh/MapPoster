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
import { renderMapSchema, resolvedOf, type ToolDeps } from './tools';
import { resolveConfig } from './resolveConfig';
import type { RenderConfig } from '../../src/render/renderConfig';
import { deliver } from './delivery';
import { prepareClipRender, MotionParamError, ClipConcurrencyError, motionParamSchema, type ClipPreparation } from './motionCompiler';
import { applyStartupEnv, probeFfmpegAtStartup } from './bootstrap';
import { createJobStore, createJobStoreFromEnv, JobQueueFullError, type JobRecord, type JobStore } from './jobStore';
import { createJobRunner, type JobRunner } from './jobRunner';

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

const jobSubmitSchema = z.object({
  kind: z.enum(['render', 'clip']),
  params: z.unknown(),
  motion: z.unknown().optional(),
});

/**
 * Thân phản hồi cho một lệnh HỎI việc. Kết quả sống trên ĐĨA — đọc lên ở đây,
 * không giữ trong sổ: một clip sát trần nằm ở hàng chục MB, còn instance chỉ có
 * 2 GB chia với Chromium.
 */
async function jobStatusBody(rec: JobRecord): Promise<Record<string, unknown>> {
  const out: Record<string, unknown> = { ok: true, id: rec.id, kind: rec.kind, status: rec.status };
  if (rec.resolved) out.resolved = rec.resolved;
  if (rec.motion) out.motion = rec.motion;
  if (rec.error) out.error = rec.error;
  if (rec.errorKind) out.errorKind = rec.errorKind;
  if (rec.degradeNote) out.clipError = rec.degradeNote;

  for (const a of rec.artifacts) {
    // Một tệp đã bị dọn hoặc chưa kịp ghi không được làm hỏng CẢ câu trả lời:
    // phần siêu dữ liệu vẫn đúng, chỉ thiếu nội dung.
    const base64 = await fs.readFile(a.path).then((b) => b.toString('base64')).catch(() => undefined);
    const block = { base64, format: a.format, width: a.width, height: a.height, bytes: a.bytes };
    if (a.role === 'image') out.image = block;
    if (a.role === 'settle') out.settle = block;
    if (a.role === 'clip') out.clip = block;
  }
  return out;
}

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
  jobs?: { store: JobStore; runner: JobRunner },
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
    // Từ chối một thân quá khổ TRƯỚC khi đọc một byte nào — và trước khi rẽ
    // vào bất kỳ cửa nào, nên cả ba cửa hưởng cùng một luật.
    //
    // Đây từng là lỗ thật: phép kiểm này chỉ đứng trước nhánh `/mcp`, nên
    // `/render` rơi thẳng vào `readJsonBody`, mà hàm đó HUỶ SOCKET khi chạm
    // trần rồi handler mới ghi 413 — người gọi nhận đứt kết nối chứ không nhận
    // mã lỗi. Bảng ca guard chạy chung ba cửa (AC-13) là thứ phát hiện ra nó;
    // test theo từng cửa riêng lẻ không bao giờ thấy.
    //
    // Thân theo lối chunked không khai độ dài thì `readJsonBody` vẫn đếm và
    // vẫn huỷ — đó là chốt chặn chống OOM, không phải đường đi thường.
    const declaredLength = Number(req.headers['content-length'] ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > maxBodyBytes) {
      res.writeHead(413, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: `Request body exceeds ${maxBodyBytes} bytes` }));
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
        // --- Resolve phase: parsing/validating/geocoding the CALLER's own
        // input. Anything thrown here is the caller's fault (Decision 3) —
        // a malformed body, a schema violation, an unresolvable location, a
        // bad theme/colour/geojson, an out-of-range zoom/format. `ok:false`
        // is unchanged; only the HTTP status now tells them which kind of
        // failure it was instead of always answering 200.
        let cfg: RenderConfig;
        try {
          const body = await readJsonBody(req, maxBodyBytes);
          // Same contract render_map registers on the MCP transport — parsed
          // here rather than trusted as-is, and never a second hand-rolled
          // schema that could drift from it.
          const params = renderMapSchema.parse(body);
          cfg = await resolveConfig(params);
        } catch (e) {
          if (e instanceof PayloadTooLargeError) {
            res.writeHead(413, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
            return;
          }
          // A raw ZodError.message is a multi-line JSON issues dump; prettifyError
          // gives the same one-line human-readable clarity every other guard in
          // this codebase already throws (assertTheme, assertLngLat, ...). Also
          // covers a malformed JSON body — readJsonBody's own JSON.parse throws
          // a plain SyntaxError, which falls through to this same 400 branch.
          const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
          res.writeHead(400, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: message }));
          return;
        }

        // --- Render phase: OUR infrastructure (browser pool, page render,
        // delivery to sinkDir). A failure here is our fault, not the
        // caller's — 500, not 400.
        try {
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
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }));
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
        // --- Resolve phase: parsing/validating/geocoding/compiling motion —
        // all the CALLER's own input. Anything thrown here is the caller's
        // fault EXCEPT the two conditions that already have their own,
        // more specific status: over the body cap (413) and over the shared
        // clip-concurrency limit (429, Decision 2). A well-formed-but-
        // semantically-rejected `motion` (bad preset, invariant violation)
        // stays 422, exactly as before Decision 3. Everything else here —
        // malformed JSON, a schema violation, an unresolvable location, a bad
        // theme/colour/geojson, an out-of-range zoom/format — is new: 400
        // instead of always 200.
        //
        // Finding C: config resolution + AC-9's chrome:'clean' force + the
        // MAPPOSTER_MAX_CLIP_FRAMES budget + preset-vs-script resolution all
        // live in ONE shared helper (motionCompiler.ts's prepareClipRender)
        // instead of being reimplemented here and again in tools.ts's
        // render_clip. A resolveConfig failure inside that same call throws
        // a plain Error, unwrapped by prepareClipRender on purpose — it
        // falls through to the generic 400 branch below, same as any other
        // resolve-phase failure.
        let prep: ClipPreparation;
        try {
          const body = (await readJsonBody(req, maxBodyBytes)) as Record<string, unknown> | undefined;
          const params = renderMapSchema.parse(body);
          prep = await prepareClipRender(params, body?.motion);
        } catch (e) {
          if (e instanceof PayloadTooLargeError) {
            res.writeHead(413, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
            return;
          }
          // Decision 2: over the shared clip-concurrency limit (both this
          // endpoint and MCP render_clip share ONE counter — see
          // motionCompiler.ts's acquireClipSlot).
          if (e instanceof ClipConcurrencyError) {
            res.writeHead(429, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
            return;
          }
          if (e instanceof MotionParamError) {
            res.writeHead(422, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
            return;
          }
          const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
          res.writeHead(400, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: message }));
          return;
        }

        // --- Render/encode phase: OUR infrastructure. `renderClip`/`deps`
        // wiring and frame capture failing here is our fault (500) — but the
        // two explicit outcomes below (encode-failure degrade, oversize
        // rejection) are NOT failures in that sense; they keep their
        // existing status codes untouched (spec §5 / Finding G).
        const { cfg, motion, preset, releaseClipSlot } = prep;
        try {
          try {
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
                // Finding G: this used to return 422 with NOTHING else, while the
                // encode-failure branch below returns the settle — inconsistent
                // with the spec's degrade contract ("a settle still that already
                // exists must never be thrown away"). Kept as 422 rather than
                // folded into the ok:true degrade below: unlike an encoder crash,
                // nothing actually failed here — the clip encoded fine, it is
                // just over the caller-fixable size policy — so it stays a
                // rejection of THIS request (still actionable: lower
                // fps/durationSec/size), just one that no longer discards the
                // settle still that already rendered successfully.
                res.writeHead(422, { 'content-type': 'application/json' });
                res.end(
                  JSON.stringify({
                    ok: false,
                    error: `clip is ${mp4.length} bytes, over MAPPOSTER_CLIP_MAX_BYTES=${cap} — lower fps/durationSec or size`,
                    settle: settleOut,
                    motion: motionOut,
                    resolved: resolvedOf(cfg),
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
            // Decision 3: anything that reaches here — `deps.renderClip`
            // itself throwing (a page crash mid-capture), or the clip deps
            // simply not being wired — is OUR infrastructure failing, not
            // the caller's input. The encode-failure degrade (200) and the
            // oversize rejection (422) above both `return` before this catch
            // is ever reached, so neither is reclassified by it.
            res.writeHead(500, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }));
          }
        } finally {
          // Decision 2: free the shared clip slot no matter how this call
          // ends — success, degrade, oversize rejection, or the 500 above.
          releaseClipSlot();
        }
      })();
      return;
    }
    // Lối bất đồng bộ: nhận việc rồi trả mã ngay. `/render` và `/render-clip`
    // ở trên KHÔNG đổi một chữ — muốn hết 429 thì dọn sang đây. Cả hai cửa đều
    // POST nên luật 405 ở đầu handler không phải nới ra, và quyết định
    // không-khai-healthCheckPath ở render.yaml không phải xem lại.
    if (jobs && (req.url === '/jobs' || req.url === '/jobs/status')) {
      const token = process.env.MAPPOSTER_TOKEN;
      if (token && req.headers.authorization !== `Bearer ${token}`) {
        res.writeHead(401).end('unauthorized');
        return;
      }
      const isSubmit = req.url === '/jobs';
      void (async () => {
        let body: unknown;
        try {
          body = await readJsonBody(req, maxBodyBytes);
        } catch (e) {
          const code = e instanceof PayloadTooLargeError ? 413 : 400;
          res.writeHead(code, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }));
          return;
        }

        if (!isSubmit) {
          const id = (body as { id?: unknown })?.id;
          const rec = typeof id === 'string' ? jobs.store.get(id) : undefined;
          if (!rec) {
            // Ngoại lệ DUY NHẤT của luật "mã HTTP nói về câu hỏi, thân nói về
            // việc": mã không tồn tại thì chính CÂU HỎI sai, không phải việc hỏng.
            res.writeHead(404, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: `no such job: ${String(id)}` }));
            return;
          }
          res.writeHead(200, { 'content-type': 'application/json' });
          res.end(JSON.stringify(await jobStatusBody(rec)));
          return;
        }

        // --- Nhận việc. Chỉ kiểm những gì kiểm được TỨC THÌ: khuôn dạng thuần.
        // Tra toạ độ là gọi mạng, độ trễ không chặn trên được — để lại cho thợ,
        // nếu không ta dựng lại đúng cái treo mà gói này đi gỡ.
        let submit: z.infer<typeof jobSubmitSchema>;
        try {
          submit = jobSubmitSchema.parse(body);
          renderMapSchema.parse(submit.params);
          if (submit.kind === 'clip') motionParamSchema.parse(submit.motion);
        } catch (e) {
          const message = e instanceof z.ZodError ? z.prettifyError(e) : ((e as Error).message ?? String(e));
          res.writeHead(400, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: message }));
          return;
        }

        try {
          const rec = jobs.store.create({ kind: submit.kind, params: submit.params, motionInput: submit.motion, nowMs: Date.now() });
          jobs.runner.kick();
          res.writeHead(202, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: true, id: rec.id, kind: rec.kind, status: rec.status }));
        } catch (e) {
          if (e instanceof JobQueueFullError) {
            res.writeHead(429, { 'content-type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: e.message }));
            return;
          }
          res.writeHead(500, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: (e as Error).message ?? String(e) }));
        }
      })();
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
  const cfg = loadServerConfig();
  try {
    ensureDist(cfg);
  } catch (e) {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  }
  applyStartupEnv();
  probeFfmpegAtStartup();

  const deps = makeRenderDeps(cfg);
  // Cả hai núm PHẢI đi qua `envNumber` như mọi núm khác của repo. Bản đầu gọi
  // `createJobStore()` trần, nên hai biến môi trường này là núm CHẾT: người
  // vận hành đọc thông điệp 429 — vốn nêu đích danh MAPPOSTER_MAX_QUEUED_JOBS —
  // rồi đặt biến, khởi động lại, và không gì thay đổi. Đúng lớp lỗi "fail open,
  // không tín hiệu" mà `envNumber` được viết ra để chặn.
  const store = createJobStoreFromEnv();
  // Số thợ mặc định = sức chứa hồ trình duyệt: vượt lên là tự chuốc
  // PoolAcquireTimeoutError cho chính việc của mình.
  const runner = createJobRunner({
    store,
    deps,
    workers: envNumber(process.env, 'MAPPOSTER_JOB_WORKERS', cfg.poolSize, { min: 1 }),
  });
  // Dọn định kỳ: bản ghi hết hạn rời sổ và tệp của chúng rời đĩa. `unref` để
  // đồng hồ này không giữ tiến trình sống khi mọi thứ khác đã đóng.
  setInterval(() => void runner.sweep(), 60_000).unref();

  startHttpServer(envNumber(process.env, 'MCP_HTTP_PORT', 4181, { min: 0, max: 65535 }), deps, undefined, undefined, undefined, { store, runner })
    .then((s) => console.error(`MapPoster MCP (HTTP) listening at ${s.url}`))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
