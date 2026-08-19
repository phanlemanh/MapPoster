#!/usr/bin/env bash
# so-hai-clip.sh — so hai clip bằng SỐ, không bằng mắt và không bằng lời VLM.
#
#   bash so-hai-clip.sh <clipA.mp4> <clipB.mp4>
#
# Vì sao cần bên cạnh câu (f) hỏi VLM: câu (f) là phép đo THỊ GIÁC, và nó phải
# có một phép đo MÁY độc lập đứng cạnh — nếu hai clip trùng md5 thì chuyện
# "tuyến giống nhau" không còn là ý kiến của mô hình nữa.
#
# Ba tầng, từ rẻ tới đắt:
#   1. md5 nguyên tệp — trùng thì xong, không cần gì thêm.
#   2. ffprobe — kích thước/fps/số khung có bằng nhau không (nếu lệch thì tầng 3
#      phải cắt về cùng cỡ, và bản thân chuyện lệch cũng là dữ kiện).
#   3. PSNR từng khung sau khi cắt về cùng cỡ. `inf`/rất cao = cùng hình.
#      PSNR chứ không md5 ở tầng này vì hai lần mã hoá H.264 khác nhau vẫn cho
#      md5 khác dù hình giống hệt.

set -u
A="${1:?cần clipA}"
B="${2:?cần clipB}"

echo '```'
echo "A = $(basename "$A")  $(stat -f %z "$A") byte  md5 $(md5 -q "$A")"
echo "B = $(basename "$B")  $(stat -f %z "$B") byte  md5 $(md5 -q "$B")"
if [ "$(md5 -q "$A")" = "$(md5 -q "$B")" ]; then
  echo
  echo "=> TRÙNG md5 TỪNG BYTE. Hai lời gọi khác nhau sinh ra CÙNG MỘT TỆP."
  echo '```'
  exit 0
fi
echo
echo "=> md5 KHÁC nhau. Đi tiếp xuống hình."
echo

probe() { ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,nb_frames -of csv=p=0 "$1"; }
echo "ffprobe A: $(probe "$A")"
echo "ffprobe B: $(probe "$B")"

WA=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$A")
HA=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$A")
WB=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$B")
HB=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$B")
W=$(( WA < WB ? WA : WB ))
H=$(( HA < HB ? HA : HB ))
echo "cắt cả hai về ${W}x${H} rồi đo PSNR từng khung:"
echo
ffmpeg -v info -i "$A" -i "$B" \
  -lavfi "[0:v]crop=$W:$H:0:0[a];[1:v]crop=$W:$H:0:0[b];[a][b]psnr" \
  -f null - 2>&1 | grep -iE '^\[Parsed_psnr|PSNR' | tail -1
echo
echo "Đọc số: PSNR trung bình > 40 dB ⇒ mắt thường không phân biệt được;"
echo "20–30 dB ⇒ khác rõ; < 20 dB ⇒ hai hình khác hẳn."
echo '```'
