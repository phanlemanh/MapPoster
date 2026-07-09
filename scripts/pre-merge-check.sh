#!/usr/bin/env bash
# pre-merge-check.sh — CI gate for the Acceptance-Gate Kit.
#
# Usage: pre-merge-check.sh [repo_root] [--slug <slug>]... [--base <ref>]
#
# --base <ref> (or env PRE_MERGE_BASE): the PR base for the T1-escape
# backstop — changed files matching risk_tiers.t3_paths, or falling outside
# t1_skip_globs, require the PR to carry _acceptance/<slug>/ artifacts.
# Without a base the backstop is skipped with a NOTE (wire it in CI, e.g.
# GitHub Actions: --base "origin/$GITHUB_BASE_REF").
#
# For every feature in _acceptance/ whose contract has status
# implemented|verified|signed-off and risk_tier T2|T3:
#   - Gate 1 was recorded: approved_by non-empty, or gate1_skipped: true
#     (the audited escape hatch — NOTEd, not blocked)
#   - evidence-report.md must exist
#   - overall verdict must be PASS
#   - the PASS was actually gated: bypass_used not true (unless a human
#     recorded bypass_ack) and enforcement_mode not off (warn only warns)
#   - human_signoff must be non-empty
#   - the evidence is not STALE: when the report carries verified_commit
#     (the tree the verifier actually ran on), no non-gate file — outside
#     _acceptance/ and not matching risk_tiers.t1_skip_globs — may have
#     changed since that commit (committed or in the working tree). A report
#     without verified_commit (older template) only gets a NOTE.
#   - (recheck: strict) the committed evidence still passes the gate's own
#     L1/L2/L3 bar, re-checked via scripts/recheck-evidence.js + lib/evidence-core.js
#     (the same core the hook runs) — catches a report hand-edited after the
#     write-time hook, or written under ACCEPTANCE_GATE_BYPASS. Default `warn`
#     only advises (so legacy reports from older templates don't block adopters);
#     `off` skips it. Set `recheck: strict` in _acceptance/config.yaml to enforce.
# Exits 1 listing violations; 0 when clean. T1 and draft/approved
# (pre-implementation) features are out of scope.
set -u

# CI evidence re-checker shipped alongside this script (needs ../lib/evidence-core.js).
HERE="$(cd "$(dirname "$0")" && pwd)"
RECHECK="$HERE/recheck-evidence.js"

ROOT="."
SLUGS=()
BASE="${PRE_MERGE_BASE:-}"
while [ $# -gt 0 ]; do
  case "$1" in
    --slug)
      [ $# -ge 2 ] || { echo "pre-merge-check: --slug requires a value" >&2; exit 2; }
      SLUGS+=("$2"); shift 2 ;;
    --base)
      [ $# -ge 2 ] || { echo "pre-merge-check: --base requires a value" >&2; exit 2; }
      BASE="$2"; shift 2 ;;
    *) ROOT="$1"; shift ;;
  esac
done

ACC="$ROOT/_acceptance"
[ -d "$ACC" ] || { echo "pre-merge-check: no _acceptance/ — nothing to check"; exit 0; }

# Which tiers need a signed report before merge — from consumer config when
# present (signoff.required_for), defaulting to T2+T3.
REQUIRED_FOR="T2 T3"
# Committed-evidence re-check mode: strict (block) | warn (advise, default) | off.
# Default warn so adopting the re-check never blocks merges over reports written by
# an OLDER evidence template — a repo opts into strict once its reports meet the bar.
RECHECK_MODE="warn"
# t1_skip_globs (newline-separated): file changes matching these — or living
# under _acceptance/ — do not stale the evidence (docs and gate artifacts).
# t3_paths: critical paths — the T1-escape backstop flags them hardest.
T1_GLOBS=""
T3_PATHS=""
# Human-signoff provenance knobs (signoff.*): require_human_commit demands the
# signature land in its own human-fields-only commit; agent_authors is an
# email-glob blocklist for the signoff commit's author.
REQ_HUMAN_COMMIT=""
AGENT_AUTHORS=""
if [ -f "$ACC/config.yaml" ]; then
  cfg_req="$(sed -n 's/^[[:space:]]*required_for:[[:space:]]*//p' "$ACC/config.yaml" | head -1 | sed 's/[[:space:]]*#.*$//')"
  [ -n "$cfg_req" ] && REQUIRED_FOR="$cfg_req"
  cfg_rc="$(sed -n 's/^[[:space:]]*recheck:[[:space:]]*//p' "$ACC/config.yaml" | head -1 | sed 's/[[:space:]]*#.*$//')"
  case "$cfg_rc" in strict|warn|off) RECHECK_MODE="$cfg_rc" ;; esac
  T1_GLOBS="$(sed -n '/^  t1_skip_globs:/,/^  [a-zA-Z0-9_-]*:/p' "$ACC/config.yaml" \
    | sed -n 's/^[[:space:]]*-[[:space:]]*//p' \
    | sed -e 's/[[:space:]]*#.*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//" -e 's/[[:space:]]*$//')"
  T3_PATHS="$(sed -n '/^  t3_paths:/,/^  [a-zA-Z0-9_-]*:/p' "$ACC/config.yaml" \
    | sed -n 's/^[[:space:]]*-[[:space:]]*//p' \
    | sed -e 's/[[:space:]]*#.*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//" -e 's/[[:space:]]*$//')"
  REQ_HUMAN_COMMIT="$(sed -n 's/^[[:space:]]*require_human_commit:[[:space:]]*//p' "$ACC/config.yaml" | head -1 | sed 's/[[:space:]]*#.*$//' | tr '[:upper:]' '[:lower:]')"
  AGENT_AUTHORS="$(sed -n '/^  agent_authors:/,/^  [a-zA-Z0-9_-]*:/p' "$ACC/config.yaml" \
    | sed -n 's/^[[:space:]]*-[[:space:]]*//p' \
    | sed -e 's/[[:space:]]*#.*$//' -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'\$//" -e 's/[[:space:]]*$//')"
fi
if [ "$RECHECK_MODE" = "warn" ]; then
  # A disabled backstop must be impossible to miss: in warn mode a report
  # hand-edited AFTER the write-time hook only produces a NOTE — it does not
  # block the merge.
  echo "WARNING: committed-evidence re-check is ADVISORY ONLY (recheck: warn) — a hand-edited PASS report will NOT block merge. Set 'recheck: strict' in _acceptance/config.yaml to enforce the backstop."
fi

fm_field() { # <file> <key> — first frontmatter-style "key: value" line, normalized:
  # trailing #-comments, surrounding quotes, and trailing whitespace stripped
  # (mirrors the hook's tolerance for quotes/comments on these lines).
  sed -n "s/^${2}:[[:space:]]*//p" "$1" | head -1 \
    | sed -e 's/[[:space:]]*#.*$//' -e 's/^["'"'"']//' -e 's/["'"'"']$//' -e 's/[[:space:]]*$//'
}

front_field() { # <file> <key> — read <key> from the LEADING --- frontmatter block only
  # (tolerates leading blank lines; a body excerpt cannot poison the read, and a
  # report with NO leading frontmatter yields empty for every field — so verdict
  # reads empty and the feature is rejected rather than trusted).
  awk '!f && NF==0 {next} !f && /^---[[:space:]]*$/ {f=1; next} !f {exit} /^---[[:space:]]*$/ {exit} {print}' "$1" \
    | sed -n "s/^${2}:[[:space:]]*//p" | head -1 \
    | sed -e 's/[[:space:]]*#.*$//' -e 's/^["'"'"']//' -e 's/["'"'"']$//' -e 's/[[:space:]]*$//'
}

