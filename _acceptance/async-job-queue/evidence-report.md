---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 175a9363622088937f1f95e0846a8a0e659fc5d4
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
| E20 | AC-15 | judgment | PASS (proposal, 2-1) |
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-async-job-queue-E1-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E2
  run_id: minted-async-job-queue-E2-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E3
  run_id: minted-async-job-queue-E3-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E4
  run_id: minted-async-job-queue-E4-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:03:17Z
  output: |
    Tests  16 passed (16)
    Start at  16:03:17
    Duration  919ms (transform 55ms, setup 0ms, import 67ms, tests 4ms, environment 496ms)

- eval: E5
  run_id: minted-async-job-queue-E5-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E6
  run_id: minted-async-job-queue-E6-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E7
  run_id: minted-async-job-queue-E7-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E8
  run_id: minted-async-job-queue-E8-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E8b
  run_id: minted-async-job-queue-E8b-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E9
  run_id: minted-async-job-queue-E9-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E10
  run_id: minted-async-job-queue-E10-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E11
  run_id: minted-async-job-queue-E11-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E12
  run_id: minted-async-job-queue-E12-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-05T16:03:23Z
  output: |
    Tests  32 passed (32)
    Start at  16:03:23
    Duration  648ms (transform 75ms, setup 0ms, import 129ms, tests 80ms, environment 313ms)

- eval: E13
  run_id: minted-async-job-queue-E13-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T16:03:17Z
  output: |
    Tests  31 passed (31)
    Start at  16:03:17
    Duration  1.02s (transform 142ms, setup 0ms, import 243ms, tests 10ms, environment 617ms)

- eval: E14
  run_id: minted-async-job-queue-E14-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E15
  run_id: minted-async-job-queue-E15-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E16
  run_id: minted-async-job-queue-E16-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E17
  run_id: minted-async-job-queue-E17-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:03:17Z
  output: |
    Tests  16 passed (16)
    Start at  16:03:17
    Duration  919ms (transform 55ms, setup 0ms, import 67ms, tests 4ms, environment 496ms)

- eval: E18
  run_id: minted-async-job-queue-E18-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:03:19Z
  output: |
    Tests  49 passed (49)
    Start at  16:03:19
    Duration  3.11s (transform 481ms, setup 0ms, import 1.68s, tests 249ms, environment 1.01s)

- eval: E19
  run_id: minted-async-job-queue-E19-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T16:03:17Z
  output: |
    Tests  31 passed (31)
    Start at  16:03:17
    Duration  1.02s (transform 142ms, setup 0ms, import 243ms, tests 10ms, environment 617ms)

