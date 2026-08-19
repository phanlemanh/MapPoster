# Lệnh cầu nối, mốc giờ, và kỷ luật staleness

## Cầu nối cấp cho người-lạ (biến thể agent)

Người-lạ KHÔNG được cấp đường dẫn kho. Chúng chỉ nhận một wrapper trung tính
đặt ngoài kho, đã điền sẵn `--cwd`/`--server`:

```
node /private/tmp/claude-501/sd2/drive.mjs list
node /private/tmp/claude-501/sd2/drive.mjs call <tool> '<json args>'
```

Nội dung wrapper (gọi `mcp-drive.mjs` của kit):

```js
const BRIDGE = '/Users/manh-macmini/dev/acceptance-gate-kit/docs/tools/mcp-drive.mjs'
const CWD    = '/Users/manh-macmini/dev/map'
const SERVER = 'MAPPOSTER_APP_PORT=0 MAPPOSTER_POOL=1 MAPPOSTER_SINK=_render-out npx -y tsx mcp-server/src/stdio.ts'
```

Wrapper đặt ở `/private/tmp/claude-501/sd2/` chứ KHÔNG ở scratchpad của phiên,
vì đường dẫn scratchpad có chứa nguyên tên kho (`-Users-manh-macmini-dev-map-…`)
— để đó thì người-lạ đọc lệnh là biết kho nằm đâu.

## Mốc giờ (kỷ luật staleness)

| Mốc | Thời điểm |
|---|---|
| Lần sửa mã sản phẩm cuối (`mcp-server/src/recipes.ts`) | 2026-08-19 17:56:58 +0700 |
| MCP server khởi động lần đầu trong ván (cầu nối spawn tươi mỗi lệnh) | 2026-08-19 20:57:20 +0700 |
| Dev server UI khởi động | 2026-08-19 21:15:03 +0700 |
| Ván bắt đầu (UTC) | 2026-08-19T13:55:56Z |

Server khởi động SAU lần sửa mã cuối ⇒ ván chạm đúng mã hiện tại.

## Mã KHÔNG đổi giữa ván (đo, không đoán)

```
vân tay mcp-server/src + renderer   TRƯỚC: 86011a95ed26a356c2f43a414c52fcb1
                                     SAU: 86011a95ed26a356c2f43a414c52fcb1
vân tay src/ (bề mặt web)           TRƯỚC: f2be581b89a19c9cffa537eed423f4f0
                                     SAU: f2be581b89a19c9cffa537eed423f4f0
```

Lệnh dùng:

```
find <cây> -type f \( -name '*.ts' -o -name '*.tsx' -o … \) | sort | xargs md5 -q | md5 -q
```

`src/` của worktree phiên lái cũng cho `f2be581b89a19c9cffa537eed423f4f0`, tức
dev server UI phục vụ đúng mã của kho chính.

## Trạng thái bản vá P0-1 khi chạy ván

**CHƯA merge.** Đo tại `mcp-server/src/route.ts`:

```
54:const DEFAULT_OSRM_URL = 'https://routing.openstreetmap.de/routed-car';
150:const url = `${base}/route/v1/${profile}/${path}?…`
195:provider: `osrm/${profile}`
```

mtime `route.ts` = 2026-08-07 19:26 (chỉ MỘT commit từng chạm tệp: 338674d, 2026-08-07), md5 `4bb7655ec132e9e4718dad492f26b1a4`.
⇒ Vấp "đi bộ chạy theo ô tô" tái xuất trong ván này **KHÔNG tính là phát hiện mới**.

## Điều kiện vào khác

- Suite máy: `npm test` → `Test Files 39 passed | 3 skipped (42)` · `Tests 629 passed | 17 skipped (646)`.
- Cây git: không worktree nào đang sửa mã. Sai lệch nhỏ đã khai: 2 tệp chưa
  commit thuộc `_acceptance/area-overview-default/` (hồ sơ, không phải mã).

## Đối chứng dương cho làn UI

```
[1/1] [chromium] › e2e/mapposter.spec.ts:222:1 › export: Download → PNG triggers a file download
  1 passed (6.7s)
```

## Răng cho luật cấm-DOM (biến thể UI)

`.claude/settings.local.json` của phiên lái (gitignored) đặt `deny` cho
`browser_snapshot`, `browser_evaluate`, `browser_run_code`,
`browser_console_messages`, `browser_network_requests`, `read_page`,
`get_page_text`, `javascript_tool`, `find`, `read_console_messages`,
`read_network_requests`.

**Sự cố cấu hình đã khai:** phiên điều phối ban đầu thêm cả `Read`/`Grep`/`Glob`
vào `deny`. Claude Code đối chiếu cả đích GHI với luật deny-read, nên việc này
chặn luôn `Write` ở mọi đường dẫn — cả ba người-lạ đều không tự lưu được nhật ký,
và phiên điều phối phải ghi hồ sơ qua Bash. Đây là lỗi dựng môi trường của phiên
điều phối, không phải vấp của sản phẩm; ghi lại để ván sau không lặp.
