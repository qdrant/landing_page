#!/usr/bin/env bash
# Checks the Markdown output of the marketing landing pages, which is assembled
# from front-matter params by themes/qdrant-2024/layouts/partials/md-params.txt
# rather than from page bodies. Run it after a Hugo build.
#
# Usage: automation/check-markdown-output.sh [path/to/public]
set -uo pipefail

PUBLIC=${1:-qdrant-landing/public}
fail=0

PAGES=(
  cloud qdrant-vector-database pricing hybrid-cloud private-cloud edge
  cloud-inference ai-agents advanced-search recommendations
  data-analysis-anomaly-detection rag use-cases healthcare
  enterprise-solutions qdrant-for-startups customers partners benchmarks
  about-us lp/lucene e-commerce hr-tech legal-tech hospitality-and-travel
)

for p in "${PAGES[@]}"; do
  f="$PUBLIC/$p/index.md"
  if [ ! -f "$f" ]; then
    echo "missing: $f"; fail=1; continue
  fi
  words=$(wc -w < "$f" | tr -d ' ')
  # A page that lost its rollup falls back to the title alone, around 30 words.
  if [ "$words" -lt 80 ]; then
    echo "too thin ($words words): $f"; fail=1
  fi
  if grep -q '&#43;\|&lt;\|&gt;\|&amp;' "$f"; then
    echo "HTML-escaped output (needs safeHTML): $f"; fail=1
  fi
  # span and br are the tags marketing copy carries inside params for styling.
  # Page bodies legitimately contain other HTML, same as the docs Markdown output.
  if grep -qE '</?(span|br)[ />]' "$f"; then
    echo "raw inline markup left in copy: $f"; fail=1
  fi
  if grep -qE '\]\(/|\]\(\.\.?/' "$f"; then
    echo "site-relative link not rewritten to https://qdrant.tech/...index.md: $f"; fail=1
  fi
done

# Pricing carries the tier tables; without them the page is worthless to agents.
if ! grep -q '^| Feature |' "$PUBLIC/pricing/index.md" 2>/dev/null; then
  echo "pricing/index.md has no tier comparison table"; fail=1
fi

# Pricing is rendered by a hand-written template (themes/.../pricing/list.markdown.md),
# so a bundle or a tier the template does not know about disappears silently -
# which is how doors-a stayed in the Markdown after the site moved to doors-b.
# Every headline value in the bundles list.html actually renders must reach the
# output. Sources are read relative to the repo root.
PRICING_LAYOUT=qdrant-landing/themes/qdrant-2024/layouts/pricing/list.html
if [ -f "$PRICING_LAYOUT" ] && [ -f "$PUBLIC/pricing/index.md" ]; then
  normalize() { sed -E 's/<[^>]*>/ /g; s/[[:space:]]+/ /g; s/^ //; s/ $//'; }
  out=$(normalize < "$PUBLIC/pricing/index.md")
  for bundle in $(grep -oE '/pricing/[a-z0-9-]+' "$PRICING_LAYOUT" | sort -u); do
    src="qdrant-landing/content${bundle}.md"
    [ -f "$src" ] || continue
    while IFS= read -r value; do
      [ "${#value}" -ge 6 ] || continue
      case "$value" in ''|\'\'|\"\") continue ;; esac
      if ! printf '%s' "$out" | grep -qF "$value"; then
        echo "pricing/index.md is missing copy from ${bundle}: \"$value\""; fail=1
      fi
    done <<EOF
$(grep -hE '^[[:space:]]*(title|pricing|price):[[:space:]]*\S' "$src" \
  | sed -E 's/^[[:space:]]*[a-z]+:[[:space:]]*//; s/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/' \
  | normalize)
EOF
  done
fi

# llms.txt is how an agent finds these pages at all.
listed=$(awk '/^## Pages$/{f=1;next} /^## /{f=0} f && /^- \[/{n++} END{print n+0}' "$PUBLIC/llms.txt")
if [ "$listed" -lt 30 ]; then
  echo "llms.txt lists only $listed landing pages under '## Pages' (expected 30+)"; fail=1
fi

if [ "$fail" -eq 0 ]; then
  echo "Markdown output OK: ${#PAGES[@]} marketing pages, $listed pages listed in llms.txt"
fi
exit "$fail"
