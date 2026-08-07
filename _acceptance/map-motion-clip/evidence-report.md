---
schema_version: 2
feature_slug: map-motion-clip
verdict: PENDING-JUDGMENT
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 637ae403b478e6722ed8d37410426ac0d34e0657
human_signoff:
---

# Evidence Report: map-motion-clip

_Round 11 — merge của `main` vào nhánh này ở `637ae403b478e6722ed8d37410426ac0d34e0657`, mang theo ba file ngoài phạm vi gate trên nền `535ee8e` (verified_commit của Round 10): `src/lib/format.ts` sửa lỗi `slugify` — Đ/đ (U+0110/U+0111) và cặp nhìn giống hệt Ð/ð (U+00D0/U+00F0) trước đây bị NFKD+lọc-diacritic XOÁ HẲN thay vì phiên âm ra `d` (`'Đà Nẵng'` → `'a-nang'` sai); giờ hai `.replace()` chạy TRƯỚC `.normalize('NFKD')` để chuyển tự tay. Kèm hai test file khoá hành vi đó: `src/lib/format.test.ts` (+3 `it` mới: transliterate Đ/đ, transliterate Ð/ð, giữ tên Đ-khác-A tách biệt) và `mcp-server/src/jobRunner.test.ts` (+1 dòng `expect(path.basename(written)).toContain('dak-lak')` chèn vào test dọn-file AC-12 sẵn có)._

_`slugify()` nuôi ba nơi dựng tên tệp: `src/lib/export.ts:246`, `mcp-server/src/tools.ts:59`, `mcp-server/src/jobRunner.ts:76` — xác nhận bằng `grep -rn slugify` toàn repo, không còn nơi thứ tư. `src/lib/export.ts` NẰM trong `risk_tiers.t3_paths` (đúng lý do hợp đồng này là T3), và eval `text_free` (E12) chạy `src/lib/export.test.ts` — nhưng đọc thẳng file đó: nó chỉ khoá `ATTRIBUTION_TEXT`/`drawAttribution`/không-symbol-layer-thừa (AC-9), không một dòng nào gọi `slugify` hay assert tên tệp/`baseName`. Vậy sửa lỗi Đ/đ này KHÔNG chạm assertion nào trong 17 eval id của hợp đồng — dù cùng nằm trong file mà `export.ts` import `slugify` từ đó, và dù `export.ts` tự nó thuộc t3_paths. Hai test mới khoá hành vi (`format.test.ts`, `jobRunner.test.ts`) đều nằm NGOÀI danh sách cmd của E1-E17; không có executor nào bị ghim lại vì diff này._

_Toàn bộ 15 eval máy (E1-E15) được CHẠY LẠI THẬT từ đầu, không ghim suông một cái nào — kể cả `compiler_domain_sweep` (2652 tổ hợp, 0 vi phạm, khớp mọi vòng trước) và `test:mcp` (Chromium thật qua `MCP_INTEGRATION=1`, 46.06s, 7/7 pass). Không eval nào regress. `npm test` full = **499 passed | 7 skipped (506)**, khớp CHÍNH XÁC con số kỳ vọng nêu trong nhiệm vụ vòng này. Đây vẫn là 499 chứ không phải 501 vì `535ee8e` (đã nằm trong cây này từ Round 10) xoá hai test `centroidOf` — giải trình đầy đủ ở đoạn Round 10 bên dưới, không đổi ở vòng này. Diff riêng của vòng 11 chỉ CỘNG test (+3 ở `format.test.ts`, +0 test mới ở `jobRunner.test.ts` — chỉ thêm một `expect` vào test đã có), không xoá test nào, nên không có phần đối chiếu tăng/giảm nào khác cần giải trình ngoài con số đã khớp._

_Verdict vòng này là **PENDING-JUDGMENT**, KHÔNG PHẢI vì có eval máy nào đỏ (không có — cả 15/15 xanh), mà vì chính sách repo `be57c21`/PR #25 hôm nay rút lại MỌI giá trị `human_signoff`/`human_override` do agent viết hoặc mang forward — "KE CA khi duoc bao tu lai". Hai mục judgment E16/E17 từng có `human_override` ở Round 10 ("manh 2026-08-07 — XAC NHAN/CHAP NHAN — ap theo uy quyen dung... KHONG phai nguoi ky truc tiep xem tung muc") — tự dòng chữ đó đã thú nhận không phải người ký trực tiếp xem, đúng loại giá trị chính sách hôm nay cấm mang sang. Nên vòng này: rationale gốc của giám khảo (judge-subagent, blind) được GIỮ NGUYÊN VĂN bên dưới có tiền tố rõ đây là lời giám khảo từ vòng trước; verdict của cả hai mục hạ về `UNCERTAIN`; `human_override` để TRẮNG; mỗi mục thêm một dòng `required_evidence` nêu đúng MỘT thứ cụ thể người ký cần tự tay kiểm — E16: xem `E16-clip.mp4`; E17: đọc spec §2.3 đối chiếu hai test khoá `ATTRIBUTION_TEXT`. Không có eval nào bị coi là fail vì việc này — đây là PENDING-JUDGMENT, không phải REJECT._

