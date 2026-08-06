---
schema_version: 2
feature_slug: routes-measurements
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 31ad91b373380a81db80f1abc7e63043a1930433
human_signoff:
---

# Evidence Report: routes-measurements

_Round 3 — re-pin only, not a re-audit. Commit `b4150be` (after this contract's Round 2 verify)
changes `src/lib/export.test.ts` only — a `map-motion-clip`-owned file this contract does not depend
on (`surfaces: [api]`, no `src/lib/**` involvement anywhere in this contract's own criteria). That
commit made every already-verified `verified_commit` older than HEAD, tripping the pre-merge
staleness check regardless of relevance, so this round re-runs the broad guards (`npm test`, `npm run
test:mcp`) fresh and re-pins. No new gaps expected or found — see Iterations below._

_Round 2 — re-verification of Round 1's single REJECT. Commit `06e4ae1` adds a new describe block to
`resolveConfig.test.ts`, "boundary halves the evals claimed but no test proved (verify round 1
finding)", closing E5's missing clause: route `width` at both bounds (1 and 16) is now explicitly
asserted ACCEPTED. This round re-ran the shared command fresh, confirmed the new assertion actually
exists and passes, and additionally ran an independent negative control (see Evidence below) rather
than trusting the commit message's own claim. All 20 machine evals now pass; `surfaces: [api]` has no
judgment/ui-check evals, so per the routing rule this contract is **PASS**. Round 1's REJECT is kept
below in Iterations, not erased — the record shows the gap was found and then closed, not that it never
existed._

_Round 1 — first verify. `surfaces: [api]`, no judgment and no ui-check evals, so per the routing
rule a clean sweep would be PASS. It is not: E5's own `expected` bundles four sub-claims, and one of
them — "width biên 1 và 16 được NHẬN" (width boundary 1 and 16 must be ACCEPTED) — has no passing
assertion anywhere in the suite. The command E5 shares (`resolve_config`) exits 0, and 3 of its 4
sub-claims are genuinely asserted, but "the suite is green" is not evidence for the specific behaviour
this eval's `expected` names, and that specific behaviour is untested. Per this round's own instructions,
that makes E5 NOT a pass, and any failed eval routes the whole contract to REJECT — regardless of how
clean the other 19 are._

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

- eval: E5
  run_id: routes-measurements-E5-20260806r2
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T16:25:44Z
  output: |
    ROUND 2 — the missing clause now has a real assertion. Commit `06e4ae1` added
    `describe('boundary halves the evals claimed but no test proved (verify round 1 finding)')`
    including `it('ACCEPTS route width exactly at both bounds', ...)`:
      for (const width of [1, 16]) {
        const cfg = await resolveConfig({ ...at, routes: [{ coords, width }] });
        expect(cfg.routes?.[0].width).toBe(width);
      }
    Both boundary values (1 and 16) are now explicitly asserted ACCEPTED, completing all four clauses
    of E5's `expected` text (the other three — coords/color/width-out-of-range rejection — were already
    covered in Round 1). `npx vitest run mcp-server/src/resolveConfig.test.ts`: 53/53 passed (up from
    50/50 in Round 1 — +3 new tests: this width-boundary case plus the sibling size-boundary and
    style-fallback-chain cases that closed tier0-agent-params's gaps in the same commit).
    Independent negative control (run by this verifier, not just trusting the commit message): reverted
    `resolveConfig.ts`'s `assertRouteWidth` bound is untouched by this commit (only the test file
    changed) — the width guard was already correct in Round 1, the gap was purely test coverage. To
    confirm the NEW test is a real discriminator rather than a tautology, this verifier independently
    mutated the sibling marker-size guard (`p.size != null` → `p.size`, the exact defect class the width
    test guards against) and re-ran the size-boundary test in isolation against the mutated source: the
    `size: 0` assertion broke exactly as expected under the mutant, confirming that class of test is a
    real discriminator; the source was then reverted and the full file re-confirmed green — back to all
    53 of 53 tests passing. The width test itself follows the identical pattern (loop over the two boundary
    values, assert acceptance) against a guard (`n < 1 || n > 16`) that was already correct — Round 1
    already confirmed the implementation was right; this round confirms a test now actually proves it.
    baseline: red — on the pre-feature tree the same test file (with these new cases) still fails outright
    for the reasons established in Round 1 (old `resolveConfig` had no `routes` param handling at all).

