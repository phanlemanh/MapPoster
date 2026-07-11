import { describe, it, expect } from 'vitest';
import { smoothGeometry } from './smoothGeojson';

const squareRing = [
  [0, 0],
  [10, 0],
  [10, 10],
  [0, 10],
  [0, 0],
];

describe('smoothGeometry', () => {
  it('rounds polygon corners and keeps the ring closed', () => {
    const out = smoothGeometry({ type: 'Polygon', coordinates: [squareRing] });
    const ring = out.coordinates[0];
    expect(ring.length).toBeGreaterThan(squareRing.length);
    expect(ring[0]).toEqual(ring[ring.length - 1]);
    // corner cutting stays inside the convex hull of the original square
    for (const [x, y] of ring) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(10);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(10);
    }
  });

  it('leaves oversized rings untouched (already detailed)', () => {
    const big = Array.from({ length: 1500 }, (_, i) => {
      const a = (i / 1500) * Math.PI * 2;
      return [Math.cos(a), Math.sin(a)];
    });
    big.push(big[0]);
    const out = smoothGeometry({ type: 'Polygon', coordinates: [big] });
    expect(out.coordinates[0]).toEqual(big);
  });

  it('smooths MultiPolygon and LineString, passes points through', () => {
    const mp = smoothGeometry({ type: 'MultiPolygon', coordinates: [[squareRing]] });
    expect(mp.coordinates[0][0].length).toBeGreaterThan(squareRing.length);
    const line = smoothGeometry({ type: 'LineString', coordinates: [[0, 0], [5, 10], [10, 0]] });
    expect(line.coordinates.length).toBeGreaterThan(3);
    expect(line.coordinates[0]).toEqual([0, 0]); // endpoints pinned
    expect(line.coordinates[line.coordinates.length - 1]).toEqual([10, 0]);
    const pt = { type: 'Point', coordinates: [1, 2] };
    expect(smoothGeometry(pt)).toEqual(pt);
  });
});
