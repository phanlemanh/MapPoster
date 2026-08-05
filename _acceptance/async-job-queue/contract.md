---
schema_version: 1
feature: Async job queue — nhận việc render rồi trả mã việc (Gói nền)
slug: async-job-queue
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by: manh
approved_at: 2026-08-05
time_human_minutes: {gate1: 10}
---

# Acceptance Contract: async-job-queue

## Context

`/render-clip` hiện là **đồng bộ**: người gọi giữ một kết nối HTTP mở suốt cả quá trình
lái trình duyệt headless và encode ffmpeg — đo được ~2 phút/clip ở 1080×1920. Hợp đồng
`map-motion-clip` đã ghi async job queue vào *Out of scope* kèm câu điều kiện: *"cố ý
hoãn; điều kiện để mở endpoint ra ngoài caller nội bộ"*. Gói này trả nợ đúng dòng đó.

Thêm hai cửa REST: `POST /jobs` nhận việc và trả mã ngay, `POST /jobs/status` hỏi trạng
thái và lấy kết quả. Sổ việc nằm trong bộ nhớ; kết quả ghi xuống `sinkDir` rồi đọc lên
lúc hỏi. Bộ đếm slot clip được nâng thành bộ cấp-phát **có hàng chờ**: đường đồng bộ giữ
lối ném-ngay, thợ chạy việc dùng lối xếp-hàng — vẫn một bộ đếm duy nhất.

**Độ bền qua khởi động lại cố ý nằm ngoài phạm vi** (hợp đồng riêng của vòng sau). T2 vì
không đụng file nào trong `risk_tiers.t3_paths`; toàn bộ thay đổi nằm ở `mcp-server/`.

Source input: `docs/superpowers/specs/2026-08-05-async-job-queue-design.md`.

## Criteria

- **AC-1**: Given một thân yêu cầu hợp lệ tới `POST /jobs`, When gọi, Then trả `202` với
  `{ok: true, id, status}`, và hỏi ngay ở `POST /jobs/status` thấy trạng thái là *đang chờ*
  hoặc *đang chạy* — mã việc dùng được ngay lập tức, không có cửa sổ trống.
- **AC-2**: Given thân sai khuôn (thiếu `location`, `zoom` ngoài dải, `kind` lạ), When
  `POST /jobs`, Then trả `400` với thông điệp đọc được — KHÔNG phải ZodError thô — và
  KHÔNG có bản ghi việc nào được tạo trong sổ. *(negative)*
- **AC-3**: Given số việc đang chờ đã chạm trần, When `POST /jobs`, Then trả `429` và sổ
  việc không tăng thêm một bản ghi nào. *(negative)*
- **AC-4**: Given một mã việc không có trong sổ (bịa ra, hoặc đã bị dọn), When
  `POST /jobs/status`, Then trả `404 {ok: false}` — không đoán, không trả `200` với trạng
  thái rỗng. *(negative)*
- **AC-5**: Given một việc render ảnh đã xong, When hỏi, Then trả `200 {ok: true}` với
  trạng thái *xong*, nội dung ảnh dạng base64 **đọc từ tệp trên đĩa**, kèm kích thước và
  khối `resolved` đúng hình dạng `resolvedOf` mà `/render` đang trả.
- **AC-6**: Given một việc hỏng vì đầu vào của người gọi (địa danh không tra được) và một
  việc hỏng vì máy chủ (trình duyệt chết), When hỏi cả hai, Then CẢ HAI trả HTTP `200` —
  câu hỏi thành công — với thân báo *hỏng* và phân biệt rõ lỗi tại người gọi hay tại máy chủ.
- **AC-7**: Given một việc clip mà encode thất bại HOẶC clip vượt trần dung lượng, When
  hỏi việc đó, Then ảnh tĩnh đã dựng được vẫn nằm trong phản hồi kèm lý do — không bao giờ
  bị vứt đi. *(giao ước xuống-cấp, kế thừa từ `map-motion-clip`)*
- **AC-8**: Given trần đồng thời clip đã đầy, When thợ nhận thêm việc clip, Then việc đó
  **xếp hàng** rồi chạy khi có chỗ, theo đúng thứ tự đã nhận; không việc nào bị từ chối và
  không lỗi quá-tải nào được ném ra ở lối việc. *(should-NOT-fire)*
