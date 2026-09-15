#!/usr/bin/env bash
# Verifies that every agent skill this repository points at is actually
# published on skills.qdrant.tech.
#
# Why this needs its own check. A skill reference breaks without anything in
# this repository changing: a skill gets renamed or unpublished in qdrant/skills
# and the link here rots in place. It is also easy to get wrong when writing,
# for two reasons that have each already produced a 404:
#
#   - A path that exists in the qdrant/skills repository is not automatically
#     served. The repository is not the source of truth; llms.txt is.
#   - Meta skills live under meta/, as in meta/qdrant-advisor, not at the root
#     alongside the domain skills.
#
# Two kinds of reference are checked, because both exist and they can disagree:
#
#   1. `skill:` in the front matter of a prompt, which the shortcode turns into
#      a link and which the prompt index renders as a column.
#   2. Any https://skills.qdrant.tech/<path>/SKILL.md URL written in the content
#      tree, which includes the URLs inside prompt bodies that tell the agent
#      what to read, and ordinary prose links in the documentation.
#
# This check reaches the network, unlike check-prompts.sh, which is why it is a
# separate script and a separate CI job: skills.qdrant.tech being unreachable
# must not turn a documentation pull request red. An unreachable catalog skips
# the run; only a catalog that answers and does not list a path fails it.
#
#   automation/prompts/check-skill-links.sh

set -Eeuo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
content_dir="$repo_root/qdrant-landing/content"
prompts_dir="$content_dir/documentation/headless/prompts"
catalog_url="${SKILLS_CATALOG_URL:-https://skills.qdrant.tech/llms.txt}"
base_url="https://skills.qdrant.tech"

failures=0
fail() {
  printf 'FAIL: %s\n' "$1" >&2
  failures=$((failures + 1))
}

# --- collect references, as "<skill path>\t<where it came from>" ---

refs="$(
  # 1. skill: values in prompt front matter.
  if [[ -d "$prompts_dir" ]]; then
    for file in "$prompts_dir"/*.md; do
      [[ -f "$file" ]] || continue
      awk -v src="${file#"$repo_root"/}" -F': *' '
        /^---[[:space:]]*$/ { d++; if (d >= 2) exit; next }
        d == 1 && $1 == "skill" {
          gsub(/^[ \t"'"'"']+|[ \t"'"'"']+$/, "", $2)
          if ($2 != "") print $2 "\t" src " (skill: front matter)"
          exit
        }
      ' "$file"
    done
  fi

  # 2. SKILL.md URLs written anywhere in the content tree. The path is
  #    everything between the host and the /SKILL.md suffix.
  grep -roE "https://skills\.qdrant\.tech/[A-Za-z0-9._/-]+/SKILL\.md" \
    --include='*.md' "$content_dir" 2>/dev/null \
    | sed -E "s|^${repo_root}/||" \
    | awk -F':' '{ src = $1; url = $0; sub(/^[^:]*:/, "", url)
        sub(/^https:\/\/skills\.qdrant\.tech\//, "", url); sub(/\/SKILL\.md$/, "", url)
        print url "\t" src " (SKILL.md link)" }' || true
)"

if [[ -z "$refs" ]]; then
  echo "No agent skill references found; nothing to check."
  exit 0
fi

# --- fetch the catalog of what is actually served ---

catalog=""
if ! catalog="$(curl -fsS --max-time 30 "$catalog_url" 2>/dev/null)" || [[ -z "$catalog" ]]; then
  echo "Skipping: could not reach $catalog_url."
  echo "This check is advisory and does not fail on an unreachable catalog."
  exit 0
fi

# --- check each distinct path ---

checked=0
while IFS=$'\t' read -r path sources; do
  [[ -n "$path" ]] || continue
  checked=$((checked + 1))
  url="$base_url/$path/SKILL.md"

  if grep -qF "$url" <<<"$catalog"; then
    continue
  fi

  # The catalog can lag a freshly published skill, so a miss is confirmed with
  # a request before it is reported. Only a path that is absent from both the
  # catalog and the live site is a failure.
  status="$(curl -fsS -o /dev/null -w '%{http_code}' --max-time 30 "$url" 2>/dev/null || true)"
  if [[ "$status" == "200" ]]; then
    printf 'note: %s is served but missing from the catalog at %s\n' "$path" "$catalog_url"
    continue
  fi

  fail "$path is not a published skill (${url} returned ${status:-no response})"
  printf '        Referenced by: %s\n' "$sources" >&2
  printf '        Published skills are listed at %s\n' "$catalog_url" >&2
  printf '        Meta skills are under meta/, as in meta/qdrant-advisor.\n' >&2
done < <(
  # Distinct paths, with their sources joined so one bad path reports once.
  sort -u <<<"$refs" | awk -F'\t' '
    { if ($1 in seen) seen[$1] = seen[$1] ", " $2; else { seen[$1] = $2; order[++n] = $1 } }
    END { for (i = 1; i <= n; i++) print order[i] "\t" seen[order[i]] }
  '
)

if (( failures > 0 )); then
  printf '\n%d broken skill link(s) across %d referenced skill(s).\n' "$failures" "$checked" >&2
  exit 1
fi

printf 'Skill link checks passed: %d referenced skill(s).\n' "$checked"
