---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Mười eval đạt trên thước ĐÃ ĐỔI của vòng 9 (ca tự-canh AC-5d nay TỰ DỰNG lối
  vòng `.d.ts` toàn cục và chấm VI SAI hai đường; chữ `expected:` của E10 và chữ
  AC-5d nắn theo; AC-2 đính chính cơ chế của bước CI). Điểm quyết định của vòng
  này — «ca tự-canh AC-5d có thật hay chỉ diễn» — được trả lời bằng phá hoại có
  chủ đích: hạ `analyzeRealFile` xuống program một-tệp thì chốt (1) NGÃ; làm nội
  dung tệp thăm dò sai kiểu thì chốt (3) NGÃ; ép script chết giữa chừng bằng cả
  hai cách (thoát cứng và ném lỗi) thì hai tệp thăm dò vẫn được dọn sạch. Ba
  phép phá ấy chứng minh ca tự-canh đang ĐO chứ không diễn. Năm lối vòng đã đóng
  được tiêm lại vào TỆP THẬT và đều còn đóng; hai chiều của template có nhãn và
  của thuộc tính JSX đều đúng. Số nền E1/E2 đo lại tại `54b5cb2`: sáu lỗi
  typecheck, đúng 4 + 2 như hợp đồng kể. Mọi mũi tiêm đều hoàn nguyên, cây mã
  sạch sau từng ca. Giới hạn còn lại ghi ở `## Known limits` — có thật, đo được,
  và mọi cái đều lệch về phía an toàn.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 01e1340176ec308b20e264919c468d14dd6d1d69
human_signoff: manh 2026-08-27
---

# Evidence Report — typecheck-mock-signature (vòng 9)

Thước đã đổi ở vòng 9: bộ ca tự-canh của AC-5d nay tự viết
`declare type __Ac5dNever = never` vào `mcp-server/src/__ac5d_probe.d.ts` cùng
một tệp dùng nó, rồi chấm bốn chốt; chữ `expected:` của E10 và câu chữ AC-5d
được viết lại theo; AC-2 được đính chính (bước Typecheck của CI không dùng
`&&`, nó là khối `run: |` hai dòng chạy dưới `bash -e`). Bằng chứng vòng 8 vì
thế hết hiệu lực. Mọi số dưới đây đo lại từ đầu trong ngữ cảnh tươi; mọi `cmd:`
tự giải từ `_acceptance/config.yaml`, không đường dẫn nào lấy từ lời nhắc.

Một luật định dạng, ghi trước để người đọc không hiểu nhầm: báo cáo này không
được chứa mã thoát khác không, mà phần lớn mũi tấn công của vòng chấm CỐ Ý làm
bộ đo báo hỏng. Nên mọi dòng tổng kết dạng «n trên m project đỏ» và mọi mã thoát
đỏ của các mũi tiêm đều được **diễn đạt lại bằng lời**; nguyên văn nằm trong
phiên chạy và trong `run-log.jsonl`. Không con số nào bị đổi, chỉ cách viết.

| Eval | Tiêu chí | Executor | Kết quả | Số nền | Ghi chú |
|------|----------|----------|---------|--------|---------|
| E1 | AC-1 | script · `typecheck_both` | PASS | `red` | hai project chấm RỜI, mỗi bên mã thoát 0 và 0 dòng `error TS` |
| E2 | AC-2 | script · `typecheck_both` | PASS | `red` | vòng chấm tiêm lỗi từng bên: mỗi lần đúng MỘT project báo hỏng, bên kia sạch |
| E3 | AC-3 | script · `mock_type_probe` | PASS | `n-a` | đối chứng bản-chép-sạch + hai mũi đỏ đúng TS2322 / TS2339 tại tệp thăm dò |
| E4 | AC-4 | script · `mock_type_probe` | PASS | `n-a` | `.basemap` là union hẹp, field lạ bị bắt; đối chứng sạch chạy trước |
| E5 | AC-5 | script · `mock_silencer_scan` | PASS | `n-a` | 10 + 6 dòng THÊM so mốc GHIM `54b5cb2`, 0 mẫu bịt miệng |
| E6 | AC-6 | script · `mock_mutation_probe` | PASS | `n-a` | đối chứng nền + ba mũi phá, mỗi mũi làm tệp test tương ứng ĐỎ, hoàn nguyên đúng byte |
| E7 | AC-7 | script · `mock_no_regression` | PASS | `n-a` | 629 đạt / 646 tổng, 0 đỏ; MapView 2 ca, recipes 40 ca |
| E8 | AC-5b | script · `mock_silencer_scan` | PASS | `n-a` | 0 chỗ `never` ở vị trí giá trị; đúng 5 chỗ đối số, báo RIÊNG |
| E9 | AC-5c | script · `mock_silencer_scan` | PASS | `n-a` | hai ca nuốt bị bắt bằng chẩn đoán cú pháp; tệp sạch cho 0 |
| E10 | AC-5d | script · `mock_silencer_scan` | PASS | `n-a` | bốn chốt, ba chốt đầu ĐẾN TỪ PHÉP ĐO; vòng chấm phá hai trong bốn chốt và cả hai đều ngã |

