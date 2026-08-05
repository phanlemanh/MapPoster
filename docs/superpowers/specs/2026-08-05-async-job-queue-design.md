# Async job queue — nhận việc render rồi trả mã việc (Gói nền)

**Ngày:** 2026-08-05 · **Slug:** `async-job-queue` · **Tier:** T2
**Trạng thái:** thiết kế đã duyệt trong phiên brainstorm 2026-08-05

## 1. Vì sao

`/render-clip` hiện là **đồng bộ**: người gọi giữ một kết nối HTTP mở suốt cả quá
trình lái trình duyệt headless và encode ffmpeg — đo được ~2 phút/clip ở 1080×1920
(`docs/superpowers/specs/2026-08-03-map-motion-clip-design.md`). Chính hợp đồng
`map-motion-clip` đã ghi async job queue vào mục *Out of scope* kèm câu điều kiện:
"cố ý hoãn; điều kiện để mở endpoint ra ngoài caller nội bộ". Gói này trả nợ đúng
dòng đó.

Bốn áp lực chủ repo nêu ngày 2026-08-05:

1. Người gọi bị treo quá lâu — proxy cắt, client hết giờ, redeploy là mất trắng.
2. Chạm trần đồng thời là bị từ chối `429`, người gọi phải tự thử lại.
3. Muốn bắn một lô nhiều bản render rồi lấy kết quả sau.
4. Không muốn mất việc khi server khởi động lại.

**Gói này nhận 1–3. Áp lực 4 (độ bền) cố ý để lại cho một hợp đồng riêng** — nó kéo
theo quyết định hạ tầng (đĩa bền của Render khoá service vào một instance, hay thêm
Redis/Postgres) và quyết định tiền, không nên gộp vào vòng đầu. Giao diện sổ việc ở
§3 được vẽ sẵn để lấp lỗ đó mà không phải sửa hai đơn vị còn lại.

## 2. Ràng buộc đã chốt

| Ràng buộc | Quyết định |
|---|---|
| Cửa vào | Hai cửa REST mới. Công cụ MCP **không** đổi ở gói này. |
| Đường cũ | `/render` và `/render-clip` giữ nguyên **từng chữ**, kể cả hành vi `429`. |
| Hết `429` | Là lợi ích của lối gửi việc — một lý do rõ ràng để OneHub dọn sang. |
| Chỗ chứa kết quả | Đĩa (`sinkDir`). Sổ việc chỉ giữ đường dẫn + siêu dữ liệu. |
| Độ bền | Ngoài phạm vi. Khởi động lại = mọi mã việc thành vô danh. |

## 3. Kiến trúc — một bộ giới hạn, hai chính sách lấy chỗ

Bộ đếm slot clip hiện chỉ biết một câu trả lời: hết chỗ thì ném
(`mcp-server/src/motionCompiler.ts`, `acquireClipSlot`). Gói này nâng nó thành bộ
cấp-phát **có hàng chờ**, giữ nguyên lối ném-ngay cho đường đồng bộ và thêm lối
xếp-hàng cho thợ chạy việc. Trần đồng thời vẫn nằm ở **đúng một chỗ** — không có
hai bộ đếm phải giữ đồng bộ với nhau.

Nếp này không mới trong repo: `browserPool` đã cấp phát theo đúng kiểu
hàng-chờ-có-người-đợi kèm hết-giờ-chờ (`mcp-server/src/browserPool.ts`). Đây là
chép một khuôn đã được kiểm chứng chứ không phải phát minh khái niệm.

```
   Cửa đồng bộ (giữ nguyên)          Thợ chạy việc (mới)
   hết chỗ → từ chối ngay            hết chỗ → xếp hàng chờ lượt
              \                        /
               \                      /
            Bộ giới hạn slot clip (một bộ đếm, hai lối lấy)
                        |
              Hồ trình duyệt → render, encode, ghi xuống đĩa
```

### 3.1 Bốn đơn vị

