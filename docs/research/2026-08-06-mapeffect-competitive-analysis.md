# mapeffect.app vs MapPoster — phân tích cạnh tranh & lộ trình clone chi phí tối thiểu

**Ngày:** 2026-08-06 · **Phạm vi:** deep research mapeffect.app, đối chiếu năng lực MapPoster,
đề xuất lộ trình clone rẻ nhất cho sản phẩm **API/MCP-first phục vụ AI Agent**.

> ## ⚠️ ĐÍNH CHÍNH (2026-08-06, sau khi phát hiện cây local lạc hậu)
>
> Toàn bộ phân tích dưới đây được thực hiện trên `main` local tại commit `9c11488`,
> **lạc hậu 25 commit** so với `origin/main` (`1b16a61`). Ba đính chính:
>
> 1. **Async job queue KHÔNG còn missing** — `POST /jobs` + `POST /jobs/status`
>    (`mcp-server/src/jobStore.ts`, `jobRunner.ts`) đã được implement và **ký duyệt**
>    (hợp đồng `async-job-queue`, round 5). Mọi câu trong tài liệu này nói async queue là
>    "missing / out-of-scope / L effort" đều SAI. Hệ quả: lập luận "progress notification
>    rẻ hơn async queue" (§4 mục 4.4) mất phần lớn trọng lượng — vấn đề timeout 60s của
>    MCP client nay đã có lối giải; progress notification chỉ còn giá trị UX bổ sung.
> 2. **Nay có BA hợp đồng đã ký**, không phải hai — thêm `async-job-queue`. Thuế
>    acceptance-gate mỗi PR tăng tương ứng (§7 ước tính theo 2 hợp đồng → cộng thêm 1 bộ eval).
> 3. **Số dòng đã đổi** ở `geocode.ts`, `motionCompiler.ts`, `http.ts` (3 file này nhận
>    +130/+152/+39 dòng từ nhánh async-job). `tools.ts` và `resolveConfig.ts` **không đổi**.
>
> **Không đổi:** 12 mục Tier 0 vẫn chưa tồn tại upstream, 4 bug production vẫn còn nguyên
> (đã verify trên `origin/main`). Phần còn lại của phân tích vẫn đứng vững.

**Phương pháp:** teardown trực tiếp trên trình duyệt (accessibility tree, `window.__store`,
`__map.getStyle()`, regex trên ~560 KB JS bundle) + 22 agent nghiên cứu song song
(5 recon, 3 inventory, 6 gap-analysis, 6 adversarial verify, 2 synthesis), ~4.5 M token.

---

## 0. Kết luận

1. **Cùng lõi công nghệ đến mức bất ngờ.** mapeffect chạy **MapLibre GL JS** trên
   **`tiles.openfreemap.org/planet`** — *chính xác* engine và nguồn tile MapPoster đang dùng.
   Khác biệt không nằm ở lõi render.
2. **Chỉ ~35% bề mặt mapeffect liên quan tới sản phẩm API-first.** Phần còn lại
   (52 preset chữ động, 45 preset callout, media, audio, xoá nền AI, timeline editor,
   watermark/tiering) là **presentation layer** — thuộc DOM của artifact platform.
   Clone nó là đi ngược kiến trúc, không phải chậm tiến độ.
3. **MapPoster đã thắng ở lõi motion.** Camera keyframe N-điểm, 4 easing, shortest-arc bearing,
   arc-length region reveal, 5 invariant validate trước khi mở browser, render **byte-identical
   deterministic** phía server. mapeffect không có gì tương đương server-side.
4. **Khoảng cách thật chỉ có 5 thứ**: `routes` chưa nối dây, road routing A→B (km/phút),
   export toạ độ màn hình (`resolved.anchors`), echo MotionScript đã compile,
   và ~12 tham số engine **đã build xong nhưng không tool nào chạm tới**.
5. **Đường rẻ nhất tới parity đáng kể ≈ 10 engineer-days** (Tier 0 + Tier 1, đã tính thuế gate).
   Ba ngày đầu mở 12 capability chỉ bằng param plumbing + sửa 4 bug đang chạy production.

> ⚠️ **Cảnh báo chiến lược, đọc trước khi quyết:** xem §6. Nghiên cứu cho thấy mapeffect là
> sản phẩm solo ~3 tuần tuổi (29 sub YouTube, 311 view video cao nhất, không có coverage bên
> thứ ba nào). "Parity với mapeffect" **không phải** thước đo đúng cho MapPoster.

