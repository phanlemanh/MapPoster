---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 433e7ea7e2e16af12392419da5edf713f7309cc0
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 3 — verified 2026-07-10T00:20:19Z (UTC) at commit `433e7ea` on `feature/mcp-map-render`._

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
| E12 | AC-12 | judgment | PENDING — panel proposes PASS (T3 requires human_override) |

## Evidence

_This round verifies commit `433e7ea` — the tip of `feature/mcp-map-render`, which sits on top of
`a8ad890` ("S4-r2 — close 4 findings + make VN address geocoding actually work") plus a
behavior-neutral commit that only regenerated `evidence/E12-example.png` at HEAD (no source
changed). `a8ad890` closed 3 of Round 2's 4 findings outright (the transient-429-cached-as-permanent
HIGH; the `render_variants` unvalidated-coords/zoom MEDIUM; the multibyte-UTF-8-chunk-corruption LOW)
and half-closed the fourth — HTTP now binds loopback by default via `MAPPOSTER_HTTP_HOST`, but
Origin/DNS-rebinding validation was not added, correctly re-flagged as still-open in this round's
`review-findings.md`. It also shipped a VN-address geocoding pass (canonicalisation, city-guard,
importance tie-break within a place_rank, a `geocode_place` candidate list, `placeName` override).
Four commands produced this round's machine evidence: `npm test` (vitest, **127 passed / 2 skipped**
— up from 93 passed / 2 skipped in Round 2, the delta being new regression tests for the 3 closed
findings plus the new VN-geocoding suites `vnQuery.test.ts` and `src/lib/geocoding.test.ts` — one
aggregate run covering E1–E9 and E11), `npm run test:e2e` (Playwright, 8 passed — includes the
literal AC-10 spec `e2e/render-mode.spec.ts:15:1`, corroborating E10), `npm run test:mcp` (vitest
with `MCP_INTEGRATION=1`, runs `mcp-server/src/renderFrame.test.ts` only, 2 passed — the real-build +
real-headless-browser AC-1/AC-10 render plus the F1/AC-5 stale-frame regression), and the dedicated
`ui-check:E10` 3-frame screenshot run (E10's primary evidence per `evals.yaml`). Each block below
cites the specific current `it(...)` name(s)/line(s) it maps to (re-verified by grepping the test
files at this commit, since several line numbers shifted again with the new S4-r2 regression tests);
the full runner tail is reproduced per block for traceability. No command failed and none went
unassigned to an eval this round._

- eval: E1
  run_id: minted-mcp-map-render-E1-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:36 "geocodes the location and picks the format
    size (AC-1)"; mcp-server/src/tools.test.ts:58 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG (AC-1,
    AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  07:21:05
       Duration  10.09s (transform 21ms, setup 0ms, import 396ms, tests 9.26s, environment 373ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:53 "region highlight → boundary geojson + fitted
    camera (AC-2)"; mcp-server/src/resolveConfig.test.ts:77 "throws when a requested region has no
    boundary — never silently drops it (F2)"; mcp-server/src/tools.test.ts:95 "region with no
    boundary → structured error, not a silently unhighlighted poster (F2 / AC-2)";
    mcp-server/src/geocode.test.ts:126 "rejects on a transient upstream error and never caches it
    (R2-HIGH)" — new this round, closes the Round-2 HIGH finding (a 429 no longer gets memoized as a
    permanent "no boundary"); mcp-server/src/geocode.test.ts:142 "caches a definitive 'no polygon'
    (ok response, no result)" — the complementary case, confirming only a genuine empty result is
    cached, not an outage.
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:45 "point highlight → marker + street-level zoom
    14–17 (AC-3)"; mcp-server/src/resolveConfig.test.ts:67 "explicit camera zoom overrides
    auto-framing".
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/geocode.test.ts:21 "caches identical queries and misses on different
    ones (AC-4)"; mcp-server/src/geocode.test.ts:96 "serializes concurrent upstream calls and spaces
    them (F3/F6)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/tools.test.ts:105 "renders one image per variant (AC-5)";
    mcp-server/src/tools.test.ts:111 "a variant cannot smuggle out-of-range values past the boundary
    guard (R2-MEDIUM)" — new this round, closes the Round-2 MEDIUM finding (variants now share
    render_map's Zod schema + a runtime guard in resolveConfig); mcp-server/src/renderFrame.test.ts:51
    "a reused pooled page renders each config fresh, never a stale frame (F1 / AC-5)";
    mcp-server/src/browserPool.test.ts:5 "never creates more than `size` resources under concurrent
    acquires (F5)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)
    Corroborating (integration depth, real build + real headless browser, covers the F1 stale-frame
    regression): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  07:21:05
       Duration  10.09s (transform 21ms, setup 0ms, import 396ms, tests 9.26s, environment 373ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/transports.test.ts:9 describe("transports expose the same tool set
    (AC-6)") — "lists all tools over stdio" at :10, "lists all tools over HTTP" at :23;
    mcp-server/src/http.test.ts:6 "decodes multibyte UTF-8 split across chunk boundaries (R2-LOW)"
    and :20 "handles an inline GeoJSON payload spread over many chunks" — new this round, closes the
    Round-2 LOW finding and directly targets the failure scenario it described
    (`highlight.regions[].geojson` inline payloads plus multibyte Vietnamese place names straddling a
    chunk boundary).
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() ref: mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path + base64 +
    dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:18 "resolves tiktok to 1080×1920 and passes
    custom dims through"; mcp-server/src/resolveConfig.test.ts:27 "rejects non-positive, non-integer
    and oversized custom dims (F4)"; mcp-server/src/resolveConfig.test.ts:62 and
    mcp-server/src/tools.test.ts:67 "custom format dims flow through (AC-8)";
    mcp-server/src/tools.test.ts:146 "list_formats includes tiktok 1080×1920 (AC-8)";
    mcp-server/src/tools.test.ts:111 "a variant cannot smuggle out-of-range values past the boundary
    guard (R2-MEDIUM)" — shared with E5, closes the "rejected in both render_map and render_variants"
    half of this eval's expectation.
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:72 "chrome defaults to clean, poster is honored
    (AC-9)"; mcp-server/src/tools.test.ts:73 "chrome defaults clean, poster honored (AC-9)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E10
  run_id: verifier-mcp-map-render-E10-20260710T072600Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-10T00:20:19Z
  screenshot: evidence/E10-step1.png
  observed: |
    E10-step1.png (683,317 bytes, 540x960, opened with Read — real image): full-bleed portrait 9:16
    "midnight-blue" map of Ho Chi Minh City — dark navy basemap, gold/orange roads, blue Saigon River
    winding through, Tan Son Nhat airport outline top-left, attribution strip "© OpenStreetMap
    contributors  OpenMapTiles  OpenFreeMap  MapLibre" at the bottom. No dialog, search box, "quick
    cities" grid or any other onboarding chrome anywhere in frame — confirms "no onboarding modal
    visible". E10-step2.png (683,317 bytes, 540x960, opened with Read): pixel-for-pixel identical to
    step1 (same byte size too) — confirms the page stayed fully intact/un-crashed after `await
    window.__mapposter.ready` + `renderFrame()` ran (renderFrame draws to an offscreen canvas, so the
    live DOM is expected to look unchanged; the fact that it's neither blank nor an error page is the
    positive signal). E10-step3.png (2,245,965 bytes, opened with Read): this file IS the actual
    decoded PNG bytes returned by renderFrame()'s dataUrl (not another browser screenshot) — a
    full-resolution, non-blank midnight-blue HCMC map poster with the license attribution baked into
    the bottom-right corner, i.e. a real usable frame, not a placeholder/corrupt image. Independently
    measured (macOS `sips`, outside my own decoder) at pixelWidth=540/960 for step1+2 and
    pixelWidth=1080/pixelHeight=1920/format=png for step3 — matching Expected exactly. All three
    frames read as the intended slideshow: config-load-no-onboarding → render-call-still-healthy →
    final-PNG-at-exact-dims.

    Independently re-opened E10-step1.png and E10-step3.png with a fresh Read this round (not just
    relying on the supplied text): step1 shows the described navy/gold HCMC vector map filling the
    whole 540×960 frame with the airport outline top-left, the river bending through the
    center-right, and the OSM/OpenMapTiles/OpenFreeMap/MapLibre attribution strip at the bottom —
    zero dialogs/overlays/onboarding chrome anywhere. step3 shows the same map style at full
    resolution with the attribution baked into the bottom-right corner. Nothing in either image
    contradicts the text above.
  output: |
    Dedicated ui-check run (3 required steps + screenshots: evidence/E10-step1.png, E10-step2.png,
    E10-step3.png).

    - `git status --porcelain` after run: only the 3 evidence/E10-step{1,2,3}.png files show as
      modified (freshly regenerated by this independent run) — no source files touched, no code
      changed.

    Result: every assertion above passed. exitCode=0.

    Corroborating automated spec (same verifier command, `npm run test:e2e`):
    e2e/render-mode.spec.ts:15:1 "render mode: headless renderFrame yields exact target dims, no
    onboarding (AC-10)":
      ✓  8 [chromium] › e2e/render-mode.spec.ts:15:1 › render mode: headless renderFrame yields exact
      target dims, no onboarding (AC-10) (1.7s)

      8 passed (19.5s)

    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  07:21:05
       Duration  10.09s (transform 21ms, setup 0ms, import 396ms, tests 9.26s, environment 373ms)

- eval: E11
  run_id: minted-mcp-map-render-E11-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T00:20:19Z
  output: |
    it() refs: mcp-server/src/tools.test.ts:80 "ungeocodable input → structured error, no throw
    (AC-11)"; mcp-server/src/tools.test.ts:86 "invalid custom dims → structured error, never renders
    a blank PNG (F4 / AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  127 passed | 2 skipped (129)
       Start at  07:21:06
       Duration  1.88s (transform 580ms, setup 0ms, import 2.70s, tests 816ms, environment 8.25s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context
    each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur), re-run this round against the regenerated
    `evidence/E12-example.png` (commit `433e7ea` changed its bytes — 1,247,870 → 1,247,540 — but not
    the underlying scene/config). Individual votes:
    - domain-correctness: PASS — Ảnh đúng 1080×1920 (tiktok), nền xanh navy đậm + đường màu vàng đồng
      nhất khớp theme "midnight-blue", không có ô tile trống/vỡ (quét pixel không phát hiện block
      đồng màu bất thường) và vòng xoay hiển thị (khớp Hồ Con Rùa, giao lộ Võ Văn Tần thực tế) cho
      thấy geocode đúng khu vực Quận 3. Marker highlight (pin trắng) đo được nằm gần như chính giữa
      khung hình (đầu ghim ở ~50.1% ngang, ~49.9% dọc) và tương phản rất cao trên nền tối nên dễ đọc
      — đáp ứng đủ 3 tiêu chí của AC-12 để dùng làm B-roll.
    - operational-feasibility: PASS — Pixel measurement confirms the 1080×1920 (tiktok) canvas has
      the pin's anchor tip at (~541, 959) versus true center (540, 960) — centered to within 1px; the
      white teardrop pin with dark dot has strong contrast against the midnight-blue navy background
      and reads clearly at both full-frame and zoomed view. A full-image 128px-block flatness scan
      plus four zoomed crops (marker area, corner, roundabout/park, bottom caption) found zero
      blank/uniform tiles or seam artifacts — roads, buildings, and green-space geometry render as a
      continuous, unbroken vector grid. All three explicit clauses of AC-12 (centered, legible
      highlight, unbroken tiles/roads) are directly demonstrated by this single evidence image, so it
      is usable as B-roll.
    - spec-alignment: PASS — The image is exactly 1080×1920 (tiktok) and the white point-marker's tip
      sits at pixel (~541,959), essentially dead-center of the frame (540,960), matching the
      plausible real-world coordinates shown (10.7759°N/106.6894°E) for Võ Văn Tần, Quận 3 —
      including a roundabout in the correct relative position (Hồ Con Rùa). The marker is
      high-contrast white-on-navy and clearly legible, and roads/buildings render as continuous
      amber/navy shapes with no missing-tile blocks, seams, or broken geometry anywhere in the frame.
      All three AC-12 sub-criteria (centered, legible highlight, unbroken tiles/roads) are clearly
      demonstrated by this single evidence image.
  human_override:
  # ^ REQUIRED before this item — and the overall verdict — can become PASS.
  # risk_tier: T3 (contract.md) mandates a direct human verdict on EVERY
  # judgment eval, regardless of the panel's proposal above. Open
  # evidence/E12-example.png yourself (regenerated at commit 433e7ea — pixel bytes
  # differ from the Round 1/2 asset though the scene/config did not change),
  # compare against AC-12, then replace this blank value with your name, a space,
  # and today's ISO date (optionally + a short note).
  # This item was ALSO pending human_override in Rounds 1 and 2 — unchanged this
  # round; T3 requires the override regardless of how many times the panel
  # re-affirms PASS.

## Analyst

Eval ids green-on-both (HEAD `433e7ea` AND the pre-feature `diffBase` tree), via the shared
`npm test` command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged from Rounds 1–2): all these assertions live in `mcp-server/src/*.test.ts` and
`src/lib/geocoding.test.ts`, and the entire `mcp-server/` package plus the VN-geocoding additions in
`src/lib/geocoding.ts` are net-new code introduced by this feature branch. On the `diffBase` tree
those files/branches most plausibly do not exist yet, so `npm test` has nothing to collect (or
nothing new to exercise) there — a vacuous pass, not a genuine behavior-equivalence pass. This round
added a substantial slice of new coverage (`vnQuery.test.ts`, `http.test.ts`, new `geocoding.test.ts`
ranking tests, plus the R2-HIGH/R2-MEDIUM/R2-LOW regression tests) that inherits the identical
vacuous-pass-on-`diffBase` status for the same reason — not a new gap, a continuation of the
Round-1/2 finding. Gate 2 human should confirm the `diffBase` used for this A/B run actually predates
`mcp-server/` and the VN-geocoding changes to `src/lib/geocoding.ts` (expected) rather than a
mis-resolved base that happens to already contain this code.

## Variance

none — every eval this round is deterministic, single run (1/1); no flaky/racy variance observed
across the captured commands (`npm test`, `npm run test:e2e`, `npm run test:mcp`, `ui-check:E10` each
exited 0 on their one recorded run).

## Iterations

- Round 1 (verified 2026-07-09T22:14:17Z, commit `ea639e9`): All 11 machine-verified evals passed on
  the first attempt — 0 failures. E12 (AC-12, judgment) panel unanimously proposed PASS; overall
  verdict held at PENDING-JUDGMENT because T3 mandates a direct `human_override` regardless of the
  panel's verdict. A full adversarial review surfaced 7 findings — 2 HIGH (stale-frame reuse on
  pooled pages; silently-dropped null region boundary), 4 MEDIUM (unserialized Nominatim rate
  limiter; unvalidated format/coordinate inputs at the MCP boundary; browser pool cap not enforced),
  1 LOW (unbounded idle wait). Returned to implementation before Gate 2.
- Round 2 (verified 2026-07-09T23:11:12Z, commit `5ecac4e`): Implementation closed all 7 Round-1
  findings in one commit, plus 5 new regression tests targeting exactly those gaps. All 11 machine
  evals still passed (93 passed | 2 skipped, up from 85 | 1). E12's panel re-affirmed PASS (3/3
  lenses); overall verdict remained PENDING-JUDGMENT — `human_override` still not supplied. A fresh
  adversarial pass surfaced 4 NEW findings — 1 HIGH (transient Nominatim boundary-fetch failures
  swallowed to null and cached permanently, breaking a region forever after any 429/503), 1 MEDIUM
  (`render_variants` bypassed the coordinate/zoom validation `render_map` itself enforced), 2 LOW
  (HTTP bound every interface with no Origin/DNS-rebinding check; request body concatenation could
  corrupt multibyte UTF-8 spanning a chunk boundary). None were machine-eval regressions.
