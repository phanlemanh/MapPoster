---
schema_version: 2
feature_slug: tier0-agent-params
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 31ad91b373380a81db80f1abc7e63043a1930433
human_signoff:
---

# Evidence Report: tier0-agent-params

_Round 4 — re-pin only, not a re-audit. Commit `b4150be` (after this contract's Round 3 verify)
changes `src/lib/export.test.ts` only — a `map-motion-clip`-owned file this contract does not depend
on (its own criteria live in `mcp-server/**`, never touching `src/lib/export.ts`). That commit made
every already-verified `verified_commit` older than HEAD, which the pre-merge staleness check blocks
regardless of relevance, so this round re-runs this contract's broad guards (`npm test`, `npm run
test:mcp`) fresh and re-pins. No new gaps expected or found — see Iterations below._

_Round 3 — re-verification of Round 2's three REJECTs. Commit `06e4ae1` adds a new describe block to
`resolveConfig.test.ts`, "boundary halves the evals claimed but no test proved (verify round 1
finding)" — the commit message references "verify round 1" because it addresses the FIRST verify round
that found gaps in this contract (this report's own numbering runs one higher because Round 1 here was
the original implementation verify, before any staleness re-run). It closes all three: `detail` 0/1
ACCEPTED (added inline to the existing out-of-range test), marker `size` 18/140 ACCEPTED plus `size: 0`
REFUSED, and the marker style fallback chain's terminal `'pin'`/`'#ffffff'`/`44`. This round re-ran the
shared command fresh, confirmed each new assertion exists and passes, and independently negative-
controlled one of them (the `size: 0` guard) rather than trusting the commit message alone. All 20
machine evals now pass; this contract has no judgment evals, so per the routing rule it is **PASS**.
Round 2's REJECT is kept below in Iterations, not erased._

_Round 2 — re-verification. Round 1's evidence (verified_commit `f7feeda`, signed off `manh`
2026-08-06) went STALE: `feat/routes-measurements` landed downstream commits touching
`mcp-server/src/resolveConfig.ts` (+179/-lines) and `mcp-server/src/tools.ts` (+46/-lines) after that
commit — both files this contract's own AC-1..AC-8/AC-11 assertions live in directly. Contract `status`
downgraded `signed-off` → `implemented` per the staleness guard before this report was written.
`human_signoff` is cleared — the Round-1 signature does not carry to this round._

_A structural diff review (`git diff f7feeda..HEAD -- mcp-server/src/resolveConfig.ts
mcp-server/src/tools.ts`) confirms the routes-measurements diff is additive-only against this
contract's own logic (one renamed-but-equivalent helper, `bboxOfRegions`→`bboxOfGeojsons`; zero
existing test lines removed in `resolveConfig.test.ts` or `tools.test.ts` — confirmed via
`git diff ... | grep '^-'`). All 20 of this contract's machine evals were re-run fresh regardless. That
re-run is what surfaced this round's REJECT: **while re-confirming each eval's `expected` text against
an actual passing assertion (not just "the suite is green"), three evals turn out to have never had the
assertion their own `expected` text names — a pre-existing gap from Round 1, not something this round's
diff introduced, but one this round's stricter check is the first to catch.**_

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

- eval: E3
  run_id: tier0-agent-params-E3-20260806r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T16:25:44Z
  output: |
    ROUND 3 — closed. Commit `06e4ae1` added two lines INLINE to the existing
    `it('rejects out-of-range detail and unknown font', ...)` test:
      await expect(resolveConfig({ ..., detail: 0 })).resolves.toMatchObject({ detail: 0 });
      await expect(resolveConfig({ ..., detail: 1 })).resolves.toMatchObject({ detail: 1 });
    Both named boundary values (0 and 1) are now explicitly asserted ACCEPTED, alongside the pre-
    existing REJECTED cases in the same test. All four clauses of E3's `expected` now have a real
    assertion. `npx vitest run mcp-server/src/resolveConfig.test.ts`: 53/53 passed (up from 50).

- eval: E5
  run_id: tier0-agent-params-E3-20260806r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T16:25:44Z
  output: |
    ROUND 3 — closed. Commit `06e4ae1` added a new test to the "boundary halves..." describe block:
      it('falls back through the whole marker style chain to its terminal defaults', async () => {
        const cfg = await resolveConfig({ ...at, highlight: { points: [{ lng, lat }] } });
        expect(cfg.markers?.[0]).toMatchObject({ icon: 'pin', color: '#ffffff', size: 44 });
      });
    A point with NO per-point style AND a `highlight` block with no top-level `pointIcon`/`color` now
    explicitly proves the chain's terminal link (hard-coded `'pin'`/`'#ffffff'`/`44`) — the one link
    Round 2 found untested. Combined with the pre-existing per-point→top-level link test, all three
    links of the fallback chain now have assertions. Same run, 53/53 passed.

- eval: E6
  run_id: tier0-agent-params-E3-20260806r3
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-06T16:25:44Z
  output: |
    ROUND 3 — closed. Commit `06e4ae1` added:
      it('ACCEPTS marker size exactly at both bounds, and REFUSES 0 rather than reading it as unset',
        async () => {
          for (const size of [18, 140]) {
            const cfg = await resolveConfig({ ...at, highlight: { points: [{ lng, lat, size }] } });
            expect(cfg.markers?.[0].size).toBe(size);
          }
          await expect(resolveConfig({ ...at, highlight: { points: [{ lng, lat, size: 0 }] } }))
            .rejects.toThrow(/highlight\.points\[\]\.size/);
        });
    All three previously-missing clauses now covered: size=18 accepted, size=140 accepted, size=0
    refused (not silently read as unset). This verifier independently negative-controlled the size=0
    assertion rather than trusting the commit message: temporarily mutated `resolveConfig.ts:520`'s
    `p.size != null ? assertMarkerSize(p.size) : null` to the truthy form `p.size ? assertMarkerSize
    (p.size) : null` (the exact defect class this test guards against — a `size: 0` payload would then
    silently fall through to the `?? 44` default instead of being rejected) and re-ran this test in
    isolation against the mutated source: the `size: 0` assertion broke exactly as expected under the
    mutant (the test surfaced the injected defect, not a green pass). Source was then reverted (`cp`
    from a pre-edit backup) and the full file re-confirmed green — back to all 53 of 53 tests passing,
    `git diff` empty. The test is a real discriminator, not a tautology.

- eval: E19
  run_id: tier0-agent-params-E19-20260806r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-06T16:34:13Z
  output: |
    ROUND 4 re-pin — re-run fresh because `b4150be` changed `src/lib/export.test.ts` (owned by
    map-motion-clip, not this contract, but the whole-suite guard was re-run per the coordinator's
    instruction anyway):
     Test Files  30 passed | 3 skipped (33)
          Tests  457 passed | 7 skipped (464)
       Duration  2.89s
    Up from 456 in Round 3 — the +1 delta is `export.test.ts`'s new attribution-content-pin test, not
    anything in this contract's own surface.

- eval: E20
  run_id: tier0-agent-params-E20-20260806r4
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-06T16:35:29Z
  output: |
    ROUND 4 re-pin: real vite build + real headless-Chromium MCP integration suite.
     Test Files  3 passed (3)
          Tests  7 passed (7)
       Duration  49.76s
    Unaffected by `b4150be` (`export.test.ts` is not part of this suite's file list).

## Analyst

Baseline: all 18 feature evals (E1-E18) are `red` on the pre-feature diffBase per Round 1's own
determination (this contract's `mcp-server/**` additions did not exist before it), carried forward
unchanged per this round's instructions (T2 stale-refresh rounds carry baseline forward, they do not
recompute it). E19 (`npm test`) and E20 (`npm run test:mcp`) are the broad regression-floor guards,
`green` on both trees as expected.

E3, E5, E6 were NOT baseline non-discrimination issues — they were missing assertions, full stop: the
named clause in each eval's `expected` (an explicit boundary value, or the terminal link of a fallback
chain) had zero test coverage on EITHER tree. Round 3 closes all three with real assertions, each
covering exactly the previously-missing clause and nothing more (no unrelated test weakening). The
implementation itself was correct in all three cases throughout (inclusive Zod/runtime bounds, explicit
`!= null` guards) — this was always a test debt, not a behavioural regression; Round 3's negative
control on E6 (mutating the guard and confirming the new test catches it) is the evidence that the new
tests actually exercise the guards rather than just restating already-true facts.

## Variance

none — every eval this round is a deterministic single run.

## Iterations

- Round 1 (verified 2026-08-06, commit `f7feeda`): all 20 machine evals reported PASS; signed off
  `manh` 2026-08-06. `human_signoff` cleared this round per the staleness-refresh rule.
- Round 2 (verified 2026-08-06T16:06Z, commit `25c2d2a`): re-verify triggered by `feat/routes-
  measurements` touching this contract's own `resolveConfig.ts`/`tools.ts` (additively, confirmed via
  diff review). Full suite still green (453 passed, up from a smaller count in Round 1 — additive new
  tests only, nothing removed). Re-checking each eval's `expected` clause-by-clause against an actual
  assertion (not just the exit code) surfaced 3 pre-existing gaps: E3 (detail=0/1 boundary-accept
  untested), E5 (point icon/color chain's terminal 'pin'/'#ffffff' fallback untested), E6 (marker
  size=18/140 boundary-accept AND size=0 falsy-vs-null rejection both untested). Verdict REJECT,
  `failed_evals: [E3, E5, E6]`. Fix is three small additions to `resolveConfig.test.ts`'s existing
  `describe` blocks (no source change needed — the implementation is already correct); not attempted
  this round, which is verification-only.
- Round 3 (verified 2026-08-06T16:26Z, commit `06e4ae1`): commit `06e4ae1` added all three missing
  test cases (detail=0/1 inline to the existing test; a new "boundary halves..." describe block for
  marker size=18/140/0 and the style fallback chain's terminal defaults; a fourth case in the same
  commit closed routes-measurements' own E5, see that contract's report). `resolveConfig.test.ts`
  re-run fresh: 53/53 passed (up from 50). `npm test` broad guard re-run fresh (test file changed):
  456/463 passed (up from 453). This verifier independently negative-controlled the E6/size=0 case
  (mutated the guard, confirmed the new test fails, reverted, re-confirmed green) rather than trusting
  the commit message. All 20 machine evals now pass; this contract has no judgment evals. Verdict
  **PASS**.
- Round 4 (verified 2026-08-06T16:36Z, commit `31ad91b`): re-pin only, not a re-audit — commit
  `b4150be` (a sibling-contract test file, `src/lib/export.test.ts`) landed after Round 3's
  `verified_commit`, tripping the pre-merge staleness check even though this contract does not depend
  on that file. Re-ran this contract's broad guards fresh: `npm test` 457/464 passed (up from 456 —
  the `export.test.ts` delta, not this contract's own surface), `npm run test:mcp` 7/7 passed,
  unaffected. No re-audit of E1-E18 performed — none of their source/test files changed since Round 3.
  All 20 machine evals remain PASS; this contract has no judgment evals. Verdict **PASS**.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