---

## 1. Teardown kỹ thuật mapeffect.app (đo trực tiếp)

### 1.1 Kiến trúc render

| Thành phần | mapeffect | MapPoster |
|---|---|---|
| Map engine | **MapLibre GL JS 4.7.1** | **MapLibre GL JS** |
| Vector tiles | **`tiles.openfreemap.org/planet`** | **`tiles.openfreemap.org/planet`** |
| Compositing | WebGL canvas + `<canvas class="overlay-canvas">` 2D phủ trên | WebGL canvas + overlay → composite lúc export |
| Encode video | **client-side**: WebCodecs `VideoEncoder` + `Mp4Muxer`/`WebMMuxer` | **server-side**: headless Chromium → frames → ffmpeg |
| Backend | chỉ `/api/config`, `/api/hit`, payment | render server (MCP + REST), page pool |
| Determinism | không (phụ thuộc máy người dùng) | **byte-identical, có test khoá** |
| API công khai | **không có** | **có — đây là toàn bộ sản phẩm** |

### 1.2 Dịch vụ ngoài (tất cả đều là endpoint công khai)

- `tiles.versatiles.org/tiles/satellite/{z}/{x}/{y}` — **Sentinel-2 Global Mosaic, miễn phí, không key**
- `tiles.versatiles.org/tiles/elevation/{z}/{x}/{y}` — terrain/DEM miễn phí (attribution mapterhorn)
- `ibasemaps-api.arcgis.com/.../World_Imagery?token=…` — Esri/Maxar, **token nhúng trong client**
- `api.maptiler.com`, `api.mapbox.com` — có `MAPTILER_KEY` / `MAPBOX_TOKEN`
- **Routing**: `valhalla1.openstreetmap.de/route` + `routing.openstreetmap.de/{profile}/route/v1/…` (OSRM)
  → tính năng "Chỉ đường A→B (ô tô/xe máy/đi bộ)" chạy trên **instance OSM cộng đồng miễn phí**
- `storage.googleapis.com/mediapipe-models/…/selfie_segmenter` — xoá nền người trong ảnh/video chèn

### 1.3 Scene schema — `window.__store.project`

```jsonc
{
  "name": "Dự án mới",
  "aspect": "9:16",              // 16:9 | 9:16 | 1:1
  "duration": 12,                // giây
  "camera": { "keyframes": [] }, // {center:{lng,lat}, zoom, bearing, pitch, t, ease}
  "layers": [],
  "bgColor": "#000000",
  "bgAnim": null,
  "mapBase": "satellite",        // satellite | vector
  "vectorTheme": "liberty"
}
```

Store ops: `addLayer / updateLayer / removeLayer / moveLayer / reorderLayer / splitLayer /
addCameraKeyframe / updateCameraKeyframe / setAspect / setDuration / autoDuration / toJSON / load`.
Người dùng **lưu/mở `.json`**.

> **Điểm quan trọng nhất của cả bài nghiên cứu:** toàn bộ năng lực mapeffect **đã** có dạng
> một *scene document khai báo*; UI chỉ là bộ soạn thảo cho document đó. Một sản phẩm
> API-first chính là cùng document đó, bỏ đi bộ soạn thảo. Đây là lý do rất nhiều tính năng
> "UI phức tạp" của họ dịch sang MapPoster chỉ là **thêm tham số**, không phải xây tính năng.

### 1.4 Layer taxonomy (11 loại)

| type | Tool | Ghi chú |
|---|---|---|
| `plot` | Khoanh vùng (P) / Chọn vùng tự động (G) | 5 shape mode; `plots3d` → fill-extrusion 3D |
| `road` | Vẽ tuyến đường (R) / Chỉ đường A→B | `roadglow` viền phát sáng |
| `arrow` | Mũi tên (W) | single / converge; `arrowglow`+`shadow`+`heads` |
| `element` | Tiện ích BĐS (E) | benh-vien, khach-san, nha-hang, san-bay, ben-xe, ga-tau, school, hospital, park, market, airport |
| `object` | Đối tượng chuyển động (D) | car, tank, ship, plane, jetf15, jetsu30, person — chạy dọc path |
| `text` | Thêm chữ (T) | 23 font, arc, gradient, 3D extrude |
| `textfx` | Hiệu ứng chữ | **52 preset** canvas 2D |
| `title` | Call out | ~45 preset: leader line, ghim, social bar, logo intro |
| `media` | Ảnh / Video (M) | + xoá nền MediaPipe |
| `audio` | Âm thanh (A) | 803 SFX |
| `background` | nền màu / bgAnim | chế độ "ẩn bản đồ" |

