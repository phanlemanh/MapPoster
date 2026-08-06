---
schema_version: 2
feature_slug: map-motion-clip
verdict: PASS
failed_evals: []
reason:
verified_by: fresh-context verification subagent
enforcement_mode: strict
bypass_used: false
verified_commit: 0201cc3e792cd086de3335d3ae195d73bb5fadfb
human_signoff: manh 2026-08-06
---

# Evidence Report: map-motion-clip

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | script | PASS |
| E5 | AC-4 | test | PASS |
| E6 | AC-5 | test | PASS |
| E7 | AC-6 | test | PASS |
| E8 | AC-7 | test | PASS |
| E9 | AC-10 | test | PASS |
| E10 | AC-8 | test | PASS |
| E11 | AC-8 | test | PASS |
| E12 | AC-9 | test | PASS |
| E13 | AC-11 | test | PASS |
| E14 | AC-11 | test | PASS |
| E15 | AC-12 | test | PASS |
| E16 | AC-13 | judgment | PASS (panel proposal; awaits mandatory T3 human_override) |
| E17 | AC-14 | judgment | PASS (panel proposal; awaits mandatory T3 human_override) |

## Evidence

- eval: E1
  run_id: minted-map-motion-clip-E1-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T08:30:40Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  16 passed (16)
       Start at  08:30:40
       Duration  1.50s (transform 71ms, setup 0ms, import 217ms, tests 7ms, environment 1.03s)

- eval: E2
  run_id: minted-map-motion-clip-E2-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T08:30:40Z
  output: |
    Same suite run as E1/E3 (src/render/motionScript.test.ts covers all three
    criteria in one file). Tests 16 passed (16); Duration 1.50s.

- eval: E3
  run_id: minted-map-motion-clip-E3-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_invariants
  verified_at: 2026-08-06T08:30:40Z
  output: |
    Same suite run as E1/E2 (src/render/motionScript.test.ts covers all three
    criteria in one file). Tests 16 passed (16); Duration 1.50s.

- eval: E4
  run_id: map-motion-clip-sweep-local
  exit_code: 0
  baseline: green
  verifier: config:executors.script.compiler_domain_sweep
  verified_at: 2026-08-06T08:30:41Z
  output: |
    material errors (clear message, expected): 40
    violations: 0
    OK — no combination produced a self-rejected script or a motionless clip

- eval: E5
  run_id: minted-map-motion-clip-E5-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_compiler
  verified_at: 2026-08-06T08:30:41Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  31 passed (31)
       Start at  08:30:41
       Duration  1.39s (transform 164ms, setup 0ms, import 226ms, tests 19ms, environment 988ms)

- eval: E6
  run_id: minted-map-motion-clip-E6-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.motion_math
  verified_at: 2026-08-06T08:30:39Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  16 passed (16)
       Start at  08:30:39
       Duration  1.37s (transform 165ms, setup 0ms, import 249ms, tests 4ms, environment 955ms)

- eval: E7
  run_id: minted-map-motion-clip-E7-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-06T08:30:40Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
          Tests  7 passed (7)
       Start at  08:30:40
       Duration  63.76s (transform 72ms, setup 0ms, import 2.15s, tests 59.67s, environment 1.52s)

- eval: E8
  run_id: minted-map-motion-clip-E8-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T08:30:40Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
         Tests  49 passed (49)
      Start at  08:30:40
      Duration  3.07s (transform 381ms, setup 0ms, import 1.67s, tests 174ms, environment 927ms)

- eval: E9
  run_id: minted-map-motion-clip-E9-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T08:30:40Z
  output: |
    Same suite run as E8/E10/E13/E15 (mcp-server/src/http.test.ts covers all
    five criteria in one file). Tests 49 passed (49); Duration 3.07s.

- eval: E10
  run_id: minted-map-motion-clip-E10-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T08:30:40Z
  output: |
    Same suite run as E8/E9/E13/E15 (mcp-server/src/http.test.ts). Tests 49
    passed (49); Duration 3.07s.

- eval: E11
  run_id: minted-map-motion-clip-E11-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T08:30:40Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  1 passed (1)
          Tests  32 passed (32)
       Start at  08:30:40
       Duration  2.13s (transform 371ms, setup 0ms, import 537ms, tests 199ms, environment 1.06s)

