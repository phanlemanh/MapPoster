---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Mười eval máy, năm lượt chạy lệnh rời, 10/10 đạt theo đúng chữ `expected:` của
  từng eval. Thước đo đổi giữa vòng 5 và vòng này (program dựng từ `tsconfig`
  THẬT + chốt tên-không-giải-được bằng chẩn đoán ngữ nghĩa), nên mọi số của vòng
  5 hết hiệu lực và vòng này đo lại từ đầu, không kế thừa dòng nào. Câu hỏi
  trung tâm có câu trả lời sạch: lối vòng của vòng 5 — `declare type NG5 = never`
  trong một `.d.ts` dưới `mcp-server/src/` cộng `{} as NG5` trong tệp test — nay
  bị BẮT đúng dòng 391 trong khi `tsc` thật vẫn xanh, tức bộ quét là thứ duy
  nhất bắt được, đúng như AC-5d thiết kế. Vòng chấm đâm thêm sáu kênh môi trường
  khác (`.d.ts` trong `src/` của project web, `declare global` trong một `.ts`,
  tham chiếu ba-gạch tới tệp ngoài `include`, `export * from`, `typeof` một
  hằng `never`, kiểu điều kiện, và giao `string & number` rút về rỗng nơi chữ
  `never` không hề xuất hiện) — TẤT CẢ đều bị bắt đúng dòng. Không tìm ra chỗ
  nào program của bộ quét và program của `tsc` thật bất đồng về một cái tên.
  Nhưng vòng này tìm ra một lớp KHÁC, không nằm ở phạm vi biên dịch mà nằm ở
  chính LUẬT VỊ TRÍ: ô miễn trừ "đối số" bị lợi dụng được — `__id({} as never)`
  với `__id<T>(v: T): T` trả về `never` và rót thẳng vào một ô `number`, `tsc`
  xanh và bộ quét xanh, dấu vết duy nhất là con số vị-trí-đối-số nhích 7 → 8.
  Kèm hai dạng giặt kiểu KHÔNG dùng phép ép nào (hàm khẳng định
  `asserts x is never`; hàm generic `<T>(x: unknown): T`). Cả ba nằm ngoài mặt
  chữ AC-5b nên không eval nào đỏ, nhưng chúng đúng là thứ AC-5b tồn tại để
  chặn. Ghi ở Known limits; có known-limit nên cần người ký.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 59f472fef65f34c3384c48eb304e524c25f9edcf
human_signoff:
---

# Evidence Report: typecheck-mock-signature (vòng 6)

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
| E10 | AC-5d | script | PASS |

## Evidence

### E1 — AC-1

- eval: E1
- run_id: typecheck-mock-signature-e1-r6-20260827100156
- exit_code: 0
- baseline: red
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T10:01:56Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (đọc theo AC-1: HAI lệnh RỜI, mỗi lệnh có mã thoát riêng và 0 dòng `error TS`;
     `--force` có mặt đúng như AC-1 đòi, nên không lượt nào đọc `tsbuildinfo` để
     báo một lời "xanh" rỗng nội dung)
    (số nền `red` là phép đo THẬT của vòng NÀY, không chép của vòng trước: một
     worktree tách rời ở `54b5cb2` đặt DƯỚI /Users/manhphan/dev/mapposter/ để `npx`
     giải đúng `tsc` của kho — `npx tsc --version` in Version 6.0.3, cùng bản với
     cây đang chấm — rồi chạy CHÍNH HAI lệnh AC-1 mô tả, không cấy script nào vào
     cây cũ. Cả hai vế đều đỏ: bốn dòng `error TS` ở vế web, hai dòng TS2352 ở
     `recipes.test.ts` dòng 328 và 356 — đúng 6 lỗi mà hợp đồng mô tả. Worktree đã
     gỡ ngay sau đó bằng `git worktree remove`; `git worktree list` chỉ còn ba mục
     có sẵn. Không dùng `git stash` ở bất kỳ bước nào.)

### E2 — AC-2

- eval: E2
- run_id: typecheck-mock-signature-e2-r6-20260827100156
- exit_code: 0
- baseline: red
- verifier: config:executors.script.typecheck_both
- verified_at: 2026-08-27T10:01:56Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (đọc theo AC-2: cùng lượt chạy E1, đọc theo chiều "có project nào VẮNG MẶT
     không". Hai dòng kết quả RIÊNG, mỗi dòng nêu đích danh lệnh của nó, nên không
     vế nào có thể vắng mặt mà vẫn trông như sạch. `typecheck-both.ts` bắt từng
     lệnh bằng `execFileSync` riêng và thu `status` của từng cái, không nối `&&`.
     Số nền đo được ở `54b5cb2` cho thấy chính xác vì sao điều này quan trọng: vế
     mcp-server ở đó có 2 dòng lỗi RIÊNG mà một bước nối `&&` sẽ không bao giờ
     chạy tới.)

