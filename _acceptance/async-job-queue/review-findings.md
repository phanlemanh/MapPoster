## Trong hợp đồng

- **sweep() nuốt mọi lỗi fs.rm SAU KHI bản ghi đã rời sổ — tệp rác vĩnh viễn, không log, không thử lại**
  file: `mcp-server/src/jobRunner.ts:234`
  severity: medium
  AC: AC-12
  source: bugs
  detail: takeExpired(now) xoá bản ghi khỏi Map trước rồi mới trả về (jobStore.ts:120-129, `for (const rec of expired) jobs.delete(rec.id)`). sweep() nhận danh sách đó rồi `await fs.rm(a.path, { force: true }).catch(() => {})`.

  Bản ghi là NGUỒN DUY NHẤT ghi lại đường dẫn tệp (chú thích ở jobStore.ts:20 nói đúng vậy). Một khi nó bị xoá và fs.rm hỏng (EACCES, EBUSY, EIO, ENOTDIR, mount read-only), không còn gì trên đời biết tệp đó tồn tại: không thử lại, không log, không hàng chờ dọn sau. Với clip mp4 hàng chục MB trên instance 2 GB, đây là rò đĩa đơn điệu tăng mà không tín hiệu nào báo.

  `{ force: true }` đã nuốt sẵn ENOENT (ca lành duy nhất) — nên `.catch(() => {})` chỉ còn nuốt các lỗi THẬT.

  rationale: AC-12 khoá đích danh: khi quét dọn chạy, thợ phải "xoá đúng những tệp ghi trong bản ghi đó"; finding cho thấy lỗi xoá tệp bị nuốt im lặng nên tệp có thể không thực sự bị xoá, phá vỡ đúng cam kết đó.

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây là thật, nhưng nằm ngoài phạm vi đã duyệt ở Cổng 1 — người quyết, máy không tự sửa.

- **Hai núm cấu hình được khai (spec §7) và nêu đích danh trong thông điệp lỗi nhưng KHÔNG BAO GIỜ đọc từ env**
  Người dùng thấy gì: Người vận hành đặt biến môi trường để tăng số việc chờ tối đa hoặc thời gian giữ kết quả nhưng hệ thống vẫn dùng con số mặc định cũ — thay đổi không có tác dụng gì, kể cả sau khi khởi động lại.
  file: `mcp-server/src/jobStore.ts:78`
  severity: high
  Đề xuất: known-limits

- **Việc clip chiếm một slot thợ trong suốt thời gian chỉ ĐỨNG CHỜ slot clip — việc render xếp sau bị bỏ đói tới 10 phút**
  Người dùng thấy gì: Khi có hai yêu cầu xuất video clip gửi liên tiếp, các yêu cầu xuất ảnh tĩnh gửi sau đó có thể bị treo chờ tới 10 phút dù máy chủ còn năng lực xử lý ảnh.
  file: `mcp-server/src/jobRunner.ts:116`
  severity: high
  Đề xuất: new-contract

- **README — hợp đồng vận hành của repo — không được cập nhật; README + config.ts vẫn khẳng định async job queue là "gói sau"**
  Người dùng thấy gì: Tài liệu hướng dẫn sử dụng dịch vụ vẫn mô tả tính năng nhận-việc-bất-đồng-bộ như thể chưa tồn tại, nên người tích hợp đọc tài liệu sẽ không biết hai cửa gửi việc và tra trạng thái mới đã có sẵn.
  file: `README.md:130`
  severity: high
  Đề xuất: known-limits

- **/jobs vứt bỏ kết quả `renderMapSchema.parse` và lưu params thô, ngược quy ước "parse, đừng tin" mà /render ghi rõ**
  Người dùng thấy gì: Yêu cầu gửi qua đường nhận-việc có thể mang theo các trường dữ liệu thừa không được lọc bỏ như đường xử lý ngay lập tức, tạo nguy cơ khác biệt hành vi âm thầm giữa hai cách gọi cùng một tính năng trong tương lai.
  file: `mcp-server/src/http.ts:472`
  severity: medium
  Đề xuất: known-limits

- **jobStatusBody nuốt lỗi đọc tệp — trả 200 {ok:true, status:'done'} không nội dung, không lý do**
  Người dùng thấy gì: Nếu ảnh kết quả bị mất khỏi ổ đĩa sau khi việc đã hoàn tất, người gọi tra trạng thái vẫn nhận được câu trả lời "thành công" nhưng không có ảnh, mà không có bất kỳ lời giải thích nào cho biết đã có sự cố.
  file: `mcp-server/src/http.ts:142`
  severity: medium
  Đề xuất: known-limits

