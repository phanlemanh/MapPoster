---
schema_version: 1
slug: road-routing
ran_at: 2026-08-19T13:55:56Z
variant: agent
chan: 1
lac: 0
kho_chiu: 0
vat: 0
chuyen_phien_nguoi: 0
---

# Lái-thử Người-lạ ván #2 — phần chạm `road-routing`

Stub của slug này. Hồ sơ tổng toàn ván: [`lai-thu-nguoi-la-van-2-2026-08-19.md`](../lai-thu-nguoi-la-van-2-2026-08-19.md).

**Ván chạy trên bản CHƯA vá P0-1** (`route.ts` md5 `4bb7655ec132e9e4718dad492f26b1a4`,
mtime 2026-08-07, `DEFAULT_OSRM_URL` vẫn là `routed-car` cho mọi profile).
⇒ Vấp dưới đây là **TÁI XUẤT, không tính phát hiện mới**.

## Nhật ký vấp

| # | Loại | Mục tiêu | Vấp gì (nguyên văn người-lạ) | Bằng chứng |
|---|---|---|---|---|
| 1 | CHẶN | "video đi bộ từ Hồ Gươm tới Nhà hát Lớn để gửi khách" | `mode:"walk"`, `mode:"car"` và không truyền mode cho **cùng** `distanceKm 1.2118`, cùng `durationMin 2.5233333333333334`, cùng `bbox`. Chỉ nhãn `provider` đổi (`osrm/foot` vs `osrm/driving`). "1.2118 km ÷ 2.5233 phút ≈ **28,8 km/h**. Người đi bộ 5 km/h thì 1,2 km mất ~14–15 phút." | [transcripts/luot-b](../lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-b-nguoi-dung-vung.md) |

## Khử tương quan (B3)

VLM khác họ `gemini-3.5-flash` nhìn khung `frame1-tuyen-di-bo-route-journey-settle.png`
(md5 `aed001de585c6e501d85ce5c3ab34593`):

> *"…Answer YES if that highlighted line runs along the main vehicle carriageways of the street network; answer NO if it runs along pedestrian-only paths, park walkways, or narrow alleys instead."* → **`YES`**

Tức triệu chứng nhìn thấy được, không chỉ suy từ con số.

## Chuyển phiên người

Không có câu nào riêng cho slug này — xem mục «Chuyển phiên người» của hồ sơ tổng.

---

## Ván #3 (2026-08-19T15:02:43Z) — bằng chứng VIDEO cho cùng vấp

Số vấp của slug này **không đổi**: ván #3 chạy trên đúng bản chưa vá
(`md5 route.ts` = `4bb7655ec132e9e4718dad492f26b1a4`, trùng khít con số ván #2
ghi), nên đây là **tái xuất**, không phải phát hiện mới. Thứ ván #3 thêm vào là
bằng chứng ở tầng mà ván #2 chưa với tới:

1. **Phép đo thị giác trên chính mp4 chuyển động.** Câu hỏi ĐÓNG hỏi trên cả clip
   (không phải một khung tĩnh), gửi thẳng video cho `google/gemini-3.7-flash`:
   *"tuyến dán nhãn đi bộ có bám lối đi bộ suốt chiều dài clip, hay chạy lòng
   đường ô tô?"* → **`NO`** (không bám lối đi bộ).
2. **Chiều kỳ vọng ghi TRƯỚC khi hỏi.** Mã chưa vá ⇒ kỳ vọng câu "hai clip walk
   và car có cho tuyến khác nhau?" là **`NO`**. Nhận về **`NO`**. Bản ghi trước:
   [`cmds/chieu-ky-vong-ghi-truoc.md`](../lai-thu-nguoi-la-van-3-2026-08-19/cmds/chieu-ky-vong-ghi-truoc.md).
3. **Bằng chứng máy mạnh hơn cả lời VLM.** Ba lời gọi — `walk`, `car`, `walk` —
   ghi ra ba tệp **trùng md5 từng byte** `7748da8e87a88185d190965d30e52f2a`, ảnh
   settle cả ba `b79ac82f33c995e122b0a8c6fadfe453`. Ván #2 đo được *cùng quãng
   đường, cùng thời gian*; ván #3 đo được *cùng từng byte pixel*:
   [`video/MD5.txt`](../lai-thu-nguoi-la-van-3-2026-08-19/video/MD5.txt).

**Phép đo để chạy lại khi bản vá P0-1 merge:** cùng bộ lệnh, kỳ vọng khi đó đảo
thành `YES` cho câu (f) và md5 hai clip phải khác nhau —
`bash _acceptance/lai-thu-nguoi-la-van-3-2026-08-19/tools/chay-lan-video.sh`.
