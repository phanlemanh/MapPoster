# Review Findings: mcp-map-render (Round 1)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All findings below went
through the full finder → refuter adversarial-verify pass; none are flagged `unverified`, and no
review pass died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `ea639e912469455aa6bd44b1322a23cd724af035` (`feature/mcp-map-render`).

## Findings

### 1. [HIGH] Reused pool pages never reload on hash-only navigation → every render after the first returns a STALE frame (wrong image/size)

- **File:** `mcp-server/src/renderFrame.ts:22`
- **Severity:** high
- **Source:** conventions

`renderFrame` drives the headless page by `page.goto(\`${appUrl}/render.html#config=<base64url>\`)`
and relies on that navigation to reload the page so `main.tsx` re-parses the new config. But the
config travels in the URL *hash fragment*, and `browserPool.acquire()` prefers `idle.pop()`
(reusing a released page) over creating a new one. Navigating a reused page from `#config=A` to
`#config=B` is a same-document navigation: the document is NOT reloaded, `main.tsx` does not
re-run, and `window.__mapposter` keeps its closure over the FIRST config. So `renderFrame`
recomposes and returns the previous frame.

Empirically confirmed against the repo's own Playwright 1.61.1 + installed Chromium (minimal
repro mirroring the pool pattern): `goto` to a different `#config=` returns `null` (no navigation
response) and the page still reports the first config (`STALE_BUG: true`, load-stamp stays 1);
the identical test with `?config=` returns 200 and reloads correctly. So the defect is
specifically the hash fragment, not `goto` in general.

Impact: In the sequential path (`render_variants` loops `await renderOne` over variants; separate
`render_map` calls share the lazily-created pool), variant #1 acquires page P1, releases it, and
variant #2's acquire pops P1 back — reused — so variants 2..N (and the 2nd+ `render_map` call in
a process) all return variant #1's image. Because `idle.pop()` is preferred, a fresh page is only
ever created under concurrent in-flight renders, so in practice only the very first render after
process start is correct. This violates the intent of AC-5 (one image *per* variant) and
AC-1/AC-9/AC-8 for every subsequent call (wrong location/theme/chrome/dimensions), and is exactly
the kind of runtime failure the test suite cannot catch: `tools.test.ts` mocks `render`;
`renderFrame.test.ts`, the render-mode e2e, and `gen-example.ts` each render only ONCE on a fresh
page.

Fix direction (report only): carry the config via query string / `page.reload()` / a per-render
fresh context, or verify a per-render nonce inside the page before composing.

### 2. [HIGH] Region highlight silently dropped when boundary lookup returns null

- **File:** `mcp-server/src/resolveConfig.ts:83`
- **Severity:** high
- **Source:** bugs

In `resolveConfig`, a string region is resolved via `resolveBoundary(r)` and only pushed `if (gj)`.
`resolveBoundary` returns `null` whenever Nominatim has no polygon for the place or the HTTP call
is not-ok (`fetchRegionBoundary` returns `null` on `!res.ok` and on non-Polygon/MultiPolygon
results). When that happens the requested region is silently discarded: no error, no warning, and
`regions.length` becomes 0, so auto-framing then behaves as if no highlight was ever requested
(falls back to the plain base center/zoom). The render tool returns a SUCCESSFUL result with a
poster that is missing the highlight the caller explicitly asked for, and the agent has no signal
that anything failed. This is inconsistent with the point path on the same function: a string
point flows through `resolveLocation`, which THROWS `'No geocoding result'` and surfaces as a
structured error (`tools.ts` catch -> fail).

Failure scenario: `render_map({ location: 'HCMC', highlight: { regions: ['Some place OSM has no
polygon for'] } })` -> boundary null -> region dropped -> poster rendered with no highlight and
default framing, reported as success.

Fix: collect/propagate an error (or at least a warning field in the tool result) when a requested
region resolves to null, matching the point-highlight behavior.

### 3. [MEDIUM] Nominatim rate-limiter is not actually serialized despite the "serialized rate-limiter" comment and the design's "rate-limit safe (≤1 req/s)" invariant

- **File:** `mcp-server/src/geocode.ts:27`
- **Severity:** medium
- **Source:** conventions
- **Cross-reference:** the same underlying defect was independently flagged by the `bugs` lens —
  see Finding 6 below. Both are kept as separate entries per the raw finder output; they describe
  the same code but frame the impact differently (design-doc contradiction vs. concurrent-caller
  race), so read them together.

`throttle()` computes `wait = lastUpstreamAt + minSpacingMs - now`, optionally sleeps, then sets
`lastUpstreamAt = now` — but there is no mutex/queue. Two `throttle()` calls that overlap both
read the same `lastUpstreamAt`, both compute the same (possibly zero) wait, and both proceed to
fetch essentially simultaneously; the shared `lastUpstreamAt` is only stamped after the wait, so
concurrency is unbounded. The comment at line 10 calls this a "serialized rate-limiter" and the
design doc (`docs/superpowers/specs/2026-07-09-mcp-map-render-design.md`) promises geocoding is
"rate-limit safe" — neither holds. This is reachable: `http.ts` creates a fresh `McpServer` per
POST sharing module-level geocode state, so concurrent tool calls (or concurrent `geocode_place` /
`render_map` with distinct uncached locations) race, firing >1 upstream Nominatim request within
the same second and risking a 429 / temporary IP ban. It is invisible to the suite because
`geocode.test.ts` sets `__setRateLimitMs(0)` and runs calls sequentially. (Caching per AC-4 is
correct; only the concurrent spacing guard is broken.)

