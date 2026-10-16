#!/usr/bin/env bash
# Checks the entry points an agent uses to find its way around a deployed site.
#
# Every one of these has broken silently before: robots.txt lost its Sitemap
# line to Hugo's generated file, and a site-wide Link header pointed the
# homepage and llms.txt at an index.md that does not exist. Nothing in the
# build fails when they break, so this checks the deployed result.
#
#   automation/agent-access/check.sh                       # production
#   automation/agent-access/check.sh https://deploy-preview-123--<site>.netlify.app

set -Euo pipefail

BASE="${1:-https://qdrant.tech}"
BASE="${BASE%/}"
fail=0

bad() { echo "FAIL: $*"; fail=1; }
ok() { echo "ok:   $*"; }
status() { curl -s -o /dev/null -w '%{http_code}' "$1"; }

# A Link header, when present, must point at something that exists.
check_link_header() {
  local url="$1" target
  target=$(curl -sI "$url" | tr -d '\r' | sed -n 's/^[Ll]ink: *<\([^>]*\)>.*text\/markdown.*/\1/p' | head -1)
  if [ -z "$target" ]; then
    echo "      $url: no Markdown Link header"
    return
  fi
  case "$target" in
    http*) ;;
    /*) target="$BASE$target" ;;
    *) target="${url%/}/$target" ;;
  esac
  [ "$(status "$target")" = 200 ] && ok "Link header on $url resolves" || bad "Link header on $url points at $target, which does not return 200"
}

curl -s "$BASE/robots.txt" | grep -q '^Sitemap:' && ok "robots.txt has a Sitemap line" || bad "robots.txt has no Sitemap line"

llms=$(curl -s -w '\n%{http_code}' "$BASE/llms.txt")
[ "${llms##*$'\n'}" = 200 ] && ok "/llms.txt returns 200" || bad "/llms.txt returns ${llms##*$'\n'}"
llms="${llms%$'\n'*}"

[ "$(curl -s "$BASE/.well-known/llms.txt")" = "$llms" ] && ok "/.well-known/llms.txt serves llms.txt" || bad "/.well-known/llms.txt does not serve llms.txt"

# Links in llms.txt point at production; check the same paths on BASE.
broken=$(grep -oE '\]\(https://qdrant\.tech[^)]*\)' <<<"$llms" | sed -E 's/^\]\(https:\/\/qdrant\.tech//; s/\)$//' | sort -u |
  BASE="$BASE" xargs -P 16 -n 1 sh -c 'c=$(curl -s -o /dev/null -w "%{http_code}" "$BASE$1"); [ "$c" = 200 ] || echo "$c $1"' _) ||
  bad "could not check the links in llms.txt"
if [ -z "$broken" ]; then ok "every link in llms.txt returns 200"; else bad "links in llms.txt that do not return 200:"; echo "$broken" | sed 's/^/      /'; fi

for path in / /llms.txt /documentation/ /documentation/overview/ /articles/; do
  check_link_header "$BASE$path"
done

exit $fail
