'use strict';
/**
 * evidence-core.js — the SINGLE SOURCE OF TRUTH for the acceptance gate's
 * evidence validation (L1 SHAPE, L1 CONSISTENCY, L2 SUBSTANCE, L2 OBSERVED, L3 JUDGMENT).
 *
 * Two callers share this so they cannot drift:
 *   - hooks/acceptance-evidence-gate.js — PreToolUse, validates at WRITE time.
 *   - scripts/recheck-evidence.js       — CI, re-validates the COMMITTED report
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
  const line = fm[1].match(new RegExp('^' + key + '\\s*[:=]\\s*(.*)$', 'mi'));
  if (!line) return null;
  return line[1]
    .replace(/^#.*$/, '')      // comment-only value ("# placeholder") = empty
    .replace(/\s+#.*$/, '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
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
// transition source. Statuses outside the lifecycle names are ignored.
function evaluateContractWrite(newPayload, oldPayload) {
  const failures = [];
  const status = (frontmatterField(newPayload, 'status') || '').toLowerCase();
  const approvedBy = frontmatterField(newPayload, 'approved_by') || '';
  const gate1Skipped = /^(true|yes|1)$/i.test(frontmatterField(newPayload, 'gate1_skipped') || '');
  const oldStatus = oldPayload == null ? null : (frontmatterField(oldPayload, 'status') || '').toLowerCase();

  if (!approvedBy && !gate1Skipped) {
    if (status === 'approved' || status === 'signed-off') {
      failures.push(`status: ${status} with empty approved_by — Gate 1 approval not recorded. Fill approved_by (+ approved_at); only when the user explicitly skips Gate 1, record gate1_skipped: true (audited, pre-merge NOTEs it).`);
    }
    if ((oldStatus === null || oldStatus === 'draft') && (status === 'implemented' || status === 'verified')) {
      failures.push(`status: ${oldStatus === null ? '(new file)' : 'draft'} -> ${status} skips Gate 1 — approved_by is empty and gate1_skipped is not true. Lifecycle: draft -> approved (Gate 1) -> implemented -> verified -> signed-off (Gate 2).`);
    }
  }
  return { failures, anyFailure: failures.length > 0 };
}

module.exports = {
  PASS_FAMILY,
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
};
