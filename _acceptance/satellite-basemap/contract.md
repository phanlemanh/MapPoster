---
schema_version: 1
feature: basemap vector|satellite — nền ảnh vệ tinh và attribution theo nguồn (PR #8a)
slug: satellite-basemap
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api, web]
status: draft
approved_by:
approved_at:
human_signoff:
time_human_minutes: {}
---

# Acceptance Contract: satellite-basemap

> **BẢN NHÁP — chưa qua Cổng 1 lẫn Cổng 2.** Do agent soạn ở bước đặc tả.
> `evidence-report.md` và `run-log.jsonl` cố ý CHƯA có: chúng phải sinh từ một
> vòng chạy thật của bộ acceptance-gate. Xem `## Việc còn lại`.

## Context

Gói này mở tham số `basemap: 'vector' | 'satellite'` và làm attribution phụ thuộc nguồn nền.

**Vì sao là T3, và đây không phải phân loại hình thức:** nó chạm **cả hai** `t3_paths` —
`src/lib/mapStyle.ts` (dựng style, quyết định layer nào tồn tại) và `src/lib/export.ts`
(file giữ bất biến "clip không chữ", và là nơi attribution được nung vào pixel). Một lỗi ở
file thứ hai không hỏng một tính năng — nó hỏng **nghĩa vụ giấy phép**, và hỏng im lặng.

Hai quyết định thiết kế cần được phán chứ không chỉ được kiểm:

1. **Tắt sáu layer vẽ lại mặt đất** (`landcover` `landuse` `park` `water` `waterway`
   `building`) thay vì chồng chúng lên ảnh. Lý do: sáu layer đó là *bản vẽ* của cùng thứ
   ảnh vệ tinh đã cho thấy thật. Đây là một đánh đổi thị giác, không phải một sự thật.
2. **Attribution cộng dồn**, không thay thế. Ảnh vệ tinh không xoá nghĩa vụ với OSM vì
   đường, ranh giới và nhãn vẫn là OSM.

## Criteria

- AC-1: Given `basemap: 'satellite'` **và** có URL tile, When dựng style, Then đúng sáu layer nhóm ground bị loại, và **mọi layer khác đều sống sót** — hai chiều, vì chiều "tắt đúng" một mình vẫn xanh nếu ai đó tắt luôn cả đường và ranh giới.
- AC-2: Given `basemap: 'satellite'` và có URL, When dựng style, Then layer raster nằm ở **đúng vị trí thứ hai**, ngay trên `background` và dưới mọi thứ còn lại. Thứ tự là ngữ nghĩa: đặt sau `background` thì vùng tile chưa tải lộ ra màu theme; đặt trên đường thì ảnh che mất đường.
- AC-3: Given `basemap: 'satellite'` **thiếu** URL tile, When dựng style, Then **không** dựng source raster **và không** tắt nhóm ground. Một bản đồ vừa mất mặt đất vừa không có ảnh thay thế tệ hơn cả hai lựa chọn — đây là lỗi thật đã xảy ra trong lúc soạn gói và bị test bắt trước khi ship.
- AC-4: Given `basemap` vắng mặt hoặc `'vector'`, When dựng style, Then không có source lẫn layer raster nào — nhánh mới không được đánh thuế lên đường cũ.
- AC-5: Given `basemap: 'satellite'`, When lấy attribution, Then nó **chứa trọn** chuỗi OSM cũ **và** thêm phần Copernicus. Một khẳng định chỉ kiểm "có chữ Sentinel" vẫn xanh khi phần OSM bị thay mất — và đó là lỗi giấy phép.
- AC-6: Given attribution nền vệ tinh, When đọc, Then chữ **"modified"** có mặt. Chính sách Copernicus đòi nói rõ dữ liệu đã qua xử lý; ảnh mosaic là dữ liệu đã xử lý. Bỏ chữ đó là vi phạm điều kiện, không phải rút gọn.
- AC-7: Given `basemap: 'vector'`, When lấy attribution, Then chuỗi **giống hệt** bản cũ và không lẫn Sentinel.
- AC-8: Given đường **agent** (`resolveConfig`) xin `satellite` mà thiếu `MAPPOSTER_SATELLITE_TILES`, When resolve, Then **TỪ CHỐI** nêu tên biến — không rơi về vector. Caller là agent KHÔNG nhìn thấy ảnh, nên một nền im lặng sai trả về clip "thành công" với nội dung sai.
- AC-9: Given đường **web** (`MapView`) thiếu nguồn tile, When dựng, Then rơi về vector. Khác AC-8 có chủ đích: người dùng web nhìn thấy ngay và tự hiểu.
- AC-10: Given URL tile, When kiểm đường đi của nó, Then nó tới trang render **qua `RenderConfig`**, không qua `import.meta.env`. Trang render là bundle đã build; một `VITE_*` bị nung lúc `vite build` nên biến môi trường lúc CHẠY của mcp-server không bao giờ với tới nó. Đây là lỗi thật đã xảy ra trong lúc soạn và được tự phát hiện.
- AC-11 *(judgment, T3)*: Given một cảnh render trên ảnh vệ tinh THẬT, When người ký xem, Then việc tắt sáu layer nhóm ground là đánh đổi ĐÚNG — bản đồ đọc được, đường và ranh giới còn nổi trên ảnh, và không mất thông tin nào người xem cần. **Chưa evidence được — xem `## Chặn`.**
- AC-12 *(judgment, T3)*: Given khung có attribution nền vệ tinh, When người ký đọc, Then chuỗi đủ nghĩa vụ với **cả hai** nguồn và vẫn đọc được ở kích thước nó được vẽ.

