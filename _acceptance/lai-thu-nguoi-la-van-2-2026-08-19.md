---
schema_version: 1
slug: lai-thu-nguoi-la-van-2
ran_at: 2026-08-19T13:55:56Z
variant: agent+ui
chan: 5
lac: 5
kho_chiu: 11
vat: 6
chuyen_phien_nguoi: 8
---

# Ván Lái-thử Người-lạ #2 — mapposter — 2026-08-19

> **Lưu ý đọc frontmatter:** `variant: agent+ui` là sai lệch có chủ ý so với enum
> `ui | agent` của khuôn. File này là hồ sơ TỔNG của một ván chạm nhiều slug;
> bản ghi máy-đọc đúng chuẩn từng slug nằm ở các stub
> `_acceptance/<slug>/stranger-drive.md`. Con số ở đây là tổng toàn ván, con số ở
> stub là của riêng slug đó — cộng stub lại KHÔNG bằng tổng, vì một vấp có thể
> chạm hai slug.

**Bậc đã chạy: B1 + B2 (cả hai biến thể) + B3. KHÔNG chạy B4** — `uat-session`
và verdict là việc của người; máy tường thuật, không phán đáng-giá.

Ba phiên người-lạ ngữ-cảnh-trắng, không phiên nào được cấp đường dẫn kho:

| Lượt | Biến thể | Persona | Tự chấm |
|---|---|---|---|
| A | agent | agent tự động chỉ tin danh mục | 3/3 mục tiêu XONG |
| B | agent | người dùng vụng, cố tình gõ sai | 1 XONG · 2 XONG MỘT PHẦN (cạn ngân sách 12/12) |
| C | ui | môi giới BĐS, pixel-only | 1 XONG · 1 XONG MỘT PHẦN · 1 «BỎ CUỘC TẠI ĐÂY» |

**Điều kiện vào:** suite xanh (629 pass / 17 skip); mã không đổi giữa ván (vân tay
trùng khớp trước–sau ở cả hai cây); server khởi động sau lần sửa mã cuối. Chi
tiết + lệnh ở [`cmds/lenh-cau-noi-va-moc-gio.md`](lai-thu-nguoi-la-van-2-2026-08-19/cmds/lenh-cau-noi-va-moc-gio.md).

**Bản vá P0-1 CHƯA merge khi chạy ván.** `route.ts` vẫn `routed-car` cho mọi
profile (md5 `4bb7655ec132e9e4718dad492f26b1a4`, mtime 07/08 — sửa lại từ "18/08" ghi sai ở bản đầu). Mọi vấp tuyến
đường tái xuất dưới đây **không tính là phát hiện mới**.

---

## Nhật ký vấp

### CHẶN — 5

| # | Mục tiêu | Vấp gì (nguyên văn người-lạ) | Bằng chứng |
|---|---|---|---|
| CHẶN-1 · **MỚI** | render biến thể để chọn | Render lần hai **xoá đè** lần một, cùng đường dẫn, báo thành công cả hai lần, không một lời cảnh báo | md5 cùng một tệp đổi `6241dd3a83a3b9e4110c0156f0bca498` → `f6bf793fb0d5faf7acf8d0444a17339d`; bản sao giữ riêng vẫn md5 cũ (đối chứng dương); VLM khác họ trả `YES`/`NO` ngược nhau cho cùng câu hỏi trên hai khung → [vlm](lai-thu-nguoi-la-van-2-2026-08-19/vlm/ket-qua-vlm.md) câu 4+5 |
| CHẶN-2 | C·mục tiêu 2 "cầm tệp gửi khách" | "Bấm PNG → menu đóng, **không thông báo, không tên tệp, không đường dẫn, không gì cả**… không dám nói với khách là đã có tệp" | [luot-c](lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-c-ui-moi-gioi-bds.md); đo lại: PDF CÓ rơi xuống `~/Downloads` (1.175.113 byte, md5 `a145053dbae21c29fa124b23b383a11a`) mà người dùng không hề biết |
| CHẶN-3 | B·mục tiêu 1 và 3 | Lối gọi mặc định không trả đường dẫn tệp nào; "người muốn mang ra tiệm in hay gửi khách thì tay không" — cạn ngân sách 12/12 ở cả hai mục tiêu | [luot-b](lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-b-nguoi-dung-vung.md) |
| CHẶN-4 · *tái xuất* | B·mục tiêu 3 video đi bộ | `mode:"walk"`, `mode:"car"` và không truyền mode cho **cùng** `distanceKm 1.2118` / `durationMin 2.5233…` / cùng `bbox`; ≈ **28,8 km/h** dán nhãn đi bộ | bảng số liệu trong [luot-b](lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-b-nguoi-dung-vung.md); VLM khác họ trả `YES` cho "tuyến chạy theo lòng đường ô tô" |
| CHẶN-5 · *tái xuất, mở rộng* | B·mục tiêu 2 | Gõ sai **TÊN** tham số bị nuốt hoàn toàn im lặng (`themes`, `label`, `duration`); gõ sai **GIÁ TRỊ** thì bị chửi to | md5 `5e347436…` (sai tên) == `5e347436…` (bỏ hẳn khoá) ≠ `9ce052ec…` (viết đúng) — đối chứng dương đạt |

