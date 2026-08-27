---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason: >-
  Tám eval máy, năm lượt chạy, 8/8 đạt theo đúng chữ `expected:` của từng eval.
  Bộ quét `silencer-scan.ts` đã đổi giữa hai vòng (thêm AC-5b/E8), nên toàn bộ
  số đo của vòng này được lấy lại từ đầu, không kế thừa vòng 1. Baseline đo thật
  cho E1/E2 trên cây `54b5cb2` (đúng 6 lỗi kiểu như hợp đồng mô tả) và cho E8
  bằng cách tự tiêm một dòng nguy hiểm thật vào tệp đích. Có known-limit nên cần
  người ký.
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 21a1bfc088412adc07c22f02d4038b927aca3854
human_signoff:
---

# Evidence Report: typecheck-mock-signature (vòng 2)

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
- run_id: typecheck-mock-signature-e1-r2-20260827051128
- exit_code: 0
- baseline: red
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:11:28Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (lệnh đã giải từ config: executors.script.typecheck_both)
    (`--force` có mặt đúng như AC-1 đòi: không đọc tsbuildinfo, chấm lại thật)
    (baseline trên cây 54b5cb2: project web cho 4 dòng lỗi — cặp TS2352+TS2493 tại dòng 68 và 78 của MapView.test.tsx)

### E2 — AC-2

- eval: E2
- run_id: typecheck-mock-signature-e2-r2-20260827051128
- exit_code: 0
- baseline: red
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:11:28Z
- output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (đọc theo chiều AC-2: CẢ HAI project đều có dòng kết quả riêng, không project nào vắng mặt)
    (baseline trên cây 54b5cb2, chấm RỜI bằng đường dẫn tuyệt đối tới typescript/bin/tsc:
     project mcp-server cho 2 dòng TS2352 tại recipes.test.ts dòng 328 và 356 — đúng phần
     mà `&&` của bước CI đã che sau lưng 4 lỗi của project web)

### E3 — AC-3

- eval: E3
- run_id: typecheck-mock-signature-e3-r2-20260827051141
- exit_code: 0
- baseline: n-a
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:11:41Z
- output: |
    === AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx
    (kiểm độc lập sau lượt chạy: `git status --porcelain` không thấy tệp thăm dò nào sót lại)
    baseline n-a — bộ đo chưa tồn tại tại mốc so 54b5cb2, xem ## Analyst

### E4 — AC-4

- eval: E4
- run_id: typecheck-mock-signature-e4-r2-20260827051141
- exit_code: 0
- baseline: n-a
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:11:41Z
- output: |
    === AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts

    OK — 0 khẳng định đỏ
    baseline n-a — bộ đo chưa tồn tại tại mốc so 54b5cb2, xem ## Analyst

### E5 — AC-5

- eval: E5
- run_id: typecheck-mock-signature-e5-r2-20260827051153
- exit_code: 0
- baseline: n-a
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:11:53Z
- output: |
    PASS  đối chứng dương: fixture 4 mẫu → bắt 4 (as any, @ts-expect-error, @ts-ignore, as unknown as)
    PASS  đối chứng âm: fixture sạch → bắt 0 (phải là 0)
    mốc so: 54b5cb263259bc8ebe0ef5d20960b82b369b1f6e
    PASS  src/components/MapView.test.tsx: có 10 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  src/components/MapView.test.tsx: dòng thêm không mẫu bịt miệng nào (sạch)
    PASS  mcp-server/src/recipes.test.ts: có 2 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  mcp-server/src/recipes.test.ts: dòng thêm không mẫu bịt miệng nào (sạch)
    (kiểm độc lập: `git diff --unified=0 54b5cb2` cho đúng 12 dòng thêm trên hai tệp — khớp 10 + 2)

### E6 — AC-6

- eval: E6
- run_id: typecheck-mock-signature-e6-r2-20260827051348
- exit_code: 0
- baseline: n-a
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:13:48Z
- output: |
    PASS  đối chứng nền: src/components/MapView.test.tsx xanh khi chưa phá gì
    PASS  đối chứng nền: mcp-server/src/recipes.test.ts xanh khi chưa phá gì
    PASS  [mũi 1 — web ép basemap về vector] MapView.test.tsx ĐỎ khi code sản phẩm hỏng
    PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng
    PASS  [mũi 2 — web nuốt satelliteTiles] MapView.test.tsx ĐỎ khi code sản phẩm hỏng
    PASS  [mũi 3 — area-overview đổi mặc định về satellite] recipes.test.ts ĐỎ khi code sản phẩm hỏng
    PASS  mcp-server/src/recipes.ts đã hoàn nguyên đúng nguyên trạng
    PASS  git thấy code sản phẩm sạch sau mọi mũi (không vết)

    OK — 0 khẳng định đỏ

