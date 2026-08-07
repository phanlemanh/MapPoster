import { describe, it, expect, vi } from 'vitest';
import type { Map as MlMap } from 'maplibre-gl';
import { composeOverlays, ATTRIBUTION_TEXT, type ComposeOpts } from './export';
import { getFont } from '../data/fonts';

/**
 * A fake 2D context that records every `fillText`/`strokeText` call and
 * no-ops everything else (save/restore/drawImage/font/…) — enough surface
 * for `composeOverlays` to run without a real canvas backend (jsdom has
 * none), while still catching ANY text-drawing call, known or not-yet-written.
 */
function createTextSpyCtx() {
  const textCalls: string[] = [];
  const store: Record<string, unknown> = {};
  const ctx = new Proxy(store, {
    get(target, prop: string | symbol) {
      if (prop === 'fillText' || prop === 'strokeText') {
        return (text: string) => {
          textCalls.push(text);
        };
      }
      if (typeof prop === 'string' && prop in target) return target[prop];
      return () => {};
    },
    set(target, prop: string | symbol, value) {
      if (typeof prop === 'string') target[prop] = value;
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, textCalls };
}

function fakeMap(): MlMap {
  return { getCanvas: () => ({ clientWidth: 1080, width: 1080 }) } as unknown as MlMap;
}

describe('composeOverlays — baked attribution is the ONE permitted pixel-text exception (spec §2.3)', () => {
  it('draws ONLY the attribution string when chrome is clean (text.show=false, as clips force)', async () => {
    const { ctx, textCalls } = createTextSpyCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as unknown as RenderingContext);

    const base = document.createElement('canvas');
    // Poster text fields are populated with real content — if a future change
    // un-guards `drawPosterText` (or adds any other text draw) instead of
    // gating strictly on `text.show`, this would produce EXTRA fillText
    // calls and the assertion below would fail.
    const opts: ComposeOpts = {
      width: 1080,
      height: 1920,
      markers: [],
      text: {
        city: 'Hanoi',
        country: 'Vietnam',
        coords: "21.03°N 105.85°E",
        show: false,
        showCity: true,
        showCountry: true,
        showCoords: true,
        font: getFont('Space Grotesk'),
        color: '#ffffff',
      },
    };

    await composeOverlays(fakeMap(), base, opts);

    expect(textCalls).toEqual([ATTRIBUTION_TEXT]);
  });

  it('pins the attribution CONTENT to a literal, not just to whatever the constant happens to say', () => {
    // Khoá ở test trên ràng buộc SỐ LƯỢNG lệnh vẽ chữ (đúng một), nhưng nó so
    // `textCalls` với chính hằng `ATTRIBUTION_TEXT` được import từ file đang
    // kiểm — một so sánh TỰ THAM CHIẾU. Đổi nội dung hằng đó thành chuỗi bất kỳ
    // mà vẫn giữ đúng một lệnh vẽ thì test kia vẫn xanh, và ngoại lệ pixel-text
    // duy nhất được cấp phép sẽ chở một chuỗi không còn là dòng attribution.
    //
    // Ngoại lệ đó tồn tại VÌ nghĩa vụ giấy phép, nên nội dung của nó là một
    // phần của bất biến, không phải chi tiết cài đặt. Ghim bằng literal độc lập.
    expect(ATTRIBUTION_TEXT).toBe('© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre');

    // Bốn bên phải được ghi công đứng riêng, để một lần "gọn hoá" chuỗi làm rơi
    // mất một bên vẫn bị chặn kể cả khi ai đó cập nhật literal ở trên cho khớp.
    for (const credit of ['OpenStreetMap', 'OpenMapTiles', 'OpenFreeMap', 'MapLibre']) {
      expect(ATTRIBUTION_TEXT).toContain(credit);
    }
  });
});
