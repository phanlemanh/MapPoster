import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

vi.mock('./geocode', () => ({
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) => {
    if (typeof input === 'string' && input.toLowerCase().startsWith('zzz')) throw new Error(`No geocoding result for "${input}"`);
    return typeof input === 'string'
      ? { center: [106.7, 10.78], zoom: 12, place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } };
  }),
  searchCandidates: vi.fn(async (q: string) =>
    q.toLowerCase().startsWith('zzz')
      ? []
      : [
          { name: 'Nguyen Hue Boulevard', country: 'Vietnam', lng: 106.7, lat: 10.77, zoom: 15, displayName: 'Nguyen Hue Boulevard, …' },
          { name: 'Ho Chi Minh City Hall', country: 'Vietnam', lng: 106.7, lat: 10.776, zoom: 15, displayName: 'Ho Chi Minh City Hall, …' },
        ],
  ),
  resolveBoundary: vi.fn(async () => ({
    geojson: {
      type: 'FeatureCollection',
      features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
    },
    osmType: 'relation',
    osmId: 1973756,
    displayName: 'District 1, Ho Chi Minh City, Vietnam',
    placeRank: 18,
  })),
  resolveCountryAt: vi.fn(async () => 'Vietnam'),
}));

import { makeTools, renderMapSchema, MAX_VARIANTS, type ToolResult } from './tools';
import { MAX_HIGHLIGHTS } from './resolveConfig';
import { THEMES } from '../../src/data/themes';
import * as geocode from './geocode';
import type { RenderConfig } from '../../src/render/renderConfig';

function fakePng(w: number, h: number): Buffer {
  const b = Buffer.alloc(30);
  b.writeUInt32BE(w, 16);
  b.writeUInt32BE(h, 20);
  return b;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const textJson = (res: ToolResult) => JSON.parse((res.content.find((c: any) => c.type === 'text') as any).text);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const imageBlocks = (res: ToolResult) => res.content.filter((c: any) => c.type === 'image');

let sinkDir: string;
let lastCfg: RenderConfig | undefined;
const render = vi.fn(async (cfg: RenderConfig) => {
  lastCfg = cfg;
  return fakePng(cfg.size.width, cfg.size.height);
});

beforeEach(async () => {
  sinkDir = await fs.mkdtemp(path.join(os.tmpdir(), 'mp-tools-'));
  lastCfg = undefined;
  render.mockClear();
});
afterEach(async () => {
  await fs.rm(sinkDir, { recursive: true, force: true });
});

const tools = () => makeTools({ render, sinkDir, defaultDelivery: 'both' });

const renderAnimation = vi.fn(async (cfg: RenderConfig, opts: { frames: number }) => {
  lastCfg = cfg;
  return Array.from({ length: opts.frames }, () => fakePng(cfg.size.width, cfg.size.height));
});
const encodeAnimation = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
  await fs.writeFile(opts.outPath, 'x');
  return opts.outPath;
});
const animTools = () => makeTools({ render, renderAnimation, encodeAnimation, sinkDir, defaultDelivery: 'both' });

