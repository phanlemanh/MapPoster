---
schema_version: 2
feature_slug: road-routing
verdict: PASS
failed_evals: []
reason: "Vòng 9 ghim lại ở baf27d3: 16/16 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: c35ac43f50c7c3f6d12d07bdd71da1696d9584dc
human_signoff: manh — 2026-08-14 (commit tay của người duyệt, chỉ chạm dòng human_signoff)
---

# Evidence Report: road-routing

### Re-pin lần 2 — 2026-08-19, do thêm ba ca AC-8 vào mcp-server/src/resolveConfig.test.ts — mcp-server/ không thuộc danh sách miễn trừ
run_id: repin-20260819-c35ac43
sha: c35ac43f50c7c3f6d12d07bdd71da1696d9584dc · suites: 3 lệnh exit 0 (npm test 617 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Chữ ký người GIỮ NGUYÊN — thay đổi làm hết hạn là ba ca test mới, không chạm hành vi sản phẩm.

### Re-pin lần 1 — 2026-08-19, do thêm src/components/MapView.test.tsx (tệp test đầu tiên của thành phần bản đồ web) — src/ không thuộc danh sách miễn trừ nên mọi hồ sơ ghim trước đó hết hiệu lực
run_id: repin-20260819-cae52de
sha: cae52de592f604d5f39e8d761d14d3d36a8d5858 · suites: 3 lệnh exit 0 (npm test 614 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Chữ ký người GIỮ NGUYÊN — làn máy chạy tươi và xanh ở mốc mới, và thay đổi làm hết hạn là một tệp test, không chạm mã sản phẩm.

## Vòng ghim lại ở `f557763` — thêm `scripts/check-deploy-drift.sh`

Kích hoạt: PR #45 thêm **một** tệp, `scripts/check-deploy-drift.sh`. Nó KHÔNG thuộc `t1_skip_globs` — danh sách đó chỉ miễn hai đường dẫn CHÍNH XÁC của bộ gate vendored, không phải `scripts/**` — nên mọi hồ sơ ghim ở `baf27d3` hết hiệu lực theo commit. **Không nới danh sách miễn trừ để lách**: sửa cái thước cho lọt thay đổi của chính mình là đúng thứ cổng này sinh ra để chặn. Chạy lại verify thay vì đổi luật.

Cả 188 eval máy của 12 gói chạy lại tươi ở commit này, **188/188 thoát 0**.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Vòng 9 — ghim lại ở `baf27d3`; 16/16 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 16/16.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 8 — E8/E9 đã vá đúng chỗ; soi lại cả mười sáu

Ghim ở `ace12a0` (chính là HEAD). Cả 16 eval chạy lại tươi, **16/16 thoát 0**: `route.test.ts` 13 ·
`resolveConfig.test.ts` 65 · `routing-invariants` mọi bất biến còn giữ · `npm test` 547/10/0 ·
`test:mcp` 15.

**E8 — 'khoá cache mang PROFILE' nay được đo bằng chính tên khoá.** `ace12a0` thêm nửa
SHOULD-NOT-REFETCH thứ hai: car→moto. `OSRM_PROFILE` đưa cả `car` lẫn `moto` về `'driving'`, nên nếu
`route.ts:145` ghép khoá bằng `mode` thay vì `profile` thì lần gọi moto sẽ trượt cache. Đo vòng này:

    mcp-server/src/route.ts:145   `${base}|${profile}|${path}`  ->  `${base}|${mode}|${path}`
    $ npx vitest run mcp-server/src/route.test.ts   -> exit 1
    FAIL  khoá cache mang PROFILE (không phải mode): car→walk gọi lại, car→moto thì KHÔNG
    AssertionError: expected "vi.fn()" to be called 2 times, but got 3 times

Đúng nguyên văn chuỗi mà `expected` hứa. Ca car→walk một mình xanh với CẢ hai cách ghép, nên nửa
car→moto là thứ duy nhất phân biệt được — nay có.

**E9 — 'MỌI fetch mang signal' nay đo trên nhiều lời gọi.** `ace12a0` nâng ca lên bốn lời gọi đi qua
bốn đường khác nhau (mặc định, profile `'foot'`, toạ độ khác, có chặng `via`), mỗi lời gọi một khẳng
định riêng. Đo vòng này bằng đúng đột biến `expected` khai — cho riêng nhánh `via` gọi `fetch` không
signal:

    $ npx vitest run mcp-server/src/route.test.ts   -> exit 1
    FAIL  MỌI lời gọi mang AbortSignal — đo trên nhiều lời gọi khác nhau, không phải một
    AssertionError: lời gọi #3 không mang signal: expected undefined to be an instance of AbortSignal

Trên MỘT mẫu, đột biến đó vẫn xanh; trên bốn mẫu nó đỏ và chỉ đích danh lời gọi #3.

**Nợ còn lại, ghi nhận chứ không đánh trượt:** ở tầng bất biến, I3 của `routing-invariants` báo
"1 lời gọi fetch, tất cả mang signal" — hôm nay `route.ts` chỉ có ĐÚNG MỘT call site `fetch`, nên
"mọi" ở tầng tĩnh là mệnh đề trên tập một phần tử. Sức phân biệt thật nằm ở E9 (bốn lời gọi runtime);
nếu sau này `route.ts` mọc thêm nhánh fetch thứ hai, I3 mới thật sự có việc để làm.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 7 — E2 đã vá đúng chỗ; soi lại cả mười sáu

Ghim ở `d84857a` (tổ tiên của HEAD). Cả 16 eval chạy lại tươi, **16/16 thoát 0**: `route.test.ts` 13 ·
`resolveConfig.test.ts` 65 · `routing-invariants` mọi bất biến còn giữ · `npm test` 542/10/0 ·
`test:mcp` 13.

**E2 — lỗ vòng 5 đã bịt.** Vòng 5 đánh trượt vì `expected` nêu `bbox`/`pointCount` "bên cạnh" trên
nhánh tuyến routed, trong khi hai trường đó chỉ được khẳng định ở nhánh tuyến vẽ tay. `2fb71d8` đưa
khẳng định về ĐÚNG nhánh: `resolveConfig.test.ts:558,559,560,563,569,570` khẳng định đủ sáu trường
NGAY TRÊN nhánh routed, và mock trả ba điểm trong khi nhánh tự-vẽ dùng hai — nên `pointCount` không
thể trùng nhau một cách vô tình.

**Mười lăm eval còn lại soi lại tận nguồn, tất cả trung thực.** E1 ghim đúng
`overview=full`/`geometries=geojson`/LineString/km/phút (`route.test.ts:26-31`). E3 dùng
`toBeUndefined()` — phân biệt được với `0`. E9 chứng minh HUỶ thật: mock chỉ reject khi abort
(`:90`), cộng khẳng định `signal` (`:98`). E11 dùng `.not.toHaveBeenCalled()`. E12 có cả cận trên
(≤700) lẫn hai đầu được giữ lẫn "tuyến ngắn không đổi". E13 (`routing-invariants`) không có phép kiểm
no-op — I3 kèm chốt `fetchCalls.length > 0` nên nó không thể tự-thoả bằng cách không tìm thấy gì.
E14 so `center ≈ 105.85` với `location` 100, phân biệt được. E16 như mọi hàng rào tích hợp khác:
`expected` của nó nói về việc BỘ TEST bị gác sau `MCP_INTEGRATION=1`, không nói nó kiểm gì — không
nói quá; nhưng nó gắn `criterion: AC-1` mà không chứng minh gì về AC-1, giữ nguyên ghi nhận từ vòng 5.

### Hai chỗ chữ phải sửa trước khi ký (KHÔNG đánh trượt)

- **E8**, ngoặc đơn *"(mode nằm trong khoá cache)"*: khoá thật là
  `` `${base}|${profile}|${path}` `` (`mcp-server/src/route.ts:146`) — chứa **profile**, không phải
  mode; và `car` với `moto` cùng ánh xạ `'driving'` (`route.ts:48-52`), nên "khác mode thì gọi 2 lần"
  KHÔNG đúng cho cặp car/moto (sẽ chỉ một lần, và đó là hành vi đúng). Khẳng định chính vẫn phân biệt
  được với ca được test (car vs walk, `route.test.ts:60-62`) và vẫn đỏ nếu bỏ profile khỏi khoá —
  nên đây là sai tên cơ chế, không phải nói quá độ phủ. Chú thích ở `route.ts:145` cũng nói lỏng y hệt
  và nên sửa cùng.
- **E9**, *"mọi fetch mang signal"*: trong lane unit chỉ đo được trên đúng một lời gọi
  (`route.test.ts:98`). Không sai — `route.ts` chỉ có một chỗ `fetch(` — và vế "mọi" được E13/I3 gác
  tĩnh (`routing-invariants.ts:78`, có chốt `fetchCalls.length > 0`). Ghi lại để người ký biết chữ
  "mọi" đến từ đâu.

`verified_commit` cập nhật lên `d84857a`. `human_signoff` để RỖNG — Cổng 2 chờ người ký.

## Vòng 6 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E2].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

`verified_commit` cập nhật lên `b4c1d50c`.

## Vòng 5 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

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

**E2 (AC-2) — `bbox` và `pointCount` được nêu tên nhưng không được khẳng định ở nhánh routed.**

`expected` viết: *"tuyến routed cho `resolved.routes[i]` mang `distanceKm`/`durationMin`/
`provider` **BÊN CẠNH** `lengthKm`/`bbox`/`pointCount`"*.

Ca test tương ứng (`mcp-server/src/resolveConfig.test.ts:507-523`, "accepts a route request and
echoes distance/duration beside the geometry") khẳng định đúng bốn trường:
`r.distanceKm` (`:516`), `r.durationMin` (`:517`), `r.provider` (`:518`), `r.lengthKm` (`:522`).
**Không dòng nào chạm `bbox` hay `pointCount`.** Hai trường đó chỉ được khẳng định ở ca tuyến
do người gọi tự vẽ (`:462-463`, thuộc E9), tức ở nhánh KHÁC.

Rủi ro thực tế thấp — `summarizeRoutes` tính chúng vô điều kiện (`resolveConfig.ts:427-429`) —
nhưng "rủi ro thấp" không phải tiêu chuẩn: mệnh đề được nêu tên ở nhánh routed thì phải có
khẳng định ở nhánh routed, nếu không một hiện thực bỏ `bbox` đúng ở nhánh đó vẫn xanh.

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 4 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Bán kính ảnh hưởng hẹp: `route.test.ts` và `resolveConfig.test.ts` không đổi, nên E1-E14 là hồi quy thuần; E15 (bộ tổng) và E16 (bộ tích hợp có gác) mới là hai eval thật sự đi qua mã đổi. Cả hai xanh._
_Round 4 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_`executors.test.resolve_config` của hợp đồng này chạy vào file vừa bị sửa import, nên toàn bộ eval dùng nó được chạy lại thay vì ghim. `routing_invariants` (I1–I4) vẫn giữ, gồm cả chốt `route.ts` KHÔNG import export.ts/mapStyle.ts._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 3 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E15, E16); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 2 — re-verification triggered by `fix/mcp-auth` landing on top of Round 1's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

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
| E13 | AC-13 | script | PASS |
| E14 | AC-14 | test | PASS |
| E15 | AC-13 | test | PASS |
| E16 | AC-1 | test | PASS |

## Evidence

- eval: E1
  run_id: road-routing-r8-e1-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E2
  run_id: road-routing-r8-e2-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E3
  run_id: road-routing-r8-e3-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: road-routing-r8-e4-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: road-routing-r8-e5-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: road-routing-r8-e6-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-6 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E7
  run_id: road-routing-r8-e7-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-7 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E8
  run_id: road-routing-r8-e8-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E9
  run_id: road-routing-r8-e9-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E10
  run_id: road-routing-r8-e10-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E11
  run_id: road-routing-r8-e11-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E12
  run_id: road-routing-r8-e12-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.route
  verified_at: 2026-08-07T12:17:56Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.route` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 13 passed (13) — present and passing.

- eval: E13
  run_id: road-routing-r8-e13-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.routing_invariants
  verified_at: 2026-08-07T12:18:09Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `script.routing_invariants` → thoát 0 · routing-invariants: mọi bất biến còn giữ
    **Vòng 7 @ d84857a — đo lại tươi:** `script.routing_invariants` → thoát 0 · routing-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-13 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. I1-I4 ok — routing-invariants: moi bat bien con giu — present and passing.

- eval: E14
  run_id: road-routing-r8-e14-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-14 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E15
  run_id: road-routing-r8-e15-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E16
  run_id: road-routing-r8-e16-20260807
  exit_code: 0
  baseline: n-a
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T12:21:00Z
  output: |
    **Vòng 8 @ ace12a0 — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 15 passed (15)
    **Vòng 7 @ d84857a — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 3 passed (3); Tests 12 passed (12); Duration 42.43s — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E15.

Baseline `n-a` (carried forward, could not be computed): E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E16.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 8 (chạy lại ở `ace12a0` sau khi E8/E9 được vá): cả 16 eval chạy lại tươi, 16/16 thoát 0. **PASS.**
E8 hết trượt — nửa car→moto mới phân biệt được `profile` với `mode`; đột biến khoá bằng `mode` cho
exit 1 với đúng chuỗi "called 2 times, but got 3 times". E9 hết trượt — bốn lời gọi khác đường, mỗi
cái một khẳng định; bỏ signal riêng ở nhánh `via` cho exit 1 nêu "lời gọi #3". Nợ ghi nhận: I3 tầng
tĩnh đo "mọi fetch" trên đúng một call site. `human_signoff` để rỗng.

Vòng 7 (chạy lại ở `d84857a` sau khi E2 được vá): cả 16 eval chạy lại tươi, 16/16 thoát 0
(`route.test.ts` 13, `resolveConfig.test.ts` 65, script 7 bất biến, `npm test` 542/10/0, `test:mcp`
13). **PASS.** E2 hết trượt: `2fb71d8` đưa khẳng định `bbox`/`pointCount` về ĐÚNG nhánh tuyến routed
(`resolveConfig.test.ts:558-570`), và mock ba điểm phân biệt được với nhánh tự-vẽ hai điểm. Mười lăm
eval còn lại soi lại tận nguồn và trung thực; E13 (`routing-invariants`) không có phép kiểm no-op —
I3 kèm chốt `fetchCalls.length > 0`. Ghi nhận thêm, KHÔNG đánh trượt nhưng phải sửa chữ trước khi ký:
E8 ghi "(mode nằm trong khoá cache)" trong khi khoá là `${base}|${profile}|${path}` (`route.ts:146`)
và `car`/`moto` cùng profile `'driving'`, nên "khác mode thì gọi 2 lần" sai với cặp car/moto; E9 nói
"mọi fetch mang signal" nhưng lane unit chỉ đo một lời gọi (vế "mọi" do E13/I3 gác tĩnh). E16 vẫn gắn
`criterion: AC-1` mà không chứng minh gì về AC-1 — khiếm khuyết ánh xạ tiêu chí, như vòng 5 đã ghi.
`human_signoff` để rỗng: Cổng 2 chờ người ký.

Vòng 5 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 16 eval chạy lại tươi, 16/16 thoát 0 (`route.test.ts` 13, `resolveConfig.test.ts` 64, script 7 bất biến, `npm test` 527/9/536, `test:mcp` 12/12). **REJECT trên [E2]**: `expected` nêu `bbox`/`pointCount` "bên cạnh" trên nhánh tuyến routed, nhưng ca test ở `resolveConfig.test.ts:507-523` không khẳng định hai trường đó (chúng chỉ được khẳng định ở nhánh tuyến vẽ tay, `:462-463`). Ba eval khác được soi kỹ và GIỮ NGUYÊN PASS dù yếu: E5 (mock luôn trả `country: 'Vietnam'` nên một hằng cứng cũng qua — vẫn phân biệt được với "không có anchor"), E12 (không có cận DƯỚI cho số điểm sau decimate), E14 ("ôm đúng tuyến" thực chất là một `toBeCloseTo` trên `center[0]`). E16 không bị đánh trượt vì lý do như mcp-auth E10, nhưng nó gắn `criterion: AC-1` mà không chứng minh gì về AC-1.

Vòng 4 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3`. Cả 16 eval chạy lại tươi — 16/16 xanh. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 3 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E15, E16 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 2: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
