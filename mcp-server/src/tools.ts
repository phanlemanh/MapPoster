import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveConfig, listFormats, summarizeHighlights, summarizeRoutes, summarizeMeasures, MAX_EDGE, MAX_HIGHLIGHTS, type RenderMapParams } from './resolveConfig';
import { searchCandidates } from './geocode';
import { getRecipe, listRecipes, RECIPES, type CompiledRecipeCall } from './recipes';
import { deliver, type DeliveryMode } from './delivery';
import { prepareClipRender, prepareClipRenderWithSlot, MotionParamError, ClipConcurrencyError, motionParamSchema, type ClipPreparation } from './motionCompiler';
import { envNumber, DEFAULT_CLIP_MAX_BYTES } from '../config';
import type { EncodeOpts } from './encodeAnimation';
import { FONTS } from '../../src/data/fonts';
import { THEMES } from '../../src/data/themes';
import { slugify } from '../../src/lib/format';
import type { RenderConfig } from '../../src/render/renderConfig';
import type { ClipFrames, ClipAnchorsOutcome } from './renderFrame';

/**
 * Max entries in one `render_variants` call.
 *
 * The fan-out is serial and each variant is a full headless render holding a
 * page from `MAPPOSTER_POOL` (default 2), so the array length is a direct
 * multiplier on how long one request occupies the shared pool. 24 clears the
 * widest sweep that actually exists — one variant per theme, and there are 13
 * — while bounding a single call to minutes rather than the days a 100k-entry
 * array of `{}` would have taken while every other caller queued behind it.
 */
export const MAX_VARIANTS = 24;

export interface ToolDeps {
  /** Injected render primitive (real = renderFrame bound to the pool). */
  render: (config: RenderConfig) => Promise<Buffer>;
  /** Injected animation primitive (real = renderAnimationFrames bound to the pool). */
  renderAnimation?: (config: RenderConfig, opts: { frames: number; pulse?: { rings?: number; radiusScale?: number; color?: string } }) => Promise<Buffer[]>;
  /** Injected clip primitive (real = renderClipFrames bound to the pool). */
  renderClip?: (config: RenderConfig) => Promise<ClipFrames>;
  /** Injected encoder (real = encodeAnimation / ffmpeg). */
  // Dùng thẳng EncodeOpts thay vì chép lại hình dạng: bản chép sẽ lặng lẽ nuốt
  // mọi field mới của encoder (đúng cách `quality` suýt không tới nơi).
  encodeAnimation?: (frames: Buffer[], opts: EncodeOpts) => Promise<string>;
  sinkDir: string;
  defaultDelivery?: DeliveryMode;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Content = any;
export interface ToolResult {
  content: Content[];
  isError?: boolean;
}

function ok(payload: unknown, images: { base64?: string }[] = []): ToolResult {
  const content: Content[] = [];
  for (const im of images) if (im.base64) content.push({ type: 'image', data: im.base64, mimeType: 'image/png' });
  content.push({ type: 'text', text: JSON.stringify(payload) });
  return { content };
}
/**
 * `extra` (Finding G): an isError result is not always "nothing else
 * happened" — an oversized clip (MAPPOSTER_CLIP_MAX_BYTES) still has a settle
 * still that already rendered successfully, and the degrade contract ("a
 * settle still that already exists must never be thrown away") applies to a
 * rejection just as much as to the ok:true encode-failure degrade below.
 * Defaults to {} so every other `fail()` call site is unaffected.
 */
function fail(message: string, extra: Record<string, unknown> = {}): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: message, ...extra }) }], isError: true };
}

let counter = 0;
function fileNameFor(cfg: RenderConfig): string {
  return `mapposter-${slugify(cfg.place.name || 'map')}-${cfg.size.width}x${cfg.size.height}-${counter++}`;
}

/**
 * The `resolved` block of the tool contract: what the server chose on the
 * caller's behalf. Exported so the REST `/render` handler (http.ts) echoes the
 * identical shape instead of hand-rolling a second one that could drift.
 */
export const resolvedOf = (cfg: RenderConfig) => {
  const measures = summarizeMeasures(cfg);
  const hasMeasures = measures.pairs.length > 0 || measures.routes.length > 0 || measures.regions.length > 0;
  return {
    center: cfg.camera.center,
    zoom: cfg.camera.zoom,
    place: cfg.place,
    theme: cfg.theme,
    // Đường clip ÉP chrome 'clean'; echo nó ra để caller thấy giá trị thật sự
    // được dùng thay vì giá trị họ gửi.
    chrome: cfg.chrome,
    highlights: summarizeHighlights(cfg),
    // Chỉ đính kèm khi có dữ liệu: một lời gọi không dùng routes/measure không
    // nên phải trả tiền context cho hai mảng rỗng ở mọi response.
    ...(cfg.routes?.length ? { routes: summarizeRoutes(cfg) } : {}),
    ...(hasMeasures ? { measures } : {}),
  };
};

