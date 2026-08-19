---
schema_version: 1
slug: lai-thu-nguoi-la-tong-hop
ran_at: 2026-08-19T10:40:00Z
variant: agent+ui
chan: 7
lac: 7
kho_chiu: 16
vat: 6
chuyen_phien_nguoi: 15
---

# Lái-thử Người-lạ — báo cáo hợp nhất ván #1 · #2 · #3

**Sản phẩm:** mapposter (MCP server dựng poster/video bản đồ + web app).
**Ngày:** cả ba ván chạy trong ngày 2026-08-19.
**Phạm vi:** 5 lượt người-lạ ngữ-cảnh-trắng, không lượt nào được cấp đường dẫn kho.

> **Cách đọc con số ở frontmatter.** Đây là **tổng vấp còn sống trên vật sau khi
> khử trùng giữa ba ván** — không phải tổng cộng dồn ba hồ sơ. Cộng ngang ba ván
> ra 8 + 27 + 11 = 46 dòng; sau khi gộp các dòng cùng một nguyên nhân gốc và các
> dòng ván sau xác nhận lại ván trước, còn **36 vấp phân biệt**. `uat-session`
> đọc `chan` để quyết điều kiện «sản phẩm bấm được», nên con số ở đây là số vấp
> CHẶN **chưa được vá**, kể cả vấp phát hiện từ ván #1.

**Không ván nào chạy B4.** `uat-session` và verdict là việc của người; ba ván đều
chỉ tường thuật và dồn mọi câu «đáng không?» vào mục Chuyển phiên người.

---

## 1 · Ba ván trong một bảng

| | **Ván #1** | **Ván #2** | **Ván #3** |
|---|---|---|---|
| Hồ sơ | [lai-thu-nguoi-la-2026-08-19.md](lai-thu-nguoi-la-2026-08-19.md) | [van-2](lai-thu-nguoi-la-van-2-2026-08-19.md) | [van-3](lai-thu-nguoi-la-van-3-2026-08-19.md) |
| Commit | `c4ddfcc` | `b754cac` · `7ea0f25` | `d3f0fa5` · `f891eda` |
| Bậc chạy | B1 + B2 (agent) | B1 + B2 (agent **+ UI**) + B3 ảnh tĩnh | B1 + B2 (agent) + B3 **video** |
| Số lượt người-lạ | 3 | 3 | 1 |
| Biến thể | agent | agent + **ui** | agent |
| Persona | môi giới · agent tin danh mục · người vụng | agent tin danh mục · người vụng · **môi giới pixel-only** | người làm nội dung du lịch |
| Bề mặt chạm | MCP | MCP + **web app** | MCP (làn video) |
| Khử tương quan | **không có** | `gemini-3.5-flash` + `gemini-3.7-flash`, ảnh tĩnh | `gemini-3.7-flash`, **mp4 gửi thẳng** |
| Thang phân loại | **P0/P1** (thang cũ) | CHẶN/LẠC/KHÓ-CHỊU/VẶT | CHẶN/LẠC/KHÓ-CHỊU/VẶT |
| Frontmatter máy-đọc | **KHÔNG CÓ** | có | có |
| Dòng vấp ghi được | 8 | 27 | 11 |
| Phát hiện MỚI *(sau khử trùng)* | 9 | 19 | 8 |

**Ba ván bổ sung nhau theo chiều, không lặp nhau.** Ván #1 mở đường và bắt trọn
ba lỗi nặng nhất ở tầng giao thức. Ván #2 mở **bề rộng**: thêm biến thể UI, thêm
kỷ luật md5/đối chứng dương, thêm bậc B3. Ván #3 mở **chiều sâu**: bỏ bề rộng
persona để đi hết một làn — chấm chính mp4 chuyển động, và đặt cạnh mỗi khẳng
định thị giác một phép đo máy trên byte.

---

## 2 · Trạng thái hợp nhất — 36 vấp còn sống

| Mức | Số | Trong đó phát hiện ở ván |
|---|---|---|
| **CHẶN** | 7 | #1: 4 · #2: 2 · #3: 1 |
| **LẠC** | 7 | #1: 1 · #2: 4 · #3: 2 |
| **KHÓ-CHỊU** | 16 | #1: 4 · #2: 8 · #3: 4 |
| **VẶT** | 6 | #2: 5 · #3: 1 |