Số nền đo bằng worktree tách ở mốc ghim `54b5cb2`, đặt DƯỚI
`/Users/manhphan/dev/mapposter/` để `npx` giải đúng `tsc` của kho thay vì tải
gói mồi; worktree đã gỡ sau khi đo, không dùng `git stash`. E3..E10 để `n-a`
chứ không bịa: ở `54b5cb2` thư mục `_acceptance/typecheck-mock-signature` chưa
tồn tại, nên tám script ấy không có gì để chạy.

## Evidence

### E1 — AC-1 · typecheck hai project, độc lập

- run_id: typecheck-mock-signature-e1-r9-20260827150415
- verifier: config:executors.script.typecheck_both
- exit_code: 0
- verified_at: 2026-08-27T15:04:15Z
- output:

```
PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

OK — không project nào đỏ
```

`expected:` đòi `--force`; nguồn script khai đúng `['tsc', '-b', '--force']` ở
`RUNS[0]`, và hai lệnh chạy RỜI qua hai lần `execFileSync` riêng, mã thoát thu
độc lập từng lệnh.

Số nền: dựng worktree tách tại `54b5cb2`, `npx tsc -b --force` in ra đúng 4
dòng `error TS` — hai cặp TS2352 + TS2493 tại `MapView.test.tsx` dòng 68 và 78,
đúng bốn lỗi mà báo cáo sự cố ghi nhận. Số nền = `red`.

### E2 — AC-2 · một vế không được che vế kia

- run_id: typecheck-mock-signature-e2-r9-20260827150415
- verifier: config:executors.script.typecheck_both
- exit_code: 0
- verified_at: 2026-08-27T15:04:15Z
- output: cùng lượt chạy E1; hai dòng kết quả RIÊNG cho hai project, đọc ở trên.

Đây là chiều đáng ngờ nhất của cả bộ — hai dòng `PASS` cạnh nhau có thể là hai
dòng trang trí đọc cùng một phép đo — nên vòng chấm đo thẳng thay vì tin chữ.
Tiêm một lỗi kiểu thật vào `src/components/MapView.test.tsx`: project web báo
hỏng, project mcp-server vẫn sạch. Hoàn nguyên, tiêm cùng lỗi ấy vào
`mcp-server/src/recipes.test.ts`: ngược lại hoàn toàn. Hai lệnh vì thế thật sự
rời nhau và thật sự phủ hai tệp đích. `git status --porcelain` rỗng sau cả hai.

**Đính chính của AC-2 đã khớp tệp thật.** Vòng chấm đọc
`.github/workflows/ci.yml`: bước Typecheck là

```
      - name: Typecheck
        run: |
          npx tsc -b
          npx tsc -p mcp-server/tsconfig.json
```

Không có `&&` nào. Cơ chế che vế sau là `bash -e` của khối `run: |`: lệnh đầu
ngã thì shell dừng và lệnh sau không chạy — hệ quả đúng y như các bản trước mô
tả, chỉ tên gọi cơ chế là sai và nay đã sửa trong contract. Ghi rõ vì đây là
lần thứ hai hồ sơ này tự bắt lỗi «nói đúng hệ quả, gọi sai cơ chế».

Số nền: tại `54b5cb2`, `npx tsc -p mcp-server/tsconfig.json` in ra 2 dòng
`error TS2352` tại `recipes.test.ts` dòng 328 và 356 — đúng hai lỗi đã nằm
khuất sau bốn lỗi của project web suốt 5 ngày. Số nền = `red`.

### E3 — AC-3 · chiều phủ định cho MapView.test.tsx

- run_id: typecheck-mock-signature-e3-r9-20260827150425
- verifier: config:executors.script.mock_type_probe
- exit_code: 0
- verified_at: 2026-08-27T15:04:25Z
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

- run_id: typecheck-mock-signature-e4-r9-20260827150425
- verifier: config:executors.script.mock_type_probe
- exit_code: 0
- verified_at: 2026-08-27T15:04:25Z
- output:

```
=== AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts
```

Đạt, nhưng đây là chỗ **chữ `expected:` nói mạnh hơn phép đo một nhịp**, và
vòng này đọc thẳng nguồn để xác nhận: `expected:` viết «`r.compile(x as never)`
phải giữ kiểu trả về THẬT», trong khi hai mũi của script dựng lời gọi của RIÊNG
chúng — `getRecipe('area-overview').compile({} as never).basemap` — chứ không
đọc biến `r` mà `recipes.test.ts` đang ràng buộc. Nó chứng minh kiểu SẢN PHẨM
còn hẹp; nó chưa chứng minh ràng buộc bên trong tệp test đi qua đúng kiểu ấy.
E3 làm được điều E4 chưa làm. Xem `## Known limits`.

### E5 — AC-5 · dòng THÊM không mẫu bịt miệng

- run_id: typecheck-mock-signature-e5-r9-20260827150437
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T15:04:37Z
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

