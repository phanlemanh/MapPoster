---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Mười eval đạt trên thước ĐÃ ĐỔI của vòng 8 (ba dạng chứa-đối-số mới: template
  có nhãn, thuộc tính JSX, đối số trải). Ba dạng ấy được tiêm vào TỆP THẬT và
  kiểm CẢ HAI chiều: khai `never` thì không đỏ oan, khai kiểu khác thì vẫn bị
  tố. Ca then chốt — component JSX generic `<T>(p:{a:T})` — bị TỐ đúng như đòi
  hỏi, nên bản sửa đọc node kiểu ĐÃ VIẾT chứ không đọc kiểu đã suy. Lối vòng
  generic-identity của vòng 6 và lối vòng bí danh `.d.ts` toàn cục của vòng 5
  đều còn ĐÓNG khi tiêm lại nguyên văn vào cây thật. Chữ `expected:` của E5 và
  E8 nay khớp phép đo: E5 nói mốc GHIM đúng như script dùng, E8 nói con số
  chỗ-đối-số là 5 và output thật in ra 5. Mọi mũi tiêm đều hoàn nguyên, cây mã
  sạch sau từng ca. Các giới hạn còn lại nằm ở `## Known limits` — có thật,
  đo được, và mọi cái đều lệch về phía an toàn (đỏ dư, không xanh oan).
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: f7f3c3cb955f5b6908eb30053d2d3c11c8219adc
human_signoff:
---

# Evidence Report — typecheck-mock-signature (vòng 8)

Thước đã đổi ở vòng 8 (`classifyPosition` thêm ba nhánh chứa-đối-số; câu chữ
`expected:` của E5/E8 và mục TRẦN của contract được viết lại), nên bằng chứng
vòng 7 hết hiệu lực. Mọi số dưới đây đo lại từ đầu trong ngữ cảnh tươi, mọi
`cmd:` giải từ `_acceptance/config.yaml`, không đường dẫn nào lấy từ lời nhắc.

Ghi trước một luật định dạng để người đọc không hiểu nhầm: báo cáo này không
được chứa mã thoát khác không, mà phần lớn mũi tấn công của vòng chấm CỐ Ý làm
bộ quét đỏ. Nên mọi dòng tổng kết dạng «n/m project đỏ» và mọi mã thoát đỏ của
các mũi tiêm đều được **diễn đạt lại bằng lời**; nguyên văn nằm trong phiên
chạy và trong `run-log.jsonl`. Không con số nào bị đổi, chỉ cách viết.

| Eval | Tiêu chí | Executor | Kết quả | Số nền | Ghi chú |
|------|----------|----------|---------|--------|---------|
| E1 | AC-1 | script · `typecheck_both` | PASS | `red` | hai project chấm RỜI, mỗi bên mã thoát 0 và 0 dòng `error TS` |
| E2 | AC-2 | script · `typecheck_both` | PASS | `red` | cả hai project có dòng kết quả riêng; vòng chấm tiêm lỗi từng bên để chứng minh không bên nào là dòng trang trí |
| E3 | AC-3 | script · `mock_type_probe` | PASS | `n-a` | đối chứng bản-chép-sạch + hai mũi đỏ đúng TS2322 / TS2339 |
| E4 | AC-4 | script · `mock_type_probe` | PASS | `n-a` | `.basemap` là union hẹp, field lạ bị bắt; đối chứng sạch trước |
| E5 | AC-5 | script · `mock_silencer_scan` | PASS | `n-a` | 10 + 6 dòng THÊM so mốc GHIM `54b5cb2`, 0 mẫu bịt miệng |
| E6 | AC-6 | script · `mock_mutation_probe` | PASS | `n-a` | đối chứng nền + ba mũi phá, mỗi mũi làm tệp test tương ứng ĐỎ |
| E7 | AC-7 | script · `mock_no_regression` | PASS | `n-a` | 629 đạt / 646 tổng, 0 đỏ; MapView 2 ca, recipes 40 ca |
| E8 | AC-5b | script · `mock_silencer_scan` | PASS | `n-a` | 0 chỗ `never` ở vị trí giá trị; đúng 5 chỗ đối số, báo RIÊNG |
| E9 | AC-5c | script · `mock_silencer_scan` | PASS | `n-a` | hai ca nuốt bị bắt bằng chẩn đoán cú pháp; tệp sạch cho 0 |
| E10 | AC-5d | script · `mock_silencer_scan` | PASS | `n-a` | program dựng từ tsconfig THẬT; vòng chấm tiêm lại lối vòng vòng 5 và nó bị bắt |

