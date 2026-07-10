---
schema_version: 2
feature_slug: mcp-map-render
verdict: REJECT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f320b41cd8f2a4887e06f4abc651df9bbb03901a
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 6 — verified 2026-07-10T11:10:00Z (UTC) at commit `f320b41` on `feature/mcp-map-render`._

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
| E12 | AC-12 | judgment | PENDING — panel proposes PASS (T3 requires human_override; moot this round, see below) |

> **REJECT — not an AC failure.** Every acceptance-criterion eval above is individually green this
> round (E1–E11 machine-verified exit 0; E12's judge panel proposing PASS 3/3). The overall verdict
> is REJECT because a separate, unassigned command — `npm run test:e2e` — exited 1 on a spec this
> round's diff never touched: `e2e/mapposter.spec.ts:114:1 "markers: drop a marker on the map"`,
> which was green (8/8) in Round 5. `failed_evals` stays `[]` per the actual data — no AC regressed —
> but an unexplained newly-red spec cannot ride to Gate 2 unaddressed. See "Unassigned command
> failure" under `## Evidence` below.

## Evidence

_This round verifies commit `f320b41` — the tip of `feature/mcp-map-render`, produced after Round
5's verify passed all 12/12 evals (E12's panel again proposing PASS) but surfaced 2 MEDIUM findings,
both on the HTTP/static boundary: the app-static server (`appServer.ts`) bound every network
interface unconditionally regardless of the MCP HTTP transport's own loopback-by-default policy, and
`readJsonBody` read an unbounded request body into memory behind a Host/Origin check a
server-to-server caller can forge. This was the 5th verify round in a row to escalate rather than
auto-continue, so the human (manh) set an explicit termination rule this time instead of another
plain scoped-round authorisation (`decisions.jsonl` `d-20260710T110500Z-47001`): land these two
fixes, run one more verify, then proceed to Gate 2 regardless of further MED/LOW findings — only a
confirmed HIGH (a wrong render or a real compromise) would reopen the loop. Implementation closed
both (`d-20260710T110500Z-47002`, `d-20260710T110500Z-47003`): MEDIUM #1 by giving `ServerConfig` an
`appHost` field (`MAPPOSTER_APP_HOST`, default `127.0.0.1`) and passing it explicitly to
`appServer.listen()` — previously `listen(cfg.appPort, resolve)` put the resolve callback where the
host argument belongs, so Node silently bound `::` (every interface) on both the stdio and the HTTP
deployment; a new `appServer.test.ts` asserts the default is loopback and that a LAN address is
refused, failing on the pre-fix source with "expected 200 to be refused". MEDIUM #2 by giving
`readJsonBody` a `maxBytes` cap (default 8 MiB, `MAPPOSTER_HTTP_MAX_BODY`) that counts bytes as
chunks land (a chunked body declares no `Content-Length`, so this is the only real bound), destroys
the socket and throws a dedicated `PayloadTooLargeError` the handler turns into a 413 — checked both
up front (a declared oversized `Content-Length`) and while streaming; 5 of 5 new tests fail on
pre-fix source. `evals.yaml`'s E6 `expected` text was strengthened again, additively, to name both
behaviours (commit `f320b41`). All 11 machine-mapped evals still pass, now **160 passed | 2
skipped** (up from 153 | 2 in Round 5 — the 7-test delta is exactly the 3 new `appServer.test.ts`
cases plus 4 new cap-related cases in `http.test.ts`); E10's dedicated `ui-check` re-confirms exact
1080×1920 output and no onboarding, run independently against a Hanoi/noir 1080×1920 config
deliberately different from the repo's own `e2e/render-mode.spec.ts` fixture; E12's panel re-affirms
PASS (3/3 lenses) against the still-unchanged `evidence/E12-example.png` (untouched since Round 3,
commit `433e7ea`). **However**, this round's `npm run test:e2e` run surfaced a NEW, unassigned
failure — detailed immediately below — that is the actual reason this round is graded REJECT rather
than PENDING-JUDGMENT. Separately, a fresh adversarial pass this round (commit `f320b41`) surfaced 2
NEW findings tracked in `review-findings.md` — 1 MEDIUM (the render pool never evicts or replaces a
crashed/dead pooled page, and `makeRenderDeps` memoizes the pool so a fully-dead browser is never
rebuilt either) and 1 LOW (the long-running HTTP server's geocode caches have no TTL/eviction/max-
size) — neither HIGH, neither a machine-eval regression, and per the human's termination rule
neither would by itself have blocked Gate 2._

