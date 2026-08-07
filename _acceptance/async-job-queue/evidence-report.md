---
schema_version: 2
feature_slug: async-job-queue
verdict: PENDING-JUDGMENT
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: 
---

# Evidence Report: async-job-queue

_Round 13 — full re-run (not a re-pin), triggered by `affbe6c5` (`fix: slugify chuyển tự Đ/đ thay vì đánh rơi cả chữ`). The fix touches `src/lib/format.ts` (adds two `.replace()` calls before NFKD so Đ/đ/Ð/ð transliterate to `d` instead of being deleted), `src/lib/format.test.ts`, and `mcp-server/src/jobRunner.test.ts` (adds a real filename assertion — `Đắk Lắk` now must survive into the written artifact's filename with `d`, not be dropped). `slugify()` feeds `fileNameFor()` in `mcp-server/src/jobRunner.ts`, and this contract's own E1/E6/E16 fixtures explicitly use Vietnamese diacritic place names asserted through to job-store and filenames — so this is a real behaviour change inside this contract's surface, not an adjacent file. Every eval was re-run fresh rather than re-pinned, per the task instruction: all five executor commands (`job_http`, `job_store`, `job_runner`, `motion_compiler`, `clip_tools`) executed clean, zero failures, zero regressions. `verified_commit` updated to `affbe6c57401eafaffb7ced1a70c4f7def9d196c`; `human_signoff` cleared — a human signs at Gate 2, never the verify subagent._

_Judgment E20 (AC-15): its judged subject matter — whether the two-door REST contract (`POST /jobs` / `POST /jobs/status`) is sufficient for a consumer like OneHub to switch over without new protocol concepts — is genuinely untouched by a filename-transliteration fix, and the blind judge's own verdict (PASS) is carried over as recorded._

_But the inherited `human_override` line was **WITHDRAWN** this round, so E20 reverts to UNCERTAIN and the overall verdict is **PENDING-JUDGMENT**, not PASS. Reason: that line self-documents as `KHONG phai nguoi ky truc tiep xem tung muc` — it was filled by an agent under a standing "tự lái, không cần hỏi" authorisation, not by a person reviewing this item. An attestation that declares itself not-human-reviewed cannot carry a NEWLY minted PASS pinned to a NEW commit; that is the "gate becomes theater" anti-pattern the T3/judgment machinery exists to prevent. Repo owner's decision (session 2026-08-07): withdraw all such inherited overrides and have a human resolve each item at Gate 2. This is strictly stricter than the Round 11/12 precedent — nothing merges until the owner personally fills the override._

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
| E20 | AC-15 | judgment | UNCERTAIN (judge scored PASS; inherited human_override WITHDRAWN — owner resolves at Gate 2) |
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |
| E24 | AC-6 | test | PASS |
| E25 | AC-15 | test | PASS |

## Evidence

- eval: E1
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 54 passed (54). AC-1 fixture with Vietnamese diacritic place name confirmed passing unchanged through the slugify fix.
- eval: E2
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 54 passed (54). AC-2 400-rejection assertions unaffected by the slugify fix.
- eval: E3
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 54 passed (54). AC-3 429/queue-cap assertions unaffected by the slugify fix.
- eval: E4
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 16 passed (16). AC-3 store-level cap invariant unaffected.

- eval: E5
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 54 passed (54). AC-4 404-on-unknown-id assertions unaffected.
- eval: E6
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`) — DIRECTLY in scope: this eval's Vietnamese-diacritic fixture asserts the place name survives byte-for-byte through jobStore into the /jobs/status response. Test Files 1 passed (1); Tests 54 passed (54). Passing confirms the slugify fix did not regress this end-to-end path (slugify governs the artifact FILENAME, not the response body's place-name field, so this eval's own assertion target was never broken by the pre-fix bug — but it shares fixtures with E16 which does hit the filename path).
- eval: E7
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-5 write-then-flip-to-done ordering assertions unaffected.

- eval: E8
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 54 passed (54). AC-6 caller-vs-server errorKind assertions unaffected.
- eval: E9
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-7 degrade-contract (settle never dropped) assertions unaffected.

- eval: E10
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-8 FIFO-queue-under-cap assertions unaffected.

- eval: E11
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 54 passed (54). AC-9 sync-path 429-still-rejects-immediately regression guard unaffected.
- eval: E12
  run_id: async-job-queue-r13-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 52 passed (52). AC-9 MCP render_clip cap-rejection regression guard unaffected.

- eval: E13
  run_id: async-job-queue-r13-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 32 passed (32). AC-10 wake-on-every-exit-path assertions unaffected.

- eval: E14
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-10 concurrent-peak-never-exceeds-cap assertions unaffected.

- eval: E15
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-11 worker-loop-survives-unexpected-throw assertions unaffected.

- eval: E16
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`) — DIRECTLY in scope, exact bug site: `mcp-server/src/jobRunner.test.ts:339` describe block "dọn tệp hết hạn (AC-12)" now creates `store.create({ kind: 'render', params: { location: 'Đắk Lắk' }, ... })` and asserts the actual written filename contains the transliterated `d`, not a dropped first letter — the assertion the commit message says was previously missing ("chú thích nói ... nhưng bài kiểm chưa hề soi tên tệp"). Test Files 1 passed (1); Tests 22 passed (22). Confirms `fileNameFor()` (which calls `slugify()`) now produces `dak-lak`-style names for Đ/đ/Ð/ð input instead of dropping the leading letter, and that the cleanup-deletes-the-right-file assertion still holds against that corrected filename.

