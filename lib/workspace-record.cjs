// workspace-record.cjs — LUẬT DUY NHẤT trả lời "hồ sơ của slug này có hỏng
// không", dùng chung bởi MỌI bên đọc `_acceptance/<slug>/`.
//
// Vì sao một chỗ: bản đồ sản phẩm và bộ quét vào phiên là hai READER của cùng
// một bộ hồ sơ. Ở S4-r1 chúng đã trôi khỏi nhau ngay lần đầu ra mắt — cùng một
// `uat-session.md` mất frontmatter, bộ quét gọi là hỏng còn bản đồ xếp vào
// "Đã ship — chờ phiên nghiệm thu". Hai kết luận trái nhau về cùng một sự thật
// là false-green đúng nghĩa, và vá riêng từng bên chỉ dời chỗ trôi. Ai thêm
// bên đọc thứ ba thì gọi hàm này, đừng chép luật.
const { frontmatterField, machineClearedSignoffConflict, chuKyThat } = require('./evidence-core.cjs');
const { readFileSync } = require('node:fs');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// ĐỌC hồ sơ — ENOENT (file vắng) là tin bình thường; MỌI lỗi khác là sự thật
// phải nêu tên. Nuốt chung một rọ biến "mất quyền đọc" thành "không có file",
// và slug bị phân ô theo artifact bên cạnh: bản đồ từng xếp một việc mất quyền
// đọc contract.md vào "Sắp mở vòng" trong khi bộ quét gọi nó là hỏng (S4-r14,
// dựng lại được bằng chmod 000). Ngữ nghĩa đọc là MỘT PHẦN của luật đọc hồ sơ,
// nên nó ở đây chứ không phải một `read` cục bộ trong từng reader.
function readRecord(p) {
  try { return { t: readFileSync(p, 'utf8'), err: null }; }
  catch (e) { return e.code === 'ENOENT' ? { t: null, err: null } : { t: null, err: e }; }
}

const ioReason = err => `không đọc được (${err.code})`;

// Luật khoá theo (FILE, FIELD) chứ không theo tên field trần: `stage` là HAI
// enum khác nhau — `discovery|decided|archived` trong opportunity.md và
// `scheduled|held` trong uat-session.md. Bảng khoá theo tên trần thì người sau
// thêm cặp uat/stage vào sẽ gắn nhầm enum của opportunity và bắn "hồ sơ hỏng"
// lên MỌI phiên nghiệm thu hợp lệ, ở cả hai reader cùng lúc (S4-r3).
//
//   required  — file có mặt thì khoá phải ĐỌC ĐƯỢC (null = frontmatter hỏng
//               hoặc thiếu hẳn key, cả hai là hồ sơ hỏng).
//   allowEmpty— giá trị RỖNG là trạng thái hợp lệ (khoá cố ý để trống tới lúc
//               người ký). Rỗng ở khoá không allowEmpty là hồ sơ hỏng, không
//               phải khoảng trống vô hại.
const NAV_RULES = {
  'contract.md': {
    status: { enum: ['draft', 'approved', 'implemented', 'verified', 'signed-off', 'machine-cleared', 'da-cham-boi-thuc-te'], required: true },
  },
  'opportunity.md': {
    stage: { enum: ['discovery', 'decided', 'archived'], required: true },
    decision: { enum: ['build', 'iterate', 'park', 'kill'], allowEmpty: true },
  },
  'uat-session.md': {
    verdict: { enum: ['release', 'iterate', 'kill'], required: true, allowEmpty: true },
    stage: { enum: ['scheduled', 'held'], allowEmpty: true },
  },
  // `verdict` ở đây là enum CỦA CỔNG MÁY — khác hẳn enum release/iterate/kill
  // của phiên nghiệm thu ngay trên. Khoá theo (FILE, FIELD) là để hai thang
  // điểm này không bao giờ chấm lẫn nhau (AC-2 workspace-reader-unification).
  'evidence-report.md': {
    verdict: { enum: ['pass', 'pending-judgment', 'reject', 'blocked'], required: true },
  },
};

