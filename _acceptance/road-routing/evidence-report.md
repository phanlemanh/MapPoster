---
schema_version: 2
feature_slug: road-routing
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 27e1be1a1431055f4b19bbf7734c07eacd5a791c
human_signoff:
---

# Evidence Report: road-routing

Round 1 — first verify. `surfaces: [api]`, contract carries no `judgment` and no `ui-check` evals (a
pure API/schema surface, no rendered UI, no business-judgment call), so per the routing rule a clean
sweep of all 16 machine evals is PASS. Every eval's `expected` clause was checked against a real
passing assertion in the test file it names — not inferred from "the suite is green" — see Evidence
below for the exact `it(...)` block behind each claim. `merge-base origin/main HEAD` = `f74ede1`
(confirmed via `git merge-base`); `verified_commit` is this branch's own HEAD.

**Network-truth check (contract claims no eval hits the public OSRM instance):** read
`mcp-server/src/route.test.ts` in full (13 tests). Every test that reaches `resolveRoute` calls
`vi.stubGlobal('fetch', vi.fn(...))` (or a `beforeEach`-scoped stub) before invoking it — there is no
code path in this file that calls the real global `fetch`. The two `decimate()` unit tests call the
pure function directly and never touch `resolveRoute` at all, so no stub is even needed there. Also
read `mcp-server/src/resolveConfig.test.ts`: it carries a module-level `vi.mock('./route', () => ({
resolveRoute: vi.fn(...) }))` (line 24), so the five new `routes[].route` tests never reach `route.ts`'s
real network path either. `route.ts`'s `DEFAULT_OSRM_URL` (`https://routing.openstreetmap.de/routed-car`)
is therefore never dialed by any eval in this contract — confirmed by reading the test file, not
inferred from the suite being green.

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
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    `npx vitest run mcp-server/src/route.test.ts`: 13/13 passed. `resolveRoute > asks OSRM for full
    GeoJSON geometry and returns km/min`: the mocked fetch's URL contains `overview=full` AND
    `geometries=geojson` AND the encoded `from` coordinate `105.8,21`; response has
    `distanceKm ≈ 12.4`, `durationMin ≈ 28`, `geojson.features[0].geometry.type === 'LineString'`. Every
    clause of E1's `expected` (URL params, LineString, km/min) has its own assertion.

- eval: E2
  run_id: road-routing-E2-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    `npx vitest run mcp-server/src/resolveConfig.test.ts`: 64/64 passed. `routes[].route — đường đi
    thực tế (PR #5) > accepts a route request and echoes distance/duration beside the geometry`: with a
    mocked `./route` module, `summarizeRoutes(cfg)[0]` has `distanceKm ≈ 12.4`, `durationMin ≈ 28`,
    `provider` matching `/osrm/i`, AND `lengthKm > 0` — proving the three router fields land BESIDE
    (not instead of) `lengthKm`/`bbox`/`pointCount`, which `summarizeRoutes` already always emits.

- eval: E3
  run_id: road-routing-E2-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run. `> omits distance/duration for a route the caller drew by hand — those are router facts`:
    for a `coords`-only route, `r.lengthKm > 0` but `r.distanceKm`, `r.durationMin`, `r.provider` are all
    `toBeUndefined()` — explicitly asserted as `undefined`, not `0` or absent-by-omission-of-check. Matches
    E3's SHOULD-NOT-EMIT clause exactly.

