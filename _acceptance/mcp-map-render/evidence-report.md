---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ea639e912469455aa6bd44b1322a23cd724af035
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 1 — verified 2026-07-09T22:14:17Z (UTC) at commit `ea639e9` on `feature/mcp-map-render`._

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

_Four commands produced this round's machine evidence: `npm test` (vitest, 85 passed / 1 skipped — one aggregate run covering E1–E9 and E11 across `mcp-server/src/*.test.ts`), `npm run test:e2e` (Playwright, 8 passed — includes the literal AC-10 spec `e2e/render-mode.spec.ts:15:1`, corroborating E10), `npm run test:mcp` (vitest with `MCP_INTEGRATION=1`, 1 passed — re-runs `renderFrame.test.ts` against a real built app + real headless browser, corroborating E1/E10 at integration depth), and the dedicated `ui-check:E10` 3-step screenshot run (E10's primary evidence per `evals.yaml`). Each block below cites the specific `it(...)` name(s) it maps to; the full runner tail is reproduced per block for traceability._

- eval: E1
  run_id: minted-mcp-map-render-E1-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:28 "geocodes the location and picks the format size (AC-1)";
    mcp-server/src/tools.test.ts:48 "renders and echoes resolved center/place (AC-1)";
    mcp-server/src/renderFrame.test.ts:31 "renders a resolved config to an exact-size PNG (AC-1, AC-10)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)
    Corroborating (integration depth, real build + real headless browser): `npm run test:mcp`:
          Tests  1 passed (1)
       Start at  05:18:17
       Duration  5.38s (transform 20ms, setup 0ms, import 405ms, tests 4.69s, environment 221ms)

- eval: E2
  run_id: minted-mcp-map-render-E2-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() ref: mcp-server/src/resolveConfig.test.ts:45 "region highlight → boundary geojson + fitted camera (AC-2)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E3
  run_id: minted-mcp-map-render-E3-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() ref: mcp-server/src/resolveConfig.test.ts:37 "point highlight → marker + street-level zoom 14–17 (AC-3)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E4
  run_id: minted-mcp-map-render-E4-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() ref: mcp-server/src/geocode.test.ts:21 "caches identical queries and misses on different ones (AC-4)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E5
  run_id: minted-mcp-map-render-E5-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() ref: mcp-server/src/tools.test.ts:78 "renders one image per variant (AC-5)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E6
  run_id: minted-mcp-map-render-E6-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() ref: mcp-server/src/transports.test.ts:9 describe("transports expose the same tool set (AC-6)").
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E7
  run_id: minted-mcp-map-render-E7-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() ref: mcp-server/src/delivery.test.ts:24 "mode=both writes a file and returns path + base64 + dims (AC-7)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E8
  run_id: minted-mcp-map-render-E8-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:54 "custom format dims flow through (AC-8)";
    mcp-server/src/tools.test.ts:57 "custom format dims flow through (AC-8)";
    mcp-server/src/tools.test.ts:86 "list_formats includes tiktok 1080×1920 (AC-8)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E9
  run_id: minted-mcp-map-render-E9-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() refs: mcp-server/src/resolveConfig.test.ts:64 "chrome defaults to clean, poster is honored (AC-9)";
    mcp-server/src/tools.test.ts:63 "chrome defaults clean, poster honored (AC-9)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E10
  run_id: minted-mcp-map-render-E10-r1
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.e2e
  verified_at: 2026-07-09T22:14:17Z
  screenshot: evidence/E10-step1.png
  observed: |
    Read all 3 saved step frames directly (images) plus the bonus rendered-output PNG:

    E10-step1.png (540x960): A full-bleed dark "noir"-theme vector map filling the ENTIRE viewport — white road lines, a dark lake, a river, dense street grid (Hanoi), small attribution text "© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre" in the bottom-right corner. There is NO dialog box, NO "get started" card, NO dimmed backdrop, no modal of any kind anywhere in the frame. Matches Expected: "no onboarding modal visible" — CONFIRMED.

    E10-step2.png (540x960): Visually identical to step1 — same map, same framing, still no modal/dialog visible anywhere. This is the expected/correct look for this step: renderFrame() composites the poster onto a brand-new off-screen `<canvas>` element that is never appended to the visible document, so calling it does not change what's on screen. The real proof that renderFrame() worked is the PNG data it returned (checked in step 3), not a visual change here. No contradiction with Expected.

    E10-step3.png (540x960): Same map underneath, now with a solid green banner bar across the top reading "E10 independent check: renderFrame() PNG decoded IHDR = 1080x1920" (the tail end of the sentence — "expected 1080x1920 | PASS" — runs past the 540px-wide viewport edge and is clipped from the screenshot, but the load-bearing figure "1080x1920" is fully legible). Green fill = my script's own pass/fail branch, only true because width===1080 && height===1920 held. Matches Expected: "renderFrame() PNG is exactly 1080×1920" — CONFIRMED.

    E10-rendered-output.png (bonus, the real renderFrame() PNG payload, 1080x1920 confirmed independently by macOS `file`/`sips`, a tool outside my own script): a crisp, high-resolution noir-theme map of Hanoi — roads, lake, river, attribution bottom-right — no blank tiles, no broken layers, no stray title/text overlay (consistent with chrome:'clean' → showText=false). Nothing here contradicts Expected either.

    Nothing observed in any frame contradicts the Expected outcome, so all 3 step assertions plus the 3 independent dimension checks stand as PASS.
  output: |
    Dedicated ui-check run (3 steps + screenshots: evidence/E10-step1.png, E10-step2.png, E10-step3.png):
    + bonus corroborating file (not one of the 3 required steps): E10-rendered-output.png = the actual renderFrame() PNG payload at its real 1080x1920 size.

    CLEANUP: killed dev server pid 85948 (self-started); confirmed port 5173 free again and no leftover vite/chromium processes.

    Corroborating automated spec (same verifier command, `npm run test:e2e`): e2e/render-mode.spec.ts:15:1 "render mode: headless renderFrame yields exact target dims, no onboarding (AC-10)":
      ✓  8 [chromium] › e2e/render-mode.spec.ts:15:1 › render mode: headless renderFrame yields exact target dims, no onboarding (AC-10) (1.9s)

      8 passed (21.1s)