_Round 10 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Không eval nào của hợp đồng này trỏ thẳng vào `geometry.ts` hay `resolveConfig.ts`; nó hết hạn theo chốt file-dùng-chung chứ không theo phạm vi eval riêng. Dù vậy toàn bộ tập lệnh của nó vẫn được chạy lại chứ không ghim suông, gồm `compiler_domain_sweep` quét 2652 tổ hợp — 0 vi phạm, đúng bằng vòng trước._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 9 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E7, E8, E9, E10, E13, E15); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 8 — re-verification triggered by `fix/mcp-auth` landing on top of Round 7's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

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
| E16 | AC-13 | judgment | UNCERTAIN — human_override rút lại theo chính sách be57c21/PR #25, chờ người ký tự tay xem |
| E17 | AC-14 | judgment | UNCERTAIN — human_override rút lại theo chính sách be57c21/PR #25, chờ người ký tự tay đọc |

## Evidence

- eval: E1
  run_id: map-motion-clip-r11-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T09:11:47Z
  output: |
    Fresh run, round 11 (`637ae403` — merge of `main`, format.ts Đ/đ fix). AC-1 assertions untouched by this round's diff (fix is in slugify(), not motion invariants). Test Files 1 passed (1); Tests 16 passed (16).

- eval: E2
  run_id: map-motion-clip-r11-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T09:11:47Z
  output: |
    Fresh run, round 11 (`637ae403`). AC-2 boundary case still accepted, not rejected. Test Files 1 passed (1); Tests 16 passed (16).

- eval: E3
  run_id: map-motion-clip-r11-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T09:11:47Z
  output: |
    Fresh run, round 11 (`637ae403`). AC-3 pulse-after-restAtSec accepted, one-shot duplicates rejected with `O:` prefix. Test Files 1 passed (1); Tests 16 passed (16).

- eval: E4
  run_id: map-motion-clip-r11-compiler_domain_sweep-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-07T09:11:50Z
  output: |
    Fresh run, round 11 (`637ae403`). run_id: map-motion-clip-sweep-local; combinations: 2652 (presets=3 × lngs=4 × zoom 0→22 step 0.1); accepted: 2612; material errors (clear message, expected): 40; violations: 0; OK — no combination produced a self-rejected script or a motionless clip. Matches prior rounds exactly.

- eval: E5
  run_id: map-motion-clip-r11-motion_compiler-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T09:11:55Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 32 passed (32).

- eval: E6
  run_id: map-motion-clip-r11-motion_math-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-07T09:12:00Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 16 passed (16).

- eval: E7
  run_id: map-motion-clip-r11-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T09:12:15Z
  output: |
    Fresh run, round 11 (`637ae403`), real Chromium via MCP_INTEGRATION=1 (renderFrame.test.ts, renderClip.test.ts, stdioChannel.test.ts). Test Files 3 passed (3); Tests 7 passed (7); Duration 46.06s. renderClipFrames determinism (AC-6) unaffected by the slugify fix.

- eval: E8
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:12:03Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 54 passed (54). 200 response still returns clip+settle+motion.restAtSec+resolved.

- eval: E9
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:12:03Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 54 passed (54). 422 rejection paths (bad preset / missing motion / broken invariant) still carry verbatim rule-prefix messages, not raw ZodError.

- eval: E10
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:12:03Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 54 passed (54). chrome:'poster' from caller still forced to 'clean' in the config handed to deps.renderClip on the REST surface.

- eval: E11
  run_id: map-motion-clip-r11-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:12:06Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 52 passed (52). Same chrome-forced-clean invariant held on the MCP render_clip surface.

- eval: E12
  run_id: map-motion-clip-r11-text_free-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-07T09:12:09Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 2 passed (2); Tests 19 passed (19). Confirmed by reading export.test.ts: it locks ATTRIBUTION_TEXT/drawAttribution/no-extra-symbol-layer only — no assertion on slugify() or filenames, so this round's format.ts fix is genuinely out of this eval's assertion surface despite both files sharing t3_paths membership.

- eval: E13
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:12:03Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 54 passed (54). Encoder-dies-mid-render still degrades to 200+settle+clipError with no leaked temp mp4.

- eval: E14
  run_id: map-motion-clip-r11-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T09:12:06Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 52 passed (52). Same degrade-path held on the MCP surface; frame-capture failure still an error result (degrade does not overreach).

- eval: E15
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T09:12:03Z
  output: |
    Fresh run, round 11 (`637ae403`). Test Files 1 passed (1); Tests 54 passed (54). Concurrency-limit-exceeded still returns 429, pool.acquire deadline still protects plain /render.

