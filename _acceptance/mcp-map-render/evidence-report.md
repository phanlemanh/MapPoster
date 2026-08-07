---
schema_version: 2
feature_slug: mcp-map-render
verdict: PENDING-JUDGMENT
failed_evals: []
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 9c1f9f367c642465cc720396f9b6aba51f31902f
human_signoff:
---

# Evidence Report: mcp-map-render

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 25 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Trong bán kính: E1-E9 và E11 (bộ tổng `npm test`, hút cả `tools.test.ts`/`http.test.ts`/`jobRunner.test.ts` đã đổi), E10 (`npm run test:e2e` — `e2e/render-mode.spec.ts` đổi, thêm bốn ca anchors). **T3: eval judgment E12 quay về chờ người** — verdict hạ xuống PENDING-JUDGMENT và `human_override` bỏ trống theo cùng lý do như `map-motion-clip`._

_Round 24 — re-pin only, triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`, scoped entirely to `mcp-server/src/http.test.ts`: mcp-auth's own E6 fix, rebinding its 'bind outside loopback with a token' test from `'127.0.0.1'` — itself loopback, so the assertion never reached the code path it claimed to cover — to a genuine non-loopback host `'0.0.0.0'`). `git diff e5ce7199..ce0b13e6 --stat` touches only that one test file; no source file changed. Re-ran this contract's broad guards and any eval whose command executes `http.test.ts` (E1, E2, E3, E4, E5, E6, E7, E8, E9, E11); all matched the prior round exactly. Every other eval was NOT re-run — its own source/test files are untouched by this commit — and is re-pinned as-is. `verified_commit` updated to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`; `human_signoff` stays empty._

_Round 23 — re-verification triggered by `fix/mcp-auth` landing on top of Round 22's `verified_commit` (`27e1be1a`). `git diff 27e1be1a..HEAD --stat` touches only `mcp-server/src/http.ts`, `mcp-server/src/http.test.ts`, `README.md`, and files under `_acceptance/**` — none of which are this contract's own primary source files. Contract `status` downgraded `signed-off` → `implemented` per the shared-file staleness guard; `human_signoff` cleared._

_Diff review: `http.ts`'s change is a pure extraction — the three copied `if (token && authorization !== ...)` bearer checks on `/render`, `/render-clip`, `/jobs` are replaced with calls to one shared `rejectedByBearer()` helper implementing byte-identical logic, and a NEW guard call is added on the previously-unguarded `/mcp` fall-through plus a NEW startup-time fail-closed check for non-loopback binds without a token. This contract's own eval commands were re-run fresh against the new commit rather than merely re-pinned, since the shared file is in scope of at least one of them; every run matched the prior round's pass counts exactly — no regression from the refactor._

_(Ghi chú của vòng TRƯỚC, giữ lại làm lịch sử) Judgment block(s) carried forward BYTE-FOR-BYTE from the prior round — not blanked, not re-scored. `risk_tier: T3` mandates a direct human verdict on every judgment item for THIS round's pinned evidence regardless of a prior round's override against a now-superseded commit, so the contract routes to **PENDING-JUDGMENT**._

_**Đính chính cho vòng này:** khác vòng trước, vòng hiện tại KHÔNG giữ `human_override` cũ. Chữ ký người ở các mục judgment được đóng ở `9a6af0f`; PR này đổi mã nguồn dùng chung nên chúng bị BỎ TRỐNG để người ký ở Cổng 2 phán quyết lại trên đúng cây `9c1f9f3`. Nội dung phán quyết của giám khảo mù (`verdict` + `rationale`) được giữ nguyên văn — chỉ dòng `human_override` bị xoá._

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | test | PASS |
| E8 | AC-8 | test | PASS |
| E9 | AC-9 | test | PASS |
| E10 | AC-10 | ui-check | PASS |
| E11 | AC-11 | test | PASS |
| E12 | AC-12 | judgment | PASS (judge) — awaiting mandatory T3 human_override for this round’s pinned evidence |

## Evidence

- eval: E1
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E2
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E3
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E4
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E5
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E6
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E7
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E8
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E9
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E10
  run_id: mcp-map-render-r25-e2e-20260807
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T04:51:09Z
  screenshot: evidence/E10-step1.png
  observed: |
    Chạy lại tươi vòng 25 ở `9c1f9f3`: `npm run test:e2e` — 18 xanh (1.0m), gồm e2e/render-mode.spec.ts:93 (AC-10). Số ca tăng 14 → 18 vì gói anchors-camera thêm bốn ca `anchors:` vào chính tệp spec này; ca AC-10 của hợp đồng này không đổi và vẫn xanh. Khung được MỞ LẠI bằng multimodal Read trong vòng này, không chép mô tả cũ:
    E10-step1.png: khung dọc 1080x1920 một màu navy đặc, chỉ có dòng ghi công nhỏ "© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre" ở góc trên-phải và góc dưới-phải; tuyệt đối không có modal onboarding, nút, hay lớp phủ giao diện nào — khớp 'no onboarding modal visible'.
    E10-step3.png: bản đồ TP.HCM tông midnight-blue, mạng đường vàng-hổ-phách dày đặc, sông Sài Gòn uốn khúc chạy từ trên xuống phải, đường băng sân bay Tân Sơn Nhất rõ ở góc trên-trái, mặt nước xanh đậm phân biệt được với nền; không có chữ tiêu đề (chrome:'clean'), không ô tile trống, không mảng vỡ hay răng cưa ở biên — khớp 'renderFrame() PNG đúng 1080x1920' và trình tự nạp-config → render → đúng kích thước.
  network_observed: n-a (tool-error: frames read from committed evidence/, not re-captured live this round)

- eval: E11
  run_id: mcp-map-render-r25-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T04:48:51Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E12
  judged_by: judge-subagent (fresh context, blind)
  verdict: PASS
  rationale: |
    Ảnh 1080×1920 đúng khung tiktok, nền navy với đường phố vàng cam đặc trưng midnight-blue; lưới đường và khối nhà liền mạch, không ô tile trống/vỡ hay răng cưa. Ghim trắng nằm gần chính giữa khung (≈540/1080 ngang, 910/1920 dọc — lệch nhẹ ~50px) và tương phản rõ trên nền tối. Đủ cả ba yêu cầu của AC-12: căn giữa, highlight rõ, tile/đường không vỡ.
  human_override:
## Analyst

Baseline values are carried forward unchanged from the prior round per the re-verification instruction (`fix/mcp-auth` is additive/refactor-only to a shared file and does not recompute this contract's own pre-feature diffBase). Non-discriminating (green on both) per the carried-forward baseline: E1, E2, E3, E4, E5, E6, E7, E8, E9, E11.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 25 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `tools.ts`/`http.ts`/`jobRunner.ts`/`renderFrame.ts`/`main.tsx`. Cả 11 eval máy chạy lại tươi — 11/11 xanh; `npm test` 527 xanh | 9 bỏ qua, `npm run test:e2e` 18 xanh (14 → 18 vì gói anchors thêm bốn ca). E12 (judgment, T3) trở lại chờ người: verdict PENDING-JUDGMENT, `human_override` bỏ trống. `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 24 (re-pin): triggered by test-only commit `ce0b13e` (mcp-auth's own E6 fix). Re-ran E1, E2, E3, E4, E5, E6, E7, E8, E9, E11 fresh — all green, unchanged. `verified_commit` re-pinned to `ce0b13e6`. All other evals re-pinned without re-running (their own files untouched).

Round 23: all machine evals re-run fresh against `fix/mcp-auth`'s HEAD (e5ce7199); zero failures, no regressions from the http.ts bearer-check refactor.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
