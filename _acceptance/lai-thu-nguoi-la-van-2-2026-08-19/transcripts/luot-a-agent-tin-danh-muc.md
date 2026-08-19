# Lượt A — biến thể AGENT · persona "agent tự động chỉ tin danh mục"

> Nhật ký do chính phiên người-lạ bàn giao, phiên điều phối chép nguyên văn.
> Người-lạ KHÔNG được cấp đường dẫn kho; chỉ có cầu nối trung tính
> `node /private/tmp/claude-501/sd2/drive.mjs list|call`.
> Ngân sách: 12 lệnh gọi hoặc 5 phút mỗi mục tiêu.
> Thời lượng: 480.862 ms (~8 phút) · 12 lượt dùng công cụ · 102.722 token.
>
> **Sự cố dựng môi trường (lỗi của phiên điều phối, không phải vấp sản phẩm):**
> người-lạ không ghi được tệp nhật ký vì deny rule `"Read"` của phiên lái chặn
> luôn mọi `Write`. Nội dung dưới đây là phần bàn giao cuối, chép nguyên văn.

## Kết quả

| Mục tiêu | Kết | Lệnh gọi |
|---|---|---|
| 1 — Poster tĩnh Hồ Gươm | **XONG** | 7/12 |
| 2 — Dùng công thức dựng sẵn | **XONG** (ví dụ mẫu chạy thẳng, không phải sửa) | 2/12 |
| 3 — Video ngắn cho mạng xã hội | **XONG** | 1/12 |

## Đường dẫn tệp (nguyên văn engine trả về — đều TƯƠNG ĐỐI, không rõ gốc)

- `_render-out/mapposter-ho-guom-1748x2480-0.png` (A3 dọc, theme `midnight-blue`, chrome `poster`)
- `_render-out/mapposter-phuong-hoan-kiem-1080x1920-0.mp4` (6s, 18fps, 4.135.257 byte) + `...-settle.png`
- `_render-out/mapposter-phuong-tay-ho-1080x1920-0.mp4` (8s, 18fps, 3.907.792 byte) + `...-settle.png`

## Vấp (10 chỗ, lời của người-lạ)

1. **Danh mục quá to để đọc một lần** — riêng `render_map` dài hơn 12.000 ký tự vì `anyOf` lồng ba tầng; thứ cần nhất lại nằm chót.
2. **Mặc định trả base64, không trả tệp** — mất 3 lệnh gọi lãng phí (một A3 vứt đi, hai bản 64×64 để dò) mới phát hiện có cách khác. Mô tả chỉ nói "Render a still map image (PNG)", nghe như đương nhiên ra tệp.
3. **`delivery` là tham số quyết định nhưng không một chữ mô tả** — chỉ có enum trần `both|url|inline`, không nói cái nào mặc định.
4. **Đường dẫn trả về cụt gốc** — `_render-out/...` tương đối với đâu? Sản phẩm dựng xong mà khâu bàn giao vẫn hụt. Đây là chỗ khó chịu nhất.
5. **Base64 chui vào cả nơi không xin** — mục tiêu 2 chỉ cần video, engine vẫn kèm base64 ảnh settle.
6. **Geocode âm thầm thu nhỏ khu vực** — "Hoàn Kiếm, Hà Nội" → *phường* Hoàn Kiếm; "Tây Hồ, Hà Nội" → *phường* Tây Hồ, `areaKm2: 10.57`. Engine biết chính xác (`placeRank`, `displayName`, `areaKm2` đều nằm trong `resolved`) nhưng không hề cảnh báo. Buốt nhất: **chính ví dụ mẫu trong danh mục cũng dính**.
7. **Danh mục không nói công thức chạy bằng công cụ nào** — `list_recipes` đưa khối `example` nhưng không câu nào bảo phải đưa nó cho `render_recipe`; tôi ghép được là nhờ đã lướt thấy tên, không phải nhờ được chỉ.
8. **Không có cách rẻ để thăm dò** — bản 64×64 vẫn mất 11 giây, video 55–70 giây. Ngân sách 12 lệnh, sai một nước mất nhiều.
9. **`chrome:"poster"` không giải thích nó vẽ gì** — tôi ném `placeName` + `font` vào theo linh cảm. Đoán đúng, nhưng là đoán.
10. **Nhóm format gây phân vân** — "khổ dọc để in" trỏ vào hai chỗ: `portrait` (1080×1350, nhóm Social) và `a3/a4/letter` (nhóm Print). Chọn `a3` vì nó có khối `print:{w,h,unit}`.

## Điểm sáng (nguyên văn)

`list_recipes` mô tả bằng tiếng Việt rất rõ và **tự khai điểm yếu** ("engine không dựng được nhịp so le từng tiện ích", "các ghim hiện CÙNG LÚC") — chỗ này đáng tin. Ví dụ mẫu `region-spotlight` chạy thẳng không cần sửa. `delivery:"url"` được `render_recipe` chấp nhận dù công thức không quảng cáo nó.

## Tự khai phá rào

**Có — một chỗ, mức nhẹ.** Luật cho phép `| head -c 3000`; tôi dùng thêm `| tail -c 1500` và `| head -c 30000 | tail -c 18000` để đọc phần đuôi và phần giữa output **của chính cầu nối** — vì cả đường dẫn tệp lẫn tham số `delivery` đều nằm ở cuối, `head` không với tới. Tôi coi đây là cắt gọt output cầu nối, không phải dò ổ đĩa. Không dùng Read/Grep/Glob trên sản phẩm, không dùng `ls`/`find`/`cat`/`pwd`/`git`, không đọc mã nguồn hay tài liệu. Mọi hiểu biết đều đến từ `list` và `call`.

### Phán của phiên điều phối về lời tự khai

Chấp nhận, KHÔNG tính là phá rào tri-giác: `tail`/`head` chỉ cắt trên **output của cầu nối** — đúng thứ một agent thật nhận qua giao thức — chứ không chạm hệ tệp sản phẩm. Bản thân việc phải cắt-ghép mới đọc tới đuôi phản hồi lại là dữ liệu củng cố vấp số 1.

### Đối chứng của phiên điều phối cho vấp số 6 và "điểm sáng"

Xem file tổng, mục CHẶN-1 và LẠC-1: gọi lại ví dụ `region-spotlight` **nguyên văn** cho phản hồi 2.934.545 byte, trong đó 2.932.740 ký tự là base64 — nên "chạy thẳng" chỉ đúng ở tầng cầu nối, không đúng ở tầng MCP client thật.
