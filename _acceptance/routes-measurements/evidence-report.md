---
schema_version: 2
feature_slug: routes-measurements
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: 
---

# Evidence Report: routes-measurements

_Round 9 — full re-verification (every eval re-run, none re-pinned), triggered by `affbe6c5` ("fix: slugify chuyển tự Đ/đ thay vì đánh rơi cả chữ"). `git show --stat affbe6c5` touches `src/lib/format.ts` (+6), `src/lib/format.test.ts` (+20), `mcp-server/src/jobRunner.test.ts` (+3) — none in `risk_tiers.t3_paths` (`src/lib/export.ts`, `src/lib/mapStyle.ts` untouched, confirmed by this contract's own I1 check below), so tier stays T2. The change: two `.replace()` calls added to `slugify()` in `format.ts` before the NFKD normalize, so `Đ/đ` (U+0110/U+0111) and the look-alikes `Ð/ð` (U+00D0/U+00F0) transliterate to `d` instead of being deleted outright (`'Đà Nẵng'` → `'da-nang'`, previously `'a-nang'`)._

_This is a genuine behaviour change, not a no-op refactor: `slugify()` feeds three artifact-filename builders — `src/lib/export.ts:246`, `mcp-server/src/tools.ts:59`, `mcp-server/src/jobRunner.ts:76` — so generated filenames for place names containing Đ/đ now differ from before. `mcp-server/src/tools.ts:59` (`mapposter-${slugify(cfg.place.name || 'map')}-...`) is exercised by this contract's own `test.clip_tools` executor (`mcp-server/src/tools.test.ts` — E2, E14), so that executor is directly in the diff's blast radius, not just adjacent to it. No criterion in this contract (`AC-1..AC-14`) asserts a specific artifact filename string — coverage is over `resolveConfig`/`applyRenderConfig`/measurement math/route plumbing, not filename shape — so the change does not alter any criterion's pass condition, but per the run instructions every eval was re-run fresh rather than selectively re-pinned, including the two whose command doesn't touch the diff at all (E15/E20 `routes_invariants`, E16 `routes_demo`) to be safe. All 20 evals green; zero regressions._

_Round 7 — re-verification triggered by `fix/mcp-auth` landing on top of Round 6's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-8 | test | PASS |
| E13 | AC-10 | test | PASS |
| E14 | AC-12 | test | PASS |
| E15 | AC-13 | script | PASS |
| E16 | AC-1 | script | PASS |
| E17 | AC-13 | test | PASS |
| E18 | AC-1 | test | PASS |
| E19 | AC-1 | test | PASS |
| E20 | AC-14 | script | PASS |

## Evidence

- eval: E1
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E2
  run_id: routes-measurements-r9-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:21:14Z
  output: |
    Re-run fresh (round 9, `affbe6c5`) — this executor's file (`tools.ts:59`) imports `slugify` from the changed `src/lib/format.ts`, so it is directly in the diff's blast radius. Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E3
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: routes-measurements-r9-apply_render_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.apply_render_config
  verified_at: 2026-08-07T08:21:17Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 10 passed (10) — present and passing.

- eval: E7
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E8
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E9
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E10
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E11
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E12
  run_id: routes-measurements-r9-geometry-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geometry
  verified_at: 2026-08-07T08:21:19Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 12 passed (12) — present and passing.

- eval: E13
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E14
  run_id: routes-measurements-r9-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:21:14Z
  output: |
    Re-run fresh (round 9, `affbe6c5`) — same in-blast-radius executor as E2. Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E15
  run_id: routes-measurements-r9-routes_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T08:21:25Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). I1 t3_path untouched vs 313a7143 (3 file đổi, không cái nào trong t3_paths); I2 mọi guard vừa định-nghĩa-vừa-được-gọi; I3 không có tên số đo trần — routes-invariants: mọi bất biến còn giữ.

- eval: E16
  run_id: routes-measurements-r9-routes_demo-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_demo
  verified_at: 2026-08-07T08:21:32Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). ẢNH: 5 render → demo/index.html; KIỂM: 9 đạt · 0 trượt (gồm "polyline DÀI HƠN chim bay hai đầu" 6.79 km > 6.17 km và "diện tích TRỪ LỖ" 96.9 km² < 115.4 km², tỉ lệ 0.840).

- eval: E17
  run_id: routes-measurements-r9-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:21:46Z
  output: |
    Re-run fresh (round 9, `affbe6c5`) — full Vitest suite, includes `src/lib/format.test.ts` and `mcp-server/src/jobRunner.test.ts`, both changed by this commit. Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508) — no regression.

- eval: E18
  run_id: routes-measurements-r9-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T08:21:55Z
  output: |
    Re-run fresh (round 9, `affbe6c5`) — real Chromium via vite build + headless render/clip. Test Files 3 passed (3); Tests 7 passed (7); Duration 53.09s.

- eval: E19
  run_id: routes-measurements-r9-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:21:11Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E20
  run_id: routes-measurements-r9-routes_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T08:21:25Z
  output: |
    Re-run fresh (round 9, `affbe6c5`). I3 — không tên số đo trần (km/distance/area/length/span) trong resolveConfig.ts lẫn geometry.ts, và bốn tên đủ nghĩa (lengthKm, straightLineKm, areaKm2, spanKm) đều có mặt — routes-invariants: mọi bất biến còn giữ.

## Analyst

Baseline values carried forward unchanged (this round's diff — `slugify()` in `src/lib/format.ts` — predates none of these criteria; the diffBase relationship each eval has to the pre-feature tree is unaffected by a fix landing on top of an already-implemented feature). Non-discriminating (green on both) per the carried-forward baseline: E17, E18 — expected, they are the broad regression-guard suites, not feature-specific discriminators.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 9: full re-verification, every eval re-run fresh (none re-pinned), triggered by `affbe6c5` (`slugify()` fix: `Đ/đ` and look-alike `Ð/ð` now transliterate to `d` instead of being deleted). No criterion in this contract asserts a specific artifact-filename string, so the fix does not change any eval's pass condition — but `test.clip_tools` (E2, E14) is genuinely in the diff's blast radius since `mcp-server/src/tools.ts:59` imports the changed `slugify()`. All 20 evals green, zero regressions.

Round 8 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E17, E18 fresh — all green, unchanged. All other evals re-pinned without re-running (their own files untouched).

Round 7: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