Mốc so là mốc GHIM, không phải `merge-base`: nguồn khai
`PINNED_BASE = '54b5cb263259bc8ebe0ef5d20960b82b369b1f6e'` và dòng `mốc so:`
in ra đúng chuỗi ấy. Ba chốt tự-canh mà `expected:` gọi tên đều có mặt và đều
đạt: fixture bẩn bắt 4, fixture sạch bắt 0, số dòng thêm 10 và 6 đều lớn hơn 0.
Chốt «không giải được mốc thì script ngã» đọc được trực tiếp trong `baseRef()`.

### E6 — AC-6 · assertion còn cắn

- run_id: typecheck-mock-signature-e6-r9-20260827150452
- verifier: config:executors.script.mock_mutation_probe
- exit_code: 0
- verified_at: 2026-08-27T15:04:52Z
- output (mã thoát đỏ của ba mũi phá được diễn đạt lại bằng lời theo luật định
  dạng ở đầu báo cáo; nguyên văn in ra mã thoát khác không cho từng mũi):

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

Đối chứng nền chạy trước mọi mũi và script thoát sớm nếu nền đã đỏ — đúng như
`expected:` đòi. Chốt neo-khớp-đúng-một-lần đọc được trong nguồn
(`occurrences !== 1` thì báo hỏng chứ không bỏ qua). Hoàn nguyên được khẳng
định bằng so byte với bản gốc, và chốt cuối `git status --porcelain` trên hai
tệp sản phẩm trả về rỗng.

### E7 — AC-7 · không hồi quy, và hai tệp thật sự đã chạy

- run_id: typecheck-mock-signature-e7-r9-20260827150458
- verifier: config:executors.script.mock_no_regression
- exit_code: 0
- verified_at: 2026-08-27T15:04:58Z
- output:

```
PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-ujluwv/vitest.json
PASS  0 ca đỏ (629 đạt / 646 tổng)
PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)
```

Số ca đọc từ báo cáo JSON của vitest, không suy từ mã thoát của cả bộ — đúng
chiều mà `expected:` đòi.

### E8 — AC-5b · `as never` ở vị trí giá trị

- run_id: typecheck-mock-signature-e8-r9-20260827150437
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T15:04:37Z
- output (trích phần luật vị trí; toàn bộ 38 khẳng định tự-canh đều đạt):

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

Con số của `expected:` khớp output thật: «hôm nay là 5», và tổng chỗ-đối-số in
ra là 0 (MapView) + 5 (recipes) = 5, báo ở một vế RIÊNG của cùng dòng, không
gộp vào số vi phạm.

**Hồi quy các lối vòng đã đóng, đo trên TỆP THẬT.** Vòng chấm không tin bộ ca
trong script mà tự tiêm vào chính hai tệp đích rồi hoàn nguyên; sau MỖI ca
`git status --porcelain` trả về rỗng.

| Mũi tiêm (vào tệp thật) | Bộ quét trả | Đúng ý hợp đồng? |
|---|---|---|
| `__idProbe<T>(v: T): T` với `__idProbe({} as never)`, vào `recipes.test.ts` | TỐ, đúng dòng 392 | ĐÚNG — lối vòng generic-identity của vòng 6 còn ĐÓNG |
| bí danh `.d.ts` TOÀN CỤC: `declare type __R9NeverProbe = never` trong `mcp-server/src/__r9_probe.d.ts` + `{} as __R9NeverProbe` trong `recipes.test.ts` | TỐ, đúng dòng 391 — **trong khi CẢ HAI lệnh typecheck vẫn sạch** | ĐÚNG — lối vòng phạm-vi-biên-dịch của vòng 5 còn ĐÓNG, và bộ quét là thứ duy nhất bắt được |
| JSX component generic `ProbeG<T>(p: { a: T })`, vào `MapView.test.tsx` | TỐ, đúng dòng 90 | ĐÚNG — đọc node kiểu ĐÃ VIẾT «T», không đọc kiểu đã suy |
| template CÓ NHÃN `...v: never[]`, vào `recipes.test.ts` | không tố; chỗ-đối-số lên 6 | ĐÚNG — hết đỏ oan |
| template CÓ NHÃN `...v: string[]`, cùng tệp | TỐ, đúng dòng 392; chỗ-đối-số vẫn 5 | ĐÚNG — vẫn cắn |
| JSX prop khai `never`, vào `MapView.test.tsx` | không tố; chỗ-đối-số lên 1 | ĐÚNG — hết đỏ oan |
| JSX prop khai `string`, cùng tệp | TỐ, đúng dòng 90 | ĐÚNG — vẫn cắn |

Ca then chốt vẫn là component JSX generic: nếu bản sửa đọc kiểu ĐÃ SUY thì
`<ProbeG a={{} as never} />` sẽ cho `never` và được miễn trừ, tức mở lại lối
vòng vòng 6. Nó bị tố, đúng dòng.

### E9 — AC-5c · hỏng thì ĐÓNG ở tầng cú pháp

- run_id: typecheck-mock-signature-e9-r9-20260827150437
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T15:04:37Z
- output:

```
PASS  hỏng-thì-đóng «chú thích không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
PASS  hỏng-thì-đóng «template literal không đóng»: cast bị nuốt (0 thấy được) NHƯNG chẩn đoán cú pháp bắt được (1 lỗi)
PASS  đối chứng âm: tệp sạch → 0 lỗi cú pháp (chốt không nổ oan)
PASS  src/components/MapView.test.tsx: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
PASS  mcp-server/src/recipes.test.ts: phân tích cú pháp sạch (0 lỗi) — không parse được thì KHÔNG kết luận "sạch"
```

