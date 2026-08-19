# Phiên lái thử người lạ — 2026-08-19

Ba agent ngữ cảnh sạch, **bị cấm đọc kho**, chỉ có bộ công cụ MCP công khai.
Máy chủ MCP khởi động 19:40, sau lần sửa mã cuối 17:55 — nên phiên này chạm
đúng mã hôm nay.

Vì sao cần: mười lăm hợp đồng của kho đều đo TỪ TRONG RA — gọi hàm, so khoá,
quét mã. Kể cả phản biện ngữ cảnh sạch cũng chỉ đọc hồ sơ. Không phép đo nào
trả lời câu hỏi thật: *khách hàng là agent không nhìn thấy ảnh — nó có tự làm
xong việc bằng đúng những gì sản phẩm nói ra không?*

| Lượt | Vai | Kết quả tự chấm |
|---|---|---|
| 1 | Môi giới bất động sản, không đọc kỹ | xong một phần — có video nhưng không mở được |
| 2 | Agent tự động, chỉ tin danh mục | **KHÔNG** — 4/4 ví dụ mẫu gọi nguyên văn đều hỏng |
| 3 | Người dùng vụng, cố tình sai | 14 ca sai; tìm ra một ca sản phẩm **im lặng cho qua** |

---

## P0-1 — Chế độ đi bộ trả tuyến ô tô, sai thời gian ~10 lần

Lượt 2 phát hiện `mode:"walk"` cho clip **giống hệt từng byte** với `car`, và số
liệu tự tố cáo: 2,62 km trong 4,14 phút ≈ 38 km/h dán nhãn đi bộ.

Vòng chính truy ra nguyên nhân và đo lại bằng chính hai máy chủ:

```
DEFAULT_OSRM_URL = 'https://routing.openstreetmap.de/routed-car'
url = `${base}/route/v1/${profile}/...`   →  routed-car/route/v1/foot/...
```

`routed-car` là instance CHỈ chạy hồ sơ ô tô; chữ `foot` trong đường dẫn bị bỏ
qua. Đo trực tiếp trên cùng một cặp toạ độ Hà Nội:

| Gọi gì | Kết quả |
|---|---|
| `routed-car` + hồ sơ `foot` (thứ sản phẩm đang gọi) | 2309 m / 3,1 phút → **45,0 km/h** |
| `routed-foot` + hồ sơ `foot` (máy chủ đi bộ thật) | 2226 m / 29,7 phút → 4,5 km/h |

Sản phẩm trả `provider: "osrm/foot"` — một khẳng định SAI về thứ router thật sự
tính. Chú thích ngay trong `route.ts` viết *"giả vờ có profile riêng cho xe máy
là nói dối về thứ router thật sự tính"* — nguyên tắc đúng, chỉ áp sót đúng chỗ
này. Mọi phép đo nội bộ đều giả lập router hoặc kiểm nhãn, nên 15 hợp đồng và 4
vòng phản biện đều không thấy.

## P0-2 — Bốn trên bốn ví dụ mẫu của danh mục không chạy được nguyên văn

`list_recipes` tự mô tả ví dụ là "a working example call". Gọi nguyên văn:

| Công thức | Chuyện gì xảy ra |
|---|---|
| `region-spotlight` | vỡ transport — 2.934.267 ký tự nhị phân nội tuyến |
| `route-journey` | vỡ transport — 2.755.812 ký tự |
| `compare-locations` | bị từ chối ở khâu kiểm: `subjects: expected array, received string` |
| `property-intro` | `No boundary found for region "Long Bình, Thủ Đức"` — vùng trong ví dụ không tồn tại |

Hai ca đầu vẫn **đốt 108 khung hình mỗi lượt** rồi mới vỡ. Thứ cứu chúng —
`delivery:"url"` — KHÔNG nằm trong `params` của bất kỳ công thức nào, tức không
nằm ở nơi máy được bảo là hãy đọc.

## P0-3 — Tham số mảng không gọi tới được qua MCP

`RECIPE_TOOL_SHAPE` khai mọi tham số công thức là `z.unknown().optional()`, nên
qua MCP chúng hiện ra là `{}`: không kiểu, không ràng buộc. Máy không có cách
nào biết `subjects` là mảng. Năm trong tám công thức (`area-overview`,
`amenities`, `compare-locations`, `location-tour`, `connectivity`) đều dựa vào
tham số mảng.

