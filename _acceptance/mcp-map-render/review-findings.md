# Review Findings: mcp-map-render (Round 6)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All findings below went
through the full finder → refuter adversarial-verify pass; none are flagged `unverified`, and no
review pass died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `f320b41cd8f2a4887e06f4abc651df9bbb03901a` (`feature/mcp-map-render`).

**Context vs. Round 5:** the Round-5 review (commit `ffb928b`) surfaced 2 findings, both MEDIUM,
both on the HTTP/static boundary — the app-static server (`appServer.ts`) bound every network
interface unconditionally regardless of the MCP HTTP transport's own loopback-by-default policy,
and `readJsonBody` read an unbounded request body into memory behind a Host/Origin check that a
server-to-server caller can forge. Round 5's verify passed 12/12 evals with these 2 still open,
and — this being the 5th verify round in a row to escalate rather than auto-continue — the human
(manh) set an explicit termination rule this time rather than another plain scoped-round
authorisation (`decisions.jsonl` `d-20260710T110500Z-47001`): land these two fixes, run one more
verify, then proceed to Gate 2 regardless of further MED/LOW findings the review might turn up
(reasoning that adversarial review of a real codebase always returns *something* at MED/LOW, so
"any finding ⇒ another round" never terminates); only a confirmed HIGH — a wrong render or a real
compromise — would reopen the loop. Commit `7e958ce` ("fix(mcp): bind the static app server to
loopback, cap the HTTP request body") + `f320b41` (evals.yaml sync) closed both: MEDIUM #1 via an
explicit `appHost` config field (`MAPPOSTER_APP_HOST`, default `127.0.0.1`) threaded into
`appServer.listen()`, with a new `appServer.test.ts` asserting the default is loopback and that a
LAN address is refused; MEDIUM #2 via a byte-counting `maxBytes` cap (default 8 MiB,
`MAPPOSTER_HTTP_MAX_BODY`) in `readJsonBody` that answers 413 before the process can OOM, checked
both against a declared `Content-Length` and while streaming an undeclared/chunked body. This
round's fresh adversarial pass ran against `f320b41` and moved on to a different pair of system
boundaries — the render pool's failure handling and the long-running cache's growth bound — now
that the HTTP/static boundary has been hardened twice in a row; it surfaced the 2 findings below,
1 MEDIUM + 1 LOW, neither HIGH, and neither is a machine-eval regression (all 12 evals in
`evidence-report.md` are still green/panel-PASS on their own terms).

**Note for Gate 2:** this round's *overall* verdict is REJECT, but not because of either finding
below — per the human's termination rule (`d-20260710T110500Z-47001`), a MEDIUM/LOW pair with no
HIGH does not by itself block Gate 2. The actual REJECT driver this round is a separate, unassigned
*machine-test* failure (`npm run test:e2e`, spec `e2e/mapposter.spec.ts:114:1 "markers: drop a
marker on the map"`) documented in `evidence-report.md`'s `## Evidence` section under "Unassigned
command failure" — not a code-review finding, and not listed here.

## Findings

### 1. [MEDIUM] Browser pool never evicts a dead/crashed page, and deps never rebuild a dead pool → a single crash permanently downs the render tools

- **File:** `mcp-server/src/renderFrame.ts:48`
- **Severity:** medium
- **Source:** conventions

renderFrame acquires a pooled Page and, in `finally { deps.pool.release(page) }`
(renderFrame.ts:47-49), unconditionally returns it — even when `page.goto`/`page.evaluate` threw
because the page/context/browser crashed. createResourcePool.release (browserPool.ts:44-48) has no
way to signal a broken resource: its only return path is `idle.push(item)`; the `Pool` interface
(browserPool.ts:6-10) exposes acquire/release/close with no per-item discard, and there is no
`page.on('crash')`, `isClosed`, retry, or newPage-on-failure anywhere. So a crashed page goes back
into `idle`, the next `acquire()` pops the same dead page, and `goto` throws again — that slot is
poisoned for the process lifetime. Worse, makeRenderDeps memoizes the pool in `started` via `??=`
and never resets it on failure (deps.ts:13-19), so if the whole Chromium browser dies, every
subsequent render resolves the same dead pool forever. Failure scenario: a large 4k poster
OOMs/crashes the SwiftShader renderer (realistic for this headless setup) → that pool slot
(poolSize default 2) is dead → after enough crashes, render_map/render_variants return errors
permanently until the process is restarted, with no self-recovery. This contradicts the design's
stated reason for a pool (resilience/scale under batch load; design spec "Risks" 1). Contrast with
the app's own export path and the geocode layer, which deliberately distinguish transient failures
from permanent ones — the pool does not.

### 2. [LOW] Unbounded geocode caches in the long-running HTTP server (no eviction), boundaryCache holds GeoJSON polygons

- **File:** `mcp-server/src/geocode.ts:13`
- **Severity:** low
- **Source:** conventions

locCache, boundaryCache and countryCache (geocode.ts:12-14) are module-level Maps shared across all
requests (correct per design's "one central cache"), but they are never bounded or evicted. The
HTTP transport is a documented long-lived deployment (README: "mcp:http", hosted with
MAPPOSTER_HTTP_ALLOWED_HOSTS). Over a long-running process, every distinct place/region string adds
a permanent entry; boundaryCache in particular stores full (simplified) region GeoJSON
FeatureCollections, so a client issuing many distinct region names grows resident memory without
limit — and if that memory pressure crashes the shared browser pool, it compounds finding #1. The
rate-limiter fields are reset by __resetGeoCache (test-only). No production eviction/TTL/max-size
exists. Low severity because the HTTP endpoint is loopback/allowlist-guarded by default and typical
distinct-place counts are modest, but it is a real resource-management gap for the hosted mode the
README describes.

## Chưa adversarial-verify (refuter chết)

none — every finding above completed the full finder → refuter pass this round; no finding in the
input set carries `unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
