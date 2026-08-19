---
slug: area-overview-default
at: 2026-08-19T10:49:06Z
verdict: findings
p0: 1
p1: 2
p2: 1
---

# Phản biện ngữ cảnh sạch — area-overview-default

Cả bốn lỗ đều nhắm vào bộ phép đo do chính vòng này vừa viết, và cả bốn đều sửa
được ngay trước cổng — không mục nào phải đẩy lên người quyết.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | E1 và E2 hứa hành vi ở tầng giải cấu hình nhưng chạy trong làn test tầng công thức; không gì buộc ca test thật sự đi qua đường đó | Ca test chỉ soi đối tượng compile rồi xanh; sau này ai nới điều kiện đọc biến môi trường ở tầng dưới thì chiều tường minh im lặng rơi về nền sai, mà người duyệt đã ký tin rằng bất biến kế thừa được canh | Ghim tên hàm thật sự được gọi vào lời khai, bắt ca test xoá biến rồi gọi đúng đường đó | fixed — lời khai của E1/E2 nay bắt GỌI THẬT hàm giải cấu hình trên chính đối tượng compile, và ghi rõ số khẳng định |
| P1 | evals | E2 là khẳng định âm tính không có đối chứng dương: không phép đo nào chứng minh chiều tường minh ĐƯỢC cho qua khi biến môi trường CÓ mặt | Một bản vá từ chối nền vệ tinh vô điều kiện vẫn xanh hết: mặc định vẫn ra vector, chiều âm vẫn ném đúng chuỗi. Triển khai có cấu hình ảnh thì hỏng hẳn chiều tường minh, và điều kiện trả lại mặc định thành bất khả thi | Thêm ca đặt biến rồi gọi tường minh, khẳng định không ném và nền ra đúng | fixed — E2 nay là cặp hai chiều trên cùng fixture, khai rõ cả hai vế |
| P1 | evals | E3 đo chuỗi vắng mặt nên xanh-rỗng khi khoá hỏng, và đo hằng số nội bộ thay vì payload mà agent thật sự đọc | Ca test tra công thức bằng khoá rồi lấy mô tả với toán tử mặc-định-rỗng; đổi tên khoá là chuỗi tra ra rỗng, chiều âm xanh tự động, còn danh mục thật vẫn khai mặc định cũ | Khẳng định mục tồn tại và mô tả khác rỗng TRƯỚC, rồi mới xét hai chiều; chiều dương ghim quan hệ chứ không ghim sự có mặt | fixed — E3 nay đo trên payload thật, có chốt tồn-tại-và-khác-rỗng đứng trước, và chiều dương đòi hai chuỗi trong CÙNG một trường |
| P2 | evals | E4 khai ma trận bằng SỐ LƯỢNG chứ không liệt kê tên, và không chốt tổng số công thức | Bộ test lọc động; một công thức rơi khỏi danh mục thì vòng lặp ngắn đi, số khẳng định vẫn bằng số phần tử nên vẫn xanh, hồi quy im lặng đi qua | Liệt kê nguyên văn bảy tên và chốt tổng bằng tám trước khi lặp | fixed — E4 nay liệt kê đủ bảy tên và chốt tổng số công thức bằng 8 |