- eval: E11
  run_id: minted-mcp-map-render-E11-r1
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-07-09T22:14:17Z
  output: |
    it() ref: mcp-server/src/tools.test.ts:70 "ungeocodable input → structured error, no throw (AC-11)".
    Shared `npm test` (vitest) aggregate tail:
          Tests  85 passed | 1 skipped (86)
       Start at  05:18:18
       Duration  1.82s (transform 497ms, setup 0ms, import 1.69s, tests 671ms, environment 7.38s)

- eval: E12
  judged_by: judge panel — domain-correctness, operational-feasibility, spec-alignment (fresh context each)
  verdict: PASS
  rationale: |
    Panel proposal: PASS (3/3 lenses concur). Individual votes:
    - domain-correctness: PASS — Pixel analysis confirms the canvas is exactly 1080×1920 (tiktok) and the white pin's anchor tip sits at ~(541,959), within 1px of true center (540,960); an independent Nominatim geocode of "Võ Văn Tần, Quận 3, HCMC" returns 10.7758788/106.6893957, matching the image's own "10.7759° N · 106.6894° E" label exactly, so the location is correctly centered on the right place. The teardrop highlight is high-contrast white-on-navy and unambiguous, and quadrant-by-quadrant plus pixel-variance scans (full alpha=255 everywhere, no anomalous uniform blocks, roads/buildings continuous edge-to-edge including the roundabout area) show no tile breakage, seams, or blank regions — the midnight-blue render is coherent and usable as B-roll.
    - operational-feasibility: PASS — Đo pixel trực tiếp trên ảnh 1080×1920: đầu nhọn của pin marker cách tâm khung hình chỉ ~1-2px trên cả hai trục (540.6 vs 540 ngang; 958 vs 960 dọc) — vị trí được center chính xác, và toạ độ hiển thị (10.7759°N, 106.6894°E) khớp hợp lý với khu vực Võ Văn Tần, Q3 (gần Hồ Con Rùa/Tao Đàn). Marker trắng đặc tương phản rất cao với nền navy midnight-blue, không bị chữ/đường che khuất — highlight rõ ràng, dễ đọc. Quét toàn ảnh theo lưới 128px không phát hiện khối màu phẳng nào (dấu hiệu tile lỗi/thiếu), mạng lưới đường màu vàng liền mạch tới sát biên bốn phía kèm attribution OSM/MapLibre hiển thị đúng — không có dấu hiệu vỡ tile/road, ảnh dùng được làm B-roll.
    - spec-alignment: PASS — Evidence PNG is exactly 1080×1920 (tiktok target); pixel analysis shows the white pin marker's anchor point sits at (~541, ~958) against a 1080×1920 frame — i.e. pixel-perfect on the vertical/horizontal center — and reads as a crisp white glyph against the dark navy base, clearly legible. The map renders as a continuous, unbroken street grid (amber roads, shaded building blocks, a roundabout feature) with a dominant navy/gold color histogram consistent with a midnight-blue theme and no blank/gray tile gaps or corruption, so on this single still the location is correctly centered, the highlight is legible, and tiles/roads show no breakage.
  human_override:
  # ^ REQUIRED before this item — and the overall verdict — can become PASS.
  # risk_tier: T3 (contract.md) mandates a direct human verdict on EVERY
  # judgment eval, regardless of the panel's proposal above. Open
  # evidence/E12-example.png yourself, compare against AC-12, then replace
  # this blank value with your name, a space, and today's ISO date
  # (optionally + a short note) so the line reads as reviewer-name plus date.

