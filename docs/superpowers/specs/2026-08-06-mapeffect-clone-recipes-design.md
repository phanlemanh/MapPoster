# Spec — Clone năng lực mapeffect.app cho MapPoster: API-first + 8 recipe BĐS

**Ngày:** 2026-08-06 · **Trạng thái:** đã duyệt hướng (owner, phiên 2026-08-06)
**Nghiên cứu nền:** [docs/research/2026-08-06-mapeffect-competitive-analysis.md](../../research/2026-08-06-mapeffect-competitive-analysis.md)

## 1. Mục tiêu & quyết định đã chốt

Ba quyết định của chủ repo (phiên 2026-08-06):

1. **Hướng:** dùng mapeffect.app làm checklist tính năng, **tối ưu cho AI agent gọi qua API/MCP**,
   nhưng phủ đủ nghiệp vụ video bất động sản (routing km/phút, POI tiện ích, tour, vệ tinh,
   khoanh vùng). Đóng gói thành **công thức (recipe)** agent gọi một call ra video.
2. **Ảnh vệ tinh:** dùng **VersaTiles Sentinel-2** (`tiles.versatiles.org/tiles/satellite`) —
   miễn phí, không key, không vướng điều khoản tái phát hành như Esri/Maxar.
3. **Kiểm chứng trước:** chạy **spike `setNow()` 1 ngày** trước khi cam kết chi phí cluster motion.

**Hạng mục bàn giao khi hoàn tất: 8 recipe** (§4) + toàn bộ API nền chúng cần (§5).

## 2. Mô hình recipe — ranh giới trách nhiệm

Recipe là **công thức tham số hoá**, không phải video làm sẵn: một hàm compile nhận dữ liệu
thật của dự án → sinh MotionScript + RenderConfig → render. Recipe sống ở tầng
`tools.ts`/`motionCompiler.ts` — **không thêm khái niệm mới vào engine**.

| Tầng | Sở hữu |
|---|---|
| **MapPoster** | Catalog recipe (kịch bản camera, nhịp POI, logic framing); mọi recipe trả đủ metadata: `clip` (MP4 text-free), `settle`, `resolved.anchors`, `motion.script` đã compile |
| **Agent director** | Chọn recipe (`list_recipes`), điền dữ liệu (location/POIs/route/boundary), nhận video; tinh chỉnh bằng cách sửa `motion.script` và gọi lại, hoặc dry-run qua `compile_motion` |
| **DOM/Composer (OneHub)** | Chữ, giá, hotline, logo, nhạc, ghép clip — đặt theo `resolved.anchors`. AC-9 giữ nguyên: pixel video text-free, chỉ attribution |

Tool mới: `list_recipes()` (catalog tự mô tả: tên, tham số, thời lượng, ví dụ) và
`render_recipe({recipe, ...params})`.

## 3. Không làm (giữ nguyên từ nghiên cứu)

Chữ động/textfx 52 preset, callout 45 preset, media layer, xoá nền AI, âm thanh/803 SFX,
watermark/tiering, particle FX, mũi tên SDF, đổi theme giữa clip, Esri/Maxar imagery.
Lý do từng mục: nghiên cứu §2D, §6.

**Đính chính 2026-08-06:** async job queue **đã tồn tại** trên `origin/main`
(`POST /jobs` + `POST /jobs/status`, hợp đồng `async-job-queue` đã ký round 5) — nó không
nằm trong danh sách "không làm" nữa, và cũng không cần làm. Nay có **ba** hợp đồng đã ký,
thuế gate mỗi PR tính theo ba.

Ghi nhận ngoài lộ trình: auth `/mcp` là P0 bảo mật đang mở (owner chưa xếp lịch).

## 4. Tám recipe bàn giao

| # | Recipe | Kịch bản tự sinh | Tham số chính |
|---|---|---|---|
| 1 | `property-intro` | Bay từ toàn cảnh → zoom dự án → viền ranh vẽ dần → settle | location, boundary (geojson\|name), basemap, format |
| 2 | `connectivity` | Frame mọi tuyến → từng tuyến vẽ dần về dự án (stagger) → zoom về dự án; `resolved.routes[i] = {distanceKm, durationMin}` | location, routes[{from, mode}] |
| 3 | `amenities` | Camera ôm dự án + POI → pin drop từng tiện ích theo nhịp → pulse; `resolved.measures` khoảng cách thẳng | location, pois[{query, icon}] |
| 4 | `location-tour` | van-Wijk zoom-out-fly-zoom-in qua từng stop, dừng theo `dwellSec` | stops[{query, dwellSec}] |
| 5 | `area-overview` | Vệ tinh + từng phân khu hiện màu riêng + dim ngoài + drift chậm | location, zones[{geojson, color}], dim |
| 6 | `region-spotlight` | Approach: bay vào, viền vùng vẽ dần, dim xung quanh, settle | region (resolve live Nominatim), theme |
| 7 | `route-journey` | Tuyến vẽ dần (routeDraw) + camera follow đầu tuyến; anchor đầu tuyến theo thời gian cho DOM đặt sprite | route{from, to, mode}, camera:'follow' |
| 8 | `compare-locations` | Frame cả hai dự án + điểm quy chiếu → highlight lần lượt → `measures` về điểm quy chiếu | subjects[], reference |

