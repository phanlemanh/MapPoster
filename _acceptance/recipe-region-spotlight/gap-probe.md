---
slug: recipe-region-spotlight
at: 2026-08-18T15:05:42Z
verdict: findings
p0: 3
p1: 3
---

# Phản biện ngữ cảnh sạch — recipe-region-spotlight

Hàng đầu tiên do VÒNG CHÍNH tìm ra khi đối chiếu bộ phép đo với cấu hình và mã
thật; critic bị cấm đọc cả hai nên không thể thấy. Năm hàng còn lại do một agent
ngữ cảnh sạch đọc bốn hồ sơ (design, hợp đồng, bộ phép đo, bài học feature
trước). Cột **Xử lý** ghi phần đối chiếu mã do vòng chính làm sau đó.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | evals | 11 trong 13 phép đo trỏ vào lệnh chạy tệp test của tầng công cụ, KHÔNG phải tệp test của tầng recipe. Chuỗi recipe xuất hiện 0 lần trong tệp mà lệnh đó chạy | Không phải giả định — ĐÃ XẢY RA: chạy lệnh đó cho 69 ca đạt, không ca nào chạm tầng recipe; 35 ca thật của tầng recipe nằm ở tệp khác, không lệnh nào của bộ đo trỏ tới. Bằng chứng đang ghi 13/13 xanh trong khi 11 phép đo đo một thứ không liên quan | Khai một executor mới trỏ đúng tệp test tầng recipe rồi trỏ 11 phép đo sang đó, và chạy lại vòng nghiệm thu | fixed — người duyệt chọn sửa trước khi duyệt: khai executor mới trỏ đúng tệp test tầng recipe (35 ca, đều đạt) và trỏ cả 11 phép đo sang đó, rồi chạy lại vòng nghiệm thu. Đây là lỗi đấu dây chứ không phải thiếu test; làn suite vẫn chạy toàn bộ nên mã không hề chạy chui, chỉ là không phép đo nào buộc vào tiêu chí |
| P0 | contract | Coverage khai trục cho-qua-đúng với override thời lượng và fps, nhưng không tiêu chí nào nói override thật sự có hiệu lực; theme cũng không xuất hiện ở tiêu chí nào | Recipe chỉ nhận vùng và tên, các tham số override bị từ chối; mọi phép đo vẫn xanh vì phía từ chối mới là thứ được đo | Thêm tiêu chí cho-qua-đúng và phép đo hành vi khẳng định giá trị override chạy tới bộ tham số compile ra | human-gate1 — ĐỐI CHIẾU MÃ: schema THẬT có nhận theme, format, fps, durationSec, và có ca test khẳng định override chạy xuống preset — nên kịch bản fail không xảy ra. Phần đúng còn lại: hợp đồng không ghim chiều cho-qua nên một lần siết schema về sau sẽ đi qua lặng lẽ |
| P0 | evals | AC-1 chốt quan hệ trùng hình dạng với lối gọi clip, nhưng lời khai của phép đo chỉ nói đủ hình dạng bằng văn xuôi, không liệt kê khoá; không phép đo nào mở tệp video hay ảnh ra xem | Lối recipe đánh rơi mốc ghim khi dựng lại kết quả trả, hoặc encoder trả tệp rỗng, mà phép đo vẫn xanh vì mọi trường vẫn có mặt | So tập khoá bằng nhau với kết quả của lối gọi clip trên cùng tham số, và mở tệp thật kiểm chữ ký định dạng, kích thước, số khung | human-gate1 — ĐỐI CHIẾU MÃ sau khi sửa đấu dây: ca test có khẳng định mốc ghim CÓ mặt (một trong hai dạng) và đường tệp kết thúc bằng đuôi phim, nhưng chạy trên bộ dựng giả nên không mở tệp thật; cũng không so bằng tập khoá với lối gọi trực tiếp. Thư mục bằng chứng CÓ một tệp phim và bốn ảnh cảnh thật, nhưng không phép đo tự động nào mở chúng ra xem |
| P1 | evals | Phép đo bất biến chỉ-đi-qua-lối-clip đo bằng chuỗi có mặt trong một tệp duy nhất, trong khi lời hứa là một quan hệ; ma trận đối chứng âm không có ô nào cho nó | Tầng recipe tách thành nhiều tệp theo lộ trình của design nên phép quét không thấy; hoặc bóc biến ra khỏi đối tượng phụ thuộc là chuỗi biến mất. Đường render thứ hai tồn tại mà phép đo vẫn xanh | Đo quan hệ bằng đối tượng phụ thuộc giả, khẳng định số lần gọi trực tiếp bằng 0; mở rộng phép quét ra cả thư mục và thêm ô đối chứng dương | deferred — ĐỐI CHIẾU MÃ: ca test có bóc comment trước khi quét (đã chống được một lớp dương tính giả) nhưng đúng là chỉ quét một tệp. Sửa cùng lượt với hàng đầu thì rẻ |
| P1 | evals | Phép đo bất biến không-chạm-đường-cấm đo mệnh đề khác mệnh đề tiêu chí phát biểu: tiêu chí nói so diff của gói, phép đo lại xét từng commit | Gói tách hai commit, một commit chạm tầng recipe và một commit chạm đường cấm; phép đo từng commit vẫn xanh trong khi diff của cả gói khác rỗng | Đo đúng vật tiêu chí nói, suy mốc gốc thay vì ghim cứng, và khẳng định số commit quét được khác 0 | rejected — ĐỐI CHIẾU MÃ: script đã tự suy mốc gốc từ commit tạo tệp, và ĐÃ có chốt chống xanh-rỗng (0 commit thì báo phép kiểm đã mù rồi thoát khác 0). Cách đo từng commit là quyết định có ghi lý do tại chỗ: gói anh em đã đổi cả hai đường cấm đúng thủ tục, đo theo diff cả kho sẽ đỏ oan |
| P1 | evals | Mười một phép đo dồn vào cùng một lệnh chấm bằng mã thoát nên không gì buộc từng ca trong lời khai phải tồn tại, nặng nhất là ca nhánh lỗi mang tên recipe | Chỉ viết ca đường hạnh phúc; lệnh vẫn thoát 0 nên phép đo báo đạt và bằng chứng ghi tiêu chí đã phủ | Ghim ca theo tên trong lệnh, hoặc bắt bằng chứng ghi tên và số ca đã chạy cho từng phép đo | deferred — ĐỐI CHIẾU MÃ: ca nhánh lỗi CÓ thật và đạt. Nhưng hàng đầu cho thấy đây không còn là rủi ro lý thuyết: dồn nhiều phép đo vào một lệnh chính là thứ giấu được việc lệnh trỏ sai tệp suốt một vòng verify |
