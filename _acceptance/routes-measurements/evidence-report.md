---
schema_version: 2
feature_slug: routes-measurements
verdict: PASS
failed_evals: []
reason: "Vòng 14 ghim lại ở baf27d3: 20/20 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: baf27d3b94673ba706de51fdd9e45776224f0bc2
human_signoff:
---

# Evidence Report: routes-measurements

## Vòng 14 — ghim lại ở `baf27d3`; 20/20 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 20/20.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 13 — 'tới pixel' nay có người canh trên chính pixel

Ghim ở `ace12a0`. Cả 20 eval chạy lại tươi, **20/20 thoát 0**: `resolveConfig.test.ts` 65 ·
`tools.test.ts` 65 · `applyRenderConfig.test.ts` 10 · `geometry.test.ts` 10 · `routes-invariants` mọi
bất biến còn giữ · demo `14 đạt · 0 trượt` · `npm test` 547/10/0 · `test:mcp` 15.

**E16 — mệnh đề 'chứng minh tuyến đi hết đường tới pixel' nay có khẳng định TRÊN CHÍNH PIXEL.** Vòng 12
trượt vì `shot()` render 5 ảnh rồi `fs.writeFile` mà không đối chiếu một byte nào. `aa6d683` thêm
`_acceptance/routes-measurements/scripts/png-pixels.ts` (giải PNG thật) và 5 phép kiểm mới:

    ✓ A1: pixel đúng màu tuyến caller đặt            4007 px #ff4d6d
    ✓ A0 (không tuyến): KHÔNG pixel nào màu đó       0 px #ff4d6d
    ✓ A2: tuyến đỏ có pixel riêng                    2564 px #ff4d6d
    ✓ A2: tuyến xanh lam có pixel riêng              2474 px #4fc3ff
    ✓ A2: tuyến xanh lá có pixel riêng                969 px #7bd88f

Cặp A1/A0 là thứ khoá lại: "có màu trên ảnh" không thể đến từ nền bản đồ, vì cùng nền đó với 0 tuyến
cho ĐÚNG 0 px. Ba màu riêng ở A2 loại nốt hiện thực tô chung một màu cho cả source.

**Kiểm chứng có đối chứng âm — và đối chứng âm ấy là bắt buộc.** Bộ render nạp app từ `dist/`:

    # xoá hẳn lớp `route-line` khỏi src/lib/mapStyle.ts:248
    $ npx tsx _acceptance/routes-measurements/scripts/demo-routes.ts     -> exit 0
      KIỂM: 14 đạt · 0 trượt        <- XANH GIẢ: dist/ còn là bản cũ

    $ npx vite build && npx tsx _acceptance/routes-measurements/scripts/demo-routes.ts   -> exit 1
      ✗ A1: pixel đúng màu tuyến caller đặt      0 px #ff4d6d
      ✗ A2: tuyến đỏ có pixel riêng              0 px #ff4d6d
      ✗ A2: tuyến xanh lam có pixel riêng        0 px #4fc3ff
      ✗ A2: tuyến xanh lá có pixel riêng         0 px #7bd88f
      KIỂM: 10 đạt · 4 trượt

Một vòng chấm bỏ qua `vite build` sẽ đọc ra XANH cho đúng cái mutant này. Lưu ý vận hành đó đã được
ghi vào chính `expected` của E16, và vòng này chạy `vite build` trước mọi lần đo demo.

**Ghi chú:** `A0` giữ 0 px trong CẢ HAI nhánh — đó là hành vi đúng (không tuyến thì không màu), không
phải phép kiểm mất răng; răng của nó nằm ở chỗ nó đứng cạnh A1.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 12 — no-op đã bị gỡ; "tới pixel" thì vẫn chưa có người canh

Ghim ở `d84857a` (tổ tiên của HEAD). Cả 20 eval chạy lại tươi, **20/20 thoát 0**:
`resolveConfig.test.ts` 65 · `tools.test.ts` 65 · `applyRenderConfig.test.ts` 10 ·
`geometry.test.ts` 10 · `routes-invariants` mọi bất biến còn giữ · demo `9 đạt · 0 trượt` ·
`npm test` 542/10/0 · `test:mcp` 13.

