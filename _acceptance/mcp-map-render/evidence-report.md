---
schema_version: 2
feature_slug: mcp-map-render
verdict: PASS
failed_evals: []
reason: "Vòng 30 ghim lại ở baf27d3: 11/11 eval máy chạy tươi, 0 đỏ; E12 chờ phán xét người."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: 4a8f9387608a537a037c1b7c769237f7f910124b
human_signoff: manh — 2026-08-14 (commit tay của người duyệt, chỉ chạm dòng human_signoff)
---

# Evidence Report: mcp-map-render

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


## Vòng 30 — ghim lại ở `baf27d3`; 11/11 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 11/11.

11/12 eval máy xanh. E12 (AC-12, dùng được làm B-roll) là **một trong ba phán xét người** còn treo. Ghi nhận cũ giữ nguyên, KHÔNG đánh trượt: E10 gắn `criterion: AC-10` qua `test.e2e`.

`verdict: PENDING-JUDGMENT` — E12 chờ phán xét người. Không eval máy nào đỏ.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 29 — E5 đã vào ĐÚNG lane của nó

Ghim ở `ace12a0`. Cả 11 eval máy chạy lại tươi, **11/11 thoát 0**: `npm test` 547 đạt / 10 bỏ qua /
0 đỏ · `npm run test:e2e` 18 đạt. **E12 (judgment, T3) giữ PENDING-JUDGMENT, `human_override` để
TRỐNG** — luật T3 đòi phán quyết NGƯỜI trực tiếp; vòng máy không ký thay.

**E5 — mệnh đề 'trang dùng lại render mỗi config tươi' nay có ca canh TRONG chính lane của E5.** Vòng
28 trượt vì ca duy nhất canh mệnh đề đó nằm sau `MCP_INTEGRATION=1`, mà lane của E5 là `npm test` —
không đặt biến ấy, nên ca bị BỎ QUA và không chống lưng gì. `5cbf235` thêm vào
`renderFrame.test.ts:314` một khối `describe` KHÔNG gate, đo hai cơ chế giữ tính chất đó. Kiểm chứng
vòng này, cả hai đột biến chạy trên chính `npm test`:

    # (a) cho configId đi bằng hash thay vì query param (điều hướng cùng tài liệu ⇒ trang không nạp lại)
    mcp-server/src/renderFrame.ts   /render.html?configId=${key}  ->  /render.html#configId=${key}
    $ npx vitest run                                  -> exit 1   (2 failed | 545 passed | 10 skipped)
    FAIL  id config đi bằng QUERY param, KHÔNG phải hash — hash là điều hướng cùng tài liệu
    AssertionError: expected null to be 'cfg-key-1'

    # (b) trang khai SAI configKey không còn bị từ chối
    gỡ cả 3 chỗ `throw new Error('... (stale page)')`
    $ npx vitest run                                  -> exit 1   (1 failed | 546 passed | 10 skipped)
    FAIL  trang khai SAI key ⇒ ném to tiếng và bị vứt khỏi hồ, không trả khung cũ
    AssertionError: promise resolved "Buffer[ 137, 80, 78, 71, ... ]" instead of rejecting

Cả hai lần đỏ đều xảy ra dưới `npm test` trần — tức ca nằm ĐÚNG trong lane E5, không phải trong bộ
gated. Xác nhận độc lập rằng khối này không gate: chạy thẳng tệp không đặt biến cho
`5 passed | 4 skipped (9)` — bốn ca bỏ qua là khối tích hợp cũ, năm ca chạy gồm hai ca mới này.

**Mệnh đề 'bản end-to-end thật sống ở bộ gated và KHÔNG chống lưng cho lane này'** vẫn đúng nguyên văn
và vẫn kiểm được: `npm test` báo `10 skipped`, trong đó có ca `a reused pooled page renders each config
fresh` ở `renderFrame.test.ts:176`.

