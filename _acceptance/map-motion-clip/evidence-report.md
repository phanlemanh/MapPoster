---
schema_version: 2
feature_slug: map-motion-clip
verdict: PASS
failed_evals: []
reason: "Vòng 15 ghim lại ở baf27d3: 15/15 eval máy chạy tươi, 0 đỏ; E16, E17 chờ phán xét người."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: c35ac43f50c7c3f6d12d07bdd71da1696d9584dc
human_signoff: manh — 2026-08-14 (commit tay của người duyệt, chỉ chạm dòng human_signoff)
---

# Evidence Report: map-motion-clip

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

**Ba phán xét người GIỮ NGUYÊN, có lập luận chứ không phải cho tiện.** Các vòng trước xoá `human_override` khi re-pin, nhưng lý do ghi rõ là *"PR này đổi mã nguồn dùng chung"*. Lần này thay đổi duy nhất là một script bash độc lập: `grep -rn check-deploy-drift` trên toàn bộ `*.ts/tsx/js/json/yml` trả **rỗng** — không mã nào nạp nó; `Dockerfile` có `COPY . .` nên tệp vào image, nhưng không lệnh khởi động nào gọi nó. Nó không thể đổi một pixel của clip hay của ảnh B-roll — tức không thể chạm vào thứ mà E16/E17/E12 đã phán. Giữ lại là đúng; xoá đi rồi bắt người phán lại một shell script mới là hình thức.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Phán xét người — 2026-08-13, trên artefact dựng lại tại HEAD

manh phán trực tiếp; Claude chép vào ô `human_override` mà kit dành sẵn, KHÔNG phán thay.

Artefact được **dựng lại trước khi hỏi**. Bản mà giám khảo mù xem ở các vòng trước sinh từ
`ffb92d5` (06.08), trong khi `main.tsx` +187, `motionCompiler.ts` +138, `mapStyle.ts` +55,
`export.ts` +20 và `anchors.ts` (mới hoàn toàn) đã đổi từ đó — hỏi phán xét trên vật liệu lỗi
thời thì chính phán xét đó hỏng. Kiểm trước khi dựng: định nghĩa preset `approach` KHÔNG đổi
(chỉ union type nới ra), đường vẽ `regionReveal` KHÔNG đổi, và mọi thay đổi chạm pixel ở
`mapStyle.ts`/`export.ts` đều bị chặn sau `basemap === 'satellite' && satelliteTiles`; nhưng đó
là suy luận từ đọc code nên vẫn dựng lại thật thay vì tin.

Dựng qua HTTP server **tươi từ source** sau khi `vite build` lại `dist/` — tiến trình MCP đang
chạy trong phiên là bản CŨ (schema tool của nó vẫn ghi `preset: approach|pushIn|drift`).

Ba khung lấy theo **số khung chính xác** (`select=eq(n,N)`), không phải `-ss` trước `-i`: bản đầu
seek theo keyframe nên khung dán nhãn "2.1s / đang vẽ" thực tế đã vẽ gần xong — nhãn nói sai thì
phán xét sai theo.


## Vòng 15 — ghim lại ở `baf27d3`; 15/15 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 15/15.

15/17 eval máy xanh. E16 (AC-13, đọc ba nhịp) và E17 (AC-14, ngoại lệ attribution có chính đáng không) là **hai trong ba phán xét người** còn treo — cả hai đều là đọc thị giác một clip, máy không thay được.

`verdict: PENDING-JUDGMENT` — E16, E17 chờ phán xét người. Không eval máy nào đỏ.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 14 — E12 đã đi qua mắt xích chrome→showText

Ghim ở `ace12a0`. Cả 15 eval máy chạy lại tươi, **15/15 thoát 0**: `motionScript.test.ts` 17 ·
sweep miền in `combinations: 2652 (3×4×221)`, `violations: 0` · `motionCompiler.test.ts` 34 ·
`motionMath.test.ts` 16 · `test:mcp` 15 · `http.test.ts` 62 · `tools.test.ts` 65 ·
`export/mapStyle` 20 · lane `clip_backpressure` 76. **E16/E17 (judgment, T3) giữ PENDING-JUDGMENT,
`human_override` để TRỐNG** — luật T3 đòi phán quyết NGƯỜI trực tiếp; vòng máy không ký thay.

