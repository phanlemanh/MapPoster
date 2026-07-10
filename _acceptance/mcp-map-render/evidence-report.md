---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 5ecac4ebeac533c82ea4586d032913d95b14e04e
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 2 — verified 2026-07-09T23:11:12Z (UTC) at commit `5ecac4e` on `feature/mcp-map-render`._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-12 | judgment | PENDING — panel proposes PASS (T3 requires human_override) |

## Evidence

_This round's implementation commit (`5ecac4e`) closed all 7 Round-1 review findings (F1–F7)
and added regression tests for each. Four commands produced this round's machine evidence:
`npm test` (vitest, 93 passed / 2 skipped — up from 85 passed / 1 skipped in Round 1, the delta
being the new F1–F7 regression tests — one aggregate run covering E1–E9 and E11 across
`mcp-server/src/*.test.ts`), `npm run test:e2e` (Playwright, 8 passed — includes the literal
AC-10 spec `e2e/render-mode.spec.ts:15:1`, corroborating E10), `npm run test:mcp` (vitest with
`MCP_INTEGRATION=1`, 2 passed — now exercises BOTH the original AC-1/AC-10 integration render
AND the new F1/AC-5 stale-frame regression, against a real built app + real headless browser),
and the dedicated `ui-check:E10` 4-frame screenshot run (E10's primary evidence per `evals.yaml`).
Each block below cites the specific current `it(...)` name(s)/line(s) it maps to (re-verified by
reading the test files at this commit, since several line numbers shifted when the F1–F7
regression tests were inserted); the full runner tail is reproduced per block for traceability._

- eval: E1
  run_id: minted-mcp-map-render-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:36 "geocodes the location and picks the format size (AC-1)";
    mcp-server/src/tools.test.ts:50 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:39 "renders a resolved config to an exact-size PNG (AC-1, AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  06:11:51
       Duration  9.61s (transform 22ms, setup 0ms, import 431ms, tests 8.78s, environment 310ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:53 "region highlight → boundary geojson + fitted camera (AC-2)";
    mcp-server/src/resolveConfig.test.ts:77 "throws when a requested region has no boundary — never silently drops it (F2)";
    mcp-server/src/tools.test.ts:87 "region with no boundary → structured error, not a silently unhighlighted poster (F2 / AC-2)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() ref: mcp-server/src/resolveConfig.test.ts:45 "point highlight → marker + street-level zoom 14–17 (AC-3)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() refs: mcp-server/src/geocode.test.ts:21 "caches identical queries and misses on different ones (AC-4)";
    mcp-server/src/geocode.test.ts:50 "serializes concurrent upstream calls and spaces them (F3/F6)" — new this round,
    regression-guards the genuinely-serialized rate limiter.
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() refs: mcp-server/src/tools.test.ts:97 "renders one image per variant (AC-5)";
    mcp-server/src/renderFrame.test.ts:51 "a reused pooled page renders each config fresh, never a stale frame (F1 / AC-5)"
    — new this round, was empirically shown to FAIL on the pre-fix code ("expected 1920 to be 1080");
    mcp-server/src/browserPool.test.ts:5 "never creates more than `size` resources under concurrent acquires (F5)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)
    Corroborating (integration depth, real build + real headless browser, now also covers the F1
    stale-frame regression): `npm run test:mcp`:
          Tests  2 passed (2)
       Start at  06:11:51
       Duration  9.61s (transform 22ms, setup 0ms, import 431ms, tests 8.78s, environment 310ms)

- eval: E6
  run_id: minted-mcp-map-render-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() ref: mcp-server/src/transports.test.ts:9 describe("transports expose the same tool set (AC-6)")
    — "lists all tools over stdio" at :10, "lists all tools over HTTP" at :23.
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() ref: mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path + base64 + dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:18 "resolves tiktok to 1080×1920 and passes custom dims through";
    mcp-server/src/resolveConfig.test.ts:27 "rejects non-positive, non-integer and oversized custom dims (F4)" — new
    this round, closes the AC-11-adjacent blank-PNG gap; mcp-server/src/tools.test.ts:59 "custom format dims flow
    through (AC-8)"; mcp-server/src/tools.test.ts:105 "list_formats includes tiktok 1080×1920 (AC-8)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:72 "chrome defaults to clean, poster is honored (AC-9)";
    mcp-server/src/tools.test.ts:65 "chrome defaults clean, poster honored (AC-9)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E10
  run_id: minted-mcp-map-render-E10-r2
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-09T23:11:12Z
  screenshot: evidence/E10-step1.png
  observed: |
    Đọc trực tiếp cả 4 file ảnh vừa lưu bằng Read (không suy diễn từ lệnh/log):

    - evidence/E10-step1.png (540x960, xác nhận bằng `file`): bản đồ vector nền midnight-blue (navy đậm) phủ kín TOÀN BỘ khung hình — sông Hồng chảy chéo giữa khung, một hồ lớn phía trên-trái, khu vực sân bay (đường băng dạng chữ X) phía phải, lưới phố dày đặc màu cam ở trung tâm-dưới, dòng attribution "© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre" ở góc dưới-phải. TUYỆT ĐỐI KHÔNG có dialog/modal/card "get started"/lớp phủ mờ nào — không có onboarding. Khớp Expected "no onboarding modal visible" → CONFIRMED.

    - evidence/E10-step2.png (540x960): về mặt hình ảnh giống hệt step1 (thậm chí trùng byte-size 578,869 bytes) — đây là điều ĐÚNG NHƯ KỲ VỌNG, vì renderFrame() compose ảnh lên một `<canvas>` off-screen mới, không gắn vào DOM đang hiển thị, nên gọi renderFrame() không làm thay đổi những gì thấy trên trang. Bằng chứng renderFrame() thực sự chạy nằm ở dữ liệu PNG nó trả về (kiểm ở bước 3), không phải ở thay đổi hình ảnh tại bước này. Không mâu thuẫn với Expected.

    - evidence/E10-step3.png (540x960): bản đồ y hệt bên dưới, cộng thêm một banner nền XANH LÁ chạy ngang đỉnh khung, đọc được ĐẦY ĐỦ (không bị cắt, tự xuống 2 dòng): "E10 independent check: IHDR decoded = 1080x1920 | expected 1080x1920 | PASS". Banner phản ánh đúng kết quả tôi tự giải mã byte IHDR của PNG trả về (không tin vào field width/height do chính trang tự echo). Khớp Expected "renderFrame() PNG is exactly 1080×1920" → CONFIRMED.

    - evidence/E10-rendered-output.png (bonus — chính là payload PNG THẬT do renderFrame() trả về, decode từ base64, KHÔNG phải screenshot trang): ảnh bản đồ Hà Nội sắc nét độ phân giải cao — sông, hồ, sân bay, lưới đường liền mạch, KHÔNG có tile trắng/vỡ/thiếu, KHÔNG có overlay tiêu đề thành phố (đúng với chrome:"clean" → showText=false). Kích thước 1080x1920 được xác nhận ĐỘC LẬP bằng hai công cụ hệ thống nằm NGOÀI script của tôi: `file` → "PNG image data, 1080 x 1920, 8-bit/color RGBA, non-interlaced"; `sips -g pixelWidth -g pixelHeight` → pixelWidth: 1080 / pixelHeight: 1920.

    Không có khung hình nào mâu thuẫn với Expected — cả 4 frame đều nhất quán với "no onboarding, ready resolves, renderFrame() PNG is exactly 1080×1920". Tất cả assertion PASS.
  output: |
    Dedicated ui-check run (3 required steps + screenshots: evidence/E10-step1.png, E10-step2.png,
    E10-step3.png) + bonus corroborating file (not one of the 3 required steps):
    E10-rendered-output.png = the actual renderFrame() PNG payload at its real 1080x1920 size.

    CLEANUP: removed temp verification script /Users/manhphan/dev/map/.e10-independent-verify.mjs;
    killed self-started dev server (npm PID 93626, vite PID 93649); confirmed port 5173 free again;
    confirmed no leftover chromium/playwright processes. `git status --short` shows only the 4
    evidence/*.png files changed — no source/code files touched (I did not modify code, per rules).

    Overall: exit 0, every assertion PASS, all 4 saved frames visually match Expected with no
    contradiction (see `observed`).

    Corroborating automated spec (same verifier command, `npm run test:e2e`):
    e2e/render-mode.spec.ts:15:1 "render mode: headless renderFrame yields exact target dims, no
    onboarding (AC-10)":
      ✓  8 [chromium] › e2e/render-mode.spec.ts:15:1 › render mode: headless renderFrame yields exact target dims, no onboarding (AC-10) (1.8s)

      8 passed (22.9s)

- eval: E11
  run_id: minted-mcp-map-render-E11-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T23:11:12Z
  output: |
    it() refs: mcp-server/src/tools.test.ts:72 "ungeocodable input → structured error, no throw (AC-11)";
    mcp-server/src/tools.test.ts:78 "invalid custom dims → structured error, never renders a blank PNG
    (F4 / AC-11)" — new this round, closes the {0,0}-dims blank-PNG gap.
    Shared `npm test` (vitest) aggregate tail:
          Tests  93 passed | 2 skipped (95)
       Start at  06:11:50
       Duration  2.03s (transform 706ms, setup 0ms, import 2.33s, tests 938ms, environment 7.35s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur). Individual votes:
    - domain-correctness: PASS — Anh 1080x1920 dung format tiktok; dau mui pin (diem highlight) nam tai (539.5, 959) so voi tam canvas chinh xac (540, 960) — lech <1px, tuc "centered" o muc gan tuyet doi. Pin trang tron vien sac net, tuong phan cao ro rang tren nen midnight-blue, hop le "legible"; luoi duong/toa nha lien mach, khong co o trong/mau placeholder tile loi, va van ban dau cau phuc tap "VIỆT NAM" (co dau) render dung khong bi vo font — khong thay dau hieu breakage nao trong anh evidence duy nhat nay.
    - operational-feasibility: PASS — Đo pixel trực tiếp trên ảnh 1080×1920: đầu nhọn của pin marker cách tâm khung hình chỉ ~1-2px trên cả hai trục (540.6 vs 540 ngang; 958 vs 960 dọc) — vị trí được center chính xác, và toạ độ hiển thị (10.7759°N, 106.6894°E) khớp hợp lý với khu vực Võ Văn Tần, Q3 (gần Hồ Con Rùa/Tao Đàn). Marker trắng đặc tương phản rất cao với nền navy midnight-blue, không bị chữ/đường che khuất — highlight rõ ràng, dễ đọc. Quét toàn ảnh theo lưới 128px không phát hiện khối màu phẳng nào (dấu hiệu tile lỗi/thiếu), mạng lưới đường màu vàng liền mạch tới sát biên bốn phía kèm attribution OSM/MapLibre hiển thị đúng — không có dấu hiệu vỡ tile/road, ảnh dùng được làm B-roll.
    - spec-alignment: PASS — Evidence PNG is exactly 1080×1920 (tiktok target); pixel analysis shows the white pin marker's anchor point sits at (~541, ~958) against a 1080×1920 frame — i.e. pixel-perfect on the vertical/horizontal center — and reads as a crisp white glyph against the dark navy base, clearly legible. The map renders as a continuous, unbroken street grid (amber roads, shaded building blocks, a roundabout feature) with a dominant navy/gold color histogram consistent with a midnight-blue theme and no blank/gray tile gaps or corruption, so on this single still the location is correctly centered, the highlight is legible, and tiles/roads show no breakage.
  human_override:
  # ^ REQUIRED before this item — and the overall verdict — can become PASS.
  # risk_tier: T3 (contract.md) mandates a direct human verdict on EVERY
  # judgment eval, regardless of the panel's proposal above. Open
  # evidence/E12-example.png yourself, compare against AC-12, then replace
  # this blank value with your name, a space, and today's ISO date
  # (optionally + a short note) so the line reads as reviewer-name plus date.
  # This item was ALSO pending human_override in Round 1 — unchanged this round;
  # AC-12's example image/config was not touched by the Round 1→2 fix commit.

## Analyst

Eval ids green-on-both (HEAD `5ecac4e` AND the pre-feature `diffBase` tree), via the shared
`npm test` command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause (unchanged from Round 1): all these assertions live in `mcp-server/src/*.test.ts`
(resolveConfig, tools, geocode, transports, delivery, browserPool), and the entire `mcp-server/`
package is net-new code introduced by this feature branch. On the `diffBase` tree those files
most plausibly do not exist yet, so `npm test` (vitest, glob `mcp-server/**/*.test.ts`) has
nothing to collect there — a vacuous pass, not a genuine behavior-equivalence pass. This is
expected for wholly-new-code evals (there is no "old behavior" to differentiate from). Note that
the Round-2 diff added several new regression tests (`browserPool.test.ts`, plus new `it()`
blocks in `geocode.test.ts`, `resolveConfig.test.ts`, `tools.test.ts` for F1–F7) — these inherit
the identical vacuous-pass-on-`diffBase` status for the same reason (the files/functions they
guard did not exist pre-feature either), so this is not a new gap, just a continuation of the
Round-1 finding. Gate 2 human should confirm the `diffBase` used for this A/B run actually
predates `mcp-server/` (expected) rather than a mis-resolved base that happens to already contain
this code.

## Variance

none — no eval this round used `runs > 1` (all machine evals are deterministic, single run, 1/1);
no flaky/racy variance observed across the captured commands (`npm test`, `npm run test:e2e`,
`npm run test:mcp`, `ui-check:E10` each exited 0 on their one recorded run).

## Iterations

- Round 1 (verified 2026-07-09T22:14:17Z, commit `ea639e9`): All 11 machine-verified evals (E1–E9,
  E11 via `npm test`; E10 via the dedicated ui-check screenshot run, corroborated by
  `npm run test:e2e` and `npm run test:mcp`) passed on the first attempt — 0 failures. E12 (AC-12,
  judgment) — 3-lens panel unanimously proposed PASS; overall verdict held at PENDING-JUDGMENT
  because risk_tier T3 mandates a direct `human_override` on every judgment item regardless of the
  panel's verdict. A full adversarial review this round (`review-findings.md`) surfaced 7 findings
  — 2 HIGH (reused pooled pages return a stale frame on hash-only navigation, breaking
  AC-5/AC-1/AC-8/AC-9 at runtime; a region whose boundary resolved to null was silently dropped
  instead of erroring, AC-2), 4 MEDIUM (Nominatim rate-limiter not actually serialized under
  concurrency, flagged independently by both the conventions and bugs lenses; format/coordinate
  numbers unvalidated at the MCP tool boundary allowing a blank PNG or pooled-page OOM; browser
  pool cap not enforced under concurrent `acquire()`), 1 LOW (unbounded `idle` wait can hang a
  render forever) — none of which the then-passing test suite could catch (it mocked render /
  rendered only once per fresh page). Returned to implementation before Gate 2.
- Round 2 (verified 2026-07-09T23:11:12Z, commit `5ecac4e`): Implementation closed all 7 Round-1
  findings in one commit ("close all 7 review findings + regression tests") — config now travels
  via `?query` plus a `configKey` guard (F1), a null region boundary now throws a structured error
  (F2), the Nominatim rate-limiter is genuinely serialized via a promise chain (F3/F6), Zod now
  bounds format/coordinate/zoom inputs on `render_map`'s base schema (F4), the pool reserves its
  slot before awaiting page creation (F5), and the render-mode idle wait now has a safety timeout
  (F7) — plus 5 new regression tests targeting exactly these gaps. All 11 machine evals still
  pass, now 93 passed | 2 skipped (up from 85 passed | 1 skipped), including the new regression
  coverage; E10's ui-check re-confirms exact 1080×1920 output and no onboarding. E12's panel
  re-affirms PASS (3/3 lenses); overall verdict remains PENDING-JUDGMENT because T3 still mandates
  a human `human_override` on E12 regardless of the panel's proposal, and that override was not
  yet supplied. A fresh adversarial pass this round (same commit `5ecac4e`) surfaced 4 NEW
  findings tracked in `review-findings.md` — 1 HIGH (transient Nominatim boundary-fetch failures,
  e.g. HTTP 429, are swallowed to `null` and then cached as a permanent "no boundary found" region
  error until process restart), 1 MEDIUM (`render_variants`' per-variant overrides bypass the F4
  coordinate/zoom validation bounds that `render_map`'s own base schema now enforces), 2 LOW (the
  HTTP transport binds all network interfaces with no Origin/DNS-rebinding check; the request-body
  string concatenation can corrupt multibyte UTF-8 that straddles a chunk boundary). None of these
  four are machine-eval regressions (all 11 machine evals still pass); they are informational for
  Gate 2 / follow-up, not blockers of this round's machine verdict.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify judgment item **E12** (AC-12) — panel proposed PASS; open
      `evidence/E12-example.png` yourself and confirm centering/highlight legibility/tile
      integrity, then fill its `human_override` line with your name and today's date
- [ ] T3 (this contract's `risk_tier: T3`): personally verify **every** judgment item and fill
      `human_override` on each (judge verdicts are advisory only; the hook blocks PASS without
      them) — E12 is currently the only judgment item
- [ ] Skim `review-findings.md` Round 2 (4 new findings this round: 1 HIGH — cached transient
      geocoding errors on the region-boundary path; 1 MEDIUM — `render_variants` validation gap;
      2 LOW — HTTP bind-all-interfaces/DNS-rebinding and UTF-8 chunk-boundary corruption) —
      informational, does not block Gate 2 by itself, but consider filing follow-up tickets
- [ ] If satisfied: upgrade `verdict: PENDING-JUDGMENT` to `verdict: PASS` in the frontmatter
      (this write is when the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract.md
