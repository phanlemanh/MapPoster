---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Tám eval máy, năm lượt chạy lệnh rời, 8/8 đạt theo đúng chữ `expected:` của
  từng eval. Bộ phân loại AC-5b trong `silencer-scan.ts` đã được VIẾT LẠI giữa
  vòng 2 và vòng 3 (bỏ phỏng đoán mặt chữ, chuyển sang `ts.createSourceFile` +
  duyệt cây cú pháp), nên mọi số đo của vòng 2 hết hiệu lực và vòng này đo lại
  từ đầu, không kế thừa dòng nào. Bốn khuyết tật vòng 2 đã kiểm lại từng cái
  trên TỆP THẬT bằng cách tự tiêm rồi hoàn nguyên — cả bốn đóng. Lượt tấn công
  đi xa hơn bốn ca ấy mở ra hai giới hạn mới của chính bộ quét (một dương tính
  giả ở đối số bọc ngoặc, và bộ phân tích không đọc chẩn đoán cú pháp nên
  hỏng-thì-mở). Có known-limit nên cần người ký.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 299f1968fbf26c6b4aadd8e018a9a4c805328172
human_signoff:
---

# Evidence Report: typecheck-mock-signature (vòng 3)

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

## Evidence

### E1 — AC-1

- eval: E1
- run_id: typecheck-mock-signature-e1-r3-20260827052612
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T05:26:12Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (đọc theo AC-1: HAI lệnh rời, mỗi lệnh mã thoát 0 và 0 dòng `error TS`)
    (`--force` có mặt đúng như AC-1 đòi: không lượt nào đọc tsbuildinfo để báo xanh rỗng)
    (kiểm độc lập của vòng chấm: `npx which tsc` trỏ node_modules/.bin/tsc của chính kho,
     `npx tsc --version` in Version 6.0.3 — trình biên dịch thật đã chạy, không phải gói mồi)

### E2 — AC-2

- eval: E2
- run_id: typecheck-mock-signature-e2-r3-20260827052612
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T05:26:12Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (cùng lượt chạy với E1, đọc theo chiều AC-2: CẢ HAI project đều có dòng kết quả RIÊNG,
     không project nào vắng mặt — đúng chiều mà `&&` của bước CI đã che 5 ngày)
    (mã nguồn script chạy hai `execFileSync` RỜI, mỗi lệnh thu mã thoát riêng,
     nên một vế ngã không thể nuốt vế kia)

### E3 — AC-3

- eval: E3
- run_id: typecheck-mock-signature-e3-r3-20260827052622
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T05:26:22Z
- output: |
    === AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx
    (đối chứng bản-chép-sạch chạy TRƯỚC hai mũi, đúng thứ tự `expected:` đòi)
    (`git status --porcelain` sau lượt chạy chỉ còn run-log — tệp thăm dò đã dọn thật)

### E4 — AC-4

- eval: E4
- run_id: typecheck-mock-signature-e4-r3-20260827052622
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T05:26:22Z
- output: |
    === AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts

    OK — 0 khẳng định đỏ
    (kiểm độc lập: vòng chấm tự dựng một tệp thăm dò riêng và xác nhận `.basemap`
     thật sự mang kiểu `'vector' | 'satellite' | undefined`, KHÔNG phải `string`.
     Sự thật ấy đúng — nhưng xem Known limits: hai mũi trên không phải thứ chứng minh được nó)

### E5 — AC-5

- eval: E5
- run_id: typecheck-mock-signature-e5-r3-20260827052632
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T05:26:32Z
- output: |
    PASS  đối chứng dương: fixture 4 mẫu → bắt 4 (as any, @ts-expect-error, @ts-ignore, as unknown as)
    PASS  đối chứng âm: fixture sạch → bắt 0 (phải là 0)
    mốc so: 54b5cb263259bc8ebe0ef5d20960b82b369b1f6e
    PASS  src/components/MapView.test.tsx: có 10 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  src/components/MapView.test.tsx: dòng thêm không mẫu bịt miệng nào (sạch)
    PASS  mcp-server/src/recipes.test.ts: có 2 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  mcp-server/src/recipes.test.ts: dòng thêm không mẫu bịt miệng nào (sạch)

    OK — 0 khẳng định đỏ
    (ba chốt tự-canh của `expected:` đều có mặt: fixture bẩn bắt đủ 4, fixture sạch
     bắt 0, và số dòng THÊM > 0 ở CẢ HAI tệp trước khi được kết luận "sạch")

