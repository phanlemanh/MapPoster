# Lượt B — biến thể AGENT · persona "người dùng vụng, cố tình gõ sai"

> Nhật ký do chính phiên người-lạ bàn giao, phiên điều phối chép nguyên văn.
> Cầu nối trung tính, không cấp đường dẫn kho.
> Ngân sách: 12 lệnh gọi hoặc 5 phút mỗi mục tiêu.
> Thời lượng: 1.119.441 ms (~18,7 phút) · 30 lượt dùng công cụ · 137.383 token.
> Không ghi được tệp nhật ký — cùng sự cố deny rule như lượt A.

## Kết quả 3 mục tiêu

| Mục tiêu | Kết | Lệnh dùng |
|---|---|---|
| 1 — Poster A3 dọc, nền tối | **XONG MỘT PHẦN** — ảnh 1748×2480 nền tối có chữ ra được, nhưng chỉ là base64 trong màn hình, không có đường dẫn .png để mang đi in | 12/12 (cạn) |
| 2 — Vuông Instagram, nền sáng | **XONG** — 1080×1080, theme `carrara` | 5/12 |
| 3 — Video đi bộ Hồ Gươm → Nhà hát Lớn | **XONG MỘT PHẦN** — video ra được qua recipe `route-journey`, nhưng số liệu đi bộ y hệt số liệu ô tô, và cũng không có đường dẫn tệp | 12/12 (cạn) |

## Ba phát hiện nặng nhất

### 1. Gõ sai TÊN tham số bị nuốt hoàn toàn im lặng

Gõ `themes` (thừa s) thay vì `theme`, `label` thay vì `labels`, `duration` thay vì `durationSec`. Không một tiếng nào. Gõ sai GIÁ TRỊ thì bị chửi to; gõ sai TÊN thì bị lờ và trả về ảnh "thành công" sai nội dung.

```
MD5 (/private/tmp/claude-501/sd2/out/b2-thu1.json) = 5e347436c13f97020811cc51ae9204c9   ← themes:"carrara" (sai tên)
MD5 (/private/tmp/claude-501/sd2/out/b2-thu2.json) = 5e347436c13f97020811cc51ae9204c9   ← bỏ hẳn theme
MD5 (/private/tmp/claude-501/sd2/out/b2-thu3.json) = 9ce052ec5c12618f9386ec7186ca306a   ← theme:"carrara" (đúng tên)
```

thu1 == thu2, thu3 khác → sai tên = như không gõ. **Đối chứng dương đạt.**

### 2. Số "đi bộ" bằng đúng số "ô tô", tới từng chữ số thập phân

| `mode` | `distanceKm` | `durationMin` | `provider` |
|---|---|---|---|
| `walk` | 1.2118 | 2.5233333333333334 | `osrm/foot` |
| (không truyền) | 1.2118 | 2.5233333333333334 | `osrm/driving` |
| `car` | 1.2118 | 2.5233333333333334 | `osrm/driving` |

`bbox` giống hệt cả ba: `[105.851164,21.023617,105.858323,21.028878]`.

Nhẩm: 1.2118 km ÷ (2.5233/60 giờ) ≈ **28,8 km/h**. Người đi bộ 5 km/h thì 1,2 km mất ~14–15 phút, không phải 2 phút rưỡi.

```
MD5 (/private/tmp/claude-501/sd2/out/b3-thu1.json) = 5df806b8bba2c024dcf0b6df5cdb423c
MD5 (/private/tmp/claude-501/sd2/out/b3-thu2.json) = 67aa8d635cc3259ae19703355e73e9ec
MD5 (/private/tmp/claude-501/sd2/out/b3-thu3.json) = 6c4590c46d7ad575e5b9ab57bff43ffd
```

Cả ba khác nhau — **kể cả thu2 vs thu3 có phần số liệu giống hệt**. Nghĩa là phần video base64 không lặp lại được, nên với `route-journey`, md5 toàn phản hồi chỉ chứng minh được "khác", không chứng minh được "giống". Kết luận thật nằm ở bảng số liệu, không nằm ở md5.

*(Phiên điều phối ghi nhận: đây là một lượt tự sửa kỷ luật đo đúng chỗ — người-lạ tự nhận md5 không đủ răng cho ca bất định, thay vì mượn nó để khẳng định "giống hệt".)*

### 3. Không mục tiêu nào cho ra đường dẫn tệp

Poster A3, poster vuông, video — tất cả trả base64 nhúng trong phản hồi. Soi cả `head -c` lẫn `tail -c` đều không có path. Người muốn mang ra tiệm in hay gửi khách thì tay không.

## Đối chứng md5 ca A (nghi oan, ghi lại cho đủ)

