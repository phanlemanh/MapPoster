# Đối chiếu nhịp chuyển động: MapPoster vs mapeffect.app (Tầng 1)

**Ngày:** 2026-08-13 · **Trạng thái:** đo xong, kết luận có phạm vi hẹp
**Nền:** [2026-08-06-mapeffect-competitive-analysis.md](2026-08-06-mapeffect-competitive-analysis.md) — bản đó đo *kiến trúc*, bản này đo *nhịp đầu ra*
**Cây mã:** `main` @ `139fdf8` · 4/8 recipe

## 0. Kết luận

Ba điều đo được, mỗi điều kèm số:

1. **Clip của MapPoster dừng hẳn ở đuôi; của mapeffect thì không.** 30% cuối clip:
   ta `0.0000`–`0.0002`, họ `0.0031`–`0.0069`. Đây là đầu vào trực tiếp cho **AC-13**
   của hợp đồng `map-motion-clip`, vốn hỏi đúng câu "có đứng yên ở đuôi không".
2. **Nhịp so le của họ hiện thành cụm đo được** — hồ sơ chuyển động của demo tiện ích
   có các cụm rải đều giữa clip, tương ứng việc thả ghim từng tiện ích theo nhịp. Đây
   là thứ MapPoster **không dựng được**: `src/render/motionScript.ts` cấm quá một track
   one-shot cùng loại trong một script.
3. **Demo tuyến đường của họ có mật độ chuyển động cao nhất và gần như không nghỉ.**
   Đó là một *hạng nhịp* MapPoster chưa có, không phải một hiệu ứng phụ — và nó là
   thước đo thật cho việc định giá lại PR #10 (`routeDraw`).

**Phạm vi, nói trước:** kết luận chỉ hợp lệ cho **nhịp và cấu trúc thời gian**. Chúng
**không** hợp lệ cho chất lượng thị giác, độ đọc, artifact hay màu — xem §3.

## 1. Phương pháp

Đo mức thay đổi giữa hai khung liền kề, theo thời gian, trên cả hai phía:

```bash
ffmpeg -v info -i CLIP.mp4 -vf "select='gt(scene,0)',metadata=print" -f null - 2>&1 \
| awk '/pts_time:/{ for(i=1;i<=NF;i++) if($i ~ /^pts_time:/){split($i,a,":"); t=a[2]} }
       /scene_score=/{ split($0,b,"="); printf "%.3f %.5f\n", t, b[2] }'
```

Rồi chia clip làm 10 phần đều theo thời gian và lấy trung bình mỗi phần. Chia theo
**tỉ lệ thời gian** chứ không theo số khung tuyệt đối, vì hai phía khác thời lượng.

Phía MapPoster render bằng `render_recipe` ở **cùng thời lượng** với demo tương ứng
(3s và 4,7s) và **cùng 24 fps**, để hồ sơ nằm trên cùng thang.

### 1.1 Một hiệu chỉnh bắt buộc: bỏ khung đầu

Vòng đo đầu tiên cho `amenities` điểm `0.31207` ở khung đầu — **gấp 624 lần trung vị
của chính nó**. Đã nêu thành nghi vấn lỗi và đi kiểm.

Ảnh hiệu (khuếch đại tương phản) giữa cặp `(khung0, khung1)` và `(khung1, khung2)`
cho ra hai ảnh **giống hệt nhau**. Đo độ lệch luma trung bình:

| Cặp khung | Độ lệch luma |
|---|---|
| khung0 ↔ khung1 | **31.2478** |
| khung1 ↔ khung2 | **31.3034** |

Tỉ lệ **1,00**. Không có đột biến nào. `scene_score` tại **chỉ số khung đầu** không đáng
tin, và điều đó đúng với **mọi** clip trong bộ, cả hai phía:

| Clip | Khung đầu | Trung vị | Tỉ lệ |
|---|---|---|---|
| ta · amenities | 0.31207 | 0.00050 | **624×** |
| ta · region-spotlight | 0.00370 | 0.00015 | 25× |
| họ · khoanh-vung | 0.05729 | 0.00324 | 18× |
| họ · tien-ich | 0.03547 | 0.00385 | 9× |
| họ · duong | 0.07036 | 0.00764 | 9× |

**Mọi số ở §2 đã loại khung đầu.** Ghi lại vì bất kỳ ai dùng lại `scene_score` cho
việc khác sẽ gặp đúng cái bẫy này — và vì nếu báo cáo vòng đo đầu, kho backlog đã có
thêm một "lỗi" không tồn tại.

## 2. Kết quả

Ký tự = mức thay đổi trung bình của mỗi 1/10 thời lượng.
`█` >0.012 · `▆` >0.006 · `▄` >0.003 · `▂` >0.001 · `·` đứng yên

```
họ · khoanh-vung       █▂▆▄▂▂▂▂▄▄   đuôi(30%) = 0.0037
ta · region-spotlight  ▆▂▂▂▆·····   đuôi(30%) = 0.0000

họ · tien-ich          ▆▂▆▄▆▆▄▂▄·   đuôi(30%) = 0.0031
ta · amenities         █▆▆▆▂·····   đuôi(30%) = 0.0002

họ · duong             █▆██▆▆█▄▆▆   đuôi(30%) = 0.0069
```

### 2.1 Đuôi clip — khác biệt rõ nhất

Cả hai recipe của MapPoster về `·····` ở nửa sau và đuôi đo được **0.0000 / 0.0002**;
cả ba demo của mapeffect giữ chuyển động thấp tới hết, đuôi **0.0031–0.0069**, tức
**cao hơn một bậc rưỡi tới hai bậc**.