### Unassigned command failure (drives this round's REJECT)

`npm run test:e2e` exited **1** this round. Of its 8 specs, 7 passed and 1 failed:

```
1) [chromium] › e2e/mapposter.spec.ts:114:1 › markers: drop a marker on the map ──────────────────

  Error: expect(locator).toHaveCount(expected) failed

  Locator:  locator('.marker-list li')
  Expected: 1
  Received: 0
  Timeout:  5000ms

1 failed
  [chromium] › e2e/mapposter.spec.ts:114:1 › markers: drop a marker on the map
7 passed (38.6s)
```

cmd: `npm run test:e2e` · exit_code: 1 · evals: none (not mapped to any current AC/eval) · runs: 1 ·
baseline: n-a · run_id: none minted (this is not a tracked eval; `evidence_required` does not apply,
and none was logged to `run-log.jsonl`).

This spec (`e2e/mapposter.spec.ts:114`, "markers: drop a marker on the map") clicks the map canvas
after picking the "heart" marker icon and asserts `.marker-list li` reaches count 1 within 5000ms; it
never does. It is **not** mapped to any of the 12 acceptance criteria — it exercises the interactive
marker-drop panel of the pre-existing MapPoster UI, not this feature's MCP server or render-mode
surface. It is also **not touched by this round's diff**: `git diff ffb928b f320b41 -- e2e/ src/` is
empty — Round 6 only changed `mcp-server/src/appServer.ts`, `mcp-server/src/http.ts`,
`mcp-server/config.ts`, their tests, `_acceptance/mcp-map-render/evals.yaml`, and `README.md`. Round
5 ran this identical command with all 8 specs green (see Round 5 entry in `## Iterations` below).
The corroborating AC-10 spec (`e2e/render-mode.spec.ts:15:1`) is unaffected and is among the 7 that
passed this round — E10's own dedicated `ui-check:E10` run (below) independently confirms the same.

Per the template: "REJECT — ≥1 eval failed... failing honestly is always legal." `failed_evals`
correctly stays `[]` because no acceptance criterion itself regressed (every eval below is
independently green), but a previously-green spec turning red, unexplained, cannot be waved through
by the human's Round-6 termination rule — that rule was scoped to *review-finding* severity
(MED/LOW vs. HIGH), not to a straight command failure. This must be triaged (re-run for
reproducibility/flakiness; root-cause if it reproduces) before the round can be certified clean.

