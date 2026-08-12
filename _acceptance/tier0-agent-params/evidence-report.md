---
schema_version: 2
feature_slug: tier0-agent-params
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 637ae403b478e6722ed8d37410426ac0d34e0657
human_signoff:
---

# Evidence Report: tier0-agent-params

_Round 11 — nghiệm thu lại do `main` được merge vào nhánh này tại `637ae403b478e6722ed8d37410426ac0d34e0657`. Evidence trước đó chạy trên nền cũ và ghim `verified_commit: 535ee8e8b30d8bdadc15c55ecbc5f27c4564f783`. Cây đã merge cộng thêm đúng ba file non-gate trên nền `535ee8e8`: `src/lib/format.ts` (fix — Đ/đ U+0110/U+0111 và cặp nhìn giống hệt Ð/ð U+00D0/U+00F0 bị pipeline NFKD+strip-diacritic XOÁ HẲN thay vì chuyển tự sang `d`; hai lệnh `.replace()` mới chạy TRƯỚC `.normalize('NFKD')`), cùng `src/lib/format.test.ts` và `mcp-server/src/jobRunner.test.ts` (test-only)._

_Soi diff theo đúng cảnh báo trong brief: `slugify()` cấp nguồn cho `mcp-server/src/tools.ts:59` (đặt tên artifact của `render_map`/`render_clip`) và `mcp-server/src/jobRunner.ts:76` (đặt tên job async) — cả hai bề mặt đó (`clip_tools`, `job_runner`) đều nằm trong tập executor của hợp đồng này, và `geocode` cũng sát mặt xử lý địa danh. Đã rà lại toàn bộ 15 AC trong `contract.md`: **không AC nào assert tên file artifact hay chuỗi place-name output**. AC-9/AC-10 chỉ khai shape của `list_themes`/`list_formats` (không liên quan địa danh); AC-4/AC-5/AC-15 khai identity/màu/marker mà `resolveConfig`/`fetchRegionBoundary` trả về, không khai tên tệp. Test mới chứa chuỗi `dak-lak` trong basename nằm ở `mcp-server/src/jobRunner.test.ts`, trong describe block "dọn tệp hết hạn (AC-12)" — đó là AC-12 của hợp đồng **async-job-queue**, không phải AC nào của `tier0-agent-params`. Kết luận: fix Đ/đ không chạm tiêu chí nào của hợp đồng này; nó chỉ đi qua chung file nguồn (`format.ts`) mà cả hai tool bề mặt của hợp đồng này gọi gián tiếp qua đặt tên artifact/job, nằm ngoài phạm vi 15 AC hiện có._

_Đã chạy lại TOÀN BỘ 20 eval tươi, không ghim suông một cái nào — kể cả `test.api` và `test.mcp` (Chromium thật, ~46s). `npm test` = 499 passed | 7 skipped (506), khớp đúng baseline kỳ vọng trong brief: KHÔNG phải 501 vì `535ee8e8` (đã nghiệm thu ở Round 10) đã xoá hai test `centroidOf` chết trước round này — không phải discrepancy phát sinh ở round này. `npm run test:mcp` = 3 file / 7 test pass qua headless Chromium thật. `tier0-invariants.ts` (I1–I3) giữ nguyên toàn bộ: I1 xác nhận t3_path (`src/lib/export.ts`, `src/lib/mapStyle.ts`) không đổi so với merge-base; I2 cả ba binding `motionOut` (MCP/REST/async) vẫn echo `script: motion`; I3 mọi Zod guard mới (layers, detail, font, marker size, marker icon, pitch) vừa định nghĩa vừa được gọi, và bearing vẫn normalize (modulo-360) chứ không reject._

_Kết quả: 20/20 eval PASS. `verified_commit` cập nhật lên `637ae403b478e6722ed8d37410426ac0d34e0657`; `human_signoff` giữ trắng theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 10 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_`executors.test.resolve_config` nằm trong tập eval của hợp đồng này nên được chạy lại. `tier0_invariants` vẫn giữ đủ, gồm mọi guard tham số vừa ĐỊNH NGHĨA vừa ĐƯỢC GỌI._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 9 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E12, E19, E20); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

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
| E12 | AC-11 | test | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-12 | test | PASS |
| E15 | AC-13 | test | PASS |
| E16 | AC-14 | test | PASS |
| E17 | AC-15 | test | PASS |
| E18 | AC-11 | script | PASS |
| E19 | AC-1 | test | PASS |
| E20 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — RenderConfig carries layers/detail/font verbatim.

- eval: E2
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — labels + layers.roadLabels together rejected, neither silently wins.

- eval: E3
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — detail>1/unknown font/unknown layer key/non-boolean layer value rejected; detail=0 and detail=1 accepted.

- eval: E4
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — three region forms resolve, per-region colour and null fallback, bad colour on any element rejects the whole call.

