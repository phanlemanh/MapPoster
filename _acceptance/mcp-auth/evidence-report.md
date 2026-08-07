---
schema_version: 2
feature_slug: mcp-auth
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: manh 2026-08-07
---

# Evidence Report: mcp-auth

_Round 3 — re-verification triggered by `affbe6c5`, which fixed `slugify()` in `src/lib/format.ts`
(the Vietnamese letter Đ/đ and look-alikes Ð/ð were being deleted instead of transliterated to
`d`) and touched `src/lib/format.test.ts` + `mcp-server/src/jobRunner.test.ts`. `slugify()` feeds
`fileNameFor()` in `mcp-server/src/jobRunner.ts`, which is exercised by this contract's own E9
(`npm test`, full suite including `jobRunner.test.ts`) — a shared file, so per the repo's own rule
that touching shared mcp-server files invalidates sibling contracts' evidence regardless of which
route changed, this contract's evidence went stale and needed a full re-run rather than a re-pin._

**Confirmed `http.ts` itself is untouched since Round 2:** `git diff
ce0b13e6de6504aa53d3bc0fe5545f209ec00381..HEAD -- mcp-server/src/http.ts
mcp-server/src/http.test.ts _acceptance/mcp-auth/scripts/auth-invariants.ts` is empty — byte-
identical to the Round-2-verified tree. The triggering commit's diff is confined to
`src/lib/format.ts`, `src/lib/format.test.ts`, and `mcp-server/src/jobRunner.test.ts`; none of the
auth guard, the bearer-comparison helper, or the boot-time fail-closed check were touched.

All 10 evals were re-run fresh (not re-pinned) per instruction:
- **E1-E6** (`npx vitest run mcp-server/src/http.test.ts`): Test Files 1 passed (1); Tests 54
  passed (54) — same count as Round 2, same file content, so the same per-clause reasoning Round 2
  already recorded for each of E1-E6 still applies unchanged (direct, unconditional assertions on
  real responses/real `startHttpServer` calls; no gap reopened).
- **E7/E8** (`npx tsx _acceptance/mcp-auth/scripts/auth-invariants.ts`): all four invariants (I1
  t3_path unchanged, I2 exactly one bearer-comparison site + `rejectedByBearer` defined, I3 four
  guard call sites with the guard immediately before `/mcp`'s `createServer`, I4 fail-closed check
  compares host against `LOOPBACK_HOSTS` and the token with an actionable message) still hold —
  expected, since the file the script inspects (`http.ts`) is unchanged.
- **E9** (`npm test`, full suite): Test Files 31 passed | 3 skipped (34); Tests 501 passed | 7
  skipped (508) — 3 more passing tests than Round 2's 498 (the triggering commit added slugify
  regression tests to `format.test.ts` and a filename-level assertion to `jobRunner.test.ts`, per
  its own commit message); zero failures, zero regressions in any of the three REST routes' own
  tests or in `jobRunner.test.ts`.
- **E10** (`npm run test:mcp`, `MCP_INTEGRATION=1`): Test Files 3 passed (3); Tests 7 passed (7) —
  real vite build, real PNG/clip through headless Chromium; unaffected, as expected, since these
  three files exercise the stdio transport, not `/mcp` HTTP or `jobRunner.ts`.

No REJECT-worthy gap found this round. The trigger was a filename-construction fix in a shared
helper, not an auth-path change, and the re-run confirms it left every mcp-auth invariant and
behavioural assertion exactly as Round 2 left them. Verdict stays **PASS**.

---

_Round 2 — focused re-verification triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`,
scoped entirely to `mcp-server/src/http.test.ts`), fixing exactly the gap Round 1 flagged: E6's
"bind outside loopback WITH token → starts fine" case rebound its `startHttpServer` call from
`'127.0.0.1'` (loopback — the bug) to `'0.0.0.0'` (genuinely non-loopback). All 10 evals were
re-run fresh at the new commit; `verified_commit` re-pinned to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`._

