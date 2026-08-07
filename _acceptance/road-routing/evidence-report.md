---
schema_version: 2
feature_slug: road-routing
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: 
---

# Evidence Report: road-routing

_Round 4 — full re-verification (every eval actually re-run, not re-pinned), triggered by `affbe6c5` which fixed `slugify()` in `src/lib/format.ts`: Đ/đ (U+0110/U+0111) and look-alikes Ð/ð (U+00D0/U+00F0) were previously DELETED by the NFKD-based diacritic strip instead of being transliterated to `d` (e.g. "Đà Nẵng" → "a-nang", dropping the D entirely); two `.replace()` calls were added before the NFKD normalize to fix this. Changed files: `src/lib/format.ts`, `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts`. `slugify()` feeds three artifact-filename builders (`src/lib/export.ts:246`, `mcp-server/src/tools.ts:59`, `mcp-server/src/jobRunner.ts:76`) — none of which this contract's `route.ts` touches or imports (confirmed again by E13/I4 this round). `route.ts` does not import or call `slugify`/`format.ts` at all (`grep -rn "format" mcp-server/src/route.ts` — no hits), so the fix is orthogonal to this contract's own behaviour; it is re-verified in full only because the shared-file staleness rule marks all evidence stale whenever `src/lib/format.ts` changes, and per instruction every eval was actually executed this round rather than selectively re-pinned. All 16 evals green, zero regressions. `verified_commit` updated to `affbe6c57401eafaffb7ced1a70c4f7def9d196c`; `human_signoff` cleared for Gate 2._

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
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run (route.ts untouched by affbe6c5's slugify fix — route.ts does not import format.ts). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E2
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:16:32Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E3
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:16:32Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:16:32Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:16:32Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E7
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E8
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E9
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E10
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E11
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E12
  run_id: road-routing-r4-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T08:16:30Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E13
  run_id: road-routing-r4-routing_invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.routing_invariants
  verified_at: 2026-08-07T08:16:38Z
  output: |
    Round 4 fresh run. ok I1 t3_path untouched vs 313a7143 (3 file doi); ok I2 base URL tu env.MAPPOSTER_OSRM_URL: true; ok I2 khong ham export nao nhan host/url tu caller; ok I2 toa do vao URL di qua Number() sau validate: true; ok I3 1 loi goi fetch, tat ca mang signal = true; ok I3 loi timeout neu duoc env chinh: true; ok I4 route.ts KHONG import export.ts/mapStyle.ts: true. routing-invariants: moi bat bien con giu.

- eval: E14
  run_id: road-routing-r4-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:16:32Z
  output: |
    Round 4 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E15
  run_id: road-routing-r4-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:16:41Z
  output: |
    Round 4 fresh run — full suite (this is the one command whose scope truly includes the changed files: src/lib/format.ts, src/lib/format.test.ts, mcp-server/src/jobRunner.test.ts). Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508) — no regressions from the slugify fix.

- eval: E16
  run_id: road-routing-r4-mcp-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T08:17:35Z
  output: |
    Round 4 fresh run — real Chromium build + render + clip. Test Files 3 passed (3); Tests 7 passed (7); Duration 48.72s.

## Analyst

Non-discriminating (green on both diffBase and this branch): E15 — it is the full suite command shared across every contract and passes regardless of any single feature.

Baseline `n-a` (this contract's own diffBase for E1-E14, E16 has not been separately computed in this round; carried the same status forward from prior rounds since affbe6c5 does not touch route.ts, resolveConfig.ts, or the routing-invariants script's watched surface): E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 4: triggering commit `affbe6c5` fixed `slugify()` in `src/lib/format.ts` (Đ/đ/Ð/ð were being deleted instead of transliterated to `d`), touching `src/lib/format.ts`, `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts`. `route.ts` does not import `format.ts`/`slugify` (confirmed via grep and via E13/I4 this round). Per instruction, every eval was actually re-run (not selectively re-pinned): all 16 green, zero regressions. `verified_commit` re-pinned to `affbe6c5`; `human_signoff` cleared.

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