describe('render_map', () => {
  it('renders and echoes resolved center/place (AC-1)', async () => {
    const res = await tools().render_map({ location: 'HCMC', format: 'tiktok' });
    const j = textJson(res);
    expect(j.image.width).toBe(1080);
    expect(j.image.height).toBe(1920);
    expect(j.resolved.center).toEqual([106.7, 10.78]);
    expect(imageBlocks(res)).toHaveLength(1);
  });

  it('echoes the resolved theme and highlights, per the tool contract', async () => {
    const res = await tools().render_map({
      location: 'HCMC',
      theme: 'ruby',
      highlight: { regions: ['District 1'], points: [{ lng: 106.7, lat: 10.78 }] },
    });
    const { resolved } = textJson(res);
    expect(resolved.theme).toBe('ruby');
    expect(resolved.highlights.regions).toHaveLength(1);
    expect(resolved.highlights.regions[0].bbox).toEqual([106.6, 10.7, 106.8, 10.9]);
    expect(resolved.highlights.points).toEqual([{ lng: 106.7, lat: 10.78 }]);
  });

  it('returns a structured error for an unknown theme rather than a default-themed poster', async () => {
    const res = await tools().render_map({ location: 'HCMC', theme: 'rubby' });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/Unknown theme: rubby/);
    expect(render).not.toHaveBeenCalled();
  });

  it('custom format dims flow through (AC-8)', async () => {
    const res = await tools().render_map({ location: 'HCMC', format: { width: 1234, height: 567 } });
    expect(textJson(res).image.width).toBe(1234);
    expect(textJson(res).image.height).toBe(567);
  });

  it('chrome defaults clean, poster honored (AC-9)', async () => {
    await tools().render_map({ location: 'HCMC' });
    expect(lastCfg?.chrome).toBe('clean');
    await tools().render_map({ location: 'HCMC', chrome: 'poster' });
    expect(lastCfg?.chrome).toBe('poster');
  });

  it('ungeocodable input → structured error, no throw (AC-11)', async () => {
    const res = await tools().render_map({ location: 'zzzzz-not-a-place' });
    expect(res.isError).toBe(true);
    expect(textJson(res).ok).toBe(false);
  });

  it('invalid custom dims → structured error, never renders a blank PNG (F4 / AC-11)', async () => {
    for (const format of [{ width: 0, height: 0 }, { width: -1, height: 100 }, { width: 99999, height: 100 }]) {
      const res = await tools().render_map({ location: 'HCMC', format });
      expect(res.isError).toBe(true);
      expect(textJson(res).ok).toBe(false);
    }
    expect(render).not.toHaveBeenCalled(); // we never reach the renderer with a bad size
  });

  it('region with no boundary → structured error, not a silently unhighlighted poster (F2 / AC-2)', async () => {
    vi.mocked(geocode.resolveBoundary).mockResolvedValueOnce(null);
    const res = await tools().render_map({ location: 'HCMC', highlight: { regions: ['Nowhere-with-no-polygon'] } });
    expect(res.isError).toBe(true);
    expect(textJson(res).ok).toBe(false);
    expect(render).not.toHaveBeenCalled();
  });
});

describe('routes + measure (PR #2)', () => {
  it('reaches the render config and echoes resolved.routes with a self-describing length name', async () => {
    const res = await tools().render_map({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.85, 21.02], [105.86, 21.02], [105.86, 21.03]], color: '#ff0000', width: 8 }],
    });

    // tới được config => tới được pixel: applyRenderConfig set store.routes và
    // mapStyle đã dựng layer route-line từ trước.
    expect(lastCfg?.routes).toHaveLength(1);
    expect(lastCfg?.routes?.[0]).toMatchObject({ color: '#ff0000', width: 8 });

    const j = textJson(res);
    expect(j.resolved.routes[0].pointCount).toBe(3);
    expect(j.resolved.routes[0].lengthKm).toBeGreaterThan(2);
    expect(j.resolved.routes[0]).not.toHaveProperty('km');
  });

  it('omits routes and measures entirely when the call uses neither', async () => {
    const j = textJson(await tools().render_map({ location: { lng: 105.85, lat: 21.02 } }));
    expect(j.resolved).not.toHaveProperty('routes');
    expect(j.resolved).not.toHaveProperty('measures');
  });

  it('echoes straight-line distance and bearing for a requested point pair', async () => {
    const j = textJson(await tools().render_map({
      location: { lng: 105.85, lat: 21.02 },
      highlight: { points: [{ lng: 105.8342, lat: 21.0278 }, { lng: 106.6297, lat: 10.8231 }] },
      measure: { pairs: [[0, 1]] },
    }));

    expect(j.resolved.measures.pairs[0].straightLineKm).toBeGreaterThan(1132);
    expect(j.resolved.measures.pairs[0].straightLineKm).toBeLessThan(1143);
    expect(j.resolved.measures.pairs[0]).toMatchObject({ from: 0, to: 1 });
  });

  it('refuses a route that carries both geojson and coords', async () => {
    const res = await tools().render_map({
      location: { lng: 105.85, lat: 21.02 },
      routes: [{ coords: [[105.85, 21.02], [105.86, 21.02]], geojson: { type: 'FeatureCollection', features: [] } }],
    } as never);
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/exactly one of/);
  });
});

