---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: aa2dc5621131f34ebde4fa1b657c51508a74a3ed
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
| E20 | AC-15 | judgment | PASS (proposal, 3-0) |

## Evidence

- eval: E1
  run_id: minted-async-job-queue-E1-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E2
  run_id: minted-async-job-queue-E2-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E3
  run_id: minted-async-job-queue-E3-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E4
  run_id: minted-async-job-queue-E4-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  11 passed (11)
    Start at  14:18:11
    Duration  1.53s (transform 58ms, setup 0ms, import 93ms, tests 7ms, environment 1.03s)

- eval: E5
  run_id: minted-async-job-queue-E5-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E6
  run_id: minted-async-job-queue-E6-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E7
  run_id: minted-async-job-queue-E7-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  17 passed (17)
    Start at  14:18:11
    Duration  2.14s (transform 367ms, setup 0ms, import 442ms, tests 165ms, environment 1.32s)

- eval: E8
  run_id: minted-async-job-queue-E8-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E8b
  run_id: minted-async-job-queue-E8b-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  17 passed (17)
    Start at  14:18:11
    Duration  2.14s (transform 367ms, setup 0ms, import 442ms, tests 165ms, environment 1.32s)

- eval: E9
  run_id: minted-async-job-queue-E9-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  17 passed (17)
    Start at  14:18:11
    Duration  2.14s (transform 367ms, setup 0ms, import 442ms, tests 165ms, environment 1.32s)

- eval: E10
  run_id: minted-async-job-queue-E10-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  17 passed (17)
    Start at  14:18:11
    Duration  2.14s (transform 367ms, setup 0ms, import 442ms, tests 165ms, environment 1.32s)

- eval: E11
  run_id: minted-async-job-queue-E11-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E12
  run_id: minted-async-job-queue-E12-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-05T14:18:10Z
  output: |
    Tests  32 passed (32)
    Start at  14:18:10
    Duration  1.86s (transform 168ms, setup 0ms, import 257ms, tests 214ms, environment 1.19s)

- eval: E13
  run_id: minted-async-job-queue-E13-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  31 passed (31)
    Start at  14:18:11
    Duration  1.52s (transform 195ms, setup 0ms, import 287ms, tests 20ms, environment 943ms)

- eval: E14
  run_id: minted-async-job-queue-E14-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  17 passed (17)
    Start at  14:18:11
    Duration  2.14s (transform 367ms, setup 0ms, import 442ms, tests 165ms, environment 1.32s)

- eval: E15
  run_id: minted-async-job-queue-E15-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  17 passed (17)
    Start at  14:18:11
    Duration  2.14s (transform 367ms, setup 0ms, import 442ms, tests 165ms, environment 1.32s)

- eval: E16
  run_id: minted-async-job-queue-E16-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  17 passed (17)
    Start at  14:18:11
    Duration  2.14s (transform 367ms, setup 0ms, import 442ms, tests 165ms, environment 1.32s)

- eval: E17
  run_id: minted-async-job-queue-E17-r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  11 passed (11)
    Start at  14:18:11
    Duration  1.53s (transform 58ms, setup 0ms, import 93ms, tests 7ms, environment 1.03s)

- eval: E18
  run_id: minted-async-job-queue-E18-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  49 passed (49)
    Start at  14:18:11
    Duration  3.46s (transform 574ms, setup 0ms, import 2.03s, tests 167ms, environment 957ms)

- eval: E19
  run_id: minted-async-job-queue-E19-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T14:18:11Z
  output: |
    Tests  31 passed (31)
    Start at  14:18:11
    Duration  1.52s (transform 195ms, setup 0ms, import 287ms, tests 20ms, environment 943ms)