Đủ cả bốn thứ `expected:` đòi: hai ca nuốt với «0 cast thấy được nhưng lỗi cú
pháp lớn hơn 0», một đối chứng âm, và dòng «phân tích cú pháp sạch» có mặt cho
TỪNG tệp đích trước mọi kết luận «sạch». Nguồn cho thấy chốt này thật sự chặn
đường: `if (perr > 0) continue;` bỏ qua mọi kết luận «sạch» của tệp không đọc
được, sau khi đã ghi một khẳng định đỏ.

### E10 — AC-5d · phạm vi biên dịch, đo VI SAI

- run_id: typecheck-mock-signature-e10-r9-20260827150437
- verifier: config:executors.script.mock_silencer_scan
- exit_code: 0
- verified_at: 2026-08-27T15:04:37Z
- output:

```
PASS  AC-5d qua tsconfig THẬT: bí danh .d.ts toàn cục bị bắt (1 chỗ vị trí giá trị, 0 tên không giải được)
PASS  AC-5d đối chứng: program MỘT-TỆP KHÔNG thấy nó (0 chỗ) mà chỉ báo tên không giải được (1) — nên đường tsconfig là thứ đang gánh việc
PASS  AC-5d: trong lúc lối vòng đang nằm trong cây, `tsc -p mcp-server` vẫn sạch — nên E1 KHÔNG đỡ hộ, bộ quét là thứ duy nhất bắt được
PASS  AC-5d: hai tệp thăm dò đã dọn sạch
PASS  hỏng-thì-đóng tầng kiểm kiểu: tên không giải được → 0 khớp never NHƯNG 1 tên không giải được (phải là 1)
PASS  đối chứng âm: tên giải được → 0 tên không giải được (phải là 0)
PASS  src/components/MapView.test.tsx: mọi tên kiểu trong phép ép đều giải được (0 không giải được) — không giải được thì KHÔNG kết luận "sạch"
PASS  mcp-server/src/recipes.test.ts: mọi tên kiểu trong phép ép đều giải được (0 không giải được) — không giải được thì KHÔNG kết luận "sạch"
```

Bốn chốt của `expected:` đều có mặt, và ba chốt đầu **đến từ chính phép đo**:
script tự ghi `declare type __Ac5dNever = never;` vào
`mcp-server/src/__ac5d_probe.d.ts` và một tệp dùng nó, rồi chấm hai đường và
đòi chúng trả KHÁC NHAU. Đó là điều vòng 8 không có.

**Việc chính của vòng này: ca tự-canh ấy có THẬT không, hay chỉ diễn.** Vòng
chấm không dừng ở việc đọc chữ mà làm nó ngã ba lần, mỗi lần theo một hướng
khác nhau. Mọi mũi đều hoàn nguyên; `git status --porcelain` rỗng sau từng ca.

| Mũi phá vào chính bộ đo | Kết quả | Kết luận |
|---|---|---|
| hạ `analyzeRealFile` xuống `ts.createProgram([abs], parsed.options)` — tức program MỘT-TỆP nhưng vẫn dùng `options` của tsconfig thật | chốt (1) NGÃ: «0 chỗ vị trí giá trị, 1 tên không giải được»; script kết luận bộ quét hỏng và không cho đọc bất cứ kết quả nào | ca tự-canh ĐANG ĐO. Nếu nó chỉ diễn thì thay đổi này đã đi lọt |
| giữ nguyên đường đo, nhưng thêm một dòng sai kiểu thật vào nội dung tệp thăm dò mà script tự ghi | chốt (1) và (2) vẫn đạt, chốt (3) NGÃ — `tsc -p mcp-server` không còn sạch | chốt «tsc vẫn xanh» có răng; nó không phải một câu khẳng định trang trí |
| ép script chết giữa chừng ngay sau khi ghi hai tệp thăm dò, bằng CẢ HAI cách: thoát cứng (bỏ qua `finally`) và ném lỗi ra ngoài | cả hai lần `ls mcp-server/src/__ac5d*` không khớp tệp nào | `process.on('exit', clean)` phủ được cả đường mà `finally` không phủ; không rác nào bị bỏ lại |

Chốt hỏng-thì-đóng ở tầng kiểm kiểu có đủ ca dương (tên bịa ra → 0 khớp never
nhưng 1 tên không giải được) và ca âm (bí danh giải được → 0), đúng như
`expected:` đòi. Chi tiết mà `expected:` bảo đọc kỹ cũng đúng trong nguồn: phép
nhận diện dùng chẩn đoán ngữ nghĩa mã 2304 và họ hàng, và chỉ tính chẩn đoán
RƠI VÀO đúng khoảng của node kiểu trong phép ép (`d.start` nằm giữa
`t.start`/`t.end`), chứ không dùng `getSymbolAtLocation`.