### E3 — AC-3

- eval: E3
- run_id: typecheck-mock-signature-e3-r6-20260827100203
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T10:02:03Z
- output: |
    === AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx
    (đối chứng bản-chép-sạch chạy TRƯỚC hai mũi, đúng thứ tự `expected:` đòi, nên
     không mũi nào được đọc trên một nền đã đỏ sẵn. Vòng chấm kiểm độc lập bằng
     `git status --porcelain` sau lượt chạy: không còn tệp thăm dò nào.)
    (số nền `n-a` vì `type-probe.ts` chưa tồn tại ở `54b5cb2` — chạy nó trong
     worktree nền chỉ ra lỗi không tìm thấy mô-đun. Vòng chấm không dựng số giả.)

### E4 — AC-4

- eval: E4
- run_id: typecheck-mock-signature-e4-r6-20260827100203
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_type_probe
- verified_at: 2026-08-27T10:02:03Z
- output: |
    === AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts

    OK — 0 khẳng định đỏ
    (mũi TS2339 là mũi có sức nặng thật: nó chỉ đỏ được khi kiểu trả về là
     `CompiledRecipeCall` chứ không phải `any`/`unknown`. Mũi TS2322 thì yếu hơn
     chữ `expected:` của nó — xem Known limits.)

### E5 — AC-5

- eval: E5
- run_id: typecheck-mock-signature-e5-r6-20260827100214
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T10:02:14Z
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
    (ba chốt tự-canh mà AC-5 đòi đều có mặt và đều đạt: fixture bẩn bắt đủ 4,
     fixture sạch bắt 0, và số dòng THÊM > 0 cho CẢ HAI tệp trước khi bất kỳ kết
     luận "sạch" nào được đọc. Mốc so là commit GHIM `54b5cb2` như AC-5 đòi —
     vòng chấm kiểm lại: nó giải được thật và cho 10 + 2 dòng thêm, tức phép đo
     vẫn có đối tượng sau khi PR merge.)

### E6 — AC-6

- eval: E6
- run_id: typecheck-mock-signature-e6-r6-20260827100228
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_mutation_probe
- verified_at: 2026-08-27T10:02:28Z
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
    (đối chứng nền chạy TRƯỚC mọi mũi; không mũi nào rơi vào nhánh "neo phá không
     đặt được", nghĩa là cả ba neo khớp đúng một lần. Vòng chấm chạy
     `git status --porcelain` độc lập ngay sau lượt này và cây mã sản phẩm sạch thật.)

### E7 — AC-7

- eval: E7
- run_id: typecheck-mock-signature-e7-r6-20260827100236
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_no_regression
- verified_at: 2026-08-27T10:02:36Z
- output: |
    PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
    PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-8jKq2M/vitest.json
    PASS  0 ca đỏ (629 đạt / 646 tổng)
    PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
    PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)

    OK — 0 khẳng định đỏ
    (chứng minh bằng SỐ rằng hai tệp đích thật sự chạy lại, đúng như AC-7 đòi —
     không suy từ mã thoát của cả bộ. Chênh 646 − 629 = 17 ca không-đạt-không-đỏ
     là ca bỏ qua; xem Known limits.)

### E8 — AC-5b

