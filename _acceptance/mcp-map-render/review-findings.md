# Review Findings: mcp-map-render (Round 9)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All 3 findings below went through
the full finder → refuter adversarial-verify pass; none is flagged `unverified`, and no review pass died
mid-way in the run that produced this content (see "Review incomplete" at the bottom) — though a *prior*,
infrastructure-blocked attempt this same round did lose both review lenses; see below.

Verified at commit `bc7aba2c6ff2dfa508c6d97924b806cda62b6c17` (`feature/mcp-map-render`).

**Context vs. Round 8:** the Round-8 review (commit `8fbdbfa`) surfaced exactly 1 finding — LOW: inline
`highlight.regions[].geojson` accepted as `z.any()` with no structural validation at the MCP boundary
(`mcp-server/src/tools.ts:115`). **No file under `mcp-server/`, `src/`, or `e2e/` has changed since**
(`git diff 8fbdbfae83731c60ee7c2a94d1ce1fbacebb6f10 bc7aba2c6ff2dfa508c6d97924b806cda62b6c17 -- mcp-server/
src/ e2e/` is empty — this round's only tree changes are `lib/package.json` / `scripts/package.json`,
added to fix the acceptance-gate tooling itself, plus `_acceptance/` report/evidence files), so that Round
8 LOW was **not re-examined and not closed** this round — it simply wasn't in scope for a pass that probed
different code paths. It should still be treated as open until a future round revisits it.

This round's review had an unusual path to the findings below. The **first** S4-r9 verify attempt was
infrastructure-BLOCKED, not a code verdict: 5 of the pipeline's 12 sub-agents died on transport errors,
including **both** review lenses — `review:bugs` (`FailedToOpenSocket`) and `review:conventions`
(`ConnectionRefused`) — alongside `ui:E10`, `capture:provenance`, and `scribe:run-log`
(`decisions.jsonl` `d-20260710T190000Z-55001`). No findings and no verdict came out of that attempt; it
was recorded as BLOCKED and resumed, re-running exactly the 5 dead agents (including both review lenses)
against the identical pinned tree. The 3 findings below are the product of that successful resume — a
genuine finder → refuter pass, not a replay of stale results — surfaced against code that has not changed
since Round 8: 2 from the `conventions` lens, 1 from the `bugs` lens. **The first is the first HIGH
finding since Round 4.**

**Note for Gate 2:** this round's overall verdict is PENDING-JUDGMENT, and none of the findings below is
the reason — that verdict is driven entirely by this contract's `risk_tier: T3` mandating a direct human
verdict on judgment item E12 (AC-12), independent of code-review findings; Round 8's own E12 signoff was
tied to the now-superseded commit `8fbdbfa` and does not carry forward to this round's `verified_commit`.
Unlike every review round since Round 5, though, this round's findings are **not** a candidate for the
"single LOW/MEDIUM, carry forward as accepted risk" treatment the human's Round-6 termination rule
describes (`d-20260710T110500Z-47001`: "only a confirmed HIGH would reopen the loop") — finding #1 below
IS a confirmed HIGH, on this feature's headline region-highlight path. Whether to accept it as risk,
ticket it for a fast-follow, or send the feature back for a Round 10 fix is a decision for the human, not
resolved by this review pass.

## Findings

### 1. [HIGH] RenderConfig is shipped to the renderer inside a URL query param, but the app server caps request headers at Node's default 16 KB — region highlights and inline GeoJSON silently fail

- **File:** `mcp-server/src/renderFrame.ts:30`
- **Severity:** high
- **Source:** conventions

`renderFrame` encodes the ENTIRE `RenderConfig` (base64url) into the render URL:
`page.goto(`${deps.appUrl}/render.html?config=${key}`)` (`renderFrame.ts:30`, `encodeConfig` at
`deps/renderFrame`). That URL is served by the internal app server, a stock `http.createServer` with no
`maxHeaderSize` override (`appServer.ts:30`), so the whole request head is capped at Node's default
16,384 bytes. Meanwhile the MCP boundary accepts an 8 MiB body (`config.ts:25`) and inline region GeoJSON
is typed `z.object({ geojson: z.any() })` — completely unbounded (`tools.ts:115`). This is a hard mismatch
between the declared input ceiling (8 MiB) and the actual transport ceiling (~16 KB), and it defeats a
headline feature.