/**
 * `resolved` cho ĐƯỜNG CLIP: phần chung ở trên, cộng ĐÚNG MỘT trong hai —
 * `camera` + `anchors` mà lần render này ĐO ĐƯỢC, hoặc `anchorsUnavailable`
 * nói vì sao không đo được. Không bao giờ cả hai, không bao giờ không có gì:
 * một trường vắng mặt là thứ agent không phân biệt được với "không có điểm
 * nào", vì nó không nhìn thấy ảnh.
 *
 * `outcome` là tham số BẮT BUỘC, và đây là một hàm RIÊNG chứ không phải một
 * tham số tuỳ chọn của `resolvedOf`, có chủ ý: cả ba bề mặt (MCP render_clip,
 * REST /render-clip, /jobs) phải gọi hàm này, và bỏ sót nó là lỗi biên dịch
 * chứ không phải một khối `resolved` thiếu trường mà mọi test hành vi vẫn
 * xanh. `jobRunner.ts` đã hai lần dùng sai biến với 22/22 test xanh — kiểu dữ
 * liệu là thứ duy nhất bắt được lớp lỗi đó trước khi nó ra tới caller. Kiểu
 * `ClipAnchorsOutcome` là union PHÂN BIỆT chứ không phải hai trường optional,
 * nên trạng thái "vắng cả hai" cũng không dựng lên được.
 *
 * `camera` KHÁC `center`/`zoom` ở trên: hai trường kia là camera trong config
 * (điểm khởi hành), còn `camera` là camera tại `motion.restAtSec` — đúng khung
 * mà `anchors` được chiếu lên, nên hai thứ này luôn đi cùng nhau, và cùng
 * vắng mặt khi không đo được.
 */
export const resolvedOfClip = (cfg: RenderConfig, outcome: ClipAnchorsOutcome) => ({
  ...resolvedOf(cfg),
  ...(outcome.anchors
    ? { camera: outcome.anchors.camera, anchors: { points: outcome.anchors.points, regions: outcome.anchors.regions } }
    : { anchorsUnavailable: outcome.anchorsUnavailable }),
});

