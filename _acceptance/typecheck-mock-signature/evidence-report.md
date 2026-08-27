---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Chín eval máy, năm lượt chạy lệnh rời, 9/9 đạt theo đúng chữ `expected:` của
  từng eval. Thước đo lại đổi giữa vòng 3 và vòng này — `silencer-scan.ts` thêm
  chốt hỏng-thì-ĐÓNG (`ts.transpileModule` + `reportDiagnostics`), hợp đồng thêm
  AC-5c, bộ eval thêm E9 — nên mọi số của vòng 3 hết hiệu lực và vòng này đo lại
  từ đầu, không kế thừa dòng nào. Lỗ hỏng-thì-MỞ của vòng 3 đã kiểm lại bằng
  cách tự tiêm vào TỆP THẬT rồi hoàn nguyên: cả hai ca nuốt đều làm bộ quét đỏ,
  bản hoàn nguyên xanh lại — lỗ ĐÓNG. Bốn mươi lăm hình dạng dị thường được thử
  để tìm một ca nuốt-mà-không-chẩn-đoán: không ca nào tồn tại. Lối vòng còn lại
  KHÔNG phải một dị dạng cú pháp mà là một bí danh kiểu (`type N = never`), ghi ở
  Known limits. Có known-limit nên cần người ký.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 41f507fba59bc290032a94cb74b4fc54fb138f83
human_signoff: manh 2026-08-27
---

# Evidence Report: typecheck-mock-signature (vòng 4)

| Eval | Criterion | Executor | Verdict |
| --- | --- | --- | --- |
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-5b | script | PASS |
| E9 | AC-5c | script | PASS |

## Evidence

### E1 — AC-1

- eval: E1
- run_id: typecheck-mock-signature-e1-r4-20260827153113
- exit_code: 0
- baseline: red
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T08:31:13Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (đọc theo AC-1: HAI lệnh rời, mỗi lệnh mã thoát riêng và 0 dòng `error TS`;
     `--force` có mặt đúng như AC-1 đòi, không lượt nào đọc tsbuildinfo để báo xanh rỗng)
    (số nền `red` là phép đo THẬT của vòng này: một worktree tách rời ở `54b5cb2`,
     đặt DƯỚI /Users/manhphan/dev/mapposter/ để `npx` giải đúng `tsc` của kho, chạy
     CHÍNH HAI lệnh AC-1 mô tả — không cấy script nào vào cây cũ — và cả hai đều đỏ
     với đúng 4 lỗi ở MapView.test.tsx và 2 lỗi ở recipes.test.ts. Worktree đã gỡ ngay sau đó.)

### E2 — AC-2

- eval: E2
- run_id: typecheck-mock-signature-e2-r4-20260827153113
- exit_code: 0
- baseline: red
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T08:31:13Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (cùng lượt chạy với E1, đọc theo chiều AC-2: CẢ HAI project đều có dòng kết quả
     RIÊNG, không project nào vắng mặt)
    (mã nguồn script chạy hai `execFileSync` RỜI, mỗi lệnh thu mã thoát riêng, nên một
     vế ngã không thể nuốt vế kia)
    (vế nền nói đúng chiều này: ở `54b5cb2` lệnh THỨ HAI, chạy độc lập, phơi ra 2 lỗi ở
     recipes.test.ts mà một bước dừng-ở-lệnh-đầu sẽ không bao giờ in ra)

### E3 — AC-3

- eval: E3
- run_id: typecheck-mock-signature-e3-r4-20260827153125
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T08:31:25Z
- output: |
    === AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx
    (đối chứng bản-chép-sạch chạy TRƯỚC hai mũi, đúng thứ tự `expected:` đòi)
    (kiểm độc lập của vòng chấm: tệp thăm dò không còn trên đĩa và `git status --porcelain` sạch)

### E4 — AC-4

- eval: E4
- run_id: typecheck-mock-signature-e4-r4-20260827153125
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T08:31:25Z
- output: |
    === AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts
    (kết luận "union hẹp" thì ĐÚNG — vòng chấm đọc thẳng kiểu sản phẩm tại
     mcp-server/src/recipes.ts:595 và thấy `basemap?: 'vector' | 'satellite'` — nhưng nó
     đúng nhờ phép đo của vòng chấm, không nhờ mũi TS2322; xem Known limits)

