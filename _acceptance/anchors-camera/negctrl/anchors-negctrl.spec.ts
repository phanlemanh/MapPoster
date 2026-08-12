/**
 * NEGATIVE CONTROL cho E8 (nửa suppression của AC-5) — do GRADER viết, không
 * phải một phần của bộ e2e sản phẩm.
 *
 * E8 khẳng định: gọi `anchors()` xong, khung đuôi clip vẫn BYTE-IDENTICAL.
 * Câu hỏi của vòng chấm: phép so `after === before` đó CÓ THỂ đỏ không, hay nó
 * xanh với mọi thứ?
 *
 * Ở đây ta mô phỏng đúng cái mà một `anchors()` hư hỏng sẽ làm — `map.jumpTo`
 * thẳng vào MapLibre, KHÔNG qua `setCamera` (vì `setCamera` chủ động xoá
 * `restBase`, nên khung sau sẽ được dựng lại từ camera đúng và phép so mất
 * nghĩa). Với `restBase` còn nguyên trong cache, khung đuôi tái dùng ảnh nền cũ
 * và chỉ vẽ lại overlay bằng camera HIỆN TẠI — nên byte PHẢI lệch.
 *
 * Kỳ vọng của negative control: `after !== before`. Nếu nó vẫn bằng nhau thì
 * phép so của E8 không phân biệt được gì và E8 phải bị đánh trượt.
 */
import { test, expect } from '@playwright/test';
import type { MapPosterApi } from '../../../src/render/main';

type MapPosterWindow = { __mapposter: MapPosterApi };

function b64url(obj: unknown): string {
  return Buffer.from(JSON.stringify(obj)).toString('base64url');
}

function anchorsConfig() {
  return {
    camera: { center: [106.7, 10.78], zoom: 13 },
    size: { width: 320, height: 568 },
    theme: 'midnight-blue',
    chrome: 'clean',
    place: { name: 'M', country: 'VN', lat: 10.78, lng: 106.7 },
    markers: [
      { lng: 106.7, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 },
      { lng: 108.2, lat: 10.78, icon: 'pin', color: '#f43f5e', size: 32 },
    ],
    motion: {
      fps: 12,
      durationSec: 2,
      restAtSec: 1.4,
      camera: [
        { t: 0, center: [106.7, 10.78], zoom: 11.5 },
        { t: 1.1, center: [106.7, 10.78], zoom: 13, ease: 'easeInOut' },
      ],
      tracks: [{ kind: 'pinDrop', at: 1.1, dur: 0.3 }],
    },
  };
}

test('NEG-E8: một anchors() có jumpTo LÀM LỆCH byte khung đuôi (phép so của E8 phân biệt được)', async ({ page }) => {
  await page.goto('/render.html?config=' + b64url(anchorsConfig()));
  await page.waitForFunction(() => Boolean((window as unknown as { __mapposter?: unknown }).__mapposter), null, { timeout: 15_000 });

  const { before, after } = await page.evaluate(async () => {
    const api = (window as unknown as MapPosterWindow).__mapposter;
    await api.ready;
    const before = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    // ĐÂY là mutation: đúng thứ một `anchorsAt(t)` / một `anchors()` hư hỏng
    // buộc phải làm để chiếu — dời camera mà KHÔNG xoá `restBase`.
    (window as unknown as { __map: { jumpTo(o: unknown): void } }).__map.jumpTo({ center: [106.75, 10.82], zoom: 13 });
    const after = await api.renderMotionFrame(1.4, { pulsePhase: 0 });
    return { before: before.dataUrl, after: after.dataUrl };
  });

  expect(after).not.toBe(before);
});
