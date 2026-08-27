---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Chín eval máy, năm lượt chạy lệnh rời, 9/9 đạt theo đúng chữ `expected:` của
  từng eval. Thước đo đổi giữa vòng 4 và vòng này ở HAI chỗ — `classifyNever`
  chuyển từ đọc mặt chữ nút kiểu sang hỏi BỘ KIỂM KIỂU, và mốc so của AC-5
  chuyển từ `merge-base` sang commit GHIM `54b5cb2` — nên mọi số của vòng 4 hết
  hiệu lực và vòng này đo lại từ đầu, không kế thừa dòng nào. Lối vòng BÍ DANH
  của vòng 4 đã ĐÓNG, và đóng theo LỚP chứ không theo mẫu: mười ba hình dạng bí
  danh khác nhau (một tầng, dây chuyền ba tầng, nhập từ tệp thật, thư mục
  index, đuôi `.js`, gói cài trong node_modules, `never[number]`, `(never)`,
  `Id<never>`, kiểu điều kiện, giao `string & number`, `as unknown as never`,
  `as any as never`, tên trong namespace) đều bị bắt đúng vị trí, còn đối chứng
  âm `type NeverMind = string` không bị bắt. Nhưng bài học của hồ sơ này lặp lại
  ở tầng thứ NĂM: bộ kiểm kiểu chỉ biết thứ nó ĐỌC ĐƯỢC, và chương trình mà bộ
  quét tự dựng chỉ có MỘT tệp gốc, không đọc tsconfig của kho. Một bí danh
  `never` tới được lượt biên dịch THẬT qua kênh khác — khai toàn cục trong một
  `.d.ts`, hay ánh xạ `paths` — thì bộ kiểm kiểu trả về kiểu-lỗi chứ không phải
  `never`, và bộ quét im lặng báo sạch. Vòng chấm dựng đủ ca ấy và cho nó đi
  qua CẢ E1/E2, E3/E4, E5/E8/E9 lẫn E7 với mọi khẳng định xanh. Ghi ở Known
  limits; có known-limit nên cần người ký.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: b70c791248cc39ac23d38df7f368d6306219393e
human_signoff:
---

# Evidence Report: typecheck-mock-signature (vòng 5)

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
- run_id: typecheck-mock-signature-e1-r5-20260827092354
- exit_code: 0
- baseline: red
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T09:23:54Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (đọc theo AC-1: HAI lệnh RỜI, mỗi lệnh có mã thoát riêng và 0 dòng `error TS`;
     `--force` có mặt đúng như AC-1 đòi nên không lượt nào đọc `tsbuildinfo` để báo
     một lời "xanh" rỗng nội dung)
    (số nền `red` là phép đo THẬT của vòng NÀY, không chép của vòng trước: một worktree
     tách rời ở `54b5cb2` đặt DƯỚI /Users/manhphan/dev/mapposter/ để `npx` giải đúng
     `tsc` của kho — kiểm bằng `npx which tsc` → node_modules/.bin/tsc của kho — rồi
     chạy CHÍNH HAI lệnh AC-1 mô tả, không cấy script nào vào cây cũ. Cả hai vế đều đỏ:
     bốn dòng TS2352/TS2493 ở `MapView.test.tsx` dòng 68 và 78, hai dòng TS2352 ở
     `recipes.test.ts` dòng 328 và 356 — đúng 6 lỗi mà hợp đồng mô tả. Worktree đã gỡ
     ngay sau đó, `git worktree list` chỉ còn ba mục có sẵn.)

### E2 — AC-2

- eval: E2
- run_id: typecheck-mock-signature-e2-r5-20260827092354
- exit_code: 0
- baseline: red
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T09:23:54Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (cùng lượt chạy với E1, đọc theo trục KHÁC: hai project đều có DÒNG KẾT QUẢ RIÊNG,
     không project nào vắng mặt. Đây là chiều mà bước Typecheck của CI che 5 ngày — một
     project không chạy trông y hệt một project sạch. `typecheck-both.ts` thu mã thoát
     của từng lệnh rồi mới kết luận, nên vế sau không thể bị vế trước nuốt.)
    (đối chứng nền cùng worktree `54b5cb2` cho thấy phép đo này phân biệt được thật: vế
     mcp-server ở đó đỏ ĐỘC LẬP với vế web, đúng hai lỗi mà báo cáo sự cố gốc không thấy.)

