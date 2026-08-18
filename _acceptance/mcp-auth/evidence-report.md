---
schema_version: 2
feature_slug: mcp-auth
verdict: PASS
failed_evals: []
reason: "Vòng 8 ghim lại ở baf27d3: 10/10 eval máy chạy tươi, 0 đỏ."
verified_by: Claude Opus 5 (phiên 2026-08-13) — vòng verify tại chỗ, không phải subagent ngữ-cảnh-mới
enforcement_mode: strict
bypass_used: false
verified_commit: f557763d0abed97665ef09b902ccb2e320cbfbb2
human_signoff: manh — 2026-08-14 (commit tay của người duyệt, chỉ chạm dòng human_signoff)
---

# Evidence Report: mcp-auth

## Vòng ghim lại ở `f557763` — thêm `scripts/check-deploy-drift.sh`

Kích hoạt: PR #45 thêm **một** tệp, `scripts/check-deploy-drift.sh`. Nó KHÔNG thuộc `t1_skip_globs` — danh sách đó chỉ miễn hai đường dẫn CHÍNH XÁC của bộ gate vendored, không phải `scripts/**` — nên mọi hồ sơ ghim ở `baf27d3` hết hiệu lực theo commit. **Không nới danh sách miễn trừ để lách**: sửa cái thước cho lọt thay đổi của chính mình là đúng thứ cổng này sinh ra để chặn. Chạy lại verify thay vì đổi luật.

Cả 188 eval máy của 12 gói chạy lại tươi ở commit này, **188/188 thoát 0**.

`verified_commit` = `f557763d0abed97665ef09b902ccb2e320cbfbb2`. `human_signoff` XOÁ — chữ ký cũ thuộc về `baf27d3`, không cưỡi sang cây mã mới.

## Vòng 8 — ghim lại ở `baf27d3`; 10/10 eval máy chạy tươi, 0 đỏ

Bằng chứng cả 9 gói đang ghim ở `ace12a0` (07.08) — **50 commit** trước HEAD, với **23 tệp không-miễn-trừ** đã đổi, gồm CẢ HAI `t3_paths`. Ký lên bằng chứng đó chỉ đổi tên vi phạm từ *human_signoff rỗng* sang *evidence stale*, không mở được gì. Vòng này ghim lại ở HEAD.

Toàn bộ 194 eval của 12 gói chạy trong MỘT vòng: 34 lệnh duy nhất sau khử trùng lặp, chạy tươi, **188/188 eval máy thoát 0** trong 180 giây. Riêng gói này: 10/10.

`verified_commit` = `baf27d3b94673ba706de51fdd9e45776224f0bc2`. `human_signoff` để **RỖNG** — Cổng 2 chờ người ký, và `signoff.require_human_commit: true` nghĩa là chữ ký phải nằm trong commit do chính người duyệt tạo, ở một commit chỉ chạm dòng người-sở-hữu.

## Vòng 7 — ghim lại vì tệp dùng chung; cả mười chạy lại tươi

Ghim ở `ace12a0`. Kích hoạt: bảy commit vá của vòng 6 (`1797425`..`ace12a0`) chạm
`mcp-server/src/tools.test.ts`, `renderFrame.test.ts`, `jobRunner.test.ts`, `jobStore.test.ts`,
`http.test.ts`, `route.test.ts`, `src/lib/export.test.ts` và `src/render/motionScript.ts` — không tệp nào
thuộc `t1_skip_globs`, nên bằng chứng ghim ở `d84857a` hết hiệu lực theo commit. Vòng này KHÔNG re-pin
suông: cả 10 eval chạy lại tươi, **10/10 thoát 0**: `http.test.ts` 62 · `npm test` 547 đạt / 10 bỏ qua /
0 đỏ · `test:mcp` 15 · `auth-invariants` mọi bất biến còn giữ.

`http.test.ts` đi 61 → **62** ca và `test:mcp` 13 → **15**: thuần cộng thêm từ hợp đồng anh em
(`anchors-camera` thêm ca XOR REST; `mcp-map-render` thêm hai ca trang-giả vào `renderFrame.test.ts`).
Không ca nào của hợp đồng này bị xoá hay đổi — `auth-invariants` vẫn đếm đúng MỘT chỗ so bearer, đủ
4 cửa gọi guard, và cả hai vế README↔`http.ts` của I5 vẫn bằng nhau.

Ghi nhận giữ nguyên, KHÔNG đánh trượt: E10 gắn `criterion: AC-3` mà không chứng minh gì về AC-3 — đó là
khiếm khuyết ÁNH XẠ tiêu chí, đã ghi từ vòng 4 và vẫn là nợ cho một đợt siết hợp đồng sau.

`verified_commit` cập nhật lên `ace12a0` (`git merge-base --is-ancestor ace12a0 HEAD` trả 0 — ở đây nó CHÍNH LÀ HEAD). `human_signoff` để RỖNG — Cổng 2 chờ người ký.


## Vòng 6 — E8 đã được vá thật; soi lại cả mười, không cái nào nói quá