export function makeTools(deps: ToolDeps) {
  const mode = (d?: DeliveryMode): DeliveryMode => d ?? deps.defaultDelivery ?? 'both';

  async function renderOne(params: RenderMapParams, delivery?: DeliveryMode) {
    const cfg = await resolveConfig(params);
    const png = await deps.render(cfg);
    const image = await deliver(png, fileNameFor(cfg), mode(delivery), { sinkDir: deps.sinkDir });
    return { cfg, image };
  }

  // `const tools` chứ không `return {` thẳng: `render_recipe` UỶ NHIỆM cho
  // `render_clip` thay vì dựng lại đường render, nên nó cần tham chiếu tới
  // chính đối tượng này. Đó là điểm mấu chốt của tầng recipe — xem recipes.ts.
  const tools = {
    async render_map(params: RenderMapParams & { delivery?: DeliveryMode }): Promise<ToolResult> {
      try {
        const { cfg, image } = await renderOne(params, params.delivery);
        return ok({ image, resolved: resolvedOf(cfg) }, [image]);
      } catch (e) {
        return fail((e as Error).message ?? String(e));
      }
    },

    async render_variants(params: { base: RenderMapParams; variants: Partial<RenderMapParams>[]; delivery?: DeliveryMode }): Promise<ToolResult> {
      try {
        // Refuse before the first render, not after N of them: the loop below
        // is serial and each pass drives a full headless page, so discovering
        // the fan-out is absurd on variant 900 means 899 renders already spent
        // the shared pool. Mirrors the Zod `.max()` — makeTools is callable
        // directly, so the schema cannot be the only guard.
        if (params.variants.length > MAX_VARIANTS) {
          return fail(
            `Too many variants: ${params.variants.length} (max ${MAX_VARIANTS} — each variant is a full serialized render)`,
          );
        }
        const results: { image: Awaited<ReturnType<typeof deliver>>; resolved: unknown }[] = [];
        for (const v of params.variants) {
          const { cfg, image } = await renderOne({ ...params.base, ...v }, params.delivery);
          results.push({ image, resolved: resolvedOf(cfg) });
        }
        return ok({ count: results.length, results }, results.map((r) => r.image));
      } catch (e) {
        return fail((e as Error).message ?? String(e));
      }
    },

    async render_animation(
      params: RenderMapParams & {
        animation?: { frames?: number; fps?: number; format?: 'gif' | 'mp4' | 'both'; gifWidth?: number; rings?: number; radiusScale?: number; color?: string };
        delivery?: DeliveryMode;
      },
    ): Promise<ToolResult> {
      try {
        if (!deps.renderAnimation || !deps.encodeAnimation) return fail('animation is not available on this server build');
        const anim = params.animation ?? {};
        const frames = anim.frames ?? 24;
        const fps = anim.fps ?? 12;
        const format = anim.format ?? 'gif';

        const cfg = await resolveConfig(params);
        // The radar pulses around the highlight points — without one there is
        // nothing to animate and the caller gets a still image N times over.
        if (!cfg.markers?.length) {
          return fail('render_animation needs at least one highlight.points entry — the radar pulse is drawn around those points');
        }

        const pngs = await deps.renderAnimation(cfg, {
          frames,
          pulse: { rings: anim.rings, radiusScale: anim.radiusScale, color: anim.color },
        });

        const name = fileNameFor(cfg);
        const cap = envNumber(process.env, 'MAPPOSTER_CLIP_MAX_BYTES', DEFAULT_CLIP_MAX_BYTES, { min: 1 });
        const outputs: { format: 'gif' | 'mp4'; path: string; bytes: number }[] = [];
        const wanted: ('gif' | 'mp4')[] = format === 'both' ? ['gif', 'mp4'] : [format];
        for (const f of wanted) {
          const outPath = await deps.encodeAnimation(pngs, {
            fps,
            format: f,
            quality: params.output?.quality,
            outPath: `${deps.sinkDir}/${name}.${f}`,
            // full-size 256-color GIFs are enormous; default to half-width unless told otherwise
            gifWidth: f === 'gif' ? (anim.gifWidth ?? Math.min(540, cfg.size.width)) : undefined,
          });
          const { size: bytes } = await fs.stat(outPath);
          if (bytes > cap) {
            // Cùng chính sách với render_clip (Finding C): file quá cỡ trong sinkDir
            // bền vững sẽ tích tụ mãi mãi nếu không xoá tại đây.
            await fs.rm(outPath, { force: true }).catch(() => {});
            for (const o of outputs) await fs.rm(o.path, { force: true }).catch(() => {});
            return fail(`animation ${f} is ${bytes} bytes, over MAPPOSTER_CLIP_MAX_BYTES=${cap} — lower frames/fps or size`);
          }
          outputs.push({ format: f, path: outPath, bytes });
        }

        // Trước đây preview LUÔN inline bất kể `delivery` — schema quảng cáo
        // delivery (renderMapShape) rồi handler lờ nó đi.
        const preview = pngs[Math.floor(pngs.length / 2)];
        const image = await deliver(preview, `${name}-preview`, mode(params.delivery), { sinkDir: deps.sinkDir });
        return ok(
          { image, animation: { outputs, frames, fps, width: cfg.size.width, height: cfg.size.height, loop: true }, resolved: resolvedOf(cfg) },
          [image],
        );
      } catch (e) {
        return fail((e as Error).message ?? String(e));
      }
    },

    async render_clip(params: RenderMapParams & { motion: z.infer<typeof motionParamSchema>; delivery?: DeliveryMode }): Promise<ToolResult> {
      try {
        if (!deps.renderClip || !deps.encodeAnimation) return fail('clip rendering is not available on this server build');

        // Finding C: config resolution + AC-9's chrome:'clean' force + the
        // MAPPOSTER_MAX_CLIP_FRAMES budget + preset-vs-script resolution all
        // live in ONE shared helper now (motionCompiler.ts's
        // prepareClipRender) instead of being reimplemented here and again in
        // http.ts's /render-clip.
        let prep: ClipPreparation;
        try {
          prep = await prepareClipRender(params, params.motion);
        } catch (e) {
          // Decision 2: over the shared clip-concurrency limit — same message
          // REST answers with 429, surfaced here as this tool's normal error
          // result (isError:true) rather than a distinct status code, since
          // MCP has no HTTP layer to carry one.
          if (e instanceof ClipConcurrencyError) return fail(e.message);
          if (!(e instanceof MotionParamError)) throw e;
          return fail(e.message);
        }
        const { cfg, motion, preset, releaseClipSlot } = prep;
        try {
          // Số đo chi phí: đặt tên mang đơn vị (renderMs/encodeMs/bytes). Một
          // trường `time` hay `size` là thứ phía tiêu thụ đoán sai đơn vị rồi
          // hiển thị sai — cùng lớp lỗi với `km` trần ở PR #2.
          const tRender = Date.now();
          // MỘT đối tượng, truyền NGUYÊN cho `resolvedOfClip`. Bóc `anchors`
          // ra thành biến riêng là mở lại đúng khe cho lớp lỗi "sai biến" —
          // union chỉ giữ được bất biến khi nó không bị tháo rời.
          const clipOut = await deps.renderClip(cfg);
          const { frames, settle: settlePng } = clipOut;
          const renderMs = Date.now() - tRender;

          // The clip is written to a FILE under sinkDir and never inlined as
          // base64 — a multi-megabyte MP4 would bloat the JSON-RPC stdio
          // channel MCP runs over. `delivery` applies only to the settle
          // still, exactly as it does for the other image tools.
          const name = fileNameFor(cfg);
          const outPath = path.join(deps.sinkDir, `${name}.mp4`);
          const motionOut = { ...(preset ? { preset } : {}), restAtSec: motion.restAtSec, script: motion };

          const costOf = (encodeMs: number, bytes: number) => ({ frames: frames.length, renderMs, encodeMs, bytes });

          let bytes: number;
          const tEncode = Date.now();
          let encodeMs = 0;
          try {
            await deps.encodeAnimation(frames, { fps: motion.fps, format: 'mp4', outPath, quality: params.output?.quality });
            ({ size: bytes } = await fs.stat(outPath));
            encodeMs = Date.now() - tEncode;
          } catch (e) {
            encodeMs = Date.now() - tEncode;
            // Same degrade as REST /render-clip (spec §5): frames were already
            // captured, so an encoder failure (missing ffmpeg, corrupt frame)
            // must never throw away the settle still that already rendered
            // successfully. Unlike REST — which encodes to os.tmpdir() and
            // reads the result into memory — this tool writes straight into
            // the PERSISTENT sinkDir, so a partial/corrupt file left behind by
            // a mid-write ffmpeg crash would never be traced or cleaned unless
            // we remove it here ourselves. Cleanup must never mask the
            // original error.
            await fs.rm(outPath, { force: true }).catch(() => {});
            const settle = await deliver(settlePng, `${name}-settle`, mode(params.delivery), { sinkDir: deps.sinkDir });
            return ok({
              settle,
              motion: motionOut,
              resolved: resolvedOfClip(cfg, clipOut),
              // Khung ĐÃ render — tiền đã tiêu. Nhánh degrade là chỗ caller cần
              // con số này nhất để quyết định thử lại hay hạ quality.
              cost: costOf(encodeMs, 0),
              clipError: `encode failed: ${(e as Error).message ?? String(e)}`,
            });
          }

          // Finding C (drift): MAPPOSTER_CLIP_MAX_BYTES used to be enforced only
          // in REST /render-clip — the README documents it as applying to
          // "both REST /render-clip and the MCP render_clip tool", which was
          // false. This surface has MORE reason to enforce it, not less: it
          // writes straight into the PERSISTENT sinkDir (REST only ever holds
          // an oversized clip in os.tmpdir() before discarding it), so an
          // unenforced cap here means an oversized MP4 accumulates on disk
          // forever instead of just failing one in-flight request.
          const cap = envNumber(process.env, 'MAPPOSTER_CLIP_MAX_BYTES', DEFAULT_CLIP_MAX_BYTES, { min: 1 });
          if (bytes > cap) {
            await fs.rm(outPath, { force: true }).catch(() => {});
            const settle = await deliver(settlePng, `${name}-settle`, mode(params.delivery), { sinkDir: deps.sinkDir });
            // Finding G: still an error (isError:true, same as REST's 422) —
            // nothing technically failed, the clip just violates the size
            // policy and the caller can fix it (lower fps/durationSec/size) —
            // but the settle still that already rendered successfully is never
            // thrown away, matching the degrade contract.
            return fail(`clip is ${bytes} bytes, over MAPPOSTER_CLIP_MAX_BYTES=${cap} — lower fps/durationSec or size`, {
              settle,
              motion: motionOut,
              resolved: resolvedOfClip(cfg, clipOut),
            });
          }

          const settle = await deliver(settlePng, `${name}-settle`, mode(params.delivery), { sinkDir: deps.sinkDir });

          return ok({
            clip: { path: outPath, bytes, durationSec: motion.durationSec, fps: motion.fps, width: cfg.size.width, height: cfg.size.height },
            cost: costOf(encodeMs, bytes),
            settle,
            motion: motionOut,
            resolved: resolvedOfClip(cfg, clipOut),
          });
        } finally {
          // Decision 2: free the shared clip slot regardless of how this call
          // ends (success, degrade, oversize rejection, or an unexpected
          // throw caught by the outer try below).
          releaseClipSlot();
        }
      } catch (e) {
        return fail((e as Error).message ?? String(e));
      }
    },

    async geocode_place(params: { query: string; limit?: number }): Promise<ToolResult> {
      try {
        const candidates = await searchCandidates(params.query, params.limit ?? 5);
        if (!candidates.length) return fail(`No geocoding result for "${params.query}"`);
        // best guess first, but return the list — free-form VN ranking is unreliable
        return ok({ best: candidates[0], candidates });
      } catch (e) {
        return fail((e as Error).message ?? String(e));
      }
    },

    /**
     * Biên dịch kịch bản chuyển động rồi TRẢ VỀ NGAY — không render khung nào.
     *
     * Vòng lặp preset→xem→chỉnh trước đây buộc agent trả tiền một clip đầy đủ
     * (hàng phút) chỉ để biết preset sinh ra gì. Tool này trả lời cùng câu hỏi
     * trong mili-giây.
     *
     * Dùng lại `prepareClipRenderWithSlot` với callback release RỖNG thay vì
     * chép lại nhánh parse→resolve→validate: chép là cách hai bề mặt trôi khỏi
     * nhau, đúng lý do `resolveMotion` từng được trích ra. Không lấy slot vì
     * không có gì để gác — cổng concurrency bảo vệ vòng đời render+encode, mà
     * ở đây cả hai đều không xảy ra.
     */
    async compile_motion(params: RenderMapParams & { motion?: unknown }): Promise<ToolResult> {
      try {
        const prep = await prepareClipRenderWithSlot(params, params.motion, () => {});
        const frames = Math.round(prep.motion.durationSec * prep.motion.fps);
        return ok({
          ...(prep.preset ? { preset: prep.preset } : {}),
          script: prep.motion,
          fps: prep.motion.fps,
          durationSec: prep.motion.durationSec,
          restAtSec: prep.motion.restAtSec,
          frames,
          resolved: resolvedOf(prep.cfg),
        });
      } catch (e) {
        return fail((e as Error).message);
      }
    },

    async list_fonts(): Promise<ToolResult> {
      return ok({ fonts: FONTS });
    },

    async list_themes(): Promise<ToolResult> {
      return ok({ themes: THEMES.map((t) => ({ id: t.id, name: t.name, dark: t.dark, colors: t.colors })) });
    },

    async list_formats(): Promise<ToolResult> {
      return ok({ formats: listFormats() });
    },

    async list_recipes(): Promise<ToolResult> {
      return ok(listRecipes());
    },

    /**
     * Một call ra clip: recipe compile tham số nghiệp vụ thành ĐÚNG bộ tham số
     * `render_clip` nhận, rồi uỷ nhiệm cho nó.
     *
     * Không có đường render riêng ở đây, có chủ đích (spec §2). Mọi bảo đảm
     * của `render_clip` — AC-9 ép `chrome:'clean'`, trần khung, khe clip,
     * nhánh degrade khi encode hỏng, trần dung lượng, `resolved.anchors` —
     * được kế thừa nguyên vẹn. Một nhánh render thứ hai ở tầng recipe là một
     * nhánh sẽ trôi khỏi những bảo đảm đó mà không ai thấy.
     */
    async render_recipe(params: { recipe: string; delivery?: DeliveryMode } & Record<string, unknown>): Promise<ToolResult> {
      const { recipe: name, delivery, ...rest } = params;
      let call: CompiledRecipeCall;
      try {
        const spec = getRecipe(name);
        // `.strict()`: khoá gõ sai bị TỪ CHỐI chứ không bị lặng lẽ bỏ qua —
        // caller là agent không nhìn thấy ảnh, nên một tham số bị lờ đi trả về
        // clip "thành công" nhưng sai nội dung, và không ai phát hiện được.
        const parsed = spec.schema.safeParse(rest);
        if (!parsed.success) {
          const issues = parsed.error.issues.map((i) => `${i.path.join('.') || '(gốc)'}: ${i.message}`).join('; ');
          return fail(`recipe ${name}: tham số không hợp lệ — ${issues}`);
        }
        call = spec.compile(parsed.data as never);
      } catch (e) {
        return fail((e as Error).message ?? String(e));
      }

      const res = await tools.render_clip({ ...call, ...(delivery ? { delivery } : {}) });
      // Echo tên recipe vào CẢ nhánh thành công lẫn nhánh lỗi: caller fan-out
      // nhiều recipe cần biết kết quả nào của recipe nào, và nhánh lỗi là chỗ
      // nó cần biết nhất.
      return withRecipeEcho(res, name);
    },
  };
  return tools;
}

