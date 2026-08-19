# Chiều kỳ vọng — GHI TRƯỚC KHI HỎI

Ghi lúc **2026-08-19T15:06Z**, trước lời gọi VLM video đầu tiên của ván. Mục đích:
không cho phép đọc ngược kết quả rồi mới tuyên bố "đúng như dự đoán".

## Trạng thái bản vá P0-1 khi vào ván

P0-1 (ván #1, tái xuất ở ván #2 là CHẶN-4): `mode:"walk"` đi qua endpoint
`routed-car`, nên tuyến đi bộ thật ra là tuyến ô tô, tốc độ sai ~10 lần.

Đo trên vật, **không đoán theo lời**:

```
$ md5 -q mcp-server/src/route.ts
4bb7655ec132e9e4718dad492f26b1a4
```

Ván #2 ghi md5 của cùng tệp là `4bb7655ec132e9e4718dad492f26b1a4` — **trùng khít**.

```
$ git log --all --oneline -- mcp-server/src/route.ts
338674d feat(mcp): route.ts — client OSRM cho đường đi thực tế bám đường
```

Toàn bộ mọi nhánh trong kho chỉ có đúng một commit chạm tệp này, và nó là commit
gốc. Không nhánh nào chứa bản vá.

```
$ TZ=UTC stat -f '%Sm %N' -t '%Y-%m-%dT%H:%M:%SZ' mcp-server/src/route.ts
2026-08-07T12:26:13Z mcp-server/src/route.ts
```

⇒ **Bản vá P0-1 CHƯA merge.** Ván #3 vẫn chạy trên bản CHƯA vá, đúng như ván #2.
Mọi vấp tuyến đường tái xuất **không tính là phát hiện mới**.

## Chiều kỳ vọng cho câu (f) của làn video

Câu (f): *hai clip walk và car cùng cặp điểm có cho TUYẾN KHÁC NHAU trên hình không?*

| Trạng thái mã | Kỳ vọng câu (f) |
|---|---|
| CHƯA vá (trạng thái của ván này) | **NO** — hai clip trùng tuyến |
| ĐÃ vá | YES — hai tuyến khác nhau |

Vì bản vá chưa merge, ván này kỳ vọng **NO**. Nếu VLM trả **YES**, đó là mâu
thuẫn phải điều tra, không phải tin vui — hoặc VLM sai, hoặc giả định về mã sai.

## Chiều kỳ vọng cho đối chứng dương của làn video

Cặp khung đầu-vs-cuối của một clip có chuyển động, hỏi *"hai khung này giống hệt
nhau?"* → kỳ vọng **NO**. Nếu trả **YES** thì cả làn video không đáng tin, phải
ghi và dừng làn.
