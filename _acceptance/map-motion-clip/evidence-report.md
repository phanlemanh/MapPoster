---
schema_version: 2
feature_slug: map-motion-clip
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 25c2d2ae828cfcbbe315d8839e0f932aa531ab56
human_signoff:
---

# Evidence Report: map-motion-clip

_Re-verification round (T3). Prior evidence went STALE: `feat/routes-measurements` landed downstream
commits after the last verified commit. Contract `status` downgraded `signed-off` → `implemented` per
the staleness guard. `human_signoff` cleared, and E16/E17's prior `human_override` values do NOT carry
to this round — both judgment items are left UNFILLED below for a fresh blind judge panel, regardless
of what a prior round decided._

_`git diff <prior_verified_commit>..HEAD --stat -- src/ mcp-server/ e2e/` touches ONLY
`mcp-server/src/{geometry.ts,geometry.test.ts,resolveConfig.ts,resolveConfig.test.ts,tools.ts,
tools.test.ts}`, `src/render/{applyRenderConfig.ts,applyRenderConfig.test.ts,renderConfig.ts}` — every
file this contract's OWN criteria live in (`src/render/motionScript.ts`, `mcp-server/src/
motionCompiler.ts`, `mcp-server/src/http.ts`'s `/render-clip` handler, `src/lib/export.ts`,
`src/lib/mapStyle.ts`) is BYTE-IDENTICAL to the prior verified tree — confirmed empty diff for each.
This is the lowest-risk shape of "stale by shared-file taxation" a re-verify round can have: nothing
this contract's own assertions depend on moved at all. Every one of this contract's own test commands
was re-run fresh anyway (no result assumed from the prior round), and each eval's specific `expected`
clause was re-checked against the actual assertion in the (unchanged) test file, not just the exit
code._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-10 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-11 | test | PASS |
| E15 | AC-12 | test | PASS |
| E16 | AC-13 | judgment | UNCERTAIN (unscored — pending blind judge panel) |
| E17 | AC-14 | judgment | UNCERTAIN (unscored — pending blind judge panel) |

## Evidence

- eval: E1
  run_id: map-motion-clip-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T15:54:35Z
  output: |
    `npx vitest run src/render/motionScript.test.ts`: 16/16 passed. Each of the five invariants
    (R/O/L/B/I) has a violation case asserted against its own prefix (`toThrow(/^R:/)` etc.) —
    confirmed by reading the file's `describe` blocks (R: lines 27-31, O: 33-51, L: 53-60, B: 61-67,
    I: elsewhere in the file), unchanged since the prior round (file not in this round's diff).

- eval: E2
  run_id: map-motion-clip-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Exact-boundary acceptance explicitly asserted (not just "in range"): line 27-30, restAtSec at
    EXACTLY `6 * REST_RATIO` (= 4.32, the 0.72×duration boundary) does NOT throw; line 64-67,
    `fps: 24, durationSec: 12` (24×12 = 288, the frame-budget boundary) does NOT throw. Both named
    boundaries in E2's `expected` text have a real assertion, not just a mid-range pass — a stronger
    standard than some evals in the sibling contracts this round found gaps in.

- eval: E3
  run_id: map-motion-clip-E1-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T15:54:35Z
  output: |
    L: pulse starting after restAtSec accepted (loop track); two one-shot tracks of the same kind
    rejected with an `O:`-prefixed error. Both halves present.

- eval: E4
  run_id: map-motion-clip-E4-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-06T15:54:41Z
  output: |
    run_id: map-motion-clip-sweep-local
    combinations: 2652 (presets=3 × lngs=4 × zoom 0→22 step 0.1)
    accepted: 2612
    material errors (clear message, expected): 40
    violations: 0
    OK — no combination produced a self-rejected script or a motionless clip

- eval: E5
  run_id: map-motion-clip-E5-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Named boundary cases individually re-confirmed present in `motionCompiler.test.ts`:
    `it.each([1, 22])('pushIn clamps its start zoom into [0,22] at camera.zoom = %d', ...)`,
    `it.each([0, 22])('drift clamps both start and end zoom into [0,22] at camera.zoom = %d', ...)`,
    `it.each([2, 5, 6])('approach never starts above its target zoom at camera.zoom = %d', ...)`,
    plus separate explicit-rejection cases for pushIn/approach below their real operating floor
    (zoom 0/0.4, asserted to throw a named "needs a target zoom of at least 0.5" error) and
    out-of-range `durationSec`/`fps` overrides asserted to throw field-named errors. 32/32 tests pass.

- eval: E6
  run_id: map-motion-clip-E6-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-06T15:54:35Z
  output: |
    16/16 passed — `motionMath.test.ts`, unchanged since prior round.

- eval: E7
  run_id: map-motion-clip-E7-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-06T16:00:16Z
  output: |
    Test Files 3 passed (3); Tests 7 passed (7); Duration 42.80s — real vite build + real headless
    Chromium. `renderClip.test.ts` (part of this suite) is the determinism/frame-count check.

- eval: E8
  run_id: map-motion-clip-E8-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    `npx vitest run mcp-server/src/http.test.ts`: 49/49 passed. `http.ts` not in this round's diff.

- eval: E9
  run_id: map-motion-clip-E8-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Same run as E8 — 422 rejection path with the raw invariant-prefix message preserved, unaffected.

- eval: E10
  run_id: map-motion-clip-E8-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Same run — `chrome:'poster'` forced to `'clean'` on the config actually handed to
    `deps.renderClip`, asserted on the mock's received config, not the request.

- eval: E11
  run_id: map-motion-clip-E11-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T15:54:35Z
  output: |
    `npx vitest run mcp-server/src/tools.test.ts`: 43/43 passed. Same chrome-forcing invariant on the
    MCP `render_clip` surface.

- eval: E12
  run_id: map-motion-clip-E12-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-06T15:54:35Z
  output: |
    `npx vitest run src/lib/export.test.ts src/lib/mapStyle.test.ts`: 18/18 passed — this contract's
    T3 surface (`src/lib/export.ts`), confirmed BYTE-IDENTICAL to the prior verified commit
    (`git diff <prior>..HEAD -- src/lib/export.ts src/lib/mapStyle.ts` empty), so this is a pure
    regression re-confirmation, not new risk.

- eval: E13
  run_id: map-motion-clip-E8-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Encoder-throws-after-writing degrade path: 200 {ok:true}, no `clip` key, `settle` + `clipError`
    present, temp mp4 confirmed removed from disk after.

- eval: E14
  run_id: map-motion-clip-E11-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Same degrade path on the MCP surface; a real frame-capture throw (vs. an encode throw) still
    returns an error result — degrade does not widen to cover that case.

- eval: E15
  run_id: map-motion-clip-E8-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T15:54:35Z
  output: |
    Concurrency-cap 429 path (pool.acquire deadline) — same run, unaffected by this round's diff.

- eval: E16
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Xem trực tiếp khung trích từ E16-clip.mp4 (6s, 18fps, 1080×1920). (1) t=0.0s toàn cảnh thành phố, chưa tô ranh giới. (2) Vẽ dần chứ không bật đột ngột: t=2.2s chưa có gì, t=2.5s chỉ phần phía tây được tô, t=2.7s gần phủ hết, t=3.0s đầy đủ — diff pixel giữa 2.5s và 2.7s cho mean 6.94 / max 92, thay đổi thị giác rõ trong khoảng ngắn. (3) Đuôi đứng yên: khung 3.5s so khung cuối 5.9s cho mean 0.125 / max 14, chỉ là nhiễu nén. Ba nhịp đọc ra rành mạch.
  human_override:

- eval: E17
  judged_by: judge-subagent (fresh context, blind, vòng 2 sau khi vá)
  verdict: PASS
  rationale: |
    Commit b4150be thêm test thứ hai ghim ATTRIBUTION_TEXT bằng literal độc lập cộng bốn toContain riêng từng credit — không còn tự tham chiếu, và literal khớp đúng chuỗi spec §2.3 quy định. Kết hợp test thứ nhất (textCalls phải bằng đúng [ATTRIBUTION_TEXT]), hai test khoá cả hai nửa: SỐ LƯỢNG (không lệnh fillText/strokeText nào khác lọt) và NỘI DUNG (chuỗi vẽ ra phải đúng literal giấy phép OSM). Mỗi test có đường fail thật — đổi số lệnh vẽ thì test 1 đỏ, đổi nội dung hằng thì test 2 đỏ — nên không tautological.
  human_override:

## Analyst

Baseline values (`green` — meaning these evals were red-on-diffBase / feature-specific when this
contract was first verified, carried forward as `green` here only in the trivial sense that this
round's shared-file diff did not change them) are carried forward unchanged from the prior round per
the re-verification instruction; not recomputed this round.

## Variance

none — every eval this round is a deterministic single run.

## Iterations

- Prior round: signed off `manh` 2026-08-04, `human_override` CHẤP NHẬN on both E16 (PASS) and E17
  (UNCERTAIN → CHẤP NHẬN có điều kiện) — see prior report history for the full rationale (attribution-
  text exception scoped to a byte constant assert, flagged for tightening in a later contract).
- This round (verified 2026-08-06T16:06Z, commit `25c2d2a`): re-verify triggered by `feat/routes-
  measurements` — confirmed via diff that ZERO of this contract's own source/test files changed (only
  sibling files this contract does not depend on). All 15 machine evals re-run fresh and re-confirmed,
  with each `expected` clause checked against a real assertion, not just green exit codes. E16/E17 left
  UNFILLED per this round's instructions — a prior signature does not carry to a new verification
  round. Verdict PENDING-JUDGMENT.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
