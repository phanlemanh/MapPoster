import { describe, it, expect } from 'vitest';
import { compileMotion, motionContextOf, type MotionPreset } from './motionCompiler';
import { validateMotionScript } from '../../src/render/motionScript';
import type { RenderConfig } from '../../src/render/renderConfig';

const SQUARE = {
  type: 'FeatureCollection' as const,
  features: [{ type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [[[106.6, 10.7], [106.8, 10.7], [106.8, 10.9], [106.6, 10.9], [106.6, 10.7]]] } }],
};

function cfg(over: Partial<RenderConfig> = {}): RenderConfig {
  return {
    camera: { center: [106.7, 10.78], zoom: 14.5 },
    size: { width: 1080, height: 1920 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'Test', country: 'Vietnam', lat: 10.78, lng: 106.7 },
    highlight: { regions: [{ geojson: SQUARE, color: null }], color: null, fill: true, dim: false },
    markers: [{ lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 42 }],
    ...over,
  };
}

describe('compileMotion', () => {
  it('every preset self-validates against its own invariants (AC-2)', () => {
    for (const p of ['approach', 'pushIn', 'drift'] as MotionPreset[]) {
      const s = compileMotion(p, cfg());
      // validate lại từ ngoài — compiler không được sinh script mà validator từ chối
      expect(() => validateMotionScript(s, motionContextOf(cfg()))).not.toThrow();
    }
  });

  it('approach: wide→fit flight ends at the resolved camera, region reveal + pin', () => {
    const s = compileMotion('approach', cfg());
    expect(s.durationSec).toBe(6);
    expect(s.restAtSec).toBeCloseTo(4.2, 6);
    expect(s.camera[0].zoom).toBeLessThan(s.camera[s.camera.length - 1].zoom);
    expect(s.camera[s.camera.length - 1].zoom).toBe(14.5);
    expect(s.tracks.map((t) => t.kind)).toEqual(['regionReveal', 'pinDrop']);
  });

  it('approach without regions throws a material error', () => {
    expect(() => compileMotion('approach', cfg({ highlight: undefined }))).toThrow(/approach needs highlight\.regions/);
  });

  it('approach without markers still compiles (reveal-only)', () => {
    const s = compileMotion('approach', cfg({ markers: [] }));
    expect(s.tracks.map((t) => t.kind)).toEqual(['regionReveal']);
  });

  it('pushIn: needs a point; offsets the start centre; pulse loops past rest', () => {
    const s = compileMotion('pushIn', cfg());
    expect(s.durationSec).toBe(5.5);
    expect(s.camera[0].center[0]).not.toBeCloseTo(s.camera[1].center[0], 6);
    const pulse = s.tracks.find((t) => t.kind === 'pulse');
    expect(pulse).toBeDefined();
    expect(() => compileMotion('pushIn', cfg({ markers: [] }))).toThrow(/pushIn needs a highlight point/);
  });

  it('drift: camera-only glide; regionReveal appears only when regions exist', () => {
    expect(compileMotion('drift', cfg({ highlight: undefined, markers: [] })).tracks).toEqual([]);
    expect(compileMotion('drift', cfg()).tracks.map((t) => t.kind)).toEqual(['regionReveal']);
  });

  it('durationSec override scales every timestamp proportionally and keeps invariant R', () => {
    const s = compileMotion('approach', cfg(), { durationSec: 3 });
    expect(s.durationSec).toBe(3);
    expect(s.restAtSec).toBeCloseTo(2.1, 6); // 4.2 × (3/6)
    expect(s.camera[s.camera.length - 1].t).toBeCloseTo(1.3, 6); // 2.6 × 0.5
    expect(() => validateMotionScript(s, motionContextOf(cfg()))).not.toThrow();
  });

  it('fps override flows through and still respects the frame budget', () => {
    expect(compileMotion('drift', cfg(), { fps: 12 }).fps).toBe(12);
  });

  // --- Boundary-value tests across the legal zoom/longitude domain (Findings 1-5) ---
  // The suite above only ever exercises zoom 14.5 / lng 106.7, which is why
  // none of the arithmetic overflows below were caught before.

  it.each([0, 22])('pushIn clamps its start zoom into [0,22] at camera.zoom = %d', (zoom) => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom } });
    const s = compileMotion('pushIn', c);
    expect(s.camera[0].zoom).toBeGreaterThanOrEqual(0);
    expect(s.camera[0].zoom).toBeLessThanOrEqual(22);
  });

  it.each([0, 22])('drift clamps both start and end zoom into [0,22] at camera.zoom = %d', (zoom) => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom } });
    const s = compileMotion('drift', c);
    for (const kf of s.camera) {
      expect(kf.zoom).toBeGreaterThanOrEqual(0);
      expect(kf.zoom).toBeLessThanOrEqual(22);
    }
  });

  it.each([2, 5, 6])('approach never starts above its target zoom at camera.zoom = %d', (zoom) => {
    const c = cfg({ camera: { center: [106.7, 10.78], zoom } });
    const s = compileMotion('approach', c);
    const start = s.camera[0].zoom;
    const target = s.camera[s.camera.length - 1].zoom;
    expect(target).toBe(zoom);
    expect(start).toBeLessThanOrEqual(target); // equality only allowed when clamped at 0
  });

  it.each([
    [-179.5, 5],
    [-179.5, 14.5],
    [179.5, 5],
    [179.5, 14.5],
  ])('pushIn wraps the start centre longitude near the antimeridian (lng=%d, zoom=%d)', (lng, zoom) => {
    const c = cfg({ camera: { center: [lng, 10.78], zoom } });
    expect(() => compileMotion('pushIn', c)).not.toThrow();
    const s = compileMotion('pushIn', c);
    expect(s.camera[0].center[0]).toBeGreaterThanOrEqual(-180);
    expect(s.camera[0].center[0]).toBeLessThanOrEqual(180);
  });

  it('out-of-range durationSec override throws a clear, field-named error (not a raw ZodError)', () => {
    expect(() => compileMotion('drift', cfg(), { durationSec: 1 })).toThrow(/durationSec=1 is out of range/);
  });

  it('out-of-range fps override throws a clear, field-named error (not a raw ZodError)', () => {
    expect(() => compileMotion('drift', cfg(), { fps: 60 })).toThrow(/fps=60 is out of range/);
  });
});