### LẠC — 5

| # | Vấp gì | Bằng chứng |
|---|---|---|
| LẠC-1 | Bộ ba `render_animation` / `render_clip` / `compile_motion` dẫn lạc hoàn toàn; `list_recipes` mới là cửa đúng nhưng "tên nghe như đồ nội bộ". Mất 4 lượt chết mới lết tới | luot-b vấp 7–10 |
| LẠC-2 | Danh mục đưa khối `example` nhưng không câu nào nói phải đưa nó cho `render_recipe` | luot-a vấp 7 |
| LẠC-3 · **MỚI** | `geocode_place "Hoàn Kiếm, Hà Nội"` trả **đúng một** ứng viên `Phường Hoàn Kiếm`; `placeRank: 12` chỉ lộ trong `resolved` của lệnh render, không có trong phản hồi geocode ⇒ người gọi không có chỗ nào nhận ra phạm vi đã đổi. Chính ví dụ mẫu của danh mục cũng dính | đo lại trên vật, xem §"Đo lại" |
| LẠC-4 | Nhóm khổ mơ hồ: "khổ dọc để in" trỏ vào cả `portrait` (Social) lẫn `a3/a4/letter` (Print); và `square`==`ig-square`, `story`==`ig-story`, `landscape`==`fhd` | luot-a vấp 10, luot-b vấp 12 |
| LẠC-5 | Web app không làm được video. Môi giới rê chuột đọc cả 8 biểu tượng, mở Settings, mở Layout, mở Download mới dám kết luận — 13 thao tác, «BỎ CUỘC TẠI ĐÂY» | luot-c mục tiêu 3 |

### KHÓ-CHỊU — 11

| # | Vấp gì | Bằng chứng |
|---|---|---|
| KC-1 | **99,94% phản hồi là base64 không ai xin.** Ví dụ `region-spotlight` nguyên văn trả 2.934.545 byte, trong đó 2.932.740 ký tự là ảnh settle — dù `settle.path` và `clip.path` đều đã có sẵn trong cùng phản hồi | đo lại trên vật |
| KC-2 | `delivery` là tham số quyết định nhưng **không một chữ mô tả**, chỉ enum trần `both\|url\|inline`, không nói cái nào mặc định | luot-a vấp 2–3 |
| KC-3 · *tái xuất* | Đường dẫn trả về cụt gốc: `_render-out/…` tương đối với đâu? | luot-a vấp 4 |
| KC-4 | Chỉ báo **một lỗi mỗi lần** — sai hai khoá thì phải gọi hai lượt mới biết hết | luot-b vấp 1 |
| KC-5 · *tái xuất* | Hai giọng lỗi cạnh nhau ngược nhau: `Unknown theme: tối` kèm đủ 13 tên hợp lệ; `Unknown format: A3 dọc` không kèm gì (dù có 21 khổ) | luot-b vấp 2; đo lại: `Unknown format: a4-portrait` cũng trần trụi |
| KC-6 | Schema `render_map` > 12.000 ký tự vì `anyOf` lồng ba tầng, thứ cần nhất nằm chót | luot-a vấp 1 |
| KC-7 | Không có cách thăm dò rẻ: bản 64×64 vẫn 11 giây, video 55–70 giây, ba lượt `route-journey` vượt 120 giây phải đẩy chạy nền | luot-a vấp 8, luot-b vấp 13 |
| KC-8 | Bản đồ trắng trơn ~3 giây, không chỉ báo đang tải — "tôi tưởng hỏng" | luot-c vấp 1 |
| KC-9 | Cột trái toàn biểu tượng, không một chữ — phải rê chuột từng cái | luot-c vấp 3 |
| KC-10 | Tên theme không cho biết sáng hay tối; cờ `dark` chôn trong JSON, `list_themes` phình vì 15 mã màu mỗi theme nên 3000 ký tự chỉ xem được 7/13 | luot-b vấp 6 |
| KC-11 | Ngăn cài đặt trượt ra đè lên tấm tranh, che mất đúng lúc cần so màu | luot-c vấp 4 |