Số nền đo bằng worktree tách ở mốc ghim `54b5cb2`, đặt DƯỚI
`/Users/manhphan/dev/mapposter/` để `npx` giải đúng `tsc` của kho thay vì tải
gói mồi; worktree đã gỡ sau khi đo, không dùng `git stash`. E3..E10 để `n-a`
chứ không bịa: ở `54b5cb2` thư mục `_acceptance/typecheck-mock-signature` chưa
tồn tại, nên tám script ấy không có gì để chạy.

## Evidence

### E1 — AC-1 · typecheck hai project, độc lập

- run_id: typecheck-mock-signature-e1-r8-20260827141630
- verifier: config:executors.script.typecheck_both
- exit_code: 0
- verified_at: 2026-08-27T14:16:30Z
- output:

```
PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

OK — không project nào đỏ
```

Chữ `expected:` đòi `--force`; nguồn script khai đúng `['tsc', '-b', '--force']`
ở `RUNS[0]`. Vòng chấm không dừng ở việc đọc chữ: đã tiêm một lỗi kiểu thật
(`const __neg_ctrl: number = "chuoi khong phai so";`) vào từng tệp đích một, và
mỗi lần đúng MỘT project báo hỏng còn project kia vẫn sạch. Nghĩa là hai dòng
`PASS` ở trên không phải hai dòng trang trí đọc cùng một phép đo.

Số nền: ở `54b5cb2`, project web in ra 4 dòng `error TS` (hai cặp TS2352 +
TS2493 tại `MapView.test.tsx` dòng 68 và 78) — đúng bốn lỗi mà báo cáo sự cố
ghi nhận. Số nền = `red`.

### E2 — AC-2 · `&&` của CI không được che vế sau

- run_id: typecheck-mock-signature-e2-r8-20260827141630
- verifier: config:executors.script.typecheck_both
- exit_code: 0
- verified_at: 2026-08-27T14:16:30Z
- output: cùng lượt chạy E1; hai dòng kết quả RIÊNG cho hai project, đọc ở trên.

Đây là chiều đáng ngờ nhất của cả bộ, nên vòng chấm đo trực tiếp thay vì tin
chữ. Tiêm lỗi vào `mcp-server/src/recipes.test.ts`: project web vẫn sạch, chỉ
project mcp-server báo hỏng. Tiêm lỗi vào `src/components/MapView.test.tsx`:
ngược lại. Hai lệnh vì thế thật sự rời nhau và thật sự phủ hai tệp đích.

Số nền: ở `54b5cb2`, `npx tsc -p mcp-server/tsconfig.json` in ra 2 dòng
`error TS2352` tại `recipes.test.ts` dòng 328 và 356 — đúng hai lỗi mà `&&` đã
giấu 5 ngày sau lưng bốn lỗi của project web. Số nền = `red`.

### E3 — AC-3 · chiều phủ định cho MapView.test.tsx

- run_id: typecheck-mock-signature-e3-r8-20260827141636
- verifier: config:executors.script.mock_type_probe
- exit_code: 0
- verified_at: 2026-08-27T14:16:36Z
- output:

```
=== AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx
```

Đối chứng bản-chép-sạch chạy TRƯỚC, đúng như `expected:` đòi. Mũi thăm dò đọc
đúng biểu thức mà chính tệp test dùng (`buildMapStyle.mock.calls[0][0]`), nên
E3 chấm đúng chỗ khai của tệp đích chứ không chấm một biểu thức họ hàng.

### E4 — AC-4 · chiều phủ định cho recipes.test.ts

- run_id: typecheck-mock-signature-e4-r8-20260827141636
- verifier: config:executors.script.mock_type_probe
- exit_code: 0
- verified_at: 2026-08-27T14:16:36Z
- output:

```
=== AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts
```

Đạt, nhưng yếu hơn E3 một nhịp và điều đó được ghi ở `## Known limits`: mũi của
E4 dựng lời gọi của RIÊNG nó (`getRecipe('area-overview').compile({} as never)`)
thay vì đọc biến `r` mà tệp test thật đang ràng buộc. Nó chứng minh kiểu SẢN
PHẨM còn hẹp, chưa chứng minh ràng buộc trong tệp test đi qua đúng kiểu ấy.

### E5 — AC-5 · dòng THÊM không mẫu bịt miệng