- eval: E1
  run_id: minted-mcp-map-render-E1-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
  output: |
    it() refs (unchanged this round — round 6's diff touched only mcp-server/src/appServer.ts,
    mcp-server/src/http.ts, mcp-server/config.ts and their tests):
    mcp-server/src/resolveConfig.test.ts:105 "geocodes the location and picks the format size (AC-1)";
    mcp-server/src/tools.test.ts:59 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG (AC-1,
    AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  11:02:11
       Duration  9.41s (transform 22ms, setup 0ms, import 404ms, tests 8.72s, environment 232ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
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
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/resolveConfig.test.ts:114 "point highlight →
    marker + street-level zoom 14–17 (AC-3)"; :136 "explicit camera zoom overrides auto-framing".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/geocode.test.ts:21 "caches identical queries and
    misses on different ones (AC-4)"; :96 "serializes concurrent upstream calls and spaces them
    (F3/F6)"; :126 "never caches a failed lookup — reverseGeocode returns null for an outage too"
    (shared with E2, extends the never-memoize-a-transient-failure guarantee to the country-anchor
    lookup).
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
  output: |
    it() refs (unchanged this round): mcp-server/src/tools.test.ts:126 "renders one image per variant
    (AC-5)"; :132 "a variant cannot smuggle out-of-range values past the boundary guard (R2-MEDIUM)";
    mcp-server/src/renderFrame.test.ts:51 "a reused pooled page renders each config fresh, never a
    stale frame (F1 / AC-5)"; mcp-server/src/browserPool.test.ts:5 "never creates more than `size`
    resources under concurrent acquires (F5)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)
    Corroborating (integration depth, real build + real headless browser, covers the F1 stale-frame
    regression): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  11:02:11
       Duration  9.41s (transform 22ms, setup 0ms, import 404ms, tests 8.72s, environment 232ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
  output: |
    NEW this round (closes Round-5 MEDIUM #1 + MEDIUM #2 — appServer bound every interface
    unconditionally; readJsonBody had no size cap): mcp-server/src/appServer.test.ts:29 "defaults to
    loopback", :33 "is not reachable from the LAN by default", :50 "can be opened deliberately";
    mcp-server/src/http.test.ts:89 "413s an oversized body rather than buffering it", :105 "rejects a
    body over the cap instead of buffering it to OOM", :110 "counts bytes across chunks — a chunked
    body declares no Content-Length", :115 "lets a body at the limit through" (7 new tests total —
    matches the 153→160 delta this round).
    Carried from Rounds 2-5, unchanged: mcp-server/src/transports.test.ts:9 describe("transports
    expose the same tool set (AC-6)") — "lists all tools over stdio" at :10, "lists all tools over
    HTTP" at :23; mcp-server/src/http.test.ts:9 "accepts a server-to-server call: loopback Host, no
    Origin", :15 "refuses a rebound Host even though the socket is loopback", :20 "refuses any request
    carrying an unknown Origin", :71 "403s a rebound Host and an unknown Origin before any tool is
    dispatched", :122 "decodes multibyte UTF-8 split across chunk boundaries (R2-LOW)", :136 "handles
    an inline GeoJSON payload spread over many chunks".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
  output: |
    it() ref (unchanged): mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path
    + base64 + dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
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
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
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
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E10
  run_id: verifier-mcp-map-render-E10-20260710T040941Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-10T11:10:00Z
  screenshot: evidence/E10-step1.png
  observed: |
    Opened all 3 saved evidence frames with Read (real bytes just written by my own independent
    Playwright script this run, config = Hanoi/noir/1080x1920 — deliberately different place+theme
    than the repo's own e2e/render-mode.spec.ts fixture, to prove this isn't a replay):

    E10-step1.png (540x960, PNG RGB, 7223 bytes — byte-identical to the prior committed version, git
    shows no diff on this file specifically): near-solid black background with only a thin
    attribution strip pinned to the bottom reading "© OpenStreetMap contributors · OpenMapTiles ·
    OpenFreeMap · MapLibre". Zero dialogs, zero search boxes, zero city-picker UI, zero
    buttons/overlays anywhere in the frame — visually confirms "no onboarding modal visible". Taken
    immediately after page.goto('/render.html?config=...', waitUntil:'load'), BEFORE ready/renderFrame
    ran — this is the "config-load" stage. Matches DOM assertions captured at the same instant:
    .onboard-overlay count=0, .poster-frame visible=true.

    E10-step2.png (540x960, PNG RGB, 451450 bytes): now a fully painted monochrome vector map (noir
    theme: near-black background, white/light-gray line work) — West Lake (Hồ Tây) top-left, the Red
    River curving along the right edge, a dense Old-Quarter-style street grid center, a bright
    arterial highway bottom — all consistent with the Hanoi coordinates (105.8342, 21.0278) my
    independently-built resolved config specified. Same attribution strip at the bottom. Page is
    visibly alive and correctly rendered (not blank, not an error page, not crashed), taken right
    after `await window.__mapposter.ready` then `renderFrame()` executed in-page — this is the
    "render" stage.

    E10-step3.png (measured 1080x1920 by three independent methods: renderFrame()'s own returned
    {width,height} object; my script's own byte-level PNG IHDR parser; macOS `file` AND `sips -g
    pixelWidth -g pixelHeight` — this is the literal decoded bytes of renderFrame()'s dataUrl, not a
    page screenshot, since a page screenshot at this point would look visually identical to step2):
    the same Hanoi scene at full target resolution and higher fidelity (lake, river, street grid,
    highway), PNG RGBA 8-bit, 1548174 bytes, with the OSM/OpenMapTiles/OpenFreeMap/MapLibre
    attribution baked into the composed image's bottom-right corner (composePoster's canvas overlay)
    — this is the "dims" stage, and the frame content itself matches the numeric assertion (1080 wide
    x 1920 tall, no cropping/stretching artifacts, no blank canvas).

    None of the 3 frames contradict Expected; all corroborate it.

    Independently re-opened all 3 frames again while writing this report (fresh Read, this round):
    step1 is the same near-solid black frame with only the attribution strip and zero onboarding
    chrome, confirmed 540x960; step2 is the same noir monochrome Hanoi map (West Lake, Red River,
    Old-Quarter grid, arterial highway), also 540x960; step3 is the same scene at a confirmed
    1080x1920 with the attribution baked into the image itself. Nothing in any image contradicts the
    description above.
  output: |
    Dedicated ui-check run (3 required steps + screenshots: evidence/E10-step1.png, E10-step2.png,
    E10-step3.png).

    Cleanup: removed 2 temporary verification scripts (.e10-verify-tmp.mjs,
    .e10-localstorage-check.mjs) from repo root after use; moved the raw JSON result log out of the
    repo into the session scratchpad rather than leaving it under _acceptance/. Final `git status
    --short` shows only the two evidence PNGs that actually changed content (E10-step2.png,
    E10-step3.png); E10-step1.png is byte-identical to the previously-committed frame (both this run
    and the prior round hit the same deterministic pre-paint noir-background frame at
    waitUntil:'load', so git shows zero diff on it) — no source/config files touched, no code
    modified.

    All assertions per Expected ("exit 0; render-mode headless: no onboarding, ready resolves,
    renderFrame() PNG is exactly 1080×1920; frames show config-load → render → dims") PASS.
    exitCode=0.

    Corroborating automated spec (same verifier command, `npm run test:e2e` — one of the 7 specs that
    passed this round; the 1 failure this round is the unrelated, unassigned `mapposter.spec.ts`
    marker-drop test, see "Unassigned command failure" above): e2e/render-mode.spec.ts:15:1 "render
    mode: headless renderFrame yields exact target dims, no onboarding (AC-10)" — passed.

    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  11:02:11
       Duration  9.41s (transform 22ms, setup 0ms, import 404ms, tests 8.72s, environment 232ms)

- eval: E11
  run_id: minted-mcp-map-render-E11-r6
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T11:10:00Z
  output: |
    it() refs (unchanged): mcp-server/src/tools.test.ts:101 "ungeocodable input → structured error, no
    throw (AC-11)"; :107 "invalid custom dims → structured error, never renders a blank PNG (F4 /
    AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  160 passed | 2 skipped (162)
       Start at  11:02:08
       Duration  2.40s (transform 854ms, setup 0ms, import 3.65s, tests 1.04s, environment 12.14s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context
    each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur), re-run this round against the unchanged
    `evidence/E12-example.png` (this round's fixes touched only the app-static server's bind host and
    the HTTP body-size cap — not geocoding, highlighting, or theming — so the example was not
    regenerated; confirmed unchanged via `git log` on the file, last touched at commit `433e7ea` in
    Round 3).
    Individual votes:
    - domain-correctness: PASS — Pixel measurement confirms the output is exactly 1080×1920 (tiktok)
      with the white point-highlight's anchor tip at (541, 959) — dead-center both horizontally and
      vertically — and it reads with strong white-on-navy contrast, so it is clearly legible. A
      block-variance scan across the full canvas found zero blank/uniform tiles and no edge gaps; the
      gold-on-navy road network stays continuous through a complex roundabout junction near Hồ Con
      Rùa, consistent with real Quận 3 geography, with no seams, glitches, or artifacts. All three
      AC-12 sub-criteria (centered, legible highlight, unbroken tiles/roads) are met, making the frame
      usable as static B-roll.
    - operational-feasibility: PASS — Pixel measurement confirms the pin's anchor tip sits at
      (~540, 959) against a 1080×1920 canvas whose exact center is (540, 960) — the point is centered
      to within ~1px. The white pin+dot marker has strong contrast against the midnight-blue basemap
      and reads clearly as a single highlighted point; roads, building footprints, the roundabout, and
      labels/attribution fill the frame edge-to-edge with no blank tiles, gaps, or rendering glitches
      visible. All three named sub-criteria (centering, highlight legibility, tile/road integrity) are
      satisfied by this single evidence frame, so it is usable as B-roll as presented.
    - spec-alignment: PASS — Ảnh đúng 1080×1920 (format tiktok), và phân tích pixel cho thấy đầu nhọn
      của pin (điểm neo tọa độ thực) nằm tại (~540, ~959) — gần như trùng khít tâm khung hình
      (540, 960), nên vị trí được canh giữa chính xác. Pin trắng với chấm đen tương phản mạnh trên nền
      xanh "midnight" nên highlight rõ ràng, dễ đọc. Lưới đường màu cam, khối nhà và vòng xuyến render
      liền mạch tới sát 4 cạnh/góc — quét pixel theo block 256px và 4 góc ảnh không phát hiện mảng
      tile trống, seam, hay artefact do xoay góc — nên không có dấu hiệu vỡ tile/road; cả 3 tiêu chí
      nêu trong AC-12 đều được đáp ứng rõ ràng.
  human_override:
  # ^ Still required before this item can become a direct human PASS — and, under a PASS/
  # PENDING-JUDGMENT overall verdict, before overall PASS. Moot for THIS round's grading, since the
  # overall verdict is already REJECT for a different reason (the unassigned e2e failure above), but
  # left open rather than filled so it carries forward honestly: T3 (contract.md) mandates a direct
  # human verdict on EVERY judgment eval, regardless of the panel's proposal. This item has now
  # carried an unfilled override across all 6 rounds; open evidence/E12-example.png yourself
  # (unchanged since Round 3) when the round finally reaches PASS/PENDING-JUDGMENT.

## Analyst

Eval ids green-on-both (HEAD `f320b41` AND the pre-feature `diffBase` tree), via the shared
`npm test` command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged from Rounds 1-5): all these assertions live in `mcp-server/src/*.test.ts` and
`src/lib/geocoding.test.ts`, and the entire `mcp-server/` package plus the VN-geocoding additions in
`src/lib/geocoding.ts` are net-new code introduced by this feature branch. On the `diffBase` tree
those files/branches most plausibly do not exist yet, so `npm test` has nothing to collect (or
nothing new to exercise) there — a vacuous pass, not a genuine behavior-equivalence pass. This round
added another slice of new coverage to E6 specifically (`mcp-server/src/appServer.test.ts` in full,
plus the 4 new body-cap cases in `mcp-server/src/http.test.ts`) that inherits the identical
vacuous-pass-on-`diffBase` status for the same reason — not a new gap, a continuation of the
Round-1 through Round-5 finding. Gate 2 human should confirm the `diffBase` used for this A/B run
actually predates `mcp-server/` and the VN-geocoding changes to `src/lib/geocoding.ts` (expected)
rather than a mis-resolved base that happens to already contain this code.

`npm run test:e2e` and `npm run test:mcp` are not listed here: neither is assigned to any eval in
this round's machine-results map (`evals: []` for both), so they are outside this section's scope by
definition — they appear only as corroborating text inside the E1/E5/E10 blocks above (`test:mcp`) or
as the dedicated subject of "Unassigned command failure" (`test:e2e`).

## Variance

none — every eval this round is deterministic, single run (1/1); no flaky/racy variance observed
across the captured commands (`npm test`, `npm run test:mcp`, `ui-check:E10` each exited 0 on their
one recorded run). `npm run test:e2e` exited 1 on its one recorded run, but it is not an eval (no
`runs`/`pass_rate` applies to it) and it was not re-run this round, so its single failure is reported
as-is under "Unassigned command failure" in `## Evidence` rather than here — a repeat run to check
reproducibility/flakiness is part of what Round 7 needs to do before re-verifying.

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

## Gate 2 checklist (human)

Not reached this round — verdict is REJECT, so nothing below is actionable yet. What Round 7 needs
to do first:

- [ ] Triage `e2e/mapposter.spec.ts:114:1 "markers: drop a marker on the map"` (timed out waiting for
      `.marker-list li` to reach count 1; 0 received). Re-run `npm run test:e2e` to check
      reproducibility. Round 6's own diff did not touch `e2e/`, `src/`, or the marker UI at all
      (confirmed via `git diff ffb928b f320b41`), so if it reproduces, the root cause is likely
      environmental (WebGL/canvas timing under SwiftShader, a race in the click-then-assert
      sequence) rather than this feature's own code — but that determination must be made
      explicitly, not assumed
- [ ] Once `npm run test:e2e` exits 0 end-to-end (8/8 specs), re-verify (Round 7) to regenerate a
      clean evidence report before this checklist becomes real
- [ ] The two Round-6 review findings (`review-findings.md`: MEDIUM — dead pooled page never
      evicted/replaced; LOW — unbounded geocode caches) are informational per the human's Round-6
      termination rule (`decisions.jsonl` `d-20260710T110500Z-47001`) and do NOT by themselves block
      Gate 2 — carry them forward as an accepted risk, or fold into a future round, at the human's
      discretion
- [ ] Once a future round reaches PASS/PENDING-JUDGMENT: personally verify judgment item **E12**
      (AC-12) — panel proposes PASS against `evidence/E12-example.png` (unchanged since Round 3) —
      and fill its `human_override` line with your name and date; this contract's `risk_tier: T3`
      requires a direct human verdict on every judgment item regardless of the panel's proposal, and
      E12 has now carried an unfilled override across all 6 rounds
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract.md only once the
      verdict reaches PASS
