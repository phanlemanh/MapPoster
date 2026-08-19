# Làn video sâu — `google/gemini-3.7-flash` qua OpenRouter, gửi THẲNG mp4

Sinh bởi `tools/chay-lan-video.sh` lúc 2026-08-19T15:46:04Z.

Đường đã dùng: **gửi thẳng video** (`video_url` data-URI). Bằng chứng đường
này đọc được video thật chứ không đoán: [`cmds/tham-do-duong-video.md`](../cmds/tham-do-duong-video.md).
Chiều kỳ vọng ghi TRƯỚC khi hỏi: [`cmds/chieu-ky-vong-ghi-truoc.md`](../cmds/chieu-ky-vong-ghi-truoc.md).

---

## 0 · Đối chứng dương cho làn video

Nếu bộ chấm trả `YES` ("giống hệt nhau") cho một cặp khung chắc chắn khác
nhau thì cả làn không đáng tin và phải dừng.

<details><summary>ffprobe + md5 khung dùng cho đối chứng</summary>

## `mapposter-ho-hoan-kiem-1080x1920-0--mt1787151961.mp4`

### ffprobe
```
codec_name=h264
width=1080
height=1920
r_frame_rate=18/1
duration=6.000000
bit_rate=6158340
nb_frames=108
duration=6.000000
size=4620903
md5_clip=7748da8e87a88185d190965d30e52f2a
```

### Khung đã tách
```
doi-chung-dau.png  2440032 byte  md5 2a62b537a7139c5dcb316590558b6b04
doi-chung-giua.png  2361125 byte  md5 2b3e20eca6428211f07f20277cf02b4a
doi-chung-cuoi.png  2324094 byte  md5 b34d687c048eed61e1ade2d28d325980
```

</details>

**Đối chứng — khung ĐẦU vs khung CUỐI của một clip có chuyển động (kỳ vọng `NO`)**

- **Hỏi:** *"Item 1 and Item 2 are two still frames taken from the same video. Are these two frames identical to each other — the same picture with no visible difference?"*
- **Vật:** `doi-chung-dau.png` `doi-chung-cuoi.png` 
- **Trả lời:** `NO`
- **Output thô:** `NO — Item 1 and Item 2 are two still frames taken from the same video. Are these two frames identical to each other — the same picture with no visible difference?  [google/gemini-3.7-flash · Item 1 = ẢNH doi-chung-dau.png (2440032 byte) · Item 2 = ẢNH doi-chung-cuoi.png (2324094 byte) · prompt_tokens=2252]`

**Đối chứng ngược — cùng MỘT khung đưa hai lần (kỳ vọng `YES`)**

- **Hỏi:** *"Item 1 and Item 2 are two still frames taken from the same video. Are these two frames identical to each other — the same picture with no visible difference?"*
- **Vật:** `doi-chung-dau.png` `doi-chung-dau.png` 
- **Trả lời:** `YES`
- **Output thô:** `YES — Item 1 and Item 2 are two still frames taken from the same video. Are these two frames identical to each other — the same picture with no visible difference?  [google/gemini-3.7-flash · Item 1 = ẢNH doi-chung-dau.png (2440032 byte) · Item 2 = ẢNH doi-chung-dau.png (2440032 byte) · prompt_tokens=2252]`

---

## Clip walk

- Mô tả: Chuyến ĐI BỘ Hồ Hoàn Kiếm → Nhà hát Lớn. Lời gọi có `route.mode:"walk"`, `motion.preset:"follow"`, `format:"tiktok"`. Sản phẩm báo `provider:"osrm/foot"`.
- Preset camera **đã yêu cầu trong lời gọi**: `follow`

<details><summary>ffprobe · md5 · PSNR khung-cuối vs settle</summary>

## `mapposter-ho-hoan-kiem-1080x1920-0--mt1787151961.mp4`

### ffprobe
```
codec_name=h264
width=1080
height=1920
r_frame_rate=18/1
duration=6.000000
bit_rate=6158340
nb_frames=108
duration=6.000000
size=4620903
md5_clip=7748da8e87a88185d190965d30e52f2a
```

### Khung đã tách
```
clip-walk-dau.png  2440032 byte  md5 2a62b537a7139c5dcb316590558b6b04
clip-walk-giua.png  2361125 byte  md5 2b3e20eca6428211f07f20277cf02b4a
clip-walk-cuoi.png  2324094 byte  md5 b34d687c048eed61e1ade2d28d325980
```

