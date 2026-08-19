# Thăm dò đường video — model `google/gemini-3.7-flash`

- Clip ĐỘNG: `/tmp/van3-probe-dong.mp4` — câu trả lời đúng là **YES**
- Clip ĐỨNG YÊN: `/tmp/van3-probe-yen.mp4` — câu trả lời đúng là **NO**

## Mốc nền — CHỈ CHỮ, không đính video

- HTTP 200 · 3442 ms · `prompt_tokens` = **41** · trả: `NO`

Mọi lời gọi dưới đây dùng CÙNG câu hỏi này. Chênh lệch `prompt_tokens` so với 41 là phần token của video.

## Bảng kết quả

| Hình dạng | clip ĐỘNG (đúng: YES) | prompt_tokens | clip ĐỨNG YÊN (đúng: NO) | prompt_tokens | Kết luận |
|---|---|---|---|---|---|
| `video_url` | YES | 230 | NO | 230 | **PHÂN BIỆT ĐƯỢC — dùng được** |
| `image_url-mime-video` | YES | 230 | NO | 230 | **PHÂN BIỆT ĐƯỢC — dùng được** |
| `file-file_data` | YES | 230 | NO | 230 | **PHÂN BIỆT ĐƯỢC — dùng được** |
