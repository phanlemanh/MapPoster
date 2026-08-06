---
schema_version: 1
feature: compile_motion + camera.focus + list_fonts + encoder quality + cost metadata
slug: motion-tools-cost
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by: manh
approved_at: 2026-08-07T00:20:00Z
time_human_minutes: {gate1: 4, gate2: 0}
---

# Acceptance Contract: motion-tools-cost

## Context

Năm núm nhỏ, cùng một chủ đề: **cho agent biết trước và đo được** thay vì phải trả tiền
mới biết.

Hôm nay vòng lặp preset→xem→chỉnh buộc agent render một clip đầy đủ (hàng phút) chỉ để
biết preset sinh ra gì; muốn khung ôm region thứ hai thì phải tự lấy bbox rồi tự tính
center/zoom; không có cách nào biết có những phông nào; bị từ chối quá cỡ là ngõ cụt vì
núm duy nhất còn lại là hạ fps/kích thước — hai thứ đổi luôn *nội dung* clip; và không lời
gọi nào nói nó tốn bao nhiêu.

Khách hàng là **AI agent gọi MCP/REST**. Hai nguyên tắc chi phối tiêu chí dưới đây:
(1) agent **không nhìn thấy ảnh**, nên input mâu thuẫn phải bị **từ chối**, không được im
lặng chọn một bên; (2) tên trường số đo phải **mang đơn vị** — một trường `time` hay `size`
là con số phía tiêu thụ đoán sai đơn vị rồi hiển thị sai.

Source input: prompt (phiên 2026-08-07) · spec `docs/superpowers/specs/2026-08-06-mapeffect-clone-recipes-design.md` §5 PR #3 · plan `docs/superpowers/plans/2026-08-07-pr3-motion-tools-cost.md`

## Criteria

- AC-1: Given `compile_motion` với `motion.preset`, When tool trả về, Then response mang `script` (MotionScript đã validate), `fps`, `durationSec`, `restAtSec`, `frames`, `preset` và `resolved`.
- AC-2: Given `compile_motion` được gọi, When tool chạy, Then **không** khung nào được render và **không** clip slot nào bị lấy — deps không có `renderClip`/`encodeAnimation` vẫn phải chạy trót lọt.
- AC-3: Given `compile_motion` với `motion.script` thô thay vì preset, When tool trả về, Then script được validate và `preset` **vắng mặt**.
- AC-4: Given `compile_motion` với preset không thể compile (`approach` mà không có region) hoặc thiếu hẳn `motion`, When tool chạy, Then trả lỗi nêu đúng nguyên nhân — **không** trả script rỗng.
- AC-5: Given `compile_motion` được gọi với `chrome: 'poster'`, When tool trả về, Then `resolved.chrome` là `'clean'` — bản xem trước không được nói khác thứ `render_clip` thật sự render.
- AC-6: Given `camera.focus` trỏ vào một region/point/route theo chỉ số, When `resolveConfig` chạy, Then khung ôm **đúng đối tượng đó**, không phải hợp nhất của mọi đối tượng.
- AC-7: Given `camera.focus.paddingPct` tăng, When `resolveConfig` chạy, Then `camera.zoom` **giảm** — núm phải có tác dụng đo được, không được là no-op.
- AC-8: Given `camera.focus` đi kèm `camera.center` hoặc `camera.zoom`, When `resolveConfig` chạy, Then bị **từ chối** — không được im lặng chọn bên thắng.
- AC-9: Given `camera.focus.index` không có đối tượng tương ứng, When `resolveConfig` chạy, Then bị **từ chối** kèm số lượng thực có.
- AC-10: Given agent gọi `list_fonts`, When tool trả về, Then mỗi mục mang `key`/`stack`/`titleWeight`/`titleTracking`/`uppercaseTitle`, và **mọi** `key` liệt kê đều được `render_map.font` chấp nhận — một phông liệt-kê-rồi-từ-chối là cái bẫy.
- AC-11: Given `output.quality` không được khai, When encode chạy, Then tham số ffmpeg **giống hệt** trước khi có núm này (crf 20) — thêm tuỳ chọn không được đổi output đang chạy.
- AC-12: Given `output.quality` là `draft`/`standard`/`high`, When encode mp4 chạy, Then crf lần lượt `28`/`20`/`16` kèm preset `veryfast`/`medium`/`slow`.
- AC-13: Given `output.quality` bất kỳ, When encode **GIF** chạy, Then tham số không đổi và **không** có `-crf` — nhánh palette không hiểu crf.
- AC-14: Given một clip render xong, When response trả về, Then mang `cost` với `frames` (số khung renderer **thật sự** trả về), `renderMs`, `encodeMs`, `bytes`.
- AC-15: Given encode hỏng (nhánh degrade), When response trả về, Then `cost` **vẫn có** với `renderMs` > 0 và `bytes` = 0 — khung đã render nên tiền đã tiêu, và đây là chỗ caller cần số nhất.
- AC-16: Given toàn bộ diff, When đối chiếu merge-base, Then `src/lib/export.ts` và `src/lib/mapStyle.ts` **không đổi dòng nào**; `compile_motion` **không** tham chiếu `acquireClipSlot`/`deps.renderClip`/`encodeAnimation`; `quality` được nối ở **cả ba** bề mặt encode; và không tồn tại tên chi phí trần (`time`/`size`/`duration`/`elapsed`).

