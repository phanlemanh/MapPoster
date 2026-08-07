import { describe, it, expect } from 'vitest';
import {
  ANCHOR_CAMERA_EPS,
  assertCameraAtRest,
  assertNoPitch,
  collectCoords,
  pctOf,
  regionAnchorOf,
} from './anchors';
import type { GeoJSONFeatureCollection } from '../types';

describe('pctOf — phần trăm với MẪU SỐ RIÊNG từng trục', () => {
  it('chia x cho cssW và y cho cssH, KHÔNG dùng một hệ số chung', () => {
    // Arrange: khung CSS mà RenderApp.tsx:31 làm tròn ĐỘC LẬP hai trục —
    // 1079×1921 không cùng tỉ lệ với bất kỳ khung đầu ra nào, nên một hệ số
    // chung (dù lấy theo trục nào) cũng sai ở trục còn lại.
    const frame = { cssW: 1079, cssH: 1921 };

    // Act
    const corner = pctOf({ x: 1079, y: 1921 }, frame);
    const mid = pctOf({ x: 539.5, y: 960.5 }, frame);

    // Assert: nếu dùng chung mẫu số cssW thì yPct = 100*1921/1079 = 178.0352
    expect(corner.xPct).toBe(100);
    expect(corner.yPct).toBe(100);
    expect(mid.xPct).toBe(50);
    expect(mid.yPct).toBe(50);
  });

  it('trục y không được nhân bằng tỉ lệ của trục x (bẫy 1 của kế hoạch)', () => {
    // cssW ≠ cssH ⇒ cùng một toạ độ pixel phải cho hai phần trăm KHÁC nhau
    const p = pctOf({ x: 300, y: 300 }, { cssW: 600, cssH: 1200 });
    expect(p.xPct).toBe(50);
    expect(p.yPct).toBe(25);
  });

  it('điểm ngoài khung: onScreen=false nhưng VẪN trả phần trăm (có thể âm hoặc >100)', () => {
    const frame = { cssW: 400, cssH: 800 };
    const left = pctOf({ x: -40, y: 400 }, frame);
    const below = pctOf({ x: 200, y: 1200 }, frame);
    const inside = pctOf({ x: 0, y: 800 }, frame);

    expect(left.onScreen).toBe(false);
    expect(left.xPct).toBe(-10);
    expect(left.yPct).toBe(50);
    expect(below.onScreen).toBe(false);
    expect(below.yPct).toBe(150);
    // đúng mép vẫn tính là trong khung
    expect(inside.onScreen).toBe(true);
  });

  it('khung suy biến (0 hoặc không hữu hạn) phải NỔ, không trả Infinity lặng lẽ', () => {
    expect(() => pctOf({ x: 1, y: 1 }, { cssW: 0, cssH: 100 })).toThrow(/frame/i);
    expect(() => pctOf({ x: 1, y: 1 }, { cssW: 100, cssH: Number.NaN })).toThrow(/frame/i);
  });
});

describe('regionAnchorOf', () => {
  it('bbox + centroid tính trong KHÔNG GIAN MÀN HÌNH, mỗi trục một mẫu số', () => {
    const frame = { cssW: 1000, cssH: 2000 };
    const projected = [
      { x: 100, y: 200 },
      { x: 300, y: 200 },
      { x: 300, y: 600 },
      { x: 100, y: 600 },
    ];

    const r = regionAnchorOf(2, projected, frame);

    expect(r).not.toBeNull();
    expect(r!.index).toBe(2);
    expect(r!.bboxPct).toEqual([10, 10, 30, 30]);
    // tâm pixel (200, 400) ⇒ 20% ngang, 20% dọc — hai mẫu số khác nhau cho ra
    // hai con số ĐÚNG chỉ khi chia đúng trục của nó
    expect(r!.centroidPct).toEqual([20, 20]);
  });

  it('vùng không có toạ độ nào ⇒ null (không bịa ra hộp)', () => {
    expect(regionAnchorOf(0, [], { cssW: 100, cssH: 100 })).toBeNull();
  });
});