## Analyst

Eval ids green-on-both (HEAD `ea639e9` AND the pre-feature `diffBase` tree), via the shared `npm test` command — non-discriminating this round:

- E1, E2, E3, E4, E5, E6, E7, E8, E9, E11

Likely cause: all eleven assertions live in `mcp-server/src/*.test.ts` (resolveConfig, tools, geocode, transports, delivery), and the entire `mcp-server/` package is net-new code introduced by this feature branch (git log: c3cb584, 2f6b95e, e273f7c, e215f02, ea639e9). On the `diffBase` tree those files most plausibly do not exist yet, so `npm test` (vitest, glob `mcp-server/**/*.test.ts`) has nothing to collect there — a vacuous pass, not a genuine behavior-equivalence pass. This is expected for wholly-new-code evals (there is no "old behavior" to differentiate from) and is flagged here per the template's rule rather than silently trusted. Gate 2 human should confirm the `diffBase` used for this A/B run actually predates `mcp-server/` (expected) rather than a mis-resolved base that happens to already contain this code.

## Variance

none — no eval this round used `runs > 1` (all machine evals are deterministic, single run, 1/1); no flaky/racy variance observed across the captured commands (`npm test`, `npm run test:e2e`, `npm run test:mcp`, `ui-check:E10` each exited 0 on their one recorded run).

## Iterations

- Round 1 (verified 2026-07-09T22:14:17Z, commit `ea639e9`): All 11 machine-verified evals (E1–E9, E11 via `npm test`; E10 via the dedicated ui-check 3-step screenshot run, corroborated by the `npm run test:e2e` AC-10 spec and the `npm run test:mcp` integration re-run) passed on the first attempt — 0 failures, no re-implementation loop this round. E12 (AC-12, judgment) — 3-lens panel (domain-correctness, operational-feasibility, spec-alignment) unanimously proposed PASS; overall verdict held at PENDING-JUDGMENT because risk_tier T3 mandates a direct `human_override` on every judgment item regardless of the panel's verdict. Awaiting Gate 2.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify judgment item **E12** (AC-12) — panel proposed PASS; open `evidence/E12-example.png` yourself and confirm centering/highlight legibility/tile integrity, then fill its `human_override` line with your name and today's date
- [ ] T3 (this contract's `risk_tier: T3`): personally verify **every** judgment item and fill `human_override` on each (judge verdicts are advisory only; the hook blocks PASS without them) — E12 is currently the only judgment item
- [ ] If satisfied: upgrade `verdict: PENDING-JUDGMENT` to `verdict: PASS` in the frontmatter (this write is when the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract.md
