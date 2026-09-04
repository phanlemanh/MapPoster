---
schema_version: 2
feature_slug: recipe-region-spotlight
verdict: PASS
failed_evals: []
reason: "Vòng 2 ở cfe51aa: bộ đo đã trỏ đúng tệp test tầng recipe, 13/13 eval máy chạy tươi, 0 đỏ. Làn suite xanh sau khi cài trình duyệt còn thiếu."
verified_by: Claude Opus 5 (phiên 2026-08-19) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: 480e40daf0032005235b1f788e7837849e76429d
human_signoff: manh — 2026-08-19
---

# Evidence Report: recipe-region-spotlight

### Re-pin lần 5 — 2026-09-04, do lật sổ 14 làn đã ký sang signed-off — chạm _acceptance/<slug>/ đánh thức luật hết-hạn (STALE-DIFF-SCOPE-GUARD), trôi là hai tệp test mcp-server/src/recipes.test.ts + src/components/MapView.test.tsx từ ab0a1f5/ebb0676
run_id: repin-20260904-480e40d
sha: 480e40daf0032005235b1f788e7837849e76429d · suites: 3 lệnh exit 0 (bộ đơn vị 629 đạt · test:e2e 18 đạt · test:mcp 22 đạt) — Node v24.19.0
Chữ ký người GIỮ NGUYÊN — thay đổi làm hết hạn nằm trọn trong làn test, không chạm hành vi sản phẩm.

### Re-pin lần 4 — 2026-08-19, do vá thiếu Web Storage cho làn test (vitest.config.ts + vitest.setup.ts + src/test-env) sau khi Node máy dev tự nâng lên 26.7
run_id: repin-20260819-fcb64d7
sha: fcb64d7e71aaaa320926cd08e92e32ee70da1478 · suites: 3 lệnh exit 0 (bộ đơn vị 629 đạt · test:e2e 18 đạt · test:mcp 22 đạt) — lần đầu đo trên Node 26.7
Chữ ký người GIỮ NGUYÊN — thay đổi làm hết hạn nằm trọn trong làn test, không chạm hành vi sản phẩm.