- eval: E5
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — three point forms resolve, fallback chain per-point -> pointIcon/color -> pin/#ffffff/44 verified in order.

- eval: E6
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — size 18/140 accepted, out-of-range rejected, size 0 rejected rather than treated as unset.

- eval: E7
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — unknown per-point icon and unknown top-level pointIcon both rejected, neither falls back to 'pin'.

- eval: E8
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — bad colour/size on a later element rejects before resolveBoundary/resolveLocation are called (zero Nominatim requests).

- eval: E9
  run_id: tier0-agent-params-r11-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:42:05Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 52 passed (52) — list_themes returns 13 themes, each with dark + a 15-key colors palette.

- eval: E10
  run_id: tier0-agent-params-r11-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:42:05Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 52 passed (52) — list_formats emits '4k' exactly once; print key present on print layouts, absent on non-print ones.

- eval: E11
  run_id: tier0-agent-params-r11-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:42:05Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 52 passed (52) — MCP render_clip response carries motion.script with camera array and fps matching clip.fps.

- eval: E12
  run_id: tier0-agent-params-r11-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:42:07Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 54 passed (54) — REST POST /render-clip response carries motion.script.camera as an array.

- eval: E13
  run_id: tier0-agent-params-r11-job_runner-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:42:10Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403, includes new dak-lak slugify assertion for async-job-queue's own AC-12 — unrelated to this contract's ACs). Test Files 1 passed (1); Tests 22 passed (22) — async /jobs clip result carries motion.script in the same shape as the sync surfaces.

- eval: E14
  run_id: tier0-agent-params-r11-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:41:59Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 64 passed (64) — pitch outside 0..60 rejected; bearing -45 normalized to 315, not rejected.

- eval: E15
  run_id: tier0-agent-params-r11-motion_compiler-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T09:42:13Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 32 passed (32) — every keyframe carries cfg.camera.bearing; bearing-less config compiles to the identical object (determinism preserved).

- eval: E16
  run_id: tier0-agent-params-r11-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:42:05Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 52 passed (52) — delivery:'url' yields zero inline base64 blocks; over-cap on the second output of format:'both' removes both files from the sink.

- eval: E17
  run_id: tier0-agent-params-r11-geocode-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geocode
  verified_at: 2026-08-07T09:42:15Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 1 passed (1); Tests 26 passed (26) — fetchRegionBoundary fallback path echoes the identity of the entity that produced the polygon, not the original search hit; cached second call spends no extra fetch.

- eval: E18
  run_id: tier0-agent-params-r11-tier0_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tier0_invariants
  verified_at: 2026-08-07T09:42:20Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). ok I1 t3_path (export.ts, mapStyle.ts) untouched vs merge-base. ok I2 all three motionOut bindings (MCP/REST/async) echo script: motion. ok I3 every new Zod field guard (layers, detail, font, marker size, marker icon, pitch) defined AND called; bearing normalized (modulo-360), not asserted. tier0-invariants: all invariants hold.

- eval: E19
  run_id: tier0-agent-params-r11-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:42:23Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 31 passed | 3 skipped (34); Tests 499 passed | 7 skipped (506) — matches expected baseline (not 501: two dead centroidOf tests were removed in 535ee8e8, already accounted for in Round 10, not a new discrepancy).

- eval: E20
  run_id: tier0-agent-params-r11-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T09:42:35Z
  output: |
    Round 11 fresh run (post-merge @ 637ae403). Test Files 3 passed (3); Tests 7 passed (7); Duration 46.13s — real vite build, real PNG and real clip rendered through headless Chromium.

## Analyst

Baseline values carried forward from Round 8's original diffBase determination (this round's merge is additive/refactor-only relative to this contract's own primary source files — `src/lib/format.ts` is a shared helper the contract's tools call indirectly for naming, out of the 15 AC's scope). Non-discriminating (green on both) per the carried-forward baseline: E19, E20 — expected regression guards (full-suite / gated integration commands), not this contract's own discriminating unit evals.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 11: triggered by `main` merge to `637ae403`. Re-ran all 20 evals fresh (no re-pinning), including the two heavy suites (`test.api`, `test.mcp`). Confirmed no AC in this contract asserts artifact filenames or place-name normalization output — the merged Đ/đ slugify fix and its `dak-lak` assertion belong to `async-job-queue`'s own AC-12, not to this contract. `npm test` = 499 passed | 7 skipped, matching the expected baseline (not a new 499-vs-501 discrepancy — already explained in Round 10). Result: 20/20 PASS.

Round 10 (re-verify): triggered by `chore/remove-dead-centroidof` @ `535ee8e8` (dead `centroidOf` removal + `noUnusedLocals`). Re-ran the full executor set fresh; only test-count change repo-wide was `geometry.test.ts` (12 -> 10, exactly the two removed dead-code cases). All 20 evals PASS.

Round 9 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E12, E19, E20 fresh — all green, unchanged. All other evals re-pinned without re-running (their own files untouched).

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
