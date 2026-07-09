#!/usr/bin/env node
'use strict';
/**
 * recheck-evidence.js — CI re-verification of a COMMITTED evidence-report.md.
 *
 * The write-time hook only sees agent edits; a report hand-edited afterwards (or
 * written under ACCEPTANCE_GATE_BYPASS) never faced the gate. This re-applies the
 * EXACT evidence bar (lib/evidence-core.js — same code the hook runs) to the
 * committed file, at strict, regardless of the repo's enforcement mode. So a
 * committed PASS that lacks real evidence, carries a nonzero exit, a manual
 * verifier, or an unresolved UNCERTAIN cannot reach merge.
 *
 * Usage: recheck-evidence.js <evidence-report.md>
 *   exit 0 — not a PASS-family report (nothing to re-verify) OR evidence holds
 *   exit 1 — committed PASS report fails the evidence bar (failures on stderr)
 *   exit 2 — usage / unreadable file
 */

const fs = require('fs');
const path = require('path');
let core;
try {
  core = require(path.join(__dirname, '..', 'lib', 'evidence-core.js'));
} catch (e) {
  process.stderr.write(`recheck-evidence: cannot load lib/evidence-core.js (${e.message}) — vendor lib/ next to scripts/\n`);
  process.exit(2);
}

const reportPath = process.argv[2];
if (!reportPath) {
  process.stderr.write('recheck-evidence: usage: recheck-evidence.js <evidence-report.md>\n');
  process.exit(2);
}

let payload;
try {
  payload = fs.readFileSync(reportPath, 'utf8');
} catch (e) {
  process.stderr.write(`recheck-evidence: cannot read ${reportPath}: ${e.message}\n`);
  process.exit(2);
}

// Only a PASS-family verdict carries an evidence bar to re-check.
if (!core.determineEnforce(payload)) process.exit(0);

const fileDir = path.dirname(path.resolve(reportPath));
const configPath = core.findAcceptanceConfig(fileDir);
let configText = null;
if (configPath) {
  try { configText = fs.readFileSync(configPath, 'utf8'); } catch (_) {}
}

const r = core.evaluateEvidence(payload, { fileDir, configText, configPath });
if (!r.anyFailure) process.exit(0);

const out = [`recheck-evidence: ${reportPath} — committed PASS report fails the evidence bar:`];
for (const m of r.missing) out.push(`  L1 SHAPE       x ${m}`);
if (r.consistencyFailure) out.push(`  L1 CONSISTENCY x ${r.consistencyFailure}`);
for (const a of r.authFailures) out.push(`  L2 SUBSTANCE   x ${a}`);
if (r.judgmentFailure) out.push(`  L3 JUDGMENT    x ${r.judgmentFailure}`);
if (r.runLogFailure) out.push(`  L2 PROVENANCE  x ${r.runLogFailure}`);
for (const o of r.observedFailures || []) out.push(`  L2 OBSERVED    x ${o}`);
process.stderr.write(out.join('\n') + '\n');
process.exit(1);