- Round 3 (verified 2026-07-10T00:20:19Z, commit `433e7ea`): Commit `a8ad890` closed 3 of Round 2's 4
  findings outright (transient-429 HIGH, `render_variants` validation MEDIUM, UTF-8 chunk-corruption
  LOW) and half-closed the fourth (HTTP now defaults to loopback via `MAPPOSTER_HTTP_HOST`, but
  Origin/DNS-rebinding validation was not added), plus shipped a VN-address geocoding quality pass
  (canonicalisation, city-guard, importance tie-break within a place_rank, `geocode_place`
  candidates, `placeName` override — 8/10 real VN addresses now resolve correctly per the live probe
  script). All 11 machine evals still pass, now 127 passed | 2 skipped (up from 93 | 2), including
  regression coverage for every Round-2 finding; E10's ui-check re-confirms exact 1080×1920 output
  and no onboarding; a follow-up commit (`433e7ea`) only regenerated `evidence/E12-example.png` at
  HEAD with no source change. E12's panel re-affirms PASS (3/3 lenses) against that regenerated
  image; overall verdict remains PENDING-JUDGMENT because T3 still mandates a human `human_override`
  on E12, not yet supplied across all three rounds. A fresh adversarial pass this round (commit
  `433e7ea`) surfaced 3 findings tracked in `review-findings.md` — 1 HIGH (`searchPlaces`'s sort
  comparator is non-transitive: it returns 0 for any cross-`place_rank` pair, so V8's sort can leave
  a lower-importance same-rank hit ahead of the correct one whenever a different-rank candidate
  interleaves them — reproduced deterministically; `resolveLocation` takes `results[0]` and renders
  it with no human in the loop, so `render_map` can silently pick the wrong place for exactly the
  class of VN address the Round-2 ranking fix was meant to handle), 1 MEDIUM (the region-highlight
  path in `resolveConfig` calls `resolveBoundary` with the raw, un-normalised string — none of the VN
  canonicalisation/city-guard/candidate-ladder that `resolveLocation` now runs for points is applied
  to regions, so a VN region name can 404 or resolve to the wrong same-named place globally even
  though the equivalent point resolves correctly), 1 LOW carryover (HTTP transport still has no
  Origin/Host DNS-rebinding validation — the bind-to-loopback half of Round 2's LOW finding was
  fixed, but this sub-issue was already flagged as Round 2 finding #3 and remains open at HEAD).
  None of these three are machine-eval regressions (all 11 machine evals still pass); they are
  informational for Gate 2 / follow-up, not blockers of this round's machine verdict — though the
  HIGH is squarely inside this feature's primary use case (VN place-name geocoding) and Gate 2 should
  weigh it seriously even though it does not block the machine verdict.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify judgment item **E12** (AC-12) — panel proposed PASS against the commit-`433e7ea`
      regenerated `evidence/E12-example.png`; open it yourself and confirm centering/highlight
      legibility/tile integrity, then fill its `human_override` line with your name and today's date
- [ ] T3 (this contract's `risk_tier: T3`): personally verify **every** judgment item and fill
      `human_override` on each (judge verdicts are advisory only; the hook blocks PASS without them)
      — E12 is currently the only judgment item, and has now carried an unfilled override across all
      3 rounds
- [ ] Skim `review-findings.md` Round 3 (3 findings this round: 1 HIGH — non-transitive sort in
      `searchPlaces` can silently geocode a VN address to the wrong same-named place with no human
      in the loop; 1 MEDIUM — region-highlight geocoding bypasses the VN normalization/city-guard the
      point path now enforces; 1 LOW carryover — HTTP DNS-rebinding/Origin validation still open) —
      informational, does not block Gate 2 by itself, but the HIGH sits directly in this feature's
      core VN-address use case and is worth a follow-up ticket regardless of Gate 2 outcome
- [ ] If satisfied: upgrade `verdict: PENDING-JUDGMENT` to `verdict: PASS` in the frontmatter (this
      write is when the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract.md
