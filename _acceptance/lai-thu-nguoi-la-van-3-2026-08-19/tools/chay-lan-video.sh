#!/usr/bin/env bash
# chay-lan-video.sh — LÀN VIDEO SÂU của ván #3. Chạy lại toàn bộ bằng một lệnh.
#
#   bash chay-lan-video.sh
#
# Sáu câu ĐÓNG cho từng clip (a→f), gửi THẲNG mp4 cho google/gemini-3.7-flash qua
# OpenRouter. Đường gửi thẳng đã được chứng minh dùng được và CÓ SỨC PHÂN BIỆT ở
# `cmds/tham-do-duong-video.md` (clip động → YES, clip đứng yên → NO, prompt_tokens
# 41 → 230). Không rơi về tách khung; khung vẫn tách ra để đo PSNR khung-cuối vs
# settle bằng số.
#
# Khoá đọc từ ~/.config/acceptance-gate/openrouter.env (ngoài git, quyền 600).
# Script KHÔNG in giá trị khoá ra bất kỳ đâu.
# Quy ước thoát của bộ chấm: 0 = YES · 1 = NO · 2 = KHÔNG CHẠY ĐƯỢC.

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
BASE="$HERE/.."
VID="$BASE/video"
FRAMES="$BASE/frames"
OUT="$BASE/vlm/ket-qua-video-3.7-flash.md"
ENVFILE="$HOME/.config/acceptance-gate/openrouter.env"

if [ ! -r "$ENVFILE" ]; then echo "THIẾU $ENVFILE — dừng." >&2; exit 2; fi
set -a; . "$ENVFILE"; set +a
if [ -z "${OPENROUTER_API_KEY:-}" ]; then echo "OPENROUTER_API_KEY trống — dừng." >&2; exit 2; fi

MODEL="${VLM_MODEL:-google/gemini-3.7-flash}"

# --- các clip của ván (điền sau khi lượt A giao hàng) -----------------------
# Mỗi dòng: nhãn|clip|settle|preset-camera-đã-yêu-cầu|mô-tả
CLIPS_FILE="$HERE/danh-sach-clip.txt"
if [ ! -r "$CLIPS_FILE" ]; then echo "THIẾU $CLIPS_FILE" >&2; exit 2; fi

hoi_video() { # $1=nhãn câu  $2=clip  $3=câu hỏi
  printf '\n**%s**\n\n- **Hỏi:** *"%s"*\n' "$1" "$3" | tee -a "$OUT" >/dev/null
  ans="$(node "$HERE/vlm-video-assert.mjs" "$2" "$3" 2>&1)"; code=$?
  case $code in
    0) v='`YES`' ;; 1) v='`NO`' ;; *) v='**KHÔNG CHẠY ĐƯỢC (exit 2)** — không phải NO, không phải xanh giả' ;;
  esac
  printf -- '- **Trả lời:** %s\n- **Output thô:** `%s`\n' "$v" "$ans" | tee -a "$OUT" >/dev/null
  echo "  [$1] -> $v"
}

hoi_nhieu() { # $1=nhãn  $2=câu hỏi  $3.. = các vật
  local label="$1" q="$2"; shift 2
  printf '\n**%s**\n\n- **Hỏi:** *"%s"*\n- **Vật:** %s\n' "$label" "$q" "$(for f in "$@"; do printf '`%s` ' "$(basename "$f")"; done)" | tee -a "$OUT" >/dev/null
  ans="$(node "$HERE/hoi-nhieu-vat.mjs" "$q" "$@" 2>&1)"; code=$?
  case $code in
    0) v='`YES`' ;; 1) v='`NO`' ;; *) v='**KHÔNG CHẠY ĐƯỢC (exit 2)**' ;;
  esac
  printf -- '- **Trả lời:** %s\n- **Output thô:** `%s`\n' "$v" "$ans" | tee -a "$OUT" >/dev/null
  echo "  [$label] -> $v"
}

