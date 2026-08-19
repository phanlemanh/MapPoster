---
schema_version: 1
slug: mcp-map-render
ran_at: 2026-08-19T13:55:56Z
variant: agent
chan: 1
lac: 1
kho_chiu: 4
vat: 0
chuyen_phien_nguoi: 0
---

# Lái-thử Người-lạ ván #2 — phần chạm `mcp-map-render`

Stub của slug này. Hồ sơ tổng: [`lai-thu-nguoi-la-van-2-2026-08-19.md`](../lai-thu-nguoi-la-van-2-2026-08-19.md).

Đây là slug hứng **phát hiện MỚI nặng nhất của ván**.

## Nhật ký vấp

| # | Loại | Mục tiêu | Vấp gì | Bằng chứng |
|---|---|---|---|---|
| 1 | **CHẶN · MỚI** | "render vài biến thể để chọn cái gửi khách" | Render lần hai **xoá đè** lần một: cùng `location`+`format`, đổi mỗi `theme` ⇒ **cùng một đường dẫn trả về**, báo thành công cả hai lần, không cảnh báo, chỉ số tệp vẫn `-0`. Bản đầu biến mất | md5 cùng tệp: `6241dd3a83a3b9e4110c0156f0bca498` → `f6bf793fb0d5faf7acf8d0444a17339d`; bản sao giữ riêng vẫn md5 cũ (**đối chứng dương**) |
| 2 | KHÓ-CHỊU | "giao lại thứ người gọi mở được" | `delivery` là tham số quyết định nhưng **không một chữ mô tả** — chỉ enum trần `both\|url\|inline`, không nói cái nào mặc định. Mặc định là base64, tốn 3 lệnh gọi lãng phí mới phát hiện có đường khác | [luot-a](../lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-a-agent-tin-danh-muc.md) vấp 2–3 |
| 3 | KHÓ-CHỊU | như trên | Đường dẫn trả về cụt gốc: `_render-out/…` tương đối với đâu? — *tái xuất từ ván #1* | luot-a vấp 4 |
| 4 | KHÓ-CHỊU | "poster khổ A3 dọc" | `Unknown format: A3 dọc` và `Unknown format: a4-portrait` đều **không liệt kê** khổ hợp lệ nào, dù có 21 khổ và dù câu lỗi theme ngay cạnh lại liệt kê đủ 13 tên — *tái xuất* | [luot-b](../lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-b-nguoi-dung-vung.md) vấp 2; đo lại trên vật |
| 5 | KHÓ-CHỊU | đọc danh mục | Schema `render_map` **> 12.000 ký tự** vì `anyOf` lồng ba tầng; thứ cần nhất nằm chót | luot-a vấp 1 |
| 6 | LẠC | "khổ dọc để in" | Trỏ vào hai nhóm khác nhau (`portrait` nhóm Social vs `a3/a4/letter` nhóm Print); thêm `square`==`ig-square`, `story`==`ig-story`, `landscape`==`fhd` — chọn bừa, không biết có nhầm không | luot-a vấp 10, luot-b vấp 12 |

## Khử tương quan (B3) cho vấp #1

Cùng một câu hỏi ĐÓNG, hỏi VLM khác họ trên hai khung là **cùng một đường dẫn sản
phẩm** ở hai thời điểm:

| Khung | md5 | *"Is the dominant background colour of this poster a dark navy / midnight blue…?"* |
|---|---|---|
| trước ghi đè (`midnight-blue`) | `6241dd3a83a3b9e4110c0156f0bca498` | **`YES`** |
| sau ghi đè (`noir`) | `f6bf793fb0d5faf7acf8d0444a17339d` | **`NO`** |

Một họ mô hình độc lập xác nhận nội dung thật sự đã bị thay, không chỉ md5 đổi.

## Chuyển phiên người

Không có câu nào riêng cho slug này — xem hồ sơ tổng.