// Hai file NÀY là bằng chứng một slug tồn tại. Chỉ có `uat-session.md` mà
// thiếu cả hai là hồ sơ hỏng — KHÔNG được lọt qua rồi biến mất khỏi mọi ô
// (hồi quy S4-r3: bản vá gộp luật đã xoá mất nhánh này).
const ANCHOR_FILES = ['contract.md', 'opportunity.md'];

const NAV_FIELDS = Object.entries(NAV_RULES)
  .flatMap(([file, fields]) => Object.keys(fields).map(field => [file, field]));

function fieldProblem(file, txt, field) {
  const rule = (NAV_RULES[file] || {})[field];
  if (!rule) return null;
  const raw = frontmatterField(txt, field);
  if (raw == null)
    return rule.required ? { file, reason: `frontmatter không đọc được hoặc thiếu ${field}` } : null;
  if (raw === '')
    return rule.allowEmpty ? null : { file, reason: `${field} không nhận diện được: (rỗng)` };
  if (!rule.enum.includes(raw.toLowerCase()))
    return { file, reason: `${field} không nhận diện được: ${raw}` };
  return null;
}

// ĐIỀU KIỆN TIÊU THỤ — luật DUY NHẤT trả lời "trạng thái này DÙNG hồ sơ nào".
//
// Vì sao ở đây chứ không để mỗi reader tự suy: bảng enum đã gom về một chỗ ở
// S4-r3 nhưng điều kiện tiêu thụ thì vẫn chép đôi, nên hai bên tiếp tục trôi
// khỏi nhau ở r12 (bản đồ soi opportunity.md trên lối bộ quét không đọc) và ở
// r13 (bộ quét bỏ qua stage của phiên nghiệm thu, bỏ qua decision lạ khi stage
// chưa `decided`). Gom LUẬT mà để lại ĐIỀU KIỆN GỌI LUẬT là gom một nửa: cùng
// một bảng enum áp lên hai tập hồ sơ khác nhau vẫn ra hai kết luận khác nhau.
//
// Doctrine (start-scan-hardening, học qua 4 round): hồ sơ nào trạng thái hiện
// tại KHÔNG dùng thì lỗi của nó không được quyết định ô của slug.
//   contract.md    — luôn tiêu thụ, nó quyết định mọi lối.
//   uat-session.md — chỉ khi hợp đồng đã ký.
//   opportunity.md — chỉ khi KHÔNG có hợp đồng (còn ở khám phá), HOẶC đã ký mà
//                    phiên nghiệm thu chưa chốt verdict (lúc đó mới dò đường A).
// HAI trạng thái «đã thông Cổng Bằng chứng»: người ký (`signed-off`) hoặc máy thông
// (`machine-cleared` — xanh-sạch sáu điều kiện, KHÔNG chữ ký; lưới trước-merge kiểm lời
// khai đó). Mảng export để các bên đọc HỎI, đừng chép — chép là hai bản trôi.
const DA_THONG_CONG_2 = ['signed-off', 'machine-cleared'];
function usesUat(contractTxt) {
  if (contractTxt == null) return false;
  return DA_THONG_CONG_2.includes((frontmatterField(contractTxt, 'status') || '').toLowerCase());
}

function usesOpportunity(contractTxt, uatTxt) {
  if (contractTxt == null) return true;
  if (!usesUat(contractTxt)) return false;
  return !(uatTxt != null && frontmatterField(uatTxt, 'verdict'));
}

// Trạng thái nào TIÊU THỤ hồ sơ bằng chứng (đọc và kiểm khuôn khi file có):
// implemented (máy đang chấm) và verified (máy chấm xong chờ ký). signed-off
// KHÔNG tiêu thụ — ma trận P105 ghim: sau ký, ô của slug do uat/decision quyết,
// evidence hỏng không được lôi việc đã ký về "hồ sơ hỏng".
const EVIDENCE_CONSUMING = ['implemented', 'verified', 'machine-cleared'];
function usesEvidence(contractTxt) {
  if (contractTxt == null) return false;
  return EVIDENCE_CONSUMING.includes((frontmatterField(contractTxt, 'status') || '').toLowerCase());
}