describe('collectCoords', () => {
  const fc = (geometry: unknown): GeoJSONFeatureCollection =>
    ({ type: 'FeatureCollection', features: [{ type: 'Feature', properties: {}, geometry }] }) as unknown as GeoJSONFeatureCollection;

  it('gom toạ độ của Polygon (mọi ring), MultiPolygon, LineString và Point', () => {
    expect(collectCoords(fc({ type: 'Point', coordinates: [1, 2] }))).toEqual([[1, 2]]);
    expect(collectCoords(fc({ type: 'LineString', coordinates: [[1, 2], [3, 4]] }))).toEqual([[1, 2], [3, 4]]);
    expect(
      collectCoords(fc({ type: 'Polygon', coordinates: [[[0, 0], [1, 0]], [[0.2, 0.2], [0.3, 0.2]]] })),
    ).toEqual([[0, 0], [1, 0], [0.2, 0.2], [0.3, 0.2]]);
    expect(collectCoords(fc({ type: 'MultiPolygon', coordinates: [[[[0, 0], [1, 1]]], [[[2, 2], [3, 3]]]] }))).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
    ]);
  });

  it('bỏ qua feature không có geometry và toạ độ không hữu hạn', () => {
    const mixed = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: {}, geometry: null },
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [Number.NaN, 3] } },
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [5, 6] } },
      ],
    } as unknown as GeoJSONFeatureCollection;
    expect(collectCoords(mixed)).toEqual([[5, 6]]);
  });
});

describe('assertNoPitch', () => {
  it('pitch 0 đi qua', () => {
    expect(() => assertNoPitch(0)).not.toThrow();
  });

  it('pitch khác 0 bị TỪ CHỐI, và thông điệp NÊU ĐÍCH DANH pitch', () => {
    expect(() => assertNoPitch(30)).toThrow(/pitch/i);
    expect(() => assertNoPitch(30)).toThrow(/30/);
    // không phải "toạ độ trông hợp lệ" — phải là từ chối
    expect(() => assertNoPitch(0.5)).toThrow(/pitch/i);
  });
});

describe('assertCameraAtRest', () => {
  const rest = { center: [106.7, 10.78] as [number, number], zoom: 13.25, bearing: 315 };
  const cam = (over: Partial<{ center: [number, number]; zoom: number; bearing: number }> = {}) => ({
    center: rest.center,
    zoom: rest.zoom,
    bearing: rest.bearing,
    pitch: 0,
    ...over,
  });

  it('đi qua khi camera đúng ở restAtSec', () => {
    expect(() => assertCameraAtRest(cam(), rest, 3.9)).not.toThrow();
  });

  it('chấp nhận bearing quy ước khác (MapLibre trả (-180,180], cameraAt trả [0,360))', () => {
    expect(() => assertCameraAtRest(cam({ bearing: -45 }), rest, 3.9)).not.toThrow();
    expect(() => assertCameraAtRest(cam({ bearing: -45 + ANCHOR_CAMERA_EPS / 2 }), rest, 3.9)).not.toThrow();
  });

  it('NỔ TO khi camera lệch — zoom, center hay bearing', () => {
    expect(() => assertCameraAtRest(cam({ zoom: 13.26 }), rest, 3.9)).toThrow(/restAtSec/);
    expect(() => assertCameraAtRest(cam({ zoom: 13.26 }), rest, 3.9)).toThrow(/zoom/);
    expect(() => assertCameraAtRest(cam({ center: [106.71, 10.78] }), rest, 3.9)).toThrow(/center/);
    expect(() => assertCameraAtRest(cam({ bearing: 300 }), rest, 3.9)).toThrow(/bearing/);
    // Thông điệp phải mang CẢ HAI giá trị để người đọc log biết lệch bao nhiêu.
    // Khẳng định riêng từng cái: chỉ kiểm giá trị KỲ VỌNG (13.25) thì gỡ sạch
    // mọi `${actual.*}` khỏi thông điệp vẫn xanh — vòng chấm đã chứng minh đúng
    // như vậy (13/13 pass sau khi gỡ). Giá trị ĐỌC ĐƯỢC mới là thứ nói cho
    // người đọc biết camera đang ở đâu.
    expect(() => assertCameraAtRest(cam({ zoom: 13.26 }), rest, 3.9)).toThrow(/13\.25/);
    expect(() => assertCameraAtRest(cam({ zoom: 13.26 }), rest, 3.9)).toThrow(/13\.26/);
    expect(() => assertCameraAtRest(cam({ center: [106.71, 10.78] }), rest, 3.9)).toThrow(/106\.71/);
    expect(() => assertCameraAtRest(cam({ bearing: 300 }), rest, 3.9)).toThrow(/300/);
  });
});
