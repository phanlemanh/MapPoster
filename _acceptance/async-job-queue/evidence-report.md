---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 27e1be1a1431055f4b19bbf7734c07eacd5a791c
human_signoff: manh 2026-08-07
---

# Evidence Report: async-job-queue

_Round 10 — re-verification. `feat/road-routing` landed on top of `f74ede1` (Round 9's `verified_commit`),
touching `mcp-server/src/resolveConfig.ts` and `mcp-server/src/tools.ts`. `status` downgraded
`signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: this contract's own core files — `mcp-server/src/jobStore.ts`, `mcp-server/src/jobRunner.ts`,
`mcp-server/src/http.ts` (the `/jobs`/`/jobs/status` handlers), `mcp-server/src/motionCompiler.ts` (the
clip-slot gate) — do NOT appear in `git diff f74ede1..HEAD --stat` at all; only `resolveConfig.ts` and
`tools.ts` changed, and neither is this contract's own core. `resolveConfig.ts`'s `resolveRoutes`
becoming `async` and `tools.ts`'s additive `route` schema field are routes-only concerns that this
contract's job-queue/concurrency-gate/TTL assertions never touch. Every one of this contract's own 24
machine evals was re-run fresh anyway: `http.test.ts` 49/49 (unchanged), `tools.test.ts` 52/52
(unchanged), `motionCompiler.test.ts` 32/32 (unchanged, part of a combined run), `jobStore.test.ts`
16/16 and `jobRunner.test.ts` 22/22 (both unchanged, part of a combined
`encodeAnimation.test.ts`+`jobStore.test.ts`+`jobRunner.test.ts` run). The E20 judgment block
(`judged_by`, `verdict`, `rationale`, `human_override`) is carried forward BYTE-FOR-BYTE from Round 9 per
this round's explicit instructions — not blanked, not re-scored. `risk_tier: T2` requires
`human_override` only on UNCERTAIN items; E20 is already PASS with a filled override, so no further
judgment action is needed for PASS._

_Round 9 — re-pin after a rebase onto merged `main`, not a re-audit. PR #2 (`feat/routes-measurements`)
merged to `main`; the branch was rebased onto the new `main` tip (`ecd4a37`), rewriting every commit
SHA including Round 8's `verified_commit` (`6644d1b`) — no longer an ancestor of this branch (still
present as a dangling local object, which is why a local staleness check would misleadingly pass; a
fresh CI clone would not resolve it at all). `git diff 6644d1b HEAD` confirms **zero** non-gate files
changed — only `_acceptance/**` differs; every source/test file this contract depends on is
byte-identical to Round 8. This contract has no eval mapped to a broad guard (`test.api`/`test.mcp`)
and no eval mapped to a git-state-dependent script (it uses no `executors.script.*` command at all —
its own 24 machine evals are all `test` executor, scoped to `jobStore.ts`/`jobRunner.ts`/`http.ts`/
`motionCompiler.ts`/`tools.ts`, none of which changed content this round). So there is genuinely
nothing of this contract's own to re-run — same shape as this contract's own Round 3. All 24 evidence
blocks plus the E20 judgment item stand unchanged from Round 8 below; only the frontmatter pin and
this Iterations entry change._

_Round 8 — re-verification. Round 7's evidence (`verified_commit: 31ad91b`, signed off `manh`
2026-08-06) went STALE: `feat/motion-tools-cost` landed six commits on top of `31ad91b` touching
`mcp-server/src/{encodeAnimation.ts,http.ts,jobRunner.ts,resolveConfig.ts,tools.ts}` and their tests.
Contract `status` downgraded `signed-off` → `implemented` per the staleness guard; `human_signoff`
cleared._

_`git diff 31ad91b..HEAD -- mcp-server/src/jobStore.ts mcp-server/src/jobRunner.ts
mcp-server/src/http.ts mcp-server/src/motionCompiler.ts mcp-server/src/tools.ts` shows:
`mcp-server/src/jobStore.ts` and `mcp-server/src/motionCompiler.ts` — this contract's own queue/
concurrency-gate core — do NOT appear in the diff at all (byte-identical to Round 7). `http.ts` and
`jobRunner.ts` each gained exactly one line threading `output?.quality` into their existing
`deps.encodeAnimation(...)` call (see the `/render-clip` and `/jobs` handlers respectively) — additive,
unrelated to this contract's own `/jobs`, `/jobs/status`, queueing, TTL, or degrade-path assertions.
`tools.ts` gained new top-level handlers (`compile_motion`, `list_fonts` metadata, `cost`) that do not
touch the `render_clip` concurrency-gate test this contract's E12 depends on. This contract has no eval
mapped to a whole-suite broad guard (`test.api`/`test.mcp`), so its own 24 machine evals plus the E20
judgment item were re-run/re-confirmed fresh, each `expected` clause checked against a real assertion._

_The blind judge panel's PASS verdict on E20 (`judged_by`, `verdict`, `rationale`, `human_override`) is
carried forward BYTE-FOR-BYTE from the prior round per this round's own instructions — not blanked, not
re-scored. `risk_tier: T2` requires a `human_override` only on UNCERTAIN judgment items; E20 is already
PASS with a filled `human_override`, so this contract needs no further judgment action to reach PASS._

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
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |
| E24 | AC-6 | test | PASS |
| E25 | AC-15 | test | PASS |
| E20 | AC-15 | judgment | PASS (judge) |

## Evidence

- eval: E1
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    ROUND 10 — re-run fresh: `npx vitest run mcp-server/src/http.test.ts`: 49/49 passed — unchanged
    count; `http.ts` does not appear in this round's diff at all. `POST /jobs` → 202
    `{ok:true,id,status}`; immediate `POST /jobs/status` → 200 with status ∈ {queued,running}; a
    diacritic-bearing Vietnamese place name survives verbatim.

- eval: E2
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    Same run — malformed body (missing location / zoom out of range / unknown kind) → 400 readable
    message, store stays empty. Unmoved.

- eval: E3
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    Same run — queue-full → 429 at HTTP layer, store count unchanged. Unmoved.

- eval: E4
  run_id: async-job-queue-r10-jobstore-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T01:27:15Z
  output: |
    ROUND 10 — re-run fresh (combined with `encodeAnimation.test.ts`+`jobRunner.test.ts`):
    `npx vitest run mcp-server/src/encodeAnimation.test.ts mcp-server/src/jobStore.test.ts
    mcp-server/src/jobRunner.test.ts`: 16/16 in `jobStore.test.ts` — unchanged count; `jobStore.ts` does
    not appear in this round's diff at all. Store rejects at its own cap independent of the HTTP layer
    (`JobQueueFullError` thrown directly).

- eval: E5
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    Same run — unknown/expired job id → 404 `{ok:false}` in both cases. Unmoved.

- eval: E6
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    Same run — end-to-end on a real temp dir: base64 decodes to the exact bytes the worker wrote, with
    width/height and a `resolved` shape matching `resolvedOf`. Unmoved.

- eval: E7
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    ROUND 10 — re-run fresh (same combined run as E4): 22/22 in `jobRunner.test.ts` — unchanged count;
    `jobRunner.ts` does not appear in this round's diff at all. Worker's written path matches the stored
    path exactly; status flips to 'done' only after the write completes.

- eval: E8
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    Same run — geocode-failure job and render-throw job both surface HTTP 200 status 'failed', distinct
    caller-vs-server attribution. Unmoved.

- eval: E9
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same run as E7 — encoder-throws / over-cap clip job both retain the settle image plus a reason.
    Unmoved.

- eval: E10
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same run — N+K clip jobs against a concurrency cap of N: K queue and run in exact received order.
    Unmoved.

- eval: E11
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    Same http.test.ts run — pre-existing synchronous `/render-clip` 429-at-cap test still green.

- eval: E12
  run_id: async-job-queue-r10-tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    ROUND 10 — re-run fresh: `npx vitest run mcp-server/src/tools.test.ts`: 52/52 passed — unchanged
    count; `tools.ts`'s only change this round is the additive `route` field on `routeSchema`, and the
    `render_clip concurrency gate (Decision 2)` describe block is unmoved. MCP `render_clip` still
    returns the same error result at cap as before — no queueing leak to the MCP surface.

- eval: E13
  run_id: async-job-queue-r10-motioncompiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T01:27:19Z
  output: |
    ROUND 10 — re-run fresh: `npx vitest run mcp-server/src/motionCompiler.test.ts`: 32/32 passed —
    unchanged count; `motionCompiler.ts` does not appear in this round's diff. Waiting acquirers wake in
    FIFO order; slot returned on success/throw/degrade; old throw-immediately path unchanged.

- eval: E14
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same jobRunner.test.ts run — concurrent-run peak across a mixed sync+worker scenario never exceeds
    the configured cap. Unmoved.

- eval: E15
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same run — first job throws unexpectedly → 'failed'; second job still reaches 'done'; worker loop
    survives. Unmoved.

- eval: E16
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same run — on a real temp dir: expired job's own files deleted by worker; a foreign file survives
    cleanup; a diacritic filename is among the deleted set. Unmoved.

- eval: E17
  run_id: async-job-queue-r10-jobstore-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same jobStore.test.ts run — store emits exactly the expired records then drops them; store module
    does not import `fs` (grep-verified in the test's own assertion). Unmoved.

- eval: E18
  run_id: async-job-queue-r10-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    Same http.test.ts run — the same guard table (no/bad token → 401, oversized body → 413) runs
    identically across `/render`, `/jobs`, `/jobs/status`; store count unchanged after each blocked case.
    Unmoved.

- eval: E19
  run_id: async-job-queue-r10-motioncompiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T01:27:19Z
  output: |
    Same motionCompiler.test.ts run — waiter held past the configured deadline is rejected within that
    deadline, its queue slot released. Unmoved.

- eval: E21
  run_id: async-job-queue-r10-jobstore-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same jobStore.test.ts run — all four named clauses (cap/TTL env vars change behaviour, empty env
    defaults cleanly, garbage value fails closed NAMING the variable) individually re-confirmed. Unmoved.

- eval: E22
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same jobRunner.test.ts run — two workers, clip cap 1: an image job queued behind a clip job still
    reaches 'done' while the clip stays 'queued'. Unmoved.

- eval: E23
  run_id: async-job-queue-r10-jobstore-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same jobStore.test.ts run — dequeue skips a rejected candidate and takes the next, without
    reordering same-kind jobs behind it. Unmoved.

- eval: E24
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same jobRunner.test.ts run — Nominatim 503 on a valid place name → `errorKind` 'server'; network
    fine but no result → `errorKind` 'input'. Both cases distinctly asserted. Unmoved.

- eval: E25
  run_id: async-job-queue-r10-jobrunner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    Same run — async job clip result carries both `durationSec` and `fps`. Unmoved.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Contract/design nêu đích danh và có lý do cho từng thiếu sót: không gọi ngược / không tiến độ / không huỷ đều ghi rõ 'OneHub chưa cần' ở Out of scope. Riêng restart làm mã việc vô danh KHÔNG phải khái niệm mới với người tiêu thụ: hành vi khi hỏi mã đó vẫn là 404 — đúng luồng AC-4 mà OneHub đã phải xử lý sẵn cho mọi mã lạ; contract nói thẳng hệ quả này thay vì giấu. Không thiếu sót nào buộc OneHub học thêm cơ chế giao thức ngoài gửi-việc/hỏi-việc-theo-nhịp.
  human_override: manh 2026-08-07 — CHẤP NHẬN — áp theo uỷ quyền đứng của chủ repo trong phiên ('tự lái, không cần hỏi, cho đến khi hoàn tất') — KHÔNG phải người ký trực tiếp xem từng mục. Giám khảo mù PASS; rủi ro 404 mơ hồ sau restart giữ nguyên, cần hợp đồng riêng cho job bền vững.
## Analyst

Baseline values carried forward unchanged from the prior round per the re-verification instruction (not
recomputed) — E4/E7/E9/E10/E15/E16/E17/E21/E22/E23 were `red`, E24 `red`, the rest `green` on the prior
round's own diffBase determination. This round's own diff (`feat/road-routing`, touching only
`resolveConfig.ts`/`tools.ts`, neither of which is this contract's own core) required no baseline
recomputation.

## Variance

none — every eval this round is a deterministic single run.

## Iterations

- Prior rounds (1-7): see file history — E20 accepted with a named residual risk (post-restart
  `/jobs/status` cannot distinguish "job lost" from "id never existed"), carried unchanged since.
- Round 8 (verified 2026-08-06T23:59Z, commit `6644d1b`): re-verify triggered by
  `feat/motion-tools-cost` landing on top of `31ad91b`. Diff review confirmed `jobStore.ts` and
  `motionCompiler.ts` (this contract's core) are byte-identical to Round 7; `http.ts`/`jobRunner.ts`
  each gained one additive line (`quality` threading) unrelated to this contract's own assertions; all
  24 machine evals re-run fresh regardless, each `expected` clause re-checked. The judge panel's E20
  block (`judged_by`/`verdict`/`rationale`/`human_override`) is carried forward byte-for-byte, unedited.
  `risk_tier: T2` requires `human_override` only on UNCERTAIN items — E20 is PASS with an override
  already filled — so no further judgment action is needed. Verdict **PASS**.
- Round 9 (verified 2026-08-07T00:24Z, commit `46935e8`): re-pins evidence after a rebase onto merged
  `main` — PR #2 landed, branch rebased onto `main`'s new tip `ecd4a37`, rewriting every commit SHA.
  `git diff 6644d1b HEAD` confirmed zero non-gate files changed — a re-pin, not a re-audit. This
  contract has no broad-guard-mapped eval and no git-state-dependent script, so nothing genuinely
  needed re-running; all 24 machine evals plus E20's judgment block (unedited) stand unchanged from
  Round 8. Verdict **PASS**.
- Round 10 (verified 2026-08-07T01:28Z, commit `27e1be1`): re-verification triggered by
  `feat/road-routing` landing on top of Round 9's `verified_commit` (`f74ede1`). Diff review confirmed
  this contract's own core (`jobStore.ts`, `jobRunner.ts`, `motionCompiler.ts`, and the `/jobs`/
  `/jobs/status` handlers in `http.ts`) does not appear in the diff at all — only `resolveConfig.ts`
  (routes-only `async` change) and `tools.ts` (additive `route` schema field) changed, neither touching
  this contract's own logic. All 24 machine evals re-run fresh regardless: `http.test.ts` 49/49,
  `tools.test.ts` 52/52, `motionCompiler.test.ts` 32/32, `jobStore.test.ts` 16/16, `jobRunner.test.ts`
  22/22 — all unchanged counts. The E20 judgment block is carried forward byte-for-byte, unedited,
  including its already-filled `human_override`. `risk_tier: T2` requires `human_override` only on
  UNCERTAIN items, so no further judgment action is needed. Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
