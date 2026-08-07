---
schema_version: 2
feature_slug: motion-tools-cost
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: manh 2026-08-07
---

# Evidence Report: motion-tools-cost

_Round 6 — re-verification triggered by `affbe6c5` (`fix: slugify chuyển tự Đ/đ thay vì đánh rơi cả chữ`, landed on top of Round 5's `verified_commit` `ce0b13e6`). `git diff ce0b13e6..affbe6c5 --stat` touches `src/lib/format.ts` (+6), `src/lib/format.test.ts` (+20), `mcp-server/src/jobRunner.test.ts` (+3) — three files, 29 insertions, zero deletions. `slugify()` no longer silently drops the precomposed letters Đ/đ (U+0110/U+0111) and their look-alikes Ð/ð (U+00D0/U+00F0); it now transliterates them to `d` via two `.replace()` calls added before the NFKD normalize (previously `'Đà Nẵng'` → `'a-nang'`, now → `'da-nang'`). `slugify()` feeds three artifact-filename builders — `src/lib/export.ts:246`, `mcp-server/src/tools.ts:59`, `mcp-server/src/jobRunner.ts:76` — so generated filenames for place names containing Đ/đ change; this is the intended fix, not an accidental regression, but it is a real behaviour change downstream of a shared file, which is why all five contracts sharing `format.ts` went stale and this contract re-verifies fully rather than re-pinning. `mcp-server/src/tools.ts:59` (one of the three filename builders) sits inside this contract's own `clip_tools` executor (`mcp-server/src/tools.test.ts`, backing E1-E5/E10/E14/E15), so that suite was re-run for real, not carried forward. Checked this contract's own criteria (AC-1..AC-16) and `evals.yaml` for any assertion on artifact filenames or on `slugify`/`fileNameFor` directly: none — `motion-tools-cost`'s scope is `compile_motion` / `camera.focus` / `list_fonts` / encoder `quality` / `cost` metadata, and no AC or eval `expected` string mentions filenames. The new filename assertion (`expect(path.basename(written)).toContain('dak-lak')`) lives in `mcp-server/src/jobRunner.test.ts`, which this contract's E17 already exercises as a broad regression guard for AC-11 ("đường async /jobs còn nguyên hành vi") — E17's `expected` does not itself assert on filenames, it only requires the async path stay green, which it does. Ran EVERY eval fresh (no selective re-pin): all 20 green, matching Round 5's pass counts with `npm test` now 501 passed | 7 skipped (508) (previously 498 passed | 7 skipped (505) — the +3 delta is exactly the three new `it()` blocks in `format.test.ts` plus the tightened assertion in `jobRunner.test.ts`, not a discrepancy). `verified_commit` updated to `affbe6c57401eafaffb7ced1a70c4f7def9d196c`; `human_signoff` cleared per instruction — only a human signs at Gate 2._

_Round 5 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E18, E19, E20); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 4 — re-verification triggered by `fix/mcp-auth` landing on top of Round 3's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

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
| E12 | AC-12 | test | PASS |
| E13 | AC-13 | test | PASS |
| E14 | AC-14 | test | PASS |
| E15 | AC-15 | test | PASS |
| E16 | AC-16 | script | PASS |
| E17 | AC-11 | test | PASS |
| E18 | AC-11 | test | PASS |
| E19 | AC-16 | test | PASS |
| E20 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — script/fps/durationSec/restAtSec/frames/preset/resolved all present.

- eval: E2
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — deps without renderClip/encodeAnimation still resolve; fakes assert .not.toHaveBeenCalled().

- eval: E3
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — raw motion.script validated, preset absent.

- eval: E4
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — approach-without-region and missing-motion both isError=true with correct cause, no empty script.

- eval: E5
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — chrome:'poster' still resolves to resolved.chrome='clean'.

- eval: E6
  run_id: motion-tools-cost-r6-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:11:11Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 64 passed (64) — focus by index frames the targeted object only, not the union.

- eval: E7
  run_id: motion-tools-cost-r6-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:11:11Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 64 passed (64) — paddingPct 150 yields smaller zoom than paddingPct 0.

- eval: E8
  run_id: motion-tools-cost-r6-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:11:11Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 64 passed (64) — focus+zoom and focus+center both rejected with /camera.focus/.

- eval: E9
  run_id: motion-tools-cost-r6-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T08:11:11Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 64 passed (64) — out-of-range index rejected with actual counts ("2 region" / "0 route").

- eval: E10
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — 6 fonts with stack/titleWeight/uppercaseTitle, every key accepted by render_map.

- eval: E11
  run_id: motion-tools-cost-r6-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T08:11:13Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 9 passed (9) — quality unspecified still yields crf 20, identical to encodeArgs(quality:'standard').

- eval: E12
  run_id: motion-tools-cost-r6-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T08:11:13Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 9 passed (9) — draft/standard/high map to crf 28/20/16 with preset veryfast/medium/slow.

- eval: E13
  run_id: motion-tools-cost-r6-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T08:11:13Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 9 passed (9) — GIF branch with quality:'high' unchanged, no -crf present.

- eval: E14
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — cost.frames reflects the fake renderer's actual returned frame count (7), renderMs/encodeMs are numbers, bytes matches clip.bytes, no bare 'time'/'size' keys.

- eval: E15
  run_id: motion-tools-cost-r6-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T08:11:06Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 52 passed (52) — encode-failure degrade branch still carries cost with numeric renderMs; bytes=0 and clip block absent.

- eval: E16
  run_id: motion-tools-cost-r6-motion_tools_invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.motion_tools_invariants
  verified_at: 2026-08-07T08:11:23Z
  output: |
    Round 6, fresh run against `affbe6c5`. I1 t3_path untouched vs merge-base (3 files changed, none of the two t3_paths); I2 compile_motion has no acquireClipSlot/deps.renderClip/deps.render(/encodeAnimation reference and does reuse prepareClipRenderWithSlot; I3 all three encode surfaces (tools.ts, http.ts, jobRunner.ts) pass quality; I4 no bare cost names, all four meaningful cost names present. "motion-tools-invariants: mọi bất biến còn giữ".

- eval: E17
  run_id: motion-tools-cost-r6-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T08:11:18Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 22 passed (22) — async /jobs path unchanged after wiring quality into its encode call. This suite is the one that gained the new filename assertion (`expect(path.basename(written)).toContain('dak-lak')`, jobRunner.test.ts:345) from the triggering commit; it is a regression-guard addition, not part of this contract's own AC/eval text, and it passes.

- eval: E18
  run_id: motion-tools-cost-r6-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T08:11:20Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 1 passed (1); Tests 54 passed (54) — REST /render-clip unchanged after hoisting encodeQuality out of the try-resolve block.

- eval: E19
  run_id: motion-tools-cost-r6-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T08:11:28Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7 skipped (508) — full Vitest suite green; the +3 tests vs Round 5's 498 are exactly the three new slugify Đ/đ cases added in `src/lib/format.test.ts` by the triggering commit, not a discrepancy.

- eval: E20
  run_id: motion-tools-cost-r6-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T08:12:27Z
  output: |
    Round 6, fresh run against `affbe6c5`. Test Files 3 passed (3); Tests 7 passed (7); Duration 47.77s — MCP integration guard (real vite build, real Chromium headless) green.

## Analyst

Baseline values are carried forward unchanged from prior rounds — this round re-ran every eval fresh but did not recompute the pre-feature diffBase (the triggering commit is a bugfix layered on an already-verified tree, not a new feature diff). Non-discriminating (green on both) per the carried-forward baseline: E17, E18, E19, E20.

Baseline `n-a` (carried forward, could not be computed): E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 6: triggered by `affbe6c5` (`fix: slugify chuyển tự Đ/đ thay vì đánh rơi cả chữ` on `src/lib/format.ts`, shared by three artifact-filename builders including `mcp-server/src/tools.ts:59` which is inside this contract's own `clip_tools` executor). ALL 20 evals re-run fresh — none re-pinned — matching Round 5's pass counts (`npm test` grew from 498→501 passed, exactly the three new format.test.ts cases the commit added). Checked whether any AC or eval `expected` string in this contract asserts artifact filenames: none does: this contract's scope is `compile_motion`/`camera.focus`/`list_fonts`/encoder `quality`/`cost`, not filenames. The one filename assertion touched by the blast radius (`jobRunner.test.ts:345`, exercised via E17) is a regression guard, not one of this contract's own criteria, and it passed. Zero failures.

Round 5 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E18, E19, E20 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 4: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
