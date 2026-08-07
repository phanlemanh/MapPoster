---
schema_version: 2
feature_slug: anchors-camera
verdict: REJECT
failed_evals: [E2, E5]
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9c1f9f367c642465cc720396f9b6aba51f31902f
human_signoff:
---

# Evidence Report: anchors-camera

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 1 — nghiệm thu lần đầu cho hợp đồng MỚI này, chạy ở `9c1f9f3` trên nhánh
`feat/anchors-camera`. Cả 20 eval đều được CHẠY THẬT (không eval nào suy ra từ eval khác).
Mọi lệnh đều thoát 0. **Nhưng thoát 0 không phải là tiêu chuẩn ở đây**: nhiệm vụ của vòng
này là kiểm xem mỗi dòng `expected` trong `evals.yaml` có ĐÚNG là thứ mà bộ test khẳng định
hay không. Hai eval nói quá phần mình chứng minh được, nên verdict là **REJECT** dù không
một lệnh nào đỏ._

## Hai eval bị đánh trượt

### E2 — "MỌI ca test dùng khung không vuông" là sai, và chính công cụ nói ngược lại

`expected` của E2 viết: *"I4 khẳng định anchors.ts KHÔNG chứa hệ số tỉ lệ chung, và **MỌI**
ca test dùng khung không vuông"*.

Nửa đầu đúng và có thật (`anchors-invariants.ts:202`). Nửa sau KHÔNG tồn tại như một khẳng
định. Script chỉ kiểm `discriminating.length > 0` — tức **ít nhất một** ca, không phải mọi
ca (`anchors-invariants.ts:213-219`). Và stdout của chính nó trong vòng này in ra:

```
ok   I4  4/6 ca test có cssW ≠ cssH (vd 1079×1921)
```

4 trên 6, không phải 6 trên 6. Ca vuông là `anchors.test.ts:79`
(`regionAnchorOf(0, [], { cssW: 100, cssH: 100 })`).

Nói rõ để người sửa khỏi sửa nhầm: **ca vuông đó hoàn toàn chính đáng** — nó kiểm vùng rỗng
trả `null`, độ vuông của khung không liên quan. Và tính chất mà AC-1 thật sự cần (tồn tại ca
phân biệt được) thì ĐANG được canh gác. Lỗi nằm ở **chữ trong `evals.yaml`**, không ở test.
Cách sửa rẻ nhất là đổi `expected` thành "≥1 ca test dùng khung không vuông"; cách đắt hơn là
siết script lại cho đúng chữ. Vòng chấm không tự sửa.

### E5 — nửa "giá trị đọc được" không được test nào khẳng định (chứng minh bằng đột biến)

`expected` của E5 viết: *"assertCameraAtRest NÉM khi camera lệch, thông điệp nêu **CẢ giá trị
đọc được LẪN** giá trị kỳ vọng"*.

Nửa "ném" có thật. Nửa "giá trị đọc được" thì không. Bộ test chỉ ghim **giá trị kỳ vọng**:
`toThrow(/13\.25/)` (`anchors.test.ts:152`) — `13.25` là `expected.zoom`. Giá trị ĐỌC ĐƯỢC
(`13.26`) không xuất hiện trong bất kỳ khẳng định nào; các khẳng định còn lại chỉ soi tên
trường (`/zoom/`, `/center/`, `/bearing/`, `/restAtSec/`).

Kiểm bằng đột biến trong thư mục tạm (KHÔNG sửa repo): chép `anchors.ts` + `anchors.test.ts`
ra ngoài, bỏ `${actual.*}` khỏi cả ba thông điệp — giữ nguyên phần `${expected.*}`:

```
  if (Math.abs(actual.zoom - expected.zoom) > EPS) problems.push(`zoom differs from expected ${expected.zoom}`);
```

Chạy `npx vitest run --root <mutant>`:

```
 Test Files  1 passed (1)
      Tests  13 passed (13)
```

13/13 vẫn xanh sau khi mã nguồn thôi in giá trị đọc được. Nghĩa là clause đó **không có
đường đỏ** — đúng lớp lỗi mà hai vòng trước đã bắt được. Người đọc log sản xuất sẽ không biết
camera lệch bao nhiêu, mà không test nào kêu.