describe('render_variants', () => {
  it('renders one image per variant (AC-5)', async () => {
    const res = await tools().render_variants({ base: { location: 'HCMC', format: 'tiktok' }, variants: [{ theme: 'ocean' }, { theme: 'ruby' }] });
    expect(textJson(res).count).toBe(2);
    expect(imageBlocks(res)).toHaveLength(2);
  });

  it('a variant cannot smuggle out-of-range values past the boundary guard (R2-MEDIUM)', async () => {
    for (const variant of [{ camera: { zoom: 99 } }, { location: { lng: 999, lat: 0 } }, { format: { width: 0, height: 0 } }]) {
      const res = await tools().render_variants({ base: { location: 'HCMC', format: 'tiktok' }, variants: [variant] });
      expect(res.isError).toBe(true);
      expect(textJson(res).ok).toBe(false);
    }
    expect(render).not.toHaveBeenCalled();
  });

  it('refuses an oversized fan-out BEFORE the first render, not after N of them (issue #1)', async () => {
    const res = await tools().render_variants({
      base: { location: 'HCMC', format: 'tiktok' },
      variants: Array.from({ length: MAX_VARIANTS + 1 }, () => ({})),
    });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/too many variants: 25 \(max 24/i);
    // The point of the guard: zero pool time spent. A cap that only stopped the
    // loop partway would still have burned MAX_VARIANTS renders.
    expect(render).not.toHaveBeenCalled();
  });

  it('still renders a fan-out exactly at the cap — the bound is inclusive', async () => {
    const res = await tools().render_variants({
      base: { location: 'HCMC', format: 'tiktok' },
      variants: Array.from({ length: MAX_VARIANTS }, () => ({})),
    });
    expect(res.isError).toBeFalsy();
    expect(textJson(res).count).toBe(MAX_VARIANTS);
    expect(render).toHaveBeenCalledTimes(MAX_VARIANTS);
  });

  it('the cap clears a one-variant-per-theme sweep, the widest real fan-out', () => {
    expect(MAX_VARIANTS).toBeGreaterThanOrEqual(THEMES.length);
  });
});

describe('input caps at the schema boundary', () => {
  // The runtime guards in resolveConfig/render_variants exist because makeTools
  // is callable directly; these assert the OTHER half — that the declared
  // schema, which is what REST /render, /render-clip and /jobs parse against,
  // refuses the same shapes. Both halves are load-bearing.
  it('renderMapSchema refuses over-cap highlight arrays (issue #2)', () => {
    for (const key of ['regions', 'points'] as const) {
      const over = renderMapSchema.safeParse({
        location: 'HCMC',
        highlight: { [key]: Array.from({ length: MAX_HIGHLIGHTS + 1 }, (_, i) => `place ${i}`) },
      });
      expect(over.success).toBe(false);

      const at = renderMapSchema.safeParse({
        location: 'HCMC',
        highlight: { [key]: Array.from({ length: MAX_HIGHLIGHTS }, (_, i) => `place ${i}`) },
      });
      expect(at.success).toBe(true);
    }
  });
});

describe('VN address UX', () => {
  it('placeName overrides the geocoder-derived poster label', async () => {
    const res = await tools().render_map({ location: 'Võ Văn Tần, Quận 3, TP.HCM', placeName: 'Võ Văn Tần, Quận 3' });
    expect(textJson(res).resolved.place.name).toBe('Võ Văn Tần, Quận 3');
    expect(lastCfg?.place.name).toBe('Võ Văn Tần, Quận 3');
  });

  it('without placeName the geocoder label is used', async () => {
    const res = await tools().render_map({ location: 'HCMC' });
    expect(textJson(res).resolved.place.name).toBe('HCMC');
  });

  it('geocode_place returns candidates for disambiguation, not just the top hit', async () => {
    const j = textJson(await tools().geocode_place({ query: 'Lê Lợi, Quận 1, TP.HCM' }));
    expect(j.candidates).toHaveLength(2);
    expect(j.best.name).toBe('Nguyen Hue Boulevard');
  });

  it('geocode_place surfaces a structured error when nothing matches', async () => {
    const res = await tools().geocode_place({ query: 'zzzzz-nowhere' });
    expect(res.isError).toBe(true);
  });
});

