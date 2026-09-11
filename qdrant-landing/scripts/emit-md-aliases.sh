#!/usr/bin/env bash
#
# Publish every /path/index.md a second time as /path.md.
#
# Hugo writes the Markdown output format beside the HTML it belongs to, so a
# page at /articles/foo/ gets /articles/foo/index.md. That is what the llms.txt
# convention prescribes for directory-style URLs, and it is what /llms.txt
# advertises, so it stays exactly as it is. These are additions, never moves.
#
# The reason to also publish /articles/foo.md is that it is the GUESSABLE form.
# Every other documentation site we compared exposes the markdown of a page by
# swapping its extension, so a client holding only a URL can construct it
# without first fetching the HTML to read <link rel="alternate">. Supporting
# both costs a copy of files that are already tiny (~7.6 MB against a 1.4 GB
# build, 0.5%) and changes nothing about how anything renders.
#
# Deliberately a build step rather than a Netlify redirect: a splat has to be
# terminal, so /articles/*.md is not a pattern Netlify accepts, and a rule we
# cannot verify locally is worse than a copy we can.
set -euo pipefail

PUBLIC="${1:-public}"
[ -d "$PUBLIC" ] || { echo "md-aliases: no such directory: $PUBLIC" >&2; exit 1; }

written=0
skipped=0
while IFS= read -r -d '' src; do
  dir=$(dirname "$src")
  # The site root would produce a sibling of the publish directory, not a page.
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
