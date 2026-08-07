---
schema_version: 2
feature_slug: mcp-map-render
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: manh 2026-08-07
---

# Evidence Report: mcp-map-render

_Round 25 — re-verification triggered by commit `affbe6c5` ("fix: slugify chuyển tự Đ/đ thay vì đánh rơi cả chữ") on `src/lib/format.ts`. `slugify()` previously DELETED Đ/đ (U+0110/U+0111) and look-alikes Ð/ð (U+00D0/U+00F0) instead of transliterating them to `d`/`D` — 'Đà Nẵng' → 'a-nang'. Two `.replace()` calls now run before the NFKD normalize to fix this. `slugify()` feeds three artifact-filename builders, including `mcp-server/src/tools.ts:59` (`mapposter-${slugify(cfg.place.name)}-${w}x${h}-${n}`), which is this contract's own MCP render-artifact filename path — squarely in this round's blast radius, not merely adjacent. Per the shared-file staleness guard this downgraded the contract and invalidated Round 24's pinned evidence._
_Checked every criterion (AC-1..AC-12) against this diff: none of them assert the CONTENT of the generated filename or specifically exercise Đ/đ place names — AC-1/AC-7/AC-8 assert PNG dimensions, delivery shape (base64+path), and that the file exists at the sink dir, but never inspect the filename string itself. So the fix is real blast radius (tools.ts:59 runs on every render) but not a criterion this contract directly asserts; no AC needed rewriting. Ran every machine eval fresh rather than re-pinning, since `npm test` (the shared `test.api` command backing E1-E9/E11) is a full `vitest run` and does execute `src/lib/format.test.ts` and `mcp-server/src/jobRunner.test.ts` — both changed by this commit._
_`npm test`: 31 test files passed, 3 skipped (34); 501 tests passed, 7 skipped (508) — 3 more passing tests than Round 24's 498 (the fix commit's own new assertions in `format.test.ts` and `jobRunner.test.ts:347`, `expect(path.basename(written)).toContain('dak-lak')`), zero failures. `npm run test:e2e`: 14 passed (48.5s), including `e2e/render-mode.spec.ts:93` (AC-10) — unchanged from Round 24; this commit does not touch the render page, browserPool.ts, deps.ts, or renderFrame, and the E10 screenshots (evidence/E10-step1.png, E10-step3.png) were re-opened with a fresh multimodal Read this round and match: step1 is a solid dark-navy 1080×1920 frame with no onboarding modal, step3 is the midnight-blue HCMC map with dense amber road network and no title overlay, no tile gaps or breakage._

_Judgment item (AC-12 / E12): the prior round's block carried a `human_override` line self-described as "KHONG phai nguoi ky truc tiep xem tung muc" (applied under a session-blanket authorisation, not a per-item human review). The repo owner withdrew all such inherited overrides repo-wide in the 2026-08-07 session. Per T3 rules every judgment item requires a genuine per-item human verdict — an override that self-attests it was never individually reviewed cannot be carried forward to newly pin a PASS against a new commit. The blind judge's original rationale is preserved (prefixed to mark it as the judge's words, not a human's), `verdict` is reset to UNCERTAIN, `human_override` is left EMPTY, and a `required_evidence` + `override_withdrawn` field are added. This alone routes the overall verdict to PENDING-JUDGMENT even though every machine eval is green._

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
| E12 | AC-12 | judgment | UNCERTAIN — prior override withdrawn, then resolved at Gate 2 by LABELLED owner acceptance (owner did NOT re-open E12-example.png) |

## Evidence

- eval: E1
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh (not re-pinned) against `affbe6c5` (slugify Đ/đ fix). `npm test` (vitest run, full suite): Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508) — 3 more passing than Round 24's 498, from this commit's new assertions in format.test.ts and jobRunner.test.ts. Zero failures.
- eval: E2
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E3
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E4
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E5
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E6
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E7
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures. (AC-7 asserts the PNG exists at the sink dir — it does not assert filename content, so this eval does not itself exercise the Đ/đ transliteration fix.)
- eval: E8
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E9
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E10
  run_id: mcp-map-render-r25-e2e-20260807
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T08:07:06Z
  screenshot: evidence/E10-step1.png
  observed: |
    Round 25: `npm run test:e2e` re-run fresh against `affbe6c5` — 14 passed (48.5s), including e2e/render-mode.spec.ts:93 (AC-10), identical pass count to Round 24. This commit touches only src/lib/format.ts, src/lib/format.test.ts, and mcp-server/src/jobRunner.test.ts — none of the render page, browserPool.ts, deps.ts, or renderFrame, which this e2e suite does not exercise differently. Frames re-opened with a fresh multimodal Read this round:
    E10-step1.png: solid dark-navy 1080x1920 frame, small OSM/OpenFreeMap/MapLibre attribution line bottom-right, no onboarding modal or overlay anywhere — matches 'no onboarding modal visible'.
    E10-step3.png: midnight-blue Ho Chi Minh City map, airport markings upper-left, a river winding through, dense amber/gold road network, no title-text overlay (chrome:'clean'), no tile gaps or breakage — matches 'renderFrame() PNG is exactly 1080x1920' and the config-load -> render -> dims sequence.
  network_observed: n-a (tool-error: frames read from committed evidence/, not re-captured live this round)

