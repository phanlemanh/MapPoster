---
schema_version: 1
feature: Tier 0 — mở 12 capability engine đã có qua tham số MCP/REST + 3 bug production
slug: tier0-agent-params
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by: manh
approved_at: 2026-08-06T13:54:51Z
time_human_minutes: {gate1: 5, gate2: 0}
---

# Acceptance Contract: tier0-agent-params

## Context

Engine render của MapPoster từ lâu đã tiêu thụ `RenderConfig.layers`, `.detail`, `.font`,
`RenderHighlightRegion.color` và `RenderMarker.{icon,color,size}` — nhưng **không tham số
tool nào chạm tới được**. Gói này nối dây tầng schema/resolver (`mcp-server/`) để agent gọi
tới, và vá 3 defect phát hiện trong lúc nối: `camera.bearing` bị nuốt im lặng trên clip,
`pitch`/`bearing` không bound, `render_animation` quảng cáo `delivery` rồi lờ đi đồng thời
là output path duy nhất không có byte cap dù ghi vào sink **bền vững**.

Khách hàng là **AI agent gọi MCP/REST**, không phải người dùng UI. Nguyên tắc chi phối
toàn bộ tiêu chí dưới đây: agent **không nhìn thấy ảnh render**, nên mọi lần thay thế
giá trị âm thầm đều không thể phát hiện — vì vậy input lạ phải bị **từ chối**, không được
thay bằng mặc định.

Source input: prompt (phiên 2026-08-06) · spec `docs/superpowers/specs/2026-08-06-mapeffect-clone-recipes-design.md` · plan `docs/superpowers/plans/2026-08-06-pr0-spike-setnow-pr1-tier0.md` · PR https://github.com/phanlemanh/MapPoster/pull/15

## Criteria

- AC-1: Given một lời gọi `render_map` mang `layers`, `detail` và `font` hợp lệ, When `resolveConfig` chạy, Then `RenderConfig` nhận đúng cả ba giá trị đó verbatim.
- AC-2: Given một lời gọi mang **cả** `labels` **lẫn** `layers.roadLabels`, When `resolveConfig` chạy, Then lời gọi bị **từ chối** với thông điệp nêu rõ hai trường cùng đặt một công tắc — không được tự chọn bên thắng.
- AC-3: Given input ngoài miền (`detail` > 1, `font` lạ, khoá layer lạ, giá trị layer không phải boolean), When `resolveConfig` chạy, Then mỗi trường hợp bị **từ chối** kèm thông điệp nêu tên trường và giá trị sai; `detail = 0` và `detail = 1` (biên hợp lệ) vẫn **được nhận**.
- AC-4: Given `highlight.regions` chứa cả ba dạng (chuỗi trần, `{name,color}`, `{geojson,color}`), When `resolveConfig` chạy, Then mỗi region mang đúng màu của riêng nó và region không khai màu nhận `null` (rơi về màu chung); một màu sai định dạng ở **bất kỳ** phần tử nào làm cả lời gọi bị từ chối.
- AC-5: Given `highlight.points` chứa cả ba dạng (chuỗi trần, `{lng,lat,…}`, `{query,…}`), When `resolveConfig` chạy, Then mỗi marker nhận đúng `icon`/`color`/`size` riêng, và marker không khai thì rơi về `highlight.pointIcon` / `highlight.color` / `44` theo thứ tự đó.
- AC-6: Given `highlight.points[].size` nằm ngoài `18..140`, When `resolveConfig` chạy, Then lời gọi bị **từ chối**; và Given `size` đúng bằng biên (`18`, `140`) hoặc `size: 0`, Then biên được **nhận** còn `0` bị **từ chối** (không được coi `0` là "chưa đặt").
- AC-7: Given `highlight.points[].icon` hoặc `highlight.pointIcon` là icon lạ, When `resolveConfig` chạy, Then lời gọi bị **từ chối** — **không** được âm thầm rơi về `pin`.
- AC-8: Given một lời gọi có input rẻ không hợp lệ (màu/size/icon sai) ở phần tử **thứ hai trở đi**, When `resolveConfig` chạy, Then lời gọi bị từ chối **trước khi** bất kỳ lời gọi mạng Nominatim nào phát ra (`resolveLocation`/`resolveBoundary` không được gọi lần nào).
- AC-9: Given agent gọi `list_themes`, When tool trả về, Then mỗi theme mang `id`, `name`, `dark` và `colors` đủ 15 khoá — đủ để agent colour-match lớp DOM phủ lên map; số lượng theme không đổi (13).
- AC-10: Given agent gọi `list_formats`, When tool trả về, Then `4k` xuất hiện **đúng một lần**, mỗi mục mang `aspect`/`category` đúng loại thật của nó, mục in mang `print`, mục không in **không có** khoá `print`.
- AC-11: Given một clip render qua **bất kỳ** bề mặt nào trong ba (MCP `render_clip`, REST `POST /render-clip`, async `POST /jobs`), When lời gọi trả về — kể cả nhánh xuống cấp encode-lỗi và nhánh từ chối quá cỡ, Then response mang `motion.script` là MotionScript **đã compile và đã validate**.
- AC-12: Given `camera.pitch` ngoài `0..60`, When `resolveConfig` chạy, Then bị **từ chối**; và Given `camera.bearing` âm hoặc ngoài `0..360` (ví dụ `-45`), Then **không** bị từ chối mà được **normalize** (`-45` → `315`) — bound bearing sẽ là gỡ một năng lực MapLibre đang chạy được.
- AC-13: Given `camera.bearing` khác 0 kèm `motion.preset`, When preset được compile, Then **mọi** keyframe sinh ra mang bearing đó; và Given config thiếu bearing, Then script compile ra **y hệt** như trước gói này (giữ bất biến determinism).
- AC-14: Given `render_animation` được gọi với `delivery: 'url'`, When tool trả về, Then **không** có khối ảnh base64 nội tuyến nào; và Given output vượt `MAPPOSTER_CLIP_MAX_BYTES` ở định dạng thứ hai của `format: 'both'`, Then lời gọi bị từ chối và **mọi** file đã ghi trước đó (kể cả file đầu đã hợp lệ) bị xoá khỏi sink.
- AC-15: Given một region tên gọi phải đi qua nhánh fallback của `fetchRegionBoundary` (lookup chính xác không ra vùng), When `resolved.highlights.regions[i]` trả về, Then identity (`osmType`/`osmId`/`displayName`/`placeRank`) là của entity **thực sự sinh ra polygon**, không phải của search hit ban đầu.

