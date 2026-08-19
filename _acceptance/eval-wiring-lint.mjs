#!/usr/bin/env node
/**
 * eval-wiring-lint — bắt lỗi ĐẤU DÂY của bộ phép đo, thứ mà màu xanh không nói.
 *
 * Sinh ra từ hai sự cố thật, phiên 2026-08-19:
 *
 *   L1  `satellite-basemap` có AC-9 (đường web rơi về vector) mà KHÔNG phép đo
 *       nào khai `criterion: AC-9`. Hợp đồng đi tới Cổng 1 với một tiêu chí
 *       không có gì đỡ, và bằng chứng vẫn ghi 10/10 xanh.
 *   L2  lệnh của một phép đo trỏ vào tệp không tồn tại thì bộ chạy vẫn có thể
 *       thoát 0 (glob rỗng, tên đổi) — xanh rỗng, không ai đỏ.
 *   L3  `recipe-region-spotlight` có 11/13 phép đo trỏ vào tệp test của tầng
 *       khác: tệp đó chứa chuỗi "recipe" ĐÚNG 0 lần, cho 69 ca đạt, và bằng
 *       chứng ghi 13/13 xanh trong khi không ca nào chạm tầng recipe.
 *
 * Kit đã có eval-coverage-lint (W1/W3–W7) nhưng nó soi HÌNH DẠNG ĐỘ PHỦ của
 * `expected`, không soi việc lệnh có thật sự chạm thứ nó khai. Hai công cụ
 * không giẫm chân nhau.
 *
 * L1/L2 là lỗi CHẶN (exit 1). L3 là ADVISORY — nó đoán bằng từ vựng nên có thể
 * bắn giả; nó in ra để người đọc, không tự đánh trượt.
 *
 * Chạy: node _acceptance/eval-wiring-lint.mjs [--slug <slug>] [--strict-l3]
 */
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ACC = path.join(ROOT, '_acceptance');
const args = process.argv.slice(2);
const only = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;
const strictL3 = args.includes('--strict-l3');

const read = (p) => { try { return readFileSync(p, 'utf8'); } catch { return null; } };

/** Giải `config:a.b.c` thành lệnh thật, theo đúng lối đọc thụt-2-dấu-cách của kit. */
const cfgTxt = read(path.join(ACC, 'config.yaml')) || '';
function resolveRef(ref) {
  const dotted = ref.replace(/^config:/, '').split('.');
  let depth = 0, want = dotted[0];
  for (const line of cfgTxt.split('\n')) {
    const m = line.match(/^(\s*)([\w-]+):\s*(.*)$/);
    if (!m) continue;
    if (m[1].length !== depth * 2) continue;
    if (m[2] !== want) continue;
    if (depth === dotted.length - 1) return m[3].replace(/^["']|["']$/g, '') || null;
    depth++; want = dotted[depth];
  }
  return null;
}

/** Token trông như đường dẫn tệp trong một dòng lệnh shell. */
const filesIn = (cmd) => (cmd.match(/[\w./-]+\.[a-z]{2,4}\b/g) || [])
  .filter((t) => t.includes('/') && !t.startsWith('-'));

/**
 * Định danh RIÊNG BIỆT rút từ văn xuôi: chỉ lấy tên trông như hàm/khoá trong
 * code span — có gạch dưới hoặc chữ hoa giữa từ (`render_recipe`,
 * `buildMapStyle`). Bản đầu lấy MỌI từ ≥5 ký tự rồi hỏi "có trùng cái nào
 * không"; nó im lặng ở đúng ca thật (11 phép đo trỏ nhầm tệp) vì hai tầng kề
 * nhau dùng chung từ chung như "render", "clip", "resolved". Đo lại bằng chính
 * ca đó: luật cũ 0 cảnh báo, luật này bắt được.
 */
function identifiers(text) {
  const out = new Set();
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    for (const t of m[1].split(/[^A-Za-z0-9_]+/)) {
      if (t.length >= 6 && (/_/.test(t) || /[a-z][A-Z]/.test(t))) out.add(t);
    }
  }
  for (const t of text.match(/\b[a-z][a-z0-9]*_[a-z0-9_]{3,}\b|\b[a-z]+[A-Z][A-Za-z0-9]{3,}\b/g) || []) out.add(t);
  return [...out];
}

const evalsOf = (txt) => txt.split(/\n\s*-\s+id:\s*/).slice(1).map((blk) => ({
  id: blk.split('\n')[0].trim(),
  criterion: (blk.match(/criterion:\s*(\S+)/) || [])[1] || null,
  executor: (blk.match(/executor:\s*(\S+)/) || [])[1] || null,
  ref: (blk.match(/cmd:\s*(\S+)/) || [])[1] || null,
  expected: (blk.match(/expected:\s*"?([^"\n]*)/) || [])[1] || '',
}));

