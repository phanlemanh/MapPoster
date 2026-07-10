---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ffb928b717a4acf133df91bbd0b59d6356fb99eb
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 5 — verified 2026-07-10T09:40:00Z (UTC) at commit `ffb928b` on `feature/mcp-map-render`._

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

_This round verifies commit `ffb928b` — the tip of `feature/mcp-map-render`, produced after Round 4's
verify passed all 12/12 evals (E12's panel again proposing PASS) but a fresh adversarial pass surfaced 2
MEDIUM + 1 LOW — the first round with zero HIGH findings — and the human-authorised cap override already
spent once (Round 3→4) did not carry forward automatically, so the loop escalated again rather than
looping unprompted (`decisions.jsonl` `d-20260710T093000Z-43001`). The 3 open findings were: MEDIUM #1 —
Round 4's own new country-anchor invariant (built specifically to stop a bare `"District 1"` resolving to
Liberia) was itself silently bypassed whenever `location` is a `{lng,lat}` coordinate object, since
`resolveLocation`'s coordinate branch returns `country: ''`, so `anchor` came out `undefined` and the
guard passed everything through — confirmed live by the main loop, reproducing `resolveConfig` routing a
`District 1` region straight to Liberia even with a Vietnamese `{lng,lat}` location
(`d-20260710T093000Z-43002`); MEDIUM #2 — `theme` was the one discrete param NOT validated at the MCP
boundary (unlike `format`, which already throws on an unknown value), so a typo fell open to the default
theme with zero signal to the caller; LOW #3 — the tool's `resolved` output omitted `highlights`,
contradicting the Phase-1 design-spec tool contract (both `d-20260710T093000Z-43003`). The human (manh)
authorised a second, still-scoped round to close exactly those 3 (`d-20260710T093500Z-44001`), choosing
reverse-geocoding over a distance heuristic for the coordinate-anchor gap: `resolveCountryAt(lng, lat)`
memoizes ONLY a positive answer, deliberately refusing to cache a transient outage as "no country" —
caching that would recreate the Round-2 HIGH (transient failures memoized as definitive answers) a third
structural time, just relocated to a new code path. Implementation (`d-20260710T093500Z-44002`) threaded
the anchor lookup into `resolveConfig` whenever a highlight is named by string and the location itself
carries no country, throwing rather than silently proceeding when the country can't be determined (closes
MEDIUM #1); added `assertTheme()` to reject an unknown theme with the valid-id list, mirroring how
`format` already throws (closes MEDIUM #2); and made `resolved` carry `theme` and
`highlights:{regions:[{bbox,center}],points:[{lng,lat}]}` (closes LOW #3, and incidentally gives MEDIUM
#2 a caller-visible signal even if a fallback ever slipped through). Verification
(`d-20260710T093500Z-44003`) confirmed 8 of the 9 new regression tests FAIL on pre-fix source (the 9th
guards a future regression — no wasted country lookup when no highlight is resolved by name) and
re-probed live at HEAD: coords + bare `"District 1"` → refused; coords + `"Quận 1, TP.HCM"` →
10.775,106.698 (Vietnam, correct); `theme:"rubby"` → refused with the id list. Four commands produced
this round's machine evidence: `npm test` (vitest, **153 passed / 2 skipped** — up from 144 passed / 2
skipped in Round 4, the delta being the new `resolveCountryAt` suite in `geocode.test.ts`, the
coordinate-anchor + theme-rejection tests in `resolveConfig.test.ts`, and the `resolved`-echo tests in
`tools.test.ts` — one aggregate run covering E1–E9 and E11), `npm run test:e2e` (Playwright, 8 passed —
includes the literal AC-10 spec `e2e/render-mode.spec.ts:15:1`, corroborating E10), `npm run test:mcp`
(vitest with `MCP_INTEGRATION=1`, runs `mcp-server/src/renderFrame.test.ts` only, 2 passed — the
real-build + real-headless-browser AC-1/AC-10 render plus the F1/AC-5 stale-frame regression), and the
dedicated `ui-check:E10` 3-frame screenshot run (E10's primary evidence per `evals.yaml`). Each block
below cites the specific current `it(...)` name(s)/line(s) it maps to (re-verified this round by grepping
the test files at this commit, since several line numbers shifted again with the new regression tests);
the full runner tail is reproduced per block for traceability. No command failed and none went unassigned
to an eval this round. Separately, this round's own eval-authoring pass strengthened the `expected` text
of E2, E4, E5, E6 and E9 in `evals.yaml` to explicitly name behaviour Rounds 4–5 actually added (the
coordinate-path anchor, transient-failure non-memoization, stale-frame/variant bounds, Host/Origin
refusal, theme rejection + resolved echo) — strictly additive, no criterion weakened, disclosed to the
human (`d-20260710T094500Z-45001`); Rounds 1–4 in `## Iterations` below were graded against the
pre-strengthening text. A fresh adversarial-verify pass against this round's OWN changes surfaced 2 NEW
findings — both MEDIUM, none HIGH (the first round to close every prior finding without self-discovering
a new HIGH of its own), none are machine-eval regressions (all 11 machine evals still pass); full detail
in `review-findings.md`, summarized in `## Iterations` below._

- eval: E1
  run_id: minted-mcp-map-render-E1-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs (unchanged behaviour this round; line numbers shifted by new tests inserted above them):
    mcp-server/src/resolveConfig.test.ts:105 "geocodes the location and picks the format size (AC-1)";
    mcp-server/src/tools.test.ts:59 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG (AC-1,
    AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  09:22:58
       Duration  9.32s (transform 20ms, setup 0ms, import 379ms, tests 8.67s, environment 223ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    NEW this round (closes MEDIUM #1 — the country-anchor invariant Round 4 introduced was itself
    bypassable via a {lng,lat} location): mcp-server/src/resolveConfig.test.ts:59 "looks the country up
    when location is coordinates, which carry none"; :71 "fails closed when the country at those
    coordinates cannot be determined"; :78 "does not pay for a country lookup when no highlight is
    resolved by name"; mcp-server/src/geocode.test.ts:119 "reverse-geocodes the country and caches a
    positive answer" and :126 "never caches a failed lookup — reverseGeocode returns null for an outage
    too" (shared with E4 — extends the "never memoize a transient failure" guarantee from geocode
    lookups to this new country-anchor lookup).
    Carried from Rounds 3-4, unchanged this round: mcp-server/src/resolveConfig.test.ts:37 "anchors
    every highlight to the country of the location being rendered", :52 "names the anchor country when
    a region cannot be found in it", :122 "region highlight → boundary geojson + fitted camera (AC-2)",
    :146 "throws when a requested region has no boundary — never silently drops it (F2)";
    mcp-server/src/tools.test.ts:116 "region with no boundary → structured error, not a silently
    unhighlighted poster (F2 / AC-2)"; mcp-server/src/geocode.test.ts:166 "routes a region through the
    same canonicalisation + city guard as a point, then looks up the exact entity", :180 "rejects a
    region hit that lands outside the city the query named", :214 "rejects a transient failure at the
    polygon lookup and never caches it (R2-HIGH)", :242 "refuses a region in the wrong country, even
    with a real polygon", :264 "allows a region whose country matches the anchor, and one with no
    country at all", :281 "keys the cache on the anchor country, so one lookup cannot poison another",
    :290 "caches a definitive 'no such region' (ok response, no result)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs (unchanged behaviour this round; line numbers shifted): mcp-server/src/resolveConfig.test.ts:114
    "point highlight → marker + street-level zoom 14–17 (AC-3)"; mcp-server/src/resolveConfig.test.ts:136
    "explicit camera zoom overrides auto-framing".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs: mcp-server/src/geocode.test.ts:21 "caches identical queries and misses on different ones
    (AC-4)"; :96 "serializes concurrent upstream calls and spaces them (F3/F6)"; :126 "never caches a
    failed lookup — reverseGeocode returns null for an outage too" — new this round, shared with E2,
    extends the never-memoize-a-transient-failure guarantee to the new `resolveCountryAt` lookup that
    closes MEDIUM #1.
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs (unchanged behaviour this round; line numbers shifted): mcp-server/src/tools.test.ts:126
    "renders one image per variant (AC-5)"; :132 "a variant cannot smuggle out-of-range values past the
    boundary guard (R2-MEDIUM)"; mcp-server/src/renderFrame.test.ts:51 "a reused pooled page renders
    each config fresh, never a stale frame (F1 / AC-5)"; mcp-server/src/browserPool.test.ts:5 "never
    creates more than `size` resources under concurrent acquires (F5)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)
    Corroborating (integration depth, real build + real headless browser, covers the F1 stale-frame
    regression): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  09:22:58
       Duration  9.32s (transform 20ms, setup 0ms, import 379ms, tests 8.67s, environment 223ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/transports.test.ts:9 describe("transports expose
    the same tool set (AC-6)") — "lists all tools over stdio" at :10, "lists all tools over HTTP" at
    :23; mcp-server/src/http.test.ts:9 "accepts a server-to-server call: loopback Host, no Origin", :15
    "refuses a rebound Host even though the socket is loopback", :20 "refuses any request carrying an
    unknown Origin", :57 "403s a rebound Host and an unknown Origin before any tool is dispatched"; :77
    "decodes multibyte UTF-8 split across chunk boundaries (R2-LOW)" and :91 "handles an inline GeoJSON
    payload spread over many chunks".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() ref (unchanged): mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path +
    base64 + dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs (unchanged behaviour this round; line numbers shifted): mcp-server/src/resolveConfig.test.ts:19
    "resolves tiktok to 1080×1920 and passes custom dims through"; :28 "rejects non-positive,
    non-integer and oversized custom dims (F4)"; :153 "enforces coordinate/zoom bounds at runtime, not
    only in Zod (R2-MEDIUM)"; :131 and mcp-server/src/tools.test.ts:88 "custom format dims flow through
    (AC-8)"; mcp-server/src/tools.test.ts:167 "list_formats includes tiktok 1080×1920 (AC-8)";
    mcp-server/src/tools.test.ts:132 "a variant cannot smuggle out-of-range values past the boundary
    guard (R2-MEDIUM)" — shared with E5, closes the "rejected in both render_map and render_variants"
    half of this eval's expectation.
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/resolveConfig.test.ts:141 "chrome defaults to
    clean, poster is honored (AC-9)"; mcp-server/src/tools.test.ts:94 "chrome defaults clean, poster
    honored (AC-9)"; mcp-server/src/tools.test.ts:143 "placeName overrides the geocoder-derived poster
    label" and :149 "without placeName the geocoder label is used".
    NEW this round (closes MEDIUM #2 — theme was the one discrete param that fell open to the default
    instead of being rejected — and LOW #3 — `resolved` omitted `highlights` vs. the Phase-1 tool
    contract): mcp-server/src/resolveConfig.test.ts:87 "rejects an unknown theme instead of silently
    rendering the default"; mcp-server/src/tools.test.ts:81 "returns a structured error for an unknown
    theme rather than a default-themed poster"; mcp-server/src/resolveConfig.test.ts:95 "summarizes each
    resolved region so the caller can tell which one it got"; mcp-server/src/tools.test.ts:68 "echoes
    the resolved theme and highlights, per the tool contract".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E10
  run_id: verifier-mcp-map-render-E10-20260710T093700Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-10T09:40:00Z
  screenshot: evidence/E10-step1.png
  observed: |
    Opened all 3 saved evidence frames myself with Read (real image bytes just written by my own script
    this run, not recalled from the steps text or from the prior round's evidence):

    E10-step1.png (540x960, taken immediately after page.goto('/render.html?config=...') with
    waitUntil:'load', BEFORE ready/renderFrame ran): near-solid dark background (this run's 'noir' theme
    has not yet painted its vector tiles) with only a thin attribution strip pinned to the bottom
    reading "© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre". Zero dialogs, zero
    search boxes, zero city-picker grids, zero buttons/overlays anywhere in the frame — this is exactly
    "no onboarding modal visible". Matches the DOM assertions taken at the same instant: .onboard-overlay
    count=0, .poster-frame visible=true. This is the "config-load" stage.

    E10-step2.png (540x960, taken right after `await window.__mapposter.ready` then `renderFrame()`
    executed in-page): now a fully painted monochrome vector map (noir theme: black background,
    white/light-gray line work) — a pentagon/fortress-shaped walled compound near the top plus a large
    rectangular building complex (consistent with the Hanoi Imperial Citadel area at the
    105.8342,21.0278 coordinates my independently-generated resolved config used), a dense street grid
    with bright arterial roads, a small pond mid-frame and a larger lake bottom-right. Same attribution
    strip at the bottom. The page is visibly alive and correctly rendered (not blank, not an error page,
    not crashed) — matches the "render" stage. Visually distinct from a different theme/location seen in
    an older round's evidence, confirming this frame is freshly produced by my own run, not a stale
    reused file.

    E10-step3.png (measured 1080x1920 by five independent methods: renderFrame()'s own returned
    {width,height}; my script's own byte-level PNG IHDR parser; macOS `file`; macOS `sips -g pixelWidth
    -g pixelHeight`; a from-scratch Python3 `struct`-based IHDR parse — this is the literal decoded bytes
    of renderFrame()'s dataUrl, not a page screenshot): the same Hanoi scene at full target resolution —
    citadel compound top, dense street grid, ponds/lake — with the OSM/OpenMapTiles/OpenFreeMap/MapLibre
    attribution baked into the bottom-right corner of the composed image itself (composePoster's canvas
    layout, expectedly different from the live page's DOM footer bar seen in steps 1-2, since it is a
    different rendering path). 1,102,611 bytes — a real, non-blank, non-corrupt, full-resolution PNG.
    Matches the "dims" stage.

    All three frames read as the intended slideshow (config-load blank -> render live-painted -> dims
    full-res output) and nothing in any frame contradicts Expected: no onboarding modal ever appeared,
    `ready` resolved without throwing, and the returned PNG is exactly 1080x1920.

    Independently re-opened all 3 frames again while writing this report (fresh Read, this round, cross-
    checked against `sips -g pixelWidth -g pixelHeight`): step1 is the same near-solid dark frame with
    only the attribution strip and zero onboarding chrome of any kind at a confirmed 540x960; step2 is
    the same noir monochrome map with the citadel/fortress compound, dense street grid, small pond and
    larger lake, also 540x960; step3 is the same scene at a confirmed 1080x1920 with the attribution
    baked into the image itself. Nothing in any image contradicts the description above.
  output: |
    Dedicated ui-check run (3 required steps + screenshots: evidence/E10-step1.png, E10-step2.png,
    E10-step3.png).

    Cleanup: temporary verifier scripts (_tmp_e10_verify.mjs, _tmp_e10_localstorage_check.mjs, copied
    into repo root only so Node could resolve node_modules/playwright) deleted after the run. Two
    incidental DOM-dump helper files also written into evidence/ (.E10-step1-dom.html,
    .E10-step2-dom.html, superseded once the real screenshots worked) were deleted too. Dev server
    (self-started, preview serverId 71cfd7fd-28c8-4561-8aca-a1d4b2b2e207) stopped; `lsof -iTCP:5173`
    confirms no listener remains. `git status --porcelain` after the run shows ONLY the 3 evidence PNGs
    as modified (dist/ is gitignored) — no source/config changed, no commits created, HEAD unchanged at
    ffb928b before and after.

    Result: every assertion above passed. exitCode=0.

    Corroborating automated spec (same verifier command, `npm run test:e2e`):
    e2e/render-mode.spec.ts:15:1 "render mode: headless renderFrame yields exact target dims, no
    onboarding (AC-10)":
      ✓  8 [chromium] › e2e/render-mode.spec.ts:15:1 › render mode: headless renderFrame yields exact
      target dims, no onboarding (AC-10) (1.8s)

      8 passed (20.0s)

    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  09:22:58
       Duration  9.32s (transform 20ms, setup 0ms, import 379ms, tests 8.67s, environment 223ms)

- eval: E11
  run_id: minted-mcp-map-render-E11-r5
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T09:40:00Z
  output: |
    it() refs (unchanged behaviour this round; line numbers shifted): mcp-server/src/tools.test.ts:101
    "ungeocodable input → structured error, no throw (AC-11)"; :107 "invalid custom dims → structured
    error, never renders a blank PNG (F4 / AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  153 passed | 2 skipped (155)
       Start at  09:22:59
       Duration  1.85s (transform 588ms, setup 0ms, import 2.96s, tests 861ms, environment 7.08s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context
    each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur), re-run this round against the unchanged
    `evidence/E12-example.png` (this round's fixes touched coordinate-anchor validation, theme
    validation, and the `resolved` echo — not the example's own point-highlight config — so the asset
    was not regenerated; confirmed unchanged via `git log`/`git status` on the file, last touched at
    commit `433e7ea` in Round 3).
    Individual votes:
    - domain-correctness: PASS — Evidence PNG is exactly 1080×1920 (tiktok target); pixel-measured, the
      white point-highlight pin's anchor tip sits at ~(541,958) vs. true frame center (540, 960) —
      essentially pixel-perfect centering. The overlaid coordinates 10.7759°N/106.6894°E and the
      roundabout visible bottom-right (consistent with the Hồ Con Rùa junction) corroborate that the map
      area genuinely is Võ Văn Tần, Quận 3, not a mis-geocoded location. Roads/buildings render as
      continuous, unbroken amber-on-navy vector lines with no blank/missing tiles or seams, and the
      white pin has strong contrast against the midnight-blue palette, making the highlight clearly
      legible — the frame reads as usable B-roll.
    - operational-feasibility: PASS — Phân tích pixel trên ảnh PNG 1080×1920 cho thấy đầu ghim highlight
      nằm cách tâm khung hình chưa tới 1px (~540,959 vs tâm 540,960), và nhãn toạ độ in trên ảnh
      (10.7759°N, 106.6894°E) khớp gần như tuyệt đối (tới 4 số thập phân: 10.7758788/106.6893957) với
      kết quả geocode trực tiếp (live Nominatim) cho đúng chuỗi "Võ Văn Tần, Quận 3, HCMC" — xác nhận vị
      trí center đúng vào địa điểm thực, không lệch. Ghim là pin trắng sắc nét, kênh alpha opaque 100%,
      tương phản cao rõ ràng trên nền midnight-blue navy — legible. Lưới đường/toà nhà render liền mạch
      edge-to-edge, không có khối tile trống/đồng nhất ở bất kỳ kích thước lưới nào (128/256/512px) —
      không breakage; cả 3 tiêu chí con của AC-12 đều có bằng chứng trực tiếp hỗ trợ.
    - spec-alignment: PASS — Image is exactly 1080×1920 (tiktok). Pixel analysis of the marker locates
      its tip at (~540, 959), essentially identical to the image's true center (540, 960) — the location
      is dead-center, not just approximately so. The white pin+dot highlight has strong contrast against
      the midnight-blue navy base and is unambiguously legible; roads/buildings render as continuous,
      unbroken amber lines across the whole frame (checked center crop and all four quadrants) with no
      seams, gaps, or blank tiles, so the frame is usable as clean B-roll.
  human_override:
  # ^ REQUIRED before this item — and the overall verdict — can become PASS.
  # risk_tier: T3 (contract.md) mandates a direct human verdict on EVERY
  # judgment eval, regardless of the panel's proposal above. Open
  # evidence/E12-example.png yourself (unchanged since Round 3 — none of Rounds 4-5's fixes touched the
  # example's own point-highlight scene), compare against AC-12, then replace this blank value with
  # your name, a space, and today's ISO date (optionally + a short note).
  # This item was ALSO pending human_override in Rounds 1-4; unchanged this round — T3 requires the
  # override regardless of how many times the panel re-affirms PASS.

## Analyst

Eval ids green-on-both (HEAD `ffb928b` AND the pre-feature `diffBase` tree), via the shared `npm test`
command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged from Rounds 1-4): all these assertions live in `mcp-server/src/*.test.ts` and
`src/lib/geocoding.test.ts`, and the entire `mcp-server/` package plus the VN-geocoding additions in
`src/lib/geocoding.ts` are net-new code introduced by this feature branch. On the `diffBase` tree those
files/branches most plausibly do not exist yet, so `npm test` has nothing to collect (or nothing new to
exercise) there — a vacuous pass, not a genuine behavior-equivalence pass. This round added another slice
of new coverage (the `resolveCountryAt` suite in `mcp-server/src/geocode.test.ts`, the coordinate-anchor
and theme-rejection tests in `mcp-server/src/resolveConfig.test.ts`, and the `resolved`-echo tests in
`mcp-server/src/tools.test.ts`) that inherits the identical vacuous-pass-on-`diffBase` status for the same
reason — not a new gap, a continuation of the Round-1/2/3/4 finding. Gate 2 human should confirm the
`diffBase` used for this A/B run actually predates `mcp-server/` and the VN-geocoding changes to
`src/lib/geocoding.ts` (expected) rather than a mis-resolved base that happens to already contain this
code.

## Variance

none — every eval this round is deterministic, single run (1/1); no flaky/racy variance observed across
the captured commands (`npm test`, `npm run test:e2e`, `npm run test:mcp`, `ui-check:E10` each exited 0 on
their one recorded run).

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
- Round 5 (verified 2026-07-10T09:40:00Z, commit `ffb928b`): Round 4's verify passed 12/12 evals
  again (E12's panel re-proposing PASS) but a fresh adversarial pass surfaced 2 MEDIUM + 1 LOW — the
  first round with zero HIGH findings — and the human's Round-3→4 cap override did not carry forward
  automatically, so the loop escalated once more rather than auto-continuing
  (`decisions.jsonl` `d-20260710T093000Z-43001`). The human (manh) authorised a second, still-scoped
  round to close all 3 (`d-20260710T093500Z-44001`), choosing reverse-geocoding over a distance
  heuristic for the coordinate-anchor gap: `resolveCountryAt(lng, lat)` memoizes ONLY a positive
  answer, deliberately refusing to cache a transient outage as "no country" — caching that would
  recreate the Round-2 HIGH (transient failures memoized as definitive) a third structural time, just
  relocated to a new code path. Implementation (`d-20260710T093500Z-44002`) closed MEDIUM #1 by
  threading that lookup into `resolveConfig` whenever a highlight is named by string and the location
  itself carries no country, throwing rather than silently proceeding when the country can't be
  determined — this is Round 4's own self-inflicted gap: the anchor it introduced to stop "District 1"
  from rendering Liberia was itself walkable around via a coordinate `location`. MEDIUM #2 closed via
  `assertTheme()`, which now rejects an unknown theme with the valid-id list, mirroring how `format`
  already throws (previously an unknown theme fell open to the default with zero signal). LOW #3
  closed by making `resolved` carry `theme` and `highlights:{regions:[{bbox,center}],points:[{lng,lat}]}`,
  matching the Phase-1 design-spec tool contract and incidentally giving MEDIUM #2's caller a way to
  notice a silent fallback even if one slipped through. Verification (`d-20260710T093500Z-44003`)
  confirmed 8 of 9 new regression tests FAIL on pre-fix source (the 9th guards a future regression — no
  wasted country lookup when no highlight is named by string); live-reprobed at HEAD: coords + bare
  `"District 1"` → refused; coords + `"Quận 1, TP.HCM"` → 10.775,106.698 (Vietnam, correct);
  `theme:"rubby"` → refused with the id list. All 11 machine evals still pass, now **153 passed | 2
  skipped** (up from 144 | 2 in Round 4); E10's ui-check re-confirms exact 1080×1920 output and no
  onboarding; E12's panel re-affirms PASS (3/3 lenses) against the still-unchanged
  `evidence/E12-example.png` (this round's fixes touched coordinate-anchor/theme/resolved-echo logic,
  not the example's own point-highlight rendering path). Overall verdict remains PENDING-JUDGMENT — T3
  still mandates a direct human `human_override` on E12, not yet supplied across all five rounds.
  Separately, this round's own eval-authoring pass strengthened the `expected` text of E2, E4, E5, E6
  and E9 in `evals.yaml` to explicitly name behaviour Rounds 4-5 actually added (the coordinate-path
  anchor, transient-failure non-memoization, stale-frame/variant bounds, Host/Origin refusal, theme
  rejection + resolved echo) — strictly additive, no criterion weakened, disclosed to the human
  (`d-20260710T094500Z-45001`); Rounds 1-4 above were graded against the pre-strengthening text. A
  fresh adversarial pass this round (commit `ffb928b`) surfaced 2 NEW findings tracked in
  `review-findings.md` — both MEDIUM, none HIGH, none machine-eval regressions (all 11 machine evals
  still pass): the HTTP app-static server (`appServer.ts`) binds every network interface
  unconditionally — a sibling listener to the MCP HTTP transport that DOES default to loopback — so
  even a deployment relying on the documented "loopback by default" invariant leaks the static-asset /
  render-harness port to the LAN; and `readJsonBody` reads the entire request body into memory with no
  size bound, sitting behind the same Host/Origin guard that a server-to-server client (the documented
  threat model for this transport) can forge, so an unbounded or slow-drip body can OOM the process and
  the shared browser pool with it.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify judgment item **E12** (AC-12) — panel proposed PASS against
      `evidence/E12-example.png` (unchanged since Round 3); open it yourself and confirm
      centering/highlight legibility/tile integrity, then fill its `human_override` line with your
      name and today's date
- [ ] T3 (this contract's `risk_tier: T3`): personally verify **every** judgment item and fill
      `human_override` on each (judge verdicts are advisory only; the hook blocks PASS without them)
      — E12 is currently the only judgment item, and has now carried an unfilled override across all
      5 rounds
- [ ] Skim `review-findings.md` Round 5 (2 findings this round, both MEDIUM, none HIGH — the first
      round to close every prior finding without self-discovering a new HIGH of its own): the
      app-static `appServer.ts` binds every network interface unconditionally with no Host/Origin
      guard at all, unlike its sibling MCP HTTP transport which defaults to loopback — so even a
      default, loopback-only MCP deployment leaks the render harness to the LAN; and `readJsonBody`
      reads the entire HTTP request body into memory with no size bound, behind a Host/Origin check
      that a server-to-server caller (the transport's own documented threat model) can forge —
      informational, does not block Gate 2 by itself, but both sit on the same unauthenticated HTTP
      boundary Rounds 2-4 already hardened once each, so consider folding into a scoped round 6 rather
      than deferring indefinitely
- [ ] If satisfied: upgrade `verdict: PENDING-JUDGMENT` to `verdict: PASS` in the frontmatter (this
      write is when the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract.md
