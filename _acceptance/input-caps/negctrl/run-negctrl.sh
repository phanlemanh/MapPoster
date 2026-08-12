#!/usr/bin/env bash
# Negative control cho AC-9: bất biến "mỗi trần có ĐỦ HAI tầng gác".
#
# Vì sao cần: khi cả hai tầng còn nguyên, gỡ MỘT tầng vẫn xanh ở mọi eval
# kết-quả (tầng kia bắt thay). Nên bất biến hai tầng KHÔNG chứng minh được bằng
# một phép chạy xuôi — chỉ bằng cách gỡ từng tầng rồi đòi đúng eval tương ứng
# phải đỏ. Bốn ca dưới đây, mỗi ca gỡ đúng một tầng.
#
# Chạy: bash _acceptance/input-caps/negctrl/run-negctrl.sh
# Exit 0 = cả bốn ca đều đỏ ĐÚNG CHỖ (bất biến còn nguyên).
# Exit 1 = có ca vẫn xanh sau khi gỡ tầng gác ⇒ eval đó không thật sự gác gì.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
cd "$ROOT"

RC="mcp-server/src/resolveConfig.ts"
TOOLS="mcp-server/src/tools.ts"
BAK="$(mktemp -d)"
cp "$RC" "$BAK/rc" ; cp "$TOOLS" "$BAK/tools"

restore() { cp "$BAK/rc" "$RC"; cp "$BAK/tools" "$TOOLS"; }
# Khôi phục kể cả khi bị Ctrl-C hay lỗi giữa chừng: để lại cây làm việc đã bị
# đục thủng là biến một bộ đo thành một bản vá bị gỡ âm thầm.
trap 'restore; rm -rf "$BAK"' EXIT INT TERM

fails=0

# $1 = nhãn ca | $2 = file test | $3 = -t pattern
expect_red() {
  local label="$1" file="$2" pat="$3"
  if npx vitest run "$file" -t "$pat" >/dev/null 2>&1; then
    echo "NEGCTRL FAIL [$label]: eval VẪN XANH sau khi gỡ tầng gác — nó không gác gì"
    fails=$((fails + 1))
  else
    echo "negctrl ok [$label]: đỏ đúng như kỳ vọng"
  fi
  restore
}

echo "── ca 1: gỡ Object.hasOwn trong formatSize (issue #3) ⇒ E8 phải đỏ"
perl -0pi -e 's/if \(Object\.hasOwn\(FORMATS, format\)\) return FORMATS\[format\];/if (FORMATS[format]) return FORMATS[format];/' "$RC"
expect_red "E8 / AC-8" mcp-server/src/resolveConfig.test.ts 'Object.prototype'

echo "── ca 2: gỡ assertHighlightCount (issue #2, tầng runtime) ⇒ E1+E2 phải đỏ"
perl -0pi -e 's/  assertHighlightCount\(raw(Regions|Points)\.length, .highlight\.\w+.\);\n//g' "$RC"
expect_red "E1+E2 / AC-1,2" mcp-server/src/resolveConfig.test.ts 'before spending a single geocoding request'

echo "── ca 3: gỡ guard MAX_VARIANTS trong render_variants (issue #1) ⇒ E5 phải đỏ"
perl -0pi -e 's/if \(params\.variants\.length > MAX_VARIANTS\) \{/if (false) {/' "$TOOLS"
expect_red "E5 / AC-5" mcp-server/src/tools.test.ts 'BEFORE the first render'

echo "── ca 4: gỡ .max() ở schema Zod (issue #2, tầng biên) ⇒ E4 phải đỏ"
perl -0pi -e 's/\.max\(MAX_HIGHLIGHTS\)\n      \.optional\(\)/.optional()/g' "$TOOLS"
expect_red "E4 / AC-4" mcp-server/src/tools.test.ts 'renderMapSchema refuses'

if [ "$fails" -ne 0 ]; then
  echo "negctrl: $fails/4 ca hỏng — bất biến hai tầng KHÔNG đứng"
  exit 1
fi
echo "negctrl: 4/4 ca đỏ đúng chỗ — bất biến hai tầng đứng"