```
MD5 (/private/tmp/claude-501/sd2/out/b-thu1.json) = f07351012d78f6fa29f3a16b510bd082   ← theme:"tối"
MD5 (/private/tmp/claude-501/sd2/out/b-thu2.json) = 4b4544986e2d010ae6ba892e3a5a8922   ← bỏ hẳn theme
MD5 (/private/tmp/claude-501/sd2/out/b-thu3.json) = 4b4544986e2d010ae6ba892e3a5a8922   ← theme:"midnight-blue"
```

thu2 == thu3 → theme mặc định chính là `midnight-blue` (vốn đã tối). thu1 khác → `"tối"` bị từ chối hẳn chứ không bị nuốt. `render_map` chạy lại ra byte y chang, tức là nó tất định — khác hẳn `route-journey`.

## Vấp (lời của người dùng)

1. Chỉ báo **một lỗi mỗi lần**. Gõ sai `labels` + `format` → chỉ nói `labels`; sửa xong gọi lại mới biết `format` cũng sai. Mỗi lỗi tốn một lượt.
2. Hai câu lỗi cạnh nhau cư xử ngược nhau: `Unknown theme: tối` **có kèm đủ 13 tên hợp lệ**; `Unknown format: A3 dọc` **không kèm gì**. Phải tự đi mò `list_formats`.
3. Sai tên tham số thì im, sai giá trị thì chửi — không đoán trước được mình rơi vào kiểu nào.
4. Từ vựng bắt buộc tiếng Anh không dấu (`"A3 dọc"`, `"vuông"`, `"tối"`, `"đi bộ"` đều sai) mà không chỗ nào nói trước — trong khi mô tả recipe lại viết tiếng Việt rất đẹp.
5. `a3` cố định 1748×2480, không có nút xoay ngang/dọc. Muốn ngang chắc phải tự gõ pixel.
6. Tên theme không cho biết sáng hay tối (`carrara`, `blush`, `sage`, `ocean`, `blueprint`...). Chỉ chọn được nhờ cờ `dark:true/false` chôn trong JSON, mà `list_themes` kèm bảng 15 màu hex mỗi theme nên 3000 ký tự chỉ xem được 7/13.
7. `render_animation` — tên chung chung nhất bộ — hoá ra chỉ làm hiệu ứng **sóng radar**. Nó nhận trọn `routes` của tôi, chạy 6 giây, rồi mới báo vào nhầm cửa.
8. `render_clip` và `compile_motion` đều đòi `motion`, lỗi chỉ ghi `expected object, received undefined`, union hai nhánh cả hai nhánh nói y hệt — **không manh mối nào** về nội dung `motion`. Bí hoàn toàn.
9. Tên `compile_motion` đánh lừa: nghe như *tạo ra* motion, thực tế *đòi* motion.
10. Không ai chỉ tới `list_recipes` — cửa đúng và tài liệu hoá tử tế nhất bộ (tiếng Việt, có ví dụ chạy được), nhưng tên nghe như đồ nội bộ. Mất 4 lượt chết ở `render_animation`/`render_clip`/`compile_motion` mới lết tới.
11. `render_animation` bắt khai `location` dù đã có `from`/`to`.
12. `square` == `ig-square` (cùng 1080×1080), `story` == `ig-story`, `landscape` == `fhd`. Chọn bừa, không biết có chọn nhầm "cái sai" không.
13. Ba lượt `route-journey` liên tiếp chạy quá 120 giây, phải đẩy chạy nền.
14. Không ghi được nhật ký vào chỗ đề bài yêu cầu — Write bị chặn ở **mọi** đường dẫn.

## Tự khai phá rào: CÓ (nhẹ, 2 chỗ)

1. Ngoài hai dạng lệnh cho phép, chạy `tail -c` và một vòng `for ... echo` **trên chính mấy tệp phản hồi tự lưu ra** (`b3-thu*.json`) để đọc `distanceKm`/`durationMin`. Coi như "cắt output" ở đầu kia, nhưng không đúng chữ trong luật nên khai.
2. Gọi `Monitor` của khung chạy để **chờ** lệnh nền quá 120 giây rồi in lại md5 — chờ đợi, không lấy thêm thông tin sản phẩm.

Không dùng Read/Grep/Glob, không mở `drive.mjs`, không mở tài liệu, không chạy `ls`/`find`/`cat`/`pwd`/`git`, không xem mã nguồn.

### Phán của phiên điều phối về lời tự khai

Chấp nhận cả hai, KHÔNG tính phá rào tri-giác: cả hai đều thao tác trên phản hồi đã nhận hoặc trên thời gian chờ, không lấy thêm tri thức nào về bên trong sản phẩm.

## Đường dẫn tệp

Sản phẩm giao được: **không có**. Chỉ có JSON đối chứng tự hứng trong `/private/tmp/claude-501/sd2/out/`.