match_globs() { # <path> <newline-separated globs> — 0 iff any glob matches
  while IFS= read -r g; do
    [ -n "$g" ] || continue
    # unquoted $g on purpose: case PATTERN matching (globs never fs-expand here)
    case "$1" in $g) return 0 ;; esac
  done <<GLOBS
$2
GLOBS
  return 1
}

stale_files() { # <root> <commit> — files changed since <commit> (incl. working
  # tree) that are neither gate artifacts (_acceptance/) nor t1_skip_globs:
  # i.e. code the pinned evidence no longer covers. Untracked files are
  # invisible to git diff — CI runs on a committed tree, so that is moot there.
  git -C "$1" diff --name-only "$2" -- 2>/dev/null | while IFS= read -r f; do
    case "$f" in _acceptance/*|*/_acceptance/*) continue ;; esac
    match_globs "$f" "$T1_GLOBS" || printf '%s\n' "$f"
  done
}

violations=0

# config.yaml 2-space lint: every kit parser (hook resolveConfigKey, the sed/awk
# here) is line/indent based — a TAB or odd indent silently breaks config:
# resolution (verifier refs stop resolving, executors vanish). Fail loudly instead.
if [ -f "$ACC/config.yaml" ]; then
  cfg_lint="$(awk '
    /\t/ { printf "line %d: TAB character\n", NR; next }
    /^[ ]*[^ #]/ {
      n = match($0, /[^ ]/) - 1
      if (n % 2 == 1) printf "line %d: odd indentation (%d spaces)\n", NR, n
    }
  ' "$ACC/config.yaml")"
  if [ -n "$cfg_lint" ]; then
    echo "VIOLATION [config]: _acceptance/config.yaml breaks the 2-space line schema (kit parsers are indent-based; use scripts/config-patch.mjs for programmatic writes):"
    printf '%s\n' "$cfg_lint" | head -5 | sed 's/^/    /'
    violations=$((violations+1))
  fi
fi

for dir in "$ACC"/*/; do
  [ -d "$dir" ] || continue
  slug="$(basename "$dir")"
  if [ ${#SLUGS[@]} -gt 0 ]; then
    found=0
    for s in "${SLUGS[@]}"; do [ "$s" = "$slug" ] && found=1; done
    [ $found -eq 1 ] || continue
  fi
  contract="$dir/contract.md"
  [ -f "$contract" ] || continue

  tier="$(fm_field "$contract" risk_tier)"
  status="$(fm_field "$contract" status)"

  [ -n "$tier" ] || continue
  case "$REQUIRED_FOR" in *"$tier"*) ;; *) continue ;; esac
  case "$status" in implemented|verified|signed-off) ;; *) continue ;; esac

  # Gate 1 must have been recorded BEFORE any post-approval status: a contract
  # that reached implemented+ with an empty approved_by jumped the gate. The
  # explicit user skip (gate1_skipped: true) is tolerated but NOTEd (audit).
  approved_by="$(front_field "$contract" approved_by)"
  g1skip="$(front_field "$contract" gate1_skipped | tr '[:upper:]' '[:lower:]')"
  if [ -z "$approved_by" ]; then
    case "$g1skip" in
      true|1|yes)
        echo "NOTE [$slug]: gate1_skipped: true — user explicitly skipped Gate 1 (approved_by empty tolerated, audit trail)" ;;
      *)
        echo "VIOLATION [$slug]: status=$status but approved_by is empty and gate1_skipped is not true — Gate 1 approval was never recorded (contract skipped the gate)"
        violations=$((violations+1)); continue ;;
    esac
  fi

  report="$dir/evidence-report.md"
  if [ ! -f "$report" ]; then
    echo "VIOLATION [$slug]: status=$status but no evidence-report.md"
    violations=$((violations+1)); continue
  fi
  # Read report fields from the leading frontmatter ONLY — same scope as the
  # provenance reads below, so a no-fence/offset-fence report can't pass verdict
  # while its provenance reads empty (would otherwise let a bypassed PASS slip).
  verdict="$(front_field "$report" verdict)"
  signoff="$(front_field "$report" human_signoff)"
  if [ "$verdict" != "PASS" ]; then
    echo "VIOLATION [$slug]: verdict=$verdict (must be PASS to merge)"
    violations=$((violations+1)); continue
  fi
  bypass="$(front_field "$report" bypass_used | tr '[:upper:]' '[:lower:]')"
  ack="$(front_field "$report" bypass_ack)"
  case "$bypass" in true|1|yes)
    if [ -n "$ack" ]; then
      echo "NOTE [$slug]: bypass_used=$bypass acknowledged (bypass_ack: $ack) — released with audit trail"
    else
      echo "VIOLATION [$slug]: bypass_used=$bypass — PASS produced with the gate bypassed (ACCEPTANCE_GATE_BYPASS); re-verify without bypass, or record bypass_ack: <name> <date> to consciously release"
      violations=$((violations+1)); continue
    fi ;;
  esac
  enf="$(front_field "$report" enforcement_mode | tr '[:upper:]' '[:lower:]')"
  case "$enf" in
    off) echo "VIOLATION [$slug]: enforcement_mode=off — gate did nothing at write time; re-verify under enforcement: strict before merge"
      violations=$((violations+1)); continue ;;
    warn) echo "WARNING [$slug]: enforcement_mode=warn — gate only warned (not blocked) when this PASS was written; evidence present but not hard-enforced" ;;
  esac
  if [ -z "$signoff" ]; then
    echo "VIOLATION [$slug]: verdict PASS but human_signoff is empty (Gate 2 pending)"
    violations=$((violations+1)); continue
  fi
  # Human-signoff provenance: the signature is text in an AI-writable file —
  # the git history of the commit that INTRODUCED it is the only
  # machine-checkable attribution. Standard flow: verify commits the
  # machine-written report first; the reviewer lands the signature in its own
  # commit touching only human-owned lines (human_signoff / human_override /
  # verdict upgrade / bypass_ack). Comment-only and blank +/- lines tolerated.
  if [ "$REQ_HUMAN_COMMIT" = "true" ] || [ -n "$AGENT_AUTHORS" ]; then
    if ! command -v git >/dev/null 2>&1 || ! git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
      echo "NOTE [$slug]: signoff provenance unverifiable — $ROOT is not a git repo here (signoff.require_human_commit/agent_authors set)"
    else
      rel_report="${report#"$ROOT"/}"
      sign_commit="$(git -C "$ROOT" log --format=%H -S"human_signoff: $signoff" -- "$rel_report" 2>/dev/null | head -1)"
      [ -z "$sign_commit" ] && sign_commit="$(git -C "$ROOT" log --format=%H -S"$signoff" -- "$rel_report" 2>/dev/null | head -1)"
      if [ -z "$sign_commit" ]; then
        if [ "$REQ_HUMAN_COMMIT" = "true" ]; then
          echo "VIOLATION [$slug]: human_signoff present but not found in any commit of $rel_report — the reviewer must COMMIT the signoff themselves (signoff.require_human_commit)"
          violations=$((violations+1)); continue
        fi
      else
        if [ -n "$AGENT_AUTHORS" ]; then
          author="$(git -C "$ROOT" log -1 --format=%ae "$sign_commit" 2>/dev/null)"
          hit=""
          while IFS= read -r g; do
            [ -n "$g" ] || continue
            case "$author" in $g) hit="$g" ;; esac
          done <<GLOBS2