MapLibre style thực tế: **32 layer**. Có `vnlbl`/`vnsea` — nhãn Hoàng Sa (`111.9, 16.5`) /
Trường Sa (`114.3, 9.6`) hardcode, và bộ tỉnh VN là **file 63 tỉnh đã lỗi thời**
(MapPoster resolve live từ Nominatim → dữ liệu mới hơn).

### 1.5 Camera & timeline

Keyframe `{center, zoom, bearing, pitch}` + thời điểm. Easing chỉ **3 kiểu**
(`linear`, `easeInOut`, `easeOut`). Thao tác: chụp keyframe (K), cắt layer tại playhead (S),
snap clip, undo/redo. **Đơn giản hơn MotionScript của MapPoster** — không spline, không motion path.

### 1.6 Gói giá

Free 0đ (3 video, 720p có logo) · PRO 149k/tháng (30 video, 1080p) ·
PRO MAX 249k/tháng (không giới hạn, 2K) · lẻ 10k ≤10s, +1k/giây.
Trong code có `subscription` và `per_video`.

---

## 2. Bảng so sánh năng lực

### A. ĐÃ CÓ — MapPoster thắng

| mapeffect | MapPoster | effort | agentValue |
|---|---|---|---|
| Vùng (G) — boundary theo tên | **have** | S (thêm observability) | high |
| Hiệu ứng vẽ viền (`anim='draw'`) | **have** | — | — |
| Camera & keyframe timeline | **have** | XS (echo script) | critical |
| Easing per-keyframe | **have** (4 vs 3) | — | none |
| Tỉ lệ khung 16:9 / 9:16 / 1:1 | **have** (22 format vs 3) | — | — |
| Ladder 720/1080/1440 | **have** (tới 4096px) | S | medium |

Chưa được ghi nhận ở đâu, nhưng cũng là điểm thắng: `render_variants` (fan-out khai báo),
determinism phía server, không khoá tab trình duyệt, không trần độ phân giải theo máy người dùng,
tool discovery, và **dữ liệu ranh giới live** thay vì file tỉnh tĩnh đã cũ.

### B. PARTIAL — engine đã có, API chưa với tới

| mapeffect | effort | agentValue | Ghi chú |
|---|---|---|---|
| Đường (R) — vẽ polyline | **S** | **critical** | `route-line` layer + store + type đã có, thiếu `RenderConfig.routes` |
| Vùng lồng nhau, màu riêng từng vùng | **XS** | **high** | renderer đã có test xanh; resolver ghi `color: null` |
| Marker icon/màu/size riêng | **XS-S** | **high** | `RenderMarker` đủ field, `resolveConfig` flatten hết |
| Đưa camera tới layer (fly to) | **XS** | **high** | auto-frame luôn lấy `markers[0]` hoặc union bbox |
| Layer toggle từng lớp | **XS** | **high** | **7/8 key wired end-to-end, 0 tool chạm tới** |
| Theme palette | **XS** | **high** | `list_themes` chỉ trả `{id,name}`, giấu 15-key palette |
| Level of detail | **XS** | medium | slider UI có, tham số API không |
| Bearing tĩnh + orbit | S | high | **Bug: `camera.bearing` bị nuốt im lặng trên clip** |
| 📌 Ghim vào bản đồ (geo-anchor) | L | **critical** | `map.project()` chạy mỗi marker rồi **vứt kết quả** |
| Multi-stop tour | M | **critical** | engine parity đủ; thiếu preset + framing math |
| Route draw-on | M | **critical** | track đã khai báo, bị chặn cứng `routeCount:0` |
| Distance indicator (km) | S-M | high | không có haversine/area ở đâu cả |

### C. MISSING — chưa có

| mapeffect | effort | agentValue |
|---|---|---|
| **Chỉ đường A→B (road routing + km/phút)** | M | **critical** — LLM không thể tự sinh polyline bám đường |
| Encoder quality / bitrate | XS | high — 422 oversize hiện là ngõ cụt |
| Progress reporting / cancel | S | high |
| Ảnh vệ tinh / satellite basemap | L | high* (xem §6 — vướng licensing) |
| Địa hình 3D / khối 3D | L-XL | low (spec §11: out of scope) |
| Particle FX (fire/sparks/smoke) | L | none |
| Object sprite 80 loại, cờ 195 nước | L | low |
| Watermark / tiering / quota | L | none |

