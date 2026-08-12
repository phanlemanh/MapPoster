---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 637ae403b478e6722ed8d37410426ac0d34e0657
human_signoff:
---

# Evidence Report: mcp-map-render

_Round 26 — `main` merged into this branch at `637ae403b478e6722ed8d37410426ac0d34e0657`. Prior evidence was pinned to `535ee8e8` (Round 25); `git diff --name-only 535ee8e HEAD` shows the merge adds exactly three non-gate files on top of that commit: `src/lib/format.ts`, `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts`. The `format.ts` change is a bug fix inside `slugify()`: two `.replace()` calls — `[ĐÐ] → 'D'` and `[đð] → 'd'` — now run BEFORE `.normalize('NFKD')`. Rationale in the diff's own comment: `Đ`/`đ` (U+0110/U+0111) and their look-alikes `Ð`/`ð` (U+00D0/U+00F0) are precomposed letters-with-stroke, not base+combining-diacritic; NFKD does not decompose them and `\p{Diacritic}` does not match the stroke, so previously they survived to the `[^a-zA-Z0-9]+` strip step and were deleted outright (`'Đà Nẵng' → 'a-nang'`, dropping the `D`/`đ` consonant instead of transliterating it). Now they map to plain `D`/`d` first, so `'Đà Nẵng' → 'da-nang'`._

_`mcp-server/src/tools.ts:59` builds the render-artifact filename as `` `mapposter-${slugify(cfg.place.name || 'map')}-${cfg.size.width}x${cfg.size.height}-${counter++}` `` — this contract's render surface directly consumes the patched `slugify()`. I checked `contract.md`'s AC-1..AC-12 and `evals.yaml`'s E1..E12 for any assertion on filename/slug content: none exists. Every AC that touches naming talks about PNG pixel dimensions, geocoded center, highlight layers/markers, cache hit counts, tool listing, delivery envelope (base64 + `path` existing on disk), format presets, `chrome` overlay presence, structured-error shape, or B-roll usability (AC-12, judgment) — none asserts what the `path` basename actually contains. So the `slugify` fix is in this contract's blast radius (it consumes the function) but not in its assertion surface (nothing here checks the string it produces); no eval needed re-derivation, only re-running for regression safety._

_Ran every machine eval fresh this round, no selective re-pin: `npm test` → Test Files 31 passed | 3 skipped (34), Tests 499 passed | 7 skipped (506), exit 0 — matches the expected baseline exactly. It is 499 not 501 because `535ee8e` (Round 25) deleted the two dead `centroidOf` tests from `mcp-server/src/geometry.test.ts`; not a discrepancy introduced by this round. `npm run test:mcp` → 3 test files, 7 passed, exit 0. `npm run test:e2e` → 14 passed (47.1s) via real Chromium, including `e2e/render-mode.spec.ts:93` (AC-10) and `e2e/mapposter.spec.ts:222` (export PNG download, which itself calls the patched `slugify()`-adjacent export path) — no regression from the diacritic fix._

_E12 (judgment): the blind judge's PASS rationale from Round 25 is preserved below verbatim as the judge's own words — nothing in this round's diff (a pure filename-transliteration bugfix plus tests) plausibly changes what is visually rendered in `evidence/E12-example.png`, so the substance of that judgment stands. However, per repo policy `be57c21` / PR #25, this verify subagent may NEVER write a value into `human_override` or `human_signoff`, including carrying an existing value forward from a prior round — the owner reverted an agent-written signature under this exact contract earlier today and stated the rule applies "kể cả khi được bảo tự lái". Round 25's `human_override` line is therefore NOT carried into this round; the item is recorded as `UNCERTAIN` with an empty override and a concrete `required_evidence` pointer. Overall verdict: **PENDING-JUDGMENT**._

_Round 25 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6). Soi diff: không một đường chạy runtime nào đổi — `centroidOf` không có người gọi nào ngoài chính test của nó. Chạy lại toàn bộ tập executor: 496 test đơn vị / 7 skip, 14 Playwright, 7 test:mcp — không cái nào đỏ. `human_signoff` xoá trắng theo chốt file-dùng-chung._

_Round 24 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E1, E2, E3, E4, E5, E6, E7, E8, E9, E11); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 23 — re-verification triggered by `fix/mcp-auth` landing on top of Round 22's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round per this round's explicit instructions — not blanked, not re-scored. `risk_tier: T3` mandates a direct human verdict on every judgment item for THIS round's pinned evidence regardless of a prior round's override against a now-superseded commit, so the contract routes to **PENDING-JUDGMENT** this round._

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
| E12 | AC-12 | judgment | UNCERTAIN — awaits fresh human_override for this round's pinned evidence |

## Evidence

