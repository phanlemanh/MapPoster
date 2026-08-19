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
mtime 2026-08-18, `DEFAULT_OSRM_URL` vẫn là `routed-car` cho mọi profile).
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
