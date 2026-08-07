# Quyết định: giấy phép ảnh vệ tinh cho MapPoster

**Ngày:** 2026-08-07 · **Trạng thái:** quyết định · **Mở khoá:** PR #8 (basemap raster / vệ tinh)

Hợp đồng `tier0-agent-params` ghi ở Out of scope: *"Không thêm ảnh vệ tinh / basemap raster / terrain — thuộc PR #8, và còn vướng licensing chưa được rà."* Tài liệu này rà xong.

Câu hỏi quyết định **không phải** "được dùng ảnh không". Mà là câu hẹp hơn và khắt khe hơn nhiều:

> Một video **chứa ảnh của nhà cung cấp này**, do MapPoster render, rồi **bên thứ ba đăng lại nhằm mục đích thương mại** — có được phép không?

Đây là câu đúng vì MapPoster không phải sản phẩm cuối. Nó là engine cho artifact platform: video đi ra khỏi tay chúng tôi và được một pháp nhân khác phát hành. Phần lớn điều khoản basemap viết cho mô hình "ứng dụng của chính khách hàng hiển thị bản đồ cho người dùng của khách hàng" — **không** phải mô hình này.

---

## 1. Quyết định

**Dùng Sentinel-2 Global Mosaic, tự host.** Đây là lựa chọn duy nhất vượt qua được câu hỏi trên mà **không cần hợp đồng riêng**.

Ba nhà cung cấp thương mại — Esri, Mapbox, MapTiler — **đều cần thoả thuận riêng** cho ca này. Không phải "nên hỏi cho chắc"; là điều khoản mặc định của cả ba không phủ.

| Nhà cung cấp | Bên thứ ba đăng lại thương mại? | Kết luận |
|---|---|---|
| **Sentinel-2 Global Mosaic** (Copernicus) | **Có** — chính sách "full, open and free" | **Dùng** (tự host) |
| **USGS NAIP** | **Có** — public domain | **Dùng** (chỉ phủ Mỹ) |
| Esri World Imagery | Không rõ / nhiều khả năng **không** | Cần hợp đồng |
| MapTiler satellite | **Có điều kiện**, câu chữ không phủ ca này | Cần xác nhận / gói Custom |
| Mapbox satellite | **Không** theo điều khoản mặc định | Cần mua quyền video riêng |

## 2. Vì sao Sentinel-2 Global Mosaic đứng vững

Điểm này **suýt sai**, nên nói rõ cách kiểm.

Có **hai** sản phẩm Sentinel-2 tên gần giống nhau, giấy phép trái ngược:

- **"Sentinel-2 cloudless"** của EOX — bản 2018–2024 là **CC BY-NC-SA 4.0**: **NC = cấm thương mại**. Nếu VersaTiles dùng nguồn này thì toàn bộ khuyến nghị **sụp**.
- **"Sentinel-2 Global Mosaic" (S2GM)** — sản phẩm của **Copernicus Land Monitoring Service**, hoàn toàn khác.

`versatiles.org/sources/` ghi đúng tên **"Sentinel-2 Global Mosaic"**, license `CC-BY 4.0`. Và tra thẳng chính sách gốc CLMS (Commission Delegated Regulation (EU) No 1159/2013): truy cập **"full, open and free"**, cho phép thương mại và tái phân phối, người dùng **giữ toàn bộ quyền sở hữu trí tuệ với sản phẩm mình tạo ra** từ dữ liệu đó. Chỉ ba điều kiện: ghi nguồn, nói rõ nếu có sửa đổi, và không tạo ấn tượng EU bảo trợ.

Đó là điều kiện phù hợp chính xác với mô hình MapPoster.

**Tự host, không dùng endpoint công cộng.** `tiles.versatiles.org` miễn phí và không cần key, nhưng **không có ToS lẫn SLA**, và không tìm được pháp nhân đứng tên vận hành — chỉ có các nguồn tài trợ. Giấy phép **dữ liệu** sạch không đồng nghĩa với việc **dịch vụ** có cam kết. Dữ liệu và mã đều mở, nên cứ tự host: coi endpoint công cộng là bản demo.

## 3. Vì sao ba nhà thương mại đều vướng

