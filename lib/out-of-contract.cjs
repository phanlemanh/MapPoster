'use strict';
// Đọc kết quả scope-triage từ `review-findings.md` cho thẻ Cổng 2.
//
// Vì sao ở đây chứ không phải một key trong card-plain.json: thẻ chỉ render
// những gì SCRIPT đọc được từ artifact — cùng luật với gap-probe. Một key overlay
// do model tự điền là thứ có thể quên, điền sai, hoặc (như round 1 của chính
// feature này) được khai trong chỉ dẫn mà không renderer nào đọc, nên khối biến
// mất im lặng trong khi manifest vẫn quảng cáo là có.
//
// Nguồn: `_acceptance/<slug>/review-findings.md` do S4 sinh. Thiếu file, hoặc
// file thế hệ cũ không có heading nào → mọi trường rỗng: thẻ render như trước,
// không cờ, không lỗi.

const HEAD_OUT = /^##\s+Ngoài hợp đồng/;
const HEAD_UNCLASSIFIED = /^##\s+Chưa phân loại/;
const HEAD_ANY = /^##\s+/;
// Dòng cờ cụm do S4 ghi nguyên văn; ⚠ ở đầu là dấu phân biệt với dòng "n-a".
const CLUSTER_RE = /^⚠\s*Cụm ngoài vùng phủ:\s*(.+)$/;

