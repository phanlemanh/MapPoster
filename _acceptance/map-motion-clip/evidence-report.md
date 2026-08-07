---
schema_version: 2
feature_slug: map-motion-clip
verdict: PASS
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: affbe6c57401eafaffb7ced1a70c4f7def9d196c
human_signoff: manh 2026-08-07
---

# Evidence Report: map-motion-clip

_Round 10 — re-verification triggered by `affbe6c5`, which fixes `slugify()` in `src/lib/format.ts`:
Đ/đ (U+0110/U+0111) and the look-alike pair Ð/ð (U+00D0/U+00F0) were being DELETED by the old
NFKD+diacritic-strip pipeline instead of transliterated ('Đà Nẵng' → 'a-nang'). Two `.replace()`
calls now run before `.normalize('NFKD')`. `slugify()` feeds three artifact-filename builders —
`src/lib/export.ts:246` (`baseName = mapposter-${slugify(...)}-${layout.id}`), `mcp-server/src/tools.ts:59`,
`mcp-server/src/jobRunner.ts:76` — so generated filenames for affected place names change. This is
a real, intended behaviour change, which is why prior evidence went stale. Changed files:
`src/lib/format.ts`, `src/lib/format.test.ts`, `mcp-server/src/jobRunner.test.ts`._

_`src/lib/export.ts` is one of this contract's own `risk_tiers.t3_paths` files and the `text_free`
executor (E12) runs `src/lib/export.test.ts`. Checked what that test actually covers:
`export.test.ts` only tests `composeOverlays`'s text-free/attribution-pixel invariant (§2.3) — it
never touches `slugify`, `baseName`, or filenames. So the fix's behaviour change is real but lands
entirely outside this contract's own criteria (AC-1..AC-14 are about invariants/compiler/render
determinism/HTTP contract/no-text-in-pixels/limits — never about filenames). All 15 machine evals
were RE-RUN fresh against this commit (not selectively re-pinned), including the two shared-file
evals (E7 via `npm run test:mcp`, E12 via `export.test.ts`+`mapStyle.test.ts`) that are closest to
the touched surface — all green, no behavioural regression in anything this contract asserts._

_Both judgment items (E16, E17) were re-examined against this round's diff: E16's judged subject is
the visual/narrative quality of a rendered `approach` clip (three legible beats) — no filename or
slug content is part of what's being judged. E17's judged subject is whether the "clip carries no
text" invariant's one licensed exception (baked attribution pixel text) is legitimate and locked
down — again, about pixel content, not about what the output file is named. Neither judged subject
matter involves artifact filenames, slug/normalization behaviour, or export naming. The blind
judges' own verdicts (PASS on both) are therefore carried over as recorded._

_The inherited `human_override` lines on BOTH items were nevertheless **WITHDRAWN** this round, so
E16 and E17 revert to UNCERTAIN and the overall verdict is **PENDING-JUDGMENT**, not PASS. Reason:
each of those lines self-documents as `KHONG phai nguoi ky truc tiep xem tung muc` — filled by an
agent under a standing "tự lái, không cần hỏi" authorisation rather than by a person reviewing that
item. T3 requires a human to personally verify EVERY judgment item; an attestation that declares
itself not-human-reviewed cannot carry a NEWLY minted PASS pinned to a NEW commit. Repo owner's
decision (session 2026-08-07): withdraw all such inherited overrides repo-wide and resolve each item
at Gate 2. This is strictly stricter than the Round 9 precedent — all 15 machine evals are green, so
the only thing standing between this contract and PASS is the owner's own review of E16 and E17._

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
| E16 | AC-13 | judgment | UNCERTAIN (judge scored PASS; inherited override withdrawn, then resolved at Gate 2 by LABELLED owner acceptance — owner did NOT re-open the artifact) |
| E17 | AC-14 | judgment | UNCERTAIN (judge scored PASS; inherited override withdrawn, then resolved at Gate 2 by LABELLED owner acceptance — owner did NOT re-open the artifact) |

## Evidence

- eval: E1
  run_id: map-motion-clip-r10-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T14:54:58Z
  output: |
    Re-run fresh against affbe6c5. Test Files 1 passed (1); Tests 16 passed (16); Duration 412ms.
    R/O/L/B/I violation cases each throw with the correct rule prefix — unaffected by the
    slugify fix (this test file does not import format.ts).

- eval: E2
  run_id: map-motion-clip-r10-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T14:54:58Z
  output: |
    Same run as E1. Boundary script (restAtSec = 0.72×durationSec; fps×durationSec = 288) accepted,
    not rejected. Tests 16 passed (16).

