import { describe, it, expect } from 'vitest';
import { sliceRing } from './motionMath';
import { validateMotionScript } from './motionScript';

/**
 * `routeDraw` — phần thuần hàm, kiểm được không cần trình duyệt.
 *
 * Phần còn lại (`applyRouteAt` / `verifyAndReapplyRouteAt` trong `main.tsx`)
 * cần một map thật nên nằm ở lane e2e; ở đây chốt ba thứ mà một lỗi trong đó
 * sẽ đi thẳng ra pixel mà không lane nào khác bắt:
 *   1. hàm cắt dùng chung có thật sự chạy đúng trên chuỗi toạ độ HỞ (tuyến),
 *      không chỉ trên vòng KHÉP (ranh giới) — nó ra đời cho vòng;
 *   2. bất biến `routeIndex < routeCount` vẫn từ chối đúng chỗ sau khi
 *      `motionContextOf` thôi cho nó ăn hằng số 0;
 *   3. khế ước p>=1 trả về THAM CHIẾU GỐC — thứ giữ đuôi clip không tích luỹ
 *      sai số, và là điều kiện để `restBase` cache được.
 */

const LINE: [number, number][] = [
  [105.850, 21.020],
  [105.855, 21.030],
  [105.860, 21.040],
  [105.865, 21.050],
];

describe('sliceRing trên một chuỗi toạ độ HỞ (tuyến), không phải vòng khép', () => {
  it('p<=0 chưa vẽ gì; p>=1 trả về ĐÚNG tham chiếu gốc', () => {
    expect(sliceRing(LINE, 0)).toBeNull();
    expect(sliceRing(LINE, -1)).toBeNull();
    // `toBe` chứ không `toEqual`: khế ước là tham chiếu GỐC. Một bản sao bằng
    // giá trị vẫn làm `toEqual` xanh trong khi phá đúng tính chất mà đuôi clip
    // dựa vào (không tái dựng dữ liệu ở mọi khung sau khi vẽ xong).
    expect(sliceRing(LINE, 1)).toBe(LINE);
    expect(sliceRing(LINE, 1.5)).toBe(LINE);
  });

  it('điểm đầu giữ nguyên và độ dài tăng đơn điệu theo p', () => {
    let prev = 0;
    for (const p of [0.1, 0.25, 0.5, 0.75, 0.9]) {
      const s = sliceRing(LINE, p)!;
      expect(s[0]).toEqual(LINE[0]);
      const len = s.reduce((acc, c, i) => (i === 0 ? 0 : acc + Math.hypot(c[0] - s[i - 1][0], c[1] - s[i - 1][1])), 0);
      expect(len, `p=${p} phải dài hơn p trước`).toBeGreaterThan(prev);
      prev = len;
    }
  });

  it('điểm cuối được NỘI SUY, không nhảy theo đỉnh — nếu không, tuyến sẽ giật từng khúc', () => {
    // p=0.5 trên hình học này rơi vào giữa một cạnh, nên điểm cuối phải là một
    // toạ độ KHÔNG có trong đầu vào. Một cách hiện thực "cắt theo đỉnh gần
    // nhất" vẫn cho độ dài tăng đơn điệu (ca trên vẫn xanh) nhưng ra một tuyến
    // nhảy giật; chỉ ca này bắt được.
    const s = sliceRing(LINE, 0.5)!;
    const last = s[s.length - 1];
    const isVertex = LINE.some((v) => v[0] === last[0] && v[1] === last[1]);
    expect(isVertex, `điểm cuối ${JSON.stringify(last)} trùng một đỉnh ⇒ không nội suy`).toBe(false);
  });
});

describe('bất biến routeIndex sau khi motionContextOf thôi trả hằng số 0', () => {
  const script = {
    fps: 12,
    durationSec: 4,
    restAtSec: 2.8,
    camera: [{ t: 0, center: [105.85, 21.03] as [number, number], zoom: 12 }],
    tracks: [{ kind: 'routeDraw' as const, t0: 0.5, t1: 2.5 }],
  };
  const ctx = (routeCount: number) => ({ regionCount: 0, routeCount, pointCount: 0 });

  it('từ chối khi config KHÔNG mang tuyến nào', () => {
    expect(() => validateMotionScript(script, ctx(0))).toThrow(/routeDraw routeIndex 0 but config has 0 route/);
  });

  it('CHẤP NHẬN khi có tuyến — đây là thứ hằng số 0 từng chặn', () => {
    expect(() => validateMotionScript(script, ctx(1))).not.toThrow();
  });

  it('vẫn từ chối một routeIndex trỏ ra ngoài — luật không bị nới, chỉ được cho ăn số thật', () => {
    const s = { ...script, tracks: [{ kind: 'routeDraw' as const, t0: 0.5, t1: 2.5, routeIndex: 2 }] };
    expect(() => validateMotionScript(s, ctx(2))).toThrow(/routeIndex 2 but config has 2 route/);
  });

  it('thông điệp lỗi KHÔNG còn nói "reserved for v2"', () => {
    // Câu đó đúng khi routeDraw bị chặn cứng; nay nó sai và sẽ dẫn sai người
    // đọc log. Ca này giữ cho nó không quay lại cùng một lần copy-paste.
    let msg = '';
    try {
      validateMotionScript(script, ctx(0));
    } catch (e) {
      msg = (e as Error).message;
    }
    expect(msg).not.toMatch(/reserved for v2/);
  });
});
