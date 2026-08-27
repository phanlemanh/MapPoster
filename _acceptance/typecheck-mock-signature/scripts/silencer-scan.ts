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
 * `as never` — phân loại bằng CHÍNH BỘ KIỂM KIỂU của TypeScript.
 *
 * Đường đi tới đây là bài học lặp ba lần, ghi lại vì nó đáng hơn cả đoạn mã:
 *   - Bản 1 đoán vị trí đối số bằng «có `)` ngay sau không». Vòng chấm 2 đâm
 *     thủng bốn chỗ (ngoặc nhóm, đối số không đứng cuối, `<never>x`, số dòng).
 *   - Bản 2 lần ngược đếm ngoặc. Thủng thêm ba chỗ: chú thích nhiều dòng làm
 *     lệch số dòng; ngoặc NẰM TRONG chuỗi làm lệch phép đếm và GIẶT một dòng
 *     bịt miệng vào ô "hợp lệ"; bộ xoá ruột chuỗi lệch pha nuốt mất mã thật.
 *   - Bản 3 hỏi CÂY CÚ PHÁP. Đúng hết về cấu trúc, nhưng dời chế độ hỏng từ
 *     «đọc nhầm» sang «đọc trống» (vòng 3), và vẫn trượt một lối vòng mà cấu
 *     trúc không thấy được (vòng 4): **bí danh kiểu**.
 *       `type N = never; const x: number = e as N;`
 *     Cây nguyên vẹn, 0 chẩn đoán cú pháp, `tsc` xanh — nên cả AC-5c lẫn E1
 *     đều KHÔNG đỡ. Cú pháp không đủ vì `as N` là `TypeReference`, và chỉ có
 *     bộ KIỂM KIỂU mới biết `N` trỏ về `never`.
 *
 * Nên bản này hỏi bộ kiểm kiểu: `checker.getTypeFromTypeNode(node.type)` rồi
 * xét cờ `TypeFlags.Never`. Nó giải được `never` trực tiếp, bí danh một tầng,
 * bí danh dây chuyền (`type M = N`), và bí danh nhập từ tệp khác — miễn phí,
 * vì đó là việc của chính trình biên dịch. Đo lúc dựng: ~280ms mỗi tệp thật.
 *
 * Luật vị trí giữ nguyên và vẫn hỏi cây cú pháp (đúng chỗ của nó):
 *   - `f(x as never)` — ĐỐI SỐ: cách hợp lệ thoả tham số khai `never` có chủ ý.
 *   - `const x: T = e as never` — GIÁ TRỊ: giặt sạch mọi lỗi kiểu.
 */
/**
 * tsconfig THẬT của project chứa tệp.
 *
 * Vì sao bắt buộc: bản trước dựng `ts.Program` từ MỘT tệp với tuỳ chọn viết
 * tay. Vòng chấm 5 dựng được lối vòng đi TRỌN cổng từ đúng chỗ đó —
 * `declare type NG5 = never;` trong `mcp-server/src/*.d.ts` (tsconfig
 * `include: ["src"]` nên `tsc` thật nạp) rồi `{} as NG5` trong tệp test: trong
 * program một-tệp, `NG5` giải ra KIỂU LỖI, mà kiểu lỗi mang cờ `Any` nên trông
 * y hệt một kiểu vô hại → bộ quét báo "0 chỗ", xanh, và E1..E9 xanh hết.
 *
 * Dựng program theo đúng `fileNames` + `options` của tsconfig thì cái tên ấy
 * giải được thật. Đo lúc dựng: 49 tệp / ~440ms cho mcp-server, 59 tệp / ~320ms
 * cho project web — rẻ hơn nhiều so với một lỗ đi trọn cổng.
 */
const PROJECT_OF = (rel: string) => (rel.startsWith('mcp-server/') ? 'mcp-server/tsconfig.json' : 'tsconfig.app.json');

function loadProject(tsconfigRel: string) {
  const abs = path.join(ROOT, tsconfigRel);
  const raw = ts.readConfigFile(abs, ts.sys.readFile);
  if (raw.error) {
    console.log(`FAIL  không đọc được ${tsconfigRel} — phép đo không chạy được`);
    process.exit(1);
  }
  return ts.parseJsonConfigFileContent(raw.config, ts.sys, path.dirname(abs));
}

/**
 * Thu mọi chỗ ép về `never`, VÀ đếm những tên kiểu KHÔNG giải được.
 *
 * Tên không giải được là chỗ nguy hiểm nhất, vì `getTypeFromTypeNode` trả kiểu
 * lỗi mang cờ `Any` — im lặng, trông vô hại, không phải `never`. Đó chính là
 * cơ chế của lối vòng vòng 5. Nên luật «không đo được ≠ sạch» của AC-5c phải
 * áp cả ở tầng KIỂM KIỂU, không chỉ ở tầng cú pháp: đếm riêng và ngã to.
 */
