---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Mười eval đạt trên thước ĐÃ ĐỔI của vòng 7 (luật miễn trừ hỏi kiểu KHAI của
  tham số). Lối vòng generic-identity của vòng 6 — `__id({} as never)` — đã
  ĐÓNG: vòng chấm tiêm lại nguyên văn vào tệp thật và bộ quét bắt đúng dòng.
  Hai chiều đỏ oan mà vòng 6 tố cũng đã hết ở dạng bọc ngoặc, cộng thêm bốn
  dạng lời gọi khác (rest `never[]`, đối số không đứng cuối, constructor, biến
  kiểu hàm) đều được miễn trừ đúng. Thay đổi mã TEST SẢN PHẨM đi kèm (gỡ 3 phép
  ép `resolveConfig(compiled as never)`) được kiểm bằng cách PHÁ `resolveConfig`
  cho nó thôi từ chối: đúng một ca đỏ, đúng dòng `rejects.toThrow(KEY)` — phép
  đo còn cắn, và mạnh hơn trước vì `compiled` giờ là `CompiledRecipeCall` chứ
  không còn là `unknown`.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ebb067664af4757b69968000f8e229d9e9478c9a
human_signoff:
---

# Evidence Report — typecheck-mock-signature (vòng 7)

Thước đã đổi ở `ebb0676`, nên bằng chứng vòng 6 hết hiệu lực. Mọi số dưới đây
đo lại từ đầu trong ngữ cảnh tươi, mọi `cmd:` giải từ `_acceptance/config.yaml`.

| Eval | Tiêu chí | Executor | Kết quả | Số nền | Ghi chú |
|------|----------|----------|---------|--------|---------|
| E1 | AC-1 | script · `typecheck_both` | PASS | `red` | hai project chấm RỜI, mỗi bên mã thoát 0 và 0 dòng `error TS` |
| E2 | AC-2 | script · `typecheck_both` | PASS | `red` | cả hai project đều có dòng kết quả riêng, không bên nào vắng mặt |
| E3 | AC-3 | script · `mock_type_probe` | PASS | `n-a` | đối chứng bản-chép-sạch + hai mũi đỏ đúng TS2322 / TS2339 |
| E4 | AC-4 | script · `mock_type_probe` | PASS | `n-a` | `.basemap` là union hẹp, field lạ bị bắt; đối chứng sạch trước |
| E5 | AC-5 | script · `mock_silencer_scan` | PASS | `n-a` | 10 + 6 dòng THÊM so mốc ghim, 0 mẫu bịt miệng; ba chốt tự-canh xanh |
| E6 | AC-6 | script · `mock_mutation_probe` | PASS | `n-a` | đối chứng nền + ba mũi phá, mỗi mũi làm tệp test tương ứng ĐỎ |
| E7 | AC-7 | script · `mock_no_regression` | PASS | `n-a` | 629 đạt / 646 tổng, 0 đỏ; MapView 2 ca, recipes 40 ca |
| E8 | AC-5b | script · `mock_silencer_scan` | PASS | `n-a` | 0 chỗ `never` ở vị trí giá trị; 5 chỗ đối số báo RIÊNG |
| E9 | AC-5c | script · `mock_silencer_scan` | PASS | `n-a` | hai ca nuốt bị bắt bằng chẩn đoán cú pháp; tệp sạch cho 0 |
| E10 | AC-5d | script · `mock_silencer_scan` | PASS | `n-a` | program dựng từ tsconfig THẬT; tên không giải được ngã to |

## Evidence

### E1 — AC-1 · typecheck hai project, độc lập

- run_id: typecheck-mock-signature-e1-r7-20260827130601
- verifier: config:executors.script.typecheck_both
- exit_code: 0
- verified_at: 2026-08-27T13:06:01Z
- output:

```
PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

OK — 0/2 project đỏ
```

Chữ `expected:` đòi `--force`; script khai đúng `['tsc', '-b', '--force']` ở
`RUNS[0]`, đọc được trực tiếp trong nguồn. Vòng chấm còn kiểm rằng phép đo này
CÓ khả năng đỏ: tiêm hai dòng sai kiểu vào `MapView.test.tsx` (một tham số ngầm
`any`, một `null` gán vào `string`) thì vế web đỏ đúng hai dòng `error TS7006` và
`error TS2322`, vế mcp-server vẫn xanh — nghĩa là hai vế thật sự chấm rời nhau.
Đã hoàn nguyên.

