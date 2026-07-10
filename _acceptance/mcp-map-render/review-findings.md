# Review Findings: mcp-map-render (Round 11)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All 3 findings below went through
the full finder → refuter adversarial-verify pass; none is flagged `unverified`, and no review pass died
mid-way in the run that produced this content (see "Review incomplete" at the bottom).

Verified at commit `9e51736a2a4e94deb4391f8d84984af049c5d39b` (`feature/mcp-map-render`).

**Context vs. Round 9:** the Round-9 review surfaced 3 findings — 1 HIGH (region-highlight config shipped
in a URL query param, capped at Node's default 16 KB header limit), 1 MEDIUM (unguarded `Number(env)`
yielding `NaN` and silently disabling the body/pool caps), 1 LOW (`memoizeSuccess.reset()` unconditionally
evicting a healthy concurrent rebuild). **All 3 are now CLOSED**: Round 10 replaced the URL-embedded
config with an in-process `configStore.ts` plus a same-origin `/__config/<id>` route (closing the HIGH),
added a fail-closed `envNumber()` helper validated at startup (closing the MEDIUM), and made
`memoizeSuccess.reset(attempt)` clear only the matching attempt (closing the LOW). Round 10's own review
pass then found and immediately fixed 2 more items before it could reach Gate 2 (camera
`bearing`/`pitch` silently discarded on headless render; a self-inflicted `gen-example.ts` regression
invisible to `tsc` because `scripts/` was never in `mcp-server/tsconfig.json`'s `include`) — see
`evidence-report.md`'s Iterations entry for Round 10. None of those 5 prior findings is repeated below;
this round's adversarial pass probed different code paths and found the 3 NEW items that follow.

**Note for Gate 2:** this round's overall verdict is PENDING-JUDGMENT, and none of the findings below is
the reason — that verdict is driven entirely by this contract's `risk_tier: T3` mandating a direct human
verdict on judgment item E12 (AC-12), independent of code-review findings. Unlike Round 9, none of this
round's 3 findings is HIGH, so per the human's Round-6 termination rule (`d-20260710T110500Z-47001`: "only
a confirmed HIGH would reopen the loop") this round is a normal "carry forward as accepted risk, or
ticket it" candidate for Gate 2 — it does not by itself demand another implementation round.

## Findings

### 1. [MEDIUM] `render_variants`: an unbounded `variants` array is unbounded browser-render fan-out from a single within-cap request

- **File:** `mcp-server/src/tools.ts:149`
- **Severity:** medium
- **Source:** conventions

The Zod input schema for `render_variants` is
`variants: z.array(z.object(renderMapShape).partial())` (`tools.ts:149`) — no `.max()`. `render_variants`
iterates every element of `variants` and drives one full headless-browser render each (`renderOne` →
`renderFrame`, run serially per the tool's implementation). The HTTP request-body cap
(`config.ts`'s `DEFAULT_MAX_BODY_BYTES`, enforced in `http.ts`) exists explicitly to, in the codebase's own
words, stop a caller from OOM-ing the shared browser pool — yet a tiny, well-within-cap JSON body (a
`variants` array of on the order of 100,000 near-empty `{}` objects is well under the 8 MiB body limit)
enqueues on the order of 100,000 sequential renders and monopolizes the shared pool for a very long time.
This is the identical threat class the body cap defends against, reachable in the hosted
`MAPPOSTER_HTTP_HOST=0.0.0.0` deployment mode this server is designed to support, and it is the one
boundary dimension left unbounded now that every scalar input (dimensions, lat/lng, zoom, colour, GeoJSON
byte size) is capped elsewhere in this same file. No downstream cap exists to catch it. Fix: add a
`.max(N)` to the `variants` array, matching the codebase's own bound-everything-that-grows invariant.

### 2. [MEDIUM] `highlight.regions` / `highlight.points`: unbounded name arrays are unbounded serialized Nominatim calls from one request

- **File:** `mcp-server/src/tools.ts:115` (regions), `:116` (points)
- **Severity:** medium
- **Source:** conventions

`regions: z.array(...)` (`tools.ts:115`) and `points: z.array(...)` (`tools.ts:116`) both accept unbounded
arrays of place-name strings. `resolveConfig` resolves each named region via `resolveBoundary` and each
named point via `resolveLocation`, and `geocode.ts` serializes every upstream Nominatim call behind a
>=1 req/s throttle (required by Nominatim's usage policy). A single small request containing thousands of
distinct name strings therefore pins the process issuing serialized third-party geocode lookups for
hours (on the order of 100,000 names ≈ 28 hours at 1/s), turning one MCP request into sustained,
policy-relevant abuse of a shared public service — precisely the behaviour the rate limiter and the
User-Agent/contact-email identification were added to keep compliant. This is the same root cause as
Finding #1: array cardinality is the one input dimension at this MCP boundary still left unbounded. Fix:
cap the length of both arrays at the schema.

### 3. [LOW] `formatSize()` matches JS built-in property names instead of rejecting them (unguarded object index)

- **File:** `mcp-server/src/resolveConfig.ts:65`
- **Severity:** low
- **Source:** bugs

`formatSize` resolves a named format with `if (FORMATS[format]) return FORMATS[format];` (`resolveConfig.
ts:65`). Because `FORMATS` is a plain object literal, this index also reaches inherited
`Object.prototype` members, so a format string like `constructor`, `toString`, `valueOf`,
`hasOwnProperty`, or `__proto__` is truthy and gets returned as the "size". Verified directly:
`FORMATS['constructor']` evaluates to the `Object` function; `FORMATS['__proto__']` evaluates to
`Object.prototype`. Reachability: the Zod `formatSchema` is
`z.union([z.string().min(1), z.object({width,height})])`, so any such string passes validation and
reaches `formatSize`, and the named-format branch skips `assertDim` entirely. Consequence: instead of the
intended `throw new Error('Unknown format: ...')`, `size` becomes a function or a bare prototype object
with no numeric `width`/`height`. It survives `resolveConfig`, and inside `renderFrame`,
`JSON.stringify(config)` drops the function-valued `size` (or serializes it as `{}`), so the render page
hits `cfg.size.width` on `undefined` and the render fails with an opaque TypeError rather than the clean
"Unknown format" error the code intends. Impact is limited — a confusing error rather than a
wrong-but-successful poster, and only for pathological format strings an agent is unlikely to send by
accident — hence low severity. Fix: gate on ownership, e.g. `if (Object.hasOwn(FORMATS, format)) return
FORMATS[format];`, matching the safe array-based lookups this same file already uses for `LAYOUTS` and
`THEMES`.

## Chưa adversarial-verify (refuter chết)

none — all 3 findings above completed the full finder → refuter pass in the run that produced this
content; none carries `unverified: true`.

## Review incomplete (finder chết)

none — in the run that produced the findings above, no review pass failed to complete.