- eval: E12
  run_id: minted-map-motion-clip-E12-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.text_free
  verified_at: 2026-08-06T08:30:40Z
  output: |
    RUN  v4.1.10 /Users/manh-macmini/dev/map
     Test Files  2 passed (2)
          Tests  18 passed (18)
       Start at  08:30:40
       Duration  1.37s (transform 140ms, setup 0ms, import 266ms, tests 10ms, environment 2.08s)

- eval: E13
  run_id: minted-map-motion-clip-E13-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T08:30:40Z
  output: |
    Same suite run as E8/E9/E10/E15 (mcp-server/src/http.test.ts). Tests 49
    passed (49); Duration 3.07s.

- eval: E14
  run_id: minted-map-motion-clip-E14-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_tools
  verified_at: 2026-08-06T08:30:40Z
  output: |
    Same suite run as E11 (mcp-server/src/tools.test.ts). Tests 32 passed
    (32); Duration 2.13s.

- eval: E15
  run_id: minted-map-motion-clip-E15-r2
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-06T08:30:40Z
  output: |
    Same suite run as E8/E9/E10/E13 (mcp-server/src/http.test.ts). Tests 49
    passed (49); Duration 3.07s.

- eval: E16
  criterion: AC-13
  executor: judgment
  judged_by: judge panel (fresh context) — 3 lenses
  proposal: PASS
  votes:
  - domain-correctness: PASS — Trích toàn bộ 24 khung từ E16-clip.mp4 (12fps/2s): khung 1-7 là một cú zoom liên tục từ khung rộng toàn thành phố (thấy được bối cảnh, chưa có ranh giới) xuống mức quận; khung 11 bắt được trạng thái ranh giới đang vẽ dở (hình nêm cắt cụt, khớp E16-step2.png) trước khi khung 12-15 mới khép kín hình dạng đầy đủ — tức có bước trung gian thật, không phải bật (0→100%) trong một khung; khung 16-24 (hơn 1/3 clip) đứng yên tuyệt đối với pin "settle". Ba nhịp mở-rộng → vẽ-dần → đứng-yên đọc ra rõ ràng, không phải một đoạn trôi vô hướng.
  - operational-feasibility: PASS — Phân rã 24 khung của E16-clip.mp4 (khớp 3 ảnh step) cho thấy đúng ba nhịp: khung 1 mở ở toàn cảnh thành phố chưa có ranh giới; ranh giới quận không hiện đột ngột mà mờ dần qua ~4 khung liên tiếp (khung 10 chưa có → khung 13 gần như đầy, opacity tăng tuyến tính quan sát được); từ khung ~13-14 đến khung 24 (gần một nửa clip) sai khác pixel giữa các khung liên tiếp gần như bằng 0, tức đuôi đứng yên hoàn toàn. Cả ba nhịp tách bạch rõ ràng, không đọc như một đoạn trôi vô hướng.
  - spec-alignment: PASS — Trích khung từ E16-clip.mp4 (24 khung, 12fps, 2s) cho thấy đủ ba nhịp: khung mở đầu (f01-f10) là toàn cảnh rộng thấy mạng lưới đường và sông của thành phố, chưa có tô ranh giới; từ f11 ranh giới quận bắt đầu xuất hiện và lan rộng dần qua nhiều khung liên tiếp (f12→f15→f18) chứ không bật lên đột ngột; đuôi clip (f21-f24, ~0.33s cuối) các khung giống hệt nhau từng byte (maxdiff=0), tức đứng yên hoàn toàn. Ba khung tĩnh E16-step1/2/3.png cũng khớp đúng trình tự này (toàn cảnh → nửa vẽ ranh giới dạng vệt mờ dần → hoàn chỉnh có marker).
  human_override: manh 2026-08-06