### E7 — AC-7

- eval: E7
- run_id: typecheck-mock-signature-e7-r2-20260827051358
- exit_code: 0
- baseline: n-a
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:13:58Z
- output: |
    PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
    PASS  có báo cáo máy-đọc-được: /var/.../accept-tpyYiV/vitest.json
    PASS  0 ca đỏ (629 đạt / 646 tổng)
    PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
    PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)

    OK — 0 khẳng định đỏ
    (đọc thẳng báo cáo JSON để kiểm: 629 passed / 17 skipped / 0 failed; 17 ca bỏ qua nằm ở
     mcpProtocol 7, renderClip 5, renderFrame 4, stdioChannel 1 — KHÔNG ca nào thuộc hai tệp đích)

### E8 — AC-5b

- eval: E8
- run_id: typecheck-mock-signature-e8-r2-20260827051153
- exit_code: 0
- baseline: red
- verifier: fresh-context verification subagent
- verified_at: 2026-08-27T05:11:53Z
- output: |
    PASS  đối chứng dương «as never» vị trí GIÁ TRỊ → bắt 2/2 (gồm ca hồi quy của type-probe)
    PASS  đối chứng âm «as never» vị trí ĐỐI SỐ → bắt 0 (phải là 0 — đây là cách dùng hợp lệ)
    PASS  đối chứng âm: chú thích nhắc tới «as never» → bắt 0 (phải là 0 — văn xuôi không phải mã)
    PASS  src/components/MapView.test.tsx: không «as never» ở vị trí giá trị (0 chỗ); 0 chỗ ở vị trí đối số — hợp lệ, không tính
    PASS  mcp-server/src/recipes.test.ts: không «as never» ở vị trí giá trị (0 chỗ); 7 chỗ ở vị trí đối số — hợp lệ, không tính
    (số vị-trí-đối-số được in RIÊNG khỏi số vi phạm, đúng như E8 đòi; kiểm độc lập bằng
     `grep -n 'as never'` cho đúng 7 dòng, cả 7 đều ở recipes.test.ts và đều là đối số)
    baseline red — tự tiêm `const _x: number = someIdentifier as never;` vào cuối
     mcp-server/src/recipes.test.ts thì bộ quét chuyển ĐỎ và nêu đích danh chỗ vi phạm;
     tệp đã được hoàn nguyên, sha256 khớp bản gốc và `git status --porcelain` rỗng cho tệp ấy

## Known limits

- **Số dòng mà bộ quét `as never` in ra KHÔNG phải số dòng thật.** Đo trực tiếp
  vòng này: tiêm một dòng nguy hiểm vào dòng 390 của
  `mcp-server/src/recipes.test.ts`, bộ quét báo đúng nội dung dòng ấy nhưng gắn
  nhãn `:379`. Nguyên nhân: `stripComments` xoá TRỌN khối `/* */` kể cả các ký tự
  xuống dòng bên trong, nên số dòng bị dồn lên (tệp 391 dòng còn 380 sau khi
  bóc — lệch 11). Hệ quả nặng hơn "sai vài dòng": nhãn `:379` trỏ vào một dòng
  THẬT và vô can (`expect(basemapDoc).toContain(KEY);`), nên người đọc log bị dẫn
  tới nhầm chỗ. Bản thân việc PHÁT HIỆN vẫn đúng — chỉ chẩn đoán sai địa chỉ.
- **`as never` bọc ngoặc không chỉ lọt, mà còn bị đếm NHẦM vào cột hợp lệ.**
  Hợp đồng (`## Notes`) đã khai `const y = (x as never);` sẽ lọt, và điều đó đúng —
  đã đo lại. Nhưng phần chưa khai: dòng ấy khớp `\bas\s+never\s*\)` nên nó được
  cộng vào con số "chỗ ở vị trí đối số — hợp lệ". Đo trực tiếp: tiêm
  `const _z: number = (someIdentifier as never);` làm con số ấy nhảy từ 7 lên 8.
  Tức một chỗ bịt miệng thật được rửa thành một chỗ dùng hợp lệ, ngay trong con
  số mà chính E8 đòi in ra làm bằng chứng.
