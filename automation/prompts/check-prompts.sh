#!/usr/bin/env bash
# Guards the rules that keep documentation prompts working. All of them fail
# silently otherwise, which is why they are checked rather than reviewed.
#
#   1. No prompt body is written inline on a page. Prompt bodies must not reach
#      a built index.md, because those files are consumed by agents and a prompt
#      is an instruction addressed to an agent, so it can displace the question
#      the agent was actually asked. The shortcode's Markdown variant drops the
#      body, so the only way a body reaches index.md is an author pasting it as
#      a fenced block instead of using the shortcode. That is a source-level
#      mistake, so it is caught in the source.
#   2. The Markdown variant of the shortcode still drops the body. Rule 1 is
#      only equivalent to "no body in index.md" while this holds.
#   3. Every prompt's declared `page:` really includes it. The prompt files live
#      in one folder and cannot know who includes them, so the declaration is
#      what the index trusts. This also catches a prompt that is written but
#      never used, which would otherwise appear in the index anyway.
#
# These are all source checks, so no site build is needed and the run takes
# seconds. Pass a built-site directory to additionally verify the real output:
#
#   automation/prompts/check-prompts.sh                 # source checks only
#   automation/prompts/check-prompts.sh qdrant-landing/public   # and the build

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
public_dir="${1:-}"
prompts_dir="$repo_root/qdrant-landing/content/documentation/headless/prompts"
content_dir="$repo_root/qdrant-landing/content"
md_shortcode="$repo_root/qdrant-landing/layouts/shortcodes/prompt.markdown.md"

failures=0

fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

if [[ ! -d "$prompts_dir" ]]; then
  echo "No prompts directory at $prompts_dir; nothing to check."
  exit 0
fi

# --- rule 2: the Markdown variant must not render the prompt body ---
if [[ ! -f "$md_shortcode" ]]; then
  fail "missing $md_shortcode: without it, prompt bodies reach the agent-facing Markdown"
elif grep -qE '\.(RawContent|Content|Inner)\b' "$md_shortcode"; then
  fail "$md_shortcode renders the prompt body; it must emit only the skill pointer"
fi

shopt -s nullglob
checked=0

for file in "$prompts_dir"/*.md; do
  id="$(basename "$file" .md)"
  [[ "$id" == "_index" ]] && continue
  checked=$((checked + 1))

  # First non-empty body line, used as the probe. Front matter is delimited by
  # the first two '---' lines.
  probe="$(awk '
    /^---[[:space:]]*$/ { d++; next }
    d >= 2 && NF { print; exit }
  ' "$file")"

  if [[ -z "$probe" ]]; then
    fail "$id: prompt file has no body"
    continue
  fi

  # --- rule 1: the body must not appear inline anywhere in the content tree ---
  if hits="$(grep -rlF "$probe" --include='*.md' "$content_dir" 2>/dev/null \
             | grep -v "^$prompts_dir/" || true)" && [[ -n "$hits" ]]; then
    fail "$id: prompt body is written inline instead of using the shortcode:"
    printf '        %s\n' $hits >&2
    printf '        Replace it with {{< prompt "%s" >}}\n' "$id" >&2
  fi

  # --- rule 3: the declared page must include the shortcode ---
  page="$(awk -F': *' '
    /^---[[:space:]]*$/ { d++; if (d >= 2) exit; next }
    d == 1 && $1 == "page" { print $2; exit }
  ' "$file" | tr -d '"'"'"'')"

  if [[ -z "$page" ]]; then
    fail "$id: no page: declared in front matter"
    continue
  fi

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

  # --- optional: verify the real built output when a build is available ---
  if [[ -n "$public_dir" ]]; then
    if [[ ! -d "$public_dir" ]]; then
      fail "built site not found at $public_dir"
      public_dir=""
    elif built="$(grep -rlF "$probe" --include='index.md' "$public_dir" 2>/dev/null || true)" \
         && [[ -n "$built" ]]; then
      fail "$id: prompt body reached the agent-facing Markdown output:"
      printf '        %s\n' $built >&2
    fi
  fi
done

if (( failures > 0 )); then
  printf '\n%d prompt check failure(s) across %d prompt(s).\n' "$failures" "$checked" >&2
  exit 1
fi

if [[ -n "$public_dir" ]]; then
  printf 'Prompt checks passed (source and build): %d prompt(s).\n' "$checked"
else
  printf 'Prompt checks passed: %d prompt(s).\n' "$checked"
fi
