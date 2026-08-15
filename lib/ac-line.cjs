/**
 * ac-line.cjs — MỘT nơi duy nhất quyết định "thế nào là một dòng criterion".
 *
 * Tách khỏi scripts/gate-card.js vì hai bản regex inline trôi độc lập (dòng 175
 * + 260 của bản cũ) chính là điều kiện đủ để lớp lỗi "card đọc thiếu criterion
 * mà không kêu" tái sinh. Ai cần bóc dòng criterion thì require file này —
 * không copy khuôn.
 */
// Blind-spot detector. AC_LINE below can only ever recognise the variants we have
// ALREADY seen; the next house style drifts in silently and the card renders short.
// So count lines that LOOK like an AC bullet and compare against what actually
// parsed (scope rule spelled out below the two regexes).
//   n === 0 && m > 0  → BLANK  (card shows nothing; obvious once seen)
//   0 < n < m         → SHORT  (card looks normal while hiding criteria — the case
//                               that survived a real signature: 2 of 8 on radar-d3)
// SHORT is the dangerous one, so it gets its own arm rather than riding on BLANK.
// SUSPECT must be strictly LOOSER than AC_LINE or it detects nothing new — the bullet
// marker is optional because real contracts declare criteria as bold headings too
// (`**AC-1 — Strip shows …**`, 13 of them in video-compose-progress-ux).
const AC_SUSPECT = /^\s*(?:[-*]\s+)?\*{0,2}\s*AC-\d+\b/;
// …but an id followed by a separator opens a CROSS-REFERENCE, not a declaration
// (`**AC-5, AC-9, AC-10 chưa có gì**` in a Notes paragraph). Counting those cries wolf
// on a healthy contract, which the contract's own control case forbids.
const AC_XREF = /^\s*(?:[-*]\s+)?\*{0,2}\s*AC-\d+\s*[,;/]/;
// Scope: inside the criteria section when there IS one, whole file when there is not.
// Whole-file everywhere over-counts — a Known-limits note like `- **AC-4** — …:` is
// declaration-shaped but is not a declaration (measured: s4-scope-triage line 88 raised
// a false 15/16). Whole-file only when section() came back empty keeps the case this
// detector exists for: a wrong heading leaves no section to scope to.
// Luật ranh giới KHÔNG sống ở đây — nó ở bảng marker của lib/md-section.cjs. Bản
// duyệt riêng trước đây của file này là đúng thứ `findings-section-boundary` vừa
// gỡ khỏi gate-card.js ("xoá bản sao section()"); giữ nó lại là dựng lại y hệt
// điều kiện sinh lỗi mà cả hai feature đang đi đóng.
const { sectionLines } = require('./md-section.cjs');
function acBlindSpot(contractText, parsedIds) {
  const inSec = sectionLines(contractText, 'Criteria');
  const scan = inSec.length ? inSec : contractText.split('\n').map((l, i) => ({ no: i + 1, l }));
  const suspect = [];
  for (const { no, l } of scan) { if (AC_SUSPECT.test(l) && !AC_XREF.test(l)) suspect.push(no); }
  const m = suspect.length, n = parsedIds.length;
  if (m === 0 || n >= m) return null;
  const headingM = contractText.match(/^#{2,6}\s+.*criteri\w*.*$/im);
  return { kind: n === 0 ? 'blank' : 'short', suspect: m, parsed: n, lines: suspect, heading: headingM ? headingM[0].trim() : null };
}
function blindSpotText(b) {
  if (!b) return '';
  const where = b.heading ? `section "${b.heading}"` : 'không thấy heading criterion nào trong file';
  return b.kind === 'blank'
    ? `KHÔNG đọc được criterion nào, dù file có ${b.suspect} dòng trông như criterion (dòng ${b.lines.join(', ')}). Đã tìm ở ${where}. Card này KHÔNG phản ánh hợp đồng — sửa contract rồi render lại, đừng duyệt.`
    : `Đọc THIẾU ${b.suspect - b.parsed}/${b.suspect} dòng trông như criterion (tổng ở dòng ${b.lines.join(', ')}), chỉ bóc được ${b.parsed}. Đã tìm ở ${where}. Card này đang hiện một phần hợp đồng — sửa contract rồi render lại, đừng duyệt.`;
}
// AC bullet. The template form is `- AC-1: Given …, When …, Then …`, but real
// contracts accumulated three house variants the strict form silently dropped:
// `**` emphasis around the id, a parenthetical label between id and colon, and
// `.` used instead of `:`. Measured on a 170-contract repo, the strict form saw
// 838 of 1156 real AC lines — 28% invisible, with 43 contracts rendering 0 AC
// and (worse) 11 rendering a TRUNCATED list. A card that drops criteria without
// saying so is the exact false-green this tool exists to stop, so parse WIDE and
// let parseAC() below be the single place that decides what an AC line is.
// The id must still open the bullet — prose merely MENTIONING "AC-13" never matches.
// Emphasis may close on EITHER side of the label — `**AC-10** (judgment) …` and
// `**AC-1 (nhãn):** …` both occur in real contracts, so allow `*` at both spots.
const AC_LINE = /^\s*[-*]\s*\*{0,2}\s*(AC-\d+)\b\*{0,2}\s*(\([^)]*\))?\s*[:.]?\s*\*{0,2}\s*(.+)$/;
// judgment is read from the LABEL loosely (`(chi phí có trần — judgment)`) but from
// the BODY only via the exact `(judgment)` tag — a Then-clause discussing judgment
// must not silently reclassify a machine-checkable criterion as human-only.
// A `(judgment)` inside a code span is the criterion QUOTING the tag, not carrying
// it — same rule lib/context-glossary.js applies for W6 ("code spans are not the
// author speaking"). Without this, a contract that documents the tag demotes its own
// machine-checkable criteria to human-only, which on T3 sends them to a human verdict
// the evals already proved. Measured over 178 contracts: 157 AC lines carry the tag,
// only 4 have it solely inside backticks, and the 2 in consumer repos keep judgment
// via their label — so this narrows nothing that was genuinely tagged.
const uncoded = s => String(s).replace(/`[^`]*`/g, '');
// strip the tag only where it is the author speaking — a quoted `(judgment)` inside a
// code span is documentation and must survive verbatim into the rendered gwt.
const stripTag = s => String(s).split(/(`[^`]*`)/).map(p => p.startsWith('`') ? p : p.replace(/\(judgment\)/ig, '')).join('');
function parseAC(line) {
  // A cross-reference opens with an id then a separator (`**AC-5, AC-9, AC-10 chưa
  // có gì**`). AC_LINE is permissive enough to swallow one, which then lands on the
  // card as a criterion whose text is a Notes sentence — and, when the id repeats,
  // silently overwrites the real criterion's wording. Measured: 1 such line across
  // 178 contracts, and it is prose. Same rule the blind-spot scan uses.
  if (AC_XREF.test(line)) return null;
  const m = line.match(AC_LINE); if (!m) return null;
  const [, id, label = '', body] = m;
  const judgment = /judgment/i.test(uncoded(label)) || /\(judgment\)/i.test(uncoded(body));
  // crossLayer đọc theo ĐÚNG luật của judgment ngay trên — nhãn lỏng, thân bài
  // chỉ nhận tag đúng chữ, và cả hai đi qua uncoded() vì code span KHÔNG phải
  // tác giả đang nói. Trước đây Dấu này không sống ở đây: mỗi consumer tự dò
  // bằng `/\(cross-layer\)/i` trần trên `gwt`, nên một criterion TRÍCH DẪN Dấu
  // (hồ sơ giải thích Dấu cho người mới) bị chấm như criterion MANG Dấu — ở
  // eval-coverage-lint là W4 bắn giả, ở pre-merge-check là VIOLATION GIẢ CHẶN
  // MERGE. Hồ sơ ngược #36. Đối xứng vỡ đúng chỗ này là lý do lỗi tồn tại:
  // judgment theo luật "một nguồn", crossLayer thì không.
  // Đo trước khi đổi (556 criterion, kit + một repo tiêu thụ, 07/08/2026):
  // 7 criterion mang Dấu trước, 7 sau — KHÔNG criterion nào đổi trạng thái.
  // Tức bán kính bằng 0 trên dữ liệu hiện có; nó chặn ca sai TƯƠNG LAI, và
  // đó là lý do phải có fixture tổng hợp chứ không chờ hồ sơ thật lộ ra.
  const crossLayer = /cross-layer/i.test(uncoded(label)) || /\(cross-layer\)/i.test(uncoded(body));
  const gwt = stripTag((label ? label + ' ' : '') + body).trim();
  // A criterion with no words is not a criterion. `- **AC-1**` backtracks into a match
  // whose whole body is a leftover `*`, which would put a bullet character on the card
  // as if it were a requirement — and, worse, count toward `parsed` so the blind-spot
  // scan sees nothing wrong. Returning null makes such a line SUSPECT-but-unparsed,
  // which is exactly what it is.
  if (!/[\p{L}\p{N}]/u.test(gwt)) return null;
  return { id, gwt, judgment, crossLayer };
}

module.exports = { AC_LINE, AC_SUSPECT, AC_XREF, parseAC, acBlindSpot, blindSpotText };
