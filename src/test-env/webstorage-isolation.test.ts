/**
 * E6 (AC-5) — kho lưu không rò trạng thái giữa các tệp test.
 *
 * ĐÍNH CHÍNH 2026-08-19 sau khi phá thử: bản đầu của phép đo này là HẰNG ĐÚNG.
 * Nó ghi một khoá sentinel ở tệp này rồi kiểm ở tệp kia — nhưng cách ly ấy
 * KHÔNG do bản vá đảm bảo, nó do vitest cô lập module theo từng tệp. Biến kho
 * lưu thành singleton dùng chung ở mức module rồi chạy lại: phép đo cũ vẫn
 * xanh. Một phép đo không thể đỏ vì lý do nó khai là phép đo không đo gì.
 *
 * Nên nó đo lại đúng thứ CÓ THỂ MẤT: chính cái công tắc cô lập của bộ chạy
 * test. Tắt công tắc đó thì bảo đảm bay hơi — và khi ấy phép đo này đỏ.
 */
import { describe, it, expect } from 'vitest';
import cfg from '../../vitest.config';

const CUA_TOI = 'sentinel-isolation';
const CUA_TEP_KIA = 'sentinel-webstorage';

describe('cách ly kho lưu giữa các tệp test', () => {
  it('bộ chạy test vẫn cô lập module theo từng tệp — thứ mà cách ly dựa vào', () => {
    const t = (cfg as { test?: { isolate?: boolean; pool?: string } }).test ?? {};
    // `isolate` mặc định là true; chỉ khai tường minh false mới phá bảo đảm.
    expect(t.isolate, 'tắt isolate là bỏ cách ly giữa các tệp test').not.toBe(false);
  });

  it('kho lưu của tệp này bắt đầu RỖNG, không thấy khoá của tệp kia', () => {
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem(CUA_TEP_KIA)).toBeNull();
    localStorage.setItem(CUA_TOI, 'đã ghi');
    expect(localStorage.getItem(CUA_TOI)).toBe('đã ghi');
  });
});
