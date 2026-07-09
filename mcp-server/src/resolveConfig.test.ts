import { describe, it, expect, vi } from 'vitest';
import { resolveConfig, formatSize, FORMATS } from './resolveConfig';
import * as geocode from './geocode';

vi.mock('./geocode', () => ({
  resolveLocation: vi.fn(async (input: string | { lng: number; lat: number; zoom?: number }) =>
    typeof input === 'string'
      ? { center: [106.7, 10.78], zoom: 12, place: { name: 'HCMC', country: 'Vietnam', lat: 10.78, lng: 106.7 } }
      : { center: [input.lng, input.lat], zoom: input.zoom ?? 15, place: { name: '', country: '', lat: input.lat, lng: input.lng } },
  ),
  resolveBoundary: vi.fn(async () => ({
    type: 'FeatureCollection',
    features: [{ type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
  })),
}));

describe('formatSize', () => {
  it('resolves tiktok to 1080×1920 and passes custom dims through', () => {
    expect(formatSize('tiktok')).toEqual({ width: 1080, height: 1920 });
    expect(formatSize({ width: 1234, height: 567 })).toEqual({ width: 1234, height: 567 });
    expect(FORMATS.tiktok).toEqual({ width: 1080, height: 1920 });
  });
  it('defaults to tiktok when omitted', () => {
    expect(formatSize(undefined)).toEqual({ width: 1080, height: 1920 });
  });

  it('rejects non-positive, non-integer and oversized custom dims (F4)', () => {
    expect(() => formatSize({ width: 0, height: 0 })).toThrow(/invalid width/i);
    expect(() => formatSize({ width: 1080, height: -5 })).toThrow(/invalid height/i);
    expect(() => formatSize({ width: 99999, height: 100 })).toThrow(/invalid width/i);
    expect(() => formatSize({ width: 10.5, height: 100 })).toThrow(/invalid width/i);
  });
});

describe('resolveConfig', () => {
  it('geocodes the location and picks the format size (AC-1)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', format: 'tiktok' });
    expect(cfg.size).toEqual({ width: 1080, height: 1920 });
    expect(cfg.camera.center).toEqual([106.7, 10.78]);
    expect(cfg.theme).toBe('midnight-blue');
    expect(cfg.chrome).toBe('clean');
    expect(cfg.place.country).toBe('Vietnam');
  });

  it('point highlight → marker + street-level zoom 14–17 (AC-3)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', highlight: { points: ['Võ Văn Tần, HCMC'] } });
    expect(cfg.markers).toHaveLength(1);
    expect(cfg.markers![0].lng).toBe(106.7);
    expect(cfg.camera.zoom).toBeGreaterThanOrEqual(14);
    expect(cfg.camera.zoom).toBeLessThanOrEqual(17);
  });

  it('region highlight → boundary geojson + fitted camera (AC-2)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', highlight: { regions: ['Quận 3, HCMC'] } });
    expect(cfg.highlight?.regions).toHaveLength(1);
    expect(cfg.highlight!.regions[0].geojson.features[0].geometry.type).toBe('Polygon');
    expect(cfg.camera.center[0]).toBeGreaterThan(106.5);
    expect(cfg.camera.center[0]).toBeLessThan(106.9);
    expect(cfg.camera.zoom).toBeGreaterThan(0);
  });

  it('custom format dims flow through (AC-8)', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', format: { width: 1234, height: 567 } });
    expect(cfg.size).toEqual({ width: 1234, height: 567 });
  });

  it('explicit camera zoom overrides auto-framing', async () => {
    const cfg = await resolveConfig({ location: 'HCMC', highlight: { points: ['x'] }, camera: { zoom: 9 } });
    expect(cfg.camera.zoom).toBe(9);
  });

  it('chrome defaults to clean, poster is honored (AC-9)', async () => {
    expect((await resolveConfig({ location: 'HCMC' })).chrome).toBe('clean');
    expect((await resolveConfig({ location: 'HCMC', chrome: 'poster' })).chrome).toBe('poster');
  });

  it('throws when a requested region has no boundary — never silently drops it (F2)', async () => {
    vi.mocked(geocode.resolveBoundary).mockResolvedValueOnce(null);
    await expect(resolveConfig({ location: 'HCMC', highlight: { regions: ['Nowhere-with-no-polygon'] } })).rejects.toThrow(
      /no boundary found for region/i,
    );
  });
});
