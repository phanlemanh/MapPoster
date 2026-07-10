---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 4abeb9bc160c8bf511f5bec00c9673254ce48a93
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 4 — verified 2026-07-10T08:50:00Z (UTC) at commit `4abeb9b` on `feature/mcp-map-render`._

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

_This round verifies commit `4abeb9b` — the tip of `feature/mcp-map-render`, produced after Round 3
hit the feature-loop's 3-round review cap with 3 open findings (1 HIGH non-transitive sort in
`searchPlaces`; 1 MEDIUM region-highlight geocoding bypassing the VN normalization/city-guard the
point path enforces; 1 LOW HTTP transport missing Origin/Host DNS-rebinding validation) and escalated
to the human instead of silently auto-fixing into a 4th round (`decisions.jsonl`
`d-20260710T075500Z-40001`). The human (manh) explicitly authorised exceeding the cap with a SCOPED
round 4 targeting exactly those 3 findings (`d-20260710T080000Z-41001`). Implementation closed all
three — the HIGH via a real total-order comparator (`rankThenImportance`: bucket by `place_rank`, sort
each bucket by importance, concatenate — every comparison now happens inside one bucket, so the
ordering is total; regression test sweeps all 6 permutations of the reviewer's 3-element repro), the
MEDIUM by routing region strings through the same canonicalise → city-guard pipeline as points and
preferring an exact `osm_type=relation` lookup (which also caught a same-class swallowed-429-on-lookup
bug on a branch no test had reached), and the LOW via a fail-closed Origin/Host allowlist
(`isAllowedRequest()`) in front of the HTTP transport. While closing the MEDIUM, this round's OWN live
probe against Nominatim (`mcp-server/scripts/check-vn-addresses.ts`) surfaced a NEW HIGH that no
reviewer had raised: a bare region name like `"District 1"` resolves to a real polygon in **Liberia**,
and because region auto-framing follows the region's bbox, `render_map` would silently render Liberia
while `resolved.place` still said Ho Chi Minh City. That was fixed with a country-anchor invariant
(`expectCountry`) threaded through both `resolveLocation` and `resolveBoundary`, verified against the
live Nominatim API. Four commands produced this round's machine evidence: `npm test` (vitest, **144
passed / 2 skipped** — up from 127 passed / 2 skipped in Round 3, the delta being the comparator
permutation-sweep test, the new region/country-anchor test suites in `geocode.test.ts` and
`resolveConfig.test.ts`, and the new `http.test.ts` Origin/Host guard suite — one aggregate run
covering E1–E9 and E11), `npm run test:e2e` (Playwright, 8 passed — includes the literal AC-10 spec
`e2e/render-mode.spec.ts:15:1`, corroborating E10), `npm run test:mcp` (vitest with
`MCP_INTEGRATION=1`, runs `mcp-server/src/renderFrame.test.ts` only, 2 passed — the real-build +
real-headless-browser AC-1/AC-10 render plus the F1/AC-5 stale-frame regression), and the dedicated
`ui-check:E10` 3-frame screenshot run (E10's primary evidence per `evals.yaml`). Each block below
cites the specific current `it(...)` name(s)/line(s) it maps to (re-verified by grepping/reading the
test files at this commit, since several line numbers shifted again with the new regression tests);
the full runner tail is reproduced per block for traceability. No command failed and none went
unassigned to an eval this round. A fresh adversarial-verify pass against this round's OWN changes
surfaced 3 new findings — none are machine-eval regressions (all 11 machine evals still pass); full
detail in `review-findings.md`, summarized in `## Iterations` below._

- eval: E1
  run_id: minted-mcp-map-render-E1-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:58 "geocodes the location and picks the format
    size (AC-1)"; mcp-server/src/tools.test.ts:58 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG (AC-1,
    AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  08:40:00
       Duration  8.91s (transform 21ms, setup 0ms, import 389ms, tests 8.24s, environment 226ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:75 "region highlight → boundary geojson + fitted
    camera (AC-2)"; mcp-server/src/tools.test.ts:95 "region with no boundary → structured error, not
    a silently unhighlighted poster (F2 / AC-2)"; mcp-server/src/geocode.test.ts:144 "routes a region
    through the same canonicalisation + city guard as a point, then looks up the exact entity" — new
    this round, closes the Round-3 MEDIUM (region-highlight geocoding was bypassing the VN
    normalization/city-guard the point path already enforced); mcp-server/src/geocode.test.ts:158
    "rejects a region hit that lands outside the city the query named" — new this round, the
    cityGuard-for-regions counterpart; mcp-server/src/geocode.test.ts:192 "rejects a transient failure
    at the polygon lookup and never caches it (R2-HIGH)" — regression, now also covering the
    swallowed-429-on-lookup variant found while building the MEDIUM fix; mcp-server/src/geocode.test.ts:220
    "refuses a region in the wrong country, even with a real polygon" — new this round, closes the
    round's OWN live-probe-discovered HIGH (bare "District 1" resolving to a real polygon in Liberia);
    mcp-server/src/geocode.test.ts:242 "allows a region whose country matches the anchor, and one with
    no country at all" and :259 "keys the cache on the anchor country, so one lookup cannot poison
    another" — new this round, guard against over-blocking + cache-poisoning regressions;
    mcp-server/src/geocode.test.ts:268 "caches a definitive 'no such region' (ok response, no
    result)"; mcp-server/src/resolveConfig.test.ts:36 "anchors every highlight to the country of the
    location being rendered" and :51 "names the anchor country when a region cannot be found in it" —
    new this round, assert resolveConfig actually threads the anchor end-to-end.
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:67 "point highlight → marker + street-level zoom
    14–17 (AC-3)"; mcp-server/src/resolveConfig.test.ts:89 "explicit camera zoom overrides
    auto-framing".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/geocode.test.ts:21 "caches identical queries and misses on different
    ones (AC-4)"; mcp-server/src/geocode.test.ts:96 "serializes concurrent upstream calls and spaces
    them (F3/F6)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/tools.test.ts:105 "renders one image per variant (AC-5)";
    mcp-server/src/tools.test.ts:111 "a variant cannot smuggle out-of-range values past the boundary
    guard (R2-MEDIUM)"; mcp-server/src/renderFrame.test.ts:51 "a reused pooled page renders each
    config fresh, never a stale frame (F1 / AC-5)"; mcp-server/src/browserPool.test.ts:5 "never
    creates more than `size` resources under concurrent acquires (F5)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)
    Corroborating (integration depth, real build + real headless browser, covers the F1 stale-frame
    regression): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  08:40:00
       Duration  8.91s (transform 21ms, setup 0ms, import 389ms, tests 8.24s, environment 226ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/transports.test.ts:9 describe("transports expose the same tool set
    (AC-6)") — "lists all tools over stdio" at :10, "lists all tools over HTTP" at :23;
    mcp-server/src/http.test.ts:77 "decodes multibyte UTF-8 split across chunk boundaries (R2-LOW)"
    and :91 "handles an inline GeoJSON payload spread over many chunks".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() ref: mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path + base64 +
    dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:18 "resolves tiktok to 1080×1920 and passes
    custom dims through"; mcp-server/src/resolveConfig.test.ts:27 "rejects non-positive, non-integer
    and oversized custom dims (F4)"; mcp-server/src/resolveConfig.test.ts:84 and
    mcp-server/src/tools.test.ts:67 "custom format dims flow through (AC-8)";
    mcp-server/src/tools.test.ts:146 "list_formats includes tiktok 1080×1920 (AC-8)";
    mcp-server/src/tools.test.ts:111 "a variant cannot smuggle out-of-range values past the boundary
    guard (R2-MEDIUM)" — shared with E5, closes the "rejected in both render_map and render_variants"
    half of this eval's expectation.
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:94 "chrome defaults to clean, poster is honored
    (AC-9)"; mcp-server/src/tools.test.ts:73 "chrome defaults clean, poster honored (AC-9)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E10
  run_id: verifier-mcp-map-render-E10-20260710T084400Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-10T08:50:00Z
  screenshot: evidence/E10-step1.png
  observed: |
    Opened all 3 saved frames with Read (real image bytes, not recalled from the steps text):

    E10-step1.png (540x960, solid frame, no crop): entirely dark navy background with a thin
    two-line-tall attribution strip pinned to the very bottom reading "© OpenStreetMap contributors ·
    OpenMapTiles · OpenFreeMap · MapLibre". Zero dialogs, zero search boxes, zero "quick cities" grids,
    zero buttons or overlays of any kind anywhere in the 540x960 frame — this is what "no onboarding
    modal visible" looks like. The map's vector tiles themselves had not yet painted at the instant of
    this screenshot (taken immediately after navigation, before `ready`/`renderFrame()` ran) — that is
    expected for the "config-load" stage of the slideshow, not a defect, since the onboarding-modal
    assertion is about absence of onboarding chrome, not about tile-paint completeness at this point.

    E10-step2.png (540x960, taken after `await ready` + `renderFrame()` executed): now shows a fully
    painted vector map in a teal/cyan-on-navy "ocean" theme — a recognizable elongated airport runway
    shape center-left (Da Nang International Airport), a river/waterway running vertically through the
    middle of the frame, open water/coastline filling the right edge and upper-left, and a dense
    street grid with several arterial roads rendered as brighter cyan lines. Same attribution strip at
    the bottom. Still zero onboarding chrome. The page is visibly alive and correctly rendered (not
    blank, not an error page, not crashed) after the ready+renderFrame calls — matches the "render"
    stage.

    E10-step3.png (1080x1920 — verified by `file`/`sips`, independent of my own code — this is the
    literal decoded bytes of renderFrame()'s returned dataUrl, not a browser screenshot): the same Da
    Nang scene at full target resolution — airport runway on the left, the river bending through the
    center, coastline and inlets on the right/upper area, dense street grid throughout, plus a small
    pond/water feature near the middle. The OSM/OpenMapTiles/OpenFreeMap/MapLibre attribution text is
    baked into the bottom-right corner of the image itself (the composited-poster code path lays it
    out differently than the live-DOM footer bar seen in steps 1-2 — expected, since this is a
    different rendering path: canvas composition vs. live page layout). The image is a real,
    non-blank, non-corrupt, full-resolution map — matches the "dims" stage.

    All three frames read as the intended slideshow: config-load (blank canvas, confirmed no
    onboarding) → render (live page shows the fully painted map, confirmed healthy after the API
    calls) → dims (the actual output PNG, confirmed exactly 1080x1920 by 4 independent measurements).
    Nothing in any frame contradicts Expected; no onboarding modal ever appears, `ready` resolved
    without throwing, and the returned PNG is exactly 1080x1920.

    Independently re-opened E10-step1.png and E10-step3.png with a fresh Read this round (not just
    relying on the supplied text): step1 is the same solid dark-navy frame with only the attribution
    strip at the bottom and zero onboarding chrome of any kind; step3 is the same full-resolution
    non-blank map at exactly the file's own reported 1080×1920 dimensions with attribution baked into
    the bottom-right corner. Nothing in either image contradicts the text above.
  output: |
    Dedicated ui-check run (3 required steps + screenshots: evidence/E10-step1.png, E10-step2.png,
    E10-step3.png).

    Cleanup: temporary verifier scripts (_verify_e10.cjs, _verify_e10_localstorage.cjs) deleted after
    the run. Dev server (self-started, pid 37760) killed; `lsof -iTCP:5173` confirms no listener
    remains. `git status --porcelain` after the run shows ONLY the 3 evidence PNGs as modified — no
    source/code changed, no commits created (HEAD still 4abeb9b before and after).

    Result: every assertion above passed. exitCode=0.

    Corroborating automated spec (same verifier command, `npm run test:e2e`):
    e2e/render-mode.spec.ts:15:1 "render mode: headless renderFrame yields exact target dims, no
    onboarding (AC-10)":
      ✓  8 [chromium] › e2e/render-mode.spec.ts:15:1 › render mode: headless renderFrame yields exact
      target dims, no onboarding (AC-10) (1.6s)

      8 passed (19.7s)

    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  08:40:00
       Duration  8.91s (transform 21ms, setup 0ms, import 389ms, tests 8.24s, environment 226ms)

- eval: E11
  run_id: minted-mcp-map-render-E11-r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T08:50:00Z
  output: |
    it() refs: mcp-server/src/tools.test.ts:80 "ungeocodable input → structured error, no throw
    (AC-11)"; mcp-server/src/tools.test.ts:86 "invalid custom dims → structured error, never renders
    a blank PNG (F4 / AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  144 passed | 2 skipped (146)
       Start at  08:39:58
       Duration  1.64s (transform 546ms, setup 0ms, import 2.68s, tests 739ms, environment 6.61s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context
    each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur), re-run this round against the unchanged
    `evidence/E12-example.png` (this round's fixes touched region/coordinate geocoding and HTTP
    transport, not the example's own point-highlight config, so the asset was not regenerated).
    Individual votes:
    - domain-correctness: PASS — Verified the PNG is exactly 1080×1920 (tiktok format), rendered in a
      dark-navy/gold palette consistent with "midnight-blue". The white pin marker is high-contrast
      and legible, sitting within ~1% of dead-center on both axes, and the surrounding street/building
      grid — including a recognizable roundabout consistent with the Võ Văn Tần/Quận 3 area — renders
      as a continuous, artifact-free network with no blank tiles, seams, or pixelation. All three
      AC-12 sub-criteria (centered location, legible highlight, clean tiles/roads) are clearly
      demonstrated, so the image is usable as video B-roll.
    - operational-feasibility: PASS — Pixel measurement confirms the frame is exactly 1080×1920
      (tiktok target) and the pin's tip sits at (539.5, 959) — under 1px from true center (540, 960),
      so the point highlight is correctly centered. The white teardrop marker renders with sharp edges
      and high contrast against the midnight-blue basemap (clearly legible), and a full-frame scan
      found zero blank/flat cells, zero transparency gaps, and thousands of distinct colors consistent
      with an intact, dense street grid, building footprints, and a roundabout feature — no missing
      tiles or rendering breakage. Nothing in the evidence points to an operational blocker for B-roll
      use.
    - spec-alignment: PASS — Ảnh 1080×1920 (đúng khổ tiktok): ghim điểm (pin trắng, chấm tâm tối) đặt
      gần như tuyệt đối tại tâm khung hình (~541,958 so với tâm hình học 540,960), tương phản cao trên
      nền midnight-blue nên rất dễ đọc, kể cả khi zoom cận cảnh. Lưới đường (vàng cam) và khối nhà
      hiển thị liền mạch, quan sát tại 4 góc, dải dưới và vùng quanh ghim đều không thấy seam/tile
      trống (kênh alpha đặc 100% toàn ảnh), bo-xoay (roundabout) và chữ attribution vẫn render đúng
      nét. Với cả 3 tiêu chí AC-12 (centered, legible, không vỡ tile/road) đều được minh chứng rõ ràng
      trong evidence, ảnh đạt yêu cầu dùng làm video B-roll.
  human_override:
  # ^ REQUIRED before this item — and the overall verdict — can become PASS.
  # risk_tier: T3 (contract.md) mandates a direct human verdict on EVERY
  # judgment eval, regardless of the panel's proposal above. Open
  # evidence/E12-example.png yourself (unchanged since Round 2 — this round's fixes
  # did not touch the example's point-highlight scene), compare against AC-12,
  # then replace this blank value with your name, a space, and today's ISO date
  # (optionally + a short note).
  # This item was ALSO pending human_override in Rounds 1, 2 and 3 — unchanged this
  # round; T3 requires the override regardless of how many times the panel
  # re-affirms PASS.

## Analyst

Eval ids green-on-both (HEAD `4abeb9b` AND the pre-feature `diffBase` tree), via the shared `npm test`
command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged from Rounds 1–3): all these assertions live in `mcp-server/src/*.test.ts` and
`src/lib/geocoding.test.ts`, and the entire `mcp-server/` package plus the VN-geocoding additions in
`src/lib/geocoding.ts` are net-new code introduced by this feature branch. On the `diffBase` tree those
files/branches most plausibly do not exist yet, so `npm test` has nothing to collect (or nothing new to
exercise) there — a vacuous pass, not a genuine behavior-equivalence pass. This round added another
slice of new coverage (the comparator permutation sweep in `src/lib/geocoding.test.ts`, the region
canonicalisation/country-anchor suites in `mcp-server/src/geocode.test.ts` and
`mcp-server/src/resolveConfig.test.ts`, and the Origin/Host guard suite in `mcp-server/src/http.test.ts`)
that inherits the identical vacuous-pass-on-`diffBase` status for the same reason — not a new gap, a
continuation of the Round-1/2/3 finding. Gate 2 human should confirm the `diffBase` used for this A/B
run actually predates `mcp-server/` and the VN-geocoding changes to `src/lib/geocoding.ts` (expected)
rather than a mis-resolved base that happens to already contain this code.

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
- Round 4 (verified 2026-07-10T08:50:00Z, commit `4abeb9b`): Round 3 hit the feature-loop's 3-round
  review cap with 3 open findings and escalated to the human instead of auto-fixing into a 4th round
  (`decisions.jsonl` `d-20260710T075500Z-40001`). The human (manh) explicitly authorised exceeding the
  cap with a SCOPED round 4 to close exactly those 3 findings (`d-20260710T080000Z-41001`).
  Implementation closed all three: the HIGH via a real total-order comparator (`rankThenImportance` —
  bucket by `place_rank`, sort each bucket by importance, concatenate; a permutation-sweep regression
  test covers all 6 orderings of the reviewer's 3-element repro); the MEDIUM by routing region strings
  through the same canonicalise → city-guard pipeline as points, preferring an exact
  `osm_type=relation` lookup (which also caught a same-class swallowed-429-on-lookup bug on a branch
  no test had reached); the LOW via a fail-closed Origin/Host allowlist (`isAllowedRequest()`) in
  front of the HTTP transport. While closing the MEDIUM, this round's OWN live probe against Nominatim
  surfaced a NEW HIGH no reviewer had raised — a bare `"District 1"` resolves to a real polygon in
  **Liberia**, and since region auto-framing follows the region bbox, `render_map` would silently
  render Liberia while `resolved.place` still said Ho Chi Minh City — fixed with a country-anchor
  invariant (`expectCountry`) threaded through both `resolveLocation` and `resolveBoundary`, verified
  live. All 11 machine evals still pass, now **144 passed | 2 skipped** (up from 127 | 2 in Round 3),
  including regression coverage for the fixed HIGH/MEDIUM/LOW plus the self-discovered HIGH; E10's
  ui-check re-confirms exact 1080×1920 output and no onboarding. E12's panel re-affirms PASS (3/3
  lenses) against the unchanged `evidence/E12-example.png`; overall verdict remains PENDING-JUDGMENT
  because T3 still mandates a human `human_override` on E12, not yet supplied across all four rounds.
  A fresh adversarial pass this round (commit `4abeb9b`) surfaced 3 NEW findings tracked in
  `review-findings.md` — 2 MEDIUM (the new country-anchor invariant is itself silently bypassed when
  `location` is a `{lng,lat}` coordinate object, since `resolveLocation` returns `country:''` on that
  branch — the same class of gap the anchor was built to close, now on the coordinate-location path
  instead of the region path; `theme` is the one discrete param NOT validated at the MCP boundary — an
  unknown value fails open to the default theme with no signal to the caller, unlike
  `format`/`chrome`/dims which all reject) and 1 LOW (the tool's `resolved` output omits `highlights`,
  which the Phase-1 design-spec tool contract specifies). None of these three are machine-eval
  regressions (all 11 machine evals still pass); they are informational for Gate 2 / follow-up — and
  the pattern across rounds 3→4 (each round's fix for one geocoding edge case exposes a structurally
  similar gap one layer over) is itself worth naming for whoever picks up the follow-up ticket.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify judgment item **E12** (AC-12) — panel proposed PASS against
      `evidence/E12-example.png` (unchanged since Round 2); open it yourself and confirm
      centering/highlight legibility/tile integrity, then fill its `human_override` line with your
      name and today's date
- [ ] T3 (this contract's `risk_tier: T3`): personally verify **every** judgment item and fill
      `human_override` on each (judge verdicts are advisory only; the hook blocks PASS without them)
      — E12 is currently the only judgment item, and has now carried an unfilled override across all
      4 rounds
- [ ] Skim `review-findings.md` Round 4 (3 findings this round: 2 MEDIUM — the new country-anchor
      invariant is silently bypassed on the coordinate-location path; `theme` fails open at the MCP
      boundary with no signal to the caller — and 1 LOW — `resolved` output omits `highlights` vs the
      Phase-1 tool contract) — informational, does not block Gate 2 by itself, but note the recurring
      pattern (round 3's HIGH and round 4's own self-found HIGH were both "an invariant applies to one
      code path but not its sibling") when deciding whether to fold in a 5th round or accept as
      follow-up
- [ ] If satisfied: upgrade `verdict: PENDING-JUDGMENT` to `verdict: PASS` in the frontmatter (this
      write is when the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract.md