Measured against live Nominatim with the exact `polygon_threshold=0.0015` this code uses: the resolved
boundary for `Ho Chi Minh City` is 20,320 base64 bytes and `Vietnam` is 155,316 — both exceed 16 KB.
Empirically, a stock Node http server returns HTTP 431 for the 20 KB URL and ECONNRESET for the 155 KB
one. On a 431 the render page never loads, so `window.__mapposter` is never set and renderFrame's
`waitForFunction(..., { timeout: 20_000 })` (`renderFrame.ts:31-33`) hangs for the full 20 s before the
tool fails with an opaque error. So `render_map({ location: 'Vietnam', highlight: { regions: ['Ho Chi Minh
City'] } })` — an in-spec call — stalls 20 s and returns a confusing failure; any caller-supplied inline
GeoJSON of realistic size does the same. The eval suite only exercises `Quận 3` (~500 B, well under the
limit), so AC-11 never trips this. Root cause is the URL-param transport choice; a fix would carry the
config out-of-band (POST body / sessionStorage / an in-process id map) or raise `maxHeaderSize`, and bound
the inline GeoJSON.

### 2. [MEDIUM] `Number(env)` with no NaN guard silently disables the HTTP request-body DoS cap

- **File:** `mcp-server/src/http.ts:126`
- **Severity:** medium
- **Source:** conventions

`maxBodyBytes = Number(process.env.MAPPOSTER_HTTP_MAX_BODY ?? DEFAULT_MAX_BODY_BYTES)` (`http.ts:126`). If
the operator sets `MAPPOSTER_HTTP_MAX_BODY` to any non-numeric value, `Number(...)` yields `NaN`, and
every subsequent comparison — the `Content-Length` pre-check `Number(req.headers['content-length'] ?? 0) >
maxBodyBytes` (`http.ts:141`) and the streaming guard `size > maxBytes` (`http.ts:41`) — evaluates to
`false`. The result is that the body cap the code carefully implements (the file's own comments call out
OOM-ing the shared browser pool as the threat) is silently switched off, restoring the unbounded-buffering
DoS the cap exists to prevent. The unset path is safe because `?? DEFAULT_MAX_BODY_BYTES` supplies a
number, so this only fires on misconfiguration — but the failure mode is a security control that fails
OPEN with no signal, which is exactly the kind of boundary this codebase otherwise fails-closed on (see
the loopback/allowed-hosts guard that logs and refuses). The same unguarded `Number(env)` pattern recurs
for `CACHE_MAX` (`geocode.ts:23`), `poolSize` and `appPort` (`config.ts`); `poolSize`→`NaN` makes
`created < size` always false so the pool never mints a page and every render deadlocks. Validate these
env-derived numbers (reject/clamp NaN) at the config boundary.

### 3. [LOW] Unconditional `ensure.reset()` can evict and leak a freshly-rebuilt healthy runtime under concurrent renders

- **File:** `mcp-server/src/deps.ts:80`
- **Severity:** low
- **Source:** bugs

`memoizeSuccess`'s `reset()` (`deps.ts:34-36`) clears `cached` unconditionally, unlike the internal failure
path (`:28-30`) which correctly guards with `if (cached === attempt) cached = null`. `makeRenderDeps.render`
calls `ensure.reset()` in its `finally` whenever the pool is unhealthy (line 80). Because the HTTP
transport is stateless and shares one `deps`/`ensure` across all requests (see `http.ts` `createServer(deps)`
per request), 3+ renders can overlap. Failure interleave: renders A and B both awaited runtime R1; A
finishes, the browser then dies (`R1.pool.healthy()` false), A resets the memo and closes R1; render C now
calls `ensure()`, sees `cached=null`, and rebuilds a healthy R2 (`cached=R2`); B's render — still running
against R1's dead pool — then fails and its `finally` runs `ensure.reset()` a second time, blowing away
cached R2 even though R2 is alive and actively serving C. Nobody ever closes R2 (only A and B closed R1),
so R2's headless browser process and its static app-server port leak silently, and the next render builds
yet another runtime. The code explicitly anticipates the browser dying ("a 4k poster can OOM SwiftShader"),
so the trigger is real, but it requires a specific 3-render timing window, hence low severity. Fix: give
`reset()` the attempt to invalidate and clear only if `cached === attempt`, mirroring the internal catch.

## Chưa adversarial-verify (refuter chết)

none — all 3 findings above completed the full finder → refuter pass in the run that produced this
content; none carries `unverified: true`.

## Review incomplete (finder chết)

none — in the run that produced the findings above, no review pass failed to complete. (A *prior* attempt
earlier in this round did lose both `review:bugs` and `review:conventions` to infrastructure errors before
any finding was produced — see "Context vs. Round 8" above — but that attempt's output was discarded
wholesale, not partially reported, and is not the source of anything in `## Findings`.)
