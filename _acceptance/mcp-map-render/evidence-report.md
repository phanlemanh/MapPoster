---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: bc7aba2c6ff2dfa508c6d97924b806cda62b6c17
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 9 — verified 2026-07-10T18:10:00Z (UTC) at commit `bc7aba2` on `feature/mcp-map-render`._

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

> **PENDING-JUDGMENT — every eval is green; this round re-pins verified evidence to a new HEAD after an
> infrastructure-blocked first attempt, and surfaces the first HIGH review finding since Round 4.**
> All 11 machine-mapped evals (E1–E9, E11 via `npm test`; E10 via a dedicated `ui-check` run) exited 0
> this round, and E12's judge panel again proposes PASS (3/3 lenses). The verdict is PENDING-JUDGMENT
> rather than PASS for the same structural reason as every round since Round 1: this contract's
> `risk_tier: T3` mandates a direct human verdict on **every** judgment item regardless of the panel's
> proposal (hook-enforced), and Round 8's signoff on E12 (`manh`, PASS) was tied to commit `8fbdbfa` — it
> does not carry forward automatically to this round's freshly-pinned `verified_commit`. Separately, and
> not the reason for the verdict but squarely a Gate 2 concern: a fresh adversarial pass this round —
> against code that has **not changed** since Round 8 — surfaced 3 new findings, including 1 HIGH (a
> transport-layer mismatch that can silently break the region-highlight feature for realistic inputs).
> See `review-findings.md` and the Iterations entry below.

## Evidence

_This round exists to re-pin `verified_commit`, not to close a review finding or an acceptance gap. After
Round 8's Gate 2 signoff, acting on it surfaced a bug in the gate tooling itself: `pre-merge-check.sh`'s
final `recheck: strict` step — re-checking the COMMITTED evidence with the same code the hook runs — had
silently never executed in this repo, because `scripts/recheck-evidence.js` / `lib/evidence-core.js` are
CommonJS while the repo root declares `"type": "module"` (`decisions.jsonl` `d-20260710T171000Z-53001`).
Fixing it (`scripts/package.json` + `lib/package.json` declaring `{"type":"commonjs"}`, added rather than
editing kit-owned files — `d-20260710T171000Z-53002`) let `pre-merge-check` run end-to-end for the first
time, which in turn exposed that its `stale_files()` check compares every non-`**/*.md`,
non-`_acceptance/**` file against `verified_commit` — contrary to what the implementer had just told the
human (corrected the same round, `d-20260710T180500Z-54001`) — and it correctly flagged the 2 new
package.json files as post-verify drift. Rather than add `scripts/**, lib/**` to `t1_skip_globs` to
self-exempt the gate's own tooling, the decision was to run a fresh S4 verify and re-pin `verified_commit`
(`d-20260710T180500Z-54002`). No feature code changed to get here:
`git diff 8fbdbfae83731c60ee7c2a94d1ce1fbacebb6f10 bc7aba2c6ff2dfa508c6d97924b806cda62b6c17 --stat` touches
only `lib/package.json`, `scripts/package.json`, and `_acceptance/mcp-map-render/*` (report, cards,
evidence PNGs, decisions, run-log) — `mcp-server/`, `src/`, and `e2e/` are byte-identical to Round 8, so
every it()-reference below is unchanged from Round 8's evidence block, re-confirmed rather than
re-derived.

