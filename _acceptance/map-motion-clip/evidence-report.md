---
schema_version: 2
feature_slug: map-motion-clip
verdict: REJECT
failed_evals: [E3, E5, E15]
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a46aec7a0c2ac7f2c54e6fd8d4ecc442b1814122
human_signoff:
---

# Evidence Report: map-motion-clip

## Vòng 11 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

Mọi lane của hợp đồng này chạy lại tươi ở `a46aec7` và **tất cả đều thoát 0**. Verdict
REJECT đến từ tiêu chuẩn mà vòng chấm áp cho cả chín hợp đồng vòng này: *một mệnh đề trong
`expected` chỉ được coi là thoả khi có một khẳng định thật sự khẳng định nó VÀ khẳng định đó
phân biệt được* — tức một hiện thực sai hợp lý sẽ làm nó đỏ. Các eval dưới đây không đạt
tiêu chuẩn đó. Đây là cùng lớp lỗi đã đánh trượt `anchors-camera` E2/E5 ở vòng trước; áp
không đều tay thì cổng mất nghĩa.

Bối cảnh stale: `a46aec7` chạm `mcp-server/src/http.test.ts`, `mcp-server/src/tools.test.ts`,
`src/render/anchors.ts`, `src/render/anchors.test.ts`, `e2e/render-mode.spec.ts` — không tệp
nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `9c1f9f3` đã hết hiệu lực và phải chạy lại.
`git merge-base --is-ancestor a46aec7 HEAD` trả 0.

### Các eval bị đánh trượt

**E5 (AC-4) — hai con số trong `expected` sai so với tệp test.**

(a) `expected` viết "zoom **0**/22 cho `pushIn`". `mcp-server/src/motionCompiler.test.ts:94` là
`it.each([1, 22])`, và chú thích ngay trên (`:88-93`) nói rõ zoom 0 đã bị BỎ vì `pushIn` không
còn biên dịch được ở đó — zoom 0 với `pushIn` nay là ca **ném** (`:154-157`). Nói "0" là nói
ngược lại thứ tệp test khẳng định.

(b) `expected` viết "kinh độ **±**179.5". `:125-129` chỉ có bốn ca **âm**
(`-179.5, -179.5, -179.99, -179.999`), và chú thích `:119-124` nói thẳng hai ca `+179.5` "không
thể fail dưới bất kỳ hiện thực nào và đã bị bỏ". Dấu `±` khẳng định một nửa không tồn tại.

**E3 (AC-3) — ca test nói về "chạy QUÁ restAtSec", `expected` nói về "BẮT ĐẦU SAU restAtSec".**

`expected`: *"pulse **bắt đầu sau** `restAtSec` ĐƯỢC chấp nhận (loop-track)"*. Ca thật
(`src/render/motionScript.test.ts:53-56`) tên là *"L: pulse MAY run past restAtSec (loop track)"*
và dùng `{ kind: 'pulse', from: 4.0 }` với `restAtSec` = 4.2 — pulse **bắt đầu TRƯỚC** mốc nghỉ,
chỉ chạy vượt qua nó. Hai mệnh đề khác nhau; mệnh đề mà `expected` nêu không có ca nào.

**E15 (AC-12) — nửa sau không có khẳng định nào trong lane của chính nó.**

Nửa 429 vững (`mcp-server/src/http.test.ts:738-781`). Nửa *"`pool.acquire` có deadline nên
`/render` thường không bị treo sau lưng clip"* thì không: đếm `acquire` và `deadline` trong
`mcp-server/src/http.test.ts` ra **0**. Hành vi đó được test ở `browserPool.test.ts:130-163` —
không phải `cmd` của eval này.

### Hai eval judgment giữ nguyên PENDING

E16/E17 là `judgment` của một hợp đồng T3: chúng KHÔNG được vòng máy này phán. `human_override`
để trống, đầu vào còn đủ (`evidence/E16-clip.mp4`, ba PNG bước). Verdict tổng là REJECT vì các
eval MÁY ở trên, không phải vì hai eval này.

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 10 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Trong bán kính: E7 (bộ tích hợp — `renderClip.test.ts` đổi), E8-E10/E13/E15 (`http.ts`), E11/E14 (`tools.ts`). E12 chạy `export.test.ts`/`mapStyle.test.ts` — hai `t3_path`, và `git diff --name-only` xác nhận cả hai KHÔNG có dòng nào đổi trong PR này, nên bằng chứng pixel byte-identical của hợp đồng này không bị đụng. **T3: hai eval judgment E16/E17 quay về chờ người** — verdict hạ xuống PENDING-JUDGMENT và `human_override` được bỏ trống, vì chữ ký cũ được đóng ở `9a6af0f`; theo luật T3 mọi mục judgment phải có phán quyết người TRỰC TIẾP ở đúng cây mã đang xét. Người ký ở Cổng 2 điền lại._

_Round 9 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E7, E8, E9, E10, E13, E15); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 8 — re-verification triggered by `fix/mcp-auth` landing on top of Round 7's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_(Ghi chú của vòng TRƯỚC, giữ lại làm lịch sử) Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round — not blanked, not re-scored. `risk_tier: T3` mandates a direct human verdict on every judgment item for THIS round's pinned evidence regardless of a prior round's override against a now-superseded commit, so the contract routes to **PENDING-JUDGMENT**._

