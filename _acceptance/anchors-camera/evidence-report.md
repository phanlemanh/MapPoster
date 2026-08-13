---
schema_version: 2
feature_slug: anchors-camera
verdict: PASS
failed_evals: []
reason: "Vòng 6 ghim lại ở baf27d3: 20/20 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: f557763d0abed97665ef09b902ccb2e320cbfbb2
human_signoff:
---

# Evidence Report: anchors-camera

## Vòng ghim lại ở `f557763` — thêm `scripts/check-deploy-drift.sh`

Kích hoạt: PR #45 thêm **một** tệp, `scripts/check-deploy-drift.sh`. Nó KHÔNG thuộc `t1_skip_globs` — danh sách đó chỉ miễn hai đường dẫn CHÍNH XÁC của bộ gate vendored, không phải `scripts/**` — nên mọi hồ sơ ghim ở `baf27d3` hết hiệu lực theo commit. **Không nới danh sách miễn trừ để lách**: sửa cái thước cho lọt thay đổi của chính mình là đúng thứ cổng này sinh ra để chặn. Chạy lại verify thay vì đổi luật.

Cả 188 eval máy của 12 gói chạy lại tươi ở commit này, **188/188 thoát 0**.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Vòng 6 — ghim lại ở `baf27d3`; 20/20 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 20/20.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 5 — ba eval trượt của vòng 4 đã được vá thật

Ghim ở `ace12a0` (tổ tiên của HEAD — ở đây chính là HEAD). Cả 20 eval chạy lại tươi, **20/20 thoát 0**:
`anchors.test.ts` 13 · `renderFrame.test.ts` 5 đạt/4 bỏ qua · `tools.test.ts` 65 · `http.test.ts` 62 ·
`jobRunner.test.ts` 28 · `export/mapStyle` 20 · `npm test` 547 đạt / 10 bỏ qua / 0 đỏ · `test:e2e` 18 ·
`test:mcp` 15 · `anchors-invariants` mọi bất biến còn giữ.

**E18 (I6) — nay canh ở cấp CALL SITE, và đỏ được.** Vòng 4 trượt vì `expected` khai một phép thử đột
biến sẽ ĐỎ mà nó vẫn XANH: miễn trừ theo TỆP để `renderFrame.test.ts` — chính tệp mang bằng chứng duy
nhất của AC-6 cho E9 — nằm ngoài tầm quét. `60d1d62` bỏ hẳn miễn trừ theo tệp: `anchors-invariants.ts`
quét **38 tệp test** tìm mọi call site `.skip(` / `.todo(` / `.skipIf(` / `.runIf(`, và chỉ chấp nhận
đúng một cách gác — bí danh `RUN ? describe : describe.skip` (không sinh call site) với điều kiện phải
đến từ `process.env`. Kiểm chứng độc lập vòng này, hai đột biến, cả hai đỏ:

    # (a) tắt lặng lẽ MỘT ca ở một tệp bất kỳ
    mcp-server/src/geometry.test.ts:5   it(  ->  it.skip(
    $ npx tsx _acceptance/anchors-camera/scripts/anchors-invariants.ts   -> exit 1
    FAIL I6  test bị TẮT tại: mcp-server/src/geometry.test.ts:5 (it.skip) — exit 0 không phân biệt được xanh với bị tắt
    $ npx vitest run mcp-server/src/geometry.test.ts                     -> exit 0
          Tests  9 passed | 1 skipped (10)          <- đúng lý do I6 tồn tại

    # (b) điều kiện gác KHÔNG đến từ process.env
    mcp-server/src/renderFrame.test.ts:14  const RUN = process.env.MCP_INTEGRATION === '1'  ->  const RUN = false
    $ npx tsx _acceptance/anchors-camera/scripts/anchors-invariants.ts   -> exit 1
    FAIL I6  mcp-server/src/renderFrame.test.ts: điều kiện gác `RUN` không đến từ process.env

Đột biến (a) nêu đích danh `tệp:dòng` như `expected` hứa, và cùng lúc `vitest` vẫn thoát 0 — đó là bằng
chứng trực tiếp cho câu "exit code KHÔNG phân biệt được xanh với bị tắt" mà E20 dựa vào. `it.skip` ở
`renderFrame.test.ts:272` (ca pitch-30 của E9) nay đã sống lại và nằm trong tầm quét: xác nhận ca đó
tồn tại và chạy thật (`renderFrame.test.ts:272`, ngoài khối gated).

**E14/E15 — bất biến XOR nay có khẳng định ở TỪNG lối ra của cả hai lane.** Vòng 4 trượt vì hai lane
không phân biệt được nửa "phát ra CẢ HAI". `60d1d62` thêm ca XOR đo bằng
`('anchors' in resolved) !== ('anchorsUnavailable' in resolved)` vào `http.test.ts` (+48 dòng) và
`jobRunner.test.ts` (+21). Đúng phép thử mà `expected` khai, chạy vòng này:

    # cho resolvedOfClip phát CẢ HAI ở nhánh đo-được (tools.ts:109-111)
    $ npx vitest run mcp-server/src/http.test.ts        -> exit 1   (1 failed | 61 passed)
      FAIL  POST /render-clip > resolved mang camera + anchors trên CẢ BA lối ra: 200, degrade encode, và 422 quá cỡ
    $ npx vitest run mcp-server/src/jobRunner.test.ts   -> exit 1   (2 failed | 26 passed)
      FAIL  PR #6: mỗi việc mang anchors + camera của CHÍNH nó, không phải của việc chạy trước
      FAIL  PR #6: degrade encoder và từ chối quá cỡ VẪN mang camera + anchors

Trước bản vá, cùng đột biến đó để `http.test.ts` 61/61 và `jobRunner.test.ts` 28/28 xanh. Nay cả hai đỏ.

**Không hồi quy.** `renderFrame.test.ts` được hợp đồng anh em `mcp-map-render` thêm một khối `describe`
mới (dòng 314, không gate) trong cùng đợt vá; khối đó KHÔNG chiếm chỗ của khối "trang giả" mà E9/E13
dựa vào — ca `pitch 30` vẫn ở `:272` và ca XOR mức hàm vẫn ở `:289`. Lane `render_frame` đi từ
3 đạt/4 bỏ qua lên 5 đạt/4 bỏ qua, thuần cộng thêm.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 4 — I6 đứng vững, nhưng ba `expected` vẫn nói quá

Ghim ở `d84857a` (`git merge-base --is-ancestor d84857a HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD).
Cả 20 eval chạy lại tươi, **20/20 thoát 0**: `anchors.test.ts` 13 · `renderFrame.test.ts` 3 đạt/4 bỏ
qua · `tools.test.ts` 65 · `http.test.ts` 61 · `jobRunner.test.ts` 28 · `export/mapStyle` 19 ·
`npm test` 542 đạt / 10 bỏ qua / 0 đỏ · `playwright` 18 · `test:mcp` 13 · `anchors-invariants` 38 dòng
`ok`. Như bốn vòng trước, **thoát 0 không phải tiêu chuẩn**: câu hỏi là từng mệnh đề `expected` có
người canh và người đó có phân biệt được hay không.

### I6 — bản vá LÀM ĐƯỢC việc nó hứa (tái dựng M-D, không tin lời)

Mọi đột biến chạy trong `git worktree --detach d84857a` dùng-một-lần; cây làm việc thật KHÔNG bị
đụng (`git status --short` rỗng trước và sau).

| đột biến | lane E20 (`npm test`) | lane E18 (`anchors-invariants`) |
|---|---|---|
| — (nền) | thoát 0 · `542 passed \| 10 skipped (552)` | thoát 0 · `ok I6 không .skip nào ngoài 3 tệp gated (quét 38 tệp test)` |
| **M-D**: `it(` → `it.skip(` ở `tools.test.ts:98` | thoát 0 · `541 passed \| 11 skipped (552)` | **thoát mã 1** · `FAIL I6 test bị TẮT ngoài khối gated: mcp-server/src/tools.test.ts` |
| `it.only(` ở `anchors.test.ts` (không gated) | — | **thoát mã 1** · ``FAIL I6 `.only` bỏ quên ở: src/render/anchors.test.ts`` |
| `describe.only(` ở `renderFrame.test.ts` (gated) | — | **thoát mã 1** · ``FAIL I6 `.only` bỏ quên ở: mcp-server/src/renderFrame.test.ts`` |
| `it.skip(` ở `renderFrame.test.ts` (gated) | — | thoát 0 — đúng thiết kế, ba tệp gated được miễn |

M-D tái dựng ĐÚNG con số vòng 5 ghi (`541 passed | 11 skipped`, lane vẫn xanh), và nay I6 bắt được.
Nửa `.only` bắn ở CẢ tệp gated lẫn không gated, đúng như E18 nói. Danh sách `GATED` khớp thực tế:
`grep -rn MCP_INTEGRATION` toàn repo trả về ĐÚNG ba tệp test đặt cổng (`renderFrame.test.ts:14`,
`renderClip.test.ts:13`, `stdioChannel.test.ts:10`), không thừa không thiếu. Phạm vi quét cũng đủ:
`git ls-files '*.test.ts' '*.spec.ts'` trả 38 tệp, và toàn repo KHÔNG còn tệp test nào mang đuôi
khác (`.test.tsx`/`.spec.js`… — 0 kết quả), nên "quét 38 tệp" là toàn bộ, không phải một mẫu. Mười ca
bị bỏ qua ở lane nền cũng đều nằm trong ba tệp gated (4 ở `renderFrame`, 6 ở hai tệp còn lại).

### E18 TRƯỢT — mệnh đề "ngoài khối gated" sai ở đúng chỗ hợp đồng này cần nó nhất

`expected` của E18 viết: *"đổi một `it(` thành `it.skip(` **ngoài khối gated** phải làm ĐỎ"*. I6 miễn
theo **TỆP** (`if (GATED.includes(f)) continue;`, `anchors-invariants.ts:273`), không theo khối. Mà
chính `evals.yaml:9-13` của hợp đồng này ghi rõ `renderFrame.test.ts` chứa **HAI** khối: khối cũ bị
gate, và khối "trang giả" ở `:198` KHÔNG bị gate — nó chạy trong `npm test` mặc định và là chỗ duy
nhất chứng minh AC-6 cho E9. Phản ví dụ chạy thật:

```
it.skip('pitch 30: clip render ĐỦ khung + settle, …')   # renderFrame.test.ts:272, NGOÀI khối gated
lane E18 (anchors-invariants)          → thoát 0   ok I6 không .skip nào ngoài 3 tệp gated
lane E9  (npx vitest run renderFrame)  → thoát 0   Tests  2 passed | 5 skipped (7)
```

Ca test mà E9 nêu đích danh bị tắt lặng lẽ, và cả hai lane vẫn xanh. Từ "khối" trong tài liệu này có
nghĩa hẹp đã được chính nó đặt ra, nên đây không phải cách đọc khiên cưỡng. Cách sửa trung thực nhất
là siết I6 xuống mức KHỐI (chỉ miễn `describe` nằm sau `RUN ?`), sau đó cả E18 lẫn câu dẫn của E20
mới đúng nguyên văn.

### E14 và E15 TRƯỢT — "bất biến XOR" chỉ được canh một chiều

Đột biến: cho `resolvedOfClip` phát ra CẢ HAI trên nhánh đo-được
(`tools.ts:110`, thêm `anchorsUnavailable: 'MUTANT'`).

| lane | kết quả |
|---|---|
| E13 `tools.test.ts` | **ĐỎ** `2 failed \| 63 passed` — `tools.test.ts:749` khẳng định `('anchors' in r) !== ('anchorsUnavailable' in r)` |
| E12 `anchors-invariants` | **ĐỎ** `FAIL I3 resolvedOfClip(đo được) phát ra ĐÚNG MỘT: anchors=true, anchorsUnavailable=true` |
| **E14 `http.test.ts`** | XANH `61 passed (61)` |
| **E15 `jobRunner.test.ts`** | XANH `28 passed (28)` |

Đột biến ngược (nhánh không-đo-được kèm thêm `anchors`) làm cả ba lane ĐỎ. Nghĩa là hai lane này
canh được "không phát anchors khi đã báo không đo được", nhưng KHÔNG canh được "không phát lý do khi
đã có anchors" — một nửa, không phải XOR. E14 còn liệt kê đích danh *"cả ba lối ra (200, degrade,
422)"*: cả ba đều là nhánh đo-được, và không lối nào có khẳng định "đúng một". E15 cũng vậy, dù lý do
tồn tại của nó là canh đúng lớp lỗi "dùng sai biến" ở `jobRunner`. Sửa: hoặc thêm một khẳng định
`!==` vào mỗi lane (rẻ, `http.test.ts:523` và `jobRunner.test.ts:475` là chỗ đặt), hoặc hạ chữ xuống
"nhánh không-đo-được không kèm anchors" và trỏ phần XOR đầy đủ về E12/E13.

### E20 KHÔNG trượt — nhưng câu dẫn của nó thừa hưởng đúng lỗ của E18

Mệnh đề mang tải của E20 khớp chính xác lane: `npm test` cho `542 passed | 10 skipped | 0 failed`, và
câu *"nó KHÔNG phân biệt được xanh với bị tắt"* đã được M-D chứng minh nguyên văn. Câu cuối —
*"tính chất 'không ca nào bị tắt lặng lẽ' do bất biến I6 gánh, xem E18"* — đúng ở mọi tệp TRỪ ba tệp
được miễn, mà một trong ba (`renderFrame.test.ts`) lại nằm trong chính bộ `npm test` của E20. Đây là
cùng một khiếm khuyết với E18 chứ không phải khiếm khuyết thứ hai: siết I6 xuống mức khối là đủ chữa
cả hai. Ghi ở đây để người ký đọc E20 KHÔNG hiểu là tính chất ấy đã kín.

_Vòng 3 — merge main rồi chạy lại; verdict giữ nguyên_

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN PASS.** Không lane nào đổi kết quả so với vòng trước. `human_signoff` vẫn rỗng — Cổng 2 chờ người ký.

`verified_commit` cập nhật lên `b4c1d50c`.

_Vòng 2 — chạy lại toàn bộ ở `a46aec7` sau khi vòng 1 REJECT trên `[E2, E5]`.
`git merge-base --is-ancestor a46aec7 HEAD` trả 0: commit ghim là tổ tiên của HEAD (ở đây
nó CHÍNH LÀ HEAD). Cả 20 eval chạy lại tươi, mọi lệnh thoát 0. Nhưng như vòng 1 đã ghi,
**thoát 0 không phải tiêu chuẩn**: nhiệm vụ là kiểm từng mệnh đề `expected` có thật sự
được một khẳng định canh gác và khẳng định đó có phân biệt được hay không. Hai lỗ của vòng
1 đã bịt, và cả hai được kiểm lại bằng đúng phép thử đã đánh trượt chúng. Verdict **PASS**,
kèm MỘT đính chính chữ nghĩa bắt buộc ở E2 (không đánh trượt — xem dưới)._

## Ba phép kiểm lại của vòng 2

### 1. E5 — đột biến vòng 1 nay LÀM ĐỎ được bộ test

Đột biến chạy trong `git worktree --detach a46aec7` dùng-một-lần (cây làm việc KHÔNG bị
đụng; `git status --short` rỗng suốt vòng). Trước đột biến, trong worktree:

```
 Test Files  1 passed (1)
      Tests  13 passed (13)
```

Rồi bỏ sạch bốn chỗ nội suy `${actual.*}` khỏi ba thông điệp `problems.push` ở
`anchors.ts:182,184,185` (`center [${actual.center[0]}, ${actual.center[1]}] ≠ …` →
`center [, ] ≠ …`, `zoom ${actual.zoom} ≠ …` → `zoom  ≠ …`, tương tự `bearing`):

```
 FAIL  src/render/anchors.test.ts > assertCameraAtRest > NỔ TO khi camera lệch — zoom, center hay bearing
AssertionError: expected [Function] to throw error matching /13\.26/ but got 'anchors: map camera is not at restAtS…'
+ Received:
"anchors: map camera is not at restAtSec=3.9 (zoom  ≠ 13.25). anchors() is read-only and must be called immediately after the settle capture — refusing to return coordinates projected from an unexpected camera."
 ❯ src/render/anchors.test.ts:157:71

 Test Files  1 failed (1)
      Tests  1 failed | 12 passed (13)
```

Cùng đột biến đó ở vòng 1 để **13/13 xanh**. Nay nó đỏ tại dòng khẳng định giá trị ĐỌC
ĐƯỢC. Nửa clause từng không có đường đỏ nay có.

### 2. Đổi tên `centroidPct` → `bboxCenterPct` sạch và nhất quán trên mọi bề mặt

Quét toàn repo (trừ `node_modules`, `.git`, `dist`, `test-results`) cho chuỗi `centroidPct`
trả về **đúng một dòng**: `_acceptance/anchors-camera/evidence-report.md` — bản ghi của
vòng 1. Vòng này viết lại khối E4 theo tên hiện hành nên tên cũ chỉ còn sống trong phần
tường thuật lịch sử ở mục Iterations, không còn ở chỗ nào mô tả một lần chạy hiện tại.
Không tệp nguồn / test / e2e / README / contract / evals / script bất biến nào còn tên cũ.

Tên mới thật sự CHẢY qua đường đi, không chỉ được đổi ở chỗ khai báo:

- sinh ra: `src/render/anchors.ts:41` (kiểu `AnchorRegion`) và `:126` (`regionAnchorOf`) —
  nguồn duy nhất của trường này;
- đọc trên MapLibre THẬT: `e2e/render-mode.spec.ts:278-279`
  (`out.anchors.regions[0].bboxCenterPct[0]/[1]` toBeCloseTo 50);
- JSON của MCP `render_clip`: `mcp-server/src/tools.test.ts:614`
  (`toEqual([{ index: 0, bboxCenterPct: [50, 50], bboxPct: [10, 20, 90, 80] }])`);
- JSON của REST `POST /render-clip`: `mcp-server/src/http.test.ts:521` (cùng dạng);
- unit: `src/render/anchors.test.ts:75`.

Nói cho đúng phần bề mặt thứ ba: lối `/jobs` mang trường này về mặt CẤU TRÚC (cả ba bề mặt
đi qua CÙNG một `resolvedOfClip`, và I3 của E12 gọi THẬT hàm đó rồi khẳng định XOR), nhưng
fixture của `jobRunner.test.ts:74` đặt `regions: []` nên không có khẳng định trên GIÁ TRỊ
`bboxCenterPct` ở lối việc. Ghi ra chứ không nói "cả ba bề mặt đều assert".

Chốt biên dịch: `npx tsc -b` và `npx tsc -p mcp-server/tsconfig.json` đều thoát 0 — một tên
cũ sót lại trong mã TypeScript sẽ là lỗi biên dịch, không phải chuyện đọc mắt.

### 3. E2 / E10 / E17 / E20 — chữ đã sửa, đối chiếu lại với mã

- **E20 ĐÚNG.** `npm test` vòng này: `Test Files 33 passed | 2 skipped (35)`,
  `Tests 527 passed | 9 skipped (536)`. `expected` nói "527 test XANH + 9 SKIP … trên 33
  file — con số là 527 pass, KHÔNG phải 536 cùng chạy". Khớp từng con số.
- **E10 ĐÚNG.** `e2e/render-mode.spec.ts:350-358` khẳng định `getPitch()` toBeCloseTo(45,6),
  `mid` và `rest` đều `startsWith('data:image/png')`, `rest.length > 2000`,
  `rest !== mid`, rồi `/pitch/i` và `/45/`. Và `expected` tự nhận "KHÔNG kiểm byte PNG;
  phần byte do E11 gánh" — đúng: không có phép kiểm magic byte nào trong ca này.
- **E17 ĐÚNG.** `tools.test.ts:564-568` khẳng định `anchors.points` đúng một phần tử
  `index: 0` và `highlights.points` dài 1. `expected` nay tự nói "hiện CHỈ thử ở n=1; độ
  phủ n>1 chưa có, ghi ở Out of scope" — và `contract.md` Out of scope có đúng mục đó.
  Không còn nói quá.
- **E2 gần đúng — một mệnh đề phụ SAI.** Xem mục ngay dưới.

## Một sai sót chữ nghĩa còn lại (không đánh trượt, nhưng phải sửa trước khi ký)

`expected` của E2 viết:

> …CÓ ÍT NHẤT MỘT ca test dùng khung không vuông đủ phân biệt hai công thức (thực tế 4/6;
> **hai ca vuông là ca vùng-rỗng trả null**, không đi qua công thức nên không cần phân biệt)

Phần mang tải đúng và có khẳng định thật (`discriminating.length > 0`,
`anchors-invariants.ts:213-219`), con số 4/6 khớp stdout. Nhưng mệnh đề phụ sai: liệt kê
đúng sáu khung mà script bắt được trong `anchors.test.ts` cho thấy hai ca KHÔNG phân biệt
được là

| dòng | khung | vì sao bị loại | vuông? |
|---|---|---|---|
| `anchors.test.ts:53` | `{cssW: 0, cssH: 100}` | `cssW > 0` sai — ca khung suy biến phải NÉM | **không** |
| `anchors.test.ts:79` | `{cssW: 100, cssH: 100}` | `w !== h` sai — ca vùng rỗng trả `null` | có |

Chỉ **một** ca vuông, không phải hai; và ca còn lại không phải "vùng-rỗng trả null" mà là
ca khung suy biến. Trớ trêu là chính báo cáo vòng 1 viết đúng ("Ca vuông là
`anchors.test.ts:79`", số ít) — bản sửa `evals.yaml` đã làm số nhiều hoá nó thành sai.

Vì sao KHÔNG đánh trượt: mệnh đề sai này không nói quá độ phủ. Nó mô tả phần DƯ, và mô tả
theo hướng nếu có thì là khiêm tốn hơn thực tế, nên không thể khiến người ký tin rằng có
một chốt không tồn tại. Tiêu chuẩn của vòng chấm là "một mệnh đề chỉ được coi là thoả khi
có test khẳng định nó VÀ khẳng định đó phân biệt được" — mệnh đề mang tải của E2 thoả cả
hai. Câu sửa đúng, để người sửa khỏi phải tự soạn:

> …(thực tế 4/6; hai ca còn lại là ca khung suy biến phải ném và ca vùng-rỗng trả null,
> không đi qua công thức nên không cần phân biệt)

## Ba nghi vấn còn lại: kiểm xong, KHÔNG có vấn đề

**E1 — khung test có thật sự không vuông?** Có. Khung dùng trong `anchors.test.ts` là
1079×1921, 600×1200, 400×800, 1000×2000. Không dừng ở việc đọc số: đột biến trực tiếp lỗi
một-mẫu-số vào bản chép (`yPct = p.y / frame.cssW`) rồi chạy bộ test gốc —

```
 Test Files  1 failed (1)
      Tests  4 failed | 9 passed (13)
     70|     expect(r).not.toBeNull();
     72|     expect(r!.bboxPct).toEqual([10, 10, 30, 30]);
-   30,  +   20,
```

4 ca đỏ. Khẳng định của E1 phân biệt được thật.

**E9 — "trang giả chứng minh `anchors()` KHÔNG hề được gọi": quan sát lời gọi hay chỉ quan
sát không có lỗi?** Quan sát lời gọi. `renderFrame.test.ts:148-179` dựng `harness()` với biến
đếm `calls = { anchors: 0, motionFrames: 0 }`, và `__mapposter.anchors` là hàm thật tăng
`calls.anchors++`. Nhánh pitch 30 khẳng định `expect(calls.anchors).toBe(0)` (dòng 202); nhánh
pitch 0 khẳng định `toBe(1)` (dòng 187) — có cả đối chứng dương, nên "0" không thể là do
harness không bao giờ gọi được. Đây đúng là thứ bộ tích hợp không nói được, như comment ở đầu
khối tự nhận.

**E12 — I3 GỌI THẬT `resolvedOfClip` hay quét regex?** Gọi thật.
`anchors-invariants.ts:125-127` `await import(path.join(repoRoot, 'mcp-server/src/tools.ts'))`
rồi gọi `resolvedOfClip(probeCfg, outcome)` cho cả hai nhánh, khẳng định XOR bằng
`hasAnchors !== hasReason`. Stdout vòng này:

```
ok   I3  resolvedOfClip(đo được) phát ra ĐÚNG MỘT: anchors=true, anchorsUnavailable=false
ok   I3  resolvedOfClip(không đo được) phát ra ĐÚNG MỘT: anchors=false, anchorsUnavailable=true
```

**E8/E19 — hai nửa suppression có đỏ được không?** Có, nhưng theo hai kiểu khác nhau.

E8 đỏ được, và điều đó được chứng minh bằng đối chứng âm do vòng chấm tự viết
(`negctrl/anchors-negctrl.spec.ts`, dưới `_acceptance/**`): mô phỏng đúng thứ một `anchors()`
hư hỏng phải làm — `__map.jumpTo(...)` thẳng, KHÔNG qua `setCamera` (vì `setCamera` chủ động
xoá `restBase` nên khung sau được dựng lại từ camera đúng và phép so mất nghĩa). Với
`restBase` còn trong cache, `renderMotionFrame(1.4)` lần hai đi nhánh `if (!atRest ||
!restBase)` = false ở `main.tsx:628`, tức KHÔNG `jumpTo` lại, và vẽ overlay bằng camera hiện
tại. Kết quả:

```
✓ 1 [chromium] › NEG-E8: một anchors() có jumpTo LÀM LỆCH byte khung đuôi (phép so của E8 phân biệt được) (2.8s)
  1 passed (3.9s)
```

_(Chạy lại ở vòng 2 lúc 2026-08-07T05:58:36Z, lệnh
`npx playwright test --config=_acceptance/anchors-camera/negctrl/playwright.negctrl.config.ts`,
thoát 0. Đây là ĐỐI CHỨNG ÂM do vòng chấm viết, không phải eval của hợp đồng, nên nó nằm ở
phần tường thuật chứ không nằm trong danh sách Evidence.)_

Byte lệch thật. Nên `expect(after).toBe(before)` của E8 là một chốt sống, không phải tautology.

E19 thì khác về bản chất: nó là **regression guard xanh-trên-cả-hai** theo thiết kế. Nó đỏ
được (19 ca hành vi thật trên `export.ts`/`mapStyle.ts`, 0 ca bỏ qua — không phải một bộ rỗng
thoát 0 vô nghĩa), nhưng nó không phân biệt được gì về gói này. Sức nặng thật của AC-10 nằm ở
E18/I1 (`git diff --name-only`: hai `t3_path` đúng 0 dòng đổi). Ghi ở mục Analyst.

**E20 — "527 unit test" có đúng không?** Đúng con số, nhưng chữ "toàn bộ" hơi rộng. Số thật
đo được vòng này:

```
 Test Files  33 passed | 2 skipped (35)
      Tests  527 passed | 9 skipped (536)
```

527 xanh là chính xác. Tổng là 536, trong đó 9 bị bỏ qua (khối tích hợp có gác sau
`MCP_INTEGRATION=1`). Không đủ để đánh trượt — con số nêu ra khớp thực tế — nhưng người ký nên
đọc là "527 xanh / 9 bỏ qua", không phải "536 ca đều chạy".

## Hai ghi chú độ phủ (KHÔNG trượt, nhưng đáng biết ở Cổng 2)

- **E10 kiểm ở mức data-URL, không mức byte giải mã.** `e2e/render-mode.spec.ts:350-354` khẳng
  định `startsWith('data:image/png')` cho cả hai khung, `rest.length > 2000`, và
  `rest !== mid`. Đó rõ ràng nhiều hơn "không ném" — hai khung phải khác nhau và khung nghỉ
  phải có nội dung thật. Nhưng sàn kích thước chỉ áp cho `rest`, không cho `mid`. Nửa
  byte-thật do **E11** gánh, và E11 gánh chặt: `renderClip.test.ts` khẳng định magic PNG
  `89 50 4e 47 0d 0a 1a 0a` trên **từng khung trong cả 24 khung** cộng khung settle. Cặp
  E10+E11 phủ đủ AC-6; riêng E10 thì không.
- **E17 chỉ thử tương ứng một-một ở n=1.** `tools.test.ts` khẳng định
  `anchors.points == [{index: 0, ...}]` và `highlights.points` dài 1. Với đúng một marker,
  "khớp một-một" không phân biệt được thứ tự. Ca hai marker tồn tại ở e2e (`anchorsConfig`
  có 2 marker, và test đọc `const [center, far] = out.anchors.points` rồi khẳng định
  center ở giữa khung còn far ngoài khung) — nhưng ca đó không đối chiếu sang
  `resolved.highlights.points`. Nên thứ tự được chứng minh, còn ánh xạ chéo thì chỉ ở n=1.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-1 | script | PASS |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-4 | test | PASS |
| E7 | AC-5 | script | PASS |
| E8 | AC-5 | test | PASS |
| E9 | AC-6 | test | PASS |
| E10 | AC-6 | test | PASS |
| E11 | AC-6 | test | PASS |
| E12 | AC-7 | script | PASS |
| E13 | AC-7 | test | PASS |
| E14 | AC-7 | test | PASS |
| E15 | AC-7 | test | PASS |
| E16 | AC-8 | test | PASS |
| E17 | AC-9 | test | PASS |
| E18 | AC-10 | script | PASS |
| E19 | AC-10 | test | PASS |
| E20 | AC-7 | test | PASS |

## Evidence

- eval: E1
  run_id: anchors-camera-r5-e1-20260807
  exit_code: 0
  baseline: n-a (tệp test mới trong PR này — trên diffBase không tồn tại phép đo nào để so)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T12:17:57Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npx vitest run src/render/anchors.test.ts — Test Files 1 passed (1); Tests 13 passed (13).
    Khung dùng trong file: 1079x1921, 600x1200, 400x800, 1000x2000 — không cái nào vuông.
    Thay cho baseline: đột biến trực tiếp (bản chép ngoài repo) đổi yPct sang mẫu số cssW →
    Tests 4 failed | 9 passed (13). Khẳng định phân biệt được.

- eval: E2
  run_id: anchors-camera-r5-e2-20260807
  exit_code: 0
  baseline: n-a (script mới trong PR này)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T12:18:05Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ (I6 quét 38 tệp test, 3 bí danh gác bằng env)
    **Vòng 4 @ d84857a — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Chữ của `expected` đã được sửa sau vòng 1 và phần MANG TẢI giờ khớp mã: nó nói "CÓ ÍT
    NHẤT MỘT ca test dùng khung không vuông", đúng bằng thứ script khẳng định
    (`discriminating.length > 0`, anchors-invariants.ts:213-219). Stdout vòng này:
    "ok I4 anchors.ts KHÔNG có hệ số tỉ lệ chung: true" và
    "ok I4 4/6 ca test có cssW != cssH (vd 1079x1921)" — con số 4/6 trong `expected` khớp
    chính xác.
    ĐÍNH CHÍNH BẮT BUỘC (xem mục "Một sai sót chữ nghĩa còn lại"): mệnh đề phụ "hai ca
    vuông là ca vùng-rỗng trả null" SAI. Hai ca không phân biệt được là
    anchors.test.ts:53 (`{cssW: 0, cssH: 100}` — khung suy biến phải NÉM, KHÔNG vuông) và
    anchors.test.ts:79 (`{cssW: 100, cssH: 100}` — vùng rỗng trả null, ca vuông DUY NHẤT).
    Sai sót này không nói quá độ phủ nên không đánh trượt eval, nhưng phải sửa trước khi ký.

- eval: E3
  run_id: anchors-camera-r5-e3-20260807
  exit_code: 0
  baseline: n-a (tệp test mới)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T12:17:57Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E1. anchors.test.ts:37-50 — khung 400x800: điểm x=-40 cho onScreen=false
    NHƯNG xPct=-10, yPct=50 vẫn được trả; điểm y=1200 cho yPct=150. Ca đúng mép (0, 800)
    khẳng định onScreen=true. Phần trăm không bị nuốt, đúng như AC-2 đòi.

- eval: E4
  run_id: anchors-camera-r5-e4-20260807
  exit_code: 0
  baseline: n-a (tệp test mới)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T12:17:57Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E1. anchors.test.ts:58-81 — khung 1000x2000, bốn đỉnh (100,200)-(300,600):
    bboxPct toEqual([10, 10, 30, 30]) đúng cực trị, bboxCenterPct toEqual([20, 20]) nằm
    trong bbox. Vùng rỗng: regionAnchorOf(0, [], ...) toBeNull() — không bịa hộp rỗng ở gốc.
    (Vòng 1 chép tên cũ `centroidPct` ở đúng chỗ này; `a46aec7` đã đổi tên trường và khối
    này được viết lại theo tên hiện hành — xem mục Iterations.)

- eval: E5
  run_id: anchors-camera-r5-e5-20260807
  exit_code: 0
  baseline: n-a (tệp test mới)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T12:17:57Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.anchors` → thoát 0 · Test Files 1 passed (1); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Lỗ hổng của vòng 1 đã được bịt và vòng này CHỨNG MINH LẠI bằng chính đột biến đã dùng
    để đánh trượt nó. anchors.test.ts:156-159 nay ghim CẢ HAI phía, mỗi phía một khẳng
    định riêng: toThrow(/13\.25/) VÀ toThrow(/13\.26/) (giá trị đọc được), cộng
    toThrow(/106\.71/) và toThrow(/300/). Đột biến lặp lại trong worktree dùng-một-lần
    (git worktree --detach a46aec7, KHÔNG đụng cây làm việc): bỏ sạch bốn chỗ nội suy
    ${actual.*} khỏi ba thông điệp problems.push ở anchors.ts:182,184,185 →
    "Test Files 1 failed (1); Tests 1 failed | 12 passed (13)", đỏ tại
    anchors.test.ts:157 với thông điệp "expected [Function] to throw error matching
    /13\.26/ but got 'anchors: map camera is not at restAtSec=3.9 (zoom  ≠ 13.25)...'".
    Cùng đột biến ấy ở vòng 1 để 13/13 XANH. Clause nay có đường đỏ thật.

- eval: E6
  run_id: anchors-camera-r5-e6-20260807
  exit_code: 0
  baseline: n-a (ca e2e mới)
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T12:19:20Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.e2e` → thoát 0 · 18 passed (56.4s)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.e2e` → thoát 0 · playwright 18 passed
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npm run test:e2e — 18 passed (1.0m). Ca "anchors: NỔ TO khi camera không ở restAtSec"
    (render-mode.spec.ts:305): sau renderMotionFrame(1.4), chèn setCamera({center:[0,0],
    zoom:3}), rồi gọi anchors() trong try/catch; nếu không ném thì trả chuỗi 'KHÔNG NÉM',
    chuỗi đó không khớp /restAtSec/ nên ca sẽ đỏ. Khẳng định: message toMatch(/restAtSec/)
    và toMatch(/zoom|center/). Trên MapLibre thật, không phải giả lập.

- eval: E7
  run_id: anchors-camera-r5-e7-20260807
  exit_code: 0
  baseline: n-a (script mới)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T12:18:05Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ (I6 quét 38 tệp test, 3 bí danh gác bằng env)
    **Vòng 4 @ d84857a — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E2. I5 trích được thân anchors() (1744 ký tự) rồi soi bảy cấm: jumpTo,
    gán restBase, gán animBase, gán lastApplied*, setData, setPaintProperty, await — cả
    bảy đều "KHÔNG chứa: true". Thêm chốt khoảng đệm: giữa lần chụp settle và lời gọi
    anchors() trong renderFrame.ts không có lượt vào trang nào (869 ký tự đệm, đã bỏ chú
    thích trước khi soi).

- eval: E8
  run_id: anchors-camera-r5-e8-20260807
  exit_code: 0
  baseline: n-a (ca e2e mới)
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T12:19:20Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.e2e` → thoát 0 · 18 passed (56.4s)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.e2e` → thoát 0 · playwright 18 passed
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E6. Ca "anchors: CHỈ ĐỌC — gọi nó xong, khung đuôi vẫn byte-identical"
    (render-mode.spec.ts:287): renderMotionFrame(1.4) → anchors() → renderMotionFrame(1.4),
    khẳng định expect(after).toBe(before) trên dataUrl. Nửa suppression này ĐỎ ĐƯỢC —
    xem đối chứng âm NEG-E8 ở mục tường thuật (chạy lại vòng 2, 1 passed).

- eval: E9
  run_id: anchors-camera-r5-e9-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.render_frame
  verified_at: 2026-08-07T12:17:58Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.render_frame` → thoát 0 · Test Files 1 passed (1); Tests 5 passed | 4 skipped (9)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.render_frame` → thoát 0 · Test Files 1 passed (1); Tests 3 passed | 4 skipped (7)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npx vitest run mcp-server/src/renderFrame.test.ts — Test Files 1 passed (1); Tests 3
    passed | 3 skipped (6). Ba ca chạy là khối "trang giả" KHÔNG bị gate (ba ca bỏ qua là
    khối integration sau MCP_INTEGRATION=1). Khối trang giả đếm lời gọi thật:
    calls.anchors++ bên trong __mapposter.anchors. pitch 30 → expect(calls.anchors).toBe(0)
    kèm frames dài 4 và calls.motionFrames toBe(5) (4 khung + settle); pitch 0 →
    expect(calls.anchors).toBe(1) làm đối chứng dương. Quan sát LỜI GỌI, không phải
    quan sát "không ném".

- eval: E10
  run_id: anchors-camera-r5-e10-20260807
  exit_code: 0
  baseline: n-a (ca e2e mới)
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T12:19:20Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.e2e` → thoát 0 · 18 passed (56.4s)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.e2e` → thoát 0 · playwright 18 passed
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E6. Ca "anchors: pitch != 0 — KHUNG VẪN RENDER" (render-mode.spec.ts:326):
    __map.getPitch() toBeCloseTo(45, 6) đọc từ MapLibre thật; mid và rest đều
    startsWith('data:image/png'); rest.length toBeGreaterThan(2000); rest not.toBe(mid);
    rồi message toMatch(/pitch/i) và /45/. Ghi chú độ phủ ở mục trên: kiểm ở mức chuỗi
    data-URL, sàn kích thước chỉ áp cho rest — nửa byte-thật do E11 gánh.

- eval: E11
  run_id: anchors-camera-r5-e11-20260807
  exit_code: 0
  baseline: n-a (ca mới trong bộ có gác)
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T12:21:00Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 15 passed (15)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npm run test:mcp (MCP_INTEGRATION=1, vite build production + Chromium thật) — Test
    Files 3 passed (3); Tests 12 passed (12); 69.93s. Ca "pitch != 0: clip VẪN render đủ
    khung + settle" (renderClip.test.ts): frames toHaveLength(24) = 12fps x 2s, rồi VÒNG
    LẶP khẳng định f.subarray(0,8) toEqual Buffer([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,
    0x0a]) cho TỪNG khung, cộng cùng phép ấy cho settle. anchors toBeUndefined();
    anchorsUnavailable toMatch(/pitch/i) và /45/. Đây là chỗ "PNG thật" được kiểm ở mức
    byte giải mã, không phải mức chuỗi.

- eval: E12
  run_id: anchors-camera-r5-e12-20260807
  exit_code: 0
  baseline: n-a (script mới)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T12:18:05Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ (I6 quét 38 tệp test, 3 bí danh gác bằng env)
    **Vòng 4 @ d84857a — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E2. I3 GỌI THẬT: await import('mcp-server/src/tools.ts') rồi chạy
    resolvedOfClip(probeCfg, outcome) cho hai nhánh. Stdout: "resolvedOfClip(đo được) phát
    ra ĐÚNG MỘT: anchors=true, anchorsUnavailable=false" và "resolvedOfClip(không đo được)
    phát ra ĐÚNG MỘT: anchors=false, anchorsUnavailable=true", cộng hai dòng "camera đi
    cùng anchors" (true / false). Không phải regex — khẳng định là hasAnchors !== hasReason
    trên giá trị trả về thật. Ba bề mặt cũng được đếm: mỗi bề mặt 3 lối ra dùng
    resolvedOfClip(cfg, clipOut), 1 lời gọi deps.renderClip, 1 chỗ giữ NGUYÊN outcome,
    tháo rời=false, và 0 lối ra còn dùng resolvedOf(cfg) trần.

- eval: E13
  run_id: anchors-camera-r5-e13-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npx vitest run mcp-server/src/tools.test.ts — Test Files 1 passed (1); Tests 59 passed
    (59). Nhánh CÓ anchors phủ cả ba lối ra: thành công, degrade (encodeAnimation ném
    'ffmpeg boom'), và từ chối quá cỡ (MAPPOSTER_CLIP_MAX_BYTES=2 → ok toBe(false)) — mỗi
    lối ra khẳng định resolved.camera.zoom và resolved.anchors.points. Nhánh KHÔNG đo được
    phủ hai lối ra (thành công + degrade), mỗi lối ra khẳng định anchorsUnavailable toBe
    REASON cộng 'anchors' in resolved toBe(false) và 'camera' in resolved toBe(false).
    Ghi chú: lối ra quá cỡ chưa có ca ở nhánh anchorsUnavailable; bất biến XOR ở mức hàm
    do I3 (E12) gánh cho cả ba.

- eval: E14
  run_id: anchors-camera-r5-e14-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npx vitest run mcp-server/src/http.test.ts — Test Files 1 passed (1); Tests 57 passed
    (57). Ca "resolved mang camera + anchors trên CẢ BA lối ra: 200, degrade encode, và 422
    quá cỡ" khẳng định đủ ba, kèm nửa should-NOT thật:
    expect(okBody.resolved?.camera?.zoom).not.toBe(okBody.resolved?.zoom). Ca thứ hai
    khẳng định nhánh không đo được: status 200, clip.format 'mp4' (pitch không làm hỏng
    clip), anchorsUnavailable toBe REASON, và cả 'anchors' lẫn 'camera' đều không có mặt.

- eval: E15
  run_id: anchors-camera-r5-e15-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T12:17:51Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.job_runner` → thoát 0 · Test Files 1 passed (1); Tests 28 passed (28)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npx vitest run mcp-server/src/jobRunner.test.ts — Test Files 1 passed (1); Tests 25
    passed (25). Đúng lớp lỗi mà hợp đồng nêu (jobRunner đã hai lần dùng sai biến): ca
    "mỗi việc mang anchors + camera của CHÍNH nó" chạy hai việc a và b với toạ độ khác
    nhau (108.44/11.94 vs 109.19/12.24) và khẳng định từng việc trả đúng toạ độ của mình —
    một lời gọi dùng nhầm biến của việc trước sẽ đỏ. Cộng ca nhánh anchorsUnavailable
    (việc VẪN xong, artifacts ['clip','settle'], không có anchors lẫn camera) và ca
    degrade + quá cỡ vẫn mang camera + anchors.

- eval: E16
  run_id: anchors-camera-r5-e16-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E13. Chốt "không echo cfg.camera" là thật và có răng: fakeAnchors() dẫn
    xuất camera từ cfg với zoom + 1 (tools.test.ts:54), nên nếu ai đó trả lại cfg.camera
    cho tiện thì resolved.camera.zoom sẽ bằng resolved.zoom và khẳng định
    expect(j.resolved.camera.zoom).not.toBe(j.resolved.zoom) đỏ ngay. Nửa "vắng cùng nhau"
    do ca resolvedOfClip nhánh không đo được gánh: 'camera' in r toBe(false).

- eval: E17
  run_id: anchors-camera-r5-e17-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T12:17:40Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.clip_tools` → thoát 0 · Test Files 1 passed (1); Tests 65 passed (65)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E13. j.resolved.anchors.points toEqual([{index: 0, lng: 106.7, lat:
    10.78, xPct: 50, yPct: 50, onScreen: true}]) và j.resolved.highlights.points
    toHaveLength(1); khối resolved cũ không bị nuốt (j.resolved.place toBeDefined).
    Ghi chú độ phủ ở mục trên: tương ứng một-một chỉ được thử ở n=1; thứ tự ở n=2 được
    chứng minh gián tiếp ở e2e nhưng không đối chiếu sang highlights.points.

- eval: E18
  run_id: anchors-camera-r5-e18-20260807
  exit_code: 0
  baseline: n-a (script mới)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T12:18:05Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ (I6 quét 38 tệp test, 3 bí danh gác bằng env)
    **Vòng 4 @ d84857a — đo lại tươi:** `script.anchors_invariants` → thoát 0 · anchors-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Cùng lần chạy E2. I1: "t3_path untouched vs 972a1e4f (19 file đổi)" — src/lib/export.ts
    và src/lib/mapStyle.ts đúng 0 dòng đổi so với merge-base, nên xếp T2 là đúng. I2: bốn
    dòng ok — không tệp nào nhắc anchorsAt (đã bỏ chú thích trước khi soi, nên chính lời
    giải thích trong doc không tự biến thành vi phạm), MapPosterApi.anchors khai báo KHÔNG
    tham số, hiện thực cũng KHÔNG tham số, và cả 5 lời gọi anchors() trong repo đều rỗng.

- eval: E19
  run_id: anchors-camera-r5-e19-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-07T12:17:41Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.text_free` → thoát 0 · Test Files 2 passed (2); Tests 20 passed (20)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.text_free` → thoát 0 · Test Files 2 passed (2); Tests 19 passed (19)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npx vitest run src/lib/export.test.ts src/lib/mapStyle.test.ts — Test Files 2 passed
    (2); Tests 19 passed (19), 0 bỏ qua. Bộ không rỗng và không bị bỏ qua toàn phần (đó là
    kiểu thoát-0-vô-nghĩa duy nhất đáng lo ở một nửa suppression). Xanh trên cả hai phía
    theo thiết kế — hai t3_path không có dòng nào đổi, nên eval này chứng minh "không đụng
    vào", không chứng minh gì về gói này. Sức nặng thật của AC-10 nằm ở E18/I1.

- eval: E20
  run_id: anchors-camera-r5-e20-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 5 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 4 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    npm test — Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536);
    3.07s. Con số 527 trong `expected` khớp chính xác số ca XANH. Chín ca bỏ qua là khối
    integration có gác sau MCP_INTEGRATION=1 (ba trong renderFrame.test.ts, còn lại ở
    renderClip/stdioChannel) — chúng được chạy riêng ở E11. Hồi quy tổng sau khi ClipFrames
    đổi kiểu: không bề mặt nào đỏ.

## Analyst

Không tính được baseline A/B thật cho vòng này: mọi khối test của gói (anchors.test.ts,
anchors-invariants.ts, khối trang giả trong renderFrame.test.ts, các khối PR #6 trong
tools/http/jobRunner/renderClip.test.ts, bốn ca anchors trong e2e) đều là tệp hoặc khối MỚI —
trên diffBase chúng không tồn tại, nên không có phép đo cũ để so. Ghi `n-a` thay vì bịa `red`.

Bù lại bằng thứ mạnh hơn baseline, làm trực tiếp trong vòng này: đột biến E1 (4 ca đỏ khi
nhét lại lỗi một-mẫu-số) và đối chứng âm NEG-E8 (byte lệch khi camera bị dời). Cả hai chứng
minh khẳng định phân biệt được, chứ không chỉ chứng minh nó từng đỏ trên cây mã cũ.

Không phân biệt (xanh trên cả hai phía, đúng thiết kế): E19 và E20 — hai regression guard
tổng. E19 chứng minh gói này KHÔNG đụng hai t3_path; E20 chứng minh không bề mặt nào hồi quy.
Cả hai là guard cố ý, không phải eval hỏng.

## Variance

Không lệnh nào đi qua `ctx.providers.invoke` hay một bộ sinh LLM. Mọi lane Node đều tất
định, chạy một lần, thoát 0.

**MỘT lane KHÔNG tất định — `config:executors.test.mcp` (E11).** Vòng này phải chạy nó bốn
lần:

| lần | kết quả | ca đỏ |
|---|---|---|
| 1 | `1 failed \| 11 passed (12)`, 88,84 s | `renderClip.test.ts` › "pitch != 0: clip VẪN render đủ khung + settle" |
| 2 | `1 failed \| 11 passed (12)`, 97,74 s | `renderFrame.test.ts` › "renders a config far larger than a URL could carry (>16 KB)" |
| 3 | `12 passed (12)`, 87,37 s | — |
| 4 | `12 passed (12)`, 65,80 s | — |

Cả hai lần đỏ là `TimeoutError: page.waitForFunction: Timeout 20000ms exceeded` ở
`renderFrame.ts:137`/`:219`, và **hai ca khác nhau** đỏ — dấu hiệu của trần thời gian, không
phải của một khẳng định hỏng. Hai lần đỏ rơi vào lúc `load average` ~21-28 (bốn lane kiểm
song song); hai lần xanh chạy khi máy rảnh. Mạng không phải nguyên nhân:
`curl https://tiles.openfreemap.org/planet` trả 200 trong 0,40 s ngay giữa vòng. Đây đúng là
rủi ro mà `_acceptance/config.yaml` đã ghi trong chú thích `feature_loop.suite_keys` (trần
chờ 20 s vỡ khi hai bộ trình duyệt giành nhau). Khối bằng chứng của E11 ghim lần chạy thứ 4
(05:55:15Z, thoát 0). **Người ký nên biết: lane này không tất định dưới tải; CI chạy song
song sẽ đỏ giả.** Đây là món nợ vận hành, không phải lỗi của gói anchors-camera.

## Iterations

Vòng 5 (chạy lại ở `ace12a0` sau khi E14/E15/E18 được vá): cả 20 eval chạy lại tươi, 20/20 thoát 0. **PASS.**
E18 hết trượt — `60d1d62` chuyển I6 sang cấp CALL SITE, quét 38 tệp test, bỏ miễn trừ theo tệp; đột biến
`it.skip` ở `geometry.test.ts:5` làm script exit 1 nêu đúng `tệp:dòng` trong khi `vitest` vẫn exit 0, và
đột biến `const RUN = false` làm I6c đỏ. E14/E15 hết trượt — ca XOR mới ở `http.test.ts`/`jobRunner.test.ts`
đỏ dưới đột biến "resolvedOfClip phát CẢ HAI", mutant mà bản cũ vẫn xanh. Không hồi quy: khối `describe`
mới của `mcp-map-render` ở `renderFrame.test.ts:314` không chiếm chỗ ca `pitch 30` (`:272`) của E9.
`human_signoff` để rỗng: Cổng 2 chờ người ký.

Vòng 4 (chạy lại ở `d84857a` sau REJECT vòng 5 trên [E20]): 20/20 eval máy thoát 0, không lệnh nào
đỏ. **Bản vá I6 đứng vững và E20 đã hết khai suông** — M-D được tái dựng trong worktree dùng-một-lần:
`it(`→`it.skip(` ngoài ba tệp gated cho `npm test` `541 passed | 11 skipped` (vẫn thoát 0) trong khi
`anchors-invariants` nay thoát mã 1 với `FAIL I6`; nửa `.only` bắn ở cả tệp gated lẫn không gated;
danh sách `GATED` khớp đúng ba tệp có cổng `MCP_INTEGRATION`; phạm vi quét 38 tệp là TOÀN BỘ tệp test
của repo. **REJECT trên [E14, E15, E18]**. E18 nói "đổi `it(` thành `it.skip(` **ngoài khối gated**
phải làm ĐỎ", nhưng I6 miễn theo TỆP: `it.skip` ở `renderFrame.test.ts:272` — khối "trang giả" KHÔNG
gated, đúng ca mà E9 nêu đích danh — để cả lane E18 lẫn lane E9 xanh. E14/E15 gán "bất biến XOR" cho
`http.test.ts`/`jobRunner.test.ts`, nhưng đột biến cho `resolvedOfClip` phát ra CẢ HAI trên nhánh
đo-được để hai lane đó XANH (61/61 và 28/28) trong khi E12/E13 ĐỎ — chúng chỉ canh một chiều. Ghi
nhận thêm, KHÔNG đánh trượt: câu dẫn cuối của E20 ("tính chất đó do I6 gánh") thừa hưởng đúng lỗ của
E18 và sẽ tự đúng khi I6 được siết xuống mức khối; E6 gọi lời chèn giữa chừng là "jumpTo" trong khi
ca test dùng `setCamera` (cùng đường mã, chữ lỏng).

Vòng 2 (chạy lại sau REJECT): ghim ở `a46aec7` (tổ tiên của HEAD; ở đây là chính HEAD). Cả
20 eval chạy lại tươi, 20/20 thoát 0. Hai lỗ của vòng 1 đã bịt và được kiểm lại bằng đúng
phép thử đã đánh trượt chúng: **E5** — đột biến gỡ sạch `${actual.*}` khỏi ba thông điệp
nay làm ĐỎ (`1 failed | 12 passed`, đỏ tại `anchors.test.ts:157` trên `/13\.26/`), trong
khi vòng 1 nó để 13/13 xanh; **E2** — chữ đã đổi từ "MỌI ca" sang "CÓ ÍT NHẤT MỘT ca", khớp
đúng `discriminating.length > 0`. Đổi tên `centroidPct` → `bboxCenterPct` (`a46aec7`) sạch
trên mọi bề mặt: quét toàn repo chỉ còn tên cũ ở bản ghi vòng 1 của chính tệp này, và khối
E4 đã được viết lại theo tên hiện hành nên tên cũ chỉ còn ở phần lịch sử; `tsc -b` và
`tsc -p mcp-server/tsconfig.json` cùng thoát 0. E10/E17/E20 đối chiếu lại: cả ba đúng với mã
(527/9/536; E10 tự nhận không kiểm byte PNG; E17 tự nhận chỉ n=1 và Out of scope có mục đó).
CÒN LẠI MỘT SAI SÓT: mệnh đề phụ của E2 "hai ca vuông là ca vùng-rỗng trả null" sai — chỉ
MỘT ca vuông (`anchors.test.ts:79`), ca kia là khung suy biến `{cssW: 0, cssH: 100}`
(`:53`). Không đánh trượt (không nói quá độ phủ, và mệnh đề mang tải có chốt phân biệt
được), nhưng phải sửa chữ trước khi ký — câu thay thế đã ghi sẵn ở mục riêng.
Ghi chú vận hành: `npm run test:mcp` (E11) FLAKE dưới tải — hai lần đầu đỏ ở
`page.waitForFunction` trần 20 s (hai ca KHÁC nhau đỏ), hai lần sau xanh 12/12 khi máy rảnh.
Không phải hồi quy; xem mục Variance.

Vòng 1: E2 và E5 TRƯỢT — không phải vì lệnh đỏ (cả 20 lệnh đều thoát 0) mà vì `expected` của
chúng khẳng định thứ không test nào canh gác. E2 nói "MỌI ca test dùng khung không vuông"
trong khi script chỉ kiểm ≥1 và tự in "4/6". E5 nói thông điệp nêu "CẢ giá trị đọc được" trong
khi đột biến bỏ hết `${actual.*}` vẫn để 13/13 xanh. Trả về cho bên hiện thực: E2 sửa chữ
trong `evals.yaml` (hoặc siết script cho đúng chữ); E5 cần một khẳng định thật trên giá trị
đọc được, ví dụ `toThrow(/13\.26/)`. Mười tám eval còn lại xanh và đã được soi từng clause;
ba nghi vấn nặng nhất (E9 đếm lời gọi, E12 gọi thật `resolvedOfClip`, E11 kiểm magic PNG từng
khung) đều đứng vững.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
