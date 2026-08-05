## Trong hợp đồng

- **Async clip status drops `durationSec`/`fps` that the synchronous `/render-clip` returns**
  file: `mcp-server/src/http.ts:146`
  severity: medium
  AC: AC-15
  source: conventions
  detail: `/render-clip` returns `clip: { base64, format, width, height, durationSec, fps, bytes }` (http.ts ~line 375). The job path builds its clip block as `{ base64, format, width, height, bytes }` (http.ts:143-146), and the sibling `motion` object built in jobRunner.ts:135 is `{ preset?, restAtSec }` — so neither `durationSec` nor `fps` appears anywhere in a `/jobs/status` response, even though both are known (`motion.fps`, `motion.durationSec` are in scope at that exact line and `motion.fps` is already passed to `encodeAnimation` one line later).

  AC-15 is specifically "the two-endpoint contract is enough for OneHub to switch to job submission without needing any new concept — or name what is missing". A consumer migrating off `/render-clip` silently loses two response fields it may be muxing or timing against, with no signal that they were dropped. The gap is not listed in the contract's accepted "Known limits", so it reads as an oversight rather than a decision.

  rationale: AC-15 explicitly asks the signer to judge whether the two-endpoint contract is enough for OneHub to switch over 'hoặc nêu đích danh thứ còn thiếu' — this finding names exactly such a missing field, which is the judgment this AC exists to surface.

- **Upstream geocoder outages are reported to the caller as `errorKind: 'input'`**
  file: `mcp-server/src/jobRunner.ts:57`
  severity: medium
  AC: AC-6
  source: bugs
  detail: `resolvePhase()` labels *everything* thrown out of `resolveConfig` as a `JobInputError`, and `isCallerFault` (jobRunner.ts:66) then sets `errorKind: 'input'` in the job record. But the "resolve phase" is not pure input validation — it performs network I/O. `resolveConfig` → `resolveLocation` (geocode.ts:147) → `searchLadder` → `searchPlaces` (src/lib/geocoding.ts:350) does `if (!res.ok) throw new Error(\`Geocoding failed: ${res.status}\`)`, and there is no try/catch anywhere between that throw and `resolvePhase` (geocode.ts's only `catch` is the rate-limiter chain guard at line 74, which does not wrap the search).

  Failure scenario: Nominatim returns 503 (or the fetch rejects with a network error, or 429 from the shared rate limit) while a job renders `{location:"Hà Nội"}`. The job finishes as `{status:"failed", error:"Geocoding failed: 503", errorKind:"input"}`. `errorKind` exists specifically so the caller can decide retry-vs-fix; the caller is told to fix an input that is perfectly valid, and will not retry a request that would succeed a second later. The class of mistake the commit that added this (a0b84bd, "phân loại lỗi tại-ai theo pha, không theo chuỗi thông điệp") set out to eliminate is not actually eliminated — the phase boundary encloses a third-party dependency.

  rationale: AC-6 requires a caller-fault job (unresolvable location) and a server-fault job (browser died) to be clearly distinguished by fault type when queried; this finding shows a third case — the geocoding dependency itself failing (503/network error) — is mislabeled as caller-fault, breaking the very distinction AC-6 mandates.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây là thật, nhưng nằm ngoài phạm vi đã duyệt ở Cổng 1 — người quyết, máy không tự sửa.

- **Queue cap only bounds 'queued' jobs — terminal records keep caller `params` for the full TTL, unbounded in count**
  Người dùng thấy gì: Nếu nhiều yêu cầu render bị từ chối nhanh liên tiếp (ví dụ do sai định dạng), dữ liệu người dùng gửi lên vẫn được giữ nguyên trong bộ nhớ máy chủ tới 30 phút mỗi lần dù yêu cầu đã kết thúc, và nếu việc này lặp lại nhiều lần có thể khiến dịch vụ chậm dần hoặc ngừng hoạt động.
  file: `mcp-server/src/jobStore.ts:105`
  severity: high
  Đề xuất: known-limits

- **Unused import `createJobStore` in http.ts**
  Người dùng thấy gì: Đây là một dòng mã thừa không được dùng tới trong nội bộ hệ thống; không ảnh hưởng gì tới trải nghiệm hay dữ liệu của người dùng.
  file: `mcp-server/src/http.ts:18`
  severity: low
  Đề xuất: known-limits

- **Runner lifecycle is not tied to the HTTP server it is injected into**
  Người dùng thấy gì: Trong vận hành bình thường của dịch vụ, người dùng không bị ảnh hưởng; rủi ro chỉ xuất hiện khi có ai đó nhúng và tắt máy chủ theo cách lập trình (ví dụ trong môi trường kiểm thử nội bộ), khi đó tiến trình xử lý việc nền có thể tiếp tục âm thầm chạy dù không còn ai theo dõi được nữa.
  file: `mcp-server/src/http.ts:531`
  severity: low
  Đề xuất: known-limits

- **Timed-out slot waiters stay in the `waiters` array until a later pump walks past them**
  Người dùng thấy gì: Trong những đợt hệ thống bị quá tải kéo dài liên tục, một phần bộ nhớ nhỏ có thể tích tụ dần theo thời gian ở hậu trường; đây là rò rỉ chậm, không gây gián đoạn tức thời cho người dùng đang chờ kết quả.
  file: `mcp-server/src/motionCompiler.ts:402`
  severity: low
  Đề xuất: known-limits

- **Queue cap only bounds queued jobs — finished records retain full `params` for 30 min, so fast-failing jobs OOM the process**
  Người dùng thấy gì: Nếu có kẻ gửi liên tục hàng loạt yêu cầu render với dữ liệu lớn nhưng cố tình sai định dạng để bị từ chối ngay, dữ liệu đó vẫn nằm lại trong bộ nhớ máy chủ suốt 30 phút mỗi lần mà không hề kích hoạt cảnh báo quá tải, và có thể khiến dịch vụ ngừng hoạt động cho mọi người dùng khác.
  file: `mcp-server/src/jobStore.ts:105`
  severity: high
  Đề xuất: known-limits

- **`/jobs/status` swallows artifact read errors and returns `ok:true, status:"done"` with no payload and no error**
  Người dùng thấy gì: Nếu tệp ảnh kết quả bị mất khỏi máy chủ trước khi người dùng tải về, hệ thống vẫn báo 'đã xong' nhưng không kèm ảnh và không giải thích lý do — người dùng nhận về kết quả trống mà không biết đó là lỗi hệ thống.
  file: `mcp-server/src/http.ts:142`
  severity: medium
  Đề xuất: known-limits

- **Job artifacts written before a restart are orphaned in `sinkDir` forever — the TTL sweep can never reach them**
  Người dùng thấy gì: Mỗi lần máy chủ khởi động lại (triển khai bản mới, sự cố, bảo trì), các tệp ảnh/video đã tạo ra nhưng chưa kịp được người dùng tải về sẽ bị bỏ quên vĩnh viễn trên đĩa và không bao giờ tự dọn — theo thời gian điều này có thể làm đầy dần dung lượng lưu trữ của dịch vụ.
  file: `mcp-server/src/jobRunner.ts:248`
  severity: medium
  Đề xuất: new-contract

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).