### E6 — AC-6

- eval: E6
- run_id: typecheck-mock-signature-e6-r3-20260827052641
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_mutation_probe
- verified_at: 2026-08-27T05:26:41Z
- output: |
    PASS  đối chứng nền: src/components/MapView.test.tsx xanh khi chưa phá gì
    PASS  đối chứng nền: mcp-server/src/recipes.test.ts xanh khi chưa phá gì
    PASS  [mũi 1 ép basemap:'vector'] MapView.test.tsx chuyển ĐỎ khi code sản phẩm hỏng (mã thoát khác 0)
    PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng
    PASS  [mũi 2 nuốt satelliteTiles] MapView.test.tsx chuyển ĐỎ khi code sản phẩm hỏng (mã thoát khác 0)
    PASS  [mũi 3 area-overview → 'satellite'] recipes.test.ts chuyển ĐỎ khi code sản phẩm hỏng (mã thoát khác 0)
    PASS  mcp-server/src/recipes.ts đã hoàn nguyên đúng nguyên trạng
    PASS  git thấy code sản phẩm sạch sau mọi mũi (không vết)

    OK — 0 khẳng định đỏ
    (kiểm độc lập: `git status --porcelain -- src mcp-server` sau lượt chạy rỗng)

### E7 — AC-7

- eval: E7
- run_id: typecheck-mock-signature-e7-r3-20260827052648
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_no_regression
- verified_at: 2026-08-27T05:26:48Z
- output: |
    PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
    PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-tpyYiV/vitest.json
    PASS  0 ca đỏ (629 đạt / 646 tổng)
    PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
    PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)

    OK — 0 khẳng định đỏ
    (vòng chấm đọc lại chính tệp JSON ấy: numFailedTests 0, numPendingTests 17,
     numTodoTests 0; đếm theo từng khẳng định cho {passed: 629, skipped: 17}.
     Hai tệp đích không có ca bỏ qua nào — xem Known limits về 17 ca kia)

### E8 — AC-5b

- eval: E8
- run_id: typecheck-mock-signature-e8-r3-20260827052632
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T05:26:32Z
- output: |
    PASS  phân loại «ngoặc NHÓM, không phải lời gọi (lỗ #1 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «cú pháp ép kiểu kia (lỗ #3 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «đối số KHÔNG đứng cuối (lỗ #2 vòng 2)» → ĐỐI SỐ (đúng: ĐỐI SỐ)
    PASS  đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)
    PASS  số dòng sau khối chú thích nhiều dòng → 5 (đúng: 5)
    PASS  src/components/MapView.test.tsx: không «as never» ở vị trí giá trị (0 chỗ); 0 chỗ ở vị trí đối số — hợp lệ, không tính
    PASS  mcp-server/src/recipes.test.ts: không «as never» ở vị trí giá trị (0 chỗ); 7 chỗ ở vị trí đối số — hợp lệ, không tính

    OK — 0 khẳng định đỏ
    (con số 7 chỗ đối số được báo RIÊNG, không gộp vào cột vi phạm — đúng chữ `expected:`)
    (fixture tự-canh của tác giả KHÔNG được vòng này tin: xem phần tấn công độc lập,
     đo bằng cách tiêm vào tệp THẬT rồi hoàn nguyên)

## Tấn công độc lập vào bộ phân loại AC-5b

Fixture tự-canh trong `silencer-scan.ts` là lựa chọn ca của chính tác giả, nên
vòng chấm không tính nó là bằng chứng. Mọi kết luận dưới đây lấy bằng cách TIÊM
một dòng vào tệp đích THẬT (`mcp-server/src/recipes.test.ts`, 389 dòng, nên dòng
tiêm là dòng 390 — đọc ngược lại bằng `sed -n '390p'` để đối chiếu), chạy bộ
quét, rồi hoàn nguyên từ bản sao. Sau toàn bộ 22 mũi tiêm, `git status
--porcelain` chỉ còn `run-log.jsonl`; không tệp mã nào có vết.

