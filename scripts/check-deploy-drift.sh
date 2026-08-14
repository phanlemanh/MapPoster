#!/usr/bin/env bash
# Bắt "production đứng yên trong khi main đã đi tiếp" — xem issue #9.
#
# VÌ SAO LÀ SCRIPT chứ không nằm thẳng trong .github/workflows/deploy-drift.yml:
# toàn bộ logic ở đây từng sống trong YAML, và mọi lần sửa nó đều đòi scope
# `workflow` trên token. Tách ra `scripts/` thì logic sửa được, test được, chạy
# tay được — còn file workflow rút xuống một dòng gọi, gần như không phải đụng
# nữa. Đây cũng là cách để bản vá không nằm chờ vô thời hạn vì lý do quyền.
#
# Chạy tay:   bash scripts/check-deploy-drift.sh
# Có credential (đo được đầy đủ):
#             RENDER_API_KEY=... RENDER_SERVICE_ID=srv-... bash scripts/check-deploy-drift.sh
#
# Mã thoát:  0 = không lệch (hoặc lệch nhưng chỉ docs)
#            1 = LỆCH THẬT, phần lệch có chạm code đi vào image
#            2 = KHÔNG ĐO ĐƯỢC — thiếu dữ kiện. Cố ý KHÁC 0: một phép đo không
#                chạy được mà báo "đạt" chính là lỗi đã để production tụt 8 ngày.
set -uo pipefail

BASE="${MAPPOSTER_BASE:-https://onehub-mapposter.onrender.com}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

note() { printf '  %s\n' "$*"; }
say()  { printf '\n== %s ==\n' "$*"; }

# ---------------------------------------------------------------- tầng 1: không cần secret
say "Tầng 1 — đo không cần credential"

probe() {
  curl -sS --max-time 25 -o /dev/null -w '%{http_code}' \
    -X POST -H 'Content-Type: application/json' -d '{}' "$BASE$1" 2>/dev/null
}

control="$(probe /duong-dan-khong-the-ton-tai-9f3a)"
note "đối chứng (đường dẫn bịa) → ${control}"

if [ "$control" = "000" ]; then
  note "KHÔNG gọi được $BASE — không kết luận gì."
  tier1="unreachable"
elif [ "$control" = "401" ]; then
  # Cổng bearer chặn TRƯỚC khi định tuyến, nên mọi đường dẫn đều 401 như nhau.
  note "production có mcp-auth (cửa fall-through đóng ở 401)."
  note "TRẦN CỦA TẦNG NÀY, khai rõ: từ đây probe KHÔNG phân biệt được route nữa —"
  note "đã kiểm bốn cách (đường dẫn bịa, từng route, method GET, thân 401) và"
  note "không cách nào cho dấu vân tay build. Drift sâu hơn phải nhờ tầng 2."
  tier1="authed"
else
  # 406 = request đi lọt tới MCP transport ⇒ bản đang chạy CHƯA có mcp-auth.
  if grep -q 'if (rejectedByBearer(req, res)) return;' mcp-server/src/http.ts; then
    note "LỆCH: cửa fall-through trả ${control} chứ không phải 401 — bản đang chạy"
    note "CHƯA có mcp-auth, /mcp đang mở không cần credential. Xem issue #9."
    tier1="drift"
  else
    tier1="unknown"
  fi
fi

[ "$tier1" = "drift" ] && exit 1

# ---------------------------------------------------------------- tầng 2: cần credential
say "Tầng 2 — so commit đang live với main"

if [ -z "${RENDER_API_KEY:-}" ] || [ -z "${RENDER_SERVICE_ID:-}" ]; then
  note "THIẾU RENDER_API_KEY / RENDER_SERVICE_ID ⇒ KHÔNG ĐO ĐƯỢC."
  note "Tầng 1 chỉ chứng minh production có mcp-auth; nó KHÔNG nói gì về việc"
  note "production có đang chạy đúng main hay không. Thoát 2 (không phải 0)."
  exit 2
fi

live_json="$(curl -sS --fail-with-body --max-time 30 \
  -H "Authorization: Bearer $RENDER_API_KEY" -H "Accept: application/json" \
  "https://api.render.com/v1/services/$RENDER_SERVICE_ID/deploys?limit=20")" || {
    note "Gọi Render API thất bại ⇒ KHÔNG ĐO ĐƯỢC."; exit 2; }

# `.deploy // .` vì API bọc mỗi phần tử trong {deploy, cursor}. Lọc theo status
# thay vì tin phần tử đầu: phần tử đầu có thể đang build_in_progress, và khi đó
# production vẫn đang phục vụ bản TRƯỚC đó.
live_sha="$(printf '%s' "$live_json" | jq -r \
  'map(.deploy // .) | map(select(.status == "live")) | .[0].commit.id // ""')"
[ -n "$live_sha" ] || { note "Không có deploy nào ở trạng thái live trong 20 bản gần nhất."; exit 1; }

main_sha="$(git rev-parse HEAD)"
note "main đang ở : $main_sha"
note "live đang ở : $live_sha"
[ "$main_sha" = "$live_sha" ] && { note "Khớp — production đang chạy đúng main."; exit 0; }

# Lệch KHÔNG phải lúc nào cũng là sự cố: commit chỉ đụng docs/_acceptance thì
# không cần deploy. Nhưng muốn phân loại được thì phải CÓ live_sha trong repo —
# và với clone nông (actions/checkout mặc định depth=1) thì nó KHÔNG có. Trước
# đây `git diff` lỗi trong một khối `if`, `set -e` không chặn, luồng rơi thẳng
# vào nhánh báo động ⇒ monitor kêu oan mỗi lần main đi trước bằng một commit
# docs. Ở đây kiểm tường minh rồi mới phân loại: không lấy được thì nói KHÔNG
# PHÂN LOẠI ĐƯỢC, chứ không đoán về phía nào cả.
if ! git cat-file -e "${live_sha}^{commit}" 2>/dev/null; then
  git fetch --quiet --depth=100 origin "$live_sha" 2>/dev/null || git fetch --quiet --unshallow 2>/dev/null || true
fi
if ! git cat-file -e "${live_sha}^{commit}" 2>/dev/null; then
  note "LỆCH commit, nhưng $live_sha không có trong bản clone này nên KHÔNG phân"
  note "loại được là docs-only hay chạm code. Cần fetch đủ sâu (fetch-depth: 0)."
  exit 2
fi

if git diff --quiet "$live_sha" "$main_sha" -- \
     ':(exclude)docs/**' ':(exclude)_acceptance/**' ':(exclude)**/*.md'; then
  note "Lệch commit nhưng CHỈ ở docs/_acceptance — production không cần deploy lại."
  exit 0
fi

note "LỆCH THẬT: production chạy $live_sha trong khi main đã ở $main_sha,"
note "và phần lệch có chạm code. Trigger deploy hoặc sửa webhook — xem issue #9."
git --no-pager diff --stat "$live_sha" "$main_sha" -- \
  ':(exclude)docs/**' ':(exclude)_acceptance/**' ':(exclude)**/*.md' | tail -20
exit 1