- eval: E16
  criterion: AC-13
  judged_by: judge-subagent (fresh context, blind) — bản ghi từ Round 10, mang forward nguyên văn
  verdict: UNCERTAIN
  rationale: |
    [Lời giám khảo, giữ nguyên văn Round 10] Xem trực tiếp khung trích từ E16-clip.mp4 (6s, 18fps, 1080×1920). (1) t=0.0s toàn cảnh thành phố, chưa tô ranh giới. (2) Vẽ dần chứ không bật đột ngột: t=2.2s chưa có gì, t=2.5s chỉ phần phía tây được tô, t=2.7s gần phủ hết, t=3.0s đầy đủ — diff pixel giữa 2.5s và 2.7s cho mean 6.94 / max 92, thay đổi thị giác rõ trong khoảng ngắn. (3) Đuôi đứng yên: khung 3.5s so khung cuối 5.9s cho mean 0.125 / max 14, chỉ là nhiễu nén. Ba nhịp đọc ra rành mạch.

    [Ghi chú vòng 11] Verdict hạ từ PASS(judge) xuống UNCERTAIN không phải vì rationale trên sai hay đổi, mà vì `human_override` mà Round 10 gắn vào ("manh 2026-08-07 — XAC NHAN — ap theo uy quyen dung cua chu repo trong phien... KHONG phai nguoi ky truc tiep xem tung muc") tự nhận là uỷ quyền gián tiếp, đúng loại giá trị chính sách `be57c21`/PR #25 cấm agent mang forward — kể cả khi được bảo tự lái. Không có `human_override` mới nào được viết ở vòng này.
  human_override:
  required_evidence:
    - Người ký tự tay MỞ và XEM `_acceptance/map-motion-clip/evidence/E16-clip.mp4` (cùng ba khung `E16-step1/2/3.png`) và tự xác nhận bằng mắt ba nhịp mở-toàn cảnh / vẽ-dần-ranh-giới / đứng-yên-đuôi — không dựa vào số đo diff-pixel của giám khảo làm bằng chứng thay thế.

- eval: E17
  criterion: AC-14
  judged_by: judge-subagent (fresh context, blind, vòng 2 sau khi vá) — bản ghi từ Round 10, mang forward nguyên văn
  verdict: UNCERTAIN
  rationale: |
    [Lời giám khảo, giữ nguyên văn Round 10] Commit b4150be thêm test thứ hai ghim ATTRIBUTION_TEXT bằng literal độc lập cộng bốn toContain riêng từng credit — không còn tự tham chiếu, và literal khớp đúng chuỗi spec §2.3 quy định. Kết hợp test thứ nhất (textCalls phải bằng đúng [ATTRIBUTION_TEXT]), hai test khoá cả hai nửa: SỐ LƯỢNG (không lệnh fillText/strokeText nào khác lọt) và NỘI DUNG (chuỗi vẽ ra phải đúng literal giấy phép OSM). Mỗi test có đường fail thật — đổi số lệnh vẽ thì test 1 đỏ, đổi nội dung hằng thì test 2 đỏ — nên không tautological.

    [Ghi chú vòng 11] Cùng lý do chính sách như E16: `human_override` Round 10 ("manh 2026-08-07 — CHAP NHAN — ap theo uy quyen dung cua chu repo trong phien... KHONG phai nguoi ky truc tiep xem tung muc") tự thú nhận không phải người ký trực tiếp đọc spec §2.3 — bị rút lại hôm nay, không mang forward. Xác nhận độc lập ở vòng này: `src/lib/export.test.ts` vẫn còn nguyên hai test khoá (dòng 66 `expect(textCalls).toEqual([ATTRIBUTION_TEXT])`; dòng 78/83 literal độc lập + bốn `toContain` từng credit), không đổi so với mô tả của giám khảo.
  human_override:
  required_evidence:
    - Người ký tự tay đọc `docs/superpowers/specs/2026-08-03-map-motion-clip-design.md` §2.3 rồi đối chiếu trực tiếp với hai test khoá `ATTRIBUTION_TEXT` trong `src/lib/export.test.ts` (dòng ~66 và ~78-83) để tự kết luận ngoại lệ có lý do giấy phép chính đáng và bị khoá đủ chặt — không dựa vào kết luận "không tautological" của giám khảo làm bằng chứng thay thế.

## Analyst

Baseline values are carried forward unchanged from Round 10 per the re-verification instruction (this round's diff — the `slugify()` Đ/đ fix in `format.ts` plus its two test files — does not touch any of the 15 eval's own assertion surface, confirmed by grep + direct read of `export.test.ts`, so it does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Round 11: merge commit `637ae403` (main → branch) adds `src/lib/format.ts`'s Đ/đ + Ð/ð slugify fix and its two test files; none of the 15 machine evals' own assertion surface touches `slugify()` (confirmed by reading `export.test.ts` — it locks attribution/no-extra-symbol-layer only), so all 15 discriminate the same way as before. All 15 machine evals RE-RUN fresh (not re-pinned) — 15/15 green, `npm test` full = 499 passed | 7 skipped (506), matching the round's expected baseline exactly. Verdict is PENDING-JUDGMENT: not from any failed eval, but because repo policy `be57c21`/PR #25 withdraws every agent-written `human_override` today, including ones inherited from Round 10 — E16 and E17 both drop from PASS(judge)+override to UNCERTAIN with `human_override` left empty, each carrying a `required_evidence` line for the human to act on directly.

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