- **Ép kiểu kiểu ngoặc nhọn `<never>x` nằm hoàn toàn ngoài lưới quét.** Chưa khai
  ở đâu. Đo trực tiếp: tiêm `const _y: number = <never>someIdentifier;` vào
  `mcp-server/src/recipes.test.ts` — bộ quét không thấy gì. Cú pháp này hợp lệ
  trong tệp `.ts` (đúng một trong hai tệp đích) và giặt kiểu y hệt `as never`.
  `.tsx` thì miễn nhiễm vì TypeScript cấm cú pháp ấy ở đó.
- **Bộ quét đỏ NHẦM trên một lời gọi nhiều đối số hợp lệ.** Đo trực tiếp:
  `resolveConfig(a as never, b)` bị tính là vi phạm vị-trí-giá-trị, vì sau
  `as never` là dấu phẩy chứ không phải `)`. Hiện chưa cắn ai (cả 7 chỗ đang dùng
  đều là đối số cuối), nhưng một lượt sau thêm tham số thứ hai cho `resolveConfig`
  sẽ làm cổng đỏ oan — đúng lớp rủi ro mà chính chú thích trong script cảnh báo:
  một phép đo đỏ oan là phép đo người ta sẽ tắt đi.
- **AC-4 chỉ ghim kiểu TRẢ VỀ, không ghim kiểu ĐỐI SỐ.** Bản sửa dùng
  `r.compile(ex as never)`, và chính `as never` ấy tắt mọi phép chấm hình dạng
  tham số. Điều này ĐÚNG hợp đồng (Out of scope khai rõ `compile: (params: never)`
  là contravariance có chủ đích) và AC-5b cũng cố ý tha vị trí đối số. Hệ quả phải
  nói ra: truyền một object sai hoàn toàn vào `compile()` sẽ KHÔNG có phép đo nào
  bắt được. Vòng 1 đã ghi giới hạn này; nó còn nguyên trên cây mã hôm nay.
- **E7 không nói gì về 17 ca không chạy.** Đo lại vòng này: 629 đạt / 17 bỏ qua /
  0 đỏ trên 646. Phép đo chỉ đòi `numFailedTests === 0` và mỗi tệp đích có ca đạt
  > 0, nên một ca `.skip` thêm vào ở nơi khác trong bộ sẽ không làm E7 đỏ. Có
  giảm nhẹ so với vòng 1: đọc thẳng báo cáo JSON cho thấy 17 ca ấy nằm ở bốn tệp
  khác (mcpProtocol, renderClip, renderFrame, stdioChannel) và KHÔNG ca nào thuộc
  hai tệp đích — hai tệp đích đạt trọn 2 và 40.
- **Chẩn đoán của `typecheck-both.ts` gây hiểu nhầm khi `tsc` không khởi chạy được.**
  Vòng này không dựng lại được cảnh ấy (npx trong worktree giải đúng `tsc` thật
  của thư mục cha), nhưng đường mã vẫn y nguyên: script gộp `stdout+stderr` rồi
  đếm dòng khớp `error TS`, nên một lần `npx` ngã sẽ in "0 dòng lỗi" kèm kết luận
  đỏ. Kết luận vẫn ĐÚNG (nó `AND` cả mã thoát lẫn số dòng lỗi, không fail-open),
  chỉ là log đọc dễ tưởng đỏ giả. Vòng 1 ghi giới hạn này; nó chưa được đóng.

## Ngoài hợp đồng

- Cả bốn phát hiện đầu ở `## Known limits` thuộc về THƯỚC ĐO
  (`_acceptance/typecheck-mock-signature/scripts/silencer-scan.ts`), không thuộc
  code sản phẩm. Không AC nào chấm chất lượng của chính thước đo, nên chúng không
  làm eval nào đỏ — nhưng chúng quyết định lượt sửa SAU có bị bắt hay không, nên
  người ở Cổng 2 nên đọc chúng như nợ kỹ thuật của cổng, không phải như chuyện bên lề.
