---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 46a924fbde1bd4bd26bbabd56e4cd894227e7287
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
| E20 | AC-15 | judgment | PASS |
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |
| E24 | AC-6 | test | PASS |
| E25 | AC-15 | test | PASS |

## Evidence

- eval: E1
  run_id: minted-async-job-queue-E1-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E2
  run_id: minted-async-job-queue-E2-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E3
  run_id: minted-async-job-queue-E3-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E4
  run_id: minted-async-job-queue-E4-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  16 passed (16)
    Start at  16:25:22
    Duration  429ms (transform 35ms, setup 0ms, import 44ms, tests 5ms, environment 271ms)

- eval: E5
  run_id: minted-async-job-queue-E5-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E6
  run_id: minted-async-job-queue-E6-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E7
  run_id: minted-async-job-queue-E7-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E8
  run_id: minted-async-job-queue-E8-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E8b
  run_id: minted-async-job-queue-E8b-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E9
  run_id: minted-async-job-queue-E9-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E10
  run_id: minted-async-job-queue-E10-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E11
  run_id: minted-async-job-queue-E11-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E12
  run_id: minted-async-job-queue-E12-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-05T16:25:26Z
  output: |
    Tests  32 passed (32)
    Start at  16:25:26
    Duration  768ms (transform 73ms, setup 0ms, import 119ms, tests 83ms, environment 395ms)

- eval: E13
  run_id: minted-async-job-queue-E13-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  31 passed (31)
    Start at  16:25:23
    Duration  1.33s (transform 105ms, setup 0ms, import 190ms, tests 22ms, environment 896ms)

- eval: E14
  run_id: minted-async-job-queue-E14-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E15
  run_id: minted-async-job-queue-E15-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E16
  run_id: minted-async-job-queue-E16-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E17
  run_id: minted-async-job-queue-E17-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  16 passed (16)
    Start at  16:25:22
    Duration  429ms (transform 35ms, setup 0ms, import 44ms, tests 5ms, environment 271ms)

- eval: E18
  run_id: minted-async-job-queue-E18-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  49 passed (49)
    Start at  16:25:23
    Duration  3.14s (transform 419ms, setup 0ms, import 1.75s, tests 320ms, environment 908ms)

- eval: E19
  run_id: minted-async-job-queue-E19-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-05T16:25:23Z
  output: |
    Tests  31 passed (31)
    Start at  16:25:23
    Duration  1.33s (transform 105ms, setup 0ms, import 190ms, tests 22ms, environment 896ms)

- eval: E20
  judged_by: judge panel (domain-correctness, operational-feasibility, spec-alignment) — fresh context
  proposal: PASS
  votes:
    - domain-correctness: PASS — Contract và design doc tự trả lời AC-15 ngay trong văn bản: mỗi thiếu sót trong bốn cái đều được nêu đích danh kèm lý do chấp nhận — gọi ngược "OneHub chưa cần, và không có độ bền thì gọi ngược cũng không đáng tin", huỷ/ưu tiên/tự-thử-lại "chưa có nhu cầu nêu ra", báo tiến độ "chưa ai hỏi" — và không cái nào đòi khái niệm mới vì lối hỏi-lặp-theo-nhịp (polling) đã thay thế đúng vai trò của gọi ngược mà OneHub (vốn đã tự xử lý 429 bằng vòng lặp) sẵn quen thuộc. Khởi-động-lại-thành-vô-danh là thiếu sót thật nhưng không giấu: hệ quả được nói thẳng thành hành vi quan sát được ở AC-4/AC-12 (404 {ok:false} thống nhất cho mọi mã không có trong sổ) và cố ý tách sang hợp đồng độ-bền riêng ở vòng sau — đây là đánh đổi phạm vi tường minh chứ không phải lỗ hổng domain bị bỏ sót. Vì vậy không thiếu sót nào chặn việc OneHub dọn sang lối gửi việc ở vòng đầu, miễn phía tiêu thụ hiểu 404 nghĩa là "gửi lại" — điều tài liệu đã nói rõ, không cần suy đoán thêm khái niệm nào.
    - operational-feasibility: PASS — Ba thiếu sót "không gọi ngược / không tiến độ / không huỷ" không chặn: OneHub vốn đang dùng lối chặn đồng bộ (không có tiến độ, không huỷ) nên chuyển sang poll POST /jobs/status là một bước tiến chứ không phải hụt so với hiện trạng, và bản thân AC-15 đã liệt ba cái đó là chấp nhận được ở vòng đầu. Cái thứ tư — khởi động lại xoá sạch mã việc, trả 404 đồng nhất cho "chưa từng có" lẫn "vừa mất do restart" — không chặn về mặt vận hành vì nó không tệ hơn thất bại hiện tại của đường đồng bộ (mất kết nối khi server restart giữa chừng cũng phải tự dò), và hành vi này (404 sạch, không đoán) đã được contract + design doc nêu đích danh rõ ràng (mục Out of scope, Notes, thiết kế §2/§6) thay vì giấu đi — OneHub chỉ cần áp mẫu "404 trên id vừa tạo → coi là mất, tự quyết định gửi lại", một mẫu vận hành quen thuộc chứ không phải khái niệm mới. Vì vậy giao ước hai cửa đủ để OneHub dọn sang mà không cần thêm khái niệm nào ngoài vòng lặp hỏi lại đã có sẵn trong chính hai cửa đó.
    - spec-alignment: PASS — Hợp đồng và design doc nêu đích danh cả bốn thiếu sót kèm lý do không chặn: gọi ngược "OneHub chưa cần, và không có độ bền thì gọi ngược cũng không đáng tin"; tiến độ "chưa ai hỏi"; huỷ việc "chưa có nhu cầu nêu ra" — ba cái này đúng nguyên văn trong ngoặc của AC-15. Khởi động lại thành vô danh được đặt riêng ngay từ Context ("Độ bền... cố ý nằm ngoài phạm vi... hợp đồng riêng của vòng sau") với hệ quả nói thẳng (404), không giấu — thoả đúng nhánh "hoặc nêu đích danh thứ còn thiếu" của AC-15, và cơ chế 404-khi-mất-mã đã đồng nhất với AC-4 (mã lạ) nên OneHub xử lý bằng một luật duy nhất, không cần khái niệm mới. Không có mâu thuẫn nội tại giữa contract và design doc về bốn điểm này, nên không cái nào trong bốn thứ chặn việc dọn sang ở vòng đầu.
  verdict: PASS (proposal, 3-0 unanimous — pending human review)
  human_override:

- eval: E21
  run_id: minted-async-job-queue-E21-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  16 passed (16)
    Start at  16:25:22
    Duration  429ms (transform 35ms, setup 0ms, import 44ms, tests 5ms, environment 271ms)

- eval: E22
  run_id: minted-async-job-queue-E22-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E23
  run_id: minted-async-job-queue-E23-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_store
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  16 passed (16)
    Start at  16:25:22
    Duration  429ms (transform 35ms, setup 0ms, import 44ms, tests 5ms, environment 271ms)

- eval: E24
  run_id: minted-async-job-queue-E24-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

- eval: E25
  run_id: minted-async-job-queue-E25-r5
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-05T16:25:22Z
  output: |
    Tests  21 passed (21)
    Start at  16:25:22
    Duration  689ms (transform 144ms, setup 0ms, import 198ms, tests 106ms, environment 277ms)

## Lệnh không gắn eval

Các lệnh dưới đây không được gán vào eval nào cụ thể (evals: []); cả hai đều xanh và đóng vai trò regression-guard toàn repo.

- cmd: `npm test`
  exit_code: 0
  role: regression-guard toàn repo
  output: |
    Tests  397 passed | 7 skipped (404)
    Start at  16:25:23
    Duration  3.99s (transform 1.54s, setup 0ms, import 9.43s, tests 4.64s, environment 25.35s)

- cmd: `npm run test:e2e && npm run test:mcp`
  exit_code: 0
  role: regression-guard e2e + tích hợp MCP (lệnh nối tiếp theo quyết định d-20260805T071657Z-7029 để hết tranh chấp trình duyệt giữa hai bộ đo)
  output: |
    Tests  7 passed (7)
    Start at  16:26:11
    Duration  44.40s (transform 36ms, setup 0ms, import 809ms, tests 42.58s, environment 743ms)

## Analyst

E1, E2, E3, E5, E6, E8, E11, E18 (npx vitest run mcp-server/src/http.test.ts); E12 (npx vitest run mcp-server/src/tools.test.ts); E13, E19 (npx vitest run mcp-server/src/motionCompiler.test.ts)

## Variance

none — every multi-run eval is uniform

## Iterations

Round 1: All 19 machine evals (E1–E19) exit 0 on HEAD and the E20 judgment panel unanimously proposed PASS; verdict is REJECT because review (see review-findings.md, section "Trong hợp đồng") found that `isCallerFault` in mcp-server/src/jobRunner.ts:42 misclassifies genuine caller-input failures (bad theme, bad format, bad geojson) as errorKind 'server', violating AC-6's "phân biệt rõ lỗi tại người gọi hay tại máy chủ" — a defect the existing E8 test does not exercise, since it only covers a genuine server-side throw. Returned to implementation.

