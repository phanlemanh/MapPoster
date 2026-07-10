# Review Findings: mcp-map-render (Round 8)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. The finding below went through
the full finder → refuter adversarial-verify pass; it is not flagged `unverified`, and no review pass
died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `8fbdbfae83731c60ee7c2a94d1ce1fbacebb6f10` (`feature/mcp-map-render`).

**Context vs. Round 7:** the Round-7 review (commit `10750cbb`) surfaced 4 findings — 2 MEDIUM
(`mcp-server/src/deps.ts`'s lazy `ensure()` memoized a **rejected** startup promise, permanently
bricking rendering after one transient failure; `mcp-server/src/renderFrame.ts`'s pooled-page release
path had no way to discard a crashed/dead page, so one Chromium/page crash poisoned that pool slot for
the process lifetime) and 2 LOW (`highlight.color` reached `innerHTML` with no format validation at the
Zod boundary; the long-running HTTP server's geocode caches had no TTL/eviction/max-size) — none HIGH.
This round, the human (manh) chose to close all 4 before shipping rather than carry them forward as
accepted risk again (`decisions.jsonl` `d-20260710T150500Z-50001`), and this round's adversarial pass
re-verified each fix by reading the actual diff (`git diff 10750cbb 8fbdbfa`) rather than trusting the
commit message:

- MEDIUM #1 (`deps.ts`) — **CLOSED.** A new `memoizeSuccess()` helper (`deps.ts:17`) stores the promise
  but clears the memo on rejection, so the next caller retries instead of re-throwing the same stale
  error forever; `makeRenderDeps` also now calls `pool.healthy()` (`deps.ts:79`) and rebuilds the
  runtime when the browser has died, instead of resolving the same corpse. Confirmed present in the
  current tree (`grep -n memoizeSuccess mcp-server/src/deps.ts`) and covered by a new `deps.test.ts`
  (6 specs, including "does NOT cache a rejection — one transient failure must not brick the process"
  and "rebuilds the runtime once the browser has died").
- MEDIUM #2 (`renderFrame.ts` / pool) — **CLOSED.** `Pool` gained `discard(item)` and `healthy()`
  (`browserPool.ts:11,13`); `discard` frees the slot, destroys the resource, and mints a replacement for
  a queued waiter instead of stranding it; `renderFrame`'s `finally` now discards a page whose render
  threw and only releases one that succeeded. Confirmed via `grep -n "discard\|healthy"
  mcp-server/src/browserPool.ts` and covered by a new `describe('createResourcePool: discarding a
  broken resource')` block (7 specs) plus a dedicated "renderFrame returns a broken page via discard,
  not release" spec.
- LOW #3 (`highlight.color`) — **CLOSED.** `tools.ts:110-117` now validates `color` against a `hexColor`
  Zod regex before it ever reaches `resolveConfig`, and `resolveConfig.ts:88` adds a runtime
  `assertColor()` for the case where `makeTools` is called directly (bypassing Zod) — both confirmed by
  reading the diff. Verified live via an actual MCP session (`decisions.jsonl`
  `d-20260710T150500Z-50004`): a `"/><img src=x onerror=alert(1)>` payload and the bare word `"red"` are
  both refused; `"#e8b04b"` renders normally. `assertTheme`/`assertColor` were also moved to run before
  `resolveLocation`, so bad input no longer spends a Nominatim request first.
- LOW #4 (geocode caches) — **CLOSED.** `locCache`/`boundaryCache`/`countryCache` are now a bounded LRU
  gated by `CACHE_MAX` (env `MAPPOSTER_GEO_CACHE_MAX`, default 500; `geocode.ts:23,35`), confirmed by
  reading the source and by a new `describe('the geocode caches are bounded')` block. `boundaryCache`
  deliberately keeps its `has()` check, since `null` is itself a valid cached answer ("this region truly
  has no polygon"), distinct from "not yet cached" — a nuance worth Gate 2 knowing rather than assuming
  the fix is uniform across all three caches.

This round's fresh adversarial pass, run against the now-hardened boundary (colour/theme/format/chrome/
dims all validated), surfaced exactly 1 NEW finding below — on a DIFFERENT input than any of the four
just closed: the one remaining discrete `highlight` field with no shape check at all, inline region
GeoJSON. 1 finding total this round, LOW, not HIGH, not a machine-eval regression (all 12 evals in
`evidence-report.md` are green/panel-PASS on their own terms).

**Note for Gate 2:** this round's overall verdict is PENDING-JUDGMENT, and the finding below is not the
reason — that verdict is driven entirely by this contract's `risk_tier: T3` mandating a direct human
verdict on judgment item E12 (AC-12), independent of code-review findings. Per the human's Round-6
termination rule (`d-20260710T110500Z-47001`), a single LOW with no HIGH does not itself block Gate 2;
it is carried as an informational item for the human's review, same as prior rounds' non-blocking
findings were.

## Findings

### 1. [LOW] Inline highlight-region GeoJSON is accepted as `z.any()` and never shape-validated at the MCP boundary

- **File:** `mcp-server/src/tools.ts:115`
- **Severity:** low
- **Source:** conventions

In `highlightSchema`, an inline region is `z.object({ geojson: z.any() })`, so a caller's
`highlight.regions[].geojson` receives NO structural validation. It is then passed straight through in
`resolveConfig.ts:197` (`regions.push({ geojson: r.geojson, color: null })`), base64url-encoded into the
`?config=` param (`renderFrame.ts`), decoded in the headless page (`src/render/main.tsx`), applied to the
store, and handed to MapLibre as a GeoJSON data source; it is also walked in Node by `bboxOfRegions` for
auto-framing (`resolveConfig.ts:105-118`, `:218-221`). This is the one discrete input at this system
boundary with no shape check — every sibling parameter is bounded (location/points/camera coords via
lng/lat, dims via `dim`/`MAX_EDGE`, zoom via `zoomLevel`, color via `hexColor`+`assertColor` — this
round's own fix — theme via `assertTheme`, chrome/pointIcon via enums), which is the file's own stated
pattern ("every runtime guard in this file exists because the boundary can be bypassed"). CONFIDENCE
that the validation is absent is high. IMPACT is bounded, which is why this is low severity, not a vuln:
the geojson is consumed as data (not an innerHTML/eval/shell sink), `bboxOfRegions` guards against
non-numeric coordinates (`typeof arr[0] === 'number'`, `isFinite` check), a deeply-nested payload that
overflows the `flat` recursion throws a RangeError that the tool's try/catch converts to a structured
error, and a malformed FeatureCollection that MapLibre rejects surfaces via the render-mode idle timeout
as a structured tool error (never a crash). The contract also scopes this to an internal, trusted
server-to-server caller. So this is a defense-in-depth gap (no minimal GeoJSON-shape guard on the one
unbounded boundary field), not a known exploit — surfaced because the task asked specifically about
missing validation at system boundaries; a maintainer may reasonably treat inline GeoJSON as
caller-vouched structural data and accept it.

## Chưa adversarial-verify (refuter chết)

none — the finding above completed the full finder → refuter pass this round; it does not carry
`unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
