# Review Findings: mcp-map-render (Round 13)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. All three findings below went
through the full finder → refuter adversarial-verify pass; none is flagged `unverified`, and no review
pass died mid-way in the run that produced this content (see "Review incomplete" at the bottom).

Verified at commit `5487f6891f56270356fd6cfcc483c18810e4f58f` (`feature/easy-setup`).

**Context vs. Round 12:** Round 12's review surfaced 1 HIGH — `ensureDist()`'s default build ran
`execSync('npx vite build', { stdio: 'inherit' })`, splicing the build's own stdout progress onto the stdio
transport's JSON-RPC channel during `initialize`. That HIGH is now CLOSED: commit `40ecc5d` routes the
build subprocess's stdout to fd 2 via `BUILD_STDIO = ['ignore', 2, 'inherit']`, backed by a new unit
assertion pinning the constant and a new gated integration test (`stdioChannel.test.ts`) that spawns the
real stdio server and asserts every stdout line parses as JSON. This round's adversarial pass targeted
exactly the fix and its new test surface — all three findings below sit on code this round's own diff
introduces (`mcp-server/src/ensureDist.ts`, `mcp-server/src/stdioChannel.test.ts`, `package.json`).

**Note for Gate 2:** this round's overall verdict is PENDING-JUDGMENT, and none of the findings below is the
sole reason — that verdict is driven by this contract's `risk_tier: T3` mandating a direct human verdict on
judgment item E12 (AC-12), independent of code-review findings, and Round 11's prior `human_override` does
not carry forward to this round's freshly-pinned commit. Unlike Round 12 (1 HIGH), all three findings below
are MEDIUM/LOW — per the human's Round-6 termination rule (`d-20260710T110500Z-47001`: "only a confirmed
HIGH would reopen the loop"), none by itself is mandated to reopen the loop again. That said, the third
finding (the `test:mcp` race) bears directly on how much confidence to place in THIS round's own
regression proof for the HIGH it just fixed, and is worth Gate 2's attention for that reason even though it
does not block on the termination rule alone.

## Findings

### 1. [MEDIUM] Synchronous `vite build` blocks the MCP initialize handshake on first run