### Khung cuối so với settle.png (PSNR — `inf` = trùng từng điểm ảnh)
```
settle=mapposter-ho-hoan-kiem-1080x1920-0-settle--mt1787151961.png  1916454 byte  md5 b79ac82f33c995e122b0a8c6fadfe453
khung CUỐI vs settle: [Parsed_psnr_0 @ 0x9d6c04cc0] PSNR r:33.111072 g:41.222834 b:29.148824 average:32.265776 min:32.265776 max:32.265776
khung ĐẦU  vs settle (đối chứng — clip có chuyển động thì phải THẤP hơn): [Parsed_psnr_0 @ 0x8aec18c00] PSNR r:11.178669 g:15.642343 b:21.326904 average:14.322930 min:14.322930 max:14.322930
```

</details>

**(a) Chuyển động camera có khớp preset `follow` đã yêu cầu?**

- **Hỏi:** *"This is a map animation. The caller explicitly requested a camera movement preset named 'follow'. Watch the whole video. Does the camera movement you actually see match that named preset?"*
- **Trả lời:** `YES`
- **Output thô:** `YES — This is a map animation. The caller explicitly requested a camera movement preset named 'follow'. Watch the whole video. Does the camera movement you actually see match that named preset?  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=441]`

**(c) Có khung đóng băng · giật · lặp · artifact nén thấy được?**

- **Hỏi:** *"Watch this video closely from start to end. Does it contain any visible defect — a frozen or stuck frame, a stutter or jump in the motion, a section that repeats, or clearly visible compression artifacts such as blocking or smearing?"*
- **Trả lời:** `NO`
- **Output thô:** `NO — Watch this video closely from start to end. Does it contain any visible defect — a frozen or stuck frame, a stutter or jump in the motion, a section that repeats, or clearly visible compression artifacts such as blocking or smearing?  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=453]`

**(e) Nhãn chữ có đọc được TRONG LÚC chuyển động?**

- **Hỏi:** *"Watch this video while it is moving, not just at the end. Is every piece of overlaid text (place name, labels, coordinates, any caption) clearly legible during the moving part of the clip — not blurred, not smeared, not hidden behind map lines?"*
- **Trả lời:** `NO`
- **Output thô:** `NO — Watch this video while it is moving, not just at the end. Is every piece of overlaid text (place name, labels, coordinates, any caption) clearly legible during the moving part of the clip — not blurred, not smeared, not hidden behind map lines?  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=459]`

**(e2) Trong clip có BẤT KỲ chữ/số nào được vẽ vào hình không? (hợp đồng nói không được có — kỳ vọng `NO`)**

- **Hỏi:** *"Watch this whole video. Does the picture itself contain any rendered text — any letters, words, place names, numbers, coordinates, captions or watermarks burned into the frames? Answer YES if you can see any text at all in the picture; answer NO if the picture is purely map graphics with no text."*
- **Trả lời:** `YES`
- **Output thô:** `YES — Watch this whole video. Does the picture itself contain any rendered text — any letters, words, place names, numbers, coordinates, captions or watermarks burned into the frames? Answer YES if you can see any text at all in the picture; answer NO if the picture is purely map graphics with no text.  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=468]`

**(d) Khung CUỐI clip có khớp `mapposter-ho-hoan-kiem-1080x1920-0-settle--mt1787151961.png`?**

- **Hỏi:** *"Item 1 is the final frame taken from a video. Item 2 is a separate still image that the same product exported alongside that video as its final settled frame. Do these two pictures show the same view — same map area, same camera angle, same visible elements — allowing only for differences in compression quality?"*
- **Vật:** `clip-walk-cuoi.png` `mapposter-ho-hoan-kiem-1080x1920-0-settle--mt1787151961.png` 
- **Trả lời:** `YES`
- **Output thô:** `YES — Item 1 is the final frame taken from a video. Item 2 is a separate still image that the same product exported alongside that video as its final settled frame. Do these two pictures show the same view — same map area, same camera angle, same visible elements — allowing only for differences in compression quality?  [google/gemini-3.7-flash · Item 1 = ẢNH clip-walk-cuoi.png (2324094 byte) · Item 2 = ẢNH mapposter-ho-hoan-kiem-1080x1920-0-settle--mt1787151961.png (1916454 byte) · prompt_tokens=2281]`