// Luật khai-xong-mà-thiếu-file (trước sống RIÊNG ở start-scan và pre-merge):
// CHỈ verified đòi file phải tồn tại — implemented chưa chấm lần nào thì vắng
// là bình thường (bước kế là S4). Trả {file, reason} hoặc null.
// `machine-cleared` cũng đòi file: nó TỰ KHAI sáu điều kiện xanh-sạch, mà lời khai không
// có vật thì không kiểm được. Luật ở ĐÂY chứ không ở từng reader — bản vá riêng trong
// start-scan là đúng hình dạng đã làm hai bên trôi khỏi nhau ở r12/r13 (P123 bắt lại).
const ARTIFACT_REQUIRING = ['verified', 'machine-cleared'];
function missingArtifact(texts) {
  const c = texts['contract.md'];
  if (c == null) return null;
  const st = (frontmatterField(c, 'status') || '').toLowerCase();
  if (!ARTIFACT_REQUIRING.includes(st)) return null;
  if (texts['evidence-report.md'] != null) return null;
  return { file: 'evidence-report.md', reason: `status ${st} nhưng thiếu evidence-report.md` };
}

// Mâu thuẫn hai sự thật: hồ sơ tự khai «máy thông, không chữ ký» mà báo cáo lại có chữ ký.
// Cùng chỗ với missingArtifact vì cùng vai: luật đọc hồ sơ, mọi reader hỏi chung.
function conflictProblem(texts) {
  const msg = machineClearedSignoffConflict(texts['contract.md'], texts['evidence-report.md']);
  return msg ? { file: 'evidence-report.md', reason: msg } : null;
}

// Nhận NGUYÊN văn 3 file đã đọc, trả đúng tập được tiêu thụ (file bị loại →
// null). Bên đọc nào cần đọc lười thì gọi thẳng usesUat/usesOpportunity để
// quyết định có mở file hay không, rồi vẫn đi qua hàm này — một đường duy nhất.
function consumedTexts({ contract = null, opportunity = null, uat = null, evidence = null }) {
  const u = usesUat(contract) ? uat : null;
  return {
    'contract.md': contract,
    'opportunity.md': usesOpportunity(contract, u) ? opportunity : null,
    'uat-session.md': u,
    'evidence-report.md': usesEvidence(contract) ? evidence : null,
  };
}