### E2 — AC-2 · `&&` không được che vế sau

- run_id: typecheck-mock-signature-e2-r7-20260827130601
- verifier: config:executors.script.typecheck_both
- exit_code: 0
- verified_at: 2026-08-27T13:06:01Z
- output: cùng lượt chạy E1 (xem trên). Chiều đọc của E2 là **có mặt**: hai dòng
  `PASS` riêng biệt, một cho mỗi project, chứ không phải một dòng gộp.

Chốt sống của E2 nằm ở phép tiêm mô tả trong E1: vế web đỏ mà vế mcp-server vẫn
in dòng kết quả riêng của nó. Nếu hai lệnh còn nối bằng `&&` thì vế sau đã im
lặng — đúng lớp lỗi giấu 2 lỗi `recipes.test.ts` suốt 5 ngày. `execFileSync` gọi
hai lượt rời, thu mã thoát từng lượt rồi mới kết luận.

### E3 — AC-3 · chiều phủ định cho `MapView.test.tsx`

- run_id: typecheck-mock-signature-e3-r7-20260827130632
- verifier: config:executors.script.mock_type_probe
- exit_code: 0
- verified_at: 2026-08-27T13:06:32Z
- output:

```
=== AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx
```

Đối chứng bản-chép-sạch chạy TRƯỚC hai mũi, đúng như `expected:` đòi. Vòng chấm
kiểm thêm rằng E3 là lưới thật, không phải lời khai: tiêm `// @ts-nocheck` lên
đầu `MapView.test.tsx` thì E3 tố ngay cả hai mũi mất khả năng đỏ — nghĩa là E3
bắt được một dạng bịt miệng nằm NGOÀI danh sách mẫu của E5. Đã hoàn nguyên.

### E4 — AC-4 · chiều phủ định cho `recipes.test.ts`

- run_id: typecheck-mock-signature-e4-r7-20260827130632
- verifier: config:executors.script.mock_type_probe
- exit_code: 0
- verified_at: 2026-08-27T13:06:32Z
- output:

```
=== AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts
```

Vòng này E4 mạnh hơn vòng trước theo một đường KHÔNG do script sinh ra: sau khi
`(r.compile as (p: unknown) => unknown)` bị gỡ, `resolveConfig(compiled)` biên
dịch sạch mà không cần ép kiểu. Điều đó chỉ đúng nếu `compiled` thật sự là
`CompiledRecipeCall` (`= RenderMapParams & { motion }`), vì `resolveConfig` khai
`(params: RenderMapParams)`. Tức là chính tệp test — chứ không chỉ tệp thăm dò —
đang mang kiểu thật.

### E5 — AC-5 · dòng THÊM không mẫu bịt miệng

- run_id: typecheck-mock-signature-e5-r7-20260827130632
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T13:06:32Z
- output (phần E5):

```
PASS  đối chứng dương: fixture 4 mẫu → bắt 4 (as any, @ts-expect-error, @ts-ignore, as unknown as)
PASS  đối chứng âm: fixture sạch → bắt 0 (phải là 0)
mốc so: 54b5cb263259bc8ebe0ef5d20960b82b369b1f6e
PASS  src/components/MapView.test.tsx: có 10 dòng THÊM để quét (0 dòng = không đo được gì)
PASS  src/components/MapView.test.tsx: dòng thêm không mẫu bịt miệng nào (sạch)
PASS  mcp-server/src/recipes.test.ts: có 6 dòng THÊM để quét (0 dòng = không đo được gì)
PASS  mcp-server/src/recipes.test.ts: dòng thêm không mẫu bịt miệng nào (sạch)
```

Ba chốt tự-canh đủ mặt: fixture bẩn bắt 4, fixture sạch bắt 0, và số dòng thêm
lớn hơn 0 cho cả hai tệp trước khi bất kỳ chữ "sạch" nào được đọc. Mốc so là
commit GHIM `54b5cb2` theo AC-5, không phải `merge-base`.

