## Trong hợp đồng

(không có finding nào map được vào AC ở round này — phát hiện round 1 về `isCallerFault` misclassify errorKind đã được đóng, xác nhận bởi eval E8b mới thêm, xanh trên HEAD.)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây là thật, nhưng nằm ngoài phạm vi đã duyệt ở Cổng 1 — người quyết, máy không tự sửa.

- **MAPPOSTER_MAX_QUEUED_JOBS và MAPPOSTER_JOB_TTL_MS được khai là núm cấu hình nhưng không bao giờ đọc từ env**
  Người dùng thấy gì: Nếu người vận hành muốn tăng hoặc giảm giới hạn số việc đang chờ, hoặc thời gian giữ kết quả, bằng cách đổi cấu hình, thao tác đó sẽ không có tác dụng gì — hệ thống luôn dùng đúng một giá trị mặc định.
  file: `mcp-server/src/http.ts:548`
  severity: high
  Đề xuất: known-limits

- **README.md không được cập nhật: hai endpoint HTTP công khai mới không tài liệu, và README + config.ts vẫn khẳng định async job queue là "gói sau"**
  Người dùng thấy gì: Người đọc tài liệu sản phẩm sẽ không biết có cách gửi việc render không đồng bộ để tránh bị từ chối khi hệ thống quá tải, vì tài liệu vẫn nói tính năng đó chưa tồn tại.
  file: `README.md:130`
  severity: high
  Đề xuất: known-limits

- **/jobs vứt bỏ kết quả của renderMapSchema.parse và lưu params thô, ngược với quy ước "parse, đừng tin" mà /render ghi rõ**
  Người dùng thấy gì: Hiện tại chưa ảnh hưởng gì tới người dùng, nhưng nếu về sau có dữ liệu thừa hoặc sai lọt vào yêu cầu gửi việc, nó có thể âm thầm đi xuyên qua hệ thống mà không bị chặn như ở đường xử lý ảnh tức thời.
  file: `mcp-server/src/http.ts:472`
  severity: medium
  Đề xuất: known-limits

- **jobStatusBody nuốt lỗi đọc tệp — trả về 200 {ok:true, status:'done'} không ảnh, không lý do**
  Người dùng thấy gì: Khi một việc đã báo là xong nhưng tệp kết quả vì lý do nào đó không đọc được nữa, người gọi sẽ nhận một câu trả lời trông như thành công nhưng không có ảnh và không lời giải thích, dễ nhầm là hệ thống đang hoạt động bình thường.
  file: `mcp-server/src/http.ts:142`
  severity: medium
  Đề xuất: known-limits

- **_acceptance/config.yaml: executor job_http trùng lặp nguyên văn clip_http, và ba dòng mới lệch kiểu trích dẫn**
  Người dùng thấy gì: Không ảnh hưởng tới người dùng cuối; đây là một hao phí thời gian chạy kiểm tra nội bộ, không tác động tới tính năng mà người dùng thấy hay dùng.
  file: `_acceptance/config.yaml:19`
  severity: low
  Đề xuất: known-limits

- **render.yaml trỏ tới http.ts theo số dòng — cả bốn tham chiếu đã lệch sau khi http.ts dài thêm ~120 dòng**
  Người dùng thấy gì: Không ảnh hưởng tới người dùng cuối; đây là tài liệu vận hành nội bộ trỏ sai vị trí, có thể khiến người vận hành mất thời gian tra cứu khi có sự cố.
  file: `render.yaml:40`
  severity: low
  Đề xuất: known-limits

- **MAPPOSTER_MAX_QUEUED_JOBS và MAPPOSTER_JOB_TTL_MS không bao giờ được đọc từ env — thông điệp 429 chỉ người vận hành tới một núm chết**
  Người dùng thấy gì: Nếu người vận hành muốn tăng hoặc giảm giới hạn số việc đang chờ, hoặc thời gian giữ kết quả, bằng cách đổi cấu hình, thao tác đó sẽ không có tác dụng gì — hệ thống luôn dùng đúng một giá trị mặc định, kể cả khi thông báo lỗi ngụ ý ngược lại.
  file: `mcp-server/src/jobStore.ts:78`
  severity: high
  Đề xuất: known-limits