---

## Clip car

- Mô tả: Chuyến Ô TÔ cùng đúng hai điểm đó. Lời gọi có `route.mode:"car"`, `motion.preset:"follow"`, `format:{width:1080,height:1921}` (người-lạ lách 1 pixel để không bị ghi đè). Sản phẩm báo `provider:"osrm/driving"`.
- Preset camera **đã yêu cầu trong lời gọi**: `follow`

<details><summary>ffprobe · md5 · PSNR khung-cuối vs settle</summary>

## `mapposter-ho-hoan-kiem-1080x1921-0--mt1787153522.mp4`

### ffprobe
```
codec_name=h264
width=1080
height=1920
r_frame_rate=18/1
duration=6.000000
bit_rate=6326964
nb_frames=108
duration=6.000000
size=4747359
md5_clip=7a89a3d4ecf0602849aa597968c72f63
```

### Khung đã tách
```
clip-car-dau.png  2479637 byte  md5 cab015ee80a527aa3abde02b64cc03b1
clip-car-giua.png  2398857 byte  md5 6fd4006460c27de480c9e98e326d4e9d
clip-car-cuoi.png  2357486 byte  md5 1a09d3286a24cf5af801e26dc565fe3d
```

### Khung cuối so với settle.png (PSNR — `inf` = trùng từng điểm ảnh)
```
settle=mapposter-ho-hoan-kiem-1080x1921-0-settle--mt1787153522.png  1738493 byte  md5 1bff0bb7dc770a34a72ab6ecd04d1875
khung CUỐI vs settle: [Parsed_psnr_0 @ 0xa64c20c00] Failed to configure input pad on Parsed_psnr_0
khung ĐẦU  vs settle (đối chứng — clip có chuyển động thì phải THẤP hơn): [Parsed_psnr_0 @ 0xb3cc18c00] Failed to configure input pad on Parsed_psnr_0
```

</details>

**(a) Chuyển động camera có khớp preset `follow` đã yêu cầu?**

- **Hỏi:** *"This is a map animation. The caller explicitly requested a camera movement preset named 'follow'. Watch the whole video. Does the camera movement you actually see match that named preset?"*
- **Trả lời:** `YES`
- **Output thô:** `YES — This is a map animation. The caller explicitly requested a camera movement preset named 'follow'. Watch the whole video. Does the camera movement you actually see match that named preset?  [google/gemini-3.7-flash · 4747359 byte · prompt_tokens=441]`

**(c) Có khung đóng băng · giật · lặp · artifact nén thấy được?**

- **Hỏi:** *"Watch this video closely from start to end. Does it contain any visible defect — a frozen or stuck frame, a stutter or jump in the motion, a section that repeats, or clearly visible compression artifacts such as blocking or smearing?"*
- **Trả lời:** `NO`
- **Output thô:** `NO — Watch this video closely from start to end. Does it contain any visible defect — a frozen or stuck frame, a stutter or jump in the motion, a section that repeats, or clearly visible compression artifacts such as blocking or smearing?  [google/gemini-3.7-flash · 4747359 byte · prompt_tokens=453]`

**(e) Nhãn chữ có đọc được TRONG LÚC chuyển động?**

- **Hỏi:** *"Watch this video while it is moving, not just at the end. Is every piece of overlaid text (place name, labels, coordinates, any caption) clearly legible during the moving part of the clip — not blurred, not smeared, not hidden behind map lines?"*
- **Trả lời:** `NO`
- **Output thô:** `NO — Watch this video while it is moving, not just at the end. Is every piece of overlaid text (place name, labels, coordinates, any caption) clearly legible during the moving part of the clip — not blurred, not smeared, not hidden behind map lines?  [google/gemini-3.7-flash · 4747359 byte · prompt_tokens=459]`

**(e2) Trong clip có BẤT KỲ chữ/số nào được vẽ vào hình không? (hợp đồng nói không được có — kỳ vọng `NO`)**

