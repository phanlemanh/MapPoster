---
schema_version: 1
slug: satellite-tile-source
feature: Nguồn tile ảnh vệ tinh dùng được ở production (PR #8b)
owner: phanlemanh@gmail.com
stage: decided
decision: park
decided_by: Phan Le Manh
decided_at: 2026-08-19T10:35:16Z
prototype:
  base_commit:
  disposition:
---

# Opportunity — nguồn tile ảnh vệ tinh (#8b)

> Hồ sơ này do máy dựng ngày 2026-08-19 để **giữ một món nợ khỏi bay hơi**, không
> phải để thay người khám phá. Các ô số liệu ghi `[CHƯA KHAI]` là chỗ chỉ người
> quyết mới điền được — máy cố tình bỏ trống thay vì bịa.

## Vấn đề & ai gặp

Tính năng nền ảnh vệ tinh **đã merge** (gói `satellite-basemap`, ký 2026-08-19):
đổi nền, dựng lớp ảnh đúng thứ tự, và dòng ghi nguồn đổi theo nguồn ảnh. Nhưng
nó **chưa dùng được ở production vì không có nguồn ảnh nào để trỏ tới**.

Hai đường hiện hành xử đúng khi thiếu nguồn, và cả hai đều đã có phép đo canh:
người gọi qua máy bị **từ chối kèm tên biến** (AC-8), người dùng web **rơi về
nền vector** (AC-9). Nghĩa là hôm nay không có gì hỏng — chỉ có một năng lực đã
trả tiền code mà chưa ai dùng được.

**Đo được ngày 2026-08-19 — không làm thì đang chặn đúng cái gì.** Chạy thử cả
tám công thức đang bán, mỗi cái với một người gọi KHÔNG nêu nền bản đồ:

| Công thức | Nền mặc định | Kết quả hôm nay |
|---|---|---|
| 7 công thức còn lại | không đặt | chạy bình thường |
| `area-overview` | **satellite** | **BỊ TỪ CHỐI** — `basemap "satellite" requires MAPPOSTER_SATELLITE_TILES` |

Nghĩa là một trong tám công thức đã bán **không dùng được ở cấu hình mặc định
của chính nó**. Nó chưa lộ ra vì ví dụ mẫu trong danh mục tự khai `basemap:
'vector'`, tức ví dụ đang lách qua đúng cái mặc định mà nó quảng cáo. Đây là một
lỗi riêng, rẻ, KHÔNG phụ thuộc quyết định hạ tầng: hoặc đổi mặc định về vector,
hoặc nói thật trong danh mục rằng công thức này cần nguồn ảnh.

Nền của quyết định (spec `2026-08-06-mapeffect-clone-recipes-design.md` §1.2 và
§5, cộng vòng rà giấy phép `docs/research/2026-08-07-satellite-imagery-licensing.md`):

- Endpoint công cộng `tiles.versatiles.org` **đã bị bác 2026-08-07**: không ToS,
  không SLA, và không tìm được pháp nhân đứng tên vận hành. Giấy phép *dữ liệu*
  sạch không đồng nghĩa *dịch vụ* có cam kết.
- Hướng đang chọn: **Sentinel-2 Global Mosaic tự host**, kèm dòng ghi nguồn
  `Contains modified Copernicus Sentinel data [Year]`; NAIP làm nguồn phủ Mỹ.
- Chi phí: spec ghi thẳng **"chưa định giá"**. Tự host không phải ngày công viết
  mã — nó là lưu trữ mức TB cho tile toàn cầu ở zoom dùng được, một tile server,
  băng thông, và **chi phí vận hành định kỳ**. Spec dặn: đừng gộp vào ước tính
  ngày công.

## Giả định chốt sinh tử

| # | Giả định | Nếu sai thì | Phép thử rẻ nhất | Trạng thái |
|---|---|---|---|---|
| 1 | Có nhu cầu thật đủ lớn cho nền vệ tinh để gánh một chi phí vận hành định kỳ | Không dựng gì cả — mã đã merge nằm im không tốn gì, hai đường đều từ chối/rơi về vector sạch sẽ | Đếm số lần người gọi thật xin `basemap: satellite` và bị từ chối, trong N ngày | Chưa thử |
| 2 | Tự host là đường rẻ nhất đạt CẢ giấy phép sạch LẪN cam kết dịch vụ | Mua dịch vụ có SLA, hoặc thu phạm vi xuống vài vùng | Báo giá của 2–3 nhà cung cấp có ToS rõ, đặt cạnh ước tính lưu trữ + băng thông tự host | Chưa thử |
| 3 | Zoom và vùng phủ thật sự cần nằm trong ngân sách lưu trữ chấp nhận được | Cắt zoom hoặc cắt vùng phủ trước khi cắt tính năng | Tính dung lượng cho đúng tập vùng đang bán, không phải toàn cầu | Chưa thử |

## Ngưỡng chết / ngưỡng UAT

- Câu hỏi phép đo trả lời: nền vệ tinh có đáng một chi phí vận hành **định kỳ** không?
- Kết quả nào là SỐNG: `[CHƯA KHAI — người quyết điền ở Cổng Đáng]`
- Kết quả nào là CHẾT: `[CHƯA KHAI]`
- Timebox: `[CHƯA KHAI]`

## Kết quả prototype

Chưa dựng prototype. Spec đã ghi sẵn một lối rẻ: **bất kỳ nguồn raster nào cũng
dựng và kiểm được phần mã** — kể cả một nguồn tạm dùng cho phát triển. Nên câu
hỏi của hồ sơ này thuần là **tiền và vận hành**, không phải kỹ thuật.

## Nguồn ngoài & phạm vi kế thừa

- `docs/research/2026-08-07-satellite-imagery-licensing.md` — vòng rà giấy phép, nguồn của quyết định bác endpoint công cộng.
- `docs/superpowers/specs/2026-08-06-mapeffect-clone-recipes-design.md` §1.2, §5 — hướng nguồn ảnh và lý do tách #8b khỏi #8a.
- `_acceptance/satellite-basemap/` — gói đã ký, phần mã đã chạy được.

## Cổng 0

**Quyết định 2026-08-19: HOÃN (park).** Người quyết: Phan Le Manh.

Lý do — giả định gánh cả quyết định là *"có nhu cầu thật đủ lớn để trả một chi
phí vận hành ĐỊNH KỲ"*, và nó **chưa có một phép đo nào**. Trả tiền hàng tháng
cho một nhu cầu chưa đo là đúng thứ cổng này sinh ra để chặn.

Hoãn không để lại vết thương: mã đã ký nằm im không tốn gì, và cả hai đường vào
đều xử lý đúng khi thiếu nguồn — đường máy gọi TỪ CHỐI kèm tên biến, đường web
rơi về nền vector. Cả hai nay đều có phép đo canh (AC-8 và AC-9, phép đo cho
AC-8 viết ngày 2026-08-19 sau khi lint đấu dây phát hiện nó chưa từng được đo).

**Điều kiện mở lại — đây là phần quan trọng nhất của một quyết định hoãn:**

1. **Có số về nhu cầu.** Đếm số lần người gọi thật xin `basemap: satellite` và
   bị từ chối. Hệ thống đã từ chối kèm tên biến sẵn rồi, chỉ cần đếm.
2. **Hoặc** một cam kết cụ thể từ phía bán hàng buộc phải có ảnh vệ tinh.

Có một trong hai thì mở lại và làm bước tiếp: đặt báo giá 2–3 nhà cung cấp có
điều khoản dịch vụ rõ, cạnh ước tính lưu trữ + băng thông của đường tự host.

**Việc KHÔNG đi kèm quyết định này:** lỗi mặc định của công thức `area-overview`
— nó mặc định `satellite` nên bị từ chối, trong khi ví dụ mẫu trong danh mục tự
khai `vector` và lách qua đúng cái mặc định nó quảng cáo. Lỗi này đúng-sai độc
lập với câu hỏi tiền bạc ở trên và phải xử riêng, dù hoãn hay dựng.

## Thước đo thành công → ứng viên criterion

**Hai tiêu chí kế thừa — BẮT BUỘC có mặt trong hợp đồng của việc này.** Chúng
được rút khỏi gói `satellite-basemap` ngày 2026-08-19 vì chúng đòi một cảnh dựng
trên ảnh vệ tinh THẬT, thứ chỉ tồn tại khi có nguồn tile. Chép nguyên văn:

- *(judgment)* Given một cảnh render trên ảnh vệ tinh THẬT, When người ký xem,
  Then việc tắt sáu layer nhóm ground là đánh đổi ĐÚNG — bản đồ đọc được, đường
  và ranh giới còn nổi trên ảnh, và không mất thông tin nào người xem cần.
- *(judgment)* Given khung có attribution nền vệ tinh, When người ký đọc, Then
  chuỗi đủ nghĩa vụ với **cả hai** nguồn và vẫn đọc được ở kích thước nó được vẽ.

Ứng viên criterion khác, từ chính vòng rà giấy phép: nguồn được chọn phải có
**pháp nhân đứng tên vận hành** và điều khoản dịch vụ đọc được — đây là lý do
endpoint cũ bị bác, nên nó phải là tiêu chí chứ không phải ghi chú.

## Out of scope từ khám phá

- **Không** đụng lại phần mã của `satellite-basemap`. Nó đã ký và có phép đo canh cả hai đường.
- **Không** quyết nguồn phủ Mỹ (NAIP) trong cùng lượt nếu nó làm chậm quyết định chính — quyết định 2026-08-07 §8 đã để riêng.
