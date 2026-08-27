/**
 * AC-7 — không hồi quy, VÀ chứng minh hai tệp đã sửa thật sự chạy lại.
 *
 * Mã thoát của cả bộ không đủ: một tệp bị lọc mất, đổi tên, hay bỏ qua vẫn cho
 * mã thoát 0 — "xanh" khi đó chỉ có nghĩa là không ai chạy nó. Nên phép đo đọc
 * báo cáo JSON của vitest và đòi TỪNG tệp đích có số ca đạt > 0.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const TARGETS = ['src/components/MapView.test.tsx', 'mcp-server/src/recipes.test.ts'];

let failures = 0;
const say = (ok: boolean, msg: string) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures++; };

const out = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'accept-')), 'vitest.json');
let exitCode = 0;
try {
  execFileSync('npx', ['vitest', 'run', '--reporter=json', `--outputFile=${out}`], {
    cwd: ROOT, encoding: 'utf8', stdio: 'pipe', maxBuffer: 64 * 1024 * 1024,
  });
} catch (e) {
  exitCode = (e as { status?: number }).status ?? 1;
}
say(exitCode === 0, `toàn bộ bộ test đơn vị xanh (mã thoát ${exitCode})`);

say(fs.existsSync(out), `có báo cáo máy-đọc-được: ${out}`);
if (!fs.existsSync(out)) { console.log('\nFAILED — không có báo cáo, không kết luận được gì'); process.exit(1); }

const report = JSON.parse(fs.readFileSync(out, 'utf8')) as {
  numTotalTests: number; numPassedTests: number; numFailedTests: number;
  testResults: { name: string; assertionResults: { status: string }[] }[];
};

say(report.numFailedTests === 0, `0 ca đỏ (${report.numPassedTests} đạt / ${report.numTotalTests} tổng)`);

for (const t of TARGETS) {
  const file = report.testResults.find((r) => r.name.replace(/\\/g, '/').endsWith(t));
  if (!file) { say(false, `${t}: KHÔNG có trong báo cáo — tệp không hề chạy`); continue; }
  const passed = file.assertionResults.filter((a) => a.status === 'passed').length;
  const failed = file.assertionResults.filter((a) => a.status === 'failed').length;
  say(passed > 0 && failed === 0, `${t}: ${passed} ca đạt, ${failed} ca đỏ (đòi đạt > 0)`);
}

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures} khẳng định đỏ`);
process.exit(failures === 0 ? 0 : 1);