function collectNever(program: ts.Program, sf: ts.SourceFile, rawSrc: string) {
  const checker = program.getTypeChecker();
  const hits: { line: number; text: string; arg: boolean }[] = [];
  const typeNodes: { node: ts.TypeNode; start: number; end: number }[] = [];
  const lineOf = (n: ts.Node) => sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1;

  const visit = (node: ts.Node) => {
    if (ts.isAsExpression(node) || ts.isTypeAssertionExpression(node)) {
      typeNodes.push({ node: node.type, start: node.type.getStart(sf), end: node.type.getEnd() });
      if ((checker.getTypeFromTypeNode(node.type).flags & ts.TypeFlags.Never) !== 0) {
        const parent = node.parent;
        const arg =
          !!parent &&
          (ts.isCallExpression(parent) || ts.isNewExpression(parent)) &&
          (parent.arguments?.some((a) => a === node) ?? false);
        const line = lineOf(node);
        hits.push({ line, text: (rawSrc.split('\n')[line - 1] ?? '').trim(), arg });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  // Tên kiểu KHÔNG giải được, phát hiện bằng CHẨN ĐOÁN NGỮ NGHĨA.
  //
  // Đường đầu tiên thử — `getSymbolAtLocation` trả undefined — SAI, đo được:
  // với một tên không tồn tại nó vẫn trả về một SYMBOL LỖI mang đúng tên ấy,
  // nên phép thử im lặng cho 0 và lỗ vẫn mở. Dấu hiệu thật là mã chẩn đoán
  // 2304 «Cannot find name» (và họ hàng), cộng một chi tiết đáng nhớ: kiểu lỗi
  // in ra bằng CHÍNH TÊN chưa giải được chứ không phải chữ `any`, dù cờ của nó
  // là `Any`. Đó là lý do nó lọt: trông như một kiểu vô hại, không phải never.
  const RESOLUTION_CODES = new Set([2304, 2503, 2307, 2552, 2688]);
  const unresolved: { line: number; name: string }[] = [];
  for (const d of program.getSemanticDiagnostics(sf)) {
    if (!RESOLUTION_CODES.has(d.code) || d.start === undefined) continue;
    const inCast = typeNodes.find((t) => d.start! >= t.start && d.start! < t.end);
    if (!inCast) continue;     // lỗi giải tên ở chỗ khác không phải việc của phép đo này
    unresolved.push({ line: lineOf(inCast.node), name: inCast.node.getText(sf) });
  }
  return { hits, unresolved };
}

/** Phân tích một tệp THẬT bằng program dựng từ tsconfig của chính project nó. */
function analyzeRealFile(rel: string) {
  const parsed = loadProject(PROJECT_OF(rel));
  const program = ts.createProgram(parsed.fileNames, parsed.options);
  const abs = path.join(ROOT, rel);
  const sf = program.getSourceFile(abs);
  if (!sf) {
    console.log(`FAIL  ${rel} không nằm trong program của ${PROJECT_OF(rel)} — không đo được`);
    process.exit(1);
  }
  return collectNever(program, sf, fs.readFileSync(abs, 'utf8'));
}

function makeProgram(fileName: string, source: string, extra: Record<string, string> = {}) {
  const virtual: Record<string, string> = { [fileName]: source, ...extra };
  const opts: ts.CompilerOptions = {
    target: ts.ScriptTarget.Latest,
    skipLibCheck: true,
    ...(fileName.endsWith('.tsx') ? { jsx: ts.JsxEmit.Preserve } : {}),
  };
  const host = ts.createCompilerHost(opts, true);
  const origGet = host.getSourceFile.bind(host);
  const origRead = host.readFile.bind(host);
  host.getSourceFile = (n, v, e, sc) =>
    virtual[n] !== undefined
      ? ts.createSourceFile(n, virtual[n]!, v, true, n.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS)
      : origGet(n, v, e, sc);
  host.readFile = (n) => (virtual[n] !== undefined ? virtual[n] : origRead(n));
  host.fileExists = (n) => virtual[n] !== undefined || ts.sys.fileExists(n);
  return ts.createProgram([fileName], opts, host);
}

/** Như trên, nhưng cho nguồn ẢO (fixture): program dựng trong bộ nhớ. */
function classifyNever(rawSrc: string, fileName = 'probe.ts', extra: Record<string, string> = {}) {
  const program = makeProgram(fileName, rawSrc, extra);
  const sf = program.getSourceFile(fileName)!;
  return collectNever(program, sf, rawSrc);
}

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

const NEVER_CASES: { src: string; arg: boolean; why: string; skip?: boolean }[] = [
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
  // Lối vòng BÍ DANH KIỂU — vòng chấm 4 tìm ra. Cú pháp không thấy được, chỉ
  // bộ kiểm kiểu mới biết `N` trỏ về `never`.
  { src: 'type N = never; declare const e: string; const _a: number = e as N;', arg: false, why: 'bí danh một tầng (lối vòng vòng 4)' },
  { src: 'type N = never; type M = N; declare const e: string; const _b: number = e as M;', arg: false, why: 'bí danh DÂY CHUYỀN' },
  { src: 'type N = never; declare function f(p: never): void; declare const e: string; f(e as N);', arg: true, why: 'bí danh ở vị trí đối số — vẫn hợp lệ' },
  // Đối chứng âm quan trọng: một bí danh KHÔNG phải never thì không được tính.
  { src: 'type NeverMind = string; declare const e: number; const _c: string = e as NeverMind;', arg: false, why: 'bí danh KHÔNG phải never — phải không có khớp nào', skip: true },
];

for (const c of NEVER_CASES) {
  const got = classifyNever(c.src).hits;
  if (c.skip) {           // `skip` = KHÔNG được có khớp nào (đối chứng âm)
    say(got.length === 0, `phân loại «${c.why}» → ${got.length} khớp (đúng: 0)`);
    continue;
  }
  const ok = got.length === 1 && got[0]!.arg === c.arg;
  say(ok, `phân loại «${c.why}» → ${got.length === 1 ? (got[0]!.arg ? 'ĐỐI SỐ' : 'GIÁ TRỊ') : `${got.length} khớp`} (đúng: ${c.arg ? 'ĐỐI SỐ' : 'GIÁ TRỊ'})`);
}

// Bí danh NHẬP TỪ TỆP KHÁC — biến thể khó nhất, và là thứ chỉ có bộ kiểm kiểu
// với đủ độ phân giải mới lần ra. Dựng bằng tệp ảo thứ hai trong cùng program.
{
  // Khoá của tệp ảo phải là đường dẫn TUYỆT ĐỐI: bộ giải module tính ra đường
  // tuyệt đối từ `'./alias'`, nên khoá tương đối không bao giờ khớp (đo được:
  // 0 khớp, và "0 khớp" ở đây trông y hệt "sạch" — đúng lớp lỗi hồ sơ này canh).
  const dir = path.join(ROOT, '_acceptance', 'typecheck-mock-signature');
  const crossFile = classifyNever(
    "import type { N } from './alias';\ndeclare const e: string;\nconst _x: number = e as N;",
    path.join(dir, '__vt_main.ts'),
    { [path.join(dir, 'alias.ts')]: 'export type N = never;' },
  ).hits;
  say(crossFile.length === 1 && !crossFile[0]!.arg,
    `phân loại «bí danh NHẬP TỪ TỆP KHÁC» → ${crossFile.length === 1 ? (crossFile[0]!.arg ? 'ĐỐI SỐ' : 'GIÁ TRỊ') : `${crossFile.length} khớp`} (đúng: GIÁ TRỊ)`);
}

// Chốt hỏng-thì-ĐÓNG: tệp không parse được phải bị BẮT, không được đi qua như
// tệp sạch. Hai ca dưới là ca NUỐT thật do vòng chấm 3 tìm ra — cast nguy hiểm
// biến mất khỏi cây, nên nếu chỉ nhìn số cast thì cả hai trông "sạch".
const SWALLOWED: { src: string; why: string }[] = [
  { src: 'const a = 1;\n/* mở mà không đóng\nconst _q: number = x as never;', why: 'chú thích không đóng' },
  { src: 'const a = `chưa đóng;\nconst _q: number = x as never;', why: 'template literal không đóng' },
];
for (const c of SWALLOWED) {
  const casts = classifyNever(c.src).hits.length;
  const perr = parseErrorCount(c.src);
  say(casts === 0 && perr > 0,
    `hỏng-thì-đóng «${c.why}»: cast bị nuốt (${casts} thấy được) NHƯNG chẩn đoán cú pháp bắt được (${perr} lỗi)`);
}
say(parseErrorCount('const _q: number = x as never;') === 0, 'đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)');

// Chốt hỏng-thì-ĐÓNG ở tầng KIỂM KIỂU (lối vòng vòng 5). Một tên kiểu KHÔNG
// giải được cho kiểu LỖI, mà kiểu lỗi mang cờ Any — im lặng, trông vô hại,
// không phải never. Phải đếm riêng và ngã to, chứ không được đọc thành "sạch".
{
  const un = classifyNever('declare const e: string; const _u: number = e as KhongHeTonTai;');
  say(un.hits.length === 0 && un.unresolved.length === 1,
    `hỏng-thì-đóng tầng kiểm kiểu: tên không giải được → 0 khớp never NHƯNG ${un.unresolved.length} tên không giải được (phải là 1)`);
  const ok = classifyNever('type N = never; declare const e: string; const _r: number = e as N;');
  say(ok.unresolved.length === 0, `đối chứng âm: tên giải được → ${ok.unresolved.length} tên không giải được (phải là 0)`);
}

// Chú thích chỉ NHẮC TỚI as never không được tính — ca hồi quy của lỗi trước.
say(classifyNever('// mũi thử: as never ở vị trí giá trị thì phải đỏ').hits.length === 0,
  'đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)');

// Số dòng phải ĐÚNG kể cả sau một khối chú thích nhiều dòng — lỗ #4 vòng 2.
const LINENO_FIXTURE = ['const a = 1;', '/* khối', 'chú thích', 'ba dòng */', 'const b: number = x as never;'].join('\n');
const lineHit = classifyNever(LINENO_FIXTURE).hits;
say(lineHit.length === 1 && lineHit[0]!.line === 5,
  `số dòng sau khối chú thích nhiều dòng → ${lineHit[0]?.line ?? 'không bắt'} (đúng: 5)`);

say(hits(DIRTY).length === 4, `đối chứng dương: fixture 4 mẫu → bắt ${hits(DIRTY).length} (${hits(DIRTY).join(', ') || 'không có'})`);
say(hits(CLEAN).length === 0, `đối chứng âm: fixture sạch → bắt ${hits(CLEAN).length} (phải là 0)`);
if (failures > 0) { console.log('\nFAILED — bộ quét hỏng, mọi kết luận đều vô nghĩa'); process.exit(1); }

// ── Mốc so: GHIM, không phải merge-base ──────────────────────────────────────
// AC-5 hỏi "lượt sửa NÀY có thêm mẫu bịt miệng nào không". Lượt sửa ấy là một
// sự kiện lịch sử cố định, nên mốc so của nó cũng phải cố định.
//
// Bản đầu dùng `git merge-base HEAD origin/main`. Đúng khi PR còn mở, SAI ngay
// khi PR merge: merge-base khi đó chính là HEAD, số dòng thêm về 0, và phép đo
// mất đối tượng. Đo được thật lúc merge PR #50 — chốt `added.length > 0` nổ
// đúng như thiết kế ("không đo được gì") thay vì im lặng báo sạch, nhưng một
// phép đo chỉ chạy được trước khi merge thì không phải phép đo, nó là một cửa sổ.
//
// `SILENCER_SCAN_BASE` cho phép trỏ mốc khác khi cần; mặc định là commit ngay
// TRƯỚC lượt sửa. Không giải được mốc thì script ngã (không-đo-được ≠ sạch).
const PINNED_BASE = '54b5cb263259bc8ebe0ef5d20960b82b369b1f6e';   // main ngay trước lượt sửa typecheck-mock-signature
function baseRef(): string {
  const want = process.env.SILENCER_SCAN_BASE || PINNED_BASE;
  try {
    return execFileSync('git', ['rev-parse', `${want}^{commit}`], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    console.log(`FAIL  không giải được mốc so «${want}» — phép đo không chạy được`);
    process.exit(1);
  }
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

  // Program dựng từ tsconfig THẬT của project — nếu không, một bí danh khai
  // trong `.d.ts` toàn cục sẽ giải ra kiểu lỗi và đi lọt (lối vòng vòng 5).
  const { hits: all, unresolved } = analyzeRealFile(t);
  say(unresolved.length === 0,
    `${t}: mọi tên kiểu trong phép ép đều giải được (${unresolved.length} không giải được) — không giải được thì KHÔNG kết luận "sạch"`);
  unresolved.forEach((u) => console.log(`      ${t}:${u.line}: tên không giải được «${u.name}»`));
  const bad = all.filter((h) => !h.arg);
  const argPos = all.length - bad.length;
  say(bad.length === 0, `${t}: không «as never» ở vị trí giá trị (${bad.length} chỗ); ${argPos} chỗ ở vị trí đối số — hợp lệ, không tính`);
  bad.forEach((h) => console.log(`      ${t}:${h.line}: ${h.text}`));
}

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures} khẳng định đỏ`);
process.exit(failures === 0 ? 0 : 1);
