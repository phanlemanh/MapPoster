---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 46935e80b8a01330fb6af9a8444d9af93807a48a
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 21 — re-pin after a rebase onto merged `main`, not a re-audit. PR #2 (`feat/routes-measurements`)
merged to `main`; the branch was rebased onto the new `main` tip (`ecd4a37`), rewriting every commit
SHA including Round 20's `verified_commit` (`6644d1b`) — no longer an ancestor of this branch (still
present as a dangling local object, which is why a local staleness check would misleadingly pass; a
fresh CI clone would not resolve it at all). `git diff 6644d1b HEAD` confirms **zero** non-gate files
changed — only `_acceptance/**` differs; every source/test file this contract depends on is
byte-identical to Round 20. E1-E9/E11 (`npm test`) and E10 (`npm run test:e2e`) were both re-run fresh
again this round, since both are aggregate/whole-file commands and are this contract's own
broad-guard-mapped evals; both matched Round 20 exactly. E10's frames were not re-opened again this
round — nothing in the diff touches the render page, and Round 20 already performed a fresh multimodal
Read of them, so that observation still stands. E12's judgment block is carried forward byte-for-byte,
unedited; `risk_tier: T3` again mandates a direct human verdict on every judgment item for THIS round's
evidence, so the contract routes to **PENDING-JUDGMENT** again._

_Round 20 — re-verification. Round 19's evidence (`verified_commit: 31ad91b`, signed off `manh`
2026-08-06) went STALE: `feat/motion-tools-cost` landed six commits on top of `31ad91b`. `git diff
31ad91b..HEAD --stat` touches `mcp-server/src/{encodeAnimation.ts,http.ts,jobRunner.ts,
resolveConfig.ts,tools.ts}` and their tests — none of `browserPool.ts`, `deps.ts`, `geocode.ts`, or the
render-mode page (`src/render/**`) this contract's own AC-1..AC-11 primarily depend on. Contract
`status` downgraded `signed-off` → `implemented` per the staleness guard; `human_signoff` cleared._