Round 2: E8b (mới, phủ trực tiếp ca phân loại lỗi người gọi ở jobRunner cho AC-6) cùng toàn bộ 19 eval máy còn lại và panel E20 đều xanh, đóng lại phát hiện round 1; nhưng verdict vẫn REJECT vì `npm run test:mcp` (lệnh không gắn eval, phủ tích hợp renderClip.test.ts) exit 1 — timeout 20s tại ca "renders fps×duration frames plus a settle still" (AC-5) — chưa rõ do gói job-queue gây ra hay do môi trường render, cần điều tra trước khi merge.

Round 3: Điều tra xác nhận nguyên nhân round 2 là tranh chấp tài nguyên trình duyệt giữa hai bộ đo dùng Chromium chạy song song trong chính vòng nghiệm thu, không phải hồi quy của gói (renderClip.test.ts chạy riêng xanh hai lần 43,6s/41,6s, chỉ trong vòng nghiệm thu mới vượt trần 20s ở 59,7s) — không sửa code sản phẩm; thay vào đó feature_loop.suite_keys được gộp thành một lệnh nối tiếp `npm run test:e2e && npm run test:mcp` (quyết định d-20260805T071657Z-7029), nay exit 0 (7 passed). Toàn bộ 19 eval máy + panel E20 (nay đồng thuận 3-0 PASS, spec-alignment đảo chiều từ FAIL sang PASS sau khi xác nhận contract/design doc đã nêu đích danh khoảng trống "restart xoá mã việc" thoả nhánh thứ hai của AC-15) đều xanh. Verdict: PASS.

Round 4: Contract mở rộng thêm AC-16 (MAPPOSTER_MAX_QUEUED_JOBS và MAPPOSTER_JOB_TTL_MS phải đổi hành vi thật qua env, môi trường trống rơi về mặc định, giá trị rác fail-closed kèm tên biến) và AC-17 (việc clip đang chờ chỗ clip không được ăn chỗ thợ của việc dựng ảnh xếp sau; rút việc bỏ qua cái bị từ chối mà không đảo thứ tự các việc cùng loại) sau commit 175a936 ("nối dây hai núm cấu hình chết + clip chờ chỗ thôi bỏ đói việc dựng ảnh"). Ba eval mới E21/E22/E23 cùng toàn bộ 20 eval cũ (E1–E19) đều exit 0, hai lệnh regression-guard (`npm test`, `npm run test:e2e && npm run test:mcp`) vẫn xanh. Panel E20 được chấm lại full-context (không carry từ round 3): domain-correctness và operational-feasibility giữ nguyên PASS, nhưng spec-alignment đảo ngược lại thành FAIL — viện dẫn rằng 404 mơ hồ sau khi restart (gộp ba nghĩa "mã bịa / đã dọn / mất vì restart" làm một) vẫn buộc OneHub tự bịa một chiến lược đối chiếu/gửi-lại mà hai cửa REST không cấp sẵn. Proposal chung của panel là PASS theo đa số 2-1, để người quyết xử lý dissent này ở Gate 2. Verdict: PASS.

Round 5: Review round 4 (xem review-findings.md của round 4, mục "Trong hợp đồng") tìm thấy hai khoảng hở thật: (a) `/jobs/status` của đường job làm rớt `durationSec`/`fps` mà `/render-clip` đồng bộ vẫn trả (AC-15), và (b) lỗi Nominatim 503/mạng lỗi trong pha resolve bị gắn nhầm `errorKind: 'input'` thay vì `'server'` (AC-6). Cả hai được đóng bằng code + eval mới: E25 (AC-15 — khối clip mang cả `durationSec` và `fps`, đúng những trường `/render-clip` đồng bộ đang trả) và E24 (AC-6 — Nominatim 503 trên địa danh hợp lệ phải cho `errorKind: 'server'`, còn mạng ổn mà không có kết quả vẫn là `'input'`, hai ca không được lẫn). Toàn bộ 25 eval máy (E1–E19, E21–E25) exit 0, hai lệnh regression-guard (`npm test`, `npm run test:e2e && npm run test:mcp`) vẫn xanh. Panel E20 được chấm lại full-context: cả ba lens (domain-correctness, operational-feasibility, spec-alignment) đồng thuận PASS — spec-alignment đảo ngược lại từ FAIL (round 4) sang PASS, khép lại dissent 2-1 còn treo từ round trước, vì hai khoảng hở cụ thể nhất trong bốn thiếu sót của AC-15 nay đã được đóng bằng hợp đồng thay vì chỉ được nêu tên. Verdict: PASS.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract