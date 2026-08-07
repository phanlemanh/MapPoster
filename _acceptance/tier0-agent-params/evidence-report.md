---
schema_version: 2
feature_slug: tier0-agent-params
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: 
---

# Evidence Report: tier0-agent-params

_Round 10 — full re-run (not re-pinned), triggered by `affbe6c5`: `fix: slugify chuyển tự Đ/đ thay vì đánh rơi cả chữ`. `git diff ce0b13e6..affbe6c5 --stat` (this contract's tree) touches `src/lib/format.ts` (+6, the two `.replace()` transliteration calls added before NFKD), `src/lib/format.test.ts` (+20, new cases), and `mcp-server/src/jobRunner.test.ts` (+3, a real filename assertion added to the existing "dọn tệp hết hạn (AC-12)" test). `slugify()` feeds all three artifact-filename builders — `src/lib/export.ts:246` (t3_path, out of scope for this T2 contract), `mcp-server/src/tools.ts:59`, and `mcp-server/src/jobRunner.ts:76` — so filenames for place names containing Đ/đ/Ð/ð now read e.g. `dak-lak` instead of the old `ak-lak`. Checked every AC-1..AC-15 in `contract.md` and every `expected:` line in `evals.yaml` line by line: **none assert artifact filenames or place-name normalization** — AC-11 only asserts `motion.script` shape on the three clip surfaces, AC-15 only asserts OSM identity fields (`osmType`/`osmId`/`displayName`/`placeRank`), neither touches `slugify()` or the filename produced by `fileNameFor`/`baseName`. Grepped `mcp-server/src/tools.test.ts` for `slugify`/`mapposter-`/diacritics — zero hits, so `tools.ts`'s own consumption of the changed `slugify()` (line 59) has no assertion surface in this contract's E9/E10/E11/E16 either. Per the task instruction this round ran every eval fresh rather than selectively re-pinning: all 9 vitest executor files (`resolveConfig`, `tools`, `http`, `jobRunner`, `motionCompiler`, `geocode`), the `tier0-invariants` script, `npm test`, and `npm run test:mcp` were all re-executed from a clean shell. All green; `npm test`'s total rose from 498→501 (the 3 new format.test.ts/jobRunner.test.ts assertions), no regressions. `verified_commit` updated to `affbe6c57401eafaffb7ced1a70c4f7def9d196c`; `human_signoff` cleared per contract `status: implemented`._

_Round 9 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E12, E19, E20); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 8 — re-verification triggered by `fix/mcp-auth` landing on top of Round 7's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

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
| E12 | AC-11 | test | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-12 | test | PASS |
| E15 | AC-13 | test | PASS |
| E16 | AC-14 | test | PASS |
| E17 | AC-15 | test | PASS |
| E18 | AC-11 | script | PASS |
| E19 | AC-1 | test | PASS |
| E20 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`, slugify Đ/đ fix — does not touch resolveConfig.ts). Test Files 1 passed (1); Tests 64 passed (64) — layers/detail/font pass through verbatim.

- eval: E2
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — labels + layers.roadLabels together rejected, neither silently wins.

- eval: E3
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — out-of-domain detail/font/layer rejected; detail=0/1 accepted.

- eval: E4
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — three region forms resolve per-region colour; bad colour on any element rejects the whole call.

- eval: E5
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — three point forms resolve; fallback chain per-point → pointIcon/color → pin/#ffffff/44 verified in order.

- eval: E6
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — size 18/140 accepted, out-of-range rejected, size 0 rejected (not treated as unset).

- eval: E7
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — unknown per-point icon and unknown top-level pointIcon both rejected, neither falls back to 'pin'.

- eval: E8
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — bad colour/size on a later element rejects before resolveBoundary/resolveLocation are called; zero Nominatim requests spent.

- eval: E9
  run_id: tier0-agent-params-r10-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5` — tools.ts:59 calls the changed slugify(), but tools.test.ts carries zero slugify/filename/diacritic assertions per grep, so this eval's own surface is unaffected). Test Files 1 passed (1); Tests 52 passed (52) — 13 themes, each with dark + 15-key colors.

