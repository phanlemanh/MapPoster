# Review Findings: mcp-map-render (Round 7)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All findings below went
through the full finder → refuter adversarial-verify pass; none are flagged `unverified`, and no
review pass died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `10750cbb36894e5f7c79814db0fbeeb5f87c4f7d` (`feature/mcp-map-render`).

**Context vs. Round 6:** the Round-6 review (commit `f320b41`) surfaced 2 findings — 1 MEDIUM (the
render pool never evicts or replaces a crashed/dead pooled page, and a fully-dead pool/browser is
never rebuilt either) and 1 LOW (the long-running HTTP server's geocode caches have no
TTL/eviction/max-size) — neither HIGH, neither a machine-eval regression. Round 6's *machine*
verdict was REJECT, but not because of either finding: the actual driver was a separate, unassigned
`npm run test:e2e` failure, since root-caused and fixed (see `evidence-report.md`). Per the human's
Round-6 termination rule (`decisions.jsonl` `d-20260710T110500Z-47001`), a MEDIUM/LOW pair with no
HIGH does not by itself block Gate 2, so both findings were carried forward as accepted risk
(`d-20260710T121500Z-48005` reaffirms this at Round 6's HEAD `f320b41`) rather than requiring a fix
before Round 7. This round's fresh adversarial pass ran against `10750cbb` — one commit ahead,
containing only the `e2e/mapposter.spec.ts` + `src/components/MapView.tsx` fix for Round 6's
unassigned failure, nothing under `mcp-server/` — and: (a) re-confirmed both carried-forward
findings are still present and unchanged (the fix did not touch the render pool or the geocode
cache), and (b) surfaced 2 NEW findings on a different pair of boundaries — the highlight-color
input-validation boundary and the render-deps lazy-init failure path. 4 findings total this round,
2 MEDIUM + 2 LOW, none HIGH, none a machine-eval regression (all 12 evals in `evidence-report.md`
are green/panel-PASS on their own terms).

**Note for Gate 2:** this round's overall verdict is PENDING-JUDGMENT, and none of the 4 findings
below is the reason — that verdict is driven entirely by this contract's `risk_tier: T3` mandating a
direct human verdict on judgment item E12 (AC-12), independent of code-review findings. Per the
human's Round-6 termination rule (`d-20260710T110500Z-47001`), the MEDIUM/LOW findings below (none
HIGH) do not themselves block Gate 2; they are carried forward / added as informational items for
the human's review, same as Round 6's pair was.

## Findings

### 1. [MEDIUM] Render pool poisons on page/browser crash and the dead pool is never rebuilt — defeats the pool's stated resilience purpose

- **File:** `mcp-server/src/renderFrame.ts:48`
- **Severity:** medium
- **Source:** conventions

Already tracked as `review-findings.md` R6 #1 (MEDIUM), human-dispositioned as non-blocking;
re-surfaced here because it is the one genuine architecture-invariant violation confirmable at high
confidence. renderFrame's `finally { deps.pool.release(page) }` (renderFrame.ts:47-49) returns the
page unconditionally, even when `page.goto`/`page.evaluate` threw because the page/context/browser
crashed. `createResourcePool.release` (browserPool.ts:44-48) has no discard path — its only return
is `idle.push(item)`, and the `Pool` interface (browserPool.ts:6-10) exposes no per-item discard —
so a crashed page goes back into `idle`, the next `acquire()` pops the same dead page, `goto` throws
again, and that slot is poisoned for the process lifetime. Worse, `makeRenderDeps` memoizes the pool
with `started ??= (...)` and never resets it on failure (deps.ts:13-19), so if Chromium itself dies,
every later render resolves the same dead pool. Failure scenario: a 4k poster OOMs/crashes the
SwiftShader renderer (realistic here) → that slot (poolSize default 2) is dead → after enough
crashes, `render_map`/`render_variants` fail permanently until process restart, with no
self-recovery — contradicting design-spec Risks #1 (pool exists for resilience/scale). Contrast the
geocode layer and app export path, which deliberately distinguish transient vs. permanent failures.
Fix direction: detect a broken page (`page.on('crash')`/`isClosed`) and drop-not-reuse it; reset
`started` when the pool/browser dies.

### 2. [MEDIUM] Lazy render-deps init memoizes a rejected promise, permanently disabling all rendering after one transient startup failure

- **File:** `mcp-server/src/deps.ts:15`
- **Severity:** medium
- **Source:** bugs