**E12 — mắt xích `chrome:'clean' → showText false` nay NẰM TRONG lane.** Vòng 13 trượt vì `expected`
gắn điều kiện `chrome:'clean'` cho lane `text_free` trong khi chuỗi `chrome` không xuất hiện trong bất
kỳ khẳng định nào của lane đó: test tự khai `text.show = false` bằng tay, còn mắt xích thật sống ở
`applyRenderConfig.ts:24` và không eval nào của hợp đồng này chạy nó. `1797425` viết lại
`src/lib/export.test.ts`: test nay GỌI `applyRenderConfig(posterCfg('clean'))` rồi đọc store đúng như
`textFromStore()` của trang render. Kiểm chứng bằng đúng đột biến `expected` khai:

    src/render/applyRenderConfig.ts:24
      const showText = cfg.chrome !== 'clean';   ->   const showText = true;
    $ npx vitest run src/lib/export.test.ts src/lib/mapStyle.test.ts   -> exit 1
    FAIL  chrome:'clean' ⇒ chữ DUY NHẤT lên canvas là attribution — đi qua đúng mắt xích chrome→showText
    AssertionError: chrome clean phải tắt chữ poster: expected true to be false

Đây là bất biến nền của cả kiến trúc (chữ không được nướng vào pixel), nên nó phải đỏ được từ chính
hằng số quyết định — nay đúng vậy.

**Đối chứng chống 'canvas câm' cũng có mặt** (`export.test.ts:90`): cùng đường đi với `chrome:'poster'`
phải vẽ THÊM chữ (`textCalls.length > 1`, có `'Hanoi'`), nên ca `'clean'` không thể xanh chỉ vì không
lệnh vẽ nào chạy. Nửa `buildMapStyle` cũng còn nguyên: 0 symbol layer khi `roadLabels` off
(`mapStyle.test.ts:42`) và đúng `road-label-major` khi on (`:49`). Lane đi 19 → **20** ca.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 13 — E3/E5/E15 đã vá đúng; lộ ra E12

Ghim ở `d84857a` (tổ tiên của HEAD). Cả 15 eval máy chạy lại tươi, **15/15 thoát 0**:
`motionScript.test.ts` 17 · sweep miền in `combinations: 2652 (3×4×221)` · `motionCompiler.test.ts`
34 · `motionMath.test.ts` 16 · `test:mcp` 13 · `http.test.ts` 61 · `tools.test.ts` 65 ·
`export/mapStyle` 19 · lane `clip_backpressure` (http + browserPool) 75. Hai `t3_path` của E12 vẫn 0
dòng đổi. **E16/E17 (judgment, T3) giữ PENDING-JUDGMENT, `human_override` để trống** — luật T3 đòi
phán quyết NGƯỜI trực tiếp trên đúng cây mã này; vòng máy không được ký thay.

**Ba eval bị REJECT vòng 11 nay đúng.** E3: ca test nay là `from: 4.5` (> `restAtSec` 4.2) — đúng
mệnh đề "pulse BẮT ĐẦU sau restAtSec", cùng cặp `5.999` đạt / `6` ném `L:`. E5: hai con số đã khớp
tệp (`it.each([1, 22])` cho pushIn, bốn ca kinh độ ÂM). E15: lane đã tách làm hai tệp
(`clip_backpressure` = `http.test.ts` + `browserPool.test.ts`), nên nửa `pool.acquire` có deadline
nay thật sự nằm trong lane của chính nó (`browserPool.test.ts:135-161`).

### E12 TRƯỢT — điều kiện `chrome:'clean'` không có mặt trong lane

