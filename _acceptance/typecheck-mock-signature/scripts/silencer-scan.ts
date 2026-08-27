/**
 * AC-5 — lượt sửa này KHÔNG chữa bằng cách bịt miệng.
 *
 * `as any` / `@ts-expect-error` / `@ts-ignore` / `as unknown as` đều làm
 * typecheck xanh mà không sửa gì: chúng tắt chính lời cảnh báo đúng. Một bản
 * "chữa" bằng bốn mẫu này sẽ qua được AC-1 và AC-7; chỉ phép đo này bắt được.
 *
 * Phạm vi là các dòng lượt sửa này THÊM VÀO, không phải cả tệp — có chủ đích.
 * Hai tệp đích đã mang sẵn bốn chỗ dùng bốn mẫu ấy từ trước lượt này
 * (`globalThis as unknown as {...}` ở MapView.test.tsx; ba `spec.schema as any`
 * / `res.content.find(...) as any` ở recipes.test.ts). Chúng nằm ngoài phạm vi
 * (xem **Out of scope** của hợp đồng): dọn chúng là một lượt khác, và gộp vào
 * đây thì diff của một bản sửa CI hết đọc được. Đo cả tệp sẽ biến một sự thật
 * có sẵn thành lời buộc tội lượt này — phép đo sai địa chỉ.
 *
 * Bộ quét tự chứng minh nó còn bắt được (đối chứng dương): một fixture CÓ đủ
 * các mẫu phải báo đủ, và một fixture SẠCH phải báo không. Không có hai chốt
 * đó, một biểu thức hỏng sẽ báo "sạch" trên mọi đầu vào — đúng lớp lỗi mà chính
 * hợp đồng này tồn tại để chặn.
 *
 * ── `as never`: phân biệt theo VỊ TRÍ, không cấm theo mặt chữ ────────────────
 * `as never` có hai đời sống trái ngược nhau, và gộp chúng làm một thì hoặc
 * cấm nhầm cách dùng đúng, hoặc bỏ lọt cách dùng sai:
 *
 *   - VỊ TRÍ ĐỐI SỐ — `f(x as never)`. Đây là cách hợp lệ để thoả một tham số
 *     khai `never` có chủ đích (`RecipeSpec.compile: (params: never)`, và
 *     `resolveConfig`). Cả 7 chỗ dùng hiện có trong hai tệp đích đều thuộc dạng
 *     này. Cấm nó là bắt sản phẩm đổi kiểu để chiều lòng một tệp test.
 *   - VỊ TRÍ GIÁ TRỊ — `const x: number = expr as never;`. `never` gán được vào
 *     MỌI kiểu, nên dạng này giặt sạch bất kỳ lỗi kiểu nào. Đây đúng là bịt
 *     miệng, và nó nguy hiểm hơn `as any` vì trông vô hại hơn.
 *
 * Không phải rủi ro giả định: chính lúc dựng `type-probe.ts`, mũi TS2322 đầu
 * tiên viết là `... .basemap as never` — một `as never` ở vị trí giá trị — và
 * nó làm mũi thăm dò KHÔNG BAO GIỜ đỏ được. Fixture bẩn dưới đây giữ nguyên
 * dòng ấy làm ca hồi quy.
 *
 * Phạm vi của mẫu này là TRỌN TỆP (không chỉ dòng thêm) vì hai tệp đích hiện
 * sạch dạng nguy hiểm — giữ được mức đó thì giữ, đừng hạ xuống cho dễ.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');

const PATTERNS: { name: string; src: string }[] = [
  { name: 'as any', src: String.raw`\bas\s+any\b` },
  { name: '@ts-expect-error', src: String.raw`@ts-expect-error` },
  { name: '@ts-ignore', src: String.raw`@ts-ignore` },
  { name: 'as unknown as', src: String.raw`\bas\s+unknown\s+as\b` },
];

const TARGETS = ['src/components/MapView.test.tsx', 'mcp-server/src/recipes.test.ts'];

/**
 * `as never` KHÔNG đứng ngay trước một dấu `)` — tức không ở vị trí đối số.
 * Giới hạn đã biết, nói ra thay vì giấu: một `as never` bọc trong ngoặc ở vế
 * phải phép gán — `const y = (x as never);` — vẫn lọt, vì nó cũng kết thúc
 * bằng `)`. Bộ quét này là lưới mặt chữ, không phải bộ phân tích cú pháp.
 */
const AS_NEVER_VALUE_POS = String.raw`\bas\s+never\s*(?![\s)])`;

/**
 * Bỏ chú thích trước khi quét `as never`. Đo thật lúc dựng: một dòng chú thích
 * chỉ NHẮC TỚI `as never` cũng bị đếm, làm số chỗ vọt từ 1 lên 2. Một bộ quét
 * nổ trên văn xuôi là bộ quét mà người ta sẽ học cách tắt đi — và một phép đo
 * bị tắt thì không đo gì cả. Chú thích không được biên dịch, nên bỏ chúng
 * KHÔNG nới lỏng phép đo: mã bị comment-out vốn đã vô hại.
 */
const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

let failures = 0;
const say = (ok: boolean, msg: string) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures++; };

const hits = (text: string) =>
  PATTERNS.flatMap((p) => (text.match(new RegExp(p.src, 'g')) ?? []).map(() => p.name));