**E1 — lỗ vòng 10 đã bịt.** `7e21f00` thêm phép đo hình học RIÊNG cho dạng `geojson`:
`resolveConfig.test.ts:481-485` khẳng định `pointCount`/`lengthKm`/`bbox` cho entry dạng đó với toạ
độ khác hẳn entry dạng `coords`, nên không thể đọc nhầm số của nhau.

**No-op của E16 cũng đã bị gỡ.** `demo-routes.ts:93` nay là
`hkToWest.bearingDeg > 270 && hkToWest.bearingDeg < 360` — trước là `||`, và vì `initialBearingDeg`
chuẩn hoá về `[0,360)` nên vế sau là hằng đúng, biến phép kiểm thành no-op cho MỌI phương vị. Đếm lại
đúng 9 `check(...)` (`:83,84,85,88,93,94,106,116,117`), và cả 9 nay đều phân biệt được.

### E16 vẫn TRƯỢT — mệnh đề "tới pixel" không có khẳng định nào chống lưng

`expected` kết luận: *"5 render thật + 9 phép kiểm số đo … — **chứng minh tuyến đi hết đường tới
pixel**"*. Hàm `shot()` (`demo-routes.ts:26-32`) chỉ gọi `deps.render(cfg)` rồi `fs.writeFile` —
không so sánh, không đo gì trên PNG. Năm ảnh A0–A4 (`:45,47,52,61,66`) không được assert lần nào.
Cả 9 `check` đều chạy trên số trả về từ `resolveConfig`/`summarizeRoutes`/`summarizeMeasures`, không
chạm một byte ảnh; và mã thoát chỉ phụ thuộc `fail` (`:135`).

Đột biến cụ thể KHÔNG làm lane đỏ: xoá layer `route-line` khỏi `src/lib/mapStyle.ts:248-250` (hoặc bỏ
dòng `routes` ở `src/render/applyRenderConfig.ts:73`) ⇒ 5 PNG vẫn ra bình thường nhưng không còn
tuyến nào trên đó, 9/9 check vẫn xanh, script vẫn thoát 0. Chuẩn "tới PIXEL" trong chính kho này là
so BYTE hai ảnh — xem `mcp-server/src/renderFrame.test.ts:79-140` ("NEO CHỐNG PASS RỖNG: mọi khẳng
định dưới đây có dạng 'hai PNG KHÁC nhau'"). Script đã render sẵn `A0-no-routes.png` và
`A1-one-route.png`, nên một `check(!bufA1.equals(bufA0), …)` là đủ; hoặc hạ chữ xuống "5 render thật
để người xem `index.html`" và bỏ hẳn cụm "chứng minh … tới pixel".

## Vòng 11 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E1, E16].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

`verified_commit` cập nhật lên `b4c1d50c`.

## Vòng 10 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

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

**E16 (AC-?) — một trong chín "phép kiểm" KHÔNG THỂ fail.**

`expected` khai demo sinh ảnh và chạy "9 phép kiểm số đo". Script chạy đúng, in
`KIỂM: 9 đạt · 0 trượt`, thoát 0. Nhưng phép kiểm ở
`_acceptance/routes-measurements/scripts/demo-routes.ts:89` là:

```ts
check(hkToWest.bearingDeg > 270 || hkToWest.bearingDeg < 360, 'cặp điểm: phương vị tây-bắc', …)
```

`initialBearingDeg` chuẩn hoá bằng `((… ) + 360) % 360` (`mcp-server/src/geometry.ts:31`), nên
giá trị trả về LUÔN thuộc `[0, 360)`. Vế `bearingDeg < 360` **luôn đúng**, và vì là `||` nên
cả biểu thức luôn đúng — với MỌI phương vị, kể cả hướng đông-nam. Ý định rõ ràng là `&&`.
Vậy thực tế là **8 phép kiểm + 1 no-op**, không phải 9. Đây là đúng nghĩa "khẳng định không
phân biệt được" mà tiêu chuẩn vòng này loại bỏ.

**E1 (AC-?) — hình học của dạng `geojson` không được chứng minh sống sót qua resolver.**

`expected` khai dạng geojson đi vào `RenderConfig.routes` với **`geojson`**/`color`/`width`.
`resolveConfig.test.ts:443-444` chỉ khẳng định `width: 4` và `color === '#e8b04b'` cho entry
dạng geojson; phép đo hình học thật (bbox/pointCount, `:455-466`) chạy trên entry dạng
**`coords`**. Bỏ trường `geojson` của entry dạng-geojson thì vẫn xanh. (Ghi nhận từ lane kiểm
phụ, chưa tự đối chiếu từng dòng như E16.)

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 9 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Trong bán kính: E2 và E14 (`tools.ts`), E17 (bộ tổng), E18 (bộ tích hợp). Phần còn lại chạy trên `resolveConfig.ts`/`geometry.ts` không đổi. `routes-invariants.ts` và `demo-routes.ts` xanh nguyên._
_Round 9 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Hợp đồng này là hợp đồng chịu ảnh hưởng trực tiếp nhất: `geometry.ts` là file nguồn lõi của nó, `executors.test.geometry` chạy thẳng vào file test vừa bị cắt, và E15/E16 (`routes_invariants`) ĐỌC MÃ NGUỒN của cả `resolveConfig.ts` lẫn `geometry.ts`. Cả tám bất biến I1–I3 vẫn giữ, trong đó I3 xác nhận hai file vẫn không có tên số đo trần và bốn tên đủ nghĩa vẫn đủ mặt._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 8 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E17, E18); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 7 — re-verification triggered by `fix/mcp-auth` landing on top of Round 6's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-8 | test | PASS |
| E13 | AC-10 | test | PASS |
| E14 | AC-12 | test | PASS |
| E15 | AC-13 | script | PASS |
| E16 | AC-1 | script | PASS |
| E17 | AC-13 | test | PASS |
| E18 | AC-1 | test | PASS |
| E19 | AC-1 | test | PASS |
| E20 | AC-14 | script | PASS |

