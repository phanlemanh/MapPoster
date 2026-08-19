---
schema_version: 1
slug: tier0-agent-params
ran_at: 2026-08-19T13:55:56Z
variant: agent
chan: 1
lac: 0
kho_chiu: 1
vat: 0
chuyen_phien_nguoi: 0
---

# Lái-thử Người-lạ ván #2 — phần chạm `tier0-agent-params`

Stub của slug này. Hồ sơ tổng: [`lai-thu-nguoi-la-van-2-2026-08-19.md`](../lai-thu-nguoi-la-van-2-2026-08-19.md).

## Nhật ký vấp

| # | Loại | Mục tiêu | Vấp gì (nguyên văn người-lạ) | Bằng chứng |
|---|---|---|---|---|
| 1 | CHẶN | "đổi sang khổ vuông Instagram, nền sáng" | "Gõ sai **TÊN** tham số bị nuốt hoàn toàn im lặng… Gõ sai GIÁ TRỊ thì bị chửi to; gõ sai TÊN thì bị lờ và trả về ảnh *thành công* sai nội dung." Ba khoá dính: `themes` (thừa s), `label`, `duration` | md5 dưới đây |
| 2 | KHÓ-CHỊU | như trên | Không đoán trước được mình rơi vào kiểu nào — im lặng hay báo lỗi | [luot-b](../lai-thu-nguoi-la-van-2-2026-08-19/transcripts/luot-b-nguoi-dung-vung.md) vấp 3 |

## Đối chứng md5 (có đối chứng dương)

```
MD5 b2-thu1.json = 5e347436c13f97020811cc51ae9204c9   ← themes:"carrara"  (SAI TÊN)
MD5 b2-thu2.json = 5e347436c13f97020811cc51ae9204c9   ← bỏ hẳn khoá theme
MD5 b2-thu3.json = 9ce052ec5c12618f9386ec7186ca306a   ← theme:"carrara"   (ĐÚNG TÊN)
```

`thu1 == thu2` ⇒ gõ sai tên **bằng đúng như không gõ**.
`thu3 ≠ thu1` ⇒ viết đúng thì kết quả CÓ đổi — đối chứng dương đạt, nên khẳng
định "bị nuốt" không phải suy diễn.

Ghi chú: `render_map` tất định (chạy lại ra byte y chang), nên md5 đủ răng cho ca
này — khác với `route-journey` ở [`routes-measurements`](../routes-measurements/stranger-drive.md).

## Quan hệ với ván #1

Ván #1 đã ghi vấp này ở `compile_motion` (mục P1-4). Ván #2 **mở rộng bề mặt**:
cùng lỗ hổng đó cũng có ở `render_map`/`render_recipe`, với ba khoá khác. Vẫn tính
là **tái xuất**, không phải phát hiện mới.

## Chuyển phiên người

Không có câu nào riêng cho slug này — xem hồ sơ tổng.
