---
schema_version: 2
feature_slug: motion-tools-cost
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 637ae403b478e6722ed8d37410426ac0d34e0657
human_signoff:
---

# Evidence Report: motion-tools-cost

_Round 7 — `main` merged into this branch at `637ae40`. Trước đó evidence ghim
`535ee8e` (Round 6). Merge nối thêm đúng ba file non-gate lên trên `535ee8e`:
`src/lib/format.ts`, `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts`
(`git diff --name-only 535ee8e HEAD` xác nhận, cộng bảy file `_acceptance/**`
khác đã nằm trong `t1_skip_globs`)._

_Nội dung `format.ts`: sửa lỗi `slugify()` — Đ/đ (U+0110/U+0111) và cặp nhìn
giống hệt Ð/ð (U+00D0/U+00F0) trước đây bị NFKD+lọc-diacritic XOÁ HẲN thay vì
chuyển thành `d` (`'Đà Nẵng'` → `'a-nang'` thay vì `'da-nang'`), vì đây là chữ
CÓ GẠCH NGANG dựng sẵn — NFKD không tách rời chúng và `\p{Diacritic}` không
khớp. Bản vá thêm hai `.replace()` chuyển tay CHẠY TRƯỚC `.normalize('NFKD')`._

_`slugify()` cấp tên file cho ba nơi: `src/lib/export.ts:246`,
`mcp-server/tools.ts:59`, `mcp-server/jobRunner.ts:76`. `tools.ts` nằm trong bộ
thực thi `clip_tools` của hợp đồng này. Đã đọc lại toàn bộ 16 tiêu chí AC-1..
AC-16 và evals.yaml: KHÔNG tiêu chí nào của hợp đồng `motion-tools-cost`
assert hình dạng/tên file artifact do `slugify()` sinh ra — AC-1..AC-16 nói về
`script`/`fps`/`durationSec`/`cost`/`camera.focus`/`quality`/tên trường chi
phí, không nói tên file. `src/lib/export.ts` bị đóng băng bởi Out-of-scope +
AC-16 (không đổi dòng nào) và KHÔNG đổi — sửa lỗi chỉ chạm `format.ts`. Vì vậy
diff này không phát sinh nghĩa vụ AC mới cho hợp đồng, nhưng vẫn chạm surface
`clip_tools` nên toàn bộ tập eval được chạy lại đủ, không ghim suông theo yêu
cầu vòng này._

_`npm test` = 499 passed | 7 skipped (506) — đúng như kỳ vọng, KHÔNG phải 501.
Số 499 (thay vì 501) là di sản từ `535ee8e` (`chore/remove-dead-centroidof`,
Round 6): commit đó xoá hai test của hàm chết `centroidOf` khỏi
`geometry.test.ts`, không liên quan gì tới `format.ts`/`slugify` của round
này. Round này KHÔNG thêm/bớt test nào trong `npm test`; format.test.ts nằm
trong bộ `npm test` và không đổi tổng đếm vì nó test hành vi mới (round-trip
đúng của Đ/đ), không phải test mới đứng riêng ngoài suite đã đếm._

_Đã chạy lại fresh toàn bộ tám lệnh thực thi của hợp đồng này: clip_tools,
clip_http, resolve_config, encode_animation, job_runner, api (`npm test`),
mcp (`npm run test:mcp`), và script `motion_tools_invariants`. Zero fail.
I1-I4 của script bất biến đều giữ, gồm I4 (không tên chi phí trần) và I3 (cả
ba bề mặt encode mang `quality`)._

_`verified_commit` cập nhật lên `637ae40`; `human_signoff` xoá trắng theo quy
tắc file-dùng-chung — chữ ký người thuộc Cổng 2, phải nằm ở commit riêng._

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
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Fresh run against 637ae40. Test Files 1 passed (1); Tests 52 passed (52) —
    compile_motion returns script/fps/durationSec/restAtSec/frames/preset/resolved.

- eval: E2
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Same run — SHOULD-NOT-RENDER assertion holds: deps without renderClip/
    encodeAnimation still succeed, fakes assert .not.toHaveBeenCalled().

- eval: E3
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Same run — raw motion.script validated, frames computed correctly, preset
    absent from the response.

- eval: E4
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Same run — SHOULD-NOT-RETURN-EMPTY holds: approach-without-region and
    missing-motion both return isError=true with a stated cause, never an
    empty script.

- eval: E5
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Same run — chrome:'poster' still yields resolved.chrome = 'clean'.

- eval: E6
  run_id: motion-tools-cost-r7-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:26:41Z
  output: |
    Fresh run against 637ae40. Test Files 1 passed (1); Tests 64 passed (64) —
    camera.focus by index frames the specific object, not a union of all.

- eval: E7
  run_id: motion-tools-cost-r7-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:26:41Z
  output: |
    Same run — paddingPct 150 yields a smaller zoom than paddingPct 0; the
    knob has a measurable effect, not a no-op.

- eval: E8
  run_id: motion-tools-cost-r7-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:26:41Z
  output: |
    Same run — SHOULD-NOT-PICK-A-WINNER holds: focus+zoom and focus+center are
    both rejected with /camera.focus/.