- AC-5b và E8 được viết SAU vòng 1 và viết để đóng đúng một known-limit của vòng 1,
  bởi cùng phía đã viết bản sửa. Hồ sơ này vì thế đã tự tấn công E8 bằng mã tiêm
  thật vào tệp thật thay vì chỉ chạy fixture của tác giả; bốn phát hiện trên là
  kết quả của lượt tấn công ấy.
- Tại thời điểm chấm, cây mã sạch với git ngoại trừ
  `_acceptance/typecheck-mock-signature/run-log.jsonl` (` M`) — chính là tệp mà
  vòng chấm này ghi thêm vào theo thiết kế.

## Analyst

**Vì sao mọi con số ở đây là số mới.** Thước đo đã đổi giữa hai vòng: `silencer-scan.ts`
thêm nhánh `as never` theo vị trí, và hợp đồng thêm AC-5b. Bằng chứng vòng 1 vì
thế mô tả một thước không còn tồn tại. Năm lượt chạy của vòng này phủ tám eval
theo đúng hình dạng script quy định — E1/E2 chung một lượt `typecheck-both.ts`,
E3/E4 chung một lượt `type-probe.ts`, E5/E8 chung một lượt `silencer-scan.ts`.
Mọi lệnh đều chạy tới dòng tổng kết cuối của chính nó; không lệnh nào bị công cụ
giết.

**Baseline E1/E2 là số đo, không phải suy luận.** Dựng worktree tách rời tại mốc
so `54b5cb2` — đặt LỒNG trong `/Users/manhphan/dev/mapposter/.claude/worktrees/`
để phép giải `node_modules` leo lên được thư mục cha — rồi gọi thẳng
`node /Users/manhphan/dev/mapposter/node_modules/typescript/bin/tsc` bằng đường
dẫn tuyệt đối. Cây trước lượt sửa cho đúng 6 lỗi: 4 ở `MapView.test.tsx` (cặp
TS2352 + TS2493 tại dòng 68 và 78, khớp từng chữ với mô tả sự cố trong hợp đồng)
và 2 lỗi TS2352 ở `recipes.test.ts` (dòng 328, 356) — đúng phần mà `&&` đã che 5
ngày. Worktree đã gỡ bằng `git worktree remove --force`; `git worktree list` chỉ
còn ba mục ban đầu và cây chính không đổi.

**Đính chính vòng 1 về cái bẫy `npx`.** Vòng 1 ghi rằng worktree baseline không
giải được `node_modules` nên `npx` tải gói `tsc` mồi. Đo lại vòng này: bẫy ấy phụ
thuộc CHỖ ĐẶT worktree, không phải bản chất worktree — đặt lồng trong thư mục cha
thì `npx tsc --version` in `Version 6.0.3` và `require.resolve` trỏ đúng
`/Users/manhphan/dev/mapposter/node_modules/typescript`. Nghĩa là baseline cho
E3/E4 KHÔNG bị chặn bởi lý do vòng 1 nêu. Lý do thật khiến vòng này vẫn ghi `n-a`
khác hẳn và hẹp hơn: tại `54b5cb2` bản thân bộ đo CHƯA TỒN TẠI (các script được
thêm ở `9a63241`/`21a1bfc`), nên muốn đo phải cấy script mới vào cây cũ — thu được
một vật lai không phải cây cũ cũng không phải cây nay. Ghi `n-a` kèm lý do đúng
còn hơn ghi một con số không nói về vật nào cả. Cùng lý do ấy áp cho E5/E6/E7.

**E6/E7: vòng 1 ghi `green`, vòng này ghi `n-a`.** Không phải bất đồng về sự thật
mà về hạng bằng chứng. Sự thật nền đã kiểm lại độc lập:
`git diff --stat 54b5cb2 HEAD -- src/ mcp-server/src/` cho 2 tệp, 12 thêm / 6 xoá,
CẢ HAI đều là tệp test — không một dòng code sản phẩm nào đổi, và `vitest` không
typecheck. Suy ra E6/E7 hẳn đã xanh trên cây cũ. Nhưng đó là suy luận, vòng này
không chạy bộ test trên cây cũ, nên không ghi nó vào ô baseline như một số đo.
Điều đó không hạ giá E6: vai của nó là lan can chặn bản sửa TỆ (xoá thẳng
assertion cho hết đỏ), và ba mũi phá của nó đều đỏ đúng chỗ vòng này.

