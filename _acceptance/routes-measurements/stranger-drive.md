---
schema_version: 1
slug: routes-measurements
ran_at: 2026-08-19T13:55:56Z
variant: agent
chan: 1
lac: 0
kho_chiu: 0
vat: 0
chuyen_phien_nguoi: 0
---

# Lái-thử Người-lạ ván #2 — phần chạm `routes-measurements`

Stub của slug này. Hồ sơ tổng: [`lai-thu-nguoi-la-van-2-2026-08-19.md`](../lai-thu-nguoi-la-van-2-2026-08-19.md).

Slug này bị chạm ở **mặt số liệu trả cho người gọi**, cùng một vấp gốc với
[`road-routing`](../road-routing/stranger-drive.md) — ván chạy trên bản CHƯA vá
P0-1, nên **TÁI XUẤT, không tính phát hiện mới**.

## Nhật ký vấp

| # | Loại | Mục tiêu | Vấp gì (nguyên văn người-lạ) | Bằng chứng |
|---|---|---|---|---|
| 1 | CHẶN | "video đi bộ, xem quãng đường/thời gian có hợp lý không" | Bộ ba phép đo `distanceKm` / `durationMin` / `bbox` **không phân biệt được mode**: ba lời gọi khác mode trả số liệu trùng tới từng chữ số thập phân. Người dùng nhẩm ra 28,8 km/h nhưng sản phẩm vẫn dán nhãn `osrm/foot` | [transcripts/luot-b](../lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-b-nguoi-dung-vung.md) |

## Ghi chú kỷ luật đo (do chính người-lạ tự sửa)

Người-lạ định dùng md5 toàn phản hồi để chứng minh "giống hệt", rồi tự phát hiện
`route-journey` bất định (video base64 không lặp lại) nên md5 chỉ chứng minh được
"khác", không chứng minh được "giống":

```
MD5 b3-thu1.json = 5df806b8bba2c024dcf0b6df5cdb423c
MD5 b3-thu2.json = 67aa8d635cc3259ae19703355e73e9ec
MD5 b3-thu3.json = 6c4590c46d7ad575e5b9ab57bff43ffd
```

Kết luận vì thế đặt trên **bảng số liệu**, không đặt trên md5.

## Chuyển phiên người

Không có câu nào riêng cho slug này — xem hồ sơ tổng.
