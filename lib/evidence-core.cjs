'use strict';
/**
 * evidence-core.cjs — the SINGLE SOURCE OF TRUTH for the acceptance gate's
 * evidence validation (L1 SHAPE, L1 CONSISTENCY, L2 SUBSTANCE, L2 OBSERVED, L3 JUDGMENT).
 *
 * Two callers share this so they cannot drift:
 *   - hooks/acceptance-evidence-gate.js — PreToolUse, validates at WRITE time.
 *   - scripts/recheck-evidence.cjs       — CI, re-validates the COMMITTED report
 *     (the backstop for a report hand-edited after the write-time hook ran, or
 *     written under ACCEPTANCE_GATE_BYPASS).
 *
 * Pure-ish: no stdin/stdout/exit. `evaluateEvidence` reads the sibling
 * contract.md (for the T3 rule) when a fileDir is given; everything else is a
 * function of the payload + caller-supplied config text.
 */

const fs = require('fs');
const path = require('path');

const PASS_FAMILY = /^(PASS|PASSED|ACCEPTED|APPROVED|GO|SUCCESS)$/i;

// ─── Config lookup ─────────────────────────────────────────────────────────

function findAcceptanceConfig(fileDir) {
  // evidence-report.md lives at _acceptance/<slug>/ → config is ../config.yaml.
  // Walk up defensively in case of nesting.
  let cur = fileDir;
  for (let i = 0; i < 10 && cur && cur !== path.dirname(cur); i++) {
    const base = path.basename(cur) === '_acceptance'
      ? cur
      : path.join(cur, '_acceptance');
    const candidate = path.join(base, 'config.yaml');
    try {
      if (fs.existsSync(candidate)) return candidate;
    } catch (_) {}
    cur = path.dirname(cur);
  }
  return null;
}

function resolveConfigKey(configText, dottedKey) {
  // Indent-based walk for a 2-3 level dotted key (e.g. executors.test.api).
  // Returns the scalar value or null. No YAML lib — line-based on purpose.
  const parts = dottedKey.split('.');
  const lines = configText.split('\n');
  let depth = 0;
  let expectedIndent = 0;
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const indent = line.length - line.trimStart().length;
    if (indent < expectedIndent) {
      // left the branch we were following — reset if we fell below current depth
      while (depth > 0 && indent < expectedIndent) {
        depth--;
        expectedIndent -= 2;
      }
    }
    if (indent !== expectedIndent) continue;
    const m = line.trim().match(/^([\w-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    if (m[1] === parts[depth]) {
      if (depth === parts.length - 1) {
        const val = m[2].replace(/\s+#.*$/, '').trim().replace(/^["']|["']$/g, '');
        return val || null; // leaf must have a non-empty scalar
      }
      depth++;
      expectedIndent += 2;
    }
  }
  return null;
}

// ─── Frontmatter field read (leading block only) ───────────────────────────

// Mirrors pre-merge-check.sh front_field: tolerate leading blank lines, read
// ONLY the leading --- fence block — a body excerpt (pasted log) cannot poison
// the read. Returns the normalized scalar (comments/quotes stripped) or null
// when the file has no leading frontmatter / the key is absent.
function frontmatterField(payload, key) {
  const text = String(payload).replace(/^(?:[ \t]*\r?\n)+/, '');
  const fm = text.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  if (!fm) return null;
  // `[ \t]*` chứ KHÔNG phải `\s*` sau dấu phân cách: `\s` khớp cả xuống dòng,
  // nên một khoá để TRỐNG (`verdict:`, `approved_at:`, `human_signoff:`) nuốt
  // luôn dòng kế và trả về giá trị của khoá khác. Đọc `verdict:` rỗng ra
  // "decided_by: Manh" khiến một phiên chưa ký bị gọi là hồ sơ hỏng, và
  // `approved_at:` rỗng làm hỏng thứ tự xếp cổng chờ ký. Bug này ẩn được lâu
  // vì mọi khuôn mẫu đều tình cờ có comment `#` ngay sau khoá rỗng — comment
  // hút mất cú nuốt (S4-r2).
  const line = fm[1].match(new RegExp('^' + key + '[ \\t]*[:=][ \\t]*(.*)$', 'mi'));
  if (!line) return null;
  const val = line[1]
    .replace(/^#.*$/, '')      // comment-only value ("# placeholder") = empty
    .replace(/\s+#.*$/, '')
    .trim();
  // Chỉ bóc nháy khi CẢ CẶP khớp. Bóc đầu và cuối độc lập thì một giá trị
  // không-quote mà KẾT THÚC bằng nháy sẽ mất ký tự cuối — `ngăn thứ ba "thật
  // nhưng ngoài hợp đồng"` đọc ra thiếu dấu đóng, và bản đồ sản phẩm in
  // nguyên văn ra cho người đọc nên cái cụt đó hiện thành văn bản hỏng (S4-r5).
  const paired = val.match(/^"([\s\S]*)"$/) || val.match(/^'([\s\S]*)'$/);
  return (paired ? paired[1] : val).trim();
}

// ─── Run-log reconciliation (run_id provenance) ────────────────────────────

// run-log.jsonl sits next to the report, appended by the verify MACHINERY
// (workflow JS computes the exact lines; a mechanical scribe writes them) the
// moment machine results exist — before the report. A PASS report's run_ids
// must all appear there, so a report minted by hand (or by a synthesizer that
// never ran anything) fails the same core the hook and CI re-check share.
// Defense-in-depth against lazy fabrication, not against an adversary editing
// the log too — that path is caught by review/diff like any artifact tamper.

function extractRunIds(payload) {
  const ids = [];
  const RE = /^\s*(?:-\s+)?run_id\s*[:=]\s*(.+?)\s*$/i;
  for (const line of String(payload).split('\n')) {
    const m = line.match(RE);
    if (!m) continue;
    const val = m[1].replace(/\s+#.*$/, '').trim().replace(/^["']+|["']+$/g, '').trim();
    if (val) ids.push(val);
  }
  return ids;
}

// run_ids of {"kind":"repin"} lane lines — lane provenance backs a ### Re-pin
// signature, NEVER an eval block (AC-11 delta-verify-repin: an agent fresh off
// a re-pin has the lane id in context — borrowing it for an eval block is the
// exact lazy-fabrication path this layer exists to block). Null when no log.
function loadRepinRunIds(fileDir) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(fileDir, 'run-log.jsonl'), 'utf8');
  } catch (_) {
    return null;
  }
  const ids = new Set();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry && entry.kind === 'repin' && typeof entry.run_id === 'string' && entry.run_id) ids.add(entry.run_id);
    } catch (_) { /* skip malformed line */ }
  }
  return ids;
}

