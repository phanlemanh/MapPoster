---
schema_version: 1
feature: Khai đúng chữ ký mock thay vì ép kiểu che lỗi đọc ngoài biên
slug: typecheck-mock-signature
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
approved_by:
approved_at:
veto_state: mo
veto_opened_at: 2026-08-27T04:41:00Z
---

# Acceptance Contract: typecheck-mock-signature

## Context

CI job `test` đỏ từ 2026-08-22 (run 32568188595) và chặn mọi PR. Bước Typecheck
ngã ở `npx tsc -b` với đúng 4 lỗi, tất cả trong `src/components/MapView.test.tsx`
— hai cặp TS2352 + TS2493 ở dòng 68 và 78.

Bốn lỗi là MỘT khuyết tật, và nó nằm ở chỗ **khai**: `vi.fn(() => ...)` truyền
cho `vi.fn` một cài đặt KHÔNG tham số, nên TypeScript suy ra `Mock<() => ...>`
và `mock.calls` mang kiểu `[][]` — mảng của tuple **rỗng**. `calls[0][0]` khi đó
là đọc **ngoài biên thật** (TS2493), và giá trị `undefined` chỉ đi lọt được nhờ
một phép ép kiểu tay (TS2352).

Điều nguy hiểm phải giữ: cách chữa rẻ nhất — `as any`, `@ts-expect-error`, hay
nới kiểu về `unknown` — làm typecheck xanh mà **biến một phép đo thành phép đo
giả**. Hợp đồng này tồn tại để chốt rằng lần chữa ấy KHÔNG xảy ra: assertion sau
khi chữa phải còn cắn đúng thứ nó định chấm.

Source input: prompt của người dùng trong phiên 2026-08-27, nêu sẵn ràng buộc —
typecheck sạch, `npm test` xanh, KHÔNG làm assertion yếu đi, KHÔNG dùng `as any`
hay `@ts-expect-error`, sai chỗ khai thì sửa chỗ khai, và phá code sản phẩm một
lần để chắc test đỏ được.

**Ghi để người đọc biết mà trừ hao:** hợp đồng này viết SAU khi mã đã sửa
(commit `ab0a1f5`) — kho đòi artifacts để gỡ chốt T1-escape. Tiêu chí dưới đây
rút từ ràng buộc người dùng nêu TRƯỚC lúc sửa (xem Source input), không rút từ
thứ đã dựng; nhưng thứ tự ấy là thứ người duyệt có quyền nghi ngờ, nên nó được
nói ra ở đây thay vì giấu đi.

## Criteria

- AC-1: Given cây mã hiện tại, When chạy `npx tsc -b --force` **và**
  `npx tsc -p mcp-server/tsconfig.json`, Then cả hai thoát 0 và không in dòng
  lỗi nào. Phải là `--force`: `tsc -b` đọc `tsbuildinfo`, nên một lượt chạy tăng
  dần có thể báo sạch mà chưa hề chấm lại tệp nào.
- AC-2: Given bước Typecheck của CI nối hai lệnh bằng `&&`, When lệnh đầu ngã,
  Then lệnh sau KHÔNG chạy — nên phép đo AC-1 phải chấm **cả hai project một
  cách độc lập**, không được để `&&` che vế sau. Đây chính là lớp lỗi đã giấu 2
  lỗi ở `mcp-server/src/recipes.test.ts` suốt 5 ngày trong khi báo cáo chỉ thấy 4.
- AC-3: Given `src/components/MapView.test.tsx` sau khi chữa, When đọc
  `buildMapStyle.mock.calls[0][0]`, Then đối số ấy được TypeScript chấm theo
  giao diện THẬT `BuildStyleArgs` — chứng minh bằng chiều **phủ định**: gán
  `.basemap` vào một `number`, hoặc đọc một field không tồn tại trên
  `BuildStyleArgs`, đều phải làm typecheck ĐỎ. Nếu đối số là `any` hay `unknown`
  thì không mũi nào đỏ, và đó đúng là trạng thái "phép đo giả" cần chặn.
