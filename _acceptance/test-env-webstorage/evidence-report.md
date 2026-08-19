---
schema_version: 2
feature_slug: test-env-webstorage
verdict: PASS
failed_evals: []
reason: "Vòng 1 ở fcb64d7: bộ test sống lại trên Node 26.7 — 6/6 eval máy thoát 0, bộ đầy đủ 629 đạt 0 đỏ, và bốn tệp từng chết đều chứng minh được là đã chạy lại."
verified_by: Claude Opus 5 (phiên 2026-08-19) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: fcb64d7e71aaaa320926cd08e92e32ee70da1478
human_signoff: manh — 2026-08-19 (máy gõ theo lệnh của người duyệt trong phiên)
---

# Evidence Report: test-env-webstorage

## Vòng 1 — bộ test sống lại trên Node 26.7, ghim ở `fcb64d7`

**Sự cố:** Node trên máy dev tự nâng 24.16 → 26.7 lúc 17:28 ngày 2026-08-19.
Node 26 khai `localStorage` toàn cục dạng getter trả `undefined`, che luôn bản
của jsdom. 24 ca / 4 tệp đỏ. Checkout đúng commit sáng cùng ngày từng xanh 617
ca thì nay đỏ 24 — **cùng mã, khác máy**.

**Bản vá:** tệp setup của bộ test cài kho lưu trong bộ nhớ CHỈ KHI môi trường
không có kho dùng được, để lại mốc quan sát được, và theo đúng ngữ nghĩa Web
Storage.

**Bảy ca phá thử lúc sinh phép đo** (MEASURE-BIRTH-CLAUSE), mỗi ca đỏ đúng chỗ:

| Phá gì | Phép đo đỏ |
|---|---|
| Bỏ ép kiểu chuỗi trong kho giả | E1 |
| Khoá vắng trả `undefined` thay vì `null` | E1 |
| Cài vô điều kiện, đè cả kho thật | E2 |
| Thôi ghi mốc nhánh đã chọn | E5 |
| Cho một tệp SẢN PHẨM nhập bản vá | E3 (nêu đích danh tệp) |
| Tắt công tắc cô lập của bộ chạy test | E6 |
| Loại một trong bốn tệp khỏi lượt chạy | E4 (script thoát 1) |

**Một phép đo bị bắt là HẰNG ĐÚNG và đã sửa.** Bản đầu của E6 đo sentinel giữa
hai tệp; phá bằng cách biến kho lưu thành singleton dùng chung ở mức module thì
E1 đỏ còn **E6 vẫn xanh** — vì cách ly giữa các tệp do bộ chạy test cô lập
module chứ không do bản vá. E6 nay đo thêm chính công tắc cô lập. Đây là thay
đổi bộ đo SAU khi đóng dấu Cổng 1, có entry trong sổ quyết định và phải hiện ở
Cổng 2.

**6/6 eval máy thoát 0.** Làn suite trên Node 26.7: bộ đơn vị **629 đạt, 0 đỏ**
(script E4 đọc số ca từng tệp từ báo cáo máy-đọc-được) · `test:e2e` 18 đạt ·
`test:mcp` 22 đạt.

`human_signoff` để **RỖNG** — Cổng 2 chờ người ký.

## Evidence

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E5 | AC-1b | test | PASS |
| E3 | AC-3 | test | PASS |
| E6 | AC-5 | test | PASS |
| E4 | AC-4 | script | PASS |

- eval: E1
  criterion: AC-1
  run_id: test-env-webstorage-r1-test_env-20260819
  exit_code: 0
  verifier: config:executors.test.test_env
  verified_at: 2026-08-19T11:58:12Z
  cmd: npx vitest run src/test-env/webstorage.test.ts
  output: |
    Tests 7 passed (2 tệp)
- eval: E2
  criterion: AC-2
  run_id: test-env-webstorage-r1-test_env-20260819
  exit_code: 0
  verifier: config:executors.test.test_env
  verified_at: 2026-08-19T11:58:12Z
  cmd: npx vitest run src/test-env/webstorage.test.ts
  output: |
    Tests 7 passed (2 tệp)
- eval: E5
  criterion: AC-1b
  run_id: test-env-webstorage-r1-test_env-20260819
  exit_code: 0
  verifier: config:executors.test.test_env
  verified_at: 2026-08-19T11:58:12Z
  cmd: npx vitest run src/test-env/webstorage.test.ts
  output: |
    Tests 7 passed (2 tệp)
- eval: E3
  criterion: AC-3
  run_id: test-env-webstorage-r1-test_env-20260819
  exit_code: 0
  verifier: config:executors.test.test_env
  verified_at: 2026-08-19T11:58:12Z
  cmd: npx vitest run src/test-env/webstorage.test.ts
  output: |
    Tests 7 passed (2 tệp)
- eval: E6
  criterion: AC-5
  run_id: test-env-webstorage-r1-test_env-20260819
  exit_code: 0
  verifier: config:executors.test.test_env
  verified_at: 2026-08-19T11:58:12Z
  cmd: npx vitest run src/test-env/webstorage.test.ts
  output: |
    Tests 7 passed (2 tệp)
- eval: E4
  criterion: AC-4
  run_id: test-env-webstorage-r1-suite_coverage-20260819
  exit_code: 0
  verifier: config:executors.script.suite_coverage
  verified_at: 2026-08-19T11:58:12Z
  cmd: npx tsx _acceptance/test-env-webstorage/scripts/suite-coverage.ts
  output: |
    629 đạt · 0 đỏ · bốn tệp từng chết đều có ca đạt > 0
