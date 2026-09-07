'use strict';
/* eval-yaml.cjs — parser DÒNG cho evals.yaml, dùng chung bởi gate-card.js, evidence-core.cjs (luật làn re-pin, vendor sang consumer theo INIT-CI-COPY-LIST — đuôi .cjs để sống trong repo type:module) và
 * eval-coverage-lint.js. Cố ý KHÔNG dùng thư viện YAML (mirror độ khoan dung
 * của hooks), nhưng PHẢI hiểu block scalar: khuôn eval-gen viết `expected: >`
 * nên regex một-dòng chỉ bắt được ">" — NEG_RE test trên ">" luôn false, và
 * covGaps (thẻ Cổng 1) lẫn W1/W3 (lint) bắn cảnh báo giả cho mọi AC khớp
 * THRESHOLD_RE dù expected đầy ca âm. Hai bản sao của cùng parser đã trôi
 * cùng nhau; sửa một chỗ tại đây, không mọc bản thứ ba.
 *
 * Hai luật:
 *   1. giá trị block (`key: >` / `key: |`, kèm chomping/indent indicator) =
 *      các dòng thụt sâu hơn key, join '\n', trim từng dòng;
 *   2. dòng THÂN block không bao giờ được quét key — một dòng "criterion: ..."
 *      hay "- id: ..." nằm trong thân expected không được cướp state của eval.
 */

// >, |, >-, |+, >2 … cộng comment đuôi tuỳ chọn — đúng cú pháp header block YAML.
const BLOCK_RE = /^[>|][+-]?\d*\s*(?:#.*)?$/;

/**
 * @param {string} text nội dung evals.yaml
 * @param {string[]} fields các key cần lấy ngoài id (vd ['criterion','expected'])
 * @param {(s:string)=>string} [normalize] chuẩn hoá giá trị MỘT-DÒNG (quote /
 *   comment đuôi — mỗi caller giữ tolerance sẵn có của nó); thân block giữ
 *   nguyên vì comment trong thân là DATA, không phải comment.
 * @returns {Array<{id:string}>} mỗi phần tử có thêm mọi key trong `fields` ('' nếu vắng)
 */
function parseEvals(text, fields, normalize) {
  const norm = normalize || (s => String(s).trim());
  const evals = [];
  let cur = null;
  let blk = null; // block scalar đang mở: { key: string|null, indent, lines }
  const closeBlk = () => { if (blk && cur && blk.key) cur[blk.key] = blk.lines.join('\n').trim(); blk = null; };
  for (const raw of String(text == null ? '' : text).split('\n')) {
    const line = raw.replace(/\t/g, '  ');
    if (blk) {
      if (!line.trim()) { blk.lines.push(''); continue; }
      const ind = line.search(/\S/);
      if (ind > blk.indent) { blk.lines.push(line.trim()); continue; }
      closeBlk(); // dedent → dòng này là dòng thường, rơi tiếp xuống dưới
    }
    const idM = line.match(/^\s*-\s+id:\s*(.+)$/);
    if (idM) { if (cur) evals.push(cur); cur = { id: idM[1].trim() }; for (const f of fields) cur[f] = ''; continue; }
    if (!cur) continue;
    const km = line.match(/^(\s*)([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/);
    if (!km) continue;
    const val = km[3].trim();
    const wanted = fields.indexOf(km[2]) >= 0;
    // key: > mở block cho MỌI key (kể cả không lấy, vd cmd: |) — thân phải bị
    // nuốt để không bị quét nhầm thành key của eval.
    if (BLOCK_RE.test(val)) { blk = { key: wanted ? km[2] : null, indent: km[1].length, lines: [] }; continue; }
    if (wanted) cur[km[2]] = norm(val);
  }
  closeBlk();
  if (cur) evals.push(cur);
  return evals;
}

module.exports = { parseEvals, BLOCK_RE };