### VẶT — 6

| # | Vấp gì |
|---|---|
| VẶT-1 | Gợi ý địa điểm chỉ 1 dòng, địa chỉ bị cắt cụt `…Việt N…` |
| VẶT-2 | Đổi cỡ cửa sổ sang "desktop" mà màn hình không to lên |
| VẶT-3 | Dòng bản quyền OpenStreetMap/MapLibre chữ cực nhỏ nhưng nằm ngay trên tranh định gửi khách |
| VẶT-4 | `a3` cố định 1748×2480, không có nút xoay ngang/dọc |
| VẶT-5 | `render_animation` bắt khai `location` dù đã có `from`/`to` |
| VẶT-6 | Cuộn danh sách Layout treo — **không quy được cho sản phẩm**: phiên điều phối gặp đúng lỗi `Browser pane is not displayed` khi thao tác lại, nhiều khả năng là giới hạn giàn chạy không-tương-tác |

---

## Đo lại của phiên điều phối (trên vật)

Ba điểm đáng ngờ nhất được đo lại bằng lệnh, không dựa vào lời kể.

**1. Ghi đè im lặng (CHẶN-1).** `render_map` cùng `location`+`format`, đổi mỗi
`theme`:

```
lần 1 (midnight-blue) → _render-out/mapposter-ho-hoan-kiem-874x1240-0.png
MD5 = 6241dd3a83a3b9e4110c0156f0bca498
lần 2 (noir)          → _render-out/mapposter-ho-hoan-kiem-874x1240-0.png   ← CÙNG đường dẫn
MD5 = f6bf793fb0d5faf7acf8d0444a17339d                                       ← nội dung đã đổi
bản sao giữ riêng    MD5 = 6241dd3a83a3b9e4110c0156f0bca498                  ← đối chứng dương
```

**2. Ví dụ danh mục vẫn nặng đúng như ván #1 (KC-1).** Gọi `region-spotlight`
**nguyên văn** (ví dụ không có `delivery`):

```
wc -c → 2934545 byte
trong đó settle.base64 = 2932740 ký tự  ⇒ 99,94% phản hồi
cost: frames 108 · renderMs 60295 · encodeMs 1067
```

Ván #1 ghi 2.934.267 ký tự — khớp gần tuyệt đối. Lượt A tưởng ví dụ "chạy
thẳng" chỉ vì **cầu nối của ván dễ tính hơn MCP client thật**; ở tầng giao thức
thật đây vẫn là ca vỡ transport của ván #1, nên **không tính phát hiện mới**.

**3. Geocode (LẠC-3).**

```
geocode_place "Hoàn Kiếm, Hà Nội"
→ best: "Phường Hoàn Kiếm", displayName "Phường Hoàn Kiếm, Hà Nội, 11024, Việt Nam"
→ candidates: [ chỉ đúng 1 phần tử ]
```

Phiên điều phối **không phán** đây là sai: Việt Nam đã bỏ cấp quận, nên tên
phường có thể là đúng. Thứ đo được và đủ để tường thuật là: chỉ có một ứng viên,
và cấp hành chính (`placeRank`) không xuất hiện ở đây mà chỉ ở `resolved` của
lệnh render.

**4. Đối chứng dương bắt buộc cho một khẳng định âm tính (CHẶN-2).** Lượt C
không lấy được PNG. KHÔNG được kết luận PNG hỏng:

