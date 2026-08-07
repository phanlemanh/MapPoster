---
schema_version: 2
feature_slug: road-routing
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9c1f9f367c642465cc720396f9b6aba51f31902f
human_signoff:
---

# Evidence Report: road-routing

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 4 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Bán kính ảnh hưởng hẹp: `route.test.ts` và `resolveConfig.test.ts` không đổi, nên E1-E14 là hồi quy thuần; E15 (bộ tổng) và E16 (bộ tích hợp có gác) mới là hai eval thật sự đi qua mã đổi. Cả hai xanh._

_Round 3 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E15, E16); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 2 — re-verification triggered by `fix/mcp-auth` landing on top of Round 1's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-12 | test | PASS |
| E13 | AC-13 | script | PASS |
| E14 | AC-14 | test | PASS |
| E15 | AC-13 | test | PASS |
| E16 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E2
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T04:50:57Z
  output: |
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E3
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T04:50:57Z
  output: |
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T04:50:57Z
  output: |
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T04:50:57Z
  output: |
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-6 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E7
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-7 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E8
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E9
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E10
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E11
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E12
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T04:50:58Z
  output: |
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E13
  run_id: road-routing-r4-routing_invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.routing_invariants
  verified_at: 2026-08-07T04:51:05Z
  output: |
    Cùng lần chạy — khẳng định của AC-13 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. I1-I4 ok — routing-invariants: moi bat bien con giu — present and passing.

- eval: E14
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T04:50:57Z
  output: |
    Cùng lần chạy — khẳng định của AC-14 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E15
  run_id: road-routing-r4-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E16
  run_id: road-routing-r4-mcp-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T04:52:19Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 3 passed (3); Tests 12 passed (12); Duration 42.43s — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E15.

Baseline `n-a` (carried forward, could not be computed): E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 4 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3`. Cả 16 eval chạy lại tươi — 16/16 xanh. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 3 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E15, E16 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 2: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
