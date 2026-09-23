// nhan-canh-gay.cjs — MỘT nguồn trả lời «lượt chấm cuối kẹt vì đâu, và người ký được không»
// (hồ sơ nhan-trang-thai-va-reality, Đ2 · AC-4…AC-8). Bên đọc: thẻ Cổng 2 (gate-card.js),
// lưới trước-merge (pre-merge-check.sh qua CLI dưới), recheck-evidence.cjs. Ai thêm bên đọc
// thứ tư thì GỌI hàm này — hai bản luật là hai khuôn sẽ trôi.
//
// Nhãn lấy đúng chữ mục «Nhãn trạng thái» của CONTEXT.md. Phân loại CHỈ từ dữ liệu đã ghi
// (mã thoát, câu cố định của engine, cannot_run trên dòng eval) — không LLM đoán (giả định
// sinh tử 2 của ô). Dòng đời cũ thiếu `reason` → không phân loại → khoá như trước vòng.
'use strict';
const fs = require('fs');
const path = require('path');

const NHAN = { MU: 'không đọc được ở đây', CHET: 'hệ thống chết', LECH: 'thước lệch', VAT: 'sai hợp đồng' };
const TEN = { mu: NHAN.MU, chet: NHAN.CHET, vat: NHAN.VAT };

// ── nguồn chuỗi máy-đọc ─────────────────────────────────────────────────────────
// Lib này được CHÉP sang kho tiêu thụ cùng lưới trước-merge (INIT-CI-COPY-LIST), nơi KHÔNG có
// bộ chấm — nên chuỗi sống ở ĐÂY, trong khối marker, và ca NS/NC của kit so khối này với nguồn
// bộ chấm (feature-loop/workflows/acceptance-verify.js): lệch là ĐỎ, không trôi âm thầm.
// <<<NHAN-CANH-GAY-NGUON
const NGUON = {
  infraExits: [97, 127],
  toolKillReason: 'bi cong cu giet (timeout tool/output cat) — exit code khong phai cua lenh',
  deadReason: 'agent bi skip/chet',
};
// NHAN-CANH-GAY-NGUON>>>
function nguonNhan() { return NGUON; }

// So khối trên với nguồn bộ chấm — dùng ở ca đo của kit (không dùng lúc chạy CI).
function soKhopEngine(avText) {
  const loi = [];
  const khoi = String(avText).match(/<<<INFRA-EXIT-CODES\n([\s\S]*?)INFRA-EXIT-CODES>>>/);
  const ma = khoi ? [...khoi[1].matchAll(/^\s*(\d+):\s*'/gm)].map(m => Number(m[1])) : null;
  if (!ma) loi.push('bộ chấm mất khối INFRA-EXIT-CODES');
  else if (JSON.stringify(ma) !== JSON.stringify(NGUON.infraExits)) loi.push(`mã hạ tầng lệch: bộ chấm ${JSON.stringify(ma)} ≠ lib ${JSON.stringify(NGUON.infraExits)}`);
  const tk = String(avText).match(/const TOOL_KILL_REASON = '([^']+)'/);
  if (!tk || tk[1] !== NGUON.toolKillReason) loi.push('câu tool-kill lệch bộ chấm');
  if (!String(avText).includes(`blocked.push({ cmd, reason: '${NGUON.deadReason}`)) loi.push('câu agent chết lệch bộ chấm');
  return loi;
}

// Khuôn dòng sổ «ký trên cạnh gãy» — bên VIẾT là /acceptance-gate:signoff (thân lệnh mang
// CÙNG khối này); bên ĐỌC là kyTrenCanhGay dưới. Ca đo rút khuôn từ commands/signoff.md,
// điền eval, đưa vào lưới: đổi chữ ở một bên là đỏ (round-trip).
// <<<CANH-GAY-REVISIT-LINE -->
// "type":"revisit","stage":"gate2","at":"<ISO>","decision":"<nhãn> — <E> (<AC>): ghi hạn chế rồi ship","impact":"<giá>","serves":["<AC>"]
// <!-- CANH-GAY-REVISIT-LINE>>>
const KHUON_DECISION = (() => {
  const m = fs.readFileSync(__filename, 'utf8').match(/"decision":"(<nhãn> — <E> \(<AC>\)[^"]*)"/);
  if (!m) throw new Error('nhan-canh-gay: mất khuôn decision trong khối CANH-GAY-REVISIT-LINE');
  return m[1];
})();
const tienToKy = (ten, evalId) => KHUON_DECISION.split(' (<AC>)')[0].replace('<nhãn>', ten).replace('<E>', evalId) + ' (';

