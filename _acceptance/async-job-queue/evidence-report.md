---
schema_version: 2
feature_slug: async-job-queue
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 3ce3a1076d5a5dcd757919cfdfc9d8ab06a05032
human_signoff:
---

# Evidence Report: async-job-queue

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-10 | test | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-11 | test | PASS |
| E16 | AC-12 | test | PASS |
| E17 | AC-12 | test | PASS |
| E18 | AC-13 | test | PASS |
| E19 | AC-14 | test | PASS |
| E20 | AC-15 | judgment | PASS (proposal) |

## Evidence

- eval: E1
  run_id: minted-async-job-queue-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E2
  run_id: minted-async-job-queue-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E3
  run_id: minted-async-job-queue-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E4
  run_id: minted-async-job-queue-E4-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  11 passed (11)
    Start at  10:40:14
    Duration  1.47s (transform 86ms, setup 0ms, import 99ms, tests 8ms, environment 1.15s)

- eval: E5
  run_id: minted-async-job-queue-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E6
  run_id: minted-async-job-queue-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E7
  run_id: minted-async-job-queue-E7-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T10:40:13Z
  output: |
    Tests  14 passed (14)
    Start at  10:40:13
    Duration  1.43s (transform 157ms, setup 0ms, import 271ms, tests 190ms, environment 822ms)

- eval: E8
  run_id: minted-async-job-queue-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E9
  run_id: minted-async-job-queue-E9-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T10:40:13Z
  output: |
    Tests  14 passed (14)
    Start at  10:40:13
    Duration  1.43s (transform 157ms, setup 0ms, import 271ms, tests 190ms, environment 822ms)

- eval: E10
  run_id: minted-async-job-queue-E10-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T10:40:13Z
  output: |
    Tests  14 passed (14)
    Start at  10:40:13
    Duration  1.43s (transform 157ms, setup 0ms, import 271ms, tests 190ms, environment 822ms)

- eval: E11
  run_id: minted-async-job-queue-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E12
  run_id: minted-async-job-queue-E12-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-05T10:40:13Z
  output: |
    Tests  32 passed (32)
    Start at  10:40:13
    Duration  2.19s (transform 230ms, setup 0ms, import 367ms, tests 664ms, environment 988ms)

- eval: E13
  run_id: minted-async-job-queue-E13-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  31 passed (31)
    Start at  10:40:14
    Duration  1.85s (transform 153ms, setup 0ms, import 247ms, tests 9ms, environment 1.24s)

- eval: E14
  run_id: minted-async-job-queue-E14-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T10:40:13Z
  output: |
    Tests  14 passed (14)
    Start at  10:40:13
    Duration  1.43s (transform 157ms, setup 0ms, import 271ms, tests 190ms, environment 822ms)

- eval: E15
  run_id: minted-async-job-queue-E15-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T10:40:13Z
  output: |
    Tests  14 passed (14)
    Start at  10:40:13
    Duration  1.43s (transform 157ms, setup 0ms, import 271ms, tests 190ms, environment 822ms)

- eval: E16
  run_id: minted-async-job-queue-E16-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T10:40:13Z
  output: |
    Tests  14 passed (14)
    Start at  10:40:13
    Duration  1.43s (transform 157ms, setup 0ms, import 271ms, tests 190ms, environment 822ms)

- eval: E17
  run_id: minted-async-job-queue-E17-r1
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  11 passed (11)
    Start at  10:40:14
    Duration  1.47s (transform 86ms, setup 0ms, import 99ms, tests 8ms, environment 1.15s)

- eval: E18
  run_id: minted-async-job-queue-E18-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  49 passed (49)
    Start at  10:40:14
    Duration  3.09s (transform 292ms, setup 0ms, import 1.30s, tests 93ms, environment 1.31s)

- eval: E19
  run_id: minted-async-job-queue-E19-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T10:40:14Z
  output: |
    Tests  31 passed (31)
    Start at  10:40:14
    Duration  1.85s (transform 153ms, setup 0ms, import 247ms, tests 9ms, environment 1.24s)