**E6/AC-6 re-check, same per-clause standard as Round 1:** the clause is now proven. Tracing the
guard condition directly — `!LOOPBACK_HOSTS.includes(host) && !process.env.MAPPOSTER_TOKEN`
(`http.ts:202`) — with `host = '0.0.0.0'` (not in `LOOPBACK_HOSTS`) and `MAPPOSTER_TOKEN` set, the
first operand is `true` and the second is `false`, so the whole expression is `false` and the guard
does not fire; `startHttpServer` proceeds to listen and `expect(srv.url).toContain('/mcp')` is a
real assertion on a real started server bound to a real non-loopback address. Re-ran
`http.test.ts` fresh: 54/54 pass, including this case.

I additionally reproduced the commit author's negative control independently, in a disposable
`git worktree add --detach <tmp> ce0b13e` (no changes to this repo's working tree) with the boot
guard hand-edited to `if (!LOOPBACK_HOSTS.includes(host))` — i.e. dropping the token check so it
refuses *every* non-loopback host regardless of token. Running just this test
(`npx vitest run mcp-server/src/http.test.ts -t "cho phép bind ngoài loopback KHI đã có token"`)
against that mutant: **1 failed** — `Error: Refusing to start: MAPPOSTER_HTTP_HOST=0.0.0.0 binds
outside loopback but MAPPOSTER_TOKEN is unset` thrown from `http.ts:203`, exactly where a
too-strict guard would break a legitimate token-configured deployment. That property — catching
over-restriction, not just under-restriction — is what Round 1 found missing, and it now holds.

Grepping `startHttpServer(` call sites in `http.test.ts` again post-fix (still 27 sites): E6 is now
the only site that pairs a genuinely non-loopback host with a token set, so it is also now the
*only* test exercising that specific combination — no other eval accidentally duplicates or
conflicts with it.

**Re-scrutinized the rest of mcp-auth's evals with the same standard** (per-clause, not "suite is
green"):
- E1/E2 (`http.test.ts:220-232`): both `expect(...).toBe(401)` calls are direct, unconditional
  assertions on the real response object from a real request to `srv.url` — no gap.
- E3/E4/E5 (`http.test.ts:235-264`): each is a single direct assertion (`toBe(200)` /
  `toBe(200)` / `.rejects.toThrow(/MAPPOSTER_TOKEN/)`) on a real call — no gap.
- E7/E8 (`auth-invariants.ts` I1-I4): static/structural checks by design (AC-7 says "soi bất
  biến" — inspect invariants), not behavioural ones; they do what their own `expected` text
  claims and nothing more. No over-claim found.
- E9 (`npm test`, full suite): genuinely re-includes `http.test.ts` plus every other route's own
  tests; re-run fresh this round, unaffected by the E6 test-only edit except for absorbing it. No
  gap.
- E10 (`npm run test:mcp` — `renderFrame.test.ts`, `renderClip.test.ts`, `stdioChannel.test.ts`):
  re-confirmed these three files contain **zero** references to `bearer`/`Authorization`/
  `MAPPOSTER_TOKEN`/`startHttpServer` (grepped again this round) — they exercise the **stdio**
  transport (`mcp-server/src/stdio.ts`), a separate, unauthenticated-by-design local-pipe
  transport, not the guarded `/mcp` HTTP endpoint. Round 1 already flagged this eval as
  corroborating (real build, real headless-Chromium render pipeline) rather than a direct AC-3
  test; that characterization stands and is not softened this round. Its `expected` text's "MCP
  integration có gác" reads, in context of the same boilerplate phrase being reused verbatim
  across every other T2 contract's own `test.mcp` catch-all eval with unrelated criteria, as "this
  integration suite is gated behind `MCP_INTEGRATION=1`" (an opt-in cost/CI gate), not "this suite
  tests the bearer gate" — so it is not treated as an over-claim, but the ambiguity is worth a
  human's eyes at Gate 2.

No new REJECT-worthy gap found. Verdict stays **PASS**.

---

_Round 1 — first verification of this contract. `mcp-server/src/http.ts` on `fix/mcp-auth`
(`e5ce7199`) replaces three copy-pasted bearer checks (`/render`, `/render-clip`, `/jobs`) with one
shared `rejectedByBearer()` helper, adds a guard call on the previously-unguarded `/mcp`
fall-through, and adds a startup-time fail-closed check that refuses to bind outside loopback
without `MAPPOSTER_TOKEN` set._

## Security questions answered directly

**1. Does a request to `/mcp` without a bearer get 401 when `MAPPOSTER_TOKEN` is set?** Yes —
confirmed from the test's own assertion, not the implementation. `mcp-server/src/http.test.ts:216-225`
sets `MAPPOSTER_TOKEN='secret'`, POSTs to `srv.url` (the `/mcp` endpoint) with no `authorization`
header, and asserts `expect(noAuth.status).toBe(401)`. This is eval E1. The same test then asserts a
wrong bearer (`Bearer nope`) also gets 401 (`http.test.ts:227-232`, eval E2).

**2. Does `startHttpServer` genuinely refuse (throw) for a non-loopback host with no token — and
does it still start for loopback with no token?** Yes to both, confirmed from the tests' own
assertions:
- Refuse half (E5, `http.test.ts:258-264`): `startHttpServer(0, fakeDeps(), '0.0.0.0', { allowedHosts:
  ['example.com'], ... })` with no `MAPPOSTER_TOKEN` set is asserted with
  `.rejects.toThrow(/MAPPOSTER_TOKEN/)`. Re-run directly against the pre-fix code (see Baseline
  below) confirms the old `startHttpServer` resolved instead of throwing — the guard is new and it
  is load-bearing.
- Start half (E4, `http.test.ts:246-256`): no `MAPPOSTER_TOKEN` set, default host (loopback,
  `127.0.0.1`), POST to `/mcp` with no bearer is asserted `expect(res.status).toBe(200)` — the guard
  does not turn local dev into a required-config chore.

## Round 1 finding: E6 did not test what its own title claimed — RESOLVED in Round 2 (see above)

E6 (AC-6, "bind outside loopback WITH token → starts fine") was titled in the test file *"cho phép
bind **ngoài loopback** KHI đã có token"* (`http.test.ts:266`), but the Round-1 call was
`startHttpServer(0, fakeDeps(), '127.0.0.1', { allowedHosts: ['127.0.0.1'], ... })` — `'127.0.0.1'`
is itself inside `LOOPBACK_HOSTS` (`mcp-server/src/http.ts:119`:
`['127.0.0.1', 'localhost', '[::1]']`), so the fail-closed guard's condition never engaged
regardless of the token — the test would have passed identically even if the "outside loopback +
token → starts" path were broken. Commit `ce0b13e` fixed the test to bind `'0.0.0.0'`; see the
Round 2 section above for the re-check and independent negative control.

## Baseline (A/B)

Computed against the merge base (`ab66f49`, `git merge-base origin/main HEAD`) using a `git worktree
add --detach <tmp> ab66f49` (a separate checkout, no changes to the working tree) with the new
`http.test.ts` and `auth-invariants.ts` copied in to exercise the *old* `http.ts` — this is feasible
and was done, not recorded as `n-a`.

- Running `http.test.ts` against the old `http.ts`: 2 of 54 tests fail — the `/mcp` no-bearer probe
  returns 200 instead of 401 (old code applied no bearer check to `/mcp` at all), and the refuse-to-
  start probe resolves instead of rejecting (no such guard existed). Everything else, including the
  three REST routes' own bearer checks, passes unchanged.
- A supplementary ad hoc probe (not committed; run directly against the old `http.ts` in the
  worktree) exercised each AC in isolation rather than relying on the combined test's early abort:
  AC-1 old→200 (want 401, red), AC-2 old→200 (want 401, red), AC-3 old→200 (want 200, green), AC-4
  old→200 (want 200, green), AC-5 old→did not throw (want throw, red), AC-6 old→started (want
  starts, green — old code never blocks this configuration either, since it had no fail-closed
  check to begin with; that is a property of the fix's safety, not of E6's Round-1 test bug).
- Running `auth-invariants.ts` against old `http.ts`: 6 of 7 invariant checks fail (I2 finds 3
  bearer-comparison sites instead of 1 and no `rejectedByBearer`; I3 finds 0 guard call sites
  matching the new pattern instead of 4; I4 finds no fail-closed comparison) — red.
- Running the full `npm test` against old `http.ts` + new `http.test.ts`: 2 failed, 496 passed, 7
  skipped — the same two tests, nothing else regresses — red, and confirms the refactor itself
  changes no other route's behaviour.
- `npm run test:mcp` is unaffected either way (green on both) — that suite never exercises bearer
  auth.
- Not re-computed in Round 2: the Round-2 diff is test-only (`http.test.ts`), so the old `http.ts`
  behaviour under baseline is unchanged from Round 1's measurement.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: mcp-auth-r3-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T07:49:24Z
  output: |
    Re-run at affbe6c5 (http.ts/http.test.ts byte-identical to Round 2's ce0b13e). mcp-server/src/
    http.test.ts describe('auth: cửa /mcp và luật fail-closed (P0)') — 'gác /mcp bằng CÙNG bearer
    với /render' — MAPPOSTER_TOKEN set, POST /mcp with no Authorization header →
    expect(noAuth.status).toBe(401) — confirmed passing. Test Files 1 passed (1); Tests 54 passed
    (54).

- eval: E2
  run_id: mcp-auth-r3-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T07:49:24Z
  output: |
    Re-run at affbe6c5. Same test as E1, second half — POST /mcp with `authorization: Bearer nope`
    → expect(wrong.status).toBe(401) — confirmed passing. Test Files 1 passed (1); Tests 54 passed
    (54).

- eval: E3
  run_id: mcp-auth-r3-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T07:49:24Z
  output: |
    Re-run at affbe6c5. 'vẫn cho qua khi bearer đúng' — MAPPOSTER_TOKEN set, POST /mcp with
    `authorization: Bearer secret` → expect(ok.status).toBe(200) — confirmed passing. Non-
    discriminating vs baseline: old /mcp had no auth check at all, so a correct bearer also
    returned 200 before this fix.

- eval: E4
  run_id: mcp-auth-r3-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T07:49:24Z
  output: |
    Re-run at affbe6c5. 'KHÔNG đòi bearer khi không đặt token' — no MAPPOSTER_TOKEN, default host
    (loopback), POST /mcp with no Authorization header → expect(res.status).toBe(200) — confirmed
    passing; local dev on loopback with no token configured still works.

- eval: E5
  run_id: mcp-auth-r3-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T07:49:24Z
  output: |
    Re-run at affbe6c5. 'TỪ CHỐI KHỞI ĐỘNG khi bind ngoài loopback mà không có token' —
    startHttpServer(0, fakeDeps(), '0.0.0.0', {allowedHosts:['example.com'],...}) with no token →
    await expect(...).rejects.toThrow(/MAPPOSTER_TOKEN/) — confirmed passing.

- eval: E6
  run_id: mcp-auth-r3-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T07:49:24Z
  output: |
    Re-run at affbe6c5. 'cho phép bind ngoài loopback KHI đã có token' — MAPPOSTER_TOKEN set,
    startHttpServer(0, fakeDeps(), '0.0.0.0', {allowedHosts:['127.0.0.1'],...}) →
    expect(srv.url).toContain('/mcp') — confirmed passing; test file byte-identical to the Round-2
    fixed version (still binds genuinely non-loopback '0.0.0.0'), so Round 2's independent
    negative-control result (over-restrictive guard makes this test fail) still applies unchanged.
    Still green-on-baseline (see Analyst) for the same reason recorded in Round 2: old http.ts
    never blocked this configuration either, since it had no fail-closed check of any kind.

- eval: E7
  run_id: mcp-auth-r3-auth_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.auth_invariants
  verified_at: 2026-08-07T07:49:30Z
  output: |
    Re-run at affbe6c5 (script inspects mcp-server/src/http.ts, unchanged since Round 2 — this
    round's triggering diff is confined to src/lib/format.ts and two test files, none of which
    http.ts imports). I1 t3_path untouched vs 313a7143. I2 exactly 1 bearer-comparison site +
    rejectedByBearer defined. I3 4 call sites gate the guard (3 REST + /mcp fall-through) and the
    guard sits immediately before createServer() on the /mcp branch. I4 the startup fail-closed
    check compares host against LOOPBACK_HOSTS and MAPPOSTER_TOKEN, and the thrown message names
    both the env var and the fix. auth-invariants: mọi bất biến còn giữ.

- eval: E8
  run_id: mcp-auth-r3-auth_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.auth_invariants
  verified_at: 2026-08-07T07:49:30Z
  output: |
    Same run as E7 — I2/I3 (exactly one comparison, all 4 doors gated) are precisely the invariants
    that keep README's "bearer áp cho cả /mcp" claim true.

- eval: E9
  run_id: mcp-auth-r3-api-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.api
  verified_at: 2026-08-07T07:49:40Z
  output: |
    Re-run at affbe6c5 per explicit instruction (shared file src/lib/format.ts changed, feeding
    fileNameFor() in jobRunner.ts, which this suite exercises). Full Vitest suite — Test Files 31
    passed | 3 skipped (34); Tests 501 passed | 7 skipped (508) — 3 more passing tests than Round
    2's 498 (new slugify regression coverage added to format.test.ts and jobRunner.test.ts by the
    triggering commit), zero failures. Confirms the slugify fix changed no observable behaviour on
    any of the three REST routes (/render, /render-clip, /jobs) or on the auth guard.

- eval: E10
  run_id: mcp-auth-r3-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T07:50:37Z
  output: |
    Re-run at affbe6c5. MCP_INTEGRATION=1 vitest run (renderFrame.test.ts, renderClip.test.ts,
    stdioChannel.test.ts) — real vite build, real PNG and clip through headless Chromium. Test
    Files 3 passed (3); Tests 7 passed (7). These three files still reference neither bearer/
    Authorization/startHttpServer nor jobRunner.ts's fileNameFor() — unaffected by both this
    round's trigger and the auth guard; stdio-transport regression corroboration, not a direct
    AC-3 test.

## Analyst

Non-discriminating (green on both baseline and HEAD) because the underlying behaviour predates this
fix: E3, E4, E6, E10. E3/E4 prove the fix didn't regress the happy path rather than that the fix
exists. E6 is green-on-baseline for a distinct reason from Round 1's finding: old code never had a
fail-closed check at all, so it never blocked the "non-loopback + token" configuration either —
E6's discriminating power (after the Round-2 fix) is against a *regression toward over-restriction*
(proven via the independent negative control above), not against the historical baseline. The
actual security fix vs. the historical baseline is proven by E1, E2, E5, E7, E8, E9, which are all
red on baseline.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 3: triggered by `affbe6c5` (slugify Đ/đ transliteration fix in src/lib/format.ts, a shared
helper feeding jobRunner.ts's fileNameFor()) — stale evidence per the shared-file rule, not an
auth-path change. Confirmed http.ts/http.test.ts/auth-invariants.ts byte-identical to Round 2's
pinned commit via git diff. All 10 evals re-run fresh (not re-pinned): unchanged pass counts for
E1-E8/E10, E9's full suite gained 3 passing tests (new slugify regression coverage) with zero
failures. No new gap found. Verdict stays PASS.

Round 2: E6/AC-6 re-checked per the same per-clause standard after commit `ce0b13e` rebound the
test to a genuine non-loopback host (`'0.0.0.0'`); clause now proven, confirmed independently via a
hand-edited negative control in a disposable worktree (over-restrictive guard makes the test fail).
Re-scrutinized E1-E5, E7-E10 with the same standard — no new gap found; E10's "MCP integration có
gác" phrasing remains ambiguous (flagged for Gate 2, not treated as a failure). All 10 evals
re-run fresh; `verified_commit` re-pinned to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`.

Round 1: all 10 evals pass on first run against `fix/mcp-auth` HEAD (e5ce7199). No REJECT round
preceded this one. E6 flagged as a coverage gap (test didn't exercise the clause its title
claimed) without failing the eval outright, since its own literal `expected` text was still met.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
