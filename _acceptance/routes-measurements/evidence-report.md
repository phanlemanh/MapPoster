---
schema_version: 2
feature_slug: routes-measurements
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 46935e80b8a01330fb6af9a8444d9af93807a48a
human_signoff:
---

# Evidence Report: routes-measurements

_Round 5 — re-pin after a rebase onto merged `main`, not a re-audit. PR #2 (this contract's own PR)
merged to `main`; the branch was rebased onto the new `main` tip (`ecd4a37`), rewriting every commit
SHA including Round 4's `verified_commit` (`6644d1b`) — no longer an ancestor of this branch (still
present as a dangling local object, which is why a local staleness check would misleadingly pass; a
fresh CI clone would not resolve it at all). `git diff 6644d1b HEAD` confirms **zero** non-gate files
changed — only `_acceptance/**` differs; every source/test file this contract depends on is
byte-identical to Round 4. Re-ran fresh: `npm test` (475/482, unchanged), `npm run test:mcp` (7/7,
unchanged), and `routes-invariants.ts` (all I1-I3 clauses still `ok`; I1's own output line now
legitimately reads `vs ecd4a377` instead of the stale `999c13c8`, since the script computes `git
merge-base origin/main HEAD` itself). E1-E14/E16/E19 are re-pinned unchanged below: their commands
don't read git state and their target files are confirmed byte-identical, so Round 4's evidence
blocks stand without re-execution._

_Round 4 — re-verification. Round 3's evidence (`verified_commit: 31ad91b`, signed off `manh`
2026-08-06) went STALE: `feat/motion-tools-cost` landed six commits on top of `31ad91b`
(`a13a1c4`..`6644d1b`) touching `mcp-server/src/{encodeAnimation.ts,http.ts,jobRunner.ts,
resolveConfig.ts,tools.ts}` and their test files. Contract `status` downgraded `signed-off` →
`implemented` per the staleness guard before this report was written; `human_signoff` cleared — Round
3's signature does not carry to this round._

_`git diff 31ad91b..HEAD -- mcp-server/src/resolveConfig.ts mcp-server/src/tools.ts` confirms the
motion-tools-cost diff is additive to this contract's own logic: `resolveConfig.ts` gained a new
`camera.focus` branch (`if (focus) {...} else if (cam.zoom == null) {...}`) inserted BEFORE the
pre-existing routes/regions auto-frame branch, which is untouched — the routes-only auto-frame path
(AC-7) is the `else if` arm, byte-identical to Round 3. `tools.ts` gained `compile_motion`, `list_fonts`,
and `cost` metadata as new top-level handlers; the `routes + measure` describe block this contract's
own E2/E14 depend on (tools.test.ts:144-188) is unmoved. `git diff ... | grep '^-'` on both test files
shows only import-statement lines removed (extended, not shrunk) — zero existing test assertions were
deleted. Every one of this contract's own 20 machine evals was re-run fresh anyway (not assumed from
Round 3), and each eval's `expected` clause was re-checked against a real assertion in the (unchanged)
test file, per this round's instructions._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E19 | AC-1 | test | PASS |
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
| E20 | AC-14 | script | PASS |
| E16 | AC-1 | script | PASS |
| E17 | AC-13 | test | PASS |
| E18 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    ROUND 4 — re-run fresh: `npx vitest run mcp-server/src/resolveConfig.test.ts`: 59/59 passed (up
    from 53 in Round 2/3 — the +6 delta is motion-tools-cost's own new `camera.focus` describe block,
    confirmed by reading it; nothing in the `routes`/`measure` describe blocks changed). `routes >
    accepts both route forms and fills style defaults from the theme` (resolveConfig.test.ts:385-398,
    unmoved) still asserts a `coords` entry and a `geojson` entry both resolve into `cfg.routes` with
    concrete geojson/color/width, per AC-1.

- eval: E19
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run as E1. `routes > leaves routes UNDEFINED when the call has none — not an empty array`
    (resolveConfig.test.ts:400-406, unmoved): `cfg.routes === undefined` for a call with no `routes` key.
    Matches the SHOULD-NOT-EMIT half exactly, unaffected by this round's diff.

- eval: E2
  run_id: routes-measurements-E2-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T23:55:39Z
  output: |
    ROUND 4 — re-run fresh: `npx vitest run mcp-server/src/tools.test.ts`: 52/52 passed (up from 43 —
    the delta is motion-tools-cost's own `compile_motion`/`cost metadata` describe blocks, plus
    tier0-agent-params' `list_fonts` additions merged earlier; the `routes + measure (PR #2)` describe
    block is unmoved). `refuses a route that carries both geojson and coords` (tools.test.ts:180-187):
    `res.isError === true`, message matches `/exactly one of/`. Matches AC-2 exactly.