- eval: E11
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:07:06Z
  output: |
    Round 25, re-run fresh against `affbe6c5`. Same shared run as E1: Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508). Zero failures.
- eval: E12
  judged_by: judge-subagent (fresh context, blind)
  verdict: UNCERTAIN
  rationale: |
    Giám khảo mù chấm PASS (nguyên văn): Ảnh 1080×1920 đúng khung tiktok, nền navy với đường phố vàng cam đặc trưng midnight-blue; lưới đường và khối nhà liền mạch, không ô tile trống/vỡ hay răng cưa. Ghim trắng nằm gần chính giữa khung (≈540/1080 ngang, 910/1920 dọc — lệch nhẹ ~50px) và tương phản rõ trên nền tối. Đủ cả ba yêu cầu của AC-12: căn giữa, highlight rõ, tile/đường không vỡ.
  required_evidence:
    - "Chủ repo tự mở evidence/E12-example.png và xác nhận trực tiếp (không qua uỷ quyền phiên) rằng: điểm highlight nằm đúng vị trí địa lý của 'Võ Văn Tần, Quận 3, HCMC', ảnh dùng được làm B-roll video."
  human_override: manh 2026-08-07 — CHAP NHAN tren bang chung MAY + phan cua giam khao mu. KHONG tu mo lai evidence/E12-example.png de xac nhan vi tri dia ly; viec neu o required_evidence CHUA lam. Chu repo duoc hoi thang va chon co y phuong an nay trong phien 2026-08-07.
  override_status: "Round 25, two steps. (1) WITHDRAWN: Round 24's human_override self-declared it was applied under a session-blanket authorisation ('tu lai, khong can hoi'), NOT a per-item human review, so it could not be carried forward to newly mint a PASS against commit affbe6c5. (2) RESOLVED at Gate 2 by an explicitly LABELLED owner acceptance: asked directly in the 2026-08-07 session, the repo owner deliberately chose 'accept on machine evidence + blind-judge verdict without re-opening the artifact, and label it as such' over personally re-inspecting E12-example.png. The override line below states exactly that scope — it does NOT claim anyone looked at the render. A later reader can see precisely what backs this verdict."
## Analyst

Every machine eval in this contract runs the shared `npm test` / `npm run test:e2e` commands, which are green on both the diffBase (pre-fix) tree and this round's `affbe6c5` tree for every eval except the fix's own new assertions (format.test.ts, jobRunner.test.ts:347) — none of which back an eval in this contract (they belong to T2/async-job-queue's own test files). Non-discriminating (green on both) with respect to THIS contract's criteria: E1, E2, E3, E4, E5, E6, E7, E8, E9, E11 — expected, since none of AC-1..AC-11 assert filename content or Đ/đ place-name handling; they were re-run in full per this round's "no selective re-pinning" instruction, not because any of them discriminates on this specific fix.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 25: triggered by `affbe6c5` (slugify Đ/đ transliteration fix, feeding `mcp-server/src/tools.ts:59`'s artifact-filename builder — in this contract's blast radius). Every machine eval (E1-E11) was re-run fresh, not re-pinned: `npm test` 501/508 passed (0 failed), `npm run test:e2e` 14/14 passed, both exit 0. Confirmed no AC in this contract asserts filename content, so none needed rewriting. The E12 judgment override from Round 24 was withdrawn per repo-owner instruction (it self-documented as a blanket-authorisation stand-in, not a per-item human review); reset to UNCERTAIN with `required_evidence` added and `human_override` left empty. Verdict: PENDING-JUDGMENT (all machine evals green; judgment item awaits a genuine human verdict).

Round 24 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E4, E5, E6, E7, E8, E9, E11 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 23: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