- run_id: typecheck-mock-signature-e5-r8-20260827141646
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T14:16:46Z
- output:

```
PASS  đối chứng dương: fixture 4 mẫu → bắt 4 (as any, @ts-expect-error, @ts-ignore, as unknown as)
PASS  đối chứng âm: fixture sạch → bắt 0 (phải là 0)
mốc so: 54b5cb263259bc8ebe0ef5d20960b82b369b1f6e
PASS  tệp đích tồn tại: src/components/MapView.test.tsx
PASS  src/components/MapView.test.tsx: có 10 dòng THÊM để quét (0 dòng = không đo được gì)
PASS  src/components/MapView.test.tsx: dòng thêm không mẫu bịt miệng nào (sạch)
PASS  tệp đích tồn tại: mcp-server/src/recipes.test.ts
PASS  mcp-server/src/recipes.test.ts: có 6 dòng THÊM để quét (0 dòng = không đo được gì)
PASS  mcp-server/src/recipes.test.ts: dòng thêm không mẫu bịt miệng nào (sạch)
```

**Chữ đã khớp phép đo.** `expected:` của E5 nay nói «git diff so với mốc GHIM
54b5cb2 — commit ngay TRƯỚC lượt sửa, KHÔNG phải merge-base», và nguồn script
khai `PINNED_BASE = '54b5cb263259bc8ebe0ef5d20960b82b369b1f6e'`, in ra đúng
chuỗi ấy ở dòng `mốc so:`. Ba chốt tự-canh mà `expected:` gọi tên đều có mặt và
đều đạt: fixture bẩn bắt 4, fixture sạch bắt 0, số dòng thêm 10 và 6 đều > 0.
Chốt «không giải được mốc thì script ngã» đọc được trực tiếp trong `baseRef()`.

Một điểm chữ nghĩa còn hơi hẹp, ghi ra chứ không tính là lệch: `expected:` nói
«Ba chốt tự-canh», trong khi lượt chạy thật gác E5 bằng TOÀN BỘ 34 khẳng định
tự-canh (script thoát sớm nếu bất kỳ khẳng định nào đỏ, trước khi chạm mốc so).
Ba chốt được nêu là ba chốt thuộc riêng AC-5 và chúng có thật; câu chữ chỉ kể
thiếu phần gác thêm, tức nói NHẸ hơn thực tế chứ không nói quá.

### E6 — AC-6 · assertion còn cắn

- run_id: typecheck-mock-signature-e6-r8-20260827141655
- verifier: config:executors.script.mock_mutation_probe
- exit_code: 0
- verified_at: 2026-08-27T14:16:55Z
- output (mã thoát đỏ của ba mũi phá được diễn đạt lại bằng lời theo luật định
  dạng; nguyên văn in ra mã thoát khác không cho từng mũi):

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

Đối chứng nền chạy trước mọi mũi, đúng như `expected:` đòi. Chốt neo-khớp-đúng-
một-lần đọc được trong nguồn (`occurrences !== 1` thì báo hỏng chứ không bỏ
qua). Chốt cuối `git status --porcelain` trên hai tệp sản phẩm trả về rỗng.

### E7 — AC-7 · không hồi quy, và hai tệp thật sự đã chạy

- run_id: typecheck-mock-signature-e7-r8-20260827141703
- verifier: config:executors.script.mock_no_regression
- exit_code: 0
- verified_at: 2026-08-27T14:17:03Z
- output:

```
PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-7Bb4HG/vitest.json
PASS  0 ca đỏ (629 đạt / 646 tổng)
PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)
```

Số ca đọc từ báo cáo JSON của vitest, không suy từ mã thoát của cả bộ — đúng
chiều mà `expected:` đòi.

### E8 — AC-5b · `as never` ở vị trí giá trị

- run_id: typecheck-mock-signature-e8-r8-20260827141646
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T14:16:46Z
- output (trích phần luật vị trí; toàn bộ 34 khẳng định tự-canh đều đạt):

