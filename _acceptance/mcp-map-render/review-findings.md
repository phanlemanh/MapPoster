# Review Findings: mcp-map-render (Round 2)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All findings below went
through the full finder → refuter adversarial-verify pass; none are flagged `unverified`, and no
review pass died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `5ecac4ebeac533c82ea4586d032913d95b14e04e` (`feature/mcp-map-render`).

**Context vs. Round 1:** the Round-1 review (commit `ea639e9`) surfaced 7 findings — 2 HIGH
(reused pooled pages return a stale frame on hash-only navigation; a null region boundary was
silently dropped instead of erroring), 4 MEDIUM (Nominatim rate-limiter not actually serialized,
flagged by both the conventions and bugs lenses; format/coordinate numbers unvalidated at the MCP
tool boundary; browser pool cap not enforced under concurrency), and 1 LOW (unbounded `idle` wait
can hang a render forever). Commit `5ecac4e` ("close all 7 review findings + regression tests")
closed all 7 with fixes + regression tests. This round's fresh adversarial pass ran against that
same commit and surfaced the 4 **new** findings below — none overlap the 7 closed ones, though
Finding 1 and Finding 2 are each a direct residual/side-effect of a Round-1 fix (noted inline).

## Findings

### 1. [HIGH] Transient Nominatim boundary-fetch failures are swallowed to null and cached permanently → region renders fail forever

- **File:** `mcp-server/src/geocode.ts:82`
- **Severity:** high
- **Source:** bugs

resolveBoundary() (`/Users/manhphan/dev/map/mcp-server/src/geocode.ts:81-84`) calls
fetchRegionBoundary(), whose search branch returns null on ANY non-ok HTTP status:
`if (!res.ok) return null;` (`/Users/manhphan/dev/map/src/lib/geocoding.ts:100`). That null
therefore conflates two very different cases — "the region genuinely has no polygon" and "the
upstream call transiently failed (429 rate-limit / 503 / 403)". resolveBoundary then
unconditionally caches it: `const geojson = b ? b.geojson : null; boundaryCache.set(key, geojson);`
(lines 82-83). Downstream, the F2 fix in resolveConfig
(`/Users/manhphan/dev/map/mcp-server/src/resolveConfig.ts`,
`if (!gj) throw new Error("No boundary found for region ...")`) turns that null into a hard error.

Failure scenario: `render_map({ location:'HCMC', highlight:{ regions:['Quận 3'] } })` is called
while Nominatim returns 429 (their own review-findings.md line 89 acknowledges 429/temporary-ban
is a real risk of the rate limiter). fetchRegionBoundary swallows the 429 to null →
resolveBoundary caches null under key 'quận 3' → resolveConfig throws "No boundary found for
region". Because the null is now cached, EVERY subsequent render of that region throws the same
"not found" error for the entire process lifetime (the HTTP transport is a long-lived server),
even after Nominatim fully recovers — the only recovery is a process restart. The transient error
is both (a) silently misclassified as "region does not exist" and (b) made permanent by the
cache.

Note the asymmetry that makes this a genuine defect and not intended behavior: the sibling path
resolveLocation() only caches on success and searchPlaces() THROWS on !res.ok (geocoding.ts:116),
so a transient geocode error there is surfaced and not cached — only the boundary path
swallows-and-caches. Fix: have fetchRegionBoundary distinguish !res.ok (throw/propagate) from
empty results (null), or have resolveBoundary refuse to cache when the failure was an HTTP error
rather than an empty result.

### 2. [MEDIUM] render_variants bo qua validation toa do/zoom o system boundary (khong dong tron finding #4)

- **File:** `/Users/manhphan/dev/map/mcp-server/src/tools.ts:132`
- **Severity:** medium
- **Source:** conventions

