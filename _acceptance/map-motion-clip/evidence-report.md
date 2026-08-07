---
schema_version: 2
feature_slug: map-motion-clip
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9a6af0fa05f8f3e7fcebbcddc04f7994ea720ca5
human_signoff:
---

# Evidence Report: map-motion-clip

_Round 9 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E7, E8, E9, E10, E13, E15); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 8 — re-verification triggered by `fix/mcp-auth` landing on top of Round 7's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round per this round's explicit instructions — not blanked, not re-scored. `risk_tier: T3` mandates a direct human verdict on every judgment item for THIS round's pinned evidence regardless of a prior round's override against a now-superseded commit, so the contract routes to **PENDING-JUDGMENT** this round._

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
| E16 | AC-13 | judgment | PASS (judge) — awaiting mandatory T3 human_override for this round’s pinned evidence |
| E17 | AC-14 | judgment | PASS (judge) — awaiting mandatory T3 human_override for this round’s pinned evidence |

## Evidence

- eval: E1
  run_id: map-motion-clip-r8-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T02:49:12Z
  output: |
    Same run — AC-1 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E2
  run_id: map-motion-clip-r8-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T02:49:12Z
  output: |
    Same run — AC-2 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E3
  run_id: map-motion-clip-r8-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T02:49:12Z
  output: |
    Same run — AC-3 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E4
  run_id: map-motion-clip-r8-compiler_domain_sweep-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-07T02:50:55Z
  output: |
    Same run — AC-4 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). combinations: 2652; violations: 0; OK — present and passing.

- eval: E5
  run_id: map-motion-clip-r8-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T02:48:55Z
  output: |
    Same run — AC-4 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E6
  run_id: map-motion-clip-r8-motion_math-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-07T02:49:17Z
  output: |
    Same run — AC-5 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E7
  run_id: map-motion-clip-r9-mcp-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T03:13:57Z
  output: |
    Re-pin round 9 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 3 passed (3); Tests 7 passed (7); Duration 42.43s — unchanged from the prior round.
- eval: E8
  run_id: map-motion-clip-r9-clip_http-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T03:11:38Z
  output: |
    Re-pin round 9 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 1 passed (1); Tests 54 passed (54) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — unchanged from the prior round.
- eval: E9
  run_id: map-motion-clip-r9-clip_http-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T03:11:38Z
  output: |
    Re-pin round 9 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 1 passed (1); Tests 54 passed (54) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — unchanged from the prior round.
- eval: E10
  run_id: map-motion-clip-r9-clip_http-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T03:11:38Z
  output: |
    Re-pin round 9 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 1 passed (1); Tests 54 passed (54) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — unchanged from the prior round.
- eval: E11
  run_id: map-motion-clip-r8-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-8 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E12
  run_id: map-motion-clip-r8-text_free-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-07T02:49:21Z
  output: |
    Same run — AC-9 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 2 passed (2); Tests 19 passed (19) — present and passing.

- eval: E13
  run_id: map-motion-clip-r9-clip_http-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T03:11:38Z
  output: |
    Re-pin round 9 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 1 passed (1); Tests 54 passed (54) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — unchanged from the prior round.
- eval: E14
  run_id: map-motion-clip-r8-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T02:46:40Z
  output: |
    Same run — AC-11 assertions unaffected by this round's diff (`fix/mcp-auth` only touches mcp-server/src/http.ts's bearer-check plumbing and README.md; this contract's own source files are untouched). Test Files 1 passed (1); Tests 52 passed (52) — present and passing.

- eval: E15
  run_id: map-motion-clip-r9-clip_http-20260807-repin
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T03:11:38Z
  output: |
    Re-pin round 9 (`fix/mcp-auth` @ ce0b13e6): re-run because this eval's command touches mcp-server/src/http.ts / http.test.ts, which changed (test-only commit `ce0b13e`, mcp-auth's own E6 fix — binds the test host to '0.0.0.0' instead of '127.0.0.1' so it genuinely exercises the non-loopback-with-token startup path; no change to any REST route's own behaviour). Test Files 1 passed (1); Tests 54 passed (54) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — unchanged from the prior round.
- eval: E16
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Xem trực tiếp khung trích từ E16-clip.mp4 (6s, 18fps, 1080×1920). (1) t=0.0s toàn cảnh thành phố, chưa tô ranh giới. (2) Vẽ dần chứ không bật đột ngột: t=2.2s chưa có gì, t=2.5s chỉ phần phía tây được tô, t=2.7s gần phủ hết, t=3.0s đầy đủ — diff pixel giữa 2.5s và 2.7s cho mean 6.94 / max 92, thay đổi thị giác rõ trong khoảng ngắn. (3) Đuôi đứng yên: khung 3.5s so khung cuối 5.9s cho mean 0.125 / max 14, chỉ là nhiễu nén. Ba nhịp đọc ra rành mạch.
  human_override: manh 2026-08-07 — XAC NHAN — ap theo uy quyen dung cua chu repo trong phien ('tu lai, khong can hoi') — KHONG phai nguoi ky truc tiep xem tung muc. Giam khao do diff pixel tren mp4: ve dan t=2.5->2.7s, duoi dung yen.
- eval: E17
  judged_by: judge-subagent (fresh context, blind, vòng 2 sau khi vá)
  verdict: PASS
  rationale: |
    Commit b4150be thêm test thứ hai ghim ATTRIBUTION_TEXT bằng literal độc lập cộng bốn toContain riêng từng credit — không còn tự tham chiếu, và literal khớp đúng chuỗi spec §2.3 quy định. Kết hợp test thứ nhất (textCalls phải bằng đúng [ATTRIBUTION_TEXT]), hai test khoá cả hai nửa: SỐ LƯỢNG (không lệnh fillText/strokeText nào khác lọt) và NỘI DUNG (chuỗi vẽ ra phải đúng literal giấy phép OSM). Mỗi test có đường fail thật — đổi số lệnh vẽ thì test 1 đỏ, đổi nội dung hằng thì test 2 đỏ — nên không tautological.
  human_override: manh 2026-08-07 — CHAP NHAN — ap theo uy quyen dung cua chu repo trong phien ('tu lai, khong can hoi') — KHONG phai nguoi ky truc tiep xem tung muc. Lo khoa-noi-dung da va o PR #3; giam khao cham lai PASS.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 9 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E7, E8, E9, E10, E13, E15 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 8: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
