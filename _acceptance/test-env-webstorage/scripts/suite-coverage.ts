/**
 * E4 (AC-4) — không hồi quy, ĐO BẰNG SỐ chứ không bằng mã thoát.
 *
 * Vì sao không dùng thẳng `npm test`: mã thoát 0 không phân biệt được "cả bộ
 * xanh" với "lane chỉ chạy vài chục ca rồi xanh". Bốn tệp dưới đây là bốn tệp
 * đã CHẾT vì sự cố Node 26 ngày 2026-08-19; phép đo này chỉ có nghĩa nếu nó
 * chứng minh được chúng ĐÃ CHẠY LẠI, nên nó đọc số ca của từng tệp từ báo cáo
 * máy-đọc-được và ĐỎ khi thiếu bất kỳ tệp nào.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');
const TOI_THIEU = 617;
const BON_TEP = [
  'src/store/usePosterStore.test.ts',
  'src/components/MapView.test.tsx',
  'src/render/applyRenderConfig.test.ts',
  'src/lib/export.test.ts',
];

const out = path.join(os.tmpdir(), `suite-coverage-${process.pid}.json`);
try {
  execFileSync('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${out}`], {
    cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'],
  });
} catch {
  // mã thoát khác 0 vẫn ghi báo cáo; số liệu dưới mới là thứ quyết định
}

const rp = JSON.parse(readFileSync(out, 'utf8'));
unlinkSync(out);

const fails: string[] = [];
const ok = (dk: boolean, msg: string) => { console.log(`  ${dk ? '✓' : '✗'} ${msg}`); if (!dk) fails.push(msg); };

const dat = rp.numPassedTests ?? 0;
const do_ = rp.numFailedTests ?? 0;
ok(do_ === 0, `0 ca đỏ (thực tế: ${do_})`);
ok(dat >= TOI_THIEU, `tổng ca đạt >= ${TOI_THIEU} (thực tế: ${dat})`);

for (const tep of BON_TEP) {
  const r = (rp.testResults ?? []).find((x: { name: string }) => x.name.replace(`${ROOT}/`, '') === tep);
  if (!r) { ok(false, `${tep} — KHÔNG có trong báo cáo, tức lane không chạy nó`); continue; }
  const n = (r.assertionResults ?? []).filter((a: { status: string }) => a.status === 'passed').length;
  ok(n > 0, `${tep} — ${n} ca đạt`);
}

if (fails.length) {
  console.error(`\nsuite-coverage: ${fails.length} khẳng định hỏng`);
  process.exit(1);
}
console.log('\nsuite-coverage: bộ test xanh, và bốn tệp từng chết đều đã chạy lại');