- eval: E9
  run_id: motion-tools-cost-r7-resolve_config-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T09:26:41Z
  output: |
    Same run — index 9 on 2 regions rejected with 'index out of range (2
    region'; index 0 with zero routes rejected with '(0 route'.

- eval: E10
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Same run — 6 fonts with stack/titleWeight/uppercaseTitle; every listed
    key is accepted by render_map (loop over all keys, none isError).

- eval: E11
  run_id: motion-tools-cost-r7-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T09:26:42Z
  output: |
    Fresh run against 637ae40. Test Files 1 passed (1); Tests 9 passed (9) —
    quality omitted still yields crf '20', identical to encodeArgs(quality:
    'standard').

- eval: E12
  run_id: motion-tools-cost-r7-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T09:26:42Z
  output: |
    Same run — draft/standard/high map to crf 28/20/16 with preset
    veryfast/medium/slow on the correct branches.

- eval: E13
  run_id: motion-tools-cost-r7-encode_animation-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T09:26:42Z
  output: |
    Same run — SHOULD-NOT-APPLY holds: GIF branch with quality:'high' produces
    args identical to unset, no '-crf' present.

- eval: E14
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Same run — cost.frames matches the fake renderer's actual returned frame
    count (7), not the script-declared count; renderMs/encodeMs are numbers;
    bytes matches clip.bytes; no 'time'/'size' keys present.

- eval: E15
  run_id: motion-tools-cost-r7-clip_tools-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:26:39Z
  output: |
    Same run — degrade-on-encode-failure branch still carries cost with
    renderMs as a number; SHOULD-NOT-EMIT holds: bytes = 0 and the clip block
    is absent.

- eval: E16
  run_id: motion-tools-cost-r7-motion_tools_invariants-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.motion_tools_invariants
  verified_at: 2026-08-07T09:26:43Z
  output: |
    ok   I1  t3_path untouched vs 5a6dea79 (3 file đổi)
    ok   I2  compile_motion KHÔNG dùng acquireClipSlot/deps.renderClip/
             deps.render(/encodeAnimation; tái dùng prepareClipRenderWithSlot
    ok   I3  MCP (2 calls) / REST (1 call) / async jobRunner (1 call) đều
             mang quality
    ok   I4  không tên chi phí trần trong tools.ts / encodeAnimation.ts; bốn
             tên chi phí đủ nghĩa đều có mặt
    motion-tools-invariants: mọi bất biến còn giữ

- eval: E17
  run_id: motion-tools-cost-r7-job_runner-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T09:26:43Z
  output: |
    Fresh run against 637ae40 (this file changed in the merge — new tests
    added on top of the existing suite). Test Files 1 passed (1); Tests 22
    passed (22) — the async /jobs path is unchanged after wiring quality into
    its encode call.

- eval: E18
  run_id: motion-tools-cost-r7-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:26:40Z
  output: |
    Fresh run against 637ae40. Test Files 1 passed (1); Tests 54 passed (54) —
    REST /render-clip unchanged after hoisting encodeQuality out of the try
    block.

- eval: E19
  run_id: motion-tools-cost-r7-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T09:26:44Z
  output: |
    Fresh run against 637ae40. Test Files 31 passed | 3 skipped (34); Tests
    499 passed | 7 skipped (506) — the whole Vitest suite is green. 499 (not
    501) because 535ee8e (Round 6) removed two dead centroidOf tests; this
    round's format.ts fix does not change the total.

- eval: E20
  run_id: motion-tools-cost-r7-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T09:26:33Z
  output: |
    Fresh run against 637ae40. Test Files 3 passed (3); Tests 7 passed (7);
    Duration 55.29s — real vite build, real PNG and clip through headless
    Chromium.

## Analyst

Non-discriminating (green on both branch and diffBase) this round: E17, E18,
E19, E20 — these are broad regression-guard suites, not evals that isolate
this contract's own new behaviour; expected per Round 4's baseline carry-over
rationale (unchanged this round).

Baseline `n-a`: E16 (invariant script has no meaningful pre-feature baseline
to run against).

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 7: triggered by `main` merged to `637ae40` on top of Round 6's
`535ee8e` pin. Diff adds exactly three non-gate files:
`src/lib/format.ts` (fix: Đ/đ and Ð/ð were deleted by slugify's NFKD+strip
pipeline instead of transliterated to 'd'; two `.replace()` calls added
before `.normalize('NFKD')`), `src/lib/format.test.ts`, and
`mcp-server/src/jobRunner.test.ts` (tests). Confirmed via `git diff
--name-only 535ee8e HEAD`. `slugify()` feeds three artifact-filename builders
(export.ts:246, tools.ts:59, jobRunner.ts:76); tools.ts sits inside this
contract's clip_tools executor. Re-checked all 16 criteria (AC-1..AC-16):
none assert artifact filenames — the contract's filename invariant (AC-16)
only pins `src/lib/export.ts`/`src/lib/mapStyle.ts` byte-identity and encode
call-shape, not slugify output. All 20 evals re-run fresh (no selective
re-pin) per this round's instruction. `npm test` = 499 passed | 7 skipped
(506), matching the expected baseline — 499 not 501 is Round 6's
centroidOf-removal legacy, unrelated to this round's diff. Zero failures.
`verified_commit` updated to `637ae40`; `human_signoff` cleared.

Round 6: re-verified due to `535ee8e` (`chore/remove-dead-centroidof`)
touching shared `geometry.ts`/`resolveConfig.ts`; dead-code removal only, no
runtime path changed. Full executor set re-run, zero failures.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