// ── Hồ sơ NGHỈ ───────────────────────────────────────────────────────────────
// Sự thật «nghỉ» là một DÒNG SỔ, không phải một status: chữ ký là sử liệu, nên
// không bộ phận nào của kit được sửa tệp đã ký để nói một điều mới (owner từ
// chối 17/09). Vị từ ở ĐÂY vì BỐN bên đọc — cổng trước-merge · kiểm lại bằng
// chứng · bộ quét · thẻ (qua bộ quét) — phải cho CÙNG một câu trả lời; bản sao
// thứ hai của luật là đúng lớp lỗi hai-bộ-đọc mà tệp này sinh ra để đóng.
//
// Vì sao cần: luật làn eval (owner 08/09, hai lần) nói pin chưa chứng là nợ ở
// MỌI lượt chạy, lối ra duy nhất là ghim lại — đúng, TRỪ món nợ không bao giờ
// trả được (tiền đề ngoài chết, hoặc vật đã cố ý đổi sau chữ ký).
const NGHI_VE = ['by', 'decision', 'at'];
// THU PHẠM VI (owner quyết 19/09, sau lượt chấm 2): dòng nghỉ chỉ có hiệu lực
// trên hồ sơ ĐÃ CÓ CHỮ KÝ NGƯỜI. «Nghỉ» nghĩa là một lời hứa ĐÃ ĐƯỢC KÝ nay
// không kiểm lại được — hồ sơ chưa ai ký thì chưa có lời hứa nào để cho nghỉ,
// nó bị bác hoặc xếp lại ở tầng cơ hội.
//
// Vì sao hẹp lại: đo tay 19/09 trên fixture code sinh — hồ sơ `verdict: REJECT`,
// KHÔNG chữ ký, cổng chặn đúng (1 vi phạm); thêm ĐÚNG MỘT dòng nghỉ thì cổng
// thoát 0, 0 vi phạm. Lối thoát `continue` của cổng bỏ qua TOÀN BỘ thân vòng,
// nên một dòng sổ không có khoá model-invocation mở đường gộp cho một hồ sơ
// chưa ai phán. Chữ ký là điều kiện duy nhất đóng được lỗ ấy mà không cắt mất
// ca thật nào (OneFlow normalize-text-vi và 14 hồ sơ của kit đều đã ký).
function hoSoNghi({ ledgerText = null, reportText = null, contractAtRoot = true, suLieuContract = false } = {}) {
  if (ledgerText != null) {
    const dong = [];
    for (const l of String(ledgerText).split('\n')) {
      if (!l.trim()) continue;
      try { const e = JSON.parse(l); if (e && typeof e === 'object' && !Array.isArray(e)) dong.push(e); }
      catch { /* dòng hỏng: bỏ qua, cùng nếp với mọi bộ đọc sổ (gate-card readLedger) */ }
    }
    // Dòng nghỉ CUỐI thắng; một dòng BẤT KỲ mang `supersedes` trỏ đúng id ấy thì
    // nghỉ hết hiệu lực. Mở lại đưa hồ sơ về ĐÚNG luật cũ (chặt hơn), nên bỏ qua
    // `supersedes` là fail-OPEN — hồ sơ sống lại mà vẫn được miễn cổng.
    const nghi = [...dong].reverse().find(e => e.type === 'nghi');
    if (nghi) {
      const goBo = dong.some(e => e.supersedes && String(e.supersedes) === String(nghi.id));
      if (!goBo) {
        const thieu = NGHI_VE.filter(k => {
          const v = nghi[k];
          if (typeof v !== 'string' || !v.trim()) return true;
          return k === 'at' ? Number.isNaN(Date.parse(v)) : false;
        });
        if (thieu.length) return { kieu: 'dong-so-thieu', thieu: thieu.sort() };
        // Chưa ký thì dòng nghỉ KHÔNG có hiệu lực — và phải NÓI RA, không im:
        // người viết dòng ấy cần biết vì sao nó không ăn.
        if (!chuKyThat(reportText).signed) return { kieu: 'chua-ky' };
        return {
          kieu: 'dong-so', by: nghi.by.trim(), at: nghi.at.trim(),
          ly_do: nghi.decision.trim(), id: String(nghi.id || ''),
        };
      }
    }
  }
  // Đường đọc-cũ: kit tự cho một hồ sơ nghỉ (17/09) bằng cách chuyển hợp đồng
  // vào `su-lieu/`. Cổng vốn mù với hình dạng đó VÌ ĐƯỜNG DẪN — nhận ra nó là
  // cách duy nhất để nói ra một lỗ fail-open đang được dùng làm nghi thức.
  if (!contractAtRoot && suLieuContract) return { kieu: 'su-lieu-cu' };
  return null;
}

// texts: { 'contract.md': string|null, 'opportunity.md': ..., 'uat-session.md': ... }
// Trả { file, reason } cho vấn đề ĐẦU TIÊN gặp, hoặc null nếu hồ sơ đọc được.
function recordProblem(texts) {
  if (ANCHOR_FILES.every(f => texts[f] == null))
    return { file: '(workspace)', reason: 'không có contract.md lẫn opportunity.md' };
  for (const [file, field] of NAV_FIELDS) {
    if (texts[file] == null) continue;
    const p = fieldProblem(file, texts[file], field);
    if (p) return p;
  }
  return null;
}

// Giá trị điều hướng đã chuẩn hoá (chữ thường, '' khi vắng) — chỉ gọi SAU khi
// recordProblem trả null, lúc đó mọi giá trị đều đọc được và hợp enum.
// `stage` ở đây là stage của OPPORTUNITY (thứ quyết định ô); stage của phiên
// nghiệm thu không tham gia phân ô nên không trả ra, tránh lẫn hai enum.
function navValues(texts) {
  const pick = (file, field) => {
    const txt = texts[file];
    if (txt == null) return '';
    const raw = frontmatterField(txt, field);
    return raw == null ? '' : raw.toLowerCase();
  };
  return {
    status: pick('contract.md', 'status'),
    stage: pick('opportunity.md', 'stage'),
    decision: pick('opportunity.md', 'decision'),
    verdict: pick('uat-session.md', 'verdict'),
  };
}

