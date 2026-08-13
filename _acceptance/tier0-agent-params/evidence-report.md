---
schema_version: 2
feature_slug: tier0-agent-params
verdict: PASS
failed_evals: []
reason: "Vòng 15 ghim lại ở baf27d3: 20/20 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: baf27d3b94673ba706de51fdd9e45776224f0bc2
human_signoff:
---

# Evidence Report: tier0-agent-params

## Vòng 15 — ghim lại ở `baf27d3`; 20/20 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 20/20.

**Gói này là lý do vòng verify tồn tại.** Chạy tại HEAD trước khi ghim, `tier0-invariants` **ĐỎ** — 2 vi phạm I3: sổ chốt thiếu `assertBasemap`/`assertHighlightCount`, và hợp đồng Zod thêm 4 tên trường. I3 là bộ dò trôi hai chiều và nó làm đúng việc: phiên này nới bề mặt input mà sổ chưa được xem lại. Nếu vòng này không chạy, chữ ký sẽ đặt lên một `verdict: PASS` trong khi thước đo riêng của gói đang đỏ.

Bản vá `4a1bea0` là **xem lại**, không phải ghim cho xanh. Hai chốt mới được đăng ký kèm ghi chú `assertBasemap` canh MÔI TRƯỜNG chứ không chỉ đầu vào, và `assertHighlightCount` là chốt dùng chung nên ghim cả hai nhãn. Bốn "trường Zod mới" tách làm hai loại: `basemap`/`recipe` là trường thật ⇒ ghim; `RECIPE_TOOL_SHAPE`/`shape` chỉ là chú thích kiểu TypeScript bị bộ trích khoá bắt nhầm ⇒ bóc trước khi trích, chứ ghim vào sổ sẽ mở đường cho một trường thật tên `shape` sau này lọt qua.

Đối chứng âm sau khi vá (chèn rồi khôi phục `tools.ts`, cây sạch sau đó): trường mới `smuggled` ⇒ FAIL; trường mới tên `shape` ⇒ FAIL (phép bóc KHÔNG làm nó mù — đây là rủi ro chính của bản vá); xoá `bearing` ⇒ FAIL.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 14 — I3 thôi là danh sách sáu tên cứng

Ghim ở `ace12a0`. Cả 20 eval chạy lại tươi, **20/20 thoát 0**: `resolveConfig.test.ts` 65 ·
`tools.test.ts` 65 · `http.test.ts` 62 · `jobRunner.test.ts` 28 · `motionCompiler.test.ts` 34 ·
`geocode.test.ts` 26 · `tier0-invariants` all invariants hold · `npm test` 547/10/0 · `test:mcp` 15.

**E18 — I3 nay là một SỔ ĐĂNG KÝ, không phải danh sách sáu tên.** Vòng 13 trượt vì hai trường màu do
chính gói này thêm — `highlight.regions[].color` và `highlight.points[].color` — không nằm trong danh
sách sáu tên ghim cứng, nên gỡ guard cho chúng vẫn để script exit 0. `259204c` viết lại I3 thành bốn
mệnh đề: (a) tập chốt suy ra từ `function assert…` trong `resolveConfig.ts` phải BẰNG sổ đăng ký
(14 chốt), (b) mỗi chốt phải thật sự được GỌI, (c) mỗi chốt nhận nhãn phải còn MỌI nhãn đã đăng ký ở
call site, (d) 53 tên trường Zod suy ra từ `tools.ts` phải bằng tập ghim. Đúng ba đột biến `expected`
khai, chạy vòng này:

    # (a) gỡ hai lời gọi assertColor cho hai trường màu của chính gói này
    $ npx tsx _acceptance/tier0-agent-params/scripts/tier0-invariants.ts   -> exit 1
    FAIL I3  assertColor còn giữ nhãn 'highlight.regions[].color': false
    FAIL I3  assertColor còn giữ nhãn 'highlight.points[].color': false
    tier0-invariants: 2 violation(s)

    # (b) thêm trường Zod mới `opacity` vào renderMapShape
    -> exit 1   FAIL I3  hợp đồng Zod đổi trường: thêm [opacity], bỏ [] — xem lại I3 rồi ghim lại

    # (c) thêm guard `assertOpacity` chưa đăng ký
    -> exit 1   FAIL I3  sổ chốt lệch mã: chưa đăng ký [assertOpacity], đăng ký thừa []

Mệnh đề (c) là thứ đóng đúng lỗ vòng 13: một chốt dùng chung vẫn được tính là "được gọi" trong khi mất
ba trên bốn call site — nay mỗi nhãn được đếm riêng.

