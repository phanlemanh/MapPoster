# Map Motion Clip — MapPoster thành engine chuyển động cho video BĐS (Design 2026-08-03)

> Định vị lại MapPoster: từ poster tĩnh (PNG/PDF) thành **engine sinh clip bản đồ chuyển động**
> phục vụ video plugin của artifact platform. Nối tiếp spec phía consumer:
> `ap-media-roadmap/docs/superpowers/specs/2026-07-25-map-scene-recipes-design.md`
> (3 viên `map.orient` / `map.around` / `map.infra`, Kiến trúc C, bất biến no-fab M4).

## 0. Bối cảnh & vì sao

Gate 2 của gói map-scene (25/07) bác với lời phán: *"hiển thị được bản đồ, nhưng visual chưa
đạt — frame/beat này có nghĩa gì?"*. Thứ tạo nghĩa cho cảnh bản đồ là **chuyển động có chủ đích**:
bay từ toàn cảnh xuống đúng vị trí, vẽ dần ranh giới quận, thả pin — những điều một ảnh tĩnh
không diễn đạt được.

Đối thủ trực tiếp mapeffect.app đã chứng minh nhu cầu (timeline + keyframe camera + khoanh vùng
+ tuyến + hiệu ứng, người dùng VN, có paywall). Nhưng kiến trúc của họ render **trong trình
duyệt** (WebCodecs, webm/mp4-muxer) — mỗi video cần một người ngồi edit. MapPoster render
**headless phía server** (Playwright pool + ffmpeg) — sinh hàng loạt từ dữ liệu listing là thứ
họ về cấu trúc không làm được. Ta không đua editor; ta bán chuyển động-của-sự-thật-địa-lý qua API.

### Giải phẫu MapEffect — học gì, bỏ gì (đã phân tích 8.312 dòng source unminified)

Bốn kỹ thuật mang về:

1. **Toàn engine là một hàm thuần theo thời gian** — `applyAt(t)`: scrub, preview, export đều đi
   qua nó; export = replay `t = i/fps`. Không state tích luỹ ⇒ seek tới khung bất kỳ.
2. **`jumpTo` từng khung, tự nội suy** (`lerp` center/zoom + `lerpAngle` bearing + ease theo
   đoạn) — không bao giờ `flyTo`/`easeTo` (wall-clock, phi tất định, không headless được).
3. **Hai đồng hồ**: thời-gian-nội-dung `t` (hiệu ứng một-lần) tách khỏi đồng-hồ-pha (hiệu ứng
   lặp: pulse, nét đứt). Export: pha = t ⇒ tất định.
4. **Vẽ-dần = cắt hình học**: `sliceLine(coords, p)` → `source.setData()` mỗi khung — không cần
   canvas overlay cho phần địa lý.

Bỏ lại: nửa trình bày của model layer họ (`text`/`textfx`/`title`/`media`/`audio`) — thuộc
composition DOM + Remotion + audio-bus phía render-svc, và bất biến M4 cấm MapPoster làm;
editor tương tác, undo, selection — không có người ngồi trước timeline trong kiến trúc này.

### Bằng chứng hai đầu cắm đã có ổ

- `zMediaRef.kind = enum(["image", "clip"])` — chữ `"clip"` đã khai sẵn phía artifact platform,
  chưa ai sinh clip.
- Remotion phía render-svc đã chạy `OffthreadVideo` production (TalkingHead/Pip/Full) — lớp
  video dưới chữ DOM là hình dạng đã được chứng minh.
- MapPoster đã có: `renderAnimationFrames` (khung rời + pulse phase), encoder ffmpeg
  libx264/yuv420p/faststart (`encodeAnimation.ts`), REST `/render` trả khối `resolved`.

## 1. Quyết định đã chốt (Manh, 03/08)

| # | Quyết định | Ghi chú |
|---|---|---|
| D1 | Người dùng chính: **sàn/agency làm hàng loạt, API-first** | Không đua editor với MapEffect |
| D2 | Chuyển động đóng thành **công thức cho LLM biên tập** — đúng mẫu 3 viên bí kíp đã chốt 25/07 | Không LLM tự do viết toạ độ |
| D3 | MapPoster = **engine chuyển động cho video plugin artifact platform** | Không phải sản phẩm đứng riêng ở v1 |
| D4 | Phạm vi spec: **cả hai repo** (MapPoster + video plugin/render-svc) | Spec này ở repo map; mũi khâu ngoài repo ở §10 |
| D5 | Hướng **A — lớp clip** với spike chặn rủi ro `<video>`-trong-hyperframes trước; NO-GO → rẽ B (png-sequence) đã thoả thuận | Spike §7 — **đã chạy 04/08: GO**, không rẽ B |

