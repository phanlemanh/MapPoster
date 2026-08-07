---
schema_version: 2
feature_slug: mcp-map-render
verdict: REJECT
failed_evals: [E1, E2, E5, E7]
reason: 
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: a46aec7a0c2ac7f2c54e6fd8d4ecc442b1814122
human_signoff:
---

# Evidence Report: mcp-map-render

## Vòng 26 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

Mọi lane của hợp đồng này chạy lại tươi ở `a46aec7` và **tất cả đều thoát 0**. Verdict
REJECT đến từ tiêu chuẩn mà vòng chấm áp cho cả chín hợp đồng vòng này: *một mệnh đề trong
`expected` chỉ được coi là thoả khi có một khẳng định thật sự khẳng định nó VÀ khẳng định đó
phân biệt được* — tức một hiện thực sai hợp lý sẽ làm nó đỏ. Các eval dưới đây không đạt
tiêu chuẩn đó. Đây là cùng lớp lỗi đã đánh trượt `anchors-camera` E2/E5 ở vòng trước; áp
không đều tay thì cổng mất nghĩa.

Bối cảnh stale: `a46aec7` chạm `mcp-server/src/http.test.ts`, `mcp-server/src/tools.test.ts`,
`src/render/anchors.ts`, `src/render/anchors.test.ts`, `e2e/render-mode.spec.ts` — không tệp
nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `9c1f9f3` đã hết hiệu lực và phải chạy lại.
`git merge-base --is-ancestor a46aec7 HEAD` trả 0.

### Các eval bị đánh trượt

**E2 (AC-2) — `expected` nêu tên một layer mà bộ test khẳng định KHÔNG tồn tại.**

`expected` (và cả `contract.md` AC-2) nói style dựng ra có layer **`highlight-outline`**.
`src/lib/mapStyle.ts` phát ra `highlight-dim`, `highlight-fill`, `highlight-soft-edge` — không
có `highlight-outline`. Và `src/lib/mapStyle.test.ts:156` khẳng định **ngược lại**:
`expect(layer(style, 'highlight-outline')).toBeUndefined()`. Tức `expected` nêu tên một thứ mà
sự VẮNG MẶT của nó là một bất biến được ghim. Đây không phải nói quá mờ nhạt — nó sai thẳng.

**E5 (AC-5) — "3 variant configs ⇒ mảng 3 kết quả PNG"; test dùng 2.**

`mcp-server/src/tools.test.ts:210-213`: `variants: [{theme:'ocean'}, {theme:'ruby'}]` — **hai**
variant — rồi `expect(textJson(res).count).toBe(2)` và `imageBlocks(res)).toHaveLength(2)`.
Con số 3 trong `expected` không có ở đâu cả.

**E1 (AC-1) — "PNG 1080×1920" dựa trên một fixture không thể mâu thuẫn, và "±0,05°" không tồn tại.**

Khẳng định duy nhất chạy dưới `npm test` là `tools.test.ts:98-100` (`image.width` 1080,
`image.height` 1920). Hai con số đó đến từ `fakePng(cfg.size.width, cfg.size.height)`
(`tools.test.ts:39-44`) — một buffer 30 byte ghi thẳng chiều rộng/cao **lấy từ chính request**.
Nó không thể bất đồng với thứ được yêu cầu, nên mệnh đề không phân biệt được gì. Ca kiểm kích
thước PNG thật là `renderFrame.test.ts:50-56`, nằm sau `describe.skip` khi thiếu
`MCP_INTEGRATION=1` — **không chạy** dưới `npm test`. Ngoài ra "center within ~0.05° of geocoded
lng/lat": không có khẳng định dung sai nào ở đâu; `tools.test.ts:101` so **bằng đúng** với hằng
`[106.7, 10.78]` của geocoder giả. Chi tiết nhỏ: `expected` viết `'Ho Chi Minh City'`, test
truyền `'HCMC'`.

**E7 (AC-7) — "PNG decodes" không được khẳng định.**

Ghi nhận từ lane kiểm phụ: `delivery.test.ts:24-32` kiểm path + base64 + kích thước + tệp tồn
tại, nhưng không có phép giải mã PNG nào, và đầu vào là `fakePng()` — 30 byte, không phải một
PNG giải mã được.

### Eval judgment giữ nguyên PENDING

E12 là `judgment` của một hợp đồng T3: không được vòng máy này phán, `human_override` để trống,
`evidence/E12-example.png` còn đó. Verdict tổng là REJECT vì các eval MÁY ở trên.

### Một ghi chú về E10

