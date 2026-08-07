---
schema_version: 2
feature_slug: motion-tools-cost
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e5ce7199d007b5c57042dd78a29b1df57b9e7a15
human_signoff: 
---

# Evidence Report: motion-tools-cost

_Round 4 — re-verification triggered by `fix/mcp-auth` landing on top of Round 3's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

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
| E13 | AC-13 | test | PASS |
| E14 | AC-14 | test | PASS |
| E15 | AC-15 | test | PASS |
| E16 | AC-16 | script | PASS |
| E17 | AC-11 | test | PASS |
| E18 | AC-11 | test | PASS |
| E19 | AC-16 | test | PASS |
| E20 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-1 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E2
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-2 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E3
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-3 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E4
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-4 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E5
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-5 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E6
  run_id: motion-tools-cost-r4-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-6 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E7
  run_id: motion-tools-cost-r4-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-7 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E8
  run_id: motion-tools-cost-r4-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-8 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E9
  run_id: motion-tools-cost-r4-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T02:46:32Z
  output: |
    Same run — AC-9 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E10
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-10 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E11
  run_id: motion-tools-cost-r4-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T02:46:44Z
  output: |
    Same run — AC-11 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 9 passed (9) — present and passing.

- eval: E12
  run_id: motion-tools-cost-r4-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T02:46:44Z
  output: |
    Same run — AC-12 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 9 passed (9) — present and passing.

- eval: E13
  run_id: motion-tools-cost-r4-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T02:46:44Z
  output: |
    Same run — AC-13 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 9 passed (9) — present and passing.

- eval: E14
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-14 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E15
  run_id: motion-tools-cost-r4-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-15 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E16
  run_id: motion-tools-cost-r4-motion_tools_invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.motion_tools_invariants
  verified_at: 2026-08-07T02:50:15Z
  output: |
    Same run — AC-16 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). I1-I4 ok — motion-tools-invariants: moi bat bien con giu — present and passing.

- eval: E17
  run_id: motion-tools-cost-r4-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T02:46:52Z
  output: |
    Same run — AC-11 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 22 passed (22) — present and passing.

- eval: E18
  run_id: motion-tools-cost-r4-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T02:46:57Z
  output: |
    Same run — AC-11 exercised via clip_http. mcp-server/src/http.ts changed only in this round's diff (three copied bearer checks merged into one `rejectedByBearer` helper, reused unchanged by /render, /render-clip, /jobs; a NEW guard call added on the previously-unguarded `/mcp` fall-through; a NEW startup-time fail-closed check added). The three REST routes' own auth behaviour is byte-identical before/after (same comparison, now factored). Test Files 1 passed (1); Tests 54 passed (54) — assertions for AC-11 present and passing.

- eval: E19
  run_id: motion-tools-cost-r4-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T02:49:45Z
  output: |
    Same run — AC-16 exercised via api. mcp-server/src/http.ts changed only in this round's diff (three copied bearer checks merged into one `rejectedByBearer` helper, reused unchanged by /render, /render-clip, /jobs; a NEW guard call added on the previously-unguarded `/mcp` fall-through; a NEW startup-time fail-closed check added). The three REST routes' own auth behaviour is byte-identical before/after (same comparison, now factored). Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505) — assertions for AC-16 present and passing.

- eval: E20
  run_id: motion-tools-cost-r4-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T02:51:38Z
  output: |
    Same run — AC-1 exercised via mcp. mcp-server/src/http.ts changed only in this round's diff (three copied bearer checks merged into one `rejectedByBearer` helper, reused unchanged by /render, /render-clip, /jobs; a NEW guard call added on the previously-unguarded `/mcp` fall-through; a NEW startup-time fail-closed check added). The three REST routes' own auth behaviour is byte-identical before/after (same comparison, now factored). Test Files 3 passed (3); Tests 7 passed (7); Duration 44.55s — assertions for AC-1 present and passing.

## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E17, E18, E19, E20.

Baseline `n-a` (carried forward, could not be computed): E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 4: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
