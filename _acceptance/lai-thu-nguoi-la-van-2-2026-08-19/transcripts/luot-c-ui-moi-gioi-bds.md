# Lượt C — biến thể UI · persona "NGƯỜI-NHÌN: môi giới bất động sản"

> Nhật ký do chính phiên người-lạ bàn giao, phiên điều phối chép nguyên văn.
> Bề mặt: `http://localhost:5173` (dev server của kho, `src/` đã đo trùng vân tay
> với kho chính: `f2be581b89a19c9cffa537eed423f4f0`).
> Tri-giác: **pixel-only** — chỉ `screenshot` + click theo TOẠ ĐỘ. Luật cấm-DOM
> có RĂNG THẬT: `read_page`, `get_page_text`, `find`, `javascript_tool`,
> `browser_snapshot`, `browser_evaluate`, console/network đều nằm trong `deny`
> của `.claude/settings.local.json` phiên lái.
> Ngân sách: 12 thao tác hoặc 5 phút mỗi mục tiêu.
> Thời lượng: 637.794 ms (~10,6 phút) · 40 lượt dùng công cụ · 96.777 token.
> Không ghi được tệp nhật ký — cùng sự cố deny rule như lượt A và B.

## Kết quả 3 mục tiêu

**Mục tiêu 1 — Bản đồ Hoàn Kiếm tông tối: XONG** (7 thao tác). Gõ "Hoan Kiem, Hanoi" → 1 gợi ý "Phường Hoàn Kiếm" → bấm vào. Khung tranh **trống trơn ~3 giây, không có báo đang tải**, tôi tưởng hỏng; sau đó bản đồ hiện ra rất đẹp (navy đậm, đường vàng đồng, thấy rõ hồ). Theme mặc định "Midnight Blue" đã là tông tối, đúng ý khách.

**Mục tiêu 2 — Cầm tệp: XONG MỘT PHẦN** (5 thao tác). Nút Download xổ ra 2 lựa chọn: PNG (High-resolution image · 1080×1080) và PDF (Vector page). Bấm PNG → menu đóng, **không thông báo, không tên tệp, không đường dẫn, không gì cả**. Chờ 3s vẫn không có. Bấm lại chọn PDF, chụp ngay lập tức — cũng không có thông báo nào. Theo đúng những gì mắt thấy: **không cầm chắc được tệp nào; tên tệp và nơi lưu đều không biết**.

**Mục tiêu 3 — Video: KHÔNG XONG, «BỎ CUỘC TẠI ĐÂY»** (13 thao tác). Rê chuột đọc tên từng biểu tượng cột trái: Place, Theme, Layout, Text, Layers, Markers, Routes, Settings — không cái nào là video. Mở Settings: chỉ có Lock map, Enable rotation ("the map stays north-up" — chỉ xoay ảnh tĩnh), Reset everything. Mở Layout: chỉ khổ giấy/khổ social (A3/A4/A5/US Letter, Instagram Square/Story, LinkedIn Post). Menu Download: chỉ PNG/PDF. Định cuộn xem đáy danh sách Layout thì **lệnh cuộn treo và báo lỗi hết giờ chờ**, màn hình đứng im.

## Vấp (lời của người môi giới)

1. Bản đồ trắng trơn mấy giây, không có dấu hiệu "đang tải" — tưởng hỏng.
2. **Bấm Download xong không biết chuyện gì xảy ra** — đây là chỗ khó chịu nhất, không dám nói với khách là đã có tệp.
3. Cột trái toàn hình vẽ, không một chữ nào — phải rê chuột từng cái.
4. Ngăn cài đặt trượt ra đè lên tấm tranh, che mất lúc cần so màu.
5. Cuộn danh sách Layout bị đơ/treo.
6. Chữ "VIỆT NAM" và dòng toạ độ trên tranh đè lên đường phố, gần như chìm.
7. Đổi cỡ cửa sổ sang "desktop" mà màn hình không to lên chút nào.
8. Gợi ý địa điểm chỉ 1 dòng và địa chỉ bị cắt cụt ("...Việt N...").
9. Chỗ ghi nhật ký bị chặn quyền.

## Chữ nghĩa trên màn hình

Chữ nhỏ li ti ở bảng "CURRENT SETTINGS" và dòng khổ dưới tranh. Toàn tiếng Anh. Không hiểu nghĩa: **"Vector page"** (vector là gì? khác PNG chỗ nào?), **"Each preset re-tints every map layer"**, **"pan"** trong "Lock map (disable pan & zoom)". Đoán mò: "Markers", "Routes". Tên tông màu không nói lên màu gì (Carrara, Sage, Blueprint, Noir, Terracotta), ô mẫu chỉ vẽ mấy vạch chéo nhỏ xíu. Dòng bản quyền OpenStreetMap/MapLibre chữ cực nhỏ nhưng nằm ngay trên tranh định gửi khách.

## Tự khai phá rào

**KHÔNG.** Chỉ dùng screenshot, left_click, type, hover, wait, scroll theo toạ độ pixel, và một lần resize_window. Không dùng read_page/find/javascript/console/network, không dùng `ref`, không đọc mã nguồn, không chạy shell. Khi lệnh cuộn treo, máy gợi ý xem "console logs" — **tôi không làm**, ghi lại rồi đi tiếp bằng mắt.

*(Phiên điều phối ghi nhận: đây là lượt duy nhất không phá rào, và nó từ chối đúng lúc bị dụ sang DOM.)*

## Tệp lấy được

**Không lấy được** (theo những gì nhìn thấy). Tên tệp: không biết. Nơi lưu: không biết. Trang không hiện bất kỳ xác nhận nào sau khi bấm PNG hoặc PDF.

---

## Đo lại của phiên điều phối (trên vật, sau khi lượt C kết thúc)

**Tệp PDF CÓ rơi xuống đĩa, người-lạ chỉ là không được báo:**

```
-rw-r--r--@ 1 manh-macmini staff 1175113 Aug 19 21:20 /Users/manh-macmini/Downloads/mapposter-phuong-hoan-kiem-ig-square.pdf
MD5 (…/mapposter-phuong-hoan-kiem-ig-square.pdf) = a145053dbae21c29fa124b23b383a11a
```

**Không có tệp PNG nào** trong `~/Downloads` (`ls | grep -i mapposter` chỉ ra đúng một dòng PDF trên).

**Đối chứng dương — KHÔNG được kết luận PNG hỏng:**

```
[1/1] [chromium] › e2e/mapposter.spec.ts:222:1 › export: Download → PNG triggers a file download
  1 passed (6.7s)
```

Làn e2e của chính kho có ca xuất PNG và nó XANH. Vậy khẳng định "PNG hỏng" không có căn cứ; thứ đo được chắc chắn chỉ là **sản phẩm không phát tín hiệu nào sau khi bấm**, nên người dùng không phân biệt được "đang làm", "xong rồi" và "hỏng".

**Vấp số 5 (cuộn treo) — không quy được cho sản phẩm:** phiên điều phối gặp đúng lỗi `Screenshot timed out after 5s: the Browser pane is not displayed` khi thao tác lại sau đó. Nhiều khả năng là giới hạn của giàn chạy không-tương-tác, không phải khuyết tật sản phẩm. Ghi vào mục VẶT với ghi chú này, không tính là vấp sản phẩm.
