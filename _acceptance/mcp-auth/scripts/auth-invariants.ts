/**
 * mcp-auth — bất biến cấu trúc không unit test nào diễn tả được.
 *
 *   I1  t3_path không đụng.
 *   I2  CHỈ CÓ MỘT chỗ kiểm bearer. Lỗ gốc là phép kiểm bị chép ba lần rồi
 *       cửa thứ tư quên chép — nên "không tồn tại bản chép thứ hai" mới là bất
 *       biến thật, và chỉ đọc mã mới nói được điều đó.
 *   I3  Mọi cửa vào đều đi qua nó, kể cả nhánh fall-through `/mcp`.
 *   I4  Chốt fail-closed lúc khởi động có SO SÁNH thật, không chỉ có chuỗi lỗi.
 *   I5  Câu README về auth KHỚP với thứ `http.ts` thật sự làm — đối chiếu HAI
 *       CHIỀU, vì AC-8 nói về tài liệu chứ không về mã. I2/I3/I4 đọc mã và
 *       không mở `README.md` một lần nào, nên trước I5 thì sửa README ngược
 *       lại thành câu SAI cũ ("bearer chỉ áp cho REST") vẫn thoát 0.
 *
 * Exit 0 = mọi bất biến còn giữ. Exit 1 = ít nhất một cái vỡ.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const read = (p: string): string => readFileSync(path.join(repoRoot, p), 'utf8');
const failures: string[] = [];
const note = (ok: boolean, id: string, msg: string): void => {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${id}  ${msg}`);
  if (!ok) failures.push(`${id}: ${msg}`);
};

const T3 = ['src/lib/export.ts', 'src/lib/mapStyle.ts'];
let base = 'origin/main';
try { execFileSync('git', ['rev-parse', '--verify', base], { cwd: repoRoot, stdio: 'pipe' }); }
catch { base = execFileSync('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'], { cwd: repoRoot, encoding: 'utf8' }).trim(); }
const mergeBase = execFileSync('git', ['merge-base', base, 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const changed = execFileSync('git', ['diff', '--name-only', `${mergeBase}..HEAD`], { cwd: repoRoot, encoding: 'utf8' }).split('\n').filter(Boolean);
const touched = T3.filter((p) => changed.includes(p));
note(touched.length === 0, 'I1', touched.length === 0 ? `t3_path untouched vs ${mergeBase.slice(0, 8)}` : `t3_path BỊ SỬA: ${touched.join(', ')}`);

const src = read('mcp-server/src/http.ts');

// I2 — đúng MỘT nơi so sánh bearer
const compares = (src.match(/authorization !== `Bearer \$\{token\}`/g) ?? []).length;
note(compares === 1, 'I2', `số nơi so sánh bearer: ${compares} (phải là 1 — nhiều hơn nghĩa là đã chép lại, và bản chép là cách một cửa bị quên)`);
const defined = /function rejectedByBearer\(/.test(src);
note(defined, 'I2', `rejectedByBearer được định nghĩa: ${defined}`);

// I3 — mọi cửa đi qua nó, gồm cả fall-through
const guards = (src.match(/if \(rejectedByBearer\(req, res\)\) return;/g) ?? []).length;
note(guards >= 4, 'I3', `số cửa gọi guard: ${guards} (3 route REST + fall-through /mcp = 4)`);
const beforeMcp = /if \(rejectedByBearer\(req, res\)\) return;\s*\n\s*\n\s*const mcp = createServer\(deps\);/.test(src);
note(beforeMcp, 'I3', `guard đứng NGAY TRƯỚC createServer của nhánh /mcp: ${beforeMcp}`);

// I4 — chốt fail-closed so sánh thật
const failClosed = /if \(!LOOPBACK_HOSTS\.includes\(host\) && !process\.env\.MAPPOSTER_TOKEN\)/.test(src);
note(failClosed, 'I4', `chốt khởi động SO SÁNH host với LOOPBACK_HOSTS và token: ${failClosed}`);
const explains = /Refusing to start/.test(src) && /MAPPOSTER_TOKEN/.test(src);
note(explains, 'I4', `thông điệp từ chối nêu được cách khắc phục: ${explains}`);

// I5 — AC-8: README phải MÔ TẢ ĐÚNG THỰC TẾ. Không so chuỗi một chiều ("README
// có chứa câu này") — thế thì gỡ guard `/mcp` khỏi http.ts vẫn xanh, mà đó
// chính là lúc câu README thành lời nói dối. So HAI CHIỀU: điều README KHẲNG
// ĐỊNH phải bằng đúng điều mã LÀM.
const readme = read('README.md');
const restStart = readme.indexOf('### REST endpoints');
const restEnd = readme.indexOf('\n### ', restStart + 1);
const restSection = restStart < 0 ? '' : readme.slice(restStart, restEnd < 0 ? undefined : restEnd);
note(restSection.length > 0, 'I5', `tìm được mục '### REST endpoints' trong README: ${restSection.length > 0}`);
// Gấp xuống một dòng: README ngắt dòng ~78 cột, nên regex nhiều từ phải chịu
// được mọi chỗ xuống dòng chứ không được ghim vị trí wrap hôm nay.
const flat = restSection.replace(/\s+/g, ' ');

const readmeSaysMcpGuarded = /same bearer token \(`MAPPOSTER_TOKEN`\) as every other route, \*\*including the `\/mcp` transport itself\*\*/.test(flat);
const codeGuardsMcp = guards >= 4 && beforeMcp;
note(
  readmeSaysMcpGuarded === codeGuardsMcp,
  'I5',
  `README nói bearer áp cho CẢ /mcp = ${readmeSaysMcpGuarded}; http.ts thật sự gác /mcp = ${codeGuardsMcp} (hai vế phải BẰNG nhau — lệch nghĩa là tài liệu nói sai về mã)`,
);

const readmeSaysFailClosed =
  /\*\*refuses to start\*\* when `MAPPOSTER_HTTP_HOST` binds outside loopback and no token is set/.test(flat) &&
  /`MAPPOSTER_TOKEN` stays optional for loopback use/.test(flat);
note(
  readmeSaysFailClosed === failClosed,
  'I5',
  `README ghi luật fail-closed (bắt buộc token ngoài loopback, KHÔNG bắt trên loopback) = ${readmeSaysFailClosed}; http.ts có chốt đó = ${failClosed} (hai vế phải BẰNG nhau)`,
);

console.log('');
if (failures.length) { console.log(`auth-invariants: ${failures.length} vi phạm`); process.exit(1); }
console.log('auth-invariants: mọi bất biến còn giữ');
