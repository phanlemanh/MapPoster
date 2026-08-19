/**
 * E6 (AC-5) — kho lưu KHÔNG rò trạng thái giữa các tệp test.
 *
 * Cặp với `webstorage.test.ts`: CẢ HAI tệp cùng ghi một khoá riêng và cùng kiểm
 * rằng khoá của tệp kia không có mặt. Làm cả hai chiều vì thứ tự chạy không
 * đảm bảo — tệp nào chạy sau cũng phải thấy kho rỗng.
 */
import { describe, it, expect } from 'vitest';

const CUA_TOI = 'sentinel-isolation';
const CUA_TEP_KIA = 'sentinel-webstorage';

describe('cách ly kho lưu giữa các tệp test', () => {
  it('bắt đầu bằng một kho RỖNG, không thấy khoá của tệp khác', () => {
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem(CUA_TEP_KIA)).toBeNull();
    localStorage.setItem(CUA_TOI, 'đã ghi');
    expect(localStorage.getItem(CUA_TOI)).toBe('đã ghi');
  });
});
