---
schema_version: 2
feature_slug: map-motion-clip
verdict: PENDING-JUDGMENT
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9b573fcba6d3d7bd6627736faa390eea27722dcf
human_signoff:
---

# Evidence Report: map-motion-clip

_Round 3 — re-verification. Round 2's evidence (verified_commit `0201cc3`, signed off `manh`
2026-08-06) went stale: `feat/tier0-agent-params` landed downstream commits touching
`mcp-server/src/resolveConfig.ts`, `tools.ts`, `geocode.ts`, `motionCompiler.ts`, `http.ts`,
`jobRunner.ts`, and `src/render/renderConfig.ts` after that commit. Contract `status` downgraded
`signed-off` → `implemented` per the staleness guard before this report was written.
`human_signoff` is cleared — the round-2 signature does not carry to this round._

_T3 — this round's diff to `motionCompiler.ts` adds a `seedBearing()` step (compiled clip
keyframes now honour `camera.bearing` when set; byte-identical output when bearing is unset/0,
which is the case for every fixture E4/E5/E16 exercise) and `jobRunner.ts`/`http.ts` now echo the
full compiled `script` in the job/REST clip response (additive field, not a behaviour change to
`export.ts`'s text-free invariant, the file this contract's T3 designation is anchored to —
`export.ts` itself is untouched by this round's diff)._

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
  run_id: minted-map-motion-clip-E1-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T14:08:07Z
  output: |
    Test Files  1 passed (1)
    Tests  16 passed (16)
    Start at  21:08:07
    Duration  394ms (transform 18ms, setup 0ms, import 39ms, tests 6ms, environment 253ms)

- eval: E2
  run_id: minted-map-motion-clip-E2-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T14:08:07Z
  output: |
    Same run as E1 (src/render/motionScript.test.ts covers all three invariant criteria in one
    file). Tests 16 passed (16); Duration 394ms.

- eval: E3
  run_id: minted-map-motion-clip-E3-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T14:08:07Z
  output: |
    Same run as E1/E2 (src/render/motionScript.test.ts). Tests 16 passed (16); Duration 394ms.

- eval: E4
  run_id: map-motion-clip-sweep-local
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-06T14:08:20Z
  output: |
    combinations: 2652 (presets=3 × lngs=4 × zoom 0→22 step 0.1)
    accepted: 2612
    material errors (clear message, expected): 40
    violations: 0
    OK — no combination produced a self-rejected script or a motionless clip

- eval: E5
  run_id: minted-map-motion-clip-E5-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T14:07:57Z
  output: |
    Test Files  1 passed (1)
    Tests  39 passed (39)
    Start at  21:07:57
    Duration  529ms (transform 64ms, setup 0ms, import 98ms, tests 80ms, environment 254ms)
    (39 vs 31 in round 2 — tier0-agent-params added seedBearing coverage; no shrinkage.)

- eval: E6
  run_id: minted-map-motion-clip-E6-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-06T14:08:11Z
  output: |
    Test Files  1 passed (1)
    Tests  16 passed (16)
    Start at  21:08:11
    Duration  376ms (transform 17ms, setup 0ms, import 23ms, tests 4ms, environment 254ms)

- eval: E7
  run_id: minted-map-motion-clip-E7-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-06T14:09:35Z
  output: |
    Run as one serialized pipeline `npm run test:e2e && npm run test:mcp` (config comment: e2e and
    mcp both drive real Chromium, parallel runs make test:mcp flaky — respect sequential-only).
    test:mcp portion: Tests  7 passed (7)
    Start at  21:09:35
    Duration  44.27s (transform 37ms, setup 0ms, import 857ms, tests 42.36s, environment 761ms)

- eval: E8
  run_id: minted-map-motion-clip-E8-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Test Files  1 passed (1)
    Tests  49 passed (49)
    Start at  21:07:42
    Duration  994ms (transform 107ms, setup 0ms, import 569ms, tests 77ms, environment 250ms)

- eval: E9
  run_id: minted-map-motion-clip-E9-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E8 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E10
  run_id: minted-map-motion-clip-E10-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E8/E9 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E11
  run_id: minted-map-motion-clip-E11-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T14:08:02Z
  output: |
    Test Files  1 passed (1)
    Tests  39 passed (39)
    Start at  21:08:02
    Duration  431ms (transform 48ms, setup 0ms, import 80ms, tests 9ms, environment 249ms)
    (39 vs 32 in round 2 — tier0-agent-params added coverage; no shrinkage.)

- eval: E12
  run_id: minted-map-motion-clip-E12-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-06T14:11:04Z
  output: |
    Test Files  2 passed (2)
    Tests  18 passed (18)
    Start at  21:11:04
    Duration  411ms (transform 62ms, setup 0ms, import 101ms, tests 7ms, environment 508ms)
    (src/lib/export.ts untouched by this round's diff — confirmed via
    `git diff 0201cc3..9b573fc -- src/lib/export.ts`, empty.)

- eval: E13
  run_id: minted-map-motion-clip-E13-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E8/E9/E10 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E14
  run_id: minted-map-motion-clip-E14-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T14:08:02Z
  output: |
    Same run as E11 (mcp-server/src/tools.test.ts). Tests 39 passed (39); Duration 431ms.

- eval: E15
  run_id: minted-map-motion-clip-E15-r3
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T14:07:42Z
  output: |
    Same run as E8/E9/E10/E13 (mcp-server/src/http.test.ts). Tests 49 passed (49); Duration 994ms.

- eval: E16
  criterion: AC-13
  executor: judgment
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Giám khảo giải mã trực tiếp E16-clip.mp4 và soi frame tại t=0/1/2 · 2.5/3.0/3.5 · 4.0/4.3/5.9 giây. (1) t=0–2s toàn cảnh rộng, camera zoom dần, chưa có ranh giới. (2) t=2.5s ranh giới CHỈ hiện phần trên, mép dưới còn gradient; t=3.0s lan rộng; t=3.5s đầy đủ — vẽ dần, không bung đột ngột. (3) t=4.0–5.9s khung gần như giống hệt nhau: camera và vùng tô đứng yên. Ba nhịp đọc ra rành mạch.
  human_override:

- eval: E17
  criterion: AC-14
  executor: judgment
  judged_by: judge-subagent (fresh context, blind)
  verdict: UNCERTAIN
  rationale: |
    Ngoại lệ được ghi tường minh (spec §2.3) và có lý do chính đáng (nghĩa vụ giấy phép OSM). export.test.ts khoá chặt về SỐ LƯỢNG: proxy bắt mọi fillText/strokeText kể cả lệnh chưa viết, assert đúng một phần tử, và chủ động bật showCity/showCountry/showCoords để chứng minh guard text.show không rò. Nhưng khoá KHÔNG ràng buộc NỘI DUNG: assertion so với hằng ATTRIBUTION_TEXT được import, không phải chuỗi licence literal — đổi nội dung hằng đó thì test vẫn xanh.
  human_override:

## Lệnh không gắn eval

- cmd: `npm test`
  exit_code: 0
  role: regression-guard toàn repo
  output: |
    Test Files  29 passed | 3 skipped (32)
    Tests  424 passed | 7 skipped (431)
    Start at  21:08:32
    Duration  2.91s (transform 1.70s, setup 0ms, import 6.42s, tests 4.31s, environment 12.81s)

- cmd: `npm run test:e2e && npm run test:mcp`
  exit_code: 0
  role: regression-guard e2e + tích hợp MCP (lệnh nối tiếp, chạy tuần tự, không song song với bất
    kỳ lệnh nào khác trong vòng này)
  output: |
    e2e: 14 passed (51.8s)
    test:mcp: Tests  7 passed (7)
    Duration  44.27s (transform 37ms, setup 0ms, import 857ms, tests 42.36s, environment 761ms)

## Evidence carried forward (judgment inputs)

E16 and E17's judgment inputs (`evidence/E16-clip.mp4`, `evidence/E16-step{1,2,3}.png`) are Round
2's artefacts, dated 2026-08-04, carried forward unrefreshed this round. Risk assessment: this
round's diff to `motionCompiler.ts` only changes output when `camera.bearing` is set (the
`seedBearing()` early-return keeps compiled output byte-identical when bearing is unset/0); the
`approach` preset fixture E16 was rendered from does not set `camera.bearing`, so the clip's visual
content is unaffected by this round's diff. `src/lib/export.ts` (the text-free-invariant file E17
judges) is untouched by this round's diff (`git diff 0201cc3..9b573fc -- src/lib/export.ts`,
empty). Believed low-risk but not independently re-rendered this round — flagged for Gate 2.

