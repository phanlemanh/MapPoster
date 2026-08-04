---
schema_version: 2
feature_slug: map-motion-clip
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 06d37e264d3f191b67c4e1960ff64390ed428657
human_signoff: manh (2026-08-04) — verdict đưa trong phiên; commit do Claude thực hiện theo chỉ thị của manh
---

# Evidence Report: map-motion-clip

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
| E16 | AC-13 | judgment | UNCERTAIN (awaits mandatory T3 human_override) |
| E17 | AC-14 | judgment | UNCERTAIN (awaits mandatory T3 human_override) |

## Evidence

- eval: E1
  run_id: map-motion-clip-E1-20260804-062201
  exit_code: 0
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-04T06:22:07Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  16 passed (16)
       Start at  13:21:52
       Duration  621ms

- eval: E2
  run_id: map-motion-clip-E2-20260804-062201
  exit_code: 0
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-04T06:22:07Z
  output: |
    Same suite run as E1/E3 (src/render/motionScript.test.ts covers all three
    criteria in one file). Test Files 1 passed (1); Tests 16 passed (16).

- eval: E3
  run_id: map-motion-clip-E3-20260804-062201
  exit_code: 0
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-04T06:22:07Z
  output: |
    Same suite run as E1/E2 (src/render/motionScript.test.ts covers all three
    criteria in one file). Test Files 1 passed (1); Tests 16 passed (16).

- eval: E4
  run_id: map-motion-clip-sweep-local
  exit_code: 0
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-04T06:22:20Z
  output: |
    run_id: map-motion-clip-sweep-local
    combinations: 2652 (presets=3 x lngs=4 x zoom 0-22 step 0.1)
    accepted: 2612
    material errors (clear message, expected): 40
    violations: 0
    OK -- no combination produced a self-rejected script or a motionless clip

- eval: E5
  run_id: map-motion-clip-E5-20260804-062228
  exit_code: 0
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-04T06:22:36Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  25 passed (25)
       Duration  442ms

- eval: E6
  run_id: map-motion-clip-E6-20260804-062232
  exit_code: 0
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-04T06:22:36Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  16 passed (16)
       Duration  384ms

- eval: E7
  run_id: map-motion-clip-E7-20260804-062246
  exit_code: 0
  verifier: config:executors.test.mcp
  verified_at: 2026-08-04T06:23:38Z
  output: |
    MCP_INTEGRATION=1 vitest run --fileParallelism=false
    mcp-server/src/renderFrame.test.ts mcp-server/src/renderClip.test.ts
    mcp-server/src/stdioChannel.test.ts
     Test Files  3 passed (3)
          Tests  7 passed (7)
       Duration  46.74s

- eval: E8
  run_id: map-motion-clip-E8-20260804-062344
  exit_code: 0
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-04T06:24:05Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  33 passed (33)
       Duration  998ms

- eval: E9
  run_id: map-motion-clip-E9-20260804-062344
  exit_code: 0
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-04T06:24:05Z
  output: |
    Same suite run as E8/E10/E13/E15 (mcp-server/src/http.test.ts covers all
    five criteria in one file). Test Files 1 passed (1); Tests 33 passed (33).

- eval: E10
  run_id: map-motion-clip-E10-20260804-062344
  exit_code: 0
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-04T06:24:05Z
  output: |
    Same suite run as E8/E9/E13/E15 (mcp-server/src/http.test.ts). Test Files
    1 passed (1); Tests 33 passed (33).

- eval: E11
  run_id: map-motion-clip-E11-20260804-062349
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-04T06:24:05Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  32 passed (32)
       Duration  552ms

- eval: E12
  run_id: map-motion-clip-E12-20260804-062357
  exit_code: 0
  verifier: config:executors.test.text_free
  verified_at: 2026-08-04T06:24:05Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  2 passed (2)
          Tests  18 passed (18)
       Duration  443ms

- eval: E13
  run_id: map-motion-clip-E13-20260804-062344
  exit_code: 0
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-04T06:24:05Z
  output: |
    Same suite run as E8/E9/E10/E15 (mcp-server/src/http.test.ts). Test Files
    1 passed (1); Tests 33 passed (33).

- eval: E14
  run_id: map-motion-clip-E14-20260804-062349
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-04T06:24:05Z
  output: |
    Same suite run as E11 (mcp-server/src/tools.test.ts). Test Files 1 passed
    (1); Tests 32 passed (32).

- eval: E15
  run_id: map-motion-clip-E15-20260804-062344
  exit_code: 0
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-04T06:24:05Z
  output: |
    Same suite run as E8/E9/E10/E13 (mcp-server/src/http.test.ts). Test Files
    1 passed (1); Tests 33 passed (33).

