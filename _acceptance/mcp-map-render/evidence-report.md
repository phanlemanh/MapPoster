---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 10750cbb36894e5f7c79814db0fbeeb5f87c4f7d
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 7 — verified 2026-07-10T12:20:00Z (UTC) at commit `10750cbb` on `feature/mcp-map-render`._

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

> **PENDING-JUDGMENT — every eval is green; this round resolves Round 6's blocker.** All 11
> machine-mapped evals (E1–E9, E11 via `npm test`; E10 via a dedicated `ui-check` run) exited 0 this
> round, and E12's judge panel again proposes PASS (3/3 lenses). The verdict is PENDING-JUDGMENT
> rather than PASS for exactly one reason, unchanged since Round 1: this contract's `risk_tier: T3`
> mandates a direct human verdict on **every** judgment item regardless of the panel's proposal
> (hook-enforced), and E12's `human_override` has not yet been supplied — now unfilled across all 7
> rounds. Rounds 1–5 each held this same PENDING-JUDGMENT state for this same reason; Round 6 was the
> only round graded REJECT, and only because of a separate, unassigned `npm run test:e2e` failure
> unrelated to any acceptance criterion — root-caused and fixed this round (commit `10750cbb`), with
> the full e2e suite now 11/11 green.

## Evidence

_This round verifies commit `10750cbb` — one commit ahead of Round 6's `f320b41`. Round 6 was graded
REJECT not because any acceptance criterion failed (all 11 machine evals plus E12's panel were
green) but because a separate, unassigned command — `npm run test:e2e` — failed on
`e2e/mapposter.spec.ts:114:1 "markers: drop a marker on the map"`, a spec Round 6's own diff never
touched. Per the human's escalation record (`decisions.jsonl` `d-20260710T121500Z-48001`), this was
investigated rather than re-run away as flake (it failed at 38.6s under the full suite but passed at
1.9s standalone — a load-sensitive signature, not proof of flakiness on its own) and traced to two
real bugs in `src/components/MapView.tsx` (`d-20260710T121500Z-48002`, `-48003`):

1. Four of `MapView`'s effects (style rebuild, fly-to, interactions, marker placement) gated on
   `readyRef.current` — a **ref**, which cannot schedule a re-render. Any state that arrived
   *before* the map's `load` event — a marker icon chosen early, a highlight region, a new location
   — was silently and permanently dropped, because the gating effect itself never re-ran once `load`
   fired. On a fast dev machine the map always won this race, so only a loaded-and-waiting test box
   ever observed the drop — exactly the load-sensitivity Round 6 measured. Fix: `ready` is now
   `useState`, added to every affected effect's dependency array.
2. Making the fly-to effect re-run on `ready` would re-fly to `location` on every reload, discarding
   the user's panned camera — so it was guarded to fire only when `location` actually changes
   (`flownToRef`, seeded at mount). But the regression test written for *that* guard passed even with
   the guard removed — a non-discriminating test — so the fix was verified by measurement, not trust:
   `flyTo` WAS being called with the correct target center, yet the camera never moved. Root cause:
   the interactions effect runs immediately after and unconditionally called
   `setBearing(0)`/`setPitch(0)`, each of which internally calls `map.stop()`, cancelling the
   in-flight animation at t=0 — so picking a city before the tiles finished loading stranded the map
   on its previous position (Paris, in the reproduction). Fix: those resets now only fire when
   bearing/pitch are actually non-zero.

