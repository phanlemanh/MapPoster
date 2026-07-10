---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 8fbdbfae83731c60ee7c2a94d1ce1fbacebb6f10
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 8 — verified 2026-07-10T15:10:00Z (UTC) at commit `8fbdbfa` on `feature/mcp-map-render`._

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
| E12 | AC-12 | judgment | PASS (panel) — awaits mandatory human_override (T3) |

> **PENDING-JUDGMENT — every eval is green; this round closes all 4 of Round 7's review findings.**
> All 11 machine-mapped evals (E1–E9, E11 via `npm test`; E10 via a dedicated `ui-check` run) exited 0
> this round, and E12's judge panel again proposes PASS (3/3 lenses). The verdict is PENDING-JUDGMENT
> rather than PASS for exactly one reason, unchanged since Round 1: this contract's `risk_tier: T3`
> mandates a direct human verdict on **every** judgment item regardless of the panel's proposal
> (hook-enforced), and E12's `human_override` has not yet been supplied — now unfilled across all 8
> rounds. This round exists because the human (manh), even though the Round-6 termination rule did not
> require it (no HIGH finding was open), chose to fix all 4 of Round 7's findings (2 MEDIUM, 2 LOW)
> before shipping, alongside two unrelated repository changes — making the MapPoster GitHub repo
> public and committing `.mcp.json` — which together moved `verified_commit` off `10750cbb` and
> required this fresh S4 verify (`decisions.jsonl` `d-20260710T150500Z-50001`). All 4 are now confirmed
> closed by source inspection; a fresh adversarial pass surfaced exactly 1 new LOW (an unvalidated
> inline-GeoJSON shape at the MCP boundary) — see `review-findings.md`. Zero HIGH findings for the
> third round running (Rounds 6–8).

## Evidence