**Không vấp nào trong danh sách này đã được vá.** Ba ván cách nhau vài giờ trong
cùng một ngày, và phép đo cuối cùng (hôm nay) xác nhận `route.ts` vẫn nguyên bản
gốc: `md5 4bb7655ec132e9e4718dad492f26b1a4`, chỉ **một** commit từng chạm tệp
(`338674d`, 2026-08-07). Vậy P0-1 — vấp nặng nhất, phát hiện từ ván #1 — đã sống
qua trọn ba ván.

### Chín nguyên nhân gốc đằng sau 36 vấp

Khử trùng cho thấy nhiều dòng vấp rời rạc chia chung một gốc. Sửa một gốc là tắt
nhiều dòng cùng lúc:

| Gốc | Triệu chứng đã quan sát | Ván |
|---|---|---|
| **G1** · `DEFAULT_OSRM_URL` trỏ `routed-car` dùng cho MỌI profile | tuyến đi bộ là tuyến ô tô · số liệu trùng byte · `provider:"osrm/foot"` là khẳng định sai | 1·2·3 |
| **G2** · `delivery` mặc định `inline`, không mô tả | ví dụ danh mục vỡ transport · 99,94% phản hồi là base64 · không có đường dẫn tệp để giao · đường dẫn trả về cụt gốc | 1·2 |
| **G3** · tên tệp đầu ra chỉ theo (vùng, kích thước), không có tham số đường ra | ghi đè im lặng mất bản dựng · `render_clip.output` chỉ có `quality` | 2·3 |
| **G4** · SDK lọc khoá lạ ở tầng ngoài trước khi tới chốt kiểm | gõ sai TÊN tham số bị nuốt im lặng, trong khi sai GIÁ TRỊ thì báo lỗi to | 1·2 |
| **G5** · cổng dựng hình cố định `127.0.0.1:4180`, `EADDRINUSE` chưa bắt | lời gọi treo câm không phản hồi JSON-RPC · tiến trình server chết | 3 |
| **G6** · `z.unknown().optional()` cho tham số recipe | tham số mảng hiện ra là `{}` qua MCP ⇒ 5/8 recipe không gọi tới được | 1 |
| **G7** · mô tả và lược đồ lệch nhau, thiếu danh mục | `render_clip` mô tả 3 preset nhưng schema có 6 · không có `list_motions` | 3 |
| **G8** · tên tool/recipe không khớp cách người mới đoán | `area-overview` hút người cần `region-spotlight` · `compile_motion` *đòi* motion chứ không *tạo* · `render_animation` chỉ làm radar · `list_recipes` nghe như đồ nội bộ | 1·2·3 |
| **G9** · bề mặt web không phát tín hiệu trạng thái | bấm Download không có phản hồi nào · bản đồ trắng 3 giây không chỉ báo tải | 2 |

---

## 3 · Nhật ký vấp hợp nhất

### CHẶN — 7