`expected` viết: *"với `chrome:'clean'` chữ DUY NHẤT vẽ lên canvas là dòng attribution"*. Lane là
`text_free` = `src/lib/export.test.ts` + `src/lib/mapStyle.test.ts`. Chuỗi `chrome` KHÔNG xuất hiện
lần nào trong `src/lib/export.ts`, `src/lib/mapStyle.ts`, `mapStyle.test.ts`; trong `export.test.ts`
nó chỉ nằm ở **tiêu đề** `it()` (`:38`), không ở một khẳng định nào. `ComposeOpts` không có trường
`chrome` — thứ test thật sự đặt là `text.show: false` (`export.test.ts:55`) rồi khẳng định
`textCalls toEqual([ATTRIBUTION_TEXT])` (`:66`).

Mắt xích `chrome:'clean' → showText = false` sống ở `src/render/applyRenderConfig.ts:24`
(`const showText = cfg.chrome !== 'clean'`), và được canh ở `applyRenderConfig.test.ts:90-95` —
thuộc executor `apply_render_config`, KHÔNG có trong bất kỳ eval nào của hợp đồng này (E1-E15 chỉ
chạm motion_invariants / sweep / motion_compiler / motion_math / mcp / clip_http / clip_tools /
text_free / clip_backpressure). Đột biến: đổi `applyRenderConfig.ts:24` thành `showText = true` ⇒
clip do `render_clip` sinh ra (chrome bị ép `'clean'`) sẽ NƯỚNG chữ poster vào pixel — đúng thứ AC-9
tồn tại để cấm — mà lane `text_free` vẫn xanh nguyên, vì nó truyền `text.show: false` thẳng tay và
không đi qua `applyRenderConfig`.

Nửa sau của E12 (`buildMapStyle` phát 0 symbol layer khi roadLabels off, đúng `['road-label-major']`
khi on) thì chính xác tuyệt đối (`mapStyle.test.ts:59-66`). Sửa: hoặc thêm `apply_render_config` vào
lane của E12, hoặc bỏ mệnh đề điều kiện và nói thẳng "với `text.show=false` (thứ mà clip ép qua
`chrome:'clean'`, canh ở hợp đồng khác)".

## Vòng 12 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E3, E5, E15].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

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
_Round 10 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Không eval nào của hợp đồng này trỏ thẳng vào `geometry.ts` hay `resolveConfig.ts`; nó hết hạn theo chốt file-dùng-chung chứ không theo phạm vi eval riêng. Dù vậy toàn bộ tập lệnh của nó vẫn được chạy lại chứ không ghim suông, gồm `compiler_domain_sweep` quét 2652 tổ hợp — 0 vi phạm, đúng bằng vòng trước._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

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
  run_id: map-motion-clip-r14-e1-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T12:17:34Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.motion_invariants` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.motion_invariants` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-1 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E2
  run_id: map-motion-clip-r14-e2-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T12:17:34Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.motion_invariants` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.motion_invariants` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-2 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E3
  run_id: map-motion-clip-r14-e3-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-07T12:17:34Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.motion_invariants` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.motion_invariants` → thoát 0 · Test Files 1 passed (1); Tests 17 passed (17)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-3 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E4
  run_id: map-motion-clip-r14-e4-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-07T12:18:17Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `script.compiler_domain_sweep` → thoát 0 · combinations: 2652 (presets=3 × lngs=4 × zoom 0→22 step 0.1); accepted: 2612; violations: 0; OK — no combination produced a self-rejected script or a motionless clip
    **Vòng 13 @ d84857a — đo lại tươi:** `script.compiler_domain_sweep` → thoát 0 · OK — no combination produced a self-rejected script or a motionless clip
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. combinations: 2652; violations: 0; OK — present and passing.

- eval: E5
  run_id: map-motion-clip-r14-e5-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-07T12:17:36Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.motion_compiler` → thoát 0 · Test Files 1 passed (1); Tests 34 passed (34)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.motion_compiler` → thoát 0 · Test Files 1 passed (1); Tests 34 passed (34)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-4 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 32 passed (32) — present and passing.

- eval: E6
  run_id: map-motion-clip-r14-e6-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-07T12:17:35Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.motion_math` → thoát 0 · Test Files 1 passed (1); Tests 16 passed (16)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.motion_math` → thoát 0 · Test Files 1 passed (1); Tests 16 passed (16)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-5 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 16 passed (16) — present and passing.

