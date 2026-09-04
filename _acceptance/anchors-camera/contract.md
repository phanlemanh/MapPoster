---
schema_version: 1
feature: resolved.anchors + resolved.camera — toạ độ màn hình cho tầng DOM
slug: anchors-camera
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: signed-off
approved_by: manh
approved_at: 2026-08-07T11:20:00Z
time_human_minutes: {gate1: 5, gate2: 0}
---

# Acceptance Contract: anchors-camera

## Context

Tầng DOM của OneHub sở hữu chữ (AC-9: pixel video text-free). Để đặt được chữ,
giá, đường kẻ nối **đúng chỗ**, nó phải biết mỗi điểm/vùng nằm ở đâu **trên
khung hình** — mà không được đọc pixel. Gói này trả `resolved.camera` (trạng
thái camera nghỉ) và `resolved.anchors` (vị trí điểm/vùng theo phần trăm).

Khách hàng là **AI agent gọi MCP/REST**. Nó **không nhìn thấy ảnh**, nên một
toạ độ sai không thể phát hiện được từ phía nó. Đó là nguyên tắc chi phối toàn
bộ tiêu chí dưới đây: thà **nổ to** còn hơn trả một con số trông hợp lệ.

Hai bẫy đã kiểm chứng trực tiếp trên mã, ghi ở
`docs/superpowers/plans/2026-08-07-pr6-anchors-camera.md` §2 và §3.

Source input: prompt (phiên 2026-08-07) · spec `docs/superpowers/specs/2026-08-06-mapeffect-clone-recipes-design.md` §5.2 · plan `docs/superpowers/plans/2026-08-07-pr6-anchors-camera.md`

## Criteria

- AC-1: Given một điểm chiếu ra `(x, y)` trong khung CSS `cssW × cssH`, When `pctOf` chạy, Then `xPct` chia cho `cssW` còn `yPct` chia cho `cssH` — **hai mẫu số khác nhau**; một hệ số tỉ lệ chung phải làm test đỏ trên khung **không vuông** (khung vuông không phân biệt được hai công thức).
- AC-2: Given một điểm nằm ngoài khung, When `pctOf` chạy, Then `onScreen` là `false` nhưng `xPct`/`yPct` **vẫn được trả** (có thể âm hoặc > 100) — tầng DOM tự quyết vẽ mũi tên chỉ hướng hay bỏ qua; nuốt điểm là xoá thông tin nó cần.
- AC-3: Given một vùng có nhiều toạ độ, When `regionAnchorOf` chạy, Then `bboxPct` bao đúng cực trị và `bboxCenterPct` nằm trong bbox đó; vùng không có toạ độ nào trả `null` chứ không phải bbox rỗng ở gốc toạ độ.
- AC-4: Given `anchors()` được gọi khi camera **không** ở `restAtSec`, When nó chạy, Then nó **ném** kèm thông điệp nêu cả giá trị đọc được lẫn giá trị kỳ vọng — **không** trả toạ độ tính từ camera bất ngờ.
- AC-5: Given `anchors()` được gọi, When nó chạy xong, Then nó **không** dời camera và **không** đụng `restBase`/`animBase`/`lastApplied*`; và khung đuôi clip render sau đó vẫn **byte-identical** với khi không gọi.
- AC-6: Given `camera.pitch != 0`, When clip render, Then clip **vẫn ra đủ khung + settle** (pitch nghiêng là năng lực MapLibre đang chạy được — gỡ nó là hồi quy), nhưng `resolved` mang `anchorsUnavailable` **nêu đích danh pitch và giá trị của nó**, và `anchors()` của trang vẫn tự từ chối.
- AC-7: Given bất kỳ lối ra nào của cả ba bề mặt (MCP `render_clip`, REST `POST /render-clip`, async `POST /jobs`) — kể cả nhánh xuống cấp encode-lỗi và nhánh từ chối quá cỡ, When `resolved` trả về, Then nó mang **đúng một** trong `anchors` / `anchorsUnavailable`: **không bao giờ cả hai, không bao giờ không có gì**.
- AC-8: Given `resolved` mang `anchors`, When kiểm, Then `camera` đi **cùng** nó và vắng **cùng** nó — `camera` là số đo của chính lần đọc đó, không phải echo lại `cfg.camera`.
- AC-9: Given `anchors.points[i]`, When đối chiếu, Then `index` khớp một-một với `resolved.highlights.points[i]` (lấy từ `cfg.markers`, không phải từ store).
- AC-10: Given mã nguồn, When quét, Then **không** tồn tại `anchorsAt` hay bất kỳ đường nào chiếu ở `t` tuỳ ý; và `t3_paths` (`src/lib/export.ts`, `src/lib/mapStyle.ts`) có **0 dòng** thay đổi.