Three new e2e specs were added to `e2e/mapposter.spec.ts` (`d-20260710T121500Z-48004`), each
independently verified to **fail** against the pre-fix source: the crosshair cursor never appears
when an icon is chosen while tiles are artificially delayed (placement never arms); a city picked
before load lands 104.3° away from the target instead of being flown to; a reload flies back to
`location` instead of preserving a camera the user had panned to (measured drift 0.150° pre-fix vs.
an expected <0.05°). `e2e/mapposter.spec.ts` now carries 10 tests (7 pre-existing + 3 new);
`e2e/render-mode.spec.ts` is unchanged at 1 — **`npm run test:e2e` is now 11/11 green** (up from 7
passed / 1 failed of 8 total in Round 6). Confirmed via `git diff f320b41 10750cbb` that this fix
touched only `e2e/mapposter.spec.ts` and `src/components/MapView.tsx`; **no file under
`mcp-server/` changed**, so every E1–E9/E11 assertion below is the identical `it()` under test as
Round 6, and `npm test`'s aggregate is unchanged at **160 passed | 2 skipped**. `npm run test:mcp`
(the gated integration check, real build + real headless browser) is unchanged at 2 passed. E10's
dedicated `ui-check` run independently re-verified exact 1080×1920 output and no onboarding against a
**freshly chosen Đà Nẵng / ocean-theme** config — deliberately different from both the repo's own
`e2e/render-mode.spec.ts` fixture (HCMC / midnight-blue) and every prior round's own probe config
(Hanoi / noir, Rounds 3–6) — so this is not a replay of cached evidence. E12's judge panel
re-affirms PASS (3/3 lenses) against the still-unchanged `evidence/E12-example.png` (untouched since
Round 3, commit `433e7ea` — confirmed via `git log`; this round's fix touched map-camera/ready-effect
wiring, not poster compositing or point-highlight rendering, so there was nothing in this fix that
would change that fixture). Separately, a fresh adversarial pass this round (commit `10750cbb`)
surfaced 4 findings for `review-findings.md`: 2 are carried forward unchanged from Round 6 (MEDIUM —
the render pool never evicts a dead/crashed pooled page, and a dead pool is never rebuilt; LOW — the
long-running HTTP server's geocode caches have no eviction/TTL/max-size), already accepted as risk
under the human's Round-6 termination rule (`d-20260710T110500Z-47001`, reaffirmed
`d-20260710T121500Z-48005`); 2 are NEW (LOW — `highlight.color` is the one discrete visual parameter
that reaches `innerHTML` on the headless render page with no format validation at the Zod boundary,
unlike `theme`/`format`/`chrome`/`pointIcon`, all of which refuse bad input; MEDIUM —
`makeRenderDeps`'s lazy `ensure()` memoizes a **rejected** promise via `started ??= (...)()`, so a
single transient startup failure — e.g., a port already in use, a flaky `chromium.launch()` — bricks
`render_map`/`render_variants` for the rest of the process's life, with no self-recovery). None of the
4 is HIGH, none is a machine-eval regression (all 12 evals above are independently green); per the
Round-6 termination rule, neither the carried-forward pair nor the two new findings blocks Gate 2 on
their own — they are informational for the human's review below._

- eval: E1
  run_id: minted-mcp-map-render-E1-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged this round — round 7's diff touched only e2e/mapposter.spec.ts and
    src/components/MapView.tsx; `git diff f320b41 10750cbb -- mcp-server/` is empty):
    mcp-server/src/resolveConfig.test.ts:105 "geocodes the location and picks the format size (AC-1)";
    mcp-server/src/tools.test.ts:59 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG (AC-1,
    AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  12:12:02
       Duration  9.42s (transform 38ms, setup 0ms, import 965ms, tests 8.15s, environment 242ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/resolveConfig.test.ts:37 "anchors every highlight
    to the country of the location being rendered", :52 "names the anchor country when a region
    cannot be found in it", :59 "looks the country up when location is coordinates, which carry
    none", :71 "fails closed when the country at those coordinates cannot be determined", :78 "does
    not pay for a country lookup when no highlight is resolved by name", :122 "region highlight →
    boundary geojson + fitted camera (AC-2)", :146 "throws when a requested region has no boundary —
    never silently drops it (F2)"; mcp-server/src/tools.test.ts:116 "region with no boundary →
    structured error, not a silently unhighlighted poster (F2 / AC-2)"; mcp-server/src/geocode.test.ts:119
    "reverse-geocodes the country and caches a positive answer", :126 "never caches a failed lookup —
    reverseGeocode returns null for an outage too" (shared with E4), :166 "routes a region through the
    same canonicalisation + city guard as a point, then looks up the exact entity", :180 "rejects a
    region hit that lands outside the city the query named", :214 "rejects a transient failure at the
    polygon lookup and never caches it (R2-HIGH)", :242 "refuses a region in the wrong country, even
    with a real polygon", :264 "allows a region whose country matches the anchor, and one with no
    country at all", :281 "keys the cache on the anchor country, so one lookup cannot poison another",
    :290 "caches a definitive 'no such region' (ok response, no result)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/resolveConfig.test.ts:114 "point highlight →
    marker + street-level zoom 14–17 (AC-3)"; :136 "explicit camera zoom overrides auto-framing".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/geocode.test.ts:21 "caches identical queries and
    misses on different ones (AC-4)"; :96 "serializes concurrent upstream calls and spaces them
    (F3/F6)"; :126 "never caches a failed lookup — reverseGeocode returns null for an outage too"
    (shared with E2, extends the never-memoize-a-transient-failure guarantee to the country-anchor
    lookup).
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/tools.test.ts:126 "renders one image per variant
    (AC-5)"; :132 "a variant cannot smuggle out-of-range values past the boundary guard (R2-MEDIUM)";
    mcp-server/src/renderFrame.test.ts:51 "a reused pooled page renders each config fresh, never a
    stale frame (F1 / AC-5)"; mcp-server/src/browserPool.test.ts:5 "never creates more than `size`
    resources under concurrent acquires (F5)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)
    Corroborating (integration depth, real build + real headless browser, covers the F1 stale-frame
    regression): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  12:12:02
       Duration  9.42s (transform 38ms, setup 0ms, import 965ms, tests 8.15s, environment 242ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged this round — carried from Round 6, which closed the app-server bind + body
    cap gaps): mcp-server/src/appServer.test.ts:29 "defaults to loopback", :33 "is not reachable from
    the LAN by default", :50 "can be opened deliberately"; mcp-server/src/http.test.ts:89 "413s an
    oversized body rather than buffering it", :105 "rejects a body over the cap instead of buffering
    it to OOM", :110 "counts bytes across chunks — a chunked body declares no Content-Length", :115
    "lets a body at the limit through"; mcp-server/src/transports.test.ts:9 describe("transports
    expose the same tool set (AC-6)") — "lists all tools over stdio" at :10, "lists all tools over
    HTTP" at :23; mcp-server/src/http.test.ts:9 "accepts a server-to-server call: loopback Host, no
    Origin", :15 "refuses a rebound Host even though the socket is loopback", :20 "refuses any request
    carrying an unknown Origin", :71 "403s a rebound Host and an unknown Origin before any tool is
    dispatched", :122 "decodes multibyte UTF-8 split across chunk boundaries (R2-LOW)", :136 "handles
    an inline GeoJSON payload spread over many chunks".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() ref (unchanged): mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path
    + base64 + dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged): mcp-server/src/resolveConfig.test.ts:19 "resolves tiktok to 1080×1920 and
    passes custom dims through"; :28 "rejects non-positive, non-integer and oversized custom dims
    (F4)"; :153 "enforces coordinate/zoom bounds at runtime, not only in Zod (R2-MEDIUM)";
    mcp-server/src/tools.test.ts:88 "custom format dims flow through (AC-8)"; :167 "list_formats
    includes tiktok 1080×1920 (AC-8)"; :132 "a variant cannot smuggle out-of-range values past the
    boundary guard (R2-MEDIUM)" — shared with E5, closes the "rejected in both render_map and
    render_variants" half of this eval's expectation.
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged): mcp-server/src/resolveConfig.test.ts:141 "chrome defaults to clean, poster
    is honored (AC-9)"; :87 "rejects an unknown theme instead of silently rendering the default"; :95
    "summarizes each resolved region so the caller can tell which one it got";
    mcp-server/src/tools.test.ts:94 "chrome defaults clean, poster honored (AC-9)"; :143 "placeName
    overrides the geocoder-derived poster label"; :149 "without placeName the geocoder label is
    used"; :81 "returns a structured error for an unknown theme rather than a default-themed poster";
    :68 "echoes the resolved theme and highlights, per the tool contract".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E10
  run_id: verifier-mcp-map-render-E10-20260710T051927Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-10T12:20:00Z
  screenshot: evidence/E10-step1.png
  observed: |
    Opened all 3 saved evidence frames with Read (real bytes just written by my own independent
    script this round, config = Da Nang / ocean theme / 1080x1920 / chrome:clean — deliberately
    different place+theme than both the repo's own e2e/render-mode.spec.ts fixture (HCMC/midnight-
    blue) and every prior verify round's probe config (Hanoi/noir), so this is not a replay of cached
    evidence):

    E10-step1.png (540x960, PNG RGB, 8014 bytes): solid dark navy/teal background (the 'ocean'
    theme's base fill) with only a thin attribution strip pinned to the bottom reading "© OpenStreetMap
    contributors · OpenMapTiles · OpenFreeMap · MapLibre". Zero dialogs, zero search boxes, zero
    city-picker UI, zero buttons/overlays anywhere in the frame — visually confirms "no onboarding
    modal visible". Captured immediately after page.goto('/render.html?config=...', waitUntil:'load'),
    matching DOM assertions taken at the same instant: .onboard-overlay count=0, .poster-frame
    visible=true. This is the "config-load" stage.

    E10-step2.png (540x960, PNG RGB, 477288 bytes): now a fully painted vector map in the ocean theme
    (cyan/teal line work on dark navy) — a large body of water top-left (Đà Nẵng Bay), the Hàn River
    curving through the middle-right with visible bridges crossing it, and a distinctive long
    rectangular runway shape center-left (Da Nang International Airport) — all consistent with the Da
    Nang coordinates (108.2022, 16.0544) my independently-built resolved config specified. Page is
    visibly alive and correctly rendered (not blank, not an error page, not crashed), captured right
    after `await window.__mapposter.ready` then `renderFrame()` executed in-page — this is the
    "render" stage.

    E10-step3.png (measured 1080x1920 by three independent methods: renderFrame()'s own returned
    {width,height} JS object = 1080/1920; my script's own byte-level PNG IHDR parser reading the
    decoded dataUrl bytes = 1080/1920; and, run separately from my script, macOS `file` → "PNG image
    data, 1080 x 1920, 8-bit/color RGBA, non-interlaced" and `sips -g pixelWidth -g pixelHeight` →
    pixelWidth:1080 / pixelHeight:1920 — this is the literal decoded bytes of renderFrame()'s dataUrl,
    not a page screenshot): the same Da Nang scene (bay, river, airport runway, street grid) at full
    target resolution and higher fidelity, PNG RGBA 8-bit, 1634247 bytes, with the OSM/OpenMapTiles/
    OpenFreeMap/MapLibre attribution baked into the composed image itself — this is the "dims" stage,
    and the frame content matches the numeric assertion (1080 wide x 1920 tall, no cropping/stretching
    artifacts, no blank canvas).

    None of the 3 frames contradict Expected; all corroborate it: config-load shows no onboarding
    chrome, render shows a live correctly-geolocated map, dims shows an exact-size, non-blank PNG.
  output: |
    Killed only the dev server this run started (PID 9897 npm + 9921 vite child, parent/child
    relationship confirmed via `ps` before killing; port 5173 was confirmed free before I started it,
    so nothing pre-existing was touched). Port 5173 confirmed free after kill. Removed the temporary
    verification script (.e10-verify-tmp.mjs). No orphan vite/playwright/chromium processes remain
    (`ps -ef | grep -iE "vite|playwright|chromium.*headless"` empty). `git status --short` shows only
    the 3 regenerated evidence PNGs changed (E10-step1/2/3.png, sizes shifted because this round used
    a fresh Da Nang/ocean config rather than replaying a cached one) — no source, config, or script
    files touched.

    ALL ASSERTIONS PASS. exitCode=0. Matches Expected in full: "exit 0; render-mode headless: no
    onboarding, ready resolves, renderFrame() PNG is exactly 1080×1920; frames show config-load ->
    render -> dims" AND "the full e2e suite (11 tests) must pass, including: marker placement armed by
    an icon chosen BEFORE the map load event; a city picked before load is actually flown to (not
    stranded by map.stop()); a reload keeps the panned camera" (all 3 named behaviours verified green
    above, on two independent runs).

    Corroborating: the general `npm run test:e2e` command (not itself eval-mapped — evals: [] in this
    round's machine-results map) is now 11/11 green (up from 7 passed / 1 failed of 8 total in Round
    6), and that gain is exactly the 3 new specs this round added to close Round 6's blocker —
    "markers: an icon chosen before the map loads still arms placement", "a city picked before the map
    loads is actually flown to, not cancelled", "reload keeps the camera the user panned to, rather
    than flying back to the location" — plus the pre-existing "markers: drop a marker on the map" (the
    spec that broke in Round 6) itself now green too. Corroborating (integration depth, real build +
    real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  12:12:02
       Duration  9.42s (transform 38ms, setup 0ms, import 965ms, tests 8.15s, environment 242ms)

- eval: E11
  run_id: minted-mcp-map-render-E11-r7
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T12:20:00Z
  output: |
    it() refs (unchanged): mcp-server/src/tools.test.ts:101 "ungeocodable input → structured error, no
    throw (AC-11)"; :107 "invalid custom dims → structured error, never renders a blank PNG (F4 /
    AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  12:12:03
       Duration  2.21s (transform 660ms, setup 0ms, import 3.43s, tests 941ms, environment 10.36s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context
    each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur), re-run this round against the unchanged
    `evidence/E12-example.png` (this round's fix touched only the map's ready-state/camera-flight
    effect wiring in `src/components/MapView.tsx` and the interactive-app e2e coverage in
    `e2e/mapposter.spec.ts` — not geocoding, highlighting, theming, or poster compositing — so the
    example was not regenerated; confirmed unchanged via `git log` on the file, last touched at
    commit `433e7ea` in Round 3).
    Individual votes:
    - domain-correctness: PASS — Đo pixel trên ảnh 1080×1920 (đúng khổ tiktok): đầu neo của pin trắng
      nằm tại (~540, ~959), lệch chưa tới 1px so với tâm khung (540, 960) — vị trí được căn giữa chính
      xác, và pin tương phản rõ, dễ đọc trên nền midnight-blue. Quét mật độ pixel đường (màu cam) theo
      từng dải ngang 96px và dọc 108px trên toàn khung đều >6000px/dải, không dải nào rỗng hay thiếu
      tile — lưới đường, nhà, và nút giao phức tạp ở góc dưới phải hiển thị liền mạch, không đứt
      gãy/hư hỏng. Cả ba tiêu chí của AC-12 (căn giữa, highlight dễ đọc, tile/đường không vỡ) đều được
      minh chứng rõ ràng bằng bằng chứng hình ảnh, đủ dùng làm B-roll.
    - operational-feasibility: PASS — Đo pixel trực tiếp trên ảnh 1080×1920 (đúng target tiktok) cho
      thấy đầu nhọn của pin highlight nằm tại (539.5, 959.5), lệch tâm khung (540, 960) chưa tới 1px —
      căn giữa gần như tuyệt đối. Marker trắng có tương phản cao, rõ nét trên nền midnight-blue kể cả
      khi zoom cận cảnh; kiểm tra alpha (toàn khung opaque, không mảng trống) và phân tích seam theo
      hàng/cột không phát hiện tile vỡ hay gián đoạn bất thường ngoài dải chữ caption, và cận cảnh bùng
      binh/giao lộ cho thấy đường render liền mạch, sắc nét. Với cả ba tiêu chí của AC-12 (căn giữa,
      highlight rõ, tile/đường không vỡ) đều có bằng chứng đo được cụ thể, ảnh sẵn sàng dùng làm B-roll
      ở nguyên trạng.
    - spec-alignment: PASS — Ảnh đúng kích thước tiktok 1080×1920; đo pixel cho thấy đầu ghim (điểm neo
      của highlight) lệch chưa tới 1px so với tâm ảnh (540,960) và neo đúng vào giao lộ đường phố —
      khớp "location correctly centered". Ghim trắng đặc, viền sắc nét, tương phản rất cao với nền navy
      tối (midnight-blue) nên "highlight legible" rõ ràng. Lưới đường/tòa nhà liền mạch toàn khung,
      alpha=255 đồng nhất, không có ô màu phẳng bất thường theo lưới tile hay chữ vỡ (đã zoom kiểm tra
      nhãn và attribution) — không thấy dấu hiệu breakage.
  human_override:
  # ^ Still required before this item can become a direct human PASS — and, since overall verdict is
  # PENDING-JUDGMENT, before overall PASS. This contract's risk_tier T3 mandates a direct human
  # verdict on EVERY judgment eval, regardless of the panel's proposal. This item has now carried an
  # unfilled override across all 7 rounds; open evidence/E12-example.png yourself (unchanged since
  # Round 3) to resolve it.

## Analyst

Eval ids green-on-both (HEAD `10750cbb` AND the pre-feature `diffBase` tree), via the shared
`npm test` command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged from Rounds 1-6): all these assertions live in `mcp-server/src/*.test.ts` and
`src/lib/geocoding.test.ts`, and the entire `mcp-server/` package plus the VN-geocoding additions in
`src/lib/geocoding.ts` are net-new code introduced by this feature branch. On the `diffBase` tree
those files/branches most plausibly do not exist yet, so `npm test` has nothing to collect (or
nothing new to exercise) there — a vacuous pass, not a genuine behavior-equivalence pass. This round
changed no file under `mcp-server/` at all (the fix lived entirely in `src/components/MapView.tsx`
and `e2e/mapposter.spec.ts`, outside this A/B command's own mcp-server-only assertion set), so there
is no new slice to assess and no change to this section's status from Round 6 — a continuation of the
Round-1 through Round-6 finding, not a new gap. Gate 2 human should confirm the `diffBase` used for
this A/B run actually predates `mcp-server/` and the VN-geocoding changes to `src/lib/geocoding.ts`
(expected) rather than a mis-resolved base that happens to already contain this code.

`npm run test:e2e` and `npm run test:mcp` are not listed here: neither is assigned to any eval in this
round's machine-results map (`evals: []` for both), so they are outside this section's scope by
definition — they appear only as corroborating text inside the E1/E5/E10 blocks above.

## Variance

none — every eval this round is deterministic, single run (1/1); no flaky/racy variance observed
across the captured commands (`npm test`, `npm run test:e2e`, `npm run test:mcp`, `ui-check:E10` each
exited 0 on their one recorded run this round). This is a change from Round 6, where `npm run
test:e2e` had failed on its one recorded run — that failure is root-caused and fixed this round (see
`## Evidence` above and the Round 7 entry in `## Iterations` below), so there is nothing outstanding
to flag here.

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

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks (E10's 3-frame slideshow — evidence/E10-step1.png
      → step2.png → step3.png — is a good one to open; it's a fresh Đà Nẵng/ocean config, not a replay)
- [ ] Personally verify judgment item **E12** (AC-12) — the panel proposes PASS (3/3 lenses) against
      `evidence/E12-example.png` (unchanged since Round 3, commit `433e7ea`) — then fill its
      `human_override: <name> <date>` line. This contract's `risk_tier: T3` mandates a direct human
      verdict on EVERY judgment item regardless of the panel's proposal (hook-enforced); E12 has now
      carried an unfilled override across all 7 rounds
- [ ] Review the 4 items in `review-findings.md`: 2 carried forward from Round 6 as accepted risk per
      the human's termination rule (`d-20260710T110500Z-47001`) — MEDIUM (dead pooled page never
      evicted/rebuilt) and LOW (unbounded geocode caches) — plus 2 new this round — LOW
      (`highlight.color` unsanitized into `innerHTML`) and MEDIUM (a rejected startup promise in
      `deps.ts` is memoized forever, bricking rendering after one transient failure). None are HIGH and
      none are machine-eval regressions; decide whether to accept as risk, ticket for later, or send
      back for a Round 8 fix
- [ ] Once E12's `human_override` is filled: upgrade `verdict` to `PASS` (this write is when the hook
      re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in `contract.md` only once the
      verdict reaches PASS