**This round's first verify attempt was infrastructure-BLOCKED, not a code verdict.** 5 of the pipeline's
12 sub-agents died on transport errors — `review:bugs` (`FailedToOpenSocket`), `review:conventions`,
`ui:E10`, `capture:provenance`, and `scribe:run-log` (all `ConnectionRefused`) — and because
`capture:provenance` returned nothing, the orchestrating script crashed (`null is not an object
(evaluating prov.enforcement_mode)`) before any verdict could be assigned (`d-20260710T190000Z-55001`).
The crash happened before the `scribe` step, so `evidence-report.md` was NOT overwritten by that attempt —
Round 8's file and its Gate 2 signature survived on disk untouched, and the attempt was recorded as
BLOCKED rather than downgraded to any verdict. The resume replayed the 7 agents that had already succeeded
from cache and re-ran exactly the 5 that died; this report is the product of that successful resume,
against the identical pinned tree (no source changed between the blocked attempt and this one). `npm
test`'s aggregate is unchanged at **179 passed | 2 skipped (181)**; `npm run test:e2e` unchanged at
**11/11**; `npm run test:mcp` unchanged at **2 passed** — all three expected, since nothing under any of
their scopes changed. E10's dedicated `ui-check` run independently re-verified exact 1080×1920 output and
no onboarding against a freshly chosen **Nha Trang / ruby** theme config — deliberately different from the
repo's own `e2e/render-mode.spec.ts` fixture (HCMC / midnight-blue) and every prior round's own probe
config (Hà Nội/noir rounds 3–6, Đà Nẵng/ocean round 7, Hội An/sandstone round 8) — so this is not a replay
of cached evidence; the PNG's IHDR was independently cross-checked with macOS `sips`, outside the
verifying script, and agreed exactly (1080×1920). E12's judge panel re-affirms PASS (3/3 lenses) against
the still-unchanged `evidence/E12-example.png` (confirmed unchanged in this round's diff too; last
regenerated at commit `433e7ea`, Round 3). Separately, a fresh adversarial pass this round — against code
that has not changed since Round 8 — surfaced exactly 3 NEW findings for `review-findings.md`: 1 HIGH (the
first since Round 4) — `RenderConfig` travels to the headless renderer inside a URL query param
(`renderFrame.ts:30`) but the internal app server never raises Node's default 16 KB header-size cap
(`appServer.ts`), while the MCP boundary itself accepts an 8 MiB body and inline region GeoJSON is
unbounded; measured live against Nominatim, the resolved boundary for `Ho Chi Minh City` alone is 20,320
base64 bytes (`Vietnam`: 155,316 bytes), both already over the 16 KB transport ceiling, so an in-spec
`render_map({ location: 'Vietnam', highlight: { regions: ['Ho Chi Minh City'] } })` stalls the renderer's
full 20 s timeout and then fails opaquely — the eval suite only ever exercises `Quận 3` (~500 B), so AC-11
never trips this. 1 MEDIUM — `Number(process.env...)` has no `NaN` guard (`http.ts:126`, and the same
pattern recurs for `CACHE_MAX` in `geocode.ts:23` and for `poolSize`/`appPort` in `config.ts`), so a
non-numeric env value silently disables the request-body DoS cap (or, for `poolSize`, deadlocks every
render) with no signal. 1 LOW — `makeRenderDeps`'s unconditional `ensure.reset()` call (`deps.ts:80`) can
evict and leak a freshly-rebuilt healthy runtime under a specific 3-render concurrent timing window,
because `memoizeSuccess`'s `reset()` (`deps.ts:34-36`) clears the memo unconditionally instead of only
when the current attempt is still cached, unlike its own internal failure-path guard. None of the 3 sits
on code that changed this round — they are new discoveries on old code, not new regressions — and none is
a machine-eval regression (all 12 evals above are independently green). The HIGH is a genuine tension with
the human's own Round-6 termination rule (`d-20260710T110500Z-47001`, "only a confirmed HIGH would reopen
the loop"): unlike Rounds 6–8, which carried forward only MEDIUM/LOW risk, this round's finding is
squarely HIGH severity and sits in this feature's headline region-highlight path — see the Gate 2
checklist below._