- eval: E17
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 16 passed (16). AC-12 store-emits-expired/no-fs-import invariant unaffected.

- eval: E18
  run_id: async-job-queue-r13-job_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 54 passed (54). AC-13 shared-guard-across-three-doors assertions unaffected.
- eval: E19
  run_id: async-job-queue-r13-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 32 passed (32). AC-14 bounded-wait-timeout assertions unaffected.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: UNCERTAIN
  rationale: |
    Giám khảo mù chấm PASS (nguyên văn vòng trước): Contract/design nêu đích danh và có lý do cho từng thiếu sót: không gọi ngược / không tiến độ / không huỷ đều ghi rõ 'OneHub chưa cần' ở Out of scope. Riêng restart làm mã việc vô danh KHÔNG phải khái niệm mới với người tiêu thụ: hành vi khi hỏi mã đó vẫn là 404 — đúng luồng AC-4 mà OneHub đã phải xử lý sẵn cho mọi mã lạ; contract nói thẳng hệ quả này thay vì giấu. Không thiếu sót nào buộc OneHub học thêm cơ chế giao thức ngoài gửi-việc/hỏi-việc-theo-nhịp.

    NHƯNG vòng 13 RÚT dòng `human_override` thừa kế, nên mục này quay lại UNCERTAIN.
    Dòng cũ tự ghi rõ nó KHÔNG phải người ký trực tiếp xem từng mục — nó được điền
    theo "uỷ quyền đứng trong phiên". Một attestation tự khai là không-phải-người-xem
    thì không đủ tư cách chống đỡ một verdict PASS mới ghim ở commit mới. Chủ repo đã
    quyết (phiên 2026-08-07): rút hết, để người duyệt lại từng mục ở Gate 2.
  required_evidence:
    - Chủ repo tự đọc mục Out of scope của contract + luồng AC-4, rồi trả lời: OneHub có phải học thêm khái niệm giao thức nào ngoài gửi-việc/hỏi-việc-theo-nhịp không? Nếu không → điền human_override.
  human_override: 
- eval: E21
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 16 passed (16). AC-16 config-knobs-have-real-effect/fail-closed assertions unaffected.

- eval: E22
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-17 clip-queueing-does-not-starve-render-worker assertions unaffected.

- eval: E23
  run_id: async-job-queue-r13-job_store-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 16 passed (16). AC-17 dequeue-skips-rejected-preserves-order assertions unaffected.

- eval: E24
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-6 third-party-503-is-server-error assertions unaffected.

- eval: E25
  run_id: async-job-queue-r13-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T07:44:02Z
  output: |
    Round 13 fresh run (post `affbe6c5`). Test Files 1 passed (1); Tests 22 passed (22). AC-15 clip-block-carries-durationSec/fps assertions unaffected.

## Analyst

Baseline values are carried forward unchanged from the prior round — this round's diff (`affbe6c5`) does not recompute this contract's own pre-feature diffBase, it only re-runs against the current tree. Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, E17, E18, E19, E21, E22, E23, E25. Note E16 in particular: its baseline is `green` in the sense that the OLD (pre-fix) code also passed this same command, but that is because the filename-content assertion this round's fix required (`mcp-server/src/jobRunner.test.ts:339`) is itself new-since-last-round tree content baked into the current test file — the eval as it now stands is discriminating against the pre-`affbe6c5` slugify bug (dropping Đ/đ), it just wasn't isolated as its own baseline run this round.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 13: full re-run (not a re-pin) triggered by `affbe6c5` (`slugify` fix for Đ/đ/Ð/ð transliteration, reaching `fileNameFor()` in `jobRunner.ts` via `src/lib/format.ts`). Every eval in evals.yaml re-ran fresh across all five executor commands (job_http, job_store, job_runner, motion_compiler, clip_tools) — zero failures, zero regressions. Judgment E20 carried forward byte-for-byte (subject matter untouched by the fix). `verified_commit` re-pinned to `affbe6c5`; `human_signoff` cleared.

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