- **File:** `mcp-server/src/ensureDist.ts:54`
- **Severity:** medium
- **Confidence:** medium (the blocking behavior itself is high-confidence; whether it actually trips a
  real client depends on that client's init-timeout policy)
- **Source:** conventions

Absolute path: `/Users/manhphan/dev/map/mcp-server/src/ensureDist.ts:54`.

`ensureDist()` is invoked in the `isMain` block of `stdio.ts` (line 18) and `http.ts` (line 187) BEFORE the
transport connects (`runStdio()` / `startHttpServer()`), and it runs the build with
`execSync('npx vite build', { stdio: BUILD_STDIO, cwd })` — a synchronous, event-loop-blocking call. On the
stdio path (`.mcp.json` launches `npx -y tsx mcp-server/src/stdio.ts`), the client spawns the process and
sends `initialize`; the server cannot answer until `execSync` returns. This relocates the "worst first-run"
the feature exists to prevent from render-time to handshake-time: a cold `vite build` on this React app can
exceed the README's stated "~10s", and an MCP client that enforces an `initialize`/handshake timeout would
mark the server failed. The fd-1 channel itself is now kept clean (Round 12's HIGH — `BUILD_STDIO` routes
child stdout to fd 2, verified correct by this round's own fix), but the blocking-before-connect ordering is
a genuine, separate boundary tension the fix did not touch. Confidence that the blocking behavior is real is
high; whether it actually trips a client depends on that client's init timeout (Claude Code's own is
generous), so real-world impact is medium/uncertain. The author's commit message shows the tradeoff was
considered for the stdout leak but not explicitly for this blocking question.

### 2. [LOW] Integration test destructively renames the real workspace `dist/`, restoring only in `finally`

- **File:** `mcp-server/src/stdioChannel.test.ts:25`
- **Severity:** low
- **Confidence:** high (the hazard mechanism itself is certain; blast radius is what keeps severity low)
- **Source:** conventions

Absolute path: `/Users/manhphan/dev/map/mcp-server/src/stdioChannel.test.ts:25`.

To force the build path, the test does `renameSync(dist, distHidden)` (line 25) on the repo's real
(gitignored, rebuildable) `dist/` directory and only restores it via `renameSync(distHidden, dist)` in the
`finally` block (line 53). If the test worker is terminated between those points — a vitest test-timeout
kill, SIGKILL/Ctrl-C, CI cancellation, or OOM — the workspace is left with `dist/` gone and stashed as
`dist.__stdiotest_bak`, and `dist.__stdiotest_bak` is not gitignored. This mutates a real out-of-tree
workspace directory rather than an isolated temp dir, deviating from the rest of the suite's
injected-deps / isolated-fixture convention (e.g. `ensureDist.test.ts` injects `exists`/`build` rather than
touching the filesystem). Blast radius is limited because the whole suite is opt-in behind
`MCP_INTEGRATION=1`, and the damage is a rebuildable directory, so severity is low; the hazard mechanism
itself is certain (high confidence).

### 3. [MEDIUM] `test:mcp` races two integration tests over the same on-disk `dist/`, corrupting each other

- **File:** `package.json:15`
- **Severity:** medium
- **Source:** bugs

Absolute path: `/Users/manhphan/dev/map/package.json:15`.

This round's diff changes `test:mcp` to run two files in one vitest invocation:
`MCP_INTEGRATION=1 vitest run mcp-server/src/renderFrame.test.ts mcp-server/src/stdioChannel.test.ts`.
Vitest 4 (this repo pins `4.1.10`) runs test FILES in parallel by default (forks pool,
`fileParallelism=true`), and `vitest.config.ts` sets no `maxWorkers`/`fileParallelism`/`singleFork`
override — so both files execute concurrently. Both mutate the SAME directory, the repo-root `dist/`:

- `renderFrame.test.ts`'s `beforeAll` runs `npx vite build` to create `dist/`, starts an app server that
  serves files out of `dist/` via `fs.readFile`, and keeps rendering (headless browser fetching
  `render.html` + JS chunks from `dist/`) for the whole test.
- `stdioChannel.test.ts:25` destructively does `renameSync(dist, distHidden)` to force the fresh-clone
  build path, spawns the stdio server (which rebuilds `dist/`), then at teardown (line 52)
  `rmSync(dist, { recursive: true })` and renames the backup back.

Under concurrent execution these collide with no synchronization. Bad interleavings that are near-certain
given the ~10s+ overlap window:

1. `stdioChannel` renames/removes `dist/` while `renderFrame` is mid-render → the app server's
   `fs.readFile` throws → 404 → the render page never loads → `renderFrame` waits out its 20s timeout and
   FAILS spuriously.
2. `renderFrame`'s `vite build` recreates `dist/` before/while `stdioChannel` checks it → `stdioChannel`'s
   spawned server sees `render.html` present and SKIPS the build, so the test passes without ever
   exercising the build path it exists to verify — a false pass (silent loss of coverage for exactly the
   fresh-clone-first-render regression Round 12's bug lived in).
3. `stdioChannel`'s teardown `rmSync(dist)` + rename can delete `renderFrame`'s freshly built `dist/` and,
   if the test process is interrupted mid-teardown, leave the working tree's real `dist/` deleted or
   stranded as `dist.__stdiotest_bak`.

The gated integration suite (the acceptance evidence relies on it for E1 and E6's corroborating depth, and
this round's own regression proof of the HIGH fix) is therefore flaky and can silently under-test. This
round's own `npm run test:mcp` run reported "4 passed" (genuine, exit 0), but per scenario (2) above that
result cannot yet be trusted as a guaranteed-clean exercise of the real build path on every future run.
Fix: run these two files serially (separate npm steps, or `--sequence.concurrent=false` /
`--fileParallelism=false`, or `--poolOptions.forks.singleFork`), or isolate `stdioChannel`'s build into a
temp dir instead of renaming the shared `dist/`.

## Chưa adversarial-verify (refuter chết)

none — all three findings above completed the full finder → refuter pass in the run that produced this
content; none carries `unverified: true`.

## Review incomplete (finder chết)

none — in the run that produced the findings above, no review pass failed to complete.