Ghi thêm một quan sát về vận hành, không tính vào verdict: trong lúc bốn chốt
này chạy, hai tệp thăm dò NẰM THẬT trong `mcp-server/src/`. Vòng chấm đã đo
phạm vi ảnh hưởng — `vitest.config.ts` chỉ nhặt `mcp-server/**/*.test.ts` nên
tệp thăm dò không phải một ca test; hai tsconfig đều `noEmit: true` nên không
sinh tạo tác; `tsc -b` ở gốc chỉ tham chiếu `tsconfig.app.json` (`include: src`)
và `tsconfig.node.json` (`include: vite.config.ts`), không chạm `mcp-server`.
Bề mặt duy nhất còn lại nằm ở `## Known limits`.

## Known limits

- **Cửa sổ ghi tệp của E10 chạm vào thư mục nguồn sản phẩm.** Bốn chốt AC-5d
  ghi hai tệp thật vào `mcp-server/src/` và giữ chúng ở đó trọn một lượt
  `npx tsc -p mcp-server/tsconfig.json` (đo được: lượt tsc ấy mất khoảng một
  đến vài giây). Hệ quả đo được: một lượt `typecheck_both` chạy SONG SONG đúng
  vào cửa sổ ấy sẽ chấm cả hai tệp thăm dò. Hôm nay vô hại vì tệp thăm dò
  typecheck sạch — nhưng đó là một tính chất của nội dung tệp, không phải một
  bảo đảm: nếu tệp thăm dò về sau mang lỗi kiểu, E1 sẽ đỏ vì một lý do không
  thuộc phạm vi của chính nó. Hai tên tệp lại cố định, nên hai lượt
  `mock_silencer_scan` chồng nhau dùng chung tên; vòng chấm chạy thử hai lượt
  song song và cả hai đều đạt, nên đây là rủi ro tiềm ẩn chưa phát tác chứ
  không phải lỗi quan sát được. Chiều hỏng của nó là fail-closed (một lượt sẽ
  báo hỏng to), không phải xanh oan.
- **`process.on('exit', clean)` phủ được thoát cứng và ném lỗi, nhưng không phủ
  tín hiệu giết.** Hai đường đầu đã đo và đều sạch. Một lần `SIGKILL` (hoặc
  công cụ giết tiến trình theo trần thời gian) trong cửa sổ vài giây ấy vẫn sẽ
  để lại hai tệp thăm dò trong `mcp-server/src/`. `mutation-probe.ts` có bắt
  `SIGINT`; `silencer-scan.ts` thì không.
- **`declaredParamTypeNode` chỉ bóc phần tử của `ArrayTypeNode`, nên rest kiểu
  TUPLE vẫn ĐỎ OAN.** Đo lại vòng này trên tệp thật:
  `declare function restTupleProbe(...p: [never, string]): void;` với
  `restTupleProbe({} as never, "x")` bị xếp vào «vị trí giá trị» đúng dòng 392,
  trong khi cả hai lệnh typecheck vẫn sạch. Tham số 0 được khai `never` thật,
  nên đúng luật miễn trừ thì nó phải được miễn. Chiều an toàn, và là dạng cùng
  họ với ba dạng mà vòng 7 đã sửa. **Còn nguyên từ vòng 8.**
- **JSX spread: phân loại vẫn sai, nhưng dạng ấy không sống nổi trong một cây
  mã qua được E1.** `<ProbeSp {...({} as never)} />` bị xếp thẳng vào «vị trí
  giá trị» (`JsxSpreadAttribute` không phải `SpreadElement` nên không rơi vào
  nhánh chứa-đối-số lẫn nhánh «không xác định»). Vòng 8 gọi đây là đỏ oan; vòng
  này đo thêm một bước và hạ mức nó xuống: chính `tsc` cũng từ chối dạng ấy —
  `error TS2698: Spread types may only be created from object types` — nên nó
  không thể tồn tại trong một cây mã mà E1 cho qua. Vẫn là phân loại sai về
  nguyên tắc, nhưng không phải một cửa đỏ oan thực dụng.
- **Đối số TRẢI bị dán hai nhãn cùng lúc.** `f(...[{} as never])` sinh đúng
  dòng «không xác định» như hợp đồng đòi, NHƯNG bản ghi ấy đồng thời được đẩy
  vào danh sách vi phạm (`hits.push` chạy vô điều kiện với `arg: false`), nên
  nó cũng cộng vào dòng «as never ở vị trí giá trị». Chiều an toàn, nhưng chữ
  `expected:` của E8 — «khai KHÔNG XÁC ĐỊNH chứ không vu tội» — vẫn mạnh hơn
  hành vi thật một nhịp: nó vừa nói đúng lý do vừa vẫn vu tội ở dòng bên cạnh.
  Bộ ca tự-canh chỉ khẳng định `undetermined.length`, không khẳng định gì về
  nhãn kia, nên script không tự thấy chỗ này. **Còn nguyên từ vòng 8.**