```
[1/1] [chromium] › e2e/mapposter.spec.ts:222:1 › export: Download → PNG triggers a file download
  1 passed (6.7s)
```

Làn e2e của chính kho xanh. Thứ đo được chắc chắn chỉ là: **sản phẩm không phát
tín hiệu nào sau khi bấm**, nên người dùng không phân biệt được "đang làm",
"xong rồi" và "hỏng".

---

## Bậc B3 — khử tương quan

VLM khác họ, chạy **hai lần trên hai bản model**: `gemini-3.5-flash` qua MCP
`gemini-flash`, và `google/gemini-3.7-flash` qua OpenRouter. Năm câu ĐÓNG
trên khung hình do **chính ván này** sinh ra; nguyên văn câu hỏi, nguyên văn trả
lời và md5 từng ảnh ở [`vlm/ket-qua-vlm.md`](lai-thu-nguoi-la-van-2-2026-08-19/vlm/ket-qua-vlm.md).

| Câu | Trả lời |
|---|---|
| Tuyến dán nhãn đi bộ có chạy theo lòng đường ô tô? | `YES` |
| Nền có đúng `midnight-blue` đã yêu cầu trong lời gọi? | `YES` |
| Chữ/nhãn trên poster có đọc được ở cỡ xuất? | `YES` |
| (đối chứng) Khung SAU ghi đè có phải nền navy? | `NO` |
| (đối chứng) Khung TRƯỚC ghi đè có phải nền navy? | `YES` |

Hai kết quả **âm tính cho phe tố cáo**, ghi lại đúng như thế: theme được tôn
trọng, và chữ trên bản dựng MCP đọc được. Riêng câu chữ-nghĩa **chưa hỏi được
trên bề mặt mà lượt C thật sự phàn nàn** (bản dựng của web app) vì Browser pane
không hiển thị được trong phiên không-tương-tác nên không lưu được khung web ra
đĩa — ghi là giới hạn, không lấp bằng suy đoán.

**Hai bản model trả lời giống hệt nhau ở cả năm câu**, nên kết luận của bậc B3
không phụ thuộc vào việc chọn bản flash nào — một tầng khử tương quan nữa ngoài
việc đổi họ. Kết quả bản 3.7 ở
[`vlm/ket-qua-vlm-3.7-flash.md`](lai-thu-nguoi-la-van-2-2026-08-19/vlm/ket-qua-vlm-3.7-flash.md);
chạy lại bằng một lệnh: `bash _acceptance/lai-thu-nguoi-la-van-2-2026-08-19/tools/chay-b3.sh`.
Khoá đọc từ `~/.config/acceptance-gate/openrouter.env` (ngoài mọi kho git, quyền
600, không script nào in giá trị ra).

---

## Chuyển phiên người

*Máy dọn bàn, người quyết. Không câu nào dưới đây kèm câu trả lời gợi ý.*

1. Có đáng để mỗi lần render ghi ra một tệp mới thay vì đè lên bản trước, đổi lại là thư mục `_render-out` phình theo thời gian và cần chính sách dọn?
2. Có đáng đầu tư `delivery:"url"` thành một URL mở được thật, thay vì đường dẫn tương đối không rõ gốc?
3. Có đáng đổi mặc định `delivery` từ `inline` sang `url`, biết rằng nó phá vỡ mọi client đang dựa vào base64?
4. Có đáng bắt `geocode_place` trả nhiều ứng viên kèm cấp hành chính, đổi lại mỗi lượt gọi tốn thêm một bước chọn?
5. Có đáng đổi tên `list_recipes` / `compile_motion` / `render_animation` cho khớp cách người mới đoán, biết rằng đổi tên tool là breaking change với agent đã tích hợp?
6. Có đáng làm nút Download báo trạng thái (đang xuất · xong · tên tệp), hay chấp nhận để người dùng tự mở thư mục Downloads?
7. Có đáng chặn cứng khoá lạ ở tầng ngoài cùng thay vì để SDK lọc im lặng, biết rằng nó sẽ làm hỏng những lời gọi cũ hiện đang "chạy được"?
8. Có đáng để web app và MCP server hội tụ về cùng một bộ năng lực, hay chấp nhận web chỉ làm poster còn video chỉ có ở MCP?

