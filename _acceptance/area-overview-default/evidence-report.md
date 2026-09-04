---
schema_version: 2
feature_slug: area-overview-default
verdict: PASS
failed_evals: []
reason: "Vòng 1 ở 4a00cbc: 4/4 eval máy thoát 0. Làn suite từng BLOCKED vì Node máy dev tự nâng; chạy lại sau khi gói test-env-webstorage vá xong."
verified_by: Claude Opus 5 (phiên 2026-08-19) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: 480e40daf0032005235b1f788e7837849e76429d
human_signoff: manh — 2026-08-19 (máy gõ theo lệnh của người duyệt trong phiên)
---

# Evidence Report: area-overview-default

### Re-pin lần 1 — 2026-09-04, do lật sổ 14 làn đã ký sang signed-off — chạm _acceptance/<slug>/ đánh thức luật hết-hạn (STALE-DIFF-SCOPE-GUARD), trôi là hai tệp test mcp-server/src/recipes.test.ts + src/components/MapView.test.tsx từ ab0a1f5/ebb0676
run_id: repin-20260904-480e40d
sha: 480e40daf0032005235b1f788e7837849e76429d · suites: 3 lệnh exit 0 (bộ đơn vị 629 đạt · test:e2e 18 đạt · test:mcp 22 đạt) — Node v24.19.0
Chữ ký người GIỮ NGUYÊN — thay đổi làm hết hạn nằm trọn trong làn test, không chạm hành vi sản phẩm.

## Vòng 1 — ghim ở `4a00cbc`

**Làn suite từng BLOCKED, không phải REJECT.** Lúc vòng này chạy lần đầu, Node
trên máy dev vừa tự nâng 24.16 → 26.7 và làm chết 24 ca ở bốn tệp không liên
quan tới gói. Kit cấm hạ BLOCKED thành đạt, nên vòng dừng lại, một gói riêng
(`test-env-webstorage`) vá làn test, rồi vòng này chạy lại trọn vẹn.

**Năm ca phá thử lúc sinh phép đo**, mỗi ca đỏ đúng chỗ:

| Phá gì | Phép đo đỏ |
|---|---|
| Trả mặc định về ảnh vệ tinh | E1 |
| Nuốt luôn yêu cầu tường minh, ép về nền vẽ | E2 (cả hai chiều) |
| Từ chối ảnh vệ tinh VÔ ĐIỀU KIỆN, kể cả khi có nguồn | E2 (chỉ đối chứng dương) |
| Trả câu mô tả cũ về danh mục | E3 |
| Cho một công thức khác tự đặt nền | E4 |

Ca thứ ba là ca đáng giá nhất: nó chỉ đánh đúng đối chứng dương, tức phép đo
phân biệt được "từ chối đúng lúc" với "từ chối bừa".

**4/4 eval máy thoát 0.** Làn suite trên Node 26.7: bộ đơn vị **629 đạt**,
`test:e2e` 18 đạt, `test:mcp` 22 đạt.

`human_signoff` để **RỖNG** — Cổng 2 chờ người ký.

## Evidence

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |

- eval: E1
  criterion: AC-1
  run_id: area-overview-default-r1-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T12:04:00Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Tests 40 passed (40)
- eval: E2
  criterion: AC-2
  run_id: area-overview-default-r1-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T12:04:00Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Tests 40 passed (40)
- eval: E3
  criterion: AC-3
  run_id: area-overview-default-r1-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T12:04:00Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Tests 40 passed (40)
- eval: E4
  criterion: AC-4
  run_id: area-overview-default-r1-recipe_tools-20260819
  exit_code: 0
  verifier: config:executors.test.recipe_tools
  verified_at: 2026-08-19T12:04:00Z
  cmd: npx vitest run mcp-server/src/recipes.test.ts
  output: |
    Tests 40 passed (40)