| # | Vấp | Gốc | Phát hiện | Xác nhận lại | Bằng chứng mạnh nhất |
|---|---|---|---|---|---|
| C1 | **`mode:"walk"` trả tuyến ô tô.** Sản phẩm trả `provider:"osrm/foot"` — một khẳng định SAI về router thật sự tính | G1 | #1 | #2, #3 | #3: ba lần gọi khác `mode` ghi ra tệp **trùng md5 từng byte** `7748da8e87a88185d190965d30e52f2a`; #1: đo hai máy chủ 45,0 vs 4,5 km/h; VLM video trả `NO` cho "tuyến bám lối đi bộ" |
| C2 | **Ghi đè im lặng, mất bản dựng trước.** Cùng vùng + cùng khổ ⇒ cùng đường dẫn; báo thành công mọi lần, không cảnh báo | G3 | #2 | #3 | #2: md5 cùng tệp đổi `6241dd3a…`→`f6bf793f…`, bản sao giữ riêng vẫn md5 cũ (đối chứng dương); VLM khác họ trả `YES`/`NO` ngược nhau cho cùng câu hỏi. #3: mất bản dựng 20 phút trước |
| C3 | **Cổng 4180 bận ⇒ lời gọi treo câm.** Không phản hồi JSON-RPC, không lỗi ở tầng giao thức; server chết vì `EADDRINUSE` chưa bắt | G5 | #3 | — | #3: tái hiện bằng listener vô can — lời gọi 64×64 chạy **121 giây**, `stdout` rỗng hoàn toàn, `stderr` là `Unhandled 'error' event` + `EADDRINUSE`; cùng lời gọi khi cổng rảnh: 4,4 giây |
| C4 | **Gõ sai TÊN tham số bị nuốt hoàn toàn im lặng** — trả về ảnh "thành công" sai nội dung. Sai GIÁ TRỊ thì báo lỗi rõ ràng | G4 | #1 | #2 | #2: `md5 5e347436…` (sai tên) **==** `5e347436…` (bỏ hẳn khoá) **≠** `9ce052ec…` (viết đúng) — đối chứng dương đạt |
| C5 | **Ví dụ mẫu của danh mục không dùng được nguyên văn.** `list_recipes` tự mô tả ví dụ là "a working example call" | G2 | #1 | #2 | #1: 4/4 ví dụ hỏng. #2: gọi lại `region-spotlight` nguyên văn → **2.934.545 byte**, trong đó **2.932.740 ký tự base64** = 99,94%, dù `clip.path` và `settle.path` đã có sẵn trong cùng phản hồi |
| C6 | **Tham số mảng không gọi tới được qua MCP.** `z.unknown().optional()` ⇒ qua MCP hiện là `{}`: không kiểu, không ràng buộc. 5/8 recipe dựa vào tham số mảng | G6 | #1 | **chưa tái kiểm** | #1: thông điệp lỗi tự mâu thuẫn — *"expected array, received string; Too big: expected string to have <=6 characters"* |
| C7 | **Bấm Download không phát tín hiệu nào** — không thông báo, không tên tệp, không đường dẫn. Người dùng không kết thúc được việc giao tệp cho khách | G9 | #2 | — | #2: PDF thật ra **CÓ** rơi xuống `~/Downloads` (1.175.113 byte, md5 `a145053d…`) mà người dùng không hề biết. Đối chứng dương e2e `mapposter.spec.ts:222` xanh ⇒ **không** kết luận PNG hỏng |

### LẠC — 7

| # | Vấp | Gốc | Phát hiện | Bằng chứng |
|---|---|---|---|---|
| L1 | **Tên tool/recipe dẫn người mới đi sai đường.** `area-overview` khớp y hệt ý định nhưng là recipe khó nhất bộ; `compile_motion` nghe như *tạo* motion, thực tế *đòi* motion; `render_animation` — tên chung chung nhất — chỉ làm hiệu ứng radar, và nó **nhận trọn `routes`, chạy 6 giây rồi mới báo vào nhầm cửa**; `list_recipes` là cửa đúng nhất nhưng tên nghe như đồ nội bộ | G8 | #1 | #2 mất 4 lượt chết mới lết tới `list_recipes` |
| L2 | **Preset chuyển động là thứ duy nhất người dùng phải tự chọn mà lại không có danh mục.** Có `list_themes`/`list_formats`/`list_fonts`/`list_recipes`, không có `list_motions`. Tệ hơn: mô tả kể **3** preset, schema có **6** — ba cái bị bỏ (`follow`, `tour`, `converge`) gồm đúng cái `route-journey` khoá cứng | G7 | #3 | mô tả `preset: approach\|pushIn\|drift` vs schema `enum:[approach,pushIn,drift,follow,tour,converge]` |
| L3 | **Lối vào đúng bài lại khoá mất thứ người dùng cần.** `route-journey` mô tả chính xác việc cần làm nhưng không có chỗ chọn camera; muốn chọn thì phải bỏ recipe, quay về `render_clip` dựng lại toàn bộ lời gọi | G7 | #3 | luot-a vấp 3 |
| L4 | **Geocode trả đúng MỘT ứng viên đã đổi cấp hành chính.** "Hoàn Kiếm, Hà Nội" → `Phường Hoàn Kiếm`; `placeRank: 12` chỉ lộ trong `resolved` của lệnh render, không có trong phản hồi geocode ⇒ không có chỗ nào để nhận ra phạm vi đã đổi. Chính ví dụ mẫu của danh mục cũng dính | — | #2 | đo lại trên vật; `candidates` có đúng 1 phần tử |
| L5 | **Danh mục không nói recipe chạy bằng công cụ nào.** Đưa khối `example` nhưng không câu nào bảo phải đưa nó cho `render_recipe` | G8 | #2 | luot-a vấp 7 |
| L6 | **Nhóm khổ giấy mơ hồ và trùng lặp.** "Khổ dọc để in" trỏ vào cả `portrait` (Social) lẫn `a3/a4/letter` (Print); `square`==`ig-square`, `story`==`ig-story`, `landscape`==`fhd` | — | #2 | luot-a vấp 10, luot-b vấp 12 |
| L7 | **Web app không làm được video.** Môi giới rê chuột đọc cả 8 biểu tượng, mở Settings, mở Layout, mở Download mới dám kết luận — 13 thao tác, «BỎ CUỘC TẠI ĐÂY» | — | #2 | luot-c mục tiêu 3 |

