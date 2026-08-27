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
import ts from 'typescript';
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
 * `as never` — phân loại bằng CHÍNH BỘ PHÂN TÍCH CÚ PHÁP của TypeScript.
 *
 * Đường đi tới đây đáng ghi lại, vì nó là bài học chứ không phải chi tiết:
 * bản đầu dùng phép thử mặt chữ «có `)` ngay sau không» làm đại diện cho «có ở
 * vị trí đối số không». Vòng chấm thứ hai đâm thủng đại diện ấy bốn chỗ. Vá
 * bằng cách lần ngược đếm ngoặc thì thủng tiếp ba chỗ nữa — số dòng lệch vì
 * chú thích nhiều dòng; ngoặc NẰM TRONG chuỗi (`'{z}/{x}/{y}'`, mẫu regex) làm
 * lệch phép đếm và giặt một dòng bịt miệng vào ô "hợp lệ"; rồi bộ xoá ruột
 * chuỗi tự nó lệch pha ở một dấu nháy và nuốt mất một dòng mã THẬT.
 *
 * Ba lần vá, ba lỗ mới: đó là dấu hiệu sai KIẾN TRÚC, không phải sai chi tiết.
 * Thứ đang bị viết tay ở đây là một bộ phân tích từ vựng — mà `typescript` đã
 * nằm sẵn trong devDependencies suốt thời gian đó. Bộ phân tích thật đọc đúng
 * chú thích, chuỗi, template, regex và cho vị trí chính xác, miễn phí.
 *
 * Luật giữ nguyên, chỉ cách đo là đổi:
 *   - `f(x as never)` — ĐỐI SỐ: cách hợp lệ để thoả tham số khai `never` có
 *     chủ đích (`RecipeSpec.compile`, `resolveConfig`).
 *   - `const x: T = expr as never` — GIÁ TRỊ: `never` gán được vào mọi kiểu nên
 *     dạng này giặt sạch mọi lỗi kiểu. Nguy hiểm hơn `as any` vì trông vô hại hơn.
 * Cả hai cú pháp ép kiểu đều được xét: `x as never` và `<never>x`.
 */
/**
 * Số lỗi CÚ PHÁP của một tệp — chốt hỏng-thì-ĐÓNG cho `classifyNever`.
 *
 * Vòng chấm 3 đo được lỗ này: một khối chú thích hay template literal KHÔNG
 * ĐÓNG nuốt trọn phần còn lại của tệp, nên một dòng `as never` nguy hiểm nằm
 * sau đó biến mất khỏi cây cú pháp — và bộ quét bình thản báo "0 chỗ" rồi xanh.
 * Tệp không phân tích được và tệp sạch trông y hệt nhau. Đó là đúng lớp lỗi mà
 * cả hồ sơ này tồn tại để chặn, lần này nằm trong chính cái thước.
 *
 * `transpileModule` + `reportDiagnostics` là API công khai và chỉ chấm CÚ PHÁP
 * (không giải kiểu, không đọc import), nên nó trả lời đúng câu đang hỏi: tệp
 * này có đọc được không. Đo lúc dựng: chú thích không đóng → 1 chẩn đoán và 0
 * cast nhìn thấy; template không đóng → y hệt; ngoặc hỏng → 3 chẩn đoán nhưng
 * bộ phân tích vẫn phục hồi và thấy cast. Chỉ hai ca ĐẦU mới là ca nuốt, và
 * chốt này bắt cả ba.
 *
 * Luật: không parse được thì KHÔNG kết luận "sạch" — cùng nguyên tắc đã dùng
 * cho mốc so ở dưới (không giải được mốc = không đo được, không phải sạch).
 */
function parseErrorCount(rawSrc: string, fileName = 'probe.ts'): number {
  const res = ts.transpileModule(rawSrc, {
    fileName,
    reportDiagnostics: true,
    compilerOptions: {
      target: ts.ScriptTarget.Latest,
      ...(fileName.endsWith('.tsx') ? { jsx: ts.JsxEmit.Preserve } : {}),
    },
  });
  return res.diagnostics?.length ?? 0;
}

