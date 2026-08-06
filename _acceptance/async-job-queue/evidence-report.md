---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9b573fcba6d3d7bd6627736faa390eea27722dcf
human_signoff: manh 2026-08-06
---

# Evidence Report: async-job-queue

_Round 6 — re-verification. Round 5's evidence (verified_commit `46a924f`, signed off `manh`
2026-08-05) went stale: `feat/tier0-agent-params` landed downstream commits touching
`mcp-server/src/resolveConfig.ts`, `tools.ts`, `geocode.ts`, `motionCompiler.ts`, `http.ts`, and
`jobRunner.ts` after that commit. Contract `status` downgraded `signed-off` → `implemented` per
the staleness guard before this report was written. `human_signoff` is cleared — the round-5
signature does not carry to this round._

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
| E20 | AC-15 | judgment | UNCERTAIN (unscored — pending blind judge panel) |
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |
| E24 | AC-6 | test | PASS |
| E25 | AC-15 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-async-job-queue-E1-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Test Files  1 passed (1)
    Tests  49 passed (49)
    Start at  21:07:42
    Duration  994ms (transform 107ms, setup 0ms, import 569ms, tests 77ms, environment 250ms)

- eval: E2
  run_id: minted-async-job-queue-E2-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E1 (mcp-server/src/http.test.ts covers all http-surface criteria in one file).
    Tests 49 passed (49); Duration 994ms.

- eval: E3
  run_id: minted-async-job-queue-E3-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E1/E2 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E4
  run_id: minted-async-job-queue-E4-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T14:07:47Z
  output: |
    Test Files  1 passed (1)
    Tests  16 passed (16)
    Start at  21:07:47
    Duration  375ms (transform 21ms, setup 0ms, import 31ms, tests 4ms, environment 250ms)

- eval: E5
  run_id: minted-async-job-queue-E5-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E1/E2/E3 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E6
  run_id: minted-async-job-queue-E6-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E1/E2/E3/E5 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E7
  run_id: minted-async-job-queue-E7-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Test Files  1 passed (1)
    Tests  22 passed (22)
    Start at  21:07:52
    Duration  544ms (transform 72ms, setup 0ms, import 111ms, tests 92ms, environment 248ms)

- eval: E8
  run_id: minted-async-job-queue-E8-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E1/E2/E3/E5/E6 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E9
  run_id: minted-async-job-queue-E9-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7 (mcp-server/src/jobRunner.test.ts). Tests 22 passed (22); Duration 544ms.

- eval: E10
  run_id: minted-async-job-queue-E10-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7/E9 (mcp-server/src/jobRunner.test.ts). Tests 22 passed (22); Duration 544ms.