- **Trần đã khai trong hợp đồng: đo lại, còn nguyên.** Tiêm cả ba dạng vào
  `recipes.test.ts` cùng lúc và bộ quét đi qua im lặng, cả hai lệnh typecheck
  vẫn sạch: `declare function __lnProbe<T>(x: unknown): T` (trong nguồn không
  có phép ép nào); `declare function __sinkEProbe<T>(v: never): T` với
  `__sinkEProbe({} as never)` — luật miễn trừ xử ĐÚNG vì tham số khai `never`
  thật, chỗ-đối-số lên 6, nhưng thứ giặt kiểu là `T` ở đầu ra; và hàm khẳng
  định `asserts x is never`. Đây là TRẦN, không phải sót.
- **Câu chữ TRẦN của contract VẪN hẹp hơn thực tế — vòng 8 nêu, vòng 9 xác nhận
  chưa sửa.** Contract chốt «Điểm chung: cửa ra nằm ở kiểu trả về hoặc ở luồng».
  Đo lại vòng này: `declare const nvProbe: never; const __cProbe: number = nvProbe;`
  tiêm vào `recipes.test.ts` — bộ quét xanh, cả hai lệnh typecheck xanh. Cửa ra
  ở đây không phải kiểu trả về, không phải luồng, và trong nguồn KHÔNG có phép
  ép nào: nó là một GIÁ TRỊ được KHAI `never`. Hành vi của bộ quét đúng như
  thiết kế; chỉ câu chữ mô tả trần là chưa gọi đủ tên. Sửa bằng một dòng chữ,
  không cần đụng mã — đề nghị phát biểu trần bằng chính giới hạn của công cụ
  («bộ quét chỉ hỏi về kiểu ĐÍCH của một phép ép kiểu; mọi đường mà `never` tới
  được một ô nhớ qua lối khác đều nằm ngoài») thay vì kể tên từng dạng, vì đã
  ba vòng liền mỗi vòng lại tìm thêm một thành viên của cùng họ.
- **E4 chấm kiểu sản phẩm, không chấm ràng buộc của tệp test — và chữ
  `expected:` của nó nói mạnh hơn.** `expected:` viết «`r.compile(x as never)`»,
  nhưng hai mũi dựng `getRecipe('area-overview').compile({} as never)` của
  riêng chúng thay vì đọc biến `r` mà `recipes.test.ts` đang giữ. Nếu một lượt
  sau nới chính ràng buộc ấy trong tệp test mà không đụng kiểu sản phẩm, E4 vẫn
  xanh. Phần bù đang đến từ E5 (dòng thêm) và E8 (trọn tệp), không từ E4. Đây
  là eval yếu hơn lời `expected:` rõ nhất của vòng này.
- **E6 có chốt neo-khớp-đúng-một-lần nhưng không in ra khi nó đạt.** Nguồn
  khẳng định `occurrences !== 1` thì báo hỏng, đúng như `expected:` đòi; nhưng
  khi đạt thì không dòng nào ghi lại con số ấy, nên bằng chứng máy-đọc-được của
  E6 không tự mang chốt ấy theo. Người thẩm định phải đọc nguồn mới thấy. Đây
  là khoảng cách về ĐỘ ĐỌC ĐƯỢC của bằng chứng, không phải khoảng trống của
  phép đo.
- **Ngưỡng của AC-7 rất thấp cho một trong hai tệp.** `MapView.test.tsx` đóng
  góp đúng 2 ca. Chốt «lớn hơn 0» chỉ chứng minh tệp đã chạy, không nói gì về
  độ dày. Bộ có 646 ca tổng nhưng 629 đạt — 17 ca còn lại không chạy; AC-7
  không hỏi tới chúng.
- **`hits()` của E5 vẫn là biểu thức chính quy trên văn bản diff.** Luật «văn
  xuôi không phải mã» chỉ được áp cho đường `as never` (qua AST), không áp cho
  bốn mẫu `as any` / `@ts-expect-error` / `@ts-ignore` / `as unknown as`. Một
  dòng chú thích THÊM VÀO chỉ nhắc tới các mẫu ấy sẽ bị tố. Chiều an toàn, và
  hiện không phát tác vì cả hai tệp cho 0 khớp.
- **`expected:` của E5 kể thiếu phần gác, tức nói NHẸ hơn thực tế.** Nó nói «Ba
  chốt tự-canh», trong khi lượt chạy thật gác E5 bằng TOÀN BỘ 38 khẳng định
  tự-canh: script thoát sớm nếu bất kỳ khẳng định nào đỏ, trước khi chạm tới
  mốc so. Ba chốt được nêu là ba chốt thuộc riêng AC-5 và chúng có thật.

## Ngoài hợp đồng

- **Bước Typecheck của CI: mô tả cũ đã được sửa, và vòng này xác nhận bằng tệp
  thật.** Các bản báo cáo trước (kể cả vòng 8) viết rằng
  `.github/workflows/ci.yml` nối hai lệnh `tsc` bằng `&&`. Sai. Tệp thật là một
  khối `run: |` hai dòng, không có `&&` nào, và cơ chế che vế sau là `bash -e`.
  Hệ quả không đổi — lệnh đầu ngã thì lệnh sau không chạy — nên cách sống chung
  mà AC-2 chọn (đo hai project độc lập trong bộ eval) vẫn đúng. Nhưng lớp lỗi
  ấy vẫn còn nguyên TRONG CI: phép đo AC-2 sống trong `_acceptance`, không sống
  ở chỗ đã hỏng. Ghi ra để người ký biết mình đang ký cái gì.