### E6 — AC-6 · assertion còn cắn

- run_id: typecheck-mock-signature-e6-r7-20260827130651
- verifier: config:executors.script.mock_mutation_probe
- exit_code: 0
- verified_at: 2026-08-27T13:06:51Z
- output:

```
PASS  đối chứng nền: src/components/MapView.test.tsx xanh khi chưa phá gì
PASS  đối chứng nền: mcp-server/src/recipes.test.ts xanh khi chưa phá gì

=== mũi: đường web ép basemap về vector — bỏ rơi yêu cầu nền vệ tinh ===
PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng
PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng

=== mũi: đường web nuốt satelliteTiles — dựng một cửa chặn lẽ ra không tồn tại ===
PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng
PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng

=== mũi: area-overview đổi mặc định nền về satellite ===
PASS  mcp-server/src/recipes.test.ts ĐỎ khi code sản phẩm hỏng
PASS  mcp-server/src/recipes.ts đã hoàn nguyên đúng nguyên trạng
PASS  git thấy code sản phẩm sạch sau mọi mũi (không vết)
```

Ba mũi của script không chạm tới ca mà lượt sửa này ĐỘNG VÀO, nên vòng chấm thêm
một mũi thứ tư của riêng mình — xem `## Analyst`, mục «mã test có bị làm yếu đi
không».

### E7 — AC-7 · không hồi quy, và hai tệp thật sự đã chạy

- run_id: typecheck-mock-signature-e7-r7-20260827130651
- verifier: config:executors.script.mock_no_regression
- exit_code: 0
- verified_at: 2026-08-27T13:06:51Z
- output:

```
PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-UyxE0z/vitest.json
PASS  0 ca đỏ (629 đạt / 646 tổng)
PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)
```

Số ca đọc từ `--reporter=json`, không suy từ mã thoát của cả bộ. Vòng chấm đối
chiếu: `MapView.test.tsx` có đúng 2 khối `it(` trong nguồn, khớp con số 2; không
tệp đích nào chứa `it.skip`, `describe.skip` hay `it.todo`.

### E8 — AC-5b · `as never` ở vị trí GIÁ TRỊ

- run_id: typecheck-mock-signature-e8-r7-20260827130632
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T13:06:32Z
- output (phần E8):

```
PASS  phân loại «ca hồi quy type-probe» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «gán thẳng» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «ngoặc NHÓM, không phải lời gọi (lỗ #1 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «cú pháp ép kiểu kia (lỗ #3 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «generic identity — tham số khai T, KHÔNG phải never (lối vòng vòng 6)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «đối số BỌC NGOẶC, tham số khai never — hết đỏ oan» → ĐỐI SỐ (đúng: ĐỐI SỐ)
PASS  phân loại «tham số biến thiên ...p: never[]» → ĐỐI SỐ (đúng: ĐỐI SỐ)
PASS  phân loại «tham số khai unknown — không được miễn trừ» → có ít nhất một chỗ GIÁ TRỊ (2 khớp)
PASS  đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)
PASS  src/components/MapView.test.tsx: không «as never» ở vị trí giá trị (0 chỗ); 0 chỗ ở vị trí đối số — hợp lệ, không tính
PASS  mcp-server/src/recipes.test.ts: không «as never» ở vị trí giá trị (0 chỗ); 5 chỗ ở vị trí đối số — hợp lệ, không tính
```

Con số đối-số được báo RIÊNG, không gộp vào số vi phạm — đúng thứ `expected:` đòi.
Vòng chấm tự tiêm bảy dạng lời gọi khác vào tệp thật để đánh luật miễn trừ mới;
kết quả ở `## Analyst`.

### E9 — AC-5c · hỏng thì ĐÓNG ở tầng cú pháp

- run_id: typecheck-mock-signature-e9-r7-20260827130632
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T13:06:32Z
- output (phần E9):

