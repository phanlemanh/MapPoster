---
schema_version: 2
feature_slug: motion-tools-cost
verdict: PASS
failed_evals: []
reason: "Vòng 11 ghim lại ở baf27d3: 20/20 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: cae52de592f604d5f39e8d761d14d3d36a8d5858
human_signoff: manh — 2026-08-14 (commit tay của người duyệt, chỉ chạm dòng human_signoff)
---

# Evidence Report: motion-tools-cost

### Re-pin lần 1 — 2026-08-19, do thêm src/components/MapView.test.tsx (tệp test đầu tiên của thành phần bản đồ web) — src/ không thuộc danh sách miễn trừ nên mọi hồ sơ ghim trước đó hết hiệu lực
run_id: repin-20260819-cae52de
sha: cae52de592f604d5f39e8d761d14d3d36a8d5858 · suites: 3 lệnh exit 0 (npm test 614 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Chữ ký người GIỮ NGUYÊN — làn máy chạy tươi và xanh ở mốc mới, và thay đổi làm hết hạn là một tệp test, không chạm mã sản phẩm.

## Vòng ghim lại ở `f557763` — thêm `scripts/check-deploy-drift.sh`

Kích hoạt: PR #45 thêm **một** tệp, `scripts/check-deploy-drift.sh`. Nó KHÔNG thuộc `t1_skip_globs` — danh sách đó chỉ miễn hai đường dẫn CHÍNH XÁC của bộ gate vendored, không phải `scripts/**` — nên mọi hồ sơ ghim ở `baf27d3` hết hiệu lực theo commit. **Không nới danh sách miễn trừ để lách**: sửa cái thước cho lọt thay đổi của chính mình là đúng thứ cổng này sinh ra để chặn. Chạy lại verify thay vì đổi luật.

Cả 188 eval máy của 12 gói chạy lại tươi ở commit này, **188/188 thoát 0**.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Vòng 11 — ghim lại ở `baf27d3`; 20/20 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 20/20.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 10 — E3 nay là ba nhánh thật

Ghim ở `ace12a0`. Cả 20 eval chạy lại tươi, **20/20 thoát 0**: `tools.test.ts` 65 ·
`resolveConfig.test.ts` 65 · `encodeAnimation.test.ts` 9 · `jobRunner.test.ts` 28 · `http.test.ts` 62 ·
`npm test` 547/10/0 · `test:mcp` 15 · `motion-tools-invariants` mọi bất biến còn giữ.

**E3 — 'ba nhánh' nay đúng là ba nhánh.** Vòng 9 trượt vì `expected` khai "ba nhánh check khác nhau"
trong khi fps-ngoài-dải và camera-rỗng cùng chết ở MỘT lời gọi `motionScriptSchema.parse` — lane chỉ có
hai tín hiệu nhánh độc lập. `ef4b90b` viết lại `expected` cho khớp sự thật (hai ca Zod được gọi tên là
hai ca CÙNG một nhánh) và thêm ca thứ tư chạm nhánh thứ ba: keyframe cuối SAU `restAtSec`, ca duy nhất
qua được cả Zod lẫn bất biến R nên là ca duy nhất tới được bất biến O. Phân loại nhánh đo bằng LỖI NÉM
RA (`/^R:/`, `/^O:/`), không đoán theo tên ca. Kiểm chứng bằng đúng đột biến `expected` nêu:

    src/render/motionScript.ts:116   gỡ riêng chốt O ("last camera keyframe ... after restAtSec")
    $ npx vitest run mcp-server/src/tools.test.ts   -> exit 1
    FAIL  compile_motion (PR #3) > TỪ CHỐI script thô sai khuôn — không echo lại thứ caller đưa vào
    AssertionError: keyframe cuối sau restAtSec (bất biến O): expected undefined to be true

Chốt R và chốt Zod đứng nguyên trong đột biến đó, nên lane đỏ CHỈ vì nhánh O — bằng chứng nhánh thứ ba
là nhánh thật, không phải cùng một lời gọi `parse` đội tên khác.

**Mười chín eval còn lại không đổi mệnh đề nào** và không cái nào bị hồi quy: `tools.test.ts` giữ 65 ca
(vá E3 sửa tại chỗ, không cộng ca), `http.test.ts` lên 62 do hợp đồng `anchors-camera` cộng thêm.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 9 — E1/E18 đã vá đúng; E3 đếm nhầm số nhánh

Ghim ở `d84857a` (tổ tiên của HEAD). Cả 20 eval chạy lại tươi, **20/20 thoát 0**: `tools.test.ts` 65 ·
`resolveConfig.test.ts` 65 · `encodeAnimation.test.ts` 9 · `jobRunner.test.ts` 28 · `http.test.ts` 61 ·
`npm test` 542/10/0 · `test:mcp` 13 · `motion-tools-invariants` mọi bất biến còn giữ.

**Hai eval bị REJECT vòng 7 nay đúng.** E1: `restAtSec` không còn nằm suông trong danh sách trường —
`tools.test.ts:657` đo nó bằng chính hằng `2.8` của caller, và cả bảy trường đều có khẳng định riêng
(`:629-639`), `frames = round()` ở `:632`. E18: mệnh đề đã thu về đúng cái lane đo — `seen` bằng
`['high']` (`http.test.ts:578`), `clipError` undefined (`:577`), và nửa suppression `['high',
undefined]` (`:587`); đoạn "KHÔNG khẳng định ở lane này" trong `expected` là chính xác.

### E3 TRƯỢT — "BA nhánh check khác nhau" thật ra là HAI

`expected` viết: *"ba script sai khuôn ở **BA nhánh check khác nhau** (fps ngoài dải Zod, restAtSec
vi phạm bất biến R, camera rỗng)"*. Đường đi thật: `scriptMotionParamSchema = z.object({ script:
z.unknown() })` (`motionCompiler.ts:251`) cho script đi qua nguyên vẹn, rồi `resolveMotion` gọi
`validateMotionScript` (`:216`), và dòng ĐẦU TIÊN trong đó là `motionScriptSchema.parse(value)`
(`src/render/motionScript.ts:101`). Schema ấy chứa CẢ `fps: z.number().int().min(12).max(30)`
(`:58`) LẪN `camera: z.array(keyframe).min(1)` (`:61`). Nghĩa là ca 1 (`fps: 999`,
`tools.test.ts:670`) và ca 3 (`camera: []`, `:675`) chết ở CÙNG một lời gọi, cùng `catch`, cùng đường
`z.prettifyError` (`motionCompiler.ts:493`). Chỉ ca 2 (`restAtSec: 5.9`, `:673`) mới ở nhánh khác —
khối bất biến R (`motionScript.ts:104-106`).

Phép thử: gỡ `motionScriptSchema.parse` ⇒ ca 1 và ca 3 cùng đỏ (MỘT tín hiệu, không phải hai); gỡ
khối R ⇒ chỉ ca 2 đỏ. Lane có hai tín hiệu nhánh độc lập. Chú thích của chính tệp test cũng chỉ nhận
hai nhánh: `:672` viết *"restAtSec … nhánh check KHÁC hẳn nhánh Zod ở trên"*, còn `:674` giải thích
`camera rỗng` bằng lý do ngữ nghĩa chứ không hề gọi nó là nhánh thứ ba. Mọi mệnh đề khác của E3 (đo
trên chính `compile_motion`, `isError`, không kèm `script`, lỗi là văn xuôi) đều đúng. Sửa một câu:
"ba luật khác nhau — hai ở tầng Zod, một ở tầng bất biến".

## Vòng 8 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E1, E18].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

`verified_commit` cập nhật lên `b4c1d50c`.

## Vòng 7 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

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

**E1 (AC-1) — `restAtSec` nằm trong danh sách `expected` nhưng không có khẳng định nào.**

`expected` viết: *"`compile_motion` trả `script`/`fps`/`durationSec`/**`restAtSec`**/`frames`/
`preset`/`resolved`; `frames = round(durationSec × fps)`"*.

Khối test (`mcp-server/src/tools.test.ts:430-437`) khẳng định `j.script.camera.length`,
`j.fps`, `j.durationSec`, `j.frames`, `j.preset`, `j.resolved.center`, và
`expect(render).not.toHaveBeenCalled()`. **`restAtSec` không xuất hiện trong bất kỳ khẳng
định nào của khối này** — chuỗi `restAtSec` gần đó (`tools.test.ts:~421`) là một trường ĐẦU
VÀO của request, không phải phép kiểm trên phản hồi. Xoá `restAtSec` khỏi phản hồi của
`compile_motion` thì cả 59 ca vẫn xanh.

**E18 (AC-?) — mệnh đề về nhánh `encodeQuality` không có khẳng định trong lane của chính nó.**

`expected` gắn giá trị của lane vào việc nó gác nhánh "sau khi nâng `encodeQuality` ra khỏi
`try` resolve — nhánh mà lỗi block-scope từng biến thành degrade im lặng". Quét
`mcp-server/src/http.test.ts` cho `encodeQuality`/`quality` ra **0 kết quả**. Lane này chứng
minh "không hồi quy" (57/57 xanh) — hoàn toàn hợp lệ như một regression guard — nhưng nó
không gác cái nhánh mà `expected` nêu tên. (Ghi nhận từ lane kiểm phụ, chưa tự đối chiếu
từng dòng như E1.)

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 6 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Trong bán kính: E1-E5, E10, E14, E15 (`tools.ts` đổi — thêm `resolvedOfClip(cfg, outcome)`), E17 (`jobRunner.ts` đổi), E18 (`http.ts` đổi), E19 (bộ tổng), E20 (bộ tích hợp). `motion-tools-invariants.ts` soi `tools.ts` và vẫn xanh: hình dạng khối chi phí không bị nhánh anchors chạm tới._
_Round 6 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_`executors.test.resolve_config` nằm trong tập eval của hợp đồng này nên được chạy lại. `motion_tools_invariants` vẫn giữ đủ, gồm I4 — không có tên chi phí trần trong tools.ts/encodeAnimation.ts._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 5 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E18, E19, E20); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 4 — re-verification triggered by `fix/mcp-auth` landing on top of Round 3's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

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
  run_id: motion-tools-cost-r10-e1-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E2
  run_id: motion-tools-cost-r10-e2-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E3
  run_id: motion-tools-cost-r10-e3-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E4
  run_id: motion-tools-cost-r10-e4-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E5
  run_id: motion-tools-cost-r10-e5-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E6
  run_id: motion-tools-cost-r10-e6-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-6 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E7
  run_id: motion-tools-cost-r10-e7-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-7 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E8
  run_id: motion-tools-cost-r10-e8-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E9
  run_id: motion-tools-cost-r10-e9-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E10
  run_id: motion-tools-cost-r10-e10-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E11
  run_id: motion-tools-cost-r10-e11-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T12:17:55Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.encode_animation` → thoát 0 · Test Files 1 passed (1); Tests 9 passed (9)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.encode_animation` → thoát 0 · Test Files 1 passed (1); Tests 9 passed (9)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 9 passed (9) — present and passing.

- eval: E12
  run_id: motion-tools-cost-r10-e12-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T12:17:55Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.encode_animation` → thoát 0 · Test Files 1 passed (1); Tests 9 passed (9)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.encode_animation` → thoát 0 · Test Files 1 passed (1); Tests 9 passed (9)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 9 passed (9) — present and passing.

- eval: E13
  run_id: motion-tools-cost-r10-e13-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.encode_animation
  verified_at: 2026-08-07T12:17:55Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.encode_animation` → thoát 0 · Test Files 1 passed (1); Tests 9 passed (9)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.encode_animation` → thoát 0 · Test Files 1 passed (1); Tests 9 passed (9)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-13 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 9 passed (9) — present and passing.

- eval: E14
  run_id: motion-tools-cost-r10-e14-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-14 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E15
  run_id: motion-tools-cost-r10-e15-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-15 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E16
  run_id: motion-tools-cost-r10-e16-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.motion_tools_invariants
  verified_at: 2026-08-07T12:18:11Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `script.motion_tools_invariants` → thoát 0 · motion-tools-invariants: mọi bất biến còn giữ
    **Vòng 9 @ d84857a — đo lại tươi:** `script.motion_tools_invariants` → thoát 0 · motion-tools-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-16 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. I1-I4 ok — motion-tools-invariants: moi bat bien con giu — present and passing.

- eval: E17
  run_id: motion-tools-cost-r10-e17-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E18
  run_id: motion-tools-cost-r10-e18-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E19
  run_id: motion-tools-cost-r10-e19-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E20
  run_id: motion-tools-cost-r10-e20-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T12:21:00Z
  output: |
    **Vòng 10 @ ace12a0 — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 15 passed (15)
    **Vòng 9 @ d84857a — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 3 passed (3); Tests 12 passed (12); Duration 42.43s — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E17, E18, E19, E20.

Baseline `n-a` (carried forward, could not be computed): E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 10 (chạy lại ở `ace12a0` sau khi E3 được vá): cả 20 eval chạy lại tươi, 20/20 thoát 0. **PASS.**
E3 hết trượt — `ef4b90b` thôi khai hai ca Zod là hai nhánh, và thêm ca chạm bất biến O (keyframe cuối
sau `restAtSec`) làm nhánh thứ ba thật; gỡ riêng chốt O ở `motionScript.ts:116` làm `tools.test.ts`
exit 1. `human_signoff` để rỗng.

Vòng 9 (chạy lại ở `d84857a` sau khi E1/E3/E10/E18 được sửa): cả 20 eval chạy lại tươi, 20/20 thoát
0. **E1 và E18 — hai eval bị REJECT vòng 7 — nay đúng**: E1 đo `restAtSec` bằng chính hằng `2.8` của
caller (`tools.test.ts:657`) thay vì liệt kê suông; E18 thu mệnh đề về đúng cái lane đo (`seen`
`['high']`, suppression `['high', undefined]`) và tự khai phần không khẳng định. E10 cũng đã quét đủ
6 phông × 5 trường (`tools.test.ts:465-494`). **REJECT trên [E3]**: `expected` khai "ba script sai
khuôn ở BA nhánh check khác nhau", nhưng `fps: 999` và `camera: []` cùng chết ở
`motionScriptSchema.parse` (`src/render/motionScript.ts:101`, schema có cả `fps` `:58` lẫn `camera`
`:61`) — cùng lời gọi, cùng catch, cùng đường prettify; chỉ `restAtSec: 5.9` mới ở nhánh bất biến R.
Chú thích của chính tệp test (`tools.test.ts:672`) cũng chỉ nhận HAI nhánh. Ghi nhận thêm, không đánh
trượt: I1 của E16 vẫn đo `git diff mergeBase..HEAD` trên nhánh HIỆN TẠI (`feat/anchors-camera`, 54
tệp đổi đều của PR khác), nên nó chỉ còn sức phân biệt khi chạy trên nhánh của chính gói motion-tools
— cảnh báo này có từ vòng 7 và chưa được xử lý.

Vòng 7 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 20 eval chạy lại tươi, 20/20 thoát 0. **REJECT trên [E1, E18]**: E1 liệt kê `restAtSec` trong danh sách trường mà `compile_motion` trả, nhưng khối test `tools.test.ts:430-437` không có khẳng định nào trên trường đó; E18 gắn giá trị của lane vào nhánh `encodeQuality`, mà `http.test.ts` không nhắc `encodeQuality`/`quality` một lần nào. Ghi nhận thêm, KHÔNG đánh trượt vì `expected` của chúng trung thực còn AC thì rộng hơn: AC-12 nêu preset `medium` mà `encodeAnimation.test.ts` chỉ khẳng định `veryfast`/`slow`; AC-15 nêu `renderMs > 0` mà test chỉ khẳng định `typeof … === 'number'`; AC-10 nêu `titleTracking` mà không khẳng định nào chạm nó. Và một cảnh báo về I1 của E16: nó đo `git diff mergeBase..HEAD` trên nhánh HIỆN TẠI, mà nhánh này là `feat/anchors-camera` — 39 tệp đổi đều thuộc PR khác, nên I1 hiện không còn đo diff của gói motion-tools nữa. Nó chỉ có sức phân biệt khi chạy trên nhánh của chính gói đó.

Vòng 6 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `tools.ts`/`http.ts`/`jobRunner.ts`. Cả 20 eval chạy lại tươi — 20/20 xanh. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 5 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E18, E19, E20 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 4: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