const blocking = [], advisory = [];
const slugs = readdirSync(ACC).filter((s) => statSync(path.join(ACC, s)).isDirectory())
  .filter((s) => !only || s === only);

for (const slug of slugs) {
  const cTxt = read(path.join(ACC, slug, 'contract.md'));
  const eTxt = read(path.join(ACC, slug, 'evals.yaml'));
  if (!cTxt || !eTxt) continue;                       // hồ sơ cơ hội / workspace chưa có bộ đo
  // Khuôn dòng tiêu chí khác nhau giữa các gói: `- AC-1:` và `- **AC-1**:` đều
  // có thật trong kho này. Regex chỉ nhận một dạng làm CẢ hợp đồng rụng sạch —
  // và lint sẽ tố cáo mọi phép đo là mồ côi, tức chính lớp lỗi nó đi bắt.
  const criteria = [...cTxt.matchAll(/^-\s+\*{0,2}(AC-[\w.]+)\*{0,2}\s*(\*?\([^)]*\)\*?)?\s*:/gm)].map((m) => m[1]);
  // L0 — chốt tự canh: hợp đồng CÓ mục tiêu chí mà lint rút được 0 dòng thì lỗi
  // nằm ở bộ đọc này, không nằm ở hồ sơ. Nói thẳng ra, đừng báo bừa.
  if (/^##\s*Criteria/m.test(cTxt) && !criteria.length) {
    blocking.push(`[${slug}] L0 lint KHÔNG rút được tiêu chí nào từ hợp đồng có mục Criteria — bộ đọc của lint hỏng, mọi kết luận L1 cho gói này vô giá trị.`);
    continue;
  }
  const evs = evalsOf(eTxt);
  const measured = new Set(evs.map((e) => e.criterion).filter(Boolean));

  // L1 — tiêu chí không có phép đo nào
  for (const ac of criteria) {
    if (!measured.has(ac)) blocking.push(`[${slug}] L1 ${ac} KHÔNG có phép đo nào khai criterion: ${ac} — tiêu chí này đi qua cổng mà không gì đỡ.`);
  }
  // và chiều ngược: phép đo trỏ vào tiêu chí không tồn tại
  for (const e of evs) {
    if (e.criterion && !criteria.includes(e.criterion))
      blocking.push(`[${slug}] L1 ${e.id} khai criterion: ${e.criterion} nhưng hợp đồng không có tiêu chí đó.`);
  }

  for (const e of evs) {
    if (!e.ref || !e.ref.startsWith('config:')) continue;
    const cmd = resolveRef(e.ref);
    if (!cmd) { blocking.push(`[${slug}] L2 ${e.id} trỏ ${e.ref} — cấu hình không giải được ref này.`); continue; }
    const targets = filesIn(cmd);
    // L2 — lệnh trỏ vào tệp không tồn tại
    for (const f of targets) {
      if (!existsSync(path.join(ROOT, f)))
        blocking.push(`[${slug}] L2 ${e.id} chạy \`${cmd}\` nhưng ${f} KHÔNG tồn tại — lệnh có thể thoát 0 trên tập rỗng.`);
    }
    // L3 — lệnh có chạm thứ nó khai không (advisory)
    const live = targets.filter((f) => existsSync(path.join(ROOT, f)));
    if (!live.length) continue;
    const crit = (cTxt.match(new RegExp(`^-\\s+${e.criterion}\\s*.*$`, 'm')) || [''])[0];
    const ids = identifiers(`${crit} ${e.expected}`);
    if (!ids.length) continue;
    const blob = live.map((f) => read(path.join(ROOT, f)) || '').join('\n');
    const miss = ids.filter((t) => !blob.includes(t));
    if (miss.length)
      advisory.push(`[${slug}] L3 ${e.id} (${e.criterion}) chạy \`${cmd}\` — tệp lệnh chạy KHÔNG chứa: ${miss.slice(0, 4).join(', ')}. Lệnh có thể đang đo tầng khác.`);
  }
}

const say = (t, xs) => { if (xs.length) { console.log(`\n${t}`); for (const x of xs) console.log('  ' + x); } };
say(`CHẶN — ${blocking.length} lỗi đấu dây:`, blocking);
say(`ADVISORY — ${advisory.length} lệnh khả nghi (đoán bằng từ vựng, có thể bắn giả):`, advisory);
if (!blocking.length && !advisory.length) console.log('eval-wiring-lint: sạch — mọi tiêu chí có phép đo, mọi lệnh trỏ vào tệp có thật.');
process.exit(blocking.length || (strictL3 && advisory.length) ? 1 : 0);
