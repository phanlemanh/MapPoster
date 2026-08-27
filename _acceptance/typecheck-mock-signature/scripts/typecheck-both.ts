/**
 * AC-1 + AC-2 — chấm CẢ HAI project, độc lập.
 *
 * Bước Typecheck của CI nối hai lệnh bằng `&&`, nên khi lệnh đầu ngã thì lệnh
 * sau KHÔNG chạy. Đó không phải rủi ro giả định: nó đã giấu 2 lỗi ở
 * `mcp-server/src/recipes.test.ts` suốt 5 ngày trong khi báo cáo sự cố chỉ thấy
 * 4 lỗi. Phép đo này vì thế chạy hai lệnh RỜI, thu mã thoát của từng lệnh, rồi
 * mới kết luận — một vế ngã không được phép che vế kia.
 *
 * `tsc -b` chạy kèm `--force`: bản tăng dần đọc `tsbuildinfo` và có thể báo
 * sạch mà chưa chấm lại tệp nào, tức là một lời "xanh" không có nội dung.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');

const RUNS: { label: string; argv: string[] }[] = [
  { label: 'project web (tsconfig.app.json + node)', argv: ['tsc', '-b', '--force'] },
  { label: 'project mcp-server', argv: ['tsc', '-p', 'mcp-server/tsconfig.json'] },
];

let failures = 0;
for (const r of RUNS) {
  let code = 0;
  let out = '';
  try {
    out = execFileSync('npx', r.argv, { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    code = err.status ?? 1;
    out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
  const errLines = out.split('\n').filter((l) => /error TS\d+/.test(l));
  const ok = code === 0 && errLines.length === 0;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${r.label} — \`npx ${r.argv.join(' ')}\` mã thoát ${code}, ${errLines.length} dòng lỗi`);
  if (!ok) { failures++; errLines.slice(0, 10).forEach((l) => console.log(`      ${l}`)); }
}

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures}/${RUNS.length} project đỏ`);
process.exit(failures === 0 ? 0 : 1);
