---
schema_version: 2
feature_slug: async-job-queue
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a0b84bd293380f7648670cc088e0324ace439843
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
| E8b | AC-6 | test | PASS |
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
| E20 | AC-15 | judgment | PASS (proposal, 2-1 split) |

## Evidence

- eval: E1
  run_id: minted-async-job-queue-E1-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E2
  run_id: minted-async-job-queue-E2-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E3
  run_id: minted-async-job-queue-E3-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E4
  run_id: minted-async-job-queue-E4-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  11 passed (11)
    Start at  11:03:08
    Duration  938ms (transform 35ms, setup 0ms, import 44ms, tests 5ms, environment 762ms)

- eval: E5
  run_id: minted-async-job-queue-E5-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E6
  run_id: minted-async-job-queue-E6-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E7
  run_id: minted-async-job-queue-E7-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  17 passed (17)
    Start at  11:03:08
    Duration  1.43s (transform 210ms, setup 0ms, import 290ms, tests 139ms, environment 824ms)

- eval: E8
  run_id: minted-async-job-queue-E8-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E8b
  run_id: minted-async-job-queue-E8b-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  17 passed (17)
    Start at  11:03:08
    Duration  1.43s (transform 210ms, setup 0ms, import 290ms, tests 139ms, environment 824ms)

- eval: E9
  run_id: minted-async-job-queue-E9-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  17 passed (17)
    Start at  11:03:08
    Duration  1.43s (transform 210ms, setup 0ms, import 290ms, tests 139ms, environment 824ms)

- eval: E10
  run_id: minted-async-job-queue-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  17 passed (17)
    Start at  11:03:08
    Duration  1.43s (transform 210ms, setup 0ms, import 290ms, tests 139ms, environment 824ms)

- eval: E11
  run_id: minted-async-job-queue-E11-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E12
  run_id: minted-async-job-queue-E12-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-05T11:03:07Z
  output: |
    Tests  32 passed (32)
    Start at  11:03:07
    Duration  1.40s (transform 160ms, setup 0ms, import 276ms, tests 239ms, environment 708ms)

- eval: E13
  run_id: minted-async-job-queue-E13-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  31 passed (31)
    Start at  11:03:08
    Duration  1.23s (transform 223ms, setup 0ms, import 365ms, tests 17ms, environment 688ms)

- eval: E14
  run_id: minted-async-job-queue-E14-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  17 passed (17)
    Start at  11:03:08
    Duration  1.43s (transform 210ms, setup 0ms, import 290ms, tests 139ms, environment 824ms)

- eval: E15
  run_id: minted-async-job-queue-E15-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  17 passed (17)
    Start at  11:03:08
    Duration  1.43s (transform 210ms, setup 0ms, import 290ms, tests 139ms, environment 824ms)

- eval: E16
  run_id: minted-async-job-queue-E16-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  17 passed (17)
    Start at  11:03:08
    Duration  1.43s (transform 210ms, setup 0ms, import 290ms, tests 139ms, environment 824ms)

- eval: E17
  run_id: minted-async-job-queue-E17-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  11 passed (11)
    Start at  11:03:08
    Duration  938ms (transform 35ms, setup 0ms, import 44ms, tests 5ms, environment 762ms)

- eval: E18
  run_id: minted-async-job-queue-E18-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  49 passed (49)
    Start at  11:03:08
    Duration  2.25s (transform 325ms, setup 0ms, import 1.08s, tests 117ms, environment 870ms)

- eval: E19
  run_id: minted-async-job-queue-E19-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T11:03:08Z
  output: |
    Tests  31 passed (31)
    Start at  11:03:08
    Duration  1.23s (transform 223ms, setup 0ms, import 365ms, tests 17ms, environment 688ms)

- eval: E20
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — fresh context
  proposal: PASS
  votes:
    - domain-correctness: PASS — Ba thiếu sót đầu (không gọi ngược, không tiến độ, không huỷ) đều được tài liệu biện minh rõ ràng gắn với hành vi thực tế của OneHub hôm nay (đã tự xử lý 429 nghĩa là đã quen kiểu hỏi-lại; không ai nêu nhu cầu tiến độ/huỷ) nên không chặn việc dọn sang ở vòng đầu. Thiếu sót thứ tư — restart xoá sạch mã việc — không bị giấu: contract.md (Out of scope) và design doc (§2 bảng ràng buộc, §6) nêu đích danh đây là "Áp lực 4" do chính chủ repo đặt ra nhưng cố ý chưa giải quyết, có lý do hạ tầng/tiền rõ ràng và hẹn hợp đồng riêng ở vòng sau — đúng đòi hỏi "hoặc nêu đích danh thứ còn thiếu" của AC-15. Vì AC-15 tự nhận là judgment cần chữ ký người ở Gate 2 nên đây là phần việc con người xác nhận thêm, nhưng xét thuần trên tài liệu thì không có khái niệm nào bị bỏ sót âm thầm.
    - operational-feasibility: PASS — Ba thiếu sót đầu (không gọi ngược, không tiến độ, không huỷ) là mẫu hình chuẩn cho gửi-việc/hỏi-việc — OneHub chỉ cần đổi từ "giữ kết nối chờ" sang "hỏi lại theo nhịp", không cần khái niệm mới, và cả ba đều được liệt kê tường minh kèm lý do ở mục Out of scope. Thiếu sót thứ tư — khởi động lại làm mọi mã việc thành vô danh — không bị giấu: cả contract (Out of scope, dòng 122-124) và design doc (§2 bảng ràng buộc, §6 "Nói thẳng chứ không giấu vào chú thích") nêu đích danh hệ quả cụ thể (người gọi nhận 404) và khoanh vùng nó vào một hợp đồng riêng của vòng sau; AC-15 chỉ đòi hỏi "đủ mà không cần thêm khái niệm — hoặc nêu đích danh thứ còn thiếu", và vế thứ hai đã được thoả. Vì cả bốn khoảng trống đều được đặt tên và giải trình rõ ràng thay vì bị bỏ sót, giao ước đạt tiêu chí AC-15 ở vòng đầu.
    - spec-alignment: FAIL — Ba thiếu sót (không gọi ngược, không tiến độ, không huỷ) được contract tự liệt kê trong ngoặc ở chính AC-15 là chấp nhận được — design doc §1 xác nhận đây chỉ là "phần vành" chưa ai cần, đúng khuôn submit-poll của Shotstack/Bannerbear. Nhưng "khởi động lại = mọi mã việc thành vô danh" KHÔNG nằm trong danh sách chấp nhận-được đó của AC-15, và design doc §1 nói rõ đây là áp lực #4 mà chủ repo đã nêu tường minh nhưng gói này cố ý không giải quyết ("Gói này nhận 1–3... Áp lực 4 cố ý để lại") — khác về bản chất với ba cái kia (chưa từng bị yêu cầu), đây là một nhu cầu thật bị bỏ ngỏ, không có gợi ý resubmission/idempotency nào cho OneHub khi lệch giữa "mã chưa từng tồn tại" và "mã bị mất do redeploy" (AC-4 cố ý gộp chung 404). Đây là thứ chặn việc dọn sang production-grade mà không cần OneHub tự phát minh thêm khái niệm phục hồi.
  verdict: PASS (proposal, 2-1 split — pending human review)
  human_override:

## Lệnh không gắn eval

Các lệnh dưới đây không được gán vào eval nào cụ thể (evals: []) nên không có block Evidence riêng theo id, nhưng được ghi rõ tại đây vì một trong số chúng là nguyên nhân trực tiếp của verdict REJECT tổng thể.

- cmd: `npm test`
  exit_code: 0
  role: regression-guard toàn repo (388 passed, 7 skipped / 395)
  output: |
    Tests  388 passed | 7 skipped (395)
    Start at  11:03:07
    Duration  4.47s (transform 3.05s, setup 0ms, import 10.97s, tests 5.13s, environment 24.58s)

- cmd: `npm run test:e2e`
  exit_code: 0
  role: regression-guard e2e toàn repo (14 passed)
  output: |
    ✓  14 [chromium] › e2e/render-mode.spec.ts:207:1 › motion: verifyAndReapplyGeoAt guards a reverted highlight source even when highlight.fill is false (Finding 1) (2.2s)

    14 passed (44.8s)

- cmd: `npm run test:mcp`
  exit_code: 1
  role: NGUYÊN NHÂN TRỰC TIẾP của verdict REJECT — không map vào eval nào trong contract, nhưng là một test tích hợp có sẵn trong repo (renderClip.test.ts) và exit khác 0 nghĩa là cây đang xác minh KHÔNG xanh toàn phần.
  output: |
    Test Files  1 failed | 2 passed (3)
    Tests  1 failed | 6 passed (7)
    Start at  11:03:08
    Duration  59.73s (transform 92ms, setup 0ms, import 1.74s, tests 56.35s, environment 1.26s)

    FAIL  mcp-server/src/renderClip.test.ts > renderClipFrames (integration) > renders fps×duration frames plus a settle still (AC-5)
    TimeoutError: page.waitForFunction: Timeout 20000ms exceeded.

## Analyst

none — mọi eval feature đều red trên baseline (có phân biệt)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: All 19 machine evals (E1–E19) exit 0 on HEAD and the E20 judgment panel unanimously proposed PASS; verdict is REJECT because review (see review-findings.md, section "Trong hợp đồng") found that `isCallerFault` in mcp-server/src/jobRunner.ts:42 misclassifies genuine caller-input failures (bad theme, bad format, bad geojson) as errorKind 'server', violating AC-6's "phân biệt rõ lỗi tại người gọi hay tại máy chủ" — a defect the existing E8 test does not exercise, since it only covers a genuine server-side throw. Returned to implementation.

Round 2: E8b (mới, phủ trực tiếp ca phân loại lỗi người gọi ở jobRunner cho AC-6) cùng toàn bộ 19 eval máy còn lại và panel E20 đều xanh, đóng lại phát hiện round 1; nhưng verdict vẫn REJECT vì `npm run test:mcp` (lệnh không gắn eval, phủ tích hợp renderClip.test.ts) exit 1 — timeout 20s tại ca "renders fps×duration frames plus a settle still" (AC-5) — chưa rõ do gói job-queue gây ra hay do môi trường render, cần điều tra trước khi merge.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