## Analyst

E1, E2, E3 (npx vitest run src/render/motionScript.test.ts); E4 (npx tsx
_acceptance/map-motion-clip/scripts/compiler-domain-sweep.ts); E5 (npx vitest run
mcp-server/src/motionCompiler.test.ts); E6 (npx vitest run src/render/motionMath.test.ts); E7 (npm
run test:mcp, via the combined test:e2e && test:mcp pipeline); E8, E9, E10, E13, E15 (npx vitest
run mcp-server/src/http.test.ts); E11, E14 (npx vitest run mcp-server/src/tools.test.ts); E12 (npx
vitest run src/lib/export.test.ts src/lib/mapStyle.test.ts) — same green-on-both set as Round 2;
baseline values carried forward unchanged per this round's "re-verification, not new feature"
instruction.

## Variance

none — every eval in this round is deterministic (runs: 1); no ctx.providers.invoke / LLM-generator
crossing evals in this eval set.

## Iterations

Round 1 (2026-08-04): all 15 machine evals (E1-E15) passed on first run, exit
0. Judgment items E16/E17 human_override CHẤP NHẬN by manh (2026-08-04);
verdict reached PASS, verified_commit 06d37e264d3f191b67c4e1960ff64390ed428657.

Round 2 (2026-08-06): downstream commits (async-job-queue integration,
geocode/http/motionCompiler edits) landed after round 1's verified_commit,
making that evidence stale per pre-merge-check's staleness rule — re-verify
triggered. All 15 machine evals (E1-E15) re-run against the new tree, exit 0,
unchanged pass results; additionally the full suite (npm test: 397 passed, 7
skipped) and npm run test:e2e && npm run test:mcp (14 + 7 passed) also stayed
green. Fresh 3-lens judge panel proposes PASS on both E16/E17 with detailed
frame-by-frame rationale; human_override supplied by manh 2026-08-06; verdict PASS.

