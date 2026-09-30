#!/usr/bin/env bash
#
# Publish every /path/index.md a second time as /path.md, the guessable form a
# client can build from a URL without fetching the HTML first. Additions, never
# moves: /llms.txt advertises the index.md URLs.
#
# A build step rather than a Netlify redirect because a splat has to be
# terminal, so /articles/*.md is not a pattern Netlify accepts.
set -euo pipefail

PUBLIC="${1:-public}"
[ -d "$PUBLIC" ] || { echo "md-aliases: no such directory: $PUBLIC" >&2; exit 1; }

written=0
skipped=0
while IFS= read -r -d '' src; do
  dir=$(dirname "$src")
  # The site root would write a sibling of the publish directory, not a page.
  [ "$dir" = "$PUBLIC" ] && continue
  dest="${dir}.md"
  if [ -e "$dest" ]; then
    skipped=$((skipped + 1))
    continue
  fi
  cp "$src" "$dest"
  written=$((written + 1))
done < <(find "$PUBLIC" -type f -name index.md -print0)

echo "md-aliases: wrote ${written}, skipped ${skipped} (a file was already there)"