**E12 (judgment)** — verdict và rationale của giám khảo mù giữ NGUYÊN VĂN; `human_override` để trống.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 28 — E1/E2/E7 đã vá; E5 vá một nửa

Ghim ở `d84857a` (tổ tiên của HEAD). Cả 11 eval máy chạy lại tươi, **11/11 thoát 0**: `npm test`
542 đạt / 10 bỏ qua / 0 đỏ · `npm run test:e2e` 18 đạt. **E12 (judgment, T3) giữ PENDING-JUDGMENT,
`human_override` để trống** — luật T3 đòi phán quyết NGƯỜI trực tiếp; vòng máy không ký thay.

**Ba trong bốn eval bị REJECT vòng 26 nay đúng.** E1: `lastCfg.size` được khẳng định 1080×1920
(`tools.test.ts:106`) và một renderer "nói dối" ép 640×480 vào phản hồi (`:119-126`) — kích thước
không còn tự-thoả từ `fakePng(cfg.size.*)` nữa; `toEqual([106.7, 10.78])` (`:109`) thay cho mệnh đề
dung sai cũ. E2: tên layer `highlight-outline` không còn được nêu như một thứ TỒN TẠI — sự VẮNG MẶT
của nó nay chính là điều được khẳng định (`mapStyle.test.ts:156-159`), cùng `line-blur === line-width`.
E7: `delivery.test.ts:35-41` khẳng định `dirname`/`basename` của tệp trên sink VÀ byte tệp === base64
giải mã === buffer đưa vào; phần "không có bộ giải mã PNG nào chạy ở đây" được khai TRUNG THỰC trong
chính `expected`.

### E5 TRƯỢT — một mệnh đề của nó được canh bằng đúng một ca BỊ BỎ QUA trong lane

`expected` của E5 liệt kê sáu mệnh đề, trong đó có: *"a reused pooled page renders each config fresh
(no stale frame)"*. Ca duy nhất canh mệnh đề đó là
`mcp-server/src/renderFrame.test.ts:176` — `'a reused pooled page renders each config fresh, never a
stale frame (F1 / AC-5)'` — nằm trong `suite`, mà `suite = RUN ? describe : describe.skip` với
`RUN = process.env.MCP_INTEGRATION === '1'` (`renderFrame.test.ts:14-15`).

`cmd` của E5 là `config:executors.test.api` → `npm test` → `vitest run`, KHÔNG đặt `MCP_INTEGRATION`.
Chạy lane và đọc reporter JSON:

```
skipped   a reused pooled page renders each config fresh, never a stale frame (F1 / AC-5)
```

Không gì khác trong lane render hai lần qua một trang gộp: `browserPool.test.ts` dùng page giả
(`:170-171`, `:192-197`) và gọi `renderFrame` đúng một lần; khối KHÔNG gated ở
`renderFrame.test.ts:198` dựng `__mapposter` giả và không tái dùng trang giữa hai config. Nghĩa là
lỗi stale-frame quay lại sẽ KHÔNG có một khẳng định đỏ nào dưới mệnh đề này, trong lane này.

Đây đúng là lớp khuyết mà E7 của chính tệp này khai trung thực — *"Real PNG signature + IHDR decoding
is renderFrame.test.ts under MCP_INTEGRATION=1, **outside this contract's lanes**"* — còn E5 thì
khẳng định thẳng, không kèm điều kiện. Sửa: hoặc gỡ mệnh đề khỏi E5 và trỏ nó sang một eval chạy
`config:executors.test.mcp`, hoặc thêm lane đó vào E5.

### Hai ghi chú độ phủ cho người ký (KHÔNG đánh trượt)