## Coverage

- **Trục Nhánh**: vector (AC-4, AC-7) | satellite có URL (AC-1, AC-2, AC-5, AC-6) | satellite **thiếu** URL (AC-3, AC-8, AC-9)
- **Trục Bề mặt**: agent từ chối (AC-8) vs web rơi về vector (AC-9) — hai chính sách khác nhau cho cùng một thiếu sót, và sự khác nhau đó là *thiết kế*
- **Trục Chiều kiểm**: tắt đúng thứ cần tắt **và** không tắt thứ khác (AC-1 hai chiều) | cộng dồn **chứ không** thay thế (AC-5)
- **Trục Đường dẫn dữ liệu**: AC-10 — chốt rằng URL đi qua config chứ không qua env lúc build. Không có nó, `satellite` qua được cửa kiểm ở server rồi im lặng rơi về vector ở trang.
- **Trục Nghĩa vụ giấy phép**: AC-5, AC-6, AC-12 — trục riêng vì hỏng ở đây không hiện ra thành lỗi, nó hiện ra thành vi phạm.
- [thước CE: negative control — trả lại điều kiện lọc cũ ⇒ AC-3 đỏ; tắt luôn `road-major` ⇒ AC-1 đỏ; attribution thay-vì-cộng ⇒ AC-5 đỏ. 3/3 đã đạt ở bước soạn.]

Chưa quét: chất lượng thị giác trên ảnh THẬT (AC-11), độ đọc của attribution trên nền sáng (ảnh vệ tinh sáng hơn theme tối — chữ có thể chìm).

## Chặn

**AC-11 và AC-12 chưa evidence được, và không phải vì thiếu công.** Chúng đòi một cảnh render
trên ảnh vệ tinh thật, tức cần một nguồn tile — mà nguồn đó là **PR #8b**, một quyết định hạ
tầng chưa chốt (xem spec §5). Ghi ra đây thay vì để chúng trôi thành "sẽ làm sau": gói này
**không thể đạt verdict PASS đầy đủ** cho tới khi #8b có kết luận.

Phần máy (AC-1..AC-10) thì độc lập với #8b và chạy được ngay — đó chính là lý do #8a được
tách khỏi #8b.

## Out of scope

- **Không** chọn hay dựng nguồn tile. Đó là #8b.
- **Không** đổi bất biến "clip không chữ". Attribution vốn đã là ngoại lệ được ghi nhận; gói này chỉ làm nội dung của nó phụ thuộc nguồn.
- **Không** thêm UI chọn nền cho ứng dụng web. Store có trường và action, nhưng chưa panel nào gọi — đường web hiện chỉ đọc `VITE_SATELLITE_TILES`.
- **Không** đụng NAIP hay bất kỳ nguồn phủ Mỹ nào (quyết định 2026-08-07 §8 để riêng).

## Notes

- **Risk tier T3**: chạm `src/lib/mapStyle.ts` **và** `src/lib/export.ts` — cả hai đều trong `t3_paths`.
- Gói này chạm code ⇒ mọi hợp đồng đang ghim `verified_commit` đều thành stale.

## Việc còn lại (chưa làm)

1. **Cổng 1** — chuẩn hoá + EVAL-GEN qua skill `acceptance`; `evals.yaml` kèm đây là nháp bám AC.
2. **Cổng 2** — chạy verify, sinh `evidence-report.md` + `run-log.jsonl`, ghim `verified_commit`.
3. **AC-11 / AC-12** — judgment T3, và **đang bị #8b chặn** (xem `## Chặn`).
4. **Chữ ký người** — do `manh` tự tạo (`require_human_commit: true`).
