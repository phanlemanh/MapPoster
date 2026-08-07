---
schema_version: 1
feature: Road routing — đường đi thực tế bám đường qua OSRM
slug: road-routing
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by: manh
approved_at: 2026-08-07T08:40:00Z
time_human_minutes: {gate1: 4, gate2: 0}
---

# Acceptance Contract: road-routing

## Context

Tuyến bám đường là thứ **mô hình ngôn ngữ không thể tự sinh** — nó phải hỏi một router.
Đây là mảnh cuối mà recipe `connectivity` cần (video "từ dự án đi đâu cũng gần": mỗi tuyến
kèm số km và số phút thật).

`routes` của PR #2 đã nhận polyline caller đưa; gói này thêm dạng thứ ba `{ route }` gọi
OSRM. Chọn OSRM thay Valhalla vì `geometries=geojson` trả thẳng GeoJSON — khỏi viết
polyline decoder, bớt một lớp có thể sai lặng lẽ.

Đây là **lời gọi mạng ra ngoài đầu tiên mà nội dung do caller ảnh hưởng**, nên ba ràng buộc
vận hành dưới đây không phải tuỳ chọn.

Source input: prompt (phiên 2026-08-07) · spec `docs/superpowers/specs/2026-08-06-mapeffect-clone-recipes-design.md` §5 PR #5 · plan `docs/superpowers/plans/2026-08-07-pr5-road-routing.md`

## Criteria

- AC-1: Given `routes[].route` với `from`/`to` toạ độ, When `resolveConfig` chạy, Then router được hỏi với `overview=full` và `geometries=geojson`, và tuyến trả về là LineString bám đường.
- AC-2: Given tuyến đi qua router, When `resolved.routes[i]` trả về, Then mang `distanceKm`, `durationMin`, `provider` **bên cạnh** `lengthKm`/`bbox`/`pointCount`.
- AC-3: Given tuyến caller tự vẽ (`coords`/`geojson`), When `resolved.routes[i]` trả về, Then ba trường của router **VẮNG MẶT** — không phải `0`; chúng là sự thật của router, không suy ra được từ polyline.
- AC-4: Given một entry mang nhiều hơn một trong `coords`/`geojson`/`route`, hoặc không mang cái nào, When `resolveConfig` chạy, Then bị **từ chối** kèm thông điệp nêu đúng-một-trong-ba.
- AC-5: Given `from`/`to` là tên địa danh, When `resolveConfig` chạy, Then chúng được geocode qua **cùng anchor quốc gia** mà highlight dùng.
- AC-6: Given `via` có nhiều điểm, When router được hỏi, Then thứ tự trong URL là `from;via…;to`.
- AC-7: Given `mode` là `moto`, When router được hỏi, Then profile là `driving` và `provider` **ghi ra** điều đó — OSRM công cộng không có profile xe máy, giả vờ có là nói dối về thứ router thật sự tính.
- AC-8: Given cùng một yêu cầu được hỏi hai lần, When lần thứ hai chạy, Then lấy từ cache, **không** tốn lời gọi mạng thứ hai; và Given cùng hai đầu nhưng khác `mode`, Then **vẫn** tốn lời gọi riêng (mode nằm trong khoá cache).
- AC-9: Given router treo, When timeout hết hạn, Then lời gọi bị **huỷ** và trả lỗi có chữ "timed out" kèm tên env chỉnh — `resolveConfig` chạy **trong** clip slot (concurrency 1) nên treo là giữ slot toàn cục tới deadline pool.
- AC-10: Given router trả `NoRoute` hoặc lỗi HTTP, When lời gọi kết thúc, Then trả lỗi caller-actionable nêu `MAPPOSTER_OSRM_URL` — **không** trả đường rỗng để agent vẽ ra bản đồ trống mà không biết vì sao.
- AC-11: Given toạ độ ngoài miền hợp lệ, When `resolveRoute` chạy, Then bị **từ chối trước khi** phát bất kỳ lời gọi mạng nào.
- AC-12: Given geometry rất dài, When trả về, Then bị decimate xuống ≤ 700 điểm **giữ nguyên hai đầu** — payload không phụ thuộc độ dài chuyến đi.
- AC-13: Given toàn bộ mã, When soi bất biến, Then host router **chỉ** đến từ `MAPPOSTER_OSRM_URL`, **không** hàm export nào nhận host/url từ caller, toạ độ vào URL đi qua `Number()` sau validate, **mọi** `fetch` mang `signal`, và `route.ts` **không** import `export.ts`/`mapStyle.ts`.
- AC-14: Given `camera.focus` với `kind: 'route'`, When tuyến là tuyến routed, Then khung ôm đúng tuyến đó.

## Coverage

- **Trục Dạng nhập**: `coords` | `geojson` | `route` | nhiều hơn một (từ chối) | không cái nào (từ chối) — [thước CE: `refine` đếm đúng-một-trong-ba ở Zod, kiểm lại trong `resolveRoutes`]
- **Trục Chiều kiểm**: nhận đúng (AC-1,2,5,6,12,14) | từ chối sai (AC-4,10,11) | **không** kích hoạt (AC-3 vắng mặt ba trường; AC-8 không tốn lời gọi thứ hai; AC-11 không phát request) — [thước CE: quy tắc (b)]
- **Trục Rủi ro vận hành**: SSRF (AC-13) | treo giữ clip slot (AC-9) | payload phình theo độ dài (AC-12) | phụ thuộc instance công cộng (AC-10 nêu remedy) — [thước CE: ba rủi ro nêu trong plan §"Ba rủi ro", mỗi cái có tiêu chí]
- **Trục Phép đo**: `distanceKm` router báo | `lengthKm` ta tự đo — [thước CE: AC-2 buộc cùng tồn tại, AC-3 buộc vắng mặt khi không có router]

Chưa quét: hành vi khi router trả tuyến vượt antimeridian — thừa hưởng hạn chế `bboxOfGeojsons` đã ghi ở PR #2.

## Out of scope

- **Không** self-host OSRM trong repo này. Gói này chỉ trỏ tới một router; dựng hạ tầng là việc vận hành, đã nêu remedy trong README và thông điệp lỗi.
- **Không** thêm Valhalla hay provider thứ hai. Một provider, một hình dạng lỗi; thêm provider là thêm bề mặt mà chưa caller nào yêu cầu.
- **Không** thêm `routeDraw` animation cho tuyến routed — vẫn thuộc PR #10, cần amendment `map-motion-clip`.
- **Không** đo chi phí router trong `cost`. `cost` đo render/encode; thời gian mạng thuộc lớp khác và trộn vào sẽ làm hai con số cùng khó đọc.
- **Không** cho caller chọn host router. Đây là quyết định bảo mật, không phải thiếu tính năng.

## Notes

- **Risk tier T2**: không chạm `src/lib/export.ts` lẫn `src/lib/mapStyle.ts`.
- **Attribution không đổi**: `ATTRIBUTION_TEXT` đã có "© OpenStreetMap contributors", mà OSRM chạy trên dữ liệu OSM — không có lý do kéo `export.ts` vào.
- **`resolveRoutes` chuyển sang async**; `resolveConfig` vốn đã async nên không lan ra ngoài.
- Sáu hợp đồng đã ký đều stale evidence do gói này chạm code.
