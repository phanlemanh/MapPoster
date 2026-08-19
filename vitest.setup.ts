/**
 * Vá thiếu Web Storage cho LÀN TEST — không phải mã sản phẩm.
 *
 * Đề bài (2026-08-19): Node trên máy dev tự nâng 24.16 → 26.7 giữa phiên. Node
 * 26 khai sẵn `localStorage` toàn cục ở dạng getter trả `undefined` khi thiếu
 * cờ `--localstorage-file`, và getter đó che luôn bản của jsdom — đo được:
 * `window.localStorage === globalThis.localStorage` và cả hai `undefined`. Hệ
 * quả: 24 ca / 4 tệp đỏ, tất cả đều chạm kho trạng thái có lưu.
 *
 * Ba điều bản vá này CỐ Ý làm, mỗi điều chống một cách nó có thể tự phản bội:
 *
 * 1. CÓ ĐIỀU KIỆN. Môi trường đã có kho lưu dùng được thì KHÔNG đụng vào. Đè
 *    lên là tự tay đổi thứ đang đo — test sẽ xanh trên một kho không phải kho
 *    mà sản phẩm dùng.
 * 2. ĐỂ LẠI MỐC. Nhánh đã chọn phải quan sát được từ bên ngoài, vì một bản vá
 *    cài vô điều kiện cũng làm mọi phép đo KẾT QUẢ xanh; chỉ phép đo nhìn thẳng
 *    vào nhánh mới phân biệt được.
 * 3. ĐÚNG NGỮ NGHĨA. Kho giả ép giá trị về chuỗi và trả `null` cho khoá vắng,
 *    y như Web Storage thật. Một kho dễ tính hơn sẽ che đúng lớp lỗi nó bảo vệ:
 *    sản phẩm quên `JSON.stringify` vẫn xanh trong test, còn trình duyệt thật
 *    trả '[object Object]' và kho trạng thái vỡ.
 */

export interface WebStorageProbe {
  patched: boolean;
  reason: string;
}

/** Kho lưu trong bộ nhớ theo đúng ngữ nghĩa Web Storage. */
export function makeMemoryStorage(): Storage {
  const m = new Map<string, string>();
  const api = {
    get length() {
      return m.size;
    },
    key(i: number): string | null {
      return [...m.keys()][i] ?? null;
    },
    getItem(k: string): string | null {
      // null chứ KHÔNG undefined: nhánh `=== null` của bên đọc phải chạy được.
      return m.has(String(k)) ? m.get(String(k))! : null;
    },
    setItem(k: string, v: unknown): void {
      // Ép chuỗi như bản thật. Bỏ bước này là kho giả dễ tính hơn kho thật.
      m.set(String(k), String(v));
    },
    removeItem(k: string): void {
      m.delete(String(k));
    },
    clear(): void {
      m.clear();
    },
  };
  return api as unknown as Storage;
}

const usable = (s: unknown): boolean =>
  !!s && typeof (s as Storage).getItem === 'function' && typeof (s as Storage).setItem === 'function';

/**
 * Cài kho lưu dự phòng vào `target` KHI VÀ CHỈ KHI nó chưa có kho dùng được.
 * Trả về mốc mô tả nhánh đã chọn — đây là thứ phép đo nhìn vào.
 */
export function installWebStorageFallback(target: Record<string, unknown>): WebStorageProbe {
  if (usable(target.localStorage)) {
    return { patched: false, reason: 'môi trường đã có kho lưu dùng được — không đụng vào' };
  }
  const define = (name: string) =>
    Object.defineProperty(target, name, { value: makeMemoryStorage(), configurable: true, writable: true });
  define('localStorage');
  define('sessionStorage');
  return {
    patched: true,
    reason: `môi trường không có kho lưu dùng được (runtime ${typeof process !== 'undefined' ? process.version : 'không rõ'}) — đã cài kho trong bộ nhớ`,
  };
}

// Chạy một lần cho MỖI tệp test (vitest nạp setup theo từng tệp), nên kho lưu
// của mỗi tệp là một object mới — không tệp nào thấy khoá của tệp khác.
const probe = installWebStorageFallback(globalThis as unknown as Record<string, unknown>);
(globalThis as unknown as { __webstorageProbe: WebStorageProbe }).__webstorageProbe = probe;