- eval: E1
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26 (merge of main @ 637ae403 on top of 535ee8e8): fresh run, not re-pinned. `npm test` — Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). Matches expected baseline exactly (499, not 501 — 535ee8e removed two dead centroidOf tests, unrelated to this round's diff).
- eval: E2
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). Region highlight / boundary-guard tests unaffected by the slugify diacritic fix.
- eval: E3
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). Point-highlight / auto-zoom tests unaffected.
- eval: E4
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). Geocode-cache dedupe tests unaffected.
- eval: E5
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). render_variants / page-pool tests unaffected.
- eval: E6
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). stdio/HTTP tool-listing + transport-hardening tests unaffected.
- eval: E7
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). Delivery-envelope (base64+path) tests unaffected.
- eval: E8
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). list_formats / custom-dims tests unaffected.
- eval: E9
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). chrome=clean/poster + theme-validation tests unaffected.
- eval: E10
  run_id: mcp-map-render-r26-e2e-20260807
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T09:19:24Z
  screenshot: evidence/E10-step1.png
  observed: |
    Re-opened the committed frames fresh this round with a multimodal Read (frames themselves are not regenerated by `npm run test:e2e`, which this round exited 0 with 14/14 passed including `render-mode.spec.ts:93`):
    E10-step1.png: solid dark-navy 1080x1920 frame, small "© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre" attribution line bottom-right, no onboarding modal or overlay anywhere — matches "no onboarding modal visible".
    E10-step3.png: midnight-blue Ho Chi Minh City map at 1080x1920, airport runway markings upper-left, a river winding through the frame, dense amber/gold road network, no title-text overlay (chrome:'clean'), no tile gaps or breakage — matches "renderFrame() PNG is exactly 1080x1920" and the config-load → render → dims sequence.
  network_observed: n-a (tool-error: frames read from committed evidence/, not re-captured live this round)

- eval: E11
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:19:24Z
  output: |
    Round 26: fresh run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506). Malformed-location structured-error tests unaffected.
<!-- <<<JUDGMENT-BLOCK-TEMPLATE -->
- eval: E12
  judged_by: judge-subagent (fresh context, blind) — rationale below is carried verbatim from Round 25's blind judgment against the same evidence/E12-example.png; this round's diff (slugify diacritic transliteration fix + tests only) does not touch rendering, geocoding, highlight placement, or the render pipeline, so the visual substance is unchanged
  verdict: UNCERTAIN
  rationale: |
    (judge's words, Round 25) Ảnh 1080×1920 đúng khung tiktok, nền navy với đường phố vàng cam đặc trưng midnight-blue; lưới đường và khối nhà liền mạch, không ô tile trống/vỡ hay răng cưa. Ghim trắng nằm gần chính giữa khung (≈540/1080 ngang, 910/1920 dọc — lệch nhẹ ~50px) và tương phản rõ trên nền tối. Đủ cả ba yêu cầu của AC-12: căn giữa, highlight rõ, tile/đường không vỡ.
  required_evidence:
    - Chủ repo tự mở evidence/E12-example.png và xác nhận trực tiếp: (a) vị trí highlight đúng về mặt địa lý cho địa điểm được truy vấn ("Võ Văn Tần, Quận 3, HCMC"), và (b) khung hình dùng được làm B-roll (căn giữa đúng, highlight rõ, tile/đường không vỡ) — theo đúng chốt chính sách be57c21/PR #25, verify subagent không được tự điền human_override kể cả khi mang giá trị cũ sang.
  human_override:
<!-- JUDGMENT-BLOCK-TEMPLATE>>> -->

## Analyst

Non-discriminating (green on both branch and diffBase, carried forward from prior rounds — this round's diff does not touch any of these code paths so the classification is unchanged): E1, E2, E3, E4, E5, E6, E7, E8, E9, E11.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 26: merge of `main` @ `637ae403` landed three non-gate files (`src/lib/format.ts` diacritic-strip fix for Đ/đ/Ð/ð + two test files). All ten machine evals + E10 e2e re-run fresh (not re-pinned): `npm test` 499 passed | 7 skipped (506, exit 0, matches expected baseline), `npm run test:mcp` 7/7, `npm run test:e2e` 14/14 including AC-10. No AC/eval in this contract asserts artifact filename content despite `mcp-server/src/tools.ts:59` consuming the patched `slugify()` for the render filename — that surface is in the blast radius but outside this contract's assertion set. E12 routes to UNCERTAIN this round per repo policy (`be57c21`/PR #25): no `human_override` may be carried forward, even when a prior round already recorded one. Overall verdict: PENDING-JUDGMENT.

Round 25: re-verified against `535ee8e8` (removed dead `centroidOf` from a shared file); full suite re-run — 496 unit / 7 skip, 14 e2e, 7 mcp — zero regressions. `human_signoff` cleared per shared-file staleness policy.

Round 24 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E4, E5, E6, E7, E8, E9, E11 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