/** Chèn `recipe: <tên>` vào khối JSON của một ToolResult, giữ nguyên phần còn lại. */
function withRecipeEcho(res: ToolResult, recipe: string): ToolResult {
  return {
    ...res,
    content: res.content.map((c: Content) => {
      if (c?.type !== 'text') return c;
      try {
        return { ...c, text: JSON.stringify({ recipe, ...JSON.parse(c.text) }) };
      } catch {
        return c;
      }
    }),
  };
}

// --- Zod input schemas (for the real MCP server registration) ---
// Bounded at the system boundary: unbounded dims yield a zero-size (blank) PNG
// or OOM the shared pooled browser page; out-of-range coords silently mis-frame.
const dim = z.number().int().positive().max(MAX_EDGE);
const lng = z.number().min(-180).max(180);
const lat = z.number().min(-90).max(90);
const zoomLevel = z.number().min(0).max(22);
// reaches innerHTML in the render page via the marker SVG's fill="…"
const hexColor = z.string().regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i);

const locationSchema = z.union([z.string().min(1), z.object({ lng, lat, zoom: zoomLevel.optional() })]);
const markerIconSchema = z.enum(['pin', 'heart', 'home', 'star', 'circle', 'square']);
// drawMarker does no clamping of its own — a size of 5000 paints over the
// whole canvas, a size of 0 is invisible. Mirrored at runtime in resolveConfig
// (assertMarkerSize) since makeTools can be called directly, bypassing Zod.
const pointOpts = { icon: markerIconSchema.optional(), color: hexColor.optional(), size: z.number().min(18).max(140).optional() };
const highlightSchema = z
  .object({
    // .max on both arrays: a named entry costs one rate-limited Nominatim
    // lookup, so an unbounded array turns one request into sustained load on a
    // shared public service. Mirrored at runtime in resolveConfig
    // (assertHighlightCount) since makeTools can be called directly.
    regions: z
      .array(z.union([
        z.string().min(1),
        z.object({ name: z.string().min(1), color: hexColor.optional() }),
        z.object({ geojson: z.any(), color: hexColor.optional() }),
      ]))
      .max(MAX_HIGHLIGHTS)
      .optional(),
    points: z
      .array(z.union([
        z.string().min(1),
        z.object({ lng, lat, ...pointOpts }),
        z.object({ query: z.string().min(1), ...pointOpts }),
      ]))
      .max(MAX_HIGHLIGHTS)
      .optional(),
    color: hexColor.optional(),
    fill: z.boolean().optional(),
    dim: z.boolean().optional(),
    pointIcon: markerIconSchema.optional(),
  })
  .optional();