- **E2**, nửa "một region có polygon vượt 16 KB … **renders**": ca render thật của cấu hình đó cũng
  nằm sau `describe.skip` (`renderFrame.test.ts:148`). Nửa SAU dấu gạch ngang thì có người canh thật
  — `browserPool.test.ts:187-203` đẩy config 40 KB qua `renderFrame` và khẳng định `url.length < 200`
  cùng `not.toContain('pad')`, và `:183` ghim `/render\.html\?configId=[0-9a-f]{32}$/`. Cơ chế được
  nêu đích danh (config không được đi trong URL) phân biệt được trong lane, nên không trượt; nhưng
  động từ "renders" thì không có khẳng định nào trong lane.
- **E11**, mệnh đề "no zero-byte PNG": `tools.test.ts:162-166` chỉ khẳng định `isError === true` và
  `ok === false`, không kiểm `imageBlocks(res)` (đối lập với `:174`, chỗ có
  `expect(render).not.toHaveBeenCalled()`). Không trượt vì đột biến hiện thực (nuốt lỗi geocode rồi
  render poster trắng) sẽ đặt `ok: true` và làm `:165` đỏ.
- **E10** (ui-check): vấn đề nằm ở BẰNG CHỨNG, không ở câu chữ. `evidence/E10-step1.png` và
  `E10-step2.png` TRÙNG BYTE (`sha256 3c28279d…` cả hai), nên hai khung không thể hiện một bước
  "render" khác nhau giữa nạp-config và đo kích thước; và `e2e/render-mode.spec.ts` không chụp màn
  hình, tức lane `playwright test` không sinh ra hai khung này. Nửa MÁY của E10 thì được ghim đầy đủ
  ở `e2e/render-mode.spec.ts:93-113`.

## Vòng 27 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E1, E2, E5, E7].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

`verified_commit` cập nhật lên `b4c1d50c`.

## Vòng 26 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

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

**E2 (AC-2) — `expected` nêu tên một layer mà bộ test khẳng định KHÔNG tồn tại.**

`expected` (và cả `contract.md` AC-2) nói style dựng ra có layer **`highlight-outline`**.
`src/lib/mapStyle.ts` phát ra `highlight-dim`, `highlight-fill`, `highlight-soft-edge` — không
có `highlight-outline`. Và `src/lib/mapStyle.test.ts:156` khẳng định **ngược lại**:
`expect(layer(style, 'highlight-outline')).toBeUndefined()`. Tức `expected` nêu tên một thứ mà
sự VẮNG MẶT của nó là một bất biến được ghim. Đây không phải nói quá mờ nhạt — nó sai thẳng.

**E5 (AC-5) — "3 variant configs ⇒ mảng 3 kết quả PNG"; test dùng 2.**

`mcp-server/src/tools.test.ts:210-213`: `variants: [{theme:'ocean'}, {theme:'ruby'}]` — **hai**
variant — rồi `expect(textJson(res).count).toBe(2)` và `imageBlocks(res)).toHaveLength(2)`.
Con số 3 trong `expected` không có ở đâu cả.

**E1 (AC-1) — "PNG 1080×1920" dựa trên một fixture không thể mâu thuẫn, và "±0,05°" không tồn tại.**

Khẳng định duy nhất chạy dưới `npm test` là `tools.test.ts:98-100` (`image.width` 1080,
`image.height` 1920). Hai con số đó đến từ `fakePng(cfg.size.width, cfg.size.height)`
(`tools.test.ts:39-44`) — một buffer 30 byte ghi thẳng chiều rộng/cao **lấy từ chính request**.
Nó không thể bất đồng với thứ được yêu cầu, nên mệnh đề không phân biệt được gì. Ca kiểm kích
thước PNG thật là `renderFrame.test.ts:50-56`, nằm sau `describe.skip` khi thiếu
`MCP_INTEGRATION=1` — **không chạy** dưới `npm test`. Ngoài ra "center within ~0.05° of geocoded
lng/lat": không có khẳng định dung sai nào ở đâu; `tools.test.ts:101` so **bằng đúng** với hằng
`[106.7, 10.78]` của geocoder giả. Chi tiết nhỏ: `expected` viết `'Ho Chi Minh City'`, test
truyền `'HCMC'`.