### E5 — AC-5

- eval: E5
- run_id: typecheck-mock-signature-e5-r4-20260827153104
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T08:31:04Z
- output: |
    PASS  đối chứng dương: fixture 4 mẫu → bắt 4 (as any, @ts-expect-error, @ts-ignore, as unknown as)
    PASS  đối chứng âm: fixture sạch → bắt 0 (phải là 0)
    mốc so: 54b5cb263259bc8ebe0ef5d20960b82b369b1f6e
    PASS  src/components/MapView.test.tsx: có 10 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  src/components/MapView.test.tsx: dòng thêm không mẫu bịt miệng nào (sạch)
    PASS  mcp-server/src/recipes.test.ts: có 2 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  mcp-server/src/recipes.test.ts: dòng thêm không mẫu bịt miệng nào (sạch)
    (ba chốt tự-canh đủ mặt: fixture bẩn bắt đủ 4, fixture sạch bắt 0, và số dòng thêm > 0
     ở CẢ HAI tệp trước khi bất kỳ kết luận "sạch" nào được đọc)

### E6 — AC-6

- eval: E6
- run_id: typecheck-mock-signature-e6-r4-20260827153133
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_mutation_probe
- verified_at: 2026-08-27T08:31:33Z
- output: |
    PASS  đối chứng nền: src/components/MapView.test.tsx xanh khi chưa phá gì
    PASS  đối chứng nền: mcp-server/src/recipes.test.ts xanh khi chưa phá gì
    PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng (mũi ép basemap về vector)
    PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng (mũi nuốt satelliteTiles)
    PASS  mcp-server/src/recipes.test.ts ĐỎ khi code sản phẩm hỏng (mũi đổi mặc định area-overview)
    PASS  cả ba lượt: tệp sản phẩm đã hoàn nguyên đúng nguyên trạng
    PASS  git thấy code sản phẩm sạch sau mọi mũi (không vết)

    OK — 0 khẳng định đỏ
    (đối chứng nền chạy TRƯỚC mọi mũi; mỗi neo phá khớp đúng 1 lần nên không mũi nào rơi
     vào nhánh "không đặt được"; vòng chấm chạy `git status --porcelain` độc lập ngay sau
     lượt này và cây mã sản phẩm sạch thật)

### E7 — AC-7

- eval: E7
- run_id: typecheck-mock-signature-e7-r4-20260827153144
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_no_regression
- verified_at: 2026-08-27T08:31:44Z
- output: |
    PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
    PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-J3nbcP/vitest.json
    PASS  0 ca đỏ (629 đạt / 646 tổng)
    PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
    PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)

    OK — 0 khẳng định đỏ
    (con số đọc từ báo cáo JSON của vitest, không suy từ mã thoát cả bộ — đúng thứ
     `expected:` đòi; chênh 629/646 là 17 ca ở trạng thái bỏ qua trên TOÀN KHO, hai tệp
     đích không có ca nào như vậy)

### E8 — AC-5b

- eval: E8
- run_id: typecheck-mock-signature-e8-r4-20260827153104
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T08:31:04Z
- output: |
    PASS  phân loại «ca hồi quy type-probe» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «ngoặc NHÓM, không phải lời gọi (lỗ #1 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «cú pháp ép kiểu kia (lỗ #3 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «đối số KHÔNG đứng cuối (lỗ #2 vòng 2)» → ĐỐI SỐ (đúng: ĐỐI SỐ)
    PASS  đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)
    PASS  src/components/MapView.test.tsx: không «as never» ở vị trí giá trị (0 chỗ); 0 chỗ ở vị trí đối số
    PASS  mcp-server/src/recipes.test.ts: không «as never» ở vị trí giá trị (0 chỗ); 7 chỗ ở vị trí đối số — hợp lệ, không tính
    (con số 7 mà `expected:` nêu tên được báo RIÊNG, không gộp vào số vi phạm; vòng chấm
     đối chiếu độc lập bằng `grep` trên hai tệp: đúng 7 chỗ, cả 7 ở vị trí đối số)
    (mười mũi phân loại đều khớp, kể cả ba ca hồi quy của vòng 2)