**E8 đã bị tấn công thật, không chỉ được chạy.** Ba mũi tự dựng, tiêm vào tệp đích
thật rồi hoàn nguyên (sha256 khớp bản gốc, `git status --porcelain` rỗng cho tệp
ấy sau mỗi mũi): (1) `const _x: number = someIdentifier as never;` → bộ quét
chuyển đỏ, nêu đúng nội dung dòng nhưng SAI số dòng (xem Known limits);
(2) `resolveConfig(a as never, b)` — cách dùng đối số hợp lệ — bị đỏ OAN;
(3) `<never>someIdentifier` và `(someIdentifier as never)` — hai dạng giặt kiểu
thật — đều LỌT, và dạng bọc ngoặc còn được cộng vào cột "hợp lệ". Một giả thuyết
của chính vòng chấm này đã bị bác bằng số: tôi ngờ mọi khoảng trắng sau `as never`
đều làm lọt, nhưng `\s*` tham lam nên `x as never ;` và `x as never // chú thích`
đều bị bắt đúng. Nói ra vì một suy luận sai được kiểm mới là cách phân biệt giới
hạn thật với giới hạn tưởng tượng.

**Chỗ mạnh thật của bộ này.** E3/E4 vẫn là hai eval duy nhất cắn đúng vào thứ lượt
sửa đã đổi, và cắn đúng chiều: nếu đối số bị nới về `any` thì không mũi nào đỏ.
Đối chứng "bản chép sạch" chạy TRƯỚC mỗi cặp mũi là chốt đặt đúng chỗ. E6 dựng tử
tế: hai mũi MapView nhắm hai assertion RIÊNG BIỆT nên xoá một trong hai vẫn bị
bắt, và neo phá đòi khớp đúng 1 lần. E7 vòng này chặt hơn vòng 1 nhờ đọc thẳng
báo cáo JSON: hai tệp đích không có ca bỏ qua nào.

## Variance

none — cả tám eval đều tất định, không eval nào khai `runs > 1`. Năm lượt chạy
phủ tám eval theo đúng hình dạng script (một script, hai nửa / hai tính chất).
Ba lượt tấn công E8 ở phần trên là kiểm tra độc lập của vòng chấm, không tính vào
số lượt của eval nào. Không lệnh nào bị công cụ giết; mọi lượt đều in tới dòng
tổng kết cuối của chính lệnh.

## Iterations

Round 1: Bảy eval máy, năm lượt chạy, 7/7 PASS. Baseline đo được thật cho E1/E2 (đỏ trên cây `54b5cb2` với đúng 6 lỗi như hợp đồng mô tả). E3/E4/E5 ghi `n-a`, E6/E7 ghi `green`. Bốn known-limit ghi lại, đáng chú ý nhất là `as never` nằm ngoài vũ trụ quét của AC-5. Verdict PASS.

Round 2: Người duyệt đòi đóng known-limit `as never`, nên thước đo đổi — `silencer-scan.ts` thêm nhánh phân biệt theo VỊ TRÍ, hợp đồng thêm AC-5b, bộ eval thêm E8. Vì thước đổi nên mọi số đo lấy lại từ đầu, không kế thừa: tám eval, năm lượt chạy, 8/8 PASS. Baseline E1/E2 đo lại và trùng vòng 1 (6 lỗi: 4 + 2); baseline E8 lấy được mới bằng cách tự tiêm mã nguy hiểm thật. Known-limit `as never` cũ ĐÃ ĐÓNG cho dạng thẳng, nhưng lượt tấn công độc lập vào E8 mở ra bốn giới hạn mới của chính bộ quét: số dòng in ra sai (lệch 11 vì bóc chú thích), dạng bọc ngoặc bị đếm nhầm vào cột hợp lệ, `<never>x` ngoài lưới quét, và một lời gọi nhiều đối số hợp lệ bị đỏ oan. Ba giới hạn vòng 1 còn lại vẫn còn nguyên. Cũng đính chính vòng 1: bẫy `npx` tải `tsc` mồi phụ thuộc chỗ đặt worktree, không phải bản chất worktree. Verdict PASS, cần người ký vì còn known-limit.
