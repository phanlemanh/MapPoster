---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 31ad91b373380a81db80f1abc7e63043a1930433
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 19 — re-pin. Commit `b4150be` (after Round 18) changes `src/lib/export.test.ts` only — not a
file any of this contract's own evals target directly, but it IS part of the aggregate `npm test` that
E1-E9/E11 (`config:executors.test.api`) run, and `npm run test:e2e` (E10) is this contract's own
whole-suite guard, so both were re-run fresh rather than merely re-pinned. Neither
`mcp-server/src/resolveConfig.ts` nor `mcp-server/src/tools.ts` changed further this round (only the
test file in a sibling contract's domain did), so no new diff review was needed beyond confirming that.
The coordinator's own commit `31ad91b` separately merged a blind judge's PASS verdict into E12 (kept
exactly as merged below, not touched by this verifier); `human_override` remains empty, so — per
`risk_tier: T3`, which mandates a direct human verdict on every judgment item regardless of the judge's
score — this contract stays PENDING-JUDGMENT._

_Round 18 — re-verification. Round 17's evidence (verified_commit `9b573fc`, signed off `manh`
2026-08-06) went STALE again: `feat/routes-measurements` landed downstream commits touching this
contract's own `mcp-server/src/resolveConfig.ts` (+179/-lines) and `mcp-server/src/tools.ts`
(+46/-lines) after that commit. Contract `status` downgraded `signed-off` → `implemented` per the
staleness guard. `human_signoff` cleared — Round 17's signature (and Round 8's `human_override` on
E12) does not carry to this round; per this round's own instructions the judgment item is left
UNFILLED for a fresh blind judge panel, regardless of what any prior round decided._

_Diff review (`git diff 9b573fc..HEAD -- mcp-server/src/resolveConfig.ts mcp-server/src/tools.ts`)
confirms the routes-measurements change is additive to this contract's own logic: one helper renamed
with equivalent semantics for the region case (`bboxOfRegions`→`bboxOfGeojsons`), `resolvedOf` gained
two conditionally-spread keys (`routes`/`measures`) that only appear when a call actually uses them —
the pre-existing `center`/`zoom`/`place`/`theme`/`highlights` shape AC-1..AC-9/AC-11 depend on is
untouched. `git diff ... | grep '^-'` on both test files shows a SINGLE removed line in each (the
import statement, extended to add new imports) — zero existing test assertions were deleted or
altered. E10's own ui-check evidence was also stale (Round 15's PNGs, carried forward unrefreshed
across Rounds 16-17) — this round captured it fresh (see Evidence below), the first fresh E10 capture
since Round 15._

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
| E12 | AC-12 | judgment | PASS (judge) — awaiting mandatory T3 `human_override` |

## Evidence

- eval: E1
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    ROUND 19 re-pin re-run: `npm test` aggregate: Test Files 30 passed | 3 skipped (33); Tests 457
    passed | 7 skipped (464); Duration 2.89s. Up from 453 in Round 18 — the +4 delta is `src/lib/
    export.test.ts`'s new attribution-content-pin test (commit `b4150be`, +1) plus tier0-agent-params'
    own three boundary-half additions merged in between rounds (+3, commit `06e4ae1`) — none of it in
    this contract's own render_map/highlight/geocode/pool/transport coverage, which is unchanged. This
    contract's own `render_map('Ho Chi Minh City', format=tiktok)` 1080×1920 centering assertions are
    present and green in this run.

- eval: E2
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    Named-region highlight resolve path — `bboxOfGeojsons(regions.map(r => r.geojson))` replaces the
    old `bboxOfRegions(regions)` call at the exact same call site (resolveConfig.ts, region auto-frame
    branch) with identical semantics for the region-only case (confirmed by reading the diff: the
    `regions.length` branch still maps regions to their own geojsons before framing). AC-2's boundary
    polygon / region-anchoring / GeoJSON shape-check assertions are present and green.