| Đơn vị | Làm gì | Phụ thuộc |
|---|---|---|
| `mcp-server/src/jobStore.ts` (mới) | Sổ việc trong bộ nhớ: tạo bản ghi, đổi trạng thái, trần số việc đang chờ, và **phát ra danh sách bản ghi đã quá hạn** rồi bỏ chúng khỏi sổ | Không gì — thuần dữ liệu, không chạm đĩa |
| `mcp-server/src/jobRunner.ts` (mới) | Vòng thợ: rút việc, gọi thao tác render, ghi kết quả xuống đĩa, cập nhật bản ghi — và **xoá tệp của những bản ghi mà sổ vừa phát ra là hết hạn** | `jobStore` + thao tác render **tiêm vào** |
| `mcp-server/src/motionCompiler.ts` (sửa) | Thêm lối lấy slot có-chờ bên cạnh lối ném-ngay | — |
| `mcp-server/src/http.ts` (thêm) | `POST /jobs`, `POST /jobs/status` | `jobStore` |

Hai ranh giới load-bearing:

- **`jobRunner` không biết HTTP; `http.ts` không biết render.** Cửa vào chỉ ghi bản
  ghi rồi trả mã. Thêm cửa MCP ở vòng sau không phải viết lại gì.
- **Thao tác render tiêm vào thợ**, đúng khuôn `ToolDeps` (`mcp-server/src/tools.ts`).
  Nhờ vậy toàn bộ hành vi xếp hàng kiểm thử được bằng thao tác render giả — không cần
  Chromium, chạy trong vài phần nghìn giây.
- **Sổ việc không bao giờ import `fs`.** Nó biết bản ghi nào hết hạn và trả danh sách đó
  ra; **thợ** là đơn vị duy nhất chạm đĩa, cả lúc ghi lẫn lúc xoá. Nếu sổ tự xoá tệp thì
  nó mất tính thuần-dữ-liệu và kéo theo cả hệ thống tệp vào bài test của chính nó.

### 3.2 Lối lấy-có-chờ chỉ dành cho clip

Ảnh tĩnh **không** đi qua bộ đếm slot clip — nó chỉ mượn một trang của hồ trình
duyệt, mà hồ đó đã tự xếp hàng sẵn. Thêm một lớp chờ nữa lên trên là thừa và tạo hai
nguồn chân lý về "bao nhiêu việc đang chạy".

## 4. Vòng đời một việc

```
đang chờ ──► đang chạy ──┬──► xong   (giữ một hạn rồi dọn)
                         └──► hỏng   (kèm lý do và lỗi tại ai)
```

Không có trạng thái "đã huỷ" — huỷ việc nằm ở *Later*, chưa ai cần.

## 5. Hai cửa

### `POST /jobs` — nhận việc

Thân: `{ kind: "render" | "clip", params }`, với `params` đúng nguyên giao ước
`render_map` đang có (`renderMapSchema`), cộng `motion` khi `kind` là `clip`.
Trả `202 { ok: true, id, status }`.

### `POST /jobs/status` — hỏi việc

Thân: `{ id }`. Mã trong sổ → `200` với thân mô tả trạng thái. Mã không có trong sổ
(bịa ra, hoặc đã bị dọn vì quá hạn, hoặc server đã khởi động lại) → `404 {ok: false}`.
Đây là ngoại lệ DUY NHẤT của luật ở §5.2.1: mã không tồn tại thì chính *câu hỏi* sai,
không phải việc hỏng.

### 5.1 Ranh giới: cái gì kiểm lúc nhận, cái gì để lại cho thợ

| Lúc nhận (đồng bộ, trả lời ngay) | Lúc thợ chạy (bất đồng bộ) |
|---|---|
| Thân sai khuôn, thiếu trường, số ngoài dải → `400` | Tra toạ độ địa danh thất bại → việc **hỏng**, `errorKind: "input"` |
| Hàng chờ đã đầy → `429` | Trình duyệt chết, ffmpeg vắng → việc **hỏng**, `errorKind: "server"` |
| Thẻ mang tên sai → `401` | Clip vượt trần dung lượng → việc **hỏng**, nhưng **vẫn giữ ảnh tĩnh** |