### D. NOT-APPLICABLE — ngoài ranh giới engine

Chữ (T) · 52 preset textfx · 45 preset callout · name plate · media layer · xoá nền AI ·
âm thanh + 803 SFX · nền động · social bar · logo chìm.
**Tất cả agentValue = none** — DOM layer của artifact platform vẽ rẻ hơn, giữ được
localisation, restyle, và khả năng trích dẫn. Xem §6 về mức độ chắc chắn của lập luận này.

---

## 3. Tier 0 — Free wins (capability đã có, chỉ thiếu dây)

12 mục, gói gọn trong **2 file chính** (`mcp-server/src/tools.ts`, `resolveConfig.ts`) + 3 file phụ.
**Không đụng t3_path. Code ≈ 2.0 engineer-days.**

| # | Thêm gì | File |
|---|---|---|
| 1 | `layers?: {landcover,buildings,water,parks,roads,rail,aeroway,roadLabels}` | tools.ts:301-311 + resolveConfig.ts:267 — **throw** khi có cả `labels` lẫn `layers.roadLabels` |
| 2 | `detail?: 0..1` | tools.ts + resolveConfig.ts:259-268 — cliff là `detail > 0.12` |
| 3 | `highlight.regions[]: {name\|geojson, color?}` | tools.ts:287 + `assertColor` tại resolveConfig.ts:221 **và** :223 |
| 4 | `highlight.points[]: {lng,lat\|query, icon?, color?, size?}` | tools.ts:288 + resolveConfig.ts:230-236; `assertColor` **từng phần tử**; `size` clamp 18..140 |
| 5 | `font?: enum(6 FontKey)` | tools.ts + resolveConfig.ts:259-268 |
| 6 | `list_themes` trả thêm `dark` + `colors` (15 key) | tools.ts:265 |
| 7 | `render_clip` echo MotionScript đã compile | **2 dòng**: tools.ts:184, http.ts:285 |
| 8 | Bound `camera.pitch: 0..60`, `camera.bearing: 0..360` | tools.ts:297 + resolveConfig.ts:178-179 (**60**, không phải 85) |
| 9 | 🐞 seed `cfg.camera.bearing ?? 0` vào keyframe compiler sinh ra | motionCompiler.ts `compile()` |
| 10 | 🐞 `render_animation` honour `delivery` + byte cap | tools.ts:104-151 |
| 11 | `list_formats`: dedupe `4k`, trả `aspect`/`category`/`print?` | resolveConfig.ts:125-129 |
| 12 | `resolved.highlights.regions[i] += {osmType, osmId, displayName, placeRank}` | geocode.ts — nới kiểu `boundaryCache` theo (xem đính chính 2) |

**4 defect production đi kèm:** bearing bị nuốt trên clip · `pitch:200` được nhận rồi clamp im lặng ·
`render_animation` quảng cáo `delivery` rồi lờ đi · ~~`boundaryCache` trả shape cũ từ lần gọi thứ hai~~ (**sai — xem đính chính 2**).

> ## ⚠️ ĐÍNH CHÍNH 2 (2026-08-06, sau khi đã triển khai Tier 0)
>
> **`boundaryCache` chưa bao giờ là bug.** Tôi viết ở mục 12 rằng "phải nới kiểu `boundaryCache`,
> không thì lần gọi thứ hai trả shape cũ im lặng". Điều đó **sai**: `GeoJSONFeatureCollection`
> là `any` (`src/types.ts`), nên Map kiểu cũ vẫn nhận `ResolvedBoundary` lúc `lruSet` và trả
> đúng object đó lúc `lruGet` — không có khác biệt runtime nào. Nới kiểu vẫn đáng làm
> (làm kiểu khai báo trung thực) nhưng đó là **type hygiene, không phải vá bug**.
> → **Tier 0 có 3 bug production thật, không phải 4.**
>
> **`adminLevel` cũng sai:** Nominatim `/search` không trả `admin_level`. Bản ship dùng
> `placeRank` (city ~16, road ~26, POI ~30) — là trường granularity thật sự có trên `GeoResult`.
>
> **Phát hiện thêm khi triển khai (final review):** việc echo OSM identity ban đầu lấy identity
> từ *search hit*, trong khi `fetchRegionBoundary` có nhánh fallback trả polygon của một entity
> **khác** khi lookup chính xác không ra vùng. Tức là `resolved` có thể khẳng định chắc nịch
> một identity không khớp polygon đã vẽ — đúng ngay ca mà tính năng này sinh ra để giải
> (tên vùng VN nhập nhằng). Đã sửa: `RegionBoundary` nay mang identity của entity **thực sự**
> sinh ra polygon.
>
> **Và một điều chỉnh về `bearing`:** kế hoạch định bound `bearing` 0..360. Nhưng MapLibre
> render `bearing: -45` hoàn toàn đúng và `lerpAngle` đã tự normalize — bound sẽ là **gỡ bỏ
> một năng lực đang chạy được**. Bản ship **normalize** (`-45` → `315`) thay vì từ chối.
> Chỉ `pitch` mới bị từ chối khi ngoài 0..60.