### KHÓ-CHỊU — 16

| # | Vấp | Gốc | Phát hiện |
|---|---|---|---|
| K1 | **99,94% phản hồi là base64 không ai xin** — kể cả khi chỉ cần video, engine vẫn kèm base64 ảnh settle | G2 | #2 |
| K2 | **`delivery` là tham số quyết định nhưng không một chữ mô tả** — chỉ enum trần `both\|url\|inline`, không nói cái nào mặc định | G2 | #2 |
| K3 | **Đường dẫn trả về cụt gốc** — `_render-out/…` tương đối với đâu? Người lái ván #1 kết thúc buổi làm việc mà không biết `_render-out` nằm ở máy nào | G2 | #1 · #2 |
| K4 | **`render_clip.output` không điều khiển đầu ra.** Chỉ có `quality`, và `additionalProperties:false` chặn mọi cách lách — không `outPath`, `filename`, `outDir`, `overwrite`. Đây là mặt "thiếu tính năng" của C2: **thấy nó xảy ra mà không có nút nào để tránh** | G3 | #3 |
| K5 | **Chỉ báo một lỗi mỗi lần** — sai hai khoá thì phải gọi hai lượt mới biết hết | — | #2 |
| K6 | **Hai giọng lỗi cạnh nhau cư xử ngược nhau.** `Unknown theme: tối` kèm đủ 13 tên hợp lệ; `Unknown format: A3 dọc` và `a4-portrait` **không kèm gì**, dù có 21 khổ. Lớp nghiệp vụ thì nói tiếng người rất tốt, lớp schema quăng Zod dump — và nó rơi đúng vào lỗi phổ biến nhất của người mới | — | #1 · #2 |
| K7 | **Danh mục quá lớn để đọc.** `tools/list` trả **107.345 byte** cho 11 tool; `render_variants` 9.926 ký tự, `render_map` >12.000 ký tự vì `anyOf` lồng ba tầng, thứ cần nhất nằm chót. Bốn tool `list_*` thì chỉ 85 ký tự mỗi cái | — | #2 · #3 |
| K8 | **Không có cách thăm dò rẻ.** Bản 64×64 vẫn 11 giây, video 55–70 giây, ba lượt `route-journey` vượt 120 giây. Ngân sách 12 lệnh, sai một nước mất nhiều | — | #2 |
| K9 | **Mặc định không khai ở đâu.** `theme`, `chrome`, `fps` phải render một lần rồi đọc ngược từ `resolved`. Tên theme không cho biết sáng hay tối; cờ `dark` chôn trong JSON | — | #1 · #2 |
| K10 | **Preset `follow` giật có chu kỳ ~4 Hz.** Sai khác giữa hai khung liên tiếp nhấp nhô đều đặn chu kỳ 4–5 khung; tự tương quan vọt lên **r = 0,787** ở lag 4, trong khi `pushIn` giảm đơn điệu 0,947→0,191. Nhịp còn nguyên ở **cả hai góc khung** nơi tuyến không đi qua (r = 0,719 và 0,725) ⇒ đến từ chuyển động camera, không từ nét vẽ tuyến | — | #3 |
| K11 | **`restAtSec` lệch 1,75 s so với thứ nhìn thấy được.** Khai `4.2545…` cho clip `pushIn` nhưng chuyển động tắt từ giây **2,50** — tức 3,5 trên 6 giây là ảnh đứng yên. Clip `follow` thì khớp (khai 4,2 · đo 4,17) | — | #3 |
| K12 | **Số kích thước báo về không khớp tệp vừa ghi.** Gọi `{width:1080,height:1921}`: sản phẩm trả `height:1921`, đặt tên tệp `…-1080x1921-…`, nhưng `ffprobe` trên chính mp4 đó cho **1080×1920** — còn `settle.png` đi kèm thì đúng 1921. Video và ảnh dừng của cùng một lời gọi **lệch nhau 1 pixel** | — | #3 |
| K13 | **`centroid` là tâm bbox, không phải trọng tâm** — người-lạ tự tính ra và bắt được | — | #1 |
| K14 | **Bản đồ trắng trơn ~3 giây, không dấu hiệu đang tải** — "tôi tưởng hỏng" | G9 | #2 |
| K15 | **Cột trái toàn biểu tượng, không một chữ** — phải rê chuột từng cái để biết tên | — | #2 |
| K16 | **Ngăn cài đặt trượt ra đè lên tấm tranh**, che mất đúng lúc cần so màu | — | #2 |

