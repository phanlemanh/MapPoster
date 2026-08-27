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
 * bốn mẫu phải báo đủ bốn, và một fixture SẠCH phải báo không. Không có hai
 * chốt đó, một biểu thức hỏng sẽ báo "sạch" trên mọi đầu vào — đúng lớp lỗi mà
 * chính hợp đồng này tồn tại để chặn.
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
const CLEAN = [
  'const buildMapStyle = vi.fn((_args: BuildStyleArgs) => ({ version: 8 }));',
  'const arg = buildMapStyle.mock.calls[0][0];',
  'return r.compile(ex as never);',   // ép ở ĐỐI SỐ — không phải mẫu bịt miệng
].join('\n');
say(hits(DIRTY).length === 4, `đối chứng dương: fixture 4 mẫu → bắt ${hits(DIRTY).length} (${hits(DIRTY).join(', ') || 'không có'})`);
say(hits(CLEAN).length === 0, `đối chứng âm: fixture sạch → bắt ${hits(CLEAN).length} (phải là 0)`);
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
}

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures} khẳng định đỏ`);
process.exit(failures === 0 ? 0 : 1);