**E7 (AC-7) — "PNG decodes" không được khẳng định.**

Ghi nhận từ lane kiểm phụ: `delivery.test.ts:24-32` kiểm path + base64 + kích thước + tệp tồn
tại, nhưng không có phép giải mã PNG nào, và đầu vào là `fakePng()` — 30 byte, không phải một
PNG giải mã được.

### Eval judgment giữ nguyên PENDING

E12 là `judgment` của một hợp đồng T3: không được vòng máy này phán, `human_override` để trống,
`evidence/E12-example.png` còn đó. Verdict tổng là REJECT vì các eval MÁY ở trên.

### Một ghi chú về E10

Khẳng định trong `e2e/render-mode.spec.ts:93-113` là thật và phân biệt được. Nhưng phần
`steps`/`screenshot` của E10 KHÔNG do `npm run test:e2e` sinh ra — nó đến từ
`_acceptance/mcp-map-render/scripts/e10-ui-check.ts`, một script mà chính đầu tệp tự nhận là
"not wired into config.yaml as an executor". Và `evidence/E10-step1.png` với `E10-step2.png`
trùng byte (cùng md5), tức "bước 1 = nạp config, bước 2 = sau render" thực chất là hai bản sao
của một khung. Không đủ để đánh trượt E10 (khẳng định máy của nó đứng vững), nhưng người ký
nên biết ảnh không nói thêm gì.

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 25 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Trong bán kính: E1-E9 và E11 (bộ tổng `npm test`, hút cả `tools.test.ts`/`http.test.ts`/`jobRunner.test.ts` đã đổi), E10 (`npm run test:e2e` — `e2e/render-mode.spec.ts` đổi, thêm bốn ca anchors). **T3: eval judgment E12 quay về chờ người** — verdict hạ xuống PENDING-JUDGMENT và `human_override` bỏ trống theo cùng lý do như `map-motion-clip`._
_Round 25 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Hợp đồng này chạy qua `executors.test.api` và `executors.test.e2e` — cả hai đều nạp resolveConfig gián tiếp, nên được chạy lại đầy đủ: 496 test đơn vị và 14 test Playwright, không cái nào đỏ._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 24 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E1, E2, E3, E4, E5, E6, E7, E8, E9, E11); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 23 — re-verification triggered by `fix/mcp-auth` landing on top of Round 22's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_(Ghi chú của vòng TRƯỚC, giữ lại làm lịch sử) Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round — not blanked, not re-scored. `risk_tier: T3` mandates a direct human verdict on every judgment item for THIS round's pinned evidence regardless of a prior round's override against a now-superseded commit, so the contract routes to **PENDING-JUDGMENT**._

_**Đính chính cho vòng này:** khác vòng trước, vòng hiện tại KHÔNG giữ `human_override` cũ. Chữ ký người ở các mục judgment được đóng ở `9a6af0f`; PR này đổi mã nguồn dùng chung nên chúng bị BỎ TRỐNG để người ký ở Cổng 2 phán quyết lại trên đúng cây `9c1f9f3`. Nội dung phán quyết của giám khảo mù (`verdict` + `rationale`) được giữ nguyên văn — chỉ dòng `human_override` bị xoá._

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
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-12 | judgment | PASS (judge) — awaiting mandatory T3 human_override for this round’s pinned evidence |

## Evidence

- eval: E1
  run_id: mcp-map-render-r29-e1-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E2
  run_id: mcp-map-render-r29-e2-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E3
  run_id: mcp-map-render-r29-e3-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E4
  run_id: mcp-map-render-r29-e4-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E5
  run_id: mcp-map-render-r29-e5-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E6
  run_id: mcp-map-render-r29-e6-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E7
  run_id: mcp-map-render-r29-e7-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E8
  run_id: mcp-map-render-r29-e8-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E9
  run_id: mcp-map-render-r29-e9-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E10
  run_id: mcp-map-render-r29-e10-20260807
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T12:19:20Z
  screenshot: evidence/E10-step1.png
  observed: |
    Chạy lại tươi vòng 25 ở `9c1f9f3`: `npm run test:e2e` — 18 xanh (1.0m), gồm e2e/render-mode.spec.ts:93 (AC-10). Số ca tăng 14 → 18 vì gói anchors-camera thêm bốn ca `anchors:` vào chính tệp spec này; ca AC-10 của hợp đồng này không đổi và vẫn xanh. Khung được MỞ LẠI bằng multimodal Read trong vòng này, không chép mô tả cũ:
    E10-step1.png: khung dọc 1080x1920 một màu navy đặc, chỉ có dòng ghi công nhỏ "© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre" ở góc trên-phải và góc dưới-phải; tuyệt đối không có modal onboarding, nút, hay lớp phủ giao diện nào — khớp 'no onboarding modal visible'.
    E10-step3.png: bản đồ TP.HCM tông midnight-blue, mạng đường vàng-hổ-phách dày đặc, sông Sài Gòn uốn khúc chạy từ trên xuống phải, đường băng sân bay Tân Sơn Nhất rõ ở góc trên-trái, mặt nước xanh đậm phân biệt được với nền; không có chữ tiêu đề (chrome:'clean'), không ô tile trống, không mảng vỡ hay răng cưa ở biên — khớp 'renderFrame() PNG đúng 1080x1920' và trình tự nạp-config → render → đúng kích thước.
  network_observed: n-a (tool-error: frames read from committed evidence/, not re-captured live this round)

- eval: E11
  run_id: mcp-map-render-r29-e11-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 29 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 28 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E12
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Ảnh 1080×1920 đúng khung tiktok, nền navy với đường phố vàng cam đặc trưng midnight-blue; lưới đường và khối nhà liền mạch, không ô tile trống/vỡ hay răng cưa. Ghim trắng nằm gần chính giữa khung (≈540/1080 ngang, 910/1920 dọc — lệch nhẹ ~50px) và tương phản rõ trên nền tối. Đủ cả ba yêu cầu của AC-12: căn giữa, highlight rõ, tile/đường không vỡ.
  human_override: PASS — manh, 2026-08-13. Phán trên ảnh DỰNG LẠI TẠI HEAD: Võ Văn Tần, Quận 3 HCMC, tiktok 1080×1920, midnight-blue, point highlight, zoom 16. Tiêu chí 'căn đúng giữa' có bằng chứng cấu trúc chứ không phải mắt — resolved.center [106.6893957, 10.7758788] TRÙNG ĐÚNG toạ độ điểm highlight, nên căn giữa là theo cấu trúc; pin nằm cao hơn tâm khung vì mũi pin mới là điểm neo. Hai tiêu chí còn lại (highlight đọc được, tile/đường không vỡ) thuần thị giác, người duyệt xác nhận.
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E11.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 29 (chạy lại ở `ace12a0` sau khi E5 được vá): cả 11 eval máy chạy lại tươi, 11/11 thoát 0.
**PENDING-JUDGMENT** (T3 — chờ `human_override` của người trên E12). E5 hết trượt — `5cbf235` thêm khối
trang-giả KHÔNG gate ở `renderFrame.test.ts:314`, chạy ngay trong `npm test`; đột biến chuyển `configId`
sang hash và đột biến gỡ chốt `stale page` đều làm `npm test` exit 1. Mệnh đề "bản gated không chống
lưng cho lane này" vẫn đúng và vẫn quan sát được qua `10 skipped`. E12 giữ nguyên văn phán quyết mù,
`human_override` để TRỐNG. `human_signoff` để rỗng.

