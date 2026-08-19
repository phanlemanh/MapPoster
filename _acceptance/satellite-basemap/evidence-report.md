---
schema_version: 2
feature_slug: satellite-basemap
verdict: PASS
failed_evals: []
reason: "Vòng 3 ở c35ac43: bịt lỗ bằng chứng của AC-8 (phép đo cũ chạy tệp không chạm nhánh satellite), 11/11 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-19) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: 4a8f9387608a537a037c1b7c769237f7f910124b
human_signoff: manh — 2026-08-19 (máy gõ theo lệnh của người duyệt trong phiên)
---

# Evidence Report: satellite-basemap

### Re-pin lần 1 — 2026-08-19, do nâng @playwright/test 1.61.1 → 1.62.1 — package.json và package-lock.json không thuộc danh sách miễn trừ
run_id: repin-20260819-4a8f938
sha: 4a8f9387608a537a037c1b7c769237f7f910124b · suites: 3 lệnh exit 0 (npm test 617 đạt · test:e2e 18 đạt · test:mcp 22 đạt)
Lượt này rộng hơn một lần ghim lại thường: vì đổi là ĐỔI TRÌNH DUYỆT, đã chạy thêm TOÀN BỘ 11 phép đo dạng script (gồm cả bộ đối chứng âm 4/4 ca của input-caps và đường dựng ảnh thật của routes-measurements: 5 render, 14 phép kiểm đạt) — tất cả exit 0.
Chữ ký người GIỮ NGUYÊN.

## Vòng 3 — bịt lỗ bằng chứng của AC-8, ghim ở `c35ac43`

**Vì sao có vòng này.** Lint đấu dây mới dựng (`_acceptance/eval-wiring-lint.mjs`)
hỏi một câu mà không phép kiểm nào trong kit hỏi: *tệp mà lệnh chạy có chứa định
danh nào của tiêu chí không?* Nó bắt được E9.

E9 khai đo AC-8 — đường agent phải TỪ CHỐI nền vệ tinh khi thiếu nguồn tile, kèm
tên biến trong thông điệp. Lệnh của nó chạy `resolveConfig.test.ts`, tệp mà **cả
file không có một chữ "satellite" nào**; và trong toàn kho, chuỗi
`MAPPOSTER_SATELLITE_TILES` chỉ tồn tại trong mã nguồn, **không tệp test nào**
nhắc tới. Màu xanh của E9 ở vòng 2 đến trọn vẹn từ 71 ca không liên quan.

Mã thì ĐÚNG — hàm chặn ném kèm đúng tên biến. Lỗ nằm ở bằng chứng, và nó đã lọt
qua phản biện ngữ cảnh sạch, vòng nghiệm thu, lẫn chữ ký của vòng 2.

**Sửa:** thêm ba ca vào `resolveConfig.test.ts` — từ chối khi thiếu nguồn (ghim
tên biến), đối chứng dương có nguồn thì URL đi xuống config, và nền vector không
bị đánh thuế. Cặp hai chiều đo lúc sinh: gỡ phép từ chối ⇒ đỏ; **GIỮ** phép từ
chối nhưng đổi thông điệp thành `invalid basemap` ⇒ **vẫn đỏ**. Ca thứ hai là
điểm chính — caller là agent, nó chỉ đọc được thông điệp.

**11/11 eval máy thoát 0.** Làn suite: `npm test` 617 đạt (tăng 3 ca) ·
`test:e2e` 18 đạt · `test:mcp` 22 đạt.

`human_signoff` XOÁ — chữ ký cũ thuộc về vòng 2, không cưỡi sang một vòng có mã
đổi và một tiêu chí vừa được đo lần đầu.

## Evidence

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-13 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-10 | script | PASS |
| E13 | AC-9 | test | PASS |

- eval: E1
  criterion: AC-1
  run_id: satellite-basemap-r3-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Tests 7 passed (7)
- eval: E2
  criterion: AC-2
  run_id: satellite-basemap-r3-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Tests 7 passed (7)
- eval: E3
  criterion: AC-3
  run_id: satellite-basemap-r3-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Tests 7 passed (7)
- eval: E4
  criterion: AC-4
  run_id: satellite-basemap-r3-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Tests 7 passed (7)
- eval: E5
  criterion: AC-5
  run_id: satellite-basemap-r3-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Tests 7 passed (7)
- eval: E6
  criterion: AC-6
  run_id: satellite-basemap-r3-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Tests 7 passed (7)
- eval: E7
  criterion: AC-7
  run_id: satellite-basemap-r3-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Tests 7 passed (7)
- eval: E8
  criterion: AC-13
  run_id: satellite-basemap-r3-text_free-20260819
  exit_code: 0
  verifier: config:executors.test.text_free
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/lib/export.test.ts src/lib/mapStyle.test.ts
  output: |
    Tests 20 passed (20)
- eval: E9
  criterion: AC-8
  run_id: satellite-basemap-r3-resolve_config-20260819
  exit_code: 0
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run mcp-server/src/resolveConfig.test.ts
  output: |
    Tests 74 passed (74) — gồm 3 ca AC-8 mới
- eval: E10
  criterion: AC-10
  run_id: satellite-basemap-r3-basemap_invariants-20260819
  exit_code: 0
  verifier: config:executors.script.basemap_invariants
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx tsx _acceptance/satellite-basemap/scripts/basemap-invariants.ts
  output: |
    basemap-invariants: mọi bất biến đứng