### VẶT — 6

| # | Vấp | Phát hiện |
|---|---|---|
| V1 | **Dòng ghi công nằm trong pixel của video** — `© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre` trôi theo camera; tầng DOM (nơi hợp đồng giao quyền sở hữu chữ) không có cách đặt lại hay chỉnh cỡ nó | #3 |
| V2 | Dòng bản quyền chữ cực nhỏ nhưng nằm ngay trên tranh định gửi khách | #2 |
| V3 | Gợi ý địa điểm chỉ 1 dòng, địa chỉ bị cắt cụt `…Việt N…` | #2 |
| V4 | Đổi cỡ cửa sổ sang "desktop" mà màn hình không to lên | #2 |
| V5 | `a3` cố định 1748×2480, không có nút xoay ngang/dọc | #2 |
| V6 | `render_animation` bắt khai `location` dù đã có `from`/`to` | #2 |

---

## 4 · Chuỗi bằng chứng leo thang — giá trị của việc chạy nhiều ván

Ba ván không chỉ tìm thêm vấp; chúng **làm cứng** bằng chứng cho vấp cũ. Ba ví dụ:

**C1 — tuyến đi bộ.** Ván #1 đo hai máy chủ OSRM và cho hai con số tốc độ (45,0
vs 4,5 km/h) — bằng chứng gián tiếp, dựa vào việc gọi router ngoài sản phẩm. Ván
#2 gọi qua chính sản phẩm và cho `distanceKm`/`durationMin`/`bbox` **trùng nhau
giữa các mode** — bằng chứng trực tiếp trên số liệu sản phẩm trả về. Ván #3 cho
**md5 trùng từng byte** của tệp mp4 đầu ra, cộng một họ mô hình độc lập nhìn video
và trả `NO` cho "hai clip có cho tuyến khác nhau". Ba tầng: bên ngoài → số liệu →
byte + thị giác.

**C2 — ghi đè im lặng.** Ván #2 phát hiện bằng md5 hai bản trên cùng đường dẫn,
kèm bản sao giữ riêng làm đối chứng dương, kèm hai câu VLM trả lời ngược chiều.
Ván #3 gặp lại nó **trong hoàn cảnh thật** — người-lạ mất bản dựng 20 phút và chỉ
phát hiện khi tự đi soi thư mục — rồi truy thêm K4: không có tham số nào để tránh.

**C7 — Download im lặng.** Đây là ví dụ ngược, và là ví dụ đáng giá nhất về kỷ
luật: ván #2 suýt kết luận "PNG không xuất được". Đối chứng dương từ làn e2e của
chính kho (`mapposter.spec.ts:222`, xanh) **bác bỏ** khẳng định mạnh đó, nên vấp
được ghi lại đúng mức — sản phẩm im lặng, không phải sản phẩm hỏng.

---

## 5 · Điều ba ván nói về chính bộ cổng nghiệm thu

Ván #1 đã ghi nhận định này và hai ván sau **củng cố chứ không bác**: không lỗi
nào trong 36 vấp trên bị 15 hợp đồng, hàng trăm phép đo máy, hay bốn vòng phản
biện ngữ-cảnh-sạch bắt được. Lý do chung: **mọi phép đo đều đứng bên trong biên
sản phẩm.** Phép đo gọi hàm thật thì router bị giả lập; phép đo kiểm danh mục thì
so khoá chứ không GỌI ví dụ; phép đo chấm thông điệp lỗi thì đọc chuỗi chứ không
hỏi "đọc xong có sửa được không".

Ba ván bổ sung ba lớp mù riêng biệt:

1. **Ván #1 — lớp mù giao thức.** Không phép đo nào gọi ví dụ mẫu của danh mục
   qua đúng đường mà agent đi. Eval rẻ nhất bổ sung được: gọi chính ví dụ đó và
   đỏ nếu nó không chạy. Ba trong bốn ca P0 của ván #1 sẽ đỏ ngay lượt đầu.
2. **Ván #2 — lớp mù bề mặt.** Toàn bộ vấp của lượt UI **không có slug nào để
   trú**: kho không có hồ sơ nghiệm thu nào phủ web app. Chín vấp (C7, L7, K14,
   K15, K16, V2, V3, V4 và một VẶT bị loại) chỉ sống trong hồ sơ ván.
3. **Ván #3 — lớp mù thời gian.** Mọi hợp đồng chấm **ảnh tĩnh**; không cái nào
   chấm chuyển động. Nhịp giật 4 Hz, `restAtSec` lệch 1,75 s, và video/settle lệch
   1 pixel đều nằm ngoài tầm mọi eval hiện có — và K10 còn là thứ **VLM không thấy
   nhưng phép đo byte thấy**.

---

## 6 · Không quy được cho sản phẩm

Tách bạch, **không** tính vào 36 vấp. Cả ba đều là của giàn chạy, và cả ba đều
từng bị hiểu nhầm thành lỗi sản phẩm:

| # | Hiện tượng | Đo ra là gì |
|---|---|---|
| H1 | Người-lạ ván #3 gặp `jq: parse error: Unfinished string at EOF` và hiểu là sản phẩm trả JSON hỏng | **Cầu nối** cắt stdout: ghi thẳng ra tệp cho **107.345 byte JSON hợp lệ**, qua đường ống bị cắt đúng **65.536 byte**. Thủ phạm là `process.exit(0)` của `mcp-drive.mjs`. **Sản phẩm vô can** |
| H2 | Bẫy cổng 4180 dính ba lần trong ván #3 | Cuối ván đếm được **73** tiến trình `stdio.ts` mồ côi; cầu nối spawn một server mỗi lời gọi rồi thoát mà không giết con. ⇒ **tần suất** là của giàn chạy, nhưng **hành vi khi cổng bận** (C3) là của sản phẩm, đã tái hiện độc lập bằng listener vô can |
| H3 | Lượt UI ván #2 báo "cuộn danh sách Layout treo" | Phiên điều phối gặp đúng `Screenshot timed out: the Browser pane is not displayed` khi thao tác lại — giới hạn giàn chạy không-tương-tác |

**Bài học chung:** cả ba đều là *một tầng trung gian dễ tính hơn hoặc khắt khe
hơn tầng thật*. Cùng họ với hai chuyện khác đã ghi trong ván #2: `ollama pull`
thoát mã 0 khi tải hỏng, và một deny rule viết cho `Read` chặn luôn `Write`. Đây
là lý do nghi thức buộc mọi khẳng định âm tính phải trình một đối chứng dương.

---

## 7 · Chuyển phiên người — 15 câu

*Máy dọn bàn, người quyết. Không câu nào kèm câu trả lời gợi ý.*

**Về đường ra và tệp đầu ra**

1. Có đáng để mỗi lần render ghi ra một tệp mới thay vì đè lên bản trước, đổi lại `_render-out` phình theo thời gian và cần chính sách dọn?
2. Có đáng cho `render_clip` một cách đặt tên hoặc thư mục đầu ra, đổi lại là thêm một tham số nữa vào lược đồ vốn đã bị chê dài? *(liên quan chặt với câu 1 — một câu hỏi về tự-đánh-số, một câu về người-tự-đặt)*
3. Có đáng đầu tư `delivery:"url"` thành một URL mở được thật, thay vì đường dẫn tương đối không rõ gốc?
4. Có đáng đổi mặc định `delivery` từ `inline` sang `url`, biết rằng nó phá vỡ mọi client đang dựa vào base64?

**Về đặt tên và khám phá**

5. Có đáng đổi tên `list_recipes` / `compile_motion` / `render_animation` cho khớp cách người mới đoán, biết rằng đổi tên tool là breaking change với agent đã tích hợp?
6. Có đáng dựng một `list_motions` (và sửa mô tả `render_clip` cho đủ 6 preset), hay chấp nhận preset chuyển động chỉ khám phá được bằng cách đọc lược đồ thô?
7. Có đáng để recipe `route-journey` nhận thêm lựa chọn camera, biết rằng điều làm recipe có giá trị chính là nó quyết hộ người dùng?
8. Có đáng đổi tên `area-overview` không?