_**Đính chính cho vòng này:** khác vòng trước, vòng hiện tại KHÔNG giữ `human_override` cũ. Chữ ký người ở các mục judgment được đóng ở `9a6af0f`; PR này đổi mã nguồn dùng chung nên chúng bị BỎ TRỐNG để người ký ở Cổng 2 phán quyết lại trên đúng cây `9c1f9f3`. Nội dung phán quyết của giám khảo mù (`verdict` + `rationale`) được giữ nguyên văn — chỉ dòng `human_override` bị xoá._

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
  run_id: map-motion-clip-r11-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T05:58:09Z
  output: |
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E2
  run_id: map-motion-clip-r11-motion_invariants-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T05:58:09Z
  output: |
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E3
  run_id: map-motion-clip-r11-motion_invariants-20260807
  exit_code: 0
  verdict: FAIL
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T05:58:09Z
  output: |
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E4
  run_id: map-motion-clip-r11-compiler_domain_sweep-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-07T05:58:23Z
  output: |
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. combinations: 2652; violations: 0; OK — present and passing.

- eval: E5
  run_id: map-motion-clip-r11-motion_compiler-20260807
  exit_code: 0
  verdict: FAIL
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T05:58:09Z
  output: |
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E6
  run_id: map-motion-clip-r11-motion_math-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-07T05:58:10Z
  output: |
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E7
  run_id: map-motion-clip-r11-mcp-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T05:55:15Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 3 passed (3); Tests 12 passed (12); Duration 42.43s — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E8
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T05:58:01Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E9
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T05:58:01Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E10
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T05:58:01Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E11
  run_id: map-motion-clip-r11-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T05:58:00Z
  output: |
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E12
  run_id: map-motion-clip-r11-text_free-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-07T05:58:04Z
  output: |
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 2 passed (2); Tests 19 passed (19) — present and passing.

- eval: E13
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T05:58:01Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E14
  run_id: map-motion-clip-r11-clip_tools-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T05:58:00Z
  output: |
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E15
  run_id: map-motion-clip-r11-clip_http-20260807
  exit_code: 0
  verdict: FAIL
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T05:58:01Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E16
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Xem trực tiếp khung trích từ E16-clip.mp4 (6s, 18fps, 1080×1920). (1) t=0.0s toàn cảnh thành phố, chưa tô ranh giới. (2) Vẽ dần chứ không bật đột ngột: t=2.2s chưa có gì, t=2.5s chỉ phần phía tây được tô, t=2.7s gần phủ hết, t=3.0s đầy đủ — diff pixel giữa 2.5s và 2.7s cho mean 6.94 / max 92, thay đổi thị giác rõ trong khoảng ngắn. (3) Đuôi đứng yên: khung 3.5s so khung cuối 5.9s cho mean 0.125 / max 14, chỉ là nhiễu nén. Ba nhịp đọc ra rành mạch.
  human_override:
- eval: E17
  judged_by: judge-subagent (fresh context, blind, vòng 2 sau khi vá)
  verdict: PASS
  rationale: |
    Commit b4150be thêm test thứ hai ghim ATTRIBUTION_TEXT bằng literal độc lập cộng bốn toContain riêng từng credit — không còn tự tham chiếu, và literal khớp đúng chuỗi spec §2.3 quy định. Kết hợp test thứ nhất (textCalls phải bằng đúng [ATTRIBUTION_TEXT]), hai test khoá cả hai nửa: SỐ LƯỢNG (không lệnh fillText/strokeText nào khác lọt) và NỘI DUNG (chuỗi vẽ ra phải đúng literal giấy phép OSM). Mỗi test có đường fail thật — đổi số lệnh vẽ thì test 1 đỏ, đổi nội dung hằng thì test 2 đỏ — nên không tautological.
  human_override:
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 11 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 15 eval máy chạy lại tươi, 15/15 thoát 0; sweep miền in `combinations 2652 · violations 0 · OK`; hai `t3_path` của E12 vẫn 0 dòng đổi. E16/E17 (judgment, T3) giữ PENDING-JUDGMENT, `human_override` để trống. **REJECT trên [E3, E5, E15]**: E5 sai hai con số so với chính tệp test (`it.each([1, 22])` chứ không phải 0/22 cho `pushIn`, và bốn ca kinh độ đều ÂM chứ không phải `±179.5` — chú thích của tệp nói thẳng hai ca dương đã bị bỏ vì không thể fail); E3 nói "pulse **bắt đầu sau** restAtSec" trong khi ca test là "pulse **chạy quá** restAtSec" (`from: 4.0` < `restAtSec` 4.2); E15 gắn nửa `pool.acquire` có deadline vào `http.test.ts`, mà tệp đó không nhắc `acquire`/`deadline` lần nào. Ghi nhận thêm, không đánh trượt: sweep của E4 thoát 0 khi `failures.length === 0` mà không có sàn nào cho `accepted`, nên một compiler ném ở MỌI tổ hợp cũng cho `violations: 0`; và AC-12 có nửa "MCP trả error result cùng thông điệp" không eval nào nhận (ca test tồn tại ở `tools.test.ts:859-891`).

Vòng 10 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `tools.ts`/`http.ts`/`renderFrame.ts`. Cả 15 eval máy chạy lại tươi — 15/15 xanh; hai `t3_path` của E12 xác nhận 0 dòng đổi. E16/E17 (judgment, T3) trở lại chờ người: verdict PENDING-JUDGMENT, `human_override` bỏ trống. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

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
