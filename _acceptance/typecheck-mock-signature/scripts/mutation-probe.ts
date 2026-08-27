/**
 * AC-6 — phép đo "assertion KHÔNG yếu đi".
 *
 * Một bộ test xanh không nói gì cả cho tới khi biết nó ĐỎ được. Cách chữa rẻ
 * (`as any`, `@ts-expect-error`, hay xoá thẳng assertion) làm typecheck sạch,
 * `npm test` xanh, và bộ quét bịt-miệng cũng sạch nếu chỉ xoá — chỉ mũi phá
 * code sản phẩm mới phân biệt được "còn cắn" với "đã chết".
 *
 * Mỗi mũi: sửa ĐÚNG một chỗ trong code sản phẩm, chạy tệp test tương ứng, đòi
 * ĐỎ, rồi hoàn nguyên và KHẲNG ĐỊNH đã hoàn nguyên (so byte với bản gốc). Cây
 * mã được khôi phục kể cả khi script ngã giữa chừng.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');

interface Mutation {
  label: string;
  file: string;
  find: string;
  replace: string;
  suite: string;
}

const MUTATIONS: Mutation[] = [
  {
    label: 'đường web ép basemap về vector — bỏ rơi yêu cầu nền vệ tinh',
    file: 'src/components/MapView.tsx',
    find: '        basemap: s.basemap,',
    replace: "        basemap: 'vector',",
    suite: 'src/components/MapView.test.tsx',
  },
  {
    label: 'đường web nuốt satelliteTiles — dựng một cửa chặn lẽ ra không tồn tại',
    file: 'src/components/MapView.tsx',
    find: '        satelliteTiles: s.satelliteTiles ?? SATELLITE_TILES,',
    replace: '        satelliteTiles: undefined,',
    suite: 'src/components/MapView.test.tsx',
  },
  {
    label: 'area-overview đổi mặc định nền về satellite',
    file: 'mcp-server/src/recipes.ts',
    find: "        basemap: p.basemap ?? 'vector',",
    replace: "        basemap: p.basemap ?? 'satellite',",
    suite: 'mcp-server/src/recipes.test.ts',
  },
];

const originals = new Map<string, string>();
const restoreAll = () => { for (const [abs, body] of originals) fs.writeFileSync(abs, body); };
process.on('exit', restoreAll);
process.on('SIGINT', () => { restoreAll(); process.exit(130); });

let failures = 0;
const say = (ok: boolean, msg: string) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures++; };

/** Chạy vitest trên một tệp; trả mã thoát. */
function runSuite(suite: string): number {
  try {
    execFileSync('npx', ['vitest', 'run', suite], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    return 0;
  } catch (e) {
    return (e as { status?: number }).status ?? 1;
  }
}

// Đối chứng dương bắt buộc, chạy TRƯỚC mọi mũi: cây mã nguyên trạng thì cả hai
// tệp phải XANH. Thiếu chốt này, một tệp đỏ sẵn sẽ làm mọi mũi "đỏ" một cách
// vô nghĩa và script báo thành công.
const SUITES = [...new Set(MUTATIONS.map((m) => m.suite))];
for (const s of SUITES) say(runSuite(s) === 0, `đối chứng nền: ${s} xanh khi chưa phá gì`);
if (failures > 0) { console.log('\nFAILED — nền đã đỏ sẵn, mọi mũi phá đều vô nghĩa'); process.exit(1); }

for (const m of MUTATIONS) {
  console.log(`\n=== mũi: ${m.label} ===`);
  const abs = path.join(ROOT, m.file);
  const body = fs.readFileSync(abs, 'utf8');
  originals.set(abs, body);

  const occurrences = body.split(m.find).length - 1;
  if (occurrences !== 1) {
    say(false, `neo phá phải khớp ĐÚNG 1 lần trong ${m.file} (khớp ${occurrences}) — mũi không đặt được`);
    continue;
  }

  fs.writeFileSync(abs, body.replace(m.find, m.replace));
  const code = runSuite(m.suite);
  say(code !== 0, `${m.suite} ĐỎ khi code sản phẩm hỏng (mã thoát ${code})`);

  fs.writeFileSync(abs, body);
  say(fs.readFileSync(abs, 'utf8') === body, `${m.file} đã hoàn nguyên đúng nguyên trạng`);
  originals.delete(abs);
}

// Chốt cuối: cây mã sạch với git — không mũi nào để lại vết.
const dirty = execFileSync('git', ['status', '--porcelain', '--', 'src/components/MapView.tsx', 'mcp-server/src/recipes.ts'], { cwd: ROOT, encoding: 'utf8' }).trim();
say(dirty === '', `git thấy code sản phẩm sạch sau mọi mũi (${dirty || 'không vết'})`);

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures} khẳng định đỏ`);
process.exit(failures === 0 ? 0 : 1);
