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
  resolveBoundary: vi.fn(async () => ({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }] })),
}));

import { makeTools, type ToolResult } from './tools';
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

describe('render_map', () => {
  it('renders and echoes resolved center/place (AC-1)', async () => {
    const res = await tools().render_map({ location: 'HCMC', format: 'tiktok' });
    const j = textJson(res);
    expect(j.image.width).toBe(1080);
    expect(j.image.height).toBe(1920);
    expect(j.resolved.center).toEqual([106.7, 10.78]);
    expect(imageBlocks(res)).toHaveLength(1);
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
  it('list_themes returns all 12 themes', async () => {
    expect(textJson(await tools().list_themes()).themes).toHaveLength(12);
  });
});