- **jobStatusBody nuốt lỗi đọc tệp — trả status 'done' + ok:true nhưng thiếu hẳn nội dung, không lời giải thích**
  Người dùng thấy gì: Khi một việc đã báo là xong nhưng tệp kết quả vì lý do nào đó không đọc được nữa, người gọi sẽ nhận một câu trả lời trông như thành công nhưng không có ảnh và không lời giải thích, dễ nhầm là hệ thống đang hoạt động bình thường.
  file: `mcp-server/src/http.ts:142`
  severity: medium
  Đề xuất: known-limits

- **sweep() nuốt mọi lỗi fs.rm sau khi bản ghi đã rời sổ — tệp rác vĩnh viễn, không log, không thử lại**
  Người dùng thấy gì: Nếu việc xoá một tệp kết quả cũ gặp trục trặc, tệp đó có thể ở lại trên đĩa mà không ai biết để dọn — chỉ ảnh hưởng dung lượng lưu trữ vận hành, không ảnh hưởng trực tiếp tới người đang dùng dịch vụ.
  file: `mcp-server/src/jobRunner.ts:234`
  severity: medium
  Đề xuất: known-limits

- **Việc clip chiếm slot thợ trong suốt thời gian CHỜ slot clip — việc render xếp sau bị bỏ đói tới 10 phút**
  Người dùng thấy gì: Khi hàng chờ xử lý clip đã đầy, một việc render ảnh gửi sau đó có thể phải chờ rất lâu — tới nhiều phút — dù bản thân nó không cần tới tài nguyên xử lý clip nào, làm chậm trải nghiệm đúng vào lúc hàng đợi lẽ ra phải giải quyết được vấn đề chờ đợi.
  file: `mcp-server/src/jobRunner.ts:116`
  severity: medium
  Đề xuất: known-limits

- **loadServerConfig() bị đưa ra ngoài try/catch — env sai giờ ném stack trace thô thay vì thông điệp thân thiện + exit(1)**
  Người dùng thấy gì: Nếu cấu hình khởi động sai, máy chủ sẽ dừng lại với một thông báo lỗi kỹ thuật khó hiểu thay vì một dòng giải thích rõ ràng cho người vận hành — chỉ ảnh hưởng người vận hành lúc triển khai, không ảnh hưởng người dùng cuối.
  file: `mcp-server/src/http.ts:537`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

- **Việc clip chiếm một slot thợ trong suốt thời gian chỉ ĐỨNG CHỜ slot clip, bỏ đói việc render xếp sau**
  file: `mcp-server/src/jobRunner.ts:116`
  severity: medium
  detail: `pump()` (jobRunner.ts:200-213) tăng `live` NGAY khi rút việc ra khỏi sổ, rồi `runOne` → `runClip` mới `await acquireClipSlotWaiting(...)` ở dòng 116. Nghĩa là một việc clip đang xếp hàng chờ slot vẫn tính là một thợ ĐANG BẬN, tối đa `MAPPOSTER_JOB_SLOT_WAIT_MS` (mặc định 10 phút, config.ts:61). Với mặc định của chính gói này — `workers = cfg.poolSize` (http.ts:554, poolSize mặc định 2) và `DEFAULT_CLIP_CONCURRENCY = 1` — chỉ cần hai việc clip nộp liên tiếp là cả hai thợ bị chiếm: một chạy thật, một ngồi không chờ slot. Mọi việc `kind: 'render'` xếp sau (không cần slot clip, không cạnh tranh gì với clip ngoài hồ trình duyệt) nằm ở trạng thái `queued` tới 10 phút. Điều này nghịch với chính lý do gói tồn tại (bỏ 429/treo cho người gọi) và nghịch với chú thích ngay trên dòng 14 ("bên gọi nên đặt bằng sức chứa hồ trình duyệt") — sức chứa hồ chỉ đúng nếu thợ thực sự đang dùng hồ. Sửa hướng: lấy slot clip TRƯỚC khi chiếm thợ, hoặc trả việc về hàng khi chưa có slot thay vì chờ tại chỗ.
  source: conventions (refuter chết trên finding này — chưa có adversarial-verify độc lập xác nhận lại; nội dung trùng lớp với finding "Việc clip chiếm slot thợ..." ở mục Ngoài hợp đồng phía trên nhưng KHÔNG được gộp vì trạng thái xác minh khác nhau)

⚠ Cụm ngoài vùng phủ: 3/11 lỗi rơi vào file không bộ đo nào phủ (README.md, _acceptance/config.yaml, render.yaml) — dừng và quyết: mở rộng hợp đồng hay rút phạm vi.