NEW finding. `ensure()` does `started ??= (async () => { await startAppServer(cfg); await
createPool(cfg.poolSize); ... })()`. The promise is stored BEFORE it settles, and `??=` only
reassigns when `started` is null. A rejected promise is not null, so once the factory rejects it is
cached and never retried — `started` is never reset anywhere (confirmed by grep). Failure scenario:
the first `render_map`/`render_variants` request triggers `ensure()`; `startAppServer` fails
transiently with EADDRINUSE on `appPort` 4180 (a prior instance still holding the port), or
`createPool` → `chromium.launch()` flakes under transient resource pressure. The factory promise
rejects; `started` now references that rejected promise. A second later the port is free / resources
recover, but every subsequent render awaits the same cached rejection (`await ensure()` re-throws the
stale error), so `render_map` and `render_variants` fail identically for the entire life of the
process — only a full server restart recovers. Because the HTTP transport shares one
`makeRenderDeps()` instance across all stateless requests (and stdio shares it across the session), a
single transient startup hiccup silently bricks rendering server-wide while `list_themes`/
`list_formats` keep working, masking the true state. This directly contradicts the codebase's own
stated principle in geocode.ts `resolveCountryAt` ("Only a positive answer is cached ... memoizing [a
transient upstream failure] would break this coordinate for the life of the process"). Fix: attach a
`.catch` that resets `started = null` so the next call retries, e.g. cache the promise but null it
out on rejection.

### 3. [LOW] Unbounded geocode caches (incl. full region GeoJSON) in the long-running HTTP deployment — no eviction/TTL/max-size

- **File:** `mcp-server/src/geocode.ts:13`
- **Severity:** low
- **Source:** conventions

Already tracked as `review-findings.md` R6 #2 (LOW), human-dispositioned as non-blocking; included
for completeness/corroboration. `locCache`, `boundaryCache` and `countryCache` (geocode.ts:12-14)
are module-level Maps shared across all requests (correct per design's "one central cache") but are
never bounded or evicted; `boundaryCache` in particular stores full simplified region GeoJSON
FeatureCollections. In the documented long-lived HTTP mode (README `mcp:http`,
`MAPPOSTER_HTTP_ALLOWED_HOSTS`), every distinct place/region string adds a permanent entry, so a
client issuing many distinct region names grows resident memory without limit — and memory pressure
that crashes the shared browser pool compounds finding #1 above. LOW because the endpoint is
loopback/allowlist-guarded by default and typical distinct-place counts are modest. Fix direction:
bounded LRU / TTL.

### 4. [LOW] Unvalidated `highlight.color` flows unsanitized into `innerHTML` in the headless render page (missing boundary validation + inconsistent with the module's own strict-validation pattern)

- **File:** `mcp-server/src/tools.ts:116`
- **Severity:** low
- **Source:** conventions

NEW finding (not in `review-findings.md` R6). The `render_map`/`render_variants` boundary accepts
`highlight.color` as `z.string().optional()` (tools.ts:116) with no format check. `resolveConfig`
copies it onto every point marker (resolveConfig.ts:190 `color: params.highlight?.color ??
'#ffffff'`), `applyRenderConfig` writes it to the store (applyRenderConfig.ts markers), and
`MapView`'s marker reconciler sets `el.innerHTML = markerSvg(item.icon, item.color, item.size)`
(MapView.tsx:254), where `markerSvg` interpolates it raw: `fill="${color}"` (markers.ts:73). A color
such as `"/><img src=x onerror=...>` is therefore DOM-injected and executed in the headless render
page. This violates two of the requested categories: (a) missing validation at a system boundary,
and (b) inconsistency with the module's own established pattern — theme/format/chrome/pointIcon are
ALL strictly validated and refuse bad input (see `assertTheme`'s rationale, resolveConfig.ts:79-82:
"Every other discrete parameter here refuses bad input"); `color` is the one discrete visual param
passed through unchecked, and it is the one that reaches `innerHTML`. Impact is bounded by the
stated threat model (loopback-only, ephemeral page, trusted internal server-to-server caller who
already fully specifies the render config; per-caller auth is explicitly out of scope in
`contract.md`) — hence LOW severity, not a privilege-crossing compromise — but it is a real
missing-validation gap. Fix direction: validate color as a hex/CSS color at the Zod boundary,
matching `pointIcon`/`theme`.

## Chưa adversarial-verify (refuter chết)

none — every finding above completed the full finder → refuter pass this round; no finding in the
input set carries `unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