- eval: E20
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — fresh context
  proposal: PASS
  votes:
    - domain-correctness: PASS — Cả bốn thiếu sót đều được contract/design công khai và tự biện minh, không nằm ngoài mục tiêu gói này tự nhận (chỉ giải quyết áp lực 1-3, "không gọi ngược / không tiến độ / không huỷ" là ít hơn hoặc bằng status-quo đồng bộ, không phải bước lùi). Riêng "restart -> vô danh" là áp lực 4 bị hoãn có chủ ý và nói thẳng trong cả Context, Out of scope và Notes — cũng không tệ hơn đường đồng bộ cũ (mất kết nối giữa chừng cũng mất thông tin tương tự), và một mã từng hợp lệ bỗng nhiên 404 là tín hiệu đủ rõ để OneHub suy ra restart rồi gửi lại, không cần khái niệm mới. Không cái nào trong bốn thứ chặn việc OneHub đổi sang submit-rồi-hỏi cho lợi ích 429 và giữ-kết-nối-mở; đây là đánh đổi vòng đầu đã được nêu đích danh chứ không ẩn giấu.
    - operational-feasibility: PASS — Ba thiếu sót đầu (không gọi ngược, không tiến độ, không huỷ) không phải thoái lui so với OneHub hôm nay: đường /render-clip đồng bộ hiện tại cũng không có tiến độ, không có huỷ, và việc giữ kết nối chờ xong đã tương đương ngữ nghĩa với việc chờ rồi hỏi lại — chuyển sang polling POST /jobs/status là đổi cơ chế chờ, không phải thêm khái niệm mới. Thiếu sót thứ tư (restart làm mọi mã việc thành vô danh, trả 404) là khác biệt thật so với hôm nay, nhưng hợp đồng đã nêu đích danh nó nhiều lần (Out of scope + Notes trong contract.md, và bảng ràng buộc §2 cùng §6 trong design doc) kèm hệ quả rõ ràng (404 → coi như mất, gửi lại) — tức là thoả đúng nhánh "hoặc nêu đích danh thứ còn thiếu" của AC-15, không phải một lỗ hổng bị giấu. Vì vậy không có thiếu sót nào trong bốn cái chặn việc dọn sang ở vòng đầu theo đúng khuôn đã ký.
    - spec-alignment: FAIL — Ba thiếu sót "không gọi ngược / không tiến độ / không huỷ" không chặn: chúng chỉ đổi cách chờ (poll thay vì giữ kết nối) và OneHub vốn dĩ chưa từng có ba khái niệm đó ở đường đồng bộ hiện tại, nên không mất gì so với bây giờ. Cái chặn thật là "khởi động lại = mọi mã việc thành vô danh": 404 ở /jobs/status gộp ba nghĩa khác nhau (mã bịa, đã dọn vì hết TTL sau khi xong, hoặc mất vì server restart) làm một, nên OneHub buộc phải tự bịa thêm một khái niệm mới — chiến lược đối chiếu/gửi lại an toàn khi gặp 404 mơ hồ — mà hai cửa REST không cấp cho họ; chính design doc §1 cũng tự nhận "áp lực 4 (độ bền) cố ý để lại", tức đích thân tài liệu đã nêu tên thứ còn thiếu chứ AC-15 chưa đóng được. Vì vậy claim "đủ để dọn sang mà không cần thêm khái niệm nào" của AC-15 không đứng vững với dữ liệu hai văn bản này — bị chặn bởi đúng một điểm: mất-tính-định-danh-của-mã-việc qua khởi động lại.
  verdict: PASS (proposal, 2-1 majority — pending human review)
  human_override:

## Evidence (tiếp — AC-16, AC-17)

- eval: E21
  run_id: minted-async-job-queue-E21-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:03:17Z
  output: |
    Tests  16 passed (16)
    Start at  16:03:17
    Duration  919ms (transform 55ms, setup 0ms, import 67ms, tests 4ms, environment 496ms)

- eval: E22
  run_id: minted-async-job-queue-E22-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:03:18Z
  output: |
    Tests  18 passed (18)
    Start at  16:03:18
    Duration  1.38s (transform 233ms, setup 0ms, import 319ms, tests 271ms, environment 636ms)

- eval: E23
  run_id: minted-async-job-queue-E23-r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:03:17Z
  output: |
    Tests  16 passed (16)
    Start at  16:03:17
    Duration  919ms (transform 55ms, setup 0ms, import 67ms, tests 4ms, environment 496ms)

## Lệnh không gắn eval

Các lệnh dưới đây không được gán vào eval nào cụ thể (evals: []); cả hai đều xanh và đóng vai trò regression-guard toàn repo.

- cmd: `npm test`
  exit_code: 0
  role: regression-guard toàn repo
  output: |
    Tests  394 passed | 7 skipped (401)
    Start at  16:03:19
    Duration  4.19s (transform 2.58s, setup 0ms, import 10.73s, tests 4.84s, environment 25.24s)

- cmd: `npm run test:e2e && npm run test:mcp`
  exit_code: 0
  role: regression-guard e2e + tích hợp MCP (lệnh nối tiếp theo quyết định d-20260805T071657Z-7029 để hết tranh chấp trình duyệt giữa hai bộ đo)
  output: |
    Duration  48.84s (transform 40ms, setup 0ms, import 990ms, tests 45.89s, environment 1.58s)

    SUMMARY: npm run test:e2e (14 passed) + npm run test:mcp (7 passed) — both suites green.

