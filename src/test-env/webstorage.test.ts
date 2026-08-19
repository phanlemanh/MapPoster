/**
 * Bốn phép đo của gói test-env-webstorage: E1, E2, E5, E3.
 * (E6 cách ly nằm ở webstorage-isolation.test.ts, E4 ở script suite-coverage.)
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { installWebStorageFallback, makeMemoryStorage, type WebStorageProbe } from '../../vitest.setup';

const CUA_TOI = 'sentinel-webstorage';
const CUA_TEP_KIA = 'sentinel-isolation';

describe('vá Web Storage cho làn test', () => {
  // E6 (AC-5) — nửa còn lại của cặp cách ly; xem webstorage-isolation.test.ts.
  it('bắt đầu bằng một kho RỖNG, không thấy khoá của tệp khác', () => {
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem(CUA_TEP_KIA)).toBeNull();
    localStorage.setItem(CUA_TOI, 'đã ghi');
  });

  // E1 (AC-1) — cài khi thiếu, VÀ đúng ngữ nghĩa Web Storage.
  it('thiếu kho lưu: cài vào, và kho đó cư xử đúng như bản thật', () => {
    const target: Record<string, unknown> = {};
    const probe = installWebStorageFallback(target);
    expect(probe.patched).toBe(true);

    const ls = target.localStorage as Storage;
    ls.setItem('n', 1 as unknown as string);
    expect(ls.getItem('n')).toBe('1');            // ép chuỗi như bản thật
    expect(typeof ls.getItem('n')).toBe('string');
    expect(ls.getItem('chua-dat')).toBeNull();     // null, KHÔNG undefined
    expect(ls.length).toBe(1);
    expect(ls.key(0)).toBe('n');
    ls.removeItem('n');
    expect(ls.length).toBe(0);
    expect(ls.getItem('n')).toBeNull();
  });

  // E2 (AC-2) — đối chứng dương: có rồi thì KHÔNG đụng.
  it('đã có kho lưu thật: không thay, giữ nguyên đúng object cũ', () => {
    const sanCo = makeMemoryStorage();
    const target: Record<string, unknown> = { localStorage: sanCo };
    const probe = installWebStorageFallback(target);
    expect(probe.patched).toBe(false);
    expect(probe.reason.length).toBeGreaterThan(10);
    expect(target.localStorage).toBe(sanCo);       // đồng nhất tham chiếu
  });

  // E5 (AC-1b) — đo CHÍNH nhánh mà setup đã chọn trong lượt chạy này.
  it('mốc của lượt chạy này phơi ra nhánh đã chọn, và mốc đó nhất quán với thực tế', () => {
    const probe = (globalThis as unknown as { __webstorageProbe?: WebStorageProbe }).__webstorageProbe;
    expect(probe, 'tệp setup phải ghi mốc').toBeDefined();
    expect(typeof probe!.patched).toBe('boolean');
    expect(probe!.reason.length).toBeGreaterThan(10);
    // Quan hệ, không phải sự có mặt: dù nhánh nào thì kho lưu hiện hành cũng
    // phải dùng được — mốc báo "chưa vá" mà kho vẫn hỏng là mốc nói dối.
    const ls = (globalThis as unknown as { localStorage?: Storage }).localStorage;
    expect(typeof ls?.getItem).toBe('function');
    expect(typeof ls?.setItem).toBe('function');
  });

  // E3 (AC-3) — bản vá không được lọt sang mã sản phẩm, có đối chứng dương.
  it('không tệp sản phẩm nào nhập bản vá — và bộ quét chứng minh nó biết bắt', () => {
    const ROOT = path.resolve(__dirname, '..', '..');
    const NHAP = /(?:import\s+(?:type\s+)?[^;]*from\s*['"]|require\(\s*['"]|import\(\s*['"])([^'"]*vitest\.setup)['"]/;
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const e of readdirSync(dir)) {
        const p = path.join(dir, e);
        if (statSync(p).isDirectory()) {
          if (e === 'node_modules' || e === 'test-env') continue;
          walk(p);
        } else if (/\.tsx?$/.test(e) && !/\.(test|spec)\.tsx?$/.test(e)) files.push(p);
      }
    };
    walk(path.join(ROOT, 'src'));
    walk(path.join(ROOT, 'mcp-server', 'src'));

    // Chốt chống xanh-rỗng: quét 0 tệp rồi báo sạch là không đo gì cả.
    expect(files.length, 'phải quét được ít nhất vài chục tệp sản phẩm').toBeGreaterThan(20);
    const pham = files.filter((f) => NHAP.test(readFileSync(f, 'utf8')));
    expect(pham, `tệp sản phẩm nhập bản vá: ${pham.join(', ')}`).toHaveLength(0);

    // ĐỐI CHỨNG DƯƠNG: cùng bộ quét, trên bốn dạng nhập, phải bắt được hết.
    const viPham = [
      "import { makeMemoryStorage } from '../vitest.setup';",
      "import type { WebStorageProbe } from '../../vitest.setup';",
      "const s = require('../vitest.setup');",
      "const m = await import('../../vitest.setup');",
    ];
    for (const v of viPham) expect(NHAP.test(v), `phải bắt được: ${v}`).toBe(true);
  });
});