(Đối chứng dương cho chính bộ đột biến: xem E1 dưới đây — cùng cỗ máy, cùng thư mục tạm, khi
đột biến vào đúng công thức thì 4 ca đỏ ngay. Nên "13/13 xanh" ở trên là kết luận về độ phủ,
không phải triệu chứng của một harness hỏng.)

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
✓ 1 [chromium] › NEG-E8: một anchors() có jumpTo LÀM LỆCH byte khung đuôi (phép so của E8 phân biệt được) (3.0s)
  1 passed (4.1s)
```

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
| E2 | AC-1 | script | FAIL — `expected` nói "MỌI ca test dùng khung không vuông"; script chỉ khẳng định ≥1 và tự in "4/6" |
| E3 | AC-2 | test | PASS |
| E4 | AC-3 | test | PASS |
| E5 | AC-4 | test | FAIL — nửa "giá trị đọc được" không có khẳng định nào; đột biến bỏ nó đi vẫn 13/13 xanh |
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
  run_id: anchors-camera-r1-anchors-20260807
  exit_code: 0
  baseline: n-a (tệp test mới trong PR này — trên diffBase không tồn tại phép đo nào để so)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T04:50:48Z
  output: |
    npx vitest run src/render/anchors.test.ts — Test Files 1 passed (1); Tests 13 passed (13).
    Khung dùng trong file: 1079x1921, 600x1200, 400x800, 1000x2000 — không cái nào vuông.
    Thay cho baseline: đột biến trực tiếp (bản chép ngoài repo) đổi yPct sang mẫu số cssW →
    Tests 4 failed | 9 passed (13). Khẳng định phân biệt được.

- eval: E2
  run_id: anchors-camera-r1-anchors_invariants-20260807
  exit_code: 0
  verdict: FAIL
  baseline: n-a (script mới trong PR này)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T04:50:49Z
  output: |
    Lệnh thoát 0, nhưng `expected` nói quá. Stdout: "ok I4 anchors.ts KHÔNG có hệ số tỉ lệ
    chung: true" (nửa đầu ĐÚNG) và "ok I4 4/6 ca test có cssW != cssH (vd 1079x1921)" —
    4/6, trong khi `expected` viết "MỌI ca test dùng khung không vuông". Mã nguồn của chốt
    là `discriminating.length > 0` (anchors-invariants.ts:213), tức ≥1 chứ không phải mọi.
    Ca vuông là anchors.test.ts:79 và nó chính đáng (kiểm vùng rỗng trả null). Sai ở chữ
    trong evals.yaml, không ở test.

- eval: E3
  run_id: anchors-camera-r1-anchors-20260807
  exit_code: 0
  baseline: n-a (tệp test mới)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T04:50:48Z
  output: |
    Cùng lần chạy E1. anchors.test.ts:37-50 — khung 400x800: điểm x=-40 cho onScreen=false
    NHƯNG xPct=-10, yPct=50 vẫn được trả; điểm y=1200 cho yPct=150. Ca đúng mép (0, 800)
    khẳng định onScreen=true. Phần trăm không bị nuốt, đúng như AC-2 đòi.

- eval: E4
  run_id: anchors-camera-r1-anchors-20260807
  exit_code: 0
  baseline: n-a (tệp test mới)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T04:50:48Z
  output: |
    Cùng lần chạy E1. anchors.test.ts:58-81 — khung 1000x2000, bốn đỉnh (100,200)-(300,600):
    bboxPct toEqual([10, 10, 30, 30]) đúng cực trị, centroidPct toEqual([20, 20]) nằm trong
    bbox. Vùng rỗng: regionAnchorOf(0, [], ...) toBeNull() — không bịa hộp rỗng ở gốc.

- eval: E5
  run_id: anchors-camera-r1-anchors-20260807
  exit_code: 0
  verdict: FAIL
  baseline: n-a (tệp test mới)
  verifier: config:executors.test.anchors
  verified_at: 2026-08-07T04:50:48Z
  output: |
    Lệnh thoát 0, nhưng nửa sau của `expected` không được canh gác. Nửa "NÉM" có thật
    (anchors.test.ts:146-153 khẳng định toThrow(/restAtSec/), /zoom/, /center/, /bearing/).
    Nửa "thông điệp nêu CẢ giá trị đọc được" thì không: khẳng định số duy nhất là
    toThrow(/13\.25/) — 13.25 là expected.zoom, không phải actual.zoom (13.26). Đột biến
    ngoài repo bỏ mọi ${actual.*} khỏi ba thông điệp: npx vitest run --root <mutant> cho
    Test Files 1 passed (1); Tests 13 passed (13) — không ca nào đỏ. Clause không có
    đường đỏ.

- eval: E6
  run_id: anchors-camera-r1-e2e-20260807
  exit_code: 0
  baseline: n-a (ca e2e mới)
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T04:51:09Z
  output: |
    npm run test:e2e — 18 passed (1.0m). Ca "anchors: NỔ TO khi camera không ở restAtSec"
    (render-mode.spec.ts:305): sau renderMotionFrame(1.4), chèn setCamera({center:[0,0],
    zoom:3}), rồi gọi anchors() trong try/catch; nếu không ném thì trả chuỗi 'KHÔNG NÉM',
    chuỗi đó không khớp /restAtSec/ nên ca sẽ đỏ. Khẳng định: message toMatch(/restAtSec/)
    và toMatch(/zoom|center/). Trên MapLibre thật, không phải giả lập.

- eval: E7
  run_id: anchors-camera-r1-anchors_invariants-20260807
  exit_code: 0
  baseline: n-a (script mới)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T04:50:49Z
  output: |
    Cùng lần chạy E2. I5 trích được thân anchors() (1744 ký tự) rồi soi bảy cấm: jumpTo,
    gán restBase, gán animBase, gán lastApplied*, setData, setPaintProperty, await — cả
    bảy đều "KHÔNG chứa: true". Thêm chốt khoảng đệm: giữa lần chụp settle và lời gọi
    anchors() trong renderFrame.ts không có lượt vào trang nào (869 ký tự đệm, đã bỏ chú
    thích trước khi soi).

- eval: E8
  run_id: anchors-camera-r1-e2e-20260807
  exit_code: 0
  baseline: n-a (ca e2e mới)
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T04:51:09Z
  output: |
    Cùng lần chạy E6. Ca "anchors: CHỈ ĐỌC — gọi nó xong, khung đuôi vẫn byte-identical"
    (render-mode.spec.ts:287): renderMotionFrame(1.4) → anchors() → renderMotionFrame(1.4),
    khẳng định expect(after).toBe(before) trên dataUrl. Nửa suppression này ĐỎ ĐƯỢC —
    xem đối chứng âm NEG-E8 ở khối riêng bên dưới.

- eval: NEG-E8
  run_id: anchors-camera-r1-negctrl-20260807
  exit_code: 0
  baseline: n-a (đối chứng âm do vòng chấm viết, không phải eval của hợp đồng)
  verifier: npx playwright test --config=_acceptance/anchors-camera/negctrl/playwright.negctrl.config.ts
  verified_at: 2026-08-07T04:59:30Z
  output: |
    Đối chứng âm cho E8, mã ở _acceptance/anchors-camera/negctrl/anchors-negctrl.spec.ts
    (KHÔNG sửa tệp nào của sản phẩm). Chèn __map.jumpTo({center:[106.75,10.82],zoom:13})
    giữa hai lần renderMotionFrame(1.4) — thẳng vào MapLibre, không qua setCamera, để
    restBase còn trong cache đúng như một anchors() hư hỏng sẽ để lại. Khẳng định
    expect(after).not.toBe(before): 1 passed (4.1s). Byte LỆCH thật khi camera bị dời,
    nên phép so của E8 phân biệt được.

- eval: E9
  run_id: anchors-camera-r1-render_frame-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.render_frame
  verified_at: 2026-08-07T04:50:50Z
  output: |
    npx vitest run mcp-server/src/renderFrame.test.ts — Test Files 1 passed (1); Tests 3
    passed | 3 skipped (6). Ba ca chạy là khối "trang giả" KHÔNG bị gate (ba ca bỏ qua là
    khối integration sau MCP_INTEGRATION=1). Khối trang giả đếm lời gọi thật:
    calls.anchors++ bên trong __mapposter.anchors. pitch 30 → expect(calls.anchors).toBe(0)
    kèm frames dài 4 và calls.motionFrames toBe(5) (4 khung + settle); pitch 0 →
    expect(calls.anchors).toBe(1) làm đối chứng dương. Quan sát LỜI GỌI, không phải
    quan sát "không ném".

- eval: E10
  run_id: anchors-camera-r1-e2e-20260807
  exit_code: 0
  baseline: n-a (ca e2e mới)
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T04:51:09Z
  output: |
    Cùng lần chạy E6. Ca "anchors: pitch != 0 — KHUNG VẪN RENDER" (render-mode.spec.ts:326):
    __map.getPitch() toBeCloseTo(45, 6) đọc từ MapLibre thật; mid và rest đều
    startsWith('data:image/png'); rest.length toBeGreaterThan(2000); rest not.toBe(mid);
    rồi message toMatch(/pitch/i) và /45/. Ghi chú độ phủ ở mục trên: kiểm ở mức chuỗi
    data-URL, sàn kích thước chỉ áp cho rest — nửa byte-thật do E11 gánh.

- eval: E11
  run_id: anchors-camera-r1-mcp-20260807
  exit_code: 0
  baseline: n-a (ca mới trong bộ có gác)
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T04:52:19Z
  output: |
    npm run test:mcp (MCP_INTEGRATION=1, vite build production + Chromium thật) — Test
    Files 3 passed (3); Tests 12 passed (12); 69.93s. Ca "pitch != 0: clip VẪN render đủ
    khung + settle" (renderClip.test.ts): frames toHaveLength(24) = 12fps x 2s, rồi VÒNG
    LẶP khẳng định f.subarray(0,8) toEqual Buffer([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,
    0x0a]) cho TỪNG khung, cộng cùng phép ấy cho settle. anchors toBeUndefined();
    anchorsUnavailable toMatch(/pitch/i) và /45/. Đây là chỗ "PNG thật" được kiểm ở mức
    byte giải mã, không phải mức chuỗi.

- eval: E12
  run_id: anchors-camera-r1-anchors_invariants-20260807
  exit_code: 0
  baseline: n-a (script mới)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T04:50:49Z
  output: |
    Cùng lần chạy E2. I3 GỌI THẬT: await import('mcp-server/src/tools.ts') rồi chạy
    resolvedOfClip(probeCfg, outcome) cho hai nhánh. Stdout: "resolvedOfClip(đo được) phát
    ra ĐÚNG MỘT: anchors=true, anchorsUnavailable=false" và "resolvedOfClip(không đo được)
    phát ra ĐÚNG MỘT: anchors=false, anchorsUnavailable=true", cộng hai dòng "camera đi
    cùng anchors" (true / false). Không phải regex — khẳng định là hasAnchors !== hasReason
    trên giá trị trả về thật. Ba bề mặt cũng được đếm: mỗi bề mặt 3 lối ra dùng
    resolvedOfClip(cfg, clipOut), 1 lời gọi deps.renderClip, 1 chỗ giữ NGUYÊN outcome,
    tháo rời=false, và 0 lối ra còn dùng resolvedOf(cfg) trần.

- eval: E13
  run_id: anchors-camera-r1-clip_tools-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T04:50:51Z
  output: |
    npx vitest run mcp-server/src/tools.test.ts — Test Files 1 passed (1); Tests 59 passed
    (59). Nhánh CÓ anchors phủ cả ba lối ra: thành công, degrade (encodeAnimation ném
    'ffmpeg boom'), và từ chối quá cỡ (MAPPOSTER_CLIP_MAX_BYTES=2 → ok toBe(false)) — mỗi
    lối ra khẳng định resolved.camera.zoom và resolved.anchors.points. Nhánh KHÔNG đo được
    phủ hai lối ra (thành công + degrade), mỗi lối ra khẳng định anchorsUnavailable toBe
    REASON cộng 'anchors' in resolved toBe(false) và 'camera' in resolved toBe(false).
    Ghi chú: lối ra quá cỡ chưa có ca ở nhánh anchorsUnavailable; bất biến XOR ở mức hàm
    do I3 (E12) gánh cho cả ba.

- eval: E14
  run_id: anchors-camera-r1-clip_http-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T04:50:53Z
  output: |
    npx vitest run mcp-server/src/http.test.ts — Test Files 1 passed (1); Tests 57 passed
    (57). Ca "resolved mang camera + anchors trên CẢ BA lối ra: 200, degrade encode, và 422
    quá cỡ" khẳng định đủ ba, kèm nửa should-NOT thật:
    expect(okBody.resolved?.camera?.zoom).not.toBe(okBody.resolved?.zoom). Ca thứ hai
    khẳng định nhánh không đo được: status 200, clip.format 'mp4' (pitch không làm hỏng
    clip), anchorsUnavailable toBe REASON, và cả 'anchors' lẫn 'camera' đều không có mặt.

- eval: E15
  run_id: anchors-camera-r1-job_runner-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.job_runner
  verified_at: 2026-08-07T04:50:54Z
  output: |
    npx vitest run mcp-server/src/jobRunner.test.ts — Test Files 1 passed (1); Tests 25
    passed (25). Đúng lớp lỗi mà hợp đồng nêu (jobRunner đã hai lần dùng sai biến): ca
    "mỗi việc mang anchors + camera của CHÍNH nó" chạy hai việc a và b với toạ độ khác
    nhau (108.44/11.94 vs 109.19/12.24) và khẳng định từng việc trả đúng toạ độ của mình —
    một lời gọi dùng nhầm biến của việc trước sẽ đỏ. Cộng ca nhánh anchorsUnavailable
    (việc VẪN xong, artifacts ['clip','settle'], không có anchors lẫn camera) và ca
    degrade + quá cỡ vẫn mang camera + anchors.

- eval: E16
  run_id: anchors-camera-r1-clip_tools-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T04:50:51Z
  output: |
    Cùng lần chạy E13. Chốt "không echo cfg.camera" là thật và có răng: fakeAnchors() dẫn
    xuất camera từ cfg với zoom + 1 (tools.test.ts:54), nên nếu ai đó trả lại cfg.camera
    cho tiện thì resolved.camera.zoom sẽ bằng resolved.zoom và khẳng định
    expect(j.resolved.camera.zoom).not.toBe(j.resolved.zoom) đỏ ngay. Nửa "vắng cùng nhau"
    do ca resolvedOfClip nhánh không đo được gánh: 'camera' in r toBe(false).

- eval: E17
  run_id: anchors-camera-r1-clip_tools-20260807
  exit_code: 0
  baseline: n-a (khối test mới)
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-07T04:50:51Z
  output: |
    Cùng lần chạy E13. j.resolved.anchors.points toEqual([{index: 0, lng: 106.7, lat:
    10.78, xPct: 50, yPct: 50, onScreen: true}]) và j.resolved.highlights.points
    toHaveLength(1); khối resolved cũ không bị nuốt (j.resolved.place toBeDefined).
    Ghi chú độ phủ ở mục trên: tương ứng một-một chỉ được thử ở n=1; thứ tự ở n=2 được
    chứng minh gián tiếp ở e2e nhưng không đối chiếu sang highlights.points.

- eval: E18
  run_id: anchors-camera-r1-anchors_invariants-20260807
  exit_code: 0
  baseline: n-a (script mới)
  verifier: config:executors.script.anchors_invariants
  verified_at: 2026-08-07T04:50:49Z
  output: |
    Cùng lần chạy E2. I1: "t3_path untouched vs 972a1e4f (19 file đổi)" — src/lib/export.ts
    và src/lib/mapStyle.ts đúng 0 dòng đổi so với merge-base, nên xếp T2 là đúng. I2: bốn
    dòng ok — không tệp nào nhắc anchorsAt (đã bỏ chú thích trước khi soi, nên chính lời
    giải thích trong doc không tự biến thành vi phạm), MapPosterApi.anchors khai báo KHÔNG
    tham số, hiện thực cũng KHÔNG tham số, và cả 5 lời gọi anchors() trong repo đều rỗng.

- eval: E19
  run_id: anchors-camera-r1-text_free-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-07T04:50:55Z
  output: |
    npx vitest run src/lib/export.test.ts src/lib/mapStyle.test.ts — Test Files 2 passed
    (2); Tests 19 passed (19), 0 bỏ qua. Bộ không rỗng và không bị bỏ qua toàn phần (đó là
    kiểu thoát-0-vô-nghĩa duy nhất đáng lo ở một nửa suppression). Xanh trên cả hai phía
    theo thiết kế — hai t3_path không có dòng nào đổi, nên eval này chứng minh "không đụng
    vào", không chứng minh gì về gói này. Sức nặng thật của AC-10 nằm ở E18/I1.

- eval: E20
  run_id: anchors-camera-r1-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
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

none — mọi lệnh vòng này đều tất định, chạy một lần, không lệnh nào đi qua
`ctx.providers.invoke` hay một bộ sinh LLM.

## Iterations

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