```
PASS  hỏng-thì-đóng «chú thích không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
PASS  hỏng-thì-đóng «template literal không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
PASS  đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)
PASS  số dòng sau khối chú thích nhiều dòng → 5 (đúng: 5)
PASS  src/components/MapView.test.tsx: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
PASS  mcp-server/src/recipes.test.ts: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
```

Dòng «phân tích cú pháp sạch» có mặt cho TỪNG tệp đích và đứng TRƯỚC mọi kết luận
"sạch" — trong nguồn, `if (perr > 0) continue;` chặn hẳn phần đọc kết luận.

### E10 — AC-5d · phạm vi biên dịch và tên không giải được

- run_id: typecheck-mock-signature-e10-r7-20260827130632
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T13:06:32Z
- output (phần E10):

```
PASS  hỏng-thì-đóng tầng kiểm kiểu: tên không giải được → 0 khớp never NHƯNG 1 tên không giải được (phải là 1)
PASS  đối chứng âm: tên giải được → 0 tên không giải được (phải là 0)
PASS  phân loại «bí danh một tầng (lối vòng vòng 4)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «bí danh DÂY CHUYỀN» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «bí danh NHẬP TỪ TỆP KHÁC» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «bí danh KHÔNG phải never — phải không có khớp nào» → 0 khớp (đúng: 0)
PASS  src/components/MapView.test.tsx: mọi tên kiểu trong phép ép đều giải được (0 không giải được)
PASS  mcp-server/src/recipes.test.ts: mọi tên kiểu trong phép ép đều giải được (0 không giải được)
```

Cả hai chốt `expected:` đòi đều có mặt. Program dựng từ `parsed.fileNames` +
`parsed.options` của tsconfig thật (`loadProject` → `ts.createProgram`), và
`analyzeRealFile` ngã to nếu tệp đích không nằm trong program ấy.

## Known limits

Đây là TRẦN đã khai của hợp đồng, đo lại trong vòng này chứ không chép lời.

- **Bộ quét đo PHÉP ÉP KIỂU, nên hai dạng giặt kiểu không dùng phép ép nào nằm
  ngoài tầm.** Vòng chấm tiêm cả hai vào `MapView.test.tsx` và xác nhận trần
  đúng như khai: `declare function __lnF<T>(x: unknown): T;` với
  `const _lnF: number = __lnF({})` và
  `declare function __assertF(x: unknown): asserts x is never;` dùng để biến một
  `unknown` thành `number` — cả hai đều biên dịch sạch ở CẢ HAI project và không
  làm bất kỳ eval nào đỏ. Bắt được chúng cần phân tích luồng dữ liệu.
- **Cùng họ, nhưng chưa nằm trong lời khai hiện tại của trần:** biến thể
  `declare function __sinkE<T>(v: never): T;` với
  `const _wE: number = __sinkE({} as never);`. Vòng chấm tiêm vào
  `recipes.test.ts`: typecheck hai project sạch, `silencer-scan` báo sạch, tức
  đi trọn cổng. Luật miễn trừ hành xử ĐÚNG (tham số kia thật sự khai `never`,
  nên phép ép ấy là hợp lệ) — thứ giặt kiểu là KIỂU TRẢ VỀ generic, y hệt cơ chế
  `__ln`. Khác biệt duy nhất với lời khai hiện có: trần đang mô tả các dạng ấy là
  "trong nguồn không có cả `never` lẫn `any`", còn dạng này CÓ một `as never`
  thật trong nguồn mà vẫn đi lọt. Nên đây là lời khai hẹp hơn thực tế một chút,
  không phải một lớp mới.
- **E5 đo bốn mẫu cố định; `@ts-nocheck` không nằm trong danh sách ấy.** Đo
  được: thêm `// @ts-nocheck` lên đầu `MapView.test.tsx` thì `silencer-scan` báo
  mọi thứ sạch. Nhưng lỗ này KHÔNG đi trọn cổng — E3 tố ngay, vì bản chép của
  tệp thăm dò cũng mang `@ts-nocheck` nên hai mũi mất khả năng đỏ. Ghi ở đây là
  để người đọc biết lưới nào đang đỡ, chứ không phải một lối vòng còn mở.