### E9 — AC-5c

- eval: E9
- run_id: typecheck-mock-signature-e9-r4-20260827153104
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T08:31:04Z
- output: |
    PASS  hỏng-thì-đóng «chú thích không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
    PASS  hỏng-thì-đóng «template literal không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
    PASS  đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)
    PASS  src/components/MapView.test.tsx: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
    PASS  mcp-server/src/recipes.test.ts: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
    (dòng "phân tích cú pháp sạch (0 lỗi)" có mặt cho TỪNG tệp đích trước mọi kết luận
     "sạch", đúng thứ `expected:` đòi)
    (vòng chấm KHÔNG tin fixture của tác giả và tự tiêm vào mcp-server/src/recipes.test.ts
     THẬT: khối chú thích không đóng kèm một chỗ ép kiểu nguy hiểm phía sau → bộ quét đỏ;
     template literal không đóng cùng dạng → bộ quét đỏ; hoàn nguyên, đối chiếu bằng
     `shasum` → xanh lại, và `git status --porcelain` sạch cho mọi tệp đã chạm)

## Known limits

- **Dương tính giả ở đối số bọc ngoặc — CÒN NGUYÊN.** Vòng này đo lại:
  `f((x as never))` vẫn bị xếp vào VỊ TRÍ GIÁ TRỊ và làm bộ quét đỏ, dù về ý
  định hợp đồng nó y hệt `f(x as never)`. Luật "con TRỰC TIẾP của `arguments`"
  gạt cả `ParenthesizedExpression`. Hôm nay vô hại (hai tệp đích không có dạng
  ấy) và nó ngã về phía CHẶT, nhưng một lần thêm ngoặc thuần tuý hình thức sẽ
  làm cổng đỏ oan.
- **Đối số của tagged template xếp nhầm cùng lý do — CÒN NGUYÊN.**
  `` tag`v=${x as never}` `` → GIÁ TRỊ, dù trị thay thế thật sự được truyền làm
  đối số cho hàm tag. Vòng này đo thêm hai họ hàng cùng kiểu, cùng ngã về phía
  chặt: `<div>{x as never}</div>` và `<Foo p={x as never} />` trong `.tsx` cũng
  ra GIÁ TRỊ. Quy luật chung: mọi chỗ ép kiểu KHÔNG phải con trực tiếp của danh
  sách `arguments` đều bị coi là vị trí giá trị.
- **Bí danh kiểu đi vòng qua AC-5b — MỚI, và là lối vòng đáng kể nhất còn lại.**
  `type N = never; const x: number = expr as N;` KHÔNG bị bắt: `classifyNever`
  chỉ nhận nút ép kiểu có `type.kind === NeverKeyword`, còn `as N` là một
  `TypeReference`. Vòng chấm đo ba chiều để chắc đây là lối vòng thật chứ không
  phải chuyện lý thuyết: (1) trình kiểm kiểu THẬT cho 0 lỗi với `as N` y hệt như
  với `as never`, trong khi bỏ hẳn chỗ ép kiểu thì đỏ TS2322 — tức nó giặt kiểu
  y hệt; (2) tiêm dạng ấy vào `mcp-server/src/recipes.test.ts` THẬT thì bộ quét
  vẫn xanh; (3) `npx tsc -p mcp-server/tsconfig.json` cũng vẫn xanh, nên E1 không
  đứng chắn giúp. Đây KHÔNG phải hỏng-thì-mở của AC-5c (không có gì bị nuốt, cây
  cú pháp nguyên vẹn, 0 chẩn đoán) mà là một lỗ trong lưới phân loại của AC-5b.
  Hai tệp đích hôm nay không có bí danh nào như vậy (kiểm bằng `grep`).
- **`@ts-nocheck` nằm ngoài danh sách mẫu — MỚI, nhưng có lưới thứ hai đỡ.**
  Bốn mẫu của AC-5 không gồm `@ts-nocheck`, mà một dòng ấy tắt kiểm kiểu cả tệp.
  Vòng chấm tiêm nó vào đầu `mcp-server/src/recipes.test.ts` THẬT: bộ quét
  (E5/E8/E9) xanh nguyên. Nhưng `type-probe.ts` bắt được — cả hai mũi TS2322 và
  TS2339 im lặng nên E3/E4 đỏ. Lưới hai lớp đứng vững; ghi lại vì đó là một phụ
  thuộc GIỮA các eval mà không eval nào khai ra.
- **E4 chứng minh ít hơn lời nó nói — CÒN NGUYÊN.** `expected:` của E4 và thông
  điệp trong `type-probe.ts` khai rằng mũi TS2322 "chứng minh union hẹp
  `'vector' | 'satellite'`, không phải `string`". Nó không chứng minh được: gán
  một `string` vào `number` cũng cho TS2322. Hai mũi ấy phân biệt được "kiểu
  thật" với "`any`/`unknown`" — đó là giá trị thật của E4. Vòng này tự kiểm bằng
  cách đọc thẳng kiểu sản phẩm: `mcp-server/src/recipes.ts:595` khai
  `basemap?: 'vector' | 'satellite'`. Kết luận đúng, nhưng đúng nhờ phép đo của
  vòng chấm chứ không nhờ phép đo của E4.
- **E7 mù với ca bỏ qua — CÒN NGUYÊN.** Script chỉ đòi `numFailedTests === 0` và
  "mỗi tệp đích có ca đạt > 0". Lượt này 17/646 ca toàn kho ở trạng thái bỏ qua
  và không dòng nào của E7 nhắc tới chúng. Hai tệp đích sạch ca bỏ qua (2 và 40
  ca đạt), nên AC-7 vẫn đứng — nhưng một lượt sau tắt cả một tệp khác đi thì E7
  vẫn xanh y nguyên.
- **`typecheck-both.ts` không phân biệt "trình biên dịch chạy sạch" với "trình
  biên dịch không hề chạy" — CÒN NGUYÊN.** Nó kết luận từ mã thoát 0 cộng 0 dòng
  `error TS`; một `npx` giải nhầm sang gói khác cũng cho đúng hình dạng ấy.
  `--force` đóng nửa `tsbuildinfo` của lỗ này, không đóng nửa còn lại. Vòng này
  lấp bằng tay như vòng trước: `npx which tsc` trỏ
  `/Users/manhphan/dev/mapposter/node_modules/.bin/tsc` và `npx tsc --version` in
  Version 6.0.3. Không khẳng định nào TRONG script làm việc đó.
- **AC-5 đo dòng THÊM so với `merge-base` (54b5cb2), theo đúng chủ đích hợp
  đồng — CÒN NGUYÊN.** Hệ quả phải nói ra: một lượt sau chỉ cần SỬA một dòng cũ
  đã mang sẵn `as any` là dòng ấy nằm ngoài lưới quét. Đánh đổi cố ý, không phải
  lỗi.
- **Chốt AC-5c là một bộ kiểm cú pháp THỨ HAI, yếu hơn `tsc`.** Vòng này xác
  nhận nó đỏ cả với tệp có lỗi cú pháp mà KHÔNG có chỗ ép kiểu nguy hiểm nào.
  Vòng chấm cho rằng mức chặt ấy ĐÚNG — "không đo được ≠ sạch" là chính luật
  AC-5c khai — và giá phải trả gần bằng không, vì mọi tệp làm chốt này đỏ cũng
  làm E1 đỏ. Ghi lại để người ký biết rằng một lần đỏ ở E9 sẽ không bao giờ là
  tín hiệu DUY NHẤT.

## Ngoài hợp đồng

