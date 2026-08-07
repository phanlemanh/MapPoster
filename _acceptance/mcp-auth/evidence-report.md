---
schema_version: 2
feature_slug: mcp-auth
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: e5ce7199d007b5c57042dd78a29b1df57b9e7a15
human_signoff: 
---

# Evidence Report: mcp-auth

Round 1 — first verification of this contract. `mcp-server/src/http.ts` on `fix/mcp-auth`
(`e5ce7199`) replaces three copy-pasted bearer checks (`/render`, `/render-clip`, `/jobs`) with one
shared `rejectedByBearer()` helper, adds a guard call on the previously-unguarded `/mcp`
fall-through, and adds a startup-time fail-closed check that refuses to bind outside loopback
without `MAPPOSTER_TOKEN` set.

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

## Additional finding: E6 does not test what its own title claims

E6 (AC-6, "bind outside loopback WITH token → starts fine") is titled in the test file *"cho phép
bind **ngoài loopback** KHI đã có token"* (`http.test.ts:266`), but the actual call is
`startHttpServer(0, fakeDeps(), '127.0.0.1', { allowedHosts: ['127.0.0.1'], ... })` — `'127.0.0.1'`
is itself inside `LOOPBACK_HOSTS` (`mcp-server/src/http.ts:119`:
`['127.0.0.1', 'localhost', '[::1]']`), so the fail-closed guard's condition
(`!LOOPBACK_HOSTS.includes(host) && !token`) is `false` regardless of the token — this test would
pass identically even if the "outside loopback + token → starts" path were broken. Grepping every
`startHttpServer(` call site in `http.test.ts` (27 call sites) confirms **no test anywhere** starts
the server with a genuinely non-loopback host (e.g. `'0.0.0.0'` or an external name) *and* a token
set — the only non-loopback call site is E5's refuse case. This mirrors the "eval claims coverage no
test provides" failure mode this gate has caught before. It does not change this eval's own literal
`expected` text ("có token thì server lên bình thường" — true, demonstrated on a loopback bind), and
the guarded code itself is a single, directly-auditable boolean condition confirmed structurally by
E7/E8 (`auth-invariants.ts` I4), so this is flagged as a coverage gap for the record rather than a
failed eval — but AC-6's "ngoài loopback" half has no direct positive-path test today.

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
  starts, green — consistent with the E6 gap above: this probe also only exercised the loopback
  case).
- Running `auth-invariants.ts` against old `http.ts`: 6 of 7 invariant checks fail (I2 finds 3
  bearer-comparison sites instead of 1 and no `rejectedByBearer`; I3 finds 0 guard call sites
  matching the new pattern instead of 4; I4 finds no fail-closed comparison) — red.
- Running the full `npm test` against old `http.ts` + new `http.test.ts`: 2 failed, 496 passed, 7
  skipped — the same two tests, nothing else regresses — red, and confirms the refactor itself
  changes no other route's behaviour.
- `npm run test:mcp` is unaffected either way (green on both) — that suite never exercises bearer
  auth.

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
  run_id: mcp-auth-r1-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T02:46:57Z
  output: |
    mcp-server/src/http.test.ts describe('auth: cửa /mcp và luật fail-closed (P0)') — 'gác /mcp bằng
    CÙNG bearer với /render' — MAPPOSTER_TOKEN set, POST /mcp with no Authorization header →
    expect(noAuth.status).toBe(401) — confirmed passing. Test Files 1 passed (1); Tests 54 passed (54).

- eval: E2
  run_id: mcp-auth-r1-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T02:46:57Z
  output: |
    Same test as E1, second half — POST /mcp with `authorization: Bearer nope` →
    expect(wrong.status).toBe(401) — confirmed passing. Test Files 1 passed (1); Tests 54 passed (54).

- eval: E3
  run_id: mcp-auth-r1-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T02:46:57Z
  output: |
    'vẫn cho qua khi bearer đúng' — MAPPOSTER_TOKEN set, POST /mcp with `authorization: Bearer secret`
    → expect(ok.status).toBe(200) — confirmed passing; the guard does not block a valid caller.
    Non-discriminating vs baseline: old /mcp had no auth check at all, so a correct bearer also
    returned 200 before this fix — this eval proves the fix didn't regress the happy path, not that
    the fix exists.