**Bốn khuyết tật vòng 2 — kiểm lại từng cái, cả bốn ĐÓNG.**

- `const _x: number = someIdentifier as never;` → bộ quét đỏ đúng như mong đợi
  và nêu **đúng số dòng 390**, khớp với dòng đọc ngược lại từ tệp. Số dòng lệch
  của vòng 2 đã hết.
- `const _z: number = (someIdentifier as never);` → bộ quét đỏ đúng như mong
  đợi, VÀ cột đối số vẫn đứng nguyên ở 7. Dạng bọc ngoặc ở vị trí giá trị không
  còn được giặt vào ô "hợp lệ".
- `const _y: number = <never>someIdentifier;` → bộ quét đỏ đúng như mong đợi.
  Cú pháp ép kiểu thứ hai đã nằm trong lưới quét.
- `resolveConfig(a as never, b);` → KHÔNG bị nêu, và cột đối số lên 8. Lời gọi
  nhiều đối số hợp lệ hết bị đỏ oan.

**Đi xa hơn bốn ca ấy — 11 hình dạng khác, đo trên tệp thật.** Bộ quét hỏi cây cú
pháp đúng một câu: nút ép kiểu có phải con TRỰC TIẾP trong `arguments` của một
lời gọi không. Đây là kết quả thật của câu hỏi ấy ở rìa:

| Hình dạng tiêm vào | Bộ quét nói | Vòng chấm cho là |
| --- | --- | --- |
| `new URL(x as never)` | đối số | đúng — thoả tham số hàm dựng khai `never` |
| `f?.(x as never)` | đối số | đúng — lời gọi tuỳ chọn vẫn là lời gọi |
| `@dec(x as never) class C {}` | đối số | đúng — decorator là một lời gọi thật |
| `f(g(x as never))` | đối số | đúng — đối số của lời gọi bên trong |
| `f([x as never])` | giá trị | đúng — giặt kiểu PHẦN TỬ, tham số là mảng chứ không phải `never` |
| `f({ k: x as never })` | giá trị | đúng — giặt kiểu của một thuộc tính |
| `f(() => x as never)` | giá trị | đúng — giặt kiểu TRẢ VỀ của hàm mũi tên |
| `function g(p: number = x as never)` | giá trị | đúng — tham số mặc định là vị trí giá trị |
| `f(...(x as never))` | giá trị | chấp nhận được — trải một `never` là giặt kiểu; chặt hơn thì an toàn hơn |
| tagged template `` tag`v=${x as never}` `` | giá trị | **không khớp ý định** — xem Known limits |
| `f((x as never))` | giá trị | **SAI** — đây là vị trí đối số bọc ngoặc, xem Known limits |

**Bộ phân tích có thật không?** Có, nhưng không kín. Một lỗi cú pháp ĐỨNG TRƯỚC
một chỗ ép kiểu nguy hiểm (`function broken( { [ =>`) vẫn để bộ quét bắt được chỗ
nguy hiểm ở dòng sau — bộ phân tích của TypeScript hồi phục được, nên phép phân
tích là thật chứ không phải trang trí. Nhưng một lỗi cú pháp NUỐT được vùng mã
thì bộ quét im: khối chú thích không đóng và template literal không đóng đều làm
một dòng `const _q: number = someIdentifier as never;` biến mất khỏi kết quả, và
bộ quét kết luận "0 chỗ" một cách bình thản. Nguyên nhân đã xác định trong mã:
không có lần nào đọc `parseDiagnostics` / `getSyntacticDiagnostics` — bộ quét tin
cây cú pháp mà không hỏi cây ấy có nguyên vẹn không.

**Ép kiểu nhiều dòng.** Một chỗ ép kiểu trải ba dòng được nêu ở dòng chứa toán
hạng chứ không phải dòng mở câu lệnh. Vòng chấm cho là ĐÚNG: nút ép kiểu thật sự
bắt đầu ở đó. Ghi lại vì người đọc báo cáo có thể trông chờ số dòng của câu lệnh.