## 2. Kiến trúc tổng

```
┌─ MapPoster ───────────────────────────────────────────────┐
│  RenderMapParams + motion{preset|script}                  │
│    → resolveConfig (geocode, bbox, zoom — như /render)    │
│    → COMPILER: preset + resolved geometry → MotionScript  │
│    → render.html: applyMotionAt(t, phase) mỗi khung       │
│         (jumpTo · sliceLine · pulse phase=t)              │
│    → pool chụp i/fps → ffmpeg → clip.mp4 TEXT-FREE        │
│                        + settle.png (khung nghỉ, phase=0) │
│  REST POST /render-clip · MCP tool render_clip            │
└───────────────────────────────────────────────────────────┘
                 ↓ inline base64 (server-to-server)
┌─ Artifact platform ───────────────────────────────────────┐
│  media-map.ts: 1 render → 2 asset (clip.mp4 + settle.jpg) │
│  media ref: map1 (settle, NHƯ CŨ) + map1clip (kind:"clip")│
│  composition: <video muted> + chữ DOM đè sau restAtSec    │
│  lint mới: map-clip-short · SETTLE gate nguyên vẹn        │
└───────────────────────────────────────────────────────────┘
```

**Ba hợp đồng cốt lõi:**

1. **MotionScript là pure data** do compiler sinh từ hình học đã resolve — recipe/LLM không viết
   toạ độ tay.
2. **Clip nghỉ trước 72% thời lượng** (bất biến R, §3) — khung SETTLE của cổng chấm
   (`start + dur×0.72`) luôn thấy bản đồ tĩnh hoàn chỉnh; toàn bộ cổng no-fab/L9-L12 chạy
   nguyên vẹn không sửa.
3. **Clip text-free, với MỘT ngoại lệ tường minh: attribution giấy phép.** Mọi chữ do hệ sinh
   (tên dự án, khoảng cách, giá, fact) — và cả nhãn bản đồ OSM khi `layers.roadLabels` opt-in —
   ở lớp DOM để đi qua cổng no-fab. Đây là M4 mở rộng sang video, kiểm tra được (AC-9, §8).
   **Ngoại lệ duy nhất được phép**: dòng attribution licence
   (`© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre`, `drawAttribution` trong
   `src/lib/export.ts`) VẪN được nướng vào từng khung pixel, kể cả khi `chrome: 'clean'` ép mọi
   chữ khác tắt (`text.show: false`) — quyết định của chủ repo (2026-08-04): đây là nghĩa vụ giấy
   phép của dữ liệu OSM/OpenFreeMap, và nướng nó vào pixel nghĩa là việc tuân thủ không phụ thuộc
   vào bên tiêu thụ (artifact platform) có nhớ tự vẽ nó ở lớp DOM hay không. Ngoại lệ này bị khoá
   bằng test (`src/lib/export.test.ts`): với `chrome: 'clean'`, chữ DUY NHẤT được vẽ lên canvas là
   dòng attribution — bất kỳ lệnh `fillText`/`strokeText` nào khác (kể cả `drawPosterText` bị gỡ
   guard trong tương lai) đều làm test đỏ.

## 3. MotionScript

Một nguồn sự thật tại `src/render/motionScript.ts` (cạnh `renderConfig.ts`) — render-page
evaluate, mcp-server validate, cùng import.

```ts
type EaseId = 'linear' | 'easeInOut' | 'easeOut' | 'expoOut';

interface CameraKeyframe {
  t: number;                      // giây, tăng dần
  center: [number, number];
  zoom: number;
  bearing?: number;               // default 0; v1 KHÔNG pitch (poster nhìn thẳng)
  ease?: EaseId;                  // ease của ĐOẠN kết thúc tại keyframe này
}

type MotionTrack =
  | { kind: 'regionReveal'; t0: number; t1: number; regionIndex?: number; ease?: EaseId }
  | { kind: 'routeDraw';    t0: number; t1: number; routeIndex?: number }
  | { kind: 'pinDrop';      at: number; dur?: number; pointIndex?: number }
  | { kind: 'pulse';        from: number; periodSec?: number; rings?: number };

interface MotionScript {
  fps: number;                    // default 24, [12, 30]
  durationSec: number;            // [2, 12]
  restAtSec: number;
  camera: CameraKeyframe[];       // ≥ 1, t tăng dần
  tracks: MotionTrack[];
}
```