---

## Bằng chứng

- Nhật ký ba lượt người-lạ: [`transcripts/`](lai-thu-nguoi-la-van-2-2026-08-19/transcripts/)
- Khung hình sinh trong ván + md5: [`frames/`](lai-thu-nguoi-la-van-2-2026-08-19/frames/)
- Nguyên văn hỏi/đáp VLM: [`vlm/ket-qua-vlm.md`](lai-thu-nguoi-la-van-2-2026-08-19/vlm/ket-qua-vlm.md)
- Lệnh cầu nối, mốc giờ, vân tay mã: [`cmds/lenh-cau-noi-va-moc-gio.md`](lai-thu-nguoi-la-van-2-2026-08-19/cmds/lenh-cau-noi-va-moc-gio.md)
- Bộ chuyển tiếp VLM: [`tools/vlm-assert.mjs`](lai-thu-nguoi-la-van-2-2026-08-19/tools/vlm-assert.mjs)

## Bản đồ stub theo slug

Ván chạm 5 slug có hồ sơ; mỗi slug có một stub máy-đọc riêng, đếm vấp của riêng
nó và trỏ ngược về file này:

| Slug | Stub | chan / lac / kho_chiu / vat |
|---|---|---|
| `road-routing` | [stranger-drive.md](road-routing/stranger-drive.md) | 1 / 0 / 0 / 0 |
| `routes-measurements` | [stranger-drive.md](routes-measurements/stranger-drive.md) | 1 / 0 / 0 / 0 |
| `recipe-region-spotlight` | [stranger-drive.md](recipe-region-spotlight/stranger-drive.md) | 0 / 1 / 1 / 0 |
| `mcp-map-render` | [stranger-drive.md](mcp-map-render/stranger-drive.md) | 1 / 1 / 4 / 0 |
| `tier0-agent-params` | [stranger-drive.md](tier0-agent-params/stranger-drive.md) | 1 / 0 / 1 / 0 |

Cộng stub lại KHÔNG bằng tổng của ván, vì hai lẽ:

1. Một vấp gốc có thể chạm hai slug (tuyến đi bộ nằm ở cả `road-routing` lẫn
   `routes-measurements`) nên bị đếm hai lần khi cộng ngang.
2. **Toàn bộ vấp của lượt C (bề mặt web app) không có slug nào để trú** — kho
   không có hồ sơ nghiệm thu nào phủ web app. Cụ thể là CHẶN-2, LẠC-5, KC-8,
   KC-9, KC-11, VẶT-1, VẶT-2, VẶT-3 và VẶT-6. Chúng chỉ sống trong file tổng này.
   Bản thân việc đó là một dữ kiện đáng chú ý về vùng phủ của bộ cổng, không phải
   thiếu sót của ván.

## Sai lệch nghi thức đã khai

1. **Ngữ-cảnh-trắng đạt bằng chỉ thị, không bằng cấu trúc.** Subagent kế thừa cwd
   của phiên điều phối, nên về mặt kỹ thuật chúng có thể lần ra kho. Cả ba đều
   tự khai không đọc mã; lượt A và B khai hai chỗ cắt output mức nhẹ, phiên điều
   phối xét là không lấy thêm tri thức nội bộ và chấp nhận. Lượt C không phá rào.
2. **Deny rule của phiên lái đặt sai** khiến `Write` bị chặn toàn phiên; ba
   người-lạ không tự lưu được nhật ký, phiên điều phối chép lại từ phần bàn giao.
   Lỗi dựng môi trường, không phải vấp sản phẩm.
3. **Cây git không sạch tuyệt đối** khi vào ván: 2 tệp chưa commit thuộc
   `_acceptance/area-overview-default/` (hồ sơ, không phải mã).
4. **Playwright `--isolated --caps=vision` không dựng được**; Playwright qua
   gateway đòi `ref` từ `browser_snapshot` (DOM), đúng thứ bị cấm. Làn UI chạy
   bằng bộ điều khiển theo toạ độ của Browser pane — vẫn pixel-only, nhưng không
   ghi được khung ra đĩa.