**Về nghiêm khắc đầu vào**

9. Có đáng chặn cứng khoá lạ ở tầng ngoài cùng thay vì để SDK lọc im lặng, biết rằng nó sẽ làm hỏng những lời gọi cũ hiện đang "chạy được"?
10. Có đáng bắt `geocode_place` trả nhiều ứng viên kèm cấp hành chính, đổi lại mỗi lượt gọi tốn thêm một bước chọn?

**Về hành vi khi hỏng**

11. Có đáng để một lời gọi render **từ chối ngay** khi cổng dựng hình đang bận — kèm câu nói rõ đang vướng gì — thay vì treo cho tới khi client bỏ cuộc, biết rằng từ chối sớm sẽ làm hỏng những lời gọi hiện đang "chờ lâu rồi cũng xong"?
12. Có đáng làm nút Download báo trạng thái (đang xuất · xong · tên tệp), hay chấp nhận để người dùng tự mở thư mục Downloads?

**Về chuyển động**

13. Nhịp giật chu kỳ ~4 Hz của preset `follow` — đo được trên byte nhưng VLM không thấy — có đáng sửa không, hay ở tốc độ phát thật thì không ai nhận ra?
14. `restAtSec` nên là thời điểm **toán học** camera về nghỉ, hay thời điểm **nhìn thấy được** là đã đứng yên? Hai mốc lệch nhau 1,75 giây ở `pushIn`, và mọi thứ dựng theo `restAtSec` đang tin mốc thứ nhất.

**Về phạm vi sản phẩm**

15. Có đáng để web app và MCP server hội tụ về cùng một bộ năng lực, hay chấp nhận web chỉ làm poster còn video chỉ có ở MCP?

---

## 8 · Ma trận slug × ván

| Slug | Ván #1 | Ván #2 | Ván #3 | Stub hiện có |
|---|---|---|---|---|
| `road-routing` | P0-1 | CHẶN-4 | CHẶN-2 (+ bằng chứng video) | [có](road-routing/stranger-drive.md) |
| `routes-measurements` | — | CHẶN-4 | CHẶN-2 (+ md5 trùng byte) | [có](routes-measurements/stranger-drive.md) |
| `mcp-map-render` | P1-5 | CHẶN-1, KC-2/3/5/6, LẠC-4 | CHẶN-1, CHẶN-3, KC-4, KC-5 | [có](mcp-map-render/stranger-drive.md) |
| `recipe-region-spotlight` | P0-2 | KC-1, LẠC-2 | — | [có](recipe-region-spotlight/stranger-drive.md) |
| `tier0-agent-params` | P1-4 | CHẶN-5 | — | [có](tier0-agent-params/stranger-drive.md) |
| `map-motion-clip` | — | — | KC-1/2/3, VẶT-1, LẠC-1/2 | [có](map-motion-clip/stranger-drive.md) |
| **web app** | — | **9 vấp** | — | **KHÔNG CÓ SLUG NÀO** |
| **recipe params (mảng)** | **P0-3** | — | — | **KHÔNG CÓ STUB** |

Hai dòng cuối là **nợ vùng phủ**, không phải thiếu sót của ván: kho chưa có hồ sơ
nghiệm thu nào phủ bề mặt web, và C6 (tham số mảng) chưa được ván nào sau #1 tái
kiểm nên chưa có stub.

---

## 9 · Sai lệch nghi thức tích luỹ

Gộp phần tự khai của cả ba ván, để ván #4 không lặp:

| # | Sai lệch | Ván | Trạng thái |
|---|---|---|---|
| S1 | **Ngữ-cảnh-trắng đạt bằng chỉ thị, không bằng cấu trúc.** Subagent kế thừa cwd của phiên điều phối nên về kỹ thuật có thể lần ra kho | 1·2·3 | tồn tại; cả 5 lượt đều tự khai, phần tự khai đã được xét và chấp nhận |
| S2 | **Ván #1 không có frontmatter máy-đọc** ⇒ `uat-session` §0 không đọc được `chan`/`slug`/`ran_at` của nó | 1 | **chưa vá** |
| S3 | **Ván #1 dùng thang P0/P1** thay vì CHẶN/LẠC/KHÓ-CHỊU/VẶT | 1 | đã quy đổi trong báo cáo này |
| S4 | **Cây git không sạch tuyệt đối** khi vào ván: 2 tệp chưa commit thuộc `_acceptance/area-overview-default/` | 2·3 | vẫn còn (`card.html` sửa, `evidence-page.html` chưa theo dõi) |
| S5 | **Playwright `--isolated --caps=vision` không dựng được**; Playwright qua gateway đòi `ref` từ `browser_snapshot` — đúng thứ bị cấm. Làn UI chạy bằng bộ điều khiển theo toạ độ, vẫn pixel-only nhưng **không ghi được khung ra đĩa** | 2 | tồn tại |
| S6 | **Deny rule đặt sai** (`"Read"` trần) chặn luôn `Write` toàn phiên; ba người-lạ không tự lưu được nhật ký | 2 | đã ghi thành bài học; luật đúng là chỉ deny công cụ DOM cụ thể |
| S7 | **Cầu nối nới trần chờ** từ 120 s lên `MCP_DRIVE_TIMEOUT_MS` (mặc định 600 s). Chỉ chạm cầu nối, không chạm sản phẩm | 3 | có chủ đích |
| S8 | **Ván #3 chỉ chạy MỘT lượt**, dồn ngân sách vào chiều sâu làn video ⇒ **không dữ liệu mới nào về bề mặt web** | 3 | có chủ đích |
| S9 | **Đối chứng dương của làn video hỏng ở lượt chạy đầu** (exit 2 do lỗi dựng bộ chạy). Đã sửa và chạy lại toàn làn | 3 | đã xử lý đúng nghi thức |
| S10 | **Ván #2 ghi sai mtime `route.ts`** là 2026-08-18; đo lại là **2026-08-07 19:26**, chỉ một commit `338674d` từng chạm tệp. md5 và kết luận không đổi | 2 | **đã sửa trong commit này** |

---

## 10 · Việc mở còn treo

**Phép đo để chạy lại NGAY khi bản vá P0-1 merge** (kỳ vọng đã ghi trước, nên
không thể vẽ lại chiều sau khi thấy kết quả):

- Gọi cùng một cặp toạ độ hai lần, `mode:"walk"` và `mode:"car"` ⇒ hai tệp phải **khác** md5. Hiện cả ba lần đều `7748da8e87a88185d190965d30e52f2a`.
- Câu VLM (f) "hai clip có cho tuyến khác nhau?" ⇒ kỳ vọng đổi từ `NO` sang **`YES`**.
- Câu VLM (b) "tuyến dán nhãn đi bộ có bám lối đi bộ?" ⇒ kỳ vọng đổi từ `NO` sang **`YES`**.
- Chạy lại bằng: `bash _acceptance/lai-thu-nguoi-la-van-3-2026-08-19/tools/chay-lan-video.sh`

**Chưa tái kiểm:** C6 (tham số mảng `z.unknown()`) — phát hiện ở ván #1, không ván
nào sau đó gọi lại. Đây là vấp CHẶN duy nhất trong danh sách chỉ có một nguồn.

**Nợ vùng phủ:** bề mặt web app không có slug nghiệm thu nào; 9 vấp của lượt UI
chỉ sống trong hồ sơ ván #2.

---

## 11 · Bằng chứng gốc

| Ván | Hồ sơ | Thư mục bằng chứng |
|---|---|---|
| #1 | [lai-thu-nguoi-la-2026-08-19.md](lai-thu-nguoi-la-2026-08-19.md) | *(không có — ván #1 không lưu bằng chứng thô)* |
| #2 | [lai-thu-nguoi-la-van-2-2026-08-19.md](lai-thu-nguoi-la-van-2-2026-08-19.md) | [transcripts · frames · vlm · cmds · tools](lai-thu-nguoi-la-van-2-2026-08-19/) |
| #3 | [lai-thu-nguoi-la-van-3-2026-08-19.md](lai-thu-nguoi-la-van-3-2026-08-19.md) | [transcripts · frames · video · vlm · cmds · tools](lai-thu-nguoi-la-van-3-2026-08-19/) |

Nghi thức chuẩn: `acceptance-gate-kit/docs/lai-thu-nguoi-la.md`.
Khuôn nhật-ký-vấp: `skills/acceptance/references/stranger-drive-template.md`.