- eval: E20
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — fresh context
  proposal: PASS
  votes:
    - domain-correctness: PASS — Ca bon "thieu sot" deu duoc contract/design doc neu dich danh va giai thich ly do co y hoan (Out of scope + §9): phai tu hoi lai la ban chat cua mo hinh gui-viec (thay the ket noi dong bo, khong phai thieu sot an giau), khong bao tien do va khong huy viec deu la nhu cau chua phat sinh, va "restart = ma viec thanh vo danh" duoc noi thang ("khong giau vao chu thich") kem huong xu ly tuong tu voi cach OneHub dang tu xu ly 429 hom nay (gui lai). Khong cai nao pha vo giao thuc dong-hoi co ban (202+id ngay lap tuc, 200/404 ro rang, errorKind phan biet loi ai, TTL da cong bo) can de OneHub gui viec roi hoi trang thai — nen khong co cai nao chan viec don sang o vong dau.
    - operational-feasibility: PASS — Hai cửa (nhận việc trả 202+id, hỏi việc trả pending/running/done/failed kèm errorKind và kết quả xuống-cấp) đủ tín hiệu để OneHub tự dựng vòng hỏi-lặp-có-hạn thay cho kết nối đồng bộ, và ba núm (workers, hàng chờ, TTL) đã công bố sẵn để họ đặt hạn chờ phía client. Ba thiếu sót "không gọi ngược / không tiến độ / không huỷ" không chặn vì OneHub chưa từng cần các khái niệm đó ở đường đồng bộ hiện tại — hỏi-lặp thay gọi-ngược là đánh đổi chuẩn ngành, không phải khái niệm mới. Thiếu sót thứ tư — restart xoá sạch danh tính mã việc, trả 404 không phân biệt được với TTL hết hạn hay mã bịa — không chặn việc dọn sang vì nó không tạo rủi ro MỚI so với đường đồng bộ cũ (mất kết nối giữa lúc deploy cũng khiến caller mất dấu vết y hệt), miễn OneHub áp dụng đúng ngưỡng hạn chờ đã công bố (TTL mặc định 30 phút) làm tín hiệu "coi như mất, tự gửi lại".
    - spec-alignment: PASS — Contract §Out of scope và design doc §1/§9 đặt tên đích danh cả bốn thiếu sót (webhook, tiến độ, huỷ việc, độ bền qua restart) kèm lý do rõ ràng cho từng cái — không cái nào bị giấu vào chú thích. Hình dạng hai cửa (202+id; poll ra pending/running/done/hỏng với errorKind, hoặc 404 cho mã lạ/hết hạn/mất-do-restart) đã đủ để OneHub thay thế đúng hành vi hiện tại (gọi đồng bộ + tự xử lý 429) bằng một vòng gửi-rồi-hỏi, không cần khái niệm giao thức mới nào — kể cả sự kiện restart cũng chỉ đổ về cùng tín hiệu 404 mà OneHub vốn đã phải xử lý dạng lỗi-kết-nối ở đường đồng bộ cũ. Không có mục nào trong bốn mục chặn cứng việc dọn sang ở vòng đầu.
  verdict: PASS (proposal — pending human review)
  human_override:

## Analyst

E1, E2, E3, E5, E6, E8, E11, E18, E12, E13, E19

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: All 19 machine evals (E1–E19) exit 0 on HEAD and the E20 judgment panel unanimously proposed PASS; verdict is REJECT because review (see review-findings.md, section "Trong hợp đồng") found that `isCallerFault` in mcp-server/src/jobRunner.ts:42 misclassifies genuine caller-input failures (bad theme, bad format, bad geojson) as errorKind 'server', violating AC-6's "phân biệt rõ lỗi tại người gọi hay tại máy chủ" — a defect the existing E8 test does not exercise, since it only covers a genuine server-side throw. Returned to implementation.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