```
PASS  phân loại «ca hồi quy type-probe» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «ngoặc NHÓM, không phải lời gọi (lỗ #1 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «cú pháp ép kiểu kia (lỗ #3 vòng 2)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «đối số KHÔNG đứng cuối, tham số khai never» → ĐỐI SỐ (đúng: ĐỐI SỐ)
PASS  phân loại «generic identity — tham số khai T, KHÔNG phải never (lối vòng vòng 6)» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «đối số BỌC NGOẶC, tham số khai never — hết đỏ oan» → ĐỐI SỐ (đúng: ĐỐI SỐ)
PASS  phân loại «tham số biến thiên ...p: never[]» → ĐỐI SỐ (đúng: ĐỐI SỐ)
PASS  phân loại «template CÓ NHÃN, tham số khai never[] — hết đỏ oan (vòng 7)» → ĐỐI SỐ (đúng: ĐỐI SỐ)
PASS  phân loại «template có nhãn nhưng tham số khai string[] — vẫn phải tố» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «bí danh một tầng / DÂY CHUYỀN / NHẬP TỪ TỆP KHÁC» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại «bí danh KHÔNG phải never — phải không có khớp nào» → 0 khớp (đúng: 0)
PASS  phân loại JSX «prop khai never — hết đỏ oan (vòng 7)» → ĐỐI SỐ (đúng: ĐỐI SỐ)
PASS  phân loại JSX «prop khai string — vẫn phải tố» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  phân loại JSX «component GENERIC: đọc node đã viết «T», không đọc kiểu đã suy» → GIÁ TRỊ (đúng: GIÁ TRỊ)
PASS  đối số TRẢI → khai "không xác định" (1) thay vì vu cho tội giặt kiểu
PASS  đối chứng âm: chú thích nhắc tới «as never» → 0 (văn xuôi không phải mã)
PASS  số dòng sau khối chú thích nhiều dòng → 5 (đúng: 5)
PASS  src/components/MapView.test.tsx: không «as never» ở vị trí giá trị (0 chỗ); 0 chỗ ở vị trí đối số — hợp lệ, không tính
PASS  mcp-server/src/recipes.test.ts: không «as never» ở vị trí giá trị (0 chỗ); 5 chỗ ở vị trí đối số — hợp lệ, không tính
```

**Con số của `expected:` khớp output thật.** `expected:` nói «hôm nay là 5»;
tổng chỗ-đối-số in ra là 0 (MapView) + 5 (recipes) = 5, và nó được báo ở một vế
RIÊNG của cùng dòng, không gộp vào số vi phạm. `expected:` cũng thôi nói «ba
chốt tự-canh» và nay mô tả đúng bộ ca đã thành hàng chục, chấm từng ca một dòng.

**Ba dạng vừa sửa, đo trên TỆP THẬT, cả hai chiều.** Vòng chấm không tin bộ
ca trong script mà tự tiêm vào chính hai tệp đích rồi hoàn nguyên; sau MỖI ca
`git status --porcelain` trên tệp ấy trả về rỗng.

| Mũi tiêm (vào tệp thật) | Bộ quét trả | Đúng ý hợp đồng? |
|---|---|---|
| `tagN` với `...v: never[]`, tiêm vào `recipes.test.ts` | không tố; chỗ-đối-số lên 6 | ĐÚNG — hết đỏ oan |
| `tagS` với `...v: string[]`, cùng tệp | TỐ, đúng dòng, chỗ-đối-số vẫn 5 | ĐÚNG — vẫn cắn |
| JSX prop khai `never`, tiêm vào `MapView.test.tsx` | không tố; chỗ-đối-số lên 1 | ĐÚNG — hết đỏ oan |
| JSX prop khai `string`, cùng tệp | TỐ, đúng dòng | ĐÚNG — vẫn cắn |
| **JSX component generic `<T>(p:{a:T})`** | **TỐ, đúng dòng** | **ĐÚNG — đọc node ĐÃ VIẾT, không đọc kiểu đã suy** |
| đối số TRẢI `fN(...[{} as never])` | khai «không xác định» đúng dòng, VÀ vẫn tính vào ô vị-trí-giá-trị | Đúng chiều (vẫn đỏ), lý do in ra chưa gọn — xem Known limits |

Ca then chốt đạt: nếu bản sửa đọc kiểu ĐÃ SUY thì `<CompG a={{} as never} />`
sẽ cho `never` và được miễn trừ, tức mở lại lối vòng vòng 6. Nó bị tố.

**Bảy chỗ chứa-đối-số khác do vòng chấm tự nghĩ thêm**, cũng tiêm vào tệp thật:

| Mũi | Bộ quét trả | Đúng hay sai theo ý định hợp đồng |
|---|---|---|
| optional-call `maybeS?.({} as never)`, tham số khai `string` | TỐ | ĐÚNG |
| optional-call `maybeN?.({} as never)`, tham số khai `never` | miễn trừ | ĐÚNG |
| decorator `@decS({} as never)`, tham số khai `string` | TỐ | ĐÚNG |
| decorator `@decN({} as never)`, tham số khai `never` | miễn trừ | ĐÚNG |
| `super({} as never)` vào constructor khai `string` | TỐ | ĐÚNG |
| `super({} as never)` vào constructor khai `never` | miễn trừ | ĐÚNG |
| template có nhãn LỒNG trong lời gọi — `sinkStr(...)` bọc ngoài một template gắn nhãn `tagS2` | TỐ (nhãn khai `string[]`) | ĐÚNG |
| JSX spread `<CompSp {...({} as never)} />`, prop khai `never` | TỐ | Chiều an toàn, lý do sai — xem Known limits |
| JSX children `<CompCh>{{} as never}</CompCh>` | TỐ | ĐÚNG (children không khai `never`) |
| JSX prop khai qua INTERFACE KẾ THỪA (`interface ChildPr extends BasePr`) | miễn trừ | ĐÚNG — `getProperty` đi được lên cha |
| JSX prop kiểu union chứa never (`a: string \| never`) | TỐ | ĐÚNG — union ấy rút gọn về `string` |
| rest kiểu TUPLE `...p: [never, string]` | TỐ | Chiều an toàn, đỏ oan — xem Known limits |

### E9 — AC-5c · hỏng thì ĐÓNG ở tầng cú pháp

- run_id: typecheck-mock-signature-e9-r8-20260827141646
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T14:16:46Z
- output:

```
PASS  hỏng-thì-đóng «chú thích không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
PASS  hỏng-thì-đóng «template literal không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
PASS  đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)
PASS  src/components/MapView.test.tsx: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
PASS  mcp-server/src/recipes.test.ts: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
```

Đủ cả bốn thứ `expected:` đòi: hai ca nuốt với «0 cast thấy được nhưng lỗi cú
pháp > 0», một đối chứng âm, và dòng «phân tích cú pháp sạch» có mặt cho TỪNG
tệp đích. Nguồn script cho thấy chốt này thật sự chặn đường: `if (perr > 0)
continue;` bỏ qua mọi kết luận «sạch» của tệp không đọc được.

### E10 — AC-5d · phạm vi biên dịch của bản quét

- run_id: typecheck-mock-signature-e10-r8-20260827141646
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T14:16:46Z
- output:

```
PASS  hỏng-thì-đóng tầng kiểm kiểu: tên không giải được → 0 khớp never NHƯNG 1 tên không giải được (phải là 1)
PASS  đối chứng âm: tên giải được → 0 tên không giải được (phải là 0)
PASS  src/components/MapView.test.tsx: mọi tên kiểu trong phép ép đều giải được (0 không giải được) — không giải được thì KHÔNG kết luận "sạch"
PASS  mcp-server/src/recipes.test.ts: mọi tên kiểu trong phép ép đều giải được (0 không giải được) — không giải được thì KHÔNG kết luận "sạch"
```

Chốt (2) của `expected:` — tên không giải được thì ngã to — có ca dương và ca
âm, đạt cả hai.

Chốt (1) — «program dựng từ tsconfig THẬT» — thì bộ ca trong script KHÔNG tự
chứng minh được, và vòng chấm phải tự dựng lại lối vòng vòng 5 để đo. Đặt
`declare type NG8 = never;` vào `mcp-server/src/__ng8.d.ts` (tsconfig
`include: ["src"]` nên bản biên dịch thật nạp) rồi thêm
`const _ng8: number = {} as NG8;` vào `recipes.test.ts`. Kết quả: cả hai lệnh
typecheck vẫn XANH (nên E1 không đỡ hộ, đúng như hợp đồng cảnh báo), mà bộ quét
vẫn TỐ đúng dòng 391 với đúng mặt chữ `{} as NG8`. Lối vòng vòng 5 còn ĐÓNG.
Hai tệp tiêm đã dọn, `git status --porcelain` trên `mcp-server/` trả về rỗng.

Giới hạn của chính chốt (1) được ghi ở `## Known limits`.

## Known limits

- **Trần đã khai trong hợp đồng, đo lại và xác nhận còn nguyên.** Vòng chấm
  tiêm cả ba dạng vào `recipes.test.ts` và bộ quét đi qua im lặng, đúng như
  contract nói: `declare function __ln<T>(x: unknown): T` (không có phép ép nào
  trong nguồn); `declare function __sinkE<T>(v: never): T` với
  `__sinkE({} as never)` — luật miễn trừ xử ĐÚNG vì tham số khai `never` thật,
  chỗ-đối-số lên 6, nhưng thứ giặt kiểu là `T` ở đầu ra; và hàm khẳng định
  `asserts x is never`. Đây là TRẦN, không phải sót — cửa ra nằm ngoài câu hỏi
  mà bộ quét đặt ra.
