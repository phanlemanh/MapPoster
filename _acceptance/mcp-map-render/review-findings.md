# Review Findings: mcp-map-render (Round 12)

Informational — **not** hook-enforced (no `acceptance-evidence-gate.js` shape applies to this
file). Feeds the Gate 2 decision card alongside `evidence-report.md`. Both findings below went through
the full finder → refuter adversarial-verify pass; neither is flagged `unverified`, and no review pass
died mid-way in the run that produced this content (see "Review incomplete" at the bottom).

Verified at commit `62b02e8158644f01a0972a813d9f6096f7d87374` (`feature/mcp-map-render`).

**Context vs. Round 11:** the Round-11 review surfaced 3 findings — 2 MEDIUM (unbounded `render_variants`
array; unbounded `highlight.regions`/`highlight.points` name arrays) and 1 LOW (`formatSize` matching
`Object.prototype` members). None of those 3 sits on code this round's diff touches
(`tools.ts`/`resolveConfig.ts` are unchanged between `9e51736` and `62b02e8`), so they are neither
re-confirmed nor closed by this round's pass — they remain open exactly as Round 11 left them, tracked in
that round's Iterations entry in `evidence-report.md`. This round's own diff is narrowly scoped to
startup/build plumbing (`mcp-server/src/ensureDist.ts` new, `stdio.ts`, `http.ts`, plus CI/docs), and the
adversarial pass targeted exactly that new surface — both findings below are on the SAME line, converged
on independently by two different review lenses.

**Note for Gate 2:** this round's overall verdict is PENDING-JUDGMENT, and neither finding below is the
sole reason — that verdict is driven by this contract's `risk_tier: T3` mandating a direct human verdict on
judgment item E12 (AC-12), independent of code-review findings. Unlike Round 11 (zero HIGH), both findings
below ARE high severity and land on this round's own new feature — per the human's Round-6 termination rule
(`d-20260710T110500Z-47001`: "only a confirmed HIGH would reopen the loop"), this is squarely the class of
finding the rule was written to catch, not a routine "carry forward as accepted risk" candidate. Gate 2
should treat this as a live decision, not a formality.

## Findings

### 1. [HIGH] stdio MCP transport corrupted: vite build stdout leaks onto the JSON-RPC channel

- **File:** `mcp-server/src/ensureDist.ts:42`
- **Severity:** high
- **Source:** conventions

Absolute path: `/Users/manhphan/dev/map/mcp-server/src/ensureDist.ts:42`.

Invariant (inferred from the codebase; repo has no CLAUDE.md/CONTRIBUTING.md): on the stdio transport,
process stdout is reserved exclusively for the MCP JSON-RPC message stream. The whole server source obeys
this — every log goes to stderr via `console.error` (`http.ts`, `stdio.ts`, and even `ensureDist`'s own
injected `log` default `(m) => console.error(m)`). A grep for stdout/console.log/stdio across
`mcp-server` source returns exactly one hit: `ensureDist.ts:42`.

Violation: the default `build` runs `execSync('npx vite build', { stdio: 'inherit', cwd })`.
`stdio: 'inherit'` makes the child inherit fd 1, so the build's stdout is written to the server's own
stdout. On the stdio transport (`stdio.ts`, which calls `ensureDist(loadServerConfig())` before
`runStdio`), that stdout is the protocol channel.

Empirical proof: running `npx vite build` with streams split writes the full build report to STDOUT (not
stderr): `vite v8.1.4 building client environment for production...`, `transforming...`,
`rendering chunks...`, the per-chunk size table, and `✓ built in 236ms` — ~11 non-JSON lines. Only the
chunk-size warning goes to stderr.

Impact: this triggers on exactly the scenario the feature was built to fix — a fresh clone whose first
stdio render auto-builds `dist/`. The MCP client reads those non-JSON lines off the server's stdout and
fails to parse them as newline-delimited JSON-RPC, breaking/corrupting the connection. So the self-healing
build sabotages the stdio first-run it is meant to rescue. `http.ts` is unaffected (stdout is not its
channel), but `stdio.ts` shares the same `ensureDist` default.

Untested boundary: all four unit tests inject `build`, so the real `execSync` path (the one with
`stdio: 'inherit'`) is never exercised. Fix direction (do not apply): send the child's stdout to fd 2,
e.g. `stdio: ['ignore', 2, 'inherit']`, so progress stays visible on stderr and stdout stays clean for the
protocol.

### 2. [HIGH] vite build output corrupts the MCP stdio JSON-RPC channel on first run

- **File:** `mcp-server/src/ensureDist.ts:42`
- **Severity:** high
- **Source:** bugs

`ensureDist` runs `execSync('npx vite build', { stdio: 'inherit', cwd })`. With `stdio:'inherit'` the
child inherits the parent's fd 1 (stdout). For the stdio transport this stdout IS the JSON-RPC protocol
channel the MCP client reads — the MCP stdio contract requires the server to write ONLY valid MCP messages
to stdout. `vite build` emits its progress/summary (the `dist/… gzip:` table via vite's logger, which
defaults to stdout) directly onto that channel.

This triggers on exactly the scenario the feature targets: a fresh clone launched via `.mcp.json`
(type:"stdio", command `npx -y tsx mcp-server/src/stdio.ts`) has no `dist/`, so `stdio.ts` calls
`ensureDist` → builds → ~10s of non-JSON build text is written to stdout while the client is performing the
`initialize` handshake, corrupting/failing it. The HTTP path is unaffected (stdout is not a protocol
channel there).

The code already knows stdout must stay clean — its own `log` default correctly uses console.error/stderr
(`ensureDist.ts:27`) — but the build subprocess bypasses that and lands on stdout. Fix: route the build's
stdout to stderr, e.g. `stdio: ['ignore', process.stderr, 'inherit']` (or capture with `'pipe'` and re-emit
on stderr), so no build bytes reach fd 1.

Related harmful call site: `mcp-server/src/stdio.ts:18` (`ensureDist(loadServerConfig())` in the `isMain`
block).

## Chưa adversarial-verify (refuter chết)

none — both findings above completed the full finder → refuter pass in the run that produced this
content; neither carries `unverified: true`.

## Review incomplete (finder chết)

none — in the run that produced the findings above, no review pass failed to complete.