- eval: E11
  run_id: minted-async-job-queue-E11-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E1/E2/E3/E5/E6/E8 — clip_http and job_http resolve to the identical command
    (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E12
  run_id: minted-async-job-queue-E12-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T14:08:02Z
  output: |
    Test Files  1 passed (1)
    Tests  39 passed (39)
    Start at  21:08:02
    Duration  431ms (transform 48ms, setup 0ms, import 80ms, tests 9ms, environment 249ms)
    (39 vs 32 in round 5 — tier0-agent-params added coverage to tools.test.ts; no shrinkage.)

- eval: E13
  run_id: minted-async-job-queue-E13-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T14:07:57Z
  output: |
    Test Files  1 passed (1)
    Tests  39 passed (39)
    Start at  21:07:57
    Duration  529ms (transform 64ms, setup 0ms, import 98ms, tests 80ms, environment 254ms)

- eval: E14
  run_id: minted-async-job-queue-E14-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7/E9/E10 (mcp-server/src/jobRunner.test.ts). Tests 22 passed (22); Duration 544ms.

- eval: E15
  run_id: minted-async-job-queue-E15-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7/E9/E10/E14 (mcp-server/src/jobRunner.test.ts). Tests 22 passed (22); Duration 544ms.

- eval: E16
  run_id: minted-async-job-queue-E16-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7/E9/E10/E14/E15 (mcp-server/src/jobRunner.test.ts). Tests 22 passed (22); Duration 544ms.

- eval: E17
  run_id: minted-async-job-queue-E17-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T14:07:47Z
  output: |
    Same run as E4 (mcp-server/src/jobStore.test.ts). Tests 16 passed (16); Duration 375ms.

- eval: E18
  run_id: minted-async-job-queue-E18-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E1/E2/E3/E5/E6/E8/E11 (mcp-server/src/http.test.ts). Tests 49 passed (49);
    Duration 994ms.

- eval: E19
  run_id: minted-async-job-queue-E19-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T14:07:57Z
  output: |
    Same run as E13 (mcp-server/src/motionCompiler.test.ts). Tests 39 passed (39); Duration 529ms.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: UNCERTAIN
  rationale: |
    Ba thiếu sót gọi-ngược/tiến-độ/huỷ-việc được hợp đồng tự lý giải bằng nhu cầu thật nên không chặn dọn sang. Khoản thứ tư khác bản chất: restart làm mã việc vô danh, khiến POST /jobs/status trả cùng một mã lỗi cho "việc mất vì restart" lẫn "mã bịa/đã dọn" (AC-4) — OneHub buộc phải tự chế chính sách gửi lại mà hợp đồng không mô tả. Hai cách đọc đều có cơ sở, thuộc diện người ký quyết.
  human_override: manh 2026-08-06 — CHẤP NHẬN vòng đầu — ba thiếu sót gọi-ngược/tiến-độ/huỷ-việc không chặn OneHub dọn sang; rủi ro nhận rõ: sau restart /jobs/status trả cùng mã lỗi cho "việc mất" lẫn "mã bịa" nên OneHub phải tự đặt chính sách gửi lại, không tệ hơn hôm nay; cần hợp đồng riêng cho job bền vững.

- eval: E21
  run_id: minted-async-job-queue-E21-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T14:07:47Z
  output: |
    Same run as E4/E17 (mcp-server/src/jobStore.test.ts). Tests 16 passed (16); Duration 375ms.

- eval: E22
  run_id: minted-async-job-queue-E22-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7/E9/E10/E14/E15/E16 (mcp-server/src/jobRunner.test.ts). Tests 22 passed (22);
    Duration 544ms.

- eval: E23
  run_id: minted-async-job-queue-E23-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T14:07:47Z
  output: |
    Same run as E4/E17/E21 (mcp-server/src/jobStore.test.ts). Tests 16 passed (16); Duration 375ms.

- eval: E24
  run_id: minted-async-job-queue-E24-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7/E9/E10/E14/E15/E16/E22 (mcp-server/src/jobRunner.test.ts). Tests 22 passed (22);
    Duration 544ms.

- eval: E25
  run_id: minted-async-job-queue-E25-r6
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:07:52Z
  output: |
    Same run as E7/E9/E10/E14/E15/E16/E22/E24 (mcp-server/src/jobRunner.test.ts). Tests 22 passed
    (22); Duration 544ms.

## Lệnh không gắn eval

- cmd: `npm test`
  exit_code: 0
  role: regression-guard toàn repo
  output: |
    Test Files  29 passed | 3 skipped (32)
    Tests  424 passed | 7 skipped (431)
    Start at  21:08:32
    Duration  2.91s (transform 1.70s, setup 0ms, import 6.42s, tests 4.31s, environment 12.81s)

- cmd: `npm run test:e2e && npm run test:mcp`
  exit_code: 0
  role: regression-guard e2e + tích hợp MCP (lệnh nối tiếp theo quyết định d-20260805T071657Z-7029,
    chạy tuần tự — KHÔNG song song với bất kỳ lệnh nào khác trong vòng này — để tránh tranh chấp
    Chromium)
  output: |
    e2e: 14 passed (51.8s)
    test:mcp: Tests  7 passed (7)
    Duration  44.27s (transform 37ms, setup 0ms, import 857ms, tests 42.36s, environment 761ms)

## Analyst

E1, E2, E3, E5, E6, E8, E11, E18 (npx vitest run mcp-server/src/http.test.ts); E4, E17, E21, E23
(npx vitest run mcp-server/src/jobStore.test.ts); E7, E9, E10, E14, E15, E16, E22, E24, E25 (npx
vitest run mcp-server/src/jobRunner.test.ts); E13, E19 (npx vitest run
mcp-server/src/motionCompiler.test.ts); E12 (npx vitest run mcp-server/src/tools.test.ts) — same
green-on-both set as Round 5 (E1,E2,E3,E5,E6,E8,E11,E18,E12,E13,E19); baseline values carried
forward unchanged per this round's "re-verification, not new feature" instruction.

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: All 19 machine evals (E1–E19) exit 0 on HEAD and the E20 judgment panel unanimously proposed PASS; verdict is REJECT because review (see review-findings.md, section "Trong hợp đồng") found that `isCallerFault` in mcp-server/src/jobRunner.ts:42 misclassifies genuine caller-input failures (bad theme, bad format, bad geojson) as errorKind 'server', violating AC-6's "phân biệt rõ lỗi tại người gọi hay tại máy chủ" — a defect the existing E8 test does not exercise, since it only covers a genuine server-side throw. Returned to implementation.

Round 2: E8b (mới, phủ trực tiếp ca phân loại lỗi người gọi ở jobRunner cho AC-6) cùng toàn bộ 19 eval máy còn lại và panel E20 đều xanh, đóng lại phát hiện round 1; nhưng verdict vẫn REJECT vì `npm run test:mcp` (lệnh không gắn eval, phủ tích hợp renderClip.test.ts) exit 1 — timeout 20s tại ca "renders fps×duration frames plus a settle still" (AC-5) — chưa rõ do gói job-queue gây ra hay do môi trường render, cần điều tra trước khi merge.

Round 3: Điều tra xác nhận nguyên nhân round 2 là tranh chấp tài nguyên trình duyệt giữa hai bộ đo dùng Chromium chạy song song trong chính vòng nghiệm thu, không phải hồi quy của gói (renderClip.test.ts chạy riêng xanh hai lần 43,6s/41,6s, chỉ trong vòng nghiệm thu mới vượt trần 20s ở 59,7s) — không sửa code sản phẩm; thay vào đó feature_loop.suite_keys được gộp thành một lệnh nối tiếp `npm run test:e2e && npm run test:mcp` (quyết định d-20260805T071657Z-7029), nay exit 0 (7 passed). Toàn bộ 19 eval máy + panel E20 (nay đồng thuận 3-0 PASS, spec-alignment đảo chiều từ FAIL sang PASS sau khi xác nhận contract/design doc đã nêu đích danh khoảng trống "restart xoá mã việc" thoả nhánh thứ hai của AC-15) đều xanh. Verdict: PASS.

Round 4: Contract mở rộng thêm AC-16 (MAPPOSTER_MAX_QUEUED_JOBS và MAPPOSTER_JOB_TTL_MS phải đổi hành vi thật qua env, môi trường trống rơi về mặc định, giá trị rác fail-closed kèm tên biến) và AC-17 (việc clip đang chờ chỗ clip không được ăn chỗ thợ của việc dựng ảnh xếp sau; rút việc bỏ qua cái bị từ chối mà không đảo thứ tự các việc cùng loại) sau commit 175a936 ("nối dây hai núm cấu hình chết + clip chờ chỗ thôi bỏ đói việc dựng ảnh"). Ba eval mới E21/E22/E23 cùng toàn bộ 20 eval cũ (E1–E19) đều exit 0, hai lệnh regression-guard (`npm test`, `npm run test:e2e && npm run test:mcp`) vẫn xanh. Panel E20 được chấm lại full-context (không carry từ round 3): domain-correctness và operational-feasibility giữ nguyên PASS, nhưng spec-alignment đảo ngược lại thành FAIL — viện dẫn rằng 404 mơ hồ sau khi restart (gộp ba nghĩa "mã bịa / đã dọn / mất vì restart" làm một) vẫn buộc OneHub tự bịa một chiến lược đối chiếu/gửi-lại mà hai cửa REST không cấp sẵn. Proposal chung của panel là PASS theo đa số 2-1, để người quyết xử lý dissent này ở Gate 2. Verdict: PASS.

Round 5: Review round 4 (xem review-findings.md của round 4, mục "Trong hợp đồng") tìm thấy hai khoảng hở thật: (a) `/jobs/status` của đường job làm rớt `durationSec`/`fps` mà `/render-clip` đồng bộ vẫn trả (AC-15), và (b) lỗi Nominatim 503/mạng lỗi trong pha resolve bị gắn nhầm `errorKind: 'input'` thay vì `'server'` (AC-6). Cả hai được đóng bằng code + eval mới: E25 (AC-15 — khối clip mang cả `durationSec` và `fps`, đúng những trường `/render-clip` đồng bộ đang trả) và E24 (AC-6 — Nominatim 503 trên địa danh hợp lệ phải cho `errorKind: 'server'`, còn mạng ổn mà không có kết quả vẫn là `'input'`, hai ca không được lẫn). Toàn bộ 25 eval máy (E1–E19, E21–E25) exit 0, hai lệnh regression-guard (`npm test`, `npm run test:e2e && npm run test:mcp`) vẫn xanh. Panel E20 được chấm lại full-context: cả ba lens (domain-correctness, operational-feasibility, spec-alignment) đồng thuận PASS — spec-alignment đảo ngược lại từ FAIL (round 4) sang PASS, khép lại dissent 2-1 còn treo từ round trước, vì hai khoảng hở cụ thể nhất trong bốn thiếu sót của AC-15 nay đã được đóng bằng hợp đồng thay vì chỉ được nêu tên. Verdict: PASS. Signed off `manh` 2026-08-05.

Round 6 (this report): re-verify triggered because `feat/tier0-agent-params` landed commits touching `resolveConfig.ts`/`tools.ts`/`geocode.ts`/`motionCompiler.ts`/`http.ts`/`jobRunner.ts` after round 5's `verified_commit` (46a924f) — code changed after evidence was signed, per the staleness rule. All 24 machine evals (E1–E19, E21–E25) re-run fresh against `9b573fc` (24 evals map to 5 distinct suite commands: http.test.ts 49 passed, jobStore.test.ts 16 passed, jobRunner.test.ts 22 passed (up from 21 — tier0-agent-params added a case, no shrinkage), motionCompiler.test.ts 39 passed, tools.test.ts 39 passed up from 32), exit 0 unchanged from round 5's pass results. Two regression-guard commands stayed green (`npm test`: 424 passed, up from 397; `npm run test:e2e && npm run test:mcp`: 14+7 passed). E20 (AC-15, judgment) is NOT scored by this verifier — left unfilled for the orchestrator's blind judge panel, per this round's instructions (implementation must never judge itself). Verdict: PENDING-JUDGMENT (T2 — all machine evals pass, single judgment eval pending judge).

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