**`.tsx`.** `<never>someIdentifier` trong `MapView.test.tsx` cho 0 chỗ — đúng, vì
trong `.tsx` dạng ấy không phải phép ép kiểu. `someIdentifier as never` ở vị trí
giá trị trong chính tệp `.tsx` ấy thì bị bắt đúng dòng 88. `ScriptKind` được chọn
theo đuôi tệp, không đoán. Một `as never` trong thuộc tính JSX
(`<Foo p={x as never} />`) bị xếp vào vị trí giá trị — cùng họ với hai chỗ lệch
đã ghi ở Known limits, và cũng ngã về phía chặt.

## Known limits

- **Dương tính giả ở đối số bọc ngoặc.** `f((x as never))` bị xếp vào VỊ TRÍ GIÁ
  TRỊ và làm bộ quét đỏ, dù về ý định hợp đồng nó y hệt `f(x as never)` — vẫn là
  cách hợp lệ thoả một tham số khai `never`. Nguyên nhân là chính bản vá cho
  khuyết tật (b) vòng 2: luật "con TRỰC TIẾP của `arguments`" gạt cả
  `ParenthesizedExpression`, nên nó chữa được `(x as never)` ở vị trí giá trị
  bằng cách sinh ra lỗi ngược chiều ở vị trí đối số. Hôm nay vô hại (hai tệp đích
  không có dạng ấy) và nó ngã về phía CHẶT, nhưng một lần thêm ngoặc thuần tuý
  hình thức sẽ làm cổng đỏ oan.
- **Đối số của tagged template bị xếp nhầm cùng lý do.**
  `` tag`v=${x as never}` `` → giá trị, dù trị thay thế của tagged template thật
  sự được truyền làm đối số cho hàm tag. `TaggedTemplateExpression` không có
  `arguments` nên câu hỏi của bộ quét không với tới. Cũng ngã về phía chặt. Cùng
  họ với thuộc tính JSX `<Foo p={x as never} />`.
- **Bộ quét hỏng-thì-mở trước lỗi cú pháp.** Khối chú thích hoặc template literal
  không đóng nuốt được một chỗ `as never` nguy hiểm mà bộ quét vẫn báo "0 chỗ" và
  xanh; mã không bao giờ đọc chẩn đoán cú pháp. Trong cổng này rủi ro bị E1 chặn
  (một tệp không phân tích được thì `tsc` đỏ trước), nhưng đó là một phụ thuộc
  ngầm giữa hai eval mà không eval nào khai ra: riêng E8 thì một tệp không parse
  được và một tệp sạch trông y hệt nhau.
