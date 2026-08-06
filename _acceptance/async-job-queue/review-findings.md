## Trong hợp đồng

(Không có phát hiện nào ánh xạ được vào AC trong vòng này. Hai phát hiện "Trong hợp đồng" còn treo từ round 4 — thiếu `durationSec`/`fps` ở khối clip của đường job (AC-15) và lỗi Nominatim 503/mạng bị gắn nhầm `errorKind: 'input'` (AC-6) — nay đã được đóng bằng eval mới E25 và E24 tương ứng; xem section "Iterations" của evidence-report.md round này.)

## Ngoài hợp đồng — người quyết ở Gate 2

Các lỗi dưới đây là thật, nhưng nằm ngoài phạm vi đã duyệt ở Cổng 1 — người quyết, máy không tự sửa.

- **README không được cập nhật cho hai cửa REST mới và bốn núm env mới — và còn khẳng định điều đã sai**
  Người dùng thấy gì: Tài liệu hướng dẫn vận hành (README) chưa được cập nhật để mô tả hai điểm truy cập mới và các thiết lập cấu hình mới của tính năng hàng đợi việc, và vẫn viết như thể tính năng này chưa tồn tại — người vận hành đọc tài liệu này có thể bị hiểu nhầm.
  file: `README.md`
  severity: high
  Đề xuất: new-contract

- **Đầu vào được validate nhưng kết quả parse bị vứt đi — bản ghi việc giữ `params` thô**
  Người dùng thấy gì: Dữ liệu gửi tới khi tạo việc mới được kiểm tra hợp lệ, nhưng phần lưu lại vẫn là dữ liệu gốc chưa qua chuẩn hoá, có thể hơi khác với dữ liệu mà đường xử lý tức thời hiện có đang dùng — hiện chưa gây hậu quả nhưng có thể lệch nhau âm thầm sau này.
  file: `mcp-server/src/http.ts`
  severity: medium
  Đề xuất: known-limits

- **`claimNext` phụ thuộc `this` trong object literal — mất binding khi destructure**
  Người dùng thấy gì: Một phần chức năng nội bộ của sổ việc có thể lỗi nếu bị dùng theo cách không chuẩn (tách rời khỏi nơi nó thuộc về) — hiện không xảy ra trong luồng sử dụng thực tế của sản phẩm.
  file: `mcp-server/src/jobStore.ts`
  severity: low
  Đề xuất: known-limits

- **Tham số vị trí thứ sáu của `startHttpServer`, gọi kèm ba `undefined` liên tiếp**
  Người dùng thấy gì: Đoạn mã khởi động máy chủ hiện truyền một số thiết lập theo cách dễ gây nhầm lẫn khi đọc hoặc chỉnh sửa sau này — không ảnh hưởng đến hành vi hiện tại của sản phẩm.
  file: `mcp-server/src/http.ts`
  severity: low
  Đề xuất: known-limits

- **MAPPOSTER_MAX_QUEUED_JOBS does not bound memory — terminal records keep the caller's full 8 MB params for the whole 30-min TTL, unbounded in count**
  Người dùng thấy gì: Các việc đã kết thúc (kể cả việc thất bại gần như ngay lập tức) vẫn giữ nguyên toàn bộ dữ liệu đầu vào trong bộ nhớ suốt thời gian giữ kết quả, mà không giới hạn số lượng việc đã xong cùng lúc — nếu bị gửi liên tục, máy chủ có thể hết bộ nhớ dù hàng chờ nhận việc chưa từng báo đầy.
  file: `mcp-server/src/jobStore.ts`
  severity: high
  Đề xuất: new-contract

- **/jobs/status swallows artifact read failures and answers ok:true, status:"done" with no payload and no error**
  Người dùng thấy gì: Nếu tệp kết quả của một việc đã hoàn tất bị mất trước khi người dùng hỏi lại, hệ thống vẫn báo 'đã xong' nhưng không kèm nội dung và không nêu lý do — người dùng khó biết vì sao kết quả bị trống.
  file: `mcp-server/src/http.ts`
  severity: medium
  Đề xuất: known-limits

- **sweep() removes the record before deleting its files and swallows the rm error — a failed delete orphans the file permanently with no signal**
  Người dùng thấy gì: Khi hệ thống dọn dẹp các việc đã hết hạn, nếu bước xoá tệp trên đĩa gặp sự cố kỹ thuật, hệ thống vẫn coi như đã dọn xong mà không báo lỗi — tệp có thể bị bỏ sót vĩnh viễn trên đĩa mà không ai được thông báo.
  file: `mcp-server/src/jobRunner.ts`
  severity: medium
  Đề xuất: known-limits

- **drain() never resolves after stop() while jobs are still queued**
  Người dùng thấy gì: Một chức năng nội bộ dùng để chờ hàng đợi rỗng hẳn khi tắt máy chủ có thể bị treo vĩnh viễn nếu vẫn còn việc đang chờ đúng lúc tắt — hiện chưa có nơi nào trong sản phẩm thực sự dùng đường tắt máy chủ có kiểm soát này.
  file: `mcp-server/src/jobRunner.ts`
  severity: low
  Đề xuất: known-limits

## Chưa adversarial-verify (refuter chết)

(không có)

Cụm ngoài vùng phủ: cluster: n-a (không đo được — không eval nào khai paths, hoặc dưới ngưỡng cụm).