**Nợ còn lại, ghi nhận chứ không đánh trượt** (và đã được `expected` khai thẳng là NOT claimed): I3
không suy ra ánh xạ trường → chốt. Một trường MỚI đi kèm một chốt MỚI sẽ qua được cả bốn mệnh đề mà
không có bằng chứng chốt ấy chạy cho đúng trường ấy. Mệnh đề (d) chặn nó ở mức "không lọt vào mà I3
không được xem lại", chứ không chứng minh liên kết.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 13 — năm eval của vòng 11 đã vá thật; lộ ra E18

Ghim ở `d84857a` (tổ tiên của HEAD). Cả 20 eval chạy lại tươi, **20/20 thoát 0**:
`resolveConfig.test.ts` 65 · `tools.test.ts` 65 · `http.test.ts` 61 · `jobRunner.test.ts` 28 ·
`motionCompiler.test.ts` 34 · `geocode.test.ts` 26 · `tier0-invariants` all invariants hold ·
`npm test` 542/10/0 · `test:mcp` 13.

**Năm eval bị REJECT vòng 11 nay đứng vững.** E9: 13 theme, mỗi theme có `id`/`name`/`dark`, và bảng
15 khoá được so ĐỒNG NHẤT trên cả 13 (`tools.test.ts:299-325`) — không còn chỉ `themes[0]`, và số
khoá được đếm thật. E10: bảng hai chiều 21 mục (`:394-426`) cùng phép kiểm `Object.hasOwn` có/không
(`:374-379`) — mệnh đề "KEY ABSENT trên layout không in" nay có khẳng định vắng-mặt thật. E8: hai ca
input xấu ở phần tử THỨ HAI (`resolveConfig.test.ts:376-388` và `:408-420`) mỗi ca khẳng định CẢ
`resolveLocation` LẪN `resolveBoundary` `.not.toHaveBeenCalled()`. E15: nửa determinism nay có ca
thật — `Object.hasOwn(k,'bearing') === false` cộng double-compile `toEqual` (`:84-105`). E20: bảy
trường, mỗi trường một phép so BYTE đổi-đúng-một-trường, neo bởi phép so "cùng config ⇒ trùng byte"
(`renderFrame.test.ts:83`); phần "NOT claimed" ở đuôi cũng đúng chữ.

### E18 TRƯỢT — lượng từ "every" không được canh

`expected` viết: *"I3 **every new Zod field** has a runtime assert that is both defined AND called"*.
`tier0-invariants.ts:77-84` kiểm một danh sách GHIM CỨNG sáu tên (`assertLayers`, `assertDetail`,
`assertFont`, `assertMarkerSize`, `assertMarkerIcon`, `assertPitch`) cộng phép thử modulo-360 cho
bearing (`:94`). Nó không tính ra tập "trường Zod mới" từ mã, nên:

- Thêm một trường Zod thứ bảy KHÔNG guard ⇒ script vẫn thoát 0. Lượng từ "every" không có sức phân
  biệt nào.
- Ngay ở hiện tại, mệnh đề cũng SAI về sự kiện: `highlight.regions[].color` và
  `highlight.points[].color` là trường mới của chính gói này (AC-4, AC-5 của `contract.md`) và có
  guard thật — `assertColor` ở `resolveConfig.ts:563` và `:577` — nhưng KHÔNG có mặt trong
  `REQUIRED_ASSERTS`, tức I3 chưa từng nhìn tới chúng.