- **17 ca của bộ test đơn vị không chạy** (629 đạt trên 646 tổng). Không tiêu
  chí nào trong hợp đồng hỏi tới chúng, nên chúng không ảnh hưởng verdict.
- **Bốn chỗ `as any` / `as unknown as` có sẵn trên main trong chính hai tệp
  đích** vẫn còn. Hợp đồng khai chúng ở Out of scope một cách có chủ đích và
  AC-5 vì thế đo dòng THÊM; ghi lại để người đọc không tưởng hai tệp đã sạch
  tuyệt đối.
- **`veto_state: mo` trong frontmatter của contract.** Hồ sơ tự khai một cửa
  phủ quyết đang mở từ 2026-08-27T04:41:00Z. Không tiêu chí nào đo nó và bộ
  eval không hỏi tới; ghi ra vì nó là trạng thái người ký cần biết.

## Analyst

Vòng này chỉ có một câu hỏi thật, và nó đáng được trả lời bằng phá hoại chứ
không bằng đọc: **ca tự-canh AC-5d là phép đo hay là màn diễn?** Vòng 8 phát
hiện đúng chỗ yếu — dòng «0 tên không giải được» in ra y hệt dưới một program
một-tệp, nên tự nó không chứng minh gì về phạm vi biên dịch, và bằng chứng khi
ấy đến từ mũi tiêm của người chấm. Bản sửa của vòng 9 dựng một phép đo VI SAI,
và câu trả lời là: **có thật.** Ba mũi phá đều làm nó ngã đúng chỗ phải ngã.

Mũi quyết định là mũi thứ nhất. Hạ `analyzeRealFile` từ
`ts.createProgram(parsed.fileNames, ...)` xuống `ts.createProgram([abs], ...)`
— giữ nguyên `options` của tsconfig thật, chỉ bỏ danh sách tệp — thì chốt (1)
lập tức đỏ và cả bộ quét từ chối cho đọc bất cứ kết luận nào. Đó là hình dạng
đúng của một phép đo có răng: thứ nó khẳng định chỉ đúng khi đường đo còn
nguyên. Đáng chú ý là mũi này KHÔNG làm chốt (2) đỏ — chốt (2) vẫn báo «program
một-tệp không thấy» — nghĩa là cặp (1)+(2) không phải hai dòng đọc cùng một
phép đo, mà thật sự là hai đường khác nhau đặt cạnh nhau. Đó chính là điều
`expected:` gọi là «hai đường phải trả KHÁC NHAU».

Mũi thứ hai chấm chốt (3), thứ dễ trở thành câu trang trí nhất trong cả bộ:
«tsc vẫn xanh». Thêm một dòng sai kiểu vào nội dung mà script tự ghi ra thì
chốt ấy đỏ, trong khi (1) và (2) vẫn đạt — tức nó gác đúng một tính chất riêng,
không ăn theo hai chốt kia. Mũi thứ ba chấm phần dọn dẹp, và điều đáng ghi là
nó phủ được cả đường mà `finally` KHÔNG phủ: một `process.exit` cứng bỏ qua
`finally`, nhưng `process.on('exit', clean)` vẫn chạy. Đây là chỗ dễ viết sai
nhất và nó được viết đúng.

Phần còn lại của vòng là hồi quy, và không lối vòng nào mở lại. Hai ca đáng
giá nhất: bí danh `.d.ts` toàn cục tiêm vào tệp thật bị TỐ đúng dòng trong khi
CẢ HAI lệnh typecheck vẫn sạch — nghĩa là bộ quét thật sự là thứ duy nhất bắt
được, không phải E1 đỡ hộ; và component JSX generic bị tố, nghĩa là nhánh JSX
quay về đọc `d.type` trên `PropertySignature` chứ không dừng ở
`getContextualType`.

Điều còn lại đáng nói là hình dạng của những chỗ chưa xong, vì nó lặp lại. Rest
kiểu TUPLE vẫn đỏ oan y như vòng 8 đã ghi; đối số trải vẫn bị dán hai nhãn; câu
chữ TRẦN vẫn chưa gọi tên một GIÁ TRỊ được khai `never`. Cả ba là cùng một vết:
bản sửa mở rộng DANH SÁCH chỗ chứa thay vì trả lời tổng quát câu hỏi «tham số
tương ứng được khai kiểu gì», và trần được kể bằng DANH SÁCH dạng thay vì bằng
giới hạn của công cụ. Mỗi vòng lại tìm thêm một phần tử của danh sách. Đề nghị
cho vòng sau vẫn như vòng 8 đề nghị, và nay có thêm một chi tiết bênh vực nó:
nhánh «không xác định» nên là MẶC ĐỊNH cho mọi chỗ chứa chưa hiểu, chứ không
phải nhánh cuối cùng chỉ dành riêng cho spread — làm vậy thì rest-tuple và JSX
spread tự động rơi vào chỗ đúng, và không cần một vòng nữa để phát hiện chỗ
chứa thứ sáu.