Ghim ở `d84857a` (tổ tiên của HEAD). Cả 10 eval chạy lại tươi, **10/10 thoát 0**: `http.test.ts` 61 ·
`npm test` 542 đạt / 10 bỏ qua / 0 đỏ · `test:mcp` 13 · `auth-invariants` mọi bất biến còn giữ.

**E8 — lỗ vòng 4 đã bịt.** Vòng 4 đánh trượt vì `expected` gắn giá trị của script vào việc nó giữ
câu README đúng, trong khi `auth-invariants.ts` chỉ đọc `mcp-server/src/http.ts`. `d59c2bd` thêm I5:
`auth-invariants.ts:62` gọi `read('README.md')` thật, cắt mục `### REST endpoints` (`:63-65`), làm
phẳng xuống dòng (`:69`), rồi đối chiếu HAI vế — `readmeSaysMcpGuarded === codeGuardsMcp` (`:71-77`)
và `readmeSaysFailClosed === failClosed` (`:79-86`), với `codeGuardsMcp = guards >= 4 && beforeMcp`
lấy từ chính `http.ts`. Cả hai nhánh đột biến mà `expected` nêu đều làm script đỏ: (1) trả README về
câu cũ "bearer chỉ áp cho REST" ⇒ vế `:71` lệch; (2) gỡ `if (rejectedByBearer(req, res)) return;` ở
nhánh fall-through `http.ts:542` ⇒ `guards` tụt còn 3, làm ĐỎ cả I3 lẫn hai vế I5. Không có phép kiểm
no-op: ngay cả `restSection.length > 0` (`:66`) cũng đỏ được nếu mục README bị xoá.

**Chín eval còn lại soi lại tận nguồn, tất cả trung thực.** E1-E6 mỗi cái trỏ đúng một khẳng định
phân biệt được ở `http.test.ts:229/236/247/259/265-267/274-276`; đáng chú ý E6 nay bind
`'0.0.0.0'` THẬT (không phải `'127.0.0.1'` — chính lỗi vòng 1 của hợp đồng này), và E4 đúng vì host
mặc định `'127.0.0.1'` (`http.ts:187`) nằm trong `LOOPBACK_HOSTS` (`:119`). E7 nói ">= 4 cửa gọi
guard", đúng bằng `guards >= 4` của script (chạy thật: `compares=1`, `guards=4`, `beforeMcp=true`).
E9 là hàng rào hồi quy toàn bộ `vitest run`. E10 vẫn là hàng rào hồi quy trên bộ tích hợp có gác —
`expected` của nó nói về việc BỘ TEST bị gác sau `MCP_INTEGRATION=1`, không nói nó kiểm bearer, nên
không nói quá; nhưng như vòng 4 đã ghi, nó gắn `criterion: AC-3` mà không chứng minh gì về AC-3. Đó
là một khiếm khuyết ÁNH XẠ tiêu chí, không phải một lời nói quá, và được giữ nguyên ghi nhận chứ
không đánh trượt.

`verified_commit` cập nhật lên `d84857a`. `human_signoff` để RỖNG — Cổng 2 chờ người ký.

## Vòng 5 — merge main rồi chạy lại; verdict giữ nguyên

