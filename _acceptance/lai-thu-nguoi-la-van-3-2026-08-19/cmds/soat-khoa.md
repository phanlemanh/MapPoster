# Soát khoá trước khi commit — ván #3

Chạy 2026-08-19T16:03:51Z. Nghi thức giữ nguyên như ván #2.

## 1. Tìm tiền tố khoá OpenRouter trong mọi tệp bằng chứng

```
$ grep -rIn "sk-or-" _acceptance/lai-thu-nguoi-la-van-3-2026-08-19/ _acceptance/lai-thu-nguoi-la-van-3-2026-08-19.md _acceptance/*/stranger-drive.md
_acceptance/lai-thu-nguoi-la-van-3-2026-08-19/cmds/lenh-va-moc-gio.md:96:$ grep -rIn "sk-or-" _acceptance/lai-thu-nguoi-la-van-3-2026-08-19/ | grep -v "OPENROUTER_API_KEY"
^^^ CÓ KHỚP — PHẢI XỬ LÝ
```

## 2. Tìm CHÍNH giá trị khoá đang dùng (không in giá trị ra đây)

Đọc khoá từ env vào biến shell rồi `grep -F` theo biến — bản thân lệnh không
chứa giá trị, và kết quả dưới đây chỉ là số dòng khớp.

```
số dòng chứa nguyên văn khoá: 0
=> SẠCH
```

## 3. Soát cả những chuỗi trông như khoá nói chung

```
$ grep -rInE "(api[_-]?key|bearer|authorization)[\"' :=]+[A-Za-z0-9_-]{20,}" …
(không dòng nào khớp)
```

## 4. Quyền tệp khoá vẫn đúng

```
-rw------- /Users/manh-macmini/.config/acceptance-gate/openrouter.env
```

Tệp khoá nằm ở `~/.config/acceptance-gate/`, **ngoài mọi kho git**. Không
script nào của ván in giá trị khoá ra stdout, tệp kết quả, hay commit.

## Đọc kết quả

Mục 1 khớp **đúng một dòng**, và dòng đó là **chính câu lệnh grep** được chép vào
`cmds/lenh-va-moc-gio.md` làm tài liệu — chuỗi `sk-or-` ở đó là mẫu tìm kiếm, không
phải khoá. Không tệp bằng chứng nào chứa giá trị.

Kiểm quyết định là **mục 2**: tìm nguyên văn giá trị khoá đang dùng trong toàn bộ
thư mục bằng chứng, hồ sơ tổng và mọi stub → **0 dòng**. Mục 3 (mọi chuỗi trông
như khoá nói chung) cũng 0 dòng.

⇒ **Sạch, được phép commit.**