- eval: E20
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — fresh context
  proposal: PASS
  votes:
    - domain-correctness: PASS — Hai cửa POST /jobs + POST /jobs/status cấp đủ nguyên liệu tối thiểu (mã việc dùng ngay, hỏi lại ra trạng thái/kết quả, 404 thống nhất cho "mã lạ") để OneHub chuyển từ gọi đồng bộ sang gửi-việc-rồi-hỏi mà không cần phát minh khái niệm mới — hỏi lại theo nhịp thay callback, thiếu tiến độ, thiếu huỷ việc đều khớp đúng hình MVP chuẩn ngành mà chính tài liệu dẫn ra (Shotstack/Bannerbear/AWS MediaConvert: lõi là mã-việc + hỏi-trạng-thái, bỏ phần vành). Khởi động lại làm mã việc thành vô danh không phải khái niệm mới vì nó tái dùng đúng cửa 404 đã định nghĩa cho mã lạ/hết hạn (AC-4), dù nó tái hiện một phần vấn đề "mất trắng khi redeploy" mà gói này vốn nhắm giải quyết — nhưng tài liệu đã nói thẳng điều đó là phạm vi để lại cho hợp đồng độ-bền vòng sau, không phải một khoảng trống bị giấu. Không có thiếu sót nào trong bốn cái buộc thêm khái niệm giao thức mới ở vòng đầu.
    - operational-feasibility: PASS — Ba thiếu sót đầu (không gọi ngược, không tiến độ, không huỷ) không chặn: submit-rồi-hỏi tự nó đã là mô hình OneHub cần dựng, và AC-1/AC-4/AC-5/AC-6 cho đủ vòng lặp hỏi để lấy trạng thái/kết quả mà không cần thêm khái niệm giao thức nào. Thiếu sót thứ tư — khởi động lại xoá sạch mã việc thành 404 — không tệ hơn tình huống OneHub đã phải xử lý ở đường đồng bộ hiện tại (kết nối rớt giữa chừng cũng mù mờ y vậy), và hệ quả được nói thẳng trong cả contract lẫn design doc kèm lý do hoãn có chủ đích, nên chấp nhận được cho vòng đầu. Không có thiếu sót nào trong bốn cái đạt ngưỡng chặn migration hoàn toàn, dù OneHub sẽ phải tự thêm chính sách resubmit khi gặp 404 mơ hồ (không được contract cấp sẵn) — đó là gánh nặng vận hành thêm chứ không phải lỗ hổng chặn cửa.
    - spec-alignment: PASS — Cả hai tài liệu tự đặt tên đích danh bốn khoảng trống này (mục Out of scope + Notes của contract, §2/§6/§9 của design doc): webhook — "OneHub chưa cần, và không có độ bền thì gọi ngược cũng không đáng tin"; tiến độ — "chưa ai hỏi"; huỷ việc — "chưa có nhu cầu nêu ra"; và khởi động lại — nói thẳng "restart = mọi mã việc thành vô danh, người gọi nhận 404" chứ không giấu. Vì AC-15 chấp nhận hai nhánh (đủ khái niệm HOẶC nêu đích danh cái thiếu), và cả bốn cái đều được nêu đích danh kèm lý do vì sao chưa cần ở vòng đầu, không cái nào trong bốn thứ đó bị bỏ sót lặng lẽ — nhánh thứ hai của AC-15 được thoả. Không có căn cứ nào trong hai văn bản cho thấy một trong bốn khoảng trống chặn cứng lối OneHub chuyển từ đồng bộ+tự xử-429 sang gửi-việc+tự hỏi nhịp; 429 ở cửa nhận việc (AC-3) vẫn được giữ y hệt cơ chế OneHub đã quen xử lý.
  verdict: PASS (proposal, 3-0 unanimous — pending human review)
  human_override:

## Lệnh không gắn eval

Các lệnh dưới đây không được gán vào eval nào cụ thể (evals: []); cả hai đều xanh và đóng vai trò regression-guard toàn repo.

- cmd: `npm test`
  exit_code: 0
  role: regression-guard toàn repo
  output: |
    Tests  388 passed | 7 skipped (395)
    Start at  14:18:10
    Duration  4.84s (transform 2.92s, setup 0ms, import 14.16s, tests 4.58s, environment 32.18s)

- cmd: `npm run test:e2e && npm run test:mcp`
  exit_code: 0
  role: regression-guard e2e + tích hợp MCP (gộp nối tiếp theo quyết định d-20260805T071657Z-7029 để hết tranh chấp trình duyệt giữa hai bộ đo trong lúc nghiệm thu — nguyên nhân của REJECT ở round 2)
  output: |
    Tests  7 passed (7)
    Start at  14:18:58
    Duration  46.98s (transform 43ms, setup 0ms, import 902ms, tests 44.72s, environment 1.05s)

## Analyst

E1, E2, E3, E5, E6, E8, E11, E18 (npx vitest run mcp-server/src/http.test.ts); E12 (npx vitest run mcp-server/src/tools.test.ts); E13, E19 (npx vitest run mcp-server/src/motionCompiler.test.ts)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: All 19 machine evals (E1–E19) exit 0 on HEAD and the E20 judgment panel unanimously proposed PASS; verdict is REJECT because review (see review-findings.md, section "Trong hợp đồng") found that `isCallerFault` in mcp-server/src/jobRunner.ts:42 misclassifies genuine caller-input failures (bad theme, bad format, bad geojson) as errorKind 'server', violating AC-6's "phân biệt rõ lỗi tại người gọi hay tại máy chủ" — a defect the existing E8 test does not exercise, since it only covers a genuine server-side throw. Returned to implementation.

Round 2: E8b (mới, phủ trực tiếp ca phân loại lỗi người gọi ở jobRunner cho AC-6) cùng toàn bộ 19 eval máy còn lại và panel E20 đều xanh, đóng lại phát hiện round 1; nhưng verdict vẫn REJECT vì `npm run test:mcp` (lệnh không gắn eval, phủ tích hợp renderClip.test.ts) exit 1 — timeout 20s tại ca "renders fps×duration frames plus a settle still" (AC-5) — chưa rõ do gói job-queue gây ra hay do môi trường render, cần điều tra trước khi merge.

Round 3: Điều tra xác nhận nguyên nhân round 2 là tranh chấp tài nguyên trình duyệt giữa hai bộ đo dùng Chromium chạy song song trong chính vòng nghiệm thu, không phải hồi quy của gói (renderClip.test.ts chạy riêng xanh hai lần 43,6s/41,6s, chỉ trong vòng nghiệm thu mới vượt trần 20s ở 59,7s) — không sửa code sản phẩm; thay vào đó feature_loop.suite_keys được gộp thành một lệnh nối tiếp `npm run test:e2e && npm run test:mcp` (quyết định d-20260805T071657Z-7029), nay exit 0 (7 passed). Toàn bộ 19 eval máy + panel E20 (nay đồng thuận 3-0 PASS, spec-alignment đảo chiều từ FAIL sang PASS sau khi xác nhận contract/design doc đã nêu đích danh khoảng trống "restart xoá mã việc" thoả nhánh thứ hai của AC-15) đều xanh. Verdict: PASS.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
