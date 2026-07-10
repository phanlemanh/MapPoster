# Review Findings: mcp-map-render (Round 3)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All findings below went
through the full finder → refuter adversarial-verify pass; none are flagged `unverified`, and no
review pass died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `433e7ea7e2e16af12392419da5edf713f7309cc0` (`feature/mcp-map-render`).

**Context vs. Round 2:** the Round-2 review (commit `5ecac4e`) surfaced 4 findings — 1 HIGH
(transient Nominatim boundary-fetch failures swallowed to `null` and cached permanently, breaking a
region's renders forever after any 429/503), 1 MEDIUM (`render_variants` bypassed the
coordinate/zoom/dims validation `render_map` itself enforced), and 2 LOW (HTTP bound every network
interface with no Origin/DNS-rebinding check; the HTTP request body was assembled by string
concatenation, corrupting multibyte UTF-8 split across a chunk boundary). Commit `a8ad890` ("S4-r2 —
close 4 findings + make VN address geocoding actually work") closed 3 of the 4 outright (the
transient-429 HIGH, the `render_variants` MEDIUM, the UTF-8 chunk-corruption LOW) and **half-closed**
the fourth: HTTP now defaults to binding loopback only (`MAPPOSTER_HTTP_HOST` opts a hosted deploy
into `0.0.0.0`), but Origin/Host validation and `enableDnsRebindingProtection` were not added — so
that finding is carried forward below as still-open, not re-discovered as new. The same commit also
shipped a substantial VN-address geocoding quality pass (canonicalisation, city-guard, an
importance-within-place_rank tie-break, `geocode_place` candidates, `placeName` override). This
round's fresh adversarial pass ran against `433e7ea` (that commit plus a behavior-neutral evidence
regeneration) and surfaced the 3 findings below: 1 new HIGH and 1 new MEDIUM, both directly inside
the VN-geocoding code this round's fix commit touched, plus the 1 LOW carried forward.

## Findings

### 1. [HIGH] Non-transitive sort comparator in searchPlaces silently returns the wrong same-named place as results[0]

- **File:** `src/lib/geocoding.ts:149`
- **Severity:** high
- **Source:** bugs

The comparator `.sort((a,b) => (a.placeRank === b.placeRank ? b.importance - a.importance : 0))` is
non-transitive: it returns a non-zero order for same-rank pairs but 0 for every different-rank pair.
That is not a valid total order, so V8's sort produces implementation-defined results whenever two
same-`placeRank` candidates are separated in Nominatim's raw order by a candidate of a DIFFERENT
rank — the within-rank importance tiebreak the code was written to perform silently does not happen.