## Coverage

Quét theo trục (morphological): mỗi trục liệt kê các giá trị và thước đối chiếu.

- **Trục Kiểu tham số**: enum (`font`, `icon`) | số có miền (`detail`, `size`, `pitch`, `bearing`) | object khoá cố định (`layers`) | union nhiều dạng (`regions`, `points`) — [thước CE: `mcp-server/src/tools.ts` renderMapShape là danh sách đóng, đối chiếu 1-1 với các assert trong `resolveConfig.ts`]
- **Trục Chiều kiểm**: nhận đúng (AC-1,4,5,9,10,11) | từ chối sai (AC-2,3,6,7,12) | **không** kích hoạt (AC-8 không gọi mạng; AC-13 nửa sau không đổi output; AC-14 nửa đầu không base64) — [thước CE: quy tắc (b) của skill — mỗi tiêu chí ngưỡng/biên phải có nửa suppression]
- **Trục Bề mặt**: MCP tool | REST | async job — [thước CE: AC-11 buộc cả ba; `grep -c "script: motion"` trên `tools.ts`/`http.ts`/`jobRunner.ts` phải = 3]
- **Trục Nhánh trả về**: thành công | xuống cấp encode-lỗi | từ chối quá cỡ — [thước CE: cả ba dùng chung một binding `motionOut`, AC-11 phủ cả ba]
- **Trục Bất biến phải giữ**: determinism (AC-13) | t3_path không đụng (AC ngầm — xem Notes) | transient failure không bị memo hoá thành "vùng không tồn tại" (AC-15 kèm)

Chưa quét: khả năng tương thích ngược của **consumer thật** ngoài repo (OneHub artifact platform) — repo này không giữ mã consumer nên không có nguồn đối chiếu; đã ghi ở Out of scope.

## Out of scope

- **Không** đổi hành vi engine render. Gói này chỉ nối dây `mcp-server/` tới các trường `RenderConfig` đã tồn tại; `src/lib/export.ts` và `src/lib/mapStyle.ts` (t3_path) phải **0 dòng thay đổi**.
- **Không** thêm ảnh vệ tinh / basemap raster / terrain — thuộc PR #8 trong lộ trình, và còn vướng licensing chưa được rà.
- **Không** thêm `render_recipe` / `list_recipes` — 8 công thức BĐS thuộc PR #9, phụ thuộc `routes`, `anchors`, road routing chưa có.
- **Không** đụng `/mcp` auth — đây là P0 bảo mật độc lập, chủ repo chưa xếp lịch; gói này không làm nó tốt hơn cũng không tệ đi.
- **Không** kiểm chứng tương thích ngược với consumer ngoài repo (OneHub artifact platform, render-svc). Mọi trường thêm vào đều optional và mọi test trong repo xanh, nhưng repo này không giữ mã consumer để chạy đối chiếu thật.
- **Không** sửa các Minor đã ghi nhận ở final review: `fontSchema`/`LAYER_KEYS`/bound `18..140` trùng lặp nhiều nơi, 3 literal `motionOut` gần giống nhau, `render_animation` quá cỡ vứt luôn preview still (trong khi `render_clip` giữ settle).

## Notes

- **Risk tier T2**: `git diff --name-only origin/main..HEAD` không chạm `src/lib/export.ts` lẫn `src/lib/mapStyle.ts` (hai mục trong `risk_tiers.t3_paths`). Đã verify 0 dòng.
- **Không có eval design-quality**: gói này không render bề mặt web UI nào — `surfaces: [api]`. `src/render/renderConfig.ts` chỉ là khai báo kiểu, `src/lib/geocoding.ts` là thư viện. Bỏ qua theo §2b của skill.
- **`placeRank` thay `adminLevel`**: Nominatim `/search` không trả `admin_level`; `placeRank` (city ~16, road ~26, POI ~30) là trường granularity thật sự có trên `GeoResult`.
- **`boundaryCache` nới kiểu là type hygiene, không phải vá bug**: `GeoJSONFeatureCollection` là `any` nên Map kiểu cũ vẫn nhận/trả đúng object. Vì vậy contract này nói **3 bug**, không phải 4 — đính chính so với plan gốc.
- Ba hợp đồng đã ký (`mcp-map-render`, `map-motion-clip`, `async-job-queue`) đều stale evidence do gói này chạm code; phải chạy lại verify cho cả ba trước khi merge (thuế cố định mỗi PR, `stale_files()` diff toàn repo).
