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
  resolveBoundary: vi.fn(async () => ({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }] })),
}));

import { makeTools, type ToolResult } from './tools';
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
});

describe('render_variants', () => {
  it('renders one image per variant (AC-5)', async () => {
    const res = await tools().render_variants({ base: { location: 'HCMC', format: 'tiktok' }, variants: [{ theme: 'ocean' }, { theme: 'ruby' }] });
    expect(textJson(res).count).toBe(2);
    expect(imageBlocks(res)).toHaveLength(2);
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
