import { describe, it, expect, vi } from 'vitest';
import type { Map as MlMap } from 'maplibre-gl';
import { composeOverlays, ATTRIBUTION_TEXT, type ComposeOpts } from './export';
import { getFont } from '../data/fonts';
import { applyRenderConfig } from '../render/applyRenderConfig';
import { usePosterStore } from '../store/usePosterStore';
import type { RenderConfig } from '../render/renderConfig';
import { formatCoords } from './format';

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

/**
 * Cùng phép dựng khối `text` mà trang render dùng thật (`textFromStore` ở
 * src/render/main.tsx): ĐỌC từ store sau `applyRenderConfig`, không tự khai
 * `show`. Đây là mắt xích mà AC-9 dựa vào — `chrome:'clean' ⇒ showText false`
 * (applyRenderConfig.ts:24). Khai thẳng `show: false` ở test thì mắt xích ấy
 * KHÔNG được đi qua: đổi hằng thành `showText = true` vẫn để lane này xanh
 * trong khi chữ poster đã bị nướng vào pixel clip.
 */
function textFromStore(): ComposeOpts['text'] {
  const s = usePosterStore.getState();
  return {
    city: s.location.name,
    country: s.location.country,
    coords: formatCoords(s.location.lat, s.location.lng),
    show: s.showText,
    showCity: s.showCity,
    showCountry: s.showCountry,
    showCoords: s.showCoords,
    font: getFont(s.font),
    color: '#ffffff',
  };
}

const posterCfg = (chrome: RenderConfig['chrome']): RenderConfig => ({
  camera: { center: [105.85, 21.03], zoom: 13 },
  size: { width: 1080, height: 1920 },
  theme: 'midnight-blue',
  chrome,
  // Nội dung chữ poster ĐƯỢC điền thật: nếu một thay đổi tương lai bỏ chốt
  // `text.show` (hoặc thêm một lệnh vẽ chữ khác), sẽ có thêm fillText và
  // khẳng định dưới đây đỏ.
  place: { name: 'Hanoi', country: 'Vietnam', lat: 21.03, lng: 105.85 },
});

describe('composeOverlays — baked attribution is the ONE permitted pixel-text exception (spec §2.3)', () => {
  it("chrome:'clean' ⇒ chữ DUY NHẤT lên canvas là attribution — đi qua đúng mắt xích chrome→showText", async () => {
    const { ctx, textCalls } = createTextSpyCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as unknown as RenderingContext);

    // KHÔNG đặt `show` bằng tay: `chrome` là thứ duy nhất được khai ở đây.
    applyRenderConfig(posterCfg('clean'));
    expect(usePosterStore.getState().showText, 'chrome clean phải tắt chữ poster').toBe(false);

    const opts: ComposeOpts = { width: 1080, height: 1920, markers: [], text: textFromStore() };
    await composeOverlays(fakeMap(), document.createElement('canvas'), opts);

    expect(textCalls).toEqual([ATTRIBUTION_TEXT]);
  });

  it("ĐỐI CHỨNG: chrome:'poster' đi qua CÙNG đường và vẽ THÊM chữ — nên ca 'clean' không xanh vì canvas câm", async () => {
    // Không có nửa này, một `composeOverlays` không vẽ gì cả (hoặc một spy hỏng
    // không ghi nhận được lệnh nào) vẫn làm ca trên xanh. Nửa này bắt buộc cùng
    // đường mã ấy PHẢI sinh ra chữ khi chrome cho phép.
    const { ctx, textCalls } = createTextSpyCtx();
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ctx as unknown as RenderingContext);

    applyRenderConfig(posterCfg('poster'));
    expect(usePosterStore.getState().showText).toBe(true);

    const opts: ComposeOpts = { width: 1080, height: 1920, markers: [], text: textFromStore() };
    await composeOverlays(fakeMap(), document.createElement('canvas'), opts);

    expect(textCalls).toContain(ATTRIBUTION_TEXT);
    expect(textCalls.length, 'chrome poster phải vẽ chữ poster NGOÀI attribution').toBeGreaterThan(1);
    expect(textCalls.join('\n')).toContain('Hanoi');
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