- **Hỏi:** *"Watch this whole video. Does the picture itself contain any rendered text — any letters, words, place names, numbers, coordinates, captions or watermarks burned into the frames? Answer YES if you can see any text at all in the picture; answer NO if the picture is purely map graphics with no text."*
- **Trả lời:** `YES`
- **Output thô:** `YES — Watch this whole video. Does the picture itself contain any rendered text — any letters, words, place names, numbers, coordinates, captions or watermarks burned into the frames? Answer YES if you can see any text at all in the picture; answer NO if the picture is purely map graphics with no text.  [google/gemini-3.7-flash · 4747359 byte · prompt_tokens=468]`

**(d) Khung CUỐI clip có khớp `mapposter-ho-hoan-kiem-1080x1921-0-settle--mt1787153522.png`?**

- **Hỏi:** *"Item 1 is the final frame taken from a video. Item 2 is a separate still image that the same product exported alongside that video as its final settled frame. Do these two pictures show the same view — same map area, same camera angle, same visible elements — allowing only for differences in compression quality?"*
- **Vật:** `clip-car-cuoi.png` `mapposter-ho-hoan-kiem-1080x1921-0-settle--mt1787153522.png` 
- **Trả lời:** `YES`
- **Output thô:** `YES — Item 1 is the final frame taken from a video. Item 2 is a separate still image that the same product exported alongside that video as its final settled frame. Do these two pictures show the same view — same map area, same camera angle, same visible elements — allowing only for differences in compression quality?  [google/gemini-3.7-flash · Item 1 = ẢNH clip-car-cuoi.png (2357486 byte) · Item 2 = ẢNH mapposter-ho-hoan-kiem-1080x1921-0-settle--mt1787153522.png (1738493 byte) · prompt_tokens=2281]`

---

## Clip noir

- Mô tả: Chùa Một Cột, theme `noir` (`dark:true`, nền `#0a0a0a`), có `highlight.points` một điểm icon sao trắng.
- Preset camera **đã yêu cầu trong lời gọi**: `pushIn`

<details><summary>ffprobe · md5 · PSNR khung-cuối vs settle</summary>

## `mapposter-chua-mot-cot-1080x1920-0--mt1787153427.mp4`

### ffprobe
```
codec_name=h264
width=1080
height=1920
r_frame_rate=18/1
duration=6.000000
bit_rate=5178956
nb_frames=108
duration=6.000000
size=3886245
md5_clip=6958c047b9ce8f31af628422960c055d
```

### Khung đã tách
```
clip-noir-dau.png  1535908 byte  md5 0e8cf0b4638962f65fd2457ba5531497
clip-noir-giua.png  1278503 byte  md5 fa0ab1f8c0367989bb1c2938bc026733
clip-noir-cuoi.png  1281131 byte  md5 92c426fc590bd5a71ee5334f84806089
```

### Khung cuối so với settle.png (PSNR — `inf` = trùng từng điểm ảnh)
```
settle=mapposter-chua-mot-cot-1080x1920-0-settle--mt1787153427.png  1232563 byte  md5 19dcb71b92c2924a1a4f9f00f9277ee8
khung CUỐI vs settle: [Parsed_psnr_0 @ 0x92ac20840] PSNR r:36.855820 g:36.855820 b:36.855820 average:36.855820 min:36.855820 max:36.855820
khung ĐẦU  vs settle (đối chứng — clip có chuyển động thì phải THẤP hơn): [Parsed_psnr_0 @ 0x886c05080] PSNR r:12.302991 g:12.302991 b:12.302991 average:12.302991 min:12.302991 max:12.302991
```

</details>

**(a) Chuyển động camera có khớp preset `pushIn` đã yêu cầu?**

- **Hỏi:** *"This is a map animation. The caller explicitly requested a camera movement preset named 'pushIn'. Watch the whole video. Does the camera movement you actually see match that named preset?"*
- **Trả lời:** `YES`
- **Output thô:** `YES — This is a map animation. The caller explicitly requested a camera movement preset named 'pushIn'. Watch the whole video. Does the camera movement you actually see match that named preset?  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=442]`

**(c) Có khung đóng băng · giật · lặp · artifact nén thấy được?**

- **Hỏi:** *"Watch this video closely from start to end. Does it contain any visible defect — a frozen or stuck frame, a stutter or jump in the motion, a section that repeats, or clearly visible compression artifacts such as blocking or smearing?"*
- **Trả lời:** `YES`
- **Output thô:** `YES — Watch this video closely from start to end. Does it contain any visible defect — a frozen or stuck frame, a stutter or jump in the motion, a section that repeats, or clearly visible compression artifacts such as blocking or smearing?  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=453]`