- **E4 chứng minh ít hơn lời nó nói.** `expected:` của E4 và thông điệp trong
  `type-probe.ts` khai rằng mũi TS2322 "chứng minh union hẹp `'vector' |
  'satellite'`, không phải `string`". Nó không chứng minh được: gán một `string`
  vào `number` cũng cho TS2322, và mũi TS2339 nói về đối tượng chứ không về
  `basemap`. Hai mũi ấy phân biệt được "kiểu thật" với "`any`/`unknown`" — đó là
  giá trị thật của E4 — nhưng không phân biệt được hẹp với rộng. Vòng chấm đã tự
  kiểm bằng một tệp thăm dò riêng: `basemap` thật sự là
  `'vector' | 'satellite' | undefined`. Kết luận đúng, nhưng đúng nhờ phép đo của
  vòng chấm chứ không nhờ phép đo của E4.
- **E7 mù với ca bỏ qua.** Script chỉ đòi `numFailedTests === 0` và "mỗi tệp đích
  có ca đạt > 0". Lượt này 17/646 ca toàn kho ở trạng thái `skipped` và không
  dòng nào của E7 nhắc tới chúng. Hai tệp đích sạch ca bỏ qua (2 và 40 ca đạt, 0
  bỏ qua), nên AC-7 vẫn đứng — nhưng một lượt sau `describe.skip` cả một tệp khác
  đi thì E7 vẫn xanh y nguyên.
- **`typecheck-both.ts` không phân biệt "trình biên dịch chạy sạch" với "trình
  biên dịch không hề chạy".** Nó kết luận từ mã thoát 0 cộng 0 dòng `error TS`;
  một `npx` giải nhầm sang gói khác, hay một lệnh không chấm tệp nào, cũng cho
  đúng hình dạng ấy. `--force` đóng nửa `tsbuildinfo` của lỗ này, không đóng nửa
  còn lại. Vòng này lấp bằng tay: `npx which tsc` trỏ `node_modules/.bin/tsc` của
  chính kho và `npx tsc --version` in Version 6.0.3. Không khẳng định nào TRONG
  script làm việc đó.
- **AC-5 đo dòng THÊM so với `merge-base` (54b5cb2), theo đúng chủ đích hợp
  đồng.** Hệ quả phải nói ra: một lượt sau chỉ cần SỬA một dòng cũ đã mang sẵn
  `as any` là dòng ấy nằm ngoài lưới quét. Đây là đánh đổi cố ý, không phải lỗi.

## Ngoài hợp đồng

- `.github/workflows/ci.yml` vẫn nối hai lệnh `tsc` bằng `&&` — đúng lớp lỗi đã
  giấu 2 lỗi mcp-server suốt 5 ngày. Hợp đồng liệt kê nó ở **Out of scope** và
  chỉ đòi phép ĐO chấm hai project độc lập (AC-2, đã đạt). Nên bước CI THẬT hôm
  nay vẫn giữ nguyên hình dạng cũ: E1/E2 chứng minh cây mã sạch, không chứng minh
  CI sẽ nhìn thấy lỗi vế sau ở lần đỏ tới. Ghi lại để người ký cân riêng.
- `npx tsc --version` in Version 6.0.3 — bản TypeScript của kho đã sang dòng 6.
  Không liên quan tới hợp đồng này, ghi vì nó là thứ mọi kết luận về kiểu ở trên
  đang dựa vào.

## Analyst

Vòng này khác hai vòng trước ở một điểm quyết định: **thước đo lại đổi**. Bộ phân
loại AC-5b đã được viết lại từ phỏng đoán mặt chữ sang duyệt cây cú pháp thật,
nên số của vòng 2 không kế thừa được dòng nào và toàn bộ tám eval được đo lại từ
đầu. Đổi kiến trúc lần này là đổi đúng chỗ: bốn khuyết tật vòng 2 đóng cả bốn, và
ba lỗ mà bản vá giữa hai vòng tự sinh ra cũng biến mất cùng lớp mã sinh ra chúng.
Kiểm bằng cách tiêm vào tệp thật chứ không tin fixture của tác giả.

Nhưng "hỏi AST" không tự động thành "hỏi đúng câu". Câu bộ quét đang hỏi là *con
trực tiếp của `arguments`*, còn câu hợp đồng muốn hỏi là *có đang thoả một tham
số khai `never` không*. Hai câu ấy trùng nhau ở phần lớn hình dạng — 9/11 mũi rìa
cho câu trả lời vòng chấm đồng ý — nhưng lệch ở hai chỗ đã ghi trên, và cả hai
lần lệch đều theo cùng một kiểu: một lớp bọc trung gian
(`ParenthesizedExpression`, `TaggedTemplateExpression`) chen vào giữa nút ép kiểu
và lời gọi. Đáng chú ý là dương tính giả `f((x as never))` sinh ra từ CHÍNH bản
vá cho khuyết tật (b) vòng 2 — chữa lệch một hướng thì lỗi mọc lại ở hướng ngược.
Cả hai đều ngã về phía chặt, nên chúng làm cổng đỏ oan chứ không làm cổng bỏ lọt;
đó là lý do chúng là known-limit chứ không phải eval đỏ.

Lỗ đáng lo hơn không nằm ở phân loại mà ở tầng dưới nó: bộ quét không bao giờ hỏi
cây cú pháp có nguyên vẹn không. Một khối chú thích không đóng làm mọi kết luận
"sạch" của E8 rỗng nội dung trên chính tệp ấy. Trong cổng này E1 đứng chắn trước
nên rủi ro thật ở mức thấp, nhưng đó là một phụ thuộc ngầm giữa hai eval mà không
eval nào khai ra.

Chỗ mạnh thật của bộ này không đổi qua ba vòng. E3/E4 là hai eval duy nhất cắn
đúng thứ lượt sửa đã đổi, và cắn đúng chiều — nếu đối số bị nới về `any` thì
không mũi nào đỏ được; đối chứng "bản chép y nguyên phải sạch" chạy TRƯỚC mỗi cặp
mũi là chốt đặt đúng chỗ. E6 vẫn là lan can nặng nhất: ba mũi phá code sản phẩm,
mỗi neo đòi khớp đúng một lần, đối chứng nền chạy trước, hoàn nguyên so byte và
chốt cuối bằng `git status`. Vòng chấm đã kiểm lại chốt ấy độc lập sau lượt chạy
và cây mã sản phẩm sạch thật.

## Variance

none — cả tám eval đều tất định, không eval nào khai `runs > 1`. Năm lượt chạy
lệnh rời phủ tám eval theo đúng hình dạng đã khai trong `evals.yaml` (E1/E2 chung
một lượt, E3/E4 chung một lượt, E5/E8 chung một lượt). Hai mươi hai mũi tiêm của
phần tấn công độc lập là phép đo của vòng chấm, không tính vào số lượt của eval
nào. Không lệnh nào bị công cụ giết: mọi lượt đều in tới dòng tổng kết cuối của
chính lệnh (`OK — 0 khẳng định đỏ` hoặc `OK — 0/2 project đỏ`).

Baseline ghi `n-a` cho cả tám, có lý do chứ không phải bỏ trống: năm script eval
KHÔNG tồn tại ở `54b5cb2`, nên muốn có số nền thì phải cấy thước đo hôm nay vào
cây cũ — một cây lai không phải cây nào cả, và một con số lấy từ đó sẽ nói dối
nhiều hơn là im lặng.

## Iterations

Round 1: Bảy eval máy, năm lượt chạy, 7/7 PASS. Baseline đo được thật cho E1/E2 (đỏ trên cây `54b5cb2` với đúng 6 lỗi như hợp đồng mô tả). E3/E4/E5 ghi `n-a`, E6/E7 ghi `green`. Bốn known-limit ghi lại, đáng chú ý nhất là `as never` nằm ngoài vũ trụ quét của AC-5. Verdict PASS.

Round 2: Người duyệt đòi đóng known-limit `as never`, nên thước đo đổi — `silencer-scan.ts` thêm nhánh phân biệt theo VỊ TRÍ, hợp đồng thêm AC-5b, bộ eval thêm E8. Vì thước đổi nên mọi số đo lấy lại từ đầu: tám eval, năm lượt chạy, 8/8 PASS. Nhưng lượt tấn công độc lập vào E8 mở ra bốn khuyết tật của chính bộ quét: số dòng in ra sai, dạng bọc ngoặc bị đếm nhầm vào cột hợp lệ, `<never>x` ngoài lưới quét, và một lời gọi nhiều đối số hợp lệ bị đỏ oan. Verdict PASS, cần người ký vì còn known-limit.

Round 3: Bản vá sau vòng 2 sinh thêm ba lỗi cùng họ, nên bộ phân loại được VIẾT LẠI — bỏ hẳn phỏng đoán mặt chữ, chuyển sang `ts.createSourceFile` + duyệt cây cú pháp. Thước đo đổi lần nữa nên vòng 2 hết hiệu lực và mọi số đo lấy lại từ đầu: tám eval, năm lượt chạy lệnh rời, 8/8 PASS. Bốn khuyết tật vòng 2 kiểm lại từng cái trên tệp THẬT bằng cách tự tiêm rồi hoàn nguyên — cả bốn ĐÓNG, kể cả số dòng (nêu đúng dòng 390, đọc ngược lại từ tệp để đối chiếu) và cột đối số (đứng nguyên ở 7 khi tiêm dạng bọc ngoặc ở vị trí giá trị). Mười một hình dạng rìa khác được thử thêm: 9 khớp ý định hợp đồng, 2 lệch (`f((x as never))` và đối số tagged template bị xếp nhầm sang vị trí giá trị) — cả hai ngã về phía chặt nên làm cổng đỏ oan chứ không bỏ lọt. Lỗ mới đáng ghi nhất không nằm ở phân loại: bộ quét không đọc chẩn đoán cú pháp, nên một khối chú thích không đóng nuốt được chỗ ép kiểu nguy hiểm mà kết quả vẫn "sạch". Hai known-limit vòng 1 còn nguyên (E7 mù ca bỏ qua; `typecheck-both.ts` không phân biệt được chạy-sạch với không-chạy), và thêm một phát hiện mới về E4: nó chứng minh ít hơn lời `expected:` của chính nó. Verdict PASS, cần người ký vì còn known-limit.
