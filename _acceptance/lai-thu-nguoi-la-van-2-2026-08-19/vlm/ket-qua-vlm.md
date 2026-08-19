# Bậc B3 — khử tương quan bằng VLM KHÁC HỌ

**Mô hình dùng:** `gemini-3.5-flash` (Google) qua MCP `gemini-flash`.
Người chấm chính của ván là họ Anthropic ⇒ đây là họ thứ hai, đúng mục đích B3.

**Ghi chú về yêu cầu OpenRouter / gemini-3.7-flash:** owner yêu cầu chạy B3 trên
`google/gemini-3.7-flash` qua OpenRouter. Bộ chuyển tiếp đã cài sẵn tại
`../tools/vlm-assert.mjs`, ghim đúng slug đó (slug lấy từ chính
`https://openrouter.ai/api/v1/models`, không gõ tay). Chưa chạy được vì
`OPENROUTER_API_KEY` chưa có trên máy — kiểm bằng lệnh, kết quả `CHƯA CÓ`.
Ba đường "không chạy được" của bộ chuyển tiếp đã kiểm và đều thoát mã 2
(không xanh giả). Khi có khoá, chạy lại được toàn bộ 5 câu dưới đây bằng:

    OPENROUTER_API_KEY=… node ../tools/vlm-assert.mjs <ảnh> "<câu hỏi>"

**Đường cục bộ đã thử và BỎ:** `ollama pull qwen2.5vl:7b` gặp
`TLS handshake timeout` nhưng **vẫn thoát mã 0**; `ollama list` cho thấy không
có mô hình nào được tải. Ghi lại vì đây đúng là kiểu xanh-giả mà bậc B3 sinh ra
để chặn.

---

## Năm câu ĐÓNG, nguyên văn hỏi và nguyên văn trả lời

### Câu 1 — tuyến dán nhãn đi bộ

- **Ảnh:** `frames/frame1-tuyen-di-bo-route-journey-settle.png` (md5 `aed001de585c6e501d85ce5c3ab34593`)
- **Hỏi:** *"Answer with exactly one word, YES or NO. This map shows a highlighted route line that the product labelled as a WALKING route. Answer YES if that highlighted line runs along the main vehicle carriageways of the street network; answer NO if it runs along pedestrian-only paths, park walkways, or narrow alleys instead."*
- **Trả lời:** `YES`
- **Đọc:** họ mô hình thứ hai xác nhận bằng thị giác điều lượt B suy ra từ con số — tuyến dán nhãn đi bộ bám lòng đường ô tô.

### Câu 2 — màu nền có đúng theme đã yêu cầu trong lời gọi

- **Ảnh:** `frames/frame2-region-spotlight-midnight-blue-settle.png` (md5 `78af84bfbf8bfc18e234666dd2bcace9`)
- **Hỏi:** *"Answer with exactly one word, YES or NO. The caller explicitly requested the theme named 'midnight-blue'. Is the dominant background colour of this poster a dark navy / midnight blue?"*
- **Trả lời:** `YES`
- **Đọc:** theme được tôn trọng. Đây là kết quả ÂM TÍNH cho giả thuyết "theme bị bỏ qua" — ghi lại đúng như thế.

### Câu 3 — chữ/nhãn trên poster có đọc được ở cỡ xuất

- **Ảnh:** `frames/frame2-region-spotlight-midnight-blue-settle.png`
- **Hỏi:** *"Answer with exactly one word, YES or NO. Looking at this poster at its full export resolution, is every piece of overlaid text (place name, country, coordinates, any caption) clearly legible — meaning it is NOT overlapped by map lines and NOT too low-contrast against the background to read?"*
- **Trả lời:** `YES`
- **Đọc:** **mâu thuẫn có kiểm soát với lượt C.** Lượt C than chữ "VIỆT NAM" và dòng toạ độ chìm vào đường phố — nhưng lượt C nhìn bản dựng của **web app**, còn khung này là bản dựng của **MCP server**. Hai bề mặt khác nhau, không phủ định nhau. Phiên điều phối KHÔNG có khung web app lưu ra đĩa (Browser pane không hiển thị được trong phiên không tương tác), nên câu này CHƯA được hỏi trên bề mặt mà lượt C thật sự phàn nàn.

### Câu 4 + 5 — cặp đối chứng cho vấp ghi đè im lặng

Hai khung này là **cùng một đường dẫn tệp** `_render-out/mapposter-ho-hoan-kiem-874x1240-0.png` tại hai thời điểm, trước và sau khi render lần hai đè lên.

| Câu | Ảnh | md5 | Hỏi (giống hệt nhau) | Trả lời |
|---|---|---|---|---|
| 4 | `frames/frame3-a5-noir-sau-ghi-de.png` | `f6bf793fb0d5faf7acf8d0444a17339d` | *"Answer with exactly one word, YES or NO. Is the dominant background colour of this poster a dark navy / midnight blue (as opposed to neutral black, grey, or any other hue)?"* | `NO` |
| 5 | `frames/frame4-a5-midnight-blue-truoc-ghi-de.png` | `6241dd3a83a3b9e4110c0156f0bca498` | (nguyên văn như câu 4) | `YES` |

**Đọc:** cùng một câu hỏi, cùng một đường dẫn sản phẩm, hai câu trả lời ngược nhau
từ một họ mô hình độc lập. Đây là đối chứng dương/âm cho vấp CHẶN-1: bản
`midnight-blue` đã bị bản `noir` xoá đè, và sự thay đổi là thật ở mức thị giác
chứ không chỉ ở mức md5.