**Bất biến — zod `.refine`, không phải quy ước ngầm:**

| # | Luật | Vì sao |
|---|---|---|
| R | `restAtSec ≤ 0.72 × durationSec` | SETTLE gate chụp tại `start + dur×0.72` |
| O | Track one-shot (`t1` / `at+dur`) ≤ `restAtSec`; keyframe camera cuối `t ≤ restAtSec` | Định nghĩa "nghỉ" = camera đứng + one-shot xong |
| L | `pulse` là loop-track, được chạy sau `restAtSec` | Hai-đồng-hồ; vòng lặp êm không phá trạng thái nghỉ |
| B | `fps × durationSec ≤ 288` khung | Trần tài nguyên pool (nâng cap 60 của render_animation; env override) |
| I | Mọi index track trỏ vào `highlight.regions[i]` / `routes[i]` / `points[i]` tồn tại trong RenderConfig | Fail-fast lúc validate, không khung đen lúc render |

### `applyMotionAt(t, phase)` — mở rộng `window.__mapposter`

| Track | Kỹ thuật | Bám vào cái sẵn có |
|---|---|---|
| camera | Nội suy piecewise lerp/lerpAngle + ease theo đoạn → `map.jumpTo()` mỗi khung; KHÔNG `flyTo`/`easeTo` | `setCamera` đã dùng `jumpTo` |
| regionReveal | `sliceLine(ring, p)` → `setData`; fill mờ vào sau khi vòng khép | Highlight layers đã là GeoJSON source (`buildMapStyle`) |
| routeDraw | Cùng primitive slice trên `routes[i]` | Route line layer (GPX) sẵn có |
| pinDrop | Marker scale-in (expoOut) theo tiến độ, trong `composeOverlays` | Markers đã vẽ tầng composite 2D |
| pulse | Code pulse hiện tại; **phase = t** khi export; khung settle ép **phase = 0** | `composeOverlays({pulse:{t}})` sẵn có |

Node loop mở rộng `renderAnimationFrames`: mỗi khung `page.evaluate(renderMotionFrame(i/fps))`
→ PNG buffer → ffmpeg → `clip.mp4` + `settle.png`.

**Chi phí thật & giảm đau:** camera động vô hiệu snapshot `animBase` — re-render map mỗi khung,
chờ tile lần đầu mỗi vùng. (1) **Prefetch pass**: bay lướt path không chụp để nạp tile cache
trước; (2) page pool sống lâu, tile cache tích luỹ; (3) spike/integration **đo khung/giây thật**
→ con số đó chốt fps mặc định (24 hay 18). Prefetch lỗi ⇒ bỏ qua (tối ưu, không phải điều kiện
đúng đắn).

## 4. Compiler preset — MapPoster biên dịch, không phải bên gọi

Keyframe camera cần toạ độ thật (tâm thành phố, bbox quận, điểm dự án) — chỉ tồn tại **sau khi
MapPoster geocode**. Bên gọi chỉ có chuỗi `"Quận 3, TP.HCM"`. Nên compiler sống trong MapPoster,
và tên preset là **archetype chung**, không mang khái niệm BĐS:

| Preset | Chuyển động | Viên dùng (mapping phía artifact platform) |
|---|---|---|
| `approach` | rộng → fit bbox vùng → pin | `map.orient` |
| `pushIn` | trung → đẩy sát điểm + pulse | `map.around` |
| `drift` | khung khu vực, trôi chậm | `map.infra` |

Caller nâng cao (agent MCP) truyền thẳng `script: MotionScript`.

### Storyboard 3 preset (zoom minh hoạ theo quy ước resolveConfig; giá trị thật từ `resolved`)

**`approach`** · 6.0s, rest 4.2s (70%):

| t | Camera | Track |
|---|---|---|
| 0.0 | Toàn thành phố ~z10.8 | — |
| 1.8 | — | `regionReveal` ranh giới bắt đầu |
| 2.6 | Tới khung vùng (fit bbox), `easeInOut` | vẽ tiếp |
| 3.2 | — | vòng khép, fill mờ vào |
| 3.5 | — | `pinDrop` (0.5s) |
| 4.2→6.0 | **Nghỉ** — đuôi tĩnh hoàn toàn (poster-calm, không loop) | — |

