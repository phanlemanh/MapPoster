# Rà soát nguyên lý gốc — mapposter, từ 36 triệu chứng về 6 bất biến

*Phiên 2026-08-19, sau ba ván lái-thử. Khác với hồ sơ ván (tường thuật, không
phán), tài liệu này là PHÂN TÍCH KỸ THUẬT theo yêu cầu owner: quy các vấp về
thành phần cơ bản, tìm nguyên nhân thay vì triệu chứng, xếp ưu tiên. Mỗi cơ chế
nêu ở đây đều đã xác minh trong mã (file:dòng) hoặc bằng phép đo của ván —
không suy đoán trần.*

---

## 1 · Mô hình gốc: mapposter là gì khi bóc hết lớp

Một hàm `ý định → tạo tác`, đi qua đúng năm thành phần cơ bản:

| Thành phần | Nhiệm vụ | Câu hỏi bất biến của nó |
|---|---|---|
| **Hợp đồng** (catalog, schema, mô tả, ví dụ) | cho người/agent biết gọi gì, gọi thế nào | thứ khai ra có đúng thứ mã làm không? |
| **Phân giải** (geocode, route, mặc định) | biến chữ mơ hồ thành toạ độ/tuyến/cấu hình cụ thể | chỗ nào hệ TỰ QUYẾT thay người dùng, có tiếng không? |
| **Dựng** (render, encode) | cảnh → pixel/khung hình | tất định không, và số đo có từ vật không? |
| **Giao** (tệp, đường dẫn, base64) | đưa tạo tác vào tay người gọi | tạo tác có danh tính bền và địa chỉ mở được không? |
| **Lời khai** (response, lỗi, trạng thái) | kể lại việc đã làm | kể từ VẬT hay vọng lại từ Ý ĐỊNH? |

36 vấp của ba ván không phải 36 lỗi. Chúng là **6 bất biến bị vi phạm**, mỗi bất
biến vỡ ở một thành phần, và mỗi lần vỡ phun ra nhiều triệu chứng ở nhiều bề mặt.

---

## 2 · Sáu bất biến, xếp theo ưu tiên

Thứ tự xếp theo `loại hại × bề rộng triệu chứng × nguy cơ tái phát khi thêm tính
năng mới`. Loại hại xếp: *sai-mà-tưởng-đúng* > *mất-không-đảo-được* >
*không-vào-được-cửa* > *treo/im-lặng* > *tốn công*.

---

### ƯU TIÊN 1 · I1 — Sự thật chảy từ VẬT, không từ Ý ĐỊNH

**Phát biểu:** mọi trường trong phản hồi phải suy ra từ việc đã thật sự xảy ra
(endpoint đã thật sự gọi, byte đã thật sự ghi, chuyển động đã thật sự nhìn thấy) —
không bao giờ là tiếng vọng của tham số yêu cầu.

**Ba cơ chế vi phạm đã xác minh — cùng một hình dạng:**

1. `route.ts:54` — một `DEFAULT_OSRM_URL` (`routed-car`) cho MỌI profile;
   `route.ts:195` dán nhãn `provider: "osrm/${profile}"` từ **profile được yêu
   cầu**, trong khi server `routed-car` lờ chữ `foot` trong đường dẫn. Nhãn kể ý
   định, không kể việc làm. → C1, vấp nặng nhất cả ba ván, sống 12 ngày qua 15
   hợp đồng.
2. `encodeAnimation.ts:93` — `scale=trunc(iw/2)*2:trunc(ih/2)*2` (yuv420p đòi
   kích thước chẵn): mp4 thật là 1080×**1920**, nhưng phản hồi và tên tệp kể
   **1921** từ config. Ảnh settle không qua encoder nên giữ 1921 → video lệch
   ảnh dừng 1 pixel trong CÙNG một lời gọi. → K12.
3. `restAtSec` kể mốc **toán học** của script; mắt (và VLM) thấy chuyển động tắt
   sớm hơn 1,75 s ở `pushIn`. Lời khai đúng công thức, sai hiện tượng. → K11.

