/**
 * Bất biến CẤU TRÚC cho đường đi của URL tile vệ tinh (AC-10).
 *
 * Vì sao cần một phép quét mã chứ không phải một ca hành vi: lỗi này KHÔNG đỏ
 * ở bất kỳ test hành vi nào. `assertBasemap` đọc env Node của mcp-server và
 * ném đúng lúc; `buildMapStyle` nhận `satelliteTiles` và dựng raster đúng lúc.
 * Cả hai đầu đều "đúng" — chỉ có ĐƯỜNG NỐI giữa chúng là đứt, vì trang render
 * là một bundle đã build và mọi `import.meta.env.VITE_*` bị nung lúc
 * `vite build`. Kết quả: `basemap:'satellite'` qua được cửa kiểm ở server rồi
 * im lặng rơi về vector ở trang. Đã xảy ra thật trong lúc soạn gói.
 *
 * Chạy: npx tsx _acceptance/satellite-basemap/scripts/basemap-invariants.ts
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..', '..', '..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');
/** Bóc comment: phép quét đo MÃ, không đo văn xuôi giải thích chính nó. */
const code = (p: string) =>
  read(p)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((l) => {
      const s = l.trim();
      return !s.startsWith('//') && !s.startsWith('*');
    })
    .join('\n');

const fails: string[] = [];
const check = (ok: boolean, msg: string) => {
  console.log(`  ${ok ? '✓' : '✗'} ${msg}`);
  if (!ok) fails.push(msg);
};

// 1. Đường đi qua config phải TỒN TẠI ở cả bốn chặng.
check(/satelliteTiles\?:\s*string/.test(code('src/render/renderConfig.ts')), 'RenderConfig khai satelliteTiles');
check(/satelliteTiles:\s*params\.basemap/.test(code('mcp-server/src/resolveConfig.ts')), 'resolveConfig điền satelliteTiles từ env Node');
check(/satelliteTiles:\s*cfg\.satelliteTiles/.test(code('src/render/applyRenderConfig.ts')), 'applyRenderConfig đẩy satelliteTiles vào store');
check(/satelliteTiles\?:\s*string/.test(code('src/store/usePosterStore.ts')), 'store giữ satelliteTiles');

// 2. Và MapView phải ƯU TIÊN giá trị từ config, không phải env lúc build.
//    Thứ tự trong `a ?? b` là toàn bộ nội dung của bất biến này: đảo lại thì
//    một bản build có VITE_SATELLITE_TILES sẽ ghi đè URL mà server gửi tới.
const mv = code('src/components/MapView.tsx');
const uses = [...mv.matchAll(/satelliteTiles:\s*([^,\n]+)/g)].map((m) => m[1].trim());
check(uses.length >= 2, `MapView truyền satelliteTiles ở ${uses.length} chỗ gọi buildMapStyle (cần >= 2)`);
// Chấp cả hai cách đọc store: `satelliteTiles` (đã destructure) và
// `s.satelliteTiles` (đọc thẳng từ snapshot trong effect khởi tạo map). Bản
// đầu của phép quét này chỉ khớp dạng thứ nhất và báo hỏng oan — phép đo sai,
// không phải mã sai. Điều BẤT BIẾN là giá trị từ store đứng TRƯỚC `??`, chứ
// không phải nó được viết theo cú pháp nào.
check(
  uses.every((u) => /^(s\.)?satelliteTiles\s*\?\?/.test(u)),
  `mọi chỗ đều ưu tiên giá trị từ store trước env build — thấy: ${JSON.stringify(uses)}`,
);

// 3. Và env lúc build KHÔNG được là đường duy nhất.
check(
  !/import\.meta\.env\.VITE_SATELLITE_TILES/.test(code('src/render/main.tsx')),
  'trang render KHÔNG đọc VITE_SATELLITE_TILES (nó là bundle đã build — biến đó bị nung lúc vite build)',
);

if (fails.length) {
  console.error(`\nbasemap-invariants: ${fails.length} bất biến hỏng`);
  process.exit(1);
}
console.log('\nbasemap-invariants: mọi bất biến đứng');