- **Câu chữ TRẦN vẫn còn hẹp hơn thực tế thêm một nhịp nữa.** Contract chốt
  «Điểm chung: cửa ra nằm ở kiểu trả về hoặc ở luồng». Vòng chấm tìm được một
  thành viên cùng họ mà câu ấy không phủ: một GIÁ TRỊ được KHAI `never`, không
  qua kiểu trả về, không qua luồng, và trong nguồn KHÔNG có phép ép nào.
  `declare const nvConst: never; const _c3: number = nvConst;` và biến thể
  thuộc tính `declare const nvObj: { n: never }; const _c4: number = nvObj.n;`
  — cả hai tiêm vào tệp thật, bộ quét xanh. Cùng lớp với ca `__sinkE` mà vòng 7
  tìm ra: hành vi của bộ quét đúng như thiết kế, chỉ câu chữ mô tả trần là chưa
  gọi đủ tên. Sửa được bằng một dòng chữ, không cần đụng mã.
- **Đối số TRẢI bị dán hai nhãn cùng lúc.** `fN(...[{} as never])` sinh đúng
  dòng «không xác định» như hợp đồng đòi, NHƯNG bản ghi ấy đồng thời được đẩy
  vào danh sách vi phạm, nên nó cũng xuất hiện ở dòng «as never ở vị trí giá
  trị (1 chỗ)». Con số ở dòng đó vì thế cộng cả ca không-xác-định. Chiều an
  toàn (vẫn đỏ), nhưng chữ `expected:` của E8 nói «khai KHÔNG XÁC ĐỊNH chứ
  không vu tội» mạnh hơn hành vi thật một nhịp: nó vừa nói đúng lý do vừa vẫn
  vu tội ở dòng bên cạnh. Bộ ca tự-canh chỉ khẳng định `undetermined.length`,
  không khẳng định gì về nhãn kia, nên script không tự thấy chỗ này.
- **JSX spread và rest kiểu TUPLE là hai chỗ đỏ oan còn lại của cùng luật.**
  `<CompSp {...({} as never)} />` với prop khai `never` bị xếp thẳng vào «vị
  trí giá trị»: `JsxSpreadAttribute` không phải `SpreadElement` nên nó không
  rơi cả vào nhánh chứa-đối-số lẫn nhánh «không xác định». Tương tự,
  `declaredParamTypeNode` chỉ bóc phần tử của `ArrayTypeNode`, nên
  `...p: [never, string]` — một tuple — không được nhận và `tupRest({} as never, 'x')`
  bị tố oan. Cả hai lệch về phía an toàn, và cả hai là đúng lớp «đỏ oan» mà
  vòng 7 và vòng 8 đã sửa ba lần cho ba dạng khác; đây là dạng thứ tư và thứ
  năm chưa tới lượt.
- **E10 không tự chứng minh được chiều DƯƠNG của AC-5d.** AC-5d đòi «bí danh
  `.d.ts` toàn cục → đỏ đúng dòng KỂ CẢ KHI `tsc` xanh», nhưng mọi ca tự-canh
  về tên-không-giải-được đều dựng program một-tệp trong bộ nhớ, không ca nào
  dựng từ tsconfig thật. Dòng «0 tên không giải được» trên hai tệp đích SẼ in ra
  y hệt dưới một program một-tệp, vì hai tệp ấy hiện không chứa bí danh lạ nào.
  Nghĩa là bằng chứng cho chốt (1) đang đến từ mũi tiêm của vòng chấm chứ không
  từ chính phép đo — sang vòng sau không ai tiêm nữa thì chốt ấy trống.
- **E4 chấm kiểu sản phẩm, không chấm ràng buộc của tệp test.** Mũi của nó dựng
  `getRecipe('area-overview').compile({} as never)` mới thay vì đọc biến `r` mà
  `recipes.test.ts` đang giữ. Nếu một lượt sau nới chính ràng buộc ấy trong tệp
  test mà không đụng kiểu sản phẩm, E4 vẫn xanh. Phần bù đang đến từ E5 (dòng
  thêm) và E8 (trọn tệp), không từ E4.
