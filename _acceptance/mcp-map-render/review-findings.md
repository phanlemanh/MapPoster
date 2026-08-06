# Review Findings: mcp-map-render (Round 16)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this file).
Feeds the Gate 2 decision card alongside `evidence-report.md`.

Verified at commit `f7b1d6c4ea056d30ddd61df185dc87ed0c74566f` (current `HEAD`).

**Trigger and scope:** this round's own S4 verify was triggered by staleness — since Round 15's pin
(`06d37e2`), 10 files under `mcp-server/` changed (`git diff 06d37e2..f7b1d6c --stat -- src/
mcp-server/`: `config.ts`, `geocode.ts`, `http.ts` + `http.test.ts`, two brand-new modules
`jobStore.ts`/`jobRunner.ts` + their tests, and `motionCompiler.ts` + its test), dominated by a separate,
later feature — `async-job-queue` (`POST /jobs` / `POST /jobs/status`, a background job runner; its own
`_acceptance/async-job-queue/` contract, already signed off `manh` at round 5 per `git log`:
`14c5d17 signoff: manh CHẤP NHẬN async-job-queue (round 5)`). Unlike Round 15's trigger, this one touches
`geocode.ts` and `http.ts` directly — files this contract's own criteria live in — so this round ran a
full fresh adversarial review (both `bugs` and `conventions` finder lenses) rather than skip it as Round
15 did. Every finding below survived: none maps to any AC of THIS contract (`contract.md`'s own "Out of
scope" section already excludes `render_sequence`/`render_clip` and their supporting async job-queue
infrastructure — Phase 2/3). All 13 are filed under "Ngoài hợp đồng" for a human to accept as known-limits
or spin into `async-job-queue`'s own contract/follow-up.

## Trong hợp đồng

None. No finding this round maps to any AC of `mcp-map-render` — every finding sits inside the separate
`async-job-queue` feature's own surface (`POST /jobs`, `jobStore.ts`, `jobRunner.ts`) or that feature's
interaction with `geocode.ts`'s `reverseGeocode`/`README.md`'s doc coverage, none of it reachable through
this contract's own synchronous `render_map` / `render_variants` / `geocode_place` / `list_themes` /
`list_formats` tools.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây là thật, nhưng nằm ngoài phạm vi đã duyệt ở Cổng 1 — người quyết, máy không tự sửa.

- **`/jobs` validates `motion` với `motionParamSchema` (z.union) thay vì `parseMotionParam` — đúng
  anti-pattern mà motionCompiler.ts ghi là Finding F**
  Người dùng thấy gì: Khi gửi yêu cầu tạo hoạt ảnh qua cách gửi việc theo hàng đợi mới, người dùng có thể
  nhận thông báo lỗi khó hiểu hơn so với khi gửi trực tiếp, gây khó khăn khi cần sửa lại yêu cầu.
  file: `mcp-server/src/http.ts`
  severity: high
  Đề xuất: new-contract

- **MAPPOSTER_MAX_QUEUED_JOBS chỉ chặn việc ĐANG CHỜ — bản ghi đã kết thúc giữ nguyên `params` (tối đa
  8 MiB) suốt 30 phút, không có trần tổng**
  Người dùng thấy gì: Nếu có nhiều yêu cầu bị lỗi dồn dập, máy chủ có thể hết bộ nhớ và ngừng phục vụ mọi
  yêu cầu tạo ảnh/video, dù hệ thống vẫn báo hàng đợi còn chỗ.
  file: `mcp-server/src/jobStore.ts`
  severity: high
  Đề xuất: new-contract

- **Nominatim `/reverse` sập vẫn bị gắn `errorKind: 'input'` — hàng rào GeocodeUpstreamError còn hở
  đúng một lỗ**
  Người dùng thấy gì: Khi dịch vụ định vị bên ngoài tạm thời gặp sự cố, người dùng có thể bị báo nhầm là
  địa chỉ họ nhập sai và được yêu cầu tự sửa lại, trong khi chỉ cần thử lại sau vài phút là được.
  file: `mcp-server/src/geocode.ts`
  severity: high
  Đề xuất: new-contract

- **README không được cập nhật cho 2 cửa REST mới, 4 núm env mới và các status code mới — và vẫn khẳng
  định điều ngược lại**
  Người dùng thấy gì: Người vận hành đọc tài liệu hướng dẫn sẽ không biết tới các tuỳ chọn cấu hình và
  cách gọi mới của hệ thống hàng đợi việc, dễ cấu hình sai hoặc bỏ sót khi triển khai.
  file: `README.md`
  severity: high
  Đề xuất: known-limits