Round-1 finding #4 duoc dong bang cach them Zod bounds vao `renderMapShape` (tools.ts:94-113):
lng∈[-180,180], lat∈[-90,90], zoom∈[0,22], dim=int().positive().max(MAX_EDGE). Nhung
`render_variants` khai bao `variants: z.array(z.record(z.string(), z.any()))` (line 132) — moi
variant la record voi value `z.any()`, KHONG duoc validate. Handler
`renderOne({ ...params.base, ...v })` (tools.ts:63) merge base + variant, nen mot variant override
`location:{lng,lat}` hoac `camera:{center,zoom,bearing,pitch}` bang so ngoai range se di thang vao
RenderConfig roi vao headless map ma khong qua bat ky guard nao. `resolveConfig` chi co
`assertDim` (resolveConfig.ts:37-42) chan width/height; toa do/zoom di qua `resolveLocation`
(coords pass-through, resolveConfig.ts:107 va cam merge 118-119) hoan toan khong kiem tra. Hau
qua: variant render bi mis-frame am tham (MapLibre clamp lat/zoom, wrap lng, khong loi) — dung
dung lop 'out-of-range coords silently mis-frame' ma fix F4 nham ngan o boundary, chi con thieu o
dung tool render_variants. Base cua chinh render_variants thi lai duoc validate
(`z.object(renderMapShape)`), nen do la bat doi xung ro rang. Kiem chung: tools.test.ts:78-85 chi
test invalid dims cho render_map, khong co case nao cho variant coords/zoom. Huong sua (khong tu
fix): `variants: z.array(z.object(renderMapShape).partial())`. Lien quan (cung ho `z.any()` o
boundary, muc do thap hon vi MapLibre loi se degrade thanh failed render chu khong crash):
object-region `geojson: z.any()` tai highlightSchema (tools.ts:102) — ap dung ca cho render_map —
cung khong validate GeoJSON dau vao.

### 3. [LOW] HTTP transport bind moi interface + khong co Origin/DNS-rebinding validation o request boundary

- **File:** `/Users/manhphan/dev/map/mcp-server/src/http.ts:35`
- **Severity:** low
- **Source:** conventions

`server.listen(port, resolve)` (http.ts:45) khong truyen host nen Node bind vao unspecified
address (:: / 0.0.0.0) — tuc mo tren toan bo interface, khong chi localhost (url tra ve
'localhost' chi la nhan quang cao, khong phai dia chi bind). `new StreamableHTTPServerTransport({
sessionIdGenerator: undefined, enableJsonResponse: true })` (http.ts:35) khong bat
`enableDnsRebindingProtection` / khong set `allowedHosts` / `allowedOrigins`, va handler
`http.createServer` cung khong kiem tra Origin/Host header. Vi day la MCP tool co side-effect
(dieu khien headless browser + ghi file vao sinkDir), bat ky host nao trong LAN — hoac bat ky
trang web nao mo trong browser cua operator qua DNS-rebinding — deu co the POST vao endpoint va
trigger render/ghi file (CORS khong chan viec REQUEST duoc xu ly server-side, va DNS-rebinding
vuot qua same-origin). Luu y scope: contract.md defer 'per-caller auth, quotas' va mo ta 'internal
server-to-server service only', nen reviewer co the coi day la ngoai pham vi; van bao vi day la
mot request boundary khong co validation va guidance chinh thuc cua MCP khuyen bind server HTTP
local vao 127.0.0.1 + bat DNS-rebinding protection. Huong sua (khong tu fix): bind 127.0.0.1
va/hoac set `enableDnsRebindingProtection: true` voi `allowedHosts`/`allowedOrigins`.

### 4. [LOW] HTTP request body assembled via string concatenation corrupts multibyte UTF-8 split across chunk boundaries

- **File:** `mcp-server/src/http.ts:25`
- **Severity:** low
- **Source:** bugs

In `/Users/manhphan/dev/map/mcp-server/src/http.ts:24-29` the request body is built as
`let data = ''; req.on('data', (chunk) => (data += chunk)); ... JSON.parse(data)`. `chunk` is a
Buffer, so `data += chunk` decodes each chunk to UTF-8 INDEPENDENTLY. If a multibyte UTF-8
sequence straddles a chunk boundary, each half is decoded separately and turned into U+FFFD
replacement characters, corrupting the string. This app's payloads make the trigger realistic:
`highlight.regions[].geojson` can be passed inline (a full polygon FeatureCollection, easily
exceeding one ~16KB chunk), and location strings routinely contain multibyte Vietnamese characters
(e.g. 'Võ Văn Tần', 'Quận 3').

Failure scenario: a render_map POST whose body exceeds a single 'data' chunk, with a multibyte
character (e.g. 'ậ') falling exactly on the chunk boundary. The two byte-halves each decode to
replacement chars; JSON.parse then either throws (client gets a 400 'invalid json' for a request
that was actually valid) or, if the corrupted bytes still form valid JSON, silently yields a
mangled location string that geocodes to the wrong place. Standard fix: collect chunks into an
array and `Buffer.concat(chunks).toString('utf8')` before JSON.parse. Confidence that the code is
defective is high; severity is low only because triggering requires the byte-boundary coincidence
and the more common outcome is a loud 400 rather than a silent mis-geocode.

## Chưa adversarial-verify (refuter chết)

none — every finding above completed the full finder → refuter pass this round; no finding in the
input set carries `unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