- AC-4: Given `mcp-server/src/recipes.test.ts` sau khi chữa, When đọc kết quả
  `r.compile(...)`, Then nó giữ kiểu trả về THẬT `CompiledRecipeCall` chứ không
  phải một hình dạng viết tay — chứng minh cùng chiều phủ định: đọc một field
  không tồn tại trên `CompiledRecipeCall` phải làm typecheck ĐỎ, và `.basemap`
  phải mang kiểu hẹp `'vector' | 'satellite'` chứ không phải `string`.
- AC-5: Given các dòng mà lượt sửa này **thêm vào** hai tệp đích — so với mốc
  GHIM `54b5cb2` (commit ngay trước lượt sửa), không phải `merge-base` — When quét,
  Then không dòng nào chứa `as any`, `@ts-expect-error`, `@ts-ignore`, hay
  `as unknown as`. Phạm vi là dòng THÊM chứ không phải cả tệp, có chủ đích: hai
  tệp đã mang sẵn bốn chỗ dùng các mẫu ấy từ trước lượt này, và chúng nằm ngoài
  phạm vi (xem Out of scope) — đo cả tệp sẽ biến một sự thật có sẵn thành lời
  buộc tội lượt này. Bộ quét phải tự chứng minh cả hai chiều: fixture CÓ đủ bốn
  mẫu phải báo đủ bốn, fixture sạch phải báo không; và số dòng thêm phải > 0
  trước khi được kết luận "sạch". Một bộ quét hỏng báo "sạch" trên mọi đầu vào.
  Mốc phải GHIM: `merge-base` đúng khi PR còn mở nhưng bằng chính HEAD sau khi
  merge, và khi ấy số dòng thêm về 0 — một phép đo chỉ chạy được trước merge thì
  không phải phép đo, nó là một cửa sổ. (Đo thật: PR #50 merge xong là chốt
  `added.length > 0` nổ.)
- AC-5b: Given TRỌN hai tệp đích (không chỉ dòng thêm), When quét `as never`,
  Then không chỗ nào dùng nó ở **vị trí giá trị** (`const x: T = expr as never`)
  — dạng ấy gán được vào mọi kiểu nên giặt sạch bất kỳ lỗi kiểu nào, và nguy
  hiểm hơn `as any` vì trông vô hại hơn. **Vị trí đối số** (`f(x as never)`) thì
  ĐƯỢC: đó là cách hợp lệ để thoả một tham số khai `never` có chủ đích, và cả 7
  chỗ dùng hiện có đều thuộc dạng này. Cả hai cú pháp ép kiểu đều phải xét:
  `x as never` VÀ `<never>x` — dạng sau hợp lệ trong `.ts` và giặt kiểu y hệt.
  Phép ép kiểu phải được nhận diện bằng BỘ KIỂM KIỂU, không bằng mặt chữ của
  node kiểu: `type N = never; e as N` là ép về `never` y như `e as never`, mà
  cú pháp không thấy được (`as N` là `TypeReference`). Phải bắt được cả bí danh
  một tầng, bí danh dây chuyền (`type M = N`), và bí danh NHẬP TỪ TỆP KHÁC; và
  phải KHÔNG bắt một bí danh không phải never (`type NeverMind = string`).
  Còn phần MIỄN TRỪ thì hỏi «tham số tương ứng ĐƯỢC KHAI kiểu gì», không hỏi
  «phép ép nằm ở đâu». Vị trí đối số KHÔNG bảo đảm tham số kia khai `never`:
  `declare function __id<T>(v: T): T; const w: number = __id({} as never)` cho
  `T` suy ra `never` rồi đổ thẳng vào ô `number`. Và phải đọc kiểu KHAI chứ
  không phải kiểu đã suy — `getResolvedSignature` trả chữ ký ĐÃ suy diễn, nơi
  `T` đã hoá `never`, tức rơi đúng vào bẫy đang cần bắt. Không xác định được
  tham số tương ứng thì KHÔNG kết luận "hợp lệ" (cùng luật AC-5c/AC-5d).
  Không phỏng đoán bằng ký tự đứng sau: `)` không phải dấu hiệu của lời gọi hàm,
  và mọi phép phỏng đoán mặt chữ đều thủng ở ngoặc-nhóm, đối-số-không-đứng-cuối,
  ngoặc trong chuỗi, và số dòng sau chú thích nhiều dòng. Bộ quét phải chứng
  minh: mã nguy hiểm thật → đỏ kèm số dòng ĐÚNG; 7 chỗ đối số → không tính và
  được báo RIÊNG; `f(a as never, b)` → không đỏ oan; và một chú thích chỉ NHẮC
  TỚI `as never` → KHÔNG đỏ (bộ quét nổ trên văn xuôi là bộ quét người ta sẽ
  tắt đi, và phép đo bị tắt thì không đo gì cả).
