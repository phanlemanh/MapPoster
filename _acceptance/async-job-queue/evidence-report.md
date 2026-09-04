---
schema_version: 2
feature_slug: async-job-queue
verdict: PASS
failed_evals: []
reason: "Vòng 18 ghim lại ở baf27d3: 24/24 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: 480e40daf0032005235b1f788e7837849e76429d
human_signoff: manh — 2026-08-14 (commit tay của người duyệt, chỉ chạm dòng human_signoff)
---

# Evidence Report: async-job-queue

### Re-pin lần 5 — 2026-09-04, do lật sổ 14 làn đã ký sang signed-off — chạm _acceptance/<slug>/ đánh thức luật hết-hạn (STALE-DIFF-SCOPE-GUARD), trôi là hai tệp test mcp-server/src/recipes.test.ts + src/components/MapView.test.tsx từ ab0a1f5/ebb0676
run_id: repin-20260904-480e40d
sha: 480e40daf0032005235b1f788e7837849e76429d · suites: 3 lệnh exit 0 (bộ đơn vị 629 đạt · test:e2e 18 đạt · test:mcp 22 đạt) — Node v24.19.0
Chữ ký người GIỮ NGUYÊN — thay đổi làm hết hạn nằm trọn trong làn test, không chạm hành vi sản phẩm.

### Re-pin lần 4 — 2026-08-19, do vá thiếu Web Storage cho làn test (vitest.config.ts + vitest.setup.ts + src/test-env) sau khi Node máy dev tự nâng lên 26.7
run_id: repin-20260819-fcb64d7
sha: fcb64d7e71aaaa320926cd08e92e32ee70da1478 · suites: 3 lệnh exit 0 (bộ đơn vị 629 đạt · test:e2e 18 đạt · test:mcp 22 đạt) — lần đầu đo trên Node 26.7
Chữ ký người GIỮ NGUYÊN — thay đổi làm hết hạn nằm trọn trong làn test, không chạm hành vi sản phẩm.

