/**
 * AC-3 + AC-4 — chiều PHỦ ĐỊNH của "khai đúng chữ ký".
 *
 * Vì sao phải là phép đo riêng, không dựa vào typecheck sạch: `as any` cũng
 * làm typecheck sạch. Thứ phân biệt "khai đúng" với "bịt miệng" là câu hỏi
 * NGƯỢC — đọc sai kiểu thì trình biên dịch có ĐỎ được không? Nếu đối số đã bị
 * nới về `any`/`unknown` thì không mũi nào đỏ, và bộ test trở thành phép đo giả
 * trong khi mọi phép đo kết quả vẫn xanh.
 *
 * Cách đo: chép tệp test THẬT sang một tệp thăm dò cùng thư mục (mọi import
 * tương đối vẫn giải được), rồi chấm hai lượt:
 *   1. BẢN SẠCH  — bản chép y nguyên phải typecheck SẠCH. Không có chốt này
 *      thì một lỗi sẵn có trong bản chép sẽ bị đọc nhầm thành "mũi đã đỏ".
 *   2. BẢN CÓ MŨI — thêm dòng đọc sai kiểu, phải đỏ ĐÚNG mã lỗi mong đợi VÀ
 *      đỏ tại chính tệp thăm dò.
 * Tệp thăm dò luôn bị xoá, kể cả khi script ngã giữa chừng.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const cleanup: string[] = [];
process.on('exit', () => { for (const f of cleanup) try { fs.unlinkSync(f); } catch { /* đã xoá */ } });

function tsc(project: string): string {
  try {
    execFileSync('npx', ['tsc', '-p', project, '--noEmit'], { cwd: ROOT, encoding: 'utf8', stdio: 'pipe' });
    return '';
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return `${err.stdout ?? ''}${err.stderr ?? ''}`;
  }
}

type Probe = { name: string; codes: string[]; line: string };

interface Case {
  label: string;
  source: string;   // tệp test thật
  probeFile: string; // tệp thăm dò (cùng thư mục)
  project: string;
  probes: Probe[];
}

const CASES: Case[] = [
  {
    label: 'AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs',
    source: 'src/components/MapView.test.tsx',
    probeFile: 'src/components/__typeprobe__.probe.tsx',
    project: 'tsconfig.app.json',
    probes: [
      {
        name: 'basemap KHÔNG phải number (kiểu hẹp thật, không phải any)',
        codes: ['TS2322'],
        line: `const _p1: number = buildMapStyle.mock.calls[0][0].basemap; void _p1;`,
      },
      {
        name: 'field không tồn tại trên BuildStyleArgs phải bị bắt',
        codes: ['TS2339'],
        line: `void buildMapStyle.mock.calls[0][0].khongHeTonTai;`,
      },
    ],
  },
  {
    label: 'AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall',
    source: 'mcp-server/src/recipes.test.ts',
    probeFile: 'mcp-server/src/__typeprobe__.probe.ts',
    project: 'mcp-server/tsconfig.json',
    probes: [
      {
        name: 'basemap là union hẹp, gán vào number phải đỏ',
        codes: ['TS2322'],
        line: `const _q1: number = getRecipe('area-overview').compile({} as never).basemap; void _q1;`,
      },
      {
        name: 'field không tồn tại trên CompiledRecipeCall phải bị bắt',
        codes: ['TS2339'],
        line: `void getRecipe('area-overview').compile({} as never).khongHeTonTai;`,
      },
    ],
  },
];

let failures = 0;
const say = (ok: boolean, msg: string) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failures++; };

for (const c of CASES) {
  console.log(`\n=== ${c.label} ===`);
  const srcAbs = path.join(ROOT, c.source);
  const probeAbs = path.join(ROOT, c.probeFile);
  const body = fs.readFileSync(srcAbs, 'utf8');
  const probeBase = path.basename(c.probeFile);

  // Lượt 1 — BẢN SẠCH. Bản chép y nguyên phải sạch, nếu không thì mọi kết luận
  // ở lượt 2 đều vô nghĩa (không phân biệt được lỗi của mũi với lỗi sẵn có).
  cleanup.push(probeAbs);
  fs.writeFileSync(probeAbs, body);
  const ctrl = tsc(c.project);
  const ctrlHits = ctrl.split('\n').filter((l) => l.includes(probeBase));
  say(ctrlHits.length === 0, `đối chứng: bản chép sạch không sinh lỗi nào (${ctrlHits.length} dòng lỗi)`);
  if (ctrlHits.length > 0) console.log(ctrlHits.slice(0, 3).map((l) => `      ${l}`).join('\n'));

  // Lượt 2 — từng mũi một, để mã lỗi quy được về đúng mũi.
  for (const p of c.probes) {
    fs.writeFileSync(probeAbs, `${body}\n// —— mũi thăm dò ——\n${p.line}\n`);
    const out = tsc(c.project);
    const hits = out.split('\n').filter((l) => l.includes(probeBase));
    const got = p.codes.filter((code) => hits.some((l) => l.includes(code)));
    say(
      got.length === p.codes.length,
      `mũi «${p.name}» → đỏ ${p.codes.join('+')} tại ${probeBase} (bắt được: ${got.join('+') || 'KHÔNG CÓ'})`,
    );
    if (got.length !== p.codes.length) console.log(hits.slice(0, 3).map((l) => `      ${l}`).join('\n'));
  }

  fs.unlinkSync(probeAbs);
  cleanup.splice(cleanup.indexOf(probeAbs), 1);
  say(!fs.existsSync(probeAbs), `tệp thăm dò đã dọn: ${c.probeFile}`);
}

console.log(`\n${failures === 0 ? 'OK' : 'FAILED'} — ${failures} khẳng định đỏ`);
process.exit(failures === 0 ? 0 : 1);