const formatSchema = z.union([z.string().min(1), z.object({ width: dim, height: dim })]).optional();
const cameraSchema = z
  .object({
    center: z.tuple([lng, lat]).optional(),
    zoom: zoomLevel.optional(),
    // No range bound: resolveConfig normalizes any finite bearing to [0,360)
    // (lerpAngle already uses that convention) rather than rejecting it —
    // MapLibre renders e.g. bearing: -45 correctly, so refusing it here would
    // be a regression, not a fix.
    bearing: z.number().finite().optional(),
    pitch: z.number().min(0).max(60).optional(),
    // Chỉ camera vào MỘT đối tượng thay vì auto-frame hợp nhất. Loại trừ với
    // center/zoom — resolveConfig ném khi có cả hai, không tự chọn bên thắng.
    focus: z
      .object({
        kind: z.enum(['point', 'region', 'route']),
        index: z.number().int().min(0),
        paddingPct: z.number().min(0).max(200).optional(),
      })
      .strict()
      .optional(),
  })
  .optional();
const deliverySchema = z.enum(['both', 'url', 'inline']).optional();

/**
 * Hình dạng input mà `render_recipe` KHAI với MCP — và nó phải khai đủ mọi khoá
 * mọi recipe nhận, không có lối tắt.
 *
 * Bản đầu chỉ khai `{recipe, delivery}` kèm chú thích rằng đây là "passthrough
 * có chủ đích". **Sai.** MCP SDK dựng `z.object(inputSchema)` và Zod **loại bỏ**
 * mọi khoá không khai, nên `region`/`subjects`/`pois` không bao giờ tới được
 * handler: qua đúng giao thức mà agent dùng, `render_recipe` trả về "region:
 * Required" cho một lời gọi hoàn toàn hợp lệ. Tool hỏng hoàn toàn ở bề mặt duy
 * nhất nó tồn tại để phục vụ.
 *
 * Không test nào bắt được, vì mọi test đều gọi `makeTools()` TRỰC TIẾP và do đó
 * đi vòng qua chính tầng đăng ký này — cùng lớp mù mà `registerTool` luôn có:
 * nó là chỗ duy nhất trong file này không có ai đo.
 *
 * Cách khai: rút hợp của mọi khoá từ chính `RECIPES` nên không có bản sao để
 * lệch, và để `z.unknown().optional()` vì kiểm THẬT nằm ở handler, trên đúng
 * schema `.strict()` của recipe được gọi — khai kiểu cụ thể ở đây sẽ là bản
 * sao thứ hai của cùng một luật, và hai bản sao thì sớm muộn lệch nhau.
 */
