---
schema_version: 2
feature_slug: road-routing
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9a6af0fa05f8f3e7fcebbcddc04f7994ea720ca5
human_signoff:
---

# Evidence Report: road-routing

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
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-1 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E2
  run_id: road-routing-r2-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-2 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E3
  run_id: road-routing-r2-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-3 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: road-routing-r2-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-4 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: road-routing-r2-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-5 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-6 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E7
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-7 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E8
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-8 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E9
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-9 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E10
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-10 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E11
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-11 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E12
  run_id: road-routing-r2-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T02:46:28Z
  output: |
    Same run — AC-12 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E13
  run_id: road-routing-r2-routing_invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.routing_invariants
  verified_at: 2026-08-07T02:50:05Z
  output: |
    Same run — AC-13 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). I1-I4 ok — routing-invariants: moi bat bien con giu — present and passing.

- eval: E14
  run_id: road-routing-r2-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-14 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E15
  run_id: road-routing-r3-api-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T03:13:47Z
  output: |
    Re-pin round 3 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — unchanged from the prior round.
- eval: E16
  run_id: road-routing-r3-mcp-20260807-repin
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T03:13:57Z
  output: |
    Re-pin round 3 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 3 passed (3); Tests 7 passed (7); Duration 42.43s — unchanged from the prior round.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E15.

Baseline `n-a` (carried forward, could not be computed): E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

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