- **E7 không có giác quan với ca bị BỎ QUA.** Chốt mỗi tệp là
  `passed > 0 && failed === 0`; một ca `skip`/`todo` không rơi vào ô nào. Cả bộ
  hiện có 646 ca mà chỉ 629 đạt, tức 17 ca không đạt-không đỏ đang tồn tại ở đâu
  đó trong kho. Hai tệp đích thì không: vòng chấm grep, không có `it.skip`,
  `describe.skip` hay `it.todo` trong cả hai.
- **`typecheck-both.ts` không phân biệt "chấm sạch" với "không chấm gì".** Nó chỉ
  đọc mã thoát và đếm dòng `error TS`. Một project mất `include` sẽ cho đúng hình
  dạng "xanh" ấy. Phần bù đến từ chỗ khác: E3/E4 chứng minh hai tệp đích thật
  sự nằm trong program của project tương ứng (mũi thăm dò đỏ được), và
  `analyzeRealFile` của `silencer-scan` ngã to nếu tệp đích vắng mặt.
- **`PROJECT_OF` là luật tiền tố cứng** (`rel.startsWith('mcp-server/')`). Nó
  đúng cho hai tệp đích hôm nay và hỏng theo chiều AN TOÀN nếu sai — tệp không
  nằm trong program thì `analyzeRealFile` in dòng đỏ rồi dừng, không im lặng báo
  sạch. Vẫn là một ánh xạ viết tay, không đọc từ `references` của tsconfig gốc.

## Ngoài hợp đồng

Những thứ vòng chấm thấy nhưng không thuộc phạm vi tiêu chí, và không làm eval
nào đỏ.

- **Chữ `expected:` của E8 lệch với thứ đang chạy.** Nó viết «con số ấy (hiện là
  7) được báo riêng»; số thật hôm nay là 5 (0 ở `MapView.test.tsx`, 5 ở
  `recipes.test.ts`), vì lượt sửa gỡ 3 phép ép và thêm lại 1. Phần THỰC CHẤT của
  `expected:` — "được báo riêng, không gộp vào số vi phạm" — vẫn đúng, nên đây là
  một con số chụp ảnh cũ trong lời eval, không phải một ngưỡng bị vượt.
- **Chữ `expected:` của E5 vẫn nói mốc so là `git diff` với `origin/main`.**
  Script dùng commit GHIM `54b5cb2`, và đó mới là điều AC-5 yêu cầu (kèm lý do:
  merge-base bằng chính HEAD sau khi merge, số dòng thêm về 0). `evals.yaml`
  chưa được cập nhật theo `contract.md`. Hai tệp bất đồng nhau; script theo hợp
  đồng.
- **Hai dạng lời gọi vẫn bị đỏ OAN bởi luật miễn trừ mới.** Đo được, cả hai trên
  `recipes.test.ts`: `__fD(...[__xD as never])` (đối số TRẢI) và
  `` __tagD`x${__xD as never}` `` (template CÓ NHÃN, tham số khai `never`). Cả
  hai đều là cách dùng hợp lệ mà bộ quét xếp vào ô vi phạm, vì `classifyPosition`
  đòi cha trực tiếp là `CallExpression`/`NewExpression`. Cùng họ với dạng THUỘC
  TÍNH JSX mà vòng 6 đã tố: vòng chấm tiêm
  `<__CompF p={__xF as never} />` với prop khai `never` vào `MapView.test.tsx` và
  nó vẫn bị xếp vào vị trí giá trị — thông điệp commit nêu JSX là triệu chứng
  nhưng danh sách "một luật gỡ cả ba" của nó không có JSX, và đo lại thì đúng là
  chưa gỡ. Ba dạng này hỏng theo chiều AN TOÀN (đỏ thừa, không xanh thừa) và
  không dạng nào có mặt trong hai tệp đích, nên không eval nào đỏ.
- **Nạp chồng: bộ quét theo đúng chữ ký mà bộ kiểm kiểu CHỌN, và đó là câu trả
  lời đúng.** Với `__ovA(p: never)` khai TRƯỚC `__ovA(p: string)`, lời gọi được
  miễn trừ; đảo thứ tự thì TypeScript chọn chữ ký `string` và bộ quét tố — đúng,
  vì khi ấy phép ép thật sự đang rót một `unknown` vào ô `string` chứ không thoả
  ô `never` nào. Kết quả phụ thuộc thứ tự khai, nhưng phụ thuộc đúng cách.
- **Chữ ký không giải được thì ngã to, đúng luật.** `declare const __anyF: any;`
  rồi `__anyF(__xC as never)` cho ra một dòng "không xác định được tham số tương
  ứng" kèm số dòng, VÀ một dòng vi phạm vị trí giá trị. Hai lần đếm cho cùng một
  chỗ — dư thừa, nhưng dư về phía chặt.
- **`tsconfig.app.json` không khai `strict` — và điều đó KHÔNG còn là một lỗ trên
  bộ công cụ hôm nay.** Vòng trước ghi mục này như một điểm yếu; đo lại thì kho
  đang dùng `typescript ~6.0.2` (bản cài: 6.0.3), nơi `strict` bật MẶC ĐỊNH. Tiêm
  thử vào project web: một tham số ngầm `any` cho `error TS7006`, một `null` gán
  vào `string` cho `error TS2322`. Thứ còn lại chỉ là rủi ro tính di động — hạ về
  một bản TypeScript 5.x thì project web sẽ lặng lẽ hết strict, trong khi
  `mcp-server/tsconfig.json` khai `"strict": true` tường minh nên không đổi.

## Analyst

**Câu hỏi nặng nhất của vòng này là mã TEST SẢN PHẨM, không phải cái thước.** Ba
phép ép `resolveConfig(compiled as never)` bị gỡ, và một dòng bị viết lại từ
`(r.compile as (p: unknown) => unknown)({...})` thành `r.compile({...} as never)`.
Đổi mã test trong cùng lượt đổi thước là đúng hình dạng của một lần làm yếu phép
đo, nên vòng chấm không đọc lời giải thích mà đi đo.

Kết luận: **không bị làm yếu, và mạnh hơn trước.** Ba lý do độc lập.

Thứ nhất, phép ép bị gỡ là phép ép THỪA THẬT. `resolveConfig` khai
`(params: RenderMapParams)`; `CompiledRecipeCall` định nghĩa là
`RenderMapParams & { motion }`, nên nó gán vào được không cần trung gian. Cái
`as never` ở đó trước kia không thoả ô nào cả — nó chỉ che. Gỡ nó là bỏ một tấm
vải, không phải bỏ một khẳng định.

Thứ hai, `compiled` ở ca «tự tay xin satellite mà thiếu biến: VẪN từ chối» trước
đây là `unknown` (do dòng ép hàm), giờ là `CompiledRecipeCall`. Đó là đi LÊN, và
nó có hệ quả đo được: dòng `resolveConfig(compiled)` bây giờ tự nó là một khẳng
định kiểu — nếu `compiled` trượt khỏi hình dạng `RenderMapParams`, typecheck đỏ.
Trước kia `as never` nuốt mọi trượt.

Thứ ba, và đây là mũi mà `mutation-probe.ts` KHÔNG bắn: vòng chấm tự phá
`mcp-server/src/resolveConfig.ts` cho `assertBasemap` thôi từ chối khi thiếu biến
môi trường (đổi điều kiện thành một hằng sai), rồi chạy `recipes.test.ts`. Kết
quả: đúng MỘT ca đỏ trong 40, và nó đỏ đúng chỗ — `recipes.test.ts:350`, tại
dòng `await expect(resolveConfig(compiled)).rejects.toThrow(KEY)`. Nghĩa là
`rejects.toThrow(KEY)` vẫn thật sự đo lời từ chối; nó không "đạt" nhờ một promise
bất kỳ nào đó ngã vì lý do khác, và nó không hoá xanh khi lời từ chối biến mất.
`resolveConfig.ts` đã hoàn nguyên từ bản sao lưu ngoài kho.

Việc gỡ ép kiểu có làm lộ lỗi kiểu nào bị che trước đó không? Không — E1 sạch cả
hai project sau khi gỡ. Thứ nó làm lộ là chiều ngược lại: `as never` cũ đang che
chính nó, và luật mới của bộ quét là thứ chỉ ra điều đó.

