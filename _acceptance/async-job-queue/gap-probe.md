---
slug: async-job-queue
at: 2026-08-05T00:00:00Z
verdict: findings
p0: 2
p1: 2
p2: 1
---

# Phản biện context sạch — async-job-queue

Một agent ngữ cảnh sạch, chỉ đọc 5 file (design · contract · evals · sổ quyết định ·
bài học từ feature trước), CẤM đọc mã nguồn. Cả năm phát hiện đều được nhận và sửa
ngay trong artifact — không có finding nào bị đẩy sang Gate 1 cho người xử.

## Findings

| Sev | Artifact | Thiếu gì | Kịch bản fail | Thước đo | Xử lý |
|---|---|---|---|---|---|
| P0 | contract | Cross-cutting tự khai "hai cửa mới dùng lại nguyên bộ guard của /render — phải chứng minh chứ không giả định" nhưng KHÔNG AC nào và KHÔNG eval nào chạm tới. Design §5.1 có ô 401 mà contract bỏ rơi | Người code đăng ký hai cửa mới ở nhánh trả sớm, TRƯỚC chuỗi guard thẻ mang tên. Toàn bộ eval vẫn xanh vì mọi ca đều gửi thẻ hợp lệ. Production mở một cửa không cần thẻ — ai cũng nhét được 50 việc clip vào instance 2 GB dùng chung với Chromium | Chạy CÙNG một bảng ca guard lên cả ba cửa: không thẻ và thẻ sai đều 401 và sổ việc không tăng; thân vượt trần bị chặn trước khi tạo việc | `fixed:` thêm **AC-13** + eval **E18** (job_http) chạy CÙNG bảng ca guard trên cả ba cửa, và assert sổ việc không tăng sau mỗi ca bị chặn |
| P0 | evals | AC-5 đi xuyên ba lớp (thợ ghi đĩa → sổ giữ đường dẫn → HTTP đọc lên) nhưng chỉ có MỘT eval ở tầng http, và chính lời văn của nó là "test ghi tệp rồi so" — tệp do test tự đặt, không phải do thợ ghi | Thợ ghi một đường dẫn, sổ lưu một đường dẫn khác; hoặc lệnh ghi chưa được chờ xong đã lật trạng thái sang xong. Eval vẫn xanh vì tệp là của test. Mọi việc thật trả 200 done với nội dung rỗng. Đúng lớp lỗi seam-không-ai-chạy ở [d-20260709T230203Z-24313] | Eval ở đúng mối nối: thư mục tạm thật, render giả ghi byte thật, đi qua thợ rồi hỏi qua cửa; assert base64 giải mã ra ĐÚNG byte thợ đã ghi và tệp nằm đúng đường dẫn trong bản ghi | `fixed:` viết lại **E6** thành eval end-to-end trên thư mục tạm thật, render giả ghi byte thật, đi qua thợ; thêm **E7** (job_runner, layer backend-effect) khoá seam đường-dẫn-ghi ↔ đường-dẫn-lưu và thứ tự ghi-xong-mới-lật-trạng-thái. Hai eval đi CẶP cho AC-5 |
| P1 | design | Không đơn vị nào được giao việc xoá tệp. Design khai sổ việc "thuần dữ liệu, không phụ thuộc gì" trong khi AC-12 lại bắt chính sổ việc chứng minh tệp bị xoá | Người duyệt gật cả hai câu mâu thuẫn. Người code tôn trọng ranh giới: sổ chỉ bỏ bản ghi, không ai xoá tệp — nửa "hỏi lại trả 404" vẫn xanh trong khi clip hàng chục MB tích tới đầy đĩa. Lối còn lại là sổ việc phải import fs, phá đúng ranh giới khiến nó test được không cần trình duyệt | Nêu đích danh đơn vị sở hữu việc dọn; eval chạy trên thư mục tạm thật, assert đủ ba vế từ đơn vị sở hữu | `fixed:` design §3.1 và §6 giao việc dọn tệp cho **thợ** (sổ chỉ phát danh sách hết hạn, không bao giờ import fs); AC-12 nêu đích danh chủ sở hữu; **E16** (job_runner) đo vế tệp trên thư mục tạm thật, **E17** (job_store) đo vế bản ghi và khoá luôn điều kiện sổ-không-chạm-đĩa |
| P1 | contract | Trục "Áp lực tài nguyên" có giá trị "quá tải kéo dài đến hết giờ chờ" mà KHÔNG AC nào phủ. Lối lấy-có-chờ mới không khai hạn chờ tối đa; §6 chỉ nói hết giờ chờ của HỒ TRÌNH DUYỆT | Một slot rò hoặc hồ nghẽn, việc clip nằm trong hàng chờ vô hạn, không bao giờ thành hỏng. Người gọi hỏi mãi thấy đang chờ, quá cả hạn giữ. AC-10 chỉ đo "slot được trả trên mọi lối ra"; AC-11 chỉ bắt việc NÉM lỗi, không bắt việc TREO. Chính CE của trục này là commit b5f6e77, và [d-20260709T230203Z-20509] đã từng phải thêm timeout cho idle-wait | Chờ slot quá trần cấu hình thì việc thành hỏng vì máy chủ, không im lặng thử lại. Eval với đồng hồ giả: giữ chặt slot không trả, người chờ phải hỏng trong trần và nhả chỗ trong hàng | `fixed:` thêm **AC-14** + núm thứ tư `MAPPOSTER_JOB_SLOT_WAIT_MS` (mặc định 10 phút) + eval **E19** (motion_compiler, đồng hồ giả) |
| P2 | evals | Cross-cutting "tên địa danh tiếng Việt có dấu đi xuyên sổ việc và tên tệp" khai là áp lên MỌI ô Core nhưng không eval nào có fixture chữ có dấu | Tên có dấu vào tên tệp; bản ghi giữ dạng chuẩn hoá này còn tệp trên đĩa ở dạng kia, nên đối chiếu đường dẫn lúc dọn không bao giờ khớp — tệp sống sót vĩnh viễn trong khi eval vẫn xanh vì fixture toàn ASCII. Repo đã dính đúng lớp lỗi đa byte tiếng Việt một lần ở [d-20260710T001914Z-18074] | Đưa một tên địa danh có dấu vào fixture của các eval đi qua tên tệp; assert tên giữ nguyên từng ký tự qua vòng sổ, và phép dọn thực sự xoá được tệp tạo dưới tên đó | `fixed:` gắn yêu cầu fixture tên địa danh có dấu vào expected của **E1** (đi qua sổ), **E6** (đi qua phản hồi), **E16** (đi qua tên tệp lúc dọn) |

## Ghi chú vận hành

`claim-scan` bỏ qua 16 dòng hỏng trong `_acceptance/mcp-map-render/decisions.jsonl` — sổ
của feature CŨ, không ảnh hưởng feature này, nhưng là nợ nên dọn khi có dịp.
