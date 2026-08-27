/**
 * AC-9 — chính sách của ĐƯỜNG WEB khi thiếu nguồn tile vệ tinh: rơi về nền
 * vector, KHÔNG từ chối.
 *
 * Vì sao phải là test của chính thành phần này, không phải một ca nữa ở tầng
 * dựng style: `buildMapStyle` thiếu URL thì không dựng lớp ảnh — điều đó đã có
 * AC-3 canh. Thứ AC-9 hứa là chính sách của TẦNG TRÊN: đường web KHÔNG dựng
 * thêm cửa chặn nào, nó truyền giá trị thiếu xuống và để tầng dưới rơi về
 * vector. Đường agent (`resolveConfig`) làm ngược lại — TỪ CHỐI kèm tên biến
 * (AC-8) — nên hai chính sách này chỉ phân biệt được ở tầng gọi, và trước lượt
 * này không phép đo nào chạm tầng đó: thành phần bản đồ web chưa có tệp test.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { BuildStyleArgs } from '../lib/mapStyle';

// Mock khai ĐÚNG chữ ký thật (`BuildStyleArgs`) chứ không phải hàm không tham
// số: `vi.fn(() => ...)` cho `mock.calls` kiểu `[][]`, và khi đó đọc `calls[0][0]`
// là đọc ngoài biên — thứ duy nhất cứu được nó là một phép ép kiểu, tức là biến
// phép đo thành phép đo giả. Khai đúng tham số thì đối số ghi lại được TypeScript
// chấm thẳng theo giao diện thật, và assertion bên dưới không cần ép kiểu nào.
const buildMapStyle = vi.fn((_args: BuildStyleArgs) => ({ version: 8, sources: {}, layers: [] }));
vi.mock('../lib/mapStyle', () => ({ buildMapStyle: (args: BuildStyleArgs) => buildMapStyle(args) }));

// Lớp bản đồ giả phải sống BÊN TRONG nhà máy mock: `vi.mock` được nâng lên
// đầu tệp, nên mọi thứ khai ở thân module đều chưa tồn tại lúc nhà máy chạy.
vi.mock('maplibre-gl', () => {
  const handler = () => ({ enable: vi.fn(), disable: vi.fn(), enableRotation: vi.fn(), disableRotation: vi.fn() });
  class FakeMap {
    dragPan = handler(); scrollZoom = handler(); boxZoom = handler();
    doubleClickZoom = handler(); keyboard = handler(); touchZoomRotate = handler();
    dragRotate = handler();
    on = vi.fn(); off = vi.fn(); once = vi.fn(); remove = vi.fn(); resize = vi.fn(); stop = vi.fn();
    setStyle = vi.fn(); setBearing = vi.fn(); setPitch = vi.fn(); flyTo = vi.fn();
    getBearing = () => 0; getPitch = () => 0; getZoom = () => 12;
    getCenter = () => ({ lng: 105.85, lat: 21.03 });
    getCanvas = () => document.createElement('canvas');
  }
  class FakeMarker { setLngLat() { return this; } addTo() { return this; } remove() {} }
  return { default: { Map: FakeMap, Marker: FakeMarker } };
});
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

import MapView from './MapView';
import { usePosterStore } from '../store/usePosterStore';

// jsdom không có ResizeObserver; thành phần này gọi nó lúc gắn vào cây.
class FakeResizeObserver { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = FakeResizeObserver;

let container: HTMLDivElement;
let root: Root;

const render = async () => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<MapView />); });
};

describe('MapView — chính sách nền vệ tinh của đường web (AC-9)', () => {
  beforeEach(() => { buildMapStyle.mockClear(); });
  afterEach(async () => {
    await act(async () => { root.unmount(); });
    container.remove();
    usePosterStore.setState({ basemap: 'vector', satelliteTiles: undefined });
  });

  it('thiếu nguồn tile mà vẫn xin nền vệ tinh: KHÔNG ném, và truyền xuống giá trị thiếu để tầng dưới rơi về vector', async () => {
    usePosterStore.setState({ basemap: 'satellite', satelliteTiles: undefined });
    await expect(render()).resolves.not.toThrow();
    expect(buildMapStyle).toHaveBeenCalled();
    const arg = buildMapStyle.mock.calls[0][0];
    expect(arg.basemap).toBe('satellite');
    // Chính sách: KHÔNG có cửa chặn nào ở đường web — giá trị thiếu đi xuống
    // nguyên vẹn. Đường agent làm ngược lại và có AC-8 canh.
    expect(arg.satelliteTiles).toBeUndefined();
  });

  it('đối chứng dương: có nguồn tile thì đúng URL đó đi xuống, không bị nuốt', async () => {
    usePosterStore.setState({ basemap: 'satellite', satelliteTiles: 'https://tiles.example/{z}/{x}/{y}.jpg' });
    await render();
    const arg = buildMapStyle.mock.calls[0][0];
    expect(arg.satelliteTiles).toBe('https://tiles.example/{z}/{x}/{y}.jpg');
  });
});
