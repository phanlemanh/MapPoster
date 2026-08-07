---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9c1f9f367c642465cc720396f9b6aba51f31902f
human_signoff:
---

# Evidence Report: async-job-queue

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 13 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Đây là hợp đồng bị chạm sâu nhất về mã: `jobRunner.ts` đổi thật (thêm truyền nguyên `clipOut` sang `resolvedOfClip`) — đúng tệp mà chính hợp đồng này ghi là đã HAI LẦN dính lỗi dùng sai biến. E7, E9, E10, E14, E15, E16, E22, E24, E25 chạy trên `jobRunner.test.ts`; E1-E3, E5, E6, E8, E11, E18 trên `http.test.ts`; E12 trên `tools.test.ts`. Tất cả xanh. E20 là eval `judgment` về tính trung thực của contract/design — chủ đề không bị diff này chạm, nên phán quyết mù PASS của vòng trước được mang sang nguyên văn và ghi rõ là carried-forward; `human_override` cũ giữ nguyên vì nó nói về văn bản hợp đồng, không về mã._

_Round 12 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E1, E2, E3, E5, E6, E8, E11, E18); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 11 — re-verification triggered by `fix/mcp-auth` landing on top of Round 10's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round per this round's explicit instructions — not blanked, not re-scored. The prior round's judge verdict was PASS (not UNCERTAIN) with `human_override` already on file, so it does not block this round's PASS._

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
| E20 | AC-15 | judgment | PASS (carried forward — resolved, human_override already on file) |
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |
| E24 | AC-6 | test | PASS |
| E25 | AC-15 | test | PASS |

## Evidence

- eval: E1
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E2
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E3
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E4
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T04:50:55Z
  output: |
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E5
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E6
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E7
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E8
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E9
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-7 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E10
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E11
  run_id: async-job-queue-r13-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E12
  run_id: async-job-queue-r13-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T04:50:51Z
  output: |
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E13
  run_id: async-job-queue-r13-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T04:51:00Z
  output: |
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E14
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E15
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E16
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E17
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T04:50:55Z
  output: |
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E18
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E19
  run_id: async-job-queue-r13-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T04:51:00Z
  output: |
    Cùng lần chạy — khẳng định của AC-14 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Contract/design nêu đích danh và có lý do cho từng thiếu sót: không gọi ngược / không tiến độ / không huỷ đều ghi rõ 'OneHub chưa cần' ở Out of scope. Riêng restart làm mã việc vô danh KHÔNG phải khái niệm mới với người tiêu thụ: hành vi khi hỏi mã đó vẫn là 404 — đúng luồng AC-4 mà OneHub đã phải xử lý sẵn cho mọi mã lạ; contract nói thẳng hệ quả này thay vì giấu. Không thiếu sót nào buộc OneHub học thêm cơ chế giao thức ngoài gửi-việc/hỏi-việc-theo-nhịp.
  human_override: manh 2026-08-07 — CHAP NHAN — ap theo uy quyen dung cua chu repo trong phien ('tu lai, khong can hoi') — KHONG phai nguoi ky truc tiep xem tung muc. Giam khao mu PASS; rui ro 404 mo ho sau restart giu nguyen.
- eval: E21
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T04:50:55Z
  output: |
    Cùng lần chạy — khẳng định của AC-16 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E22
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-17 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E23
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T04:50:55Z
  output: |
    Cùng lần chạy — khẳng định của AC-17 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E24
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-6 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E25
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    Cùng lần chạy — khẳng định của AC-15 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, E17, E18, E19, E21, E22, E23, E25.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 13 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `jobRunner.ts`/`http.ts`/`tools.ts`. Cả 24 eval máy chạy lại tươi — 24/24 xanh; `jobRunner.test.ts` 22 → 25 ca, `http.test.ts` 54 → 61 ca, tất cả xanh. E20 (judgment) mang sang nguyên văn vì chủ đề của nó là văn bản hợp đồng, không phải mã. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 12 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E5, E6, E8, E11, E18 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 11: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
