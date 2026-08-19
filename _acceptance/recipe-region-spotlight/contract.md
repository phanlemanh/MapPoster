---
schema_version: 1
feature: Tầng recipe + recipe đầu tiên (region-spotlight) — một call ra một cảnh hoàn chỉnh
slug: recipe-region-spotlight
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
approved_by: Phan Le Manh
approved_at: 2026-08-19T00:13:34Z
human_signoff:
time_human_minutes: {}
---

# Acceptance Contract: recipe-region-spotlight

> **BẢN NHÁP — chưa qua Cổng 1 lẫn Cổng 2.** Do agent soạn ở bước đặc tả.
> `evidence-report.md` và `run-log.jsonl` cố ý CHƯA có: chúng phải sinh từ một
> vòng chạy thật của bộ acceptance-gate. Xem `## Việc còn lại`.

## Context

Spec `2026-08-06-mapeffect-clone-recipes-design.md` đặt hạng mục bàn giao là **8 recipe**
và hai tool `list_recipes` / `render_recipe`. Trước gói này, con số là **0/8** — mọi năng
lực nền đã có nhưng chưa recipe nào tồn tại dưới dạng tool, nên agent director vẫn phải tự
biết preset nào + cờ highlight nào + framing nào cộng lại thành cảnh nó muốn.

Gói này dựng **tầng recipe** và **một** recipe: `region-spotlight` (spec §4, recipe #6).
Chọn nó trước có chủ đích, không phải vì nó dễ nhất: toàn bộ năng lực nó cần đã xanh từ
PR #2, nên nó là recipe **rẻ nhất để kiểm chứng chính mô hình recipe** — nếu ranh giới
trách nhiệm ở spec §2 sai ở đâu, ta biết sau 1,5 ngày thay vì sau 14 ngày dồn vào PR #9.

Quyết định kiến trúc chi phối cả gói, từ spec §2 (*"không thêm khái niệm mới vào engine"*):
`compile` trả về **đúng bộ tham số `render_clip` đã nhận**, rồi `render_recipe` **uỷ nhiệm**
cho `render_clip`. Không có đường render thứ hai. Hệ quả là mọi bảo đảm của `render_clip`
được **kế thừa** chứ không suy diễn lại — và đó là thứ hợp đồng này phải chốt bằng bằng
chứng, vì "kế thừa" là một lời hứa dễ nói mà khó thấy khi nó gãy.

## Criteria

- AC-1: Given `render_recipe({recipe:'region-spotlight', region})`, When chạy, Then trả về **một clip MP4 thật** kèm `settle`, `motion.script` đã compile, và `resolved` — cùng hình dạng `render_clip` trả, không thiếu trường nào.
- AC-2: Given kết quả bất kỳ của `render_recipe`, When đọc, Then nó mang `recipe: '<tên>'` — **trên cả nhánh thành công lẫn nhánh lỗi/degrade**. Caller fan-out nhiều recipe cần biết kết quả nào của recipe nào, và nhánh lỗi là chỗ nó cần biết nhất.
- AC-3: Given `region-spotlight` compile, When kiểm bộ tham số sinh ra, Then `location` **bằng đúng** `region` được truyền. Hai thứ này tách nhau là mở lại đúng lỗ "vùng cùng tên ở nước khác kéo cả khung đi" mà README §Vietnamese addresses mô tả — country anchor rút ra từ `location`.
- AC-4: Given `region-spotlight` compile, When kiểm, Then `highlight.dim === true`; và `dim` **không** phải tham số caller đặt được — truyền `dim` vào bị schema từ chối. Một recipe tắt được đặc trưng của chính nó thì không có ranh giới, và bỏ dim đi thì đây chỉ còn là preset `approach` trần.
- AC-5: Given một tên recipe không tồn tại, When gọi, Then **từ chối** kèm danh sách tên hợp lệ, và **không** chạm renderer. Cùng chính sách `theme`/`icon`/`format`: không rơi về mặc định.
- AC-6: Given một khoá tham số gõ sai **có mặt trong hình dạng tool khai với MCP** (ví dụ `pois` gửi cho `region-spotlight`), When gọi, Then **từ chối** chứ không lặng lẽ bỏ qua, và **không** chạm renderer. Caller là agent KHÔNG nhìn thấy ảnh: một tham số bị lờ đi trả về clip "thành công" nhưng sai nội dung, và không tầng nào phía sau bắt được.
- AC-6b: Given một khoá gõ sai **không thuộc recipe nào** (`them`, `khoaRac`), When gọi **qua MCP**, Then lời gọi **THÀNH CÔNG** và khoá đó bị bỏ qua — đây là hành vi của biên MCP, không phải của chốt: SDK dựng `z.object(inputSchema)` và Zod loại bỏ khoá ngoài hình dạng khai **trước** khi handler chạy, nên `.strict()` không bao giờ nhìn thấy nó. Eval này chốt giới hạn ĐÚNG NHƯ NÓ LÀ thay vì để AC-6 hứa rộng hơn thứ đo được. Đã đo trực tiếp trên một server MCP dựng mới: `{recipe:'region-spotlight', region:'…', khoaRac:1}` render ra clip bình thường.
- AC-7: Given `list_recipes()`, When đọc, Then mỗi mục có `name`, `description`, `params`, `durationSec`, `example`.
- AC-8: Given **mọi** `example` trong catalog, When kiểm, Then nó **parse được bằng chính schema của recipe đó** và **compile được**. Một ví dụ không chạy là tài liệu nói dối — và với agent, tài liệu là toàn bộ những gì nó có.
- AC-9: Given **mọi** recipe, When đối chiếu, Then tập khoá của `params` (phần mô tả) **trùng khít** tập khoá của `schema` (phần thực thi). Thêm một trường mà quên mô tả — hoặc ngược lại — phải làm eval đỏ.
- AC-10: Given bộ tham số mà `region-spotlight` compile ra, When đưa qua **đúng** `prepareClipRender` mà `render_clip` dùng, Then `cfg.chrome === 'clean'` (AC-9 của `map-motion-clip` đi xuyên tầng recipe) và `cfg.highlight.dim === true`. Không dừng ở "compile không ném".
- AC-11: Given mã nguồn, When quét, Then tầng recipe **không** gọi `deps.renderClip`/`deps.render` trực tiếp — nó chỉ đi qua `render_clip`. Đây là bất biến giữ cho "kế thừa bảo đảm" đúng theo thời gian, không chỉ đúng hôm nay.
- AC-12: Given `t3_paths` (`src/lib/export.ts`, `src/lib/mapStyle.ts`), When so diff, Then **0 dòng** thay đổi.

## Coverage

- **Trục Tầng**: catalog (AC-7,8,9) | compile (AC-3,4,10) | tool/uỷ nhiệm (AC-1,2,11) | từ chối (AC-5,6)
- **Trục Chiều kiểm**: đường hạnh phúc (AC-1,3,4,7) | **từ chối đúng** (AC-5,6) | **cho qua đúng** — override `fps`/`durationSec` hợp lệ vẫn chạy (AC-1) | bất biến chống-trôi (AC-9,11)
- **Trục Tài liệu-vs-thực thi** — trục riêng của gói này, vì khách hàng là agent đọc catalog rồi gọi theo: ví dụ phải chạy (AC-8), mô tả phải khớp schema (AC-9). Hai eval này không kiểm sản phẩm, chúng kiểm **lời hứa về sản phẩm**.
- **Trục Kế thừa bảo đảm**: AC-10 đi qua đúng `prepareClipRender`; AC-11 chốt bằng cấu trúc rằng không có đường vòng. [thước CE: negative control — gỡ `dim`, gỡ `.strict()`, gỡ chốt tên lạ, làm lệch mô tả, làm hỏng ví dụ ⇒ mỗi ca phải làm ĐÚNG eval tương ứng đỏ; 5/5 đã đạt ở bước soạn]

Chưa quét: chất lượng **thẩm mỹ** của cảnh (nhịp camera, thời điểm reveal có "đẹp" không) — đó là eval `judgment`, cần người xem clip. Bằng chứng đầu vào đã có: `evidence/` kèm gói này.

## Out of scope

- **Không** thêm bảy recipe còn lại. Gói này kiểm chứng *mô hình*; nếu mô hình đúng thì bảy cái sau chỉ là điền vào khung đã kiểm.
- **Không** thêm track/preset/trường RenderConfig mới. Spec §2 cấm, và cấm đúng: khái niệm mới ở tầng recipe là khái niệm engine không biết cách kiểm.
- **Không** đụng `render_clip`, `/render-clip`, hay đường `/jobs`. Recipe là tầng *trên*, không sửa tầng dưới.
- **Không** mở `dim` thành tham số (xem AC-4).
- **Không** thêm bề mặt REST cho recipe. Chưa có caller yêu cầu; thêm bề mặt là thêm chỗ để lệch.

## Notes

- **Risk tier T2**: chạm `mcp-server/src/recipes.ts` (mới), `mcp-server/src/tools.ts`, test của chúng; `README.md` nằm trong `t1_skip_globs`.
- Đo thật ở bước soạn (Hoàn Kiếm, tiktok, 3s@12fps): clip **2,765,247 bytes**, 36 khung, `renderMs` 24026, `encodeMs` 369, `osmId` 19331651, `anchors` có mặt. Ba khung trích ra xác nhận hiệu ứng: bay vào → viền vẽ xong + ngoài vùng dim → nghỉ.
- Gói này chạm code ⇒ mọi hợp đồng đang ghim `verified_commit` đều thành stale.

## Việc còn lại (chưa làm)

1. **Cổng 1** — chuẩn hoá + EVAL-GEN qua skill `acceptance`; `evals.yaml` kèm đây là nháp bám AC. Thêm bước phản biện context sạch (gap-probe).
2. **Cổng 2** — chạy verify, sinh `evidence-report.md` + `run-log.jsonl`, ghim `verified_commit`.
3. **Eval judgment về chất lượng cảnh** — cần người xem clip; chưa được sinh.
4. **Chữ ký người** — do `manh` tự tạo (`require_human_commit: true`).
