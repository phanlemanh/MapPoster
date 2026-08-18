---
schema_version: 1
feature: Chặn độ dài mảng đầu vào + sửa tra cứu format lọt prototype (issue #1, #2, #3)
slug: input-caps
owner: phanlemanh@gmail.com
risk_tier: T2
surfaces: [api]
status: verified
approved_by: Manh Phan
approved_at: 2026-08-18T14:43:34Z
human_signoff:
time_human_minutes: {}
---

# Acceptance Contract: input-caps

> **BẢN NHÁP — chưa qua Cổng 1 lẫn Cổng 2.** File này do agent soạn ở bước đặc tả.
> Phần `evidence-report.md`, `run-log.jsonl` và chữ ký người **cố ý chưa có**: chúng
> phải sinh ra từ một vòng chạy thật của bộ acceptance-gate, không phải từ việc chép
> đúng định dạng. Xem `## Việc còn lại` ở cuối.

## Context

Ba mục MEDIUM/LOW của review round 11, được chấp nhận cho lần merge đầu và mở thành
issue [#1](https://github.com/phanlemanh/MapPoster/issues/1),
[#2](https://github.com/phanlemanh/MapPoster/issues/2),
[#3](https://github.com/phanlemanh/MapPoster/issues/3). Gộp một gói vì thuế gate tính
theo PR chứ không theo issue (spec §5: *"gộp lô tối đa"*), và vì cả ba cùng một hình
dạng: **một giá trị caller gửi lên không được kiểm, rồi biến thành chi phí ở nơi khác.**

**#1 — `render_variants.variants` không có trần.** Mỗi variant là một lượt render
headless đầy đủ, chạy **nối tiếp**, mỗi lượt giữ một page của `MAPPOSTER_POOL` (mặc
định 2). Một body còn xa mới chạm trần 8 MiB vẫn chở được ~100k phần tử `{}` và ghì
pool chung vô thời hạn.

**#2 — `highlight.regions` / `.points` không có trần.** Mỗi phần tử **có tên** là một
lượt Nominatim, nối tiếp sau bộ hạn tốc ≥1 req/s mà geocoder tự giữ để nằm trong
usage policy của Nominatim. ~100k tên ≈ **28 giờ** gọi liên tục sang một dịch vụ công
cộng dùng chung — dưới tên chúng ta.

**#3 — `formatSize` tra cứu bằng phép thử truthy trên object literal trần.**
`FORMATS['constructor']` leo lên `Object.prototype` và trả về **hàm `Object`** — truthy,
nên được `return` như thể nó là một size. Caller nhận `{width: undefined}` rồi chết sâu
trong renderer bằng một `TypeError` mù, thay vì chết ngay tại đây với `Unknown format`.
Đã tái hiện: `formatSize('constructor')` → `typeof 'function'`, `name: 'Object'`,
`width: undefined`. Các nhánh `LAYOUTS`/`THEMES` ngay dưới đã đúng sẵn vì chúng dùng
`.find`.

Điểm chung đáng giữ lại: **trần đặt ở tầng schema là chưa đủ.** `makeTools` và
`resolveConfig` đều gọi trực tiếp được — `render_variants` merge override lên một base
đã validate, và test dựng params bằng tay — nên biên Zod bỏ qua được. Đây chính là lý
do `assertLayers`/`assertMarkerSize` đã tồn tại trong `resolveConfig.ts`; gói này theo
đúng nếp đó.

## Criteria

- AC-1: Given `highlight.regions` dài hơn `MAX_HIGHLIGHTS`, When `resolveConfig` chạy, Then nó **ném trước khi gọi geocoder một lần nào** — `resolveLocation` **và** `resolveBoundary` đều có 0 lần gọi. Đặt guard sau lượt tra cứu base vẫn tốn một request; đặt trong vòng lặp thì tốn `MAX_HIGHLIGHTS` request.
- AC-2: Given `highlight.points` dài hơn `MAX_HIGHLIGHTS`, When `resolveConfig` chạy, Then y hệt AC-1 — 0 lần gọi mạng.
- AC-3: Given mảng dài **đúng bằng** `MAX_HIGHLIGHTS`, When `resolveConfig` chạy, Then nó resolve bình thường và trả đủ `MAX_HIGHLIGHTS` phần tử — trần là **inclusive**. (Nửa suppression: một bản vá chặn cả ca hợp lệ thì không phải bản vá.)
- AC-4: Given `renderMapSchema` — thứ mà **cả bốn** bề mặt parse (`render_map` trên MCP, và REST `POST /render`, `/render-clip`, `/jobs`), When parse một mảng highlight quá trần, Then `success: false`; và đúng bằng trần thì `success: true`.
- AC-5: Given `variants` dài hơn `MAX_VARIANTS`, When `render_variants` chạy, Then nó trả `isError` **trước lượt render đầu tiên** — dependency `render` có 0 lần gọi.
- AC-6: Given `variants` dài **đúng bằng** `MAX_VARIANTS`, When `render_variants` chạy, Then đủ `MAX_VARIANTS` ảnh ra và `render` được gọi đúng `MAX_VARIANTS` lần.
- AC-7: Given `MAX_VARIANTS`, When đối chiếu với `THEMES`, Then `MAX_VARIANTS >= THEMES.length` — quét mỗi theme một variant là fan-out rộng nhất có thật, trần mà chặn nó là trần đặt sai.
- AC-8: Given một khoá kế thừa từ `Object.prototype` (`constructor`, `toString`, `valueOf`, `hasOwnProperty`, `__proto__`, `isPrototypeOf`), When `formatSize` chạy, Then nó **ném** `Unknown format: <khoá>` — và **không** trả về bất cứ thứ gì. Khẳng định phải bắt được cả ca "trả về giá trị truthy không phải size", không chỉ ca "không ném".
- AC-9: Given mã nguồn, When soi bất biến, Then **mỗi** trần tồn tại ở **cả hai** tầng: `.max()` ở schema Zod (`tools.ts`) **và** một guard runtime (`assertHighlightCount` trong `resolveConfig.ts`, phép so sánh `MAX_VARIANTS` trong `render_variants`). Gỡ một trong hai tầng phải làm ít nhất một eval đỏ.

## Coverage

- **Trục Bề mặt**: MCP `render_map` | MCP `render_variants` | REST `/render` | REST `/render-clip` | REST `/jobs` — [thước CE: AC-4 đánh vào chính `renderMapSchema`, đối tượng cả bốn bề mặt cùng parse, nên độ phủ không phụ thuộc việc nhớ liệt kê đủ route]
- **Trục Tầng gác**: biên Zod (AC-4) | guard runtime bỏ qua được Zod (AC-1, 2, 5) | bất biến hai tầng (AC-9)
- **Trục Chiều kiểm**: từ chối đúng (AC-1, 2, 4, 5, 8) | **cho qua đúng ở sát ngưỡng** (AC-3, 4, 6) | trần không được chặn ca thật (AC-7)
- **Trục Thời điểm** — trục quan trọng nhất của gói này: trần chỉ có giá trị nếu nó nổ **trước** khi chi phí phát sinh. AC-1/2 đo bằng số lần gọi geocoder = 0; AC-5 đo bằng số lần gọi render = 0. Một trần đúng về mặt kết quả nhưng đặt sau vòng lặp vẫn **đỏ** ở trục này.
- **Trục Hình dạng lỗi** (#3): trả về thay vì ném (AC-8 khẳng định trên chính giá trị trả về, không chỉ trên việc có ném hay không)

Chưa quét: trần cho `routes[]`, `measure.pairs[]`, `camera` — cùng họ nhưng chưa có bằng chứng chúng đắt tương đương; mở riêng nếu review sau chỉ ra.

## Out of scope

- **Không** biến hai trần thành env var. Chúng không phải núm dung lượng theo triển khai như `MAPPOSTER_MAX_QUEUED_JOBS`: chi phí của `highlight` là lưu lượng đổ sang **dịch vụ công cộng của người khác**, và không triển khai nào được quyền tự nâng mức đó bằng một biến môi trường. Theo nếp `MAX_EDGE` — hằng số có tên, có lý do ghi tại chỗ.
- **Không** đổi thông điệp lỗi hay mã HTTP của các đường đã có. Trần mới rơi vào đúng nhánh 400 (`resolveConfig` ném) và `isError` (tool) đang dùng.
- **Không** đụng `src/lib/export.ts` / `src/lib/mapStyle.ts` — giữ gói ở T2.
- **Không** sửa các cảnh báo lint có sẵn (`lib/gap-probe.js`, `resolveConfig.ts:368`, `_acceptance/scripts/`). Khác vấn đề, và một số nằm trong bộ gate vendored.

## Notes

- **Risk tier T2**: chạm `mcp-server/src/resolveConfig.ts`, `mcp-server/src/tools.ts` + test của chúng; `README.md` nằm trong `t1_skip_globs`.
- **Cả tám hợp đồng đã nghiệm thu đều thành stale evidence vì gói này chạm code** — cùng cơ chế `mcp-auth` đã ghi nhận. Đây là phần lớn chi phí của gói, không phải phần code.

## Việc còn lại (chưa làm)

Ba việc dưới đây **cố ý để trống** vì chúng đòi một vòng chạy thật của bộ acceptance-gate:

1. **Cổng 1** — chuẩn hoá hợp đồng + sinh evals qua skill `acceptance` (bản `evals.yaml` kèm đây là nháp bám AC, chưa qua bước EVAL-GEN), và bước phản biện context sạch (gap-probe).
2. **Cổng 2** — chạy verify, sinh `evidence-report.md` + `run-log.jsonl`, ghim `verified_commit`.
3. **Chữ ký người** — `human_signoff`, commit riêng, do `manh` tự tạo (`require_human_commit: true`).

Ngoài ra: tám `evidence-report.md` hiện có đều ghim `verified_commit: 535ee8e8`; gói này
làm chúng hết hạn và cần nghiệm thu lại + ghim lại.