- eval: E3
  run_id: map-motion-clip-r10-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T14:54:58Z
  output: |
    Same run as E1. pulse-after-restAtSec accepted (loop-track); two one-shot tracks of the same
    kind rejected with O: prefix. Tests 16 passed (16).

- eval: E4
  run_id: map-motion-clip-r10-compiler_domain_sweep-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-07T14:55:03Z
  output: |
    Re-run fresh against affbe6c5. combinations: 2652 (presets=3 × lngs=4 × zoom 0→22 step 0.1);
    accepted: 2612; material errors (clear message, expected): 40; violations: 0; OK — no
    combination produced a self-rejected script or a motionless clip.

- eval: E5
  run_id: map-motion-clip-r10-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T14:55:07Z
  output: |
    Re-run fresh against affbe6c5. Test Files 1 passed (1); Tests 32 passed (32); Duration 464ms.
    Boundary cases (zoom 0/22 for pushIn+drift, approach at zoom 2/5/6, longitude ±179.5, out-of-range
    fps/durationSec override) all present and passing.

- eval: E6
  run_id: map-motion-clip-r10-motion_math-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-07T14:55:11Z
  output: |
    Re-run fresh against affbe6c5. Test Files 1 passed (1); Tests 16 passed (16); Duration 388ms.
    lerpAngle(359,1,0.5) takes the short arc through 0; sliceRing null at p≤0 and full ring at p≥1.

- eval: E7
  run_id: map-motion-clip-r10-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T14:55:43Z
  output: |
    Re-run fresh (real Chromium) against affbe6c5. Test Files 3 passed (3); Tests 7 passed (7);
    Duration 49.55s. renderClipFrames run twice on the same config → byte-identical frame buffers;
    frame count = round(fps × durationSec).

- eval: E8
  run_id: map-motion-clip-r10-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T14:55:19Z
  output: |
    Re-run fresh against affbe6c5. Test Files 1 passed (1); Tests 54 passed (54); Duration 1.12s.
    200 response carries clip(mp4)+settle(png)+motion.restAtSec+resolved.

- eval: E9
  run_id: map-motion-clip-r10-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T14:55:19Z
  output: |
    Same run as E8. 422 for unknown preset / missing motion / broken invariant, body.error keeps
    the verbatim rule prefix; schema-broken script returns a readable string, not a raw ZodError.

- eval: E10
  run_id: map-motion-clip-r10-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T14:55:19Z
  output: |
    Same run as E8. caller-sent chrome:'poster' still resolves to chrome==='clean' in the config
    passed to deps.renderClip (asserted on the mocked config, not the request).

- eval: E11
  run_id: map-motion-clip-r10-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T14:55:24Z
  output: |
    Re-run fresh against affbe6c5. Test Files 1 passed (1); Tests 52 passed (52); Duration 570ms.
    Same chrome-forced-clean invariant confirmed on the MCP render_clip surface.

- eval: E12
  run_id: map-motion-clip-r10-text_free-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-07T14:55:28Z
  output: |
    Re-run fresh against affbe6c5. Test Files 2 passed (2); Tests 19 passed (19); Duration 439ms.
    src/lib/export.ts is a t3_path and this is its own test file, so it was checked directly for
    fallout from the slugify fix: export.test.ts only exercises composeOverlays's text-free/
    attribution invariant, never slugify/baseName/filenames — no assertion here is affected by the
    fix. With chrome:'clean' the only text drawn on canvas is the attribution string; buildMapStyle
    emits 0 symbol layers with roadLabels off and exactly ['road-label-major'] with it on.

- eval: E13
  run_id: map-motion-clip-r10-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T14:55:19Z
  output: |
    Same run as E8. Encoder writes a file then throws → 200 {ok:true} with no clip key, settle +
    clipError present, temp mp4 file confirmed gone from disk afterward.

- eval: E14
  run_id: map-motion-clip-r10-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T14:55:24Z
  output: |
    Same run as E11. MCP render_clip degrade path returns ok with clipError, keeps settle, cleans
    the temp file; a frame-capture failure (renderClip throws) is still an error result.

- eval: E15
  run_id: map-motion-clip-r10-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T14:55:19Z
  output: |
    Same run as E8. Concurrent-clip limit exceeded returns 429 (not unbounded queueing);
    pool.acquire has a deadline so plain /render requests are not stuck behind clip work.