- eval: E3
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run as E1 (resolveConfig.test.ts:431-438, unmoved): `routes: [{}]` (neither coords nor geojson)
    rejects `/exactly one of/`. Matches AC-2's second SHOULD-NOT-ACCEPT case.

- eval: E4
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — the geojson-form route with no style resolves to width=4, color='#e8b04b' (midnight-blue
    accent). Matches AC-3 exactly, unmoved since Round 2.

- eval: E5
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — `resolveConfig.test.ts:431-438` (coords/color/width-out-of-range rejection) plus the
    width=1/16 boundary-accept case added in `06e4ae1` (Round 2 of this contract's own history) are both
    present and green. All four clauses of E5's `expected` text remain covered.

- eval: E6
  run_id: routes-measurements-E6-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.apply_render_config
  verified_at: 2026-08-06T23:58:56Z
  output: |
    `npx vitest run src/render/applyRenderConfig.test.ts`: 10/10 passed — unchanged count, file not in
    this round's diff (`src/render/applyRenderConfig.ts` does not appear in `git diff 31ad91b..HEAD
    --stat`). Store gets `RouteItem` id `'rt-0'`; a later config with no routes clears the store back to
    `[]`. Both halves of AC-5 confirmed still green.

- eval: E7
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — 40×310KiB routes (12.1 MiB total) rejected `/total inline GeoJSON/i`; a single 310KiB
    route accepted. Both halves of AC-6, unmoved.

- eval: E8
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — a routes-only call frames `camera.center` on the route bbox midpoint (105.5, 21.5), not
    `location`. This is the `else if (cam.zoom == null)` arm this round's diff review confirmed is
    untouched by the new `camera.focus` branch (which sits in a separate `if` ahead of it). AC-7 intact.

- eval: E9
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — `pointCount`/`bbox`/`lengthKm` present, `'km' in r` is false. AC-8's field-presence half
    confirmed; the polyline > straight-line property is independently re-confirmed by E12 and E16 below.

- eval: E10
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — Hà Nội→TP.HCM pair gives `straightLineKm` in (1132,1143), `bearingDeg` south-ish, no bare
    `km` key. AC-9 confirmed unmoved.

- eval: E11
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — polygon-with-hole `areaKm2` strictly less than the solid outer-ring equivalent, plus
    `spanKm`/`centroid`. AC-11 confirmed unmoved.

- eval: E12
  run_id: routes-measurements-E12-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geometry
  verified_at: 2026-08-06T23:59:00Z
  output: |
    `npx vitest run mcp-server/src/geometry.test.ts`: 12/12 passed — unchanged count, `geometry.ts` not
    in this round's diff. All five sub-claims (haversine vs great-circle, polyline > straight line, area
    subtracts holes and is winding-independent, span at mid-latitude) independently re-confirmed.

- eval: E13
  run_id: routes-measurements-E1-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T23:56:00Z
  output: |
    Same run — `measure.pairs: [[0,5]]` with only 1 highlight point rejects `/measure\.pairs/`. AC-10
    confirmed unmoved.

- eval: E14
  run_id: routes-measurements-E2-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T23:55:39Z
  output: |
    Same run as E2 — a call with neither `routes` nor `measure` omits both keys from `resolved`; a call
    WITH routes has `resolved.routes[0]` present with `pointCount`/`lengthKm`. Both halves of AC-12,
    unmoved (`routes + measure (PR #2)` describe block untouched by motion-tools-cost's new describe
    blocks elsewhere in the same file).

- eval: E15
  run_id: routes-measurements-repin-E15-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T00:24:45Z
  output: |
    ROUND 5 — re-run fresh post-rebase (this script computes `git merge-base origin/main HEAD`
    itself, so its own output text is git-state-dependent):
    ok   I1  t3_path untouched vs ecd4a377 (31 file đổi, không cái nào trong t3_paths)
    ok   I2  routes[].width có guard assertRouteWidth (định nghĩa: true, được gọi: true)
    ok   I2  routes[].coords (>=2 vị trí) có guard coordsToLineString (định nghĩa: true, được gọi: true)
    ok   I2  routes[].geojson có guard assertGeojson (định nghĩa: true, được gọi: true)
    ok   I2  routes[].color có guard assertColor (định nghĩa: true, được gọi: true)
    ok   I2  cap TỔNG geometry được SO SÁNH thật trong resolver: true
    ok   I2  measure.pairs SO SÁNH chỉ số với số marker: true
    ok   I3  mcp-server/src/resolveConfig.ts: không có tên số đo trần
    ok   I3  mcp-server/src/geometry.ts: không có tên số đo trần
    ok   I3  bốn tên đủ nghĩa đều có mặt (lengthKm, straightLineKm, areaKm2, spanKm): true
    routes-invariants: mọi bất biến còn giữ
    I1's file-count is now 31 (down from Round 4's 45) purely because the merge-base moved forward to
    `ecd4a377` (`main` now contains this contract's own previously-unmerged commits directly) —
    t3_paths still shows zero hits.

- eval: E20
  run_id: routes-measurements-repin-E15-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T00:24:45Z
  output: |
    Same run as E15 — the two "không có tên số đo trần" lines and the four-self-describing-names line
    directly answer E20's `expected`.

- eval: E16
  run_id: routes-measurements-E16-20260807r4
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_demo
  verified_at: 2026-08-06T23:59:45Z
  output: |
    PHẦN A — 5 real renders through resolveConfig → deps.render() (real headless Chromium, real pixels):
    A0-no-routes, A1-one-route, A2-multi-route (3 routes/3 colors), A3-default-style, A4-route-only-frame.
    PHẦN B — 9/9 measurement checks passed, including the two E16 names explicitly:
      lengthKm=6.79 · polyline DÀI HƠN chim bay hai đầu (6.79 km > 6.17 km)
      vùng: diện tích TRỪ LỖ (96.9 km² < 115.4 km² đặc, tỉ lệ trừ ≈0.840)
    Re-run fresh, unchanged from Round 3's 9/9.

- eval: E17
  run_id: routes-measurements-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    ROUND 5 — re-run fresh post-rebase: `npm test` — Test Files 30 passed | 3 skipped (33); Tests 475
    passed | 7 skipped (482) — identical counts to Round 4, confirming the rebase changed no test
    content. Broad regression-floor guard, green as expected.

- eval: E18
  run_id: routes-measurements-repin-testmcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T00:23:59Z
  output: |
    ROUND 5 — re-run fresh post-rebase: `npm run test:mcp` — Test Files 3 passed (3); Tests 7 passed
    (7); Duration 42.63s — real vite build + real headless-Chromium MCP integration, identical counts
    to Round 4. Unaffected by the rebase.

## Analyst

Every routes-measurements-specific eval (E1-E16, E19, E20 — 18 of 20) remains `red` on the pre-feature
baseline (merge-base `999c13c8`), carried forward unchanged from Round 2/3's own worktree-verified
determination per this round's re-verification instruction (not recomputed — motion-tools-cost's diff
does not touch anything that would change which side of the baseline these evals fall on: it only adds
new, unrelated branches to the same files). E17/E18 (the two broad suite guards) are `green` on both
trees, as expected for whole-suite regression floors.