## Coverage

- **Trục Núm mới**: tool mới (`compile_motion`, `list_fonts`) | tham số mới (`camera.focus`, `output.quality`) | trường trả về mới (`cost`) — [thước CE: spec §5 PR #3 liệt kê đúng năm mục, đối chiếu 1-1 với AC-1..AC-15]
- **Trục Chiều kiểm**: nhận đúng (AC-1,3,6,10,12,14) | từ chối sai (AC-4,8,9) | **không** kích hoạt (AC-2 không render/không lấy slot; AC-11 mặc định không đổi tham số; AC-13 GIF không có `-crf`) — [thước CE: quy tắc (b) — mỗi tiêu chí ngưỡng có nửa suppression]
- **Trục Bề mặt encode**: MCP tools.ts | REST http.ts | async jobRunner.ts — [thước CE: AC-16 buộc cả ba; negative control đã chứng minh unit test của jobRunner KHÔNG bắt được khi thiếu]
- **Trục Nhánh trả về clip**: thành công | degrade encode-lỗi — [thước CE: AC-14 và AC-15 phủ cả hai; degrade là nhánh dễ quên nhất]
- **Trục Bất biến**: t3_path (AC-16) | compile_motion phải rẻ (AC-2 + AC-16) | tên chi phí mang đơn vị (AC-16) | mặc định không đổi hành vi (AC-11)

Chưa quét: `camera.focus` khi đối tượng vượt antimeridian — thừa hưởng đúng hạn chế của
`bboxOfGeojsons` đã ghi ở PR #2, không phát sinh mới.

## Out of scope

- **Không** thêm progress notification / cancel — đó là PR #4, và spec đã ghi cần đánh giá lại vì async job queue đã có upstream.
- **Không** đụng `src/lib/mapStyle.ts` lẫn `src/lib/export.ts`. Gói này thuần tầng `mcp-server/`.
- **Không** thêm `quality` cho GIF. Nhánh GIF dùng palette, crf vô nghĩa ở đó; giả vờ nhận rồi bỏ qua chính là "nhận-rồi-vứt" mà repo này từ chối.
- **Không** đo chi phí mạng (geocode) trong `cost`. Chỉ đo render và encode — hai thứ chiếm gần hết thời gian và là thứ caller đổi được bằng tham số.
- **Không** cho `compile_motion` trả ảnh xem trước. Nó rẻ vì không render; thêm ảnh là phá chính lý do tồn tại.
- **Không** thêm `camera.focus` cho nhiều đối tượng cùng lúc (focus vào region 0 **và** point 2). Chưa có caller yêu cầu; auto-frame hợp nhất đã phủ ca đó.

## Notes

- **Risk tier T2**: diff không chạm hai mục trong `risk_tiers.t3_paths`. Script `motion_tools_invariants` kiểm I1 mỗi lần chạy.
- **Không có eval design-quality**: `surfaces: [api]`.
- **`compile_motion` tái dùng `prepareClipRenderWithSlot` với callback release rỗng** thay vì chép nhánh parse→resolve→validate. Chép chính là cách hai bề mặt trôi khỏi nhau — đúng lý do `resolveMotion` từng được trích ra ở gói `map-motion-clip`.
- **`ToolDeps.encodeAnimation` nay dùng thẳng `EncodeOpts`** thay vì chép hình dạng. Bản chép lặng lẽ nuốt mọi field mới của encoder, đúng cách `quality` suýt không tới nơi.
- Năm hợp đồng đã ký đều stale evidence do gói này chạm code — thuế cố định mỗi PR.
- **Nhánh xếp chồng trên `feat/routes-measurements`** (PR #2 chưa merge). Khi #2 merge phải đổi base về `main` rồi chạy lại verify.