**`pushIn`** · 5.5s, rest 3.9s (71%) · `roadLabels: true` suốt clip:

| t | Camera | Track |
|---|---|---|
| 0.0 | z13.2, tâm lệch nhẹ khỏi điểm | — |
| 0.9 | — | `pinDrop` |
| 2.4 | Đẩy vào z14.8 tâm điểm, `easeOut` | — |
| 2.6→hết | — | `pulse` (period 1.8s, 2 vòng) — loop qua rest |
| 3.9 | **Nghỉ**; settle chụp phase=0 (vòng cực tiểu) | pulse êm ở đuôi |

**`drift`** · 6.0s, rest 4.2s:

| t | Camera | Track |
|---|---|---|
| 0.0 | Khu vực z11.2 | (nếu có boundary: `regionReveal` 1.5→3.0) |
| 4.2 | Trôi một đoạn tới z11.9, `easeInOut` | — |
| 4.2→6.0 | **Nghỉ** | — |

Đúng M2 spec 25/07: v1 không vẽ tuyến cho infra (chưa có nguồn hình học tuyến). Chip POI/fact
là DOM — composition cho chúng vào **sau `restAtSec`** (hợp đồng trả mốc này, §6).

## 5. REST `POST /render-clip` + MCP `render_clip`

`/render` giữ nguyên từng byte. Endpoint mới additive, dùng chung `RenderMapParams`:

```jsonc
// Request:  { ...RenderMapParams, "motion": { "preset": "approach" } }
//           preset nhận override fps/durationSec — hoặc { "script": {...MotionScript} }
// Response 200:
{ "ok": true,
  "clip":   { "base64", "format": "mp4", "width", "height", "durationSec", "fps", "bytes" },
  "settle": { "base64", "format": "png", "width", "height" },
  "motion": { "preset": "approach", "restAtSec": 4.2 },
  "resolved": { /* đúng khối resolvedOf() /render đang trả */ } }
```

- **Transport v1 = inline base64** (hai deployment không chung đĩa; đường hermetic duy nhất
  không cần storage chung; đúng mẫu `/render`). Trần cứng `MAPPOSTER_CLIP_MAX_BYTES`
  (mặc định 12 MB) → 422 trước khi base64.
- Auth: bearer `MAPPOSTER_TOKEN` hiện hành. Lỗi: 401 / 405 / 413 (body) / **422** (MotionScript
  vi phạm bất biến — trả rõ luật nào vỡ).
- **`settle` luôn có mặt** kể cả khi encode clip lỗi: degrade `{ok:true, settle, clipError}` —
  bên gọi vẫn có ảnh, sự cố không chặn video.
- MCP tool `render_clip`: cùng ruột, giao qua `sinkDir` path (mẫu `render_animation`).

## 6. Mũi khâu artifact platform

- **`mapConfigHash` → v3**: thêm `motionPreset` vào canonical, bump `v:3` — cache v2 (ảnh tĩnh
  1-ghim) tự vô hiệu; ảnh và clip không lẫn; đổi preset ⇒ đổi asset.
- **1 render → 2 asset**: `media-gen/map/${hash}.mp4` + `media-gen/map/${hash}-settle.jpg`
  (JPEG q85 như W1). Cache 3 nhánh P1 giữ nguyên: *hit-khoẻ* đòi `bytesExist` **cả hai** key;
  thiếu một ⇒ *tự-chữa* render lại ghi đè cùng key (id không đổi); *retired* ⇒ null không cãi
  người. `isFlatImage` chạy trên settle — settle phẳng ⇒ **loại cả cặp** (cùng page render,
  cùng chết).
- **Media ref**: `map1` **giữ nguyên là ảnh settle** (consumer cũ không đổi một dòng). Thêm
  sibling khi có clip:

  ```ts
  { key: "map1clip", kind: "clip",             // enum "clip" ĐÃ có trong zMediaRef
    url: `/api/media/${clipId}`, assetId: clipId,
    motion: { durationSec, restAtSec, fps },   // FIELD MỚI → PHẢI khai vào zMediaRef NGAY
    recipe, label }
  ```

  ⚠️ Bẫy zod-strip đã sập **5 lần** trong lịch sử schema này (label, assetId, flags, caption,
  đèn degrade). `motion` là ứng viên lần 6 — AC-7 (§8) chốt chặn bằng round-trip test.
