# Kế hoạch PR #6 — `resolved.anchors` + `resolved.camera`

**Ngày:** 2026-08-07 · **Ước lượng gốc:** 3.5 ngày (spec §5.2) · **Value:** critical

Mảnh cuối để recipe `connectivity` / `compare-locations` chạy đầu-cuối. Tầng DOM của OneHub cần biết **điểm quan tâm nằm ở đâu trên khung hình** để đặt chữ, giá, đường kẻ nối — mà không được đọc pixel.

> Chi phí thật **không phải** 25 dòng project. Nó là ripple qua mọi test fake. (spec §5.2)

---

## 1. Hình dạng đầu ra

```ts
resolved.camera = { center: [lng, lat], zoom, bearing, pitch }

resolved.anchors = {
  points: [{ index, id?, lng, lat, xPct, yPct, onScreen }],
  regions: [{ index, centroidPct: [xPct, yPct], bboxPct: [x0, y0, x1, y1] }],
}
```

**Phần trăm, không phải pixel.** Ba lý do, lý do thứ ba mới là lý do thật:

1. Tầng DOM đặt phần tử bằng CSS `%` / `left: X%` — pixel buộc nó phải tự chia lại.
2. Không phụ thuộc độ phân giải: cùng một anchors dùng được cho bản 1080 và 4k.
3. **Nó né được một sai số mà pixel không né được** — xem §2.

## 2. Bẫy 1: hai trục có tỉ lệ khác nhau (đã kiểm chứng)

`RenderApp.tsx:31` render khung poster với `Math.round(size.w)` × `Math.round(size.h)`. Hai trục được làm tròn **độc lập**, nên khung CSS thật lệch khỏi tỉ lệ đầu ra tới ~1px mỗi trục:

```
cssW / cssH  ≠  out.width / out.height
```

Do đó **không tồn tại một hệ số tỉ lệ chung**. Công thức đúng phải có mẫu số riêng từng trục:

```ts
xPct = (p.x / cssW) * 100
yPct = (p.y / cssH) * 100
```

`ctx.drawImage(base, 0, 0, out.width, out.height)` ([export.ts:198](../../../src/lib/export.ts)) kéo ảnh nền phủ kín cả hai trục, nên một điểm ở tỉ lệ `f` ngang khung CSS nằm đúng ở tỉ lệ `f` ngang khung đầu ra. Phần trăm là **chính xác tuyệt đối**, không phải xấp xỉ.

### Sai lệch sẵn có, KHÔNG sửa trong PR này

`composeOverlays` tính **một** hệ số `ratio = opts.width / cssW` ([export.ts:188](../../../src/lib/export.ts)) rồi dùng nó cho **cả** `p.x` lẫn `p.y` khi vẽ marker ([export.ts:204,211](../../../src/lib/export.ts)). Tức là toạ độ y đang bị nhân bằng tỉ lệ của trục x.

Hệ quả: marker **được vẽ** có thể lệch khỏi anchors **được trả về** cỡ ~0,1% chiều cao (~2px ở khung 1920). Với tầng DOM đặt nhãn giá cạnh ghim thì không nhìn thấy được, nhưng phải ghi ra chứ không giấu.

**Không sửa ở đây** vì `export.ts` là `t3_path`: sửa kéo theo vòng nghiệm thu T3 đầy đủ **và** làm đổi pixel đầu ra, tức phá bằng chứng determinism byte-identical của `map-motion-clip`. Ghi vào Out of scope, xếp lịch riêng.

## 3. Bẫy 2: KHÔNG thêm `anchorsAt(t)`

Cám dỗ hiển nhiên là cho agent lấy anchors ở thời điểm bất kỳ. **Không được.**

`renderMotionFrame` ([main.tsx:604-626](../../../src/render/main.tsx)) cache ảnh nền vào `restBase` khi `tSec >= restAtSec`, rồi mọi khung đuôi tái dùng cache đó và chỉ vẽ lại overlay bằng camera **hiện tại** của map. Một hàm `anchorsAt(t)` bắt buộc phải `map.jumpTo(cameraAt(motion.camera, t))` để chiếu — và jumpTo đó **để lại camera ở chỗ khác** trong khi `restBase` vẫn là ảnh chụp ở `restAtSec`.

