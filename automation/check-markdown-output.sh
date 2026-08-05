#!/usr/bin/env bash
# Checks the Markdown output of the marketing landing pages, which is assembled
# from front-matter params by themes/qdrant-2024/layouts/partials/md-params.txt
# rather than from page bodies. Run it after a Hugo build.
#
# Usage: automation/check-markdown-output.sh [path/to/public]
set -uo pipefail

PUBLIC=${1:-qdrant-landing/public}
fail=0

# The pages to check are whichever ones have a Markdown template, so adding or
# removing a page needs no edit here. A list.markdown.md means the section
# landing page; a single.markdown.md means the pages in that section that build
# themselves (build.render: always), which is how the industry pages and the RAG
# evaluation guide work. The URL comes from the page's own url: override, or the
# section name when there isn't one.
#
# Still title-only, deliberately, and so absent from this list: /contact-us and
# /subscribe are forms with nothing to render. /learn has its own agent page
# (PR #2462).
PAGES=()
while IFS= read -r page; do PAGES+=("$page"); done < <(python3 - <<'PY'
import glob, os, re
LAYOUTS = "qdrant-landing/themes/qdrant-2024/layouts"
CONTENT = "qdrant-landing/content"

def front_matter(path):
    try:
        text = open(path).read()
    except OSError:
        return ""
    m = re.match(r"^---\n(.*?)\n---", text, re.S)
    return m.group(1) if m else ""

def own_render(fm):
    """render: from the page's own build block, ignoring any cascade block."""
    m = re.search(r"^build:\n((?:[ \t]+.*\n)+)", fm + "\n", re.M)
    if not m:
        return ""
    r = re.search(r"render:\s*(\w+)", m.group(1))
    return r.group(1) if r else ""

def url(fm, fallback):
    m = re.search(r'^url:\s*"?([^"\n]+)"?', fm, re.M)
    return (m.group(1) if m else fallback).strip().strip("/")

pages = []
for template in sorted(glob.glob(f"{LAYOUTS}/*/list.markdown.md")):
    section = os.path.basename(os.path.dirname(template))
    fm = front_matter(f"{CONTENT}/{section}/_index.md")
    if own_render(fm) == "never":
        continue  # a container for other pages, not a page itself
    pages.append(url(fm, section))
for template in sorted(glob.glob(f"{LAYOUTS}/*/single.markdown.md")):
    section = os.path.basename(os.path.dirname(template))
    for page in sorted(glob.glob(f"{CONTENT}/{section}/*.md")):
        if page.endswith("_index.md"):
            continue
        fm = front_matter(page)
        if own_render(fm) == "always":
            pages.append(url(fm, os.path.basename(page)[:-3]))
print("\n".join(p for p in dict.fromkeys(pages) if p))
PY
)

if [ "${#PAGES[@]}" -lt 20 ]; then
  echo "derived only ${#PAGES[@]} pages to check; the layout or content layout changed"
  exit 1
fi

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

# Customers is a table of every client, also hand-written, so a truncated or
# dropped table has to fail rather than quietly shrink the page.
clients_src=qdrant-landing/content/customers/clients/_index.md
if [ -f "$clients_src" ] && [ -f "$PUBLIC/customers/index.md" ]; then
  want=$(grep -cE '^  - id: ' "$clients_src")
  got=$(( $(grep -cE '^\| ' "$PUBLIC/customers/index.md") - 2 ))  # minus header and divider
  if [ "$want" -ne "$got" ]; then
    echo "customers/index.md lists $got clients, content has $want"; fail=1
  fi
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
