#!/usr/bin/env bash
# Chạy lại toàn bộ bậc B3 trên VLM khác họ, đúng model owner yêu cầu
# (google/gemini-3.7-flash qua OpenRouter), trên chính các khung hình đã commit.
#
#   bash chay-b3.sh
#
# Khoá đọc từ ~/.config/acceptance-gate/openrouter.env (nằm ngoài mọi kho git,
# quyền 600). Script KHÔNG in giá trị khoá ra bất kỳ đâu.
# Quy ước thoát của vlm-assert.mjs: 0 = YES · 1 = NO · 2 = KHÔNG CHẠY ĐƯỢC.

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
FRAMES="$HERE/../frames"
ENVFILE="$HOME/.config/acceptance-gate/openrouter.env"
OUT="$HERE/../vlm/ket-qua-vlm-3.7-flash.md"

if [ ! -r "$ENVFILE" ]; then
  echo "THIẾU $ENVFILE — chưa có khoá, dừng." >&2; exit 2
fi
set -a; . "$ENVFILE"; set +a
if [ -z "${OPENROUTER_API_KEY:-}" ]; then
  echo "OPENROUTER_API_KEY còn trống trong $ENVFILE — dừng." >&2; exit 2
fi

Q1='Answer with exactly one word, YES or NO. This map shows a highlighted route line that the product labelled as a WALKING route. Answer YES if that highlighted line runs along the main vehicle carriageways of the street network; answer NO if it runs along pedestrian-only paths, park walkways, or narrow alleys instead.'
Q2="Answer with exactly one word, YES or NO. The caller explicitly requested the theme named 'midnight-blue'. Is the dominant background colour of this poster a dark navy / midnight blue?"
Q3='Answer with exactly one word, YES or NO. Looking at this poster at its full export resolution, is every piece of overlaid text (place name, country, coordinates, any caption) clearly legible — meaning it is NOT overlapped by map lines and NOT too low-contrast against the background to read?'
Q45='Answer with exactly one word, YES or NO. Is the dominant background colour of this poster a dark navy / midnight blue (as opposed to neutral black, grey, or any other hue)?'

run() { # $1=nhãn  $2=ảnh  $3=câu hỏi
  printf '\n### %s\n\n- **Ảnh:** `%s` (md5 `%s`)\n- **Hỏi:** *"%s"*\n' \
    "$1" "$(basename "$2")" "$(md5 -q "$2")" "$3" | tee -a "$OUT"
  ans="$(node "$HERE/vlm-assert.mjs" "$2" "$3" 2>&1)"; code=$?
  case $code in
    0) verdict='`YES`' ;;
    1) verdict='`NO`' ;;
    *) verdict='**KHÔNG CHẠY ĐƯỢC (exit 2)** — không phải NO, không phải xanh giả' ;;
  esac
  printf -- '- **Trả lời:** %s\n- **Output thô:** `%s`\n' "$verdict" "$ans" | tee -a "$OUT"
}

{
  echo "# Bậc B3 chạy lại — \`${VLM_MODEL:-google/gemini-3.7-flash}\` qua OpenRouter"
  echo
  echo "Sinh bởi \`tools/chay-b3.sh\` lúc $(date -u '+%Y-%m-%dT%H:%M:%SZ')."
  echo "So sánh với lượt \`gemini-3.5-flash\` ở \`ket-qua-vlm.md\`."
} > "$OUT"

run "Câu 1 — tuyến dán nhãn đi bộ"                 "$FRAMES/frame1-tuyen-di-bo-route-journey-settle.png"     "$Q1"
run "Câu 2 — màu nền có đúng theme đã yêu cầu"     "$FRAMES/frame2-region-spotlight-midnight-blue-settle.png" "$Q2"
run "Câu 3 — chữ đọc được ở cỡ xuất"               "$FRAMES/frame2-region-spotlight-midnight-blue-settle.png" "$Q3"
run "Câu 4 — đối chứng: khung SAU ghi đè"          "$FRAMES/frame3-a5-noir-sau-ghi-de.png"                    "$Q45"
run "Câu 5 — đối chứng: khung TRƯỚC ghi đè"        "$FRAMES/frame4-a5-midnight-blue-truoc-ghi-de.png"         "$Q45"

echo
echo "=> đã ghi $OUT"