- **Bước Typecheck của CI không dùng `&&` — hợp đồng và báo cáo vòng 3 mô tả sai
  mặt chữ.** `.github/workflows/ci.yml:22-24` là một khối `run: |` hai dòng
  (`npx tsc -b` rồi `npx tsc -p mcp-server/tsconfig.json`), y hệt ở `54b5cb2`,
  không có `&&` nào. HỆ QUẢ thì vẫn đúng như hợp đồng nói — GitHub Actions chạy
  khối ấy bằng `bash -e`, nên lệnh đầu ngã là bước dừng và lệnh sau không chạy —
  nhưng người ký nên biết rằng câu "nối bằng `&&`" trong AC-2 và trong báo cáo
  vòng 3 không khớp tệp thật. Không eval nào đổi verdict vì điều này: E2 đo phép
  ĐO có chấm hai project độc lập hay không, và nó chấm.
- **CI chạy `npx tsc -b` KHÔNG kèm `--force`.** Chính AC-1 lập luận rằng thiếu
  `--force` thì `tsbuildinfo` có thể cho một lời "xanh" rỗng nội dung. Phép đo
  của cổng này có `--force`; bước CI thật thì không. Hợp đồng liệt kê `ci.yml` ở
  **Out of scope** nên đây không phải eval đỏ, nhưng nó là chênh lệch giữa thứ
  cổng chứng minh và thứ CI sẽ thấy. Người ký cân riêng.
- `npx tsc --version` in Version 6.0.3 — bản TypeScript của kho đã sang dòng 6.
  Mọi kết luận về kiểu ở trên đang dựa vào nó.

## Analyst

Câu hỏi trung tâm của vòng này chỉ có một: sau bản vá AC-5c, còn dị dạng nào vừa
nuốt được một chỗ ép kiểu nguy hiểm vừa không sinh chẩn đoán cú pháp nào không?
Câu trả lời đo được là **không**. Vòng chấm dựng một bộ thăm dò dùng lại NGUYÊN
VĂN hai hàm `parseErrorCount` và `classifyNever` (chép ra từ chính
`silencer-scan.ts`, để bộ thăm dò không thể trôi khác thứ nó đang tấn công) rồi
bắn 45 hình dạng qua nó: chú thích không đóng, template không đóng, chuỗi không
đóng, regex không đóng, `${` không đóng, `*/` mồ côi, `<!--` và `-->` kiểu HTML,
`#!` giữa tệp và `#!` đầu tệp, BOM đầu tệp và BOM giữa tệp, U+2028, ZWJ chen vào
giữa `as` và `never`, byte NUL, CRLF, chú thích lồng giả, dấu huyền lạc trong
chuỗi / trong chú thích dòng / trong chú thích khối, JSX không đóng trong `.tsx`,
`<never>x` trong `.tsx`, và mười mấy vị trí đặt chỗ ép kiểu khác. MỌI dạng nuốt
được đều sinh ít nhất một chẩn đoán, nên chốt bắt hết.