### E3 — AC-3

- eval: E3
- run_id: typecheck-mock-signature-e3-r5-20260827092416
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T09:24:16Z
- output: |
    === AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx

    OK — 0 khẳng định đỏ
    (đối chứng bản-chép-sạch chạy TRƯỚC hai mũi, đúng thứ tự `expected:` đòi, nên không
     mũi nào đọc nhầm một lỗi sẵn có thành "mũi đã đỏ". Mã lỗi khớp đúng tệp thăm dò,
     không phải một dòng đỏ ở đâu khác trong project.)
    (baseline `n-a`: `type-probe.ts` chưa tồn tại ở `54b5cb2` nên không có số nền để so;
     vòng chấm không dựng số giả cho ô này.)

### E4 — AC-4

- eval: E4
- run_id: typecheck-mock-signature-e4-r5-20260827092416
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T09:24:16Z
- output: |
    === AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts

    OK — 0 khẳng định đỏ
    (cùng lượt chạy với E3, nửa thứ hai. Cả hai tệp thăm dò đều được dọn và
     `git status --porcelain` ngay sau lượt chạy không thấy vết nào của chúng.)
    (đọc trừ hao: mũi TS2322 KHÔNG chứng minh được union hẹp — xem Known limits.)

### E5 — AC-5

- eval: E5
- run_id: typecheck-mock-signature-e5-r5-20260827092404
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T09:24:04Z
- output: |
    PASS  đối chứng dương: fixture 4 mẫu → bắt 4 (as any, @ts-expect-error, @ts-ignore, as unknown as)
    PASS  đối chứng âm: fixture sạch → bắt 0 (phải là 0)
    mốc so: 54b5cb263259bc8ebe0ef5d20960b82b369b1f6e
    PASS  tệp đích tồn tại: src/components/MapView.test.tsx
    PASS  src/components/MapView.test.tsx: có 10 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  src/components/MapView.test.tsx: dòng thêm không mẫu bịt miệng nào (sạch)
    PASS  tệp đích tồn tại: mcp-server/src/recipes.test.ts
    PASS  mcp-server/src/recipes.test.ts: có 2 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  mcp-server/src/recipes.test.ts: dòng thêm không mẫu bịt miệng nào (sạch)

    OK — 0 khẳng định đỏ
    (ba chốt tự-canh mà `expected:` đòi đều có mặt và đều đạt: fixture bẩn bắt đủ bốn,
     fixture sạch bắt không, và số dòng THÊM > 0 cho CẢ HAI tệp trước khi chữ "sạch"
     được phép đọc.)
    (mốc GHIM kiểm riêng bởi vòng chấm, ba chiều. Một: `git rev-parse 54b5cb2^{commit}`
     giải ra `54b5cb263259bc8ebe0ef5d20960b82b369b1f6e`, và `git diff --unified=0` chạy
     tay cho đúng 10 và 2 dòng thêm — khớp số của script. Hai: hai lượt chạy liên tiếp
     cho cùng 10 và 2, số ổn định. Ba: mốc không giải được thì script ngã LỚN TIẾNG —
     `SILENCER_SCAN_BASE=deadbeefdeadbeef` in thẳng dòng "không giải được mốc so" rồi
     dừng, không lượt nào báo "sạch". Và `SILENCER_SCAN_BASE=HEAD` — tức mô phỏng đúng
     chế độ hỏng mà việc ghim sinh ra để chữa — làm chốt `added.length > 0` nổ cho cả
     hai tệp thay vì im lặng xanh.)
    (đo thêm để người ký thấy việc ghim là CẦN, không phải sở thích: `git merge-base HEAD
     origin/main` hôm nay ra `866a42a`, và số dòng thêm so với mốc ấy là 0 và 0. Mốc cũ
     đã mất đối tượng đo thật, không phải trên lý thuyết.)

### E6 — AC-6