// ĐỌC một danh sách trong `_acceptance/config.yaml` (t1_skip_globs, t3_paths…)
// — cắt ĐÚNG section rồi bóc `- `, comment đuôi, và nháy. Regex quét cả file
// thì sai hai chiều: `- "PRODUCT-MAP.md"   # bản đồ` bị coi là chưa khai (âm
// tính giả), còn cùng chuỗi nằm dưới `t3_paths:` lại bị coi là đã khai (dương
// tính giả). Bản bash trong scripts/pre-merge-check.sh làm đúng các bước này;
// hai bên đọc cùng một khoá không được cho hai kết luận trái nhau (S4-r15).
function configList(cfgTxt, key) {
  const lines = String(cfgTxt || '').split('\n');
  // Dòng khoá được mang comment đuôi (`  t1_skip_globs:   # ghi chú`) — bản
  // bash của pre-merge đọc được hình dạng này, neo `\s*$` ở đây thì bản JS
  // trả rỗng và hai bên đọc cùng một khoá cho hai kết luận trái nhau
  // (bug round 16 product-map-uat-session, Notes của contract kế nhiệm).
  const start = lines.findIndex(l => new RegExp('^\\s{2}' + key + ':\\s*(#.*)?\\r?$').test(l));
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\s{0,2}[A-Za-z0-9_-]+:/.test(line)) break;      // sang khoá kế
    const m = line.match(/^\s*-\s*(.*)$/);
    if (!m) continue;
    const v = m[1].replace(/\s*#.*$/, '').trim().replace(/^["'](.*)["']$/, '$1').trim();
    if (v) out.push(v);
  }
  return out;
}

// ── Trạng thái bản đồ sản phẩm — MỘT bảng nhãn cho mọi bên đọc ──────────────
// Ba bên từng giữ ba chuỗi riêng (product-map --check, bộ quét /start, thân
// lệnh start.md) nên "đã xoá" ở nơi này là "chưa dựng" ở nơi khác. State suy
// từ hai tín hiệu máy-kiểm-được:
//   exists  — PRODUCT-MAP.md có trong cây làm việc
//   tracked — repo coi bản đồ là PHẢI CÓ: index/lịch-sử git, HOẶC config khai
//             PRODUCT-MAP.md trong t1_skip_globs (tín hiệu duy nhất sống được
//             trên checkout nông của CI — không cần lịch sử)
function mapState({ exists, tracked }) {
  return exists ? 'dang-co' : (tracked ? 'da-xoa' : 'chua-bat');
}
const MAP_LABELS = {
  'dang-co': 'đang có',
  'da-xoa': 'PRODUCT-MAP.md đã bị xoá khỏi cây làm việc',
  'chua-bat': 'repo chưa bật bản đồ sản phẩm',
};

