#!/usr/bin/env bash
# tach-khung.sh — tách khung + đo khớp khung-cuối với `settle.png` bằng SỐ.
#
#   bash tach-khung.sh <clip.mp4> <settle.png|-> <thư-mục-khung> <tiền-tố>
#
# Sinh ra:
#   <tiền-tố>-dau.png   khung đầu (t=0)
#   <tiền-tố>-giua.png  khung giữa (t = thời lượng / 2)
#   <tiền-tố>-cuoi.png  khung CUỐI (lấy bằng cách tua tới cuối rồi giữ khung sau chót)
#
# Và in ra:
#   - ffprobe: thời lượng, số khung, fps, kích thước, codec (số của lệnh, không gõ tay)
#   - md5 từng khung
#   - PSNR giữa khung cuối và `settle.png` — `inf` nghĩa là TRÙNG TỪNG ĐIỂM ẢNH.
#     Dùng PSNR chứ không dùng md5 để so khung-cuối với settle vì hai tệp đi qua
#     hai bộ mã hoá khác nhau (một qua H.264 rồi giải, một là PNG gốc): md5 khác
#     nhau KHÔNG chứng minh được ảnh khác nhau, còn PSNR thì đo đúng thứ cần đo.
#     md5 vẫn in ra để ai muốn kiểm lại bản thân tệp khung.

set -u
CLIP="${1:?cần clip.mp4}"
SETTLE="${2:?cần settle.png hoặc -}"
OUT="${3:?cần thư mục khung}"
PRE="${4:?cần tiền tố}"

mkdir -p "$OUT"

echo "## \`$(basename "$CLIP")\`"
echo
echo '### ffprobe'
echo '```'
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,width,height,r_frame_rate,nb_frames,duration,bit_rate \
  -show_entries format=duration,size -of default=noprint_wrappers=1 "$CLIP"
echo "md5_clip=$(md5 -q "$CLIP")"
echo '```'

DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$CLIP")
MID=$(node -e "console.log((Number(process.argv[1])/2).toFixed(3))" "$DUR")

ffmpeg -y -loglevel error -i "$CLIP" -vf "select=eq(n\,0)" -vsync 0 -frames:v 1 "$OUT/$PRE-dau.png"
ffmpeg -y -loglevel error -ss "$MID" -i "$CLIP" -frames:v 1 "$OUT/$PRE-giua.png"
# -sseof -0.1: tua tới 0,1 s cuối rồi lấy khung sau chót thật sự có trong luồng.
ffmpeg -y -loglevel error -sseof -0.1 -i "$CLIP" -update 1 "$OUT/$PRE-cuoi.png"

echo
echo '### Khung đã tách'
echo '```'
for k in dau giua cuoi; do
  f="$OUT/$PRE-$k.png"
  echo "$PRE-$k.png  $(stat -f %z "$f") byte  md5 $(md5 -q "$f")"
done
echo '```'

if [ "$SETTLE" != "-" ] && [ -f "$SETTLE" ]; then
  echo
  echo '### Khung cuối so với settle.png (PSNR — `inf` = trùng từng điểm ảnh)'
  echo '```'
  echo "settle=$(basename "$SETTLE")  $(stat -f %z "$SETTLE") byte  md5 $(md5 -q "$SETTLE")"
  echo -n "khung CUỐI vs settle: "
  ffmpeg -v info -i "$OUT/$PRE-cuoi.png" -i "$SETTLE" -lavfi psnr -f null - 2>&1 | grep -i 'PSNR' | tail -1
  echo -n "khung ĐẦU  vs settle (đối chứng — clip có chuyển động thì phải THẤP hơn): "
  ffmpeg -v info -i "$OUT/$PRE-dau.png" -i "$SETTLE" -lavfi psnr -f null - 2>&1 | grep -i 'PSNR' | tail -1
  echo '```'
fi