---

## 4. Tier 1 — Rẻ & giá trị cao (~4.75 ngày code)

| # | Nội dung | Ngày | Value |
|---|---|---|---|
| 4.1 | **`routes` plumbing** — `routes?: [{geojson\|coords, color?, width?}]` → `resolved.routes[i] = {bbox, lengthKm, pointCount}`. Keystone của 5 tính năng khác. `bboxOfRegions` phải học routes. | 1.0 | critical |
| 4.2 | **`compile_motion`** — dry-run trả MotionScript, không mở browser page | 0.75 | critical |
| 4.3 | `camera.focus: {kind:'point'\|'region', index, paddingPct?}` | 0.25 | high |
| 4.4 | **Progress notification + cancel** — dùng `resetTimeoutOnProgress` của SDK. Đây là fix trực tiếp cho vấn đề MCP timeout 60s, **rẻ hơn async queue rất nhiều** | 1.0 | high |
| 4.5 | `output.quality: 'draft'\|'standard'\|'high'` → crf 28/20/16 | 0.5 | high |
| 4.6 | `list_fonts` | 0.25 | high |
| 4.7 | `measure.pairs` → haversine + area (file mới `geometry.ts`). Bắt buộc đặt tên `straightLineKm`, không bao giờ `km` | 1.0-1.25 | high |

---

## 5. Tier 2 — Đáng làm sau (~16 ngày code)

| # | Nội dung | Ngày | Value |
|---|---|---|---|
| 5.1 | **Road routing** — file mới `route.ts`, OSRM `?overview=full&geometries=geojson` (không cần polyline decoder). Rủi ro: `resolveConfig` chạy **trong** clip slot (concurrency=1) → router chậm giữ slot toàn cục. **Production phải self-host OSRM** | 2.5 | critical |
| 5.2 | **`resolved.anchors`** — toạ độ màn hình cho DOM layer. Chi phí thật là ripple qua mọi test fake, không phải 25 dòng project | 3.5 | critical |
| 5.3 | **Tour preset** + van-Wijk keyframe densification | 2.0 | critical |
| 5.4 | routeDraw animation *(cần amendment)* | 3.0 | critical |
| 5.5 | Stagger pinDrop / time window *(cần amendment)* | 2.5 | high |
| 5.6 | Catalog marker icon 6→23 — **Material Symbols FILLED (Apache-2.0)**, không dùng Lucide (stroke-only → vệt mực qua `ctx.fill`) | 2.0 | high |
| 5.7 | `cost: {frames, renderMs, encodeMs, bytes}` metadata | 0.5 | medium |

> **Ảnh vệ tinh — hoãn, không từ chối.** agentValue high nhưng đụng **cả hai** t3_path
> (`mapStyle.ts` cho source, `export.ts` vì attribution phải thành hàm của provider),
> phá ý nghĩa của 13 theme, làm `detail`/`layers`/`labels` thành no-op — đúng loại bug repo
> này vốn từ chối. **Và vướng licensing nghiêm trọng, xem §6.**

---

## 6. Cảnh báo — những chỗ phân tích này có thể sai

Một agent phản biện độc lập đã soi lại toàn bộ. Các điểm sau **chưa được kiểm chứng**
và có thể lật ngược kết luận:

### 6.1 Tiền đề chưa bao giờ được kiểm tra
mapeffect là sản phẩm solo **~3 tuần tuổi**: 29 sub YouTube, 311 view ở video cao nhất,
**không có bất kỳ coverage bên thứ ba nào**, tác giả tự nói trên camera rằng hiệu ứng lửa
"nhìn hơi giả", ink transition hỏng, radar hỏng, Media mode không có camera. Chạy trên
endpoint cộng đồng miễn phí, bán ~149k/tháng cho môi giới BĐS.