- eval: E3
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    Named-point highlight / auto-zoom path untouched by this round's diff (only the region/route bbox
    helper and `resolvedOf`'s conditional spread changed). AC-3 assertions present and green.

- eval: E4
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    Geocode cache / env-validation path — `geocode.ts` does not appear in this round's changed-file
    list (`git diff 9b573fc..HEAD --stat` confirms). AC-4 assertions present and green, unaffected.

- eval: E5
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    Render-variants / browser-pool path — `browserPool.ts`/`deps.ts` untouched this round. AC-5
    assertions present and green.

- eval: E6
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    Tool-set parity + HTTP transport guards — `tools.ts` changed (+46 lines: `routeSchema`/
    `measureSchema` additions to `renderMapShape`), additively, not touching the `listTools` surface or
    Host/Origin/body-cap guards AC-6 checks. Assertions present and green.
    Corroborating (real build + real headless browser + real transport, re-run fresh this round):
    `npm run test:e2e`: 14 passed (51.0s). `npm run test:mcp`: 7 passed (Test Files 3 passed).

- eval: E7
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    Default-delivery base64+path / sink-dir path — `renderFrame.test.ts` unaffected by this round's
    diff. AC-7 assertions present and green.

- eval: E8
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    `list_formats` preset / custom-dims path unaffected. AC-8 assertions present and green.

- eval: E9
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    chrome:clean/poster + theme/colour validation path unaffected by this round's diff. AC-9
    assertions present and green.