**Esri** — Master Agreement chỉ cho phép tạo biểu diễn dữ liệu ở **định dạng tĩnh** (PDF/GIF/JPEG/HTML); video không nằm trong danh sách. Và Attachment B cấm *"generate revenue by providing access to... Online Services through a Value-Added Application"*, cùng cấm *"offer Data through or on behalf of any third party"*. MapPoster render video rồi giao cho platform khác phát hành thương mại rơi gần như đúng khuôn bị cấm đó. Endpoint "keyless" **vẫn** chịu cùng agreement — *không có key* không có nghĩa *không có điều khoản*.

**Mapbox** — điều khoản 1.7.1 cho dùng bản đồ trong video **miễn phí**, nhưng chỉ để quảng bá ứng dụng của chính khách hàng và chỉ khi bản đồ xuất hiện ***incidentally***. Trong video MapPoster bản đồ **là toàn bộ nội dung**. Đường hợp lệ duy nhất là mua "Purchased Print & Video Rights" (1.7.4) qua Order riêng. Thêm một chi tiết dễ bỏ sót: Mapbox đòi **logo dạng hình ảnh**, không chỉ dòng chữ — dòng attribution thuần text hiện tại của MapPoster **không** thoả.

**MapTiler** — gần nhất với nhu cầu: cho phép video trên "internet channels (YouTube, Vimeo, etc.)" tới 100k subscriber. Nhưng câu chữ nhắm vào **kênh của chính khách hàng**, còn mục 3.3 lại cấm *"deploy the Service for the benefit of third parties other than users of Customer's Licensed Application"*. Hai điều khoản này không khớp gọn với chuỗi MapPoster → platform → mạng xã hội. Gói Custom là gói duy nhất minh thị cho phép "reselling".

## 4. OSM/ODbL cho video: không có nghĩa vụ share-alike

Đây là điều đáng yên tâm và hay bị hiểu sai.

Video render từ OSM data là **"Produced Work"** theo ODbL 1.0 — định nghĩa nêu đích danh *"audiovisual material"*. Mục 4.5(b) nói rõ tạo Produced Work **không** tạo ra Derivative Database, nên nghĩa vụ share-alike của mục 4.4 **không áp dụng**. Video được cấp phép theo bất kỳ điều khoản nào tuỳ ý, miễn giữ attribution.

Nói cách khác: **không** có chuyện video thương mại bị buộc phải mở theo ODbL.

## 5. Một rủi ro attribution mà bảng điều khoản không nhìn thấy

Nghiên cứu điều khoản dừng ở "chữ có đọc được không". Có một tầng thực tế phía dưới.

`src/lib/export.ts:269` tính cỡ chữ `Math.max(9, min(W,H) × 0.011)`, và `:278` vẽ ở **góc phải-dưới**. Với khung dọc 1080×1920 thì ra **~12px**.

Hai vấn đề, mức độ khác nhau:

1. **Cỡ chữ** — 12px trên khung cao 1920px là ~0,6% chiều cao. ODbL chỉ đòi thông báo *"reasonably calculated to make aware"*, ngưỡng thấp, nên nhiều khả năng **đủ về mặt pháp lý**. Nhưng hướng dẫn attribution của OSMF đòi *"easily readable"* — và video bị nén mạnh khi lên mạng xã hội. Đề xuất nâng sàn từ `9` lên `14`.

2. **Vị trí — nghiêm trọng hơn.** Trên khung dọc, góc phải-dưới đúng là chỗ giao diện các nền tảng video dọc đặt cột nút tương tác và caption đè lên. Attribution bị **che** thì không còn là attribution nữa — đây là lỗi *chức năng* của việc tuân thủ giấy phép, không phải chuyện thẩm mỹ. **Cần kiểm chứng bằng ảnh chụp thật trên từng nền tảng đích trước khi kết luận**; tôi chưa đo, chỉ nêu rủi ro.

**Chưa sửa trong tài liệu này.** `src/lib/export.ts` nằm trong `t3_paths` — mọi thay đổi kéo theo vòng nghiệm thu T3 đầy đủ (mỗi eval judgment cần human_override). Đây là quyết định về giấy phép, không phải PR sửa mã. Ghi lại để xếp lịch riêng.

**Lưu ý ngược lại về AC-9:** hợp đồng cấm nướng chữ vào pixel vì tầng DOM sở hữu chữ. Dòng attribution là **ngoại lệ có chủ đích và bắt buộc phải như vậy** — nếu để tầng DOM vẽ thì một trình biên tập ở hạ nguồn có thể gỡ nó đi mà pixel không hề hấn gì, và nghĩa vụ giấy phép biến mất lặng lẽ. Nướng vào pixel **chính là** cơ chế thực thi.