- eval: E6
- run_id: typecheck-mock-signature-e6-r5-20260827092424
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_mutation_probe
- verified_at: 2026-08-27T09:24:24Z
- output: |
    PASS  đối chứng nền: src/components/MapView.test.tsx xanh khi chưa phá gì
    PASS  đối chứng nền: mcp-server/src/recipes.test.ts xanh khi chưa phá gì
    PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng (mũi ép basemap về vector)
    PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng
    PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng (mũi nuốt satelliteTiles)
    PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng
    PASS  mcp-server/src/recipes.test.ts ĐỎ khi code sản phẩm hỏng (mũi đổi mặc định area-overview)
    PASS  mcp-server/src/recipes.ts đã hoàn nguyên đúng nguyên trạng
    PASS  git thấy code sản phẩm sạch sau mọi mũi (không vết)

    OK — 0 khẳng định đỏ
    (đối chứng nền chạy TRƯỚC mọi mũi; không mũi nào rơi vào nhánh "neo phá không đặt
     được", nghĩa là cả ba neo khớp đúng một lần. Vòng chấm chạy `git status --porcelain`
     độc lập ngay sau lượt này và cây mã sản phẩm sạch thật.)

### E7 — AC-7

- eval: E7
- run_id: typecheck-mock-signature-e7-r5-20260827093218
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_no_regression
- verified_at: 2026-08-27T09:32:18Z
- output: |
    PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
    PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-Im1E2H/vitest.json
    PASS  0 ca đỏ (629 đạt / 646 tổng)
    PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
    PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)

    OK — 0 khẳng định đỏ
    (phần `expected:` đòi hơn mã thoát: bằng chứng đọc báo cáo JSON của vitest và cho
     TỪNG tệp đích một con số ca đạt > 0 — 2 và 40 — nên "xanh" ở đây không thể là
     "không ai chạy nó".)

### E8 — AC-5b

- eval: E8
- run_id: typecheck-mock-signature-e8-r5-20260827092404
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T09:24:04Z
- output: |
    PASS  phân loại «ca hồi quy type-probe» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «ngoặc NHÓM, không phải lời gọi» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «cú pháp ép kiểu kia <never>x» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «đối số cuối» / «đối số lồng» / «đối số KHÔNG đứng cuối» → ĐỐI SỐ (đúng: ĐỐI SỐ)
    PASS  phân loại «bí danh một tầng» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «bí danh DÂY CHUYỀN» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «bí danh ở vị trí đối số» → ĐỐI SỐ (đúng: ĐỐI SỐ)
    PASS  phân loại «bí danh KHÔNG phải never» → 0 khớp (đúng: 0)
    PASS  phân loại «bí danh NHẬP TỪ TỆP KHÁC» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)
    PASS  số dòng sau khối chú thích nhiều dòng → 5 (đúng: 5)
    PASS  src/components/MapView.test.tsx: không «as never» ở vị trí giá trị (0 chỗ); 0 chỗ ở vị trí đối số
    PASS  mcp-server/src/recipes.test.ts: không «as never» ở vị trí giá trị (0 chỗ); 7 chỗ ở vị trí đối số — hợp lệ, không tính

    OK — 0 khẳng định đỏ
    (con số 7 mà `expected:` đòi được báo RIÊNG, không gộp vào số vi phạm — và vòng chấm
     xác nhận cả 7 nằm ở `recipes.test.ts`, còn `MapView.test.tsx` không có chỗ nào.)
    (LỖI VÒNG 4 ĐÃ ĐÓNG, và đóng theo LỚP. Vòng chấm tự tiêm vào `recipes.test.ts` THẬT
     rồi hoàn nguyên, mười ba hình dạng bí danh: một tầng `type N = never`; dây chuyền ba
     tầng `A→B→C`; nhập từ tệp THẬT trong kho; nhập qua thư mục index; nhập qua đuôi
     `.js` trỏ tệp `.ts`; nhập từ một gói CÀI trong node_modules; `never[number]`;
     `(never)` bọc ngoặc; `Id<never>` qua generic; kiểu điều kiện
     `string extends string ? never : string`; giao `string & number`; `as unknown as never`;
     `as any as never`; và một tên trong namespace. TẤT CẢ đều bị bắt, đúng vị trí GIÁ TRỊ,
     đúng số dòng. Đối chứng âm `type NeverMind = string` KHÔNG bị bắt. Sau mỗi ca tệp
     được hoàn nguyên từ bản sao lưu và `git status --porcelain` sạch.)