- eval: E10
  run_id: mcp-map-render-E10-20260806r19
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-06T16:34:29Z
  screenshot: evidence/E10-step1.png
  observed: |
    ROUND 19 re-pin: `npm run test:e2e` re-run fresh (14 passed, 51.0s) — `e2e/render-mode.spec.ts:93`
    (AC-10) still green, unaffected by `b4150be` (that commit touches `src/lib/export.test.ts`, not
    `render-mode.spec.ts` or any file under `src/render/**`). The frames themselves are unchanged from
    Round 18's capture (nothing in this round's diff touches the render page or renderFrame path), so
    the same screenshots are cited rather than re-captured — a like-for-like re-pin, not a re-audit.
    E10-step1.png (immediately after navigating `/render.html?config=<tiktokConfig>`, before ready):
    a solid dark-navy 1080x1920 frame, the small "© OpenStreetMap contributors · OpenMapTiles ·
    OpenFreeMap · MapLibre" attribution line visible bottom-right, NO onboarding modal/overlay anywhere
    on the frame. E10-step3.png (the actual `renderFrame()` PNG output, decoded from the returned data
    URL, independently confirmed via `file` as "PNG image data, 1080 x 1920, 8-bit/color RGBA"): a
    genuine midnight-blue Ho Chi Minh City map — Tân Sơn Nhất airport runways visible upper-left, the
    Saigon river winding through the frame in dark blue, road network in amber/gold at full route
    density, no city-title text overlay (consistent with `chrome:'clean'`), no onboarding UI, no
    rendering breakage/tile gaps.
    Ad hoc capture note: the interactive sandboxed browser pane used for the rest of this session's UI
    checks could not reach `tiles.openfreemap.org` (requests never completed; `page.waitForFunction`
    for map idle timed out with zero network entries recorded) — a sandbox network-egress limitation,
    not a product defect (the exact same page loads and idles normally under Playwright's own Chromium,
    confirmed by `npm run test:e2e` test #11 "render mode: headless renderFrame yields exact target
    dims, no onboarding (AC-10)" passing in 1.9s with real tile traffic). To get REAL frames instead of
    carrying forward Round 15's stale PNGs a third round running, this round drove Playwright's own
    chromium directly from a one-off Node script (`_acceptance/mcp-map-render/scripts/e10-ui-check.ts`,
    not a standing executor) against the same `npm run dev` server the automated suite uses — same
    network path as `test:e2e`, just with screenshots saved. Script output:
    `step1: onboardCount= 0 posterVisible= true` / `renderFrame result: { w: 1080, h: 1920, isPng: true,
    len: 3831702 }`.
    Corroborating automated assertion (same invariant, machine-checked, real network,
    `npm run test:e2e`):
      ✓ e2e/render-mode.spec.ts:93:1 › render mode: headless renderFrame yields exact target dims,
        no onboarding (AC-10) (1.9s)
    14 passed (46.8s) overall.

- eval: E11
  run_id: mcp-map-render-E1-20260806r19
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    Ungeocodable-location / invalid-dims structured-error path unaffected by this round's diff. AC-11
    assertions present and green.

- eval: E12
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Ảnh 1080×1920 đúng khung tiktok, nền navy với đường phố vàng cam đặc trưng midnight-blue; lưới đường và khối nhà liền mạch, không ô tile trống/vỡ hay răng cưa. Ghim trắng nằm gần chính giữa khung (≈540/1080 ngang, 910/1920 dọc — lệch nhẹ ~50px) và tương phản rõ trên nền tối. Đủ cả ba yêu cầu của AC-12: căn giữa, highlight rõ, tile/đường không vỡ.
  human_override:

## Analyst

Baseline values (`green` for E1-E9, E11) are carried forward unchanged from Round 17 per the re-
verification (not new-feature) instruction — this round did not recompute the pre-feature diffBase for
mcp-map-render's own criteria, since Round 17 already established them and this round's diff is a
sibling contract's (routes-measurements) work landing on shared files, additively, per the diff review
above.

`npm run test:e2e` and `npm run test:mcp` carry no eval id of their own this round (`evals: []` in the
machine-results mapping) — they appear only as corroborating text inside E6 and E10's blocks, not as
separate table rows, consistent with Round 17's convention.

## Variance

none — every command this round is a deterministic single run (1/1); no `runs > 1` marker, no observed
flakiness.

## Iterations

- Round 16 (signed off `manh`, 2026-08-06, commit `f7b1d6c`): last human-signed PASS before this
  contract went stale twice in a row.
- Round 17 (verified 2026-08-06, commit `9b573fc`): re-verify triggered by `feat/tier0-agent-params`.
  All 11 machine evals passed (424/431); E10 carried forward Round 15's PNGs unrefreshed a second
  round running; E12 left unscored per the "implementation never judges itself" rule. PENDING-JUDGMENT.
- Round 18 (verified 2026-08-06T16:06Z, commit `25c2d2a`): re-verify triggered by `feat/routes-
  measurements` touching this contract's own `resolveConfig.ts`/`tools.ts` (additively, confirmed via
  diff + zero deleted test lines). All 11 machine evals re-confirmed PASS with a specific assertion
  behind each `expected` clause (not just exit code). E10 finally re-captured fresh (real screenshots +
  a real `renderFrame()` PNG, decoded and independently confirmed 1080×1920, plus the automated
  Playwright AC-10 spec passing) — first fresh E10 evidence since Round 15. E12 left UNFILLED for the
  orchestrator's blind judge panel, per this round's instructions. Verdict PENDING-JUDGMENT.
- Round 19 (verified 2026-08-06T16:36Z, commit `31ad91b`): re-pin triggered by commit `b4150be`
  (`src/lib/export.test.ts`, a sibling contract's file) landing after Round 18's `verified_commit`.
  E1-E9/E11 (`npm test`) and E10 (`npm run test:e2e`) were re-run fresh rather than merely re-pinned,
  since both commands include the changed file in their aggregate scope: 457/464 and 14/14 passed
  respectively, both up only by the sibling contracts' additive test counts, nothing in this
  contract's own coverage shrank. E10's frames were not re-captured (nothing in this round's diff
  touches the render page), so Round 18's screenshots are cited as still-valid evidence. Separately,
  the coordinator's own commit `31ad91b` merged a blind judge's PASS verdict into E12 (kept exactly as
  merged, not touched here). `human_override` remains empty, so per `risk_tier: T3` the contract stays
  **PENDING-JUDGMENT** — one step closer to Gate 2 (a human now only needs to review and countersign).

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
