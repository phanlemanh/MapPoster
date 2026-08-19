---
slug: test-env-webstorage
at: 2026-08-19T11:12:13Z
verdict: findings
p0: 2
p1: 3
---

# Phản biện ngữ cảnh sạch — test-env-webstorage

Năm lỗ, cả năm nằm trong hồ sơ do chính vòng này vừa viết, cả năm sửa trước cổng.
Hai lỗ nặng đổi cả THIẾT KẾ bản vá chứ không chỉ đổi lời khai.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | Không phép đo nào quan sát NHÁNH mà tệp setup thật sự chọn trên runtime đang chạy; hai phép đo đầu chỉ gọi hàm với đích giả | Điều kiện dò viết sai nên trên máy CI bản vá ĐÈ lên kho lưu thật; mọi phép đo vẫn xanh, kể cả phép đo không-hồi-quy, vì nó xanh CHÍNH VÌ đã bị đè. Cổng 1 duyệt một gói vi phạm đúng tiêu chí không-đè của nó | Tệp setup ghi một mốc quan sát được (đã vá hay chưa, kèm lý do), và thêm phép đo khai chính mốc đó | fixed — thêm tiêu chí AC-1b và phép đo E5 đo chính nhánh đã chọn, kèm khẳng định quan hệ: mốc báo chưa-vá thì kho hiện hành phải KHÁC object hàm vá tạo ra |
| P0 | evals | Phép đo không-hồi-quy chỉ có mã thoát của cả bộ, không chứng minh bốn tệp từng đỏ ĐÃ chạy lại; lệnh của nó lại trỏ một lane khác lane của các phép đo kia | Lane lọc theo mẫu không bao bốn tệp đó, hoặc chúng bị loại sau khi sửa cấu hình: lệnh chạy vài chục ca rồi thoát 0, phép đo xanh RỖNG, và tiêu chí bốn-tệp-xanh-trở-lại được ký mà chúng chưa hề chạy | Đọc SỐ CA TỪNG TỆP từ báo cáo máy-đọc-được, ghim tổng và ghim tên bốn tệp | fixed — E4 đổi sang executor script: chạy bộ test với báo cáo máy-đọc-được rồi khẳng định tổng >= 617, 0 đỏ, và từng tệp trong bốn tệp có số ca > 0; thiếu tệp nào trong báo cáo là ĐỎ |
| P1 | contract | Không tiêu chí nào canh việc bản vá rò trạng thái giữa các tệp test, dù nó chạy trong setup dùng chung | Kho lưu là singleton mức module: tệp A ghi khoá rồi không dọn, tệp B chạy sau đọc trúng trạng thái thừa và khẳng định "mặc định" trên một kho bẩn. Bộ test hết tất định, xanh hay đỏ tuỳ thứ tự | Thêm tiêu chí kho-bắt-đầu-rỗng-mỗi-tệp và phép đo hai tệp với khoá sentinel | fixed — thêm AC-5 và phép đo E6 dùng hai tệp, CẢ HAI cùng ghi và cùng kiểm để không phụ thuộc thứ tự chạy |
| P1 | evals | Phép đo chống-rò-sang-sản-phẩm là khẳng định âm tính không có đối chứng dương, và không khai bắt những dạng nhập nào | Mẫu tìm chỉ bắt một dạng nhập; số tệp quét vẫn lớn hơn 0 nhưng số khớp luôn 0, nên phép đo xanh vĩnh viễn kể cả khi một tệp sản phẩm đã nhập bản vá | Ghim đủ các dạng nhập, và bắt buộc một đối chứng dương trên fixture có nhập | fixed — E3 nay khai đủ bốn dạng nhập và bắt buộc đối chứng dương phải bắt được đúng một khớp trước khi cho kết luận sạch |
| P1 | contract | Không tiêu chí nào buộc kho lưu giả theo đúng NGỮ NGHĨA Web Storage — đây là khe để bản vá làm test xanh mà che lỗi thật của sản phẩm | Kho giả trả nguyên giá trị: sản phẩm quên chuyển chuỗi vẫn đọc lại được object nên test xanh, còn trình duyệt thật trả '[object Object]' và kho trạng thái vỡ. Tương tự khoá vắng trả undefined thay vì null làm nhánh kiểm null của sản phẩm không bao giờ chạy | Ghim ngữ nghĩa vào tiêu chí và vào lời khai: ép chuỗi, trả null, length và key đúng sau khi xoá | fixed — AC-1 nay khai ngữ nghĩa, E1 khai năm khẳng định cụ thể trong đó có ép kiểu chuỗi và null-chứ-không-undefined |
