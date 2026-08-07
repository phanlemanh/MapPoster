---
schema_version: 2
feature_slug: routes-measurements
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 637ae403b478e6722ed8d37410426ac0d34e0657
human_signoff:
---

# Evidence Report: routes-measurements

_Round 10 — `main` được merge vào nhánh này tại `637ae403`, đứng trên `535ee8e8` của Round 9. Cây merge thêm đúng ba file non-gate: `src/lib/format.ts`, `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts` (`git diff --name-only 535ee8e HEAD` xác nhận, ngoài các file `_acceptance/**` khác đã đổi do các hợp đồng chị em stale-hoá lẫn nhau)._

_Nội dung `format.ts` (commit `affbe6c`): fix `slugify()` — `Đ/đ` (U+0110/U+0111) và cặp nhìn giống hệt `Ð/ð` (U+00D0/U+00F0) là chữ CÓ GẠCH NGANG dựng sẵn, không phải chữ + dấu rời, nên `NFKD` không tách và `\p{Diacritic}` không khớp; trước fix chúng sống sót tới bước lọc ký tự rồi bị XOÁ HẲN (`'Đà Nẵng'` → `'a-nang'`). Fix thêm hai `.replace()` chuyển tự `Đ/Ð→D`, `đ/ð→d` chạy TRƯỚC `.normalize('NFKD')`. `slugify()` được `mcp-server/src/tools.ts:59` gọi bên trong executor `clip_tools` của hợp đồng này (dùng để đặt tên file render), nên diff nằm trong vùng phủ của E2/E14._

_`535ee8e8` (nền của Round 9) tự nó đã xoá hàm chết `centroidOf` khỏi `mcp-server/src/geometry.ts` và bật `noUnusedLocals` — thuộc phạm vi executor `geometry` của hợp đồng này; evidence của `main` đã xác nhận tổ hợp đó, vòng này chạy lại đúng tổ hợp đó trên cây mới chứ không ghim suông._

_Đã chạy TƯƠI toàn bộ 8 executor của hợp đồng (không ghim lại bất kỳ eval nào): `resolve_config`, `clip_tools`, `apply_render_config`, `geometry`, `routes_invariants`, `routes_demo`, `api` (`npm test`), `mcp` (`npm run test:mcp`). Baseline `npm test` = **499 passed | 7 skipped (506)** — khớp đúng kỳ vọng của vòng này (không phải 501, vì `535ee8e8` đã xoá hai test riêng của `centroidOf` khỏi `geometry.test.ts`; đây không phải sai lệch). `geometry.test.ts` = 10 passed, khớp cây sau khi `centroidOf` đã bị xoá. Không có regression nào phát sinh từ diff `format.ts`; `clip_tools` (tools.test.ts) = 52 passed (52), `mcp` = 3 test file / 7 test đều xanh với build Chromium thật._

_`printf '%s' "$ACCEPTANCE_GATE_BYPASS"` rỗng tại thời điểm chạy — xác nhận `bypass_used: false`. `verified_commit` cập nhật lên `637ae403b478e6722ed8d37410426ac0d34e0657`; `human_signoff` giữ trắng theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 9 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Hợp đồng này là hợp đồng chịu ảnh hưởng trực tiếp nhất: `geometry.ts` là file nguồn lõi của nó, `executors.test.geometry` chạy thẳng vào file test vừa bị cắt, và E15/E16 (`routes_invariants`) ĐỌC MÃ NGUỒN của cả `resolveConfig.ts` lẫn `geometry.ts`. Cả tám bất biến I1–I3 vẫn giữ, trong đó I3 xác nhận hai file vẫn không có tên số đo trần và bốn tên đủ nghĩa vẫn đủ mặt._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 8 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E17, E18); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 7 — re-verification triggered by `fix/mcp-auth` landing on top of Round 6's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-8 | test | PASS |
| E13 | AC-10 | test | PASS |
| E14 | AC-12 | test | PASS |
| E15 | AC-13 | script | PASS |
| E16 | AC-1 | script | PASS |
| E17 | AC-13 | test | PASS |
| E18 | AC-1 | test | PASS |
| E19 | AC-1 | test | PASS |
| E20 | AC-14 | script | PASS |

## Evidence

- eval: E1
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-1 assertions unaffected by this round's diff (merge only adds src/lib/format.ts's slugify Đ/đ fix, plus test-only files; this contract's own source files are untouched). Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E2
  run_id: routes-measurements-r10-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:35:06Z
  output: |
    Fresh run on 637ae403 — this eval's own executor (tools.test.ts) sits directly downstream of slugify() via mcp-server/src/tools.ts:59; re-run confirms no regression from the Đ/đ transliteration fix. Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E3
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-2 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-3 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-4 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: routes-measurements-r10-apply_render_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.apply_render_config
  verified_at: 2026-08-07T09:35:11Z
  output: |
    Fresh run on 637ae403 — AC-5 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 10 passed (10) — present and passing.

