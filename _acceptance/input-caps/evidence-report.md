---
schema_version: 2
feature_slug: input-caps
verdict: PASS
failed_evals: []
reason: "Vòng 1 ghim lại ở baf27d3: 9/9 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: f557763d0abed97665ef09b902ccb2e320cbfbb2
human_signoff:
---

# Evidence Report: input-caps

## Vòng ghim lại ở `f557763` — thêm `scripts/check-deploy-drift.sh`

Kích hoạt: PR #45 thêm **một** tệp, `scripts/check-deploy-drift.sh`. Nó KHÔNG thuộc `t1_skip_globs` — danh sách đó chỉ miễn hai đường dẫn CHÍNH XÁC của bộ gate vendored, không phải `scripts/**` — nên mọi hồ sơ ghim ở `baf27d3` hết hiệu lực theo commit. **Không nới danh sách miễn trừ để lách**: sửa cái thước cho lọt thay đổi của chính mình là đúng thứ cổng này sinh ra để chặn. Chạy lại verify thay vì đổi luật.

Cả 188 eval máy của 12 gói chạy lại tươi ở commit này, **188/188 thoát 0**.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Vòng 1 — ghim lại ở `baf27d3`; 9/9 eval máy chạy tươi, 0 đỏ

Vòng verify đầu tiên của gói này (hợp đồng vẫn ở `status: draft` — **Cổng 1 chưa ghi**, `approved_by` rỗng. Trạng thái cố ý KHÔNG tiến: tiến khi chưa có Cổng 1 sẽ tạo thêm một vi phạm mới).

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 9/9.

**Cổng 2 đầu tiên.** 9/9 eval máy xanh, gồm cả `run-negctrl.sh` — bộ đối chứng âm tự nó chứng minh rằng gỡ từng chốt một sẽ làm đúng eval tương ứng đỏ, nên 9 màu xanh này không phải xanh rỗng.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Bằng chứng từng eval — vòng 1

- eval: E1
  criterion: AC-1
  run_id: input-caps-r1-resolve_config-20260813
  exit_code: 0
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/resolveConfig.test.ts
  output: |
    Tests  71 passed (71) · Start at  16:43:56 · Duration  418ms (transform 54ms, setup 0ms, import 65ms, tests 82ms, environment 201ms)

- eval: E2
  criterion: AC-2
  run_id: input-caps-r1-resolve_config-20260813
  exit_code: 0
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/resolveConfig.test.ts
  output: |
    Tests  71 passed (71) · Start at  16:43:56 · Duration  418ms (transform 54ms, setup 0ms, import 65ms, tests 82ms, environment 201ms)

- eval: E3
  criterion: AC-3
  run_id: input-caps-r1-resolve_config-20260813
  exit_code: 0
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/resolveConfig.test.ts
  output: |
    Tests  71 passed (71) · Start at  16:43:56 · Duration  418ms (transform 54ms, setup 0ms, import 65ms, tests 82ms, environment 201ms)

- eval: E4
  criterion: AC-4
  run_id: input-caps-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E5
  criterion: AC-5
  run_id: input-caps-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E6
  criterion: AC-6
  run_id: input-caps-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E7
  criterion: AC-7
  run_id: input-caps-r1-clip_tools-20260813
  exit_code: 0
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/tools.test.ts
  output: |
    Tests  69 passed (69) · Start at  16:43:57 · Duration  489ms (transform 87ms, setup 0ms, import 120ms, tests 99ms, environment 202ms)

- eval: E8
  criterion: AC-8
  run_id: input-caps-r1-resolve_config-20260813
  exit_code: 0
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-13T09:45:11Z
  cmd: npx vitest run mcp-server/src/resolveConfig.test.ts
  output: |
    Tests  71 passed (71) · Start at  16:43:56 · Duration  418ms (transform 54ms, setup 0ms, import 65ms, tests 82ms, environment 201ms)

- eval: E9
  criterion: AC-9
  run_id: input-caps-r1-input_caps_negctrl-20260813
  exit_code: 0
  verifier: config:executors.script.input_caps_negctrl
  verified_at: 2026-08-13T09:45:11Z
  cmd: bash _acceptance/input-caps/negctrl/run-negctrl.sh
  output: |
    ── ca 4: gỡ .max() ở schema Zod (issue #2, tầng biên) ⇒ E4 phải đỏ · negctrl ok [E4 / AC-4]: đỏ đúng như kỳ vọng · negctrl: 4/4 ca đỏ đúng chỗ — bất biến hai tầng đứng
