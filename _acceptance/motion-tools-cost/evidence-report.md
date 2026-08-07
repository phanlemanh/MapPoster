---
schema_version: 2
feature_slug: motion-tools-cost
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 27e1be1a1431055f4b19bbf7734c07eacd5a791c
human_signoff:
---

# Evidence Report: motion-tools-cost

_Round 3 — re-verification. `feat/road-routing` landed on top of `f74ede1` (this contract's Round 2
`verified_commit`), touching `mcp-server/src/resolveConfig.ts` and `mcp-server/src/tools.ts` — both
shared files this contract's own evals exercise via `config.test.resolve_config` and
`config.test.clip_tools`. Per the standing repo note that touching these shared mcp-server files
invalidates prior contracts' evidence, `status` is downgraded `signed-off` → `implemented` and
`human_signoff` cleared._

_Diff review: `resolveConfig.ts` — `resolveRoutes` becomes `async` and gains a new `route` branch that
only fires when a caller passes `routes[].route`; `resolveConfig` now `await`s it (previously
synchronous). Neither `camera.focus`, `list_fonts`, `compile_motion`, nor `cost` — this contract's own
surface — touch `resolveRoutes` at all. `tools.ts` — the `routeSchema` Zod object gains an additive
`route` field and its `.refine()` message changes from "exactly one of routes[].geojson or
routes[].coords" to "...or routes[].route"; this is the ONLY change to `tools.ts` in this diff, and it
does not touch `compile_motion`, `list_fonts`, `render_clip`'s cost block, or the encoder-quality
plumbing this contract's E1-E5/E10/E11-E15 depend on. Every one of this contract's own eval commands
was re-run fresh this round (not merely re-pinned) given the shared-file touch — see Evidence below.
`npx vitest run mcp-server/src/tools.test.ts`: 52/52 passed, unchanged count from Round 2. `npx vitest
run mcp-server/src/resolveConfig.test.ts`: 64/64 passed (up from 59 — `feat/road-routing`'s own five new
`routes[].route` tests; every pre-existing `camera.focus` test this contract's E6-E9 depend on is
present and green, unmoved). `npx vitest run mcp-server/src/http.test.ts`: 49/49, unchanged.
`npx vitest run mcp-server/src/encodeAnimation.test.ts mcp-server/src/jobStore.test.ts
mcp-server/src/jobRunner.test.ts`: 9/16/22 = 47 passed, unchanged. `motion-tools-invariants.ts`: all
I1-I4 clauses `ok`, merge-base line now reads `vs f74ede1f`. `npm test`: 493 passed | 7 skipped (up from
475 — road-routing's own 18 new tests; nothing of this contract's own regressed). `npm run test:mcp`:
7/7 passed, unchanged._

_Round 2 — re-pin after a rebase onto merged `main`, not a re-audit. PR #2 (`feat/routes-measurements`)
merged to `main`; the branch was rebased onto the new `main` tip (`ecd4a37`), which rewrote every
commit SHA including Round 1's `verified_commit` (`6644d1b`) — that object is no longer an ancestor of
this branch (though it still exists locally, which is why a local staleness check would misleadingly
pass; on a fresh CI clone it would not resolve at all). `git diff 6644d1b HEAD` confirms **zero**
non-gate files changed — only `_acceptance/**` (Round 1's own evidence-report/contract/run-log writes)
differ; every source and test file this contract depends on is byte-identical to what Round 1 verified.
Re-ran fresh: `npm test` (475/482, unchanged), `npm run test:mcp` (7/7, unchanged), and
`motion-tools-invariants.ts` (all I1-I4 clauses still `ok`; I1's own merge-base line now legitimately
reads `vs ecd4a377` instead of the stale `999c13c8`, since the script computes `git merge-base
origin/main HEAD` itself — this is exactly the kind of eval where a bare re-pin would have left a
false git reference in the evidence text). E1-E15/E17/E18 are re-pinned unchanged below: their
underlying commands (`tools.test.ts`, `resolveConfig.test.ts`, `encodeAnimation.test.ts`,
`jobRunner.test.ts`, `http.test.ts`) don't read git state and their target files are confirmed
byte-identical, so their Round 1 evidence blocks stand without re-execution._

Round 1 — first verify. `surfaces: [api]`, no judgment and no ui-check evals (per contract Notes:
"Không có eval design-quality"), so per the routing rule a clean sweep of all 20 machine evals is
PASS. Every eval's `expected` clause was checked against an actual passing assertion in the test
file (not just "the suite is green") — see Evidence below for the exact `it(...)` block behind each
claim. This contract is stacked on `feat/routes-measurements` (PR #2, not yet merged); merge-base is
`origin/main` at `999c13c8`, and `verified_commit` is this branch's own HEAD.

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
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    `npx vitest run mcp-server/src/tools.test.ts`: 52/52 passed. `compile_motion (PR #3) > returns the
    compiled script without spending a single render` (tools.test.ts:403-419): response carries
    `script.camera` (length > 1), `fps === script.fps`, `durationSec === script.durationSec`,
    `frames === Math.round(durationSec * fps)`, `preset === 'pushIn'`, and `resolved.center` defined —
    all six fields E1's `expected` names, verbatim.

- eval: E2
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    Same test as E1 (tools.test.ts:403-419): `dryTools()` builds the tool set from `makeTools({ render,
    sinkDir, defaultDelivery: 'url' })` — no `renderClip`/`encodeAnimation` in `deps` at all — and the
    final assertion is `expect(render).not.toHaveBeenCalled()`. The call completes without throwing
    despite the missing deps, matching E2's SHOULD-NOT-RENDER claim exactly: no render happened AND the
    tool ran to completion without needing the render/clip deps present.

- eval: E3
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    `compile_motion (PR #3) > accepts a raw script, not just a preset` (tools.test.ts:421-432): a raw
    `motion.script` object (not a preset) resolves to `script.fps === 12`, `frames === 48`
    (12 fps × 4s), and `j.preset` is `undefined` — the exact three clauses E3 names: script validated,
    frames computed correctly, preset absent (not fabricated for a hand-written script).

- eval: E4
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    Two separate tests cover E4's two named cases. `reports a preset that cannot compile as an error,
    not an empty script` (tools.test.ts:434-441): `motion: { preset: 'approach' }` with no
    `highlight.regions` → `res.isError === true`, error matches `/approach needs highlight\.regions/`.
    `refuses a missing motion param with the same message render_clip uses` (tools.test.ts:453-457): no
    `motion` key at all → `res.isError === true`, error matches `/motion is required/`. Both are
    `isError: true` results, not an empty/zero-camera script — matches E4's SHOULD-NOT-RETURN-EMPTY
    claim for both named causes.

- eval: E5
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    `forces chrome clean so the preview cannot disagree with what render_clip renders`
    (tools.test.ts:443-451): call with `chrome: 'poster'` → `resolved.chrome === 'clean'`. Matches E5
    exactly.

- eval: E6
  run_id: motion-tools-cost-r3-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    `npx vitest run mcp-server/src/resolveConfig.test.ts`: 64/64 passed (up from 59 — five new
    `routes[].route` tests added earlier in the file by `feat/road-routing`; this contract's own
    `camera.focus` block is unmoved in content, only shifted down in line number by that insertion).
    Three separate tests in the `camera.focus` describe block (resolveConfig.test.ts:580-600, current
    lines), one per `kind`: `frames the region at
    the given index, not the union of every region` — index 1 of two regions centers on the SECOND
    region's own bbox (106.2, 22.2), not a union of both; `frames the point at the given index` — index 1
    of two points centers exactly on that point ([106.0, 22.0]); `frames the route at the given index` —
    index 1 of two routes centers on the second route's own bbox (108.2, 15.2). All three `kind`s proven
    against a two-object fixture where a union-based bug would produce a visibly different center.

- eval: E7
  run_id: motion-tools-cost-r3-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    `zooms OUT as paddingPct grows — the knob does something measurable` (resolveConfig.test.ts:601-606,
    current lines):
    `paddingPct: 150` yields a STRICTLY SMALLER `camera.zoom` than `paddingPct: 0` on the same region
    (`loose.camera.zoom` `.toBeLessThan(tight.camera.zoom)`) — a real, directional, measurable effect, not
    a no-op that happens to stay green.

- eval: E8
  run_id: motion-tools-cost-r3-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    `refuses focus together with an explicit center or zoom rather than picking a winner`
    (resolveConfig.test.ts:607-613, current lines): `camera.focus` + `camera.zoom` → rejects
    `/camera\.focus/`; separately
    `camera.focus` + `camera.center` → rejects `/camera\.focus/`. Both named conflicting-parameter cases
    are explicitly rejected, matching E8's SHOULD-NOT-PICK-A-WINNER claim for both combinations.

- eval: E9
  run_id: motion-tools-cost-r3-resolveconfig-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T01:26:51Z
  output: |
    `refuses an index with nothing at it, naming how many exist` (resolveConfig.test.ts:614-621,
    current lines):
    `focus.index: 9` against 2 regions rejects `/index out of range \(2 region/`; `focus.index: 0` for
    `kind: 'route'` with zero routes configured rejects `/index out of range \(0 route/`. Both named
    counts (2 region, 0 route) appear verbatim in the rejection message.

- eval: E10
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    `list_fonts (PR #3) > exposes every font render_map accepts, with its typographic metadata`
    (tools.test.ts:278-285): 6 fonts returned, each with `stack` (string), `titleWeight` (number),
    `uppercaseTitle` (boolean). `> lists ONLY names render_map actually accepts — a listed-but-rejected
    font is a trap` (tools.test.ts:287-293): loops over every listed font key, calls `render_map` with
    `font: f.key`, and asserts `res.isError` is falsy for EVERY one — the exact "no key isError" loop E10
    names, not a spot-check.

- eval: E11
  run_id: motion-tools-cost-r3-encode-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T01:27:15Z
  output: |
    `npx vitest run mcp-server/src/encodeAnimation.test.ts`: 9/9 passed. `encodeArgs quality (PR #3) >
    defaults to exactly the crf the encoder used before this knob existed`: `crfOf({})` (quality
    unspecified) is `'20'`, AND `encodeArgs(..., { quality: 'standard' })` is `.toEqual` the args produced
    with no `quality` key at all — a real structural equality check, not just "both contain 20". Both
    halves of E11's SHOULD-NOT-CHANGE claim proven.

- eval: E12
  run_id: motion-tools-cost-r3-encode-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T01:27:15Z
  output: |
    `maps each quality to a distinct crf and encoder preset`: `draft`→crf `'28'`, `standard`→crf `'20'`,
    `high`→crf `'16'`; `draft` args contain `'veryfast'`, `high` args contain `'slow'` — all three named
    crf values and both named presets appear on their claimed branch.

- eval: E13
  run_id: motion-tools-cost-r3-encode-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T01:27:15Z
  output: |
    `leaves GIF args untouched — crf has no meaning on that branch`: GIF args with `quality: 'high'`
    `.toEqual` GIF args with no `quality` key (structural equality, not substring match); a separate
    assertion confirms GIF args with `quality: 'draft'` do `.not.toContain('-crf')`. Both halves of E13's
    SHOULD-NOT-APPLY claim proven.

- eval: E14
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    `cost metadata (PR #3) > reports what the call actually cost, in names that carry their unit`
    (tools.test.ts:662-677): uses a DEDICATED fake `costRenderClip` that returns exactly `FRAMES = 7`
    frames (independent of the script's own frame count), and asserts `j.cost.frames === FRAMES` — proving
    `cost.frames` reflects what the renderer actually returned, not what the script declared. Also asserts
    `renderMs`/`encodeMs` are `number`, `renderMs >= 0`, `bytes === clip.bytes`, and `cost` has neither a
    `time` nor a `size` key — every clause in E14's `expected` text has its own assertion.

- eval: E15
  run_id: motion-tools-cost-r3-tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T01:27:06Z
  output: |
    `cost metadata (PR #3) > still reports cost on the encode-failure degrade path, where it matters most`
    (tools.test.ts:679-693): encoder throws → `j.clipError` defined, `typeof j.cost.renderMs === 'number'`
    (render already happened, already cost something), `j.cost.bytes === 0` (encode did not), AND
    `j.clip` is `undefined` — the SHOULD-NOT-EMIT half of E15: cost's presence does not imply a
    successfully-declared `clip` block when no file exists.

- eval: E16
  run_id: motion-tools-cost-r3-invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.motion_tools_invariants
  verified_at: 2026-08-07T01:27:45Z
  output: |
    ROUND 2 — re-run fresh (this script computes `git merge-base origin/main HEAD` itself, so its own
    output text is git-state-dependent and a bare re-pin would have left a stale hash):
    ok   I1  t3_path untouched vs ecd4a377 (31 file đổi)
    ok   I2  tìm thấy thân compile_motion: true
    ok   I2  compile_motion KHÔNG dùng acquireClipSlot: true
    ok   I2  compile_motion KHÔNG dùng deps.renderClip: true
    ok   I2  compile_motion KHÔNG dùng deps.render(: true
    ok   I2  compile_motion KHÔNG dùng encodeAnimation: true
    ok   I2  compile_motion tái dùng prepareClipRenderWithSlot (không chép nhánh resolve): true
    ok   I3  MCP render_clip + render_animation (mcp-server/src/tools.ts): 2 lời gọi encode, tất cả mang quality = true
    ok   I3  REST POST /render-clip (mcp-server/src/http.ts): 1 lời gọi encode, tất cả mang quality = true
    ok   I3  async POST /jobs (mcp-server/src/jobRunner.ts): 1 lời gọi encode, tất cả mang quality = true
    ok   I4  mcp-server/src/tools.ts: không có tên chi phí trần
    ok   I4  mcp-server/src/encodeAnimation.ts: không có tên chi phí trần
    ok   I4  bốn tên chi phí đủ nghĩa đều có mặt: true
    motion-tools-invariants: mọi bất biến còn giữ
    All four clauses of E16's `expected` (I1 t3_path unchanged; I2 compile_motion avoids
    acquireClipSlot/deps.renderClip/deps.render(/encodeAnimation AND reuses
    prepareClipRenderWithSlot; I3 all three encode surfaces pass quality; I4 no bare cost names) have
    their own `ok` line above.

- eval: E17
  run_id: motion-tools-cost-r3-encode-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T01:27:15Z
  output: |
    `npx vitest run mcp-server/src/jobRunner.test.ts`: 22/22 passed — unchanged count from the
    pre-motion-tools-cost tree. `git diff` confirms `jobRunner.ts`'s only change is threading
    `quality: job.params.output?.quality` into its existing `deps.encodeAnimation(...)` call
    (mcp-server/src/jobRunner.ts:146); no test assertion or behaviour in `jobRunner.test.ts` changed.
    Regression-floor guard: the async `/jobs` path's pre-existing behaviour stays intact after quality
    was wired into its encode call, exactly as E17 claims.

- eval: E18
  run_id: motion-tools-cost-r3-http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T01:27:10Z
  output: |
    `npx vitest run mcp-server/src/http.test.ts`: 49/49 passed — unchanged count. `git diff` on
    `http.ts` shows `encodeQuality` was lifted to a `let` declared BEFORE the `try` block that parses
    the request body (mcp-server/src/http.ts:299-303), with a comment explaining the exact bug class
    E18 names: reading `params` from inside a different `try` used to be a block-scope ReferenceError
    that the surrounding catch-degrade silently swallowed into a fake "clip failed" result. `http.test.ts`
    is unchanged and fully green, confirming `/render-clip`'s pre-existing behaviour survived the fix.

- eval: E19
  run_id: motion-tools-cost-r3-npmtest-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T01:28:09Z
  output: |
    ROUND 2 — re-run fresh post-rebase: `npm test` — Test Files 30 passed | 3 skipped (33); Tests 475
    passed | 7 skipped (482) — identical counts to Round 1, confirming the rebase changed no test
    content. Whole-suite regression floor: green both before and after, as expected for this kind of
    guard.

- eval: E20
  run_id: motion-tools-cost-r3-testmcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T01:28:22Z
  output: |
    ROUND 2 — re-run fresh post-rebase: `npm run test:mcp` — Test Files 3 passed (3); Tests 7 passed
    (7); Duration 42.63s — real vite build + real headless-Chromium MCP integration suite, identical
    counts to Round 1. Gated integration guard, green, unaffected by the rebase.

## Analyst

Every feature-specific eval (E1-E16) is `red` on the pre-feature baseline: `compile_motion`,
`camera.focus`, `list_fonts`'s discovery test, `output.quality`, and `cost` metadata are all net-new
surface added in this branch's own commits (`ee9954b`, `398cd37`, `95fced0`, `6096dec`) on top of
`31ad91b`, which itself post-dates the `motion-tools-cost` merge-base `999c13c8`. Confirmed by reading
each test's own location: every assertion cited above lives inside a `describe` block whose name is
tagged `(PR #3)` or is new since `31ad91b` per `git diff 31ad91b..HEAD --stat` — none of these
describe blocks or their source functions (`compile_motion`, `camera.focus` resolution,
`encodeArgs`'s `quality` branch, `cost` construction in `render_clip`) exist on the pre-feature tree,
so there is nothing for them to pass against there. E17-E20 are whole-suite/whole-file regression-floor
guards, `green` on both trees by design (they assert nothing broke, not that something new works).

Baseline for E16 (the structural-invariant script) is recorded as `n-a`: the script itself
(`_acceptance/motion-tools-cost/scripts/motion-tools-invariants.ts`) is new in this branch, committed
in `356cf87`, and does not exist on the merge-base tree at all — there is no script to run against
`999c13c8`, so `red`/`green` do not apply; `n-a` is the honest value, not a computed `red`.

## Variance

none — every eval this round is a deterministic single run (no `runs > 1` marker; nothing in this
contract's own surface crosses `ctx.providers.invoke` or an LLM generator).

## Iterations

Round 1 (verified 2026-08-06T23:59Z, commit `6644d1b`): first verify. All 20 machine evals PASS with a
real assertion behind every clause of their `expected` text (checked individually, not inferred from
"the suite is green" — see Evidence above). `surfaces: [api]`, contract Notes explicitly waive
design-quality evals, so there are zero judgment and zero ui-check items. Verdict **PASS**.

Round 2 (verified 2026-08-07T00:24Z, commit `46935e8`): re-pins evidence after a rebase onto merged
`main` (PR #2 landed; branch rebased onto `main`'s new tip `ecd4a37`, rewriting every commit SHA).
`git diff 6644d1b HEAD` confirmed zero non-gate files changed — this is a re-pin, not a re-audit. Broad
guards (`npm test`, `npm run test:mcp`) and the git-state-dependent invariant script
(`motion-tools-invariants.ts`, whose own output embeds the merge-base hash) were re-run fresh and
matched Round 1 exactly; E1-E15/E17/E18 stand unchanged from Round 1 (their commands don't read git
state and their target files are confirmed byte-identical). Verdict **PASS**.

Round 3 (verified 2026-08-07T01:28Z, commit `27e1be1`): re-verification triggered by `feat/road-routing`
landing on top of Round 2's `verified_commit` (`f74ede1`), touching `mcp-server/src/resolveConfig.ts`
(`resolveRoutes` → `async` + additive `route` branch) and `mcp-server/src/tools.ts` (additive `route`
field on `routeSchema`) — both files this contract's own evals exercise. Every one of this contract's
20 machine evals was re-run fresh (not merely re-pinned): `tools.test.ts` 52/52 (unchanged),
`resolveConfig.test.ts` 64/64 (up from 59 — road-routing's own new tests; this contract's own
`camera.focus`/`compile_motion`/`cost` assertions unmoved in content, re-cited at their current line
numbers), `http.test.ts` 49/49 (unchanged), `encodeAnimation.test.ts`+`jobStore.test.ts`+
`jobRunner.test.ts` 9+16+22=47 (unchanged), `motion-tools-invariants.ts` all I1-I4 `ok` (merge-base line
now reads `vs f74ede1f`), `npm test` 493 passed | 7 skipped (up from 475 — road-routing's own tests;
nothing of this contract's own regressed), `npm run test:mcp` 7/7 (unchanged). Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