// run_ids claimed INSIDE eval blocks (`- eval: <id>` + indented fields) —
// section citations (run_id at column 0 in ### Re-pin) are deliberately NOT
// collected here: they are lane citations, validated by the repin rule.
function extractEvalBlockRunIds(payload) {
  const ids = [];
  let inBlock = false;
  for (const line of String(payload).split('\n')) {
    if (/^\s*-\s+eval\s*[:=]/i.test(line)) { inBlock = true; continue; }
    if (inBlock && !/^\s+\S/.test(line)) inBlock = false; // dedent/blank/heading ends the block
    if (!inBlock) continue;
    const m = line.match(/^\s+run_id\s*[:=]\s*(.+?)\s*$/i);
    if (!m) continue;
    const val = m[1].replace(/\s+#.*$/, '').trim().replace(/^["']+|["']+$/g, '').trim();
    if (val) ids.push(val);
  }
  return ids;
}

// Set of run_ids the machinery logged, or null when no log exists (older
// flow — tolerated; pre-merge NOTEs it). Malformed lines are skipped.
function loadRunLogIds(fileDir) {
  let raw;
  try {
    raw = fs.readFileSync(path.join(fileDir, 'run-log.jsonl'), 'utf8');
  } catch (_) {
    return null;
  }
  const ids = new Set();
  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const entry = JSON.parse(line);
      if (entry && typeof entry.run_id === 'string' && entry.run_id) ids.add(entry.run_id);
    } catch (_) { /* skip malformed line */ }
  }
  return ids;
}

// ─── Observed inspection (L2 OBSERVED — schema v2+) ────────────────────────

// A `screenshot:` in an evidence block proves a frame was SAVED; `observed:`
// proves someone LOOKED at it. From template schema_version 2, every
// screenshot-bearing block in a PASS-family report must describe what is
// visible in the frames (>= OBSERVED_MIN_CHARS substantive chars after
// stripping {{...}} placeholders, comments and YAML block markers). Older
// reports (schema < 2 / absent) are tolerated here — pre-merge-check.sh NOTEs
// them instead.
const OBSERVED_MIN_CHARS = 20;

