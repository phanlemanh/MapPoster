## Trong hợp đồng

(không có finding nào map được vào AC ở round này.)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây là thật, nhưng nằm ngoài phạm vi đã duyệt ở Cổng 1 — người quyết, máy không tự sửa.

- **Cổng merge của repo đang ĐỎ: evidence của map-motion-clip và mcp-map-render bị stale vì diff này**
  Người dùng thấy gì: Nếu hợp nhất nhánh này ngay bây giờ, hệ thống kiểm tra tự động của kho mã sẽ chặn việc hợp nhất vì bằng chứng đã duyệt trước đó của hai tính năng liên quan chưa được xác nhận lại theo thay đổi mới.
  file: `_acceptance/map-motion-clip/evidence-report.md`
  severity: high
  Đề xuất: known-limits

- **README (bề mặt hợp đồng công khai của repo) không được cập nhật: hai cửa REST mới, 4 núm env mới, 2 status code mới đều thiếu — và README còn khẳng định ngược lại**
  Người dùng thấy gì: Người đọc README để tích hợp sẽ không thấy các cổng công việc mới và các tuỳ chọn cấu hình liên quan, và README hiện còn nói sai rằng những thứ đó chưa tồn tại.
  file: `README.md`
  severity: medium
  Đề xuất: new-contract

- **Tên tệp artifact của job dùng bộ đếm cấp module, không theo quy ước tên duy nhất của repo — trùng tên qua mỗi lần khởi động lại**
  Người dùng thấy gì: Sau khi máy chủ khởi động lại, kết quả của một việc mới có thể âm thầm ghi đè lên kết quả của một việc cũ không liên quan nếu chúng dùng cùng tên địa danh.
  file: `mcp-server/src/jobRunner.ts`
  severity: medium
  Đề xuất: new-contract

- **Chú thích JSDoc trong geocode.ts bị mồ côi — giờ đứng trước class mới thay vì trước hàm nó mô tả**
  Người dùng thấy gì: Không ảnh hưởng gì tới người dùng cuối; đây chỉ là một ghi chú trong mã nguồn giờ nằm sai chỗ, có thể gây nhầm lẫn cho người bảo trì sau này.
  file: `mcp-server/src/geocode.ts`
  severity: low
  Đề xuất: known-limits

- **Nominatim outage on /reverse is still misclassified as caller error (errorKind: 'input') — the GeocodeUpstreamError fix has a hole**
  Người dùng thấy gì: Khi dịch vụ tra cứu vị trí bên ngoài tạm thời gặp sự cố, người dùng sẽ bị báo rằng dữ liệu họ nhập sai và cần sửa lại, trong khi thực ra họ chỉ cần thử lại sau ít phút.
  file: `mcp-server/src/geocode.ts`
  severity: high
  Đề xuất: new-contract

- **canStart guard counts only runner-local clips, so sync /render-clip callers can park every worker on the clip wait queue and starve render jobs for the full 10-minute slot wait**
  Người dùng thấy gì: Một đợt yêu cầu tạo clip dồn dập có thể chiếm hết năng lực xử lý của hệ thống trong nhiều phút, khiến các yêu cầu vẽ bản đồ thông thường khác — vốn không cần tới clip — bị trì hoãn dù đúng ra chúng có thể chạy ngay.
  file: `mcp-server/src/jobRunner.ts`
  severity: medium
  Đề xuất: new-contract

## Chưa phân loại (triage-failed)

phân loại phạm vi không chạy được — không lỗi nào bị máy tự sửa, người xem lại toàn bộ.

- title: /jobs kiểm `motion` bằng z.union thô, đi vòng qua `parseMotionParam` — đúng cái anti-pattern motionCompiler.ts đã ghi lại là Finding F
  file:line: `mcp-server/src/http.ts:475`
  severity: medium
  source: conventions
  detail: `motionParamSchema.parse(submit.motion)` gọi thẳng `z.union([presetMotionParamSchema, scriptMotionParamSchema])` (motionCompiler.ts:246).

  motionCompiler.ts:248-255 viết rõ vì sao KHÔNG được làm thế: `parseMotionParam` tồn tại để rẽ nhánh theo `'preset' in motion` TRƯỚC khi parse, thay cho hành vi "both branches failed, blend into one error" của z.union — và comment nói `motionParamSchema` là schema KHAI BÁO (dùng cho inputSchema của MCP tool), còn `parseMotionParam` mới là chỗ CHẤP NHẬN lúc chạy.

  Hệ quả đo được: `{kind:'clip', motion:{preset:'flyby'}}` đi qua `/render-clip` -> parseMotionParam rẽ vào nhánh preset -> lỗi cụ thể nêu đích danh enum hợp lệ -> 422. Cùng input đi qua `/jobs` -> cả hai nhánh union fail -> `z.prettifyError` trên invalid_union -> thông điệp trộn/mờ -> 400. Hai bề mặt cùng một input, hai chất lượng lỗi khác nhau, đúng lớp hồi quy Finding F đã sửa.

  Ngoài ra `renderMapSchema.parse(submit.params)` (line 474) vứt kết quả parse và lưu `submit.params` thô vào sổ, trong khi `/render` (line 224) dùng chính giá trị đã parse — parse-don't-validate bị phá ở cửa mới.

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).