#!/usr/bin/env bash
# Guards the two rules that keep documentation prompts working. Both fail
# silently otherwise, which is why they are checked rather than reviewed.
#
#   1. No prompt body reaches a built index.md. Those files are consumed by
#      agents, and a prompt is an instruction addressed to an agent, so it can
#      displace the question the agent was actually asked. Writing a prompt as a
#      plain fenced block instead of using the shortcode is how this breaks.
#   2. Every prompt's declared `page:` really includes it. The prompt files live
#      in one folder and cannot know who includes them, so the declaration is
#      what the index trusts. This also catches a prompt that is written but
#      never used, which would otherwise appear in the index anyway.
#
# Usage: automation/prompts/check-prompts.sh [built-site-dir]
# Default built-site-dir is qdrant-landing/public.

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
public_dir="${1:-$repo_root/qdrant-landing/public}"
prompts_dir="$repo_root/qdrant-landing/content/documentation/headless/prompts"
content_dir="$repo_root/qdrant-landing/content"

failures=0

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

if [[ ! -d "$prompts_dir" ]]; then
  echo "No prompts directory at $prompts_dir; nothing to check."
  exit 0
fi

if [[ ! -d "$public_dir" ]]; then
  fail "built site not found at $public_dir (run hugo first, or pass the directory)"
  exit 1
fi

shopt -s nullglob
prompt_files=("$prompts_dir"/*.md)
checked=0

for file in "${prompt_files[@]}"; do
  id="$(basename "$file" .md)"
  [[ "$id" == "_index" ]] && continue
  checked=$((checked + 1))

  # --- rule 1: the body must not appear in any built index.md ---
  # Use the first non-empty body line as the probe. Front matter is delimited
  # by the first two '---' lines.
  probe="$(awk '
    /^---[[:space:]]*$/ { d++; next }
    d >= 2 && NF { print; exit }
  ' "$file")"

  if [[ -z "$probe" ]]; then
    fail "$id: prompt file has no body"
    continue
  fi

  if hits="$(grep -rlF "$probe" --include='index.md' "$public_dir" 2>/dev/null)" && [[ -n "$hits" ]]; then
    fail "$id: prompt body reached the agent-facing Markdown output:"
    printf '        %s\n' $hits >&2
    printf '        Use {{< prompt "%s" >}} rather than a fenced block.\n' "$id" >&2
  fi

  # --- rule 2: the declared page must include the shortcode ---
  page="$(awk -F': *' '
    /^---[[:space:]]*$/ { d++; if (d >= 2) exit; next }
    d == 1 && $1 == "page" { print $2; exit }
  ' "$file" | tr -d '"'"'"'')"

  if [[ -z "$page" ]]; then
    fail "$id: no page: declared in front matter"
    continue
  fi

  # /documentation/foo/bar/ -> content/documentation/foo/bar.md or .../bar/_index.md
  rel="${page#/}"
  rel="${rel%/}"
  src=""
  for candidate in "$content_dir/$rel.md" "$content_dir/$rel/_index.md"; do
    [[ -f "$candidate" ]] && { src="$candidate"; break; }
  done

  if [[ -z "$src" ]]; then
    fail "$id: declared page $page has no source file under content/"
    continue
  fi

  if ! grep -qF "prompt \"$id\"" "$src" && ! grep -qF "prompt '$id'" "$src"; then
    fail "$id: declared page $page does not include it"
    printf '        Expected {{< prompt "%s" >}} in %s\n' "$id" "${src#"$repo_root"/}" >&2
  fi
done

if (( failures > 0 )); then
  printf '\n%d prompt check failure(s) across %d prompt(s).\n' "$failures" "$checked" >&2
  exit 1
fi

printf 'Prompt checks passed: %d prompt(s).\n' "$checked"
