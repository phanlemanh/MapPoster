# Lượt A — người-lạ biến thể AGENT, mục tiêu "bộ video đa dạng"

Phiên fresh, không được cấp đường dẫn kho trong đề bài, chỉ được cấp nguyên văn
hai lệnh cầu nối. Dưới đây là **bản giao nguyên văn** của phiên người-lạ; phiên
điều phối không sửa chữ nào. Phần đo lại và phần quy kết nằm ở hồ sơ tổng.

---

## Tự chấm

| Mục tiêu | Kết quả | Số bước đã tiêu (lần gọi cầu nối) |
|---|---|---|
| 1. Clip ĐI BỘ Hồ Hoàn Kiếm → Nhà hát Lớn | XONG MỘT PHẦN | 6 / 12 |
| 2. Clip ĐI Ô TÔ cùng hai điểm đó | XONG MỘT PHẦN | 4 / 12 |
| 3. Clip Chùa Một Cột tông tối/đen | XONG | 3 / 12 |
| 4. Poster tĩnh Hồ Tây khổ dọc để in | XONG | 3 / 12 |

Lý do hai mục tiêu đầu chỉ là "XONG MỘT PHẦN" (chi tiết ở Nhật ký vấp #5 và #6):
tệp có thật, đường dẫn có thật, nhưng (a) tệp của mục tiêu 2 đã **ghi đè** tệp
của mục tiêu 1 vì hai lời gọi sinh ra **đúng cùng một tên tệp**, tôi phải lách
bằng cách đổi kích thước 1 pixel để có hai tệp cùng tồn tại; và (b) hai clip đó
**giống hệt nhau đến từng byte** khi cùng kích thước — chọn `mode: walk` hay
`mode: car` không làm đổi gì trong tuyến vẽ ra, nên thứ tôi cầm về không phải là
"hai chuyến đi khác nhau để đặt cạnh nhau" như tôi muốn.

---

## Tệp đã sinh

| Mục tiêu | Đường dẫn tệp (nguyên văn sản phẩm trả về) | Tool đã gọi | JSON tham số của lời gọi thành công | Số liệu sản phẩm tự báo (nguyên văn) |
|---|---|---|---|---|
| 1 (đi bộ) | `_render-out/mapposter-ho-hoan-kiem-1080x1920-0.mp4`<br>ảnh dừng: `…-1080x1920-0-settle.png` | `render_clip` | `{"location":"Hồ Hoàn Kiếm, Hà Nội","routes":[{"route":{"from":"Hồ Hoàn Kiếm, Hà Nội","to":"Nhà hát Lớn Hà Nội","mode":"walk"},"color":"#ff5a3c","width":8}],"camera":{"focus":{"kind":"route","index":0,"paddingPct":18}},"motion":{"preset":"follow","durationSec":6},"format":"tiktok","delivery":"url"}` | `"clip":{"bytes":4620903,"durationSec":6,"fps":18,"width":1080,"height":1920}`; `"cost":{"frames":108,"renderMs":36752,"encodeMs":876}`; `"routes":[{"bbox":[105.851164,21.023617,105.858323,21.028878],"lengthKm":1.2129122069205458,"pointCount":50,"distanceKm":1.2118,"durationMin":2.5233333333333334,"provider":"osrm/foot"}]`; `"motion":{"preset":"follow","restAtSec":4.2}`; `"theme":"midnight-blue"` |
| 2 (ô tô) | `_render-out/mapposter-ho-hoan-kiem-1080x1921-0.mp4` | `render_clip` | `{…"mode":"car"…,"motion":{"preset":"follow","durationSec":6},"format":{"width":1080,"height":1921},"delivery":"url"}` | `"clip":{"bytes":4747359,"durationSec":6,"fps":18,"width":1080,"height":1921}`; `"cost":{"frames":108,"renderMs":36310,"encodeMs":943}`; `"routes":[{… y hệt bản đi bộ …,"provider":"osrm/driving"}]` |
| 2 (bản gốc, đã bị ghi đè) | `_render-out/mapposter-ho-hoan-kiem-1080x1920-0.mp4` — **cùng đường dẫn với mục tiêu 1** | `render_clip` | `{…"mode":"car"…,"format":"tiktok",…}` | `"clip":{"bytes":4620903,…,"height":1920}` — **đúng bằng số byte của clip đi bộ**; `"provider":"osrm/driving"`; mọi số đo tuyến giống hệt bản đi bộ |
| 3 (Chùa Một Cột, noir) | `_render-out/mapposter-chua-mot-cot-1080x1920-0.mp4` | `render_clip` | `{"location":"Chùa Một Cột, Hà Nội","theme":"noir","highlight":{"points":[{"query":"Chùa Một Cột, Hà Nội","icon":"star","color":"#ffffff"}]},"motion":{"preset":"pushIn","durationSec":6},"format":"tiktok","delivery":"url"}` | `"clip":{"bytes":3886245,"durationSec":6,"fps":18,"width":1080,"height":1920}`; `"cost":{"frames":108,"renderMs":31269,"encodeMs":689}`; `"motion":{"preset":"pushIn","restAtSec":4.254545454545454}`; `"theme":"noir"` |
| 4 (poster Hồ Tây) | `_render-out/mapposter-ho-tay-1748x2480-0.png` | `render_map` | `{"location":"Hồ Tây, Hà Nội","format":"a3","chrome":"poster","placeName":"Hồ Tây","delivery":"url"}` | `"image":{"width":1748,"height":2480,"format":"png"}`; `"resolved":{"center":[105.8139655,21.0580419],"zoom":13.7,"theme":"midnight-blue","chrome":"poster"}`; `[cầu nối] mất 4447ms` |

**Kiểu chuyển động camera đã yêu cầu:**

- Mục tiêu 1 và 2: `motion.preset = "follow"` — chọn sau khi thấy lược đồ JSON
  của `render_clip` khai đủ 6 kiểu: `approach | pushIn | drift | follow | tour | converge`.
- Mục tiêu 3: `motion.preset = "pushIn"`.
- Tông mục tiêu 3: `theme = "noir"` (sản phẩm khai `{"id":"noir","name":"Noir","dark":true,"colors":{"background":"#0a0a0a",…}}`).

---

## Nhật ký vấp

**Vấp 1 — Danh mục công cụ dài đến mức không đọc được trong một hơi.**
Tôi định làm: xem sản phẩm có gì. Tôi gõ: `… list`. Nó trả: một khối JSON
104.9KB; khung chạy của tôi tự cắt và chỉ cho tôi xem 2KB đầu, kèm dòng
`Output too large (104.9KB). Full output saved to: …`. Trong 2KB đó tôi mới chỉ
thấy được nửa lược đồ của một tool duy nhất (`render_map`), chưa biết sản phẩm
có bao nhiêu tool. Tôi hiểu nhầm ban đầu: tưởng `list` sẽ trả một bảng ngắn kiểu
"đây là các việc tôi làm được". Hoá ra `list` trút ra toàn bộ JSON Schema thô của
mọi tool, kể cả những nhánh `anyOf` lồng bốn tầng. Người dùng mới đọc cái này
bằng mắt là không khả thi.

**Vấp 2 — Cố lọc bớt thì vỡ luôn.**
Tôi định làm: chỉ lấy tên + mô tả của từng tool. Tôi gõ:
`… list 2>/dev/null | jq -r '.tools[] | "=== " + .name + "\n" + .description'`.
Nó trả: `jq: parse error: Unfinished string at EOF at line 2021, column 31`
(thoát mã 5). Tôi hiểu nhầm: tưởng JSON của sản phẩm hỏng. Thực ra là đường ống
bị cắt giữa chừng. Phải gọi lại `list` lần nữa, lần này ghi thẳng ra tệp rồi mới
lọc, thì mới thấy đủ **11 tool**: `render_map, render_variants, render_animation,
render_clip, geocode_place, compile_motion, list_fonts, list_themes, list_formats,
list_recipes, render_recipe`. Mất 2 bước chỉ để đọc được cái mục lục.

> **Phiên điều phối đính chính (xem hồ sơ tổng, mục Không quy được cho sản phẩm):**
> vấp này **không phải của sản phẩm** — chính cầu nối cắt stdout ở 64 KiB.

**Vấp 3 — "Chuyến đi" có hai lối vào, và lối nghe hợp lý nhất lại không cho tôi chọn camera.**
Tôi định làm: tìm cách kể một chuyến đi giữa hai điểm. Tôi gõ:
`… call list_recipes '{}'`. Nó trả một công thức tên `route-journey`, mô tả
nguyên văn: `"Vẽ dần một tuyến bám đường thật từ điểm đi tới điểm đến, camera bám
theo đầu nét vẽ, dừng khi tuyến đủ."`, có tham số `mode` với chú thích
`"Phương tiện: car | moto | walk. Mặc định \"car\"."`. Nghe đúng y bài của tôi.
Nhưng bảng tham số của nó **không có chỗ chọn kiểu chuyển động camera** — chỉ có
`fps` và `durationSec`, và mô tả nói `"Ghi đè fps của preset follow"`, tức kiểu
camera bị khoá cứng ở `follow`, tôi không được chọn. Mà yêu cầu của tôi là *tự
chọn kiểu camera*. Tôi hiểu nhầm ở đây: tưởng recipe là "đường tắt của cùng một
cỗ máy nên chắc nhận thêm tham số", nhưng không. Tôi phải quay sang `render_clip`
— nơi mà tôi chỉ biết đủ 6 kiểu camera nhờ đọc lược đồ JSON thô
(`"preset":{"enum":["approach","pushIn","drift","follow","tour","converge"]}`),
**chứ không có chỗ nào trong sản phẩm nói cho tôi 6 kiểu đó bằng tiếng người** —
không có `list_motions` như có `list_themes`, `list_formats`, `list_fonts`,
`list_recipes`. Đây là chỗ vấp nặng nhất về mặt khám phá: thứ duy nhất người dùng
được yêu cầu tự chọn lại là thứ duy nhất không có tool liệt kê.

**Vấp 4 — Clip đi bộ chạy được, nhưng con số thời gian nó báo về thì tôi không hiểu nổi.**
Tôi gõ lời gọi `render_clip` cho mục tiêu 1. Chờ **45,5 giây**
(`[cầu nối] mất 45488ms`). Nó trả đường dẫn mp4 thật, kèm `"provider":"osrm/foot"`
— tức nó có nhận là tôi đi bộ. Nhưng số đo là `"distanceKm":1.2118` và
`"durationMin":2.5233333333333334`. Tôi đọc mà khựng: 1,2 km **đi bộ** trong 2
phút 31 giây là 28,8 km/h. Không ai đi bộ như vậy. Tôi hiểu nhầm ban đầu: tưởng
`durationMin` là thời lượng clip (nhưng thời lượng clip đã có riêng ở
`"durationSec":6`), rồi tưởng đơn vị là gì khác. Đến vấp 6 tôi mới hiểu chuyện gì
thật sự xảy ra.

**Vấp 5 — Clip thứ hai treo cứng 10 phút, rồi chết vì một cổng mạng.**
Tôi định làm: đúng lời gọi cũ, đổi `"mode":"walk"` thành `"mode":"car"`. Lần 1:
lệnh chạy **hết 10 phút không trả gì**, khung chạy giết nó
(`Command timed out after 10m 0s`), tệp kết quả rỗng 0 byte, tệp lỗi cũng 0 byte
— không một dòng nào giải thích. Tôi hiểu nhầm: tưởng tuyến ô tô nặng hơn nên
render lâu (nhưng tuyến đi bộ y hệt chỉ mất 45 giây). Lần 2, tôi cho chạy nền để
nó khỏi bị giết: nó chạy **đúng 10 phút 1 giây** (22:16:42 → 22:26:43) rồi chết
với thoát mã 1 và nguyên văn:

```
Emitted 'error' event on Server instance at:
    at emitErrorNT (node:net:2412:8)
  code: 'EADDRINUSE',
  errno: -48,
  syscall: 'listen',
  address: '127.0.0.1',
  port: 4180
```

Tức: sản phẩm cần mở cổng cố định **127.0.0.1:4180** để dựng hình, mà cổng đó
**vẫn đang bị chính lần render trước của tôi giữ** — tiến trình của clip mục tiêu
1 đã trả kết quả xong từ 22:06 nhưng **không nhả cổng**, vẫn còn sống lúc 22:28
(tuổi 22 phút 39 giây), kèm một tiến trình `chrome-he` bám vào nó. Hệ quả với
người dùng mới: **render clip đầu tiên xong thì mọi lời gọi sau đó treo 10 phút
rồi chết**, và thông báo duy nhất là một stack trace Node.js — không có câu nào
kiểu "đang có phiên dựng hình khác chiếm cổng 4180, chờ hoặc đóng nó". Tôi chỉ
thoát ra được bằng cách tự tay giết tiến trình rác (khai ở mục Phá rào). Sau khi
giết, đúng lời gọi đó chạy trong **42 giây**. Tổng thời gian tôi mất vì cái bẫy
này: **hơn 20 phút chờ suông**.

**Vấp 6 — Hai clip hoá ra là một: cùng tên tệp, và cùng nội dung đến từng byte.**
Khi lời gọi ô tô cuối cùng chạy được, nó trả về
`"path":"…/mapposter-ho-hoan-kiem-1080x1920-0.mp4"` — **đúng chuỗi đường dẫn mà
clip đi bộ đã trả về**. Tên tệp được đặt theo tên địa điểm + kích thước, mà tôi
cố tình giữ hai thứ đó y hệt nhau để so sánh, nên clip ô tô **ghi đè** clip đi
bộ. Không có tham số nào trong lược đồ `render_clip` cho tôi đặt tên hay thư mục
ra, và **không có một lời cảnh báo nào** rằng nó vừa xoá thứ tôi làm 20 phút
trước. Tôi kiểm lại thư mục kết xuất: chỉ còn **một** tệp
`mapposter-ho-hoan-kiem-1080x1920-0.mp4`, dấu thời gian 22:29:08 — tức bản ô tô.
Bản đi bộ 22:06 đã biến mất.

Tệ hơn, khi so số liệu hai lần gọi thì chúng trùng nhau đến mức không thể là
trùng hợp:

| | đi bộ | ô tô |
|---|---|---|
| `bytes` | 4620903 | 4620903 |
| `lengthKm` | 1.2129122069205458 | 1.2129122069205458 |
| `distanceKm` | 1.2118 | 1.2118 |
| `durationMin` | 2.5233333333333334 | 2.5233333333333334 |
| `pointCount` | 50 | 50 |
| `bbox` | [105.851164, 21.023617, 105.858323, 21.028878] | y hệt |
| `provider` | `osrm/foot` | `osrm/driving` |

Thứ duy nhất khác nhau là **chuỗi chữ `provider`**. Tệp mp4 giống nhau đến từng
byte. Nghĩa là: `mode` có được ghi vào nhãn, nhưng tuyến vẽ ra, quãng đường, và
**thời gian** thì không đổi gì cả — và điều đó giải thích luôn vấp 4:
`durationMin` 2,52 phút là con số của **ô tô**, được trả về y nguyên cho cả
chuyến đi bộ. Tôi hiểu nhầm suốt từ đầu rằng mình đang cầm hai chuyến đi khác
nhau; thật ra tôi cầm một chuyến, dán hai nhãn.

Tôi lách để ít nhất có hai tệp cùng tồn tại: render lại bản ô tô với
`"format":{"width":1080,"height":1921}` (thừa đúng 1 pixel chiều cao) để nó rơi
vào tên tệp khác, rồi render lại bản đi bộ ở `"format":"tiktok"` để khôi phục tệp
gốc. Bây giờ hai đường dẫn cùng tồn tại thật — nhưng đó là mẹo của tôi, không
phải cách sản phẩm mời tôi làm, và nội dung hai clip vẫn là một.

**Vấp 7 — Poster Hồ Tây cũng dính đúng cái bẫy cổng 4180.**
Tôi định làm: ảnh in khổ dọc. Trước đó tôi đã hỏi `list_formats`, nó trả 21 khổ,
trong đó nhóm `"category":"Print"` có `a3 (1748x2480, print 297x420 mm)`, `a4`,
`a5`, `letter` — rất rõ ràng, đây là chỗ sản phẩm nói dễ hiểu nhất trong cả
phiên. Tôi gọi `render_map` với `a3`. Lần 1: **treo đúng 10 phút rồi bị giết**,
tệp kết quả 0 byte, không một chữ giải thích — vì lúc đó cổng 4180 vẫn đang bị
clip trước chiếm. Sau khi tôi tự giết tiến trình rác, đúng lời gọi đó chạy trong
**4,4 giây** và trả ảnh 1748×2480 ngay. Chênh lệch giữa "4 giây" và "10 phút rồi
chết câm" chỉ phụ thuộc vào việc có ai đó dọn rác giúp hay không.

**Vấp 8 — `pushIn` từ chối làm việc, nhưng ít nhất nó nói rõ vì sao.**
Tôi gõ `render_clip` với
`{"location":"Chùa Một Cột, Hà Nội","theme":"noir","motion":{"preset":"pushIn","durationSec":6},…}`.
Sau 1,04 giây nó trả:

```
{"ok":false,"error":"preset pushIn needs a highlight point — it pushes into and pulses around one"}
```

Tôi hiểu nhầm: tưởng `location` đã là "điểm" rồi thì camera cứ thế đẩy vào. Hoá
ra `location` (khung ngắm) và `highlight.points` (điểm được đánh dấu) là hai thứ
tách rời, và có preset đòi cái sau. Chỗ này tôi không trách được nhiều — câu lỗi
nói đúng thứ thiếu và nói bằng tiếng người, sửa một lần là xong. Đây là câu báo
lỗi tử tế duy nhất tôi gặp trong cả phiên; ba lần treo 10 phút thì không có câu nào.

**Ghi chú thời gian chờ, gom lại:** clip đi bộ 45,5 s — clip ô tô lần 1 treo 600 s
(chết) — clip ô tô lần 2 treo 601 s (chết) — clip ô tô lần 3 42 s — poster lần 1
treo 600 s (chết) — poster lần 2 4,4 s — clip Chùa Một Cột 33,5 s (+1 s cho lần
báo lỗi). Tổng chờ vô ích: **khoảng 30 phút trên tổng ~35 phút phiên chạy.**

---

## Phá rào

Có. Khai đủ:

1. **Cắt output nhiều lần.** Dùng `| head -c 2000/3000/5000/6000/12000` và `tail -c`
   trên phản hồi của sản phẩm ở hầu hết các lần gọi. Ngoài ra ngay lần gọi `list`
   đầu tiên, **khung chạy tự cắt** và chỉ đưa 2KB đầu kèm dòng
   `Output too large (104.9KB). Full output saved to: …`.
2. **Ghi phản hồi ra tệp tạm rồi lọc bằng `jq` / `python3`.** Thứ đọc vẫn chỉ là
   chữ do sản phẩm trả về, nhưng khai vì không phải "đọc thẳng phản hồi tool".
3. **Đụng vào tiến trình hệ thống ngoài hai lệnh cầu nối.** Để thoát bẫy cổng
   4180 đã chạy `lsof -nP -iTCP:4180`, `ps -eo pid,etime,command | grep tsx`, và
   `kill -9`. Trong output `ps` có nhìn thấy **đường dẫn tiến trình**
   `mcp-server/src/stdio.ts` và `node_modules/tsx/…`, và thấy **6 tiến trình
   `stdio.ts` mồ côi khác** còn sống từ 28 phút đến 1 giờ 50 phút trước phiên.
   Không mở, không đọc nội dung tệp nào.
4. **Liệt kê thư mục kết xuất của sản phẩm** (`ls -lT … | grep -Ei "…"`) để kiểm
   chứng nghi ngờ ghi đè. Nó xác nhận nghi ngờ, và cũng vô tình cho thấy vài tệp
   cũ từ phiên khác. Không mở tệp nào.
5. **Bị hệ thống dội vào mắt danh mục tool/skill/agent của môi trường**, trong đó
   có tên `mcp__mapposter__*`. Do khung chạy tự chèn, không đi tìm, và **không**
   dùng — mọi lời gọi đều đi qua đúng lệnh cầu nối được cấp.
6. **Không đọc mã nguồn.** Không Read/Grep/Glob lên tệp nào của sản phẩm. Toàn bộ
   hiểu biết về tham số đến từ chính JSON mà `list`, `list_recipes`, `list_themes`,
   `list_formats` trả về.
