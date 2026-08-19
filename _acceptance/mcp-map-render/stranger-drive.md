---
schema_version: 1
slug: mcp-map-render
ran_at: 2026-08-19T15:02:43Z
variant: agent
chan: 2
lac: 1
kho_chiu: 5
vat: 0
chuyen_phien_nguoi: 2
---

# Lái-thử Người-lạ — phần chạm `mcp-map-render`

Stub của slug này, **cập nhật ở ván #3**. Frontmatter đếm **mọi vấp còn sống trên
vật tính tới ván #3**, tức vấp ván #2 tìm được và chưa thứ nào được vá, **cộng**
vấp mới của ván #3 — không phải riêng ván #3, vì `uat-session` đọc `chan` để
quyết điều kiện «sản phẩm bấm được» và giấu vấp còn sống ở đó là nói dối cái cổng.

| | CHẶN | LẠC | KHÓ-CHỊU |
|---|---|---|---|
| còn sống từ ván #2 | 1 | 1 | 4 |
| mới ở ván #3 | +1 | 0 | +1 |
| **frontmatter** | **2** | **1** | **5** |

Hồ sơ tổng: [ván #3](../lai-thu-nguoi-la-van-3-2026-08-19.md) ·
[ván #2](../lai-thu-nguoi-la-van-2-2026-08-19.md).

---

## Vấp MỚI ở ván #3

| # | Loại | Vấp gì | Bằng chứng |
|---|---|---|---|
| 7 | **CHẶN · MỚI** | **Cổng dựng hình bận ⇒ lời gọi không bao giờ được trả lời.** Sản phẩm mở cổng cố định `127.0.0.1:4180` (`MAPPOSTER_APP_PORT` mặc định 4180). Cổng bận thì lời gọi MCP **treo tới khi client tự bỏ cuộc** — không phản hồi JSON-RPC, không lỗi ở tầng giao thức — và tiến trình chết vì `EADDRINUSE` **chưa bắt**. Người-lạ dính ba lần, mất ~20 phút chờ suông, chỉ thoát ra được bằng cách tự đi giết tiến trình. | Phiên điều phối tái hiện bằng **một listener vô can** giữ cổng: `render_map` 64×64 chạy 15:38:00Z→15:40:01Z = **121 s**, `stdout` **rỗng hoàn toàn**, `stderr` = `throw er; // Unhandled 'error' event` + `code:'EADDRINUSE'`. Cùng lời gọi khi cổng rảnh: **4,4 s**. |
| 8 | KHÓ-CHỊU · MỚI | **Tham số tên là `output` nhưng không điều khiển đầu ra** — chỉ có `quality`, và `additionalProperties:false` chặn mọi cách lách. Không có `outPath`/`filename`/`outDir`/`overwrite`. Người dùng nhìn thấy vấp #1 xảy ra mà **không có nút nào để tránh**; người-lạ phải lách bằng cách xin thừa 1 pixel chiều cao. | [cmds/danh-muc-tool.md](../lai-thu-nguoi-la-van-3-2026-08-19/cmds/danh-muc-tool.md) |

**Vấp #1 (ghi đè im lặng) tái xuất nguyên vẹn ở ván #3** — không tính là phát
hiện mới. Ván #3 ghi vào **cùng một đường dẫn ba lần** (đi bộ → ô tô → đi bộ), cả
ba báo thành công, không lần nào cảnh báo:
[video/MD5.txt](../lai-thu-nguoi-la-van-3-2026-08-19/video/MD5.txt).

**Vấp #5 (lược đồ quá lớn) tái xuất và đo được rộng hơn:** `tools/list` trả
**107.345 byte** cho 11 tool; riêng `render_variants` 9.926 ký tự. Bốn tool
`list_*` thì 85 ký tự mỗi cái.

### Không quy được cho sản phẩm (ván #3)

Người-lạ báo "JSON của sản phẩm hỏng"
(`jq: parse error: Unfinished string at EOF at line 2021, column 31`). Đo lại:
cùng lời gọi **ghi thẳng ra tệp** cho **107.345 byte JSON hợp lệ đủ 11 tool**;
**qua đường ống** bị cắt đúng **65.536 byte** và hỏng. Thủ phạm là
`process.exit(0)` của cầu nối cắt stdout bất đồng bộ khi stdout là pipe.
**Sản phẩm vô can** — vấp này không được tính vào bất kỳ tổng nào.

---

## Vấp từ ván #2 — còn sống, chưa thứ nào được vá

| # | Loại | Mục tiêu | Vấp gì | Bằng chứng |
|---|---|---|---|---|
| 1 | **CHẶN** | "render vài biến thể để chọn cái gửi khách" | Render lần hai **xoá đè** lần một: cùng `location`+`format`, đổi mỗi `theme` ⇒ **cùng một đường dẫn trả về**, báo thành công cả hai lần, không cảnh báo, chỉ số tệp vẫn `-0`. Bản đầu biến mất | md5 cùng tệp: `6241dd3a83a3b9e4110c0156f0bca498` → `f6bf793fb0d5faf7acf8d0444a17339d`; bản sao giữ riêng vẫn md5 cũ (**đối chứng dương**) |
| 2 | KHÓ-CHỊU | "giao lại thứ người gọi mở được" | `delivery` là tham số quyết định nhưng **không một chữ mô tả** — chỉ enum trần `both\|url\|inline`, không nói cái nào mặc định. Mặc định là base64, tốn 3 lệnh gọi lãng phí mới phát hiện có đường khác | [luot-a](../lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-a-agent-tin-danh-muc.md) vấp 2–3 |
| 3 | KHÓ-CHỊU | như trên | Đường dẫn trả về cụt gốc: `_render-out/…` tương đối với đâu? — *tái xuất từ ván #1* | luot-a vấp 4 |
| 4 | KHÓ-CHỊU | "poster khổ A3 dọc" | `Unknown format: A3 dọc` và `Unknown format: a4-portrait` đều **không liệt kê** khổ hợp lệ nào, dù có 21 khổ và dù câu lỗi theme ngay cạnh lại liệt kê đủ 13 tên — *tái xuất* | [luot-b](../lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-b-nguoi-dung-vung.md) vấp 2; đo lại trên vật |
| 5 | KHÓ-CHỊU | đọc danh mục | Schema `render_map` **> 12.000 ký tự** vì `anyOf` lồng ba tầng; thứ cần nhất nằm chót | luot-a vấp 1 |
| 6 | LẠC | "khổ dọc để in" | Trỏ vào hai nhóm khác nhau (`portrait` nhóm Social vs `a3/a4/letter` nhóm Print); thêm `square`==`ig-square`, `story`==`ig-story`, `landscape`==`fhd` — chọn bừa, không biết có nhầm không | luot-a vấp 10, luot-b vấp 12 |

### Khử tương quan (B3) cho vấp #1 — từ ván #2

Cùng một câu hỏi ĐÓNG, hỏi VLM khác họ trên hai khung là **cùng một đường dẫn sản
phẩm** ở hai thời điểm:

| Khung | md5 | *"Is the dominant background colour of this poster a dark navy / midnight blue…?"* |
|---|---|---|
| trước ghi đè (`midnight-blue`) | `6241dd3a83a3b9e4110c0156f0bca498` | **`YES`** |
| sau ghi đè (`noir`) | `f6bf793fb0d5faf7acf8d0444a17339d` | **`NO`** |

Một họ mô hình độc lập xác nhận nội dung thật sự đã bị thay, không chỉ md5 đổi.

## Chuyển phiên người

Hai câu chạm slug này — xem hồ sơ tổng ván #3, câu 1 và 2.