**Về luật miễn trừ mới.** Vòng chấm dựng lại nguyên văn lối vòng vòng 6 trong tệp
THẬT — `declare function __idP<T>(v: T): T; const _wP: number = __idP({} as never);`
— và bộ quét tố đúng dòng. Lớp ấy ĐÓNG, và đóng theo lớp chứ không theo mẫu: luật
hỏi node kiểu trên phần KHAI BÁO của chữ ký, nên `T` hiện nguyên hình là tham số
kiểu chứ không phải `never` đã suy diễn. Sáu dạng hợp lệ được tiêm cùng lượt đều
được miễn trừ đúng: đối số bọc ngoặc, `...p: never[]`, đối số không đứng cuối,
`new X(y as never)` với constructor khai `never`, gọi qua biến kiểu hàm
`const f: (p: never) => void`, và tham số khai qua bí danh `type NN = never`. Lời
gọi tuỳ chọn `?.()` cũng đúng. Đó là mười một dạng, một lần chạy, không dạng nào
sai.

Nhưng hình thái của hồ sơ này chưa chấm dứt, nó chỉ thu hẹp. Luật mới trả lời
đúng câu «tham số kia khai gì», và trả lời sai câu «chỗ này có phải một đối số
không» ở ba dạng cú pháp: đối số trải, template có nhãn, thuộc tính JSX. Cả ba
đều hỏng về phía CHẶT, nên chúng là tiếng ồn chứ không phải lỗ — nhưng chúng ở
đúng chỗ mà bốn vòng trước đã ở: một câu hỏi cấu trúc đang được trả lời bằng một
phép kiểm `parent` viết tay, trong khi bộ kiểm kiểu đã biết đối số nào ứng với
tham số nào. Ai chữa tiếp nên chữa ở đó, không nên thêm ba nhánh `if`.

Lớp còn mở thật sự đã dời sang trục khác hẳn, và hợp đồng đã tự khai nó: cái được
canh vẫn là một CÚ PHÁP (`as X`, `<X>e`), trong khi cái cần canh là một TÍNH CHẤT
(một giá trị rót vào ô nó không thuộc về). `__sinkE<T>(v: never): T` là bằng chứng
gọn nhất — nó dùng đúng phép ép mà luật vừa học cách miễn trừ ĐÚNG, rồi giặt kiểu
bằng chỗ mà không tầng nào đang nhìn. Đó là trần, không phải sót; ghi ở
`## Known limits` cùng lời đề nghị nới câu chữ của trần cho khớp thực tế.

Cuối cùng, về độ tin cậy của chính bằng chứng: mọi mũi tiêm đều làm trên tệp
THẬT rồi hoàn nguyên từ bản sao lưu đặt ngoài kho, `git status --porcelain` được
đọc sau từng lần, và trạng thái cuối chỉ còn `run-log.jsonl` — đúng tệp mà đề bài
yêu cầu nối thêm. Không mũi nào để lại vết trong `src/` hay `mcp-server/`. Không
dùng `git stash` ở bất kỳ bước nào.

## Variance

- Năm lượt chạy lệnh rời cho mười eval: E1/E2 chung `typecheck-both.ts`; E3/E4
  chung `type-probe.ts`; E5/E8/E9/E10 chung `silencer-scan.ts`; E6 và E7 mỗi cái
  một lượt. Mỗi eval chấm theo chữ `expected:` của CHÍNH NÓ. Mọi `cmd:` giải từ
  `_acceptance/config.yaml` (khoá `executors.script.*`), không tin đường dẫn nào
  viết trong đề bài; cả năm đường dẫn giải ra đều tồn tại.
- Không lượt chạy nào bị công cụ giết. Mỗi lượt in trọn dòng tổng kết cuối của
  chính nó (`OK — 0 khẳng định đỏ` hoặc `OK — 0/2 project đỏ`), và mọi mã thoát
  ghi ở trên là mã thoát THẬT của lệnh, đọc bằng `$?` ngay sau lượt chạy. Trần
  thời gian công cụ đặt 900000 ms cho mọi lượt chạy suite.
