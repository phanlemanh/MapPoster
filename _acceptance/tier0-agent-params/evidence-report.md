---
schema_version: 2
feature_slug: tier0-agent-params
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f7feedad14dca1d75ebe3aedd75c059a83ce0f27
human_signoff:
---

# Evidence Report: tier0-agent-params

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
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > passes layers, detail and font
      through to the render config 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E2
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > merges labels:true into
      layers.roadLabels but refuses both at once 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E3
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects out-of-range detail and
      unknown font 0ms
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects an unknown layer key and
      a non-boolean layer value (Zod-bypass guard) 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E4
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > carries per-region color through
      and validates it 0ms
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects a bad colour on a LATER
      region before any resolveBoundary call fires 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E5
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > carries per-point icon/color/size
      and geocodes the query form 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E6
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects out-of-range point size
      and bad point color 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E7
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects an unknown per-point icon
      instead of silently falling back to the default marker 0ms
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects an unknown top-level
      pointIcon instead of silently falling back to the default marker 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E8
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects a bad size/colour on a
      LATER point before any resolveLocation call for a point fires 0ms
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > rejects a bad icon on a LATER
      point before any resolveLocation call for a point fires 1ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E9
  run_id: tier0-agent-params-E9-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/tools.test.ts > discovery tools > list_themes returns all 13 themes 0ms
    ✓ mcp-server/src/tools.test.ts > discovery tools > list_themes exposes the full palette so
      agents can match overlay colors 1ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E10
  run_id: tier0-agent-params-E9-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/tools.test.ts > discovery tools > list_formats dedupes 4k and carries
      aspect/category/print 1ms
    ✓ mcp-server/src/tools.test.ts > discovery tools > gives every FORMATS entry its own
      correct category, not a blanket Video (Finding 4) 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E11
  run_id: tier0-agent-params-E9-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/tools.test.ts > render_clip > echoes the compiled MotionScript so agents
      can inspect and tweak it 1ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E12
  run_id: tier0-agent-params-E12-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/http.test.ts > POST /render-clip > 200: đủ khối clip/settle/motion/
      resolved; chrome bị ép clean 4ms
     Test Files  1 passed (1)
          Tests  49 passed (49)

- eval: E13
  run_id: tier0-agent-params-E13-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/jobRunner.test.ts > createJobRunner — clip và giao ước xuống-cấp (AC-7) >
      motion echo lại MotionScript đã biên dịch — cùng hình dạng hai đường đồng bộ
      (tools.ts/http.ts) trả 1ms
     Test Files  1 passed (1)
          Tests  22 passed (22)

- eval: E14
  run_id: tier0-agent-params-E1-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > bounds camera pitch to 0..60
      (MapLibre maxPitch — 85 used to be accept-then-discard) 0ms
    ✓ mcp-server/src/resolveConfig.test.ts > resolveConfig > normalizes bearing to [0,360)
      instead of rejecting out-of-range values (F3) 0ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E15
  run_id: tier0-agent-params-E15-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/motionCompiler.test.ts > compileMotion > seeds cfg.camera.bearing into
      every compiled keyframe (production bug: bearing silently dropped) 0ms
     Test Files  1 passed (1)
          Tests  32 passed (32)

- eval: E16
  run_id: tier0-agent-params-E9-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/tools.test.ts > render_animation > honours delivery for the preview
      still (url → no inline base64) 1ms
    ✓ mcp-server/src/tools.test.ts > render_animation > refuses an animation over
      MAPPOSTER_CLIP_MAX_BYTES and removes the file 0ms
    ✓ mcp-server/src/tools.test.ts > render_animation > rolls back an already-written gif
      when format "both" busts the cap on the mp4 output 1ms
     Test Files  1 passed (1)
          Tests  39 passed (39)

- eval: E17
  run_id: tier0-agent-params-E17-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geocode
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ✓ mcp-server/src/geocode.test.ts > resolveBoundary > echoes the identity of the entity
      the polygon actually came from — not the hit — when the exact lookup falls through
      (R1-IMPORTANT) 1ms
    ✓ mcp-server/src/geocode.test.ts > resolveBoundary > serves a cache hit from the same
      object with the full ResolvedBoundary shape, and never re-hits the network 0ms
     Test Files  1 passed (1)
          Tests  26 passed (26)

- eval: E18
  run_id: tier0-agent-params-E18-20260806
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tier0_invariants
  verified_at: 2026-08-06T14:01:29Z
  output: |
    ok   I1  t3_path untouched vs de85baf4 (23 files changed, none in t3_paths)
    ok   I2  MCP render_clip (mcp-server/src/tools.ts) echoes motion.script on its
      motionOut binding
    ok   I2  REST POST /render-clip (mcp-server/src/http.ts) echoes motion.script on its
      motionOut binding
    ok   I2  async POST /jobs (mcp-server/src/jobRunner.ts) echoes motion.script on its
      motionOut binding
    ok   I3  layers guarded by assertLayers (defined: true, called: true)
    ok   I3  camera.bearing normalized (not rejected) — modulo-360 present: true
    tier0-invariants: all invariants hold

- eval: E19
  run_id: tier0-agent-params-E19-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T14:01:29Z
  output: |
     Test Files  29 passed | 3 skipped (32)
          Tests  424 passed | 7 skipped (431)
     Duration  2.93s

- eval: E20
  run_id: tier0-agent-params-E20-20260806
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-06T14:01:29Z
  output: |
    MCP_INTEGRATION=1 vitest run --fileParallelism=false mcp-server/src/renderFrame.test.ts
      mcp-server/src/renderClip.test.ts mcp-server/src/stdioChannel.test.ts
     Test Files  3 passed (3)
          Tests  7 passed (7)
     Duration  49.49s

## Analyst

none — every feature eval is red on baseline (discriminates). E19 and E20 are the
whole-repo regression-floor guards (full Vitest suite / gated MCP integration suite);
per the skill's baseline guidance these are expected to be green-on-both and are not
feature-discriminating by design, so they are excluded from this list rather than
flagged as a finding.

## Variance

none — no eval in evals.yaml declares `runs`; every eval here is deterministic.

## Iterations

Round 1: all 20 evals PASS on first run. No evals failed; nothing returned to
implementation.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
