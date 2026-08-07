---
schema_version: 1
feature: Gác /mcp bằng bearer + fail-closed khi bind ngoài loopback
slug: mcp-auth
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: implemented
approved_by: manh
approved_at: 2026-08-07T10:00:00Z
time_human_minutes: {gate1: 3, gate2: 0}
---

# Acceptance Contract: mcp-auth

## Context

P0 bảo mật nêu từ đầu phiên và hoãn qua bốn PR. Hai lỗ, cùng một gốc:

**Lỗ 1 — cửa fall-through không được gác.** Phép kiểm bearer bị **chép** vào ba route
REST (`/render`, `/render-clip`, `/jobs`), còn nhánh `/mcp` — cửa nhận **mọi thứ còn lại** —
không có phép kiểm nào. Production bind `0.0.0.0` (`render.yaml:31`) và **có** đặt
`MAPPOSTER_TOKEN`, nên MCP transport đang phục vụ public mà không cần credential. README
lại nói bearer áp *"as everything else on this server"* — tài liệu khẳng định một điều mã
không làm.

**Lỗ 2 — token là tuỳ chọn.** `if (token && ...)` nghĩa là quên đặt token thì **không gác
gì cả**. Chấp nhận được trên loopback (dev cục bộ), nhưng bind ra ngoài loopback mà không
token là phơi một server điều khiển trình duyệt và ghi file ra mạng.

Gốc chung của cả hai: **một phép kiểm bị chép nhiều lần thì sớm muộn có chỗ quên chép**.

## Criteria

- AC-1: Given `MAPPOSTER_TOKEN` đã đặt, When gọi `/mcp` **không** kèm bearer, Then trả **401**.
- AC-2: Given `MAPPOSTER_TOKEN` đã đặt, When gọi `/mcp` kèm bearer **sai**, Then trả **401**.
- AC-3: Given `MAPPOSTER_TOKEN` đã đặt, When gọi `/mcp` kèm bearer **đúng**, Then đi tiếp bình thường — siết auth không được chặn người gọi hợp lệ.
- AC-4: Given **không** đặt `MAPPOSTER_TOKEN` và bind loopback, When gọi `/mcp`, Then **không** đòi bearer — dev cục bộ vẫn chạy mà không phải cấu hình.
- AC-5: Given `MAPPOSTER_HTTP_HOST` bind **ngoài** loopback và **không** có `MAPPOSTER_TOKEN`, When khởi động server, Then **từ chối khởi động** kèm thông điệp nêu tên env và cách khắc phục.
- AC-6: Given bind ngoài loopback **và có** token, When khởi động, Then server lên bình thường.
- AC-7: Given toàn bộ `http.ts`, When soi bất biến, Then tồn tại **đúng MỘT** nơi so sánh bearer, **mọi** cửa vào (ba route REST + fall-through `/mcp`) đều gọi guard đó, và chốt fail-closed có **phép so sánh thật** chứ không chỉ chuỗi lỗi.
- AC-8: Given README, When đọc phần REST, Then nó mô tả đúng thực tế: bearer áp cho **cả** `/mcp`, và luật fail-closed được ghi ra.

## Coverage

- **Trục Cửa vào**: `/render` | `/render-clip` | `/jobs` | fall-through `/mcp` — [thước CE: AC-7 đếm số cửa gọi guard phải ≥ 4]
- **Trục Chiều kiểm**: từ chối đúng (AC-1,2,5) | cho qua đúng (AC-3,6) | **không** đòi khi không cần (AC-4 — nửa suppression: siết auth không được biến dev cục bộ thành phải cấu hình)
- **Trục Hình dạng lỗi**: chép lại phép kiểm (AC-7 đếm số nơi so sánh) | quên gác một cửa (AC-7 đếm số cửa) | tài liệu nói sai (AC-8) — [thước CE: negative control tái tạo đúng lỗ gốc cho thấy 54/54 unit test VẪN XANH, chỉ bất biến bắt]

Chưa quét: xoay/thu hồi token, rate-limit theo token, hay nhiều token. Chưa có caller yêu cầu; gói này chỉ đóng lỗ đang mở.

## Out of scope

- **Không** thêm cơ chế auth mới (OAuth, mTLS, JWT). Bearer đã có sẵn và đã được OneHub dùng; đổi cơ chế là việc khác, cần caller đồng ý.
- **Không** thêm rate-limit hay quota theo token. Khác vấn đề.
- **Không** đổi `Host`/`Origin` guard. Nó đã đúng và không liên quan lỗ này.
- **Không** bắt buộc token trên loopback. Làm thế là biến `npm run mcp:http` cục bộ thành phải cấu hình, đổi một lỗ bảo mật lấy một rào cản dùng thử.

## Notes

- **Risk tier T2**: không chạm `src/lib/export.ts` lẫn `src/lib/mapStyle.ts`.
- Bảy hợp đồng đã ký đều stale evidence do gói này chạm code.