**Hướng sửa ở gốc (không phải vá từng nhãn):**
- Cấu hình router **theo profile** (`routed-car`/`routed-bike`/`routed-foot`),
  và `provider` suy từ **endpoint đã gọi** — không tồn tại đường nào để nhãn nói
  một đằng máy chủ một nẻo.
- Sau encode, **đo lại vật** (ffprobe/parse header — `delivery.ts:15` đã làm
  đúng thế cho PNG bằng `pngSize(buf)`; áp cùng kỷ luật cho mp4) rồi mới điền
  `clip.width/height`. Nếu encoder buộc đổi kích thước: hoặc từ chối khổ lẻ ngay
  từ biên (I2), hoặc khai rõ `requested` vs `actual`.
- `restAtSec` đổi định nghĩa hoặc thêm trường: mốc đo từ script đã compile
  (khung cuối có sai khác trên ngưỡng), không phải mốc lý thuyết.

**Răng để ghim:** eval bất biến "mọi số đo trong phản hồi khớp `ffprobe`/header
của chính tệp trả về" + eval so `provider` với host đã gọi (mock ở tầng HTTP,
không mock router).

**Tình huống tương lai nó phòng:** thêm basemap vệ tinh có fallback — nhãn phải
kể tile thật sự dùng; thêm font fallback — `resolved.font` phải kể font đã vẽ.
Cùng một bất biến, không cần luật mới.

---

### ƯU TIÊN 2 · I2 — Biên đầu vào toàn phần: hiệu lực, hoặc tiếng nói — không có nhánh "bị lờ"

**Phát biểu:** mỗi mẩu input của người dùng hoặc làm thay đổi kết quả, hoặc sinh
một tín hiệu từ chối/cảnh báo nói được vì sao và thay bằng gì. Cấm nhánh thứ ba:
nhận, im, vứt.

**Cơ chế vi phạm đã xác minh:** quyền kiểm tra bị **chẻ đôi giữa hai tầng có
chính sách ngược nhau**. Chính kho đã tự ghi điều này ở `recipes.ts:17-26`:
schema handler là `.strict()` (từ chối to), nhưng SDK MCP đối chiếu với *hình
dạng tool khai ra* và **loại khoá lạ trước khi handler kịp thấy** — nên `.strict()`
"chỉ bắt được MỘT NỬA". Tầng ngoài thắng, và tầng ngoài im lặng. → C4
(`themes`/`label`/`duration` bị nuốt, md5 chứng minh sai-tên == không-gõ), cộng
mặt "một lỗi mỗi lần" (K5) và hai giọng lỗi (K6).

**Cùng bất biến này ở thành phần Phân giải:** `geocode.ts:155-166` — thang nới
dần (searchLadder) trả **phát trúng đầu tiên**; "Hoàn Kiếm, Hà Nội" thành
*Phường* Hoàn Kiếm với đúng MỘT ứng viên, `placeRank` không có trong phản hồi
geocode. Hệ đã tự quyết đổi phạm vi — một dạng "sửa input" — mà không phát tiếng.
→ L4. (Không phán đúng/sai việc chọn phường; bất biến chỉ đòi **tiếng nói** khi
phạm vi bị đổi.)

**Hướng sửa ở gốc:**
- Khai **đủ hình dạng thật** cho SDK (hết `z.unknown()` — trùng với I4), hoặc
  chuyển sang passthrough + tự kiểm trong handler để giành lại quyền từ chối; khi
  từ chối, gom **tất cả** lỗi một lượt và mỗi lỗi kèm danh sách hợp lệ (mẫu tốt
  có sẵn: câu lỗi theme).
- `resolved` phải khai những gì hệ TỰ QUYẾT: cấp hành chính đã chọn, mặc định đã
  điền — cùng chỗ, cùng giọng.