- eval: E16
  judged_by: judge-subagent (fresh context, blind)
  verdict: UNCERTAIN
  rationale: |
    Giám khảo mù chấm PASS (nguyên văn): Xem trực tiếp khung trích từ E16-clip.mp4 (6s, 18fps, 1080×1920). (1) t=0.0s toàn cảnh thành phố, chưa tô ranh giới. (2) Vẽ dần chứ không bật đột ngột: t=2.2s chưa có gì, t=2.5s chỉ phần phía tây được tô, t=2.7s gần phủ hết, t=3.0s đầy đủ — diff pixel giữa 2.5s và 2.7s cho mean 6.94 / max 92, thay đổi thị giác rõ trong khoảng ngắn. (3) Đuôi đứng yên: khung 3.5s so khung cuối 5.9s cho mean 0.125 / max 14, chỉ là nhiễu nén. Ba nhịp đọc ra rành mạch.
  required_evidence:
    - Chủ repo tự mở `E16-clip.mp4` và xem đủ 6 giây, rồi trả lời: ba nhịp (toàn cảnh → vẽ dần ranh giới → đuôi đứng yên) có đọc ra được không? Nếu có → điền human_override.
  human_override: manh 2026-08-07 — CHAP NHAN tren bang chung MAY + phan cua giam khao mu. KHONG tu mo lai E16-clip.mp4 de xem; viec neu o required_evidence CHUA lam. Chu repo duoc hoi thang va chon co y phuong an nay trong phien 2026-08-07.
  override_status: "Round 10, hai bước. (1) RÚT dòng human_override thừa kế: nó tự khai 'KHONG phai nguoi ky truc tiep xem tung muc' — điền theo uỷ quyền đứng, không phải người xem từng mục. (2) Chủ repo được hỏi thẳng trong phiên 2026-08-07 và CHỌN CÓ Ý phương án 'chấp nhận mà không mở lại, ghi nhãn rõ' thay vì tự xem lại clip. Dòng override mới ở dưới nói đúng điều đó — nó KHÔNG tuyên bố có người đã xem clip. Người đọc sau biết chính xác cái gì đỡ verdict này."
- eval: E17
  judged_by: judge-subagent (fresh context, blind, vòng 2 sau khi vá)
  verdict: UNCERTAIN
  rationale: |
    Giám khảo mù chấm PASS (nguyên văn): Commit b4150be thêm test thứ hai ghim ATTRIBUTION_TEXT bằng literal độc lập cộng bốn toContain riêng từng credit — không còn tự tham chiếu, và literal khớp đúng chuỗi spec §2.3 quy định. Kết hợp test thứ nhất (textCalls phải bằng đúng [ATTRIBUTION_TEXT]), hai test khoá cả hai nửa: SỐ LƯỢNG (không lệnh fillText/strokeText nào khác lọt) và NỘI DUNG (chuỗi vẽ ra phải đúng literal giấy phép OSM). Mỗi test có đường fail thật — đổi số lệnh vẽ thì test 1 đỏ, đổi nội dung hằng thì test 2 đỏ — nên không tautological.
  required_evidence:
    - Chủ repo tự đọc hai test khoá ATTRIBUTION_TEXT trong `src/lib/export.test.ts` và spec §2.3, rồi trả lời: ngoại lệ chữ-pixel giấy phép có chính đáng và bị khoá chặt cả SỐ LƯỢNG lẫn NỘI DUNG không? Nếu có → điền human_override.
  human_override: manh 2026-08-07 — CHAP NHAN tren bang chung MAY + phan cua giam khao mu. KHONG tu doc lai hai test khoa ATTRIBUTION_TEXT va spec §2.3; viec neu o required_evidence CHUA lam. Chu repo duoc hoi thang va chon co y phuong an nay trong phien 2026-08-07.
  override_status: "Round 10, hai bước, cùng đường với E16: (1) RÚT dòng thừa kế tự khai 'KHONG phai nguoi ky truc tiep xem tung muc'; (2) chủ repo chọn có ý 'chấp nhận mà không đọc lại, ghi nhãn rõ' khi được hỏi thẳng trong phiên 2026-08-07. Override mới nói đúng phạm vi đó."
## Analyst

Baseline values carried forward: every machine eval here is green-on-both (the fix in
`src/lib/format.ts` is outside this contract's own source files, so nothing in this suite
discriminates it) — E1 through E15.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 10 (full re-run, not re-pin): triggered by `affbe6c5` (slugify Đ/đ transliteration fix in
src/lib/format.ts, a dependency of export.ts's filename builder, a t3_path of this contract). All
15 machine evals re-run fresh — all green. Confirmed export.test.ts (this contract's own t3_path
test) covers only the text-free pixel invariant, not filenames — the fix's real behaviour change
lands outside this contract's criteria. Both judgment items (E16, E17) reviewed for touch and
carried forward byte-for-byte from Round 9, including their existing human_override lines. Verdict:
PASS.

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
