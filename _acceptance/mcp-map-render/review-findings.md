# Review Findings: mcp-map-render (Round 4)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All findings below went
through the full finder → refuter adversarial-verify pass; none are flagged `unverified`, and no
review pass died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `4abeb9bc160c8bf511f5bec00c9673254ce48a93` (`feature/mcp-map-render`).

**Context vs. Round 3:** the Round-3 review (commit `433e7ea`) surfaced 3 findings — 1 HIGH
(`searchPlaces`'s sort comparator is non-transitive, so V8's sort can silently leave the wrong
same-named result at `results[0]`), 1 MEDIUM (region-highlight geocoding bypassed the VN
canonicalisation + city-guard that the point path already enforced), and 1 LOW carried forward from
Round 2 (HTTP transport had no Origin/Host DNS-rebinding validation). Round 3 hit the feature-loop's
3-round review cap with these still open and escalated to the human rather than auto-fixing into a
4th round (`decisions.jsonl` `d-20260710T075500Z-40001`). The human (manh) explicitly authorised a
**scoped** round 4 to close exactly those 3 findings (`d-20260710T080000Z-41001`). Commit `4abeb9b`
("fix(geocoding,mcp): total order for ranking, anchor highlights to a country, guard the HTTP
boundary") closed all three: the HIGH via a real total-order comparator (`rankThenImportance` —
bucket by `place_rank`, sort each bucket by importance, concatenate), the MEDIUM by routing region
strings through the same canonicalise → city-guard pipeline as points plus an exact
`osm_type=relation` lookup, and the LOW via a fail-closed Origin/Host allowlist
(`isAllowedRequest()`) on the HTTP transport. While closing the MEDIUM, the implementer's own live
probe against Nominatim surfaced a **new** HIGH no reviewer had raised — a bare region name like
`"District 1"` resolves to a real polygon in Liberia, and since region auto-framing follows the
region's bbox, `render_map` would silently render Liberia while `resolved.place` still said Ho Chi
Minh City. That was fixed with a country-anchor invariant (`expectCountry`) threaded through both
`resolveLocation` and `resolveBoundary` (`mcp-server/src/resolveConfig.ts`, `geocode.ts`), verified
against the live API. This round's fresh adversarial pass ran against `4abeb9b` and targeted
specifically the new invariant's own edges (does the anchor apply everywhere it should?) and the
system boundary generally; it surfaced the 3 findings below — none are HIGH, and none are
machine-eval regressions (all 11 machine evals still pass per `evidence-report.md`).

## Findings

### 1. [MEDIUM] Country-anchor invariant bị bỏ qua thầm lặng khi location là toạ độ {lng,lat}

- **File:** `mcp-server/src/resolveConfig.ts:116`
- **Severity:** medium
- **Source:** conventions

Invariant kiến trúc (README.md:73 và chính comment resolveConfig.ts:113-116): "every highlight is
anchored to the country of the location being rendered" — sinh ra để chặn đúng ca "District 1 -> hit
top ở Liberia" khiến auto-frame relocate cả poster. Nhưng anchor được suy ra bằng `const anchor =
base.place.country || undefined`, mà khi `location` là object toạ độ thì resolveLocation trả về
`country: ''` (geocode.ts:110-111), nên anchor = undefined. Hậu quả: mọi highlight dạng chuỗi
(`highlight.regions`/`points`) được resolve qua searchLadder với expectCountry=undefined ->
countryGuard cho qua tất cả. Failure scenario: render_map({ location: {lng:106.7,lat:10.78},
highlight:{ regions:['District 1'] } }) -> boundary top hit là District 1 ở Liberia, bboxOfRegions ->
auto-frame nhảy sang Liberia trong khi nhãn/label vẫn theo toạ độ VN. Đây chính là kịch bản mà
countryGuard được xây để chặn, nhưng nhánh toạ độ đi vòng qua nó. resolveConfig.test.ts chỉ test
invariant này cho location dạng chuỗi (dòng 36-49), không phủ nhánh toạ độ. Contract Zod (tools.ts)
cho phép kết hợp location toạ độ + highlight chuỗi, nên combo này hợp lệ về mặt input nhưng phá
invariant.

### 2. [MEDIUM] theme không được validate ở system boundary và fail-open (silent fallback), lệch pattern của chính module

- **File:** `mcp-server/src/tools.ts:122`
- **Severity:** medium
- **Source:** conventions

Pattern có sẵn ở boundary này là REJECT giá trị rời rạc không hợp lệ: `format` chuỗi lạ -> throw
'Unknown format' (resolveConfig.ts:67); `chrome`/`pointIcon`/`delivery` là z.enum; dim/lng/lat/zoom
được chặn bằng Zod + assert runtime kèm comment 'Bounded at the system boundary'. Riêng `theme:
z.string().optional()` (tools.ts:122) nhận bất kỳ chuỗi nào; resolveConfig.ts:110 gán thẳng
`params.theme ?? 'midnight-blue'` không kiểm tra; phía render getTheme (src/data/themes.ts:273-275)
`THEMES.find(...) ?? THEMES[0]` -> im lặng fallback về theme mặc định. Payload `resolved`
(tools.ts:53,64) KHÔNG echo theme nên caller không có cách phát hiện. Failure scenario: agent gọi
render_map({ location:'HCMC', theme:'rubby' }) (typo của 'ruby') -> nhận poster midnight-blue, không
lỗi, không tín hiệu. Với một MCP server phục vụ agent (không nhìn ảnh trực tiếp), đây là fail-open ở
boundary, không nhất quán với cách các param rời rạc khác bị từ chối.

### 3. [LOW] Output resolved thiếu trường highlights so với tool contract đã ghi trong design spec

- **File:** `mcp-server/src/tools.ts:53`
- **Severity:** low
- **Source:** conventions

Contract Phase 1 trong docs/superpowers/specs/2026-07-09-mcp-map-render-design.md:55 quy định
render_map/render_variants trả về `resolved:{ center, zoom, place, highlights }`. Cài đặt thực tế ở
render_map (tools.ts:53) và render_variants (tools.ts:64) chỉ trả `resolved: { center:
cfg.camera.center, zoom: cfg.camera.zoom, place: cfg.place }` — thiếu `highlights`. Đây là sai lệch
cụ thể, kiểm chứng được so với contract của repo; agent không nhận lại được thông tin vùng/điểm đã
resolve (vd geojson bbox/center của region) để đối chiếu. Mức thấp: có thể là cắt gọn chủ ý, nhưng
lệch với hợp đồng công cụ đã viết.

## Chưa adversarial-verify (refuter chết)

none — every finding above completed the full finder → refuter pass this round; no finding in the
input set carries `unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