- eval: E4
  run_id: road-routing-E2-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run. Two tests cover both named forms of E4's SHOULD-NOT-ACCEPT claim: `> refuses an entry
    carrying more than one of coords/geojson/route` (`coords` + `route` together) rejects with
    `/exactly one of/`; the pre-existing `routes > rejects a route with fewer than two coords, a bad
    colour, or a width out of range` test's fourth assertion, `routes: [{}]` (none of the three forms),
    also rejects with `/exactly one of/`. `mcp-server/src/tools.ts`'s Zod `.refine()` for `routeSchema`
    was read directly: `[r.geojson, r.coords, r.route].filter((v) => v != null).length === 1` — the
    exactly-one-of-three count is enforced at the schema layer too, not only in `resolveRoutes`.

- eval: E5
  run_id: road-routing-E2-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same run. `> geocodes a named from/to through the same country anchor as highlights`: with
    `location: 'Ho Chi Minh City'` and `route: { from: 'Bến Thành', to: 'Tân Sơn Nhất' }`,
    `geocode.resolveLocation` is asserted `toHaveBeenCalledWith('Bến Thành', 'Vietnam')` AND
    `toHaveBeenCalledWith('Tân Sơn Nhất', 'Vietnam')` — the SAME anchor argument
    (`'Vietnam'`, resolved from the rendered location) that highlight resolution uses elsewhere in this
    file's `anchors every highlight to the country of the location being rendered` test.

- eval: E6
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    Same run. `resolveRoute > sends via points in order between from and to`: with
    `{ from: [1,1], via: [[1.5,1.5]], to: [2,2] }`, the request URL literally contains
    `'1,1;1.5,1.5;2,2'` — via sits between from and to in that exact order.

- eval: E7
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    Same run. `resolveRoute > maps moto to the driving profile and says so, rather than pretending a
    moto profile exists`: `OSRM_PROFILE.moto === 'driving'` AND the response `provider` matches
    `/driving/` — both the mapping table and its being written out into `provider` are asserted, not just
    one or the other.

- eval: E8
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    Same run. Two tests cover both halves. `> caches an identical request instead of paying the network
    twice`: same `{from,to}` requested twice → the fetch mock `toHaveBeenCalledTimes(1)`
    (SHOULD-NOT-REFETCH). `> treats a different mode as a different request — the cache key must carry
    it`: same `{from,to}` but `mode: 'car'` then `mode: 'walk'` → `toHaveBeenCalledTimes(2)`
    (SHOULD-REFETCH). Mode is proven to be part of the cache key by a real call-count assertion, not by
    inspecting an internal key string.

- eval: E9
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    Same run. `> gives up on a hung upstream rather than holding the clip slot`: fetch is stubbed to
    hang until its `AbortSignal` fires, `MAPPOSTER_ROUTE_TIMEOUT_MS: '120'` is set, and the call
    `.rejects.toThrow(/timed out/i)` — the env var name is exercised, not just a bare timeout constant.
    `> passes an AbortSignal on every request — a fetch without one cannot be timed out`: the `init`
    object seen by the mocked fetch has `signal` `toBeInstanceOf(AbortSignal)`. Both halves — cancellation
    on timeout AND signal-on-every-request — have their own assertion.

- eval: E10
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    Same run. `> reports a no-route answer as a caller-actionable error, not an empty line`: OSRM
    `code: 'NoRoute'` response → `.rejects.toThrow(/no route/i)`. `> names the self-hosting remedy when
    the upstream fails`: a 503 HTTP response → `.rejects.toThrow(/MAPPOSTER_OSRM_URL/)` — the env var
    name a caller would actually set appears in the thrown message, not a bare "upstream error". Neither
    case returns an empty route.

- eval: E11
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    Same run. `> refuses coordinates outside the valid range before spending a request`:
    `{ from: [999,1], to: [2,2] }` → `.rejects.toThrow(/longitude/i)` AND, on the SAME fetch mock,
    `expect(f).not.toHaveBeenCalled()` — the rejection is proven to happen before any network call, not
    merely to eventually throw.

- eval: E12
  run_id: road-routing-E1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T01:26:28Z
  output: |
    Same run. `resolveRoute > decimates a very long geometry so one route cannot blow the payload
    budget`: 5000-point response → `r.pointCount <= 700` AND the emitted GeoJSON's own coordinate array
    length equals `pointCount`. `decimate > caps the point count while keeping both endpoints`: 5000→≤700,
    `out[0]` and `out[last]` `toEqual` the original first/last point — both endpoints literally preserved.
    `decimate > leaves a short line untouched`: a 3-point line `toEqual`s itself unchanged
    (SHOULD-NOT-TOUCH half). All three named clauses (decimate long routes, keep both ends, leave short
    ones alone) have their own assertion.

- eval: E13
  run_id: road-routing-E13-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.routing_invariants
  verified_at: 2026-08-07T01:27:30Z
  output: |
    `npx tsx _acceptance/road-routing/scripts/routing-invariants.ts`:
    ok   I1  t3_path untouched vs f74ede1f (12 file đổi)
    ok   I2  base URL lấy từ env.MAPPOSTER_OSRM_URL: true
    ok   I2  không hàm export nào nhận host/url từ caller
    ok   I2  toạ độ vào URL đi qua Number() sau khi validate: true
    ok   I3  1 lời gọi fetch, tất cả mang signal = true
    ok   I3  lỗi timeout nêu được env chỉnh: true
    ok   I4  route.ts KHÔNG import export.ts/mapStyle.ts: true
    routing-invariants: mọi bất biến còn giữ
    All four clauses of E13's `expected` (I1 t3_path unchanged; I2 host only from
    MAPPOSTER_OSRM_URL/no exported function accepts host or url/coords through Number() after validation;
    I3 every fetch carries signal + timeout error names the env var; I4 no import of export.ts/mapStyle.ts)
    have their own `ok` line above. Script itself computed `git merge-base origin/main HEAD` = `f74ede1f`,
    matching the merge-base this report was verified against.

- eval: E14
  run_id: road-routing-E2-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    Same resolveConfig.test.ts run. `routes[].route — đường đi thực tế (PR #5) > lets camera.focus frame
    a routed line like any other route`: `camera.focus: { kind: 'route', index: 0 }` on a routed line
    (mocked geometry centered at lng 105.85) → `cfg.camera.center[0]` is `toBeCloseTo(105.85, 2)` — the
    camera frames the routed line's own geometry, not the rendered location or a default.

- eval: E15
  run_id: road-routing-E15-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T01:28:09Z
  output: |
    `npm test` (`vitest run`, whole repo): Test Files 31 passed | 3 skipped (34); Tests 493 passed | 7
    skipped (500). Whole-suite regression floor: `resolveRoutes` becoming `async` and `resolveConfig`
    awaiting it broke no existing behaviour anywhere in the tree.

- eval: E16
  run_id: road-routing-E16-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T01:28:22Z
  output: |
    `npm run test:mcp` (`MCP_INTEGRATION=1 vitest run --fileParallelism=false
    mcp-server/src/renderFrame.test.ts mcp-server/src/renderClip.test.ts mcp-server/src/stdioChannel.test.ts`):
    real `vite build` (twice, once per fixture) succeeded, Test Files 3 passed (3), Tests 7 passed (7),
    Duration 47.04s — a real headless-Chromium PNG/clip integration run, gated and green, confirming the
    `tools.ts` schema change (new `routes[].route` branch) did not break the MCP build or render path.

## Analyst

Baseline was actually **computed**, not inferred: checked out `git merge-base origin/main HEAD` (`f74ede1`)
into an isolated `git worktree` (`node_modules` symlinked in, no changes made to the branch under test),
ran the relevant commands there, then removed the worktree.

- `mcp-server/src/route.ts` and `mcp-server/src/route.test.ts` do not exist at `f74ede1` (`ls` on both
  paths in the worktree fails) — E1, E6-E12 genuinely **cannot run** on the baseline tree, so their
  baseline is `n-a`, not `red` (a `red` would mean the eval ran there and failed; there is nothing to
  run).
- `npx vitest run mcp-server/src/resolveConfig.test.ts` at `f74ede1` → **59/59 passed**, none named
  `routes[].route — đường đi thực tế (PR #5)` (that describe block does not exist at baseline). E2, E3,
  E4, E5, E14 exercise assertions inside that describe block specifically, so their baseline is also
  `n-a` — the file runs, but the specific test each eval names does not exist to pass or fail.
- `_acceptance/road-routing/scripts/routing-invariants.ts` (E13) does not exist at `f74ede1` either —
  `n-a` for the same reason.
- `npm test` at `f74ede1` → **475/482 passed** (30 passed | 3 skipped test files), vs. 493/500 on this
  branch — the delta is exactly 18 tests (13 in `route.test.ts` + 5 new in `resolveConfig.test.ts`),
  matching E1/E6-E12 (7... actually 8 tests, see below) + E2/E3/E4/E5/E14 exactly. Both trees are green
  end to end, so E15's baseline is `green` (whole-suite regression floor, discriminates nothing by
  design). E16 (`npm run test:mcp`) was not re-run against the baseline tree (would require a second
  real headless-Chromium build cycle at material time cost for a guard that, by construction, is
  `green` on both trees the same way E15 is) — its baseline is recorded `n-a` rather than assumed.

## Variance

none — every eval this round is a deterministic single run (no `runs > 1` marker; nothing in this
contract's own surface crosses `ctx.providers.invoke` or an LLM generator).

## Iterations

Round 1 (verified 2026-08-07T01:28Z, commit `27e1be1`): first verify. All 16 machine evals PASS with a
real assertion behind every clause of their `expected` text, checked individually against the actual
test/script source (see Evidence above), including a direct read of `route.test.ts` and
`resolveConfig.test.ts`'s `vi.mock('./route', ...)` confirming no eval reaches the real public OSRM
instance. `surfaces: [api]`, contract carries zero `judgment` and zero `ui-check` items. Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