Round 3 (this report): re-verify triggered because `feat/tier0-agent-params` landed commits
touching `resolveConfig.ts`/`tools.ts`/`geocode.ts`/`motionCompiler.ts`/`http.ts`/`jobRunner.ts`/
`src/render/renderConfig.ts` after round 2's `verified_commit` (0201cc3) — code changed after
evidence was signed, per the staleness rule. All 15 machine evals re-run fresh against `9b573fc`
(mapping to 8 distinct commands: motionScript.test.ts 16 passed, compiler-domain-sweep 0
violations, motionCompiler.test.ts 39 passed up from 31, motionMath.test.ts 16 passed, the
combined test:e2e+test:mcp pipeline 14+7 passed, http.test.ts 49 passed, tools.test.ts 39 passed
up from 32, export.test.ts+mapStyle.test.ts 18 passed), exit 0 unchanged from round 2's pass
results; count increases are all additive tier0-agent-params coverage, no shrinkage. Two
regression-guard commands stayed green (`npm test`: 424 passed, up from 397). E16/E17 (AC-13/AC-14,
judgment) are NOT scored by this verifier — left unfilled for the orchestrator's blind judge panel,
per this round's instructions (implementation must never judge itself); their evidence artefacts
(clip/screenshots) are Round 2's, carried forward unrefreshed since the diff does not change this
preset's compiled output (`seedBearing` only fires when `camera.bearing` is set) nor touch
`export.ts`. Verdict: PENDING-JUDGMENT (T3 — every judgment item mandates a direct human
`human_override` regardless of judge verdict; with both unscored, PASS is not reachable this round).

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract

Artefact refresh (controller, sau vòng verify): E16-clip.mp4 và E16-step1/2/3.png đã được
SINH LẠI từ cây hiện tại bằng `_acceptance/tier0-agent-params/scripts/regen-judge-artifacts.ts`
(tiến trình node mới, nạp source hiện thời). Lý do: server MCP trong `.mcp.json` là tiến trình
sống lâu — tsx nạp TypeScript một lần lúc khởi động, nên một phiên dài sẽ render bằng code
TRƯỚC nhánh mà không có dấu hiệu nào. Giám khảo mù chấm trên artefact mới này, không phải bản
mang sang từ vòng trước.