- eval: E5 [ROUND 1 — superseded, kept for history]
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `npx vitest run mcp-server/src/resolveConfig.test.ts` exits 0 (50/50 tests pass) — the command
    itself is green. But E5's own `expected` text is a FOUR-part claim: "coords 1 vị trí, color 'red',
    width 99 đều bị TỪ CHỐI kèm tên trường; width biên 1 và 16 được NHẬN". The one test mapped to this
    eval, `routes > rejects a route with fewer than two coords, a bad colour, or a width out of range`
    (resolveConfig.test.ts:431-438), asserts exactly THREE of those four:
      - coords: [[lng,lat]] (1 position) → rejects /routes[]\.coords/           — asserted, line 434
      - color: 'red' (bad hex) → rejects /routes[]\.color/                     — asserted, line 435
      - width: 99 (out of range) → rejects /routes[]\.width/                   — asserted, line 436
    The fourth clause — width AT the boundary (1 and 16) must be ACCEPTED, not rejected — had NO
    assertion anywhere in the suite at Round 1. Now closed — see the fresh E5 block above.

- eval: E1
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `routes > accepts both route forms and fills style defaults from the theme` (resolveConfig.test.ts:
    385-398): a `coords` entry AND a `geojson` entry both resolve into `cfg.routes` (length 2); the
    coords entry keeps its explicit color/width (#ff0000, 8); the geojson entry (no style given) gets
    width=4 and color=`#e8b04b` (midnight-blue accent) — confirming both input FORMS reach
    RenderConfig.routes with concrete geojson/color/width, per AC-1. `resolveRoutes()` (resolveConfig.ts)
    always emits a `geojson` field regardless of input form (coordsToLineString for `coords`,
    assertGeojson passthrough for `geojson`) — a structural guarantee, not a conditional branch, so its
    absence from this test's explicit assertions is not a coverage gap the way E5's boundary clause is.
    Vitest tail:
     Test Files  1 passed (1)
          Tests  50 passed (50)
       Duration  <1s

- eval: E19
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `routes > leaves routes UNDEFINED when the call has none — not an empty array`
    (resolveConfig.test.ts:400-406): a call with no `routes` key resolves to `cfg.routes === undefined`
    (not `[]`), and `summarizeRoutes(cfg)` returns `[]` — matches the SHOULD-NOT-EMIT half exactly.

- eval: E2
  run_id: routes-measurements-E2-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T15:54:31Z
  output: |
    `routes + measure (PR #2) > refuses a route that carries both geojson and coords` (tools.test.ts:
    180-187): a route entry with BOTH `coords` and `geojson` set → `res.isError === true`,
    error message matches /exactly one of/. Matches AC-2's SHOULD-NOT-ACCEPT half exactly.
     Test Files  1 passed (1)
          Tests  43 passed (43)

- eval: E3
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    Same test as E5 (resolveConfig.test.ts:431-438), last assertion: `routes: [{}]` (neither coords
    nor geojson) → rejects /exactly one of/. Matches AC-2's second SHOULD-NOT-ACCEPT case.

- eval: E4
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    Same test as E1: the geojson-form route with no style declared resolves to width=4,
    color='#e8b04b' — exactly midnight-blue's accent. Matches AC-3 exactly.

- eval: E6
  run_id: routes-measurements-E6-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.apply_render_config
  verified_at: 2026-08-06T15:54:32Z
  output: |
    `applyRenderConfig: routes > wires cfg.routes into the store...` — store gets `RouteItem` with
    `id: 'rt-0'`. `> clears routes when a later config carries none, so nothing leaks between renders` —
    a second `applyRenderConfig` call with no routes leaves `usePosterStore.getState().routes` as `[]`.
    Both halves of AC-5 asserted (applyRenderConfig.test.ts:21-38).
     Test Files  1 passed (1)
          Tests  10 passed (10)

- eval: E7
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `routes > caps TOTAL inline geometry, not merely each payload on its own`: 40 routes × 310 KiB
    (12.1 MiB total, each payload under the 2 MiB per-payload cap) → rejects /total inline GeoJSON/i.
    `routes > lets a single large-but-legal payload through...`: ONE 310 KiB route → accepted
    (cfg.routes has length 1). Both halves of AC-6 asserted (resolveConfig.test.ts:440-456).

- eval: E8
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `routes > frames on routes when there is no region and no point`: a routes-only call resolves
    camera.center to the ROUTE's bbox midpoint (105.5, 21.5), not the `location` coordinate — matches
    AC-7 exactly (resolveConfig.test.ts:421-429).

- eval: E9
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `routes > summarises each route with a length name that says WHICH measurement it is`:
    pointCount=3, bbox present, lengthKm>2, and `'km' in r` is false — matches AC-8's field-presence
    and self-describing-name requirements (resolveConfig.test.ts:408-419). The stronger "polyline >
    straight line" property this same AC ultimately requires is independently proven at the geometry
    layer by E12 and at the pixel layer by E16 (both PASS, see below) — E9's own `expected` text only
    asks for field presence + correct naming, which this test fully covers.

- eval: E10
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `measure > measures point pairs as straight-line distance plus a bearing`: Hà Nội→TP.HCM pair
    gives straightLineKm in (1132,1143) (great-circle truth 1137.89 km) and bearingDeg in (90,270)
    (south-ish); `'km' in m.pairs[0]` is false. Matches AC-9 exactly (resolveConfig.test.ts:460-474).

- eval: E11
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `measure > reports region area with holes SUBTRACTED, plus span and centroid`: a polygon with a
    hole has areaKm2 strictly less than the same outer ring solid, plus spanKm.ew > 9 and a centroid
    near the outer ring's center. Matches AC-11 exactly (resolveConfig.test.ts:486-498).

- eval: E12
  run_id: routes-measurements-E12-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geometry
  verified_at: 2026-08-06T15:54:33Z
  output: |
    geometry.test.ts, all 5 sub-claims independently asserted: haversineMeters(Hanoi,HCMC) lands in
    (1132,1143) km, cross-checked against the great-circle truth (`haversine khớp Vincenty`);
    polylineLengthMeters on a dogleg path is asserted `.toBeGreaterThan(haversineMeters(start,end))`
    (line 32, the literal "polyline > chim bay" property); geometryAreaM2 subtracts holes (line 45-49,
    holed/solid ≈ 0.75) AND is winding-order independent (line 52-56); spanKmOf measures east-west
    along the mid-latitude, shorter than at the equator by cos(21°) (line 85-92).
     Test Files  1 passed (1)
          Tests  12 passed (12)

- eval: E13
  run_id: routes-measurements-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T15:54:30Z
  output: |
    `measure > refuses a pair pointing at a point that does not exist`: `measure.pairs: [[0,5]]` with
    only 1 highlight point → rejects /measure\.pairs/. Matches AC-10 exactly (resolveConfig.test.ts:
    476-484).

- eval: E14
  run_id: routes-measurements-E2-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T15:54:31Z
  output: |
    `routes + measure (PR #2) > omits routes and measures entirely when the call uses neither`:
    `j.resolved` lacks both `routes` and `measures` keys. `> reaches the render config and echoes
    resolved.routes...`: a call WITH routes has `j.resolved.routes[0]` present with pointCount/lengthKm.
    Both halves of AC-12 asserted (tools.test.ts:145-166). Baseline note: the "omits" half is inherently
    green-on-both (old `resolvedOf` never had these keys either, so suppression is a non-event on old
    code) — flagged under Analyst below; the "emits when present" half is genuinely red on baseline, so
    the eval as a whole discriminates.

- eval: E15
  run_id: routes-measurements-E15-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-06T15:54:40Z
  output: |
    ok   I1  t3_path untouched vs 999c13c8 (17 file đổi, không cái nào trong t3_paths)
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

- eval: E20
  run_id: routes-measurements-E15-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-06T15:54:40Z
  output: |
    Same run as E15 (single script covers I1/I2/I3). I3's two "không có tên số đo trần" lines directly
    grep resolveConfig.ts and geometry.ts for bare `km`/`distance`/`area`/`length`/`span` field names and
    find none; the fourth line confirms all four self-describing names
    (lengthKm/straightLineKm/areaKm2/spanKm) are present. Matches E20's `expected` exactly.

- eval: E16
  run_id: routes-measurements-E16-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_demo
  verified_at: 2026-08-06T15:54:54Z
  output: |
    PHẦN A — 5 real renders through resolveConfig → deps.render() (real headless Chromium, real pixels):
    A0-no-routes, A1-one-route, A2-multi-route (3 routes/3 colors), A3-default-style (no style →
    theme accent), A4-route-only-frame.
    PHẦN B — 9 measurement checks, 9/9 passed, including the two the eval names explicitly:
      ✓ tuyến: chiều dài polyline hợp lý               lengthKm=6.79
      ✓ polyline DÀI HƠN chim bay hai đầu               6.79 km > 6.17 km
      ✓ vùng: diện tích TRỪ LỖ                          96.9 km² < 115.4 km² (đặc)
      ✓ vùng: tỉ lệ trừ đúng ~16%                       tỉ lệ=0.840
    ẢNH: 5 render → _acceptance/routes-measurements/demo/index.html · KIỂM: 9 đạt · 0 trượt

- eval: E17
  run_id: routes-measurements-E17-20260806r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    ROUND 3 re-pin — re-run fresh because `b4150be` changed `src/lib/export.test.ts` (a sibling
    contract's file, not this one's, but the broad guard was re-run per the coordinator's instruction):
     Test Files  30 passed | 3 skipped (33)
          Tests  457 passed | 7 skipped (464)
       Duration  2.89s
    Up from 456 in Round 2 — the +1 delta is `export.test.ts`'s new attribution-content-pin test, not
    anything in this contract's own surface. Broad regression-floor guard — expected green on both
    trees.

- eval: E18
  run_id: routes-measurements-E18-20260806r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-06T16:35:29Z
  output: |
    ROUND 3 re-pin: real vite build + real headless-Chromium MCP integration suite (renderFrame.test.ts,
    renderClip.test.ts, stdioChannel.test.ts):
     Test Files  3 passed (3)
          Tests  7 passed (7)
       Duration  49.76s
    Unaffected by `b4150be` (`export.test.ts` is not part of this suite's file list). Broad
    regression-floor guard — expected green on both trees, same reasoning as E17.

## Analyst

Every routes-measurements-specific eval (E1-E16, E19, E20 — 18 of 20) is `red` on the pre-feature
baseline (merge-base `999c13c8`): confirmed with a real `git worktree add --detach 999c13c8`, this
branch's test files copied onto the old `mcp-server/`/`src/render/` source (node_modules symlinked, no
reinstall). `resolveConfig.test.ts` fails 11/50 on old source (`summarizeMeasures`/`summarizeRoutes` are
undefined), `tools.test.ts` fails 3/43, `applyRenderConfig.test.ts` fails 1/10, `geometry.test.ts` fails
to even load (module `./geometry` does not exist on old source), `routes-invariants.ts` exits 1 (4 of 6
I2 guards report "chưa định nghĩa", then crashes reading the nonexistent `geometry.ts`), and
`demo-routes.ts` exits 1 at import time (`summarizeMeasures` not exported). E17/E18 (the two broad
`npm test`/`test:mcp` suite guards) are `green` on both trees, as expected for whole-suite regression
floors rather than feature-specific discriminators.

One half-suppression note: E14's "omits routes/measures when unused" half is inherently green-on-both
(old `resolvedOf` never had those keys either, so there was nothing to suppress) — not a defect, just the
expected shape of a should-NOT-emit assertion paired with a should-emit one in the same test file; the
eval as a whole still discriminates because its should-emit half is red on baseline.

**E5 was the one real gap in Round 1, and it was a test-coverage gap, not a baseline non-discrimination
issue**: 3 of its 4 asserted clauses were red-on-baseline (genuinely new, well-tested behaviour); the 4th
clause — "width boundary 1 and 16 must be ACCEPTED" — had no test to be red OR green, on either tree.
**Round 2 closes it**: commit `06e4ae1` adds an explicit accept-at-boundary test (width 1 and 16), the
same shape tier0-agent-params's own boundary evals use for `detail=0/1` and marker `size=18/140`. This
round's independent negative control (mutating the sibling size guard and confirming its own new test
catches the mutation) gives confidence the pattern generalizes correctly, not just that the width test
happens to pass. Zero remaining gaps across all 20 evals.

## Variance

none — every eval this round is a deterministic single run (no `runs > 1` marker; nothing crosses
`ctx.providers.invoke` or an LLM generator).

## Iterations

- Round 1 (verified 2026-08-06T16:06Z, commit `25c2d2a`): First verify. 19/20 machine evals pass with a
  real assertion behind every clause of their `expected` text; E5 fails on assertion-completeness (its
  width-boundary-acceptance clause is untested, see Evidence/Analyst above) even though its shared
  command exits 0. Verdict REJECT, `failed_evals: [E5]`. No re-implementation attempted this round — this
  is the first and only round run so far; the fix (add a width=1/width=16 acceptance case to
  `resolveConfig.test.ts`'s `routes` describe block) is a small, well-scoped addition for the next round.
- Round 2 (verified 2026-08-06T16:26Z, commit `06e4ae1`): commit `06e4ae1` added the missing width=1/16
  accept-at-boundary test (plus two sibling fixes scoped to tier0-agent-params, see that contract's own
  report). `resolveConfig.test.ts` re-run fresh: 53/53 passed (up from 50). `npm test` broad guard
  re-run fresh (test file changed): 456/463 passed (up from 453). This verifier independently confirmed
  the new assertion is a real discriminator via a negative control (mutated the sibling size guard,
  confirmed its paired test fails, reverted). All 20 machine evals now pass; zero judgment/ui-check
  evals on this `surfaces: [api]` contract. Verdict **PASS**.
- Round 3 (verified 2026-08-06T16:36Z, commit `31ad91b`): re-pin only, not a re-audit — commit
  `b4150be` (a sibling-contract test file, `src/lib/export.test.ts`) landed after Round 2's
  `verified_commit`, tripping the pre-merge staleness check even though this contract does not depend
  on that file. Re-ran the broad guards fresh: `npm test` 457/464 passed (up from 456 — the
  `export.test.ts` delta, not this contract's own surface), `npm run test:mcp` 7/7 passed, unaffected.
  No re-audit of E1-E16/E19/E20 performed — none of their source/test files changed since Round 2. All
  20 machine evals remain PASS; zero judgment/ui-check evals. Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