export const RECIPE_TOOL_SHAPE: z.ZodRawShape = (() => {
  const shape: Record<string, z.ZodTypeAny> = { recipe: z.string().min(1), delivery: deliverySchema };
  for (const spec of Object.values(RECIPES)) {
    for (const key of Object.keys((spec.schema as unknown as { shape: Record<string, unknown> }).shape)) {
      shape[key] = z.unknown().optional();
    }
  }
  return shape;
})();
const layerStateSchema = z
  .object({
    landcover: z.boolean(), buildings: z.boolean(), water: z.boolean(), parks: z.boolean(),
    roads: z.boolean(), rail: z.boolean(), aeroway: z.boolean(), roadLabels: z.boolean(),
  })
  .partial()
  .strict();
const fontSchema = z.enum(['Space Grotesk', 'Montserrat', 'Playfair Display', 'Oswald', 'Bebas Neue', 'Merriweather']);

/**
 * Đúng MỘT trong `geojson` / `coords`. Dạng `coords` là dạng LLM sinh được tự
 * nhiên; dạng `geojson` để chuyển tiếp output của router/GPX mà không phải bóc.
 */
/** Toạ độ hoặc tên địa danh — tên đi qua cùng anchor quốc gia mà highlight dùng. */
const placeOrCoord = z.union([z.tuple([lng, lat]), z.string().min(1)]);

