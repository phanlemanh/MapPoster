---
schema_version: 1
slug: lai-thu-nguoi-la-van-3
ran_at: 2026-08-19T15:02:43Z
variant: agent
chan: 3
lac: 2
kho_chiu: 5
vat: 1
chuyen_phien_nguoi: 6
---

# Ván Lái-thử Người-lạ #3 — mapposter — 2026-08-19

> **Cách đọc con số ở frontmatter.** Đó là **tổng vấp còn sống trên vật** mà ván
> này quan sát được, kể cả vấp tái xuất từ ván trước — vì `uat-session` đọc
> `chan` để quyết điều kiện «sản phẩm bấm được», và giấu bớt vấp còn sống ở đó
> là nói dối cái cổng. Con số **phát hiện MỚI** của riêng ván này nhỏ hơn:
>
> | | CHẶN | LẠC | KHÓ-CHỊU | VẶT |
> |---|---|---|---|---|
> | **MỚI** | 1 | 2 | 4 | 1 |
> | **TÁI XUẤT** (không tính là phát hiện) | 2 | 0 | 1 | 0 |
> | **Tổng còn sống = frontmatter** | 3 | 2 | 5 | 1 |

**Bậc đã chạy: B1 + B2 (biến thể agent) + B3 mở rộng sang LÀN VIDEO. KHÔNG chạy
B4** — `uat-session` và verdict là việc của người; máy tường thuật, không phán
đáng-giá.

**Điểm khác ván #1 và #2:** hai ván trước chỉ chấm được **ảnh tĩnh**. Ván này
chấm **chính các mp4 chuyển động**, gửi thẳng video cho VLM khác họ, và đặt cạnh
mỗi khẳng định thị giác một phép đo máy trên byte của tệp.

| Lượt | Biến thể | Persona | Tự chấm |
|---|---|---|---|
| A | agent | người làm nội dung du lịch, cần bộ clip đăng mạng | 2 XONG · 2 XONG MỘT PHẦN (không mục tiêu nào cạn ngân sách 12 bước) |

---

## Điều kiện vào

