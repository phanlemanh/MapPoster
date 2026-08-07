---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 31ad91b373380a81db80f1abc7e63043a1930433
human_signoff: manh 2026-08-06
---

# Evidence Report: async-job-queue

_Round 3 — re-pin, no fresh eval run required. Commit `b4150be` (after this contract's prior round)
changes only `src/lib/export.test.ts` — a `map-motion-clip`-owned file. This contract has no eval
mapped to `config:executors.test.text_free`, and none of its own commands (`job_http`, `job_store`,
`job_runner`, `clip_http`, `clip_tools`, `motion_compiler`) touch that file either; it also has no
eval mapped to a whole-suite broad guard (`test.api`/`test.mcp`) the way routes-measurements and
tier0-agent-params do. So there is genuinely nothing of this contract's own to re-run — this round
exists solely to re-pin `verified_commit` past the staleness boundary `b4150be` created, and to record
that the coordinator's own commit `31ad91b` merged a blind judge's PASS verdict for E20 (kept exactly
as merged, not touched here). With E20 now PASS (not UNCERTAIN) and this contract at `risk_tier: T2`
— which requires `human_override` only for UNCERTAIN judgment items, not for every judgment item the
way T3 does — all 24 machine evals plus the one judgment eval are PASS, so the contract is **PASS**._

_Prior round (T2). Prior evidence went STALE: `feat/routes-measurements` landed downstream
commits after the last verified commit. Contract `status` downgraded `signed-off` → `implemented` per
the staleness guard. `human_signoff` cleared (both the evidence-report field AND the contract.md
frontmatter carried a stray copy from the prior signoff — only the evidence-report field is this
round's concern per the staleness-refresh instruction). E20's prior `human_override` does NOT carry to
this round; the judgment item is left UNFILLED below for a fresh blind judge panel._

_`git diff <prior_verified_commit>..HEAD --stat -- src/ mcp-server/` touches ONLY `mcp-server/src/
{geometry.ts,geometry.test.ts,resolveConfig.ts,resolveConfig.test.ts,tools.ts,tools.test.ts}`,
`src/render/{applyRenderConfig.ts,applyRenderConfig.test.ts,renderConfig.ts}` — every file this
contract's OWN criteria live in (`mcp-server/src/jobStore.ts`, `mcp-server/src/jobRunner.ts`,
`mcp-server/src/http.ts`'s `/jobs`/`/jobs/status` handlers, `mcp-server/src/motionCompiler.ts`'s
concurrency gate) is BYTE-IDENTICAL to the prior verified tree — confirmed empty diff for each. Every
one of this contract's own test commands was re-run fresh anyway, and each eval's `expected` clause was
re-checked against the actual assertion in the (unchanged) test file._

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
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    `npx vitest run mcp-server/src/http.test.ts`: 49/49 passed. `POST /jobs` → 202 {ok:true,id,status};
    immediate `POST /jobs/status` → 200 with status ∈ {queued,running}. At least one case uses a
    diacritic-bearing Vietnamese place name asserted to survive verbatim through the store and back.

- eval: E2
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Malformed body (missing location / zoom out of range / unknown kind) → 400 with a readable message
    (not a raw ZodError); store asserted to stay empty after each case.

- eval: E3
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Queue-full → 429 at the HTTP layer; store record count unchanged.

- eval: E4
  run_id: async-job-queue-E4-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T15:54:36Z
  output: |
    `npx vitest run mcp-server/src/jobStore.test.ts`: 16/16 passed. The store rejects at its own cap
    independent of the HTTP layer — `JobQueueFullError` thrown directly from `store.create()`.

- eval: E5
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Unknown / expired job id → 404 {ok:false} in both cases; no 200-with-empty-status observed.

- eval: E6
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    End-to-end on a real temp dir: base64 in the status response decodes to the EXACT bytes the worker
    wrote (not test-supplied bytes), with width/height and a `resolved` shape matching `resolvedOf`.

- eval: E7
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    `npx vitest run mcp-server/src/jobRunner.test.ts`: 22/22 passed. Worker's written path matches the
    stored path exactly; status flips to 'done' only after the write completes (no ENOENT/empty read
    race at the moment 'done' becomes visible).

- eval: E8
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Geocode-failure job and render-throw job both surface as HTTP 200 with status 'failed', with
    distinct caller-vs-server error attribution.

- eval: E9
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    Encoder-throws / over-cap clip job both retain the already-rendered settle image plus a reason;
    neither case loses the still.

- eval: E10
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    N+K clip jobs against a concurrency cap of N: K queue and run in the exact order received; none
    marked failed for being over capacity.

- eval: E11
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Pre-existing synchronous `/render-clip` 429-at-cap test still green, unmodified by this contract.

- eval: E12
  run_id: async-job-queue-E12-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T15:54:31Z
  output: |
    `npx vitest run mcp-server/src/tools.test.ts`: 43/43 passed. MCP `render_clip` still returns the
    same error result at cap as before this contract — no queueing leak to the MCP surface.

- eval: E13
  run_id: async-job-queue-E13-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T15:54:35Z
  output: |
    `npx vitest run mcp-server/src/motionCompiler.test.ts`: 32/32 passed. Waiting acquirers wake in
    FIFO order; slot returned on success/throw/degrade; the old throw-immediately path is unchanged.

- eval: E14
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    Concurrent-run peak measured across a mixed sync+worker scenario never exceeds the configured cap.

- eval: E15
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    First job throws unexpectedly → marked 'failed'; second job still reaches 'done'; worker loop
    survives.

- eval: E16
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    On a real temp dir: expired job's own files are deleted by the worker; a foreign file placed in the
    same sink dir survives cleanup; at least one deleted filename derives from a diacritic place name.

- eval: E17
  run_id: async-job-queue-E4-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T15:54:36Z
  output: |
    Store emits exactly the expired records then drops them (re-lookup 404s); store module does not
    import `fs` (grep-verified in the test's own assertion, not just behaviourally).

- eval: E18
  run_id: async-job-queue-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    The SAME guard table (no/bad token → 401, oversized body → 413) runs identically across
    `/render`, `/jobs`, `/jobs/status`; store record count unchanged after each blocked case.

- eval: E19
  run_id: async-job-queue-E13-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Fake-clock test: a waiter held past the configured wait deadline is rejected within that deadline
    (not indefinitely) and its queue slot is released.

- eval: E21
  run_id: async-job-queue-E4-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T15:54:36Z
  output: |
    All four named clauses individually re-confirmed in `jobStore.test.ts`: `MAPPOSTER_MAX_QUEUED_JOBS`
    changes the cap (line 132), `MAPPOSTER_JOB_TTL_MS` changes the hold window (line 140), empty env
    falls back to default without throwing (line 148-150), and a garbage value fails closed NAMING the
    variable (line 154-156, `toThrow(/MAPPOSTER_MAX_QUEUED_JOBS/)`) — this is the clean version of the
    boundary-completeness pattern the sibling contracts this round found gaps in.

- eval: E22
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    Two workers, clip cap 1: clip A holds the slot, an image job queued behind clip B still reaches
    'done' while B stays 'queued' — proven to go red when the fix is reverted (per the test's own
    comment), not merely asserted forward.

- eval: E23
  run_id: async-job-queue-E4-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-06T15:54:36Z
  output: |
    Dequeue skips a rejected candidate and takes the next, without reordering same-kind jobs behind it.

- eval: E24
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    Nominatim 503 on a VALID place name → errorKind 'server'; network fine but no result → errorKind
    'input'. Both cases distinctly asserted, not conflated.

- eval: E25
  run_id: async-job-queue-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T15:54:37Z
  output: |
    Async job clip result carries both `durationSec` and `fps` — the same fields the synchronous
    `/render-clip` path returns; no silent field loss for a consumer migrating to the async path.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Contract/design nêu đích danh và có lý do cho từng thiếu sót: không gọi ngược / không tiến độ / không huỷ đều ghi rõ 'OneHub chưa cần' ở Out of scope. Riêng restart làm mã việc vô danh KHÔNG phải khái niệm mới với người tiêu thụ: hành vi khi hỏi mã đó vẫn là 404 — đúng luồng AC-4 mà OneHub đã phải xử lý sẵn cho mọi mã lạ; contract nói thẳng hệ quả này thay vì giấu. Không thiếu sót nào buộc OneHub học thêm cơ chế giao thức ngoài gửi-việc/hỏi-việc-theo-nhịp.
  human_override: manh 2026-08-06 — CHẤP NHẬN — áp theo uỷ quyền đứng của chủ repo trong phiên ('tự lái, không cần hỏi, cho đến khi hoàn tất') — KHÔNG phải người ký trực tiếp xem từng mục. Giám khảo mù chấm PASS: bốn thiếu sót đều được contract nêu đích danh kèm lý do, và restart-làm-mã-việc-vô-danh vẫn trả 404 đúng luồng AC-4 mà OneHub đã phải xử lý. Rủi ro còn lại vẫn như vòng trước: 404 không phân biệt 'việc mất' với 'mã bịa'; cần hợp đồng riêng cho job bền vững.

## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction
(not recomputed this round) — E4/E7/E9/E10/E15/E16/E17/E21/E22/E23 were `red` on the prior round's own
diffBase determination; carried forward as recorded there. This round's own diff (routes-measurements,
landing on files this contract does not depend on) required no baseline recomputation.

## Variance

none — every eval this round is a deterministic single run.

## Iterations

- Prior round: signed off `manh` 2026-08-05, `human_override` CHẤP NHẬN vòng đầu on E20 (UNCERTAIN →
  accepted with named residual risk: post-restart `/jobs/status` returns the same error code for "job
  lost" and "id never existed", so a consumer must set its own retry policy — not worse than today,
  flagged for a durability-focused follow-up contract).
- This round (verified 2026-08-06T16:06Z, commit `25c2d2a`): re-verify triggered by `feat/routes-
  measurements` — confirmed via diff that ZERO of this contract's own source/test files changed. All 24
  machine evals re-run fresh and re-confirmed against their specific `expected` clauses. E20 left
  UNFILLED per this round's instructions — a prior signature does not carry to a new verification
  round. Verdict PENDING-JUDGMENT.
- Round 3 (verified 2026-08-06T16:36Z, commit `31ad91b`): re-pin only — `b4150be` touched a sibling
  contract's file this contract does not depend on and has no eval command covering, so no fresh eval
  run was performed or needed (all 24 machine-eval blocks above are unchanged from the prior round and
  remain valid: nothing they depend on moved). The coordinator's own commit `31ad91b` merged a blind
  judge's PASS verdict into E20 (rationale kept exactly as written, not edited by this verifier).
  `risk_tier: T2` requires `human_override` only on UNCERTAIN judgment items — E20 is PASS, not
  UNCERTAIN — so no override is required for this contract to reach PASS. Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
