# Review Findings: mcp-map-render (Round 14)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. Zero findings survived this
round's finder pass — the first fully clean adversarial review in this feature's 14-round history.
No review pass died mid-way in the run that produced this content (see "Review incomplete" at the
bottom).

Verified at commit `6c3d36b7ffb3d241516883b6f998514e482a25f3` (`feature/easy-setup`).

**Context vs. Round 13:** Round 13's review surfaced 3 findings on the fix that closed Round 12's HIGH
(the stdio-transport stdout leak) — 1 MEDIUM already reviewed and knowingly accepted as risk
(`ensureDist.ts`'s build is synchronous and now blocks the `initialize` handshake instead of corrupting
it), 1 MEDIUM (`test:mcp` raced two integration test files over the same on-disk `dist/`, able to
spuriously fail one or silently false-pass the other), and 1 LOW (the new integration test destructively
renamed the real workspace `dist/`, restored only in `finally`). The human (manh) chose to fix the two
closable findings and to knowingly accept the synchronous-build MEDIUM (`decisions.jsonl`
`d-20260711T023000Z-63001` through `-63003`).

Commit `6c3d36b` ("run the integration files serially and stop the stdio test false-passing") closes both:

- **MEDIUM #2 (race) — CLOSED.** `package.json`'s `test:mcp` script gained `--fileParallelism=false`,
  forcing `mcp-server/src/renderFrame.test.ts` and `mcp-server/src/stdioChannel.test.ts` to run one after
  another instead of Vitest 4's default concurrent-file execution. Verified: `npm run test:mcp` re-run
  independently this round reports `Test Files 2 passed (2)` / `Tests 4 passed (4)` in 11.14s with no
  interleaved output between the two files' build/rename/rebuild phases (confirmed by direct re-run, not
  just trusted from the prior machine-results snapshot). `stdioChannel.test.ts` additionally now asserts
  `!existsSync(dist)` immediately before spawning the server — if the serialization guarantee ever
  regresses and `dist/` is present when it shouldn't be, the test fails loudly instead of silently
  false-passing without exercising the build path — and asserts the spawned child's stderr contains
  `"render harness not built yet"` (`mcp-server/src/ensureDist.ts:53`'s own log line, confirmed present at
  that line by direct grep), positively proving the real build branch ran rather than merely inferring it
  from clean stdout.
- **LOW #3 (destructive rename) — CLOSED.** `.gitignore` gained `/dist.__stdiotest_bak`. The rename/restore
  mechanism in `stdioChannel.test.ts` (`renameSync`/`finally`) is otherwise unchanged — this closes the
  "could pollute a commit" tail risk, not the rename itself, which remains an accepted minor deviation from
  the suite's isolated-temp-dir convention (low blast radius: opt-in behind `MCP_INTEGRATION=1`, and the
  backup is a rebuildable directory).
- **MEDIUM #1 (synchronous build blocks handshake) — NOT re-flagged, carried forward as an already-accepted
  risk.** `ensureDist.ts:54` is unchanged this round (`git diff 5487f68 6c3d36b -- mcp-server/src/
  ensureDist.ts` is empty). The human explicitly reviewed and accepted this tradeoff in Round 13
  (`decisions.jsonl` `d-20260711T023000Z-63003`: "build-before-serve is a deliberate tradeoff; Claude
  Code's own init timeout is generous; the alternative — a lazy build on first render — only relocates the
  blocking window"). This round's fresh finder pass ran against the full HEAD (not just the diff) and
  independently found nothing new on top of it, so it is listed here for continuity/traceability, not as a
  Round-14 finding requiring its own adversarial-verify cycle.

`git diff 5487f68 6c3d36b --stat` confirms the source-level change this round is scoped to exactly three
files: `.gitignore`, `mcp-server/src/stdioChannel.test.ts`, and `package.json`. This round's finder passes
(`bugs` and `conventions` lenses) targeted that scoped diff plus a fresh look at the rest of the
`mcp-server/` surface, and reported zero new issues.

**Note for Gate 2:** this round's overall verdict is PENDING-JUDGMENT, and no finding (new or carried
forward) is the reason — that verdict is driven entirely by this contract's `risk_tier: T3` mandating a
direct human verdict on judgment item E12 (AC-12), independent of code-review findings, and no prior
`human_override` carries forward to this round's freshly-pinned commit (`6c3d36b`).

## Findings

None. This round's finder pass (both `bugs` and `conventions` lenses) surfaced zero new findings against a
diff limited to `package.json`'s `test:mcp` script, `.gitignore`, and `stdioChannel.test.ts`'s strengthened
assertions — and a fresh look at the surrounding `mcp-server/` surface turned up nothing else. The one open
item from Round 13 that remains genuinely open (`ensureDist.ts:54`'s synchronous build) is not listed as a
finding here because it is unchanged code the human already adversarially-reviewed and knowingly accepted
in Round 13 (`decisions.jsonl` `d-20260711T023000Z-63003`) — see the Context section above for its full
detail and status.

## Chưa adversarial-verify (refuter chết)

none — there are no findings this round to carry an `unverified: true` flag; the finder pass itself
completed cleanly with an empty result set.

## Review incomplete (finder chết)

none — in the run that produced this content, no review pass failed to complete.