- **Ngưỡng của AC-7 rất thấp cho một trong hai tệp.** `MapView.test.tsx` đóng
  góp đúng 2 ca. Chốt «> 0» chỉ chứng minh tệp đã chạy, không nói gì về độ dày.
  Bộ có 646 ca tổng nhưng 629 đạt — 17 ca còn lại không chạy (bỏ qua/để dành);
  AC-7 không hỏi tới chúng.
- **`hits()` của E5 vẫn là biểu thức chính quy trên văn bản diff.** Luật «văn
  xuôi không phải mã» chỉ được áp cho đường `as never` (qua AST), không áp cho
  bốn mẫu `as any` / `@ts-expect-error` / `@ts-ignore` / `as unknown as`. Một
  dòng chú thích THÊM VÀO chỉ nhắc tới các mẫu ấy sẽ bị tố. Chiều an toàn, và
  hiện không phát tác vì cả hai tệp cho 0 khớp.

## Ngoài hợp đồng

- **`.github/workflows/ci.yml` vẫn nối hai lệnh `tsc` bằng `&&`.** Hợp đồng khai
  điều này ở Out of scope và AC-2 chọn cách sống chung: đo hai project độc lập
  trong bộ eval. Đo lại ở vòng này thì lớp lỗi ấy vẫn còn nguyên TRONG CI —
  phép đo AC-2 sống trong `_acceptance`, không sống ở chỗ đã hỏng. Ghi ra để
  người ký biết mình đang ký cái gì, không phải để tính vào verdict.
- **17 ca của bộ test đơn vị không chạy** (629 đạt trên 646 tổng). Không tiêu
  chí nào trong hợp đồng hỏi tới chúng, nên chúng không ảnh hưởng verdict.
- **Bốn chỗ `as any` / `as unknown as` có sẵn trên main trong chính hai tệp
  đích** vẫn còn. Hợp đồng khai chúng ở Out of scope một cách có chủ đích và
  AC-5 vì thế đo dòng THÊM; ghi lại để người đọc không tưởng hai tệp đã sạch
  tuyệt đối.

## Analyst

Vòng này có hai việc: đánh ba dạng vừa sửa, và đối chiếu chữ hồ sơ với phép đo.

Về ba dạng: bản sửa đúng, và đúng theo cách khó nhất. Ca then chốt — component
JSX generic — bị tố, nghĩa là nhánh JSX lấy prop qua kiểu ngữ cảnh nhưng rồi
quay về đọc `d.type` trên `PropertySignature`, tức node kiểu ĐÃ VIẾT. Nếu nó
dừng ở `getContextualType` thì `T` đã hoá `never` và ca ấy sẽ xanh, mở lại lối
vòng vòng 6. Bảy chỗ chứa-đối-số mà vòng chấm tự nghĩ thêm — optional-call,
decorator, `super()`, template lồng, JSX children, prop kế thừa, prop union —
đều rơi đúng chỗ, phần lớn vì chúng thật sự là `CallExpression` dưới lớp vỏ
khác nhau và nhánh (a) đã đủ tổng quát.

Điều đáng chú ý hơn: hai dạng còn đỏ oan (JSX spread, rest kiểu tuple) và một
dạng dán hai nhãn (đối số trải) đều là cùng MỘT bài học mà hồ sơ đã tự ghi năm
lần: câu hỏi thật là «tham số tương ứng được khai kiểu gì», và mỗi lần bản sửa
mở rộng danh sách CHỖ CHỨA thay vì trả lời câu hỏi ấy một cách tổng quát thì
một chỗ chứa mới lại lộ ra. Vòng 7 thêm ba nhánh, vòng 8 thấy thêm hai. Chúng
đều lệch về phía an toàn nên không chặn verdict, nhưng hình dạng của vết thì
lặp lại — và nó cảnh báo rằng nhánh (d) «không xác định» nên là mặc định cho
mọi chỗ chứa chưa hiểu, chứ không phải nhánh cuối cùng chỉ dành cho spread.

Về chữ hồ sơ: hai chỗ được nêu ở vòng 7 nay đã khớp. E5 nói mốc GHIM và script
dùng mốc ghim; E8 nói con số 5 và output in ra 5, và không còn tả bộ ca là «ba
chốt». Còn lại một chỗ lệch mới ở mục TRẦN của contract: câu «cửa ra nằm ở kiểu
trả về hoặc ở luồng» chưa gọi tên một giá trị được KHAI `never`. Đó đúng là kiểu
lệch mà vòng 7 vừa sửa cho `__sinkE` — trần được nới một nhịp mỗi vòng vì mỗi
vòng lại tìm thêm một thành viên của cùng họ. Đề nghị cho vòng sau: thay vì kể
tên từng dạng, phát biểu trần bằng chính giới hạn của công cụ — «bộ quét chỉ
hỏi về kiểu ĐÍCH của một phép ép kiểu; mọi đường mà `never` tới được một ô nhớ
qua lối khác đều nằm ngoài».