- eval: E4
  run_id: mcp-auth-r1-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T02:46:57Z
  output: |
    'KHÔNG đòi bearer khi không đặt token' — no MAPPOSTER_TOKEN, default host (loopback), POST /mcp
    with no Authorization header → expect(res.status).toBe(200) — confirmed passing; local dev on
    loopback with no token configured still works. Non-discriminating vs baseline for the same reason
    as E3 (old /mcp answered 200 unconditionally).

- eval: E5
  run_id: mcp-auth-r1-clip_http-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T02:46:57Z
  output: |
    'TỪ CHỐI KHỞI ĐỘNG khi bind ngoài loopback mà không có token' — startHttpServer(0, fakeDeps(),
    '0.0.0.0', {allowedHosts:['example.com'],...}) with no token →
    await expect(...).rejects.toThrow(/MAPPOSTER_TOKEN/) — confirmed passing.

- eval: E6
  run_id: mcp-auth-r1-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T02:46:57Z
  output: |
    'cho phép bind ngoài loopback KHI đã có token' — MAPPOSTER_TOKEN set,
    startHttpServer(0, fakeDeps(), '127.0.0.1', {allowedHosts:['127.0.0.1'],...}) →
    expect(srv.url).toContain('/mcp') — confirmed passing AS WRITTEN. See "Additional finding" above:
    the host argument used ('127.0.0.1') is itself a loopback host, so this test does not actually
    exercise the "outside loopback" half of AC-6 despite its title — it is trivially green on both old
    and new code because the fail-closed condition never engages for a loopback host either way.

- eval: E7
  run_id: mcp-auth-r1-auth_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.auth_invariants
  verified_at: 2026-08-07T02:49:55Z
  output: |
    I1 t3_path untouched vs ab66f49d. I2 exactly 1 bearer-comparison site + rejectedByBearer defined.
    I3 4 call sites gate the guard (3 REST + /mcp fall-through) and the guard sits immediately before
    createServer() on the /mcp branch. I4 the startup fail-closed check compares host against
    LOOPBACK_HOSTS and MAPPOSTER_TOKEN, and the thrown message names both the env var and the fix.
    auth-invariants: mọi bất biến còn giữ.

- eval: E8
  run_id: mcp-auth-r1-auth_invariants-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.auth_invariants
  verified_at: 2026-08-07T02:49:55Z
  output: |
    Same run as E7 — I2/I3 (exactly one comparison, all 4 doors gated) are precisely the invariants
    that keep README's "bearer áp cho cả /mcp" claim true; README.md (diff reviewed directly, see
    below) was updated in this same commit range to state exactly that plus the fail-closed rule.

- eval: E9
  run_id: mcp-auth-r1-api-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.api
  verified_at: 2026-08-07T02:49:45Z
  output: |
    Full Vitest suite — Test Files 31 passed | 3 skipped (34); Tests 498 passed | 7 skipped (505).
    Confirms merging three copied bearer checks into one shared helper changed no observable behaviour
    on any of the three REST routes (/render, /render-clip, /jobs) — all their existing auth/non-auth
    tests are still green.

- eval: E10
  run_id: mcp-auth-r1-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T02:51:38Z
  output: |
    MCP_INTEGRATION=1 vitest run (renderFrame.test.ts, renderClip.test.ts, stdioChannel.test.ts) — real
    vite build, real PNG and clip through headless Chromium. Test Files 3 passed (3); Tests 7 passed
    (7). This suite runs over stdio, not the guarded /mcp HTTP transport, so it is a corroborating
    regression check (nothing about the render pipeline broke) rather than a direct test of AC-3;
    non-discriminating vs baseline as expected.

## Analyst

Non-discriminating (green on both baseline and HEAD) because the underlying behaviour predates this
fix: E3, E4, E6, E10. E3/E4 prove the fix didn't regress the happy path rather than that the fix
exists — the actual security fix is proven by E1, E2, E5, E7, E8, E9, which are all red on baseline.
E6 is additionally flagged above as not testing the condition its own title claims (outside-loopback
bind with a token) — it is green-on-both for two different reasons at once (old code had no
fail-closed check to trigger, and the host used is loopback either way).

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 1: all 10 evals pass on first run against `fix/mcp-auth` HEAD (e5ce7199). No REJECT round
preceded this one.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