- eval: E8
- run_id: typecheck-mock-signature-e8-r6-20260827100214
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T10:02:14Z
- output: |
    PASS  phân loại «ca hồi quy type-probe» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «ngoặc NHÓM, không phải lời gọi (lỗ #1 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «cú pháp ép kiểu kia (lỗ #3 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «đối số KHÔNG đứng cuối (lỗ #2 vòng 2)» → ĐỐI SỐ (đúng: ĐỐI SỐ)
    PASS  phân loại «bí danh một tầng (lối vòng vòng 4)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «bí danh DÂY CHUYỀN» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «bí danh NHẬP TỪ TỆP KHÁC» → GIÁ TRỊ (đúng: GIÁ TRỊ)
    PASS  phân loại «bí danh KHÔNG phải never — phải không có khớp nào» → 0 khớp (đúng: 0)
    PASS  đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)
    PASS  số dòng sau khối chú thích nhiều dòng → 5 (đúng: 5)
    PASS  src/components/MapView.test.tsx: không «as never» ở vị trí giá trị (0 chỗ); 0 chỗ ở vị trí đối số — hợp lệ, không tính
    PASS  mcp-server/src/recipes.test.ts: không «as never» ở vị trí giá trị (0 chỗ); 7 chỗ ở vị trí đối số — hợp lệ, không tính

    OK — 0 khẳng định đỏ
    (mười lăm ca tự-canh, mỗi ca chấm RIÊNG: mười ca vị-trí-giá-trị phải cho đúng
     một khớp mỗi ca — trong đó có ca hồi quy thật, chính dòng đã làm mũi TS2322
     của `type-probe.ts` không bao giờ đỏ được — bốn ca vị-trí-đối-số phải cho 0 vi
     phạm, và một bí danh KHÔNG-phải-never phải cho 0 khớp. Con số 7 của vị trí đối
     số được in RIÊNG cho từng tệp, không gộp vào số vi phạm, đúng như `expected:`
     đòi. Mặt chữ `expected:` mô tả hình dạng fixture khác với thứ đang chạy — xem
     Known limits; tính chất mà nó đòi được chứng minh ở mức mạnh hơn.)

### E9 — AC-5c

- eval: E9
- run_id: typecheck-mock-signature-e9-r6-20260827100214
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T10:02:14Z
- output: |
    PASS  hỏng-thì-đóng «chú thích không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
    PASS  hỏng-thì-đóng «template literal không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
    PASS  đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)
    PASS  src/components/MapView.test.tsx: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
    PASS  mcp-server/src/recipes.test.ts: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"

    OK — 0 khẳng định đỏ
    (hai ca NUỐT được bắt đúng như `expected:` mô tả: số cast nhìn thấy được là 0
     vì cast đã bị nuốt, NHƯNG số lỗi cú pháp > 0 nên bộ quét đỏ thay vì báo "sạch".
     Dòng "phân tích cú pháp sạch (0 lỗi)" có mặt cho TỪNG tệp đích, và trong mã
     nguồn nó đứng TRƯỚC nhánh `continue` — vòng chấm đọc lại `silencer-scan.ts` và
     xác nhận: `perr > 0` thì tệp bị bỏ qua chứ không bao giờ được kết luận "sạch".)

### E10 — AC-5d

- eval: E10
- run_id: typecheck-mock-signature-e10-r6-20260827100214
- exit_code: 0
- baseline: n-a
- verifier: config:executors.script.mock_silencer_scan
- verified_at: 2026-08-27T10:02:14Z
- output: |
    PASS  hỏng-thì-đóng tầng kiểm kiểu: tên không giải được → 0 khớp never NHƯNG 1 tên không giải được (phải là 1)
    PASS  đối chứng âm: tên giải được → 0 tên không giải được (phải là 0)
    PASS  src/components/MapView.test.tsx: mọi tên kiểu trong phép ép đều giải được (0 không giải được) — không giải được thì KHÔNG kết luận "sạch"
    PASS  mcp-server/src/recipes.test.ts: mọi tên kiểu trong phép ép đều giải được (0 không giải được) — không giải được thì KHÔNG kết luận "sạch"

    OK — 0 khẳng định đỏ
    (HAI chốt mà `expected:` đòi đều có mặt. Chốt (1): dòng "mọi tên kiểu trong phép
     ép đều giải được" in cho TỪNG tệp đích, và vòng chấm kiểm nguồn để chắc con số
     ấy đến từ `analyzeRealFile`, tức từ `parseJsonConfigFileContent` của
     `mcp-server/tsconfig.json` và `tsconfig.app.json` chứ không phải tuỳ chọn viết
     tay. Chốt (2): tên bịa ra cho 0 khớp never NHƯNG 1 tên không giải được, và bí
     danh giải được cho 0 — hai chiều đủ.)

    Ba phép đo ĐỘC LẬP của vòng chấm, ngoài chữ của script:
    (a) Dựng lại NGUYÊN VẸN lối vòng của vòng 5 — `declare type NG5 = never;` trong
        `mcp-server/src/ng5.d.ts` cộng `const _v: number = {} as NG5;` cuối
        `recipes.test.ts`. `npx tsc -p mcp-server/tsconfig.json` vẫn XANH, còn bộ
        quét ĐỎ và chỉ đúng `mcp-server/src/recipes.test.ts:391`. Đây là điểm mấu
        chốt: E1 KHÔNG đỡ hộ, bộ quét là thứ duy nhất bắt được — đúng như AC-5d
        thiết kế. Tệp `.d.ts` đã xoá và tệp test hoàn nguyên từ bản sao lưu ngoài kho.
    (b) Sáu kênh môi trường khác, mỗi kênh dựng và gỡ riêng, `tsc` XANH ở cả sáu và
        bộ quét ĐỎ đúng dòng ở cả sáu: `.d.ts` toàn cục trong `src/` của project
        WEB (cấu hình khác mcp-server) rồi ép trong `MapView.test.tsx`;
        `declare global { type … = never }` trong một `.ts` mô-đun;
        `/// <reference path>` trỏ ra tệp NGOÀI `include`; bí danh đi qua
        `export * from` hai tầng; `typeof` một hằng khai `never`; và bí danh generic
        có kiểu điều kiện. Thêm một ca không có chữ `never` nào trong nguồn — ép về
        `(string & number)`, giao rút về rỗng — cũng bị bắt.
    (c) Chốt tên-không-giải-được sống thật trên CẢ HAI đường project: một tên bịa
        trong phép ép ở `recipes.test.ts` và một tên bịa trong phép ép ở
        `MapView.test.tsx` đều làm bộ quét đỏ kèm đúng số dòng và đúng tên. Ngược
        lại, một tên bịa nằm NGOÀI phép ép (khai một hằng) KHÔNG làm chốt nổ — phạm
        vi thu hẹp về đúng nút kiểu của phép ép hoạt động như mô tả.