const routeSchema = z
  .object({
    geojson: z.any().optional(),
    coords: z.array(z.tuple([lng, lat])).min(2).optional(),
    // Hỏi router đường đi THỰC TẾ. Host router đến từ env, không bao giờ từ đây.
    route: z
      .object({
        from: placeOrCoord,
        to: placeOrCoord,
        via: z.array(placeOrCoord).optional(),
        mode: z.enum(['car', 'moto', 'walk']).optional(),
      })
      .strict()
      .optional(),
    color: hexColor.optional(),
    width: z.number().min(1).max(16).optional(),
  })
  .refine((r) => [r.geojson, r.coords, r.route].filter((v) => v != null).length === 1, {
    message: 'pass exactly one of routes[].geojson, routes[].coords or routes[].route',
  });

const measureSchema = z
  .object({ pairs: z.array(z.tuple([z.number().int().min(0), z.number().int().min(0)])).optional() })
  .strict()
  .optional();

const renderMapShape = {
  location: locationSchema,
  highlight: highlightSchema,
  format: formatSchema,
  theme: z.string().optional(),
  chrome: z.enum(['clean', 'label', 'poster']).optional(),
  camera: cameraSchema,
  placeName: z.string().min(1).optional(),
  labels: z.boolean().optional(),
  layers: layerStateSchema.optional(),
  detail: z.number().min(0).max(1).optional(),
  font: fontSchema.optional(),
  routes: z.array(routeSchema).optional(),
  // mp4-only; GIF bỏ qua crf nên núm này vô nghĩa ở nhánh đó (đã nêu trong mô tả tool).
  output: z.object({ quality: z.enum(['draft', 'standard', 'high']).optional() }).strict().optional(),
  measure: measureSchema,
  delivery: deliverySchema,
};

/**
 * `render_map`'s input contract as an actual ZodObject. `registerTool` below wants
 * the raw shape record, but a non-MCP caller (the REST `/render` handler in
 * http.ts) needs something it can `.parse()` — reusing this rather than
 * hand-writing a second schema that would drift from the real tool contract.
 */
export const renderMapSchema = z.object(renderMapShape);

