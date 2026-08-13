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

