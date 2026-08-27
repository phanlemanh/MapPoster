---
schema_version: 2
feature_slug: typecheck-mock-signature
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: ab0a1f595899811655151255549786fbdc8f87d6
human_signoff:
---

# Evidence Report: typecheck-mock-signature

Round 1 — bảy eval máy, tất cả chạy trọn, không lệnh nào bị công cụ giết. Năm lượt
chạy phủ bảy eval: E1/E2 dùng chung một lượt `typecheck-both.ts` (đọc theo hai tính
chất khác nhau), E3/E4 dùng chung một lượt `type-probe.ts` (hai nửa của cùng script).

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | script | PASS |
| E2 | AC-2 | script | PASS |
| E3 | AC-3 | script | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-5 | script | PASS |
| E6 | AC-6 | script | PASS |
| E7 | AC-7 | script | PASS |

## Evidence

- eval: E1
  run_id: typecheck-mock-signature-e1-20260827044942
  exit_code: 0
  baseline: red
  verifier: config:executors.script.typecheck_both
  verified_at: 2026-08-27T04:49:42Z
  output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ

- eval: E2
  run_id: typecheck-mock-signature-e2-20260827044942
  exit_code: 0
  baseline: red
  verifier: config:executors.script.typecheck_both
  verified_at: 2026-08-27T04:49:42Z
  output: |
    PASS  project web (tsconfig.app.json + node) — `npx tsc -b --force` mã thoát 0, 0 dòng lỗi
    PASS  project mcp-server — `npx tsc -p mcp-server/tsconfig.json` mã thoát 0, 0 dòng lỗi

    OK — 0/2 project đỏ
    (chiều đọc riêng của E2: CẢ HAI project đều có dòng kết quả của chính nó —
    hai lệnh chạy RỜI, không project nào vắng mặt sau lưng `&&`)