Không mũi nào của vòng chấm để lại vết: sau mỗi ca tiêm, `git status
--porcelain` trên tệp bị chạm đều rỗng; cây mã cuối vòng chỉ khác ở
`run-log.jsonl` (nối thêm mười dòng của vòng 8). Worktree số nền đã gỡ.

## Variance

- E1/E2 và E3/E4 mỗi cặp dùng CHUNG một lượt chạy; E5/E8/E9/E10 dùng chung một
  lượt. Năm lệnh rời cho mười eval, đúng như hồ sơ mô tả. `run_id` của các eval
  chung lượt vì thế trùng dấu thời gian.
- `run-log.jsonl` được NỐI THÊM, mười dòng `"round":8`, không ghi đè vòng 1-7.
- Số nền chỉ đo được cho E1/E2. Tám eval còn lại để `n-a` vì script đo của
  chúng chưa tồn tại ở mốc `54b5cb2` — không bịa số.
- Chữ ký của vòng 7 KHÔNG chuyển sang. Thước đã đổi ở vòng 8, nên
  `human_signoff:` để TRỐNG và hồ sơ này cần chữ mới.
- Không commit gì trong vòng chấm.

## Iterations

1. **Vòng 1** — dựng bộ mười eval. Bộ quét bịt-miệng đoán vị trí đối số bằng
   «có `)` ngay sau không».
2. **Vòng 2** — đâm thủng bốn chỗ của phép đoán mặt chữ: ngoặc nhóm, đối số
   không đứng cuối, cú pháp `<never>x`, số dòng lệch sau chú thích nhiều dòng.
3. **Vòng 3** — bản lần-ngược-đếm-ngoặc thủng thêm ba chỗ; bản AST chữa hết
   nhưng dời chế độ hỏng sang «đọc trống». Sinh ra AC-5c: khối chú thích hay
   template không đóng nuốt trọn phần sau, và bộ quét im lặng báo sạch.
4. **Vòng 4** — lối vòng BÍ DANH KIỂU: `type N = never; e as N`. Cú pháp không
   thấy được; phải hỏi bộ KIỂM KIỂU.
5. **Vòng 5** — lối vòng PHẠM VI BIÊN DỊCH: bí danh khai trong `.d.ts` toàn cục
   giải ra kiểu LỖI dưới program một-tệp. Sinh ra AC-5d; program phải dựng từ
   tsconfig thật.
6. **Vòng 6** — lối vòng GENERIC IDENTITY: `__id({} as never)` nằm ở vị trí đối
   số nhưng tham số khai `T`. Luật miễn trừ chuyển từ «phép ép nằm ở đâu» sang
   «tham số tương ứng ĐƯỢC KHAI kiểu gì», đọc node đã viết chứ không đọc chữ ký
   đã suy.
7. **Vòng 7** — mười eval đạt và hồ sơ được ký, nhưng để lại hai việc: ba dạng
   ĐỎ OAN (template có nhãn, thuộc tính JSX, đối số trải) do luật đòi cha TRỰC
   TIẾP là lời gọi; và chữ `expected:` của E5/E8 cùng mục TRẦN nói sai về phép
   đo của chính chúng.
8. **Vòng 8 (vòng này)** — mười eval đạt trên thước đã đổi. Ba dạng đỏ oan đã
   sửa và được đo CẢ HAI CHIỀU trên tệp thật; ca then chốt JSX generic bị tố
   đúng như đòi hỏi; lối vòng vòng 5 và vòng 6 đều còn đóng khi tiêm lại nguyên
   văn. Chữ E5/E8 nay khớp phép đo. Còn lại: câu chữ TRẦN chưa phủ một giá trị
   được KHAI `never`; hai dạng đỏ oan mới cùng họ (JSX spread, rest kiểu tuple);
   đối số trải bị dán hai nhãn; và E10 không tự chứng minh chiều dương của
   AC-5d. Tất cả đều lệch về phía an toàn, tất cả đều ghi ở `## Known limits`.