→ Trong khi đó recon phát hiện: **không đối thủ nào trong toàn cảnh khảo sát có API công khai.**
Google Earth Studio, Felt, Kepler, MapTiler, Animaps — không ai bán map-motion như một API gọi được.
**"Map motion as a callable API" là ngách trống.**

**Hệ quả:** "parity với mapeffect" là thước đo sai. Mọi mục mà lý do duy nhất là
"mapeffect có" nên bị cắt. Việc cần làm trước khi ship bất cứ thứ gì: chấm lại top-10 mục
theo trục **khác biệt hoá cho agent/API**, không theo trục parity.

### 6.2 AC-9 yếu hơn ta tưởng — điểm skeptic sẽ tấn công đầu tiên
AC-9 được viện dẫn ~15 lần làm lý do từ chối, nhưng chính cluster typography đã bác nó hai lần:
- `placeName` + `chrome:'poster'` **đã** nướng chữ tuỳ ý của caller vào pixel still hôm nay
- `labels:true` **đã** nướng chữ tên đường OSM vào frame **clip**, vì `prepareClipRender`
  force `chrome` nhưng không strip `labels`
- `export.test.ts` chỉ có **một** test, chạy ở `text.show:false` — sẽ **không bắt được**
  một lệnh vẽ chữ mới đặt sau guard `show`

→ **Việc cần làm:** thêm case thứ hai ở `show:true` assert tập vẽ đúng bằng
`[city, country, coords, ATTRIBUTION_TEXT]`, rồi **suy lại** 15 verdict not-applicable
dựa trên invariant *thật* thay vì invariant giả định.

### 6.3 Licensing ảnh vệ tinh — chưa ai đọc điều khoản
`server.arcgisonline.com/.../World_Imagery` không cần key **không đồng nghĩa với có giấy phép**.
Esri World Imagery chịu Esri Master Agreement; nội dung Maxar/Vivid bên trong còn ràng buộc
thêm về derivative works, caching và redistribution. Output của MapPoster là **video giao cho
một platform để tái phát hành thương mại** — tư thế khó bảo vệ nhất có thể.

→ **Phải đọc điều khoản từng provider (Esri, Maxar, MapTiler, VersaTiles)** với đúng câu hỏi:
*một video render chứa ảnh này có được bên thứ ba tái phát hành thương mại không?*
Nếu không hoặc không rõ → mục satellite tụt từ `high` xuống **blocked**.

**Chưa mô hình hoá chi phí:** không có ước lượng tile/frame, unique-tile/clip cho camera động,
giá/1000 request, hay dự phóng tháng. "Effort: L" được gán thuần trên cơ sở kỹ thuật.

### 6.4 OSM / ODbL cho video & rủi ro OpenFreeMap
Clip render là Produced Work (attribution, không share-alike) — nhiều khả năng ổn — nhưng
OSMF kỳ vọng credit "reasonably prominent". Thực tế: dòng attribution là
`Math.max(9, min(W,H) * 0.011)` px (`src/lib/export.ts:269`) → **~11 px ở 1080×1920**,
nhỏ hơn nữa ở 720p. Chưa ai đối chiếu con số này với guideline.

**Và:** MapPoster dùng **cùng** endpoint OpenFreeMap như mapeffect — donation-funded,
**không SLA, không thoả thuận commercial-volume**, ở nhịp batch phía server. Recon xếp việc
phụ thuộc endpoint cộng đồng miễn phí là rủi ro scaling/ToS **số một** của mapeffect.
Rủi ro đó MapPoster đang mang y hệt. Không có gap item nào cho việc này.

### 6.5 Con số 1108 ms/frame là comment, không phải phép đo
Trích từ `motionCompiler.ts:24-30` — một **comment**, đo trên M4 Max, trong khi production là
**1 CPU / 2 GB** (`render.yaml: plan: standard`), và chính hợp đồng gọi các con số là
"cận dưới lạc quan". Mọi kết luận "L vì mất ~4 phút", việc bảo vệ trần 12s, độ ưu tiên của
async queue đều thừa hưởng con số này.

Chưa xác định: frame cost là do **tile settle** hay do **PNG/base64 transport**
(`drawImage → PNG dataURL → base64 → Buffer`, chậm hơn `gl.readPixels` đáng kể).
Điều này quyết định async queue là P0 hay không cần thiết.

→ **Việc cần làm:** commit một benchmark script, đo tách bạch settle / snapshot / encode / CDP
transport, **trên hộp Render thật**.