- **loadServerConfig() bị đưa ra ngoài try/catch — env sai giờ ném stack trace thô thay vì thông điệp + exit(1)**
  Người dùng thấy gì: Nếu người vận hành đặt sai một giá trị cấu hình khi khởi động dịch vụ, tiến trình sẽ dừng bằng một thông báo lỗi kỹ thuật khó hiểu thay vì lời giải thích ngắn gọn và thoát gọn gàng như trước.
  file: `mcp-server/src/http.ts:537`
  severity: low
  Đề xuất: known-limits

- **MAPPOSTER_MAX_QUEUED_JOBS và MAPPOSTER_JOB_TTL_MS không bao giờ được đọc từ env — thông điệp 429 trỏ tới một núm chết**
  Người dùng thấy gì: Người vận hành đặt biến môi trường để tăng số việc chờ tối đa hoặc thời gian giữ kết quả nhưng hệ thống vẫn dùng con số mặc định cũ — thay đổi không có tác dụng gì, kể cả sau khi khởi động lại.
  file: `mcp-server/src/jobStore.ts:78`
  severity: high
  Đề xuất: known-limits

- **jobStatusBody nuốt lỗi đọc tệp — trả 200 {ok:true, status:'done'} mà không có base64 và không có lý do**
  Người dùng thấy gì: Nếu ảnh kết quả bị mất khỏi ổ đĩa sau khi việc đã hoàn tất, người gọi tra trạng thái vẫn nhận được câu trả lời "thành công" nhưng không có ảnh, mà không có bất kỳ lời giải thích nào cho biết đã có sự cố.
  file: `mcp-server/src/http.ts:142`
  severity: medium
  Đề xuất: known-limits

- **Việc clip chiếm một slot thợ trong suốt thời gian chỉ ĐỨNG CHỜ slot clip — việc render xếp sau bị bỏ đói tới 10 phút**
  Người dùng thấy gì: Khi có hai yêu cầu xuất video clip gửi liên tiếp, các yêu cầu xuất ảnh tĩnh gửi sau đó có thể bị treo chờ tới 10 phút dù máy chủ còn năng lực xử lý ảnh.
  file: `mcp-server/src/jobRunner.ts:116`
  severity: medium
  Đề xuất: new-contract

- **/jobs vứt bỏ kết quả renderMapSchema.parse và lưu params thô — mất lớp strip của zod so với /render**
  Người dùng thấy gì: Yêu cầu gửi qua đường nhận-việc có thể mang theo các trường dữ liệu thừa không được lọc bỏ như đường xử lý ngay lập tức, tạo nguy cơ khác biệt hành vi âm thầm giữa hai cách gọi cùng một tính năng trong tương lai.
  file: `mcp-server/src/http.ts:472`
  severity: low
  Đề xuất: known-limits

## Chưa phân loại (triage-failed)

phân loại phạm vi không chạy được — không lỗi nào bị máy tự sửa, người xem lại toàn bộ

- **loadServerConfig() bị đưa ra ngoài try/catch ở khối isMain — env sai giờ ném stack thô thay vì thông điệp + exit(1)**
  file: `mcp-server/src/http.ts:537`
  severity: low
  source: bugs
  detail: Trước: `try { ensureDist(loadServerConfig()); } catch (e) { console.error(...); process.exit(1); }` — loadServerConfig nằm TRONG try.
  Sau: `const cfg = loadServerConfig();` đứng trước try, chỉ ensureDist(cfg) còn được bọc.

  loadServerConfig() gọi envNumber() cho MAPPOSTER_APP_PORT / MAPPOSTER_POOL / MAPPOSTER_POOL_ACQUIRE_TIMEOUT_MS / MAPPOSTER_HTTP_MAX_BODY, và envNumber được thiết kế để NÉM khi giá trị sai (chú thích config.ts: "Parse a numeric env var, or refuse to start"). Với MAPPOSTER_POOL=abc, tiến trình giờ chết bằng uncaught exception + stack trace ở phạm vi module thay vì một dòng giải thích và exit(1) — mất đúng đường xử lý lỗi khởi động mà khối try này được viết ra để giữ.

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).