// ── phân một lý do ──────────────────────────────────────────────────────────────
// → 'mu' | 'chet' | null. `laEval` = dòng mang evalId của hợp đồng (không phải SUITE-*).
function nhanLyDo(reason, laEval, nguon) {
  if (!nguon) return null;   // không rút được nguồn → không phân loại (khoá), không đoán
  const { infraExits, toolKillReason, deadReason } = nguon;
  const r = typeof reason === 'string' ? reason : '';
  if (!r) return null;
  if (r.includes(deadReason)) return 'chet';
  if (infraExits.some(c => r.startsWith(`exit ${c} — `))) return 'mu';
  if (r === toolKillReason) return 'mu';
  return laEval ? 'mu' : null;
}

function docDong(runLogText) {
  return String(runLogText || '').split('\n').filter(l => l.trim())
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(o => o && typeof o === 'object');
}

// ── cạnh gãy của lượt chấm CUỐI ────────────────────────────────────────────────
// expectedExit: {evalId: mã đạt} (vắng = 0). Trả:
//   { round, lech, muc:[{evalId,cmd,nhan,reason}], daThuLai, trangThai }
//   trangThai ∈ 'lech' | 'mo' | 'chet-lan-dau' | 'khoa' | 'khong-ap' (verdict không phải BLOCKED)
function canhGay({ runLogText, verdict, expectedExit = {}, nguon }) {
  const dong = docDong(runLogText);
  const tallies = dong.filter(o => o.kind === 'round-tally');
  const cuoi = tallies[tallies.length - 1] || null;
  const round = cuoi && typeof cuoi.round === 'number' ? cuoi.round : null;
  const lechDong = [...dong].reverse().find(o => o.kind === 'thuoc-lech' && (round == null || (typeof o.round === 'number' && o.round >= round)));
  const lech = lechDong && Array.isArray(lechDong.tep) ? lechDong.tep : null;
  const out = { round, lech, muc: [], daThuLai: false, trangThai: 'khong-ap' };
  if (lech) { out.trangThai = 'lech'; return out; }
  if (String(verdict || '').toUpperCase() !== 'BLOCKED') return out;
  if (!cuoi || round == null) { out.trangThai = 'khoa'; return out; }
  // Chỉ dòng của LẦN CHẠY CUỐI: cùng round và cùng mốc ts với dòng tổng kết cuối — lần thử
  // lại ghi thêm dòng cho CÙNG round, đọc lẫn là đọc kết quả của lần đã bị thay.
  const cungLan = o => o.round === round && (cuoi.ts ? o.ts === cuoi.ts : true);
  for (const o of dong.filter(cungLan)) {
    if (o.kind === 'vang-mat') out.muc.push({ evalId: o.evalId || null, cmd: null, nhan: nhanLyDo(o.reason, true, nguon), reason: o.reason || '' });
    else if (!o.kind && o.evalId) {
      const laEval = !String(o.evalId).startsWith('SUITE-');
      if (o.cannot_run) out.muc.push({ evalId: o.evalId, cmd: o.cmd || null, nhan: nhanLyDo(o.reason, laEval, nguon), reason: o.reason || '' });
      else if (o.exit_code != null && laEval && o.exit_code !== (expectedExit[o.evalId] ?? 0))
        out.muc.push({ evalId: o.evalId, cmd: o.cmd || null, nhan: 'vat', reason: `exit ${o.exit_code}` });
      else if (o.exit_code != null && !laEval && o.exit_code !== 0)
        out.muc.push({ evalId: o.evalId, cmd: o.cmd || null, nhan: 'vat', reason: `exit ${o.exit_code}` });
    }
  }
  const soChanKhai = Number.isInteger(cuoi.blocked) ? cuoi.blocked : null;
  const soChanThay = out.muc.filter(m => m.nhan === 'mu' || m.nhan === 'chet' || m.nhan === null).length;
  out.daThuLai = tallies.filter(o => o.round === round && String(o.verdict).toUpperCase() === 'BLOCKED').length >= 2;
  if (!out.muc.length) out.trangThai = 'khoa';                               // BLOCKED mà không thấy mục nào: không đoán
  else if (soChanKhai != null && soChanThay < soChanKhai) out.trangThai = 'khoa';   // mục chặn không để lại dòng (suite chết)
  else if (out.muc.some(m => m.nhan === null || m.nhan === 'vat')) out.trangThai = 'khoa';
  else if (out.muc.some(m => m.nhan === 'chet')) out.trangThai = out.daThuLai ? 'mo' : 'chet-lan-dau';
  else out.trangThai = 'mo';
  return out;
}

