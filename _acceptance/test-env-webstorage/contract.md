---
schema_version: 1
feature: Bộ test sống được khi runtime của máy đổi — vá thiếu localStorage
slug: test-env-webstorage
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: approved
approved_by: Phan Le Manh
approved_at: 2026-08-19T11:50:03Z
human_signoff:
time_human_minutes: {}
---

# Acceptance Contract: test-env-webstorage

## Context

Ngày 2026-08-19, giữa một phiên làm việc, Node trên máy dev tự nâng từ 24.16 lên
26.7 (nhị phân sửa lúc 17:28). Node 26 khai sẵn `localStorage` toàn cục ở dạng
**getter trả về `undefined`** khi thiếu cờ `--localstorage-file`; getter đó che
luôn bản của jsdom, nên `window.localStorage === globalThis.localStorage` và cả
hai đều `undefined`.

Hệ quả đo được: **24 ca / 4 tệp** đỏ, tất cả đều là tệp chạm kho trạng thái có
lưu. Chạy lại đúng commit sáng cùng ngày từng xanh 617 ca thì nay đỏ 24 — **cùng
mã, khác máy**.

Đây là lớp lỗi cổng nghiệm thu **không thể thấy**: nó canh mã đổi và mốc commit,
còn runtime của máy chủ nhà thì đi qua không để lại dấu vết nào trong kho. Gói
này không sửa Node; nó làm bộ test thôi phụ thuộc vào việc runtime có tử tế hay
không.

Hai đường đã đo, chọn đường thứ hai:
- Cờ `--no-experimental-webstorage`: chạy được trên Node 26 (10/10 xanh) nhưng
  là cược rằng mọi Node khác cũng hiểu cờ đó — CI đang chạy **Node 22**.
- Bản vá CÓ ĐIỀU KIỆN trong tệp setup của bộ test: chỉ cài khi môi trường không
  có kho lưu dùng được. Đo thật: **25/25 xanh** trên Node 26, và là việc-không-làm-gì
  trên môi trường đã có kho lưu thật.

Source input: sự cố đo được trong phiên 2026-08-19.

## Criteria

- AC-1: Given môi trường chạy test **không có** `localStorage` dùng được, When bộ test khởi động, Then một kho lưu trong bộ nhớ được cài vào, và nó theo **đúng ngữ nghĩa Web Storage** ở những điểm sản phẩm dựa vào: giá trị bị ép về chuỗi (`setItem(k, 1)` rồi đọc ra `'1'`), khoá chưa đặt trả `null` chứ không phải `undefined`, `length` và `key(i)` đúng sau khi xoá. Một kho lưu dễ tính hơn thật sẽ làm test xanh trong khi trình duyệt thật vỡ.
- AC-1b: Given bất kỳ lượt chạy test nào, When bộ test khởi động xong, Then nhánh mà bản vá đã chọn phải **quan sát được từ bên ngoài** (đã vá hay không, và vì sao). Không có mốc này thì không phép đo nào phân biệt được "môi trường lành" với "bản vá đã đè lên kho thật".
- AC-2: Given môi trường **đã có** `localStorage` thật (jsdom trên Node cũ, hoặc CI Node 22), When bộ test khởi động, Then bản vá **KHÔNG** đè lên bản thật. Đè lên là tự tay đổi thứ đang đo: test sẽ xanh trên một kho lưu không phải kho mà sản phẩm dùng.
- AC-3: Given mã sản phẩm, When quét, Then **không** tệp nào trong `src/` hay `mcp-server/` nhập tệp vá này — nó chỉ sống trong làn test. Một bản vá lọt vào bundle là thay đổi hành vi sản phẩm dưới danh nghĩa sửa test.
- AC-4 *(no-regression)*: Given toàn bộ bộ test đơn vị, When chạy trên runtime hiện tại của máy, Then 0 ca đỏ, VÀ chứng minh được bằng số rằng bốn tệp từng đỏ **đã thật sự chạy lại**: mỗi tệp có số ca đạt lớn hơn 0, đọc từ báo cáo máy-đọc-được chứ không suy từ mã thoát của cả bộ.
- AC-5: Given bản vá chạy trong tệp setup dùng chung cho MỌI tệp test, When hai tệp test khác nhau cùng chạy, Then kho lưu của tệp sau **bắt đầu rỗng** — không thấy khoá do tệp trước ghi. Một kho lưu dùng chung ở mức module sẽ làm bộ test hết tất định, xanh hay đỏ tuỳ thứ tự.

## Coverage

- **Trục Có/không có kho lưu**: thiếu thì vá (AC-1) | có thì không đụng (AC-2) — [thước CE: hai chiều bắt buộc, vì một bản vá cài vô điều kiện vẫn làm mọi test xanh và không phép đo kết quả nào phân biệt được]
- **Trục Rò rỉ sang sản phẩm**: AC-3 — bản vá phải chết ở biên làn test
- **Trục Không hồi quy**: AC-4 — bốn tệp từng đỏ phải xanh lại, và phải chứng minh được là đã chạy
- **Trục Cách ly**: AC-5 — kho lưu không rò trạng thái giữa các tệp test
- **Trục Trung thực của bản vá**: AC-1 ngữ nghĩa + AC-1b mốc quan sát được — [thước CE: một bản vá cài vô điều kiện vẫn làm mọi phép đo kết quả xanh, nên phải đo CHÍNH nhánh quyết định, không đo hệ quả]

## Out of scope

- **Không** sửa Node, không ghim phiên bản Node cho máy dev. Kho không có quyền đó.
- **Không** thêm cờ `NODE_OPTIONS` vào lệnh test: CI chạy Node 22, và một cờ mà bản đó không hiểu sẽ làm Node không khởi động nổi — đổi một lỗi thấy được thành một lỗi khó hiểu hơn.
- **Không** đụng kho trạng thái của sản phẩm. Nó không sai; môi trường mới sai.
- **Không** đặt mục tiêu chạy được trên MỌI phiên bản Node tương lai. Gói này chỉ chốt: thiếu kho lưu thì tự vá, có thì để yên.

## Notes

- Risk tier T2: chạm `vitest.config.ts` và một tệp setup mới, không chạm hai đường khoá.
- Bài học đi kèm, ghi để lần sau đọc lại: **mọi bằng chứng đã ghim của kho đều đo trên một runtime cụ thể**, mà mốc ghim không ghi runtime. Sự cố này là lần đầu điều đó lộ ra.