- **Degrade ladder** — mọi nấc có tiền lệ:

  | Sự cố | Hành vi |
  |---|---|
  | `/render-clip` 404 (MapPoster cũ) | Gọi `/render` như hôm nay — zero regression |
  | Clip lỗi encode, settle OK | `map1` settle, không có `map1clip` |
  | Settle phẳng / oversize | Loại cả cặp → viên trả `null` (luật W1) |
  | Cache-hit | 0 external call; `resolved` vắng mặt, không bịa |

### Composition + cổng chấm — hợp đồng đồng bộ

Cảnh bản đồ: `<video src muted playsinline>` phát từ đầu cảnh + chữ DOM đè (hình dạng
TalkingHead đã chạy — nhưng ở engine hyperframes ⇒ spike §7). Hai luật máy-kiểm-được:

1. **`scene.dur ≥ clip.durationSec`** — lint mới **`map-clip-short`** (defect → vòng tự sửa),
   vào gia đình `map-overuse`/`map-mute`/`map-uncited`. Chứng minh:
   `scene.dur ≥ clip.durationSec` ⇒ `0.72·scene.dur ≥ 0.72·clip.durationSec ≥ restAtSec`
   ⇒ SETTLE luôn thấy bản đồ đã nghỉ.
2. **Chip/fact DOM vào sau `restAtSec`** — hướng dẫn composer + rubric (advisory, HITL quyết),
   không phải luật cứng.

## 7. Spike GO/NO-GO — chạy TRƯỚC, độc lập

Câu hỏi duy nhất: **hyperframes producer render `<video>` seek đúng từng khung không?**
Không cần code mới — `render_animation` hiện tại đã xuất MP4 làm mẫu thử.

Project-dir tối giản (`index.html` + `<video muted>` + đồng hồ khung DOM) →
`renderHF(dir, out, {format:'png-sequence', fps:24, deterministic:true})` → so khung:

| Tiêu chí | GO | NO-GO |
|---|---|---|
| Video hiện trong khung xuất | có | đen/trắng |
| Seek đúng | lệch ≤ 1 khung, đơn điệu | lệch >1 hoặc lặp khung |
| Tất định | 2 lần render byte-identical | khác nhau |

NO-GO → **rẽ B**: thêm `delivery:'frames'` (dãy PNG, cùng MotionScript/REST/cache/zMediaRef —
không đổi trường nào) + component swap `<img>` theo `currentTime` phía composition. Spike chỉ
định đoạt tầng giao hàng, không định đoạt kiến trúc. Chi phí: nửa ngày, repo onehub-render-service.

### Kết quả — chạy 2026-08-04: **GO**

`onehub-render-service/spike/video-in-hyperframes/` (commit `6ab86e4`). Video nguồn 24 khung,
khung `i` tô màu `#{i*10}0040` — đọc pixel là suy ngược ra chỉ số khung nguồn, không OCR.

| Tiêu chí | Ngưỡng | Đo được |
|---|---|---|
| Video hiện | có | **24/24** |
| Seek đúng | lệch ≤ 1 khung, đơn điệu | **lệch 0**, 0 giật lùi, 0 lặp — `0→0 1→1 … 23→23` |
| Tất định | byte-identical | **giống nhau từng byte** |

**Phát hiện đổi cách viết Gói 2:** producer KHÔNG dựa vào `<video>` phát trong trình duyệt —
nó có pha `video_extract`, tự trích mọi khung từ file rồi composite theo thời-gian-nội-dung.
Bài toán seek frame-accurate đã được giải ở tầng dưới. Nên composition **chỉ cần đặt thẻ
`<video src>`**: không script ghim `currentTime`, không `autoplay`, không phải lo wall-clock.
Đoạn script ghim thời gian mà spike ban đầu viết ra hoá ra thừa.

**Rẽ B chính thức đóng.** `delivery:'frames'` không cần làm.

## 8. Kiểm thử & tiêu chí chấp nhận

**MapPoster:**

| AC | Nội dung | Tầng |
|---|---|---|
| AC-1 | 5 bất biến R/O/L/B/I: mỗi luật ≥1 test vi phạm + 1 test biên (`restAtSec = 0.72×dur` pass) | unit zod |
| AC-2 | Compiler không bao giờ sinh script mà validator của chính nó từ chối (3 preset × bbox đo thật) | unit thuần |
| AC-3 | Nội suy: `lerpAngle` 359°→1° không quay ngược; slice p∈{0,0.5,1}; ease theo đoạn | unit thuần |
| AC-4 | `encodeClipArgs` pure — không spawn (mẫu `encodeAnimation.test.ts`) | unit thuần |
| AC-5 | Integration (`MCP_INTEGRATION=1`): clip 2s@12fps → MP4 header đúng + settle không phẳng + **render 2 lần cùng config → cùng dãy bytes khung** | browser thật |
| AC-6 | REST: 200 đủ khối / 422 kèm tên luật vỡ / 401 / degrade `{settle, clipError}` khi encoder bị tiêm lỗi | http.test |
| AC-9 | Clip text-free: config compiler sinh ra không bao giờ bật lớp chữ ngoài `roadLabels`; test khẳng định style không chứa symbol layer nào khác | unit thuần |

**Artifact platform:**

| AC | Nội dung |
|---|---|
| AC-7 | Round-trip zod: persist `map1clip` rồi đọc lại — `motion`/`assetId`/`kind` sống sót (chốt bẫy strip lần 6) |
| AC-8 | Cache 3 nhánh với CẶP asset: mất 1 trong 2 bytes → tự-chữa cả cặp; retired → null |
| AC-10 | Lint `map-clip-short`: scene ngắn hơn clip → defect |
| AC-11 | Smoke hermetic nhánh clip media-map (DI fetch giả, không gọi service thật) |

## 9. Xử lý lỗi phía render

| Sự cố | Hành vi | Trạng thái |
|---|---|---|
| Tile stall giữa clip | `IDLE_TIMEOUT_MS` 20s/khung hiện hành; quá hạn → lỗi rõ, pool nhả page | dùng lại |
| Page chết giữa dãy | Lỗi nổi lên, pool tái tạo page, request fail sạch — **không retry nửa clip** (ghép dãy từ 2 lần chạy = mở cửa phi-tất-định) | luật mới |
| ffmpeg vắng | Thông điệp trỏ `MAPPOSTER_FFMPEG` | có nguyên văn |
| Clip oversize | 422 trước khi base64 (trần 12MB) | mới, một `if` |
| Prefetch lỗi | Bỏ qua — khung chậm hơn, không sai | mới |

## 10. Thứ tự triển khai — 3 gói tự đứng

```
Gói 0 · SPIKE (onehub-render-service) — nửa ngày, song song Gói 1
Gói 1 · MapPoster (repo này): motionScript + compiler + applyMotionAt
        + renderClipFrames + encode + REST/MCP + AC-1..6, AC-9
        ⇒ deploy được NGAY: /render nguyên vẹn; render_clip cho agent MCP từ ngày đầu
Gói 2 · Artifact platform — CHỜ GÓI 0:
        GO  → media-map nhánh clip + contracts + zMediaRef + lint + composer (AC-7,8,10,11)
        NO-GO → delivery:'frames' vào Gói 1 (nhỏ) + component swap ảnh
        ⇒ Gate 2 ký trên video thật — trả lời câu hỏi gốc "frame này có nghĩa gì?"
```

Điểm nghẽn duy nhất: spike → Gói 2. Gói 1 không chờ ai.

## 11. Ngoài phạm vi v1

- Pitch/3D, xoay bearing trình diễn — poster nhìn thẳng; 3D-satellite là đất của MapEffect.
- `routeDraw` do recipe phát — schema + evaluator có (primitive chung, chi phí ~0) nhưng không
  preset nào phát; phục vụ agent MCP có GPX, mở đường `map.route` v2 khi có routing engine.
- Object chuyển động, nền động, chữ hiệu ứng, audio — nửa trình bày, thuộc composition/render-svc.
- Geocode từng POI để neo chip theo toạ độ — v2 (giữ nguyên giới hạn spec 25/07).
- Editor/timeline UI — không có trong định vị API-first.

## 12. Mũi khâu ngoài repo (để spec/plan bên đó tham chiếu)

| Repo | Việc | Tham chiếu |
|---|---|---|
| `onehub-render-service` | Gói 0 spike `<video>`-trong-hyperframes | §7 |
| `ap-media-roadmap` | Gói 2: media-map nhánh clip, `mapConfigHash` v3, zMediaRef `motion`, lint `map-clip-short`, composer guidance | §6, AC-7/8/10/11 |
