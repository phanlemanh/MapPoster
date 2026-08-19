---
schema_version: 1
slug: map-motion-clip
ran_at: 2026-08-19T15:02:43Z
variant: agent
chan: 0
lac: 2
kho_chiu: 3
vat: 1
chuyen_phien_nguoi: 4
---

# Lái-thử Người-lạ ván #3 — phần chạm `map-motion-clip`

Stub của slug này. Hồ sơ tổng toàn ván:
[`lai-thu-nguoi-la-van-3-2026-08-19.md`](../lai-thu-nguoi-la-van-3-2026-08-19.md).

Đây là **lần đầu** một ván lái-thử chấm chính **mp4 chuyển động** thay vì chỉ ảnh
tĩnh: video được gửi thẳng cho VLM khác họ (`google/gemini-3.7-flash` qua
OpenRouter), và mỗi khẳng định thị giác có một phép đo máy trên byte đứng cạnh.

## Nhật ký vấp

| # | Loại | Vấp gì | Bằng chứng |
|---|---|---|---|
| 1 | LẠC | **Preset chuyển động không có danh mục nào.** Có `list_themes`, `list_formats`, `list_fonts`, `list_recipes` — không có tool nào liệt kê preset. **Mô tả** `render_clip` kể 3 preset; **lược đồ** có 6. Ba cái không được kể là `follow`, `tour`, `converge`. | [cmds/danh-muc-tool.md](../lai-thu-nguoi-la-van-3-2026-08-19/cmds/danh-muc-tool.md) |
| 2 | LẠC | **`route-journey` khoá cứng camera ở `follow`.** Recipe mô tả đúng việc cần làm nhưng không cho chọn camera; muốn chọn thì phải bỏ recipe. | [transcript vấp 3](../lai-thu-nguoi-la-van-3-2026-08-19/transcripts/luot-a-agent-bo-video.md) |
| 3 | KHÓ-CHỊU | **`follow` giật có chu kỳ 4–5 khung (222–278 ms, ~4 Hz).** Tự tương quan của dãy sai khác khung-liên-khung tụt ở lag 2–3 rồi vọt lên **r = 0,787** ở lag 4. `pushIn` để so: giảm đơn điệu 0,947→0,191, không chu kỳ. Nhịp giật còn nguyên **ở cả hai góc khung** nơi tuyến không đi qua (r = 0,719 / 0,725) ⇒ từ **camera**, không phải từ nét vẽ tuyến. | [vlm/ket-qua-video-3.7-flash.md](../lai-thu-nguoi-la-van-3-2026-08-19/vlm/ket-qua-video-3.7-flash.md) §"Phép đo MÁY" |
| 4 | KHÓ-CHỊU | **`restAtSec` của `pushIn` lệch 1,75 s so với thứ nhìn thấy được.** Khai `4.254545…`, đo được chuyển động tắt từ **2,50 s** ⇒ 3,5/6 giây là ảnh đứng yên. Clip `follow` thì khớp (khai 4,2 · đo 4,17). | cùng nguồn |
| 5 | KHÓ-CHỊU | **Kích thước báo về không khớp tệp vừa ghi.** Gọi `height:1921` → sản phẩm trả `"height":1921`, đặt tên tệp `…1080x1921…`, nhưng `ffprobe` trên mp4 cho **1920**; `settle.png` thì đúng **1921** ⇒ video và ảnh dừng của cùng lời gọi lệch nhau 1 pixel. | `ffprobe` in trong [vlm/…](../lai-thu-nguoi-la-van-3-2026-08-19/vlm/ket-qua-video-3.7-flash.md) |
| 6 | VẶT | **Dòng ghi công nằm trong pixel video** (`© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre`), trôi theo camera, tầng DOM không đặt lại được. | khung [`frames/clip-walk-giua.png`](../lai-thu-nguoi-la-van-3-2026-08-19/frames/clip-walk-giua.png) |

## Kết quả ÂM TÍNH cho phe tố cáo — ghi lại đúng như thế

| Câu hỏi ĐÓNG trên chính mp4 | Trả lời |
|---|---|
| Chuyển động camera có khớp preset đã yêu cầu? (`follow`, `follow`, `pushIn`) | `YES` · `YES` · `YES` |
| Khung cuối clip có khớp `settle.png` đi kèm? | `YES` cả ba — PSNR 32,27 dB, so với khung-ĐẦU vs cùng settle chỉ 14,32 dB |
| Có khung lặp lại? có artifact nén thấy được? | `NO` cả ba |

**Bất biến "clip không chữ" (AC-9) đứng vững.** Câu "chữ có đọc được trong lúc
chuyển động?" trả `NO` ở cả ba clip — nhưng đó là bất biến đang được tôn trọng,
không phải lỗi. Câu hỏi ngược ("trong hình có BẤT KỲ chữ nào?") trả `YES`, nên
phiên điều phối **tự nhìn khung hình**: chữ duy nhất là dòng ghi công bắt buộc ở
đáy khung, ghi thành vấp VẶT chứ không phải vi phạm hợp đồng.

## Một chỗ hai phép đo NGHỊCH NHAU

VLM nói clip `pushIn` không đều và clip `follow` đều; phép đo MAD trên byte nói
ngược lại. Ván ghi cả hai và **không chọn bên** — câu hỏi "cái nào đáng tin, và
nhịp ~4 Hz có đáng sửa không" nằm ở mục «Chuyển phiên người» của hồ sơ tổng.

## Chuyển phiên người

Bốn câu chạm slug này — xem hồ sơ tổng, câu 3, 4, 5 và 6.