- **Kết quả parse ở biên bị vứt đi — sổ việc lưu `submit.params` thô, phá parse-don't-validate mà
  `/render` đang theo**
  Người dùng thấy gì: Hiện chưa gây lỗi cho người dùng, nhưng nếu sau này luật kiểm tra dữ liệu thay đổi,
  yêu cầu gửi qua cách nhận việc hàng đợi có thể bị xử lý khác với yêu cầu gửi trực tiếp mà không ai được
  cảnh báo.
  file: `mcp-server/src/http.ts`
  severity: medium
  Đề xuất: known-limits

- **Tên tệp artifact của job dùng bộ đếm cấp module — trùng tên và ghi đè im lặng sau mỗi lần khởi động
  lại**
  Người dùng thấy gì: Sau khi máy chủ khởi động lại, tệp kết quả của một yêu cầu mới có thể ghi đè lên
  tệp của yêu cầu cũ mà không báo, khiến người dùng có thể nhận nhầm nội dung không phải của mình.
  file: `mcp-server/src/jobRunner.ts`
  severity: medium
  Đề xuất: new-contract

- **`/jobs/status` nuốt lỗi đọc artifact và trả `ok:true, status:"done"` không nội dung, không lý do**
  Người dùng thấy gì: Khi tệp kết quả bị mất hoặc lỗi, người dùng vẫn nhận thông báo 'đã xong' nhưng
  không có ảnh/video kèm theo và không biết cần làm gì tiếp theo.
  file: `mcp-server/src/http.ts`
  severity: medium
  Đề xuất: new-contract

- **Tham số vị trí thứ sáu của `startHttpServer`, gọi kèm ba `undefined` liên tiếp**
  Người dùng thấy gì: Không ảnh hưởng trực tiếp tới người dùng hiện tại; rủi ro nằm ở khả năng đội phát
  triển vô tình cấu hình sai khi sửa mã trong tương lai, có thể gây lỗi vận hành khó phát hiện.
  file: `mcp-server/src/http.ts`
  severity: low
  Đề xuất: known-limits

- **JSDoc trong geocode.ts bị mồ côi — chú thích của `__setRateLimitMs` giờ đứng trước class mới**
  Người dùng thấy gì: Không ảnh hưởng người dùng cuối; chỉ gây khó hiểu cho người đọc mã nguồn sau này.
  file: `mcp-server/src/geocode.ts`
  severity: low
  Đề xuất: known-limits

- **Nominatim outage in the country-anchor lookup is still classified errorKind:'input' — the AC-6 fix
  misses reverseGeocode**
  Người dùng thấy gì: Khi dịch vụ định vị bên ngoài tạm thời gặp sự cố, người dùng có thể bị báo nhầm là
  dữ liệu họ nhập sai và được yêu cầu tự sửa lại, trong khi chỉ cần thử lại sau vài phút là được.
  file: `mcp-server/src/geocode.ts`
  severity: high
  Đề xuất: new-contract

- **MAPPOSTER_MAX_QUEUED_JOBS does not bound memory — terminal records keep the caller's full params for
  the whole 30-min TTL, unbounded in count**
  Người dùng thấy gì: Nếu có nhiều yêu cầu bị lỗi dồn dập, máy chủ có thể hết bộ nhớ và ngừng phục vụ mọi
  yêu cầu tạo ảnh/video, dù hệ thống vẫn báo hàng đợi còn chỗ.
  file: `mcp-server/src/jobStore.ts`
  severity: high
  Đề xuất: new-contract

- **/jobs/status swallows artifact read failures and answers ok:true, status:'done' with no payload and
  no error**
  Người dùng thấy gì: Khi tệp kết quả bị mất hoặc lỗi, người dùng vẫn nhận thông báo 'đã xong' nhưng
  không có ảnh/video kèm theo và không biết cần làm gì tiếp theo.
  file: `mcp-server/src/http.ts`
  severity: medium
  Đề xuất: new-contract

- **sweep() deletes the record before its files and swallows the rm error — a failed delete orphans the
  file permanently, with no signal**
  Người dùng thấy gì: Nếu việc xoá tệp tạm thất bại, tệp kết quả cũ có thể tồn đọng mãi trên kho lưu trữ
  dùng chung mà không ai biết, có thể làm đầy dung lượng theo thời gian.
  file: `mcp-server/src/jobRunner.ts`
  severity: medium
  Đề xuất: new-contract

## Chưa adversarial-verify (refuter chết)

none — không có finding nào round này mang cờ `unverified: true`; cả hai lượt tìm (`bugs` và
`conventions`) hoàn tất đầy đủ, không có lượt nào chết giữa chừng.

## Review incomplete (finder chết)

none — trong lượt chạy tạo ra nội dung này, không có lượt review nào không hoàn tất.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