// ── Đối chứng hai chiều: bộ quét phải bắt khi CÓ và im khi KHÔNG ──────────────
const DIRTY = [
  'const a = x as any;',
  '// @ts-expect-error nghỉ đi trình biên dịch',
  '// @ts-ignore cũng nghỉ luôn',
  'const b = y as unknown as Foo;',
].join('\n');
// Ca hồi quy THẬT: đúng dòng đã làm mũi TS2322 của type-probe.ts không bao giờ
// đỏ được, cho tới khi đối chứng mã-lỗi bắt được nó.
const DIRTY_NEVER = [
  'const _p1: number = buildMapStyle.mock.calls[0][0].basemap as never; void _p1;',
  'const z: Foo = bar as never;',
].join('\n');
const CLEAN_NEVER = [
  'return r.compile(ex as never);',
  'await expect(resolveConfig(compiled as never)).rejects.toThrow(KEY);',
  "const compiled = r.compile({ ...(r.example as object), basemap: 'satellite' } as never);",
].join('\n');
const CLEAN = [
  'const buildMapStyle = vi.fn((_args: BuildStyleArgs) => ({ version: 8 }));',
  'const arg = buildMapStyle.mock.calls[0][0];',
  'return r.compile(ex as never);',   // ép ở ĐỐI SỐ — không phải mẫu bịt miệng
].join('\n');
const nverHits = (text: string) => text.match(new RegExp(AS_NEVER_VALUE_POS, 'g')) ?? [];

say(hits(DIRTY).length === 4, `đối chứng dương: fixture 4 mẫu → bắt ${hits(DIRTY).length} (${hits(DIRTY).join(', ') || 'không có'})`);
say(hits(CLEAN).length === 0, `đối chứng âm: fixture sạch → bắt ${hits(CLEAN).length} (phải là 0)`);
say(nverHits(stripComments(DIRTY_NEVER)).length === 2, `đối chứng dương «as never» vị trí GIÁ TRỊ → bắt ${nverHits(stripComments(DIRTY_NEVER)).length}/2 (gồm ca hồi quy của type-probe)`);
say(nverHits(stripComments(CLEAN_NEVER)).length === 0, `đối chứng âm «as never» vị trí ĐỐI SỐ → bắt ${nverHits(stripComments(CLEAN_NEVER)).length} (phải là 0 — đây là cách dùng hợp lệ)`);
// Chú thích chỉ NHẮC TỚI as never không được tính — ca hồi quy của chính lỗi trên.
const COMMENT_ONLY = '// mũi thử: as never ở vị trí giá trị thì phải đỏ';
say(nverHits(stripComments(COMMENT_ONLY)).length === 0, `đối chứng âm: chú thích nhắc tới «as never» → bắt ${nverHits(stripComments(COMMENT_ONLY)).length} (phải là 0 — văn xuôi không phải mã)`);
if (failures > 0) { console.log('\nFAILED — bộ quét hỏng, mọi kết luận đều vô nghĩa'); process.exit(1); }

// ── Mốc so: gốc chung với nhánh đích ─────────────────────────────────────────
function baseRef(): string {
  for (const ref of ['origin/main', 'main']) {
    try {
      return execFileSync('git', ['merge-base', 'HEAD', ref], { cwd: ROOT, encoding: 'utf8' }).trim();
    } catch { /* thử ref kế */ }
  }
  // Không giải được mốc so = KHÔNG ĐO ĐƯỢC, không phải "sạch".
  console.log('FAIL  không giải được mốc so (origin/main hoặc main) — phép đo không chạy được');
  process.exit(1);
}
const BASE = baseRef();
console.log(`mốc so: ${BASE}`);

for (const t of TARGETS) {
  say(fs.existsSync(path.join(ROOT, t)), `tệp đích tồn tại: ${t}`);
  const diff = execFileSync('git', ['diff', '--unified=0', BASE, '--', t], { cwd: ROOT, encoding: 'utf8' });
  const added = diff.split('\n').filter((l) => l.startsWith('+') && !l.startsWith('+++')).map((l) => l.slice(1));
  say(added.length > 0, `${t}: có ${added.length} dòng THÊM để quét (0 dòng = không đo được gì)`);
  const found = hits(added.join('\n'));
  say(found.length === 0, `${t}: dòng thêm không mẫu bịt miệng nào (${found.join(', ') || 'sạch'})`);
  if (found.length > 0) {
    added.forEach((l) => { if (PATTERNS.some((p) => new RegExp(p.src).test(l))) console.log(`      + ${l.trim()}`); });
  }

  // `as never` vị trí GIÁ TRỊ — quét TRỌN tệp, không chỉ dòng thêm: hai tệp
  // đích đang sạch dạng này, giữ được mức đó thì giữ.
  const body = stripComments(fs.readFileSync(path.join(ROOT, t), 'utf8'));
  const lines = body.split('\n');
  const bad = lines
    .map((l, i) => ({ l, n: i + 1 }))
    .filter(({ l }) => new RegExp(AS_NEVER_VALUE_POS).test(l));
  const argPos = (body.match(/\bas\s+never\s*\)/g) ?? []).length;
  say(bad.length === 0, `${t}: không «as never» ở vị trí giá trị (${bad.length} chỗ); ${argPos} chỗ ở vị trí đối số — hợp lệ, không tính`);
  bad.forEach(({ l, n }) => console.log(`      ${t}:${n}: ${l.trim()}`));
}

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures} khẳng định đỏ`);
process.exit(failures === 0 ? 0 : 1);
