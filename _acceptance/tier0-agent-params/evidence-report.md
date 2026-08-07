---
schema_version: 2
feature_slug: tier0-agent-params
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 27e1be1a1431055f4b19bbf7734c07eacd5a791c
human_signoff: manh 2026-08-07
---

# Evidence Report: tier0-agent-params

_Round 7 — re-verification. `feat/road-routing` landed on top of `f74ede1` (Round 6's `verified_commit`),
touching `mcp-server/src/resolveConfig.ts` and `mcp-server/src/tools.ts` — both files this contract's
own `layers`/`detail`/`font`/`highlight`/`camera.pitch`/`camera.bearing` and `list_themes`/`list_formats`/
`motion.script`-echo assertions live in. `status` downgraded `signed-off` → `implemented` per the
shared-file staleness guard; `human_signoff` cleared._

_Diff review: `resolveConfig.ts` — `resolveRoutes` becomes `async` (a routes-only concern; this
contract's E1-E8/E14 exercise `layers`/`detail`/`font`/highlight-region/highlight-point/camera-bounds
logic, none of which calls `resolveRoutes`); the new `route` branch inside `resolveRoutes` fires only
for `routes[].route`, which no test in this contract's own suite sends. `tools.ts` — `routeSchema`
gains an additive `route` field; `list_themes`/`list_formats`/`compile_motion`'s `motion.script` echo
(this contract's E9-E11/E16) are untouched. Every one of this contract's own 20 machine evals was
re-run fresh: `resolveConfig.test.ts` 64/64 (up from 59 — road-routing's own five new tests, this
contract's own describe blocks unmoved in content), `tools.test.ts` 52/52 (unchanged), `http.test.ts`
49/49 (unchanged), `jobRunner.test.ts` 22/22 (unchanged, part of a combined
`encodeAnimation.test.ts`+`jobStore.test.ts`+`jobRunner.test.ts` run), `motionCompiler.test.ts` 32/32
(unchanged, part of a combined run with `motionScript.test.ts`/`motionMath.test.ts`), `geocode.test.ts`
26/26 (unchanged, part of a combined run with `geometry.test.ts`/`applyRenderConfig.test.ts`/
`export.test.ts`/`mapStyle.test.ts` — none of which this branch touches), `tier0-invariants.ts` all
I1-I3 `ok`, `npm test` 493 passed | 7 skipped (up from 475 — road-routing's own tests only), `npm run
test:mcp` 7/7 (unchanged)._

_Round 6 — re-pin after a rebase onto merged `main`, not a re-audit. PR #2 (`feat/routes-measurements`)
merged to `main`; the branch was rebased onto the new `main` tip (`ecd4a37`), rewriting every commit
SHA including Round 5's `verified_commit` (`6644d1b`) — no longer an ancestor of this branch (still
present as a dangling local object, which is why a local staleness check would misleadingly pass; a
fresh CI clone would not resolve it at all). `git diff 6644d1b HEAD` confirms **zero** non-gate files
changed — only `_acceptance/**` differs; every source/test file this contract depends on is
byte-identical to Round 5. Re-ran fresh: `npm test` (475/482, unchanged), `npm run test:mcp` (7/7,
unchanged), and `tier0-invariants.ts` (all I1-I3 clauses still `ok`; I1's own output line now
legitimately reads `vs ecd4a377` instead of the stale `999c13c8`, since the script computes `git
merge-base origin/main HEAD` itself). E1-E17 are re-pinned unchanged below: their commands don't read
git state and their target files are confirmed byte-identical, so Round 5's evidence blocks stand
without re-execution._

_Round 5 — re-verification. Round 4's evidence (`verified_commit: 31ad91b`, signed off `manh`
2026-08-06) went STALE: `feat/motion-tools-cost` landed six commits on top of `31ad91b` touching
`mcp-server/src/{encodeAnimation.ts,http.ts,jobRunner.ts,resolveConfig.ts,tools.ts}` and their test
files — all of which this contract's own AC-1..AC-8/AC-11/AC-12/AC-13 assertions live in directly.
Contract `status` downgraded `signed-off` → `implemented` per the staleness guard; `human_signoff`
cleared._

_`git diff 31ad91b..HEAD -- mcp-server/src/resolveConfig.ts mcp-server/src/tools.ts
mcp-server/src/http.ts mcp-server/src/jobRunner.ts mcp-server/src/motionCompiler.ts
mcp-server/src/geocode.ts` shows: `resolveConfig.ts` gained the `camera.focus` branch (additive, a new
`if` ahead of this contract's own `layers`/`detail`/`font`/`highlight`/`camera.pitch`/`camera.bearing`
logic, which is untouched); `tools.ts` gained `compile_motion`/`list_fonts`-metadata/`cost` handlers
additively; `http.ts` and `jobRunner.ts` each gained exactly one line threading `output?.quality`
into their existing `deps.encodeAnimation(...)` call — the `motion.script` echo this contract's AC-11
depends on is unmoved in both. `motionCompiler.ts` and `geocode.ts` do not appear in the diff at all.
All 20 of this contract's own machine evals were re-run fresh regardless, and each `expected` clause
re-checked against a real assertion, not just an exit code._

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
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    ROUND 7 — re-run fresh: `npx vitest run mcp-server/src/resolveConfig.test.ts`: 64/64 passed (up
    from 59 — road-routing's own five new `routes[].route` tests; this contract's own `layers`/`detail`/
    `font` tests are unmoved). `passes layers, detail and font through to the render
    config` present and green — `RenderConfig` carries all three verbatim, per AC-1.

- eval: E2
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run — `labels` + `layers.roadLabels` together rejected `/either labels or layers.roadLabels,
    not both/`, unmoved.

- eval: E3
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run — `detail>1`/unknown font/unknown layer key/non-boolean layer value all rejected;
    `detail: 0`/`detail: 1` accepted (the inline boundary case added by this contract's own Round 3 fix,
    `06e4ae1`) — still present, unmoved.

- eval: E4
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run — all three region forms resolve with per-region colours (uncoloured → `null`); a bad
    colour on any element rejects the whole call. Unmoved.

- eval: E5
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run — all three point forms resolve; the fallback chain per-point → `highlight.pointIcon`/
    `highlight.color` → terminal `'pin'`/`'#ffffff'`/`44` (added by this contract's own Round 3 fix) is
    still present and green.

- eval: E6
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run — marker `size` 18/140 accepted; out-of-range rejected; `size: 0` rejected (not read as
    unset). Unmoved.

- eval: E7
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run — unknown per-point icon AND unknown top-level `pointIcon` both rejected; neither falls
    back to `'pin'`. Unmoved.

- eval: E8
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run — a bad colour/size on a LATER element still trips `resolveBoundary`/`resolveLocation`
    `.not.toHaveBeenCalled()`. Unmoved.

- eval: E9
  run_id: tier0-agent-params-r7-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    ROUND 7 — re-run fresh: `npx vitest run mcp-server/src/tools.test.ts`: 52/52 passed (unchanged —
    `tools.ts`'s only change this round is the additive `route` field on `routeSchema`; `discovery tools`
    describe block unmoved).
    `list_themes returns all 13 themes` + `exposes the full palette` — 13 themes, each `dark` + a 15-key
    `colors` palette. Unmoved.

- eval: E10
  run_id: tier0-agent-params-r7-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    Same run — `list_formats` emits `4k` exactly once; `print` present on print layouts and the KEY
    absent on non-print ones. Unmoved.

- eval: E11
  run_id: tier0-agent-params-r7-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    Same run — MCP `render_clip` response carries `motion.script` with a `camera` array and `fps`
    matching `clip.fps`. Unmoved; `motion.script` echoing logic in `tools.ts` untouched by
    motion-tools-cost's additions (confirmed by diff review above).

- eval: E12
  run_id: tier0-agent-params-r7-http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    ROUND 7 — re-run fresh: `npx vitest run mcp-server/src/http.test.ts`: 49/49 passed — unchanged
    count; `http.ts` does not appear in this round's diff at all. REST `POST /render-clip` response
    still carries `motion.script.camera` as an array.

- eval: E13
  run_id: tier0-agent-params-r7-jobrunner-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    ROUND 7 — re-run fresh (combined with `encodeAnimation.test.ts`+`jobStore.test.ts`):
    `npx vitest run mcp-server/src/encodeAnimation.test.ts mcp-server/src/jobStore.test.ts
    mcp-server/src/jobRunner.test.ts`: 9+16+22=47 passed. Async `/jobs` clip result still carries
    `motion.script` in the same shape as the two synchronous surfaces; `jobRunner.ts` does not appear in
    this round's diff at all.

- eval: E14
  run_id: tier0-agent-params-r7-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run as E1 — ASYMMETRIC boundary: `camera.pitch` outside 0..60 rejected; `camera.bearing: -45`
    NOT rejected, normalized to 315. Both this contract's own logic AND motion-tools-cost's new
    `camera.focus` branch coexist in `resolveConfig.ts` without interfering — confirmed by the diff
    review (focus branch is a separate `if`, not nested inside the pitch/bearing logic).

- eval: E15
  run_id: tier0-agent-params-r7-motioncompiler-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T01:27:19Z
  output: |
    ROUND 7 — re-run fresh (combined with `motionScript.test.ts`+`motionMath.test.ts`):
    `npx vitest run mcp-server/src/motionCompiler.test.ts src/render/motionScript.test.ts
    src/render/motionMath.test.ts`: 32+16+16=64 passed; `motionCompiler.ts` does not appear in this
    round's diff at all. Every keyframe a
    preset compiles carries `cfg.camera.bearing`; a bearing-less config compiles to an identical object
    (early return). Unmoved.

- eval: E16
  run_id: tier0-agent-params-r7-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    Same run as E9 — `delivery: 'url'` yields zero inline base64 blocks; over-cap on the second output of
    `format: 'both'` removes BOTH files. Unmoved.

- eval: E17
  run_id: tier0-agent-params-r7-geocode-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geocode
  verified_at: 2026-08-07T01:27:25Z
  output: |
    ROUND 7 — re-run fresh (combined with `geometry.test.ts`+`applyRenderConfig.test.ts`+`export.test.ts`+
    `mapStyle.test.ts`): `npx vitest run mcp-server/src/geocode.test.ts mcp-server/src/geometry.test.ts
    src/render/applyRenderConfig.test.ts src/lib/export.test.ts src/lib/mapStyle.test.ts`: 67 passed
    total, 26 of them in `geocode.test.ts` — unchanged count; `geocode.ts` does not appear in this
    round's diff at all. Fallback-path identity echo
    (`osmType`/`osmId`/`displayName`/`placeRank` from the entity that produced the polygon, not the
    original search hit) confirmed present and green.

- eval: E18
  run_id: tier0-agent-params-r7-invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tier0_invariants
  verified_at: 2026-08-07T01:27:35Z
  output: |
    ROUND 7 — re-run fresh (this script computes `git merge-base origin/main HEAD` itself, so its own
    output text is git-state-dependent):
    ok   I1  t3_path (src/lib/export.ts, src/lib/mapStyle.ts) untouched vs merge-base (12 files changed, none in t3_paths)
    ok   I2  MCP render_clip (mcp-server/src/tools.ts) echoes motion.script on its motionOut binding
    ok   I2  REST POST /render-clip (mcp-server/src/http.ts) echoes motion.script on its motionOut binding
    ok   I2  async POST /jobs (mcp-server/src/jobRunner.ts) echoes motion.script on its motionOut binding
    ok   I3  layers guarded by assertLayers (defined: true, called: true)
    ok   I3  detail guarded by assertDetail (defined: true, called: true)
    ok   I3  font guarded by assertFont (defined: true, called: true)
    ok   I3  highlight.points[].size guarded by assertMarkerSize (defined: true, called: true)
    ok   I3  highlight.points[].icon / highlight.pointIcon guarded by assertMarkerIcon (defined: true, called: true)
    ok   I3  camera.pitch guarded by assertPitch (defined: true, called: true)
    ok   I3  camera.bearing normalized (not rejected) — modulo-360 present: true
    tier0-invariants: all invariants hold
    File-count is now 12 (down from Round 6's 31) purely because the merge-base moved forward to
    `f74ede1f`; all clauses of E18's `expected` remain confirmed.

- eval: E19
  run_id: tier0-agent-params-r7-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T01:28:09Z
  output: |
    ROUND 7 — re-run fresh: `npm test` — Test Files 31 passed | 3 skipped (34); Tests 493 passed | 7
    skipped (500) — up from 475/482 in Round 6, the delta being exactly road-routing's own 18 new tests.

- eval: E20
  run_id: tier0-agent-params-r7-testmcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T01:28:22Z
  output: |
    ROUND 7 — re-run fresh: `npm run test:mcp` — Test Files 3 passed (3); Tests 7 passed (7); Duration
    47.04s — real vite build + real headless Chromium, identical pass counts to Round 6.

## Analyst

Baseline: all 18 feature evals (E1-E18) remain `red` on the pre-feature diffBase, carried forward
unchanged per this round's re-verification instruction (T2 stale-refresh rounds carry baseline forward,
they do not recompute it) — nothing in motion-tools-cost's diff changes which side of the baseline these
evals fall on, since it only adds new branches/handlers alongside this contract's own logic, never
inside it. E19/E20 (`npm test`/`npm run test:mcp`) are the broad regression-floor guards, `green` on
both trees as expected.

No new gaps found this round. E3/E5/E6's boundary-completeness fixes (closed in this contract's own
Round 3 by commit `06e4ae1`) remain closed — re-confirmed present in this round's fresh 64/64 run.

## Variance

none — every eval this round is a deterministic single run.

## Iterations

- Round 1 (commit `f7feeda`): first verify, all 20 machine evals PASS, signed off.
- Round 2 (commit `25c2d2a`): re-verify triggered by `feat/routes-measurements`. Re-checking each eval's
  `expected` clause-by-clause surfaced 3 gaps (E3/E5/E6 boundary-acceptance untested). REJECT.
- Round 3 (commit `06e4ae1`): all three gaps closed with explicit boundary tests, independently
  negative-controlled. All 20 machine evals PASS.
- Round 4 (commit `31ad91b`): re-pin after a sibling contract's file changed; no re-audit needed. PASS.
- Round 5 (verified 2026-08-06T23:59Z, commit `6644d1b`): re-verify triggered by `feat/motion-tools-cost`
  touching this contract's own `resolveConfig.ts`/`tools.ts`/`http.ts`/`jobRunner.ts` (additively,
  confirmed via diff review in the preamble). All 20 machine evals re-run fresh, each `expected` clause
  re-checked against a real assertion. This contract has no judgment evals. Verdict **PASS**.
- Round 6 (verified 2026-08-07T00:24Z, commit `46935e8`): re-pins evidence after a rebase onto merged
  `main` — PR #2 landed, branch rebased onto `main`'s new tip `ecd4a37`, rewriting every commit SHA.
  `git diff 6644d1b HEAD` confirmed zero non-gate files changed — a re-pin, not a re-audit. Broad
  guards (`npm test`, `npm run test:mcp`) and the git-state-dependent `tier0-invariants.ts` script were
  re-run fresh and matched Round 5 exactly; E1-E17 stand unchanged from Round 5. Verdict **PASS**.
- Round 7 (verified 2026-08-07T01:28Z, commit `27e1be1`): re-verification triggered by
  `feat/road-routing` landing on top of Round 6's `verified_commit` (`f74ede1`), touching
  `mcp-server/src/resolveConfig.ts` (`resolveRoutes` → `async`, additive `route` branch) and
  `mcp-server/src/tools.ts` (additive `route` field on `routeSchema`) — additive changes only, confirmed
  via diff review not to touch this contract's own `layers`/`detail`/`font`/highlight/camera-bounds or
  `list_themes`/`list_formats`/`motion.script`-echo logic. All 20 machine evals re-run fresh:
  `resolveConfig.test.ts` 64/64 (up from 59), `tools.test.ts` 52/52, `http.test.ts` 49/49,
  `jobRunner.test.ts` 22/22, `motionCompiler.test.ts` 32/32, `geocode.test.ts` 26/26,
  `tier0-invariants.ts` all I1-I3 `ok`, `npm test` 493/500 (up from 475/482 — road-routing's own tests
  only), `npm run test:mcp` 7/7. Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