Một hạ mức so với vòng 8, ghi cho công bằng: JSX spread `{...(x as never)}`
tuy phân loại sai nhưng KHÔNG phải một cửa đỏ oan thực dụng, vì chính `tsc` từ
chối dạng ấy bằng TS2698. Nó không sống nổi trong cây mã nào qua được E1.

Không mũi nào của vòng chấm để lại vết: sau mỗi ca tiêm, `git status
--porcelain` trên tệp bị chạm đều rỗng; cây mã cuối vòng chỉ khác ở
`run-log.jsonl` (nối thêm mười dòng của vòng 9). Worktree số nền đã gỡ.

## Variance

- E1/E2 và E3/E4 mỗi cặp dùng CHUNG một lượt chạy; E5/E8/E9/E10 dùng chung một
  lượt. Năm lệnh rời cho mười eval, đúng như hồ sơ mô tả. `run_id` của các eval
  chung lượt vì thế trùng dấu thời gian.
- `run-log.jsonl` được NỐI THÊM, mười dòng `"round":9`, không ghi đè vòng 1-8.
- Số nền chỉ đo được cho E1/E2, bằng worktree tách tại `54b5cb2` đặt dưới
  `/Users/manhphan/dev/mapposter/`; đã gỡ bằng `git worktree remove`, không
  dùng `git stash`. Tám eval còn lại để `n-a` vì script đo của chúng chưa tồn
  tại ở mốc ấy — không bịa số.
- Chữ ký của vòng 8 KHÔNG chuyển sang. Thước đã đổi ở vòng 9, nên
  `human_signoff:` để TRỐNG và hồ sơ này cần chữ mới.
- Vòng chấm có sửa TẠM ba lần vào `scripts/silencer-scan.ts` để phá hoại có chủ
  đích; cả ba lần hoàn nguyên từ bản sao nguyên trạng, và `git status
  --porcelain` được kiểm sau mỗi lần.
- Không commit gì trong vòng chấm.

## Iterations

1. **Vòng 1** — dựng bộ mười eval. Bộ quét bịt-miệng đoán vị trí đối số bằng
   «có `)` ngay sau không».
2. **Vòng 2** — đâm thủng bốn chỗ của phép đoán mặt chữ: ngoặc nhóm, đối số
   không đứng cuối, cú pháp `<never>x`, số dòng lệch sau chú thích nhiều dòng.
3. **Vòng 3** — bản lần-ngược-đếm-ngoặc thủng thêm ba chỗ; bản AST chữa hết
   nhưng dời chế độ hỏng sang «đọc trống». Sinh ra AC-5c.
4. **Vòng 4** — lối vòng BÍ DANH KIỂU: `type N = never; e as N`. Cú pháp không
   thấy được; phải hỏi bộ KIỂM KIỂU.
5. **Vòng 5** — lối vòng PHẠM VI BIÊN DỊCH: bí danh khai trong `.d.ts` toàn cục
   giải ra kiểu LỖI dưới program một-tệp. Sinh ra AC-5d.
6. **Vòng 6** — lối vòng GENERIC IDENTITY: `__id({} as never)` nằm ở vị trí đối
   số nhưng tham số khai `T`. Luật miễn trừ chuyển sang «tham số tương ứng ĐƯỢC
   KHAI kiểu gì», đọc node đã viết chứ không đọc chữ ký đã suy.
7. **Vòng 7** — mười eval đạt và hồ sơ được ký, nhưng để lại hai việc: ba dạng
   ĐỎ OAN (template có nhãn, thuộc tính JSX, đối số trải), và chữ `expected:`
   của E5/E8 cùng mục TRẦN nói sai về phép đo của chính chúng.
8. **Vòng 8** — mười eval đạt trên thước đã đổi; ba dạng đỏ oan đã sửa và đo cả
   hai chiều trên tệp thật. Phát hiện lớn: **E10 YẾU hơn lời `expected:`** — mọi
   ca tự-canh AC-5d đều dựng program một-tệp, nên bằng chứng cho chốt «đường
   tsconfig gánh việc» đang đến từ mũi tiêm của người chấm chứ không từ phép đo.
   Kèm hai dạng đỏ oan mới cùng họ và một chỗ chữ TRẦN còn hẹp.
9. **Vòng 9 (vòng này)** — mười eval đạt trên thước đã đổi lần nữa. Ca tự-canh
   AC-5d nay TỰ DỰNG lối vòng và chấm VI SAI hai đường; vòng chấm phá nó ba
   cách (hạ xuống program một-tệp, làm tệp thăm dò sai kiểu, ép chết giữa
   chừng) và cả ba đều ngã đúng chỗ — ca ấy ĐO thật. Năm lối vòng cũ đều còn
   đóng khi tiêm vào tệp thật. AC-2 đã được đính chính đúng tệp CI. Còn lại:
   rest kiểu TUPLE đỏ oan, đối số trải dán hai nhãn, câu chữ TRẦN chưa phủ một
   GIÁ TRỊ khai `never`, E4 nói mạnh hơn phép đo, và cửa sổ ghi tệp của E10
   chạm thư mục nguồn sản phẩm. Tất cả lệch về phía an toàn, tất cả ghi ở
   `## Known limits`.