- eval: E17
  criterion: AC-14
  executor: judgment
  judged_by: judge panel (fresh context) — 3 lenses
  proposal: PASS
  votes:
  - domain-correctness: PASS — Ngoại lệ được ghi tường minh tại spec §2.3 kèm lý do chính đáng (nghĩa vụ giấy phép OSM/OpenFreeMap, nướng pixel để không phụ thuộc bên tiêu thụ tự vẽ lại), và contract AC-9/AC-14 nêu đúng yêu cầu khoá chặt. Test khoá (export.test.ts) dùng Proxy chặn TOÀN BỘ fillText/strokeText (không liệt kê thủ công), assert `textCalls` bằng đúng `[ATTRIBUTION_TEXT]` khi `text.show:false` — nghĩa là bất kỳ chữ nào khác kể cả drawPosterText lỡ gỡ guard trong tương lai đều làm test đỏ, nên đây là một ngoại lệ có kỷ luật chứ không phải lỗ hổng được hợp thức hoá.
  - operational-feasibility: PASS — Ngoại lệ được ghi tường minh tại spec §2.3 (mục "Ba hợp đồng cốt lõi", điểm 3), kèm lý do chính đáng và có ngày quyết định rõ ràng (chủ repo, 2026-08-04): nghĩa vụ giấy phép dữ liệu OSM/OpenFreeMap, độc lập với việc bên tiêu thụ có tự vẽ hay không. Khoá vận hành trong export.test.ts đủ chặt về mặt cơ chế: dùng Proxy bẫy MỌI lệnh fillText/strokeText (không phải allowlist tên hàm cụ thể) và assert bằng-hẳn `textCalls === [ATTRIBUTION_TEXT]` khi `chrome:'clean'`/`text.show:false` — đúng kịch bản rủi ro mà spec nêu (kể cả `drawPosterText` bị gỡ guard sau này) sẽ làm test đỏ ngay. Một khe hở nhỏ còn lại — test không pin nội dung literal của hằng `ATTRIBUTION_TEXT` nên về lý thuyết hằng số này có thể bị đổi nội dung ở mức source — không đủ để lật verdict vì đó là thay đổi code tường minh qua review, không phải đường lách runtime/operational.
  - spec-alignment: PASS — Spec §2 ("Ba hợp đồng cốt lõi" mục 3, dẫn chiếu §2.3 khớp cả trong spec lẫn contract AC-14) ghi tường minh ngoại lệ, nêu lý do chính đáng (nghĩa vụ giấy phép OSM/OpenFreeMap, độc lập với consumer). Implementation (export.ts) gọi drawAttribution() vô điều kiện với hằng số ATTRIBUTION_TEXT cố định (không nhận input ngoài), tách biệt khỏi khối `if (opts.text.show)` bao các fillText khác. Test khoá bằng Proxy bắt MỌI lệnh fillText/strokeText (không chỉ tên đã biết) và assert textCalls === [ATTRIBUTION_TEXT] khi chrome:'clean' — chặn được cả trường hợp guard tương lai bị gỡ. Ngoại lệ bị giới hạn ở một hằng số cứng, không mở thành cờ "cho phép chữ" chung, nên đây là một ngoại lệ có kiểm soát chứ không phải lỗ hổng.
  human_override: manh 2026-08-06

## Analyst

E1, E2, E3 (npx vitest run src/render/motionScript.test.ts); E4 (npx tsx
_acceptance/map-motion-clip/scripts/compiler-domain-sweep.ts); E5 (npx vitest
run mcp-server/src/motionCompiler.test.ts); E6 (npx vitest run
src/render/motionMath.test.ts); E7 (npm run test:mcp); E8, E9, E10, E13, E15
(npx vitest run mcp-server/src/http.test.ts); E11, E14 (npx vitest run
mcp-server/src/tools.test.ts); E12 (npx vitest run src/lib/export.test.ts
src/lib/mapStyle.test.ts) — all pass on baseline too (non-discriminating this
round; these are the same feature-path suites the contract has always relied
on, not new regressions, so treat as intended coverage rather than something
to rewrite).

## Variance

none — every eval in this round is deterministic (runs: 1); no
ctx.providers.invoke / LLM-generator crossing evals in this eval set.

## Iterations

Round 1 (2026-08-04): all 15 machine evals (E1-E15) passed on first run, exit
0. Judgment items E16/E17 human_override CHẤP NHẬN by manh (2026-08-04);
verdict reached PASS, verified_commit 06d37e264d3f191b67c4e1960ff64390ed428657.
Round 2 (this report): downstream commits (async-job-queue integration,
geocode/http/motionCompiler edits) landed after round 1's verified_commit,
making that evidence stale per pre-merge-check's staleness rule — re-verify
triggered. All 15 machine evals (E1-E15) re-run against the new tree, exit 0,
unchanged pass results; additionally the full suite (npm test: 397 passed, 7
skipped) and npm run test:e2e && npm run test:mcp (14 + 7 passed) also stayed
green. Fresh 3-lens judge panel proposes PASS on both E16/E17 with detailed
frame-by-frame rationale; verdict is PENDING-JUDGMENT pending Gate-2
human_override on this new round (T3 requires it regardless of judge verdict).

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