## Evidence

- eval: E1
  run_id: routes-measurements-r13-e1-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E2
  run_id: routes-measurements-r13-e2-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E3
  run_id: routes-measurements-r13-e3-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E4
  run_id: routes-measurements-r13-e4-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E5
  run_id: routes-measurements-r13-e5-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E6
  run_id: routes-measurements-r13-e6-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.apply_render_config
  verified_at: 2026-08-07T12:17:55Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.apply_render_config` → thoát 0 · Test Files 1 passed (1); Tests 10 passed (10)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.apply_render_config` → thoát 0 · Test Files 1 passed (1); Tests 10 passed (10)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 10 passed (10) — present and passing.

- eval: E7
  run_id: routes-measurements-r13-e7-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-6 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E8
  run_id: routes-measurements-r13-e8-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-7 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E9
  run_id: routes-measurements-r13-e9-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E10
  run_id: routes-measurements-r13-e10-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E11
  run_id: routes-measurements-r13-e11-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E12
  run_id: routes-measurements-r13-e12-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.geometry
  verified_at: 2026-08-07T12:17:54Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.geometry` → thoát 0 · Test Files 1 passed (1); Tests 10 passed (10)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.geometry` → thoát 0 · Test Files 1 passed (1); Tests 10 passed (10)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 12 passed (12) — present and passing.

- eval: E13
  run_id: routes-measurements-r13-e13-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E14
  run_id: routes-measurements-r13-e14-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E15
  run_id: routes-measurements-r13-e15-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T12:18:15Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `script.routes_invariants` → thoát 0 · routes-invariants: mọi bất biến còn giữ
    **Vòng 12 @ d84857a — đo lại tươi:** `script.routes_invariants` → thoát 0 · routes-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-13 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. I1-I3 ok — routes-invariants: moi bat bien con giu — present and passing.