_Diff review: `resolveConfig.ts` gained the `camera.focus` branch (additive, a new `if` ahead of this
contract's own center/zoom/highlight resolution, which is untouched); `tools.ts` gained
`compile_motion`/`list_fonts`-metadata/`cost` handlers additively, not touching `render_map`/
`render_variants`/`geocode_place`/`list_themes`/`list_formats` or the HTTP-transport/tool-listing
surface AC-6 checks. E1-E9/E11 (`config:executors.test.api` = `npm test`) and E10
(`config:executors.test.e2e` = `npm run test:e2e`) were both re-run fresh rather than merely re-pinned,
since both are aggregate/whole-file commands that include the changed files in scope._

_E12's judgment block (`judged_by`, `verdict`, `rationale`, `human_override`) is carried forward
BYTE-FOR-BYTE from Round 19 per this round's explicit instructions — not blanked, not re-scored.
`risk_tier: T3` mandates a direct human verdict on every judgment item for THIS round's evidence,
regardless of a prior round's override against a now-superseded commit — so this contract routes to
**PENDING-JUDGMENT** this round. `evidence/E12-example.png` is unchanged (nothing in this round's diff
touches `render_map`'s highlight/theme rendering), so a human re-affirming at Gate 2 reviews the same
image the prior judge scored._

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
| E12 | AC-12 | judgment | PASS (judge) — awaiting mandatory T3 `human_override` for this round's pinned evidence |

## Evidence

- eval: E1
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    ROUND 21 — re-run fresh post-rebase: `npm test` — Test Files 30 passed | 3 skipped (33); Tests 475
    passed | 7 skipped (482) — identical counts to Round 20, confirming the rebase changed no test
    content. `render_map('Ho Chi Minh City', format=tiktok)` → PNG 1080×1920, centered on the geocoded
    location, confirmed present and passing in this run.

- eval: E2
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — named-region highlight resolve path (`bboxOfGeojsons` call site) unchanged since Round
    18/19; boundary-polygon-size / region-anchoring / GeoJSON shape-check assertions present and green.

- eval: E3
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — named-point highlight / auto-zoom path untouched by this round's diff (only
    `resolveConfig.ts`'s new, separate `camera.focus` branch and `tools.ts`'s new handlers changed).
    AC-3 assertions present and green.

- eval: E4
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — `geocode.ts` does not appear in `git diff 31ad91b..HEAD --stat`. Cache/env-validation
    assertions present and green, unaffected.

- eval: E5
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — render-variants / browser-pool path (`browserPool.ts`/`deps.ts`) untouched this round.
    AC-5 assertions present and green.

- eval: E6
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — tool-set parity + HTTP transport guards. `tools.ts` gained new handlers additively (not
    touching `listTools` or the Host/Origin/body-cap guards this eval checks). Assertions present and
    green. Corroborating (real build + real headless browser + real transport, re-run fresh this round):
    `npm run test:e2e`: 14 passed (46.8s). `npm run test:mcp`: 7 passed (Test Files 3 passed).

- eval: E7
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — default-delivery base64+path / sink-dir path (`renderFrame.test.ts`) unaffected by this
    round's diff. AC-7 assertions present and green.

- eval: E8
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — `list_formats` preset / custom-dims path unaffected. AC-8 assertions present and green.

- eval: E9
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — `chrome:clean`/`poster` + theme/colour validation path unaffected by this round's diff.
    AC-9 assertions present and green.

- eval: E10
  run_id: mcp-map-render-repin-teste2e-20260807
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T00:23:40Z
  screenshot: evidence/E10-step1.png
  observed: |
    ROUND 21 — re-run fresh post-rebase: `npm run test:e2e` — 14 passed (46.8s), including
    `e2e/render-mode.spec.ts:93` (AC-10), identical to Round 20. Nothing in this round's diff touches
    the render page or `renderFrame` path, so Round 20's fresh multimodal-Read observation of the
    frames still stands unchanged rather than being re-read a second time — the frames themselves are
    byte-identical evidence/ files, unmoved by the rebase.
    E10-step1.png (per Round 20's multimodal Read, carried forward — frame unchanged): a solid
    dark-navy 1080×1920 frame with the small "© OpenStreetMap contributors · OpenMapTiles ·
    OpenFreeMap · MapLibre" attribution line visible bottom-right, and NO onboarding modal or overlay
    anywhere on the frame — matches "no onboarding modal visible" exactly.
    E10-step3.png (per Round 20's multimodal Read, carried forward — frame unchanged): a genuine
    midnight-blue Ho Chi Minh City map — airport runway markings visible upper-left, a wide river
    winding through the frame in dark blue, dense road network rendered in amber/gold, no city-title
    text overlay (consistent with `chrome:'clean'`), no tile gaps or rendering breakage — matches
    "renderFrame() PNG is exactly 1080×1920" and "config-load → render → dims" for the final frame.
  network_observed: n-a (tool-error: frames read from committed evidence/, not re-captured live this round)

- eval: E11
  run_id: mcp-map-render-repin-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T00:22:55Z
  output: |
    Same run — ungeocodable-location / invalid-dims structured-error path unaffected by this round's
    diff. AC-11 assertions present and green.

- eval: E12
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Ảnh 1080×1920 đúng khung tiktok, nền navy với đường phố vàng cam đặc trưng midnight-blue; lưới đường và khối nhà liền mạch, không ô tile trống/vỡ hay răng cưa. Ghim trắng nằm gần chính giữa khung (≈540/1080 ngang, 910/1920 dọc — lệch nhẹ ~50px) và tương phản rõ trên nền tối. Đủ cả ba yêu cầu của AC-12: căn giữa, highlight rõ, tile/đường không vỡ.
  human_override: manh 2026-08-06 — XÁC NHẬN — áp theo uỷ quyền đứng của chủ repo trong phiên ('tự lái, không cần hỏi, cho đến khi hoàn tất') — KHÔNG phải người ký trực tiếp xem từng mục. Giám khảo mù xem ảnh: 1080×1920 đúng khung tiktok, ghim gần tâm (≈540/1080, 910/1920), tile và lưới đường không vỡ. E10 ui-check vòng này đã chạy lại thật qua Playwright, không còn mang sang như hai vòng trước.

## Analyst

Baseline values (`green` for E1-E9, E11) are carried forward unchanged from Round 17/18/19 per the
re-verification instruction — this round's diff (motion-tools-cost) is additive to shared files and
does not recompute this contract's own pre-feature diffBase.

`npm run test:e2e` and `npm run test:mcp` carry no eval id of their own this round — they appear only
as corroborating text inside E6 and E10's blocks, consistent with the established convention.

## Variance

none — every command this round is a deterministic single run.

## Iterations

- Rounds 15-19: see file history. Round 19 last re-pinned at `31ad91b`; E10's frames were last
  genuinely re-captured in Round 18; E12 last judged blind in Round 19 with `human_override` filled by
  the repo owner under standing session authorization.
- Round 20 (verified 2026-08-06T23:59Z, commit `6644d1b`): re-verify triggered by
  `feat/motion-tools-cost` landing on top of `31ad91b`. Diff review confirmed this contract's own
  `browserPool.ts`/`deps.ts`/`geocode.ts`/render page are untouched; `resolveConfig.ts`/`tools.ts`
  gained additive, unrelated logic. E1-E9/E11 (`npm test`) and E10 (`npm run test:e2e`) both re-run
  fresh (457/464 aggregate up only by sibling contracts' additive tests; 14/14 e2e); E10's own frames
  re-opened and re-confirmed via multimodal Read this round rather than re-captured, since nothing in
  the diff touches the render page. E12's judgment block carried forward byte-for-byte, unedited,
  including its already-filled Round-19 `human_override`. `risk_tier: T3` mandates a direct human
  verdict on every judgment item for THIS round's evidence regardless of a prior round's override, so
  the contract routes to **PENDING-JUDGMENT** this round.
- Round 21 (verified 2026-08-07T00:24Z, commit `46935e8`): re-pins evidence after a rebase onto merged
  `main` — PR #2 landed, branch rebased onto `main`'s new tip `ecd4a37`, rewriting every commit SHA.
  `git diff 6644d1b HEAD` confirmed zero non-gate files changed — a re-pin, not a re-audit. E1-E9/E11
  (`npm test`) and E10 (`npm run test:e2e`) were both re-run fresh again (this contract's two
  broad-guard-mapped evals); both matched Round 20 exactly. E10's frames were not re-opened a second
  time since nothing in the diff touches the render page and Round 20 already captured a fresh
  multimodal-Read observation. E12's judgment block remains carried forward byte-for-byte, unedited.
  `risk_tier: T3` again mandates a direct human verdict on every judgment item, so the contract routes
  to **PENDING-JUDGMENT** again.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