- AC-5c: Given một tệp đích KHÔNG phân tích được (khối chú thích hoặc template
  literal không đóng), When quét, Then bộ quét phải ĐỎ, KHÔNG được báo "sạch".
  Hai dạng ấy nuốt trọn phần còn lại của tệp, nên một `as never` nguy hiểm nằm
  sau đó biến mất khỏi cây cú pháp — và một bộ quét chỉ đếm cast sẽ bình thản
  báo "0 chỗ" rồi xanh: tệp không đọc được và tệp sạch trông y hệt nhau. Luật
  là **không đo được ≠ sạch**, cùng nguyên tắc đã áp cho mốc so của AC-5. Phép
  đo phải chứng minh hai chiều: hai ca nuốt → đỏ kèm số lỗi cú pháp; tệp sạch
  → 0 lỗi, chốt không nổ oan.
- AC-5d: Given một bí danh `never` tới được bản biên dịch THẬT qua đường mà một
  program một-tệp không thấy (ví dụ `declare type N = never` trong một `.d.ts`
  toàn cục mà tsconfig `include`), When quét, Then phải bị BẮT. Và Given một tên
  kiểu KHÔNG giải được, When quét, Then phải NGÃ TO chứ không đọc thành "sạch" —
  vì `getTypeFromTypeNode` trả kiểu LỖI mang cờ `Any`, trông y hệt một kiểu vô
  hại. Hai điều kiện: program phải dựng từ `tsconfig` THẬT của project chứa tệp
  (không phải tuỳ chọn viết tay quanh một tệp), và tên không giải được phải đếm
  riêng. Phép đo phải chứng minh cả hai chiều: bí danh `.d.ts` toàn cục → đỏ
  đúng dòng **kể cả khi `tsc` xanh** (nên E1 KHÔNG đỡ hộ); tên không giải được →
  đỏ; và hai tệp đích thật → 0 tên không giải được, chốt không nổ oan.
- AC-6: Given code sản phẩm bị phá đúng một chỗ mỗi lần, When chạy tệp test
  tương ứng, Then bộ test phải ĐỎ — ba mũi: `MapView.tsx` ép `basemap: 'vector'`;
  `MapView.tsx` nuốt `satelliteTiles`; `recipes.ts` đổi mặc định area-overview về
  `'satellite'`. Đây là phép đo **assertion không yếu đi**: một test xanh trên
  code đã hỏng là test không chấm gì cả. Sau mỗi mũi, cây mã phải được hoàn
  nguyên nguyên trạng và phép đo phải khẳng định điều đó.
- AC-7 *(no-regression)*: Given toàn bộ bộ test đơn vị, When chạy, Then 0 ca đỏ,
  VÀ chứng minh bằng số rằng hai tệp đã sửa **thật sự đã chạy lại** — mỗi tệp có
  số ca đạt lớn hơn 0, đọc từ báo cáo máy-đọc-được, không suy từ mã thoát của cả bộ.

## Coverage

- **Trục Chỗ hỏng**: chỗ khai (AC-3, AC-4) | chỗ dùng — [thước CE: chữa ở chỗ dùng bằng ép kiểu vẫn làm AC-1 xanh, nên AC-1 một mình KHÔNG phân biệt được hai chỗ; phải có chiều phủ định]
- **Trục Cách chữa**: khai đúng kiểu (AC-3, AC-4) | bịt miệng lộ liễu (AC-5) | bịt miệng kín đáo bằng `as never` (AC-5b) — [thước CE: `as any` làm AC-1 + AC-7 xanh hết, chỉ AC-5 bắt được; còn `as never` ở vị trí giá trị thì đến AC-5 cũ cũng không thấy — đo được: chính mũi TS2322 đầu tiên của `type-probe.ts` viết dạng ấy và không bao giờ đỏ được]
- **Trục Sức sống của assertion**: còn cắn (AC-6) | đã chết — [thước CE: xoá thẳng hai assertion cũng làm AC-1 + AC-5 + AC-7 xanh; chỉ mũi phá-code phân biệt được]
- **Trục Phạm vi typecheck**: project web (AC-1) | project mcp-server (AC-1, AC-2) — [thước CE: `&&` đã thật sự che vế sau 5 ngày, đây không phải rủi ro giả định]
- **Trục Không hồi quy**: AC-7 — và phải chứng minh tệp đã chạy, không chỉ bộ đã xanh