### E9 — AC-5c

- eval: E9
- run_id: typecheck-mock-signature-e9-r5-20260827092404
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T09:24:04Z
- output: |
    PASS  hỏng-thì-đóng «chú thích không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
    PASS  hỏng-thì-đóng «template literal không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
    PASS  đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)
    PASS  src/components/MapView.test.tsx: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
    PASS  mcp-server/src/recipes.test.ts: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"

    OK — 0 khẳng định đỏ
    (đủ ba thứ `expected:` đòi: hai ca NUỐT có cast-nhìn-thấy 0 nhưng chẩn đoán cú pháp
     > 0 nên bộ quét đỏ thay vì báo sạch; đối chứng âm cho 0 lỗi trên tệp sạch; và dòng
     "phân tích cú pháp sạch (0 lỗi)" có mặt cho TỪNG tệp đích thật, đứng TRƯỚC mọi kết
     luận "sạch" trong cùng lượt chạy.)
    (giới hạn của chốt này: nó canh chế độ hỏng CÚ PHÁP. Lối vòng vòng 5 tìm được không
     phải hỏng cú pháp mà là hỏng PHÂN GIẢI KIỂU — cây nguyên vẹn, 0 chẩn đoán, mà bộ
     kiểm kiểu vẫn không biết bí danh trỏ về đâu. AC-5c không với tới lớp ấy; xem Known
     limits.)

## Known limits

- **Lối vòng BÍ DANH của vòng 4 đã ĐÓNG — theo LỚP, không theo mẫu.** Đây là câu
  hỏi trung tâm của vòng này và câu trả lời có số đo: mười ba hình dạng bí danh
  liệt kê ở E8 đều bị bắt khi tiêm vào tệp THẬT. Không phải "đóng cho các hình
  dạng đã lấy mẫu": mọi bí danh mà bộ kiểm kiểu GIẢI ĐƯỢC đều quy về cùng một
  câu hỏi `TypeFlags.Never`, nên lớp đóng theo cơ chế chứ không theo danh sách.
  Ranh giới của lớp ấy là điều kiện "giải được" — và đó đúng là giới hạn tiếp theo.
- **HỎNG-THÌ-MỞ Ở TẦNG PHÂN GIẢI KIỂU — MỚI, và là lối vòng đáng kể nhất còn
  lại.** `makeProgram` dựng một `ts.Program` chỉ có MỘT tệp gốc và một bộ tuỳ
  chọn viết tay; nó KHÔNG đọc `tsconfig.json` của kho. Hệ quả: một bí danh
  `never` tới được lượt biên dịch THẬT qua kênh nào khác ngoài đồ thị import của
  chính tệp ấy thì `getTypeFromTypeNode` trả về kiểu-LỖI, không phải `never`, và
  bộ quét đếm 0 chỗ rồi báo sạch. Ba ca đo được:
  (1) `import type { N } from './khong-ton-tai'` — bộ quét sạch, nhưng `tsc`
  thật đỏ nên E1 đứng chắn;
  (2) **khai toàn cục trong một `.d.ts`** — `declare type NG5 = never;` trong
  `mcp-server/src/__globals_probe.d.ts` (tsconfig của mcp-server có
  `include: ["src"]` nên `tsc` NẠP nó), cộng một dòng
  `const _v: number = {} as NG5;` trong `recipes.test.ts`. Vòng chấm cho ca này
  chạy qua CẢ E1/E2, E3/E4, E5/E8/E9 và E7: mọi khẳng định xanh, không lưới nào
  bắt. Đây là một phép giặt kiểu ở VỊ TRÍ GIÁ TRỊ đi lọt trọn vẹn cổng;
  (3) **ánh xạ `paths`** — thêm `"paths": { "@probe/*": ["./src/*"] }` vào
  `mcp-server/tsconfig.json` rồi nhập bí danh qua `@probe/...`: `tsc` xanh, bộ
  quét sạch. Cây mã và tsconfig đã hoàn nguyên sau mỗi ca; `git status
  --porcelain` sạch.
  Chữa được và rẻ, nếu người ký muốn vòng sau làm: hoặc dựng program TỪ tsconfig
  của project (`ts.parseJsonConfigFileContent`), hoặc — rẻ hơn — đỏ LỚN TIẾNG khi
  `getTypeFromTypeNode` trả về kiểu-lỗi, theo đúng luật "không đo được ≠ sạch"
  mà AC-5c đã khai cho tầng cú pháp. Hôm nay lớp này là LATENT chứ chưa bị dùng:
  kho không có tệp `.d.ts` nào dưới `src/` hay `mcp-server/src/`, và không
  tsconfig nào có `paths`.
