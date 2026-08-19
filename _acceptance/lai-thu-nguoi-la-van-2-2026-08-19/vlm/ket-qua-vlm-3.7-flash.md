# Bậc B3 chạy lại — `google/gemini-3.7-flash` qua OpenRouter

Sinh bởi `tools/chay-b3.sh` lúc 2026-08-19T14:50:56Z.
So sánh với lượt `gemini-3.5-flash` ở `ket-qua-vlm.md`.

### Câu 1 — tuyến dán nhãn đi bộ

- **Ảnh:** `frame1-tuyen-di-bo-route-journey-settle.png` (md5 `aed001de585c6e501d85ce5c3ab34593`)
- **Hỏi:** *"Answer with exactly one word, YES or NO. This map shows a highlighted route line that the product labelled as a WALKING route. Answer YES if that highlighted line runs along the main vehicle carriageways of the street network; answer NO if it runs along pedestrian-only paths, park walkways, or narrow alleys instead."*
- **Trả lời:** `YES`
- **Output thô:** `YES — Answer with exactly one word, YES or NO. This map shows a highlighted route line that the product labelled as a WALKING route. Answer YES if that highlighted line runs along the main vehicle carriageways of the street network; answer NO if it runs along pedestrian-only paths, park walkways, or narrow alleys instead.  [google/gemini-3.7-flash]`

### Câu 2 — màu nền có đúng theme đã yêu cầu

- **Ảnh:** `frame2-region-spotlight-midnight-blue-settle.png` (md5 `78af84bfbf8bfc18e234666dd2bcace9`)
- **Hỏi:** *"Answer with exactly one word, YES or NO. The caller explicitly requested the theme named 'midnight-blue'. Is the dominant background colour of this poster a dark navy / midnight blue?"*
- **Trả lời:** `YES`
- **Output thô:** `YES — Answer with exactly one word, YES or NO. The caller explicitly requested the theme named 'midnight-blue'. Is the dominant background colour of this poster a dark navy / midnight blue?  [google/gemini-3.7-flash]`

### Câu 3 — chữ đọc được ở cỡ xuất

- **Ảnh:** `frame2-region-spotlight-midnight-blue-settle.png` (md5 `78af84bfbf8bfc18e234666dd2bcace9`)
- **Hỏi:** *"Answer with exactly one word, YES or NO. Looking at this poster at its full export resolution, is every piece of overlaid text (place name, country, coordinates, any caption) clearly legible — meaning it is NOT overlapped by map lines and NOT too low-contrast against the background to read?"*
- **Trả lời:** `YES`
- **Output thô:** `YES — Answer with exactly one word, YES or NO. Looking at this poster at its full export resolution, is every piece of overlaid text (place name, country, coordinates, any caption) clearly legible — meaning it is NOT overlapped by map lines and NOT too low-contrast against the background to read?  [google/gemini-3.7-flash]`

### Câu 4 — đối chứng: khung SAU ghi đè

- **Ảnh:** `frame3-a5-noir-sau-ghi-de.png` (md5 `f6bf793fb0d5faf7acf8d0444a17339d`)
- **Hỏi:** *"Answer with exactly one word, YES or NO. Is the dominant background colour of this poster a dark navy / midnight blue (as opposed to neutral black, grey, or any other hue)?"*
- **Trả lời:** `NO`
- **Output thô:** `NO — Answer with exactly one word, YES or NO. Is the dominant background colour of this poster a dark navy / midnight blue (as opposed to neutral black, grey, or any other hue)?  [google/gemini-3.7-flash]`

### Câu 5 — đối chứng: khung TRƯỚC ghi đè

- **Ảnh:** `frame4-a5-midnight-blue-truoc-ghi-de.png` (md5 `6241dd3a83a3b9e4110c0156f0bca498`)
- **Hỏi:** *"Answer with exactly one word, YES or NO. Is the dominant background colour of this poster a dark navy / midnight blue (as opposed to neutral black, grey, or any other hue)?"*
- **Trả lời:** `YES`
- **Output thô:** `YES — Answer with exactly one word, YES or NO. Is the dominant background colour of this poster a dark navy / midnight blue (as opposed to neutral black, grey, or any other hue)?  [google/gemini-3.7-flash]`