- eval: E1
  run_id: minted-mcp-map-render-E1-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — `git diff 8fbdbfa bc7aba2 -- mcp-server/ src/ e2e/` is empty; this round
    re-pins verified_commit after a gate-tooling-only change (lib/package.json, scripts/package.json),
    not a feature change (see Iterations). Same it() refs as Round 8:
    mcp-server/src/resolveConfig.test.ts:128 "geocodes the location and picks the format size (AC-1)";
    mcp-server/src/tools.test.ts:59 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG (AC-1, AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  18:04:36
       Duration  8.97s (transform 32ms, setup 0ms, import 465ms, tests 8.24s, environment 210ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — no file under mcp-server/src/{resolveConfig,tools,geocode}.ts or their
    tests changed this round (`git diff 8fbdbfa bc7aba2 -- mcp-server/`, empty). Same it() refs as Round
    8: mcp-server/src/resolveConfig.test.ts:37 "anchors every highlight to the country of the location
    being rendered", :52 "names the anchor country when a region cannot be found in it", :59 "looks the
    country up when location is coordinates, which carry none", :71 "fails closed when the country at
    those coordinates cannot be determined", :78 "does not pay for a country lookup when no highlight is
    resolved by name", :145 "region highlight → boundary geojson + fitted camera (AC-2)", :169 "throws
    when a requested region has no boundary — never silently drops it (F2)"; mcp-server/src/tools.test.ts
    :116 "region with no boundary → structured error, not a silently unhighlighted poster (F2 / AC-2)";
    mcp-server/src/geocode.test.ts:119 "reverse-geocodes the country and caches a positive answer", :126
    "never caches a failed lookup — reverseGeocode returns null for an outage too" (shared with E4), :166
    "routes a region through the same canonicalisation + city guard as a point, then looks up the exact
    entity", :180 "rejects a region hit that lands outside the city the query named", :214 "rejects a
    transient failure at the polygon lookup and never caches it (R2-HIGH)", :242 "refuses a region in the
    wrong country, even with a real polygon", :264 "allows a region whose country matches the anchor, and
    one with no country at all", :281 "keys the cache on the anchor country, so one lookup cannot poison
    another", :290 "caches a definitive 'no such region' (ok response, no result)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — mcp-server/src/resolveConfig.test.ts did not change this round. Same it()
    refs: :137 "point highlight → marker + street-level zoom 14–17 (AC-3)"; :159 "explicit camera zoom
    overrides auto-framing".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — mcp-server/src/geocode.test.ts did not change this round. Same it() refs:
    :21 "caches identical queries and misses on different ones (AC-4)"; :96 "serializes concurrent
    upstream calls and spaces them (F3/F6)"; :126 "never caches a failed lookup — reverseGeocode returns
    null for an outage too" (shared with E2); :299 "evicts the least-recently-used entry instead of
    growing without limit" (bounded LRU, added Round 8); :317 "a cache hit refreshes recency, so a hot key
    is never evicted" — still flagged non-discriminating per Round 8's own honesty note
    (decisions.jsonl d-20260710T150500Z-50006): it passes on the pre-Round-8 unbounded `Map` too.
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — mcp-server/src/{tools,renderFrame,browserPool,deps}.test.ts did not change
    this round. Same it() refs: mcp-server/src/tools.test.ts:126 "renders one image per variant (AC-5)";
    :132 "a variant cannot smuggle out-of-range values past the boundary guard (R2-MEDIUM)";
    mcp-server/src/renderFrame.test.ts:51 "a reused pooled page renders each config fresh, never a stale
    frame (F1 / AC-5)"; mcp-server/src/browserPool.test.ts's describe('createResourcePool: discarding a
    broken resource') (:4–:74, added Round 8) plus the pre-existing describe('createResourcePool')
    (:83–:128); mcp-server/src/deps.test.ts's describe('memoizeSuccess') (:9–:44) and
    describe('makeRenderDeps') (:54–:99, added Round 8). NOTE for Gate 2: this round's fresh adversarial
    pass found a new LOW on this exact area — `ensure.reset()` (deps.ts:80) can unconditionally clear a
    healthy runtime rebuilt by a concurrent render under a rare 3-render timing window (see
    review-findings.md); this is a gap in behaviour this eval set does not exercise (no test drives 3
    overlapping renders with a mid-flight browser death), not a regression in what IS tested.
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  18:04:36
       Duration  8.97s (transform 32ms, setup 0ms, import 465ms, tests 8.24s, environment 210ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — no file under the transport/http/app-server surface changed this round
    (`git diff 8fbdbfa bc7aba2 -- mcp-server/src/appServer.test.ts mcp-server/src/http.test.ts
    mcp-server/src/transports.test.ts`, empty). Same it() refs: mcp-server/src/appServer.test.ts:29
    "defaults to loopback", :33 "is not reachable from the LAN by default", :50 "can be opened
    deliberately"; mcp-server/src/http.test.ts:89 "413s an oversized body rather than buffering it", :105
    "rejects a body over the cap instead of buffering it to OOM", :110 "counts bytes across chunks — a
    chunked body declares no Content-Length", :115 "lets a body at the limit through", :9 "accepts a
    server-to-server call: loopback Host, no Origin", :15 "refuses a rebound Host even though the socket
    is loopback", :20 "refuses any request carrying an unknown Origin", :71 "403s a rebound Host and an
    unknown Origin before any tool is dispatched", :122 "decodes multibyte UTF-8 split across chunk
    boundaries (R2-LOW)", :136 "handles an inline GeoJSON payload spread over many chunks";
    mcp-server/src/transports.test.ts:9 describe("transports expose the same tool set (AC-6)") — "lists
    all tools over stdio" at :10, "lists all tools over HTTP" at :23. NOTE for Gate 2: this round's fresh
    adversarial pass found a new MEDIUM on this exact surface — `Number(process.env.MAPPOSTER_HTTP_
    MAX_BODY ?? DEFAULT_MAX_BODY_BYTES)` (http.ts:126) has no NaN guard, so a non-numeric env value
    silently disables the very body cap that :89/:105 above assert — none of this eval's tests set a
    malformed env value, so the gap is real and untested, not a contradiction of the green result above.
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — mcp-server/src/delivery.test.ts did not change this round. Same it() ref:
    :24 "mode=both writes a file and returns path + base64 + dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — mcp-server/src/{resolveConfig,tools}.test.ts did not change this round.
    Same it() refs: mcp-server/src/resolveConfig.test.ts:19 "resolves tiktok to 1080×1920 and passes
    custom dims through"; :28 "rejects non-positive, non-integer and oversized custom dims (F4)"; :176
    "enforces coordinate/zoom bounds at runtime, not only in Zod (R2-MEDIUM)"; mcp-server/src/
    tools.test.ts:88 "custom format dims flow through (AC-8)"; :167 "list_formats includes tiktok
    1080×1920 (AC-8)"; :132 "a variant cannot smuggle out-of-range values past the boundary guard
    (R2-MEDIUM)" (shared with E5).
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — mcp-server/src/{resolveConfig,tools}.test.ts did not change this round.
    Same it() refs: mcp-server/src/resolveConfig.test.ts:164 "chrome defaults to clean, poster is
    honored (AC-9)"; :87 "rejects an unknown theme instead of silently rendering the default"; :95
    "summarizes each resolved region so the caller can tell which one it got"; :105 "refuses a highlight
    colour that is not a hex colour"; :116 "accepts the hex forms a caller would actually use"; :121
    "rejects a bad colour BEFORE spending a geocoding request"; mcp-server/src/tools.test.ts:94 "chrome
    defaults clean, poster honored (AC-9)"; :143 "placeName overrides the geocoder-derived poster
    label"; :149 "without placeName the geocoder label is used"; :81 "returns a structured error for an
    unknown theme rather than a default-themed poster"; :68 "echoes the resolved theme and highlights,
    per the tool contract".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E10
  run_id: verifier-mcp-map-render-E10-20260710T124233Z
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-10T18:10:00Z
  screenshot: evidence/E10-step1.png
  observed: |
    Đọc trực tiếp cả 3 frame vừa lưu (Read tool, ảnh thật) + file PNG output riêng, đối chiếu Expected:

    - E10-step1.png (540×960, chụp NGAY sau navigate, trước khi renderFrame): poster-frame theme "ruby"
      (nền đỏ sẫm), KHÔNG có modal/overlay onboarding nào che màn hình — khớp "no onboarding modal
      visible". Map đang load dở: 2/3 trên còn là nền đỏ trơn (tile chưa kịp vẽ, vì tôi chỉ đợi 300ms
      trước khi chụp để bắt đúng trạng thái "vừa vào render-mode"), 1/3 dưới đã thấy đường bờ biển + lưới
      đường Nha Trang màu hồng/đỏ, có dòng attribution "© OpenStreetMap contributors · OpenMapTiles ·
      OpenFreeMap · MapLibre" ở đáy.
    - E10-step2.png (540×960, chụp NGAY sau khi `await api.ready; await api.renderFrame()` resolve): bản
      đồ đã vẽ ĐẦY ĐỦ — toàn bộ bờ biển, bán đảo, lưới đường Nha Trang hiện rõ từ trên xuống dưới, vẫn
      không có onboarding overlay. Khớp kỳ vọng "ready resolves" trước khi renderFrame chạy xong.
    - E10-step3.png (540×960, chụp sau khi assert dims): giống hệt bố cục step2 nhưng có thêm banner xanh
      lá phủ trên cùng, chữ trắng: "VERIFIER ASSERT renderFrame() PNG dims == 1080x1920 -> actual IHDR
      1080x1920 -> PASS" — banner này do chính script vẽ SAU khi đã đọc byte IHDR thật của PNG trả về,
      nên nó phản ánh kết quả assertion thật, không phải suy diễn.
    - evidence/E10-rendered-output.png (PNG THẬT do renderFrame() trả về, giải mã từ dataUrl, KHÔNG phải
      screenshot viewport): đã dùng `sips -g pixelWidth -g pixelHeight` (công cụ hệ điều hành, độc lập
      với script của tôi) đo lại — kết quả pixelWidth=1080, pixelHeight=1920, khớp chính xác Expected "PNG
      dimensions == 1080×1920". Đồng thời tự parse header IHDR (byte offset 16-23) trong script cũng cho
      đúng 1080×1920 — hai phép đo độc lập khớp nhau, không dựa vào field {width,height} do wrapper JS tự
      echo lại cfg.size (field đó chỉ là copy nguyên văn cfg.size trong main.tsx, không phải bằng chứng
      thật).

    Không có mâu thuẫn nào với Expected trong bất kỳ frame nào.
  output: |
    DỌN DẸP: rm .e10-verifier-tmp.mjs khỏi repo root; git status cuối chỉ còn 4 file evidence PNG bị
    modify (đúng ý đồ ghi đè evidence vòng này), không đụng source/test nào; server dev PID 20305 vẫn
    nguyên (không tắt, vì không phải server do tôi start).

    KẾT LUẬN: MỌI assertion pass, có bằng chứng máy-kiểm-được + đối chiếu 2 nguồn độc lập cho kích thước
    PNG + đọc lại từng frame ảnh thật khớp Expected + bộ e2e 11/11 pass thật (không phải log tái sử
    dụng). exitCode=0.

    Corroborating: `npm run test:e2e`:
          ✓  11 [chromium] › e2e/render-mode.spec.ts:15:1 › render mode: headless renderFrame yields
             exact target dims, no onboarding (AC-10) (1.3s)

      11 passed (35.1s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  18:04:36
       Duration  8.97s (transform 32ms, setup 0ms, import 465ms, tests 8.24s, environment 210ms)

- eval: E11
  run_id: minted-mcp-map-render-E11-r9
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-10T18:10:00Z
  output: |
    Unchanged since Round 8 — mcp-server/src/tools.test.ts did not change this round. Same it() refs:
    :101 "ungeocodable input → structured error, no throw (AC-11)"; :107 "invalid custom dims →
    structured error, never renders a blank PNG (F4 / AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  179 passed | 2 skipped (181)
       Start at  18:04:37
       Duration  2.07s (transform 1.17s, setup 0ms, import 4.79s, tests 1.05s, environment 8.72s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context
    each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur), re-run this round against the unchanged
    `evidence/E12-example.png` (confirmed unchanged in `git diff 8fbdbfa bc7aba2` — this round touched no
    rendering/compositing source; the only tree changes were gate-tooling package.json additions and
    _acceptance/ evidence/report files, per the Iterations entry below). Last regenerated at commit
    `433e7ea` (Round 3).
    Individual votes:
    - domain-correctness: PASS — Pixel-check confirms the canvas is exactly 1080×1920 and the white
      point-marker sits at (~541,931–958), essentially dead-center against true center (540,960) —
      location is correctly centered. The marker's high-contrast white glyph against the midnight-blue
      basemap is clearly legible, and a full-frame block scan found zero flat/blank regions — the amber
      road network and building fills form a continuous, seamless grid with no missing-tile or breakage
      artifacts; shown coordinates (10.7759°N, 106.6894°E) are also geographically consistent with Võ
      Văn Tần, Quận 3, HCMC. All three AC-12 sub-criteria (centering, legibility, unbroken tiles/roads)
      are clearly demonstrated by this single frame.
    - operational-feasibility: PASS — Pixel measurement confirms the PNG is exactly 1080×1920 (tiktok
      target) with the marker's anchor tip at (541,959) vs true center (540,960) — centered within 1px.
      The white pin renders crisp and high-contrast against the midnight-blue basemap (clearly legible),
      and an automated seam/placeholder scan plus zoomed crop inspection (corners, center, label band)
      found zero broken-tile artifacts: roads, building footprints, the roundabout, and all text labels
      render continuously with no gaps or flat placeholder blocks. Displayed coordinates (10.7759°N,
      106.6894°E) are geographically consistent with Võ Văn Tần, Quận 3, HCMC, so all three named
      sub-criteria are clearly demonstrated.
    - spec-alignment: PASS — Pixel analysis of E12-example.png shows the white point-marker's anchor tip
      at (539.7, 959) in a 1080×1920 frame — within 1px of dead-center (540, 960) — so the location is
      correctly centered; the marker is a high-contrast white/black icon clearly legible against the
      midnight-blue basemap. Roads and building footprints render as continuous, unbroken vector lines
      with no missing-tile/flat-block artifacts (scanned 256px grid found zero anomalies), and the frame
      matches the tiktok 1080×1920 target exactly, so the still reads as usable video B-roll.
  human_override:
  # ^ Required before this item can become a direct human PASS — and, since overall verdict is
  # PENDING-JUDGMENT, before overall PASS. This contract's risk_tier T3 mandates a direct human verdict
  # on EVERY judgment eval, regardless of the panel's proposal. Round 8's human_override (manh, PASS) was
  # tied to commit `8fbdbfa`; this round re-pins verified_commit to `bc7aba2` (a gate-tooling-only
  # re-verify, no rendering change), so per decisions.jsonl d-20260710T180500Z-54002 ("chữ ký phải áp lại
  # sau khi verify xong") the signature must be reapplied against this fresh pin.

## Analyst

Eval ids green-on-both (HEAD `bc7aba2` AND the pre-feature `diffBase` tree), via the shared `npm test`
command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged since Round 1): all these assertions live in `mcp-server/src/*.test.ts` (plus the
VN-geocoding additions in `src/lib/geocoding.test.ts`), and the entire `mcp-server/` package is net-new
code introduced by this feature branch — on the `diffBase` tree those files do not exist at all, so `npm
test` there collects nothing under `mcp-server/`, a vacuous pass rather than a genuine
behavior-equivalence pass. This round makes no change inside `mcp-server/` at all (`git diff 8fbdbfa
bc7aba2 -- mcp-server/` is empty — the only tree changes this round are gate-tooling package.json
additions and `_acceptance/` report/evidence files), so the non-discriminating status is unchanged from
Round 8 for the same reason. Gate 2 human should confirm the `diffBase` used for this A/B run actually
predates `mcp-server/` (expected) rather than a mis-resolved base that happens to already contain this
code — the same confirmation asked of Rounds 1–8.

`npm run test:e2e` and `npm run test:mcp` are not listed here: neither is assigned to any eval in this
round's machine-results map (`evals: []` for both), so they are outside this section's scope by
definition — they appear only as corroborating text inside the E1/E5/E10 blocks above.

## Variance

none — every eval this round is deterministic, single run (1/1); no flaky/racy variance observed across
the captured commands (`npm test`, `npm run test:e2e`, `npm run test:mcp`, `ui-check:E10` each exited 0 on
their one recorded run this round).

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
- Round 9 (verified 2026-07-10T18:10:00Z, commit `bc7aba2`): Triggered not by a review finding but by a
  bug in the gate tooling itself, found while acting on Round 8's Gate 2 signoff. `pre-merge-check.sh`'s
  final `recheck: strict` step — re-checking the COMMITTED evidence with the same code the hook runs —
  had silently never executed in this repo: `scripts/recheck-evidence.js` and `lib/evidence-core.js` are
  CommonJS, but the repo root declares `"type": "module"`, so Node threw `ReferenceError: require is not
  defined` the moment the check reached them; every earlier run had stopped at the
  `verdict=PENDING-JUDGMENT` violation first, so the broken step was never exercised until Round 8's
  signoff flipped the verdict to PASS (`decisions.jsonl` `d-20260710T171000Z-53001`). Fixed by adding
  `scripts/package.json` and `lib/package.json` declaring `{"type":"commonjs"}` rather than editing the
  kit-owned files a kit update would overwrite (`d-20260710T171000Z-53002`); `pre-merge-check` then ran
  end-to-end for the first time and reported clean. That surfaced a second problem: the implementer had
  told the human `verified_commit` only checks SHA format, not drift against HEAD — wrong, and corrected
  the same round (`d-20260710T180500Z-54001`): `pre-merge-check.sh` also runs `stale_files()`, which diffs
  every non-`**/*.md`, non-`_acceptance/**` file changed since `verified_commit`, and it had just
  correctly flagged the 2 new package.json files as post-verify drift. Rather than add `scripts/**,
  lib/**` to `t1_skip_globs` to self-exempt the gate's own tooling — loosening the exact control the
  process had just refused to loosen for the signature itself — the decision was to run a fresh S4 verify
  and re-pin `verified_commit` (`d-20260710T180500Z-54002`). No feature code changed to get here:
  `git diff 8fbdbfae83731c60ee7c2a94d1ce1fbacebb6f10 bc7aba2c6ff2dfa508c6d97924b806cda62b6c17 --stat`
  touches only `lib/package.json`, `scripts/package.json`, and `_acceptance/mcp-map-render/*` (report,
  cards, evidence PNGs, decisions, run-log) — `mcp-server/`, `src/`, and `e2e/` are byte-identical to
  Round 8.
  **This round's first verify attempt was infrastructure-BLOCKED, not a code verdict**: 5 of the
  pipeline's 12 sub-agents died on transport errors — `review:bugs` (`FailedToOpenSocket`),
  `review:conventions`, `ui:E10`, `capture:provenance`, and `scribe:run-log` (all `ConnectionRefused`) —
  and because `capture:provenance` returned nothing, the orchestrating script itself crashed (`null is
  not an object (evaluating prov.enforcement_mode)`) before any verdict could be assigned
  (`d-20260710T190000Z-55001`). The crash happened before the `scribe` step, so `evidence-report.md` was
  NOT overwritten — Round 8's file and its Gate 2 signature survived on disk untouched, and the attempt
  was explicitly recorded as BLOCKED rather than downgraded to any verdict. The resume replayed the 7
  agents that had already succeeded from cache and re-ran exactly the 5 that died; this report is the
  product of that successful resume, against the same pinned tree (no source changed between the blocked
  attempt and this one). All 12 evals are green again: `npm test` unchanged at **179 passed | 2 skipped
  (181)**, `npm run test:e2e` unchanged at **11/11**, `npm run test:mcp` unchanged at **2 passed** — all
  three expected, since no source under any of their scopes changed. E10's dedicated ui-check re-confirms
  exact 1080×1920 output and no onboarding against a freshly chosen **Nha Trang / ruby-theme** config —
  deliberately different from the repo's own fixture and every prior round's own probe config (Hà
  Nội/noir rounds 3–6, Đà Nẵng/ocean round 7, Hội An/sandstone round 8); the PNG's IHDR was independently
  cross-checked with `sips` outside the verifying script, both giving exactly 1080×1920. E12's judge panel
  re-affirms PASS (3/3 lenses) against the still-unchanged `evidence/E12-example.png` (confirmed unchanged
  in this round's diff too; last regenerated at commit `433e7ea`, Round 3) — but the panel's proposal is
  not a substitute for the mandatory human `human_override` this contract's `risk_tier: T3` requires on
  every judgment item: Round 8's signoff (`manh`, PASS) was tied to commit `8fbdbfa`, and per
  `d-20260710T180500Z-54002` ("chữ ký phải áp lại sau khi verify xong") that signature must be reapplied
  against this round's freshly-pinned `bc7aba2`, so the overall verdict is PENDING-JUDGMENT again, not
  PASS.
  **A fresh adversarial pass this round — against code that has not changed since Round 8 — surfaced 3
  NEW findings for `review-findings.md`, including the first HIGH since Round 4**: HIGH (`conventions`) —
  the entire resolved `RenderConfig` is shipped to the headless renderer inside a URL query param
  (`renderFrame.ts:30`), but the internal app server never raises Node's default 16 KB header-size cap
  (`appServer.ts`), while the MCP boundary itself accepts an 8 MiB body and inline region GeoJSON is
  unbounded — measured live against Nominatim, the resolved boundary for `Ho Chi Minh City` alone is
  20,320 base64 bytes (`Vietnam`: 155,316 bytes), both already over the 16 KB transport ceiling, so an
  in-spec `render_map({ location: 'Vietnam', highlight: { regions: ['Ho Chi Minh City'] } })` stalls the
  renderer's full 20 s timeout and then fails opaquely; the eval suite only ever exercises `Quận 3`
  (~500 B), so AC-11 never trips this. MEDIUM (`conventions`) — `Number(process.env...)` has no `NaN`
  guard (`http.ts:126`, and the same pattern recurs for `CACHE_MAX` in `geocode.ts:23` and for
  `poolSize`/`appPort` in `config.ts`), so a non-numeric env value silently disables the request-body DoS
  cap (or, for `poolSize`, deadlocks every render) with no signal. LOW (`bugs`) — `makeRenderDeps`'s
  unconditional `ensure.reset()` call (`deps.ts:80`) can evict and leak a freshly-rebuilt healthy runtime
  under a specific 3-render concurrent timing window, because `memoizeSuccess`'s `reset()` (`deps.ts:
  34-36`) clears the memo unconditionally instead of only when the current attempt is still cached,
  unlike its own internal failure-path guard. None of the 3 sits on code that changed this round — they
  are new discoveries on old code, not new regressions — and none is a machine-eval regression (all 12
  evals above are independently green). The HIGH is a genuine tension with the human's own Round-6
  termination rule (`d-20260710T110500Z-47001`, "only a confirmed HIGH would reopen the loop"): unlike
  Rounds 6–8, which carried forward only MEDIUM/LOW risk, this round's finding is squarely HIGH severity
  and sits in this feature's headline region-highlight path; whether to accept it as risk, ticket it, or
  send the feature back for a Round 10 fix is a decision for the human at Gate 2, not resolved by this
  verify pass.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks (E10's 3-frame slideshow — evidence/E10-step1.png
      → step2.png → step3.png — is a good one to open; it's a fresh Nha Trang/ruby-theme config, not a
      replay)
- [ ] Personally verify judgment item **E12** (AC-12) — the panel proposes PASS (3/3 lenses) against
      `evidence/E12-example.png` (unchanged since Round 3, commit `433e7ea`), then fill its
      `human_override: <name> <date>` line. Round 8's signoff (manh, PASS) was tied to commit `8fbdbfa`
      and does not carry over automatically: this round re-pins `verified_commit` to `bc7aba2` (a
      gate-tooling-only re-verify, per `decisions.jsonl` d-20260710T180500Z-54002), so the T3 mandate for
      a direct human verdict on EVERY judgment item applies fresh here too
- [ ] Review the 3 items in `review-findings.md` — **including 1 HIGH, the first since Round 4**: the
      resolved RenderConfig travels to the renderer as a URL query param, but the internal app server
      never raises Node's default 16 KB header cap, so realistic region-highlight/inline-GeoJSON payloads
      (measured live: 20,320 B for Ho Chi Minh City, 155,316 B for Vietnam) exceed it and the render
      stalls/fails opaquely — an in-spec call this eval suite never exercises. Also 1 MEDIUM (unguarded
      `Number(env)` silently disables the body-size DoS cap on misconfiguration) and 1 LOW (an
      unconditional pool-reset can leak a healthy runtime under a rare concurrent-render race). None of
      the 3 sits on code that changed this round — they are new findings on unchanged code. Per the
      human's Round-6 termination rule, only a confirmed HIGH reopens the loop; this round has one —
      decide whether to accept it as risk, ticket it, or send the feature back for a Round 10 fix
- [ ] Once E12's `human_override` is filled and the HIGH finding above is dispositioned: upgrade
      `verdict` to `PASS` (this write is when the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in `contract.md` only once the
      verdict reaches PASS
