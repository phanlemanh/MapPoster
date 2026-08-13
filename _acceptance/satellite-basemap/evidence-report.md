---
schema_version: 2
feature_slug: satellite-basemap
verdict: PENDING-JUDGMENT
failed_evals: []
reason: "Vòng 1 ghim lại ở baf27d3: 10/10 eval máy chạy tươi, 0 đỏ; E11, E12 chờ phán xét người."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: baf27d3b94673ba706de51fdd9e45776224f0bc2
human_signoff:
---

# Evidence Report: satellite-basemap

## Vòng 1 — ghim lại ở `baf27d3`; 10/10 eval máy chạy tươi, 0 đỏ

Vòng verify đầu tiên của gói này (hợp đồng vẫn ở `status: draft` — **Cổng 1 chưa ghi**, `approved_by` rỗng. Trạng thái cố ý KHÔNG tiến: tiến khi chưa có Cổng 1 sẽ tạo thêm một vi phạm mới).

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 10/10.

**Cổng 2 đầu tiên.** 10/12 eval máy xanh. E11/E12 là phán xét người và **chặn bởi #8b** (quyết định tự host tile server Sentinel-2) — chặn bởi hạ tầng, không phải bởi code: không có nguồn tile thì không có ảnh thật để phán xét chất lượng.

Gói này là **T3** — nó đổi cả hai `t3_paths` (`src/lib/export.ts` +20/-3, `src/lib/mapStyle.ts` +55/-1). `signoff.required_for` gồm T3, nên chữ ký ở đây là bắt buộc chứ không tùy chọn.

`verdict: PENDING-JUDGMENT` — E11, E12 chờ phán xét người. Không eval máy nào đỏ.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