// <<<OOC-PROPOSALS — MỘT nguồn của ba token đề xuất VÀ chữ người tương ứng.
// Thẻ in CHỮ NGƯỜI (thân lệnh signoff dạy đúng những chữ này, nên người dán
// lại dòng lệnh là chạy được); token máy chỉ sống trong artifact. Chuỗi ngoài
// danh sách KHÔNG bị ép về một token và KHÔNG bị nuốt — nó ở lại proposal_raw
// để thẻ kêu to (AC-6).
const PROPOSALS = ['known-limits', 'new-contract', 'wont-fix'];
const OOC_GLOSS_NGUOI = {
  'known-limits': 'ghi Known limits',
  'new-contract': 'mở hợp đồng mới',
  'wont-fix': 'chấp nhận, không sửa',
};
// OOC-PROPOSALS>>>
// Token so khớp theo TIỀN TỐ: S4 được phép viết «known-limits — vì …», đuôi
// chú thích giữ nguyên ở proposal_raw. Không so cả chuỗi (8/14 mục thật trong
// xưởng có đuôi — đo 02/09), cũng không so lỏng bằng includes (chuỗi «ghi
// Known limits» của người sẽ lọt).
const tokenOf = v => { const head = String(v).split(/\s*[—(:]/)[0].trim(); return PROPOSALS.includes(head) ? head : ''; };
// Mục có chữ mà 0 finding = NGỜ sai khuôn. KHÔNG tính: câu mở đầu chuẩn của S4,
// và lời khai rỗng hợp lệ («không có», «n-a», mở ngoặc) — hai dạng này có thật
// trong xưởng, coi chúng là ngờ thì cờ vàng thành nhiễu nền và tự vô hiệu.
// ĐẢO CHIỀU (S4-r1): bản đầu dùng ALLOWLIST các câu «lời khai rỗng» («không
// có» · «n-a») rồi đo độ dài — đó là danh sách trắng trên KHÔNG GIAN MỞ và nó
// thủng ngay: xưởng có ít nhất ba cách viết rỗng («(rỗng)», «(rỗng — …)»,
// «(none)»), hai cách thoát chỉ nhờ sàn ký tự chứ không nhờ luật, còn
// «(rỗng — mọi phát hiện đã đóng…)» thì bị gọi oan là sai khuôn.
// Nay đo TÍN HIỆU DƯƠNG của một mục ĐỊNH viết theo khuôn: khuôn
// OOC-ITEM-TEMPLATE bắt buộc tiêu đề in đậm, nên `**` trong thân mục là dấu
// «đã thử viết mục» — có `**` mà parse ra 0 finding = sai khuôn thật. Lời
// khai rỗng là văn xuôi thuần, không có `**`, nên không bao giờ bị gọi oan.
// ĐỔI KHUÔN (owner quyết 02/09, sau khi dừng-vá nổ ở S4-r2): bản trước LIỆT KÊ
// bốn tên trường của khuôn mục. Danh sách ấy là bản chép thứ hai của khuôn bên
// VIẾT nên nó trôi được — và chú giải còn khai một ca đối chiếu chưa từng tồn
// tại (S4-r2 bắt đúng chỗ đó).
//
// Nay hỏi HÌNH DẠNG, không hỏi tên: một mục viết theo khuôn OOC-ITEM-TEMPLATE
// luôn mang hoặc tiêu đề in đậm, hoặc ít nhất một dòng thân dạng «<thụt
// lề><khoá>: <giá trị>». Cả hai là thuộc tính của KHUÔN chứ không phải một
// danh sách từ vựng — đổi tên trường ở bên viết cũng không làm bên đọc mù, và
// không còn gì để hai bên trôi khỏi nhau. Lời khai rỗng («(rỗng — …)»,
// «(none)», «không có») viết PHẲNG thì không trúng cờ.
// GIỚI HẠN ĐÃ KHAI (S4-r3 bác lời khai «không bao giờ oan»): lời khai rỗng kèm
// một dòng THỤT LỀ mang dấu hai chấm («  Ghi chú: …», «  - Lý do: …», URL thụt
// lề) SẼ bị cờ oan. Đo 02/09 trên 63 review-findings thật: 0 ca. Khai để nó
// không im; đừng đổi vế này thành danh sách câu-rỗng — đó là allowlist trên
// không gian mở, chính lớp đã cháy ở bản đầu (sweep-baseline.txt).
const OOC_TRIED_ITEM_RE = /\*\*|^\s+\S[^:]*:\s*\S/;

// Mỗi finding mở đầu bằng `- **<title>**`; các dòng `key: value` thụt vào sau đó
// thuộc về nó. Chỉ rút những trường thẻ cần — detail dài thuộc về gói text, không
// thuộc về thẻ quyết định.
function parseFindings(lines) {
  const out = [];
  let cur = null;
  for (const raw of lines) {
    const title = /^-\s+\*\*(.+?)\*\*\s*$/.exec(raw);
    if (title) {
      if (cur) out.push(cur);
      cur = { title: title[1], file: '', severity: '', proposal: '', proposal_raw: '', plain: '' };
      continue;
    }
    if (!cur) continue;
    const kv = /^\s+(file|severity|Đề xuất|proposal|Người dùng thấy gì)\s*:\s*(.+?)\s*$/.exec(raw);
    if (!kv) continue;
    const k = kv[1];
    const v = kv[2].replace(/^`|`$/g, '');
    if (k === 'file') cur.file = v;
    else if (k === 'severity') cur.severity = v;
    else if (k === 'Người dùng thấy gì') cur.plain = v;
    else { cur.proposal_raw = v; cur.proposal = tokenOf(v); }
  }
  if (cur) out.push(cur);
  return out;
}

function sectionLines(lines, headRe) {
  const start = lines.findIndex(l => headRe.test(l));
  if (start < 0) return null;
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(l => HEAD_ANY.test(l));
  return end < 0 ? rest : rest.slice(0, end);
}

// text = nội dung review-findings.md (chuỗi rỗng khi thiếu file).
// → { present, findings: [{title,file,severity,proposal,plain}], unclassified, cluster }
//
// `plain` là câu ngôn ngữ sản phẩm do bước scope-triage viết — thẻ in CÁI ĐÓ.
// Title do reviewer viết là văn kỹ thuật ("globToRe leaves `?` unescaped…") và
// không bao giờ được đưa thẳng vào chỗ người quyết đọc.
function parse(text) {
  if (typeof text !== 'string' || !text.trim()) {
    return { present: false, findings: [], unclassified: false, cluster: null };
  }
  const lines = text.split(/\r?\n/);
  const outLines = sectionLines(lines, HEAD_OUT);
  const unclassified = lines.some(l => HEAD_UNCLASSIFIED.test(l));
  const clusterLine = lines.map(l => CLUSTER_RE.exec(l.trim())).find(Boolean);
  const findings = outLines ? parseFindings(outLines) : [];
  const triedItem = outLines ? outLines.some(l => OOC_TRIED_ITEM_RE.test(l)) : false;
  return {
    // present = file có mặt VÀ có ít nhất một heading của scope-triage. File thế
    // hệ cũ (chỉ liệt kê findings phẳng) cho false → nhánh backward.
    present: outLines !== null || unclassified,
    findings,
    unclassified,
    cluster: clusterLine ? clusterLine[1].trim() : null,
    // AC-5: mục có chữ mà bộ đọc ra 0 finding → NGỜ sai khuôn, thẻ phải kêu.
    // Trước bản này khối biến mất im lặng khỏi thẻ (vết thật: vòng 2.6.0, người
    // suýt ký mà không thấy khuyết tật nào dù nó nằm trong file).
    suspect_empty: outLines !== null && findings.length === 0 && triedItem,
  };
}


// ── Mục ngoài hợp đồng CHƯA NGƯỜI ĐỊNH TUYẾN (hồ sơ ho-so-khep-thoi-hoi, AC-4) ─────────────
// Làn V (máy đi trước, không chữ ký) chỉ sạch khi không còn mục ngoài hợp đồng nào CHƯA ai
// quyết. Nguồn căn cứ là sổ quyết định: một dòng `stage: gate2` mà câu quyết định nhắc
// «Ngoài-N» (có dấu hay không, đơn lẻ hoặc khoảng «Ngoài-a đến/den Ngoài-b») là người đã
// định tuyến mục thứ N. Nhãn N = vị trí mục trong khối, CÙNG cách thẻ đánh số (gate-card:
// `'Ngoài-' + (fi + 1)`). MỘT hàm, hai bản dựng luật xanh-sạch (khong-can-nguoi.mjs và
// xanh_sach_check của pre-merge-check.sh) cùng gọi.
// GIỚI HẠN ĐÃ KHAI: một lượt chấm SAU dòng gate2 mà đổi thứ tự/nội dung các mục làm dòng cũ
// trỏ nhầm mục mới. Ngưỡng mở lại ghi ở Notes của hồ sơ ho-so-khep-thoi-hoi.
const NHAN_RE = /Ngo[aà]i-(\d+)(?:\s*(?:đến|den|to|–|—|-)\s*Ngo[aà]i-(\d+))?/gi;
function daDinhTuyen(ledgerText) {
  const so = new Set();
  for (const l of String(ledgerText || '').split('\n')) {
    if (!l.trim()) continue;
    let e; try { e = JSON.parse(l); } catch { continue; }
    if (!e || typeof e !== 'object' || String(e.stage || '').trim().toLowerCase() !== 'gate2') continue;
    for (const m of String(e.decision || '').matchAll(NHAN_RE)) {
      const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) so.add(i);
    }
  }
  return so;
}
// → { chua: ['Ngoài-1', …], tong, suspect }. findingsText null/rỗng → không mục nào.
function mucChuaDinhTuyen(findingsText, ledgerText) {
  const f = parse(findingsText == null ? '' : findingsText);
  const so = daDinhTuyen(ledgerText);
  const chua = f.findings.map((_, i) => i + 1).filter(i => !so.has(i)).map(i => `Ngoài-${i}`);
  return { chua, tong: f.findings.length, suspect: !!f.suspect_empty };
}

module.exports = { parse, PROPOSALS, OOC_GLOSS_NGUOI, mucChuaDinhTuyen };
