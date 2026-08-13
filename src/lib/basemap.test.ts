import { describe, it, expect } from 'vitest';
import { buildMapStyle } from './mapStyle';
import { attributionFor, ATTRIBUTION_TEXT } from './export';
import { getTheme } from '../data/themes';

/**
 * Nền ảnh vệ tinh — hai tính chất mà một lỗi ở đó đi thẳng ra pixel hoặc ra
 * nghĩa vụ giấy phép, và không lane nào khác chạm tới.
 */

const GROUND = ['landcover', 'landuse', 'park', 'water', 'waterway', 'building'];
const TILES = 'https://example.invalid/{z}/{x}/{y}.png';

const highlight = {
  enabled: true,
  regions: [
    {
      geojson: {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'Polygon' as const, coordinates: [[[105.8, 21.0], [105.9, 21.0], [105.9, 21.1], [105.8, 21.1], [105.8, 21.0]]] },
          },
        ],
      },
    },
  ],
  color: '#e8b04b',
  fill: true,
  dim: true,
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const base: any = {
  theme: getTheme('midnight-blue'),
  layers: { landcover: true, buildings: true, water: true, parks: true, roads: true, rail: true, aeroway: true, roadLabels: true },
  detail: 0.6,
  routes: [],
  highlight,
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ids = (s: any) => s.layers.map((l: any) => l.id) as string[];

describe('basemap: satellite', () => {
  it('tắt ĐÚNG nhóm layer vẽ lại mặt đất, và KHÔNG tắt gì khác', () => {
    const v = buildMapStyle(base);
    const s = buildMapStyle({ ...base, basemap: 'satellite', satelliteTiles: TILES });
    // Hai chiều, có chủ đích. Chiều 1 một mình vẫn xanh nếu ai đó tắt luôn cả
    // đường và ranh giới — đúng lớp lỗi làm ảnh vệ tinh thành một tấm ảnh trơ.
    for (const g of GROUND) expect(ids(s), `'${g}' phải bị tắt trên nền vệ tinh`).not.toContain(g);
    for (const keep of ids(v).filter((i) => !GROUND.includes(i))) {
      expect(ids(s), `'${keep}' KHÔNG thuộc nhóm ground nên phải sống sót`).toContain(keep);
    }
  });

  it('raster nằm ngay TRÊN background và DƯỚI mọi thứ còn lại', () => {
    const s = buildMapStyle({ ...base, basemap: 'satellite', satelliteTiles: TILES });
    // Thứ tự là ngữ nghĩa, không phải thẩm mỹ: đặt sau `background` thì vùng
    // tile chưa tải lộ ra màu theme; đặt trên đường thì ảnh che mất đường.
    expect(ids(s)[0]).toBe('background');
    expect(ids(s)[1]).toBe('satellite');
  });

  it('KHÔNG có URL tile thì không dựng source raster — nền rơi về vector', () => {
    const s = buildMapStyle({ ...base, basemap: 'satellite' });
    expect(Object.keys(s.sources)).not.toContain('satellite');
    // Và không được tắt nhóm ground: một bản đồ vừa mất mặt đất vừa không có
    // ảnh thay thế là tệ hơn cả hai lựa chọn.
    for (const g of GROUND) expect(ids(s), `thiếu URL mà vẫn tắt '${g}' ⇒ bản đồ trống`).toContain(g);
  });

  it('nền vector không đổi gì — không có source lẫn layer thừa', () => {
    const v = buildMapStyle(base);
    expect(Object.keys(v.sources)).not.toContain('satellite');
    expect(ids(v)).not.toContain('satellite');
  });
});

describe('attribution theo nền', () => {
  it('nền vệ tinh CỘNG THÊM Copernicus, không THAY THẾ phần OSM', () => {
    // Nghĩa vụ ghi nguồn cộng dồn: đường, ranh giới và nhãn vẫn là OSM kể cả
    // khi mặt đất là ảnh vệ tinh. Một khẳng định chỉ kiểm "có chữ Sentinel"
    // vẫn xanh khi phần OSM bị thay mất — và đó là lỗi giấy phép, không phải
    // lỗi hiển thị.
    const sat = attributionFor('satellite');
    expect(sat).toContain(ATTRIBUTION_TEXT);
    expect(sat).toMatch(/modified Copernicus Sentinel data/);
  });

  it('"modified" phải có mặt — bỏ nó là vi phạm điều kiện, không phải rút gọn', () => {
    // Chính sách Copernicus đòi nói rõ dữ liệu đã qua xử lý; ảnh mosaic là dữ
    // liệu ĐÃ xử lý (quyết định 2026-08-07 §8).
    expect(attributionFor('satellite')).toContain('modified');
  });

  it('nền vector giữ nguyên chuỗi cũ, không lẫn Sentinel', () => {
    expect(attributionFor('vector')).toBe(ATTRIBUTION_TEXT);
    expect(attributionFor(undefined)).toBe(ATTRIBUTION_TEXT);
    expect(attributionFor('vector')).not.toMatch(/Sentinel/);
  });
});