- eval: E16
  run_id: routes-measurements-r13-e16-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_demo
  verified_at: 2026-08-07T12:18:40Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `script.routes_demo` → thoát 0 · 5 render thật · KIỂM: 14 đạt · 0 trượt (gồm 5 phép kiểm PIXEL: A1 4007 px #ff4d6d, A0 0 px, A2 2564/2474/969 px cho ba màu)
    **Vòng 12 @ d84857a — đo lại tươi:** `script.routes_demo` → thoát 0 · 5 render · KIỂM 9 đạt · 0 trượt
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. ANH: 5 render; KIEM: 9 dat - 0 truot — present and passing.

- eval: E17
  run_id: routes-measurements-r13-e17-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E18
  run_id: routes-measurements-r13-e18-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T12:21:00Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 15 passed (15)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 3 passed (3); Tests 12 passed (12); Duration 42.43s — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E19
  run_id: routes-measurements-r13-e19-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-07T12:17:52Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 12 @ d84857a — đo lại tươi:** `test.resolve_config` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 64 passed (64) — present and passing.

- eval: E20
  run_id: routes-measurements-r13-e20-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.routes_invariants
  verified_at: 2026-08-07T12:18:15Z
  output: |
    **Vòng 13 @ ace12a0 — đo lại tươi:** `script.routes_invariants` → thoát 0 · routes-invariants: mọi bất biến còn giữ
    **Vòng 12 @ d84857a — đo lại tươi:** `script.routes_invariants` → thoát 0 · routes-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-14 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. I1-I3 ok — routes-invariants: moi bat bien con giu — present and passing.

## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E17, E18.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 13 (chạy lại ở `ace12a0` sau khi E16 được vá): cả 20 eval chạy lại tươi, 20/20 thoát 0. **PASS.**
E16 hết trượt — `aa6d683` thêm `png-pixels.ts` giải ảnh thật và 5 phép kiểm đếm pixel theo mã màu
caller đặt (cặp A1/A0 loại trừ nền bản đồ, ba màu riêng ở A2 loại trừ tô chung một màu). Kiểm chứng
bằng cách xoá lớp `route-line`: KHÔNG `vite build` thì demo vẫn 14/0 (xanh giả vì `dist/` cũ); CÓ
`vite build` thì exit 1 với 4 phép kiểm pixel trượt. `human_signoff` để rỗng.

Vòng 12 (chạy lại ở `d84857a` sau khi E1/E16 được sửa): cả 20 eval chạy lại tươi, 20/20 thoát 0
(`resolveConfig.test.ts` 65, `geometry.test.ts` 10, script bất biến còn giữ, demo `9 đạt · 0 trượt`).
**E1 hết trượt**: `7e21f00` thêm phép đo hình học RIÊNG cho dạng `geojson`
(`resolveConfig.test.ts:481-485`), toạ độ khác hẳn entry `coords` nên không đọc nhầm số của nhau. Và
no-op của E16 cũng đã bị gỡ — `demo-routes.ts:93` nay là `> 270 && < 360`, đủ 9 `check` và cả 9 phân
biệt được. **REJECT trên [E16]**, vì mệnh đề CÒN LẠI vẫn chưa có người canh: "chứng minh tuyến đi hết
đường tới pixel" — `shot()` (`demo-routes.ts:26-32`) chỉ render rồi `fs.writeFile`, năm ảnh A0–A4
không được assert lần nào, và cả 9 `check` chạy trên số của `resolveConfig`/`summarize*` chứ không
chạm byte ảnh. Đột biến xoá layer `route-line` (`mapStyle.ts:248-250`) để 5 PNG vẫn ra mà không còn
tuyến, 9/9 check vẫn xanh, script vẫn thoát 0. Cách rẻ nhất là `check(!bufA1.equals(bufA0), …)` —
hai ảnh đó đã được render sẵn. Cùng cảnh báo I1 như motion-tools-cost: `routes-invariants.ts` đo diff
của nhánh hiện tại, không còn là diff của gói routes.

Vòng 10 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 20 eval chạy lại tươi, 20/20 thoát 0 (`resolveConfig.test.ts` 64, `geometry.test.ts` 12, script bất biến 10 dòng ok, demo `9 đạt · 0 trượt`). **REJECT trên [E1, E16]**: E16 khai "9 phép kiểm số đo" nhưng `demo-routes.ts:89` là `bearingDeg > 270 || bearingDeg < 360`, mà `initialBearingDeg` chuẩn hoá về `[0,360)` nên vế thứ hai luôn đúng — phép kiểm đó không thể fail, thực tế là 8 + 1 no-op (ý định rõ ràng là `&&`); E1 khai hình học dạng `geojson` sống sót qua resolver nhưng chỉ `width`/`color` được khẳng định cho entry dạng đó. Số liệu khác được đo lại và ĐÚNG: 310,4 KiB/tuyến 20k điểm, 12,1 MiB tổng, trần 2 MiB / 8 MiB, 1137,9 km great-circle. Cùng cảnh báo I1 như motion-tools-cost: `routes-invariants.ts` đo diff của nhánh hiện tại, không còn là diff của gói routes.

Vòng 9 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `tools.ts`/`http.ts`. Cả 20 eval chạy lại tươi — 20/20 xanh. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 8 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E17, E18 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 7: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