// tracked — MỘT nguồn tín hiệu cho mọi bên đọc (S4-r1 vòng này: bộ quét chỉ
// hỏi config còn cổng CI hỏi cả git, nên cây clone-đầy-đủ có bản đồ từng
// commit mà config không khai bị hai bên kết luận trái nhau). Ba tín hiệu,
// tín hiệu nào TRÚNG trước trả trước:
//   daBat     — config khai PRODUCT-MAP.md trong t1_skip_globs (không cần
//               lịch sử — tín hiệu duy nhất sống trên checkout nông của CI)
//   trongIndex— git còn theo dõi file (xoá khỏi cây làm việc chưa commit)
//   tungBiXoa — lịch sử có lần xoá (PR đã commit việc xoá)
// git vắng/không phải repo → hai tín hiệu git im lặng, còn lại config.
function mapTracked(root, cfgTxt) {
  if (configList(cfgTxt || '', 't1_skip_globs').includes('PRODUCT-MAP.md')) return true;
  const git = args => {
    try {
      return execFileSync('git', ['-C', root, ...args],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    } catch { return null; }
  };
  if (git(['ls-files', '--error-unmatch', '--', 'PRODUCT-MAP.md']) != null) return true;
  if ((git(['log', '--diff-filter=D', '--format=%H', '-1', '--', 'PRODUCT-MAP.md']) || '').trim() !== '') return true;
  return false;
}

// ── Trạng thái thứ bảy: reality đã chấm (hồ sơ nhan-trang-thai-va-reality, ADR 0020 Đ8) ──
// Hồ sơ `da-cham-boi-thuc-te` KHÔNG qua Cổng Bằng chứng — nên nó KHÔNG nằm trong
// DA_THONG_CONG_2. Máy nhận nó là CUỐI: rời nhóm đang dở, khoá việc thước; mở lại duy nhất
// bằng một dòng `supersedes` trỏ id dòng quan sát. Mọi bên đọc hỏi hai thứ dưới, không chép.
const DA_DONG_THUC_TE = ['da-cham-boi-thuc-te'];
// Dòng quan sát do thao tác cổng người thứ bảy ghi (khuôn: khối THUC-TE-LINE của
// commands/observed.md). `build_sha` = sha BẢN DỰNG đang phục vụ prod lúc quan sát (đỉnh nhánh
// phát hành), KHÔNG phải commit đầu tiên đưa vật vào.
// `id` là vế bắt buộc: lưới tìm commit ghi dòng quan sát bằng id để khoá việc thước sau đó —
// thiếu id thì phép khoá không có mốc (S4-r1 t2/t3: git -S '' lỗi, bị nuốt, khoá mở im).
const THUC_TE_VE = ['id', 'by', 'at', 'build_sha', 'decision'];
function thucTe(ledgerText) {
  if (ledgerText == null) return null;
  const dong = [];
  for (const l of String(ledgerText).split('\n')) {
    if (!l.trim()) continue;
    try { const e = JSON.parse(l); if (e && typeof e === 'object' && !Array.isArray(e)) dong.push(e); } catch { /* dòng hỏng: bỏ qua */ }
  }
  const tt = [...dong].reverse().find(e => e.type === 'thuc-te');
  if (!tt) return null;
  if (dong.some(e => e.supersedes && String(e.supersedes) === String(tt.id))) return null;
  const thieu = THUC_TE_VE.filter(k => {
    const v = tt[k];
    if (typeof v !== 'string' || !v.trim()) return true;
    if (k === 'at') return Number.isNaN(Date.parse(v));
    if (k === 'build_sha') return !/^[0-9a-f]{40}$/.test(v.trim());
    return false;
  });
  if (thieu.length) return { kieu: 'dong-so-thieu', thieu: thieu.sort(), id: String(tt.id || '') };
  return { kieu: 'dong-so', by: tt.by.trim(), at: tt.at.trim(), build_sha: tt.build_sha.trim(), ly_do: tt.decision.trim(), id: String(tt.id || '') };
}

// Kiểm một hồ sơ `da-cham-boi-thuc-te` cho lưới trước-merge + recheck (MỘT hàm, hai bên
// gọi). Trả { code, out }: 0 OK · 1 THIEU (vế) · 2 KHONG (không có dòng / đã mở lại) ·
// 3 LA (build_sha không có trong kho) · 4 KHOA (thước của hồ sơ đổi SAU commit ghi dòng quan
// sát — reality là cuối, mở lại bằng `supersedes`).
function checkThucTe(root, slug) {
  const ws = path.join(root, '_acceptance', slug);
  let ledger = null;
  try { ledger = fs.readFileSync(path.join(ws, 'decisions.jsonl'), 'utf8'); } catch { ledger = null; }
  const tt = thucTe(ledger);
  if (!tt) return { code: 2, out: 'KHONG không có dòng quan sát (hoặc đã mở lại bằng supersedes)' };
  if (tt.kieu === 'dong-so-thieu') return { code: 1, out: `THIEU ${tt.thieu.join(' ')}` };
  const git = a => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try { git(['cat-file', '-e', `${tt.build_sha}^{commit}`]); } catch { return { code: 3, out: `LA ${tt.build_sha}` }; }
  let moc = '';
  try { moc = git(['log', '--format=%H', '--reverse', '-S', tt.id, '--', `_acceptance/${slug}/decisions.jsonl`]).split('\n')[0] || ''; } catch { moc = ''; }
  // Không tìm được commit ghi dòng quan sát → ĐÓNG (thiếu mốc), không coi là OK: khoá việc
  // thước không có mốc thì không khoá được gì.
  if (!moc) return { code: 1, out: 'THIEU commit-ghi-dong-quan-sat' };
  {
    let doi = '';
    try { doi = git(['diff', '--name-only', `${moc}..HEAD`, '--', `_acceptance/${slug}/evals.yaml`, `_acceptance/${slug}/rang`]); } catch { doi = ''; }
    if (doi) return { code: 4, out: `KHOA ${doi.split('\n').join(' ')}` };
  }
  return { code: 0, out: `OK ${tt.build_sha.slice(0, 7)} ${String(tt.at).slice(0, 10)} ${tt.by}` };
}

// ── «Hồ sơ đã khép» — MỘT vị từ (hồ sơ ho-so-khep-thoi-hoi, AC-1) ─────────────
// Khép = hồ sơ không còn câu hỏi nào cho người và không còn là cửa veto đang mở: (a) nghỉ có
// hiệu lực (hoSoNghi dong-so — chỉ trên hồ sơ đã ký), hoặc (b) status thuộc DA_DONG_THUC_TE VÀ
// dòng quan sát đủ vế. Dòng quan sát thiếu vế / đã mở lại → KHÔNG khép: cùng chiều fail-closed
// với lưới (rơi về luật của hồ sơ đã arm). Thuần — không chạm git; mọi bên đọc hỏi hàm này.
function hoSoDaKhep({ status = '', ledgerText = null, reportText = null } = {}) {
  const n = hoSoNghi({ ledgerText, reportText, contractAtRoot: true, suLieuContract: false });
  if (n && n.kieu === 'dong-so') return { vi: 'nghi' };
  if (DA_DONG_THUC_TE.includes(String(status || '').trim().toLowerCase())) {
    const tt = thucTe(ledgerText); if (tt && tt.kieu === 'dong-so') return { vi: 'thuc-te' };
  }
  return null;
}

// Mọi slug khép dưới <root>/_acceptance — một lần gọi cho cả vòng lặp bash của lưới.
function slugDaKhep(root) {
  const acc = path.join(root, '_acceptance'); let ds = [];
  try { ds = fs.readdirSync(acc, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name).sort(); } catch { return []; }
  const rd = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
  return ds.filter(s => {
    const c = rd(path.join(acc, s, 'contract.md')); if (c == null) return false;
    return !!hoSoDaKhep({ status: frontmatterField(c, 'status') || '', ledgerText: rd(path.join(acc, s, 'decisions.jsonl')), reportText: rd(path.join(acc, s, 'evidence-report.md')) });
  });
}

module.exports = {
  NAV_RULES, NAV_FIELDS, ANCHOR_FILES,
  recordProblem, navValues, fieldProblem,
  usesUat, usesOpportunity, usesEvidence, missingArtifact, consumedTexts,
  readRecord, ioReason, configList, conflictProblem, hoSoNghi,
  mapState, MAP_LABELS, mapTracked,
  DA_THONG_CONG_2,
  DA_DONG_THUC_TE, THUC_TE_VE, thucTe, checkThucTe,
  hoSoDaKhep, slugDaKhep,
};

// CLI cho lưới trước-merge: node lib/workspace-record.cjs --thuc-te --root <repo> --slug <slug>
if (require.main === module) {
  const a = process.argv.slice(2);
  const v = k => { const i = a.indexOf(k); return i >= 0 ? a[i + 1] : null; };
  // --da-khep --root <repo>: mỗi slug khép một dòng (hồ sơ ho-so-khep-thoi-hoi).
  if (a.includes('--da-khep')) {
    if (!v('--root')) { console.error('usage: workspace-record.cjs --da-khep --root <repo>'); process.exit(5); }
    for (const s of slugDaKhep(v('--root'))) console.log(s);
    process.exit(0);
  }
  if (!a.includes('--thuc-te') || !v('--root') || !v('--slug')) { console.error('usage: workspace-record.cjs --thuc-te --root <repo> --slug <slug>'); process.exit(5); }
  const r = checkThucTe(v('--root'), v('--slug'));
  console.log(r.out); process.exit(r.code);
}