Lần `renderMotionFrame` kế tiếp ở đuôi clip sẽ đi nhánh cache (dòng 626) và **vẽ marker bằng camera sai lên ảnh nền đúng**. Đúng lớp hỏng mà `setCamera` phải reset `restBase` để phòng ([main.tsx:593](../../../src/render/main.tsx)), và nó phá AC-6.

**Thiết kế thay thế:** một hàm `anchors()` **chỉ đọc**, không `jumpTo`, không đụng cache nào. Gọi **ngay sau** lần chụp settle — lúc đó camera đã chắc chắn ở `restAtSec`. Đo tại `restAtSec` cũng đúng về mặt sản phẩm: đó là khung mà tầng DOM đặt chữ lên.

Hàm phải **tự khẳng định** camera đang ở `restAtSec` thay vì tin vào thứ tự gọi — nếu ai đó chèn lời gọi vào giữa, phải hỏng **to tiếng** chứ không trả toạ độ sai lặng lẽ.

## 4. `pitch != 0` → từ chối

Với pitch nghiêng, `map.project()` vẫn trả điểm, nhưng khái niệm `bboxPct` của một vùng mất nghĩa (hình chiếu là hình thang, không phải chữ nhật), và điểm sau đường chân trời chiếu ra toạ độ vô nghĩa. Trả một con số trông hợp lệ ở đây là đúng loại lỗi repo này vốn từ chối: **agent không nhìn thấy ảnh nên không thể phát hiện**.

Từ chối kèm thông điệp nêu rõ pitch là nguyên nhân.

`onScreen` là cờ boolean cho điểm nằm ngoài khung — vẫn trả `xPct`/`yPct` (có thể âm hoặc >100) để tầng DOM tự quyết vẽ mũi tên chỉ hướng hay bỏ qua.

## 5. Ripple — chi phí thật

Mỗi chỗ dưới đây phải đổi, và mỗi test fake phải trả thêm trường mới:

| File | Việc |
|---|---|
| `src/render/main.tsx` | thêm `anchors()` vào `MapPosterApi` + hiện thực |
| `mcp-server/src/renderFrame.ts` | `ClipFrames` thêm `anchors`; gọi sau settle |
| `mcp-server/src/deps.ts` | `ToolDeps.renderClip` đổi kiểu trả |
| `mcp-server/src/tools.ts` | `resolvedOf` echo `camera` + `anchors` |
| `mcp-server/src/http.ts` | REST + `/jobs` cùng đường |
| `mcp-server/src/jobRunner.ts` | **kiểm riêng** — đã hai lần lặp lỗi dùng sai biến ở đây mà test vẫn xanh |
| `*.test.ts` (http/deps/tools) | mọi fake `renderClip` phải trả `anchors` |

**Cảnh báo từ lịch sử phiên:** `jobRunner` từng có lỗi dùng `job.params` thay vì `params` mà **22/22 test vẫn xanh**. Bất biến cấu trúc phải kiểm rằng cả ba bề mặt (MCP / REST / jobs) thật sự phát ra `anchors`, không tin vào test hành vi.

## 6. Bất biến phải khoá bằng script

- **I1** — `t3_path` 0 dòng thay đổi (`export.ts`, `mapStyle.ts`)
- **I2** — **không** tồn tại `anchorsAt` hay bất kỳ đường nào cho phép chiếu ở `t` tuỳ ý
- **I3** — `anchors` xuất hiện ở **cả ba** bề mặt (đếm, không tin test hành vi)
- **I4** — công thức phần trăm dùng **hai** mẫu số khác nhau; một mẫu số chung phải làm test đỏ
- **I5** — `anchors()` không chứa `jumpTo` và không gán `restBase`/`animBase`

Mỗi bất biến phải được chứng minh **có thể đỏ** bằng negative control thật, không phải chỉ chạy xanh.

## 7. Ngoài phạm vi

- Sửa hệ số một-trục của `drawMarker` (t3_path — §2)
- `anchorsAt(t)` ở thời điểm tuỳ ý (§3)
- Anchors cho `routes` — đường là polyline, cần chính sách lấy mẫu riêng, chưa có ca dùng
- Hỗ trợ pitch (§4)

## 8. Thuế nghiệm thu

Chạm `tools.ts` / `http.ts` → theo `shared-mcp-files-invalidate-contracts`, **tất cả** hợp đồng hiện có hết hiệu lực bằng chứng. Cộng một vòng verify đầy đủ vào kế hoạch, và **merge bằng merge commit** — không squash (xem `no-squash-merge-new-contracts`).
