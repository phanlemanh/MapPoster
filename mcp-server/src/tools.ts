import path from 'node:path';
import { promises as fs } from 'node:fs';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveConfig, listFormats, summarizeHighlights, MAX_EDGE, type RenderMapParams } from './resolveConfig';
import { searchCandidates } from './geocode';
import { deliver, type DeliveryMode } from './delivery';
import { prepareClipRender, MotionParamError, ClipConcurrencyError, motionParamSchema, type ClipPreparation } from './motionCompiler';
import { envNumber, DEFAULT_CLIP_MAX_BYTES } from '../config';
import { THEMES } from '../../src/data/themes';
import { slugify } from '../../src/lib/format';
import type { RenderConfig } from '../../src/render/renderConfig';
import type { ClipFrames } from './renderFrame';

export interface ToolDeps {
  /** Injected render primitive (real = renderFrame bound to the pool). */
  render: (config: RenderConfig) => Promise<Buffer>;
  /** Injected animation primitive (real = renderAnimationFrames bound to the pool). */
  renderAnimation?: (config: RenderConfig, opts: { frames: number; pulse?: { rings?: number; radiusScale?: number; color?: string } }) => Promise<Buffer[]>;
  /** Injected clip primitive (real = renderClipFrames bound to the pool). */
  renderClip?: (config: RenderConfig) => Promise<ClipFrames>;
  /** Injected encoder (real = encodeAnimation / ffmpeg). */
  encodeAnimation?: (frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => Promise<string>;
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
export const resolvedOf = (cfg: RenderConfig) => ({
  center: cfg.camera.center,
  zoom: cfg.camera.zoom,
  place: cfg.place,
  theme: cfg.theme,
  highlights: summarizeHighlights(cfg),
});

export function makeTools(deps: ToolDeps) {
  const mode = (d?: DeliveryMode): DeliveryMode => d ?? deps.defaultDelivery ?? 'both';

  async function renderOne(params: RenderMapParams, delivery?: DeliveryMode) {
    const cfg = await resolveConfig(params);
    const png = await deps.render(cfg);
    const image = await deliver(png, fileNameFor(cfg), mode(delivery), { sinkDir: deps.sinkDir });
    return { cfg, image };
  }

  return {
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
        const outputs: { format: 'gif' | 'mp4'; path: string }[] = [];
        const wanted: ('gif' | 'mp4')[] = format === 'both' ? ['gif', 'mp4'] : [format];
        for (const f of wanted) {
          const outPath = await deps.encodeAnimation(pngs, {
            fps,
            format: f,
            outPath: `${deps.sinkDir}/${name}.${f}`,
            // full-size 256-color GIFs are enormous; default to half-width unless told otherwise
            gifWidth: f === 'gif' ? (anim.gifWidth ?? Math.min(540, cfg.size.width)) : undefined,
          });
          outputs.push({ format: f, path: outPath });
        }

        // a mid-sequence frame as inline preview so the caller sees the effect
        const preview = pngs[Math.floor(pngs.length / 2)];
        return ok(
          { animation: { outputs, frames, fps, width: cfg.size.width, height: cfg.size.height, loop: true }, resolved: resolvedOf(cfg) },
          [{ base64: preview.toString('base64') }],
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
          const { frames, settle: settlePng } = await deps.renderClip(cfg);

          // The clip is written to a FILE under sinkDir and never inlined as
          // base64 — a multi-megabyte MP4 would bloat the JSON-RPC stdio
          // channel MCP runs over. `delivery` applies only to the settle
          // still, exactly as it does for the other image tools.
          const name = fileNameFor(cfg);
          const outPath = path.join(deps.sinkDir, `${name}.mp4`);
          const motionOut = { ...(preset ? { preset } : {}), restAtSec: motion.restAtSec };

          let bytes: number;
          try {
            await deps.encodeAnimation(frames, { fps: motion.fps, format: 'mp4', outPath });
            ({ size: bytes } = await fs.stat(outPath));
          } catch (e) {
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
              resolved: resolvedOf(cfg),
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
              resolved: resolvedOf(cfg),
            });
          }

          const settle = await deliver(settlePng, `${name}-settle`, mode(params.delivery), { sinkDir: deps.sinkDir });

          return ok({
            clip: { path: outPath, bytes, durationSec: motion.durationSec, fps: motion.fps, width: cfg.size.width, height: cfg.size.height },
            settle,
            motion: motionOut,
            resolved: resolvedOf(cfg),
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

    async list_themes(): Promise<ToolResult> {
      return ok({ themes: THEMES.map((t) => ({ id: t.id, name: t.name })) });
    },

    async list_formats(): Promise<ToolResult> {
      return ok({ formats: listFormats() });
    },
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
    regions: z
      .array(z.union([
        z.string().min(1),
        z.object({ name: z.string().min(1), color: hexColor.optional() }),
        z.object({ geojson: z.any(), color: hexColor.optional() }),
      ]))
      .optional(),
    points: z
      .array(z.union([
        z.string().min(1),
        z.object({ lng, lat, ...pointOpts }),
        z.object({ query: z.string().min(1), ...pointOpts }),
      ]))
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
    bearing: z.number().min(0).max(360).optional(),
    pitch: z.number().min(0).max(60).optional(),
  })
  .optional();
const deliverySchema = z.enum(['both', 'url', 'inline']).optional();
const layerStateSchema = z
  .object({
    landcover: z.boolean(), buildings: z.boolean(), water: z.boolean(), parks: z.boolean(),
    roads: z.boolean(), rail: z.boolean(), aeroway: z.boolean(), roadLabels: z.boolean(),
  })
  .partial()
  .strict();
const fontSchema = z.enum(['Space Grotesk', 'Montserrat', 'Playfair Display', 'Oswald', 'Bebas Neue', 'Merriweather']);

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
  s.registerTool('render_variants', { description: 'Render several map variants (different themes/formats/zoom) for one location.', inputSchema: { base: z.object(renderMapShape), variants: z.array(z.object(renderMapShape).partial()), delivery: deliverySchema } }, (a: { base: RenderMapParams; variants: Partial<RenderMapParams>[]; delivery?: DeliveryMode }) => t.render_variants(a));
  s.registerTool(
    'render_animation',
    {
      description:
        'Render a looping radar-pulse animation (GIF and/or MP4) around highlight points — expanding rings mark the location. Requires highlight.points.',
      inputSchema: { ...renderMapShape, animation: animationSchema },
    },
    (a: RenderMapParams & { animation?: { frames?: number; fps?: number; format?: 'gif' | 'mp4' | 'both'; gifWidth?: number; rings?: number; radiusScale?: number; color?: string } }) =>
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
  s.registerTool('list_themes', { description: 'List the available color themes.', inputSchema: {} }, () => t.list_themes());
  s.registerTool('list_formats', { description: 'List the available format presets (incl. tiktok).', inputSchema: {} }, () => t.list_formats());
}