- **Dương tính giả ở đối số bọc ngoặc — CÒN NGUYÊN.** Đo lại vòng này:
  `f((x as never))` vẫn xếp vào VỊ TRÍ GIÁ TRỊ, dù về ý định hợp đồng nó y hệt
  `f(x as never)`. Luật "con TRỰC TIẾP của `arguments`" gạt `ParenthesizedExpression`.
- **Ba họ hàng cùng luật, hai trong đó MỚI đo vòng này.** `` tag`v=${x as never}` ``
  → GIÁ TRỊ (còn nguyên); `f(...[x as never] as [never])` → GIÁ TRỊ (mới);
  `f(c ? (x as never) : (x as never))` → GIÁ TRỊ, hai chỗ (mới). Cả ba ngã về
  phía CHẶT nên không mở lỗ nào, nhưng chúng là những hình dạng mà một lượt sau
  hoàn toàn có thể viết một cách vô tội và bị cổng đỏ oan.
- **Giao rút về `never` cũng bị tính là ép về never.** `type X = string & number;`
  → bộ kiểm kiểu báo Never → bị bắt ở vị trí giá trị. Vòng chấm cho rằng ĐÚNG
  theo chủ đích hợp đồng (dạng ấy giặt kiểu y hệt `as never`), nhưng nó mở rộng
  luật ra ngoài mặt chữ "as never" mà AC-5b viết, nên nói ra để người ký biết.
- **`@ts-nocheck` nằm ngoài danh sách mẫu — CÒN NGUYÊN, và lưới thứ hai vẫn đỡ.**
  Đo lại vòng này bằng cách tiêm `// @ts-nocheck` lên đầu `recipes.test.ts` THẬT:
  bộ quét (E5/E8/E9) xanh nguyên và `typecheck-both` cũng xanh nguyên, nhưng
  `type-probe.ts` bắt được — cả hai mũi TS2322 và TS2339 im lặng nên E3/E4 đỏ.
  Lưới hai lớp đứng vững; ghi lại vì đó là một phụ thuộc GIỮA các eval mà không
  eval nào khai ra. Lưu ý tương phản: lối vòng `.d.ts` ở trên KHÔNG bị lưới này
  đỡ, vì nó không tắt kiểm kiểu chỗ nào cả.
- **E4 chứng minh ít hơn lời nó nói — CÒN NGUYÊN.** `expected:` của E4 khai rằng
  mũi TS2322 "chứng minh union hẹp `'vector' | 'satellite'`, không phải `string`".
  Nó không chứng minh được: gán một `string` vào `number` cũng cho TS2322. Hai mũi
  ấy phân biệt được "kiểu thật" với "`any`/`unknown`" — đó là giá trị thật của E4.
  Vòng này tự kiểm bằng cách đọc thẳng kiểu sản phẩm: `mcp-server/src/recipes.ts:595`
  khai `basemap?: 'vector' | 'satellite'`. Kết luận đúng, nhưng đúng nhờ phép đo
  của vòng chấm chứ không nhờ phép đo của E4.
- **E7 mù với ca bỏ qua — CÒN NGUYÊN.** Script chỉ đòi `numFailedTests === 0` và
  "mỗi tệp đích có ca đạt > 0". Lượt này 17/646 ca toàn kho ở trạng thái bỏ qua và
  không dòng nào của E7 nhắc tới chúng. Hai tệp đích sạch ca bỏ qua (2 và 40 ca
  đạt) nên AC-7 vẫn đứng — nhưng một lượt sau tắt cả một tệp KHÁC đi thì E7 vẫn
  xanh y nguyên.
- **`typecheck-both.ts` không phân biệt "trình biên dịch chạy sạch" với "trình
  biên dịch không hề chạy" — CÒN NGUYÊN.** Nó kết luận từ mã thoát 0 cộng 0 dòng
  `error TS`; một `npx` giải nhầm sang gói khác cũng cho đúng hình dạng ấy.
  `--force` đóng nửa `tsbuildinfo` của lỗ này, không đóng nửa còn lại. Vòng này
  lấp bằng tay: `npx which tsc` trỏ `/Users/manhphan/dev/mapposter/node_modules/.bin/tsc`
  và `npx tsc --version` in Version 6.0.3. Không khẳng định nào TRONG script làm việc đó.
- **Mốc GHIM: đúng hướng, nhưng đổi hình dạng rủi ro chứ không xoá nó.** Vòng
  chấm tán thành việc ghim — AC-5 hỏi một câu về một sự kiện lịch sử cố định, nên
  mốc của nó phải cố định, và số đo cho thấy mốc `merge-base` hôm nay đã về 0/0.
  Hai hệ quả phải nói ra. Một: ghim ở tổ tiên làm tập "dòng THÊM" LỚN DẦN theo
  thời gian — mọi thay đổi tương lai ở hai tệp này cũng là "dòng thêm so với
  `54b5cb2`", nên E5 KHÔNG mất khả năng canh tương lai; nó canh nhiều hơn, và giá
  phải trả là một lượt sau chạm vào một trong bốn dòng `as any` / `as unknown as`
  CÓ SẴN sẽ biến dòng ấy thành "dòng thêm" và làm E5 đỏ vì một sự thật có trước
  hồ sơ này. Hai: SHA nằm cứng trong mã, nên một lần viết lại lịch sử (squash-merge
  hay force-push) làm nó không giải được — script sẽ ngã LỚN TIẾNG, đúng luật, và
  eval thành không chạy được cho tới khi có người ghim lại.
- **Chốt AC-5c là một bộ kiểm cú pháp THỨ HAI, yếu hơn `tsc`.** Mức chặt ấy đúng
  ("không đo được ≠ sạch") và giá gần bằng không, vì mọi tệp làm chốt này đỏ cũng
  làm E1 đỏ. Ghi lại để người ký biết một lần đỏ ở E9 sẽ không bao giờ là tín hiệu
  DUY NHẤT.
- **Chữ `expected:` của E5 đã LỆCH khỏi hợp đồng — MỚI.** E5 vẫn viết "git diff so
  với gốc chung origin/main", trong khi AC-5 nay đòi mốc GHIM và chính script đã
  ghim. Mọi đòi hỏi CÓ NỘI DUNG của E5 (0 khớp trên dòng thêm, ba chốt tự-canh,
  ngã khi không giải được mốc) đều đạt, nên vòng chấm chấm PASS; nhưng `evals.yaml`
  đang mô tả một phép đo khác với phép đo đang chạy, và người sửa tiếp theo sẽ đọc
  nhầm.
- **Chữ `expected:` của E8 mô tả những fixture không tồn tại dưới hình dạng ấy —
  MỚI.** E8 đòi "fixture nguy hiểm 2 dòng bắt đủ 2" và "fixture 7-chỗ-đối-số bắt 0".
  Script không có hai fixture ấy: nó chạy 14 ca một-dòng riêng lẻ (gồm đúng ca hồi
  quy mà E8 nêu tên) rồi đo con số 7 trên TỆP THẬT. Nội dung mạnh hơn chữ, nhưng
  chữ và việc không khớp nhau.

## Ngoài hợp đồng