Khẳng định trong `e2e/render-mode.spec.ts:93-113` là thật và phân biệt được. Nhưng phần
`steps`/`screenshot` của E10 KHÔNG do `npm run test:e2e` sinh ra — nó đến từ
`_acceptance/mcp-map-render/scripts/e10-ui-check.ts`, một script mà chính đầu tệp tự nhận là
"not wired into config.yaml as an executor". Và `evidence/E10-step1.png` với `E10-step2.png`
trùng byte (cùng md5), tức "bước 1 = nạp config, bước 2 = sau render" thực chất là hai bản sao
của một khung. Không đủ để đánh trượt E10 (khẳng định máy của nó đứng vững), nhưng người ký
nên biết ảnh không nói thêm gì.

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
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  verdict: FAIL
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E2
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  verdict: FAIL
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E3
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E4
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E5
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  verdict: FAIL
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E6
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E7
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  verdict: FAIL
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E8
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E9
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
  output: |
    Chạy lại TƯƠI ở `9c1f9f3` (`feat/anchors-camera` chạm tools.ts / http.ts / jobRunner.ts / renderFrame.ts / main.tsx — bằng chứng cũ hết hiệu lực theo commit). Test Files 33 passed | 2 skipped (35); Tests 527 passed | 9 skipped (536) — không hồi quy; số ca tăng vì gói anchors-camera thêm test của chính nó vào cùng tệp.
- eval: E10
  run_id: mcp-map-render-r26-e2e-20260807
  exit_code: 0
  verifier: config:executors.test.e2e
  verified_at: 2026-08-07T05:59:16Z
  screenshot: evidence/E10-step1.png
  observed: |
    Chạy lại tươi vòng 25 ở `9c1f9f3`: `npm run test:e2e` — 18 xanh (1.0m), gồm e2e/render-mode.spec.ts:93 (AC-10). Số ca tăng 14 → 18 vì gói anchors-camera thêm bốn ca `anchors:` vào chính tệp spec này; ca AC-10 của hợp đồng này không đổi và vẫn xanh. Khung được MỞ LẠI bằng multimodal Read trong vòng này, không chép mô tả cũ:
    E10-step1.png: khung dọc 1080x1920 một màu navy đặc, chỉ có dòng ghi công nhỏ "© OpenStreetMap contributors · OpenMapTiles · OpenFreeMap · MapLibre" ở góc trên-phải và góc dưới-phải; tuyệt đối không có modal onboarding, nút, hay lớp phủ giao diện nào — khớp 'no onboarding modal visible'.
    E10-step3.png: bản đồ TP.HCM tông midnight-blue, mạng đường vàng-hổ-phách dày đặc, sông Sài Gòn uốn khúc chạy từ trên xuống phải, đường băng sân bay Tân Sơn Nhất rõ ở góc trên-trái, mặt nước xanh đậm phân biệt được với nền; không có chữ tiêu đề (chrome:'clean'), không ô tile trống, không mảng vỡ hay răng cưa ở biên — khớp 'renderFrame() PNG đúng 1080x1920' và trình tự nạp-config → render → đúng kích thước.
  network_observed: n-a (tool-error: frames read from committed evidence/, not re-captured live this round)

- eval: E11
  run_id: mcp-map-render-r26-api-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.api
  verified_at: 2026-08-07T05:57:55Z
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

Vòng 26 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 11 eval máy chạy lại tươi, 11/11 thoát 0 (`npm test` 527/9/536, `npm run test:e2e` 18/18). E12 (judgment, T3) giữ PENDING-JUDGMENT, `human_override` để trống. **REJECT trên [E1, E2, E5, E7]**. Nặng nhất là E2: `expected` — và cả `contract.md` AC-2 — nêu tên layer `highlight-outline`, mà `mapStyle.ts` không hề phát ra layer đó và `mapStyle.test.ts:156` khẳng định nó `toBeUndefined()`; eval nêu tên một thứ mà sự VẮNG MẶT của nó là bất biến được ghim. E5 nói 3 variant, test dùng 2 (`count).toBe(2)`). E1 dựa "PNG 1080×1920" vào `fakePng(cfg.size.width, cfg.size.height)` — một fixture ghi lại chính kích thước được yêu cầu nên không thể mâu thuẫn — và mệnh đề "center within ~0,05°" không có khẳng định dung sai nào; ca kiểm kích thước PNG thật nằm sau `describe.skip`. E7 khai "PNG decodes" mà không có phép giải mã nào. Ghi nhận thêm: AC-6 ("cả hai transport phơi CÙNG một tập tool") không được phân biệt — `transports.test.ts` chỉ `toContain` 5 tên trên mỗi transport, không bao giờ so hai tập với nhau; và ảnh bằng chứng `E10-step1.png`/`E10-step2.png` trùng byte.

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