**Răng:** eval "gõ một khoá lạ ở tầng ngoài cùng → phản hồi phải khác với
không-gõ" (chính là phép đo md5 ba-lần của ván #2, biến thành eval thường trực).

**Phòng tương lai:** mọi tool mới thêm vào thừa hưởng biên này; typo của agent —
loại input phổ biến nhất từ khách hàng là máy — không bao giờ thành "thành công
sai nội dung".

---

### ƯU TIÊN 3 · I3 — Danh tính tạo tác sống trong KHÔNG GIAN TẠO TÁC, không trong bộ nhớ tiến trình

**Phát biểu:** thứ sống trên filesystem dùng chung phải có danh tính cấp phát từ
filesystem (kiểm tồn tại / hash / timestamp), không từ trạng thái một tiến trình.

**Cơ chế vi phạm đã xác minh:** `tools.ts:70-73`:

```ts
let counter = 0;
function fileNameFor(cfg) {
  return `mapposter-${slugify(...)}-${w}x${h}-${counter++}`;
}
```

Counter là biến module — **mỗi tiến trình server đếm lại từ 0**. Trong một phiên
dài nó tăng nên test nội bộ không bao giờ thấy va chạm; nhưng hai *phiên* khác
nhau (hai lần khởi động MCP client — tình huống thật mỗi ngày) cùng ra `-0` cho
cùng (vùng, khổ) → ghi đè im lặng. Giải thích luôn vì sao suite xanh mà ván #2
và #3 đều mất dữ liệu. → C2; và K4 (`output` chỉ có `quality`,
`additionalProperties:false` — người dùng thấy ghi đè xảy ra mà không có nút nào
tránh) là mặt thiếu-tính-năng của cùng gốc.