## Out of scope

- **Không** nới `risk_tiers.t1_skip_globs` để miễn trừ tệp test. Nó gỡ đỏ ngay
  nhưng đúng là thứ kit sinh ra để chặn: một PR sau moi ruột assertion sẽ giữ
  evidence "tươi" trong im lặng. Nới thước đo phải là quyết định có chủ đích của
  người, không phải tác dụng phụ của một lần chữa CI.
- **Không** đổi kiểu sản phẩm `RecipeSpec.compile: (params: never)`. Cái `never`
  ấy có chủ đích (contravariance: cho mọi hình dạng param gán vào được); đổi nó
  để chiều lòng một tệp test là để đuôi vẫy chó.
- **Không** dọn bốn chỗ `as any` / `as unknown as` có sẵn trên main trong chính
  hai tệp đích (`globalThis as unknown as {...}` ở `MapView.test.tsx`; ba
  `spec.schema as any` / `res.content.find(...) as any` ở `recipes.test.ts`).
  Chúng có trước lượt này và không liên quan tới 6 lỗi typecheck; AC-5 vì thế đo
  dòng THÊM, không đo cả tệp.
- **Không** dọn các warning `oxlint` có sẵn trên main (`no-unused-vars` ở
  `http.test.ts`, `resolveConfig.ts`, `lib/evidence-core.cjs`). Chúng không liên
  quan tới lượt này; gộp vào là làm mờ diff của một bản sửa CI.
- **Không** mở rộng độ phủ test của `MapView` ra ngoài AC-9 (chính sách nền vệ
  tinh). Lượt này chữa KIỂU của phép đo sẵn có, không thêm phép đo mới.
- **Không** đụng `.github/workflows/ci.yml`. `&&` giữa hai lệnh tsc có che vế
  sau thật, nhưng đổi hình dạng bước CI là việc khác, cần cân riêng — ở đây chỉ
  ghi nhận nó ở AC-2 và đo cả hai project độc lập.

## Notes

- Bài học của AC-5b, ghi lại vì nó là bài học chứ không phải chi tiết: bản đầu
  đoán vị trí đối số bằng «có `)` ngay sau không». Vòng chấm 2 đâm thủng bốn
  chỗ; vá bằng cách lần ngược đếm ngoặc thì thủng thêm ba chỗ nữa (số dòng lệch
  vì chú thích nhiều dòng, ngoặc trong chuỗi làm lệch phép đếm và giặt một dòng
  bịt miệng vào ô «hợp lệ», rồi bộ xoá ruột chuỗi lệch pha nuốt mất một dòng mã
  thật). Ba lần vá ba lỗ mới là dấu hiệu sai KIẾN TRÚC: thứ đang được viết tay
  là một bộ phân tích từ vựng, trong khi `typescript` nằm sẵn trong
  devDependencies suốt thời gian đó. Giờ hỏi thẳng AST — đúng chú thích, chuỗi,
  template, regex và vị trí, miễn phí.
- Lối vòng BÍ DANH KIỂU do vòng chấm 4 tìm ra là tầng thứ tư của cùng một bài
  học: mặt chữ → cây cú pháp → chẩn đoán cú pháp → KIỂM KIỂU. Mỗi tầng chữa
  đúng lỗi của tầng trước rồi để lộ một lớp mà nó không có giác quan để thấy.
  Cấu trúc không biết `N` nghĩa là gì; chỉ bộ kiểm kiểu biết.