**(e) Nhãn chữ có đọc được TRONG LÚC chuyển động?**

- **Hỏi:** *"Watch this video while it is moving, not just at the end. Is every piece of overlaid text (place name, labels, coordinates, any caption) clearly legible during the moving part of the clip — not blurred, not smeared, not hidden behind map lines?"*
- **Trả lời:** `NO`
- **Output thô:** `NO — Watch this video while it is moving, not just at the end. Is every piece of overlaid text (place name, labels, coordinates, any caption) clearly legible during the moving part of the clip — not blurred, not smeared, not hidden behind map lines?  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=459]`

**(e2) Trong clip có BẤT KỲ chữ/số nào được vẽ vào hình không? (hợp đồng nói không được có — kỳ vọng `NO`)**

- **Hỏi:** *"Watch this whole video. Does the picture itself contain any rendered text — any letters, words, place names, numbers, coordinates, captions or watermarks burned into the frames? Answer YES if you can see any text at all in the picture; answer NO if the picture is purely map graphics with no text."*
- **Trả lời:** `YES`
- **Output thô:** `YES — Watch this whole video. Does the picture itself contain any rendered text — any letters, words, place names, numbers, coordinates, captions or watermarks burned into the frames? Answer YES if you can see any text at all in the picture; answer NO if the picture is purely map graphics with no text.  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=468]`

**(d) Khung CUỐI clip có khớp `mapposter-chua-mot-cot-1080x1920-0-settle--mt1787153427.png`?**

- **Hỏi:** *"Item 1 is the final frame taken from a video. Item 2 is a separate still image that the same product exported alongside that video as its final settled frame. Do these two pictures show the same view — same map area, same camera angle, same visible elements — allowing only for differences in compression quality?"*
- **Vật:** `clip-noir-cuoi.png` `mapposter-chua-mot-cot-1080x1920-0-settle--mt1787153427.png` 
- **Trả lời:** `YES`
- **Output thô:** `YES — Item 1 is the final frame taken from a video. Item 2 is a separate still image that the same product exported alongside that video as its final settled frame. Do these two pictures show the same view — same map area, same camera angle, same visible elements — allowing only for differences in compression quality?  [google/gemini-3.7-flash · Item 1 = ẢNH clip-noir-cuoi.png (1281131 byte) · Item 2 = ẢNH mapposter-chua-mot-cot-1080x1920-0-settle--mt1787153427.png (1232563 byte) · prompt_tokens=2281]`

---

## Câu (b) — tuyến dán nhãn ĐI BỘ có bám đường đi bộ suốt chiều dài clip?

**(b) Suốt chiều dài clip, tuyến đi bộ bám vỉa hè/lối đi bộ hay chạy lòng đường ô tô?**

- **Hỏi:** *"This map animation shows a highlighted route that the product labelled as a WALKING route. Watch the route for the WHOLE length of the clip, not just one moment. Answer YES if the highlighted line stays on pedestrian ways — footpaths, park walkways, pavements or narrow alleys — for the whole clip. Answer NO if it instead follows the main vehicle carriageways of the street network."*
- **Trả lời:** `NO`
- **Output thô:** `NO — This map animation shows a highlighted route that the product labelled as a WALKING route. Watch the route for the WHOLE length of the clip, not just one moment. Answer YES if the highlighted line stays on pedestrian ways — footpaths, park walkways, pavements or narrow alleys — for the whole clip. Answer NO if it instead follows the main vehicle carriageways of the street network.  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=484]`

---

## Câu (f) — phép đo thị giác trực tiếp cho P0-1

Chiều kỳ vọng đã ghi TRƯỚC khi hỏi, trong `cmds/chieu-ky-vong-ghi-truoc.md`:
mã CHƯA vá ⇒ kỳ vọng **`NO`** (hai clip trùng tuyến). `YES` là mâu thuẫn
phải điều tra, không phải tin vui.

**(f) Hai clip cùng cặp điểm — tuyến vẽ trên bản đồ có KHÁC nhau?**