- **AC-9**: Given trần đồng thời clip đã đầy, When gọi `/render-clip` đồng bộ HOẶC công cụ
  MCP `render_clip`, Then vẫn nhận từ chối NGAY như trước gói này — REST `429`, MCP error
  result cùng thông điệp. Hàng chờ không được rò sang đường đồng bộ. *(chống thụt lùi)*
- **AC-10**: Given một lời gọi đồng bộ đang giữ slot và một thợ đang chờ, When lời gọi đó
  kết thúc bằng BẤT KỲ lối nào — thành công, hỏng, xuống cấp, hay ném bất ngờ — Then thợ
  được đánh thức, và tổng số việc chạy cùng lúc không bao giờ vượt trần.
- **AC-11**: Given một việc trong hàng ném lỗi bất ngờ, When thợ xử lý nó, Then việc đó
  chuyển sang *hỏng* và việc kế tiếp trong hàng vẫn được chạy — vòng thợ không chết.
  *(should-NOT-crash)*
- **AC-12**: Given một việc đã kết thúc và quá hạn giữ, When quét dọn chạy, Then sổ việc
  bỏ bản ghi (hỏi lại trả `404`) **và thợ** — đơn vị duy nhất chạm đĩa — xoá đúng những
  tệp ghi trong bản ghi đó; tệp của các công cụ MCP khác trong cùng `sinkDir` còn nguyên
  vẹn. Sổ việc không được phép tự gọi tới hệ thống tệp. *(negative)*
- **AC-13**: Given một yêu cầu không mang thẻ, mang thẻ sai, hoặc có thân vượt trần, When
  gửi tới `POST /jobs` và `POST /jobs/status`, Then hai cửa mới bị chặn **giống hệt**
  `/render` — `401` cho thẻ, `413` cho thân quá khổ — và sổ việc không tăng thêm bản ghi
  nào. Hai cửa mới không được đứng trước chuỗi guard. *(negative)*
- **AC-14**: Given một thợ đã chờ slot lâu hơn hạn chờ đã cấu hình (vì slot rò rỉ hoặc hồ
  nghẽn), When hạn đó trôi qua, Then việc chuyển sang *hỏng* với lý do lỗi tại máy chủ và
  nhả chỗ trong hàng — không nằm mãi ở trạng thái *đang chờ*, không im lặng thử lại.
- **AC-15**: Given người ký đọc giao ước hai cửa, When đánh giá, Then nó đủ để OneHub
  chuyển sang lối gửi việc mà không cần thêm khái niệm nào (không gọi ngược, không tiến
  độ, không huỷ) — hoặc nêu đích danh thứ còn thiếu. *(judgment)*

## Coverage

Quét theo trục (morphological, preset *test matrix*). Thước CE mạnh bất thường ở đây vì
module này **đã có lịch sử sửa lỗi thật** — mỗi lỗi cũ là một giá trị trục đã bị sót lần
trước, nay đưa ngược vào ma trận:

- **Cửa vào**: `POST /jobs` | `POST /jobs/status` | đường đồng bộ cũ (`/render`,
  `/render-clip`) | công cụ MCP `render_clip` — [CE: commit `b5f6e77`, chính lỗi "bộ đếm
  đồng thời phải dùng chung REST/MCP"]
- **Trạng thái việc**: mã lạ | đang chờ | đang chạy | xong | hỏng (kèm lỗi tại ai) | kết
  thúc một phần (mất clip, còn ảnh tĩnh) — [CE: commit `06d37e2`, chính lỗi "không phân
  biệt lỗi tại người gọi hay tại máy chủ"; giao ước xuống-cấp đã ký ở `map-motion-clip`]
- **Áp lực tài nguyên**: rảnh | một việc | chạm trần đồng thời | hàng chờ đầy | tranh chấp
  chéo đồng bộ↔việc | quá tải kéo dài đến hết giờ chờ — [CE: commit `b5f6e77`, chính lỗi
  "hồ trình duyệt bị bỏ đói, treo vô hạn"]
- **Vòng đời bộ nhớ và tệp**: mới ghi | trong hạn giữ | quá hạn phải dọn | tệp trên đĩa sau
  khi dọn | tệp của công cụ khác trong cùng thư mục — [CE: ngành — Shotstack, Bannerbear
  đều đặt hạn giữ kết quả]

Không gian đầy đủ 4×6×6×5 = 720 ô, vượt xa ngưỡng 50 nên quét **theo cặp** chứ không tích
Descartes toàn phần. Core = 12 ô → AC-1..AC-12, cộng hai AC do phản biện context sạch bổ
sung (AC-13, AC-14 — xem `gap-probe.md`).

**Cross-cutting áp lên mọi ô Core**, và chỗ nào đo nó:

- Hai cửa mới dùng lại nguyên bộ guard của `/render` (thẻ mang tên, trần thân yêu cầu) —
  **AC-13** khoá lại. Trước phản biện đây là một lời hứa trong văn xuôi mà không AC nào đo:
  mọi eval đều gửi thẻ hợp lệ nên một cửa quên guard vẫn xanh hết.
- Chờ slot phải có hạn, không treo vĩnh viễn đội lốt *đang chờ* — **AC-14** khoá lại; đây
  chính là giá trị "quá tải kéo dài" của trục *Áp lực tài nguyên*, trước đó không AC nào phủ.
- Slot đã giữ thì mọi lối ra đều trả — AC-10.
- Hỏi lặp cùng một mã luôn ra cùng câu trả lời — AC-5, AC-6.
- Tên địa danh tiếng Việt có dấu đi xuyên sổ việc và tên tệp — ràng vào fixture của E1, E6,
  E15 thay vì để trôi nổi trong văn xuôi.

Trục **chưa** phủ bằng máy: tính đầy đủ của giao ước với người tiêu thụ thật (AC-15) — là
judgment, cần verdict của người ký ở Gate 2.

## Out of scope

- **Độ bền qua khởi động lại.** Hợp đồng riêng của vòng sau. Kéo theo quyết định hạ tầng
  (đĩa bền của Render khoá service vào một instance, hay thêm Redis/Postgres) và quyết định
  tiền. Hệ quả nhận trong gói này: restart = mọi mã việc thành vô danh, người gọi nhận `404`.
- **Công cụ MCP gửi-việc / hỏi-việc.** Chỉ REST ở gói này. `jobRunner` không biết HTTP nên
  thêm cửa MCP sau không phải viết lại gì.
- **Gọi ngược khi xong (webhook).** Chuẩn ngành có (Bannerbear, Shotstack); OneHub chưa
  cần, và không có độ bền thì gọi ngược cũng không đáng tin.
- **Huỷ việc · ưu tiên việc · tự thử lại khi lỗi máy chủ.** Có ở BullMQ và AWS MediaConvert;
  chưa có nhu cầu nêu ra.
- **Báo tiến độ theo phần trăm.** Clip có nhiều khung nên đo được, chưa ai hỏi.
- **`Location` + `Retry-After` theo RFC 7240.** Chọn thân JSON cho khớp nếp sẵn có của repo,
  không phải vì không biết chuẩn.
- **Khử trùng hai việc giống hệt.** Người gọi có thể cố tình muốn hai bản; không đoán thay họ.
- **Nhiều instance / hàng đợi phân tán.** `render.yaml` đang khai một instance.
- **Màn hình xem hàng đợi.** Gói này không có bề mặt người dùng nào.

## Notes

**Đường đồng bộ cũ KHÔNG được hưởng hàng chờ — có chủ ý.** Chủ repo nêu "hết slot thì bị
từ chối" là một trong bốn áp lực, nhưng cũng chốt giữ `/render` và `/render-clip` nguyên
vẹn từng chữ. Hai điều đó mâu thuẫn nhau nếu hàng chờ áp lên cả đường cũ. Quyết định: hết
`429` là **lợi ích của việc dọn sang lối gửi việc**, không phải một thay đổi ngầm ở đường
đang chạy production. AC-9 khoá đúng điều này lại.

**Ảnh tĩnh không đi qua bộ đếm slot clip.** Nó chỉ mượn một trang của hồ trình duyệt, mà
hồ đó đã tự xếp hàng sẵn. Thêm một lớp chờ nữa lên trên là thừa và tạo hai nguồn chân lý
về "bao nhiêu việc đang chạy".

**Vì sao không `GET /jobs/:id`.** `http.ts` từ chối mọi method khác `POST` bằng `405`, và
`render.yaml` cố tình không khai đường kiểm-tra-sống vì `GET /healthz` sẽ đỏ vĩnh viễn rồi
làm Render restart vòng lặp. Cả hai cửa mới đều `POST` nên không phải nới luật đó và không
phải xem lại quyết định ở `render.yaml`.