No new gaps found this round. The one prior gap (E5's width-boundary clause, closed in this contract's
own Round 2 by commit `06e4ae1`) remains closed — re-confirmed present in this round's fresh 59/59 run.

## Variance

none — every eval this round is a deterministic single run.

## Iterations

- Round 1 (commit `25c2d2a`): first verify. REJECT — E5's width-boundary-acceptance clause untested.
- Round 2 (commit `06e4ae1`): E5's gap closed with an explicit boundary test. All 20 machine evals PASS.
- Round 3 (commit `31ad91b`): re-pin after a sibling contract's file (`src/lib/export.test.ts`) changed;
  no re-audit needed (file outside this contract's dependency set). PASS.
- Round 4 (verified 2026-08-06T23:59Z, commit `6644d1b`): re-verify triggered by `feat/motion-tools-cost`
  landing on top of `31ad91b`, touching `mcp-server/src/{encodeAnimation.ts,http.ts,jobRunner.ts,
  resolveConfig.ts,tools.ts}`. Diff review confirmed the change is additive to this contract's own logic
  (a new `camera.focus` branch ahead of, not inside, the routes auto-frame arm; new top-level tool
  handlers that don't touch the `routes + measure` describe block). All 20 machine evals re-run fresh,
  each `expected` clause re-checked against a real assertion. Zero judgment/ui-check evals on this
  `surfaces: [api]` contract. Verdict **PASS**.
- Round 5 (verified 2026-08-07T00:24Z, commit `46935e8`): re-pins evidence after a rebase onto merged
  `main` — PR #2 (this contract's own) landed, branch rebased onto `main`'s new tip `ecd4a37`,
  rewriting every commit SHA. `git diff 6644d1b HEAD` confirmed zero non-gate files changed — a
  re-pin, not a re-audit. Broad guards (`npm test`, `npm run test:mcp`) and the git-state-dependent
  `routes-invariants.ts` script were re-run fresh and matched Round 4 exactly; E1-E14/E16/E19 stand
  unchanged from Round 4. Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