- eval: E13
  criterion: AC-9
  run_id: satellite-basemap-r3-web_basemap-20260819
  exit_code: 0
  verifier: config:executors.test.web_basemap
  verified_at: 2026-08-19T09:46:30Z
  cmd: npx vitest run src/components/MapView.test.tsx
  output: |
    Tests 2 passed (2)

## Vòng 2 — sau khi bịt lỗ tiêu chí và rút phạm vi bị chặn, ghim ở `cae52de`

**Ba thay đổi ở Cổng 1 dẫn tới vòng này** (chi tiết ở `gap-probe.md`):

1. AC-9 (đường web rơi về vector) trước đó KHÔNG có phép đo nào, và thành phần
   bản đồ web chưa từng có tệp test. Nay có `src/components/MapView.test.tsx`
   (2 ca) + eval **E13**. Cặp hai chiều đo lúc sinh phép đo: bắt đường web ném
   ⇒ ca 1 đỏ đúng thông điệp; bỏ giá trị từ store ⇒ ca 2 đỏ đúng chỗ.
2. Bất biến clip-không-chữ có tiêu chí riêng **AC-13**; eval E8 trỏ từ AC-6
   sang nó.
3. Hai mục judgment (AC-11, AC-12) **rút sang hợp đồng #8b** — chúng đòi ảnh
   vệ tinh thật, thứ chỉ tồn tại khi #8b chốt nguồn tile. Gói này vì thế
   **không còn eval judgment nào**, và verdict đi thẳng từ PENDING-JUDGMENT
   sang PASS mà không ai phải phán một tấm ảnh không tồn tại.

**11/11 eval máy thoát 0** — 5 lệnh sau khử trùng lặp:

| Lệnh | Eval | Kết quả |
|---|---|---|
| `basemap.test.ts` | E1–E7 | thoát 0 · 7 ca |
| `export.test.ts` + `mapStyle.test.ts` | E8 | thoát 0 · 20 ca |
| `resolveConfig.test.ts` | E9 | thoát 0 · 71 ca |
| `basemap-invariants.ts` | E10 | thoát 0 · mọi bất biến đứng |
| `MapView.test.tsx` | E13 | thoát 0 · 2 ca |

**Làn suite:** `npm test` thoát 0 (614 đạt, 17 bỏ qua) · `test:e2e` thoát 0 (18
đạt) · `test:mcp` thoát 0 (22 đạt).

`verified_commit` = `cae52de592f604d5f39e8d761d14d3d36a8d5858`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký.

## Bằng chứng vòng 2 — thay bởi vòng 3

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-13 | test | PASS |
| E9 | AC-8 | test | PASS |
| E10 | AC-10 | script | PASS |
| E13 | AC-9 | test | PASS |

- eval: E1
  criterion: AC-1
  run_id: satellite-basemap-r2-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Test Files 1 passed · Tests 7 passed (7)

- eval: E2
  criterion: AC-2
  run_id: satellite-basemap-r2-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Test Files 1 passed · Tests 7 passed (7)

- eval: E3
  criterion: AC-3
  run_id: satellite-basemap-r2-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Test Files 1 passed · Tests 7 passed (7)

- eval: E4
  criterion: AC-4
  run_id: satellite-basemap-r2-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Test Files 1 passed · Tests 7 passed (7)

- eval: E5
  criterion: AC-5
  run_id: satellite-basemap-r2-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Test Files 1 passed · Tests 7 passed (7)

- eval: E6
  criterion: AC-6
  run_id: satellite-basemap-r2-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Test Files 1 passed · Tests 7 passed (7)

- eval: E7
  criterion: AC-7
  run_id: satellite-basemap-r2-basemap-20260819
  exit_code: 0
  verifier: config:executors.test.basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/basemap.test.ts
  output: |
    Test Files 1 passed · Tests 7 passed (7)

- eval: E8
  criterion: AC-13
  run_id: satellite-basemap-r2-text_free-20260819
  exit_code: 0
  verifier: config:executors.test.text_free
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/lib/export.test.ts src/lib/mapStyle.test.ts
  output: |
    Test Files 2 passed · Tests 20 passed (20)

- eval: E9
  criterion: AC-8
  run_id: satellite-basemap-r2-resolve_config-20260819
  exit_code: 0
  verifier: config:executors.test.resolve_config
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run mcp-server/src/resolveConfig.test.ts
  output: |
    Tests 71 passed (71)

- eval: E10
  criterion: AC-10
  run_id: satellite-basemap-r2-basemap_invariants-20260819
  exit_code: 0
  verifier: config:executors.script.basemap_invariants
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx tsx _acceptance/satellite-basemap/scripts/basemap-invariants.ts
  output: |
    basemap-invariants: mọi bất biến đứng

- eval: E13
  criterion: AC-9
  run_id: satellite-basemap-r2-web_basemap-20260819
  exit_code: 0
  verifier: config:executors.test.web_basemap
  verified_at: 2026-08-19T07:26:36Z
  cmd: npx vitest run src/components/MapView.test.tsx
  output: |
    Test Files 1 passed · Tests 2 passed (2)


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

