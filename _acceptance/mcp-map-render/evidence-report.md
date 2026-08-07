---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ce0b13e6de6504aa53d3bc0fe5545f209ec00381
human_signoff: 
---

# Evidence Report: mcp-map-render

_Round 24 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E1, E2, E3, E4, E5, E6, E7, E8, E9, E11); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 23 — re-verification triggered by `fix/mcp-auth` landing on top of Round 22's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round per this round's explicit instructions — not blanked, not re-scored. `risk_tier: T3` mandates a direct human verdict on every judgment item for THIS round's pinned evidence regardless of a prior round's override against a now-superseded commit, so the contract routes to **PENDING-JUDGMENT** this round._

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
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-12 | judgment | PASS (judge) — awaiting mandatory T3 human_override for this round’s pinned evidence |

## Evidence

- eval: E1
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E2
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E3
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E4
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E5
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E6
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E7
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E8
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E9
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E10
  run_id: mcp-map-render-r23-e2e-20260807
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T02:51:12Z
  screenshot: evidence/E10-step1.png
  observed: |
    Re-run this round (round 23) after `fix/mcp-auth`: `npm run test:e2e` — 14 passed (48.2s), including e2e/render-mode.spec.ts:93 (AC-10), identical pass count to the prior round. Nothing in this round's diff touches the render page, browserPool.ts, deps.ts, or renderFrame — only mcp-server/src/http.ts's bearer-check plumbing changed, which this e2e suite does not exercise. Frames re-opened with a fresh multimodal Read this round:
    E10-step1.png: solid dark-navy 1080x1920 frame, small OSM/OpenFreeMap/MapLibre attribution line bottom-right, no onboarding modal or overlay anywhere — matches 'no onboarding modal visible'.
    E10-step3.png: midnight-blue Ho Chi Minh City map, airport markings upper-left, a river winding through, dense amber/gold road network, no title-text overlay (chrome:'clean'), no tile gaps or breakage — matches 'renderFrame() PNG is exactly 1080x1920' and the config-load -> render -> dims sequence.
  network_observed: n-a (tool-error: frames read from committed evidence/, not re-captured live this round)

- eval: E11
  run_id: mcp-map-render-r24-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 24 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E12
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Ảnh 1080×1920 đúng khung tiktok, nền navy với đường phố vàng cam đặc trưng midnight-blue; lưới đường và khối nhà liền mạch, không ô tile trống/vỡ hay răng cưa. Ghim trắng nằm gần chính giữa khung (≈540/1080 ngang, 910/1920 dọc — lệch nhẹ ~50px) và tương phản rõ trên nền tối. Đủ cả ba yêu cầu của AC-12: căn giữa, highlight rõ, tile/đường không vỡ.
  human_override: manh 2026-08-07 — XÁC NHẬN — áp theo uỷ quyền đứng của chủ repo trong phiên ('tự lái, không cần hỏi, cho đến khi hoàn tất') — KHÔNG phải người ký trực tiếp xem từng mục. Ảnh đúng khung, ghim gần tâm, tile không vỡ; E10 ui-check vòng này mở lại frame bằng multimodal Read.

## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E11.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 24 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E4, E5, E6, E7, E8, E9, E11 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 23: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