- eval: E10
  run_id: tier0-agent-params-r10-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 52 passed (52) — '4k' exactly once; print key present/absent correctly per entry.

- eval: E11
  run_id: tier0-agent-params-r10-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 52 passed (52) — MCP render_clip response carries motion.script with camera array and matching fps.

- eval: E12
  run_id: tier0-agent-params-r10-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5` — http.ts/http.test.ts untouched by this commit). Test Files 1 passed (1); Tests 54 passed (54) — REST POST /render-clip response carries motion.script.camera as an array.

- eval: E13
  run_id: tier0-agent-params-r10-job_runner-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5` — jobRunner.test.ts changed directly: +3 lines add a real filename assertion, `path.basename(written)).toContain('dak-lak')`, to the existing "dọn tệp hết hạn (AC-12)" test for job `{location: 'Đắk Lắk'}`; this asserts the slugify fix reaches the artifact filename on the async surface, not a new AC — AC-11's own motion.script assertion is untouched). Test Files 1 passed (1); Tests 22 passed (22) — async /jobs clip result carries motion.script in the same shape as the sync surfaces.

- eval: E14
  run_id: tier0-agent-params-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 64 passed (64) — pitch outside 0..60 rejected; bearing -45 normalized to 315, not rejected.

- eval: E15
  run_id: tier0-agent-params-r10-motion_compiler-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5` — motionCompiler.ts/test.ts untouched by this commit). Test Files 1 passed (1); Tests 32 passed (32) — every keyframe carries cfg.camera.bearing; bearing-less config compiles identically (determinism held).

- eval: E16
  run_id: tier0-agent-params-r10-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 1 passed (1); Tests 52 passed (52) — delivery:'url' yields zero inline base64; over-cap on format:'both' second output removes both files from the sink.

- eval: E17
  run_id: tier0-agent-params-r10-geocode-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geocode
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5` — geocode.ts/test.ts untouched by this commit; this contract's AC-15 asserts osmType/osmId/displayName/placeRank identity, not filenames or slugify). Test Files 1 passed (1); Tests 26 passed (26) — fallback-path identity is the entity that produced the polygon; cached second call spends no extra fetch.

- eval: E18
  run_id: tier0-agent-params-r10-tier0_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tier0_invariants
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). I1 t3_path (src/lib/export.ts, src/lib/mapStyle.ts) untouched vs merge-base (3 files changed this commit, none in t3_paths — export.ts's own slugify call site at line 246 is unmodified). I2 all three motionOut bindings echo script: motion. I3 every new Zod field has a defined+called runtime assert; bearing normalized not asserted. tier0-invariants: all invariants hold.

- eval: E19
  run_id: tier0-agent-params-r10-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508) — up from 498 (prior round) by the 3 new assertions in format.test.ts/jobRunner.test.ts; no regressions.

- eval: E20
  run_id: tier0-agent-params-r10-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T08:28:34Z
  output: |
    Fresh run round 10 (`affbe6c5`). Test Files 3 passed (3); Tests 7 passed (7); Duration 50.43s — real vite build + real PNG + real clip rendered through headless Chromium, unchanged.

## Analyst

Baseline (diffBase = pre-feature tree) values carried forward unchanged — this round's diff (`affbe6c5`) is a bugfix inside the already-shipped `slugify()`, orthogonal to the pre-feature baseline computed in earlier rounds. Non-discriminating (green on both): E19, E20 (full-suite/browser-integration guards, expected to be green on both branch and baseline).

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 10: triggered by `affbe6c5` (`slugify()` fix: Đ/đ/Ð/ð now transliterate to d instead of being dropped, changing artifact filenames for affected place names). Ran every eval fresh (not re-pinned, per this round's instruction) — all 20 green. Checked every AC in `contract.md` and every `expected:` in `evals.yaml`: none assert artifact filenames or place-name normalization, so this contract's own pass/fail surface is unaffected by the behaviour change; `jobRunner.test.ts`'s own new filename assertion (added by the same commit) is evidence the fix reached the artifact filename, not a new criterion this contract checks. `verified_commit` updated to `affbe6c57401eafaffb7ced1a70c4f7def9d196c`.

Round 9 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E12, E19, E20 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 8: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