describe('discovery tools', () => {
  it('list_formats includes tiktok 1080×1920 (AC-8)', async () => {
    const j = textJson(await tools().list_formats());
    expect(j.formats.some((f: { name: string; width: number; height: number }) => f.name === 'tiktok' && f.width === 1080 && f.height === 1920)).toBe(true);
  });
  it('list_themes returns all 13 themes', async () => {
    expect(textJson(await tools().list_themes()).themes).toHaveLength(13);
  });
  it('list_themes exposes the full palette so agents can match overlay colors', async () => {
    const { themes } = textJson(await tools().list_themes());
    expect(themes).toHaveLength(13);
    expect(themes[0]).toMatchObject({ id: 'midnight-blue', dark: true });
    expect(themes[0].colors.background).toMatch(/^#/);
    expect(Object.keys(themes[0].colors)).toContain('accent');
  });

  it('list_formats dedupes 4k and carries aspect/category/print', async () => {
    const { formats } = textJson(await tools().list_formats());
    expect(formats.filter((f: { name: string }) => f.name === '4k')).toHaveLength(1);
    const tiktok = formats.find((f: { name: string }) => f.name === 'tiktok');
    expect(tiktok).toMatchObject({ aspect: '9:16', category: 'Video' });
    const a4 = formats.find((f: { name: string }) => f.name === 'a4');
    expect(a4.category).toBe('Print');
    expect(a4.print).toEqual({ w: 210, h: 297, unit: 'mm' });
  });

  it('gives every FORMATS entry its own correct category, not a blanket Video (Finding 4)', async () => {
    // A hardcoded `category: 'Video'` for every FORMATS entry mislabeled
    // square/story/portrait (all image-first social formats) as Video, and
    // shadowed the Wallpaper '4k' from LAYOUTS with a mislabeled Video '4k' —
    // an agent filtering category === 'Social' got nothing for tiktok/story.
    const { formats } = textJson(await tools().list_formats());
    const byName = (name: string) => formats.find((f: { name: string }) => f.name === name);

    expect(byName('tiktok').category).toBe('Video'); // genuinely video-first
    expect(byName('landscape').category).toBe('Video'); // genuinely video-first
    expect(byName('story').category).toBe('Social'); // 1080x1920, an Instagram/FB Story format
    expect(byName('square').category).toBe('Social'); // 1080x1080, an Instagram square post
    expect(byName('portrait').category).toBe('Social'); // 1080x1350, Instagram's 4:5 portrait post ratio
    // '4k' wins the name collision with LAYOUTS's Desktop 4K Wallpaper entry
    // (identical 3840x2160) — its category must match what it dedupes away,
    // not be silently relabeled Video.
    expect(byName('4k').category).toBe('Wallpaper');
  });
});

describe('list_fonts (PR #3)', () => {
  it('exposes every font render_map accepts, with its typographic metadata', async () => {
    const { fonts } = textJson(await tools().list_fonts());
    expect(fonts).toHaveLength(6);
    expect(fonts[0]).toMatchObject({ key: 'Space Grotesk' });
    expect(typeof fonts[0].stack).toBe('string');
    expect(typeof fonts[0].titleWeight).toBe('number');
    expect(typeof fonts[0].uppercaseTitle).toBe('boolean');
  });

  it('lists ONLY names render_map actually accepts — a listed-but-rejected font is a trap', async () => {
    const { fonts } = textJson(await tools().list_fonts());
    for (const f of fonts) {
      const res = await tools().render_map({ location: { lng: 105.85, lat: 21.02 }, font: f.key });
      expect(res.isError).toBeFalsy();
    }
  });
});

describe('render_animation', () => {
  const point = { highlight: { points: [{ lng: 106.7, lat: 10.78 }] } };

  it('rejects when there is no highlight point to pulse around', async () => {
    const res = await animTools().render_animation({ location: 'HCMC' });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/highlight\.points/);
  });

  it('captures frames once and encodes every requested format', async () => {
    renderAnimation.mockClear();
    encodeAnimation.mockClear();
    const res = await animTools().render_animation({
      location: 'HCMC',
      ...point,
      animation: { frames: 8, fps: 10, format: 'both' },
    });
    expect(res.isError).toBeUndefined();
    const j = textJson(res);
    expect(renderAnimation).toHaveBeenCalledTimes(1); // one capture feeds both encodes
    expect(encodeAnimation).toHaveBeenCalledTimes(2);
    expect(j.animation.outputs.map((o: { format: string }) => o.format).sort()).toEqual(['gif', 'mp4']);
    expect(j.animation.frames).toBe(8);
    expect(j.animation.loop).toBe(true);
    expect(imageBlocks(res)).toHaveLength(1); // inline preview frame
  });

  it('defaults GIF to a bounded width and formats to gif-only', async () => {
    encodeAnimation.mockClear();
    const res = await animTools().render_animation({ location: 'HCMC', ...point, format: 'tiktok' });
    expect(res.isError).toBeUndefined();
    expect(encodeAnimation).toHaveBeenCalledTimes(1);
    const opts = encodeAnimation.mock.calls[0][1];
    expect(opts.format).toBe('gif');
    expect(opts.gifWidth).toBe(540);
  });

  it('fails cleanly when the server build has no animation deps', async () => {
    const res = await tools().render_animation({ location: 'HCMC', ...point });
    expect(res.isError).toBe(true);
  });

  it('honours delivery for the preview still (url → no inline base64)', async () => {
    const res = await animTools().render_animation({
      location: { lng: 106.7, lat: 10.78 },
      highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
      animation: { frames: 4 },
      delivery: 'url',
    });
    expect(res.isError).toBeFalsy();
    expect(imageBlocks(res)).toHaveLength(0); // trước fix: luôn 1 block inline
    expect(textJson(res).image.path).toMatch(/-preview\.png$/);
  });

  it('refuses an animation over MAPPOSTER_CLIP_MAX_BYTES and removes the file', async () => {
    const bigEncode = vi.fn(async (_f: Buffer[], opts: { outPath: string }) => {
      await fs.writeFile(opts.outPath, Buffer.alloc(64)); // stat.size = 64
      return opts.outPath;
    });
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '10';
    try {
      const t = makeTools({ render, renderAnimation, encodeAnimation: bigEncode, sinkDir, defaultDelivery: 'both' });
      const res = await t.render_animation({
        location: { lng: 106.7, lat: 10.78 },
        highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
        animation: { frames: 4, format: 'gif' },
      });
      expect(res.isError).toBe(true);
      expect(textJson(res).error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
      const leftovers = (await fs.readdir(sinkDir)).filter((f) => f.endsWith('.gif'));
      expect(leftovers).toHaveLength(0);
    } finally {
      delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
    }
  });

  it('rolls back an already-written gif when format "both" busts the cap on the mp4 output', async () => {
    const partialEncode = vi.fn(async (_f: Buffer[], opts: { format: 'gif' | 'mp4'; outPath: string }) => {
      // gif lands under the cap; mp4 (checked second, per `wanted` order) busts it —
      // keyed off opts.format rather than call order so the test doesn't depend on
      // which format the implementation happens to encode first.
      await fs.writeFile(opts.outPath, Buffer.alloc(opts.format === 'mp4' ? 64 : 5));
      return opts.outPath;
    });
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '10';
    try {
      const t = makeTools({ render, renderAnimation, encodeAnimation: partialEncode, sinkDir, defaultDelivery: 'both' });
      const res = await t.render_animation({
        location: { lng: 106.7, lat: 10.78 },
        highlight: { points: [{ lng: 106.7, lat: 10.78 }] },
        animation: { frames: 4, format: 'both' },
      });
      expect(res.isError).toBe(true);
      expect(textJson(res).error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
      const leftovers = (await fs.readdir(sinkDir)).filter((f) => f.endsWith('.gif') || f.endsWith('.mp4'));
      expect(leftovers).toHaveLength(0); // the already-accepted gif must be rolled back, not just the mp4 that tripped the cap
    } finally {
      delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
    }
  });
});

describe('compile_motion (PR #3)', () => {
  // KHÔNG có renderClip/encodeAnimation trong deps: nếu tool đụng tới chúng,
  // test sẽ nổ chứ không âm thầm đi đường render.
  const dryTools = () => makeTools({ render, sinkDir, defaultDelivery: 'url' });

  it('returns the compiled script without spending a single render', async () => {
    render.mockClear();
    const j = textJson(await dryTools().compile_motion({
      location: { lng: 105.85, lat: 21.02, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      motion: { preset: 'pushIn' },
    }));

    expect(j.script.camera.length).toBeGreaterThan(1);
    expect(j.fps).toBe(j.script.fps);
    expect(j.durationSec).toBe(j.script.durationSec);
    expect(j.frames).toBe(Math.round(j.script.durationSec * j.script.fps));
    expect(j.preset).toBe('pushIn');
    expect(j.resolved.center).toBeDefined();
    // Toàn bộ lý do tool này tồn tại:
    expect(render).not.toHaveBeenCalled();
  });

  it('accepts a raw script, not just a preset', async () => {
    const script = {
      // restAtSec phải <= 0.72×durationSec (invariant R) — 2.8 <= 2.88
      fps: 12, durationSec: 4, restAtSec: 2.8,
      camera: [{ t: 0, center: [105.85, 21.02], zoom: 12 }, { t: 2.8, center: [105.85, 21.02], zoom: 14, ease: 'easeOut' }],
      tracks: [],
    };
    const j = textJson(await dryTools().compile_motion({ location: { lng: 105.85, lat: 21.02 }, motion: { script } }));
    expect(j.script.fps).toBe(12);
    expect(j.frames).toBe(48);
    expect(j.preset).toBeUndefined();
  });

  it('reports a preset that cannot compile as an error, not an empty script', async () => {
    const res = await dryTools().compile_motion({
      location: { lng: 105.85, lat: 21.02 },
      motion: { preset: 'approach' }, // approach cần highlight.regions
    });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/approach needs highlight\.regions/);
  });

  it('forces chrome clean so the preview cannot disagree with what render_clip renders', async () => {
    const j = textJson(await dryTools().compile_motion({
      location: { lng: 105.85, lat: 21.02 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      chrome: 'poster',
      motion: { preset: 'pushIn' },
    }));
    expect(j.resolved.chrome).toBe('clean');
  });

  it('refuses a missing motion param with the same message render_clip uses', async () => {
    const res = await dryTools().compile_motion({ location: { lng: 105.85, lat: 21.02 } } as never);
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/motion is required/);
  });
});

describe('render_clip', () => {
  const point = { highlight: { points: [{ lng: 106.7, lat: 10.78 }] } };
  const region = { highlight: { regions: ['District 1'] } };

  const renderClip = vi.fn(async (cfg: RenderConfig) => {
    lastCfg = cfg;
    return {
      frames: [fakePng(cfg.size.width, cfg.size.height), fakePng(cfg.size.width, cfg.size.height)],
      settle: fakePng(cfg.size.width, cfg.size.height),
    };
  });
  const encodeAnimation = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
    await fs.writeFile(opts.outPath, Buffer.from('mp4!'));
    return opts.outPath;
  });
  const clipTools = () => makeTools({ render, renderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' });

  beforeEach(() => {
    renderClip.mockClear();
    encodeAnimation.mockClear();
  });

  it('writes a real MP4 file at clip.path with the expected bytes and a settle file exists on disk', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(res.isError).toBeUndefined();
    const j = textJson(res);

    expect(typeof j.clip.path).toBe('string');
    const written = await fs.readFile(j.clip.path);
    expect(written.toString()).toBe('mp4!');
    expect(j.clip.bytes).toBe(written.length);
    expect(j.clip.fps).toBe(18); // FPS_DEFAULT (motionCompiler.ts) — measured, see Task 9 report
    expect(typeof j.clip.durationSec).toBe('number');
    expect(j.clip.width).toBe(1080);
    expect(j.clip.height).toBe(1920);

    expect(typeof j.settle.path).toBe('string');
    await expect(fs.access(j.settle.path)).resolves.toBeUndefined();
  });

  it('motion.restAtSec is 3.9 for pushIn', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(textJson(res).motion.preset).toBe('pushIn');
    expect(textJson(res).motion.restAtSec).toBeCloseTo(3.9, 3);
  });

  it('echoes the compiled MotionScript so agents can inspect and tweak it', async () => {
    const res = await clipTools().render_clip({
      location: { lng: 105.85, lat: 21.03, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.03 }] },
      motion: { preset: 'pushIn' },
    });
    const j = textJson(res);
    expect(j.motion.script).toBeDefined();
    expect(j.motion.script.fps).toBe(j.clip.fps);
    expect(Array.isArray(j.motion.script.camera)).toBe(true);
    expect(j.motion.script.camera.length).toBeGreaterThan(1);
  });

  it('forces chrome clean on the config handed to renderClip even when the caller asks for poster (AC-9)', async () => {
    await clipTools().render_clip({ location: 'HCMC', chrome: 'poster', ...point, motion: { preset: 'pushIn' } });
    expect(lastCfg?.chrome).toBe('clean');
  });

  it('neither preset nor script given → isError', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: {} as any });
    expect(res.isError).toBe(true);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('a valid preset with an out-of-range override surfaces assertValidOverrides\'s range message, not the generic "motion is required" (Finding F)', async () => {
    // fps: 999 used to fail motionParamSchema's OWN z.number().max(30) bound
    // as part of the preset-vs-script union, so the whole union failed and
    // this surfaced the generic "motion is required: ..." message even
    // though a preset object WAS supplied — burying
    // assertValidOverrides's specific, field-named range message
    // (motionCompiler.ts) entirely.
    const res = await clipTools().render_clip({ location: 'HCMC', motion: { preset: 'drift', fps: 999 } });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/fps=999 is out of range/);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('approach preset without highlight.regions → isError with an "approach needs" message', async () => {
    const res = await clipTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'approach' } });
    expect(res.isError).toBe(true);
    expect(textJson(res).error).toMatch(/approach needs/);
    expect(renderClip).not.toHaveBeenCalled();
  });

  it('is unavailable (structured error) when the server build has no clip deps', async () => {
    const res = await tools().render_clip({ location: 'HCMC', ...region, motion: { preset: 'approach' } });
    expect(res.isError).toBe(true);
  });

  it('degrade: encode failure → ok(...) with settle + clipError and no clip key; the partial mp4 is not left behind (Finding 1)', async () => {
    // Mimic a real encoder crashing mid-write (ffmpeg killed partway through):
    // the file exists on disk BEFORE the throw, so an implementation that
    // only cleans up on the success path would leak a partial/corrupt file
    // into the PERSISTENT sinkDir forever.
    let leakedPath: string | undefined;
    const crashingEncode = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
      leakedPath = opts.outPath;
      await fs.writeFile(opts.outPath, Buffer.from('partial mp4 bytes from a crashed encoder'));
      throw new Error('ffmpeg encode boom');
    });
    const degradeTools = () => makeTools({ render, renderClip, encodeAnimation: crashingEncode, sinkDir, defaultDelivery: 'both' });

    const res = await degradeTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });

    expect(res.isError).toBeUndefined(); // degrade, not a failure — same as REST
    const j = textJson(res);
    expect('clip' in j).toBe(false);
    expect(typeof j.settle?.path).toBe('string'); // the settle still was still delivered
    expect(typeof j.clipError).toBe('string');
    expect(j.clipError).toMatch(/encode/i);

    expect(leakedPath).toBeDefined();
    await expect(fs.access(leakedPath!)).rejects.toThrow(); // ENOENT — cleaned up, not orphaned in sinkDir
  });

  it('rejects an oversized clip (MAPPOSTER_CLIP_MAX_BYTES) — same drift-guard as REST, settle still delivered, tmp file not left behind (Finding C drift + Finding G)', async () => {
    const prevCap = process.env.MAPPOSTER_CLIP_MAX_BYTES;
    process.env.MAPPOSTER_CLIP_MAX_BYTES = '10';
    let writtenPath: string | undefined;
    const bigEncode = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
      writtenPath = opts.outPath;
      await fs.writeFile(opts.outPath, Buffer.alloc(4096, 0x61));
      return opts.outPath;
    });
    const oversizeTools = () => makeTools({ render, renderClip, encodeAnimation: bigEncode, sinkDir, defaultDelivery: 'both' });

    try {
      const res = await oversizeTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
      expect(res.isError).toBe(true); // rejected — not the ok:true encode-failure degrade
      const j = textJson(res);
      expect(j.ok).toBe(false);
      expect(j.error).toMatch(/MAPPOSTER_CLIP_MAX_BYTES/);
      expect('clip' in j).toBe(false);
      expect(typeof j.settle?.path).toBe('string'); // settle still preserved, not thrown away (Finding G)

      expect(writtenPath).toBeDefined();
      await expect(fs.access(writtenPath!)).rejects.toThrow(); // ENOENT — not orphaned in sinkDir
    } finally {
      if (prevCap === undefined) delete process.env.MAPPOSTER_CLIP_MAX_BYTES;
      else process.env.MAPPOSTER_CLIP_MAX_BYTES = prevCap;
    }
  });

  it('a frame-capture failure (renderClip itself throws) still returns an error result — the degrade did not widen', async () => {
    const throwingRenderClip = vi.fn(async () => {
      throw new Error('capture crashed');
    });
    const failTools = () => makeTools({ render, renderClip: throwingRenderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' });

    const res = await failTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(res.isError).toBe(true);
    expect(textJson(res).ok).toBe(false);
    expect(encodeAnimation).not.toHaveBeenCalled();
  });

  it('a structurally invalid raw script motion produces a readable error string, not a serialized ZodError dump (Finding 2)', async () => {
    // fps: 999 fails motionScriptSchema's z.number().int().min(12).max(30) —
    // validateMotionScript's own schema.parse() throws a RAW z.ZodError here,
    // before any of the R/O/L/B/I invariant checks (which throw a plain Error
    // with a prefix instead). Proven only via the REST test until now.
    const res = await clipTools().render_clip({
      location: 'HCMC',
      ...point,
      motion: {
        script: { fps: 999, durationSec: 6, restAtSec: 5.9, camera: [{ t: 0, center: [106.7, 10.78], zoom: 10 }], tracks: [] },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    });
    expect(res.isError).toBe(true);
    const { error } = textJson(res);
    expect(typeof error).toBe('string');
    expect(error.length).toBeGreaterThan(0);
    // A raw ZodError serialized via String(e) / e.message would be a `[ { ... } ]`
    // issues array containing entries like `"code":"invalid_type"` —
    // prettifyError must turn that into readable prose instead.
    expect(error.startsWith('[')).toBe(false);
    expect(error).not.toContain('"code":"invalid_type"');
  });
});

describe('cost metadata (PR #3)', () => {
  // Fake riêng: trả đúng số khung mà script yêu cầu, như renderer thật. Fake dùng
  // chung ở describe render_clip cố định 2 khung, nên không kiểm được hợp đồng
  // "cost.frames là số khung THẬT SỰ đã render".
  const FRAMES = 7;
  const costRenderClip = vi.fn(async (cfg: RenderConfig) => ({
    frames: Array.from({ length: FRAMES }, () => fakePng(cfg.size.width, cfg.size.height)),
    settle: fakePng(cfg.size.width, cfg.size.height),
  }));
  const costEncode = vi.fn(async (_f: Buffer[], opts: { outPath: string }) => {
    await fs.writeFile(opts.outPath, Buffer.from('mp4!'));
    return opts.outPath;
  });
  const costTools = () => makeTools({ render, renderClip: costRenderClip, encodeAnimation: costEncode, sinkDir, defaultDelivery: 'both' });

  it('reports what the call actually cost, in names that carry their unit', async () => {
    const j = textJson(await costTools().render_clip({
      location: { lng: 105.85, lat: 21.02, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      motion: { preset: 'pushIn' },
    }));

    expect(j.cost.frames).toBe(FRAMES); // số khung renderer TRẢ VỀ, không phải số script khai
    expect(typeof j.cost.renderMs).toBe('number');
    expect(typeof j.cost.encodeMs).toBe('number');
    expect(j.cost.renderMs).toBeGreaterThanOrEqual(0);
    expect(j.cost.bytes).toBe(j.clip.bytes);
    // Tên phải mang đơn vị — 'time'/'size' là thứ phía tiêu thụ đoán sai đơn vị.
    expect(j.cost).not.toHaveProperty('time');
    expect(j.cost).not.toHaveProperty('size');
  });

  it('still reports cost on the encode-failure degrade path, where it matters most', async () => {
    const crashingEncode = vi.fn(async () => { throw new Error('ffmpeg exploded'); });
    const t = makeTools({ render, renderClip: costRenderClip, encodeAnimation: crashingEncode, sinkDir, defaultDelivery: 'both' });
    const j = textJson(await t.render_clip({
      location: { lng: 105.85, lat: 21.02, zoom: 14 },
      highlight: { points: [{ lng: 105.85, lat: 21.02 }] },
      motion: { preset: 'pushIn' },
    }));
    expect(j.clipError).toBeDefined();
    expect(typeof j.cost.renderMs).toBe('number');   // render ĐÃ xảy ra, đã tốn tiền
    expect(j.cost.bytes).toBe(0);                     // encode thì không
    // Nửa should-NOT-fire: không được có khối `clip` khai thành công khi
    // không có file nào ra đời — cost có mặt KHÔNG được kéo theo clip có mặt.
    expect(j.clip).toBeUndefined();
  });
});

describe('render_clip concurrency gate (Decision 2)', () => {
  const point = { highlight: { points: [{ lng: 106.7, lat: 10.78 }] } };
  const encodeAnimation = vi.fn(async (_frames: Buffer[], opts: { fps: number; format: 'gif' | 'mp4'; outPath: string; gifWidth?: number }) => {
    await fs.writeFile(opts.outPath, Buffer.from('mp4!'));
    return opts.outPath;
  });

  afterEach(() => {
    delete process.env.MAPPOSTER_CLIP_CONCURRENCY;
  });

  it('MAPPOSTER_CLIP_CONCURRENCY=1: a second render_clip call while one is still in flight is rejected, not queued', async () => {
    process.env.MAPPOSTER_CLIP_CONCURRENCY = '1';

    // Held open until the test explicitly lets it finish, so the FIRST call
    // is provably still "in flight" (past prepareClipRender, mid-render)
    // when the SECOND call is issued.
    let releaseFirst!: () => void;
    const gate = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const renderClip = vi.fn(async (cfg: RenderConfig) => {
      await gate;
      return { frames: [fakePng(cfg.size.width, cfg.size.height)], settle: fakePng(cfg.size.width, cfg.size.height) };
    });
    const gatedTools = () => makeTools({ render, renderClip, encodeAnimation, sinkDir, defaultDelivery: 'both' });

    const first = gatedTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    // let the first call actually reach (and hold) its renderClip call before firing the second
    await vi.waitFor(() => expect(renderClip).toHaveBeenCalledTimes(1));

    const second = await gatedTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(second.isError).toBe(true);
    expect(textJson(second).error).toMatch(/Too many concurrent clip renders/);
    expect(renderClip).toHaveBeenCalledTimes(1); // the second call never reached the render step

    releaseFirst();
    const firstResult = await first;
    expect(firstResult.isError).toBeUndefined();

    // slot freed after the first call finished — a third call now succeeds
    const third = await gatedTools().render_clip({ location: 'HCMC', ...point, motion: { preset: 'pushIn' } });
    expect(third.isError).toBeUndefined();
  });
});