### 6.6 `setNow()` — có sẵn, chưa dùng, chưa ai nhắc
`maplibre-gl` có `setNow()` với ví dụ frame-stepping ngay trong type definitions
(`node_modules/maplibre-gl/dist/maplibre-gl.d.ts:14603-14635`). Repo này chỉ dùng
`fadeDuration: 0` rồi tự viết `idleOnce` / `waitSourceLoaded` / `verifyAndReapplyGeoAt` / `restBase`.

→ **Spike 1 ngày:** drive `renderClipFrames` bằng `setNow(i * 1000/fps)`. Nếu nó thay thế được
bộ máy idle/verify, **định giá lại toàn bộ cluster motion** — vài mục L thành S, và verdict
"regionPulse bất khả thi về kiến trúc" có thể sai.

### 6.7 Lỗ hổng bảo mật độc lập
**`/mcp` hiện không có auth nào.** Bearer token chỉ gác `/render` và `/render-clip`;
nhánh fall-through phục vụ MCP không kiểm gì, và production bind `0.0.0.0`.
Đây là **ticket bảo mật P0**, không phải chi tiết phụ của tính năng metering.

### 6.8 Chưa xác minh
- Ba claim về three-repo (`ap-media-roadmap`, `onehub-render-service`) — **chưa mở repo nào**.
  Toàn bộ chiến lược "DOM sở hữu chữ, MapPoster trả anchors" (biện minh cho ~15 verdict
  not-applicable) dựa trên giả định platform thật sự có DOM overlay biết anchor.
- "Cổng no-fab" được viện dẫn ~20 lần, **chưa từng trích dẫn tới file nào** ở bất kỳ repo nào.
- `geocode_place` **không trả `bbox`** dù `GeoResult.bbox` đã được parse
  (`src/lib/geocoding.ts:60`) rồi bị `searchCandidates` vứt (`mcp-server/src/geocode.ts:196-206`).
  Ba dòng ở đây giải quyết phần lớn vấn đề mà mục 4.2 định xây cả một tool mới để giải.
- Chưa tạo tài khoản mapeffect → toàn bộ luồng export, watermark thật, quota, giá per-video
  là **suy luận từ JS minified**, chưa quan sát. Kênh Telegram (nơi backlog bug thật nằm) chưa mở.
- Hoàng Sa/Trường Sa: MapPoster **không** ship GeoJSON VN nào, resolve live từ Nominatim →
  vừa là lợi thế (dữ liệu mới) vừa là **rủi ro thị trường chưa được xem xét**
  (mapeffect hardcode tuyên bố chủ quyền; MapPoster thừa hưởng bất cứ điều gì OSM nói).
  **Cần quyết định của chủ repo, bằng văn bản, trước bất kỳ tính năng cờ/ranh giới nào.**

---

## 7. Chi phí acceptance-gate

**Sự thật cấu trúc quan trọng nhất: thuế là CỐ ĐỊNH TRÊN MỖI PR, không phải trên mỗi tính năng.**

`scripts/pre-merge-check.sh` → `stale_files()` diff **toàn repo** với `verified_commit`,
chỉ loại trừ `_acceptance/**`, `**/*.md`, `.github/**`. Cả hai hợp đồng đều `risk_tier: T3`,
`status: signed-off`, pin cùng commit `06d37e26`. Nên **bất kỳ** thay đổi code nào — kể cả sửa
1 dòng `listFormats` — đều làm hết hiệu lực bằng chứng của **cả hai**.

→ Mọi lập luận kiểu "mục này đụng file shared nên đắt hơn" là **sai** — nó không phân biệt
được mục nào với mục nào. Điều nó thực sự chứng minh là: **gộp lô, đừng ship lẻ.**

**Thuế cố định mỗi PR chạm code:** re-verify `mcp-map-render` (12 eval, 1 judgment) +
`map-motion-clip` (17 eval, 2 judgment) · E16 render lại MP4 thật (~2 phút) ·
T3 → **human verdict trực tiếp trên MỌI judgment eval** · **2 commit chữ ký riêng**
→ **≈ 0.5 agent-day + ~30 phút người / PR**

| Tier | Code | Gate | Tổng | PR | Người |
|---|---|---|---|---|---|
| **Tier 0** | 2.0 | 1.0 | **3.0 ngày** | 1 | ~30 ph |
| **Tier 1** | 4.75 | 2.0 | **~6.75 ngày** | 2 | ~1 h |
| **Tier 2** | 16.0 | 7.5 | **~23.5 ngày** | 5-6 | ~3 h |
| **Tổng** | 22.75 | 10.5 | **~33 engineer-days** | 8-9 | ~4.5 h |