Kích hoạt: `b4c1d50c` merge `origin/main` (`a776daf`, PR #24 — xoá hàm chết `centroidOf` và bật `noUnusedLocals`) vào nhánh. Main chạm `mcp-server/src/geometry.ts`, `mcp-server/src/resolveConfig.ts`, `mcp-server/src/geometry.test.ts`, `mcp-server/tsconfig.json` — không tệp nào thuộc `t1_skip_globs`, nên bằng chứng ghim ở `a46aec7` hết hiệu lực.

Merge TRƯỚC rồi verify MỘT lần, chứ không verify ở `a46aec7` rồi mới merge: cách sau làm bằng chứng hết hạn ngay lúc merge, phí trọn một vòng.

Toàn bộ lane chạy lại tươi trên cây đã hợp nhất, **tất cả thoát 0**: `tsc -b` 0 · `tsc -p mcp-server` 0 (đã bật `noUnusedLocals`) · vitest 525 pass / 9 skip / 0 fail · playwright 18 pass · `test:mcp` 12 pass · cả tám script bất biến còn giữ (anchors, tier0, routes, motion-tools, routing, auth, compiler-sweep, routes-demo).

`noUnusedLocals` mà main mang sang không sinh nợ mới cho nhánh này — đã đo trước khi merge trên chính `a46aec7`: lỗi duy nhất nó nổ là đúng cái import `centroidOf` mà main vừa xoá, nên sau merge là hết.

**Verdict GIỮ NGUYÊN REJECT — [E8].** Vòng này KHÔNG sửa eval (phạm vi đã chốt trước khi chạy). REJECT của vòng trước không đến từ lệnh đỏ mà từ `expected` nói quá: khẳng định không phân biệt được, tức một hiện thực sai hợp lý vẫn để nó xanh. Chạy lại lệnh không đụng được vào lỗi đó, nên nó còn nguyên — muốn xanh phải viết lại chính các eval bị nêu. `human_signoff` vẫn rỗng: verdict REJECT không ký được.

`verified_commit` cập nhật lên `b4c1d50c`.

## Vòng 4 — REJECT vì `expected` nói quá, KHÔNG vì lệnh đỏ

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

**E8 (AC-8) — mệnh đề nhân quả về README không có gì canh gác.**

`expected` viết: *"chạy cùng script — bất biến I2/I3 là thứ **giữ cho câu README** ('bearer
áp cho cả `/mcp`') tiếp tục đúng thay vì trôi lại thành sai như trước"*. AC-8 thì nói thẳng
hơn: *"Given README, When đọc phần REST, Then nó mô tả đúng thực tế"*.

`_acceptance/mcp-auth/scripts/auth-invariants.ts` chỉ đọc **một** tệp — `mcp-server/src/http.ts`
(`:34`, qua `read()` ở `:18`). Không có một lời gọi nào đọc `README.md`; quét cả script cho
chuỗi `README` không ra kết quả. Hệ quả cụ thể: sửa README trở lại câu SAI cũ ("bearer chỉ áp
cho REST") thì E8 vẫn thoát 0 và AC-8 vẫn được ghi là đạt. **AC-8 hiện có 0 khẳng định chống
lưng.** Bản thân README hôm nay đúng (`README.md:413-420`, `:541`) — nhưng đó là may, không
phải là được gác.

Cách sửa: hoặc thêm một bất biến I5 đọc `README.md` và đối chiếu câu đó với `http.ts`, hoặc
hạ AC-8 xuống thành mục tài liệu không có eval và nói rõ nó không được canh gác.

### Ngoài ra: HAI sai số trong chính bản ghi bằng chứng của vòng trước (đã sửa ở vòng này)

1. Khối `- eval: E9` ghi `run_id: mcp-auth-r3-api-20260807` với `verified_at` 04:48:51Z (vòng 3,
   ghim `9c1f9f3`) nhưng phần `output` lại chép *"Re-run at `ce0b13e` … Tests **498** passed | 7
   skipped (505)"* — số của một vòng KHÁC. `npm test` ở `9c1f9f3` cho `527 passed | 9 skipped
   (536)`, và khối E15 của `road-routing` — CÙNG một lần gọi `npm test`, cùng dấu thời gian
   04:48:51Z trong `run-log.jsonl` — ghi đúng 527/9/536. Tức phần `output` của E9 mô tả một lần
   chạy không phải lần chạy mà `run_id` của nó trỏ tới. Vòng này viết lại theo số đo thật.
2. Dòng tường thuật của Vòng 3 viết *"`http.test.ts` 54 → **61** ca"*. Số thật là **57**
   (`Tests 57 passed (57)`, khớp với chính khối E1 của báo cáo này). Vòng này ghi đúng.

Hai lỗi trên không làm lệch verdict, nhưng chúng là đúng thứ `recheck-evidence.js` không bắt
được (nó kiểm hình dạng và xuất xứ `run_id`, không đọc văn xuôi) — nên phải ghi ra.

_**Ghi chú ghim commit:** trong lúc vòng này đang chạy, `8a15342` (docs: cảnh báo `resolved.camera` KHÁC `resolved.center`/`zoom`) đã lên nhánh, chỉ sửa `README.md`. `git diff --name-only 9c1f9f3..HEAD` = đúng một tệp đó, và `**/*.md` nằm trong `risk_tiers.t1_skip_globs`, nên bằng chứng KHÔNG stale; `9c1f9f3` vẫn là tổ tiên của HEAD (`git merge-base --is-ancestor` trả 0) và `pre-merge-check.sh` không báo stale. `verified_commit` giữ nguyên ở `9c1f9f3` — đúng cây mà mọi lệnh đã chạy trên đó._

_Vòng 3 (chạy lại vì stale) — kích hoạt bởi PR `feat/anchors-camera` @ `9c1f9f3`, gói này chạm `mcp-server/src/tools.ts`, `mcp-server/src/http.ts`, `mcp-server/src/jobRunner.ts`, `mcp-server/src/renderFrame.ts` và `src/render/main.tsx` — tệp DÙNG CHUNG, nên bằng chứng của hợp đồng này hết hiệu lực theo commit. Vòng này KHÔNG re-pin suông: **mọi eval máy đều được chạy lại tươi** ở `9c1f9f3` (không eval nào mang kết quả cũ sang), `run_id` mới toàn bộ và có dòng tương ứng trong `run-log.jsonl`. `verified_commit` ghim lại về `9c1f9f367c642465cc720396f9b6aba51f31902f`; `human_signoff` bị XOÁ vì chữ ký cũ thuộc về `9a6af0f`, không được cưỡi sang cây mã mới. Bán kính ảnh hưởng ở đây là lớn nhất trong tám hợp đồng: cả 10 eval đều chạm mã đổi — E1-E6 chạy trên `http.test.ts`/`http.ts`, E7-E8 soi tĩnh chính `http.ts`, E9 là bộ tổng, E10 chạy `renderFrame.test.ts`/`renderClip.test.ts` (cả hai đổi). `auth-invariants.ts` vẫn xanh nguyên: gói anchors thêm nhánh `anchorsUnavailable` vào lối ra `/render-clip` nhưng không thêm chỗ so bearer nào, nên I2 vẫn đếm đúng MỘT chỗ so và I3 vẫn thấy đủ 4 cửa được gác._
_Round 3 — nghiệm thu lại do `535ee8e8` (nhánh `chore/remove-dead-centroidof`) chạm hai file dùng chung `mcp-server/src/geometry.ts` và `mcp-server/src/resolveConfig.ts`. Nội dung commit: XOÁ hàm chết `centroidOf` khỏi geometry.ts (−22 dòng), xoá khối test riêng của nó khỏi geometry.test.ts (−13), gỡ tên `centroidOf` khỏi câu import ở resolveConfig.ts:7, và bật `noUnusedLocals` trong mcp-server/tsconfig.json (+6)._

_Soi diff: KHÔNG một đường chạy runtime nào đổi. `centroidOf` không có người gọi nào ngoài chính test của nó — trước khi xoá, `grep -rn "centroidOf"` toàn repo chỉ ra đúng ba loại chỗ: định nghĩa, khối test, và một cái tên nằm trong danh sách import ở resolveConfig.ts mà thân file không bao giờ tham chiếu tới. resolveConfig.ts:474 vẫn tính tâm vùng inline từ bbox y nguyên, không đổi một ký tự — hàm bị xoá KHÔNG được nối vào đó, vì `bboxOfGeojsons` duyệt mọi feature của collection còn `centroidOf` chỉ nhận một geometry, nối vào sẽ bỏ sót feature với vùng nhiều mảnh. `noUnusedLocals` là cờ thời-biên-dịch, không sinh mã. Vì vậy mọi AC của hợp đồng này đứng nguyên trên cùng một hành vi._

_Không eval nào của hợp đồng này trỏ thẳng vào `geometry.ts` hay `resolveConfig.ts`; nó hết hạn theo chốt file-dùng-chung. `auth_invariants` vẫn giữ đủ: 4 cửa gọi guard, guard đứng ngay trước createServer nhánh /mcp, chốt khởi động so sánh host với LOOPBACK_HOSTS._

_Đã chạy lại toàn bộ tập executor của hợp đồng này chứ không ghim suông. Thay đổi số đếm test duy nhất trong cả repo: `mcp-server/src/geometry.test.ts` còn 10 test thay vì 12 — đúng hai case của `centroidOf` vừa xoá, không case nào khác. Bộ đầy đủ: tsc -b exit 0, tsc -p mcp-server exit 0 (đã bật noUnusedLocals), vitest 496 pass / 7 skip / 0 fail, playwright 14 pass, test:mcp 7 pass, cả bảy script bất biến đều giữ._

_`verified_commit` cập nhật lên `535ee8e8`; `human_signoff` xoá trắng và `status` hạ `signed-off` → `implemented` theo chốt file-dùng-chung — chữ ký người thuộc Cổng 2 và phải nằm ở commit riêng._

_Round 2 — focused re-verification triggered by `ce0b13e` (test-only commit on `fix/mcp-auth`,
scoped entirely to `mcp-server/src/http.test.ts`), fixing exactly the gap Round 1 flagged: E6's
"bind outside loopback WITH token → starts fine" case rebound its `startHttpServer` call from
`'127.0.0.1'` (loopback — the bug) to `'0.0.0.0'` (genuinely non-loopback). All 10 evals were
re-run fresh at the new commit; `verified_commit` re-pinned to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`._

**E6/AC-6 re-check, same per-clause standard as Round 1:** the clause is now proven. Tracing the
guard condition directly — `!LOOPBACK_HOSTS.includes(host) && !process.env.MAPPOSTER_TOKEN`
(`http.ts:202`) — with `host = '0.0.0.0'` (not in `LOOPBACK_HOSTS`) and `MAPPOSTER_TOKEN` set, the
first operand is `true` and the second is `false`, so the whole expression is `false` and the guard
does not fire; `startHttpServer` proceeds to listen and `expect(srv.url).toContain('/mcp')` is a
real assertion on a real started server bound to a real non-loopback address. Re-ran
`http.test.ts` fresh: 54/54 pass, including this case.

I additionally reproduced the commit author's negative control independently, in a disposable
`git worktree add --detach <tmp> ce0b13e` (no changes to this repo's working tree) with the boot
guard hand-edited to `if (!LOOPBACK_HOSTS.includes(host))` — i.e. dropping the token check so it
refuses *every* non-loopback host regardless of token. Running just this test
(`npx vitest run mcp-server/src/http.test.ts -t "cho phép bind ngoài loopback KHI đã có token"`)
against that mutant: **1 failed** — `Error: Refusing to start: MAPPOSTER_HTTP_HOST=0.0.0.0 binds
outside loopback but MAPPOSTER_TOKEN is unset` thrown from `http.ts:203`, exactly where a
too-strict guard would break a legitimate token-configured deployment. That property — catching
over-restriction, not just under-restriction — is what Round 1 found missing, and it now holds.

Grepping `startHttpServer(` call sites in `http.test.ts` again post-fix (still 27 sites): E6 is now
the only site that pairs a genuinely non-loopback host with a token set, so it is also now the
*only* test exercising that specific combination — no other eval accidentally duplicates or
conflicts with it.

**Re-scrutinized the rest of mcp-auth's evals with the same standard** (per-clause, not "suite is
green"):
- E1/E2 (`http.test.ts:220-232`): both `expect(...).toBe(401)` calls are direct, unconditional
  assertions on the real response object from a real request to `srv.url` — no gap.
- E3/E4/E5 (`http.test.ts:235-264`): each is a single direct assertion (`toBe(200)` /
  `toBe(200)` / `.rejects.toThrow(/MAPPOSTER_TOKEN/)`) on a real call — no gap.
- E7/E8 (`auth-invariants.ts` I1-I4): static/structural checks by design (AC-7 says "soi bất
  biến" — inspect invariants), not behavioural ones; they do what their own `expected` text
  claims and nothing more. No over-claim found.
- E9 (`npm test`, full suite): genuinely re-includes `http.test.ts` plus every other route's own
  tests; re-run fresh this round, unaffected by the E6 test-only edit except for absorbing it. No
  gap.
- E10 (`npm run test:mcp` — `renderFrame.test.ts`, `renderClip.test.ts`, `stdioChannel.test.ts`):
  re-confirmed these three files contain **zero** references to `bearer`/`Authorization`/
  `MAPPOSTER_TOKEN`/`startHttpServer` (grepped again this round) — they exercise the **stdio**
  transport (`mcp-server/src/stdio.ts`), a separate, unauthenticated-by-design local-pipe
  transport, not the guarded `/mcp` HTTP endpoint. Round 1 already flagged this eval as
  corroborating (real build, real headless-Chromium render pipeline) rather than a direct AC-3
  test; that characterization stands and is not softened this round. Its `expected` text's "MCP
  integration có gác" reads, in context of the same boilerplate phrase being reused verbatim
  across every other T2 contract's own `test.mcp` catch-all eval with unrelated criteria, as "this
  integration suite is gated behind `MCP_INTEGRATION=1`" (an opt-in cost/CI gate), not "this suite
  tests the bearer gate" — so it is not treated as an over-claim, but the ambiguity is worth a
  human's eyes at Gate 2.

No new REJECT-worthy gap found. Verdict stays **PASS**.

---

_Round 1 — first verification of this contract. `mcp-server/src/http.ts` on `fix/mcp-auth`
(`e5ce7199`) replaces three copy-pasted bearer checks (`/render`, `/render-clip`, `/jobs`) with one
shared `rejectedByBearer()` helper, adds a guard call on the previously-unguarded `/mcp`
fall-through, and adds a startup-time fail-closed check that refuses to bind outside loopback
without `MAPPOSTER_TOKEN` set._

## Security questions answered directly

**1. Does a request to `/mcp` without a bearer get 401 when `MAPPOSTER_TOKEN` is set?** Yes —
confirmed from the test's own assertion, not the implementation. `mcp-server/src/http.test.ts:216-225`
sets `MAPPOSTER_TOKEN='secret'`, POSTs to `srv.url` (the `/mcp` endpoint) with no `authorization`
header, and asserts `expect(noAuth.status).toBe(401)`. This is eval E1. The same test then asserts a
wrong bearer (`Bearer nope`) also gets 401 (`http.test.ts:227-232`, eval E2).

**2. Does `startHttpServer` genuinely refuse (throw) for a non-loopback host with no token — and
does it still start for loopback with no token?** Yes to both, confirmed from the tests' own
assertions:
- Refuse half (E5, `http.test.ts:258-264`): `startHttpServer(0, fakeDeps(), '0.0.0.0', { allowedHosts:
  ['example.com'], ... })` with no `MAPPOSTER_TOKEN` set is asserted with
  `.rejects.toThrow(/MAPPOSTER_TOKEN/)`. Re-run directly against the pre-fix code (see Baseline
  below) confirms the old `startHttpServer` resolved instead of throwing — the guard is new and it
  is load-bearing.
- Start half (E4, `http.test.ts:246-256`): no `MAPPOSTER_TOKEN` set, default host (loopback,
  `127.0.0.1`), POST to `/mcp` with no bearer is asserted `expect(res.status).toBe(200)` — the guard
  does not turn local dev into a required-config chore.

## Round 1 finding: E6 did not test what its own title claimed — RESOLVED in Round 2 (see above)

E6 (AC-6, "bind outside loopback WITH token → starts fine") was titled in the test file *"cho phép
bind **ngoài loopback** KHI đã có token"* (`http.test.ts:266`), but the Round-1 call was
`startHttpServer(0, fakeDeps(), '127.0.0.1', { allowedHosts: ['127.0.0.1'], ... })` — `'127.0.0.1'`
is itself inside `LOOPBACK_HOSTS` (`mcp-server/src/http.ts:119`:
`['127.0.0.1', 'localhost', '[::1]']`), so the fail-closed guard's condition never engaged
regardless of the token — the test would have passed identically even if the "outside loopback +
token → starts" path were broken. Commit `ce0b13e` fixed the test to bind `'0.0.0.0'`; see the
Round 2 section above for the re-check and independent negative control.

## Baseline (A/B)

Computed against the merge base (`ab66f49`, `git merge-base origin/main HEAD`) using a `git worktree
add --detach <tmp> ab66f49` (a separate checkout, no changes to the working tree) with the new
`http.test.ts` and `auth-invariants.ts` copied in to exercise the *old* `http.ts` — this is feasible
and was done, not recorded as `n-a`.

- Running `http.test.ts` against the old `http.ts`: 2 of 54 tests fail — the `/mcp` no-bearer probe
  returns 200 instead of 401 (old code applied no bearer check to `/mcp` at all), and the refuse-to-
  start probe resolves instead of rejecting (no such guard existed). Everything else, including the
  three REST routes' own bearer checks, passes unchanged.
- A supplementary ad hoc probe (not committed; run directly against the old `http.ts` in the
  worktree) exercised each AC in isolation rather than relying on the combined test's early abort:
  AC-1 old→200 (want 401, red), AC-2 old→200 (want 401, red), AC-3 old→200 (want 200, green), AC-4
  old→200 (want 200, green), AC-5 old→did not throw (want throw, red), AC-6 old→started (want
  starts, green — old code never blocks this configuration either, since it had no fail-closed
  check to begin with; that is a property of the fix's safety, not of E6's Round-1 test bug).
- Running `auth-invariants.ts` against old `http.ts`: 6 of 7 invariant checks fail (I2 finds 3
  bearer-comparison sites instead of 1 and no `rejectedByBearer`; I3 finds 0 guard call sites
  matching the new pattern instead of 4; I4 finds no fail-closed comparison) — red.
- Running the full `npm test` against old `http.ts` + new `http.test.ts`: 2 failed, 496 passed, 7
  skipped — the same two tests, nothing else regresses — red, and confirms the refactor itself
  changes no other route's behaviour.
- `npm run test:mcp` is unaffected either way (green on both) — that suite never exercises bearer
  auth.
- Not re-computed in Round 2: the Round-2 diff is test-only (`http.test.ts`), so the old `http.ts`
  behaviour under baseline is unchanged from Round 1's measurement.

| Eval | Criterion | Executor | Verdict |
|---|---|---|---|
| E1 | AC-1 | test | PASS |
| E2 | AC-2 | test | PASS |
| E3 | AC-3 | test | PASS |
| E4 | AC-4 | test | PASS |
| E5 | AC-5 | test | PASS |
| E6 | AC-6 | test | PASS |
| E7 | AC-7 | script | PASS |
| E8 | AC-8 | script | PASS |
| E9 | AC-7 | test | PASS |
| E10 | AC-3 | test | PASS |

## Evidence

- eval: E1
  run_id: mcp-auth-r7-e1-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Re-run at ce0b13e. mcp-server/src/http.test.ts describe('auth: cửa /mcp và luật fail-closed
    (P0)') — 'gác /mcp bằng CÙNG bearer với /render' — MAPPOSTER_TOKEN set, POST /mcp with no
    Authorization header → expect(noAuth.status).toBe(401) — confirmed passing. Test Files 1
    passed (1); Tests 57 passed (57). Unaffected by this round's test-only diff (that diff only
    touches the separate E6 case).

- eval: E2
  run_id: mcp-auth-r7-e2-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Re-run at ce0b13e. Same test as E1, second half — POST /mcp with `authorization: Bearer nope`
    → expect(wrong.status).toBe(401) — confirmed passing. Test Files 1 passed (1); Tests 57 passed
    (54).

- eval: E3
  run_id: mcp-auth-r7-e3-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Re-run at ce0b13e. 'vẫn cho qua khi bearer đúng' — MAPPOSTER_TOKEN set, POST /mcp with
    `authorization: Bearer secret` → expect(ok.status).toBe(200) — confirmed passing. Non-
    discriminating vs baseline: old /mcp had no auth check at all, so a correct bearer also
    returned 200 before this fix.

- eval: E4
  run_id: mcp-auth-r7-e4-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Re-run at ce0b13e. 'KHÔNG đòi bearer khi không đặt token' — no MAPPOSTER_TOKEN, default host
    (loopback), POST /mcp with no Authorization header → expect(res.status).toBe(200) — confirmed
    passing; local dev on loopback with no token configured still works.

- eval: E5
  run_id: mcp-auth-r7-e5-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Re-run at ce0b13e. 'TỪ CHỐI KHỞI ĐỘNG khi bind ngoài loopback mà không có token' —
    startHttpServer(0, fakeDeps(), '0.0.0.0', {allowedHosts:['example.com'],...}) with no token →
    await expect(...).rejects.toThrow(/MAPPOSTER_TOKEN/) — confirmed passing.

- eval: E6
  run_id: mcp-auth-r7-e6-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.clip_http
  verified_at: 2026-08-07T12:17:38Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 62 passed (62)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.clip_http` → thoát 0 · Test Files 1 passed (1); Tests 61 passed (61)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    FIXED this round (commit ce0b13e). 'cho phép bind ngoài loopback KHI đã có token' —
    MAPPOSTER_TOKEN set, startHttpServer(0, fakeDeps(), '0.0.0.0', {allowedHosts:['127.0.0.1'],...})
    → expect(srv.url).toContain('/mcp') — confirmed passing, and now genuinely exercises the
    outside-loopback-with-token path ('0.0.0.0' is not in LOOPBACK_HOSTS). Independently verified
    with a hand-edited negative control in a disposable worktree: tightening the boot guard to
    `if (!LOOPBACK_HOSTS.includes(host))` (dropping the token check) makes this exact test fail
    with "Refusing to start: MAPPOSTER_HTTP_HOST=0.0.0.0 ... MAPPOSTER_TOKEN is unset" — the test
    now discriminates against an over-restrictive guard. Still green-on-baseline (see Analyst) for
    an unrelated reason: old http.ts never blocked this configuration either, since it had no
    fail-closed check of any kind.

- eval: E7
  run_id: mcp-auth-r7-e7-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.auth_invariants
  verified_at: 2026-08-07T12:18:07Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `script.auth_invariants` → thoát 0 · auth-invariants: mọi bất biến còn giữ
    **Vòng 6 @ d84857a — đo lại tươi:** `script.auth_invariants` → thoát 0 · auth-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Re-run at ce0b13e (script inspects mcp-server/src/http.ts, which is unchanged this round —
    only http.test.ts changed). I1 t3_path untouched vs ab66f49d. I2 exactly 1 bearer-comparison
    site + rejectedByBearer defined. I3 4 call sites gate the guard (3 REST + /mcp fall-through)
    and the guard sits immediately before createServer() on the /mcp branch. I4 the startup
    fail-closed check compares host against LOOPBACK_HOSTS and MAPPOSTER_TOKEN, and the thrown
    message names both the env var and the fix. auth-invariants: mọi bất biến còn giữ.

- eval: E8
  run_id: mcp-auth-r7-e8-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.script.auth_invariants
  verified_at: 2026-08-07T12:18:07Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `script.auth_invariants` → thoát 0 · auth-invariants: mọi bất biến còn giữ
    **Vòng 6 @ d84857a — đo lại tươi:** `script.auth_invariants` → thoát 0 · auth-invariants: mọi bất biến còn giữ
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Same run as E7 — I2/I3 (exactly one comparison, all 4 doors gated) are precisely the invariants
    that keep README's "bearer áp cho cả /mcp" claim true.

- eval: E9
  run_id: mcp-auth-r7-e9-20260807
  exit_code: 0
  baseline: red
  verifier: config:executors.test.api
  verified_at: 2026-08-07T12:16:34Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 547 passed | 10 skipped (557)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.api` → thoát 0 · Test Files 33 passed | 2 skipped (35); Tests 542 passed | 10 skipped (552)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Đo lại ở a46aec7 trong vòng 4 — Test Files 33 passed | 2 skipped (35);
    Tests 527 passed | 9 skipped (536). (Bản ghi vòng 3 ở đúng chỗ này chép nhầm số của một
    vòng KHÁC — "31 passed | 3 skipped (34); 498 passed | 7 skipped (505)" kèm câu "Re-run at
    ce0b13e" — trong khi run_id/verified_at của nó trỏ tới lần gọi npm test lúc 04:48:51Z ở
    9c1f9f3, lần mà khối E15 của road-routing ghi đúng là 527/9/536. Đã sửa.)
    Xác nhận: gộp ba bản chép về một helper không đổi hành vi quan sát được ở cả ba route
    REST (/render, /render-clip, /jobs) — không ca nào đỏ.

- eval: E10
  run_id: mcp-auth-r7-e10-20260807
  exit_code: 0
  baseline: green
  verifier: config:executors.test.mcp
  verified_at: 2026-08-07T12:21:00Z
  output: |
    **Vòng 7 @ ace12a0 — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 15 passed (15)
    **Vòng 6 @ d84857a — đo lại tươi:** `test.mcp` → thoát 0 · Test Files 3 passed (3); Tests 13 passed (13)
    Phần dưới đây là tường thuật của vòng TRƯỚC, giữ nguyên làm lịch sử (số ca của nó có thể đã cũ).
    Re-run at ce0b13e. MCP_INTEGRATION=1 vitest run (renderFrame.test.ts, renderClip.test.ts,
    stdioChannel.test.ts) — real vite build, real PNG and clip through headless Chromium. Test
    Files 3 passed (3); Tests 12 passed (12). Re-confirmed this round (see "Re-scrutinized" above)
    that none of these three files reference bearer/Authorization/startHttpServer — this is a
    stdio-transport regression corroboration, not a direct AC-3 test.

## Analyst

Non-discriminating (green on both baseline and HEAD) because the underlying behaviour predates this
fix: E3, E4, E6, E10. E3/E4 prove the fix didn't regress the happy path rather than that the fix
exists. E6 is green-on-baseline for a distinct reason from Round 1's finding: old code never had a
fail-closed check at all, so it never blocked the "non-loopback + token" configuration either —
E6's discriminating power (after the Round-2 fix) is against a *regression toward over-restriction*
(proven via the independent negative control above), not against the historical baseline. The
actual security fix vs. the historical baseline is proven by E1, E2, E5, E7, E8, E9, which are all
red on baseline.

## Variance

none — every command this round is a deterministic single run.

## Iterations

Vòng 7 (ghim lại vì tệp dùng chung, chạy lại tươi ở `ace12a0`): cả 10 eval 10/10 thoát 0 (`http.test.ts` 62,
`npm test` 547/10/0, `test:mcp` 15, `auth-invariants` còn giữ). **PASS.** Vòng 6 không sửa gì trong bán
kính hợp đồng này; số ca tăng thuần cộng thêm từ hợp đồng anh em. Ghi nhận cũ giữ nguyên: E10 gắn `AC-3`
mà không chứng minh AC-3 (khiếm khuyết ánh xạ, không phải nói quá). `human_signoff` để rỗng.

Vòng 6 (chạy lại ở `d84857a` sau khi E8 được vá): cả 10 eval chạy lại tươi, 10/10 thoát 0
(`http.test.ts` 61, `npm test` 542/10/0, `test:mcp` 13, script bất biến còn giữ). **PASS.** E8 hết
trượt: `d59c2bd` thêm I5 vào `auth-invariants.ts` — nó ĐỌC `README.md` thật (`:62`), cắt mục
`### REST endpoints`, và đối chiếu hai vế README↔`http.ts` (`:71-77`, `:79-86`); cả hai nhánh đột
biến mà `expected` nêu (sửa README về câu cũ; gỡ guard ở nhánh fall-through `http.ts:542`) đều làm
script đỏ, và không vế nào là no-op. Chín eval còn lại soi lại tận nguồn và trung thực; E6 nay bind
`'0.0.0.0'` thật. Ghi nhận thêm, KHÔNG đánh trượt: E10 gắn `criterion: AC-3` mà không chứng minh gì
về AC-3 (khiếm khuyết ánh xạ tiêu chí, không phải nói quá) — như vòng 4 đã ghi. `human_signoff` để
rỗng: Cổng 2 chờ người ký.

Vòng 4 (chạy lại vì stale + soi lại từng mệnh đề): ghim ở `a46aec7`. Cả 10 eval chạy lại tươi, 10/10 thoát 0 (`http.test.ts` 57, `npm test` 527/9/536, `test:mcp` 12/12, script 4 bất biến). **REJECT trên [E8]**: `expected` của E8 gắn giá trị của script vào việc nó giữ câu README đúng, nhưng `auth-invariants.ts` chỉ đọc `mcp-server/src/http.ts` — không dòng nào đọc `README.md`, nên AC-8 có 0 khẳng định chống lưng. Đồng thời sửa hai sai số trong bản ghi vòng 3: khối E9 chép số của một vòng khác (498/505 thay vì 527/9/536) và dòng tường thuật ghi `http.test.ts` 61 ca thay vì 57. E7 KHÔNG bị đánh trượt: `expected` của nó nói ">= 4 cửa gọi guard", đúng bằng `guards >= 4` của script và đúng bằng thước CE ghi trong `contract.md` — AC-7 rộng hơn eval, nhưng eval không nói quá. E10 cũng KHÔNG bị đánh trượt: "MCP integration có gác" nói về việc BỘ TEST bị gác sau `MCP_INTEGRATION=1`, không phải nói nó kiểm bearer (đọc theo ghi chú đầu `_acceptance/anchors-camera/evals.yaml`); tuy vậy nó gắn `criterion: AC-3` mà không chứng minh gì về AC-3 — nên ghi là hàng rào hồi quy, không phải bằng chứng của AC-3.

Vòng 3 (chạy lại vì stale): kích hoạt bởi `feat/anchors-camera` @ `9c1f9f3` chạm `http.ts`/`tools.ts`/`jobRunner.ts`/`renderFrame.ts`. Cả 10 eval chạy lại tươi — 10/10 xanh, không hồi quy. `http.test.ts` xanh toàn bộ (số ca thật là **57**; dòng gốc của vòng 3 ghi "54 → 61" — sai, đã đính chính ở vòng 4). `verified_commit` ghim về `9c1f9f36`, `human_signoff` xoá để Cổng 2 ký lại.

Round 2: E6/AC-6 re-checked per the same per-clause standard after commit `ce0b13e` rebound the
test to a genuine non-loopback host (`'0.0.0.0'`); clause now proven, confirmed independently via a
hand-edited negative control in a disposable worktree (over-restrictive guard makes the test fail).
Re-scrutinized E1-E5, E7-E10 with the same standard — no new gap found; E10's "MCP integration có
gác" phrasing remains ambiguous (flagged for Gate 2, not treated as a failure). All 10 evals
re-run fresh; `verified_commit` re-pinned to `ce0b13e6de6504aa53d3bc0fe5545f209ec00381`.

Round 1: all 10 evals pass on first run against `fix/mcp-auth` HEAD (e5ce7199). No REJECT round
preceded this one. E6 flagged as a coverage gap (test didn't exercise the clause its title
claimed) without failing the eval outright, since its own literal `expected` text was still met.

## Gate 2 checklist (human)

- [ ] Read the table + spot-check 1-2 evidence blocks
- [ ] Personally verify every judgment item marked UNCERTAIN, then fill its
      `human_override: <name> <date>` line
- [ ] T3 only: personally verify ALL judgment items and fill `human_override`
      on each (judge verdicts are advisory; the hook blocks PASS without them)
- [ ] If verdict was PENDING-JUDGMENT: upgrade it to PASS (this write is when
      the hook re-validates evidence + overrides)
- [ ] Fill `human_signoff` in frontmatter + `time_human_minutes.gate2` in contract
