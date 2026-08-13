---
schema_version: 2
feature_slug: recipe-region-spotlight
verdict: PASS
failed_evals: []
reason: "Vòng 1 ghim lại ở baf27d3: 13/13 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: baf27d3b94673ba706de51fdd9e45776224f0bc2
human_signoff:
---

# Evidence Report: recipe-region-spotlight

## Vòng 1 — ghim lại ở `baf27d3`; 13/13 eval máy chạy tươi, 0 đỏ

Vòng verify đầu tiên của gói này (hợp đồng vẫn ở `status: draft` — **Cổng 1 chưa ghi**, `approved_by` rỗng. Trạng thái cố ý KHÔNG tiến: tiến khi chưa có Cổng 1 sẽ tạo thêm một vi phạm mới).

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 13/13.

**Cổng 2 đầu tiên của gói này, và nó bắt ngay một eval hỏng.** E13 (AC-12) viết `git diff --quiet <verified_commit> HEAD -- <t3_paths>`: placeholder chưa từng được thay ⇒ eval **chưa bao giờ chạy nổi**; và kể cả thay đúng thì ở vòng verify `verified_commit` CHÍNH LÀ HEAD, nên nó rút thành `git diff HEAD HEAD` — rỗng vĩnh viễn, không bao giờ đỏ được.

Cả gói `evals.yaml` này cũng chỉ mới có từ PR #41 — hợp đồng có từ PR #28 nhưng **không có evals suốt bốn PR**, sống sót vì `status: draft` miễn soi.

Thay bằng `scripts/t3-untouched.ts` đo đúng ý định *trong phạm vi gói này*: không commit nào chạm `recipes.ts` được đồng thời chạm `t3_paths`. Độc lập với `satellite-basemap` — gói đó ĐÃ đổi cả hai `t3_paths` ở PR #8a, đúng thủ tục leo thang T3, và điều đó không nói gì về tầng recipe. Đo được: **7 commit** của tầng recipe, không cái nào chạm `t3_paths`. Đối chứng âm: commit chạm cả `recipes.ts` lẫn `src/lib/export.ts` ⇒ FAIL nêu đích danh, mã thoát 1.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Bằng chứng từng eval — vòng 1

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