- **Bước Typecheck của CI không dùng `&&` — hợp đồng mô tả sai mặt chữ.**
  `.github/workflows/ci.yml` là một khối `run: |` hai dòng (`npx tsc -b` rồi
  `npx tsc -p mcp-server/tsconfig.json`), không có `&&` nào. HỆ QUẢ thì vẫn đúng
  như AC-2 nói — GitHub Actions chạy khối ấy bằng `bash -e` nên lệnh đầu ngã là
  bước dừng — nhưng câu "nối bằng `&&`" trong AC-2 không khớp tệp thật. Không eval
  nào đổi verdict vì điều này: E2 đo phép ĐO có chấm hai project độc lập hay không,
  và nó chấm.
- **CI chạy `npx tsc -b` KHÔNG kèm `--force`.** Chính AC-1 lập luận rằng thiếu
  `--force` thì `tsbuildinfo` có thể cho một lời "xanh" rỗng nội dung. Phép đo của
  cổng này có `--force`; bước CI thật thì không. `ci.yml` nằm ở **Out of scope**
  nên đây không phải eval đỏ, nhưng nó là chênh lệch giữa thứ cổng chứng minh và
  thứ CI sẽ thấy.
- `npx tsc --version` in Version 6.0.3 — bản TypeScript của kho đã sang dòng 6.
  Mọi kết luận về kiểu ở trên đang dựa vào nó.
- Kho hôm nay không có tệp `.d.ts` nào dưới `src/` hay `mcp-server/src/`, và không
  tsconfig nào khai `paths`. Đó là lý do lối vòng phân-giải-kiểu ở Known limits là
  một lớp LATENT chứ không phải một vi phạm đang sống trong cây mã.

## Analyst

Vòng này có một câu hỏi trung tâm và nó có câu trả lời sạch: lỗ bí danh ĐÓNG, và
đóng theo lớp. Cách chữa đúng chỗ — hỏi bộ kiểm kiểu thay vì đọc mặt chữ nút kiểu
— nên mọi bí danh mà bộ kiểm kiểu giải được đều quy về cùng một cờ `TypeFlags.Never`.
Mười ba hình dạng, kể cả những hình dạng không ai nghĩ tới lúc viết (`never[number]`,
giao rút về rỗng, kiểu điều kiện, gói cài trong node_modules), đều rơi đúng ô. Đối
chứng âm không bị bắt. Đó là bằng chứng của một lớp, không phải của một mẫu.

Nhưng hồ sơ này có một hình thái lặp lại đến mức nên gọi tên: mỗi tầng thước đo
chữa đúng lỗi của tầng trước rồi để lộ một lớp mà nó không có giác quan để thấy.
Mặt chữ → cây cú pháp → chẩn đoán cú pháp → kiểm kiểu. Vòng này tìm ra tầng thứ
NĂM, và nó không nằm trong logic phân loại mà nằm trong CÁCH DỰNG chương trình:
bộ kiểm kiểu chỉ biết thứ nó đọc được, còn `makeProgram` chỉ đọc một tệp gốc và
không hề nhìn `tsconfig.json`. Bí danh khai toàn cục trong một `.d.ts` là ví dụ
rẻ nhất, và vòng chấm đã cho nó đi qua trọn cổng với mọi khẳng định xanh.

Điều đáng chú ý về mặt cấu trúc: AC-5c đã viết ra ĐÚNG luật cần dùng ở đây —
"không đo được ≠ sạch" — nhưng chỉ áp cho tầng cú pháp. `parseErrorCount` hỏi "tệp
này có đọc được không" và trả lời đúng; không ai hỏi "bộ kiểm kiểu có GIẢI ĐƯỢC
cái tên này không". Kiểu-lỗi của TypeScript mang cờ `Any`, nên trong lưới hiện tại
nó trông y hệt một kiểu vô hại. Đó là cùng một lớp lỗi mà cả hồ sơ tồn tại để chặn,
lần thứ hai nằm trong chính cái thước.

Về mốc ghim: vòng chấm tán thành. Câu AC-5 hỏi là câu về một sự kiện đã xảy ra,
nên mốc phải cố định, và số đo cho thấy mốc động đã mất đối tượng — 0 dòng thêm so
với merge-base hôm nay. Ngược với trực giác "ghim thì thôi canh tương lai", ghim ở
tổ tiên làm lưới RỘNG ra theo thời gian; cái giá là lưới sẽ dần trùm lên những
thay đổi không thuộc lượt này, và một ngày nào đó E5 sẽ đỏ vì một dòng `as any` có
từ trước bị một lượt khác chạm vào. Khi ngày ấy tới, câu trả lời đúng là ghim lại
mốc cho hồ sơ MỚI, không phải nới mẫu.

