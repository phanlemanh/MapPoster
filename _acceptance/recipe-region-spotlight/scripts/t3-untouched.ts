/**
 * AC-12 — tầng recipe KHÔNG chạm `t3_paths`.
 *
 * Vì sao là script chứ không phải một dòng `git diff` trong evals.yaml: bản
 * trước viết `git diff --quyet <verified_commit> HEAD -- <t3_paths>`, tức ghim
 * vào chính mốc của vòng verify. Ở vòng verify, `<verified_commit>` CHÍNH LÀ
 * HEAD, nên phép kiểm rút thành `git diff HEAD HEAD` — rỗng vĩnh viễn, không
 * bao giờ đỏ được. Nó cũng chứa placeholder chưa thay nên chưa từng chạy nổi.
 *
 * Đo lại cho đúng ý định "trong PHẠM VI gói này": không phải "t3_paths có đổi
 * gì không" (gói anh em `satellite-basemap` ĐÃ đổi cả hai file ở PR #8a — đó là
 * việc của hợp đồng đó, đã leo thang T3 đúng thủ tục), mà là "có commit nào của
 * TẦNG RECIPE đồng thời chạm t3_paths không". Khẳng định này độc lập với mọi
 * gói khác, nên không đỏ oan vì việc của người khác — và vẫn đỏ thật khi đúng
 * cái nó canh xảy ra.
 */
import { execFileSync } from 'node:child_process';

const T3_PATHS = ['src/lib/export.ts', 'src/lib/mapStyle.ts'];
/** Tệp định nghĩa tầng recipe — chạm chúng là "commit của gói này". */
const RECIPE_PATHS = ['mcp-server/src/recipes.ts', 'mcp-server/src/recipes.test.ts'];
/** Cha của commit tạo recipes.ts: mốc gốc của gói, tự suy ra chứ không ghim cứng. */
const git = (...a: string[]): string => execFileSync('git', a, { encoding: 'utf8' }).trim();

const created = git('log', '--diff-filter=A', '--format=%H', '--', RECIPE_PATHS[0]).split('\n').filter(Boolean).at(-1);
if (!created) {
  console.log('FAIL  không tìm được commit tạo recipes.ts — phép kiểm đã mù, không phải đã đạt');
  process.exit(1);
}
const baseline = git('rev-parse', `${created}^`);
const recipeCommits = git('log', '--format=%H', `${baseline}..HEAD`, '--', ...RECIPE_PATHS).split('\n').filter(Boolean);
if (recipeCommits.length === 0) {
  console.log('FAIL  0 commit chạm tầng recipe — phép kiểm đã mù, không phải đã đạt');
  process.exit(1);
}

const offenders = recipeCommits.filter((c) =>
  git('show', '--name-only', '--format=', c).split('\n').some((f) => T3_PATHS.includes(f.trim())),
);

console.log(`mốc gốc     ${baseline.slice(0, 8)} (cha của ${created.slice(0, 8)}, commit tạo recipes.ts)`);
console.log(`commit gói  ${recipeCommits.length}`);
for (const c of recipeCommits) console.log(`   ${git('log', '-1', '--format=%h %s', c)}`);
if (offenders.length) {
  console.log(`\nFAIL  ${offenders.length} commit của tầng recipe chạm t3_paths — gói này phải leo thang T3:`);
  for (const c of offenders) console.log(`   ${git('log', '-1', '--format=%h %s', c)}`);
  process.exit(1);
}
console.log(`\nt3-untouched: ${recipeCommits.length} commit của tầng recipe, KHÔNG cái nào chạm ${T3_PATHS.join(' / ')}`);