Concrete failure (reproduced deterministically on this machine, node v24.15.0 / V8): raw order =
[C(road, place_rank 26, importance 0.05338, WRONG rural same-named road), B(POI/walking-street,
place_rank 30, importance 0.10), A(road, place_rank 26, importance 0.05340, CORRECT)]. Because B
(rank 30) sits between the two rank-26 roads, A is never compared against C, so the array stays [C,
B, A] and `results[0]` is the wrong rural road. A permutation sweep shows 1 of the 6 orderings (raw
C,B,A) leaves the lower-importance same-rank hit ahead of the correct one. This is exactly the
scenario the surrounding comment documents ("Nguyễn Huệ, District 1, Ho Chi Minh City ... the
correct Nguyen Hue Boulevard (0.05340) came back 3rd") — and that query famously returns a rank-30
pedestrian-street POI interleaved with the rank-26 roads, which is precisely the interleaving that
defeats the fix.

Impact path (silent): mcp-server/src/geocode.ts:94 `resolveLocation` takes `const r = results[0]`
and renders it directly for the `render_map` tool with NO human in the loop, so the MCP server
silently renders the wrong geographic location for this common class of VN address searches.
`searchPlaces` is also shared by the web-app autocomplete (OnboardingModal / LocationPanel /
HighlightControls) and by `searchCandidates`/`geocode_place`; those surface a list a human can
override, so impact there is lower. A correct fix needs a total order, e.g. sort primarily by
keeping/among ranks and secondarily by importance (or bucket by rank, sort each bucket by
importance, then concatenate in first-seen rank order) rather than returning 0 for cross-rank pairs.

### 2. [MEDIUM] Region-highlight geocoding bypasses the VN canonicalization + city-guard that the point path enforces (asymmetric boundary in the same resolveConfig)

- **File:** `mcp-server/src/geocode.ts:138`
- **Severity:** medium
- **Source:** conventions

In resolveConfig, a highlight POINT string is resolved by resolveLocation (geocode.ts:61), which
runs the full VN pipeline: queryCandidates/normalizeVnQuery (Quận 3 -> District 3, TP.HCM -> Ho Chi
Minh City, drop leading Đường), the cityGuard filter, and the candidate-relaxation ladder. A
highlight REGION string goes resolveConfig.ts:116 -> resolveBoundary(r) (geocode.ts:138), which
passes the RAW string straight to fetchRegionBoundary({ name: r, country: '' }) ->
/search?q=<raw>&limit=1 (src/lib/geocoding.ts:111). None of normalizeVnQuery / queryCandidates /
cityGuard / relaxedCandidates is applied (grep confirms they are used only by resolveLocation and
searchCandidates). Same class of input, same function, two different treatments. Consequences in
exactly the case the VN work exists to fix: (a) a VN admin name like
highlight.regions:['Quận 3, HCMC'] is sent un-normalised — the form vnQuery.ts documents as
returning 0/unreliable hits — so resolveBoundary returns null and resolveConfig.ts:120 throws 'No
boundary found for region', i.e. AC-2 fails for VN region names even though the equivalent point
resolves fine; (b) with no cityGuard and limit=1, an ambiguous region (e.g. 'District 1') resolves
to whatever Nominatim ranks first globally, silently highlighting a same-named area in another
city/country — the precise wrong-place failure cityGuard was introduced to prevent on the point
path. This slipped past two review rounds + all evals because every region test mocks
resolveBoundary/fetch and returns a polygon regardless of query (resolveConfig.test.ts:11,
geocode.test.ts:118, tools.test.ts:21), and the only live VN probe
(scripts/check-vn-addresses.ts) calls resolveLocation exclusively, never resolveBoundary — so the
region path's real ranking behaviour is verified nowhere. Fix direction: route region strings
through the same normalize + city-guard + candidate ladder (and ideally the precise
osm_type/osm_id lookup) as the point path.

### 3. [LOW] HTTP transport does no Origin/Host (DNS-rebinding) validation on a side-effecting, unauthenticated endpoint — carried forward from Round 2

- **File:** `mcp-server/src/http.ts:65`
- **Severity:** low
- **Source:** conventions

The http.createServer handler and new StreamableHTTPServerTransport({ sessionIdGenerator:
undefined, enableJsonResponse: true }) (http.ts:65) validate neither Origin nor Host and do not set
enableDnsRebindingProtection / allowedHosts / allowedOrigins. These tools have real side effects
(drive a headless browser, write PNGs to sinkDir) with no auth (auth is out of scope). The default
bind is loopback (good — http.ts:49), but loopback does not stop a web page open in the operator's
browser from POSTing to http://127.0.0.1:4181/mcp via DNS-rebinding and triggering renders / disk
writes. NOTE: this was already logged as review-findings.md #3 (LOW) and remains OPEN at HEAD —
flagging it because it is squarely the requested 'missing validation at a system boundary' category
and MCP's own guidance recommends DNS-rebinding protection for local HTTP servers; contract.md
defers auth and frames this as an internal server-to-server service, so the team may consciously
accept it.

## Chưa adversarial-verify (refuter chết)

none — every finding above completed the full finder → refuter pass this round; no finding in the
input set carries `unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
