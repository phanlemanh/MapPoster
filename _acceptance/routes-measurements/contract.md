---
schema_version: 1
feature: routes plumbing + measurements — vẽ tuyến lên bản đồ và trả lời câu hỏi hình học
slug: routes-measurements
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: signed-off
approved_by: manh
approved_at: 2026-08-06T15:45:00Z
time_human_minutes: {gate1: 4, gate2: 10}
---

# Acceptance Contract: routes-measurements

## Context

`src/lib/mapStyle.ts` **đã** dựng source `routes` và layer `route-line`, đọc `color`/`width`
per-feature với `coalesce` fallback về accent của theme (mapStyle.ts:78-96, :246-256). Khâu đứt
duy nhất: `applyRenderConfig` không bao giờ set `store.routes`, nên store giữ mặc định `[]` và
năng lực đó chưa từng dùng được. Gói này nối dây, thêm tham số `routes` ở tầng tool, và bổ sung
`measure` — các câu hỏi hình học trả lời từ config **đã resolve**, không tốn thêm lời gọi mạng.

Đây là **keystone**: road routing A→B, routeDraw animation, mũi tên, connector và distance badge
đều treo vào `routes`; recipe `connectivity` (video "từ dự án đi đâu cũng gần") cần cả hai.

Khách hàng là **AI agent gọi MCP/REST**. Hai nguyên tắc chi phối tiêu chí dưới đây:
(1) agent **không nhìn thấy ảnh** nên input lạ phải bị **từ chối**, không được thay âm thầm;
(2) tên trường số đo phải **nói rõ phép đo** — một trường `km` trần sẽ được phía tiêu thụ đọc
thành "khoảng cách" rồi in lên video, biến một con số đúng thành một khẳng định sai.

Source input: prompt (phiên 2026-08-06) · spec `docs/superpowers/specs/2026-08-06-mapeffect-clone-recipes-design.md` §5 PR #2 · plan `docs/superpowers/plans/2026-08-06-pr2-routes-measurements.md`

## Criteria

- AC-1: Given `routes[]` mang `coords` (≥2 vị trí) hoặc `geojson`, When `resolveConfig` chạy, Then `RenderConfig.routes` nhận đủ các tuyến với `geojson`/`color`/`width` cụ thể.
- AC-2: Given một entry `routes[]` mang **cả hai** `coords` và `geojson`, hoặc **không mang cái nào**, When `resolveConfig` chạy, Then lời gọi bị **từ chối** với thông điệp nêu rõ phải có đúng một trong hai.
- AC-3: Given `routes[]` không khai `color`/`width`, When `resolveConfig` chạy, Then màu rơi về `accent` của theme đang dùng và độ dày về `4` — khớp `coalesce` fallback mà `mapStyle` đã dựng.
- AC-4: Given `routes[].coords` chỉ có 1 vị trí, hoặc `color` sai định dạng hex, hoặc `width` ngoài `1..16`, When `resolveConfig` chạy, Then mỗi trường hợp bị **từ chối** kèm tên trường sai; `width` đúng biên (`1`, `16`) vẫn **được nhận**.
- AC-5: Given `RenderConfig.routes` có dữ liệu, When `applyRenderConfig` chạy, Then store nhận `RouteItem[]` với `id` dạng `rt-${i}`; và Given lần render **sau** không có tuyến nào, Then store được dọn về `[]` — không rò tuyến giữa hai lần render trong cùng tiến trình.
- AC-6: Given tổng hình học nội tuyến (regions + routes) vượt `MAX_TOTAL_GEOJSON_BYTES`, When `resolveConfig` chạy, Then bị **từ chối**; và Given một payload lớn nhưng tổng vẫn dưới cap, Then **được nhận** — cap tổng không được biến thành cap-mỗi-payload trá hình.
- AC-7: Given lời gọi có `routes` nhưng **không** có region lẫn point, When auto-frame chạy, Then khung ôm phạm vi tuyến chứ không rơi về tâm `location`.
- AC-8: Given `routes` đã resolve, When `resolved.routes` trả về, Then mỗi tuyến mang `bbox`, `pointCount`, và `lengthKm` là **tổng các đoạn polyline**; và tuyến gấp khúc phải có `lengthKm` **lớn hơn** đường chim bay giữa hai đầu của chính nó.
- AC-9: Given `measure.pairs` trỏ vào hai điểm highlight, When `resolved.measures` trả về, Then mỗi cặp mang `straightLineKm` (đường chim bay) và `bearingDeg` (phương vị 0..360).
- AC-10: Given `measure.pairs` chứa chỉ số không có điểm tương ứng, When `resolveConfig` chạy, Then lời gọi bị **từ chối** — không được lặng lẽ bỏ cặp sai.
- AC-11: Given một vùng highlight là polygon **có lỗ**, When `resolved.measures.regions` trả về, Then `areaKm2` đã **trừ lỗ** (nhỏ hơn vùng đặc cùng ranh ngoài), kèm `spanKm` và `centroid`.
- AC-12: Given một lời gọi **không** dùng `routes` lẫn `measure`, When response trả về, Then `resolved` **không có** khoá `routes` lẫn `measures` — lời gọi không dùng không phải trả tiền context.
- AC-13: Given toàn bộ diff của gói này, When đối chiếu với merge-base, Then `src/lib/export.ts` và `src/lib/mapStyle.ts` **không đổi một dòng nào**, và mọi field mới có runtime assert vừa được **định nghĩa** vừa được **gọi**.
- AC-14: Given mã nguồn của resolver và geometry, When soi tên field số đo, Then **không** tồn tại tên trần (`km`, `distance`, `area`, `length`, `span`) — chỉ `lengthKm` / `straightLineKm` / `areaKm2` / `spanKm`.

