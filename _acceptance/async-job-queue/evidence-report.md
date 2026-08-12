---
schema_version: 2
feature_slug: async-job-queue
verdict: PENDING-JUDGMENT
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 637ae403b478e6722ed8d37410426ac0d34e0657
human_signoff:
---

# Evidence Report: async-job-queue

_Round 14 — nghiệm thu lại do merge `main` vào nhánh tại `637ae403b478e6722ed8d37410426ac0d34e0657`, mang theo `affbe6c` (`src/lib/format.ts` slugify fix) trên nền `535ee8e8` đã ghim ở vòng 13._

_Nội dung diff `535ee8e8..637ae403`: ba file không thuộc gate — `src/lib/format.ts` (+6 dòng, hai `.replace()` chuyển Đ/đ (U+0110/U+0111) và cặp nhìn giống Ð/ð (U+00D0/U+00F0) sang `d`, chạy TRƯỚC `.normalize('NFKD')`; sửa lỗi trước đó XOÁ hẳn chữ 'Đ' khỏi slug thay vì phiên âm nó — 'Đà Nẵng' từng ra `a-nang`, nay ra `da-nang`), `src/lib/format.test.ts` (test hồi quy mới cho cả Đ/đ và cặp nhìn giống Ð/ð), và `mcp-server/src/jobRunner.test.ts` (+3 dòng, một assert tên tệp mới chèn vào ca AC-12 sẵn có: `expect(path.basename(written)).toContain('dak-lak')`, việc dùng địa danh 'Đắk Lắk'). `slugify()` nuôi ba nơi dựng TÊN TỆP ARTIFACT: `src/lib/export.ts:246`, `mcp-server/src/tools.ts:59`, `mcp-server/src/jobRunner.ts:76` — hợp đồng này chạm trực tiếp `jobRunner.ts:76` qua thợ ghi tệp kết quả, nên mọi tên tệp sinh từ địa danh có 'Đ'/'đ' đổi hình dạng. Ngoài ca AC-12 vừa được bổ sung assert, không AC nào khác của hợp đồng này khoá cứng CHUỖI tên tệp cụ thể — E1, E6 chỉ đòi danh xưng đi xuyên giữ nguyên ký tự trong NỘI DUNG phản hồi/sổ việc, không đòi một slug cố định.

_Vì slugify là hàm dùng chung xuyên `jobRunner.ts`, KHÔNG ghim suông — chạy lại TOÀN BỘ tập executor của hợp đồng tươi mới trên `637ae403`, không chọn lọc: job_http (lệnh trùng với clip_http) 54/54, job_store 16/16, job_runner 22/22 (gồm ca AC-12 với assert tên tệp mới, xanh), clip_tools 52/52, motion_compiler 32/32 — khớp số đếm vòng 13, không ca nào đổi verdict. `npm test` chạy riêng làm đường nền tổng: 499 passed | 7 skipped (506) — ĐÚNG 499 chứ không phải 501, vì `535ee8e8` (đã ghim từ vòng 13) xoá hai test của hàm chết `centroidOf`; không phải một hồi quy của vòng này._

_Khối phán đoán E20 (AC-15): theo chính sách kho be57c21 / PR #25, agent nghiệm thu KHÔNG được viết `human_override` — kể cả chép lại nguyên giá trị đã có từ vòng 13. `human_override` của E20 xoá về rỗng, verdict hạ về `UNCERTAIN`; nội dung `rationale` của giám khảo mù giữ nguyên byte-for-byte từ vòng trước vì AC-15 không nằm trong phạm vi diff này. Verdict tổng vì vậy là `PENDING-JUDGMENT`, chờ người ký điền `human_override` ở Cổng 2._

_`verified_commit` cập nhật lên `637ae403b478e6722ed8d37410426ac0d34e0657`; `human_signoff` giữ rỗng._

