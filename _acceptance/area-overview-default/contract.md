---
schema_version: 1
feature: area-overview chạy được ở mặc định trong triển khai chưa có nguồn ảnh vệ tinh
slug: area-overview-default
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: signed-off
approved_by: Phan Le Manh
approved_at: 2026-08-19T10:52:34Z
human_signoff:
time_human_minutes: {}
---

# Acceptance Contract: area-overview-default

## Context

Công thức `area-overview` mặc định nền ảnh vệ tinh. Đó là **ý đồ đúng** của nó —
spec xếp nó vào nhóm cần ảnh vệ tinh. Nhưng Cổng Đáng ngày 2026-08-19 đã **HOÃN**
việc dựng nguồn ảnh (`_acceptance/satellite-tile-source/`), nên trong triển khai
hiện tại cái mặc định ấy không dùng được: người gọi bỏ trống nền sẽ bị từ chối.

Danh mục đã cảnh báo rõ điều này ở cả mô tả lẫn tài liệu tham số, nên đây không
phải lỗi che giấu. Đây là một **lựa chọn sản phẩm**: một công thức đã bán nên
chạy được ở cấu hình mặc định của chính nó, kể cả khi người gọi không đọc kỹ.

Gói này đổi mặc định về `vector` **tạm thời**, và ghi điều kiện trả lại.

Điều nguy hiểm phải giữ: đổi mặc định KHÔNG được làm mềm lời từ chối khi người
gọi **tường minh** xin nền vệ tinh. Người gọi là agent — nó không nhìn thấy ảnh,
nên một nền im lặng sai còn tệ hơn một lời từ chối to.

Source input: quyết định Cổng Đáng 2026-08-19 (`satellite-tile-source`) · đo thật
ngày 2026-08-19: 8/8 công thức chạy thử, riêng `area-overview` bị chặn khi bỏ
trống nền.

## Criteria

- AC-1: Given người gọi dùng `area-overview` mà **không nêu** `basemap`, When compile, Then nền ra là `vector`, và lời gọi đi trọn tới bước dựng mà không bị từ chối vì thiếu `MAPPOSTER_SATELLITE_TILES`.
- AC-2: Given người gọi **nêu tường minh** `basemap: 'satellite'` mà môi trường thiếu `MAPPOSTER_SATELLITE_TILES`, When resolve, Then vẫn **TỪ CHỐI** và thông điệp vẫn nêu đích danh tên biến — đổi mặc định không được làm mềm chiều tường minh. Đây là bất biến kế thừa từ AC-8 của `satellite-basemap`.
- AC-3: Given danh mục trả về cho agent (`list_recipes`), When đọc mô tả và tài liệu tham số `basemap` của công thức này, Then chúng nói đúng mặc định MỚI: không còn câu khai mặc định là ảnh vệ tinh, và có nêu `satellite` là lựa chọn cần biến môi trường. Danh mục là bề mặt sản phẩm với agent, không phải chú thích nội bộ.
- AC-4 *(no-regression)*: Given bảy công thức còn lại, When compile với người gọi không nêu `basemap`, Then không công thức nào tự đặt nền — hành vi của chúng không đổi vì gói này.

## Coverage

- **Trục Chiều gọi**: bỏ trống nền (AC-1) | nêu tường minh nền vệ tinh (AC-2) — [thước CE: hai ca phải cùng chạy trong một tệp test, vì lỗi dễ xảy ra nhất là sửa mặc định rồi vô tình bỏ luôn nhánh từ chối]
- **Trục Bề mặt tài liệu**: mô tả và tài liệu tham số phải khớp hành vi mới (AC-3)
- **Trục Không lan**: bảy công thức khác giữ nguyên (AC-4)

## Out of scope

- **Không** đụng `resolveConfig` hay hành vi từ chối. Gói này chỉ đổi một giá trị mặc định ở tầng công thức.
- **Không** đổi mặc định của bất kỳ công thức nào khác.
- **Không** dựng nguồn ảnh vệ tinh — đó là việc đã hoãn ở Cổng Đáng.
- **Không** thêm cơ chế tự dò môi trường để chọn mặc định. Đọc biến môi trường trong bước compile sẽ làm hành vi của danh mục khác nhau theo từng triển khai, và phá tính thuần của compile.

## Notes

- **Điều kiện trả lại mặc định `satellite`**: khi `satellite-tile-source` được mở lại và có nguồn ảnh chạy được. Ghi ở đây và trong sổ quyết định để lần đó có người nhắc.
- Risk tier T2: chạm `mcp-server/src/recipes.ts`, không chạm hai đường khoá.