## Analyst

E1, E2, E3, E5, E6, E8, E11, E18 (npx vitest run mcp-server/src/http.test.ts); E12 (npx vitest run mcp-server/src/tools.test.ts); E13, E19 (npx vitest run mcp-server/src/motionCompiler.test.ts)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: All 19 machine evals (E1–E19) exit 0 on HEAD and the E20 judgment panel unanimously proposed PASS; verdict is REJECT because review (see review-findings.md, section "Trong hợp đồng") found that `isCallerFault` in mcp-server/src/jobRunner.ts:42 misclassifies genuine caller-input failures (bad theme, bad format, bad geojson) as errorKind 'server', violating AC-6's "phân biệt rõ lỗi tại người gọi hay tại máy chủ" — a defect the existing E8 test does not exercise, since it only covers a genuine server-side throw. Returned to implementation.

Round 2: E8b (mới, phủ trực tiếp ca phân loại lỗi người gọi ở jobRunner cho AC-6) cùng toàn bộ 19 eval máy còn lại và panel E20 đều xanh, đóng lại phát hiện round 1; nhưng verdict vẫn REJECT vì `npm run test:mcp` (lệnh không gắn eval, phủ tích hợp renderClip.test.ts) exit 1 — timeout 20s tại ca "renders fps×duration frames plus a settle still" (AC-5) — chưa rõ do gói job-queue gây ra hay do môi trường render, cần điều tra trước khi merge.

Round 3: Điều tra xác nhận nguyên nhân round 2 là tranh chấp tài nguyên trình duyệt giữa hai bộ đo dùng Chromium chạy song song trong chính vòng nghiệm thu, không phải hồi quy của gói (renderClip.test.ts chạy riêng xanh hai lần 43,6s/41,6s, chỉ trong vòng nghiệm thu mới vượt trần 20s ở 59,7s) — không sửa code sản phẩm; thay vào đó feature_loop.suite_keys được gộp thành một lệnh nối tiếp `npm run test:e2e && npm run test:mcp` (quyết định d-20260805T071657Z-7029), nay exit 0 (7 passed). Toàn bộ 19 eval máy + panel E20 (nay đồng thuận 3-0 PASS, spec-alignment đảo chiều từ FAIL sang PASS sau khi xác nhận contract/design doc đã nêu đích danh khoảng trống "restart xoá mã việc" thoả nhánh thứ hai của AC-15) đều xanh. Verdict: PASS.

Round 4: Contract mở rộng thêm AC-16 (MAPPOSTER_MAX_QUEUED_JOBS và MAPPOSTER_JOB_TTL_MS phải đổi hành vi thật qua env, môi trường trống rơi về mặc định, giá trị rác fail-closed kèm tên biến) và AC-17 (việc clip đang chờ chỗ clip không được ăn chỗ thợ của việc dựng ảnh xếp sau; rút việc bỏ qua cái bị từ chối mà không đảo thứ tự các việc cùng loại) sau commit 175a936 ("nối dây hai núm cấu hình chết + clip chờ chỗ thôi bỏ đói việc dựng ảnh"). Ba eval mới E21/E22/E23 cùng toàn bộ 20 eval cũ (E1–E19) đều exit 0, hai lệnh regression-guard (`npm test`, `npm run test:e2e && npm run test:mcp`) vẫn xanh. Panel E20 được chấm lại full-context (không carry từ round 3): domain-correctness và operational-feasibility giữ nguyên PASS, nhưng spec-alignment đảo ngược lại thành FAIL — viện dẫn rằng 404 mơ hồ sau khi restart (gộp ba nghĩa "mã bịa / đã dọn / mất vì restart" làm một) vẫn buộc OneHub tự bịa một chiến lược đối chiếu/gửi-lại mà hai cửa REST không cấp sẵn. Proposal chung của panel là PASS theo đa số 2-1, để người quyết xử lý dissent này ở Gate 2. Verdict: PASS.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract