---
schema_version: 1
feature: Map motion clip — MapPoster sinh clip bản đồ chuyển động (Gói 1)
slug: map-motion-clip
owner: phanlemanh@gmail.com
risk_tier: T3
surfaces: [api, sdk]
status: verified
approved_by: manh
approved_at: 2026-08-04
time_human_minutes: {gate1: 15, gate2: 5}
---

# Acceptance Contract: map-motion-clip

## Context

MapPoster từ engine poster tĩnh (PNG/PDF) thành engine sinh **clip bản đồ chuyển động**
(MP4 không chữ + một ảnh "settle" ở trạng thái nghỉ), phục vụ video plugin của artifact
platform — nơi cảnh bản đồ tĩnh đã bị Gate 2 ngày 25/07 bác vì *"hiển thị được bản đồ,
nhưng frame này có nghĩa gì?"*. Chuỗi mới: `MotionScript` (dữ liệu thuần + 5 bất biến zod)
→ compiler 3 preset → `renderMotionFrame(t)` trên trang render headless → `renderClipFrames`
→ `POST /render-clip` + MCP tool `render_clip`.

T3 vì gói này sửa `src/lib/export.ts` — file giữ bất biến "clip không chữ", nền tảng để
cổng chống-bịa (no-fab) phía tiêu thụ còn hiệu lực.

Source input: `docs/superpowers/specs/2026-08-03-map-motion-clip-design.md` (§8 bảng AC),
`docs/superpowers/plans/2026-08-03-map-motion-clip-goi-1.md`, PR #7.

## Criteria

- **AC-1**: Given một MotionScript vi phạm một trong năm bất biến R/O/L/B/I, When
  `validateMotionScript` chạy, Then nó ném lỗi có tiền tố đúng tên luật vỡ (`R:`/`O:`/`L:`/`B:`/`I:`).
- **AC-2**: Given một MotionScript nằm ĐÚNG trên biên hợp lệ (`restAtSec = 0.72 × durationSec`;
  `fps × durationSec = 288`), When validate, Then nó được CHẤP NHẬN — biên không được bị
  từ chối oan. *(should-NOT-fire)*
- **AC-3**: Given track `pulse` bắt đầu sau `restAtSec`, When validate, Then nó được chấp nhận
  (pulse là loop-track), còn hai track one-shot cùng loại thì bị TỪ CHỐI. *(should-NOT-fire + negative)*
- **AC-4**: Given bất kỳ `camera.zoom` hợp lệ nào trong [0,22] và bất kỳ kinh độ nào trong
  [-180,180], When `compileMotion` chạy cho cả ba preset, Then kết quả hoặc là script mà
  validator của chính nó chấp nhận, hoặc là lỗi vật liệu có thông điệp rõ — không bao giờ
  là script bị chính validator từ chối, và không bao giờ là clip có keyframe đầu/cuối trùng nhau.
- **AC-5**: Given hai góc 359° và 1°, When `lerpAngle` nội suy giữa chúng, Then nó đi cung
  ngắn qua 0° chứ không quay ngược 358°; và `sliceRing(ring, p)` trả null tại p≤0, nguyên
  vòng tại p≥1.
- **AC-6**: Given cùng một RenderConfig có `motion`, When `renderClipFrames` chạy HAI lần,
  Then hai lần cho dãy khung **giống nhau từng byte** — và số khung đúng bằng `round(fps × durationSec)`.
- **AC-7**: Given một request `/render-clip` hợp lệ, When gọi, Then trả `200` với đủ khối
  `clip` (mp4) + `settle` (png) + `motion.restAtSec` + `resolved`.
- **AC-8**: Given caller gửi `chrome: "poster"`, When `/render-clip` hoặc `render_clip` xử lý,
  Then config thực sự đưa xuống renderer vẫn là `chrome: "clean"` — caller không được phép
  bật chữ lên clip. *(should-NOT-honor)*
- **AC-9**: Given `chrome: "clean"`, When khung được compose, Then chữ DUY NHẤT được vẽ lên
  canvas là dòng attribution giấy phép; mọi `fillText`/`strokeText` khác làm test đỏ. Và
  `buildMapStyle` không phát symbol layer nào ngoài `road-label-major` (chỉ khi `roadLabels` bật).
- **AC-10**: Given một MotionScript vỡ bất biến, hoặc preset lạ, hoặc thiếu khối `motion`,
  When gọi `/render-clip`, Then trả `422` với thông điệp nguyên văn nêu luật vỡ — không phải
  `200 {ok:false}`, và không phải một ZodError thô.
- **AC-11**: Given encoder ffmpeg vắng mặt hoặc hỏng giữa chừng, When gọi `/render-clip` hoặc
  `render_clip`, Then server KHÔNG sập, ảnh `settle` đã render vẫn được trả về kèm `clipError`,
  và không còn file mp4 tạm nào sót lại. *(should-NOT-crash)*
- **AC-12**: Given số clip đang chạy đã chạm hạn mức, When có request clip tiếp theo, Then
  REST trả `429` (MCP trả error result cùng thông điệp) thay vì xếp hàng vô hạn làm treo
  các request `/render` thường phía sau.
- **AC-13**: Given clip preset `approach` cho một quận Việt Nam, When xem clip, Then nó đọc
  ra được ba nhịp có nghĩa — mở rộng toàn cảnh → vẽ dần ranh giới quận → đứng yên ở đuôi —
  chứ không phải một đoạn trôi vô hướng. *(judgment)*
- **AC-14**: Given bất biến "clip không chữ" nay có một ngoại lệ (attribution), When người
  ký đọc spec §2.3 và test khoá, Then ngoại lệ đó là tường minh, có lý do giấy phép, và
  không mở đường cho bất kỳ chữ nào khác lọt vào pixel. *(judgment)*

## Coverage

Quét theo trục (morphological), thước CE là chính bộ test đã chạy:

- **Bề mặt**: REST `/render-clip` | MCP `render_clip` — [CE: `http.test.ts`, `tools.test.ts`;
  cả hai đi qua cùng helper `prepareClipRender`]
- **Đường vào motion**: `{preset}` | `{script}` thô — [CE: `motionCompiler.test.ts` (preset),
  `motionScript.test.ts` (script)]
- **Kết quả**: thành công 200 | từ chối 422/400/429 | degrade 200+clipError — [CE: `http.test.ts`]
- **Bất biến**: R · O · L · B · I, mỗi luật có ca vi phạm + ca biên — [CE: `motionScript.test.ts`]
- **Miền tham số**: zoom 0→22 bước 0.1 × 3 preset × 4 kinh độ (gồm ±179.5) = **2652 tổ hợp**,
  0 script tự-bị-từ-chối và 0 clip đứng im — [CE: `scripts/compiler-domain-sweep.ts`, eval E4]
- **Tài nguyên khi hỏng**: file mp4 tạm · page pool · hạn mức đồng thời — [CE: `http.test.ts`
  có test revert-verified bắt được rò rỉ file]

Trục **chưa** phủ bằng máy: chất lượng thị giác của clip (AC-13) và tính chính đáng của
ngoại lệ attribution (AC-14) — cả hai là judgment, T3 nên bắt buộc người ký cho verdict trực tiếp.

## Out of scope

- **Toàn bộ phía artifact platform (Gói 2)**: `mapConfigHash` v3, media ref `map1clip`,
  lint `map-clip-short`, cache cặp asset. AC-7/8/10/11 trong spec §8 thuộc repo `ap-media-roadmap`,
  không phải gói này.
- **Async job queue (202 + poll)**: `/render-clip` ở gói này là ĐỒNG BỘ, đo được ~2 phút/clip ở
  1080×1920. Cố ý hoãn; điều kiện để mở endpoint ra ngoài caller nội bộ.
- **`routeDraw` do preset phát**: schema + evaluator có, nhưng không preset nào phát ở v1;
  mọi `routeDraw` bị bất biến I chặn vì `RenderConfig` chưa mang routes.
- **Pitch/3D, xoay bearing trình diễn, ảnh vệ tinh**: poster nhìn thẳng; đây là đất diễn của
  MapEffect, không phải trận địa đã chọn.
- **Âm thanh, chữ hiệu ứng, object chuyển động**: nửa trình bày, thuộc composition/Remotion
  phía render-svc.
- **Spike `<video>`-trong-hyperframes (Gói 0)**: chạy ở repo `onehub-render-service`, không
  chặn gói này.

## Notes

**Trung thực về thứ tự.** Contract này được viết SAU khi code xong — đúng vào cái anti-pattern
mà kit cảnh báo ("tiêu chí uốn theo thứ đã xây"). Thứ giảm nhẹ nó: bảng AC-1..AC-11 đã tồn tại
trong `docs/superpowers/specs/2026-08-03-map-motion-clip-design.md` §8 **trước khi** dòng code
đầu tiên được viết, và contract này dẫn xuất từ đúng bảng đó chứ không phải từ code. AC-11→14
là phần thêm sau, phát sinh từ ba quyết định của chủ repo ngày 04/08 và từ final review — chúng
mô tả hành vi đã được chốt bằng quyết định, không phải hành vi được phát hiện bằng cách đọc code.

**Ràng buộc môi trường.** `executors.design` trong `config.yaml` trỏ vào
`/Users/manhphan/...` (user khác) và kit 1.11.2, trong khi máy này là `/Users/manh-macmini/`
với kit 1.31.0 — đường dẫn KHÔNG tồn tại. Gói này không có surface web-UI nên không cần design
eval, nhưng đây là bug config sẽ chặn bất kỳ feature UI nào sau này.

**Chi phí đã đo.** 1108 ms/khung @1080×1920 trên M4 Max; 37s cho 24 khung @360×640 trong
container 2GB/1CPU. `FPS_DEFAULT` hạ 24→18 theo số đo. Render `standard` cũng 1 CPU nên các
con số này là cận dưới lạc quan.
