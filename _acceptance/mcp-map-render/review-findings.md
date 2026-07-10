# Review Findings: mcp-map-render (Round 5)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All findings below went
through the full finder → refuter adversarial-verify pass; none are flagged `unverified`, and no
review pass died mid-way this round (see "Review incomplete" at the bottom).

Verified at commit `ffb928b717a4acf133df91bbd0b59d6356fb99eb` (`feature/mcp-map-render`).

**Context vs. Round 4:** the Round-4 review (commit `4abeb9b`) surfaced 3 findings — 2 MEDIUM (the
new country-anchor invariant was itself silently bypassed when `location` is a `{lng,lat}`
coordinate object, since `resolveLocation` returns `country:''` on that branch; `theme` was the one
discrete param not validated at the MCP boundary, falling open to the default with no signal to the
caller) and 1 LOW (`resolved` omitted `highlights` vs. the Phase-1 design-spec tool contract). Round
4's verify passed all 12/12 evals with these 3 still open, and the human's Round-3→4 cap override
did not carry forward automatically, so the loop escalated again rather than looping unprompted
(`decisions.jsonl` `d-20260710T093000Z-43001`). The human (manh) authorised a second, scoped round 5
to close exactly those 3 (`d-20260710T093500Z-44001`). Commit `cadcff2` ("fix(mcp): anchor
coords-based renders to a country, reject unknown themes, echo resolved highlights") closed all
three: MEDIUM #1 via `resolveCountryAt(lng, lat)` — a reverse-geocode lookup that memoizes ONLY a
positive answer (deliberately not caching a transient outage as "no country", to avoid recreating
the Round-2 HIGH a third structural time) — threaded into `resolveConfig` whenever a highlight is
named by string and the location itself carries no country; MEDIUM #2 via `assertTheme()`, which now
rejects an unknown theme with the valid-id list, mirroring how `format` already throws; LOW #3 by
making `resolved` carry `theme` and `highlights:{regions:[{bbox,center}],points:[{lng,lat}]}`. A
follow-up commit (`ffb928b`) only strengthened `evals.yaml`'s `expected` text (strictly additive, no
criterion weakened) and touched no source. This round's fresh adversarial pass ran against `ffb928b`
and targeted the system boundary generally, since the last two rounds' HIGH/MEDIUM findings had both
come from "an invariant applies on one code path but not its sibling" — it surfaced the 2 findings
below, both MEDIUM, neither HIGH (the first round to close every open finding without
self-discovering a new HIGH of its own), and neither is a machine-eval regression (all 11 machine
evals still pass per `evidence-report.md`).

## Findings

### 1. [MEDIUM] appServer bind mọi network interface (0.0.0.0/::), phá invariant "loopback-by-default" của chính module — áp dụng cho MỌI deployment

- **File:** `mcp-server/src/appServer.ts:48`
- **Severity:** medium
- **Source:** conventions

Invariant an ninh trung tâm mà repo cố tình thiết lập và tài liệu hoá kỹ (README mục "MCP map-render
server" + http.ts:75-129): listener side-effecting/không xác thực bind loopback MẶC ĐỊNH, chỉ mở
0.0.0.0 khi opt-in tường minh và khi đó BẮT BUỘC khai báo MAPPOSTER_HTTP_ALLOWED_HOSTS. Listener MCP
(http.ts:88) đúng pattern: host mặc định 127.0.0.1 + isAllowedRequest() chặn DNS-rebinding. Nhưng
appServer.ts:48 `server.listen(cfg.appPort, resolve)` KHÔNG truyền host → Node bind mọi interface,
VÔ ĐIỀU KIỆN, và listener này KHÔNG có bất kỳ guard Host/Origin nào (chỉ chặn path-traversal). Mấu
chốt: makeRenderDeps (deps.ts:16) khởi động appServer cho CẢ hai transport (stdio.ts:7 và http.ts:87),
nên ngay cả một deployment "chỉ loopback" theo đúng mặc định README vẫn phơi port 4180 ra LAN — lời
hứa "loopback by default" bị phá âm thầm ở mọi deployment, không chỉ khi set 0.0.0.0. config.ts
(ServerConfig) cũng không hề có tham số host cho appServer để vá. Failure scenario: chạy `npm run
mcp:http` với cấu hình mặc định (MCP chỉ nghe loopback) — host bất kỳ trong cùng mạng vẫn GET được
http://<ip-server>:4180/render.html?config=... và toàn bộ asset trong dist/. Impact giới hạn ở phục
vụ asset tĩnh + harness render (không phải RCE), nhưng là vi phạm rõ ràng, phổ quát của invariant
trên một listener hoàn toàn không kiểm soát truy cập — trái ngược hẳn listener MCP anh em trong cùng
process.

### 2. [MEDIUM] readJsonBody đọc toàn bộ request body vào RAM không giới hạn kích thước — thiếu bound ở biên HTTP không xác thực

- **File:** `mcp-server/src/http.ts:23`
- **Severity:** medium
- **Source:** conventions

Biên hệ thống là transport HTTP mà README ghi rõ "The HTTP transport is unauthenticated". readJsonBody
(http.ts:20-35) gom mọi chunk vào `chunks: Buffer[]` rồi Buffer.concat, KHÔNG kiểm Content-Length,
không cap tổng bytes. Nó chạy SAU khi isAllowedRequest pass (http.ts:100 → 107), nhưng
isAllowedRequest CHỈ chặn Host/Origin — cả hai header đều giả mạo được bởi client non-browser (README
tự nói client server-to-server gửi Host và không gửi Origin; đúng loại request mà kẻ tấn công dựng
tay được). Đây là lỗ hổng "thiếu validation ở system boundary" và lệch với chính kỷ luật module tự
đặt: "Bounded at the system boundary: unbounded dims yield... or OOM the shared pooled browser page"
(tools.ts:103-108) — mọi tham số rời rạc khác (dim/lng/lat/zoom) đều bị chặn bằng Zod + assert
runtime, riêng đường đọc body thì hoàn toàn không giới hạn. Failure scenario: deployment hosted
(MAPPOSTER_HTTP_HOST=0.0.0.0, MAPPOSTER_HTTP_ALLOWED_HOSTS=maps.internal). Kẻ tấn công trong mạng gửi
POST /mcp với Host: maps.internal, không Origin, body vài GB (hoặc chunked stream không kết thúc) →
isAllowedRequest cho qua → chunks phình đến khi OOM cả process, kéo sập luôn browser pool dùng chung.
Bị khuếch đại thêm bởi highlight.regions[].geojson = z.any() (tools.ts:113) — payload "hợp lệ" cũng
có thể rất lớn.

## Chưa adversarial-verify (refuter chết)

none — every finding above completed the full finder → refuter pass this round; no finding in the
input set carries `unverified: true`.

## Review incomplete (finder chết)

none — no review pass failed to complete this round.