- eval: E3
  run_id: typecheck-mock-signature-e3-20260827044956
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mock_type_probe
  verified_at: 2026-08-27T04:49:56Z
  output: |
    === AC-3 MapView.test.tsx — đối số mock chấm theo BuildStyleArgs ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap KHÔNG phải number (kiểu hẹp thật, không phải any)» → đỏ TS2322 tại __typeprobe__.probe.tsx (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên BuildStyleArgs phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.tsx (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: src/components/__typeprobe__.probe.tsx

- eval: E4
  run_id: typecheck-mock-signature-e4-20260827044956
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mock_type_probe
  verified_at: 2026-08-27T04:49:56Z
  output: |
    === AC-4 recipes.test.ts — compile() giữ kiểu trả về CompiledRecipeCall ===
    PASS  đối chứng: bản chép sạch không sinh lỗi nào (0 dòng lỗi)
    PASS  mũi «basemap là union hẹp, gán vào number phải đỏ» → đỏ TS2322 tại __typeprobe__.probe.ts (bắt được: TS2322)
    PASS  mũi «field không tồn tại trên CompiledRecipeCall phải bị bắt» → đỏ TS2339 tại __typeprobe__.probe.ts (bắt được: TS2339)
    PASS  tệp thăm dò đã dọn: mcp-server/src/__typeprobe__.probe.ts

    OK — 0 khẳng định đỏ

- eval: E5
  run_id: typecheck-mock-signature-e5-20260827045003
  exit_code: 0
  baseline: n-a
  verifier: config:executors.script.mock_silencer_scan
  verified_at: 2026-08-27T04:50:03Z
  output: |
    PASS  đối chứng dương: fixture 4 mẫu → bắt 4 (as any, @ts-expect-error, @ts-ignore, as unknown as)
    PASS  đối chứng âm: fixture sạch → bắt 0 (phải là 0)
    mốc so: 54b5cb263259bc8ebe0ef5d20960b82b369b1f6e
    PASS  src/components/MapView.test.tsx: có 10 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  src/components/MapView.test.tsx: dòng thêm không mẫu bịt miệng nào (sạch)
    PASS  mcp-server/src/recipes.test.ts: có 2 dòng THÊM để quét (0 dòng = không đo được gì)
    PASS  mcp-server/src/recipes.test.ts: dòng thêm không mẫu bịt miệng nào (sạch)

    OK — 0 khẳng định đỏ

- eval: E6
  run_id: typecheck-mock-signature-e6-20260827045013
  exit_code: 0
  baseline: green
  verifier: config:executors.script.mock_mutation_probe
  verified_at: 2026-08-27T04:50:13Z
  output: |
    PASS  đối chứng nền: src/components/MapView.test.tsx xanh khi chưa phá gì
    PASS  đối chứng nền: mcp-server/src/recipes.test.ts xanh khi chưa phá gì
    PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng (mũi 1: ép basemap về 'vector' — test đỏ đúng như mong đợi)
    PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng
    PASS  src/components/MapView.test.tsx ĐỎ khi code sản phẩm hỏng (mũi 2: nuốt satelliteTiles — test đỏ đúng như mong đợi)
    PASS  src/components/MapView.tsx đã hoàn nguyên đúng nguyên trạng
    PASS  mcp-server/src/recipes.test.ts ĐỎ khi code sản phẩm hỏng (mũi 3: mặc định area-overview về 'satellite' — test đỏ đúng như mong đợi)
    PASS  mcp-server/src/recipes.ts đã hoàn nguyên đúng nguyên trạng
    PASS  git thấy code sản phẩm sạch sau mọi mũi (không vết)

    OK — 0 khẳng định đỏ

- eval: E7
  run_id: typecheck-mock-signature-e7-20260827045034
  exit_code: 0
  baseline: green
  verifier: config:executors.script.mock_no_regression
  verified_at: 2026-08-27T04:50:34Z
  output: |
    PASS  toàn bộ bộ test đơn vị xanh (mã thoát 0)
    PASS  có báo cáo máy-đọc-được: /var/folders/.../accept-dHT3QY/vitest.json
    PASS  0 ca đỏ (629 đạt / 646 tổng)
    PASS  src/components/MapView.test.tsx: 2 ca đạt, 0 ca đỏ (đòi đạt > 0)
    PASS  mcp-server/src/recipes.test.ts: 40 ca đạt, 0 ca đỏ (đòi đạt > 0)

    OK — 0 khẳng định đỏ

## Known limits

- **AC-4 chỉ ghim kiểu TRẢ VỀ, không ghim kiểu ĐỐI SỐ.** Bản sửa dùng
  `r.compile(ex as never)`, và chính `as never` ấy tắt mọi phép chấm hình dạng
  tham số. Điều này ĐÚNG hợp đồng (Out of scope khai rõ `compile: (params: never)`
  là contravariance có chủ đích), và `silencer-scan.ts` cố ý xếp `as never` ra
  ngoài bốn mẫu bịt miệng — fixture sạch của nó nêu đích danh dòng
  `return r.compile(ex as never);`. Hệ quả phải nói ra: truyền một object sai
  hoàn toàn vào `compile()` sẽ KHÔNG có phép đo nào bắt được. E4 chứng minh
  `CompiledRecipeCall` còn nguyên ở đầu ra, không chứng minh gì ở đầu vào.
- **`as never` nằm ngoài vũ trụ quét của E5.** Bốn mẫu được quét là `as any`,
  `@ts-expect-error`, `@ts-ignore`, `as unknown as`. Một lượt sửa sau dùng
  `as never` để bịt một lỗi kiểu thật sẽ đi lọt AC-5. Đây là đánh đổi có chủ
  đích của hồ sơ này, không phải sót — nhưng nó là một lối đi bỏ ngỏ cho lượt sau.
- **E7 không nói gì về 17 ca không chạy.** Báo cáo ghi 629 đạt / 646 tổng; phần
  chênh là ca `skip`/`todo`. Phép đo chỉ đòi `numFailedTests === 0` và mỗi tệp
  đích có số ca đạt > 0, nên một ca bị `.skip` thêm vào ở đâu đó trong bộ sẽ
  không làm E7 đỏ. Hai tệp đích thì có số ca cụ thể (2 và 40) nên được canh chặt
  hơn phần còn lại của bộ.
- **Chẩn đoán của `typecheck-both.ts` gây hiểu nhầm khi `tsc` không khởi chạy được.**
  Quan sát trực tiếp trong lúc dựng baseline: khi `npx` không giải được `tsc`,
  script in `FAIL ... 0 dòng lỗi` — kết luận FAIL vẫn ĐÚNG (nó `AND` cả mã thoát
  lẫn số dòng lỗi, nên không fail-open), nhưng người đọc log thấy "0 dòng lỗi"
  dễ tưởng là đỏ giả. Script chưa phân biệt "trình biên dịch chạy và tìm thấy 0
  lỗi" với "trình biên dịch không chạy được".

## Ngoài hợp đồng

- `_acceptance/config.yaml` đang ở trạng thái đã sửa nhưng chưa commit (` M`), và
  cả thư mục `_acceptance/typecheck-mock-signature/` còn là untracked. Đây là hạ
  tầng đo, không phải code sản phẩm; ghi lại để người ở Cổng 2 biết bộ đo của
  chính hồ sơ này chưa nằm trong lịch sử git tại thời điểm chấm.
- Dòng E6 trong bản tóm tắt giao việc cho vòng verify này ghi đường dẫn
  `scripts/mock-mutation-probe.ts`; giá trị THẬT trong `config.yaml`
  (`executors.script.mock_mutation_probe`) là `scripts/mutation-probe.ts`. Đã
  chạy theo config, không theo bản tóm tắt.

## Analyst

**Baseline lấy được thật cho E1/E2, và chúng phân biệt được.** Dựng worktree tách
rời tại mốc so `54b5cb2` (merge-base của HEAD với `origin/main`) rồi chấm hai
project: cây trước lượt sửa cho đúng 6 lỗi — 4 lỗi ở `src/components/MapView.test.tsx`
(cặp TS2352 + TS2493 tại dòng 68 và 78, khớp từng chữ với mô tả sự cố trong hợp
đồng) và 2 lỗi TS2352 ở `mcp-server/src/recipes.test.ts`. Hai lỗi mcp-server ấy
chính là phần mà `&&` của bước CI đã che 5 ngày. Nên `baseline: red` của E1/E2 là
số đo, không phải suy luận.

**E6 và E7 XANH trên cây cũ — chúng chứng minh bộ đo, không chứng minh bản sửa.**
Sự thật nền: lượt sửa này chạm ĐÚNG hai tệp test (`git diff --stat 54b5cb2 HEAD`
→ 2 files, 12 insertions, 6 deletions), không một dòng code sản phẩm nào. E6 phá
code sản phẩm rồi đòi test đỏ; E7 đòi cả bộ xanh. Cả hai phép đo ấy không đọc
thứ mà lượt sửa đã đổi, và `vitest` không typecheck nên 6 lỗi kiểu của cây cũ
không hề làm bộ test đỏ. Kết luận: trên cây cũ E6 và E7 đều xanh. Chúng là lan
can chặn một bản sửa TỆ (xoá thẳng assertion cho hết đỏ), không phải thước phân
biệt bản sửa TỐT đang xét. Người ở Cổng 2 nên đọc E6 đúng vai đó.

**E3/E4 ghi `n-a` vì lý do hạ tầng, không phải vì ngại đo.** `type-probe.ts` gọi
`npx tsc`, mà worktree baseline nằm ngoài cây repo thật nên không có `node_modules`
nào giải được từ nó (dependency của repo này sống ở thư mục CHA
`/Users/manhphan/dev/mapposter/node_modules`, không nằm trong worktree). `npx` khi
đó tải nhầm gói `tsc` mồi trên registry và in "This is not the tsc command you are
looking for" — tức mọi con số thu được sẽ là đỏ giả. Lấy baseline cho E1/E2 được
là nhờ gọi thẳng binary `typescript/bin/tsc` bằng đường dẫn tuyệt đối, cách đó
không áp dụng được cho script đã ghim `npx` bên trong. Không sửa script của người
khác giữa vòng chấm, nên ghi `n-a` thay vì bịa. E5 cũng `n-a`: trên cây baseline
thì `HEAD == BASE`, số dòng thêm bằng 0, và chốt tự-canh `added.length > 0` sẽ
làm script đỏ vì "không đo được gì" — một con số đỏ vô nghĩa, không phải phân biệt.

**Chỗ mạnh thật của bộ này.** E3/E4 là hai eval duy nhất cắn đúng vào thứ lượt sửa
đã đổi, và chúng cắn đúng chiều: `any` thì không mũi nào đỏ, `unknown` thì mũi
TS2322 không đỏ (đọc property trên `unknown` cho TS18046 chứ không cho TS2339).
Đối chứng "bản chép sạch" chạy TRƯỚC mỗi cặp mũi là chốt đúng chỗ — thiếu nó thì
6 lỗi sẵn có của cây cũ sẽ bị đọc nhầm thành "mũi đã đỏ". E6 cũng dựng tử tế: hai
mũi MapView nhắm hai assertion RIÊNG BIỆT (mũi 1 ↔ `arg.basemap`, mũi 2 ↔
`arg.satelliteTiles`), nên xoá một trong hai assertion vẫn bị bắt; và neo phá đòi
khớp đúng 1 lần, khớp 0 hoặc 2 là FAIL chứ không im lặng bỏ qua.

**Đã kiểm độc lập sau E6:** `git status --porcelain src/ mcp-server/src/` rỗng —
ba mũi phá đều hoàn nguyên sạch, không phải chỉ tin lời script tự khai. Worktree
baseline đã gỡ (`git worktree remove --force`), cây chính không đổi so với lúc
bắt đầu vòng chấm.

## Variance

none — cả bảy eval đều tất định (không eval nào khai `runs > 1`). Năm lượt chạy
phủ bảy eval: E1/E2 dùng chung một lượt `typecheck-both.ts` và E3/E4 dùng chung
một lượt `type-probe.ts`, đúng như hình dạng script quy định (một script, hai nửa
/ hai tính chất). Không lệnh nào bị công cụ giết; mọi lượt đều chạy tới dòng tổng
kết cuối của chính lệnh.

## Iterations

Round 1: Bảy eval máy, năm lượt chạy, 7/7 PASS. Baseline đo được thật cho E1/E2 (đỏ trên cây `54b5cb2` với đúng 6 lỗi như hợp đồng mô tả — 4 ở MapView.test.tsx, 2 ở recipes.test.ts sau lưng `&&`). E3/E4/E5 ghi `n-a` vì worktree baseline không giải được `node_modules` (dependency sống ở thư mục cha) và vì mốc so của E5 tự triệt tiêu trên chính cây baseline. E6/E7 ghi `green` — lượt sửa chỉ chạm hai tệp test nên hai phép đo ấy vốn đã xanh trên cây cũ; chúng là lan can, không phải thước phân biệt. Bốn known-limit ghi lại, đáng chú ý nhất là `as never` ở đầu vào `compile()` nằm ngoài cả AC-4 lẫn vũ trụ quét của AC-5. Verdict PASS.