### 4. [MEDIUM] Agent-supplied format/coordinate numbers are unvalidated at the MCP tool boundary (no positive/integer/max bounds) → blank PNG or pooled-page OOM

- **File:** `mcp-server/src/tools.ts:103`
- **Severity:** medium
- **Source:** conventions

`formatSchema` accepts `{ width: z.number(), height: z.number() }` with no `.int()`/`.positive()`/
`.max()` bounds, and `resolveConfig.formatSize` (`mcp-server/src/resolveConfig.ts:34-41`) passes
those numbers straight into `RenderConfig.size`, which becomes the export canvas dimensions in
`composePoster`. An agent passing `format:{width:0,height:0}` (or negative) yields a zero-size
canvas → a blank/zero-dimension PNG — the exact output AC-11 says must never be produced — with no
structured error. A huge value (e.g. 100000×100000) allocates an enormous backing store in the
shared pooled browser page, OOM-ing/crashing it and thereby degrading every other render routed
through that pool (the pool is a shared resource with no per-render isolation). The same missing
bounds apply to the `location` `{lng,lat}` and `camera.center` numbers (`locationSchema` line 92 /
`cameraSchema` line 105), which are accepted as raw `z.number()` with no `lat∈[-90,90]` /
`lng∈[-180,180]` range check.

This is a missing-validation-at-system-boundary gap on the agent-facing surface; recommend
tightening the Zod schemas (report only, no fix applied).

### 5. [MEDIUM] Browser pool cap not enforced under concurrency (`created++` after await)

- **File:** `mcp-server/src/browserPool.ts:30`
- **Severity:** medium
- **Source:** bugs

`acquire()` guards new-page creation with `if (created < size) return makePage()`, but `makePage`
increments `created` only AFTER `await browser.newContext(...)` (line 22). Because the increment
lands after the first await, multiple concurrent `acquire()` calls all read the same
pre-increment `created`, all pass the `created < size` check, and all create pages -> the pool
overshoots its documented cap ("capped at `size` concurrent pages"). This is reachable: the HTTP
transport (`http.ts`) builds one shared `deps` / one shared pool (`makeRenderDeps` evaluated once)
and services POSTs concurrently, so N simultaneous `render_map` calls with `poolSize=2` can spin
up N Chromium pages instead of 2, and those extra pages are then retained in `idle` permanently,
raising the effective cap for the process lifetime. The pool's entire purpose (bounding concurrent
headless pages) is defeated under exactly the concurrent load it exists to protect against.

Fix: increment `created` synchronously before the await (reserve the slot), or track in-flight
creations.

### 6. [MEDIUM] Geocode rate-limiter races under concurrent callers, can burst past Nominatim 1 req/s

- **File:** `mcp-server/src/geocode.ts:27`
- **Severity:** medium
- **Source:** bugs
- **Cross-reference:** same code path as Finding 3 (`conventions` lens) — see that entry for the
  design-doc-contradiction framing of this same defect.

`throttle()` is described as "a serialized rate-limiter (Nominatim policy: <= 1 req/s)", but it is
a check-then-act on a shared timestamp with no lock/queue: it reads `lastUpstreamAt`, awaits
`setTimeout`, then writes `lastUpstreamAt = Date.now()`. Concurrent callers all read the same
stale `lastUpstreamAt` before any of them writes it, compute the same (often zero) wait, and fire
their upstream fetches simultaneously. It only actually serializes when callers are already
awaited sequentially (as inside a single `resolveConfig`). `resolveLocation`/`resolveBoundary` are
also reached concurrently via the shared-deps HTTP server (e.g. simultaneous `geocode_place` /
`render_map` requests), so the spacing is not enforced and the server can exceed Nominatim's
1 req/s policy -> 403 / temporary blocking. Note this is the same class of failure the most recent
commit (`ea639e9`) was fighting (Nominatim 403).

Fix: serialize through a promise chain/mutex, or advance `lastUpstreamAt` optimistically before
awaiting.

### 7. [LOW] Headless ready/setCamera wait on map 'idle' with no safety timeout → silent indefinite hang

- **File:** `src/render/main.tsx:62`
- **Severity:** low
- **Source:** bugs

The render-mode `ready` promise (line 62) and `setCamera` (line 88) await a bare
`map.once('idle', ...)` with no timeout. The sibling interactive path deliberately does NOT do
this: `export.ts` `waitForIdle()` resolves "once the map is idle, OR after a safety timeout" (8s).
If the map never emits `'idle'` in render mode (stalled tile fetch, lost WebGL context), `ready`
never resolves. `renderFrame.ts` drives it via `page.evaluate(async () => { await api.ready; ... })`,
and `page.evaluate` has no default timeout, so the whole render tool call hangs forever, returning
neither a PNG nor the structured error that `tools.ts` would otherwise produce — the failure is
swallowed as an unbounded hang. The `__mapposter` `waitForFunction` guard (20s) does not cover this
because `__mapposter` is assigned synchronously and the hang is inside `api.ready`.

Fix: give the idle wait the same bounded safety timeout as the interactive `waitForIdle`.

## Chưa adversarial-verify (refuter chết)

none — every finding above completed the full finder → refuter pass this round; no finding in the
input set carries `unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