Đây không phải "ai hơn ai". Hai bên tối ưu cho hai thứ khác nhau: MapPoster có
`restAtSec` là khái niệm hạng nhất và `resolved.anchors` **chỉ đo được ở trạng thái
nghỉ** (`assertCameraAtRest` trong `src/render/anchors.ts`) — tầng DOM cần một khung
đứng yên để đặt chữ lên. Một clip không bao giờ nghỉ thì không có chỗ neo.

**Với AC-13:** tiêu chí đòi clip đọc ra ba nhịp *"mở rộng toàn cảnh → vẽ dần ranh giới
→ đứng yên ở đuôi"*. Hồ sơ `▆▂▂▂▆·····` khớp đúng hình dạng đó: khởi động, một cụm ở
giữa (regionReveal), rồi đứng yên đo được bằng 0. Số đo **không thay thế** phán quyết
người — AC-13 hỏi clip có *đọc ra được* ba nhịp không, và đó là câu hỏi thị giác —
nhưng nó cho người ký một mốc đối chiếu thay vì phải phán trong chân không.

### 2.2 Nhịp so le — thứ ta không dựng được

`tien-ich` có các cụm `▆…▆▆` rải giữa clip thay vì một cụm duy nhất. Hình dạng đó ứng
với việc các ghim tiện ích xuất hiện **lần lượt**, không cùng lúc.

MapPoster không dựng được nhịp đó, và lý do nằm trong bất biến của chính engine:
`motionScript.ts` cấm quá **một** track one-shot cùng loại trong một script, nên
không thể có nhiều `pinDrop` so le. Recipe `amenities` do đó khai thẳng trong catalog
rằng *"các ghim hiện CÙNG LÚC"* — mô tả nói đúng thứ nó làm được.

Hồ sơ `█▆▆▆▂·····` của ta so với `▆▂▆▄▆▆▄▂▄·` của họ là hình ảnh của đúng khác biệt đó:
ta dồn chuyển động vào nửa đầu rồi nghỉ; họ rải đều.

### 2.3 Tuyến đường — một hạng nhịp còn thiếu

`duong` là clip duy nhất trong bộ có `█` ở nhiều đoạn không liền nhau và đuôi cao nhất
(0.0069). Hình dạng của một tuyến vẽ dần chiếm phần lớn thời lượng.

MapPoster có `routeDraw` **trong schema** (`motionScript.ts`) nhưng `src/render/main.tsx`
không xử lý nó, và `motionCompiler.ts` truyền `routeCount: 0` nên mọi `routeDraw` chết
ở validate. Xem ghi chú đã thêm vào spec §5: comment *"RenderConfig chưa mang routes"*
tại `motionCompiler.ts` **đã lỗi thời** — `RenderConfig.routes` có từ PR #2 và
`applyRenderConfig` đã map vào store. Phần còn thiếu thật sự chỉ là vẽ tiến trình ở
`main.tsx`.

Clip này là căn cứ để **đo lại 6,0 ngày** mà spec §5 gán cho PR #10.

## 3. Điều báo cáo này KHÔNG nói

Bộ demo lấy từ trang chủ mapeffect.app là **640×360, ngang, 24 fps, 3–10 giây** — tài
sản marketing nén cho web, **không phải bản xuất của sản phẩm**. Bảng giá của họ cho
biết bản xuất thật là 720p (bản miễn phí, có logo) tới 1440p (PRO MAX).

Nên kết luận ở §2 hợp lệ cho **nhịp và cấu trúc thời gian** — hai thứ nén ảnh không
làm sai lệch. Chúng **không** hợp lệ cho:

- chất lượng thị giác, độ sắc nét, artifact nén
- độ đọc được của ranh giới / ghim / nhãn
- màu, tương phản, xử lý theme
- so sánh ở khung dọc 9:16 (demo là ngang)

Muốn kết luận về những trục đó thì cần bản xuất thật ở cùng khung hình. Chi phí gỡ
confound: mua lượt lẻ (10.000đ cho clip ≤10 giây) để tránh so 720p-có-watermark với
1080×1920 sạch.

**Một trục nữa không so được, và là do thiết kế:** clip mapeffect có chữ, callout,
nhạc. Clip MapPoster **text-free theo AC-9**, chữ thuộc tầng DOM. Đó là ranh giới kiến
trúc, không phải thiếu sót — gộp nó vào một thang điểm chung là tự bẻ cong kết quả.

## 4. Việc rút ra

| Việc | Loại | Chặn bởi |
|---|---|---|
| Dùng §2.1 làm mốc đối chiếu khi phán **AC-13** | phán xét người | — |
| Định giá lại **PR #10** trên căn cứ §2.3 | giấy tờ | — |
| Nâng lên Tầng 2 (so khung cạnh khung, bản xuất thật) | nghiên cứu | cần tài khoản + lượt xuất |
| Xem lại có nên mở nhịp so le không (đổi bất biến one-shot) | **thay đổi engine** | gate |

Ba việc đầu không tốn thuế gate. Việc cuối đụng `motionScript.ts` nên phải xếp sau khi
gate sạch — và nên chỉ mở ra sau khi Tầng 2 xác nhận nhịp so le thật sự tạo khác biệt
mà người xem thấy được, chứ không chỉ khác biệt trên đồ thị.

## 5. Tái lập

Lệnh đo ở §1. Video demo lấy từ trang chủ mapeffect.app (`/assets/tinh-nang/`). Clip
phía MapPoster render bằng `render_recipe` với `durationSec` và `fps` khớp từng cặp.

**Không tệp nào của mapeffect được đưa vào repo này** — báo cáo chỉ giữ số đo và mô tả.
Điều khoản §6 của họ cấm sao chép và phân phối lại nội dung; đo đạc để đối chiếu là
việc khác với phát tán, và ranh giới đó được giữ đúng ở đây.