**Hướng sửa ở gốc:** cấp danh tính lúc **ghi**, trong không gian tệp — mở với
`O_EXCL`/kiểm tồn tại rồi tăng hậu tố, hoặc trộn timestamp/hash nội dung. Tuỳ
chọn `outPath`/`overwrite` cho người muốn kiểm soát là tầng trên, quyết ở docket
(#1, #2); bất biến chỉ đòi: **không bao giờ mất dữ liệu cũ mà không có lệnh rõ**.

**Răng:** eval "hai tiến trình server tuần tự render cùng (vùng, khổ) → hai tệp,
hai md5, không tệp nào biến mất".

**Phòng tương lai:** job queue chạy render song song (`jobRunner.ts` cũng
`counter++` — cùng mầm bệnh ở `jobRunner.ts:74-76`); nhiều client cùng trỏ một
`_render-out`.

---

### ƯU TIÊN 4 · I4 — Hợp đồng một nguồn sự thật, và ví dụ phải CHẠY

**Phát biểu:** schema, mô tả, ví dụ, danh mục — bốn hình chiếu của cùng một định
nghĩa; hình chiếu nào viết tay riêng sẽ trôi. Và một "working example" chỉ được
gọi thế nếu CI thật sự gọi nó qua đúng đường agent đi.

**Cơ chế vi phạm đã xác minh — có cả sự trớ trêu làm bằng chứng:** `tools.ts:78`
tự hào *"identical shape instead of hand-rolling a second one that could
drift"* — schema quả thật được dẫn xuất, KHÔNG trôi. Nhưng dòng mô tả viết tay
ngay dưới (`tools.ts:680`) kể `preset: approach|pushIn|drift` trong khi
`motionCompiler.ts:11` có **sáu**: ba preset bị bỏ (`follow`, `tour`, `converge`)
gồm đúng cái `route-journey` khoá cứng. Sự trôi không biến mất — nó dời sang chỗ
không được dẫn xuất. → L2; cùng họ: C5 (ví dụ danh mục chưa từng được máy gọi
lại), C6 (`z.unknown()` làm tham số mảng hiện ra là `{}` — `recipes.ts` đã ghi
chú), L5 (không nói example đưa cho tool nào), K7 (danh mục 107 KB).

**Hướng sửa ở gốc:**
- Enum/preset trong mô tả **sinh từ type** (template literal từ
  `MotionPreset[]`), không gõ tay.
- Khai hình dạng recipe thật cho SDK (hết `z.unknown()`) — đồng thời đóng C6 và
  cấp răng cho I2.
- **Eval gọi nguyên văn từng `example` của `list_recipes` qua đường MCP** — đề
  xuất rẻ nhất, đã nêu từ ván #1, đến nay vẫn chưa tồn tại; ba trong bốn ca P0
  của ván #1 sẽ đỏ ngay lượt chạy đầu.
- K7 (danh mục to) là bài thiết kế tầng trên (progressive disclosure), quyết sau.

**Răng:** chính cái eval gọi-ví-dụ; cộng test so mô tả với type (fail khi thêm
preset thứ bảy mà quên mô tả).

**Phòng tương lai:** mọi recipe/preset/theme thêm mới tự động vào danh mục đúng;
"khách hàng là agent chỉ tin danh mục" — persona thất bại toàn phần ở ván #1 —
trở thành ca được canh thường trực.

---

### ƯU TIÊN 5 · I5 — Mọi thao tác có hạn chót, mọi thất bại có tiếng nói cấu trúc

**Phát biểu:** không lời gọi nào được phép im lặng vô hạn; mọi đường thất bại
kết thúc bằng một tín hiệu có cấu trúc (lỗi JSON-RPC nêu tài nguyên vướng, hay
trạng thái UI) trong thời gian chặn trước.

**Cơ chế vi phạm đã đo:** cổng dựng hình bận → `EADDRINUSE` nổ **ngoài** mọi
handler (`Unhandled 'error' event` trong stderr của ván #3), lời gọi 64×64 treo
121 giây với stdout **rỗng hoàn toàn**; khi cổng rảnh cùng lời gọi mất 4,4 giây.
`deps.ts:14` có retry-một-lần cho lỗi thoáng qua — nhưng cổng bận *lâu* thì
retry xong vẫn chết không lời. → C3 (triệu chứng). Cùng bất biến phía web: bấm
Download không tín hiệu (C7 — PDF đã nằm trong `~/Downloads` mà người dùng không
biết), bản đồ trắng 3 giây không chỉ báo (K14).

**Hướng sửa ở gốc:** bắt `error` của listener ngay chỗ `listen()`, biến thành
phản hồi JSON-RPC lỗi nêu đích danh cổng; deadline tổng cho một lời gọi render.
Phía web: ba trạng thái nút Download (đang xuất → xong + tên tệp → lỗi).

**Răng:** eval "chiếm cổng bằng listener vô can → lời gọi phải trả lỗi có cấu
trúc trong ≤ N giây" — kịch bản tái hiện của ván #3 biến thành eval.

---

### ƯU TIÊN 6 · I6 — Không giả định tài nguyên toàn cục

**Phát biểu:** tài nguyên phù du (cổng, thư mục tạm) cấp phát động theo lần
chạy, không ghim số cứng.

**Cơ chế:** cổng mặc định 4180 cố định. Bằng chứng sửa được rẻ: **chính wrapper
của ván #2 đã chạy `MAPPOSTER_APP_PORT=0`** (OS tự cấp) và mọi thứ hoạt động —
năng lực có sẵn, chỉ mặc định là sai. → gốc của C3, đi cùng I5 thành một cặp:
I6 làm va chạm *hiếm*, I5 làm va chạm *không câm*. Sửa I6 mà bỏ I5 là giấu bug;
sửa cả hai mới đóng.

---

## 3 · Ánh xạ đầy đủ 36 vấp

| Bất biến | Vấp được phủ |
|---|---|
| I1 sự thật từ vật | C1 · K11 · K12 (+nhãn "working example" của C5) |
| I2 biên toàn phần | C4 · L4 · K5 · K6 |
| I3 danh tính tạo tác | C2 · K4 |
| I4 hợp đồng một nguồn | C5 · C6 · L2 · L5 · K7 |
| I5 hạn chót + tiếng nói | C3 · C7 · K14 · K8* |
| I6 tài nguyên động | C3 (gốc) |
| **Không thuộc bất biến — điều tra riêng** | K10 (giật 4 Hz của `follow` — cần soi `motionCompiler.ts:45` + vòng render, nghi sai số rời rạc hoá theo khung; chưa xác minh) |
| **Quyết định người (docket), không phải lỗi kỹ thuật** | L1/G8 tên gọi · L6 nhóm khổ · L7 web-không-video · K9 khai mặc định ở đâu · K13 `centroid` (đã hoãn có hồ sơ) · K15 · K16 · V1–V6 |

\* K8 (không có thăm dò rẻ) đứng giữa I5 và thiết kế sản phẩm — một chế độ
`estimate`/dry-run là quyết định tính năng, ghi về docket.

## 4 · Bất biến nào kéo theo câu docket nào

Mười lăm câu «Chuyển phiên người» không cùng hạng: một số bị bất biến **kéo
theo** (bác nó là chấp nhận vi phạm bất biến), số khác **thuần khẩu vị**. Người
ký vẫn quyết cả hai — nhưng nên biết mình đang quyết loại nào.

| Câu docket | Quan hệ với bất biến |
|---|---|
| #1 tệp mới mỗi render · #2 đặt tên đầu ra | I3 kéo theo *"không mất dữ liệu im lặng"*; còn chọn cách nào trong hai là khẩu vị |
| #9 chặn khoá lạ | I2 kéo theo phần "không nuốt im lặng"; *chặn cứng hay cảnh báo* là khẩu vị |
| #10 geocode nhiều ứng viên | I2 chỉ kéo theo *tiếng nói khi đổi phạm vi*; nhiều-ứng-viên là khẩu vị |
| #11 từ chối sớm khi cổng bận | I5 kéo theo *có tiếng trong hạn chót*; từ-chối-sớm hay xếp-hàng là khẩu vị |
| #12 nút Download báo trạng thái | I5 kéo theo |
| #14 định nghĩa `restAtSec` | I1 kéo theo *khai đúng vật*; chọn mốc nào làm chuẩn là khẩu vị |
| #3 #4 #5 #6 #7 #8 #13 #15 | thuần khẩu vị / đánh đổi sản phẩm — bất biến không ép chiều nào |

## 5 · Trình tự thi công đề xuất

1. **I1-routing + I6** (một buổi): tách URL router theo profile, mặc định cổng 0.
   Hai sửa nhỏ nhất, tắt vấp nặng nhất và bẫy treo. Chạy lại phép đo ván #3 đã
   ghim chiều kỳ vọng (`walk` ≠ `car` md5, câu VLM (b)(f) → YES).
2. **I3** (nhỏ): danh tính tệp từ filesystem — `tools.ts:72` và `jobRunner.ts:76`.
3. **I2 + I4-schema** (một mối): khai đủ hình dạng cho SDK (hết `z.unknown()`),
   gom lỗi một lượt, mỗi lỗi kèm danh sách hợp lệ — sửa một chỗ được cả C4, C6, K5, K6.
4. **I5** (vừa): bắt lỗi listener + deadline; ba trạng thái Download phía web.
5. **I1-đo-lại-vật + I4-sinh-mô-tả + eval gọi-ví-dụ** (răng dài hạn): ffprobe
   sau encode, mô tả sinh từ type, CI gọi nguyên văn example.
6. **K10** mở điều tra riêng (`motionCompiler` × vòng render), có `tools/do-nhip-chuyen-dong.sh` của ván #3 làm thước đo lại.

Mỗi bước lên lịch qua feature-loop với hợp đồng + eval riêng; các phép đo của ba
ván (md5 ba-lần, listener vô can, gọi-ví-dụ-nguyên-văn) chuyển thẳng thành eval
để vấp không tái sinh câm.