## Variance

- Năm lượt chạy lệnh rời cho chín eval, đúng như đề bài mô tả: E1/E2 chung một
  lượt `typecheck-both.ts`; E3/E4 chung một lượt `type-probe.ts`; E5/E8/E9 chung
  một lượt `silencer-scan.ts`; E6 và E7 mỗi cái một lượt. Mỗi eval được chấm theo
  chữ `expected:` của CHÍNH NÓ, không suy từ mã thoát chung.
- Không lệnh nào bị công cụ giết: mọi lượt chạy đều in trọn dòng tổng kết cuối
  của chính nó ("OK — 0 khẳng định đỏ" hoặc "OK — 0/2 project đỏ"), và mọi mã thoát
  báo cáo ở trên là mã thoát THẬT của lệnh, thu bằng `echo $?` ngay sau lượt chạy.
- Mọi phép tiêm tấn công (khoảng hai mươi ca) đều làm trên tệp THẬT
  `mcp-server/src/recipes.test.ts`, hoàn nguyên từ bản sao lưu ngoài kho sau từng
  ca. Hai tệp phụ trợ dựng tạm (`__globals_probe.d.ts`, `__paths_alias_probe.ts`,
  một thư mục index, một gói trong node_modules) đều đã xoá, và một lần sửa
  `mcp-server/tsconfig.json` đã hoàn nguyên từ bản sao lưu. `git status --porcelain`
  sau cùng chỉ còn `run-log.jsonl` — chính tệp mà đề bài yêu cầu ghi thêm.
- Số nền của E1/E2 đo bằng một worktree tách rời ở `54b5cb2` đặt DƯỚI
  `/Users/manhphan/dev/mapposter/`, vì ngoài thư mục ấy `npx` giải sang một `tsc`
  khác. Worktree đã gỡ. Không dùng `git stash` ở bất kỳ bước nào.
- Bảy eval mang số nền `n-a` vì script đo chúng chưa tồn tại ở `54b5cb2`; vòng
  chấm không dựng số giả cho những ô ấy.
- Dòng run-log của E6 được ghi cùng nhịp với lượt chạy chứ không phải sau khi nó
  kết thúc; các dòng còn lại ghi sau. Mọi dòng đều mang mốc thời gian thật của
  phiên chấm này.

## Iterations

- Vòng 1 — bộ quét bịt miệng đoán vị trí đối số bằng «có `)` ngay sau không»; qua
  được lượt chấm đầu vì không ai đâm vào chỗ đoán.
- Vòng 2 — bốn lỗ mặt chữ bị đâm thủng (ngoặc nhóm, đối số không đứng cuối,
  `<never>x`, số dòng lệch); bản vá lần-ngược-đếm-ngoặc thủng thêm ba lỗ nữa.
- Vòng 3 — chuyển sang hỏi CÂY CÚ PHÁP, đúng hết về cấu trúc, nhưng dời chế độ
  hỏng sang «đọc trống»; sinh ra AC-5c và E9 để chặn ca nuốt.
- Vòng 4 — tìm ra lối vòng BÍ DANH KIỂU: cây nguyên vẹn, 0 chẩn đoán, `tsc` xanh,
  mà `as N` với `type N = never` đi lọt; ký với known-limit ấy còn mở.
- Vòng 5 — lỗ bí danh ĐÓNG theo lớp bằng bộ kiểm kiểu, mốc so chuyển sang GHIM và
  chạy lại được sau merge; 9/9 đạt trên thước mới. Lớp lộ ra ở tầng kế tiếp: bộ
  kiểm kiểu không đọc `tsconfig`, nên bí danh khai toàn cục trong `.d.ts` hay đi
  qua `paths` vẫn giặt được kiểu ở vị trí giá trị mà trọn cổng vẫn xanh.