- eval: E7
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-6 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E8
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-7 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E9
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-8 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E10
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-9 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E11
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-11 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E12
  run_id: routes-measurements-r10-geometry-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geometry
  verified_at: 2026-08-07T09:35:13Z
  output: |
    Fresh run on 637ae403 — geometry.test.ts unaffected by format.ts diff; still reflects 535ee8e8's centroidOf removal (round 9's own change). Test Files 1 passed (1); Tests 10 passed (10) — present and passing.

- eval: E13
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-10 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E14
  run_id: routes-measurements-r10-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:35:06Z
  output: |
    Fresh run on 637ae403 — AC-12 assertions unaffected by this round's diff. Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E15
  run_id: routes-measurements-r10-routes_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T09:36:00Z
  output: |
    Fresh run on 637ae403 — I1 t3_path (export.ts, mapStyle.ts) untouched; I2 every guard defined-and-called, total geometry cap and measure.pairs index compared for real; I3 no bare measurement names. "routes-invariants: mọi bất biến còn giữ" — exit 0.

- eval: E16
  run_id: routes-measurements-r10-routes_demo-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_demo
  verified_at: 2026-08-07T09:36:05Z
  output: |
    Fresh run on 637ae403 — 5 renders (A0-A4) + 9 measurement checks, including "polyline DÀI HƠN chim bay hai đầu" (6.79 km > 6.17 km) and "diện tích TRỪ LỖ đúng ~16%" (tỉ lệ=0.840). ẢNH: 5 render; KIỂM: 9 đạt · 0 trượt.

- eval: E17
  run_id: routes-measurements-r10-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:36:57Z
  output: |
    Fresh run on 637ae403 — full Vitest suite, not selectively re-run. Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506) — matches the round's expected baseline (499, not 501, because 535ee8e8 already removed two centroidOf tests; not a discrepancy).

- eval: E18
  run_id: routes-measurements-r10-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T09:37:02Z
  output: |
    Fresh run on 637ae403 — real vite build + Chromium headless via MCP_INTEGRATION=1. Test Files 3 passed (3); Tests 7 passed (7); Duration 47.45s.

- eval: E19
  run_id: routes-measurements-r10-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:35:03Z
  output: |
    Fresh run on 637ae403 — AC-1 SHOULD-NOT-EMIT assertion unaffected by this round's diff. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E20
  run_id: routes-measurements-r10-routes_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T09:36:00Z
  output: |
    Fresh run on 637ae403 — I3: no bare measurement names (km/distance/area/length/span) in resolveConfig.ts or geometry.ts, and all four self-describing names (lengthKm, straightLineKm, areaKm2, spanKm) present. Exit 0.

## Analyst

Baseline values carried forward from the discriminating/non-discriminating classification established in earlier rounds (this round did not recompute a fresh diffBase — the merge diff is additive-only to a sibling file, not a behavior change to this contract's own tree). Non-discriminating (green on both branch and diffBase) per the carried-forward baseline: E17, E18 — both are whole-suite regression guards, expected to be green regardless of this feature.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 10: `main` merged into this branch at `637ae403`, on top of Round 9's `535ee8e8`. Merge adds exactly three non-gate files: `src/lib/format.ts` (fix: slugify() now transliterates Đ/đ/Ð/ð to D/d instead of deleting them — the two `.replace()` calls run before `.normalize('NFKD')`), `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts`. `slugify()` feeds `mcp-server/src/tools.ts:59` inside this contract's `clip_tools` executor. Re-ran ALL 20 evals fresh across all 8 distinct executor commands (no selective re-pin) — zero failures. `npm test` = 499 passed | 7 skipped (506), matching the round's expected baseline exactly (499 not 501, because `535ee8e8` already deleted two `centroidOf` tests in Round 9 — not a new discrepancy). `verified_commit` updated to `637ae403b478e6722ed8d37410426ac0d34e0657`; `human_signoff` stays empty.

Round 9: re-verification triggered by `535ee8e8` (removed dead `centroidOf` helper from `mcp-server/src/geometry.ts`, enabled `noUnusedLocals`). Full executor set re-run fresh; geometry.test.ts count dropped from 12 to 10 (the two centroidOf-specific tests removed); no other regression.

Round 8 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E17, E18 fresh — all green, unchanged. All other evals re-pinned without re-running (their own files untouched).

Round 7: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
