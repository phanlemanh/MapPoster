---
slug: input-caps
at: 2026-08-18T14:25:43Z
verdict: findings
p0: 3
p1: 2
---

# Phản biện ngữ cảnh sạch — input-caps

Một agent ngữ cảnh sạch đọc đúng ba hồ sơ (hợp đồng, bộ phép đo, bài học từ
feature trước) và KHÔNG đọc mã nguồn, theo nghi thức S1#7. Cột **Xử lý** ghi
phần đối chiếu với mã thật do vòng chính làm sau đó — critic bị cấm đọc mã nên
kịch bản fail của nó là giả định, không phải quan sát.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Không tiêu chí nào ghim GIÁ TRỊ SỐ của hai trần; AC-7 chỉ đặt chặn DƯỚI cho trần biến thể, không có chặn TRÊN cho cả hai | Đặt trần highlight = 10000: cả 9 phép đo vẫn xanh (trần có thật, inclusive đúng, trên trần 0 lượt gọi mạng, hai tầng đủ) trong khi chi phí mà issue #2 mở ra để chặn vẫn còn nguyên | Hợp đồng khai số cụ thể kèm lý do, thêm phép đo đối xứng chặn trên đọc từ hằng số thật | human-gate1 — ĐỐI CHIẾU MÃ: trần thật là 32 và 24, hợp lý, nên kịch bản 10000 chưa xảy ra; lỗ hổng THƯỚC ĐO thì có thật vì không phép đo nào chặn lần đổi số sau này. Thêm tiêu chí = sửa hợp đồng và phải đo lại, nên để người quyết |
| P0 | evals | 9 phép đo tụ vào 3 lệnh; executor chỉ chấm exit code nên không gì buộc từng ca trong lời khai phải TỒN TẠI | Bộ test chỉ viết nhánh từ chối, không viết ca sát ngưỡng; lệnh vẫn xanh nên ba phép đo sát ngưỡng báo đạt dù chưa hề có ca nào | Mỗi phép đo khai bộ lọc ca riêng để exit code gắn đúng một ca, bằng chứng ghi tên và số ca đã chạy | human-gate1 — ĐỐI CHIẾU MÃ: ca sát ngưỡng CÓ thật hôm nay (đếm đúng số biến thể và số lượt gọi, mảng đúng trần trả đủ phần tử, trần biến thể không nhỏ hơn số bộ màu). Cái thiếu là ràng buộc để mai kia xoá ca đi thì có phép đo đỏ — đây là lỗ chung của cả kho, không riêng gói này |
| P0 | contract | AC-4 tuyên bộ kiểm chung là thứ cả bốn bề mặt cùng dùng, và Coverage lấy đúng câu đó làm bằng chứng đủ, nhưng không phép đo nào chứng minh quan hệ đó; AC-4 cũng thiếu tag cross-layer | Một cửa dựng schema riêng hoặc chặn ở nhánh trả sớm; phép đo vẫn xanh vì nó gọi thẳng bộ kiểm chung. Trần vắng đúng trên đường bất đồng bộ, nơi không ai ngồi chờ [async-job-queue#F1] | Đánh dấu AC-4 là cross-layer và thêm phép đo chạy cùng bảng ca qua từng cửa thật | human-gate1 — ĐỐI CHIẾU MÃ: hôm nay cả ba cửa REST lẫn công cụ MCP đều parse đúng bộ kiểm chung, nên quan hệ đang đúng; nhưng không phép đo nào canh nó, nên một lần tách schema về sau sẽ đi qua lặng lẽ |
| P1 | evals | Ma trận đối chứng âm của phép đo bất biến thiếu ô: hợp đồng đòi mỗi trần đủ hai tầng, tức 4 ô, nhưng chỉ có 3 ô trần cộng một ca khác họ; thiếu ô gỡ lớp kiểm hình dạng của biến thể | Người code bỏ lớp kiểm hình dạng cho biến thể và chỉ để lại lớp chắn trong; mọi phép đo vẫn xanh, một tầng gác đã khai biến mất mà không ai đỏ | Viết ma trận toàn phần trước, số ca bằng số ô, cộng ca khác họ tách riêng | deferred — ĐỐI CHIẾU MÃ: lớp kiểm hình dạng cho biến thể CÓ tồn tại, nên tầng gác không mất; ô kiểm thì đúng là thiếu. Bổ sung ô này phải sửa cả script đối chứng chứ không chỉ sửa lời khai, nếu không lại đúng lỗi nói quá — xếp lại cho người quyết ở cổng |
| P1 | evals | Chú thích đầu bộ phép đo tuyên chỉ dùng hai executor đã khai, trong khi phép đo bất biến trỏ vào một executor thứ ba | Người duyệt gật theo câu chú thích; đến vòng nghiệm thu runner không phân giải được executor đó, phép đo bất biến duy nhất của AC-9 rơi mất | Sửa chú thích cho khớp và bắt cổng xác nhận executor tồn tại trước khi duyệt | rejected — ĐỐI CHIẾU MÃ: executor thứ ba ĐÃ khai trong cấu hình và script đối chứng tồn tại trong workspace, nên kịch bản fail không xảy ra được. Còn lại đúng một câu chú thích viết thiếu, không đủ nặng để chặn cổng; ghi nhận tại đây |