- **Hỏi:** *"Item 1 and Item 2 are two map animations of a journey between the SAME two places. Item 1 was requested as a WALKING journey and Item 2 as a CAR journey. Look at the shape of the highlighted route line drawn on the map in each. Answer YES if the two highlighted routes follow visibly different paths through the street network. Answer NO if they trace the same path."*
- **Vật:** `mapposter-ho-hoan-kiem-1080x1920-0--mt1787151961.mp4` `mapposter-ho-hoan-kiem-1080x1921-0--mt1787153522.mp4` 
- **Trả lời:** `NO`
- **Output thô:** `NO — Item 1 and Item 2 are two map animations of a journey between the SAME two places. Item 1 was requested as a WALKING journey and Item 2 as a CAR journey. Look at the shape of the highlighted route line drawn on the map in each. Answer YES if the two highlighted routes follow visibly different paths through the street network. Answer NO if they trace the same path.  [google/gemini-3.7-flash · Item 1 = VIDEO mapposter-ho-hoan-kiem-1080x1920-0--mt1787151961.mp4 (4620903 byte) · Item 2 = VIDEO mapposter-ho-hoan-kiem-1080x1921-0--mt1787153522.mp4 (4747359 byte) · prompt_tokens=890]`

---

## Khoanh vùng câu (c) của Clip noir

Câu (c) gộp bốn khiếm khuyết vào một câu, nên `YES` chưa nói được là khiếm
khuyết nào. Bốn câu tách dưới đây hỏi từng loại riêng, hỏi trên CẢ clip noir
(bên bị) lẫn clip walk (đối chứng — câu (c) của nó trả `NO`).

### clip noir

- **c1 hỏi:** *"Watch this video. Does the picture freeze — is there a stretch where the image stops changing while the clip is still playing?"*
- **Trả lời:** `YES`
- **Thô:** `YES — Watch this video. Does the picture freeze — is there a stretch where the image stops changing while the clip is still playing?  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=431]`

- **c2 hỏi:** *"Watch this video. Is the motion uneven — does it stutter, jump, or change speed abruptly rather than moving smoothly?"*
- **Trả lời:** `YES`
- **Thô:** `YES — Watch this video. Is the motion uneven — does it stutter, jump, or change speed abruptly rather than moving smoothly?  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=430]`

- **c3 hỏi:** *"Watch this video. Does any part of the footage repeat — do you see the same motion or the same view come back a second time?"*
- **Trả lời:** `NO`
- **Thô:** `NO — Watch this video. Does any part of the footage repeat — do you see the same motion or the same view come back a second time?  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=434]`

- **c4 hỏi:** *"Watch this video. Are there clearly visible compression artifacts — blocky squares, colour banding, or smearing around moving edges?"*
- **Trả lời:** `NO`
- **Thô:** `NO — Watch this video. Are there clearly visible compression artifacts — blocky squares, colour banding, or smearing around moving edges?  [google/gemini-3.7-flash · 3886245 byte · prompt_tokens=431]`
### clip walk

- **c1 hỏi:** *"Watch this video. Does the picture freeze — is there a stretch where the image stops changing while the clip is still playing?"*
- **Trả lời:** `YES`
- **Thô:** `YES — Watch this video. Does the picture freeze — is there a stretch where the image stops changing while the clip is still playing?  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=431]`

- **c2 hỏi:** *"Watch this video. Is the motion uneven — does it stutter, jump, or change speed abruptly rather than moving smoothly?"*
- **Trả lời:** `NO`
- **Thô:** `NO — Watch this video. Is the motion uneven — does it stutter, jump, or change speed abruptly rather than moving smoothly?  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=430]`

- **c3 hỏi:** *"Watch this video. Does any part of the footage repeat — do you see the same motion or the same view come back a second time?"*
- **Trả lời:** `NO`
- **Thô:** `NO — Watch this video. Does any part of the footage repeat — do you see the same motion or the same view come back a second time?  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=434]`

- **c4 hỏi:** *"Watch this video. Are there clearly visible compression artifacts — blocky squares, colour banding, or smearing around moving edges?"*
- **Trả lời:** `NO`
- **Thô:** `NO — Watch this video. Are there clearly visible compression artifacts — blocky squares, colour banding, or smearing around moving edges?  [google/gemini-3.7-flash · 4620903 byte · prompt_tokens=431]`

---

## Phép đo MÁY đứng cạnh câu (c) — nhịp chuyển động