Thông điệp lỗi còn tự mâu thuẫn: *"expected array, received string; Too big:
expected string to have <=6 characters"*.

## P1-4 — Gõ sai khoá tầng ngoài bị NUỐT IM LẶNG

`compile_motion` với `themes:"midnight-blue"` (thừa chữ s) và `fomat:"a4-portrait"`
chạy trót lọt, trả `"theme":"midnight-blue"`. Đối chứng: bỏ hẳn hai khoá đó cho
kết quả **giống hệt từng ký tự** — tức lựa chọn của người dùng đã bị vứt và cái
nhận về là mặc định trùng hợp trông giống.

Gõ `themes:"noir"` sẽ nhận bản đồ midnight-blue mà vẫn đinh ninh đang xem noir.

Tầng LỒNG thì đóng: `layers:{waters:false}` bị chặn ngay với `Unrecognized key`.
Tầng ngoài cùng — nơi có `theme`, `format`, `font`, `chrome`, `basemap`,
`labels`, `detail` — mở toang. Nguyên nhân đã biết và có ghi trong kho: SDK loại
khoá ngoài shape trước khi tới chốt; nhưng hệ quả ở `render_map`/`compile_motion`
thì chưa ai đo.

## P1-5 — Việc không kết thúc được: đường dẫn không mở được

`delivery:"url"` trả `_render-out/mapposter-....mp4` — đường dẫn tương đối,
không phải URL. Người lái lượt 1 kết thúc buổi làm việc mà **không có gì gửi cho
khách**, và không biết `_render-out` nằm ở máy nào.

## P1-6 — Tên công thức dẫn người mới đi sai đường

Người muốn "giới thiệu khu Hoàn Kiếm" bấm ngay `area-overview` (tên khớp y hệt ý
định) — hoá ra là công thức KHÓ NHẤT cả bộ, đòi tự nạp GeoJSON. Cái họ cần là
`region-spotlight`, cái tên chẳng gợi gì. Sản phẩm để họ tự vấp mới biết.

## P1-7 — Hai giọng lỗi tách rời

Lớp nghiệp vụ nói tiếng người rất tốt: *"preset drift override fps=500 is out of
range — fps must be an integer between 12 and 30"* (bối cảnh + giá trị sai +
khoảng đúng + kiểu số, trong một dòng). Câu từ chối ảnh vệ tinh cũng nêu rõ **vì
sao từ chối thay vì âm thầm hạ cấp**.

Lớp schema thì quăng Zod dump — và nó rơi đúng vào lỗi PHỔ BIẾN NHẤT của người
mới (quên tham số bắt buộc): `location` bị chôn dưới hai nhánh union, không có
chữ "bắt buộc", không một ví dụ. `Unknown format: khổ A3 dọc` thì cụt lủn, không
liệt kê dù sản phẩm có sẵn 21 khổ và liệt kê rất tốt ở ca theme/recipe.

## P1-8 — Xác nhận lại hai lỗ đã biết

- `centroid` là tâm bbox, không phải trọng tâm — lượt 2 tự tính ra và bắt được.
- Mặc định (`theme`, `chrome`, `fps`) không khai ở đâu; phải render một lần rồi
  đọc ngược từ `resolved`.

---

## Điều phiên này nói về chính bộ cổng nghiệm thu

Không lỗi nào ở trên bị 15 hợp đồng, hàng trăm phép đo máy, hay bốn vòng phản
biện ngữ cảnh sạch bắt được. Lý do chung: **mọi phép đo đều đứng bên trong biên
sản phẩm**. Phép đo gọi hàm thật thì router bị giả lập; phép đo kiểm danh mục
thì so khoá chứ không GỌI ví dụ; phép đo chấm thông điệp lỗi thì đọc chuỗi chứ
không hỏi "đọc xong có sửa được không".

Cái rẻ nhất bổ sung được: một eval **gọi chính ví dụ mẫu của danh mục qua đúng
đường mà agent đi**, và đỏ nếu nó không chạy. Ba trong bốn ca P0 ở trên sẽ đỏ
ngay lượt đầu.
