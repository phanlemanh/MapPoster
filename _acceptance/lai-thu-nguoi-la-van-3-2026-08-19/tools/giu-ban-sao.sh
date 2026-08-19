#!/usr/bin/env bash
# giu-ban-sao.sh — canh `_render-out/` và giữ bản sao MỌI tệp mới sinh trong ván.
#
# Vì sao cần: CHẶN-1 của ván #2 chứng minh render GHI ĐÈ IM LẶNG cùng một đường
# dẫn khi `location` + `format` trùng nhau. Ván #3 có hai mục tiêu dùng ĐÚNG một
# cặp điểm (đi bộ vs ô tô), nên clip đi bộ nhiều khả năng bị clip ô tô đè mất
# trước khi kịp đo. Bộ này chụp lại từng bản ngay khi nó ổn định.
#
# Chỉ chép tệp có mtime > MARKER và kích thước KHÔNG đổi giữa hai vòng quét —
# tránh chép nửa chừng lúc encoder còn đang ghi. Tên bản sao gắn mtime nên hai
# lần ghi vào CÙNG một đường dẫn sinh ra HAI bản sao khác tên: chính cái đó là
# bằng chứng ghi đè.
#
# bash 3.2 của macOS không có mảng liên kết — trạng thái "đã chép" nằm ở chính
# tên tệp trong thư mục đích, "kích thước vòng trước" nằm ở tệp tạm.
#
#   bash giu-ban-sao.sh <marker-epoch> <thư-mục-đích> [số-giây-chạy]

set -u
MARKER="${1:?cần marker epoch}"
DEST="${2:?cần thư mục đích}"
RUNFOR="${3:-3600}"
SRC="/Users/manh-macmini/dev/map/_render-out"
STATE="$(mktemp -d)"

mkdir -p "$DEST"
END=$(( $(date +%s) + RUNFOR ))

while [ "$(date +%s)" -lt "$END" ]; do
  for f in "$SRC"/*; do
    [ -f "$f" ] || continue
    mt=$(stat -f %m "$f")
    [ "$mt" -gt "$MARKER" ] || continue
    sz=$(stat -f %z "$f")
    base=$(basename "$f")
    tag="${base%.*}--mt${mt}.${base##*.}"
    [ -e "$DEST/$tag" ] && continue
    prev=""
    [ -f "$STATE/$base" ] && prev=$(cat "$STATE/$base")
    if [ "$prev" = "$sz" ] && [ "$sz" -gt 0 ]; then
      cp -p "$f" "$DEST/$tag"
      echo "[giu-ban-sao] $(date -u '+%H:%M:%SZ') giữ $tag ($sz byte, md5 $(md5 -q "$f"))"
    fi
    printf '%s' "$sz" > "$STATE/$base"
  done
  sleep 5
done
rm -rf "$STATE"