## Known limits

- **Ô miễn trừ "vị trí đối số" của AC-5b bị lợi dụng được, và đây là phát hiện
  nặng nhất của vòng này.** Luật hiện tại hỏi CẤU TRÚC ("cast này có phải một đối
  số của lời gọi không") rồi suy ra Ý ĐỊNH ("vậy nó thoả một tham số khai `never`
  có chủ đích"). Bước suy ấy không đúng. Đo được, trên tệp đích thật:
  `declare function __id<T>(v: T): T;` rồi `const _w: number = __id({} as never);`
  — `T` suy ra `never`, giá trị trả về là `never`, rót thẳng vào một ô `number`.
  `npx tsc -p mcp-server/tsconfig.json` xanh; bộ quét xanh; cả mười eval sẽ xanh.
  Dấu vết duy nhất là con số vị-trí-đối-số của `recipes.test.ts` nhích từ 7 lên 8
  trong chính dòng bằng chứng E8 — một tripwire có thật nhưng chỉ đọc được bởi
  người đang so với số cũ. Nói cách khác: bộ quét bây giờ trả lời ĐÚNG câu "cái
  tên này có phải `never` không" ở mọi kênh, nhưng câu "chỗ này có phải giặt kiểu
  không" thì vẫn đang được trả lời bằng vị trí cú pháp. Cách chữa đúng tầng là hỏi
  tiếp bộ kiểm kiểu: tham số tương ứng có THẬT SỰ khai `never` không, chứ không
  phải "cast có nằm trong ngoặc của một lời gọi không".
- **Giặt kiểu bằng `never` mà KHÔNG dùng phép ép nào thì cả hai tầng đều không
  thấy.** Đo được: `declare function __an(x: unknown): asserts x is never;` rồi
  `__an(v); const _w: number = v;` — hàm khẳng định thu hẹp `v` về `never` và
  phép gán hợp lệ. Không có `AsExpression` nào để bộ quét nhìn, `tsc` xanh, bộ quét
  xanh. Cùng lớp: `declare function __ln<T>(x: unknown): T;` rồi
  `const _w: number = __ln(x);` — giặt được MỌI kiểu thành MỌI kiểu mà trong nguồn
  không hề có chữ `never` lẫn `any`. Cả hai nằm ngoài mặt chữ AC-5/AC-5b nên không
  eval nào đỏ, nhưng chúng đúng là "bịt miệng kín đáo" mà AC-5b tồn tại để chặn.
- **Bộ quét chỉ nhìn HAI tệp đích.** Một hàm giặt kiểu đặt ở bất kỳ tệp nào khác
  rồi gọi từ tệp test thì không có tầng nào chấm. Đây là phạm vi hợp đồng chọn có
  chủ đích, không phải khuyết tật của bản sửa — nhưng nó là lối vòng rẻ nhất còn lại.
- **Dương tính giả ở đối số ĐẶT TRONG NGOẶC, vẫn còn sống.** Đo được:
  `__takes(({} as never))` với `__takes(p: never)` là cách dùng hợp lệ, `tsc` xanh,
  nhưng bộ quét xếp nó vào VỊ TRÍ GIÁ TRỊ và đỏ. Nguyên nhân: `parent` của
  `AsExpression` là `ParenthesizedExpression` chứ không phải `CallExpression`, nên
  phép kiểm `parent.arguments?.some(...)` trượt. Cùng cơ chế với đối số trải
  (`f(...(x as never))`) và với thuộc tính JSX (`<C v={x as never} />` — đo được là
  bị xếp GIÁ TRỊ). Cả ba đều lệch về phía ĐỎ, tức fail-closed, nên chúng làm cổng
  khó chịu chứ không làm cổng mù. Ngược đời một chút: chính chỗ dương-tính-giả này
  là chỗ mà giới hạn đầu tiên ở trên khai thác — cùng một phép kiểm `parent`, một
  hướng cho đỏ oan, một hướng cho xanh oan.
- **`@ts-nocheck` không nằm trong danh sách mẫu của E5 — nhưng cổng vẫn bắt được,
  bằng eval khác.** Đo được: đặt `// @ts-nocheck` ở dòng đầu `recipes.test.ts` thì
  `tsc` xanh và bộ quét xanh, nhưng `type-probe.ts` (E3/E4) ĐỎ hai mũi, vì tệp thăm
  dò là bản chép nên nó thừa kế luôn chỉ thị và hai mũi mất khả năng đỏ. Ghi lại
  chính xác hơn cách vòng 5 ghi: lỗ nằm ở BỘ QUÉT chứ không ở cổng.
- **Mũi TS2322 của E4 chứng minh ít hơn chữ `expected:` của nó.** `expected:` nói
  mũi ấy "chứng minh union hẹp `'vector'|'satellite'`, không phải `string`". Nhưng
  gán `string` vào `number` cũng cho TS2322, nên mã lỗi ấy KHÔNG phân biệt được
  union hẹp với `string`. Thứ thật sự loại trừ `any`/`unknown` là mũi TS2339 (đọc
  field không tồn tại) — mũi ấy chắc chắn và nó đạt. Giới hạn này đã ghi ở vòng 5
  và vẫn nguyên vẹn: chữ trong `expected:` rộng hơn thứ mũi đo được.
- **E7 mù với ca BỎ QUA.** Số vòng này: 629 đạt / 646 tổng, tức 17 ca không đạt
  cũng không đỏ. `no-regression.ts` chỉ chốt `numFailedTests === 0` và, cho từng
  tệp đích, `passed > 0 && failed === 0`. Một ca trong chính hai tệp đích chuyển
  sang `it.skip` vẫn để cả hai chốt xanh miễn còn một ca khác đạt. AC-7 chỉ đòi
  "số ca đạt > 0" nên eval không đỏ, nhưng "> 0" là một sàn rất thấp cho một tệp
  có 2 ca (MapView) — mất một trong hai ca vẫn qua.
- **`typecheck-both.ts` không phân biệt được "chạy sạch" với "không hề chạy".** Nó
  đọc mã thoát và đếm dòng khớp `error TS`; một `tsc` bị thay bằng lệnh rỗng cho
  kết quả y hệt. Vòng này giảm nhẹ được phần nào: `type-probe.ts` gọi CÙNG một
  `npx tsc` và ĐÒI nó in TS2322/TS2339 tại đúng tệp thăm dò, nên một `tsc` giả sẽ
  làm E3/E4 đỏ. Nhưng bản thân E1/E2 thì vẫn không tự chứng minh được điều đó.
- **`PROJECT_OF` là một luật tiền tố viết cứng** (`mcp-server/` → tsconfig của
  mcp-server, còn lại → `tsconfig.app.json`). Thêm một tệp đích thứ ba thuộc
  project khác thì nó ánh xạ sai trong im lặng. Hệ quả không phải là mù: chốt
  tên-không-giải-được sẽ nổ to (đo được ở phép (c) của E10), nên chế độ hỏng là
  fail-closed. Vẫn nên ghi, vì nó là chỗ duy nhất còn lại nơi bộ quét và `tsc`
  thật có thể bất đồng về phạm vi.
- **Phạm vi thu hẹp của chốt tên-không-giải-được là ĐÚNG, và vòng chấm tán thành.**
  Đo được: một tên không giải được nằm NGOÀI phép ép (ví dụ trong khai báo một
  hằng) KHÔNG làm chốt nổ. Đó là chủ đích, và nó đúng vì hai lẽ: câu hỏi của phép
  đo là "bộ kiểm kiểu có giải được những cái tên mà KẾT LUẬN NÀY phụ thuộc vào
  không", còn mọi lỗi giải tên khác trong tệp đã bị E1 bắt sống — không tệp đích
  nào có thể mang một lỗi 2304 mà `tsc` vẫn xanh. Nới phạm vi ra cả tệp chỉ làm
  hai eval cùng đỏ vì một nguyên nhân, mà không thêm độ phủ nào.
- **Neo phá của E6 là chuỗi khớp chính xác kèm thụt đầu dòng.** Một lượt định dạng
  lại `MapView.tsx` làm neo khớp 0 lần; script khi đó báo "mũi không đặt được" và
  ĐỎ chứ không lặng lẽ bỏ qua — fail-closed đúng như `expected:` đòi. Nhưng nó
  nghĩa là E6 giòn với thay đổi thuần định dạng, và người sửa sẽ gặp một eval đỏ
  không phải vì assertion chết.
- **Mặt chữ `expected:` của E5 và E8 đã cũ so với thứ đang chạy.** E5 nói mốc so là
  "gốc chung origin/main" trong khi script dùng commit GHIM `54b5cb2` — chính điều
  AC-5 đòi, nên script đúng và `expected:` là chữ tồn dư. E8 nói "fixture nguy hiểm
  2 dòng phải bắt đủ 2" và "fixture 7-chỗ-đối-số phải bắt 0", nhưng script không có
  hai fixture ấy: nó chấm 15 ca RIÊNG LẺ (10 ca giá trị, 4 ca đối số, 1 đối chứng
  âm). Tính chất mà `expected:` đòi được chứng minh ở mức mạnh HƠN, nên vòng chấm
  cho đạt; nhưng ai đọc `expected:` rồi đối chiếu output sẽ không tìm thấy hai con
  số ấy. Nên sửa `evals.yaml` cho khớp thay vì để người sau nghi ngờ bằng chứng.
- **Giá phải trả về thời gian là nhỏ và đã đo.** Toàn bộ `silencer-scan.ts` — 24 ca
  tự-canh cộng HAI `ts.Program` dựng từ tsconfig thật — chạy hết 2,9 giây đồng hồ
  treo tường. Không có dấu hiệu `getSemanticDiagnostics` trả rỗng vì lý do nào đó:
  vòng chấm ép nó ra chẩn đoán thật trên CẢ HAI đường project (phép (c) của E10).

## Ngoài hợp đồng

- **Bước Typecheck của CI không dùng `&&` — hợp đồng mô tả sai mặt chữ.**
  `.github/workflows/ci.yml` dòng 21-24 là một khối `run: |` hai dòng (`npx tsc -b`
  rồi `npx tsc -p mcp-server/tsconfig.json`), không có `&&` nào. HỆ QUẢ thì vẫn
  đúng như AC-2 nói — GitHub Actions chạy khối ấy bằng `bash -e` nên lệnh đầu ngã
  là bước dừng — nhưng câu "nối bằng `&&`" trong AC-2 không khớp tệp thật. Không
  eval nào đổi verdict vì điều này.
- **CI chạy `npx tsc -b` KHÔNG kèm `--force`.** Chính AC-1 lập luận rằng thiếu
  `--force` thì `tsbuildinfo` có thể cho một lời "xanh" rỗng nội dung. Phép đo của
  cổng có `--force`; bước CI thật thì không. `ci.yml` nằm ở **Out of scope** nên
  đây không phải eval đỏ, nhưng nó là chênh lệch giữa thứ cổng chứng minh và thứ
  CI sẽ thấy.
- **`tsconfig.app.json` KHÔNG khai `strict`.** Nửa web của mọi bằng chứng kiểu ở
  trên (AC-3, và vế web của AC-1) được đo dưới tuỳ chọn không-strict, trong khi
  `mcp-server/tsconfig.json` có `"strict": true`. Điều này không làm eval nào sai —
  cả hai phép đo đều dùng đúng tsconfig của project mình, và `tsc` thật cũng vậy —
  nhưng nó nghĩa là hai nửa hồ sơ không được đo dưới cùng một độ chặt.
- `npx tsc --version` in Version 6.0.3 — bản TypeScript của kho đã sang dòng 6.
  Mọi kết luận về kiểu ở trên đang dựa vào nó, kể cả việc `string & number` rút về
  `never` và mang cờ `TypeFlags.Never`.
- Kho hôm nay không có tệp `.d.ts` nào dưới `src/` hay `mcp-server/src/`, và không
  tsconfig nào khai `paths`. Kênh môi trường vì thế là một lớp LATENT chứ không
  phải một vi phạm đang sống trong cây mã — nhưng nó là lớp mà vòng 5 đã đi trọn
  cổng, nên việc nó đóng được kiểm bằng bảy phép dựng-lại chứ không bằng lời.
- Số nền: `type-probe.ts`, `silencer-scan.ts`, `mutation-probe.ts` và
  `no-regression.ts` chưa tồn tại ở `54b5cb2`, nên tám eval mang `n-a`. Chạy chúng
  trong worktree nền chỉ ra lỗi không tìm thấy mô-đun, không phải một phép đo.

## Analyst

Câu hỏi trung tâm của vòng này có câu trả lời sạch, và nó là câu trả lời tốt: lớp
"program của bộ quét bất đồng với program của `tsc` thật" đã ĐÓNG. Vòng chấm không
tin lời script mà tự dựng lại bảy kênh khác nhau để cái tên `never` chui vào bản
biên dịch thật — `.d.ts` toàn cục ở cả hai project (mà cấu hình của chúng khác
nhau), `declare global` trong một mô-đun, tham chiếu ba-gạch ra ngoài `include`,
`export * from`, `typeof` một hằng, kiểu điều kiện, và cả một ca không có chữ
`never` nào trong nguồn. Bảy kênh, bảy lần `tsc` xanh, bảy lần bộ quét đỏ đúng
dòng. Cách chữa đúng tầng — dựng program từ `fileNames` + `options` của chính
tsconfig — nên nó không vá bảy lỗ, nó xoá đi điều kiện sinh ra lỗ: hai bên bây giờ
nhìn CÙNG một tập tệp, nên không còn chỗ để bất đồng. Chốt tên-không-giải-được là
lưới an toàn cho phần dư, và nó sống thật trên cả hai đường project.

Nhưng hình thái lặp lại của hồ sơ này lặp thêm một lần nữa, và lần này nó đổi TRỤC.
Bốn tầng trước — mặt chữ → cây cú pháp → chẩn đoán cú pháp → kiểm kiểu → phạm vi
biên dịch — đều là những tầng của cùng một câu hỏi: "cái tên này có phải `never`
không". Câu hỏi ấy giờ được trả lời đúng ở mọi kênh. Lớp còn mở nằm ở câu hỏi THỨ
HAI, câu mà không ai để ý là mình đang trả lời bằng phỏng đoán: "chỗ này có phải
giặt kiểu không". Câu ấy vẫn đang được trả lời bằng VỊ TRÍ CÚ PHÁP — cast nằm trong
ngoặc của một lời gọi thì tha. Và vị trí cú pháp không phải ý định: `__id({} as
never)` nằm đúng ô được tha mà vẫn rót `never` vào một biến `number`. Đáng chú ý
là cùng một phép kiểm `parent` ấy sai theo CẢ HAI hướng — nó đỏ oan với
`f((x as never))` và xanh oan với `__id({} as never)` — đúng dấu hiệu của một phép
phỏng đoán đứng nhầm tầng, y hệt dấu hiệu mà chính hợp đồng đã ghi lại ở vòng 2
khi bộ quét còn đếm ngoặc. Cách chữa đúng tầng đã có sẵn công cụ: hỏi bộ kiểm kiểu
tham số tương ứng khai gì, thay vì hỏi cây cú pháp cast nằm ở đâu.

Về hai dạng giặt kiểu không dùng phép ép (hàm khẳng định `asserts x is never`, và
hàm generic `<T>(x: unknown): T`): chúng nằm ngoài mặt chữ hợp đồng, và vòng chấm
KHÔNG cho chúng làm đỏ eval nào — nhưng cũng không giả vờ rằng chúng không tồn tại.
Chúng nói một điều về hình dạng của cả bộ đo: mọi tầng cho tới nay đều canh một
CÚ PHÁP cụ thể (`as X`, `<X>e`), trong khi thứ cần canh là một TÍNH CHẤT (một giá
trị được rót vào một ô mà nó không thuộc về). Chừng nào lưới còn dệt quanh cú pháp,
mỗi vòng chấm sẽ còn tìm ra một cú pháp mới. Điều đó không làm bản sửa của vòng này
kém giá trị: nó đóng đúng lớp mà nó nhận nhiệm vụ đóng, đóng theo lớp chứ không
theo mẫu, và đóng ở đúng tầng.

Một ghi nhận cuối, thuộc về độ tin cậy của chính bằng chứng: mọi phép tiêm tấn
công đều làm trên tệp THẬT rồi hoàn nguyên từ bản sao lưu ngoài kho, và
`git status --porcelain` sau cùng chỉ còn `run-log.jsonl` — chính tệp mà đề bài
yêu cầu ghi thêm. Không mũi nào để lại vết trong `src/` hay `mcp-server/`.

## Variance

- Năm lượt chạy lệnh rời cho mười eval, đúng như đề bài mô tả: E1/E2 chung một
  lượt `typecheck-both.ts`; E3/E4 chung một lượt `type-probe.ts`; E5/E8/E9/E10
  chung một lượt `silencer-scan.ts`; E6 và E7 mỗi cái một lượt. Mỗi eval được chấm
  theo chữ `expected:` của CHÍNH NÓ, không suy từ mã thoát chung. Mọi `cmd:` được
  giải từ `_acceptance/config.yaml` (khoá `executors.script.*`), không tin đường
  dẫn nào trong đề bài.
- Không lệnh nào bị công cụ giết: mọi lượt chạy đều in trọn dòng tổng kết cuối của
  chính nó ("OK — 0 khẳng định đỏ" hoặc "OK — 0/2 project đỏ"), và mọi mã thoát báo
  cáo ở trên là mã thoát THẬT của lệnh, thu bằng `$?` ngay sau lượt chạy. Trần thời
  gian đặt 900000 ms cho mọi lượt.
- Khoảng mười lăm phép tiêm tấn công, tất cả trên tệp THẬT (`recipes.test.ts` và
  `MapView.test.tsx`), hoàn nguyên từ bản sao lưu ngoài kho sau TỪNG ca. Các tệp
  phụ trợ dựng tạm (`mcp-server/src/ng5.d.ts`, `src/ngw.d.ts`,
  `mcp-server/src/ngb.ts`, `mcp-server/src/ngp.ts`, `mcp-server/src/ngp-inner.ts`,
  `outside-ng.d.ts`) đều đã xoá. Không tsconfig nào bị sửa trong vòng này.
- Số nền của E1/E2 đo bằng một worktree tách rời ở `54b5cb2` đặt DƯỚI
  `/Users/manhphan/dev/mapposter/` (cụ thể là `.claude/worktrees/__baseline_r6`),
  vì ngoài thư mục ấy `npx` giải sang một `tsc` khác. Worktree đã gỡ bằng
  `git worktree remove --force`; `git worktree list` sau đó chỉ còn ba mục có sẵn.
  Không dùng `git stash` ở bất kỳ bước nào.
- Tám eval mang số nền `n-a` vì script đo chúng chưa tồn tại ở `54b5cb2`; vòng
  chấm chạy thử để xác nhận điều đó thay vì suy đoán, và không dựng số giả.
- Mọi dòng run-log được ghi ngay sau lượt chạy sinh ra nó, mang mã thoát thật và
  mốc thời gian thật của phiên chấm này; tệp cũ (vòng 1-5) chỉ được nối thêm,
  không viết lại dòng nào.

## Iterations

- Vòng 1 — bộ quét bịt miệng đoán vị trí đối số bằng «có `)` ngay sau không»; qua
  được lượt chấm đầu vì không ai đâm vào chỗ đoán.
- Vòng 2 — bốn lỗ mặt chữ bị đâm thủng (ngoặc nhóm, đối số không đứng cuối,
  `<never>x`, số dòng lệch); bản vá lần-ngược-đếm-ngoặc thủng thêm ba lỗ nữa.
- Vòng 3 — chuyển sang hỏi CÂY CÚ PHÁP, đúng hết về cấu trúc, nhưng dời chế độ
  hỏng sang «đọc trống»; sinh ra AC-5c và E9 để chặn ca nuốt.
- Vòng 4 — tìm ra lối vòng BÍ DANH KIỂU: cây nguyên vẹn, 0 chẩn đoán, `tsc` xanh,
  mà `as N` với `type N = never` đi lọt; ký với known-limit ấy còn mở.
- Vòng 5 — lỗ bí danh đóng theo lớp bằng bộ kiểm kiểu, nhưng program của bộ quét
  chỉ có MỘT tệp gốc; một `.d.ts` toàn cục đi TRỌN cổng với 9/9 xanh, sinh ra
  AC-5d và E10.
- Vòng 6 — 10/10 đạt trên thước mới; lớp «program bất đồng» ĐÓNG, kiểm bằng bảy
  kênh dựng lại (kể cả lối vòng nguyên văn của vòng 5) đều bị bắt đúng dòng trong
  khi `tsc` xanh. Lớp lộ ra ở TRỤC khác: ô miễn trừ «vị trí đối số» rót được
  `never` vào ô giá trị qua một hàm trung gian, và hai dạng giặt kiểu không dùng
  phép ép nào thì không tầng nào thấy.