Mọi khẳng định thị giác trong ván phải có một phép đo máy đứng cạnh. Bộ
`tools/do-nhip-chuyen-dong.sh` hạ mỗi khung xuống 96×170 mức xám, đọc byte thô,
rồi tính sai khác tuyệt đối trung bình (MAD) giữa hai khung liên tiếp.

```
######## walk — preset follow
số khung                : 108
MAD lớn nhất            : 21.437
khung cuối còn chuyển động: 4.17 s  => pha nghỉ dài 1.83 s
MAD trung bình (phần động): 9.623
độ lệch chuẩn             : 7.082
HỆ SỐ BIẾN THIÊN sd/mean  : 0.736  <-- càng lớn càng không đều

dãy MAD (mỗi dòng 9 khung = 0,5 s):
 t= 0.11s    0.01   0.00   0.00   0.00   0.01   0.01   0.05   0.04   0.02
 t= 0.61s    0.30   1.30   1.70   0.41   0.26   2.93   7.52   3.56   0.37
 t= 1.11s    2.84  11.78  11.98   2.98   1.32  11.84  15.86  10.99   1.09
 t= 1.61s    9.31  18.34  17.72   6.36   4.05  18.06  19.55  16.07   1.78
 t= 2.11s   15.59  19.77  19.34   9.30   9.35  19.64  20.71  17.98   2.27
 t= 2.61s   17.31  21.44  19.92   5.90   5.60  19.40  20.42  10.10   1.09
 t= 3.11s   13.18  19.27  15.05   1.97   2.85  11.88  12.34   3.28   0.52
 t= 3.61s    5.58  11.75   5.31   0.47   0.93   4.22   3.64   0.70   0.07
 t= 4.11s    0.41   0.76   0.29   0.00   0.00   0.01   0.00   0.00   0.01
 t= 4.61s    0.01   0.00   0.00   0.00   0.00   0.00   0.00   0.00   0.00
 t= 5.11s    0.00   0.00   0.00   0.00   0.00   0.00   0.00   0.00   0.00
 t= 5.61s    0.00   0.00   0.00   0.00   0.00   0.00   0.00   0.00

######## noir — preset pushIn
số khung                : 108
MAD lớn nhất            : 21.784
khung cuối còn chuyển động: 2.50 s  => pha nghỉ dài 3.50 s
MAD trung bình (phần động): 13.897
độ lệch chuẩn             : 7.409
HỆ SỐ BIẾN THIÊN sd/mean  : 0.533  <-- càng lớn càng không đều

dãy MAD (mỗi dòng 9 khung = 0,5 s):
 t= 0.11s   21.52  21.47  21.57  21.59  21.78  21.66  21.21  20.92  20.58
 t= 0.61s   20.43  20.38  20.34  20.20  20.03  20.09  19.85  19.43  19.02
 t= 1.11s   18.72  18.33  17.91  17.60  17.01  16.22  15.38  14.47  13.30
 t= 1.61s   12.30  11.23  10.19   9.21   8.21   7.21   6.36   5.44   4.64
 t= 2.11s    3.90   3.18   2.59   2.04   1.54   1.12   0.79   0.49   0.34
 t= 2.61s    0.11   0.04   0.07   0.01   0.01   0.02   0.21   0.04   0.05
 t= 3.11s    0.08   0.09   0.08   0.09   0.09   0.09   0.09   0.08   0.08
 t= 3.61s    0.08   0.07   0.07   0.07   0.05   0.04   0.05   0.07   0.09
 t= 4.11s    0.09   0.09   0.09   0.09   0.08   0.08   0.08   0.07   0.07
 t= 4.61s    0.07   0.07   0.04   0.05   0.05   0.07   0.08   0.09   0.08
 t= 5.11s    0.08   0.09   0.09   0.08   0.08   0.08   0.07   0.07   0.06
 t= 5.61s    0.05   0.05   0.04   0.06   0.08   0.09   0.08   0.09
```

### Tự tương quan của dãy MAD (phần đang chuyển động)