{
  echo "# Làn video sâu — \`$MODEL\` qua OpenRouter, gửi THẲNG mp4"
  echo
  echo "Sinh bởi \`tools/chay-lan-video.sh\` lúc $(date -u '+%Y-%m-%dT%H:%M:%SZ')."
  echo
  echo "Đường đã dùng: **gửi thẳng video** (\`video_url\` data-URI). Bằng chứng đường"
  echo "này đọc được video thật chứ không đoán: [\`cmds/tham-do-duong-video.md\`](../cmds/tham-do-duong-video.md)."
  echo "Chiều kỳ vọng ghi TRƯỚC khi hỏi: [\`cmds/chieu-ky-vong-ghi-truoc.md\`](../cmds/chieu-ky-vong-ghi-truoc.md)."
} > "$OUT"

# --- 0. Đối chứng dương cho cả làn (chạy TRƯỚC mọi câu thật) ----------------
echo "== đối chứng dương =="
{
  echo
  echo '---'
  echo
  echo '## 0 · Đối chứng dương cho làn video'
  echo
  echo 'Nếu bộ chấm trả `YES` ("giống hệt nhau") cho một cặp khung chắc chắn khác'
  echo 'nhau thì cả làn không đáng tin và phải dừng.'
} >> "$OUT"

# bỏ dòng chú thích: dòng đầu của tệp danh sách bắt đầu bằng `#`.
DC_CLIP=$(grep -v '^#' "$CLIPS_FILE" | head -1 | cut -d'|' -f2)
DC_PRE="doi-chung"
bash "$HERE/tach-khung.sh" "$VID/$DC_CLIP" "-" "$FRAMES" "$DC_PRE" > /tmp/van3-dc-frames.md 2>&1
{ echo; echo '<details><summary>ffprobe + md5 khung dùng cho đối chứng</summary>'; echo; cat /tmp/van3-dc-frames.md; echo; echo '</details>'; } >> "$OUT"

Q_IDENT='Item 1 and Item 2 are two still frames taken from the same video. Are these two frames identical to each other — the same picture with no visible difference?'
hoi_nhieu "Đối chứng — khung ĐẦU vs khung CUỐI của một clip có chuyển động (kỳ vọng \`NO\`)" \
  "$Q_IDENT" "$FRAMES/$DC_PRE-dau.png" "$FRAMES/$DC_PRE-cuoi.png"
hoi_nhieu "Đối chứng ngược — cùng MỘT khung đưa hai lần (kỳ vọng \`YES\`)" \
  "$Q_IDENT" "$FRAMES/$DC_PRE-dau.png" "$FRAMES/$DC_PRE-dau.png"

# --- 1. Sáu câu cho từng clip ----------------------------------------------
while IFS='|' read -r label clip settle preset mota; do
  [ -z "${label:-}" ] && continue
  case "$label" in \#*) continue ;; esac
  PRE="$(echo "$label" | tr 'A-Z ' 'a-z-')"
  echo "== $label =="
  {
    echo
    echo '---'
    echo
    echo "## $label"
    echo
    echo "- Mô tả: $mota"
    echo "- Preset camera **đã yêu cầu trong lời gọi**: \`$preset\`"
  } >> "$OUT"

  bash "$HERE/tach-khung.sh" "$VID/$clip" "${settle:+$VID/$settle}" "$FRAMES" "$PRE" > /tmp/van3-frames-$PRE.md 2>&1
  { echo; echo '<details><summary>ffprobe · md5 · PSNR khung-cuối vs settle</summary>'; echo; cat /tmp/van3-frames-$PRE.md; echo; echo '</details>'; } >> "$OUT"

  hoi_video "(a) Chuyển động camera có khớp preset \`$preset\` đã yêu cầu?" "$VID/$clip" \
    "This is a map animation. The caller explicitly requested a camera movement preset named '$preset'. Watch the whole video. Does the camera movement you actually see match that named preset?"

  hoi_video "(c) Có khung đóng băng · giật · lặp · artifact nén thấy được?" "$VID/$clip" \
    "Watch this video closely from start to end. Does it contain any visible defect — a frozen or stuck frame, a stutter or jump in the motion, a section that repeats, or clearly visible compression artifacts such as blocking or smearing?"

  hoi_video "(e) Nhãn chữ có đọc được TRONG LÚC chuyển động?" "$VID/$clip" \
    "Watch this video while it is moving, not just at the end. Is every piece of overlaid text (place name, labels, coordinates, any caption) clearly legible during the moving part of the clip — not blurred, not smeared, not hidden behind map lines?"

  # (e2) chiều ngược của (e). Hợp đồng `map-motion-clip` giữ bất biến "clip KHÔNG
  # CHỮ" (AC-9: pixel video text-free — tầng DOM mới sở hữu chữ), nên ở clip,
  # `NO` cho (e) có thể chỉ là bất biến đang được tôn trọng chứ không phải lỗi.
  # Câu này tách hai khả năng đó ra: kỳ vọng theo hợp đồng là `NO`; `YES` mới là
  # dấu hiệu bất biến bị vi phạm.
  hoi_video "(e2) Trong clip có BẤT KỲ chữ/số nào được vẽ vào hình không? (hợp đồng nói không được có — kỳ vọng \`NO\`)" "$VID/$clip" \
    'Watch this whole video. Does the picture itself contain any rendered text — any letters, words, place names, numbers, coordinates, captions or watermarks burned into the frames? Answer YES if you can see any text at all in the picture; answer NO if the picture is purely map graphics with no text.'

  if [ -n "${settle:-}" ]; then
    hoi_nhieu "(d) Khung CUỐI clip có khớp \`$settle\`?" \
      'Item 1 is the final frame taken from a video. Item 2 is a separate still image that the same product exported alongside that video as its final settled frame. Do these two pictures show the same view — same map area, same camera angle, same visible elements — allowing only for differences in compression quality?' \
      "$FRAMES/$PRE-cuoi.png" "$VID/$settle"
  fi