Đúng một ca nuốt mà không sinh chẩn đoán nào: chuỗi có dấu gạch chéo nối dòng
(`"abc\` rồi xuống dòng). Nhưng ca ấy nuốt dòng sau vào trong một CHUỖI — nó
thành dữ liệu, trình biên dịch không đọc nó như mã, nên nó không giặt được lỗi
kiểu nào. Đó là điểm mấu chốt và nó không phải trùng hợp: muốn giặt một lỗi kiểu
thì chỗ ép kiểu phải được BIÊN DỊCH; mà thứ vừa được biên dịch vừa vắng mặt khỏi
cây cú pháp thì mâu thuẫn với chính nó, trừ khi bộ phân tích ngã — và bộ phân
tích ngã thì để lại chẩn đoán. Chốt hỏng-thì-ĐÓNG vì thế đóng đúng LỚP lỗ, không
chỉ hai ca mẫu mà tác giả tự chọn.

Nhánh `.tsx` cũng được kiểm chứ không tin lời khai: `parseErrorCount` trên chính
`src/components/MapView.test.tsx` cho 0 chẩn đoán khi tên tệp kết thúc `.tsx`,
nhưng cho 1 chẩn đoán nếu ép cùng nội dung ấy đi đường `.ts`. Nhánh
`jsx: Preserve` vì thế là nhánh có tải trọng thật, và nó không nổ oan trên một
tệp JSX thật. Trong `.tsx`, `<never>x` không đóng thẻ ra 2 chẩn đoán nên bị chặn;
`<never>x</never>` thì hợp lệ và im lặng, nhưng nó là một phần tử JSX chứ không
phải phép ép kiểu — nó không giặt được gì, nên không phải lỗ.

Lối vòng còn lại không nằm ở tầng cú pháp mà ở tầng TÊN KIỂU: `type N = never`
rồi `expr as N`. Cây nguyên vẹn, 0 chẩn đoán, và `classifyNever` không thấy gì vì
nó hỏi `NeverKeyword` chứ không hỏi "kiểu này giải ra có phải `never` không". Nó
giặt kiểu y hệt `as never` — vòng chấm chạy trình kiểm kiểu thật để xác nhận, rồi
tiêm vào tệp thật để xác nhận lần nữa rằng cả bộ quét lẫn `tsc` đều đi qua. Đây
là cùng một bài học mà hồ sơ này đã học hai lần ở tầng thấp hơn: bộ quét đang hỏi
một câu ĐẠI DIỆN (`NeverKeyword`) thay cho câu nó thật sự muốn hỏi (kiểu đích có
giải ra `never` không). Câu đúng cần trình kiểm kiểu, không chỉ bộ phân tích cú
pháp. Ghi làm known-limit chứ không phải eval đỏ: hai tệp đích hôm nay sạch dạng
ấy, và AC-5b tự khai phạm vi của nó bằng mặt chữ `as never` / `<never>x`.

Hai phát hiện quá-chặt của vòng 3 được đo lại và CÒN NGUYÊN, đúng như nhiệm vụ
vòng này dự đoán — chúng chưa được sửa. Cả hai ngã về phía chặt nên làm cổng đỏ
oan chứ không bỏ lọt, và đó là lý do chúng ở Known limits chứ không phải ở
`failed_evals`.

Chỗ mạnh của bộ này không đổi qua bốn vòng. E3/E4 là hai eval duy nhất cắn đúng
thứ lượt sửa đã đổi, và cắn đúng chiều; chúng cũng là lưới duy nhất bắt được
`@ts-nocheck`. E6 vẫn là lan can nặng nhất: ba mũi phá code sản phẩm, mỗi neo đòi
khớp đúng một lần, đối chứng nền chạy trước, hoàn nguyên so byte, chốt cuối bằng
`git status` — vòng chấm kiểm lại chốt ấy độc lập sau lượt chạy và cây mã sản
phẩm sạch thật. Điều mới của vòng 4 là AC-5c biến một thước IM LẶNG thành một
thước biết kêu, và đó là loại sửa hiếm: nó không thêm độ phủ, nó thêm khả năng
thất bại.

## Variance

none — cả chín eval đều tất định, không eval nào khai `runs > 1`. Năm lượt chạy
lệnh rời phủ chín eval theo đúng hình dạng đã khai trong `evals.yaml` (E1/E2 chung
một lượt, E3/E4 chung một lượt, E5/E8/E9 chung một lượt). Bốn mươi lăm mũi thăm dò
dị dạng, năm mũi tiêm vào tệp thật (hai ca nuốt, một bí danh kiểu, một
`@ts-nocheck`, một lượt hoàn nguyên), và lượt đo nền ở worktree `54b5cb2` đều là
phép đo của vòng chấm, không tính vào số lượt của eval nào. Không lệnh nào bị
công cụ giết: mọi lượt đều in tới dòng tổng kết cuối của chính lệnh (`OK — 0
khẳng định đỏ` hoặc `OK — 0/2 project đỏ`), và mọi lệnh nặng đều chạy với trần
thời gian công cụ đặt ở 900 giây.

Baseline lần này KHÔNG còn là `n-a` toàn phần. E1/E2 ghi `red` bằng một phép đo
thật và tự vệ được: hợp đồng AC-1 định nghĩa phép đo bằng CHÍNH HAI LỆNH `tsc`,
nên chạy hai lệnh ấy trên cây `54b5cb2` không cần cấy script nào — không có cây
lai. Cả hai đỏ với đúng 4 lỗi ở `MapView.test.tsx` và 2 lỗi ở `recipes.test.ts`,
khớp từng dòng với mô tả sự cố trong hợp đồng. E3..E9 giữ `n-a` vì năm script eval
KHÔNG tồn tại ở `54b5cb2` (kiểm bằng `git ls-tree`), nên số nền cho chúng buộc
phải cấy thước đo hôm nay vào cây cũ — một cây không phải cây nào cả.

## Iterations

Round 1: Bảy eval máy, năm lượt chạy, 7/7 PASS. Baseline đo được thật cho E1/E2 (đỏ trên cây `54b5cb2` với đúng 6 lỗi như hợp đồng mô tả). E3/E4/E5 ghi `n-a`, E6/E7 ghi `green`. Bốn known-limit ghi lại, đáng chú ý nhất là `as never` nằm ngoài vũ trụ quét của AC-5. Verdict PASS.

Round 2: Người duyệt đòi đóng known-limit `as never`, nên thước đo đổi — `silencer-scan.ts` thêm nhánh phân biệt theo VỊ TRÍ, hợp đồng thêm AC-5b, bộ eval thêm E8. Vì thước đổi nên mọi số đo lấy lại từ đầu: tám eval, năm lượt chạy, 8/8 PASS. Nhưng lượt tấn công độc lập vào E8 mở ra bốn khuyết tật của chính bộ quét: số dòng in ra sai, dạng bọc ngoặc bị đếm nhầm vào cột hợp lệ, `<never>x` ngoài lưới quét, và một lời gọi nhiều đối số hợp lệ bị đỏ oan. Verdict PASS, cần người ký vì còn known-limit.

Round 3: Bản vá sau vòng 2 sinh thêm ba lỗi cùng họ, nên bộ phân loại được VIẾT LẠI — bỏ hẳn phỏng đoán mặt chữ, chuyển sang `ts.createSourceFile` + duyệt cây cú pháp. Thước đo đổi lần nữa nên vòng 2 hết hiệu lực: tám eval, năm lượt chạy lệnh rời, 8/8 PASS. Bốn khuyết tật vòng 2 kiểm lại từng cái trên tệp THẬT — cả bốn đóng. Mười một hình dạng rìa khác được thử: 9 khớp ý định hợp đồng, 2 lệch (`f((x as never))` và đối số tagged template) — cả hai ngã về phía chặt. Lỗ mới đáng ghi nhất không nằm ở phân loại: bộ quét không đọc chẩn đoán cú pháp, nên một khối chú thích không đóng nuốt được chỗ ép kiểu nguy hiểm mà kết quả vẫn "sạch". Verdict PASS, cần người ký vì còn known-limit.

Round 4: Người duyệt đòi đóng đúng lỗ hỏng-thì-mở ấy trước khi ký. Thước đo đổi lần thứ ba — `silencer-scan.ts` thêm `parseErrorCount` (`ts.transpileModule` + `reportDiagnostics`), hợp đồng thêm AC-5c, bộ eval thêm E9 — nên số vòng 3 hết hiệu lực và chín eval được đo lại từ đầu qua năm lượt chạy lệnh rời: 9/9 PASS. Lỗ vòng 3 kiểm bằng cách tiêm vào `mcp-server/src/recipes.test.ts` THẬT: chú thích không đóng → bộ quét đỏ, template không đóng → bộ quét đỏ, hoàn nguyên → xanh lại, cây mã sạch. Câu hỏi trọng tâm — còn dị dạng nào nuốt được chỗ ép kiểu mà KHÔNG sinh chẩn đoán không — được trả lời bằng 45 mũi thăm dò trên chính hai hàm của bộ quét: không có. Ca duy nhất nuốt-mà-sạch (chuỗi nối dòng) nuốt vào trong một chuỗi, tức dữ liệu, nên không giặt được lỗi kiểu nào. Lối vòng còn lại là một BÍ DANH kiểu (`type N = never`), xác nhận ba chiều là thật và ghi làm known-limit mới cùng `@ts-nocheck` (lưới E3/E4 đỡ được cái sau). Hai phát hiện quá-chặt của vòng 3 chưa sửa và còn nguyên. Baseline `red` đo lại được cho E1/E2 mà không cần cây lai. Verdict PASS, cần người ký vì còn known-limit.
