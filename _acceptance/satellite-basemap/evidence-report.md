---
schema_version: 2
feature_slug: satellite-basemap
verdict: PENDING-JUDGMENT
failed_evals: []
reason: "Vòng 1 ghim lại ở baf27d3: 10/10 eval máy chạy tươi, 0 đỏ; E11, E12 chờ phán xét người."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: f557763d0abed97665ef09b902ccb2e320cbfbb2
human_signoff:
---

# Evidence Report: satellite-basemap

## Vòng ghim lại ở `f557763` — thêm `scripts/check-deploy-drift.sh`

Kích hoạt: PR #45 thêm **một** tệp, `scripts/check-deploy-drift.sh`. Nó KHÔNG thuộc `t1_skip_globs` — danh sách đó chỉ miễn hai đường dẫn CHÍNH XÁC của bộ gate vendored, không phải `scripts/**` — nên mọi hồ sơ ghim ở `baf27d3` hết hiệu lực theo commit. **Không nới danh sách miễn trừ để lách**: sửa cái thước cho lọt thay đổi của chính mình là đúng thứ cổng này sinh ra để chặn. Chạy lại verify thay vì đổi luật.

Cả 188 eval máy của 12 gói chạy lại tươi ở commit này, **188/188 thoát 0**.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Vòng 1 — ghim lại ở `baf27d3`; 10/10 eval máy chạy tươi, 0 đỏ

Vòng verify đầu tiên của gói này (hợp đồng vẫn ở `status: draft` — **Cổng 1 chưa ghi**, `approved_by` rỗng. Trạng thái cố ý KHÔNG tiến: tiến khi chưa có Cổng 1 sẽ tạo thêm một vi phạm mới).

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 10/10.

**Cổng 2 đầu tiên.** 10/12 eval máy xanh. E11/E12 là phán xét người và **chặn bởi #8b** (quyết định tự host tile server Sentinel-2) — chặn bởi hạ tầng, không phải bởi code: không có nguồn tile thì không có ảnh thật để phán xét chất lượng.

Gói này là **T3** — nó đổi cả hai `t3_paths` (`src/lib/export.ts` +20/-3, `src/lib/mapStyle.ts` +55/-1). `signoff.required_for` gồm T3, nên chữ ký ở đây là bắt buộc chứ không tùy chọn.

`verdict: PENDING-JUDGMENT` — E11, E12 chờ phán xét người. Không eval máy nào đỏ.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