## Coverage

- **Trục Công thức**: hai mẫu số (AC-1) | điểm ngoài khung (AC-2) | vùng/bbox (AC-3) — [thước CE: ca test phải dùng khung **không vuông**, nếu không cả hai công thức đều xanh]
- **Trục Chốt an toàn**: camera sai chỗ (AC-4) | pitch (AC-6) | chỉ-đọc (AC-5) — [thước CE: mỗi chốt phải quan sát được đỏ bằng negative control thật]
- **Trục Bề mặt**: MCP | REST | async job (AC-7) — [thước CE: I3 **gọi thật** `resolvedOfClip` với cả hai nhánh outcome, không đọc regex; regex không nói được "cả hai" hay "không gì cả"]
- **Trục Bất biến phải giữ**: byte-identical khung đuôi (AC-5) | t3_path 0 dòng (AC-10) | không mở đường `anchorsAt` (AC-10)
- **Trục Không mất năng lực**: clip nghiêng vẫn ra clip (AC-6) — [thước CE: nửa suppression bắt buộc; test phải khẳng định **khung có PNG thật và khác nhau**, không chỉ "không ném"]

Chưa quét: anchors cho `routes` (polyline cần chính sách lấy mẫu riêng, chưa có ca dùng) — ghi ở Out of scope.

## Out of scope

- **Không** sửa hệ số một-trục của `drawMarker` (`src/lib/export.ts:188,204,211`) — nó dùng tỉ lệ trục x cho toạ độ y. Hệ quả còn lại: marker **được vẽ** lệch khỏi anchors **được trả về** ~0,1% chiều cao (~2px ở khung 1920). `export.ts` là `t3_path`, sửa kéo theo vòng T3 **và** làm đổi pixel, tức phá bằng chứng determinism byte-identical của `map-motion-clip`. Xếp lịch riêng.
- **Không** thêm `anchorsAt(t)` — xem plan §3: `jumpTo` để chiếu sẽ để camera lệch khỏi `restBase` đã cache, khiến khung đuôi vẽ marker bằng camera sai lên ảnh nền đúng.
- **Không** anchors cho `routes`.
- **Không** phủ tương ứng `index` ở `n > 1`: E17 hiện chỉ thử một điểm. Vòng chấm nêu đúng chỗ này. Sai thứ tự chỉ lộ ra từ hai điểm trở lên, nên đây là khoảng trống thật — ghi ra chứ không giấu sau một dòng `expected` nghe như đã phủ.
- **Không** hỗ trợ đo anchors khi pitch != 0 — hình chiếu vùng là hình thang, `bboxPct` mất nghĩa.

## Notes

- **Risk tier T2**: `t3_paths` 0 dòng, đã verify bằng `git diff --stat`.
- **Không có eval design-quality**: `surfaces: [api]`, không bề mặt web UI. Bỏ theo §2b của skill.
- **`ClipAnchorsOutcome` là union phân biệt, không phải hai trường optional.** Hai optional cho phép trạng thái "vắng cả hai" — đúng lớp lỗi `jobRunner` đã dính **hai lần** mà 22/22 test hành vi vẫn xanh. Union biến việc quên thành lỗi **biên dịch**.
- **`resolvedOfClip` nhận outcome NGUYÊN**, không bóc `anchors` ra biến rời: tháo rời union là mở lại đúng khe cho lớp lỗi "dùng sai biến".
- **Sửa hướng so với kế hoạch gốc**: kế hoạch §4 nói "pitch != 0 → từ chối" mà không nói từ chối *cái gì*. Hiện thực đầu tiên làm hỏng cả clip — đó là **gỡ một năng lực đang chạy được** (`applyRenderConfig.ts:53` áp pitch, `cameraAt` không phát pitch nên `jumpTo` không reset nó). Cùng lỗi với việc bound `bearing` đã bị bác ở PR #1. Đã sửa: clip vẫn ra, chỉ anchors vắng kèm lý do.
- **`id?` bị bỏ khỏi anchor point**: `RenderMarker` không có `id`, khai một trường luôn vắng mặt là nói dối về hình dạng dữ liệu.
- Mọi hợp đồng đã ký đều stale do gói này chạm `tools.ts`/`http.ts` — phải chạy lại verify cho tất cả trước khi merge (thuế cố định, `stale_files()` diff toàn repo).
- **Merge bằng merge commit, KHÔNG squash** — xem `no-squash-merge-new-contracts`: squash gộp commit chữ ký vào commit bằng chứng và làm hỏng main cho mọi PR sau.
