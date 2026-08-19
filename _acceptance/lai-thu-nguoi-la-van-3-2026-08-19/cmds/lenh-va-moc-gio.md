# Lệnh, mốc giờ, vân tay — ván #3

Mọi con số dưới đây là output của lệnh, không gõ tay. Khoá OpenRouter đọc từ
`~/.config/acceptance-gate/openrouter.env` (ngoài mọi kho git, quyền `600`) và
**không script nào in giá trị khoá ra**.

## Điều kiện vào

### Cây git

```
$ git -C /Users/manh-macmini/dev/map status --short
 M _acceptance/area-overview-default/card.html
?? _acceptance/area-overview-default/evidence-page.html
```

**Sai lệch đã khai:** cây không sạch tuyệt đối — đúng 2 tệp, cả hai thuộc
`_acceptance/` (hồ sơ nghiệm thu, **không phải mã**), do một phiên khác để lại.
Không tệp mã nào bẩn. Ván #2 vào ván với đúng tình trạng này.

### Suite

```
$ npm test        # bắt đầu 2026-08-19T15:01:31Z
 Test Files  39 passed | 3 skipped (42)
      Tests  629 passed | 17 skipped (646)
   Duration  3.48s
                  # kết thúc 2026-08-19T15:01:34Z, exit 0
```

Trùng khít con số của ván #2 (629 pass / 17 skip).

### Hai mốc giờ (staleness)

| Mốc | Giờ UTC | Lấy bằng |
|---|---|---|
| Sửa mã cuối | `2026-08-19T11:53:43Z` (`src/test-env/webstorage-isolation.test.ts`) | `find … -exec stat -f '%m %N'` rồi `date -r` |
| MCP server khởi động lần đầu của ván | `2026-08-19T15:02:43Z` | `date -u` ngay trước lời gọi cầu nối đầu tiên |

Server khởi động **sau** lần sửa mã cuối 3 giờ 9 phút. Cầu nối sinh một tiến
trình server MỚI cho mỗi lời gọi, nên mọi lời gọi trong ván đều chạy trên mã
sau lần sửa cuối.

### Vân tay cây mã (trước ván)

```
$ find mcp-server/src src -type f \( -name '*.ts' -o -name '*.tsx' \) | sort | xargs md5 -q | md5 -q
f2b6cbc6fd19b3489a588a02a2555a27
```

### Trạng thái bản vá P0-1

Xem [`chieu-ky-vong-ghi-truoc.md`](chieu-ky-vong-ghi-truoc.md) — đo trước khi hỏi
bất kỳ câu nào: **CHƯA vá**.

## Cầu nối cấp cho phiên người-lạ

```
node /Users/manh-macmini/dev/map/_acceptance/lai-thu-nguoi-la-van-3-2026-08-19/tools/mcp-drive.mjs \
  --cwd /Users/manh-macmini/dev/map \
  --server "npx tsx mcp-server/src/stdio.ts" list

node …/mcp-drive.mjs --cwd … --server "npx tsx mcp-server/src/stdio.ts" call <tool> '<json>'
```

**Sai lệch đã khai:** bản cầu nối của ván này nới trần chờ từ 120 s cố định lên
`MCP_DRIVE_TIMEOUT_MS` (mặc định 600 s). Lý do: ván #2 đo được lời gọi
`route-journey` vượt 120 s (KC-7); giữ 120 s thì mọi lời gọi video hỏng vì cầu
nối chứ không phải vì sản phẩm. Thay đổi chỉ chạm cầu nối, không chạm sản phẩm.

## Model VLM

```
$ curl -s -H "Authorization: Bearer $OPENROUTER_API_KEY" https://openrouter.ai/api/v1/models | …
google/gemini-3.7-flash | ["text","image","video","file","audio"]
```

Id `google/gemini-3.7-flash` **tồn tại nguyên văn**, không hậu tố phiên bản, và
tự khai nhận `video` làm input. Khai năng lực ≠ chấp nhận payload, nên đường
video còn được thử bằng lời gọi thật: [`tham-do-duong-video.md`](tham-do-duong-video.md).

## Giữ bản sao chống ghi đè

```
$ bash tools/giu-ban-sao.sh 1787151780 <thư-mục>/video 3000
```

Canh `_render-out/` 5 giây một vòng, chép mọi tệp mới có kích thước đã ổn định,
tên bản sao gắn `--mt<epoch>`. Lý do: CHẶN-1 của ván #2 (render ghi đè im lặng
cùng đường dẫn) đe doạ trực tiếp ván này, vì mục tiêu đi-bộ và mục tiêu ô-tô
dùng ĐÚNG một cặp điểm nên nhiều khả năng trỏ vào cùng một tên tệp.

## Soát khoá trước khi commit

```
$ grep -rIn "sk-or-" _acceptance/lai-thu-nguoi-la-van-3-2026-08-19/ | grep -v "OPENROUTER_API_KEY"
```

Kết quả chạy thật ghi ở [`soat-khoa.md`](soat-khoa.md).

## Vân tay cây mã SAU ván — mã không đổi giữa ván

```
$ find mcp-server/src src -type f \( -name '*.ts' -o -name '*.tsx' \) | sort | xargs md5 -q | md5 -q
f2b6cbc6fd19b3489a588a02a2555a27
```

**Trùng khít** vân tay trước ván. Ván không sửa một dòng mã nào của sản phẩm, nên
mọi phép đo trong ván nói về cùng một bản mã.

## Dọn dẹp sau ván

1. **Listener giữ chỗ của thí nghiệm tái hiện CHẶN-1 đã được tắt.** Nó là một
   tiến trình `node -e` do phiên điều phối tạo ra để chiếm cổng 4180; lệnh dọn
   ban đầu bắt nhầm pid của subshell nên nó sống sót tới gần cuối ván. Đã tắt,
   kiểm lại bằng `lsof` trên cổng 4180 → **0 tiến trình giữ**. Nếu để nguyên thì
   phiên sau sẽ dính đúng cái bẫy mà ván này vừa ghi.
2. **73 tiến trình `stdio.ts` mồ côi vẫn còn sống, CỐ Ý không tắt.** Chúng do cầu
   nối để lại (spawn một server cho mỗi lời gọi rồi thoát mà không giết tiến
   trình con); nhiều cái có tuổi hơn 1 giờ, tức có từ trước ván. Phiên điều phối
   không tự tắt vì **không phân biệt được** cái nào là rác của ván này với cái
   nào thuộc một phiên khác đang chạy. Việc này để người vận hành quyết:

   ```
   pkill -f 'mcp-server/src/stdio.ts'
   ```