- Luật miễn trừ theo KIỂU KHAI của tham số sinh ra từ vòng chấm 6, và là tầng
  thứ SÁU: mặt chữ → cây cú pháp → chẩn đoán cú pháp → kiểm kiểu → phạm vi biên
  dịch → **kiểu khai của tham số**. Vòng 7 nới luật ấy ra ba chỗ chứa-đối-số
  nữa — template có nhãn, thuộc tính JSX, đối số trải — nhưng nguyên tắc không
  đổi: vẫn đọc node kiểu ĐÃ VIẾT. `getContextualType` một mình KHÔNG dùng được,
  đo được: nó trả `never` cho `__id({} as never)` vì `T` đã suy thành `never`,
  tức sập đúng cái bẫy vòng 6. Chỗ nào không lần được tham số tương ứng (đối số
  trải) thì khai KHÔNG XÁC ĐỊNH — vẫn đỏ, nhưng nói đúng lý do thay vì vu tội. Dấu hiệu nhận ra nó cũng chính là dấu hiệu
  vòng 2 từng ghi: một phép thử sai theo CẢ HAI chiều (bỏ lọt `__id(x as never)`
  đồng thời đỏ oan `f((x as never))`) là phỏng đoán đặt thấp hơn một tầng so
  với câu hỏi thật.
- **Trần của hợp đồng này**, ghi ra để không ai tưởng nó phủ nhiều hơn thực tế.
  Bộ quét đo PHÉP ÉP KIỂU, và chỉ hỏi về kiểu ĐÍCH của phép ép ấy. Nằm ngoài
  tầm MỌI tầng ở trên là mọi lối giặt kiểu mà **cửa ra là kiểu TRẢ VỀ hoặc
  luồng**, bất kể nguồn có phép ép hay không:
    - `declare function __ln<T>(x: unknown): T` — biến bất cứ gì thành bất cứ
      gì; trong nguồn không có cả `never` lẫn `any`.
    - `declare function __sinkE<T>(v: never): T` — CÓ `as never` trong nguồn và
      luật miễn trừ xử ĐÚNG (tham số khai `never` thật), nhưng thứ giặt kiểu là
      `T` ở đầu ra, chỗ bộ quét không hỏi tới. Vòng chấm 7 tìm ra ca này; câu
      chữ trần trước đó hẹp hơn thực tế vì mới chỉ nói tới dạng "không có phép
      ép nào".
    - hàm khẳng định `asserts x is never` — giặt qua thu hẹp luồng, không qua
      phép ép nào.
  Điểm chung: cửa ra nằm ở kiểu trả về hoặc ở luồng, không nằm ở kiểu đích của
  một phép ép. Bắt được chúng cần phân tích luồng dữ liệu — một công cụ khác.
  Đây là TRẦN, không phải sót.
- AC-5d sinh ra từ vòng chấm 5, và là tầng thứ NĂM của cùng một bài học:
  mặt chữ → cây cú pháp → chẩn đoán cú pháp → kiểm kiểu → **phạm vi biên dịch**.
  Luật «không đo được ≠ sạch» của AC-5c viết đúng nhưng chỉ áp cho cú pháp;
  không ai hỏi bộ KIỂM KIỂU có giải được cái tên đó không. Chi tiết đáng nhớ:
  `getSymbolAtLocation` trên một tên không tồn tại KHÔNG trả `undefined` mà trả
  một symbol LỖI mang đúng tên ấy — nên phép thử hiển nhiên nhất im lặng cho 0
  và lỗ vẫn mở. Dấu hiệu thật là chẩn đoán ngữ nghĩa 2304.
- AC-5c sinh ra từ vòng chấm 3, và nó là bài học lặp lại của chính hồ sơ này ở
  một tầng cao hơn: bộ phân tích thật chữa mọi lỗi phỏng đoán mặt chữ, nhưng
  chuyển luôn chế độ hỏng từ «đọc nhầm» sang «đọc trống». Một thước im lặng khi
  không đo được thì nguy hiểm hơn một thước đọc sai, vì không ai nhìn ra.

- Risk tier T2: chỉ chạm 2 tệp test, không tệp nào nằm trong `risk_tiers.t3_paths`
  (`src/lib/export.ts`, `src/lib/mapStyle.ts`).
- Không có eval design/ui-check: lượt này không dựng gì cho người nhìn — `surfaces: [api]`.
- Chốt T1-escape của `pre-merge-check.sh` là thứ đòi hồ sơ này: lỗi typecheck
  nằm TRONG tệp test, nên mọi cách chữa đều chạm đường không miễn trừ. Không có
  lối vòng nào là T1 thật.
