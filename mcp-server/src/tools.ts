import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { resolveConfig, listFormats, MAX_EDGE, type RenderMapParams } from './resolveConfig';
import { searchCandidates } from './geocode';
import { deliver, type DeliveryMode } from './delivery';
import { THEMES } from '../../src/data/themes';
import { slugify } from '../../src/lib/format';
import type { RenderConfig } from '../../src/render/renderConfig';

export interface ToolDeps {
  /** Injected render primitive (real = renderFrame bound to the pool). */
  render: (config: RenderConfig) => Promise<Buffer>;
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
function fail(message: string): ToolResult {
  return { content: [{ type: 'text', text: JSON.stringify({ ok: false, error: message }) }], isError: true };
}

let counter = 0;
function fileNameFor(cfg: RenderConfig): string {
  return `mapposter-${slugify(cfg.place.name || 'map')}-${cfg.size.width}x${cfg.size.height}-${counter++}`;
}

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
        return ok({ image, resolved: { center: cfg.camera.center, zoom: cfg.camera.zoom, place: cfg.place } }, [image]);
      } catch (e) {
        return fail((e as Error).message ?? String(e));
      }
    },

    async render_variants(params: { base: RenderMapParams; variants: Partial<RenderMapParams>[]; delivery?: DeliveryMode }): Promise<ToolResult> {
      try {
        const results: { image: Awaited<ReturnType<typeof deliver>>; resolved: unknown }[] = [];
        for (const v of params.variants) {
          const { cfg, image } = await renderOne({ ...params.base, ...v }, params.delivery);
          results.push({ image, resolved: { center: cfg.camera.center, zoom: cfg.camera.zoom, place: cfg.place } });
        }
        return ok({ count: results.length, results }, results.map((r) => r.image));
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

const locationSchema = z.union([z.string().min(1), z.object({ lng, lat, zoom: zoomLevel.optional() })]);
const highlightSchema = z
  .object({
    regions: z.array(z.union([z.string().min(1), z.object({ geojson: z.any() })])).optional(),
    points: z.array(z.union([z.string().min(1), z.object({ lng, lat })])).optional(),
    color: z.string().optional(),
    fill: z.boolean().optional(),
    dim: z.boolean().optional(),
    pointIcon: z.enum(['pin', 'heart', 'home', 'star', 'circle', 'square']).optional(),
  })
  .optional();
const formatSchema = z.union([z.string().min(1), z.object({ width: dim, height: dim })]).optional();
const cameraSchema = z
  .object({ center: z.tuple([lng, lat]).optional(), zoom: zoomLevel.optional(), bearing: z.number().optional(), pitch: z.number().optional() })
  .optional();
const deliverySchema = z.enum(['both', 'url', 'inline']).optional();

const renderMapShape = {
  location: locationSchema,
  highlight: highlightSchema,
  format: formatSchema,
  theme: z.string().optional(),
  chrome: z.enum(['clean', 'label', 'poster']).optional(),
  camera: cameraSchema,
  placeName: z.string().min(1).optional(),
  delivery: deliverySchema,
};

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
  s.registerTool('geocode_place', { description: 'Resolve a place name / address to candidate coordinates (VN free-form ranking is unreliable — pick from the list).', inputSchema: { query: z.string().min(1), limit: z.number().int().positive().max(10).optional() } }, (a: { query: string; limit?: number }) => t.geocode_place(a));
  s.registerTool('list_themes', { description: 'List the available color themes.', inputSchema: {} }, () => t.list_themes());
  s.registerTool('list_formats', { description: 'List the available format presets (incl. tiktok).', inputSchema: {} }, () => t.list_formats());
}
