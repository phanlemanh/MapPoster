---
schema_version: 2
feature_slug: input-caps
verdict: PASS
failed_evals: []
reason: "Vòng 1 ghim lại ở baf27d3: 9/9 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: baf27d3b94673ba706de51fdd9e45776224f0bc2
human_signoff:
---

# Evidence Report: input-caps

## Vòng 1 — ghim lại ở `baf27d3`; 9/9 eval máy chạy tươi, 0 đỏ

Vòng verify đầu tiên của gói này (hợp đồng vẫn ở `status: draft` — **Cổng 1 chưa ghi**, `approved_by` rỗng. Trạng thái cố ý KHÔNG tiến: tiến khi chưa có Cổng 1 sẽ tạo thêm một vi phạm mới).

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 9/9.

**Cổng 2 đầu tiên.** 9/9 eval máy xanh, gồm cả `run-negctrl.sh` — bộ đối chứng âm tự nó chứng minh rằng gỡ từng chốt một sẽ làm đúng eval tương ứng đỏ, nên 9 màu xanh này không phải xanh rỗng.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