Vòng 28 (chạy lại ở `d84857a` sau khi E1/E2/E5/E7 được vá): cả 11 eval máy chạy lại tươi, 11/11 thoát
0 (`npm test` 542/10/0, `npm run test:e2e` 18/18). E12 (judgment, T3) giữ PENDING-JUDGMENT,
`human_override` để trống. **Ba trong bốn eval nay đúng**: E1 có renderer "nói dối" ép 640×480 nên
kích thước không còn tự-thoả, cùng `toEqual([106.7, 10.78])`; E2 nêu `highlight-outline` như một thứ
VẮNG MẶT (đúng bất biến được ghim ở `mapStyle.test.ts:156-159`); E7 khẳng định dirname/basename +
byte tệp === base64 giải mã === buffer vào, và tự khai là không có bộ giải mã PNG nào chạy.
**REJECT trên [E5]**: mệnh đề "a reused pooled page renders each config fresh (no stale frame)" chỉ
có một ca canh — `renderFrame.test.ts:176` — và ca đó nằm sau `describe.skip` khi thiếu
`MCP_INTEGRATION`; lane của E5 là `npm test`, không đặt biến đó, nên reporter JSON ghi ca ấy
`skipped`. Không gì khác trong lane render hai lần qua một trang gộp. Ghi nhận thêm, không đánh
trượt: nửa "một region >16 KB **renders**" của E2 cũng chỉ có ca bị bỏ qua (nửa "config không đi
trong URL" thì được `browserPool.test.ts:187-203` canh thật); "no zero-byte PNG" của E11 không có
khẳng định trực tiếp nhưng đột biến hợp lý vẫn làm `:165` đỏ; và bằng chứng ảnh của E10 —
`E10-step1.png` với `E10-step2.png` TRÙNG BYTE (`sha256 3c28279d…`), mà `e2e/render-mode.spec.ts`
vốn không chụp màn hình nên lane của E10 không sinh ra hai khung đó.

Vòng 26 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 11 eval máy chạy lại tươi, 11/11 thoát 0 (`npm test` 527/9/536, `npm run test:e2e` 18/18). E12 (judgment, T3) giữ PENDING-JUDGMENT, `human_override` để trống. **REJECT trên [E1, E2, E5, E7]**. Nặng nhất là E2: `expected` — và cả `contract.md` AC-2 — nêu tên layer `highlight-outline`, mà `mapStyle.ts` không hề phát ra layer đó và `mapStyle.test.ts:156` khẳng định nó `toBeUndefined()`; eval nêu tên một thứ mà sự VẮNG MẶT của nó là bất biến được ghim. E5 nói 3 variant, test dùng 2 (`count).toBe(2)`). E1 dựa "PNG 1080×1920" vào `fakePng(cfg.size.width, cfg.size.height)` — một fixture ghi lại chính kích thước được yêu cầu nên không thể mâu thuẫn — và mệnh đề "center within ~0,05°" không có khẳng định dung sai nào; ca kiểm kích thước PNG thật nằm sau `describe.skip`. E7 khai "PNG decodes" mà không có phép giải mã nào. Ghi nhận thêm: AC-6 ("cả hai transport phơi CÙNG một tập tool") không được phân biệt — `transports.test.ts` chỉ `toContain` 5 tên trên mỗi transport, không bao giờ so hai tập với nhau; và ảnh bằng chứng `E10-step1.png`/`E10-step2.png` trùng byte.

Vòng 25 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `tools.ts`/`http.ts`/`jobRunner.ts`/`renderFrame.ts`/`main.tsx`. Cả 11 eval máy chạy lại tươi — 11/11 xanh; `npm test` 527 xanh | 9 bỏ qua, `npm run test:e2e` 18 xanh (14 → 18 vì gói anchors thêm bốn ca). E12 (judgment, T3) trở lại chờ người: verdict PENDING-JUDGMENT, `human_override` bỏ trống. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 24 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E4, E5, E6, E7, E8, E9, E11 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 23: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