function evaluateObserved(payload) {
  const failures = [];
  const sv = parseInt(frontmatterField(payload, 'schema_version') || '', 10);
  if (!(sv >= 2)) return failures;
  const lines = String(payload).split('\n');
  const starts = [];
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*-\s+eval\s*[:=]/i.test(lines[i])) starts.push(i);
  }
  for (let b = 0; b < starts.length; b++) {
    const block = lines.slice(starts[b], b + 1 < starts.length ? starts[b + 1] : lines.length);
    if (!block.some(l => /^\s*screenshot\s*[:=]/i.test(l))) continue;
    const evalId = (block[0].match(/^\s*-\s+eval\s*[:=]\s*(\S+)/i) || [])[1] || `#${b + 1}`;
    let content = null;
    for (let i = 0; i < block.length; i++) {
      const m = block[i].match(/^\s*observed\s*[:=]\s*(.*)$/i);
      if (!m) continue;
      // Inline value: whitespace+# starts a real YAML comment — not content.
      const parts = [m[1].replace(/(^|\s)#.*$/, '')];
      // Continuation lines end at the first non-blank line NOT indented deeper
      // than the observed: key (YAML block-scalar semantics). A word:-shaped
      // content line ("step1: form hien thi...") is NOT a terminator.
      const keyIndent = block[i].match(/^\s*/)[0].length;
      for (let j = i + 1; j < block.length; j++) {
        const ln = block[j];
        if (!ln.trim()) continue;                         // blank line inside block scalar
        if (ln.match(/^\s*/)[0].length <= keyIndent) break; // dedent = next field/block
        // Whole-line # doesn't count; mid-line # is literal block-scalar
        // content (e.g. a CSS selector "#main-nav") — keep it.
        if (!/^\s*#/.test(ln)) parts.push(ln);
      }
      content = parts.join(' ');
      break;
    }
    const substantive = (content || '')
      .replace(/\{\{[^}]*\}\}/g, '')   // template placeholders don't count (may span joined lines)
      .replace(/[|>]/g, ' ')           // YAML block markers
      .trim();
    if (substantive.length < OBSERVED_MIN_CHARS) {
      failures.push(
        `eval ${evalId}: screenshot evidence without substantive observed: ` +
        `(${content === null ? 'field missing' : 'placeholder/too short'}) — ` +
        `the verifier must OPEN each saved frame (multimodal Read) and describe what is visible vs expected`
      );
    }
  }
  return failures;
}

// ─── Verifier extraction & authenticity ────────────────────────────────────

function extractVerifierValues(payload) {
  // NOTE: `verified_by:` is deliberately NOT in this list — the report
  // template uses it for agent attribution, not as an evidence verifier.
  const values = [];
  const KEY_RE = /^\s*(?:-\s+)?(verifier|checked_by)\s*[:=]\s*(.+?)\s*$/i;
  for (const line of payload.split('\n')) {
    const m = line.match(KEY_RE);
    if (!m) continue;
    let val = m[2].replace(/\s+#.*$/, '').trim().replace(/^["']+|["']+$/g, '').trim();
    if (val) values.push(val);
  }
  return values;
}

function findGitRoot(startDir) {
  let cur = startDir;
  while (cur && cur !== path.dirname(cur)) {
    try {
      if (fs.existsSync(path.join(cur, '.git'))) return cur;
    } catch (_) {}
    cur = path.dirname(cur);
  }
  return null;
}

function isAuthenticVerifier(value, fileDir, configPath, configText) {
  const configRef = value.match(/^config:([\w.-]+)$/);
  if (configRef) {
    if (!configText) {
      return { ok: false, reason: `verifier "${value}" but no _acceptance/config.yaml found` };
    }
    const resolved = resolveConfigKey(configText, configRef[1]);
    if (resolved) return { ok: true, resolved: `${configPath} :: ${configRef[1]} = ${resolved}` };
    return { ok: false, reason: `config key not found or empty: "${configRef[1]}" in ${configPath} (note: the parser requires 2-space indentation in config.yaml)` };
  }

  const scriptMatch = value.match(/(\S+\.(py|mjs|js|sh))\b/);
  if (scriptMatch) {
    const rawPath = scriptMatch[1].replace(/^["']+|["']+$/g, '');
    const candidates = [];
    if (path.isAbsolute(rawPath)) {
      candidates.push(rawPath);
    } else {
      if (fileDir) {
        candidates.push(path.resolve(fileDir, rawPath));
        const gitRoot = findGitRoot(fileDir);
        if (gitRoot) candidates.push(path.resolve(gitRoot, rawPath));
      }
      candidates.push(path.resolve(process.cwd(), rawPath));
    }
    for (const c of candidates) {
      try {
        if (fs.existsSync(c) && fs.statSync(c).isFile()) return { ok: true, resolved: c };
      } catch (_) {}
    }
    // Unresolvable script path: fall through to the blocklist check so a
    // free-text value like "manual review.sh notes" still gets the clearer
    // manual-verifier message when applicable.
    const MANUAL_RE = /\b(manual|human|heuristic|cross-reference|eyeball|interpret(ation)?|persona\s+rubric|llm\s+rubric|llm[-\s]as[-\s]judge)\b/i;
    if (MANUAL_RE.test(value)) {
      return { ok: false, reason: `manual/heuristic verifier disallowed: "${value}"` };
    }
    return {
      ok: false,
      reason: `verifier script not found. raw: ${rawPath}; tried:\n` +
        candidates.map(c => `      ${c}`).join('\n'),
    };
  }

  const MANUAL_RE = /\b(manual|human|heuristic|cross-reference|eyeball|interpret(ation)?|persona\s+rubric|llm\s+rubric|llm[-\s]as[-\s]judge)\b/i;
  if (MANUAL_RE.test(value)) {
    return { ok: false, reason: `manual/heuristic verifier disallowed: "${value}"` };
  }
  return { ok: false, reason: `verifier is neither config:<key> nor a script path (.py/.sh/.js): "${value}"` };
}

// ─── Verdict / enforcement determination ───────────────────────────────────

// Does this payload claim a PASS-family verdict (so the evidence bar applies)?
// Reads the leading frontmatter verdict; falls back to an anti-evasion scan when
// no frontmatter verdict exists.
function determineEnforce(payload) {
  let overall = null;
  const fmMatch = payload.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (fmMatch) {
    const vm = fmMatch[1].match(/^verdict\s*[:=]\s*([A-Za-z-]+)\s*$/m);
    if (vm) overall = vm[1].toUpperCase();
  }
  if (overall) return PASS_FAMILY.test(overall);
  const CLAIM_RE = /(?:^|\n)\s*(?:-\s+)?verdict\s*[:=]\s*(PASS|PASSED|ACCEPTED|APPROVED|GO|SUCCESS)\b/i;
  const CHECKMARK_RE = /✅\s*(PASS|PASSED|ACCEPTED|APPROVED|GO|SUCCESS)/i;
  return CLAIM_RE.test(payload) || CHECKMARK_RE.test(payload);
}

// ─── The shared evidence evaluation (assumes the report is PASS-family) ─────

// Returns { missing[], consistencyFailure, authFailures[], judgmentFailure, anyFailure }.
// Caller decides what to do with it (block / warn / report). Does NOT read
// enforcement mode or honor bypass — those are caller policy.
function evaluateEvidence(payload, opts) {
  opts = opts || {};
  const fileDir = opts.fileDir || null;
  const configText = opts.configText || null;
  const configPath = opts.configPath || null;

  // L1 CONSISTENCY — a genuine PASS report never contains a failed eval,
  // machine OR judgment. If anything failed, the verdict must be REJECT.
  const NONZERO_EXIT_RE = /(exit_code|verifier_exit_code|exit)\s*[:=]\s*[1-9]\d*\b/i;
  const FAILED_JUDGMENT_RE = /verdict\s*[:=]\s*FAIL\b/i;
  let consistencyFailure = null;
  if (NONZERO_EXIT_RE.test(payload)) {
    consistencyFailure = 'PASS report contains a failed eval (exit_code != 0) — the verdict must be REJECT';
  } else if (FAILED_JUDGMENT_RE.test(payload)) {
    consistencyFailure = 'PASS report contains a failed judgment (verdict: FAIL) — the verdict must be REJECT';
  }

  // L1 SHAPE
  const HAS_RUN_ID = /run_id\s*[:=]\s*\S{4,}/i.test(payload);
  const HAS_EXIT_ZERO = /(exit_code|verifier_exit_code|exit)\s*[:=]\s*0\b/i.test(payload);
  const HAS_VERIFIED_AT = /verified_at\s*[:=]\s*\d{4}-\d{2}-\d{2}/i.test(payload);
  const verifierValues = extractVerifierValues(payload);
  const HAS_VERIFIER = verifierValues.length > 0;

  const missing = [];
  if (!HAS_RUN_ID) missing.push('run_id: <id from verifier stdout>');
  if (!HAS_EXIT_ZERO) missing.push('exit_code: 0');
  if (!HAS_VERIFIER) missing.push('verifier: <script path or config:executors.<type>.<surface>>');
  if (!HAS_VERIFIED_AT) missing.push('verified_at: <ISO8601>');

  // verified_commit — PRESENCE-BASED (backward-tolerant): a report without the
  // field (older template) is not penalized here (pre-merge NOTEs it instead);
  // when present it must be a real git SHA so the evidence is pinned to the
  // exact tree that was verified.
  const verifiedCommit = frontmatterField(payload, 'verified_commit');
  if (verifiedCommit !== null && verifiedCommit !== '' && !/^[0-9a-f]{7,40}$/i.test(verifiedCommit)) {
    missing.push(`verified_commit: <git SHA from \`git rev-parse HEAD\`> — found "${verifiedCommit}" (not a 7-40 char hex SHA)`);
  }

  // L2 SUBSTANCE
  const authFailures = [];
  for (const v of verifierValues) {
    const r = isAuthenticVerifier(v, fileDir, configPath, configText);
    if (!r.ok) authFailures.push(r.reason);
  }

  // L3 JUDGMENT — UNCERTAIN must be human-resolved before overall PASS.
  const uncertainCount = (payload.match(/verdict\s*[:=]\s*UNCERTAIN\b/gi) || []).length;
  const overrideCount = (payload.match(/human_override\s*[:=]\s*[^#\s]/gi) || []).length;
  let judgmentFailure = null;
  if (uncertainCount > overrideCount) {
    judgmentFailure = `${uncertainCount} UNCERTAIN judgment(s) but only ${overrideCount} human_override(s) — a human must resolve each UNCERTAIN before overall PASS`;
  }
  // T3 contracts: EVERY judgment item needs a direct human verdict, regardless
  // of what the judge said. Tier comes from the sibling contract.
  if (!judgmentFailure && fileDir) {
    let tier = null;
    try {
      const contract = fs.readFileSync(path.join(fileDir, 'contract.md'), 'utf8');
      const tm = contract.match(/^risk_tier\s*[:=]\s*["']?(T[123])["']?\s*(#.*)?$/mi);
      if (tm) tier = tm[1].toUpperCase();
    } catch (_) {}
    if (tier === 'T3') {
      const judgedCount = (payload.match(/judged_by\s*[:=]\s*\S+/gi) || []).length;
      if (judgedCount > overrideCount) {
        judgmentFailure = `risk_tier T3: ${judgedCount} judgment item(s) but only ${overrideCount} human_override(s) — T3 requires a direct human verdict on every judgment eval`;
      }
    }
  }

  // L2 PROVENANCE — presence-based on the LOG file: when the verify machinery
  // wrote run-log.jsonl next to this report, every run_id the report claims
  // must appear in it. No log (older flow) → tolerated; pre-merge NOTEs it.
  let runLogFailure = null;
  if (fileDir) {
    const logIds = loadRunLogIds(fileDir);
    if (logIds) {
      const unlogged = extractRunIds(payload).filter(id => !logIds.has(id));
      if (unlogged.length) {
        runLogFailure = `run_id(s) not found in run-log.jsonl (machine-written at verify time): ${[...new Set(unlogged)].join(', ')} — this evidence was not produced by a logged verify run; re-verify, do not hand-mint run_ids`;
      }
      if (!runLogFailure) {
        const repinIds = loadRepinRunIds(fileDir);
        if (repinIds && repinIds.size) {
          const borrowed = extractEvalBlockRunIds(payload).filter(id => repinIds.has(id));
          if (borrowed.length) {
            runLogFailure = `eval evidence cites re-pin lane run_id(s): ${[...new Set(borrowed)].join(', ')} — a {"kind":"repin"} line backs a ### Re-pin signature, never an eval block; re-verify, do not borrow lane ids`;
          }
        }
      }
    }
  }

  // L2 OBSERVED — schema v2+ only (backward-tolerant; see evaluateObserved).
  const observedFailures = evaluateObserved(payload);

  const anyFailure = missing.length > 0 || authFailures.length > 0 || !!judgmentFailure || !!consistencyFailure || !!runLogFailure || observedFailures.length > 0;
  return { missing, consistencyFailure, authFailures, judgmentFailure, runLogFailure, observedFailures, anyFailure };
}

// ─── Contract transition guard (Gate-1 integrity) ──────────────────────────

// A contract may only be SET to approved/signed-off — or jump from draft (or a
// brand-new file) straight to implemented/verified — when Gate 1 is recorded
// (approved_by non-empty) or explicitly skipped (gate1_skipped: true, the
// audited escape hatch the skill already documents). Judges the POST-WRITE
// content; oldPayload (the pre-write file, null when creating) supplies the
// Trạng thái V — «máy đã đi trước, owner chưa veto» (hồ sơ veto-co-dau-vet,
// đợt 2 bản neo 12/08). KHÁC hẳn gate1_skipped: bỏ-cổng nghĩa là người đã
// chủ động miễn cổng; V nghĩa là cổng VẪN MỞ, máy đi trước và người veto lúc
// nào cũng được. Hai vật, hai nghĩa, không thay nhau.
//
// Ba điều kiện để V mở đường, thiếu một là chặn:
//   (a) veto_state: mo          — khoá vắng thì luật cũ chạy NGUYÊN VĂN
//   (b) veto_opened_at đọc được — vết thời gian là một nửa cái tên của cơ
//       chế; không có vết thì đây là bỏ-cổng lặng lẽ, không phải V
//   (c) hạng T2                 — T3 chạm lõi/dữ liệu, LUÔN cần người
function vetoGateState(payload) {
  const raw = (frontmatterField(payload, 'veto_state') || '').trim().toLowerCase();
  if (!raw) return { present: false };
  const openedAt = (frontmatterField(payload, 'veto_opened_at') || '').trim();
  const tier = (frontmatterField(payload, 'risk_tier') || '').trim().toUpperCase();
  // Vết thời gian phải PARSE ĐƯỢC, không chỉ khác rỗng: một chuỗi rác qua
  // được thì NOTE đếm cửa-veto mất khả năng đọc «cửa này mở bao lâu rồi».
  const stamped = openedAt !== '' && !Number.isNaN(Date.parse(openedAt));
  return { present: true, state: raw, openedAt, stamped, tier };
}

function evaluateContractWrite(newPayload, oldPayload) {
  const failures = [];
  const status = (frontmatterField(newPayload, 'status') || '').toLowerCase();
  const approvedBy = frontmatterField(newPayload, 'approved_by') || '';
  const gate1Skipped = /^(true|yes|1)$/i.test(frontmatterField(newPayload, 'gate1_skipped') || '');
  const oldStatus = oldPayload == null ? null : (frontmatterField(oldPayload, 'status') || '').toLowerCase();
  const v = vetoGateState(newPayload);

  // Cửa V chỉ mở khi ĐỦ ba điều kiện; mỗi điều kiện thiếu có thông điệp
  // RIÊNG, vì «chưa khai vết» và «hạng T3» là hai kiểu hỏng khác nhau và
  // gộp chúng thì người đọc log học cách phớt lờ cả hai.
  let vOpen = false;
  if (v.present) {
    if (v.state === 'mo') {
      if (!v.stamped) {
        failures.push(`veto_state: mo but veto_opened_at is ${v.openedAt ? `unreadable ("${v.openedAt}")` : 'missing'} — the V lane REQUIRES a parseable timestamp. Without it this is a silent gate skip, not a traceable veto window. Set veto_opened_at: <ISO-8601>.`);
      } else if (v.tier === 'T3') {
        failures.push(`veto_state: mo on a T3 contract — the V lane is T2-only. T3 touches enforcement core / data / breaking API, so it ALWAYS needs a human at Gate 1: fill approved_by (+ approved_at). This is not overridable by the V lane.`);
      } else {
        vOpen = true;
      }
    } else if (v.state !== 'da-veto') {
      failures.push(`veto_state: "${v.state}" is not a known value — use "mo" (machine went ahead, owner has not vetoed) or "da-veto" (owner vetoed; the run must be resolved before merge).`);
    }
  }

  // `machine-cleared` = qua Cổng Bằng chứng KHÔNG có chữ ký người — đó CHÍNH là điều làn V
  // chỉ cho phép ở T2. Răng T2-only phải đứng ở tầng GHI, không chỉ ở lưới trước-merge: T3
  // là «Cổng 2 luôn dừng chờ người», và hai tầng cưỡng chế lệch nhau cho cùng một luật là
  // đúng lớp «hai bản dựng trôi khỏi nhau» mà hồ sơ này sinh ra để giết (S4-r8 [0]). Nhánh
  // veto ở trên chỉ chặn ca đi qua veto_state; ca approved_by ĐÃ điền vẫn lọt.
  const hangMoi = (frontmatterField(newPayload, 'risk_tier') || '').trim().toUpperCase();
  // ALLOWLIST (một giá trị ĐƯỢC PHÉP), không phải blacklist một giá trị bị cấm: viết
  // `=== 'T3'` thì T1, hạng rỗng, hay gõ sai ('TIER3') đều LỌT — và lưới trước-merge chỉ
  // chấm hạng trong REQUIRED_FOR (mặc định «T2 T3») nên hồ sơ T1 còn không được lưới sờ
  // tới lần nào. Lời khai «máy đã thông» khi ấy hoàn toàn không có vật (S4-r11 [1]).
  if (status === 'machine-cleared' && hangMoi !== 'T2') {
    failures.push(`status: machine-cleared on a ${hangMoi || '(empty)'} contract — «machine-cleared» means Gate 2 passed WITHOUT a human signature, and that is T2-ONLY. T3 touches enforcement core / data / breaking API, so Gate 2 ALWAYS stops for a human: use verified, then /acceptance-gate:signoff to reach signed-off.`);
  }

  if (!approvedBy && !gate1Skipped && !vOpen) {
    if (status === 'approved' || status === 'signed-off' || status === 'machine-cleared') {
      failures.push(`status: ${status} with empty approved_by — Gate 1 approval not recorded. Fill approved_by (+ approved_at); only when the user explicitly skips Gate 1, record gate1_skipped: true (audited, pre-merge NOTEs it).`);
    }
    if ((oldStatus === null || oldStatus === 'draft') && (status === 'implemented' || status === 'verified' || status === 'machine-cleared')) {
      failures.push(`status: ${oldStatus === null ? '(new file)' : 'draft'} -> ${status} skips Gate 1 — approved_by is empty and gate1_skipped is not true. Lifecycle: draft -> approved (Gate 1) -> implemented -> verified -> signed-off (Gate 2, human) | machine-cleared (Gate 2, machine-clean, no signature).`);
    }
  }

  return { failures, anyFailure: failures.length > 0 };
}

// `machine-cleared` = «máy thông, KHÔNG chữ ký». Chữ ký người trên hồ sơ này là hai sự
// thật cãi nhau: người đã ký thì status phải là `signed-off` (/signoff đổi cùng lượt).
// Trả thông điệp, hoặc null khi không có mâu thuẫn.
function machineClearedSignoffConflict(contractTxt, evidenceTxt) {
  if (contractTxt == null || evidenceTxt == null) return null;
  const st = (frontmatterField(contractTxt, 'status') || '').trim().toLowerCase();
  const sig = (frontmatterField(evidenceTxt, 'human_signoff') || '').trim();
  if (st !== 'machine-cleared' || !sig) return null;
  return `chữ ký người trên hồ sơ máy-thông — ký thì status phải sang signed-off (human_signoff="${sig}", status=machine-cleared). /signoff đổi status cùng lượt ghi chữ ký.`;
}

module.exports = {
  PASS_FAMILY,
  machineClearedSignoffConflict,
  findAcceptanceConfig,
  resolveConfigKey,
  frontmatterField,
  extractRunIds,
  loadRunLogIds,
  extractVerifierValues,
  findGitRoot,
  isAuthenticVerifier,
  determineEnforce,
  evaluateEvidence,
  evaluateContractWrite,
  vetoGateState,
};