Tra toạ độ để lại cho thợ là có chủ ý: nó là gọi mạng, độ trễ không chặn trên được.
Giữ nó ở cửa vào là dựng lại đúng cái treo mà gói này đi gỡ.

### 5.2 Ba luật của hợp đồng phản hồi

1. **Mã HTTP nói về *câu hỏi*, thân nói về *việc*.** Hỏi một việc đã hỏng vẫn là
   `200` — câu hỏi thành công. Trộn hai tầng này là bẫy kinh điển của API bất đồng bộ.
2. **Kết quả trả dạng base64, đọc từ đĩa lúc hỏi.** OneHub gọi từ máy khác; một đường
   dẫn trên máy chủ với nó là vô nghĩa. Đĩa chỉ là chỗ chứa để bộ nhớ khỏi phình —
   một clip sát trần nằm ở hàng chục MB, instance Render chỉ có 2 GB chia với Chromium.
3. **Giao ước xuống-cấp giữ nguyên.** Encode hỏng mà ảnh tĩnh đã dựng xong thì không
   bao giờ vứt ảnh tĩnh — đúng như `tools.ts` và `http.ts` đang làm.

### 5.3 Vì sao không dùng `GET /jobs/:id`

`http.ts` từ chối mọi method khác `POST` bằng `405`. Đó là quyết định có chủ ý:
`render.yaml` cố tình không khai đường kiểm-tra-sống vì `GET /healthz` sẽ đỏ vĩnh
viễn và làm Render restart vòng lặp. Cả hai cửa mới đều `POST` nên không phải nới
luật đó ra và không phải xem lại quyết định ở `render.yaml`.

## 6. Xử lý lỗi

- **Một việc hỏng không được giết vòng thợ.** Mọi lời gọi render trong thợ nằm trong
  bọc bắt lỗi riêng; việc chuyển sang *hỏng*, thợ rút việc kế tiếp. Ở đường đồng bộ
  một lỗi chỉ giết một yêu cầu; ở đây nó có thể giết cả hàng đợi nếu viết ẩu.
- **Chỗ đã giữ thì mọi lối ra đều phải trả.** Lối lấy-có-chờ giải phóng slot trong
  `finally`, đúng kỷ luật `http.ts`/`tools.ts` đã đặt. Một slot rò rỉ trong hệ có hàng
  chờ không phải là chậm — nó là **treo vĩnh viễn**: người chờ cuối hàng không bao giờ
  được đánh thức.
- **Hồ trình duyệt hết giờ chờ** → việc hỏng với `errorKind: "server"`, không im lặng
  thử lại. Số thợ mặc định không vượt sức chứa của hồ để tình huống này là bất thường.
- **Chờ slot cũng phải có hạn.** Hàng chờ không hạn không phải là kiên nhẫn — nó là treo
  vĩnh viễn đội lốt *đang chờ*: một slot rò rỉ thì việc nằm trong hàng mãi mãi, người gọi
  hỏi lại mãi vẫn thấy *đang chờ*, và bản ghi hết hạn giữ trước khi kịp chạy. Quá hạn chờ
  → việc hỏng với `errorKind: "server"`. Repo đã trả giá đúng lớp lỗi này một lần ở
  commit `b5f6e77` (hồ trình duyệt bị bỏ đói) — lối lấy có-chờ mới không được lặp lại.
- **Thợ dọn tệp, và chỉ dọn tệp do chính việc đó ghi**, đối chiếu theo đường dẫn lưu
  trong bản ghi, không quét thư mục theo khuôn tên — `sinkDir` còn chứa sản phẩm của các
  công cụ MCP khác. Sổ việc phát danh sách hết hạn; thợ mới là bên gọi `fs.rm`.
- **Khởi động lại = mọi mã thành vô danh**, người gọi nhận `404`. Nói thẳng chứ không
  giấu vào chú thích; đây chính là lỗ mà gói độ bền lấp.

## 7. Ba núm chỉnh