## 6. Chi phí, nếu sau này vẫn chọn nhà thương mại

| Nhà cung cấp | Miễn phí | Vượt hạn mức |
|---|---|---|
| Esri (tile) | 2.000.000 tile/tháng | $0,15/1.000 tile |
| Esri (session, mới 10/2025) | 1.000 session/tháng | $4/1.000 session |
| MapTiler Flex | $30/tháng cho 25.000 session | $2,50/1.000 session |
| Mapbox | 50.000 map load/tháng | $5,00/1.000 map load |
| Sentinel-2 / NAIP | Không giới hạn | Chỉ chi phí tự host |

Một chi tiết ảnh hưởng lớn tới chi phí và **chưa ai xác nhận được**: camera di chuyển trong một clip kéo về rất nhiều tile độc nhất. Nếu tính theo **tile/request** thì chi phí tỉ lệ với độ dài chuyển động; nếu tính theo **session** thì một lần render có thể chỉ là một session. Chênh nhau nhiều lần. Tài liệu của cả MapTiler lẫn Esri **không định nghĩa** render headless phía máy chủ thuộc loại nào — phải hỏi thẳng nhà cung cấp trước khi ước lượng bất cứ con số nào.

## 7. Điều chưa xác minh được

Ghi lại để không ai phải suy lại, và để biết chỗ nào chưa nên tin chắc:

1. **Esri** — trang "Redistribution Rights" cần JavaScript, không lấy được toàn văn. Kết luận về Esri dựa trên Master Agreement (đọc trực tiếp từ PDF gốc), không dựa trên trang này.
2. **Esri** — tính ràng buộc pháp lý của browsewrap với endpoint keyless không có bước click-through là vùng xám pháp lý chung, không tài liệu nào giải quyết dứt điểm.
3. **Mapbox** — giá raster tile phía máy chủ (khác "map load" trình duyệt) không công bố công khai; nhiều khả năng phải hỏi báo giá Enterprise.
4. **Mapbox** — định nghĩa "Qualified Renderer" (ảnh hưởng cách tính phí) không tìm thấy đầy đủ; chưa rõ MapLibre GL JS headless có đạt chuẩn không.
5. **MapTiler / Esri** — render headless tính là "session" hay "request" (mục 6).
6. **VersaTiles** — không tìm được pháp nhân chịu trách nhiệm cho endpoint công cộng. Đây chính là lý do khuyến nghị tự host, nên nó không chặn quyết định.
7. **Ngưỡng pixel "easily readable"** — OSMF không định lượng. Đánh giá 12px ở mục 5 là suy luận, không phải kết luận có căn cứ định lượng.

## 8. Việc tiếp theo

- **PR #8 mở khoá** với nguồn Sentinel-2 Global Mosaic tự host, kèm attribution `"Contains modified Copernicus Sentinel data [Year]"` khi ảnh có xử lý.
- **NAIP làm nguồn phủ Mỹ** — public domain, không ràng buộc gì, độ phân giải 0,3–0,6 m cao hơn hẳn S2GM. Đúng nghĩa "thêm chất lượng, không thêm nghĩa vụ" cho địa chỉ Mỹ.
- **Không** tích hợp Esri/Mapbox/MapTiler cho tới khi có hợp đồng bằng văn bản. Cả ba đều là *cần hợp đồng*, không phải *cần cẩn thận*.
- **Xếp lịch riêng** việc rà attribution (mục 5) — đụng t3_path nên phải đi kèm vòng nghiệm thu T3.

## Nguồn

Đọc thẳng trang điều khoản gốc, không qua bài tóm tắt:

- Copernicus Land Monitoring Service data policy — https://land.copernicus.eu/en/data-policy
- Copernicus Sentinel Data Legal Notice — https://sentinels.copernicus.eu/documents/247904/690755/Sentinel_Data_Legal_Notice
- VersaTiles sources — https://versatiles.org/sources/
- Esri Master Agreement E204-Legal (rev. 1/8/2025) — https://www.esri.com/content/dam/esrisites/en-us/media/legal/ma-full/ma-full.pdf
- Mapbox Product Terms (1/10/2025) — https://www.mapbox.com/legal/tos
- MapTiler Cloud Terms — https://www.maptiler.com/terms/cloud/
- ODbL 1.0 — https://opendatacommons.org/licenses/odbl/1-0/
- OSMF Attribution Guidelines — https://osmfoundation.org/wiki/Licence/Attribution_Guidelines