_Round 13 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Không eval nào của hợp đồng này trỏ thẳng vào `geometry.ts` hay `resolveConfig.ts`; nó hết hạn theo chốt file-dùng-chung. Toàn bộ tập lệnh vẫn được chạy lại: jobStore 16, jobRunner 22, http 54, tools 52, motionCompiler 32 — khớp vòng trước._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 12 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E1, E2, E3, E5, E6, E8, E11, E18); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 11 — re-verification triggered by `fix/mcp-auth` landing on top of Round 10's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round per this round's explicit instructions — not blanked, not re-scored. The prior round's judge verdict was PASS (not UNCERTAIN) with `human_override` already on file, so it does not block this round's PASS._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-10 | test | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-11 | test | PASS |
| E16 | AC-12 | test | PASS |
| E17 | AC-12 | test | PASS |
| E18 | AC-13 | test | PASS |
| E19 | AC-14 | test | PASS |
| E20 | AC-15 | judgment | UNCERTAIN |
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |
| E24 | AC-6 | test | PASS |
| E25 | AC-15 | test | PASS |

## Evidence

- eval: E1
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`, merges main's slugify fix `affbe6c` onto `535ee8e8`): re-run fresh, not re-pinned — jobRunner.ts:76 calls the changed slugify() for artifact filenames, and this contract's own fixtures use Vietnamese place names with Đ/đ. Test Files 1 passed (1); Tests 54 passed (54) — unchanged from round 13; the diacritic-preserving assertions in this eval's Vietnamese-name case are unaffected (they check response/store content, not the filename slug).
- eval: E2
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E1 (same command). Test Files 1 passed (1); Tests 54 passed (54) — unchanged.
- eval: E3
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E1 (same command). Test Files 1 passed (1); Tests 54 passed (54) — unchanged.
- eval: E4
  run_id: async-job-queue-r14-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh — jobStore.ts itself does not call slugify, but the instruction for this round was to run every eval fresh rather than selectively re-pin. Test Files 1 passed (1); Tests 16 passed (16) — unchanged.

- eval: E5
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E1 (same command). Test Files 1 passed (1); Tests 54 passed (54) — unchanged.
- eval: E6
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E1 (same command). Test Files 1 passed (1); Tests 54 passed (54) — unchanged; this eval's Vietnamese-diacritic case still asserts base64 bytes and response shape, unaffected by the filename-slug fix.
- eval: E7
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh — jobRunner.ts:76 is the direct call site of the changed slugify(). Test Files 1 passed (1); Tests 22 passed (22) — unchanged; the path-equality assertion (writer path === stored path) holds regardless of the slug's exact characters.

- eval: E8
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E1 (same command). Test Files 1 passed (1); Tests 54 passed (54) — unchanged.
- eval: E9
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command). Test Files 1 passed (1); Tests 22 passed (22) — unchanged.

- eval: E10
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command). Test Files 1 passed (1); Tests 22 passed (22) — unchanged.

- eval: E11
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): clip_http's command is byte-identical to job_http's (`npx vitest run mcp-server/src/http.test.ts`) — same run, same run_id, cited per the shared-command rule. Test Files 1 passed (1); Tests 54 passed (54) — unchanged; the synchronous 429-on-full-cap test is still green, no queueing leaked onto the sync path.
- eval: E12
  run_id: async-job-queue-r14-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh — tools.ts:59 is one of the three slugify() call sites for artifact filenames. Test Files 1 passed (1); Tests 52 passed (52) — unchanged.

- eval: E13
  run_id: async-job-queue-r14-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh per the run-every-eval instruction — motionCompiler.ts does not touch slugify. Test Files 1 passed (1); Tests 32 passed (32) — unchanged.

- eval: E14
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command). Test Files 1 passed (1); Tests 22 passed (22) — unchanged.

- eval: E15
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command). Test Files 1 passed (1); Tests 22 passed (22) — unchanged.

- eval: E16
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command) — this is the eval whose AC-12 fixture gained the NEW filename assertion in this merge: `expect(path.basename(written)).toContain('dak-lak')` for a job created with `location: 'Đắk Lắk'`. Test Files 1 passed (1); Tests 22 passed (22) — passing, including the new assertion; confirms the slugify fix actually reaches the sweep/delete path's filename.

- eval: E17
  run_id: async-job-queue-r14-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E4 (same command). Test Files 1 passed (1); Tests 16 passed (16) — unchanged.

- eval: E18
  run_id: async-job-queue-r14-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E1 (same command). Test Files 1 passed (1); Tests 54 passed (54) — unchanged.
- eval: E19
  run_id: async-job-queue-r14-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E13 (same command). Test Files 1 passed (1); Tests 32 passed (32) — unchanged.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: UNCERTAIN
  rationale: |
    (Giữ nguyên byte-for-byte đánh giá của giám khảo mù từ vòng 13 — AC-15 nằm ngoài phạm vi diff `535ee8e8..637ae403` của vòng này, nên không có căn cứ để chấm lại. `human_override` của vòng trước KHÔNG được kế thừa — chính sách kho be57c21 / PR #25 cấm agent nghiệm thu viết trường này dưới bất kỳ hình thức nào, kể cả chép lại giá trị cũ. Người ký phải tự đọc và tự điền lại ở Cổng 2 của vòng này.) Contract/design nêu đích danh và có lý do cho từng thiếu sót: không gọi ngược / không tiến độ / không huỷ đều ghi rõ 'OneHub chưa cần' ở Out of scope. Riêng restart làm mã việc vô danh KHÔNG phải khái niệm mới với người tiêu thụ: hành vi khi hỏi mã đó vẫn là 404 — đúng luồng AC-4 mà OneHub đã phải xử lý sẵn cho mọi mã lạ; contract nói thẳng hệ quả này thay vì giấu. Không thiếu sót nào buộc OneHub học thêm cơ chế giao thức ngoài gửi-việc/hỏi-việc-theo-nhịp.
  required_evidence:
    - Chủ repo tự đọc lại bốn thiếu sót nêu trong câu hỏi AC-15 (không gọi ngược, không báo tiến độ, không huỷ việc, restart làm mọi mã việc thành vô danh → 404) đối chiếu với nhu cầu THỰC của OneHub hôm nay, và tự tay xác nhận trực tiếp (không qua uỷ quyền phiên như vòng 13) liệu có cái nào chặn việc dọn từ `/render-clip` đồng bộ sang lối gửi-việc hay không; nếu có, nêu đích danh cái đó trong `human_override`.
  human_override:
- eval: E21
  run_id: async-job-queue-r14-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E4 (same command). Test Files 1 passed (1); Tests 16 passed (16) — unchanged.

- eval: E22
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command). Test Files 1 passed (1); Tests 22 passed (22) — unchanged.

- eval: E23
  run_id: async-job-queue-r14-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E4 (same command). Test Files 1 passed (1); Tests 16 passed (16) — unchanged.

- eval: E24
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command). Test Files 1 passed (1); Tests 22 passed (22) — unchanged.

- eval: E25
  run_id: async-job-queue-r14-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:00:50Z
  output: |
    Round 14 (`637ae403`): re-run fresh alongside E7 (same command). Test Files 1 passed (1); Tests 22 passed (22) — unchanged.

## Analyst

Baseline values carried forward unchanged from round 13 — this round's diff (`535ee8e8..637ae403`) does not recompute this contract's own pre-feature diffBase; it only merges a fix that changes the shape of generated filenames. Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, E17, E18, E19, E21, E22, E23, E25.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 14: triggered by merging `main` into this branch at `637ae403b478e6722ed8d37410426ac0d34e0657` (brings `affbe6c`, the slugify Đ/đ-transliteration fix in `src/lib/format.ts`, plus its regression tests and a new `jobRunner.test.ts` filename assertion, on top of round 13's `535ee8e8`). Re-ran EVERY eval fresh (not re-pinned) since `slugify()` feeds `fileNameFor()` in `jobRunner.ts:76`, which this contract exercises directly. All green, same counts as round 13 (job_http/clip_http 54, job_store 16, job_runner 22, clip_tools 52, motion_compiler 32); `npm test` baseline 499 passed | 7 skipped (506) — 499 not 501 because round 13's `535ee8e8` removed two dead `centroidOf` tests, not a regression of this round. `human_override` on E20 (AC-15) was NOT carried forward from round 13 per repo policy be57c21 / PR #25 (agents forbidden from writing that field under any instruction) — E20 downgraded to UNCERTAIN, overall verdict PENDING-JUDGMENT.

Round 12 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E5, E6, E8, E11, E18 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 11: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