```
## walk — preset follow
tự tương quan của phần đang chuyển động (lag = số khung):
  lag  1 ( 56 ms):  r = 0.571
  lag  2 (111 ms):  r = 0.136
  lag  3 (167 ms):  r = 0.274
  lag  4 (222 ms):  r = 0.787
  lag  5 (278 ms):  r = 0.728
  lag  6 (333 ms):  r = 0.175
  lag  7 (389 ms):  r = 0.024
  lag  8 (444 ms):  r = 0.405
  lag  9 (500 ms):  r = 0.687
  lag 10 (556 ms):  r = 0.274
  lag 11 (611 ms):  r = -0.103
  lag 12 (667 ms):  r = 0.031
=> đỉnh mạnh nhất ở lag 4 khung (222 ms), r = 0.787
   r > 0.3 ở một lag ngắn = nhịp LẶP LẠI đều đặn, tức răng cưa có chu kỳ, không phải nhiễu.

## noir — preset pushIn
tự tương quan của phần đang chuyển động (lag = số khung):
  lag  1 ( 56 ms):  r = 0.947
  lag  2 (111 ms):  r = 0.890
  lag  3 (167 ms):  r = 0.828
  lag  4 (222 ms):  r = 0.763
  lag  5 (278 ms):  r = 0.693
  lag  6 (333 ms):  r = 0.621
  lag  7 (389 ms):  r = 0.549
  lag  8 (444 ms):  r = 0.476
  lag  9 (500 ms):  r = 0.404
  lag 10 (556 ms):  r = 0.332
  lag 11 (611 ms):  r = 0.261
  lag 12 (667 ms):  r = 0.191
=> đỉnh mạnh nhất ở lag 2 khung (111 ms), r = 0.890
   r > 0.3 ở một lag ngắn = nhịp LẶP LẠI đều đặn, tức răng cưa có chu kỳ, không phải nhiễu.

```

Đọc đúng hai dãy này:

- **walk (`follow`)**: tự tương quan tụt ở lag 2–3 rồi **vọt lên ở lag 4–5**
  (r = 0,787 / 0,728), tụt tiếp ở lag 7 (r = 0,024), lại vọt ở lag 9 (r = 0,687).
  Đó là dấu vân của một **nhịp lặp chu kỳ ≈ 4–5 khung (222–278 ms, ~4 Hz)** —
  camera tiến từng nấc chứ không trôi đều.
- **noir (`pushIn`)**: tự tương quan **giảm đơn điệu** từ 0,947 xuống 0,191,
  không có đỉnh phụ nào. Đó là dấu vân của một đường cong trơn (ease-out),
  không có thành phần chu kỳ. Dòng "đỉnh mạnh nhất ở lag 2" mà script in ra
  chỉ là giá trị lớn nhất của một đường giảm đơn điệu, **không** phải chu kỳ.

### Nhấp nhô của clip walk đến từ CAMERA hay từ NÉT VẼ tuyến?

Nếu do nét vẽ tuyến tiến từng bước thì ở góc khung — nơi không có tuyến —
nhịp chu kỳ phải biến mất. Đo trên bốn vùng:

```
toàn khung                         lag1=0.571 lag4=0.787 lag7=0.024  MAD_tb=7.70
góc trên-trái 340x340              lag1=0.625 lag4=0.719 lag7=0.133  MAD_tb=10.14
góc dưới-phải 340x340              lag1=0.617 lag4=0.725 lag7=0.174  MAD_tb=13.83
giữa khung (có tuyến) 400x400      lag1=0.648 lag4=0.781 lag7=0.166  MAD_tb=11.61
```

Đỉnh lag-4 còn nguyên ở **cả hai góc khung** (r = 0,719 và 0,725), nơi tuyến
không đi qua. ⇒ nhịp giật đến từ **chuyển động camera**, không phải từ nét vẽ.

### Hai kết quả NGHỊCH NHAU — ghi lại đúng như thế

| | VLM nói (câu c2 "chuyển động có không đều?") | Phép đo MAD nói |
|---|---|---|
| walk (`follow`) | `NO` — đều | có nhịp chu kỳ 4–5 khung, r = 0,787 |
| noir (`pushIn`) | `YES` — không đều | giảm đơn điệu, không chu kỳ |

Phiên điều phối **không chọn bên cho tiện**. Phép đo MAD neo vào byte của tệp
và tái lập được bằng một lệnh; câu trả lời của VLM thì không. Nhưng ván này
không có thẩm quyền tuyên bố cái nào "đúng" — nó ghi cả hai và chuyển câu hỏi
cho người.