done < "$CLIPS_FILE"

# --- 2. Hai câu về QUAN HỆ giữa clip đi bộ và clip ô tô ---------------------

WALK_CLIP=$(awk -F'|' '$1=="Clip walk"{print $2}' "$CLIPS_FILE")
CAR_CLIP=$(awk -F'|' '$1=="Clip car"{print $2}' "$CLIPS_FILE")

if [ -n "$WALK_CLIP" ]; then
  echo "== câu (b) tuyến đi bộ =="
  {
    echo
    echo '---'
    echo
    echo '## Câu (b) — tuyến dán nhãn ĐI BỘ có bám đường đi bộ suốt chiều dài clip?'
  } >> "$OUT"
  hoi_video "(b) Suốt chiều dài clip, tuyến đi bộ bám vỉa hè/lối đi bộ hay chạy lòng đường ô tô?" "$VID/$WALK_CLIP" \
    'This map animation shows a highlighted route that the product labelled as a WALKING route. Watch the route for the WHOLE length of the clip, not just one moment. Answer YES if the highlighted line stays on pedestrian ways — footpaths, park walkways, pavements or narrow alleys — for the whole clip. Answer NO if it instead follows the main vehicle carriageways of the street network.'
fi

if [ -n "$WALK_CLIP" ] && [ -n "$CAR_CLIP" ]; then
  echo "== câu (f) walk vs car =="
  {
    echo
    echo '---'
    echo
    echo '## Câu (f) — phép đo thị giác trực tiếp cho P0-1'
    echo
    echo 'Chiều kỳ vọng đã ghi TRƯỚC khi hỏi, trong `cmds/chieu-ky-vong-ghi-truoc.md`:'
    echo 'mã CHƯA vá ⇒ kỳ vọng **`NO`** (hai clip trùng tuyến). `YES` là mâu thuẫn'
    echo 'phải điều tra, không phải tin vui.'
  } >> "$OUT"
  hoi_nhieu "(f) Hai clip cùng cặp điểm — tuyến vẽ trên bản đồ có KHÁC nhau?" \
    'Item 1 and Item 2 are two map animations of a journey between the SAME two places. Item 1 was requested as a WALKING journey and Item 2 as a CAR journey. Look at the shape of the highlighted route line drawn on the map in each. Answer YES if the two highlighted routes follow visibly different paths through the street network. Answer NO if they trace the same path.' \
    "$VID/$WALK_CLIP" "$VID/$CAR_CLIP"
fi

echo
echo "=> đã ghi $OUT"