- eval: E16
  criterion: AC-13
  executor: judgment
  question: >-
    Clip preset "approach" cho Quan 3, TP.HCM co doc ra ba nhip co nghia
    (mo rong toan canh -> ve dan ranh gioi quan -> dung yen o duoi) hay
    khong?
  inputs: [contract.md, evidence/E16-clip.mp4, evidence/E16-step1.png, evidence/E16-step2.png, evidence/E16-step3.png]
  artefact_generation: |
    Started mcp-server/src/http.ts locally (MCP_HTTP_PORT=4181,
    MAPPOSTER_HTTP_ALLOWED_HOSTS=localhost). POSTed /render-clip with
    location="Quan 3, TP.HCM", format 360x640, theme midnight-blue,
    highlight.regions=["Quan 3, TP.HCM"], one highlight point, motion
    preset=approach fps=12 durationSec=2. Response: HTTP 200,
    ok:true, motion={preset:"approach", restAtSec:1.4}, clip
    {fps:12, durationSec:2, bytes:735825}. Decoded clip.base64 to
    evidence/E16-clip.mp4 (ffprobe confirms 360x640, 12fps, Duration
    00:00:02.00). Extracted frames with ffmpeg -ss <t> -frames:v 1:
    step1 at t=0.05s, step2 at t=0.80s, step3 at t=1.80s (chosen after
    probing t=0.05/0.60/0.80/1.00/1.10/1.40/1.80 to locate the actual
    regionReveal window, which the compiler places at
    [0.6s, 1.067s] for this 2s/12fps request -- derived from
    APPROACH.reveal0=1.8 * k and reveal1=3.2 * k with k=durationSec/6).
    Server (and its tsx child processes) killed after capture; no
    stray process left running.
  observed_step1: |
    t=0.05s (evidence/E16-step1.png): wide zoomed-out view of the Ho Chi
    Minh City road network on the midnight-blue theme (dark navy
    background, amber roads). No district highlight, no pin marker,
    no attribution text visible in this crop of the frame.
  observed_step2: |
    t=0.80s (evidence/E16-step2.png): camera has moved in closer; a
    partial, wedge/triangle-shaped amber highlight has appeared over
    part of the district area, growing from one edge rather than being
    fully present -- this is the boundary reveal caught mid-animation,
    not yet covering the full district shape seen in step3.
  observed_step3: |
    t=1.80s (evidence/E16-step3.png, after restAtSec=1.4s): the full
    district polygon is now solidly highlighted in amber over the
    surrounding street grid, with a white teardrop pin marker placed
    near its center; the framing matches the "close, settled" shot of
    a resting camera.
  judged_by: verify subagent (fresh context) -- NOT a substantive judge pass
  verdict: UNCERTAIN
  rationale: >-
    T3 risk tier mandates the human signer's own direct verdict on every
    judgment item, regardless of what a fresh-context observer sees --
    this verifier deliberately does not score AC-13. The frames captured
    above are consistent with the three claimed beats (wide establishing
    shot -> progressive boundary reveal -> settled close shot with pin),
    but "does this read as intentional" is the perceptual call reserved
    for the human per contract.md and the evidence-report-template rules.
  human_override: manh (2026-08-04) — CHẤP NHẬN. Ba nhịp phân biệt được trên ba khung đã xem: toàn cảnh chưa tô → vùng tô dở hình nêm → vùng khép kín có pin.

- eval: E17
  criterion: AC-14
  executor: judgment
  question: >-
    Is the "clip has no text" invariant's one exception (baked OSM
    attribution) explicit, license-justified, and locked down against
    further text leaking into pixels -- or is it a loophole?
  inputs: [contract.md, docs/superpowers/specs/2026-08-03-map-motion-clip-design.md, src/lib/export.test.ts]
  supporting_check: |
    src/lib/export.test.ts:37-38 contains a describe/it block named
    "composeOverlays -- baked attribution is the ONE permitted
    pixel-text exception (spec §2.3)" / "draws ONLY the attribution
    string when chrome is clean (text.show=false, as clips force)".
    docs/superpowers/specs/2026-08-03-map-motion-clip-design.md exists
    and is referenced by name from contract.md. This test is part of
    the E12 (config:executors.test.text_free) suite that passed above
    (18/18), so the lock-down behavior it asserts is machine-verified;
    whether the exception's framing/justification is adequate is the
    human judgment call.
  judged_by: verify subagent (fresh context) -- NOT a substantive judge pass
  verdict: UNCERTAIN
  rationale: >-
    T3 risk tier mandates the human signer's own direct verdict on every
    judgment item. Whether the attribution carve-out in src/lib/export.ts
    (a t3_paths file) is adequately justified and locked down is a
    legitimacy question, not a machine-checkable fact -- the verifier
    deliberately does not score AC-14.
  human_override: manh (2026-08-04) — CHẤP NHẬN. Ngoại lệ attribution là tường minh: ghi ở spec §2.3, có lý do giấy phép OSM, và bị khoá bằng export.test.ts.

## Analyst

none -- every feature eval (E1-E15) exercises new map-motion-clip code
paths (motion schema, compiler, math, clip HTTP/MCP surfaces, text-free
guard); no diffBase baseline was run in this round so discrimination is
not separately measured, but none of these suites pre-date this feature.

## Variance

none -- every eval in this round is deterministic (runs: 1); no
providers.invoke / LLM-generator crossing evals in this eval set.

## Iterations

Round 1: all 15 machine evals (E1-E15) passed on first run, exit 0.
E16/E17 are T3 judgment items awaiting the human signer's direct
verdict per contract -- verdict is PENDING-JUDGMENT, not PASS.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