## 5. Lộ trình triển khai (thứ tự PR)

| PR | Nội dung | Ngày | Mở khoá recipe |
|---|---|---|---|
| **#0** | **Spike `setNow()`** — drive `renderClipFrames` bằng `setNow(i·1000/fps)`; nếu thay được idle/verify apparatus → định giá lại cluster motion | 1.0 | — (quyết định giá mọi thứ sau) |
| **#1** | **Tier 0: 12 param plumbing + 4 bug production** (layers, detail, region color, point icon/color/size, font, list_themes palette, echo motion.script, bound pitch/bearing, seed bearing, render_animation delivery, list_formats dedupe, osm ids + boundaryCache) | 3.0 | nền cho tất cả |
| #2 | `routes` plumbing + `measure` (haversine/area, file mới `geometry.ts`) | 3.0 | — |
| #3 | `compile_motion` + `camera.focus` + `list_fonts` + encoder quality + `cost` metadata | 2.5 | — |
| #4 | Progress notification + cancel — **cần đánh giá lại**: async job queue đã có upstream nên timeout 60s đã có lối giải; PR này giờ chỉ còn giá trị UX bổ sung cho đường đồng bộ | 2.0 | — |
| #5 | Road routing OSRM (`route.ts` mới; production self-host, FOSSGIS chỉ để spike) | 3.5 | — |
| #6 | `resolved.anchors` + `resolved.camera` | 4.5 | `compare-locations` |
| #7 | Tour preset (van-Wijk densify) + POI catalog 6→23 icon (Material Symbols FILLED, Apache-2.0) + stagger cơ bản | 5.0 | `amenities`, `location-tour` |
| #8 | **Satellite basemap VersaTiles** — mở nguyên gói: `basemap:'vector'\|'satellite'`, attribution theo provider, quy tắc theme override. **T3 thật** (mapStyle.ts + export.ts), +1.5 ngày gate | 5.0 | `property-intro`, `area-overview` |
| #9 | **`render_recipe` + `list_recipes`** — 7 recipe (1-6, 8) | 3.5 | 7/8 recipe |
| #10 | routeDraw + camera follow *(amendment invariant)* → recipe `route-journey` | 6.0 | recipe cuối |

**Tổng ≈ 39 engineer-days** (gồm thuế gate; chi tiết thuế: nghiên cứu §7).
Điểm giá trị sớm: sau PR #2, toàn bộ năng lực cho `region-spotlight` đã sẵn (agent gọi được
qua `render_clip` + preset `approach` + dim; dạng recipe chính thức đến ở #9);
sau #5-6 agent render được video "dự án + route + km/phút" — lõi video BĐS.

**Quy tắc chi phí:** thuế acceptance-gate cố định trên mỗi PR (stale_files diff toàn repo) →
gộp lô tối đa; né `export.ts`/`mapStyle.ts` ở mọi PR trừ #8; amendment chỉ ở #10.

## 6. Kiểm thử & nghiệm thu

- Mỗi PR theo acceptance-gate hiện hành (T2/T3 theo file đụng; hợp đồng + evals + evidence).
- Recipe: mỗi công thức có eval render thật (settle PNG + kiểm `resolved` đủ trường
  anchors/measures/routes) + judgment eval cho chất lượng camera/nhịp.
- Spike #0 có báo cáo GO/NO-GO ngắn: setNow thay được gì, con số ms/frame trước/sau.

## 7. Rủi ro còn mở

- Con số 1108 ms/frame chưa đo trên hộp production (1 CPU/2GB) — spike #0 đo kèm.
- OpenFreeMap không SLA — rủi ro dùng chung với mapeffect, chưa có phương án dự phòng.
- Giả định "DOM owns text + anchors" chưa xác minh trên 2 repo còn lại của hệ ba repo.
- Hoàng Sa/Trường Sa & dữ liệu hành chính VN: resolve live từ OSM — cần quyết định owner
  bằng văn bản trước bất kỳ tính năng ranh giới/cờ nào ngoài phạm vi hiện tại.