### Re-pin lần 3 — 2026-08-19, do nâng @playwright/test 1.61.1 → 1.62.1 — package.json và package-lock.json không thuộc danh sách miễn trừ
run_id: repin-20260819-4a8f938
sha: 4a8f9387608a537a037c1b7c769237f7f910124b · suites: 3 lệnh exit 0 (npm test 617 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Lượt này rộng hơn một lần ghim lại thường: vì đổi là ĐỔI TRÌNH DUYỆT, đã chạy thêm TOÀN BỘ 11 phép đo dạng script (gồm cả bộ đối chứng âm 4/4 ca của input-caps và đường dựng ảnh thật của routes-measurements: 5 render, 14 phép kiểm đạt) — tất cả exit 0.
Chữ ký người GIỮ NGUYÊN.

### Re-pin lần 2 — 2026-08-19, do thêm ba ca AC-8 vào mcp-server/src/resolveConfig.test.ts — mcp-server/ không thuộc danh sách miễn trừ
run_id: repin-20260819-c35ac43
sha: c35ac43f50c7c3f6d12d07bdd71da1696d9584dc · suites: 3 lệnh exit 0 (npm test 617 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Chữ ký người GIỮ NGUYÊN — thay đổi làm hết hạn là ba ca test mới, không chạm hành vi sản phẩm.

### Re-pin lần 1 — 2026-08-19, do thêm src/components/MapView.test.tsx (tệp test đầu tiên của thành phần bản đồ web) — src/ không thuộc danh sách miễn trừ nên mọi hồ sơ ghim trước đó hết hiệu lực
run_id: repin-20260819-cae52de
sha: cae52de592f604d5f39e8d761d14d3d36a8d5858 · suites: 3 lệnh exit 0 (npm test 614 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Chữ ký người GIỮ NGUYÊN — làn máy chạy tươi và xanh ở mốc mới, và thay đổi làm hết hạn là một tệp test, không chạm mã sản phẩm.

## Vòng 2 — bộ đo trỏ đúng tệp, chạy lại toàn bộ ở `cfe51aa`

**Vì sao có vòng này:** phản biện ngữ cảnh sạch trước Cổng 1 làm lộ ra 11 trong 13
phép đo trỏ vào `executors.test.clip_tools`, tức `mcp-server/src/tools.test.ts` —
tệp chứa chuỗi `recipe` đúng **0 lần**. Đo trực tiếp trước khi sửa: lệnh đó cho
**69 ca đạt, không ca nào chạm tầng recipe**; 35 ca thật nằm ở
`mcp-server/src/recipes.test.ts` mà không phép đo nào trỏ tới. Bằng chứng vòng 1
ghi 13/13 xanh trong khi 11 phép đo đo một thứ không liên quan.

Sửa ở `cfe51aa`: khai `executors.test.recipe_tools` rồi trỏ 11 phép đo sang đó.

**Kết quả vòng 2 — 13/13 eval máy thoát 0:**

| Làn | Lệnh | Kết quả |
|---|---|---|
| 11 eval (E1-E6, E8-E12) | `npx vitest run mcp-server/src/recipes.test.ts` | thoát 0 · 35 ca đạt |
| E7 | `MCP_INTEGRATION=1 npx vitest run mcp-server/src/mcpProtocol.test.ts` | thoát 0 · 7 ca đạt |
| E13 | `npx tsx _acceptance/recipe-region-spotlight/scripts/t3-untouched.ts` | thoát 0 · 7 commit tầng recipe, 0 chạm đường cấm |

**Làn suite (`feature_loop.suite_keys`) — BLOCKED rồi mới xanh:**

Lượt đầu, cả `test:e2e` lẫn `test:mcp` thoát 1 với cùng một dòng:

    Error: browserType.launch: Executable doesn't exist at
    ~/Library/Caches/ms-playwright/chromium_headless_shell-1228/chrome-headless-shell-mac-arm64/chrome-headless-shell

Truy nguyên: thư mục cache trình duyệt của máy **rỗng hoàn toàn** — lỗi môi
trường, không phải hồi quy (13/13 eval của gói và 612 ca unit đều xanh cùng lúc
đó). KHÔNG hạ BLOCKED thành đạt: cài trình duyệt bằng `npx playwright install
chromium` (bản 1.61.1 đang cài, không nâng lên 1.62.1 vì nâng sẽ chạm
`package.json` và làm hết hạn cả 10 hợp đồng đang ghim `f557763`), rồi chạy lại
ĐÚNG hai bộ đó:

| Suite | Kết quả sau khi cài |
|---|---|
| `npm test` | thoát 0 · 612 đạt, 17 bỏ qua |
| `npm run test:e2e` | thoát 0 · 18 đạt (56,2s) |
| `npm run test:mcp` | thoát 0 · 22 đạt, 4 tệp (89,7s) |

`verified_commit` = `cfe51aae4af658f60d37396a3020b329b4fe905e`. `human_signoff` để **RỖNG** — chữ ký phải nằm trong
commit do chính người duyệt tạo.

## Evidence

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-6b | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-9 | test | PASS |
| E11 | AC-10 | test | PASS |
| E12 | AC-11 | test | PASS |
| E13 | AC-12 | script | PASS |

- eval: E1
  criterion: AC-1
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E2
  criterion: AC-2
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E3
  criterion: AC-3
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E4
  criterion: AC-4
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E5
  criterion: AC-5
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E6
  criterion: AC-6
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E7
  criterion: AC-6b
  run_id: recipe-region-spotlight-r2-mcp_protocol-20260819
  exit_code: 0
  verifier: config:executors.test.mcp_protocol
  verified_at: 2026-08-19T00:21:43Z
  cmd: MCP_INTEGRATION=1 npx vitest run mcp-server/src/mcpProtocol.test.ts
  output: |
    Test Files  1 passed (1) · Tests  7 passed (7) · Duration 824ms

- eval: E8
  criterion: AC-7
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E9
  criterion: AC-8
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E10
  criterion: AC-9
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E11
  criterion: AC-10
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E12
  criterion: AC-11
  run_id: recipe-region-spotlight-r2-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Test Files  1 passed (1) · Tests  35 passed (35) · Duration 691ms

- eval: E13
  criterion: AC-12
  run_id: recipe-region-spotlight-r2-t3_untouched-20260819
  exit_code: 0
  verifier: config:executors.script.recipe_t3_untouched
  verified_at: 2026-08-19T00:21:43Z
  cmd: npx tsx _acceptance/recipe-region-spotlight/scripts/t3-untouched.ts
  output: |
    t3-untouched: 7 commit của tầng recipe, KHÔNG cái nào chạm src/lib/export.ts / src/lib/mapStyle.ts


## Vòng ghim lại ở `f557763` — thêm `scripts/check-deploy-drift.sh`

Kích hoạt: PR #45 thêm **một** tệp, `scripts/check-deploy-drift.sh`. Nó KHÔNG thuộc `t1_skip_globs` — danh sách đó chỉ miễn hai đường dẫn CHÍNH XÁC của bộ gate vendored, không phải `scripts/**` — nên mọi hồ sơ ghim ở `baf27d3` hết hiệu lực theo commit. **Không nới danh sách miễn trừ để lách**: sửa cái thước cho lọt thay đổi của chính mình là đúng thứ cổng này sinh ra để chặn. Chạy lại verify thay vì đổi luật.

Cả 188 eval máy của 12 gói chạy lại tươi ở commit này, **188/188 thoát 0**.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Vòng 1 — ghim lại ở `baf27d3`; 13/13 eval máy chạy tươi, 0 đỏ

Vòng verify đầu tiên của gói này (hợp đồng vẫn ở `status: draft` — **Cổng 1 chưa ghi**, `approved_by` rỗng. Trạng thái cố ý KHÔNG tiến: tiến khi chưa có Cổng 1 sẽ tạo thêm một vi phạm mới).

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 13/13.

**Cổng 2 đầu tiên của gói này, và nó bắt ngay một eval hỏng.** E13 (AC-12) viết `git diff --quiet <verified_commit> HEAD -- <t3_paths>`: placeholder chưa từng được thay ⇒ eval **chưa bao giờ chạy nổi**; và kể cả thay đúng thì ở vòng verify `verified_commit` CHÍNH LÀ HEAD, nên nó rút thành `git diff HEAD HEAD` — rỗng vĩnh viễn, không bao giờ đỏ được.

Cả gói `evals.yaml` này cũng chỉ mới có từ PR #41 — hợp đồng có từ PR #28 nhưng **không có evals suốt bốn PR**, sống sót vì `status: draft` miễn soi.

Thay bằng `scripts/t3-untouched.ts` đo đúng ý định *trong phạm vi gói này*: không commit nào chạm `recipes.ts` được đồng thời chạm `t3_paths`. Độc lập với `satellite-basemap` — gói đó ĐÃ đổi cả hai `t3_paths` ở PR #8a, đúng thủ tục leo thang T3, và điều đó không nói gì về tầng recipe. Đo được: **7 commit** của tầng recipe, không cái nào chạm `t3_paths`. Đối chứng âm: commit chạm cả `recipes.ts` lẫn `src/lib/export.ts` ⇒ FAIL nêu đích danh, mã thoát 1.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Bằng chứng vòng 1 — BỘ ĐO CŨ, ĐÃ HẾT HIỆU LỰC

> Giữ lại làm lịch sử. 11 trong 13 khối dưới đây trỏ vào lệnh chạy
> `mcp-server/src/tools.test.ts` — tệp KHÔNG chứa một dòng nào về tầng
> recipe. Xem vòng 2 để biết bằng chứng đang có hiệu lực.

- eval: E1
  criterion: AC-1
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E2
  criterion: AC-2
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E3
  criterion: AC-3
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E4
  criterion: AC-4
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E5
  criterion: AC-5
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E6
  criterion: AC-6
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E7
  criterion: AC-6b
  run_id: recipe-region-spotlight-r1-mcp_protocol-20260813
  exit_code: 0
  verifier: config:executors.test.mcp_protocol
  verified_at: 2026-08-13T09:45:11Z
  cmd: MCP_INTEGRATION=1 npx vitest run mcp-server/src/mcpProtocol.test.ts
  output: |
    Tests  7 passed (7) · Start at  16:40:43 · Duration  630ms (transform 23ms, setup 0ms, import 68ms, tests 307ms, environment 192ms)

- eval: E8
  criterion: AC-7
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E9
  criterion: AC-8
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E10
  criterion: AC-9
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E11
  criterion: AC-10
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E12
  criterion: AC-11
  run_id: recipe-region-spotlight-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E13
  criterion: AC-12
  run_id: recipe-region-spotlight-r1-recipe_t3_untouched-20260813
  exit_code: 0
  verifier: config:executors.script.recipe_t3_untouched
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx tsx _acceptance/recipe-region-spotlight/scripts/t3-untouched.ts
  output: |
    951a2d8 feat(recipes): tầng recipe + region-spotlight — một call ra một cảnh hoàn chỉnh ·  · t3-untouched: 7 commit của tầng recipe, KHÔNG cái nào chạm src/lib/export.ts / src/lib/mapStyle.ts