function classifyNever(rawSrc: string, fileName = 'probe.ts') {
  const sf = ts.createSourceFile(
    fileName,
    rawSrc,
    ts.ScriptTarget.Latest,
    /* setParentNodes */ true,
    fileName.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const out: { line: number; text: string; arg: boolean }[] = [];

  const isNeverCast = (n: ts.Node): n is ts.AsExpression | ts.TypeAssertion =>
    (ts.isAsExpression(n) || ts.isTypeAssertionExpression(n)) &&
    n.type.kind === ts.SyntaxKind.NeverKeyword;

  const visit = (node: ts.Node) => {
    if (isNeverCast(node)) {
      const parent = node.parent;
      // Vị trí đối số = con TRỰC TIẾP trong danh sách `arguments` của lời gọi.
      // Hỏi thẳng cây cú pháp, nên `f(a as never, b)` (đối số không đứng cuối)
      // và `(x as never)` (ngoặc NHÓM) tự phân biệt được, không cần luật riêng.
      const arg =
        !!parent &&
        (ts.isCallExpression(parent) || ts.isNewExpression(parent)) &&
        (parent.arguments?.some((a) => a === node) ?? false);
      const line = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
      out.push({ line, text: (rawSrc.split('\n')[line - 1] ?? '').trim(), arg });
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);
  return out;
}


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
// đỏ được, cho tới khi đối chứng mã-lỗi bắt được nó. Bốn ca sau là bốn lỗ mà
// vòng chấm thứ hai đâm thủng bản quét đầu — giữ lại làm ca hồi quy.
const CLEAN = [
  'const buildMapStyle = vi.fn((_args: BuildStyleArgs) => ({ version: 8 }));',
  'const arg = buildMapStyle.mock.calls[0][0];',
  'return r.compile(ex as never);',   // ép ở ĐỐI SỐ — không phải mẫu bịt miệng
].join('\n');

const NEVER_CASES: { src: string; arg: boolean; why: string }[] = [
  { src: 'const _p1: number = buildMapStyle.mock.calls[0][0].basemap as never; void _p1;', arg: false, why: 'ca hồi quy type-probe' },
  { src: 'const z: Foo = bar as never;', arg: false, why: 'gán thẳng' },
  { src: 'const _z: number = (someIdentifier as never);', arg: false, why: 'ngoặc NHÓM, không phải lời gọi (lỗ #1 vòng 2)' },
  { src: 'const _y: number = <never>someIdentifier;', arg: false, why: 'cú pháp ép kiểu kia (lỗ #3 vòng 2)' },
  { src: 'return r.compile(ex as never);', arg: true, why: 'đối số cuối' },
  { src: "const compiled = r.compile({ ...(r.example as object), basemap: 'satellite' } as never);", arg: true, why: 'đối số cuối, có ngoặc lồng' },
  { src: 'await expect(resolveConfig(compiled as never)).rejects.toThrow(KEY);', arg: true, why: 'đối số lồng trong lời gọi khác' },
  { src: 'resolveConfig(a as never, b);', arg: true, why: 'đối số KHÔNG đứng cuối (lỗ #2 vòng 2)' },
  { src: "const url = 'https://t.example/{z}/{x}/{y}.jpg'; const _l: number = getRecipe as never;", arg: false, why: 'ngoặc trong CHUỖI không được làm lệch phép đếm (lỗ của bản lần-ngược)' },
  { src: "const s = 'don\\'t'; const _m: number = getRecipe as never;", arg: false, why: 'nháy thoát trong chuỗi không được lệch pha' },
];

for (const c of NEVER_CASES) {
  const got = classifyNever(c.src);
  const ok = got.length === 1 && got[0]!.arg === c.arg;
  say(ok, `phân loại «${c.why}» → ${got.length === 1 ? (got[0]!.arg ? 'ĐỐI SỐ' : 'GIÁ TRỊ') : `${got.length} khớp`} (đúng: ${c.arg ? 'ĐỐI SỐ' : 'GIÁ TRỊ'})`);
}

// Chốt hỏng-thì-ĐÓNG: tệp không parse được phải bị BẮT, không được đi qua như
// tệp sạch. Hai ca dưới là ca NUỐT thật do vòng chấm 3 tìm ra — cast nguy hiểm
// biến mất khỏi cây, nên nếu chỉ nhìn số cast thì cả hai trông "sạch".
const SWALLOWED: { src: string; why: string }[] = [
  { src: 'const a = 1;\n/* mở mà không đóng\nconst _q: number = x as never;', why: 'chú thích không đóng' },
  { src: 'const a = `chưa đóng;\nconst _q: number = x as never;', why: 'template literal không đóng' },
];
for (const c of SWALLOWED) {
  const casts = classifyNever(c.src).length;
  const perr = parseErrorCount(c.src);
  say(casts === 0 && perr > 0,
    `hỏng-thì-đóng «${c.why}»: cast bị nuốt (${casts} thấy được) NHƯNG chẩn đoán cú pháp bắt được (${perr} lỗi)`);
}
say(parseErrorCount('const _q: number = x as never;') === 0, 'đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)');

// Chú thích chỉ NHẮC TỚI as never không được tính — ca hồi quy của lỗi trước.
say(classifyNever('// mũi thử: as never ở vị trí giá trị thì phải đỏ').length === 0,
  'đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)');

// Số dòng phải ĐÚNG kể cả sau một khối chú thích nhiều dòng — lỗ #4 vòng 2.
const LINENO_FIXTURE = ['const a = 1;', '/* khối', 'chú thích', 'ba dòng */', 'const b: number = x as never;'].join('\n');
const lineHit = classifyNever(LINENO_FIXTURE);
say(lineHit.length === 1 && lineHit[0]!.line === 5,
  `số dòng sau khối chú thích nhiều dòng → ${lineHit[0]?.line ?? 'không bắt'} (đúng: 5)`);

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

  // `as never` / `<never>` vị trí GIÁ TRỊ — quét TRỌN tệp, không chỉ dòng thêm:
  // hai tệp đích đang sạch dạng này, giữ được mức đó thì giữ.
  const rawBody = fs.readFileSync(path.join(ROOT, t), 'utf8');
  const perr = parseErrorCount(rawBody, t);
  say(perr === 0, `${t}: phân tích cú pháp sạch (${perr} lỗi) — không parse được thì KHÔNG kết luận "sạch"`);
  if (perr > 0) continue;   // không đo được ≠ sạch
  const all = classifyNever(rawBody, t);
  const bad = all.filter((h) => !h.arg);
  const argPos = all.length - bad.length;
  say(bad.length === 0, `${t}: không «as never» ở vị trí giá trị (${bad.length} chỗ); ${argPos} chỗ ở vị trí đối số — hợp lệ, không tính`);
  bad.forEach((h) => console.log(`      ${t}:${h.line}: ${h.text}`));
}

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures} khẳng định đỏ`);
process.exit(failures === 0 ? 0 : 1);