// `motionParamSchema` (the `preset`-or-`script` shape shared by REST
// `/render-clip` and this file's `render_clip`) now lives in
// motionCompiler.ts, alongside `parseMotionParam`/`prepareClipRender` which
// actually enforce it (Finding C) — imported above instead of redefined here.

// Bounded: frames×fps beyond this buys nothing visually and ties up the pooled
// page for the whole capture loop.
const animationSchema = z
  .object({
    frames: z.number().int().min(4).max(60).optional(),
    fps: z.number().int().min(4).max(30).optional(),
    format: z.enum(['gif', 'mp4', 'both']).optional(),
    gifWidth: z.number().int().min(64).max(MAX_EDGE).optional(),
    rings: z.number().int().min(1).max(6).optional(),
    radiusScale: z.number().min(0.5).max(8).optional(),
    color: hexColor.optional(),
  })
  .optional();

/** Register all tools on a real MCP server. */
export function registerTools(server: McpServer, deps: ToolDeps): void {
  const t = makeTools(deps);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const s = server as any;
  s.registerTool('render_map', { description: 'Render a still map image (PNG) for a place/address with optional point/region highlight and format (e.g. tiktok).', inputSchema: renderMapShape }, (a: RenderMapParams & { delivery?: DeliveryMode }) => t.render_map(a));
  // variants are merged onto `base`, so they must carry the SAME bounds as base —
  // otherwise a variant could override location/camera with out-of-range values
  // and slip straight past the boundary validation.
  s.registerTool('render_variants', { description: 'Render several map variants (different themes/formats/zoom) for one location.', inputSchema: { base: z.object(renderMapShape), variants: z.array(z.object(renderMapShape).partial()).max(MAX_VARIANTS), delivery: deliverySchema } }, (a: { base: RenderMapParams; variants: Partial<RenderMapParams>[]; delivery?: DeliveryMode }) => t.render_variants(a));
  s.registerTool(
    'render_animation',
    {
      description:
        'Render a looping radar-pulse animation (GIF and/or MP4) around highlight points — expanding rings mark the location. Requires highlight.points.',
      inputSchema: { ...renderMapShape, animation: animationSchema },
    },
    (a: RenderMapParams & { animation?: { frames?: number; fps?: number; format?: 'gif' | 'mp4' | 'both'; gifWidth?: number; rings?: number; radiusScale?: number; color?: string }; delivery?: DeliveryMode }) =>
      t.render_animation(a),
  );
  s.registerTool(
    'render_clip',
    {
      description: 'Render a short text-free camera-motion map clip (MP4) + a rest-state settle still. motion: {preset: approach|pushIn|drift} or {script}.',
      inputSchema: { ...renderMapShape, motion: motionParamSchema },
    },
    (a: RenderMapParams & { motion: z.infer<typeof motionParamSchema>; delivery?: DeliveryMode }) => t.render_clip(a),
  );
  s.registerTool('geocode_place', { description: 'Resolve a place name / address to candidate coordinates (VN free-form ranking is unreliable — pick from the list).', inputSchema: { query: z.string().min(1), limit: z.number().int().positive().max(10).optional() } }, (a: { query: string; limit?: number }) => t.geocode_place(a));
  s.registerTool(
    'compile_motion',
    {
      description:
        'Compile a motion preset or raw script into the MotionScript render_clip would use, and return it WITHOUT rendering anything. Costs no frames and no clip slot — use it to inspect and tweak motion before paying for a clip.',
      inputSchema: { ...renderMapShape, motion: motionParamSchema },
    },
    (a: RenderMapParams & { motion?: unknown }) => t.compile_motion(a),
  );
  s.registerTool('list_fonts', { description: 'List the typefaces render_map accepts, with each one\'s CSS stack and title weight/tracking.', inputSchema: {} }, () => t.list_fonts());
  s.registerTool('list_themes', { description: 'List the available color themes.', inputSchema: {} }, () => t.list_themes());
  s.registerTool('list_formats', { description: 'List the available format presets (incl. tiktok).', inputSchema: {} }, () => t.list_formats());
  s.registerTool(
    'list_recipes',
    { description: 'List the ready-made scene recipes render_recipe accepts — each with its parameters, default duration, and a working example call.', inputSchema: {} },
    () => t.list_recipes(),
  );
  s.registerTool(
    'render_recipe',
    {
      description: `Render a ready-made scene in one call. Known recipes: ${Object.keys(RECIPES).join(', ')}. Call list_recipes for each one's parameters and a working example.`,
      inputSchema: RECIPE_TOOL_SHAPE,
    },
    (a: { recipe: string; delivery?: DeliveryMode }) => t.render_recipe(a),
  );
}