// ── ký trên cạnh gãy: mọi mục chặn của lượt cuối có dòng sổ khớp khuôn ──────────
function kyTrenCanhGay({ canh, ledgerText }) {
  const dong = docDong(ledgerText);
  const thieu = [];
  for (const m of canh.muc) {
    const tt = tienToKy(TEN[m.nhan] || '', m.evalId);
    if (!dong.some(o => o.type === 'revisit' && typeof o.decision === 'string' && o.decision.startsWith(tt))) thieu.push(m.evalId);
  }
  return { ok: canh.trangThai === 'mo' && !thieu.length, thieu };
}

// ── CLI cho lưới trước-merge (bash không gọi được hàm) ─────────────────────────
//   node lib/nhan-canh-gay.cjs --check --root <repo> --slug <slug>
//   → stdout «OK <E…>» thoát 0 · «THIEU <E…>» thoát 1 · «KHONG <lý do>» thoát 2
function checkHoSo(root, slug) {
  const ws = path.join(root, '_acceptance', slug);
  const doc = f => { try { return fs.readFileSync(path.join(ws, f), 'utf8'); } catch { return ''; } };
  const rep = doc('evidence-report.md');
  const vm = rep.match(/^verdict:\s*([^\s#]+)/m);
  const verdict = vm ? vm[1].replace(/["']/g, '').toUpperCase() : '';
  let expectedExit = {};
  try { const ey = require('./eval-yaml.cjs'); const r = ey.expectedExits(doc('evals.yaml')); if (!r.errs.length) expectedExit = Object.fromEntries(r.byId); } catch { /* không đọc được → mặc định 0 */ }
  const canh = canhGay({ runLogText: doc('run-log.jsonl'), verdict, expectedExit, nguon: NGUON });
  if (canh.trangThai !== 'mo') return { code: 2, out: `KHONG ${canh.trangThai}` };
  const k = kyTrenCanhGay({ canh, ledgerText: doc('decisions.jsonl') });
  if (!k.ok) return { code: 1, out: `THIEU ${k.thieu.join(' ')}` };
  return { code: 0, out: `OK ${canh.muc.map(m => m.evalId).join(' ')}` };
}
if (require.main === module) {
  const a = process.argv.slice(2);
  const v = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  if (!a.includes('--check') || !v('--root') || !v('--slug')) { console.error('usage: nhan-canh-gay.cjs --check --root <repo> --slug <slug>'); process.exit(3); }
  const r = checkHoSo(v('--root'), v('--slug'));
  console.log(r.out); process.exit(r.code);
}

module.exports = { NHAN, TEN, NGUON, nguonNhan, soKhopEngine, nhanLyDo, canhGay, kyTrenCanhGay, checkHoSo, tienToKy, KHUON_DECISION, docDong };
