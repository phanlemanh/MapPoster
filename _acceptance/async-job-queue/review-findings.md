## Trong hợp đồng

### isCallerFault misclassifies caller-input failures as errorKind 'server'
- file: `mcp-server/src/jobRunner.ts:42`
- severity: high
- AC: AC-6
- source: bugs

The regex `/No geocoding result|Unsupported format|out of range/i` only ever matches ONE error this codebase throws. Greping every `throw new Error` in resolveConfig.ts/geocode.ts: the real messages are `Unknown theme: ...`, `Unknown format: ...`, `Invalid highlight.regions[].geojson: ...`, `Invalid longitude/latitude/zoom: ...`, `No boundary found for region "..."`. The strings "Unsupported format" and "out of range" appear nowhere in the repo, so those two alternatives are dead. Every one of those failures is pure caller input, and every one of them is reachable through POST /jobs because renderMapSchema does not validate them at submit time (`theme: z.string()`, `format: z.string()|{w,h}`, `geojson: z.any()`) — they are only caught later inside resolveConfig, on the worker.

Confirmed by probe (run against HEAD, then removed):
```
bad theme   -> status=failed errorKind=server error=Unknown theme: rubby. Known themes: ...
bad format  -> status=failed errorKind=server error=Unknown format: wat
bad geojson -> status=failed errorKind=server error=Invalid highlight.regions[].geojson: expected a GeoJSON FeatureCollection
```

The identical bodies return HTTP 400 on the synchronous /render path (http.ts resolve-phase catch), so the two surfaces now disagree about who is at fault for the same input. This breaks AC-6 ("phân biệt rõ lỗi tại người gọi hay tại máy chủ") and is actively misleading: errorKind 'server' tells OneHub to retry a request that can never succeed. The existing AC-6 test (E8) only exercises `render: throw new Error('trình duyệt chết')`, which is genuinely a server fault, so nothing catches this.

Fix direction: classify positively (MotionParamError plus anything thrown by resolveConfig/geocode is caller fault) rather than by string-matching a list that has already drifted from the messages the code emits.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây là thật, nhưng nằm ngoài phạm vi đã duyệt ở Cổng 1 — người quyết, máy không tự sửa.

- **Hai núm cấu hình MAPPOSTER_MAX_QUEUED_JOBS / MAPPOSTER_JOB_TTL_MS không hề đọc từ env**
  Người dùng thấy gì: Người vận hành không thể chỉnh giới hạn số việc chờ hay thời gian giữ kết quả qua cấu hình môi trường — đổi biến môi trường không có tác dụng gì, hệ thống luôn dùng số mặc định mà không báo hiệu cho ai biết.
  file: `/Users/manh-macmini/dev/map/.claude/worktrees/suspicious-wozniak-cdb826/mcp-server/src/http.ts:548`
  severity: high
  Đề xuất: known-limits

- **Trần hàng chờ chỉ đếm việc 'queued' — bản ghi đã kết thúc vẫn giữ nguyên `params` suốt 30 phút và KHÔNG có trần**
  Người dùng thấy gì: Các việc đã hoàn tất vẫn giữ nguyên toàn bộ dữ liệu yêu cầu gốc (có thể chứa bản đồ lớn) suốt 30 phút mà không có giới hạn tổng số, nên một luồng yêu cầu hợp lệ đều đặn có thể làm hết bộ nhớ máy chủ và làm sập dịch vụ cho mọi người dùng.
  file: `/Users/manh-macmini/dev/map/.claude/worktrees/suspicious-wozniak-cdb826/mcp-server/src/jobStore.ts:96`
  severity: high
  Đề xuất: known-limits

- **Việc clip chiếm slot thợ trong lúc CHỜ slot clip — việc render ảnh xếp sau bị bỏ đói tới 10 phút**
  Người dùng thấy gì: Khi hai việc xuất video được gửi cùng lúc, một việc chỉ cần xuất ảnh tĩnh xếp ngay sau đó có thể phải chờ tới 10 phút dù bản thân nó không cần chờ gì cả, vì một chỗ xử lý bị chiếm dụng vô ích trong lúc chờ.
  file: `/Users/manh-macmini/dev/map/.claude/worktrees/suspicious-wozniak-cdb826/mcp-server/src/jobRunner.ts:94`
  severity: medium
  Đề xuất: known-limits

- **Finished jobs retain caller `params` (incl. inline GeoJSON) for the full 30-min TTL, unbounded**
  Người dùng thấy gì: Các việc đã hoàn tất vẫn giữ nguyên toàn bộ dữ liệu yêu cầu gốc (có thể chứa bản đồ lớn) suốt 30 phút mà không có giới hạn tổng số, nên một luồng yêu cầu hợp lệ đều đặn có thể làm hết bộ nhớ máy chủ và làm sập dịch vụ cho mọi người dùng.
  file: `/Users/manh-macmini/dev/map/.claude/worktrees/suspicious-wozniak-cdb826/mcp-server/src/jobStore.ts:117`
  severity: medium
  Đề xuất: known-limits

- **jobStatusBody swallows artifact read failures — returns status 'done' with no content and no error**
  Người dùng thấy gì: Khi máy chủ không đọc được tệp ảnh đã lưu của một việc đã xong, câu trả lời vẫn báo 'đã xong' thành công nhưng lặng lẽ thiếu mất ảnh và không giải thích lý do, khiến người gọi không biết vì sao không nhận được ảnh.
  file: `/Users/manh-macmini/dev/map/.claude/worktrees/suspicious-wozniak-cdb826/mcp-server/src/http.ts:142`
  severity: medium
  Đề xuất: known-limits

- **Clip jobs occupy a worker while merely waiting for a clip slot, blocking unrelated render jobs**
  Người dùng thấy gì: Khi hai việc xuất video được gửi cùng lúc, một việc chỉ cần xuất ảnh tĩnh xếp ngay sau đó có thể phải chờ tới 10 phút dù bản thân nó không cần chờ gì cả, vì một chỗ xử lý bị chiếm dụng vô ích trong lúc chờ.
  file: `mcp-server/src/jobRunner.ts:94`
  severity: low
  Đề xuất: known-limits

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).