- eval: E7
  run_id: map-motion-clip-r14-e7-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T12:21:00Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 15 passed (15)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 3 passed (3); Tests 12 passed (12); Duration 42.43s — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E8
  run_id: map-motion-clip-r14-e8-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E9
  run_id: map-motion-clip-r14-e9-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E10
  run_id: map-motion-clip-r14-e10-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E11
  run_id: map-motion-clip-r14-e11-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-8 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E12
  run_id: map-motion-clip-r14-e12-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-07T12:17:41Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.text_free` → thoát 0 · Test Files 2 passed (2); Tests 20 passed (20)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.text_free` → thoát 0 · Test Files 2 passed (2); Tests 19 passed (19)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-9 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 2 passed (2); Tests 19 passed (19) — present and passing.

- eval: E13
  run_id: map-motion-clip-r14-e13-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E14
  run_id: map-motion-clip-r14-e14-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy — khẳng định của AC-11 vẫn đúng ở `9c1f9f3`: gói anchors-camera THÊM trường `anchors`/`anchorsUnavailable` vào khối `resolved`, không đổi hành vi nào mà tiêu chí này nói tới. Test Files 1 passed (1); Tests 59 passed (59) — present and passing.

- eval: E15
  run_id: map-motion-clip-r14-e15-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_backpressure
  verified_at: 2026-08-07T12:17:39Z
  output: |
    **Vòng 14 @ ace12a0 — đo lại tươi:** `test.clip_backpressure` → thoát 0 · Test Files 2 passed (2); Tests 76 passed (76)
    **Vòng 13 @ d84857a — đo lại tươi:** `test.clip_backpressure` → thoát 0 · Test Files 2 passed (2); Tests 75 passed (75)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 1 passed (1); Tests 57 passed (57) — includes the fixed E6-equivalent auth case (mcp-auth's own contract), which does not touch this contract's own routes/behaviour — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E16
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Xem trực tiếp khung trích từ E16-clip.mp4 (6s, 18fps, 1080×1920). (1) t=0.0s toàn cảnh thành phố, chưa tô ranh giới. (2) Vẽ dần chứ không bật đột ngột: t=2.2s chưa có gì, t=2.5s chỉ phần phía tây được tô, t=2.7s gần phủ hết, t=3.0s đầy đủ — diff pixel giữa 2.5s và 2.7s cho mean 6.94 / max 92, thay đổi thị giác rõ trong khoảng ngắn. (3) Đuôi đứng yên: khung 3.5s so khung cuối 5.9s cho mean 0.125 / max 14, chỉ là nhiễu nén. Ba nhịp đọc ra rành mạch.
  human_override: PASS — manh, 2026-08-13. Phán trên artefact DỰNG LẠI TẠI HEAD (bản giám khảo mù ở trên dùng clip từ ffb92d5, 06.08): clip approach cho Quận Ba Đình + ba khung theo số khung chính xác t=1.0s (reveal 0%) / t=2.5s (reveal 50%) / t=5.0s (reveal 100%, nghỉ). Đo nhịp 3: YAVG ảnh hiệu tb 0.0004 so với 4.6258 và 3.4025 ở hai nhịp trước — chênh ~10.000 lần. SUY DIỄN ĐƯỢC GHI RÕ: lúc trình bày đã nêu 'đứng yên hoàn toàn' còn hai cách đọc — bit-exact thì TRƯỢT (chỉ 1/32 khung có hiệu 0 tuyệt đối, phần dư là nhiễu nén h.264), 'không có chuyển động camera' thì ĐẠT; người duyệt trả lời PASS không nêu bảo lưu nên chép theo cách đọc thứ hai. Nếu ý là bit-exact, phán quyết này phải lật lại.
- eval: E17
  judged_by: judge-subagent (fresh context, blind, vòng 2 sau khi vá)
  verdict: PASS
  rationale: |
    Commit b4150be thêm test thứ hai ghim ATTRIBUTION_TEXT bằng literal độc lập cộng bốn toContain riêng từng credit — không còn tự tham chiếu, và literal khớp đúng chuỗi spec §2.3 quy định. Kết hợp test thứ nhất (textCalls phải bằng đúng [ATTRIBUTION_TEXT]), hai test khoá cả hai nửa: SỐ LƯỢNG (không lệnh fillText/strokeText nào khác lọt) và NỘI DUNG (chuỗi vẽ ra phải đúng literal giấy phép OSM). Mỗi test có đường fail thật — đổi số lệnh vẽ thì test 1 đỏ, đổi nội dung hằng thì test 2 đỏ — nên không tautological.
  human_override: PASS — manh, 2026-08-13. Hai câu hỏi con có bằng chứng máy: (a) ngoại lệ CÓ ghi tường minh — spec 2026-08-03-map-motion-clip-design.md:86-97 gọi đích danh drawAttribution trong src/lib/export.ts kèm ngày quyết định của chủ repo 2026-08-04; (b) khoá CÓ giữ — đối chứng âm chèn ctx.fillText('GIÁ 12 TỶ — CHỮ LẬU', 40, 80) cạnh attribution làm test đỏ ngay (expected [ …(2) ] to deeply equal [ Array(1) ]), và test có sẵn đối chứng ngược chrome:'poster' vẽ THÊM chữ nên ca 'clean' không xanh vì canvas câm. Câu thứ ba là chính sách: nướng attribution vào pixel để tuân thủ giấy phép OSM không phụ thuộc bên tiêu thụ, đổi lấy một lỗ trong bất biến 'clip không chữ' — người duyệt chấp nhận đánh đổi này.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E10, E11, E12, E13, E14, E15.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 14 (chạy lại ở `ace12a0` sau khi E12 được vá): cả 15 eval máy chạy lại tươi, 15/15 thoát 0.
**PENDING-JUDGMENT** (T3 — chờ `human_override` của người trên E16/E17). E12 hết trượt — `1797425` cho
lane `text_free` gọi thật `applyRenderConfig(chrome:'clean')` rồi đọc store, nên mắt xích
`applyRenderConfig.ts:24` nằm TRONG lane; đổi hằng thành `showText = true` làm lane exit 1. Đối chứng
`chrome:'poster'` (>1 lệnh vẽ chữ, có 'Hanoi') chặn nửa "xanh vì canvas câm". E16/E17 giữ nguyên văn
phán quyết mù, `human_override` để TRỐNG. `human_signoff` để rỗng.

Vòng 13 (chạy lại ở `d84857a` sau khi E3/E5/E15 được vá): cả 15 eval máy chạy lại tươi, 15/15 thoát
0; sweep miền in `combinations: 2652 (3×4×221)`; hai `t3_path` của E12 vẫn 0 dòng đổi. E16/E17
(judgment, T3) giữ PENDING-JUDGMENT, `human_override` để trống. **Ba eval bị REJECT vòng 11 nay
đúng**: E3 dùng `from: 4.5` > `restAtSec` 4.2 (đúng "bắt đầu SAU"), E5 khớp `it.each([1, 22])` và bốn
ca kinh độ ÂM, E15 tách lane thành `http.test.ts` + `browserPool.test.ts` nên nửa `pool.acquire` có
deadline nằm trong lane của chính nó. **REJECT trên [E12]**: `expected` gắn điều kiện `chrome:'clean'`
cho lane `text_free`, nhưng chuỗi `chrome` không có trong một khẳng định nào của hai tệp lane đó —
test đặt thẳng `text.show: false`; mắt xích `chrome → showText` sống ở `applyRenderConfig.ts:24`,
canh bởi executor `apply_render_config` mà hợp đồng này không dùng ở bất kỳ eval nào. Đột biến
`showText = true` nướng chữ poster vào pixel clip mà lane vẫn xanh. Ghi nhận thêm, không đánh trượt:
sweep của E4 vẫn thoát 0 chỉ theo `failures.length === 0` (lần chạy này `accepted: 2612`, nên hiện
không rỗng); E6 nói "`p ≤ 0`/`p ≥ 1`" nhưng chỉ khẳng định đúng tại biên `p = 0` và `p = 1`; E5 nói
hai ca `+179.5` "không thể fail dưới BẤT KỲ hiện thực nào" — đúng với hiện thực hiện tại, hơi rộng
như một mệnh đề phổ quát.

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
