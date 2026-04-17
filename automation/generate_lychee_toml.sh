#!/usr/bin/env bash
# Generates lychee.toml with remap entries derived from Netlify's _redirects file.
#
# Each _redirects entry that maps an internal source path to an internal destination
# is converted into a lychee remap rule so the link checker resolves old URLs to
# their new locations instead of flagging them as broken.
#
# External destinations (https?://) are skipped — the internal link checker only
# checks localhost URLs anyway.
#
# Usage (from repo root):
#   bash automation/generate_lychee_toml.sh > lychee.toml
#
# Or with a custom base URL:
#   bash automation/generate_lychee_toml.sh http://localhost:9000 > lychee.toml

set -euo pipefail

BASE="${1:-http://localhost:1314}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REDIRECTS="${SCRIPT_DIR}/../qdrant-landing/static/_redirects"

if [[ ! -f "$REDIRECTS" ]]; then
  echo "Error: _redirects file not found at ${REDIRECTS}" >&2
  exit 1
fi

echo "# Auto-generated from qdrant-landing/static/_redirects"
echo "# Do not edit manually — regenerate with: bash automation/generate_lychee_toml.sh > lychee.toml"
echo ""
echo "remap = ["

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "${line//[[:space:]]/}" ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue

  # Parse whitespace-separated fields; _rest captures the status code and any trailing content
  read -r src dest _rest <<< "$line"

  # Skip entries whose destination is an external URL
  [[ "$dest" =~ ^https?:// ]] && continue

  if [[ "$src" == *"/*" ]]; then
    # Wildcard entry: /old/path/* -> /new/path/:splat
    prefix="${src%\/*}"                        # strip trailing /*
    repl="${dest//:splat/\$1}"                 # :splat -> $1 (literal, not expanded)
    printf '  "%s%s/(.*) %s%s",\n' "$BASE" "$prefix" "$BASE" "$repl"
  else
    # Simple entry: /old/path -> /new/path
    printf '  "%s%s %s%s",\n' "$BASE" "$src" "$BASE" "$dest"
  fi
done < "$REDIRECTS"

echo "]"