- Mười lăm phép tiêm tấn công, tất cả trên tệp THẬT (`mcp-server/src/recipes.test.ts`,
  `src/components/MapView.test.tsx`) cộng một phép phá trên
  `mcp-server/src/resolveConfig.ts`. Hoàn nguyên từ bản sao lưu ngoài kho sau
  từng ca, `git status --porcelain` đọc lại sau mỗi lần. Không tsconfig nào bị
  sửa; tệp tạm `src/probe-strict.ts` dựng cho phép thử strict đã xoá.
- Số nền E1/E2 = `red`, đo bằng worktree tách rời ở `54b5cb2` đặt DƯỚI
  `/Users/manhphan/dev/mapposter/` (`__baseline_r7`), vì ngoài thư mục ấy `npx`
  giải sang một `tsc` khác. Đo được đúng 6 lỗi như hợp đồng mô tả: bốn ở
  `MapView.test.tsx` (cặp TS2352 + TS2493 tại dòng 68 và dòng 78) và hai ở
  `recipes.test.ts` (TS2352 tại dòng 328 và dòng 356), hai project đỏ độc lập.
  Worktree đã gỡ bằng `git worktree remove --force`; `git worktree list` sau đó
  chỉ còn ba mục có sẵn. Không dùng `git stash`.
- Tám eval mang số nền `n-a`: thư mục `_acceptance/typecheck-mock-signature/`
  không tồn tại ở `54b5cb2` — vòng chấm `ls` để xác nhận thay vì suy đoán, và
  không dựng số giả.
- Mọi dòng run-log ghi ngay sau lượt chạy sinh ra nó, mang mã thoát thật và mốc
  thời gian thật của phiên chấm này; tệp cũ (vòng 1-6) chỉ được NỐI THÊM.

## Iterations

- Vòng 1 — bộ quét bịt miệng đoán vị trí đối số bằng «có `)` ngay sau không»; qua
  được lượt chấm đầu vì không ai đâm vào chỗ đoán.
- Vòng 2 — bốn lỗ mặt chữ bị đâm thủng (ngoặc nhóm, đối số không đứng cuối,
  `<never>x`, số dòng lệch); bản vá lần-ngược-đếm-ngoặc thủng thêm ba lỗ nữa.
- Vòng 3 — chuyển sang hỏi CÂY CÚ PHÁP, đúng hết về cấu trúc, nhưng dời chế độ
  hỏng sang «đọc trống»; sinh ra AC-5c và E9 để chặn ca nuốt.
- Vòng 4 — tìm ra lối vòng BÍ DANH KIỂU: cây nguyên vẹn, 0 chẩn đoán cú pháp,
  `tsc` xanh, mà `as N` với `type N = never` đi lọt; ký với known-limit còn mở.
- Vòng 5 — lỗ bí danh đóng theo lớp bằng bộ kiểm kiểu, nhưng program của bộ quét
  chỉ có MỘT tệp gốc; một `.d.ts` toàn cục đi TRỌN cổng với chín eval xanh, sinh
  ra AC-5d và E10.
- Vòng 6 — 10/10 đạt; lớp «program bất đồng» ĐÓNG. Lớp lộ ra ở TRỤC khác: ô miễn
  trừ theo VỊ TRÍ rót được `never` vào ô giá trị qua `__id({} as never)`, và cùng
  phép kiểm ấy đỏ oan `f((x as never))` cùng thuộc tính JSX — sai hai chiều.
- Vòng 7 — miễn trừ chuyển sang hỏi KIỂU KHAI của tham số; lối vòng vòng 6 đóng,
  kiểm bằng phép tiêm nguyên văn. Ba phép ép `resolveConfig(compiled as never)`
  bị luật mới tố và gỡ; phép phá `resolveConfig` chứng minh assertion còn cắn,
  và `compiled` lên kiểu từ `unknown` thành `CompiledRecipeCall`. Còn đỏ oan ở ba
  dạng cú pháp (đối số trải, template có nhãn, thuộc tính JSX) — hỏng về phía
  chặt. Trần đã khai được kiểm và đúng, kèm một biến thể cùng họ mà câu chữ của
  trần chưa phủ.