| Núm | Biến môi trường | Mặc định | Vì sao có |
|---|---|---|---|
| Số thợ | `MAPPOSTER_JOB_WORKERS` | bằng sức chứa hồ trình duyệt | vượt lên là tự chuốc hết-giờ-chờ |
| Trần hàng chờ | `MAPPOSTER_MAX_QUEUED_JOBS` | 50 | hàng chờ không trần = OOM có hẹn giờ |
| Hạn giữ việc đã kết thúc | `MAPPOSTER_JOB_TTL_MS` | 30 phút | bản ghi rẻ, tệp thì không |
| Hạn chờ slot của thợ | `MAPPOSTER_JOB_SLOT_WAIT_MS` | 10 phút | chờ không hạn = treo vĩnh viễn đội lốt *đang chờ* |

Cả ba đọc qua `envNumber` (`mcp-server/config.ts`) với cận dưới, đúng nếp mọi núm hiện có.
Các con số này là **mặc định để chạy được**, không phải hằng số thiêng: chúng chưa dựa trên
số đo tải thật vì chưa có tải thật. Số đo đầu tiên từ OneHub phải được đưa ngược vào đây.

## 8. Kiểm thử

Tầng chính là **unit test chạy không cần trình duyệt** — thao tác render tiêm giả.

| Đo gì | Ở đâu |
|---|---|
| Tạo việc, đổi trạng thái, trần hàng chờ, hạn giữ rồi dọn, mã lạ | `jobStore.test.ts` |
| Đúng thứ tự trước-sau, đúng số việc chạy cùng lúc, một việc hỏng không chặn hàng | `jobRunner.test.ts` |
| Người chờ được đánh thức đúng thứ tự; slot trả trên mọi lối ra; **lối ném-ngay cũ không đổi hành vi** | `motionCompiler.test.ts` |
| Nhận việc `400`/`401`/`429`; hỏi việc `404` và các hình dạng phản hồi | `http.test.ts` |
| Đường MCP `render_clip` vẫn từ chối ngay như cũ | `tools.test.ts` |

Dòng thứ ba và thứ năm là chốt chặn chống thụt lùi quan trọng nhất: chúng chứng minh
đường đồng bộ không hưởng hàng chờ.

Không thêm kiểm thử đầu-cuối: gói này **không chạm giao diện người dùng nào**.

## 9. Không làm ở gói này

- **Độ bền qua khởi động lại** — hợp đồng riêng, kéo theo quyết định hạ tầng và tiền.
- **Gọi ngược khi xong (webhook)** — chuẩn ngành có (Bannerbear, Shotstack); OneHub
  chưa cần, và không có độ bền thì gọi ngược cũng không đáng tin.
- **Huỷ việc · ưu tiên việc · tự thử lại khi lỗi máy chủ** — có ở BullMQ, AWS
  MediaConvert; chưa có nhu cầu nêu ra.
- **Báo tiến độ theo phần trăm** — clip có nhiều khung nên đo được, chưa ai hỏi.
- **`Location` + `Retry-After` theo RFC 7240** — chọn thân JSON cho khớp nếp sẵn có
  của repo, không phải vì không biết chuẩn.
- **Khử trùng hai việc giống hệt** — người gọi có thể cố tình muốn hai bản.
- **Nhiều instance / hàng đợi phân tán** — máy chủ đang là một instance.
- **Màn hình xem hàng đợi** — gói này không có bề mặt người dùng.

## 10. Đối chiếu ngoài

Lớp sản phẩm này có tên rõ: **Shotstack**, **Bannerbear**, **Remotion Lambda**,
**AWS MediaConvert** đều theo mô hình gửi-việc-rồi-hỏi; chuẩn giao thức là **HTTP 202
Accepted** và **RFC 7240 `Prefer: respond-async`**; thư viện hàng đợi cùng loại là
**BullMQ**. Gói này lấy phần lõi chung của cả nhóm (mã việc + hỏi trạng thái + hạn
giữ kết quả) và cố ý bỏ phần vành (gọi ngược, ưu tiên, thử lại) cho tới khi có nhu
cầu thật.