Sáu tên nó có kiểm thì đều `defined && called` thật (chạy script xác nhận). Đây đúng lớp lỗi mà vòng
1 của `anchors-camera` đã từng đánh trượt E2 ("MỌI ca" trong khi script kiểm `>= 1"), và cách sửa
cũng y hệt: nói đúng cái được đo — "sáu guard được nêu tên đều được định nghĩa VÀ được gọi" — hoặc
bổ sung `assertColor` cùng một phép quét thật sự liệt kê trường Zod.

## Vòng 12 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E8, E9, E10, E15, E20].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

`verified_commit` cập nhật lên `b4c1d50c`.

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

**E9 (AC-9) — "13 themes MỖI CÁI có dark + bảng màu 15 khoá" chỉ được kiểm trên `themes[0]`.**

`mcp-server/src/tools.test.ts:258-264`: `toHaveLength(13)`, rồi `themes[0]` `toMatchObject({id:
'midnight-blue', dark: true})`, `themes[0].colors.background` khớp `/^#/`, và
`Object.keys(themes[0].colors)).toContain('accent')`. **Không có phép đếm khoá nào** (nên "15
khoá" không được canh gác) và **không có vòng lặp qua 13 theme** (nên "mỗi cái" không được
canh gác). Sự thật hôm nay đúng — nhưng một hồi quy bỏ một khoá bảng màu ở CẢ 13 theme vẫn
xanh. AC-9 còn đòi trường `name`; không khẳng định nào chạm `name`.

**E10 (AC-10) — "KEY ABSENT (not undefined) trên layout không in" không tồn tại như một khẳng định.**

Quét `mcp-server/src/tools.test.ts` cho `print` ra đúng hai dòng: `:266` (tiêu đề ca test) và
`:273` (`expect(a4.print).toEqual({w:210,h:297,unit:'mm'})`) — cả hai đều là nửa CÓ MẶT. **Không
có một khẳng định vắng-mặt nào.** Mà "key absent, not undefined" chính là mệnh đề khó và là lý
do mệnh đề đó được viết ra. Phần "aspect/category đúng per entry" cũng nói quá: 21 mục tồn
tại, category được khẳng định cho 7, aspect cho 1 (`:270`).

**E8 (AC-8), E15 (AC-13), E20 (AC-?) — ghi nhận từ lane kiểm phụ, cùng lớp lỗi.**

- **E8**: `expected` nói cả `resolveBoundary` **và** `resolveLocation` đều `.not.toHaveBeenCalled()`
  ("zero Nominatim requests"). Chỉ nửa region làm vậy (`resolveConfig.test.ts:320`); hai nửa
  point dùng `not.toHaveBeenCalledWith('Bến Thành Market', …)` (`:364`, `:391`) và chú thích của
  chính ca test nói "Only the base-location lookup should have fired" — tức KHÁC không.
- **E15**: nửa DETERMINISM ("config không bearing biên dịch ra đúng cùng một object — early
  return, không dựng lại script") không có ca test nào.
- **E20**: `expected` nói lane tích hợp chứng minh "các tham số mới chạm tới pixel thật".
  `layers`/`detail`/`font` — ba tham số đầu bảng của hợp đồng này — không xuất hiện trong bất
  kỳ tệp nào của `test:mcp`.

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 10 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Trong bán kính: E9-E11 và E16 (`tools.ts`), E12 (`http.ts`), E13 (`jobRunner.ts`), E19 (bộ tổng), E20 (bộ tích hợp). `tier0-invariants.ts` soi cả ba bề mặt và vẫn xanh — gói anchors THÊM trường vào `resolved`, không đổi hình dạng tham số Tier-0._
_Round 10 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_`executors.test.resolve_config` nằm trong tập eval của hợp đồng này nên được chạy lại. `tier0_invariants` vẫn giữ đủ, gồm mọi guard tham số vừa ĐỊNH NGHĨA vừa ĐƯỢC GỌI._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 9 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E12, E19, E20); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 8 — re-verification triggered by `fix/mcp-auth` landing on top of Round 7's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

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
| E12 | AC-11 | test | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-12 | test | PASS |
| E15 | AC-13 | test | PASS |
| E16 | AC-14 | test | PASS |
| E17 | AC-15 | test | PASS |
| E18 | AC-11 | script | PASS |
| E19 | AC-1 | test | PASS |
| E20 | AC-11 | test | PASS |

## Evidence

- eval: E1
  run_id: tier0-agent-params-r14-e1-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E2
  run_id: tier0-agent-params-r14-e2-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E3
  run_id: tier0-agent-params-r14-e3-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: tier0-agent-params-r14-e4-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: tier0-agent-params-r14-e5-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: tier0-agent-params-r14-e6-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-6 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E7
  run_id: tier0-agent-params-r14-e7-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-7 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E8
  run_id: tier0-agent-params-r14-e8-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E9
  run_id: tier0-agent-params-r14-e9-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E10
  run_id: tier0-agent-params-r14-e10-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E11
  run_id: tier0-agent-params-r14-e11-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E12
  run_id: tier0-agent-params-r14-e12-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E13
  run_id: tier0-agent-params-r14-e13-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E14
  run_id: tier0-agent-params-r14-e14-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E15
  run_id: tier0-agent-params-r14-e15-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T12:17:36Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.motion_compiler` → thoát 0 · Test Files 1 passed (1); Tests 34 passed (34)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.motion_compiler` → thoát 0 · Test Files 1 passed (1); Tests 34 passed (34)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-13 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E16
  run_id: tier0-agent-params-r14-e16-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-14 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E17
  run_id: tier0-agent-params-r14-e17-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geocode
  verified_at: 2026-08-07T12:17:53Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.geocode` → thoát 0 · Test Files 1 passed (1); Tests 26 passed (26)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.geocode` → thoát 0 · Test Files 1 passed (1); Tests 26 passed (26)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-15 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 26 passed (26) — present and passing.

- eval: E18
  run_id: tier0-agent-params-r14-e18-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.tier0_invariants
  verified_at: 2026-08-07T12:18:13Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `script.tier0_invariants` → thoát 0 · tier0-invariants: all invariants hold (sổ 14 chốt khớp mã, 53 tên trường Zod khớp bản ghim)
    **Vòng 13 @ d84857a — đo lại tươi:** `script.tier0_invariants` → thoát 0 · tier0-invariants: all invariants hold
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. I1-I3 ok — tier0-invariants: all invariants hold — present and passing.

- eval: E19
  run_id: tier0-agent-params-r14-e19-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E20
  run_id: tier0-agent-params-r14-e20-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T12:21:00Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 15 passed (15)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 3 passed (3); Tests 12 passed (12); Duration 42.43s — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E19, E20.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 14 (chạy lại ở `ace12a0` sau khi I3 được vá): cả 20 eval chạy lại tươi, 20/20 thoát 0. **PASS.**
E18 hết trượt — `259204c` thay danh sách sáu tên cứng bằng sổ đăng ký 14 chốt + đếm nhãn theo từng
call site + ghim 53 tên trường Zod. Ba đột biến `expected` khai đều exit 1: gỡ hai lời gọi
`assertColor` (2 vi phạm), thêm trường Zod `opacity`, thêm guard `assertOpacity` chưa đăng ký. Nợ ghi
nhận (đã khai NOT claimed): I3 không suy ra ánh xạ trường → chốt. `human_signoff` để rỗng.

Vòng 13 (chạy lại ở `d84857a` sau khi năm eval của vòng 11 được vá): cả 20 eval chạy lại tươi, 20/20
thoát 0. **Năm eval bị REJECT vòng 11 nay đứng vững**: E9 (13 theme, bảng 15 khoá so đồng nhất trên
CẢ 13), E10 (bảng 21 mục hai chiều + `Object.hasOwn` có/không), E8 (hai ca phần tử-thứ-hai, mỗi ca
khẳng định CẢ `resolveLocation` LẪN `resolveBoundary` không được gọi), E15 (nửa determinism có ca
thật: `Object.hasOwn(k,'bearing') === false` + double-compile `toEqual`), E20 (bảy trường, mỗi trường
một phép so BYTE đổi-đúng-một-trường, neo bởi "cùng config ⇒ trùng byte"). Cận trên `pitch` 60 được
kiểm lại và ĐÚNG ở cả hai tầng — không phải khiếm khuyết, đúng như ghi chú của vòng trước.
**REJECT trên [E18]**: `expected` khai "I3 every new Zod field has a runtime assert", nhưng
`tier0-invariants.ts:77-84` chỉ kiểm danh sách ghim cứng sáu tên; một trường Zod mới không guard sẽ
để script xanh, và ngay hiện tại hai trường màu mới của chính gói này
(`highlight.regions[].color` `resolveConfig.ts:563`, `highlight.points[].color` `:577`, đều do
`assertColor` gác) KHÔNG nằm trong `REQUIRED_ASSERTS`. Cùng lớp lỗi với E2 vòng 1 của
`anchors-camera` ("MỌI ca" vs `>= 1`).

Vòng 11 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 20 eval chạy lại tươi, 20/20 thoát 0. **REJECT trên [E8, E9, E10, E15, E20]** — năm eval nói quá phần được khẳng định: E9 ("mỗi theme" + "15 khoá" chỉ kiểm `themes[0]`, không đếm khoá), E10 ("KEY ABSENT trên layout không in" không có khẳng định vắng-mặt nào; category 7/21, aspect 1/21), E8 ("zero Nominatim requests" — chỉ nửa region dùng `.not.toHaveBeenCalled()`, hai nửa point còn lại kỳ vọng lời gọi cơ sở CÓ xảy ra), E15 (nửa determinism không có ca test), E20 ("tham số mới chạm pixel thật" — `layers`/`detail`/`font` không xuất hiện trong bất kỳ tệp nào của `test:mcp`). Ghi nhận thêm, không đánh trượt: AC-11 đòi script được vọng lại kể cả ở nhánh degrade và nhánh quá cỡ, nhưng hai nhánh đó chỉ được E18/I2 gác bằng một phép quét MÃ NGUỒN, không phải bằng hành vi.

Vòng 10 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `tools.ts`/`http.ts`/`jobRunner.ts`. Cả 20 eval chạy lại tươi — 20/20 xanh. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 9 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E12, E19, E20 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

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