$AGENT_AUTHORS
GLOBS2
          if [ -n "$hit" ]; then
            echo "VIOLATION [$slug]: signoff commit $sign_commit authored by \"$author\" — matches signoff.agent_authors blocklist ($hit); Gate 2 must be signed by a human identity"
            violations=$((violations+1)); continue
          fi
        fi
        if [ "$REQ_HUMAN_COMMIT" = "true" ]; then
          nonhuman="$(git -C "$ROOT" show --format= --unified=0 "$sign_commit" -- "$rel_report" 2>/dev/null \
            | grep -E '^[+-]' | grep -vE '^(\+\+\+|---)' \
            | grep -vE '^[+-][[:space:]]*((human_signoff|human_override|verdict|bypass_ack)[[:space:]]*:|#|$)')"
          if [ -n "$nonhuman" ]; then
            echo "VIOLATION [$slug]: the commit introducing human_signoff ($sign_commit) also edits the report body — the Gate-2 signature must land in its own human-fields-only commit (signoff.require_human_commit). Offending lines:"
            printf '%s\n' "$nonhuman" | head -5 | sed 's/^/    /'
            violations=$((violations+1)); continue
          fi
        fi
      fi
    fi
  fi
  # Stale-evidence check: the PASS certifies the tree at verified_commit. Any
  # non-gate file changed since then (committed or working tree) means the code
  # being merged is NOT the code that was verified — re-verify, don't ride old
  # evidence. Reports without the field (older template) and clones where the
  # commit is unreachable (rebase/squash/shallow fetch) only get a NOTE.
  vc="$(front_field "$report" verified_commit)"
  if [ -z "$vc" ]; then
    echo "NOTE [$slug]: report has no verified_commit (older template) — evidence is not pinned to a commit; code drift since verify is NOT machine-checked. Re-verify to pin."
  elif ! command -v git >/dev/null 2>&1 || ! git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
    echo "NOTE [$slug]: verified_commit present but $ROOT is not a git repo here — staleness unverifiable"
  elif ! git -C "$ROOT" rev-parse --quiet --verify "$vc^{commit}" >/dev/null 2>&1; then
    echo "NOTE [$slug]: verified_commit $vc not found in this clone (rebase/squash or shallow fetch?) — staleness unverifiable; re-verify to re-pin"
  else
    stale="$(stale_files "$ROOT" "$vc")"
    if [ -n "$stale" ]; then
      echo "VIOLATION [$slug]: evidence is stale — code changed after verify (verified_commit $vc); re-run verify before merge. Changed:"
      printf '%s\n' "$stale" | head -10 | sed 's/^/    /'
      violations=$((violations+1)); continue
    fi
  fi
  # run-log presence: the re-check below reconciles report run_ids against
  # _acceptance/<slug>/run-log.jsonl (machine-written at verify). A missing log
  # (older verify flow) is tolerated but must be visible.
  if [ ! -f "$dir/run-log.jsonl" ]; then
    echo "NOTE [$slug]: no run-log.jsonl (older verify flow) — run_id provenance is not machine-logged; report run_ids are unreconciled. Re-verify to generate the log."
  fi
  # observed (schema v2): older reports with screenshot evidence never faced the
  # inspected-frames bar — tolerated, but must be visible.
  sv="$(front_field "$report" schema_version)"
  case "$sv" in (*[!0-9]*|'') sv=1 ;; esac
  if [ "$sv" -lt 2 ] \
     && grep -qiE '^[[:space:]]*screenshot[[:space:]]*[:=]' "$report" \
     && ! grep -qiE '^[[:space:]]*observed[[:space:]]*[:=]' "$report"; then
    echo "NOTE [$slug]: schema v$sv report has screenshot evidence without observed: — frame inspection was not machine-enforced for this report. Re-verify with template v2 to enforce."
  fi
  # Re-verify the COMMITTED evidence with the same core the hook runs — catches a
  # report hand-edited after the write-time hook, or written under bypass.
  if [ "$RECHECK_MODE" != off ]; then
    if [ -f "$RECHECK" ] && command -v node >/dev/null 2>&1; then
      recheck_out="$(node "$RECHECK" "$report" 2>&1)"; rc=$?
      if [ "$rc" -eq 1 ]; then
        if [ "$RECHECK_MODE" = strict ]; then label="VIOLATION"; else label="NOTE"; fi
        echo "$label [$slug]: committed evidence fails re-check (recheck: $RECHECK_MODE):"
        printf '%s\n' "$recheck_out" | sed 's/^/    /'
        if [ "$RECHECK_MODE" = strict ]; then violations=$((violations+1)); continue; fi
      elif [ "$rc" -ne 0 ]; then
        echo "NOTE [$slug]: evidence re-check unavailable (exit $rc) — ${recheck_out:-skipped}"
      fi
    else
      echo "NOTE [$slug]: evidence re-check not vendored (recheck-evidence.js/node missing) — committed-evidence bar NOT enforced"
    fi
  fi
  echo "OK [$slug]: $verdict, signed off by $signoff"