### Re-pin lần 3 — 2026-08-19, do nâng @playwright/test 1.61.1 → 1.62.1 — package.json và package-lock.json không thuộc danh sách miễn trừ
run_id: repin-20260819-4a8f938
sha: 4a8f9387608a537a037c1b7c769237f7f910124b · suites: 3 lệnh exit 0 (npm test 617 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Lượt này rộng hơn một lần ghim lại thường: vì đổi là ĐỔI TRÌNH DUYỆT, đã chạy thêm TOÀN BỘ 11 phép đo dạng script (gồm cả bộ đối chứng âm 4/4 ca của input-caps và đường dựng ảnh thật của routes-measurements: 5 render, 14 phép kiểm đạt) — tất cả exit 0.
Chữ ký người GIỮ NGUYÊN.

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

## Vòng 18 — ghim lại ở `baf27d3`; 24/24 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 24/24.

24/25 eval máy xanh. E20 (AC-15) là phán xét, **đã kết luận ở vòng trước** và kết luận đó còn hiệu lực — không có gì trong 50 commit vừa rồi chạm vào điều nó phán.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 17 — E17 chặn MỌI module fs, không còn hai regex đoán hình dạng

Ghim ở `ace12a0`. Cả 24 eval máy chạy lại tươi, **24/24 thoát 0**: `http.test.ts` 62 ·
`jobRunner.test.ts` 28 · `jobStore.test.ts` 17 · `tools.test.ts` 65 · `motionCompiler.test.ts` 34 ·
lane `clip_slot_lifecycle` 62 · `npm test` 547/10/0. **E20 (judgment) giữ nguyên văn phán quyết mù
PASS; `human_override` RỖNG** — chữ ký cũ ở ô đó do agent tự điền theo "uỷ quyền đứng" và đã bị rút ở
`33ae60b`; agent không ký thay người, và vòng này cũng không.

**E17 — 'không lời gọi hệ thống tệp nào' nay đo bằng cách RÚT specifier, không đoán hình dạng chuỗi.**
Vòng 16 trượt vì hai regex chỉ bắt đúng một cách viết `node:fs`; `node:fs/promises` lọt qua và lane vẫn
16/16 xanh. `05e9759` thay bằng bộ rút MỌI specifier (`from '…'`, `import '…'`, `require('…')`,
`import('…')`) rồi lọc theo `/^(node:)?fs(\/|$)/`. Kiểm chứng vòng này bằng đúng specifier mà bản cũ bỏ
lọt:

    # thêm `import { readFile } from 'node:fs/promises'` vào mcp-server/src/jobStore.ts
    $ npx vitest run mcp-server/src/jobStore.test.ts   -> exit 1
    FAIL  createJobStore > KHÔNG BAO GIỜ chạm hệ thống tệp — sổ là thuần dữ liệu
    AssertionError: sổ việc import module hệ thống tệp: node:fs/promises:
                    expected [ 'node:fs/promises' ] to deeply equal []

Nửa should-FIRE cho chính bộ rút cũng có mặt (`jobStore.test.ts:127`): trên mẫu bốn dạng viết nó phải
trả đủ `['fs','fs/promises','node:fs','node:fs/promises']` và không dính `'zod'` — không có nửa này thì
"danh sách rỗng" xanh cả khi bộ rút hỏng. Lane đi 16 → **17** ca, đúng bằng ca mới đó.

**E16 — mệnh đề về ca có dấu nay khai đúng thứ đo được.** `05e9759` sửa `expected` cho khớp: `slugify`
GỠ dấu, nên ca 'Đắk Lắk' KHÔNG đo "xoá được tệp tên có dấu" mà đo "bước chuẩn hoá đã biến địa danh có
dấu thành ASCII thuần". Kiểm chứng bằng đột biến `expected` khai:

    # src/lib/format.ts: slugify nới thành /[^\p{L}\p{N}]+/gu (giữ chữ Unicode)
    $ npx vitest run mcp-server/src/jobRunner.test.ts   -> exit 1
    AssertionError: tên tệp phải là ASCII thuần sau slugify:
      expected 'mapposter-job-render-đa-k-la-k-31.png' to match /^[\x20-\x7e]+$/

**E20 (judgment, AC-15)** — phán quyết mù PASS và `rationale` được giữ NGUYÊN VĂN, không chấm lại, không
xoá. `human_override` để trống. Hợp đồng là `risk_tier: T2` và phán quyết là PASS (không phải UNCERTAIN),
nên trường rỗng này không tự chặn PASS — nhưng nó KHÔNG được đọc là "đã có chữ ký".

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 16 — bảy eval của vòng 14 đã được vá thật; còn E17

Ghim ở `d84857a` (tổ tiên của HEAD — ở đây là chính HEAD). Cả 24 eval máy chạy lại tươi,
**24/24 thoát 0**: `http.test.ts` 61 · `jobRunner.test.ts` 28 · `jobStore.test.ts` 16 ·
`tools.test.ts` 65 · `motionCompiler.test.ts` 34 · lane `clip_slot_lifecycle` (motionCompiler +
jobRunner) 62. E20 (judgment) giữ nguyên phán quyết mù đã có.

**Bảy eval bị REJECT ở vòng 14 nay đứng vững.** Soi lại từng cái ở `b43f986`/`d821d72`:
E1 (202 mang `status` ∈ {queued,running}, và chuỗi `'Đà Nẵng'` được so từng ký tự qua sổ →
phản hồi), E5 (mã bịa và mã đã dọn đều 404, `body.status` undefined), E6 (base64 bằng đúng byte đọc
lại từ tệp thợ ghi, không phải `stat()`), E8 (`errorKind` `'server'` vs `'input'` ở hai ca cạnh
nhau), E10 (CAP=1, ba việc clip, `started === [1,2,3]`, mọi bản ghi `'done'`), E13 (nhánh THÀNH CÔNG
nay chạy thật; `jobRunner.test.ts:302` bắt được đột biến "nhả slot sớm"), E14 (`peak ≤ CAP=2` đo ở
MỌI thời điểm, không đo số thợ).

### E17 TRƯỢT — mệnh đề phổ quát, hai regex hẹp

`expected` viết: *"sổ việc KHÔNG import fs — **không lời gọi hệ thống tệp nào** trong đơn vị này"*.
Nửa đầu (`takeExpired`) có khẳng định thật ở `jobStore.test.ts:76-89`. Nửa sau — một mệnh đề phổ
quát về MỌI lời gọi hệ thống tệp — chỉ được canh bằng hai dòng grep trên văn bản nguồn:

```
jobStore.test.ts:109   expect(src).not.toMatch(/from ['"]node:fs['"]/);
jobStore.test.ts:110   expect(src).not.toMatch(/require\(['"]node:fs['"]\)/);
```

Cả hai đòi dấu nháy đóng NGAY SAU `node:fs`. Đột biến chạy thật trong worktree dùng-một-lần — thêm
`import { appendFileSync } from 'node:fs/promises';` vào đầu `jobStore.ts` — cho lane
`config:executors.test.job_store` **thoát 0, `Tests 16 passed (16)`**. `'fs'` trần và
`await import('node:fs')` cũng lọt y hệt. Sửa: hoặc thu chữ về đúng cái được đo ("nguồn
`jobStore.ts` không chứa câu import `node:fs`"), hoặc nới regex thành `/['"](node:)?fs(\/|['"])/`.

### Hai đính chính hồ sơ (không phải verdict eval)

1. **Prose về `human_override` đã cũ.** Dòng 113 và bảng dòng 136 của bản trước vẫn viết
   "`human_override` already on file" — nhưng `33ae60b` đã RÚT chữ ký đó vì nó do agent tự điền theo
   "uỷ quyền đứng", không phải người ký. Trường thật ở khối E20 rỗng. Đã sửa chữ ở vòng này.
2. **`evidence-page.html` vẫn render chữ ký đã rút.** Trang trình bày cho Cổng 2 còn nguyên văn
   override đã bị thu hồi (tự nó ghi "KHÔNG phải người ký trực tiếp xem từng mục"). Một người mở
   trang HTML sẽ tưởng mục này đã có người ký. Đã thay bằng ô trống ở vòng này.

`verified_commit` cập nhật lên `d84857a`; `human_signoff` vẫn rỗng.

## Vòng 15 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E1, E5, E6, E8, E10, E13, E14].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

`verified_commit` cập nhật lên `b4c1d50c`.

## Vòng 14 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

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

**E10 (AC-8) — eval trỏ vào một ca test KHÔNG nói về chủ đề của nó.**

`expected` viết: *"với trần đồng thời = N, gửi N+K việc **clip** thì K việc chờ rồi chạy theo
ĐÚNG thứ tự nhận; không việc nào chuyển sang `'failed'` vì quá tải"*.

Ca test thật (`mcp-server/src/jobRunner.test.ts:208-226`, "AC-8: nhiều việc chạy ĐÚNG THỨ TỰ
nhận") tạo **ba việc `kind: 'render'`** với `workers: 1` và khẳng định `seen).toEqual([1,2,3])`.
**Không có clip, không có trần đồng thời, không có việc nào phải chờ vì trần, không có khẳng
định nào về `'failed'`.** Nó chứng minh FIFO của runner — một tính chất khác. Chủ đề thật của
AC-8 (một việc clip xếp hàng sau trần clip đã đầy) chỉ xuất hiện tình cờ ở ca của E22.

**E1 (AC-1) — ba mệnh đề, hai không được canh gác và một bị nới lỏng.**

`http.test.ts:827-838`. (a) `expected` nói status ∈ `{queued, running}`; khẳng định thật là
`expect(['queued','running','done']).toContain(first.status)` (`:836`) — **chấp nhận cả
`done`**, tức nới đúng cái biên mà mệnh đề dựng lên. (b) `expected` nói thân 202 trả
`{ok, id, status}`; `:831-833` chỉ khẳng định `body.ok` và `typeof body.id` — **`status`
không được khẳng định**. (c) `expected` đòi "assert tên đi qua sổ rồi ra phản hồi **giữ
nguyên từng ký tự**"; `'Đà Nẵng'` chỉ là fixture ở `:829` và **không khẳng định nào trong cả
tệp chạm tới chuỗi đó**. (Phép round-trip đó có thật, nhưng ở `jobStore.test.ts:24-28` — lane
của E4/E17, không phải lane của E1.)

**E8 (AC-?) — chỉ MỘT trong hai ca phân biệt lỗi tồn tại ở lớp này.**

`expected` đòi "việc hỏng vì tra toạ độ thất bại **VÀ** việc hỏng vì render ném lỗi … hai ca
phân biệt được lỗi tại người gọi vs tại máy chủ". Đếm `errorKind` trong
`mcp-server/src/http.test.ts` ra **đúng 1 dòng**: `:931 expect(body.errorKind).toBe('server')`.
Ca lỗi-tại-người-gọi không tồn tại ở lane `job_http`.

**E5, E6, E13, E14 — ghi nhận từ lane kiểm phụ, cùng lớp lỗi.**

- **E5**: "mã bịa **và mã đã bị dọn** đều trả 404" — `:871-878` chỉ thử mã bịa; không có ca
  submit → sweep → 404 trong tệp này.
- **E6**: "kèm **width/height** và khối resolved **cùng hình dạng `resolvedOf`**" — `:891` chỉ
  có `expect(body.resolved).toBeDefined()`; không có width/height, không có phép so hình dạng.
- **E13**: "slot được trả khi lời gọi giữ nó kết thúc bằng **ném lỗi** và bằng **đường
  xuống-cấp**" — ca ở `motionCompiler.test.ts:228-237` tự viết `try { throw } catch { release() }`,
  tức chính TEST gọi `release()`; không đường sản xuất nào được chạy, và nhánh xuống-cấp không
  với tới được từ tệp đó.
- **E14**: "trong một kịch bản **trộn đồng bộ + việc** — đỉnh không bao giờ vượt **trần đã cấu
  hình**" — `jobRunner.test.ts:228-249` không có lời gọi đồng bộ nào và đo **số thợ**
  (`workers: 2`), không phải trần clip mà AC-10 nói tới.

### Ngoài ra: một sai số trong bản ghi vòng trước (đã sửa ở vòng này)

Dòng tường thuật của Vòng 13 viết *"`http.test.ts` 54 → **61** ca"*. Số thật là **57**
(`Tests 57 passed (57)`) ở cả `9c1f9f3` lẫn `a46aec7`. `jobRunner.test.ts` 22 → 25 thì đúng.

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 13 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Đây là hợp đồng bị chạm sâu nhất về mã: `jobRunner.ts` đổi thật (thêm truyền nguyên `clipOut` sang `resolvedOfClip`) — đúng tệp mà chính hợp đồng này ghi là đã HAI LẦN dính lỗi dùng sai biến. E7, E9, E10, E14, E15, E16, E22, E24, E25 chạy trên `jobRunner.test.ts`; E1-E3, E5, E6, E8, E11, E18 trên `http.test.ts`; E12 trên `tools.test.ts`. Tất cả xanh. E20 là eval `judgment` về tính trung thực của contract/design — chủ đề không bị diff này chạm, nên phán quyết mù PASS của vòng trước được mang sang nguyên văn và ghi rõ là carried-forward; `human_override` cũ giữ nguyên vì nó nói về văn bản hợp đồng, không về mã._
_Round 13 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Không eval nào của hợp đồng này trỏ thẳng vào `geometry.ts` hay `resolveConfig.ts`; nó hết hạn theo chốt file-dùng-chung. Toàn bộ tập lệnh vẫn được chạy lại: jobStore 16, jobRunner 22, http 54, tools 52, motionCompiler 32 — khớp vòng trước._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 12 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E1, E2, E3, E5, E6, E8, E11, E18); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 11 — re-verification triggered by `fix/mcp-auth` landing on top of Round 10's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_Judgment block(s) carried forward BYTE-FOR-BYTE — not blanked, not re-scored. **Đính chính (vòng 16):** câu gốc ở đây nói `human_override` "already on file". KHÔNG còn đúng — `33ae60b` đã rút chữ ký đó vì nó do agent tự điền theo "uỷ quyền đứng" chứ không phải người ký; trường ở khối E20 nay RỖNG và phải do người điền ở Cổng 2. Hợp đồng là `risk_tier: T2` và phán quyết mù là PASS (không phải UNCERTAIN), nên trường rỗng này không tự chặn PASS — nhưng nó cũng không được đọc là "đã có chữ ký"._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-5 | test | PASS |
| E8 | AC-6 | test | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-9 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-10 | test | PASS |
| E14 | AC-10 | test | PASS |
| E15 | AC-11 | test | PASS |
| E16 | AC-12 | test | PASS |
| E17 | AC-12 | test | PASS |
| E18 | AC-13 | test | PASS |
| E19 | AC-14 | test | PASS |
| E20 | AC-15 | judgment | PASS (giám khảo mù) — `human_override` RỖNG, đã rút ở `33ae60b`; chờ người |
| E21 | AC-16 | test | PASS |
| E22 | AC-17 | test | PASS |
| E23 | AC-17 | test | PASS |
| E24 | AC-6 | test | PASS |
| E25 | AC-15 | test | PASS |

## Evidence

- eval: E1
  run_id: async-job-queue-r17-e1-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E2
  run_id: async-job-queue-r17-e2-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E3
  run_id: async-job-queue-r17-e3-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E4
  run_id: async-job-queue-r17-e4-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T12:17:50Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 16 passed (16)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E5
  run_id: async-job-queue-r17-e5-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E6
  run_id: async-job-queue-r17-e6-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E7
  run_id: async-job-queue-r17-e7-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E8
  run_id: async-job-queue-r17-e8-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E9
  run_id: async-job-queue-r17-e9-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-7 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E10
  run_id: async-job-queue-r17-e10-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E11
  run_id: async-job-queue-r17-e11-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E12
  run_id: async-job-queue-r17-e12-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E13
  run_id: async-job-queue-r17-e13-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_slot_lifecycle
  verified_at: 2026-08-07T12:17:37Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.clip_slot_lifecycle` → thoát 0 · Test Files 2 passed (2); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.clip_slot_lifecycle` → thoát 0 · Test Files 2 passed (2); Tests 62 passed (62)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E14
  run_id: async-job-queue-r17-e14-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-10 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E15
  run_id: async-job-queue-r17-e15-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E16
  run_id: async-job-queue-r17-e16-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E17
  run_id: async-job-queue-r17-e17-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T12:17:50Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 16 passed (16)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-12 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E18
  run_id: async-job-queue-r17-e18-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E19
  run_id: async-job-queue-r17-e19-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T12:17:36Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.motion_compiler` → thoát 0 · Test Files 1 passed (1); Tests 34 passed (34)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.motion_compiler` → thoát 0 · Test Files 1 passed (1); Tests 34 passed (34)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-14 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E20
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Contract/design nêu đích danh và có lý do cho từng thiếu sót: không gọi ngược / không tiến độ / không huỷ đều ghi rõ 'OneHub chưa cần' ở Out of scope. Riêng restart làm mã việc vô danh KHÔNG phải khái niệm mới với người tiêu thụ: hành vi khi hỏi mã đó vẫn là 404 — đúng luồng AC-4 mà OneHub đã phải xử lý sẵn cho mọi mã lạ; contract nói thẳng hệ quả này thay vì giấu. Không thiếu sót nào buộc OneHub học thêm cơ chế giao thức ngoài gửi-việc/hỏi-việc-theo-nhịp.
  human_override:
- eval: E21
  run_id: async-job-queue-r17-e21-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T12:17:50Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 16 passed (16)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-16 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E22
  run_id: async-job-queue-r17-e22-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-17 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E23
  run_id: async-job-queue-r17-e23-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_store
  verified_at: 2026-08-07T12:17:50Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_store` → thoát 0 · Test Files 1 passed (1); Tests 16 passed (16)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-17 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E24
  run_id: async-job-queue-r17-e24-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-6 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

- eval: E25
  run_id: async-job-queue-r17-e25-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 17 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 16 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-15 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 25 passed (25) — present and passing.

## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15, E16, E17, E18, E19, E21, E22, E23, E25.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 17 (chạy lại ở `ace12a0` sau khi E17 được vá): cả 24 eval máy chạy lại tươi, 24/24 thoát 0. **PASS.**
E17 hết trượt — `05e9759` thay hai regex bằng bộ rút MỌI specifier rồi lọc; thêm
`import ... from 'node:fs/promises'` vào `jobStore.ts` làm lane exit 1 (bản cũ vẫn 16/16 xanh với đúng
specifier đó), và nửa should-FIRE cho chính bộ rút chặn "danh sách rỗng vì bộ rút hỏng". E16 khai đúng
thứ đo được (chuẩn hoá có dấu → ASCII); nới `slugify` giữ chữ Unicode làm `jobRunner.test.ts` exit 1.
E20 giữ nguyên văn phán quyết mù PASS + rationale, `human_override` RỖNG (đã rút ở `33ae60b` — agent
không ký thay người). `human_signoff` để rỗng.

Vòng 16 (chạy lại ở `d84857a` sau khi bảy eval của vòng 14 được vá): cả 24 eval máy chạy lại tươi,
24/24 thoát 0 (`http.test.ts` 61, `jobRunner.test.ts` 28, `jobStore.test.ts` 16, `tools.test.ts` 65,
`motionCompiler.test.ts` 34). **Bảy eval bị REJECT vòng 14 nay đứng vững** — E1/E5/E6/E8/E10/E13/E14
mỗi cái đã có khẳng định phân biệt được, soi tận nguồn chứ không tin chữ. **REJECT trên [E17]**:
`expected` khai "không lời gọi hệ thống tệp NÀO trong đơn vị này", nhưng khẳng định duy nhất là hai
regex `jobStore.test.ts:109-110` đòi nháy đóng ngay sau `node:fs`; đột biến thêm
`import { appendFileSync } from 'node:fs/promises'` vào `jobStore.ts` để lane thoát 0 với
`16 passed (16)`. E20 (judgment) giữ phán quyết mù PASS, `human_override` RỖNG (đã rút ở `33ae60b` —
agent không ký thay người) và KHÔNG được điền ở vòng này. Hai đính chính hồ sơ: prose ở dòng "carried
forward" và bảng E20 vẫn viết "human_override already on file" (sai kể từ `33ae60b`) — đã sửa; và
`evidence-page.html` vẫn render nguyên văn chữ ký đã rút — đã thay bằng ô trống. Ghi nhận thêm, không
đánh trượt: E2 nói "sau MỖI ca" nhưng `expect(store.size()).toBe(0)` nằm SAU vòng lặp (sức phân biệt
như nhau vì `size()` chỉ tăng); E16 nói "tên tệp sinh từ địa danh CÓ DẤU" — đúng chữ, nhưng `slugify`
tước dấu nên mệnh đề đó trơ, không có đột biến nào làm nó đỏ.

Vòng 14 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 24 eval máy chạy lại tươi, 24/24 thoát 0 (`http.test.ts` 57, `jobRunner.test.ts` 25, `jobStore.test.ts` 16, `tools.test.ts` 59, `motionCompiler.test.ts` 32). E20 (judgment) giữ nguyên phán quyết đã có. **REJECT trên [E1, E5, E6, E8, E10, E13, E14]**. Nặng nhất là E10: `expected` nói về trần đồng thời với việc **clip** và về việc không rơi vào `'failed'`, nhưng ca test là ba việc `render` với `workers: 1` khẳng định FIFO `[1,2,3]` — không clip, không trần, không `'failed'`. E1 nới biên chính nó dựng lên (`{queued,running}` nhưng khẳng định chấp nhận cả `done`), không khẳng định `status` trong thân 202, và không khẳng định nào chạm chuỗi `'Đà Nẵng'` mà nó hứa kiểm round-trip. E8 hứa hai ca phân biệt lỗi, `errorKind` chỉ xuất hiện đúng một lần trong cả tệp. E13 để chính TEST gọi `release()` rồi coi đó là bằng chứng đường sản xuất trả slot. E14 đo số thợ chứ không đo trần clip. E5, E6 thiếu hẳn ca/khẳng định được nêu tên. Đồng thời sửa sai số của vòng 13: `http.test.ts` là 57 ca, không phải 61. E18 vẫn là eval mạnh nhất của bộ (`it.each` ba route × ba lối tấn công, mỗi ca kèm `store.size() === 0`).

Vòng 13 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `jobRunner.ts`/`http.ts`/`tools.ts`. Cả 24 eval máy chạy lại tươi — 24/24 xanh; `jobRunner.test.ts` 22 → 25 ca, `http.test.ts` tất cả xanh (số ca thật là **57**; dòng gốc của vòng 13 ghi "54 → 61" — sai, đã đính chính ở vòng 14). E20 (judgment) mang sang nguyên văn vì chủ đề của nó là văn bản hợp đồng, không phải mã. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 12 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E5, E6, E8, E11, E18 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 11: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