- **T3 thật** (chạm `src/lib/export.ts` hoặc `src/lib/mapStyle.ts`): **+1.5 ngày/feature**.
  **Toàn bộ Tier 0/1/2 ở trên đã được thiết kế để né cả hai file này.**
- Tiền lệ đắt nhất: `mcp-map-render` chạy **15 vòng verify trong 26 ngày**, phần lớn là
  re-verify do feature *khác* làm stale. `map-motion-clip` verify **1 vòng ~2 phút** vì cây sạch.
- `git diff 06d37e26` hiện chỉ trả `_acceptance/**` + `docs/*.md` + `.github/**`
  → **cây đang sạch; PR code kế tiếp trả full thuế bất kể to nhỏ.**

---

## 8. Thứ tự triển khai đề xuất

**Nguyên tắc:** (1) thuế gate cố định → gộp tối đa mỗi lô; (2) làm trước thứ không cần amendment;
(3) `routes` là keystone của 5 tính năng khác nên đứng sớm; (4) `anchors` đụng mọi test fake nên
đặt **sau** khi churn schema đã lắng; (5) mục có gate phi-code đẩy về cuối.

| PR | Nội dung | Ngày | Chặn bởi |
|---|---|---|---|
| **#1** | **Tier 0 — cả 12 mục** | 3.0 | — |
| #2 | routes plumbing + measurements | 3.0 | — |
| #3 | compile_motion + camera.focus + list_fonts + encoder quality + cost | 2.5 | — |
| #4 | progress notification + cancel | 2.0 | — |
| #5 | road routing (`route.ts`) | 3.5 | #2, tốt nhất sau #4 |
| #6 | `resolved.anchors` (+ `resolved.camera`) | 4.5 | sau #1-#3 |
| #7 | tour preset + van-Wijk densification | 3.0 | #4, #6 |
| #8 | routeDraw *(amendment)* + stagger pinDrop *(amendment)* | 6.0 | #2, #7 |
| #9 | catalog marker icon 6→23 *(design gate lần đầu)* | 3.0 | #1 |

### PR #1 nên là gì — và tại sao

**Toàn bộ Tier 0**, chạm đúng 5 file: `tools.ts`, `resolveConfig.ts`, `http.ts` (2 dòng),
`motionCompiler.ts` (seed bearing), `geocode.ts` (osm ids + nới kiểu cache).

- **Tỉ lệ capability/dòng-code cao nhất trong repo**: 12 capability mới cho một khoản thuế gate
  duy nhất. 7 layer toggle đã wired end-to-end qua `mapStyle.ts` mà **chưa từng có tham số nào
  chạm tới** — code đã trả tiền mà chưa bao giờ dùng.
- **Không tạo khái niệm mới**: không schema mới, không amendment, không t3_path
  → xác suất trượt gate thấp nhất, phù hợp để hiệu chỉnh thời gian thực của quy trình.
- **Bao gồm 4 defect đang chạy production.**
- **Riêng 2 dòng echo `motion.script`** mở khoá vòng lặp preset→inspect→tweak mà hôm nay
  agent hoàn toàn không có.

**Trước khi viết dòng code nào:** chạy `bash scripts/pre-merge-check.sh --base main`
để chốt tập stale hiện tại — baseline đo thuế thật của PR #1.

---

## 9. Việc cần làm trước khi cam kết lộ trình

Xếp theo mức độ có thể lật ngược kết luận:

1. **Đọc điều khoản Esri/Maxar/MapTiler/VersaTiles** cho câu hỏi tái phát hành thương mại (§6.3)
2. **Spike `setNow()` 1 ngày** — có thể định giá lại toàn bộ cluster motion (§6.6)
3. **Benchmark trên hộp Render thật** — 1108 ms/frame là comment, không phải phép đo (§6.5)
4. **Fix auth `/mcp`** — P0 bảo mật, độc lập với mọi tính năng (§6.7)
5. **Thêm test AC-9 ở `show:true`** rồi suy lại 15 verdict not-applicable (§6.2)
6. **Mở 2 repo còn lại** để xác minh giả định DOM-owns-text (§6.8)
7. **Quyết định bằng văn bản** về Hoàng Sa/Trường Sa & dữ liệu hành chính VN (§6.8)
8. **Chấm lại top-10 theo trục khác biệt hoá API**, không theo trục parity mapeffect (§6.1)