done

# ── T1-escape backstop (PR-level) ────────────────────────────────────────────
# T1 is self-declared at Phase 0 from EXPECTED paths — nothing stops a "docs
# typo" PR from also touching src/billing/. With a PR base: changed files
# matching t3_paths — or falling outside t1_skip_globs — require the PR to
# carry _acceptance/<slug>/ artifacts. (Under the stale-evidence rule every
# gated PR re-verifies, so its diff always includes gate artifacts.) There is
# no path→slug mapping, so "carries artifacts" means any _acceptance/ change;
# the per-slug checks above judge their quality.
if [ -z "$BASE" ]; then
  echo "NOTE: T1-escape backstop skipped — no PR base given (pass --base <ref> or set PRE_MERGE_BASE; GitHub Actions: --base \"origin/\$GITHUB_BASE_REF\")"
elif ! command -v git >/dev/null 2>&1 || ! git -C "$ROOT" rev-parse --git-dir >/dev/null 2>&1; then
  echo "NOTE: T1-escape backstop skipped — $ROOT is not a git repo here"
else
  BASE_SHA="$(git -C "$ROOT" rev-parse --quiet --verify "$BASE^{commit}" 2>/dev/null || true)"
  [ -z "$BASE_SHA" ] && BASE_SHA="$(git -C "$ROOT" rev-parse --quiet --verify "origin/$BASE^{commit}" 2>/dev/null || true)"
  if [ -z "$BASE_SHA" ]; then
    echo "NOTE: T1-escape backstop skipped — base \"$BASE\" not resolvable in this clone"
  else
    changed="$(git -C "$ROOT" diff --name-only "$BASE_SHA...HEAD" -- 2>/dev/null)"
    gate_touched=0; t3_hits=""; nont1_hits=""
    while IFS= read -r f; do
      [ -n "$f" ] || continue
      case "$f" in _acceptance/*|*/_acceptance/*) gate_touched=1; continue ;; esac
      if [ -n "$T3_PATHS" ] && match_globs "$f" "$T3_PATHS"; then
        t3_hits="${t3_hits}${f}"$'\n'
      elif ! match_globs "$f" "$T1_GLOBS"; then
        nont1_hits="${nont1_hits}${f}"$'\n'
      fi
    done <<CHANGED
$changed
CHANGED
    if [ "$gate_touched" -eq 0 ]; then
      if [ -n "$t3_hits" ]; then
        echo "VIOLATION [PR]: T3 paths (t3_paths) changed but the PR carries NO _acceptance/<slug>/ artifacts — critical code changed without the gate. Changed:"
        printf '%s' "$t3_hits" | head -10 | sed 's/^/    /'
        violations=$((violations+1))
      elif [ -n "$nont1_hits" ]; then
        echo "VIOLATION [PR]: non-T1 files changed (outside t1_skip_globs) but the PR carries NO _acceptance/<slug>/ artifacts — declare T1 honestly (t1_skip_globs) or run the gate. Changed:"
        printf '%s' "$nont1_hits" | head -10 | sed 's/^/    /'
        violations=$((violations+1))
      fi
    fi
  fi
fi

if [ "$violations" -gt 0 ]; then
  echo "pre-merge-check: $violations violation(s) — merge blocked"
  exit 1
fi
echo "pre-merge-check: clean"
exit 0
