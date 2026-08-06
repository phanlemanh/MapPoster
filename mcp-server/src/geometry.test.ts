import { describe, it, expect } from 'vitest';
import { haversineMeters, initialBearingDeg, polylineLengthMeters, geometryAreaM2, centroidOf, spanKmOf } from './geometry';

describe('haversineMeters', () => {
  it('measures a known city pair within 0.5%', () => {
    // Hà Nội → TP.HCM. Great-circle = 1137.89 km, đối chiếu độc lập bằng công
    // thức Vincenty cho hình cầu. KHÔNG phải ~1157 km hay được trích — con số đó
    // là cự ly đường bộ/đường bay, không phải khoảng cách trên mặt cầu.
    const m = haversineMeters([105.8342, 21.0278], [106.6297, 10.8231]);
    expect(m / 1000).toBeGreaterThan(1132);
    expect(m / 1000).toBeLessThan(1143);
  });

  it('is zero for identical points and symmetric between them', () => {
    expect(haversineMeters([105, 21], [105, 21])).toBe(0);
    expect(haversineMeters([105, 21], [106, 22])).toBeCloseTo(haversineMeters([106, 22], [105, 21]), 6);
  });
});

describe('initialBearingDeg', () => {
  it('reads 90 due east, 0 due north, and normalises west to ~270', () => {
    expect(initialBearingDeg([105, 0], [106, 0])).toBeCloseTo(90, 1);
    expect(initialBearingDeg([105, 21], [105, 22])).toBeCloseTo(0, 1);
    expect(initialBearingDeg([105, 21], [104, 21])).toBeGreaterThan(269);
  });
});

describe('polylineLengthMeters', () => {
  it('sums consecutive legs rather than the straight line end to end', () => {
    // dogleg: đi đông rồi đi bắc — phải dài hơn đường chim bay
    const path: [number, number][] = [[105, 21], [106, 21], [106, 22]];
    expect(polylineLengthMeters(path)).toBeGreaterThan(haversineMeters([105, 21], [106, 22]));
  });

  it('returns 0 for fewer than two points', () => {
    expect(polylineLengthMeters([])).toBe(0);
    expect(polylineLengthMeters([[105, 21]])).toBe(0);
  });
});

describe('geometryAreaM2', () => {
  const outer: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]];
  const hole: [number, number][] = [[0.25, 0.25], [0.75, 0.25], [0.75, 0.75], [0.25, 0.75], [0.25, 0.25]];

  it('SUBTRACTS holes — the case a bbox-style blind flatten gets wrong', () => {
    const solid = geometryAreaM2({ type: 'Polygon', coordinates: [outer] });
    const holed = geometryAreaM2({ type: 'Polygon', coordinates: [outer, hole] });
    expect(holed).toBeLessThan(solid);
    expect(holed / solid).toBeCloseTo(0.75, 1); // lỗ chiếm 25% ô ngoài
  });

  it('is winding-order independent — a reversed ring is not negative area', () => {
    const cw: [number, number][] = [[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]];
    expect(geometryAreaM2({ type: 'Polygon', coordinates: [cw] }))
      .toBeCloseTo(geometryAreaM2({ type: 'Polygon', coordinates: [outer] }), 0);
  });

  it('sums the parts of a MultiPolygon', () => {
    const b: [number, number][] = [[2, 0], [3, 0], [3, 1], [2, 1], [2, 0]];
    const one = geometryAreaM2({ type: 'Polygon', coordinates: [outer] });
    const two = geometryAreaM2({ type: 'MultiPolygon', coordinates: [[outer], [b]] });
    expect(two / one).toBeCloseTo(2, 1);
  });

  it('is 0 for non-area geometry and for nullish input', () => {
    expect(geometryAreaM2({ type: 'LineString', coordinates: [[0, 0], [1, 1]] })).toBe(0);
    expect(geometryAreaM2(null)).toBe(0);
    expect(geometryAreaM2(undefined)).toBe(0);
  });
});

describe('centroidOf', () => {
  it('returns the bbox centre of every coordinate, holes included', () => {
    const g = { type: 'Polygon', coordinates: [[[105, 21], [105.1, 21], [105.1, 21.1], [105, 21.1], [105, 21]]] };
    expect(centroidOf(g)).toEqual([105.05, 21.05]);
  });

  it('returns null when there is no coordinate to average', () => {
    expect(centroidOf({ type: 'Polygon', coordinates: [] })).toBeNull();
    expect(centroidOf(null)).toBeNull();
  });
});

describe('spanKmOf', () => {
  it('measures east-west along the mid-latitude, not along the equator', () => {
    // Cùng 1° kinh độ: ở vĩ độ 21 ngắn hơn hẳn ở xích đạo (cos 21° ≈ 0.93).
    const atEquator = spanKmOf([105, -0.5, 106, 0.5]);
    const atVietnam = spanKmOf([105, 20.5, 106, 21.5]);
    expect(atVietnam.ew).toBeLessThan(atEquator.ew);
    expect(atVietnam.ew / atEquator.ew).toBeCloseTo(Math.cos((21 * Math.PI) / 180), 1);
    // Bề dọc không phụ thuộc kinh độ
    expect(atVietnam.ns).toBeCloseTo(atEquator.ns, 0);
  });
});
