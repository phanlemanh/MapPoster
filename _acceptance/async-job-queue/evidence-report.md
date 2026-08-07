---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 6644d1b2e4b7a0a3758453d2ee8b77cd3399fdcd
human_signoff:
---

# Evidence Report: async-job-queue

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
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    ROUND 8 — re-run fresh: `npx vitest run mcp-server/src/http.test.ts`: 49/49 passed — unchanged
    count from Round 7. `POST /jobs` → 202 `{ok:true,id,status}`; immediate `POST /jobs/status` → 200
    with status ∈ {queued,running}; a diacritic-bearing Vietnamese place name survives verbatim. This
    contract's `/jobs`/`/jobs/status` handlers in `http.ts` are unmoved by this round's diff (only the
    unrelated `encodeQuality` hoist inside `/render-clip`'s own handler changed).

- eval: E2
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    Same run — malformed body (missing location / zoom out of range / unknown kind) → 400 readable
    message, store stays empty. Unmoved.

- eval: E3
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    Same run — queue-full → 429 at HTTP layer, store count unchanged. Unmoved.

- eval: E4
  run_id: async-job-queue-E4-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T23:59:14Z
  output: |
    ROUND 8 — re-run fresh: `npx vitest run mcp-server/src/jobStore.test.ts`: 16/16 passed — unchanged
    count; `jobStore.ts` does not appear in this round's diff at all. Store rejects at its own cap
    independent of the HTTP layer (`JobQueueFullError` thrown directly).

- eval: E5
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    Same run — unknown/expired job id → 404 `{ok:false}` in both cases. Unmoved.

- eval: E6
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    Same run — end-to-end on a real temp dir: base64 decodes to the exact bytes the worker wrote, with
    width/height and a `resolved` shape matching `resolvedOf`. Unmoved.

- eval: E7
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    ROUND 8 — re-run fresh: `npx vitest run mcp-server/src/jobRunner.test.ts`: 22/22 passed — unchanged
    count. Worker's written path matches the stored path exactly; status flips to 'done' only after the
    write completes. `jobRunner.ts`'s only change this round is the `quality` threading in its encode
    call, unrelated to this write-then-flip-status assertion.

- eval: E8
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    Same run — geocode-failure job and render-throw job both surface HTTP 200 status 'failed', distinct
    caller-vs-server attribution. Unmoved.

- eval: E9
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same run as E7 — encoder-throws / over-cap clip job both retain the settle image plus a reason.
    Unmoved.

- eval: E10
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same run — N+K clip jobs against a concurrency cap of N: K queue and run in exact received order.
    Unmoved.

- eval: E11
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    Same http.test.ts run — pre-existing synchronous `/render-clip` 429-at-cap test still green.

- eval: E12
  run_id: async-job-queue-E12-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T23:55:39Z
  output: |
    ROUND 8 — re-run fresh: `npx vitest run mcp-server/src/tools.test.ts`: 52/52 passed (up from 43 —
    motion-tools-cost's own new describe blocks; the `render_clip concurrency gate (Decision 2)` describe
    block is unmoved). MCP `render_clip` still returns the same error result at cap as before — no
    queueing leak to the MCP surface.

- eval: E13
  run_id: async-job-queue-E13-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T23:59:04Z
  output: |
    ROUND 8 — re-run fresh: `npx vitest run mcp-server/src/motionCompiler.test.ts`: 32/32 passed —
    unchanged count; `motionCompiler.ts` does not appear in this round's diff. Waiting acquirers wake in
    FIFO order; slot returned on success/throw/degrade; old throw-immediately path unchanged.

- eval: E14
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same jobRunner.test.ts run — concurrent-run peak across a mixed sync+worker scenario never exceeds
    the configured cap. Unmoved.

- eval: E15
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same run — first job throws unexpectedly → 'failed'; second job still reaches 'done'; worker loop
    survives. Unmoved.

- eval: E16
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same run — on a real temp dir: expired job's own files deleted by worker; a foreign file survives
    cleanup; a diacritic filename is among the deleted set. Unmoved.

- eval: E17
  run_id: async-job-queue-E4-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T23:59:14Z
  output: |
    Same jobStore.test.ts run — store emits exactly the expired records then drops them; store module
    does not import `fs` (grep-verified in the test's own assertion). Unmoved.

- eval: E18
  run_id: async-job-queue-E1-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T23:56:42Z
  output: |
    Same http.test.ts run — the same guard table (no/bad token → 401, oversized body → 413) runs
    identically across `/render`, `/jobs`, `/jobs/status`; store count unchanged after each blocked case.
    Unmoved.

- eval: E19
  run_id: async-job-queue-E13-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T23:59:04Z
  output: |
    Same motionCompiler.test.ts run — waiter held past the configured deadline is rejected within that
    deadline, its queue slot released. Unmoved.

- eval: E21
  run_id: async-job-queue-E4-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T23:59:14Z
  output: |
    Same jobStore.test.ts run — all four named clauses (cap/TTL env vars change behaviour, empty env
    defaults cleanly, garbage value fails closed NAMING the variable) individually re-confirmed. Unmoved.

- eval: E22
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same jobRunner.test.ts run — two workers, clip cap 1: an image job queued behind a clip job still
    reaches 'done' while the clip stays 'queued'. Unmoved.

- eval: E23
  run_id: async-job-queue-E4-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T23:59:14Z
  output: |
    Same jobStore.test.ts run — dequeue skips a rejected candidate and takes the next, without
    reordering same-kind jobs behind it. Unmoved.

- eval: E24
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same jobRunner.test.ts run — Nominatim 503 on a valid place name → `errorKind` 'server'; network
    fine but no result → `errorKind` 'input'. Both cases distinctly asserted. Unmoved.

- eval: E25
  run_id: async-job-queue-E7-20260807r8
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T23:56:36Z
  output: |
    Same run — async job clip result carries both `durationSec` and `fps`. Unmoved.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Contract/design nêu đích danh và có lý do cho từng thiếu sót: không gọi ngược / không tiến độ / không huỷ đều ghi rõ 'OneHub chưa cần' ở Out of scope. Riêng restart làm mã việc vô danh KHÔNG phải khái niệm mới với người tiêu thụ: hành vi khi hỏi mã đó vẫn là 404 — đúng luồng AC-4 mà OneHub đã phải xử lý sẵn cho mọi mã lạ; contract nói thẳng hệ quả này thay vì giấu. Không thiếu sót nào buộc OneHub học thêm cơ chế giao thức ngoài gửi-việc/hỏi-việc-theo-nhịp.
  human_override: manh 2026-08-06 — CHẤP NHẬN — áp theo uỷ quyền đứng của chủ repo trong phiên ('tự lái, không cần hỏi, cho đến khi hoàn tất') — KHÔNG phải người ký trực tiếp xem từng mục. Giám khảo mù chấm PASS: bốn thiếu sót đều được contract nêu đích danh kèm lý do, và restart-làm-mã-việc-vô-danh vẫn trả 404 đúng luồng AC-4 mà OneHub đã phải xử lý. Rủi ro còn lại vẫn như vòng trước: 404 không phân biệt 'việc mất' với 'mã bịa'; cần hợp đồng riêng cho job bền vững.

## Analyst

Baseline values carried forward unchanged from the prior round per the re-verification instruction (not
recomputed) — E4/E7/E9/E10/E15/E16/E17/E21/E22/E23 were `red`, E24 `red`, the rest `green` on the prior
round's own diffBase determination. This round's own diff (motion-tools-cost, landing additively on
`http.ts`/`jobRunner.ts`/`tools.ts` and not touching `jobStore.ts`/`motionCompiler.ts` at all) required
no baseline recomputation.

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

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