_This round verifies commit `8fbdbfa` — one commit ahead of Round 7's `10750cbb`. Round 7 reached
PENDING-JUDGMENT with all 12 evals green but 4 open review findings (2 MEDIUM, 2 LOW, none HIGH); under
the human's Round-6 termination rule (`decisions.jsonl` `d-20260710T110500Z-47001`) that pattern did not
by itself require another round, but the human (manh) chose to close all 4 before shipping anyway,
alongside making the MapPoster GitHub repo public and committing `.mcp.json` — both of which moved
`verified_commit` off `10750cbb` and required this fresh verify (`d-20260710T150500Z-50001`). This
round's diff (`git diff 10750cbb 8fbdbfa --stat`) touches `mcp-server/src/{deps,browserPool,geocode,
resolveConfig,tools,renderFrame}.ts` plus 4 test files (one brand new: `deps.test.ts`) — the first round
since Round 1 to make substantial changes inside `mcp-server/` purely to close review findings rather
than to close an acceptance-criterion gap. `npm test`'s aggregate is now **179 passed | 2 skipped
(181)**, up from **160 | 2** in Round 7 (+19 new tests, itemised per-eval below); `npm run test:e2e` is
unchanged at **11/11 green** and `npm run test:mcp` unchanged at **2 passed**, since neither `e2e/` nor
any app-render source changed this round (confirmed via `git diff 10750cbb 8fbdbfa`, empty for both
paths). E10's dedicated `ui-check` run independently re-verified exact 1080×1920 output and no
onboarding against a freshly chosen **Hội An / sandstone** config — deliberately different from the
repo's own `e2e/render-mode.spec.ts` fixture (HCMC / midnight-blue) and every prior round's own probe
config (Hà Nội / noir, Rounds 3–6; Đà Nẵng / ocean, Round 7) — so this is not a replay of cached
evidence. E12's judge panel re-affirms PASS (3/3 lenses) against the still-unchanged
`evidence/E12-example.png` (untouched since Round 3, commit `433e7ea`; this round's fixes touched
render-pool / deps-init / geocode-cache / colour-validation internals, not poster compositing or
point-highlight rendering, so there was nothing in this round that would change that fixture).
Separately, a fresh adversarial pass this round (commit `8fbdbfa`) confirmed all 4 of Round 7's findings
are now closed — source-verified: `memoizeSuccess()` (new, `deps.ts`) drops the memo on a rejected
startup promise so the next caller retries, and `pool.healthy()` now detects and rebuilds a dead browser
runtime instead of resolving the same corpse forever; `Pool.discard()` + `Pool.healthy()` (new,
`browserPool.ts`) let `renderFrame` discard a crashed page in its `finally` instead of recycling it, and
`close()` now rejects parked waiters instead of abandoning them; a `hexColor` Zod regex plus a runtime
`assertColor()` (both new) refuse a non-hex `highlight.color`, verified through a live MCP session
against an XSS-shaped payload; the geocode caches (`locCache`/`boundaryCache`/`countryCache`) are now a
bounded LRU via `CACHE_MAX` (env `MAPPOSTER_GEO_CACHE_MAX`, default 500) — and surfaced exactly 1 NEW
finding for `review-findings.md`: LOW — inline `highlight.regions[].geojson` is accepted as `z.any()`
with no structural shape validation at the MCP boundary (`tools.ts:115`), the one remaining unbounded
input at this boundary now that colour/theme/format/chrome/dims are all guarded. None of the 1 finding
is HIGH — the third round running (6, 7, 8) with zero HIGH findings — and none is a machine-eval
regression (all 12 evals above are independently green); per the Round-6 termination rule this single
LOW does not by itself block Gate 2 — it is informational for the human's review below._

- eval: E1
  run_id: minted-mcp-map-render-E1-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs (this round touched mcp-server/src/{deps,browserPool,geocode,resolveConfig,tools,
    renderFrame}.ts, but AC-1's own geocode→format→PNG path is unchanged — resolveConfig.ts's only
    change ahead of resolveLocation is validating theme/colour first, confirmed by
    `git diff 10750cbb 8fbdbfa -- mcp-server/src/resolveConfig.ts`):
    mcp-server/src/resolveConfig.test.ts:128 "geocodes the location and picks the format size (AC-1)"
    (line shifted from Round 7's :105 — 3 new colour-validation tests were inserted above it, at :105,
    :116, :121); mcp-server/src/tools.test.ts:59 "renders and echoes resolved center/place (AC-1)"
    (unchanged); mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG
    (AC-1, AC-10)" (unchanged).
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  15:05:01
       Duration  8.85s (transform 98ms, setup 0ms, import 760ms, tests 7.50s, environment 469ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs (region-highlight / country-anchor logic itself untouched this round; two citations below
    have shifted lines only because 3 new colour-validation tests were inserted earlier in the same
    file): mcp-server/src/resolveConfig.test.ts:37 "anchors every highlight to the country of the
    location being rendered", :52 "names the anchor country when a region cannot be found in it", :59
    "looks the country up when location is coordinates, which carry none", :71 "fails closed when the
    country at those coordinates cannot be determined", :78 "does not pay for a country lookup when no
    highlight is resolved by name" (all five unchanged), :145 "region highlight → boundary geojson +
    fitted camera (AC-2)" (was :122 in Round 7), :169 "throws when a requested region has no boundary —
    never silently drops it (F2)" (was :146 in Round 7); mcp-server/src/tools.test.ts:116 "region with
    no boundary → structured error, not a silently unhighlighted poster (F2 / AC-2)" (unchanged);
    mcp-server/src/geocode.test.ts:119 "reverse-geocodes the country and caches a positive answer", :126
    "never caches a failed lookup — reverseGeocode returns null for an outage too" (shared with E4),
    :166 "routes a region through the same canonicalisation + city guard as a point, then looks up the
    exact entity", :180 "rejects a region hit that lands outside the city the query named", :214
    "rejects a transient failure at the polygon lookup and never caches it (R2-HIGH)", :242 "refuses a
    region in the wrong country, even with a real polygon", :264 "allows a region whose country matches
    the anchor, and one with no country at all", :281 "keys the cache on the anchor country, so one
    lookup cannot poison another", :290 "caches a definitive 'no such region' (ok response, no result)"
    (all nine unchanged — this round's new bounded-cache describe was appended at :298, after every one
    of these).
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs (unchanged behaviour this round; line numbers shifted because 3 new colour-validation
    tests were inserted earlier in the same file): mcp-server/src/resolveConfig.test.ts:137 "point
    highlight → marker + street-level zoom 14–17 (AC-3)" (was :114 in Round 7); :159 "explicit camera
    zoom overrides auto-framing" (was :136 in Round 7).
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs: mcp-server/src/geocode.test.ts:21 "caches identical queries and misses on different ones
    (AC-4)" (unchanged); :96 "serializes concurrent upstream calls and spaces them (F3/F6)" (unchanged);
    :126 "never caches a failed lookup — reverseGeocode returns null for an outage too" (unchanged,
    shared with E2). NEW this round, closing review-findings.md Round-7 LOW #3 (unbounded caches):
    describe('the geocode caches are bounded') at :298 — :299 "evicts the least-recently-used entry
    instead of growing without limit" (genuinely red on pre-fix source: the old `Map`s had no
    `CACHE_MAX`/eviction of any kind); :317 "a cache hit refreshes recency, so a hot key is never
    evicted" — flagged by the implementer's own honesty note (decisions.jsonl
    d-20260710T150500Z-50006) as NON-discriminating: it passes on the pre-fix unbounded `Map` too (an
    unlimited cache trivially never evicts anything), so it guards the new LRU's recency logic going
    forward rather than proving the fixed bug — carried into this report rather than smoothed over.
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs: mcp-server/src/tools.test.ts:126 "renders one image per variant (AC-5)" (unchanged);
    :132 "a variant cannot smuggle out-of-range values past the boundary guard (R2-MEDIUM)" (unchanged);
    mcp-server/src/renderFrame.test.ts:51 "a reused pooled page renders each config fresh, never a stale
    frame (F1 / AC-5)" (unchanged). NEW this round, closing review-findings.md Round-7 MEDIUM #1 (dead
    pooled page never evicted/rebuilt) and MEDIUM #2 (rejected startup promise memoized forever):
    mcp-server/src/browserPool.test.ts — describe('createResourcePool: discarding a broken resource') at
    :4 — :10 "frees the slot so the next acquire gets a FRESH resource, not the corpse", :25 "destroys
    the discarded resource", :33 "mints a replacement for whoever is queued behind the discarded
    resource", :45 "rejects the queued waiter when the replacement cannot be created", :62 "reports the
    underlying browser health", :70 "defaults to healthy when no probe is supplied", :74 "rejects parked
    waiters on close instead of hanging them"; describe('createResourcePool') at :83 (pre-existing) —
    :84 "never creates more than `size` resources under concurrent acquires (F5)" (was :5 in Round 7,
    shifted by the new describe block inserted above it), :109 "frees the reserved slot when the factory
    throws", :119 "hands a released resource to the longest-waiting acquirer" (both unchanged);
    describe('renderFrame returns a broken page via discard, not release') at :130 — :131 "discards the
    page when the render throws, and releases it when it succeeds"; mcp-server/src/deps.test.ts (new
    file) — describe('memoizeSuccess') at :9 — :10 "caches a success and never calls the factory
    again", :18 "does NOT cache a rejection — one transient failure must not brick the process", :34
    "shares one in-flight attempt between concurrent callers", :44 "reset() forces the next call to
    rebuild"; describe('makeRenderDeps') at :54 — :68 "rebuilds the runtime once the browser has died",
    :95 "keeps the runtime while the browser is alive". The implementer's own honesty note
    (d-20260710T150500Z-50006) flags that most of these are red-on-pre-fix-source only because the new
    exports (`memoizeSuccess`, `discard`, `healthy`) do not exist yet on pre-fix source — a weak
    discriminator on its own — but the core `??=`-memoized-rejection bug this round fixes was
    independently reproduced with a live Node script outside the test suite, not just inferred from a
    missing export.
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)
    Corroborating (integration depth, real build + real headless browser, covers the pooled-page /
    stale-frame path): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  15:05:01
       Duration  8.85s (transform 98ms, setup 0ms, import 760ms, tests 7.50s, environment 469ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs (unchanged this round — no file under the transport/http/app-server surface changed;
    confirmed via `git diff 10750cbb 8fbdbfa -- mcp-server/src/appServer.test.ts
    mcp-server/src/http.test.ts mcp-server/src/transports.test.ts`, empty): mcp-server/src/
    appServer.test.ts:29 "defaults to loopback", :33 "is not reachable from the LAN by default", :50
    "can be opened deliberately"; mcp-server/src/http.test.ts:89 "413s an oversized body rather than
    buffering it", :105 "rejects a body over the cap instead of buffering it to OOM", :110 "counts bytes
    across chunks — a chunked body declares no Content-Length", :115 "lets a body at the limit through";
    mcp-server/src/transports.test.ts:9 describe("transports expose the same tool set (AC-6)") — "lists
    all tools over stdio" at :10, "lists all tools over HTTP" at :23; mcp-server/src/http.test.ts:9
    "accepts a server-to-server call: loopback Host, no Origin", :15 "refuses a rebound Host even though
    the socket is loopback", :20 "refuses any request carrying an unknown Origin", :71 "403s a rebound
    Host and an unknown Origin before any tool is dispatched", :122 "decodes multibyte UTF-8 split
    across chunk boundaries (R2-LOW)", :136 "handles an inline GeoJSON payload spread over many chunks".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() ref (unchanged — mcp-server/src/delivery.test.ts did not change this round):
    mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path + base64 + dims
    (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:19 "resolves tiktok to 1080×1920 and passes custom
    dims through" (unchanged); :28 "rejects non-positive, non-integer and oversized custom dims (F4)"
    (unchanged); :176 "enforces coordinate/zoom bounds at runtime, not only in Zod (R2-MEDIUM)" (was
    :153 in Round 7, shifted by the 3 new colour-validation tests inserted earlier in the file);
    mcp-server/src/tools.test.ts:88 "custom format dims flow through (AC-8)" (unchanged); :167
    "list_formats includes tiktok 1080×1920 (AC-8)" (unchanged); :132 "a variant cannot smuggle
    out-of-range values past the boundary guard (R2-MEDIUM)" — shared with E5 (unchanged).
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:164 "chrome defaults to clean, poster is honored
    (AC-9)" (was :141 in Round 7); :87 "rejects an unknown theme instead of silently rendering the
    default" (unchanged); :95 "summarizes each resolved region so the caller can tell which one it got"
    (unchanged). NEW this round, closing review-findings.md Round-7 LOW #4 (unvalidated
    `highlight.color`): :105 "refuses a highlight colour that is not a hex colour", :116 "accepts the
    hex forms a caller would actually use", :121 "rejects a bad colour BEFORE spending a geocoding
    request" (this last one asserts the reordering in `resolveConfig.ts` — `assertColor`/`assertTheme`
    now run before `resolveLocation`'s network call, confirmed via `git diff 10750cbb 8fbdbfa --
    mcp-server/src/resolveConfig.ts`). mcp-server/src/tools.test.ts:94 "chrome defaults clean, poster
    honored (AC-9)" (unchanged); :143 "placeName overrides the geocoder-derived poster label"
    (unchanged); :149 "without placeName the geocoder label is used" (unchanged); :81 "returns a
    structured error for an unknown theme rather than a default-themed poster" (unchanged); :68 "echoes
    the resolved theme and highlights, per the tool contract" (unchanged). Live-verified outside the
    test suite too (decisions.jsonl d-20260710T150500Z-50004): a real MCP session sent
    `"/><img src=x onerror=alert(1)>` and the bare word `"red"` as `highlight.color` — both refused at
    the Zod boundary — and `"#e8b04b"` rendered normally.
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E10
  run_id: verifier-mcp-map-render-E10-20260710T080938Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-10T15:10:00Z
  screenshot: evidence/E10-step1.png
  observed: |
    Opened all 3 just-saved evidence frames with Read (real bytes from my own independent script this
    round; config = Hoi An / sandstone theme / 1080x1920 / chrome:clean / one 'pin' marker —
    deliberately a different place+theme than the repo's own e2e/render-mode.spec.ts fixture
    (HCMC/midnight-blue) and every prior round's own probe config per evidence-report.md (Da Nang/ocean
    r7, Hanoi/noir r6) — this is not a replay of cached evidence):

    E10-step1.png (540x960 viewport screenshot, confirmed via `file`): solid warm sandstone/cream
    background (the theme's base fill) with a single white pin marker centered in frame and a thin
    attribution strip pinned to the bottom reading "OpenStreetMap contributors / OpenMapTiles /
    OpenFreeMap / MapLibre". Zero dialogs, zero search boxes, zero city-picker UI, zero onboarding
    buttons/overlays anywhere in the frame - visually confirms "no onboarding modal visible", matching
    the DOM assertions taken at the same instant (.onboard-overlay count=0, .poster-frame visible=true).
    Captured immediately after page.goto('/render.html?config=...', waitUntil:'load'); tiles have not
    painted yet, only the marker (independent of tile load) is showing. This is the "config-load"
    stage.

    E10-step2.png (540x960 viewport screenshot): now a fully painted vector map in the sandstone theme
    (warm tan/cream land, darker khaki water) - a coastline top-right (South China Sea near Hoi An), a
    braided river delta (Thu Bon river) running through the middle/bottom, and a dense street grid in
    the historic town center where the white pin marker sits - all consistent with the Hoi An
    coordinates (108.335, 15.8801) my independently-built resolved config specified. Page is visibly
    alive and correctly rendered (not blank, not an error page, not crashed), captured right after
    `await window.__mapposter.ready` then `renderFrame()` executed in-page. This is the "render" stage.

    E10-step3.png (measured 1080x1920 by three independent methods: my script's own byte-level PNG IHDR
    parser reading the decoded dataUrl bytes = 1080/1920; macOS `file` = "PNG image data, 1080 x 1920,
    8-bit/color RGBA, non-interlaced"; and `sips -g pixelWidth -g pixelHeight` = pixelWidth:1080 /
    pixelHeight:1920 - this is the literal decoded bytes of renderFrame()'s own dataUrl, not a page
    screenshot, 1194203 bytes): the same Hoi An scene (coastline, river delta, town street grid, pin
    marker) at full target resolution and higher fidelity than step2, with the OSM/OpenMapTiles/
    OpenFreeMap/MapLibre attribution baked into the composed image itself bottom-right. No
    cropping/stretching/blank-canvas artifacts - full frame populated edge-to-edge. This is the "dims"
    stage and its content matches the numeric assertion (1080 wide x 1920 tall).

    None of the 3 frames contradict Expected; all corroborate it: config-load shows no onboarding
    chrome, render shows a live correctly-geolocated map, dims shows an exact-size non-blank PNG.
  output: |
    Killed only the dev server this run started (PID 41312 npm + 41334 vite child, parent/child
    confirmed via ps before killing); port 5173 confirmed free after. Removed the temp verification
    script (.e10-verify-tmp.mjs). Found one pre-existing chrome-headless-shell process tree (pid
    35991+children) but traced its ancestry to pid 35821 = mcp-server/src/stdio.ts (the repo's own
    "mapposter" MCP server wired via .mcp.json), started at 14:36:40 local - before any of my Bash calls
    and unrelated to anything I ran - so left untouched per "only stop what I started". `git status
    --short` shows only the 3 evidence PNGs changed (sizes shifted vs. the prior round's cached Da
    Nang/ocean probe because this round used a fresh Hoi An/sandstone config) - no source/config/script
    file touched; dist/ build output correctly gitignored.

    Overall: exit 0. Matches Expected in full - "exit 0; render-mode headless: no onboarding, ready
    resolves, renderFrame() PNG is exactly 1080x1920; frames show config-load -> render -> dims" AND
    "the full e2e suite (11 tests) must pass, including: marker placement armed by an icon chosen
    BEFORE the map load event; a city picked before load is actually flown to (not stranded by
    map.stop()); a reload keeps the panned camera" - all verified green above on an independently-
    authored script + two full suite runs at true current HEAD (8fbdbfa).

    Corroborating: `npm run test:e2e`:
          ✓  11 [chromium] › e2e/render-mode.spec.ts:15:1 › render mode: headless renderFrame yields
             exact target dims, no onboarding (AC-10) (1.6s)

      11 passed (36.6s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  15:05:01
       Duration  8.85s (transform 98ms, setup 0ms, import 760ms, tests 7.50s, environment 469ms)

- eval: E11
  run_id: minted-mcp-map-render-E11-r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T15:10:00Z
  output: |
    it() refs (unchanged — mcp-server/src/tools.test.ts did not change this round):
    mcp-server/src/tools.test.ts:101 "ungeocodable input → structured error, no throw (AC-11)"; :107
    "invalid custom dims → structured error, never renders a blank PNG (F4 / AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  15:05:01
       Duration  2.33s (transform 743ms, setup 0ms, import 4.61s, tests 1.15s, environment 11.03s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context
    each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur), re-run this round against the unchanged
    `evidence/E12-example.png` (this round's fixes touched the render-pool / deps lazy-init /
    geocode-cache / colour-validation boundary in `mcp-server/`, not geocoding, highlighting, theming,
    or poster compositing — so the example was not regenerated; confirmed unchanged via `git log` on
    the file, last touched at commit `433e7ea` in Round 3).
    Individual votes:
    - domain-correctness: PASS — Đo pixel trực tiếp trên ảnh 1080×1920 (đúng khung tiktok): marker pin
      nằm ở (~541, 959), lệch tâm ảnh (540, 960) dưới 1px cả hai trục — vị trí highlight gần như chính
      giữa khung hình. Pin trắng tương phản mạnh với nền xanh navy (midnight-blue) nên rất dễ đọc, và
      lưới đường/tile phủ kín toàn khung liên tục, không có ô trống, seam lỗi hay artifact vỡ tile; toạ
      độ in trên ảnh (10.7759°N, 106.6894°E) nằm hợp lý trong Quận 3, khớp địa chỉ Võ Văn Tần được yêu
      cầu. Cả ba yếu tố của AC-12 (căn giữa, highlight rõ, tile/đường không vỡ) đều được thể hiện rõ
      ràng trong evidence nên ảnh dùng được làm B-roll.
    - operational-feasibility: PASS — Pixel check confirms 1080×1920 (tiktok) with the pin's anchor tip
      landing within ~2px of true image center, so the location is centered essentially exactly; the
      white marker reads with strong contrast against the midnight-blue basemap and is clearly legible.
      Cropped strips across tile-boundary regions (horizontal and vertical, full frame) show continuous
      road/building line work with no seams, gaps, or missing-tile artifacts, so the frame is
      operationally usable as video B-roll.
    - spec-alignment: PASS — Pixel-level check confirms the PNG is exactly 1080x1920 (tiktok format)
      and the white point-marker sits essentially dead-center (centroid x=540.8/1080, tip y~959/1920 vs
      frame center 540/960), with strong white-on-midnight-blue contrast making the highlight clearly
      legible. A full-image color scan found a coherent, continuous amber road grid and building fills
      with no blank/missing-tile patches or void regions, so tiles/roads render without breakage and
      the still reads as clean, usable vertical B-roll.
  human_override:
  # ^ Still required before this item can become a direct human PASS — and, since overall verdict is
  # PENDING-JUDGMENT, before overall PASS. This contract's risk_tier T3 mandates a direct human verdict
  # on EVERY judgment eval, regardless of the panel's proposal. This item has now carried an unfilled
  # override across all 8 rounds; open evidence/E12-example.png yourself (unchanged since Round 3) to
  # resolve it.

## Analyst

Eval ids green-on-both (HEAD `8fbdbfa` AND the pre-feature `diffBase` tree), via the shared `npm test`
command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged from Rounds 1–7): all these assertions live in `mcp-server/src/*.test.ts` (plus
the VN-geocoding additions in `src/lib/geocoding.test.ts`), and the entire `mcp-server/` package is
net-new code introduced by this feature branch — on the `diffBase` tree those files do not exist at
all, so `npm test` there collects nothing under `mcp-server/`, a vacuous pass rather than a genuine
behavior-equivalence pass. This is the first round since Round 1 to make substantial changes inside
`mcp-server/` itself (`deps.ts`, `browserPool.ts`, `geocode.ts`, `resolveConfig.ts`, `tools.ts`,
`renderFrame.ts`, plus 19 new tests across 4 test files), but the A/B comparison still runs against the
SAME pre-feature `diffBase`, which predates the package wholesale — so the root cause is unchanged: there
is still no OLD version of `mcp-server/` for this round's new/changed assertions to discriminate against,
only its absence. Gate 2 human should confirm the `diffBase` used for this A/B run actually predates
`mcp-server/` (expected) rather than a mis-resolved base that happens to already contain this code — the
same confirmation asked of Rounds 1–7.

`npm run test:e2e` and `npm run test:mcp` are not listed here: neither is assigned to any eval in this
round's machine-results map (`evals: []` for both), so they are outside this section's scope by
definition — they appear only as corroborating text inside the E1/E5/E10 blocks above.

## Variance

none — every eval this round is deterministic, single run (1/1); no flaky/racy variance observed across
the captured commands (`npm test`, `npm run test:e2e`, `npm run test:mcp`, `ui-check:E10` each exited 0
on their one recorded run this round). This is a different axis from the `## Analyst` non-discriminating
finding above and from the one test-quality caveat noted inside E4's evidence block (`a cache hit
refreshes recency` passes on old AND new code, because an unbounded map never evicts either) — neither
of those is a re-run variance/flakiness signal; both are one-shot, deterministic, 0-exit runs that are
merely weak or non-discriminating on the specific axis being measured, not inconsistent across runs.

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
- Round 6 (verified 2026-07-10T11:10:00Z, commit `f320b41`): Round 5's verify passed 12/12 evals
  again (E12's panel re-proposing PASS) but surfaced 2 MEDIUM findings on the HTTP/static boundary —
  this being the 5th round in a row to escalate, the human (manh) set an explicit termination rule
  instead of another plain scoped-round authorisation (`decisions.jsonl` `d-20260710T110500Z-47001`):
  land these two fixes, run one more verify, then proceed to Gate 2 regardless of further MED/LOW
  findings — reasoning that adversarial review of a real codebase always returns *something* at
  MED/LOW, so "any finding ⇒ another round" never terminates; only a confirmed HIGH would reopen the
  loop. Implementation closed both (`d-20260710T110500Z-47002`, `d-20260710T110500Z-47003`): MEDIUM #1
  via an explicit `appHost` config field (`MAPPOSTER_APP_HOST`, default `127.0.0.1`) threaded into
  `appServer.listen()` — previously `listen(cfg.appPort, resolve)` put the callback where the host
  argument belongs, so Node silently bound every interface on every deployment; a new
  `appServer.test.ts` asserts the default is loopback and a LAN address is refused, failing on
  pre-fix source. MEDIUM #2 via a byte-counting `maxBytes` cap (default 8 MiB,
  `MAPPOSTER_HTTP_MAX_BODY`) in `readJsonBody`, answering 413 before the process can OOM, checked
  against both a declared oversized `Content-Length` and an undeclared/chunked stream; 5/5 new tests
  fail on pre-fix source. `evals.yaml`'s E6 `expected` text was strengthened again, additively, to
  name both behaviours. All 11 machine-mapped evals still pass, now **160 passed | 2 skipped** (up
  from 153 | 2 in Round 5 — exactly the 3 new `appServer.test.ts` cases + 4 new body-cap cases in
  `http.test.ts`); E10's dedicated ui-check re-confirms exact 1080×1920 output and no onboarding
  (independently re-run against a Hanoi/noir config, deliberately different from the repo's own e2e
  fixture); E12's panel re-affirms PASS (3/3 lenses) against the still-unchanged
  `evidence/E12-example.png` (untouched since Round 3). **This round's `npm run test:e2e` run,
  however, surfaced a NEW, unassigned failure**: `e2e/mapposter.spec.ts:114:1 "markers: drop a marker
  on the map"` timed out waiting for `.marker-list li` to reach count 1, while the other 7 of 8 e2e
  specs — including the AC-10 corroborating `render-mode.spec.ts` — passed. This spec is not mapped to
  any of the 12 acceptance criteria, and round 6's own diff never touched it or any app/e2e source
  (`git diff ffb928b f320b41 -- e2e/ src/` is empty — only `mcp-server/src/appServer.ts`,
  `mcp-server/src/http.ts`, `mcp-server/config.ts`, their tests, `evals.yaml`, and `README.md`
  changed); Round 5 ran the identical command 8/8 green. Because the human's termination rule
  (`d-20260710T110500Z-47001`) was scoped to *review findings* (MED/LOW vs. HIGH), not to a straight
  command failure, and because `failed_evals` legitimately stays empty (no AC itself regressed) while
  a previously-green spec is now red and unexplained, the round is graded **REJECT** rather than
  sliding into Gate 2 on the strength of the termination rule — an unexplained regression cannot be
  waved through by an agreement that was about a different axis (review-finding severity). A fresh
  adversarial pass this round (commit `f320b41`) surfaced 2 NEW findings tracked in
  `review-findings.md` — 1 MEDIUM (the renderer's pooled-page abstraction has no way to evict or
  replace a crashed/dead page: `createResourcePool.release` unconditionally returns the resource to
  `idle`, so one Chromium/page crash poisons that pool slot for the process lifetime, and
  `makeRenderDeps` memoizes the pool so a fully-dead browser is never rebuilt either) and 1 LOW (the
  long-running HTTP server's geocode caches — `locCache`, `boundaryCache`, `countryCache` — are plain
  `Map`s with no TTL/eviction/max-size, so a hosted deployment fielding many distinct place/region
  names grows resident memory without bound); neither is HIGH, neither is a machine-eval regression
  (all 12 evals above are still green on their own), and per the termination rule neither would by
  itself have blocked Gate 2 — the actual blocker this round is the unassigned e2e failure above,
  which must be triaged (re-run for reproducibility/flakiness; root-cause if it reproduces) in Round 7
  before evidence can be certified clean.
- Round 7 (verified 2026-07-10T12:20:00Z, commit `10750cbb`): Round 6's blocker — the unassigned
  `npm run test:e2e` failure on `e2e/mapposter.spec.ts:114:1 "markers: drop a marker on the map"` —
  was investigated, per the human's own escalation note (`decisions.jsonl` `d-20260710T121500Z-48001`),
  rather than dismissed as flake: it failed at 38.6s under the full suite but passed at 1.9s
  standalone, a load-sensitive signature consistent with a real race, not noise. Root cause, in
  `src/components/MapView.tsx` (`d-20260710T121500Z-48002`): four effects (style rebuild, fly-to,
  interactions, marker placement) gated on `readyRef.current`, a **ref** — refs cannot schedule a
  re-render, so any state that arrived *before* the map's `load` event (a marker icon chosen early, a
  highlight region, a new location) was silently and permanently dropped, since the gating effect
  itself never ran again once `load` fired; only a machine slow enough to lose the race against `load`
  ever observed it. Fix: `ready` became `useState`, added to every affected effect's dependency array.
  That surfaced a second, self-inflicted bug (`d-20260710T121500Z-48003`): letting the fly-to effect
  re-run on `ready` would re-fly to `location` on every reload, discarding a user's panned camera, so
  it was guarded to fire only on an actual `location` change — but the guard's own regression test
  passed even with the guard removed (non-discriminating), so the fix was verified by measuring
  `flyTo`'s real arguments instead of trusting the test: `flyTo` WAS called with the correct target
  center, yet the camera never moved, because the interactions effect runs immediately after and
  unconditionally called `setBearing(0)`/`setPitch(0)`, each internally invoking `map.stop()` and
  killing the in-flight animation at t=0 — so picking a city before tiles finished loading stranded the
  map on its previous position. Fix: those resets now only fire when bearing/pitch are actually
  non-zero. Three new e2e specs were added (`d-20260710T121500Z-48004`), each independently verified to
  **fail** on the pre-fix source: the crosshair never appears (placement never arms) when tiles are
  artificially delayed; a city picked before load lands 104.3° off target instead of being flown to; a
  reload flies back to `location` instead of preserving a panned camera (0.150° drift measured
  pre-fix). `npm run test:e2e` is now **11/11 green** (up from 7 passed / 1 failed of 8 total in Round
  6); `npm test` is unchanged at **160 passed | 2 skipped** and `npm run test:mcp` unchanged at 2
  passed, since this round touched no file under `mcp-server/` (confirmed via
  `git diff f320b41 10750cbb -- mcp-server/`, empty) — only `e2e/mapposter.spec.ts` and
  `src/components/MapView.tsx`. E10's dedicated ui-check re-confirms exact 1080×1920 output and no
  onboarding against a freshly chosen Đà Nẵng/ocean-theme config, deliberately different from the
  repo's own fixture and every prior round's probe config; E12's panel re-affirms PASS (3/3 lenses)
  against the still-unchanged `evidence/E12-example.png` (untouched since Round 3 — this round's fix
  touched map-camera/ready-effect wiring, not poster compositing or point-highlight rendering). With
  all 12 evals green and no unassigned command failure, the overall verdict returns from REJECT to
  **PENDING-JUDGMENT** — not PASS, because `risk_tier: T3` still mandates a direct human
  `human_override` on E12 regardless of the panel's proposal, not yet supplied across any of the 7
  rounds so far. A fresh adversarial pass this round (commit `10750cbb`) surfaced 4 findings for
  `review-findings.md`: 2 carried forward unchanged from Round 6 (MEDIUM — the render pool never
  evicts a dead/crashed pooled page and a dead pool is never rebuilt; LOW — the geocode caches have no
  eviction/TTL/max-size), already accepted as risk under the human's Round-6 termination rule
  (`d-20260710T110500Z-47001`, reaffirmed `d-20260710T121500Z-48005`); 2 are NEW (LOW —
  `highlight.color` is the one discrete visual parameter that reaches `innerHTML` on the headless
  render page with no format validation at the Zod boundary, unlike `theme`/`format`/`chrome`/
  `pointIcon`; MEDIUM — `makeRenderDeps`'s lazy `ensure()` memoizes a **rejected** promise, so a single
  transient startup failure bricks rendering for the rest of the process's life with no self-recovery).
  None of the 4 is HIGH, none is a machine-eval regression; per the Round-6 termination rule none
  blocks Gate 2 on its own — they carry forward as informational items for the human's review.
- Round 8 (verified 2026-07-10T15:10:00Z, commit `8fbdbfa`): Round 7 reached PENDING-JUDGMENT with all
  12 evals green but 4 open findings (2 MEDIUM, 2 LOW), none HIGH — under the human's Round-6
  termination rule (`d-20260710T110500Z-47001`) these did not by themselves require another round. The
  human (manh) chose to fix all 4 anyway before shipping, alongside two unrelated repository changes —
  making the MapPoster GitHub repo public and committing `.mcp.json` — which together moved
  `verified_commit` off `10750cbb`, requiring this fresh S4 verify (`d-20260710T150500Z-50001`).
  Implementation closed all 4 (`d-20260710T150500Z-50002` through `-50005`): MEDIUM #1 (deps.ts
  memoized a rejected startup promise) via a new `memoizeSuccess()` helper that drops the memo on
  rejection so the next caller retries, plus dead-browser detection (`pool.healthy()`) that resets the
  memo and rebuilds the runtime rather than resolving the same corpse forever — `makeRenderDeps` now
  also accepts an injectable `start` param so tests don't need a real browser. MEDIUM #2 (a
  crashed/dead pooled page was always returned to `idle`) via `Pool.discard(item)` + `Pool.healthy()`:
  `discard` frees the slot, destroys the resource, and mints a replacement for anyone queued behind it
  (rejecting the waiter if the factory itself is broken, instead of hanging it forever); `close()` now
  rejects parked waiters instead of abandoning them; `renderFrame`'s `finally` now calls `discard` when
  the render threw and `release` only when it succeeded. LOW #3 (`highlight.color` reached `innerHTML`
  unchecked) via a `hexColor` regex at the Zod boundary in `tools.ts` AND `assertColor()` at runtime in
  `resolveConfig.ts` (the boundary can be bypassed when `makeTools` is called directly) — verified
  through a live MCP session: a `"/><img src=x onerror=alert(1)>` payload and the bare word `"red"` are
  both refused, `"#e8b04b"` renders; `assertTheme`/`assertColor` were also moved to run BEFORE
  `resolveLocation`, so a bad theme or colour no longer spends a Nominatim request first. LOW #4
  (unbounded geocode caches) via a bounded LRU (`CACHE_MAX`, env `MAPPOSTER_GEO_CACHE_MAX`, default 500)
  across `locCache`/`boundaryCache`/`countryCache`; `boundaryCache` deliberately keeps its `has()` check
  because `null` is a valid cached answer ("this region truly has no polygon"), distinct from "not yet
  cached". `evals.yaml`'s E5 and E9 `expected` text was strengthened again, additively, to name this
  round's new behaviour (`d-20260710T150500Z-50007`), consistent with the Round 5/6 pattern. `npm test`
  is now **179 passed | 2 skipped (181)** (up from 160 | 2 in Round 7 — +19 new tests: 6 in a new
  `deps.test.ts`, 8 in `browserPool.test.ts`'s new discard/health coverage plus a `renderFrame`-discard
  spec, 2 in `geocode.test.ts`'s new bounded-cache describe, 3 in `resolveConfig.test.ts`'s new
  colour-validation tests); `npm run test:e2e` unchanged at 11/11 green and `npm run test:mcp` unchanged
  at 2 passed, since neither `e2e/` nor any app-render source changed this round (confirmed via
  `git diff 10750cbb 8fbdbfa`, empty for both). The implementer's own honesty note
  (`d-20260710T150500Z-50006`) is carried into this report rather than smoothed over: most of the 19 new
  tests are red on pre-fix source only because the new exports (`memoizeSuccess`, `assertColor`,
  `discard`, `CACHE_MAX`) do not exist there yet — a weak discriminator — while the actual `??=`-
  memoized-rejection bug was independently proven with a live Node repro outside the test suite; and one
  new test, `geocode.test.ts:317` "a cache hit refreshes recency, so a hot key is never evicted", is
  itself non-discriminating (it passes on the pre-fix unbounded `Map` too, since an unlimited cache
  trivially never evicts anything) — it guards the new LRU's recency logic going forward, not the fixed
  bug. E10's dedicated ui-check re-confirms exact 1080×1920 output and no onboarding against a freshly
  chosen **Hội An / sandstone-theme** config — deliberately different from the repo's own fixture and
  every prior round's own probe config (Hà Nội/noir rounds 3-6, Đà Nẵng/ocean round 7). E12's judge
  panel re-affirms PASS (3/3 lenses) against the still-unchanged `evidence/E12-example.png` (untouched
  since Round 3; this round's fixes touched render-pool/deps-init/geocode-cache/colour-validation
  internals, not poster compositing or point-highlight rendering). Overall verdict remains
  PENDING-JUDGMENT — T3 still mandates a direct human `human_override` on E12, not yet supplied across
  any of the 8 rounds so far. A fresh adversarial pass this round (commit `8fbdbfa`) confirmed all 4 of
  Round 7's findings are closed (source-verified against the diff above) and surfaced exactly 1 NEW
  finding for `review-findings.md` — LOW: inline `highlight.regions[].geojson` is accepted as `z.any()`
  with no structural validation at the MCP boundary (`tools.ts:115`), the one remaining unbounded input
  at this boundary now that colour/theme/format/chrome/dims are all guarded; impact is bounded
  (consumed as data, not an eval/innerHTML/shell sink, and downstream numeric guards + the render-mode
  idle-timeout error path contain the blast radius). Zero HIGH findings for the third round running
  (Rounds 6-8); per the human's termination rule a single LOW does not reopen the loop, so this round
  advances cleanly to Gate 2.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks (E10's 3-frame slideshow — evidence/E10-step1.png
      → step2.png → step3.png — is a good one to open; it's a fresh Hội An/sandstone config, not a
      replay)
- [ ] Personally verify judgment item **E12** (AC-12) — the panel proposes PASS (3/3 lenses) against
      `evidence/E12-example.png` (unchanged since Round 3, commit `433e7ea`) — then fill its
      `human_override: <name> <date>` line. This contract's `risk_tier: T3` mandates a direct human
      verdict on EVERY judgment item regardless of the panel's proposal (hook-enforced); E12 has now
      carried an unfilled override across all 8 rounds
- [ ] Review the 1 item in `review-findings.md` — LOW (inline `highlight.regions[].geojson` accepted as
      `z.any()` with no shape validation at the MCP boundary, `mcp-server/src/tools.ts:115`). All 4
      findings carried from Rounds 6-7 (dead pooled page never evicted/rebuilt; unbounded geocode
      caches; unvalidated `highlight.color` reaching `innerHTML`; a rejected startup promise memoized
      forever) are now CLOSED this round — confirmed via source diff. Decide whether this new LOW is
      accepted as risk, ticketed for later, or sent back for a Round 9 fix
- [ ] Once E12's `human_override` is filled: upgrade `verdict` to `PASS` (this write is when the hook
      re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in `contract.md` only once the
      verdict reaches PASS