## Coverage

- **Trục Dạng nhập tuyến**: `coords` | `geojson` | cả hai (từ chối) | không cái nào (từ chối) — [thước CE: `routeSchema.refine` trong tools.ts và kiểm lại trong `resolveRoutes` cho caller bỏ qua Zod]
- **Trục Chiều kiểm**: nhận đúng (AC-1,3,5,8,9,11) | từ chối sai (AC-2,4,6,10) | **không** kích hoạt (AC-12 không thêm khoá; AC-5 nửa sau dọn về rỗng; AC-6 nửa sau vẫn nhận) — [thước CE: quy tắc (b) — mỗi tiêu chí ngưỡng có nửa suppression]
- **Trục Tầng**: resolver (`resolveConfig`) | store (`applyRenderConfig`) | tool/API (`resolvedOf`) | pixel (demo render) — [thước CE: AC-5 phủ tầng store, AC-12 phủ tầng tool, script demo phủ tầng pixel]
- **Trục Phép đo**: chim bay hai điểm | tổng polyline | diện tích trừ lỗ | span bbox | phương vị — [thước CE: AC-8 buộc polyline > chim bay, AC-11 buộc trừ lỗ; hai cái này lộ ngay nếu cài đặt nhầm phép đo]
- **Trục Bất biến phải giữ**: t3_path không đụng (AC-13) | tên số đo tự mô tả (AC-14) | không rò trạng thái giữa hai lần render (AC-5)

Chưa quét: hành vi khi tuyến vượt antimeridian (±180°) — `bboxOfGeojsons` không xử lý wrap, đã ghi ở Out of scope.

## Out of scope

- **Không** thêm road routing A→B (OSRM/Valhalla). Gói này chỉ nhận polyline caller đưa; routing là PR #5, cần rate-limiter riêng và quyết định self-host.
- **Không** thêm `routeDraw` animation. Track đã khai báo trong `motionScript` nhưng bị chặn cứng `routeCount: 0`; mở nó cần amendment hợp đồng `map-motion-clip` — thuộc PR #10.
- **Không** đụng `src/lib/mapStyle.ts`. Layer `route-line` đã đủ năng lực; chạm vào là đẩy gói lên T3 mà không mua thêm gì.
- **Không** xử lý tuyến vượt antimeridian. `bboxOfGeojsons` sẽ cho bbox trải gần trọn địa cầu; chưa có caller nào cần, và fix đúng cần đổi cả auto-frame.
- **Không** đo quãng đường **đi thực tế** theo đường bộ. `lengthKm` là tổng polyline caller đưa; nếu polyline đó bám đường thì nó là quãng đường đi, còn `straightLineKm` thì không bao giờ.
- **Không** thêm `measure` cho cặp region-region hay point-region. Chỉ point-point; các cặp khác chưa có caller yêu cầu (YAGNI).

## Notes

- **Risk tier T2**: diff không chạm `src/lib/export.ts` lẫn `src/lib/mapStyle.ts` — hai mục duy nhất trong `risk_tiers.t3_paths`. Script `routes_invariants` kiểm I1 mỗi lần chạy.
- **Không có eval design-quality**: `surfaces: [api]`, không bề mặt web UI nào được render bởi gói này.
- **`bboxOfRegions` đổi tên thành `bboxOfGeojsons`** và nhận thẳng danh sách FeatureCollection, để auto-frame dùng được cho cả routes. Thuật toán flatten mù giữ nguyên — đúng cho bbox, và có comment giải thích vì sao diện tích **không** được tái dùng nó.
- Bốn hợp đồng đã ký (`mcp-map-render`, `map-motion-clip`, `async-job-queue`, `tier0-agent-params`) đều stale evidence do gói này chạm code — thuế cố định mỗi PR.
