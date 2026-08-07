---
schema_version: 2
feature_slug: road-routing
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 637ae403b478e6722ed8d37410426ac0d34e0657
human_signoff:
---

# Evidence Report: road-routing

_Round 5 — `main` merged vào nhánh này tại `637ae403b478e6722ed8d37410426ac0d34e0657`. `git diff 535ee8e HEAD --name-only` (ngoài `_acceptance/**`) chỉ ra đúng ba file: `src/lib/format.ts`, `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts`._

_Nội dung `format.ts`: `slugify()` trước đây chạy `.normalize('NFKD')` rồi lọc `\p{Diacritic}`, nhưng `Đ/đ` (U+0110/U+0111) và cặp nhìn giống hệt `Ð/ð` (U+00D0/U+00F0) là chữ có gạch ngang dựng sẵn — không phải chữ + dấu tổ hợp — nên NFKD không tách chúng và `\p{Diacritic}` không khớp; chúng sống sót tới bước lọc ký tự rồi bị XOÁ HẲN (`'Đà Nẵng'` → `'a-nang'` thay vì `'da-nang'`). Bản vá thêm hai `.replace()` chuyển `Đ/Ð → D` và `đ/ð → d` chạy TRƯỚC `.normalize('NFKD')`. `format.test.ts` thêm case cho đúng hành vi này; `jobRunner.test.ts` thêm 3 dòng tương ứng ở nơi nó dùng `slugify` gián tiếp qua `jobRunner.ts`._

_`format.ts` không nằm trong đường chạy của `route.ts`/`resolveConfig.ts` (không import qua lại — xác nhận bằng grep) nên không chạm trực tiếp AC nào của hợp đồng này. Nhưng nó được `mcp-server/src/jobRunner.ts` và `mcp-server/src/tools.ts` import, nằm trong phạm vi suite chung mà `test.api`/`test.mcp` chạy qua, nên toàn bộ 16 eval được CHẠY LẠI THẬT chứ không ghim, đúng chỉ thị "no selective re-pin" của vòng này._

_499 (không phải 501) là baseline đúng — `535ee8e` đã xoá hai test `centroidOf` chết ở round 4; merge lần này không thêm/bớt case nào trong `npm test` ngoài phạm vi `format.test.ts` (đã được vitest gộp vào cùng con số), nên `npm test` vẫn ra 499 passed | 7 skipped (506), khớp baseline kỳ vọng._

_Đã chạy lại toàn bộ tập executor của hợp đồng: `route.test.ts` 13/13 pass, `resolveConfig.test.ts` 64/64 pass, `routing-invariants.ts` I1–I4 đều giữ (I1 xác nhận `route.ts` không đổi so với chốt t3_path trước đó), `npm test` 499 passed | 7 skipped (506), `npm run test:mcp` 7/7 pass (vite build thật + Chromium headless, 55.6s). Không eval nào chạm vào đúng hai dòng `.replace()` mới trong `format.ts` — hợp đồng này không sở hữu AC nào về `slugify`; đây là bằng chứng "không hồi quy" chứ không phải bằng chứng cho tính năng của chính `format.ts` (thuộc hợp đồng khác, nếu có)._

_`verified_commit` cập nhật lên `637ae403b478e6722ed8d37410426ac0d34e0657`; `human_signoff` giữ trắng theo đúng chốt Cổng 2 — không được viết giá trị vào trường này, kể cả mang giá trị cũ sang._

_Round 4 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_`executors.test.resolve_config` của hợp đồng này chạy vào file vừa bị sửa import, nên toàn bộ eval dùng nó được chạy lại thay vì ghim. `routing_invariants` (I1–I4) vẫn giữ, gồm cả chốt `route.ts` KHÔNG import export.ts/mapStyle.ts._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 3 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E15, E16); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 2 — re-verification triggered by `fix/mcp-auth` landing on top of Round 1's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

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
| E10 | AC-10 | test | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-12 | test | PASS |
| E13 | AC-13 | script | PASS |
| E14 | AC-14 | test | PASS |
| E15 | AC-13 | test | PASS |
| E16 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run (merge of main @ 637ae403, non-gate diff limited to src/lib/format.ts + two test files, none of which route.ts/resolveConfig.ts import). Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E2
  run_id: road-routing-r5-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:29:58Z
  output: |
    Round 5 fresh run (merge of main @ 637ae403, non-gate diff limited to src/lib/format.ts + two test files). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E3
  run_id: road-routing-r5-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:29:58Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: road-routing-r5-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:29:58Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: road-routing-r5-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:29:58Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E7
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E8
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E9
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E10
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E11
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E12
  run_id: road-routing-r5-route-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T09:29:53Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E13
  run_id: road-routing-r5-routing_invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.routing_invariants
  verified_at: 2026-08-07T09:30:03Z
  output: |
    Round 5 fresh run. I1 t3_path untouched vs 5a6dea79; I2 base URL only from env.MAPPOSTER_OSRM_URL, no exported fn accepts host/url, coords go through Number() after validate; I3 all fetch calls carry signal + timeout error names the env; I4 route.ts does not import export.ts/mapStyle.ts. routing-invariants: moi bat bien con giu.

- eval: E14
  run_id: road-routing-r5-resolve_config-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:29:58Z
  output: |
    Round 5 fresh run. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E15
  run_id: road-routing-r5-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:30:08Z
  output: |
    Round 5 fresh run (merge of main @ 637ae403). Full suite exercises the changed files (src/lib/format.ts/.test.ts, mcp-server/src/jobRunner.test.ts) directly. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506) — matches the expected baseline (499, not 501, because 535ee8e already removed two dead centroidOf tests in round 4; this merge adds no net case count change to this suite run).

- eval: E16
  run_id: road-routing-r5-mcp-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T09:30:16Z
  output: |
    Round 5 fresh run — real Chromium via vite build + headless render/clip/stdio integration. Test Files 3 passed (3); Tests 7 passed (7); Duration 55.60s.

## Analyst

Baseline recomputation was not attempted this round (the merge's non-gate diff — src/lib/format.ts, src/lib/format.test.ts, mcp-server/src/jobRunner.test.ts — is disjoint from route.ts/resolveConfig.ts and their tests; only the full-suite check E15 touches the changed files at all). Non-discriminating (green on both the branch and the pre-merge diffBase, carried forward from round 3's classification): E15.

Baseline `n-a` (could not be computed / not applicable this round): E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 5: triggered by `main` merging into this branch at `637ae403b478e6722ed8d37410426ac0d34e0657`. `git diff 535ee8e HEAD --name-only` (outside `_acceptance/**`) shows exactly three non-gate files: `src/lib/format.ts` (fix — Đ/đ and look-alikes Ð/ð were deleted instead of transliterated to `d` by the NFKD+diacritic-strip pipeline; two `.replace()` calls now run before `.normalize('NFKD')`), `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts` (tests). Every one of the 16 evals was re-run fresh (no selective re-pin) — all green. `npm test` = 499 passed | 7 skipped (506), matching the expected baseline (499 not 501 because `535ee8e` already deleted two dead `centroidOf` tests in round 4 — not a discrepancy). `verified_commit` updated to `637ae403b478e6722ed8d37410426ac0d34e0657`; `human_signoff` left empty.

Round 3 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E15, E16 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 2: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