Suite xanh **629 pass / 17 skip** (trùng khít ván #2), exit 0. Server MCP khởi
động **15:02:43Z**, sau lần sửa mã cuối **11:53:43Z**. Vân tay cây mã trước ván
`f2b6cbc6fd19b3489a588a02a2555a27`. Lệnh và mốc giờ đầy đủ ở
[`cmds/lenh-va-moc-gio.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/lenh-va-moc-gio.md).

**Bản vá P0-1 vẫn CHƯA merge khi chạy ván.** `md5 route.ts` =
`4bb7655ec132e9e4718dad492f26b1a4`, **trùng khít** con số ván #2 ghi; toàn kho chỉ
có đúng một commit từng chạm tệp đó và nó là commit gốc. ⇒ Ván #3 **không phải**
ván đầu tiên đo bản đã vá; mọi vấp tuyến đường tái xuất **không tính là phát hiện
mới**. Chiều kỳ vọng của câu (f) được ghi **trước khi hỏi** tại
[`cmds/chieu-ky-vong-ghi-truoc.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/chieu-ky-vong-ghi-truoc.md).

---

## Nhật ký vấp

### CHẶN — 3 (1 MỚI · 2 tái xuất)

| # | Vấp gì | Bằng chứng |
|---|---|---|
| **CHẶN-1 · MỚI** | **Cổng 4180 bận ⇒ lời gọi không bao giờ được trả lời.** Sản phẩm mở cổng cố định `127.0.0.1:4180` để dựng hình (`MAPPOSTER_APP_PORT` mặc định 4180). Nếu cổng đã bận, lời gọi MCP **treo cho tới khi client tự bỏ cuộc** — không có phản hồi JSON-RPC, không có lỗi ở tầng giao thức — và tiến trình server chết vì `EADDRINUSE` **chưa bắt**. Người-lạ dính ba lần, mất ~20 phút chờ suông, và chỉ thoát ra được bằng cách tự đi giết tiến trình. | Phiên điều phối **tái hiện bằng một listener vô can giữ cổng**: lời gọi `render_map` 64×64 chạy 15:38:00Z→15:40:01Z = **121 giây**, `stdout` **rỗng hoàn toàn**, `stderr` là `throw er; // Unhandled 'error' event` + `code: 'EADDRINUSE'`. Cùng lời gọi khi cổng rảnh: 4,4 giây. |
| CHẶN-2 · *tái xuất* ([ván #2 CHẶN-4](lai-thu-nguoi-la-van-2-2026-08-19.md), P0-1) | **`mode:"walk"` và `mode:"car"` cho ra CÙNG MỘT TỆP.** Ván #2 đo được cùng `distanceKm`/`durationMin`; ván này mạnh hơn một bậc: **trùng md5 từng byte**. | Ba lần ghi vào cùng đường dẫn — đi bộ (22:06), ô tô (22:29), đi bộ (22:32) — cả ba `md5 7748da8e87a88185d190965d30e52f2a`, settle cả ba `md5 b79ac82f33c995e122b0a8c6fadfe453`. Thị giác: câu (f) → **`NO`** (hai clip không cho tuyến khác nhau), câu (b) → **`NO`** (tuyến dán nhãn đi bộ không bám lối đi bộ). |
| CHẶN-3 · *tái xuất* ([ván #2 CHẶN-1](lai-thu-nguoi-la-van-2-2026-08-19.md)) | **Ghi đè im lặng cùng đường dẫn**, báo thành công cả ba lần, không một lời cảnh báo. Người-lạ mất bản dựng 20 phút trước và chỉ phát hiện khi tự đi soi thư mục. | Ba mốc mtime khác nhau trên **một** đường dẫn; bản sao giữ riêng ở [`video/`](lai-thu-nguoi-la-van-3-2026-08-19/video/) mang hậu tố `--mt<epoch>`. |

### LẠC — 2 (cả 2 MỚI)

| # | Vấp gì | Bằng chứng |
|---|---|---|
| **LẠC-1 · MỚI** | **Thứ duy nhất người dùng phải tự chọn lại là thứ duy nhất không có danh mục.** Sản phẩm có `list_themes`, `list_formats`, `list_fonts`, `list_recipes` — **không có** tool nào liệt kê preset chuyển động. Tệ hơn: **mô tả** của `render_clip` chỉ kể **3** preset, còn **schema** có **6**. Ba preset không được kể — `follow`, `tour`, `converge` — gồm đúng cái mà recipe `route-journey` khoá cứng. Agent nào đọc mô tả (thay vì lược đồ thô) sẽ không bao giờ biết chúng tồn tại. | Mô tả: `motion: {preset: approach\|pushIn\|drift} or {script}`. Schema: `"preset":{"enum":["approach","pushIn","drift","follow","tour","converge"]}`. |
| **LẠC-2 · MỚI** | **Lối vào đúng bài lại khoá mất thứ người dùng cần.** `route-journey` là recipe mô tả chính xác việc cần làm, nhưng bảng tham số của nó không có chỗ chọn camera — chỉ `fps`, `durationSec`, và chú thích `"Ghi đè fps của preset follow"`. Muốn chọn camera thì phải bỏ recipe, quay về `render_clip` và tự dựng lại toàn bộ lời gọi. | luot-a vấp 3 |

### KHÓ-CHỊU — 5 (4 MỚI · 1 tái xuất)

| # | Vấp gì | Bằng chứng |
|---|---|---|
| **KC-1 · MỚI** | **Preset `follow` giật có chu kỳ.** Dãy sai khác giữa hai khung liên tiếp nhấp nhô đều đặn với **chu kỳ 4–5 khung (222–278 ms, ~4 Hz)**; tự tương quan tụt ở lag 2–3 rồi vọt lên **r = 0,787** ở lag 4. So sánh: `pushIn` cho tự tương quan **giảm đơn điệu** 0,947→0,191, tức trơn, không có thành phần chu kỳ. Nhịp giật còn nguyên **ở cả hai góc khung** nơi tuyến không đi qua (r = 0,719 và 0,725) ⇒ đến từ **chuyển động camera**, không phải từ nét vẽ tuyến. | [`vlm/ket-qua-video-3.7-flash.md`](lai-thu-nguoi-la-van-3-2026-08-19/vlm/ket-qua-video-3.7-flash.md) §"Phép đo MÁY"; chạy lại: `bash tools/do-nhip-chuyen-dong.sh <clip>` |
| **KC-2 · MỚI** | **`restAtSec` của `pushIn` lệch 1,75 s so với thứ nhìn thấy được.** Sản phẩm khai `restAtSec: 4.254545…` cho clip noir, nhưng chuyển động cảm nhận được **tắt từ giây 2,50** — tức **3,5 trên 6 giây là ảnh đứng yên**, quá nửa clip. Clip `follow` thì khớp (khai 4,2 · đo 4,17). | cùng nguồn KC-1 |
| **KC-3 · MỚI** | **Số kích thước sản phẩm báo về không khớp tệp nó vừa ghi.** Gọi với `format:{width:1080,height:1921}`: sản phẩm trả `"height":1921` và đặt tên tệp `…-1080x1921-…`, nhưng `ffprobe` trên chính mp4 đó cho **1080×1920**. Riêng `settle.png` đi kèm thì **đúng 1921** ⇒ video và ảnh dừng của cùng một lời gọi **lệch nhau 1 pixel**, và agent nào tin `clip.height` sẽ dựng sai khung. | `ffprobe … mapposter-ho-hoan-kiem-1080x1921-0.mp4` → `height=1920`; `… -settle.png` → `height=1921` |
| **KC-4 · MỚI** | **Tham số tên là `output` nhưng không điều khiển đầu ra.** `render_clip.output` chỉ có đúng một khoá `quality`, và `additionalProperties:false` chặn mọi cách lách. Không có `outPath`, `filename`, `outDir`, `basename`, `overwrite`. Đây là mặt "thiếu tính năng" của CHẶN-3: người dùng nhìn thấy CHẶN-3 xảy ra mà **không có nút nào để tránh**. | đọc thẳng schema từ `tools/list`; xem [`cmds/danh-muc-tool.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/danh-muc-tool.md) |
| KC-5 · *tái xuất* ([ván #2 KC-6](lai-thu-nguoi-la-van-2-2026-08-19.md)) | **Danh mục quá lớn để đọc.** `tools/list` trả **107.345 byte** cho 11 tool; riêng `render_variants` là 9.926 ký tự lược đồ, `render_map` 4.910. Bốn tool `list_*` thì chỉ 85 ký tự mỗi cái. | `wc -c` trên phản hồi ghi ra tệp |

### VẶT — 1 (MỚI)

| # | Vấp gì | Bằng chứng |
|---|---|---|
| **VẶT-1 · MỚI** | **Dòng ghi công nằm trong pixel của video.** Cả ba clip đều trả `YES` cho "trong hình có chữ không". Phiên điều phối tự nhìn khung: chữ duy nhất là dòng bắt buộc `© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre` ở đáy khung. Nó **trôi theo camera** và tầng DOM — nơi hợp đồng giao quyền sở hữu chữ — không có cách nào đặt lại hay chỉnh cỡ nó. | khung `frames/clip-walk-giua.png`, dải đáy; xem mục "Đọc đúng câu (e)" bên dưới |

---

## Làn video sâu — phần chưa ván nào làm

### Đường đã dùng: **gửi THẲNG mp4**, không tách khung

`https://openrouter.ai/api/v1/models` khai `google/gemini-3.7-flash` nhận
`["text","image","video","file","audio"]` — id tồn tại nguyên văn, không hậu tố
phiên bản. Nhưng **khai năng lực khác với chấp nhận payload**, và HTTP 200 kèm
`YES` cũng chưa chứng minh model thật sự đọc video: `YES` là câu một model đoán
mò cũng nói. Nên đường video được thử bằng một phép thăm dò **có sức phân biệt**:

| Hình dạng payload | clip ĐỘNG (đúng: YES) | clip ĐỨNG YÊN (đúng: NO) | `prompt_tokens` |
|---|---|---|---|
| `video_url` | `YES` | `NO` | 230 |
| `image_url` mime video | `YES` | `NO` | 230 |
| `file.file_data` | `YES` | `NO` | 230 |
| *(mốc nền — chỉ chữ, không đính video)* | — | `NO` | **41** |

Ba dấu hiệu cùng lúc: chênh **189 token** so với mốc chỉ-chữ, phân biệt đúng cả
hai chiều, và bản chỉ-chữ **không** mặc định `YES`. ⇒ video thật sự vào prompt.
Nguyên văn ở [`cmds/tham-do-duong-video.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/tham-do-duong-video.md).
**Không cần dùng đường dự phòng tách khung.** Khung vẫn được tách, nhưng để đo
PSNR khung-cuối với `settle.png` bằng số, không để thay video.

### Đối chứng dương của làn — đạt cả hai chiều

| Hỏi | Kỳ vọng | Trả lời |
|---|---|---|
| Khung ĐẦU vs khung CUỐI của một clip có chuyển động: "giống hệt nhau?" | `NO` | **`NO`** |
| Cùng MỘT khung đưa vào hai lần: "giống hệt nhau?" | `YES` | **`YES`** |

Lượt chạy đầu, hai câu này trả **exit 2 (không chạy được)** vì bộ chạy lấy nhầm
dòng chú thích của tệp danh sách làm tên clip. Theo nghi thức, exit 2 **không
phải NO và không phải xanh** — làn bị coi là chưa đáng tin, phải sửa rồi chạy lại
toàn bộ. Kết quả dưới đây là của lượt chạy sau khi sửa.

### Sáu câu ĐÓNG cho từng clip

| Câu | Clip walk (`follow`) | Clip car (`follow`) | Clip noir (`pushIn`) |
|---|---|---|---|
| **(a)** chuyển động camera khớp preset đã yêu cầu? | `YES` | `YES` | `YES` |
| **(b)** tuyến dán nhãn đi bộ bám lối đi bộ suốt clip? | **`NO`** | — | — |
| **(c)** có đóng băng · giật · lặp · artifact nén? | `NO` | `NO` | **`YES`** |
| **(d)** khung cuối khớp `settle.png` đi kèm? | `YES` | `YES` | `YES` |
| **(e)** nhãn chữ đọc được trong lúc chuyển động? | `NO` | `NO` | `NO` |
| **(e2)** trong hình có BẤT KỲ chữ nào? *(hợp đồng nói không)* | `YES` | `YES` | `YES` |
| **(f)** walk vs car cho tuyến KHÁC nhau? | **`NO`** (kỳ vọng ghi trước: `NO`) | | |

**Câu (a) là một kết quả âm tính cho phe tố cáo, ghi lại đúng như thế:** cả ba
clip, camera **khớp** preset đã yêu cầu. Kể cả `follow` — dù chính nó là clip có
nhịp giật đo được ở KC-1. Hai điều đó không mâu thuẫn: đi *đúng kiểu* và đi
*đều tay* là hai chuyện.

**Câu (d) có số đứng cạnh lời.** PSNR khung-cuối vs `settle.png` = **32,27 dB**
(walk), trong khi khung-ĐẦU vs cùng `settle.png` chỉ **14,32 dB**. Chênh 18 dB
giữa hai phép so trên cùng một tệp đích là thứ phân biệt "khớp, sai khác chỉ do
nén H.264" với "không khớp".

**Câu (f) trùng đúng chiều kỳ vọng đã ghi trước.** Mã chưa vá ⇒ kỳ vọng `NO` ⇒
nhận `NO`. Và ở ván này nó còn có một phép đo máy mạnh hơn cả lời VLM: **hai lần
gọi khác `mode` ghi ra hai tệp trùng md5 từng byte**. Nếu bản vá P0-1 merge, đây
là phép đo để chạy lại — kỳ vọng khi đó là `YES`.

### Đọc đúng câu (e) — chỗ dễ kết luận sai nhất

Hợp đồng `map-motion-clip` giữ bất biến **"clip không chữ"** (AC-9: *pixel video
text-free* — tầng DOM mới sở hữu chữ). Nên `NO` ở câu (e) **không phải lỗi**: nó
là bất biến đang được tôn trọng. Vì thế ván này tách thêm câu **(e2)** hỏi ngược
lại. (e2) trả `YES` ở cả ba clip, nên phiên điều phối **tự nhìn khung hình** thay
vì suy đoán: chữ duy nhất trong hình là dòng ghi công bắt buộc ở đáy khung. Một
dòng chữ thứ hai mà bản thu nhỏ thoạt nhìn có vẻ có — **đã kiểm và bác**: cắt dải
1080×200 quanh chỗ đó không có chữ nào.

⇒ Bất biến "không chữ nội dung" **đứng vững**; thứ còn lại là dòng ghi công, ghi
thành VẶT-1 chứ không phải vi phạm hợp đồng.

### Hai kết quả nghịch nhau — không chọn bên cho tiện

| | VLM nói (câu "chuyển động có không đều?") | Phép đo MAD trên byte nói |
|---|---|---|
| walk (`follow`) | `NO` — đều | có nhịp chu kỳ 4–5 khung, r = 0,787 |
| noir (`pushIn`) | `YES` — không đều | giảm đơn điệu, không chu kỳ |

Ván ghi cả hai. Phép đo MAD neo vào byte của tệp và tái lập được bằng một lệnh;
câu trả lời của VLM thì không — nhưng ván không có thẩm quyền tuyên bố cái nào
"đúng", nên câu hỏi đó đi vào «Chuyển phiên người».

---

## Không quy được cho sản phẩm

Hai thứ trông như vấp sản phẩm nhưng **đo ra là của giàn chạy**. Ghi tách bạch,
không tính vào tổng:

1. **"JSON của sản phẩm hỏng" là do CẦU NỐI cắt stdout.** Người-lạ gặp
   `jq: parse error: Unfinished string at EOF at line 2021, column 31` và hiểu là
   sản phẩm trả JSON hỏng. Đo lại: cùng lời gọi **ghi thẳng ra tệp** cho
   **107.345 byte JSON hợp lệ, đủ 11 tool**; **qua đường ống** bị cắt đúng
   **65.536 byte** và hỏng. Thủ phạm là `process.exit(0)` của `mcp-drive.mjs` cắt
   stdout bất đồng bộ khi stdout là pipe. **Sản phẩm vô can.**
2. **Tiến trình server mồ côi.** Cuối ván đếm được **73** tiến trình `stdio.ts`
   còn sống, nhiều cái có tuổi hơn 1 giờ, tức có từ trước ván. Cầu nối spawn một
   server cho mỗi lời gọi rồi thoát **mà không giết tiến trình con**. ⇒ **tần
   suất** dính bẫy cổng 4180 trong ván này là do giàn chạy. Nhưng **hành vi khi
   cổng bận** — treo không trả lời, chết vì lỗi chưa bắt — là của sản phẩm, và đã
   được tái hiện độc lập bằng một listener vô can (CHẶN-1).

---

## Chuyển phiên người

*Máy dọn bàn, người quyết. Không câu nào kèm câu trả lời gợi ý.*

1. Có đáng để một lời gọi render **từ chối ngay** khi cổng dựng hình đang bận —
   kèm câu nói rõ đang vướng gì — thay vì treo cho tới khi client bỏ cuộc, biết
   rằng từ chối sớm sẽ làm hỏng những lời gọi hiện đang "chờ lâu rồi cũng xong"?
2. Có đáng cho `render_clip` một cách đặt tên hoặc thư mục đầu ra, đổi lại là
   thêm một tham số nữa vào lược đồ vốn đã bị chê dài?
3. Có đáng dựng một `list_motions` (và sửa mô tả `render_clip` cho đủ 6 preset),
   hay chấp nhận preset chuyển động chỉ khám phá được bằng cách đọc lược đồ thô?
4. Có đáng để recipe `route-journey` nhận thêm lựa chọn camera, biết rằng điều
   làm recipe có giá trị chính là nó quyết hộ người dùng?
5. Nhịp giật chu kỳ ~4 Hz của preset `follow` — đo được trên byte nhưng VLM không
   thấy — có đáng sửa không, hay ở tốc độ phát thật thì không ai nhận ra?
6. `restAtSec` nên là thời điểm **toán học** camera về nghỉ, hay thời điểm
   **nhìn thấy được** là đã đứng yên? Hai mốc đó lệch nhau 1,75 giây ở `pushIn`,
   và mọi thứ dựng theo `restAtSec` đang tin mốc thứ nhất.

---

## Bằng chứng

- Nhật ký người-lạ nguyên văn: [`transcripts/luot-a-agent-bo-video.md`](lai-thu-nguoi-la-van-3-2026-08-19/transcripts/luot-a-agent-bo-video.md)
- Hỏi/đáp VLM nguyên văn + phép đo máy: [`vlm/ket-qua-video-3.7-flash.md`](lai-thu-nguoi-la-van-3-2026-08-19/vlm/ket-qua-video-3.7-flash.md)
- Thăm dò đường video: [`cmds/tham-do-duong-video.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/tham-do-duong-video.md)
- Chiều kỳ vọng ghi trước khi hỏi: [`cmds/chieu-ky-vong-ghi-truoc.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/chieu-ky-vong-ghi-truoc.md)
- Lệnh, mốc giờ, vân tay: [`cmds/lenh-va-moc-gio.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/lenh-va-moc-gio.md)
- Danh mục tool đo được: [`cmds/danh-muc-tool.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/danh-muc-tool.md)
- Video + settle giữ bản sao kèm md5: [`video/`](lai-thu-nguoi-la-van-3-2026-08-19/video/) · md5 in ở [`video/MD5.txt`](lai-thu-nguoi-la-van-3-2026-08-19/video/MD5.txt)
- Khung đã tách: [`frames/`](lai-thu-nguoi-la-van-3-2026-08-19/frames/)
- Bộ công cụ chạy lại toàn ván: [`tools/`](lai-thu-nguoi-la-van-3-2026-08-19/tools/)

Chạy lại làn video bằng một lệnh:

```bash
bash _acceptance/lai-thu-nguoi-la-van-3-2026-08-19/tools/chay-lan-video.sh
```

Khoá đọc từ `~/.config/acceptance-gate/openrouter.env` (ngoài mọi kho git, quyền
600). Không script nào in giá trị khoá; kết quả soát khoá trên toàn thư mục bằng
chứng ghi ở [`cmds/soat-khoa.md`](lai-thu-nguoi-la-van-3-2026-08-19/cmds/soat-khoa.md).

## Bản đồ stub theo slug

| Slug | Stub | Ván này thêm gì |
|---|---|---|
| `map-motion-clip` | [stranger-drive.md](map-motion-clip/stranger-drive.md) | **stub mới** — KC-1, KC-2, KC-3, VẶT-1, LẠC-1, LẠC-2 |
| `mcp-map-render` | [stranger-drive.md](mcp-map-render/stranger-drive.md) | cập nhật lên ván #3 — CHẶN-1, CHẶN-3, KC-4, KC-5 |
| `road-routing` | [stranger-drive.md](road-routing/stranger-drive.md) | không đổi số; thêm bằng chứng **video** cho vấp cũ |
| `routes-measurements` | [stranger-drive.md](routes-measurements/stranger-drive.md) | không đổi số; thêm bằng chứng md5 trùng byte |

## Sai lệch nghi thức đã khai

1. **Ngữ-cảnh-trắng đạt bằng chỉ thị, không bằng cấu trúc.** Subagent kế thừa cwd
   của phiên điều phối. Người-lạ tự khai không đọc mã (mục "Phá rào" của
   transcript), nhưng có **đụng vào tiến trình hệ thống** (`lsof`, `ps`, `kill -9`)
   và **liệt kê thư mục kết xuất** để thoát bẫy cổng 4180 và kiểm chuyện ghi đè.
   Phiên điều phối xét: không có tri thức nội bộ nào lấy thêm từ đó, và cả hai
   hành động đều là thứ một người dùng thật sự sẽ làm khi bị treo 10 phút.
2. **Cầu nối của ván nới trần chờ** từ 120 s cố định lên `MCP_DRIVE_TIMEOUT_MS`
   (mặc định 600 s). Chỉ chạm cầu nối, không chạm sản phẩm. Lý do ở
   `cmds/lenh-va-moc-gio.md`.
3. **Cây git không sạch tuyệt đối** khi vào ván: 2 tệp chưa commit thuộc
   `_acceptance/area-overview-default/` (hồ sơ, không phải mã) — đúng tình trạng
   ván #2 đã vào.
4. **Chỉ chạy MỘT lượt người-lạ** (biến thể agent). Ván #2 chạy ba lượt gồm cả
   biến thể UI. Ván này dồn ngân sách vào chiều sâu của làn video thay vì bề rộng
   persona, nên **không có dữ liệu mới nào về bề mặt web app**.
5. **Đối chứng dương của làn video hỏng ở lượt chạy đầu** (exit 2 do lỗi dựng bộ
   chạy, không phải do model). Đã sửa và chạy lại toàn làn; kết quả công bố là
   của lượt sau.
