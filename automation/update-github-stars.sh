#!/bin/bash

set -e

STAR_COUNT=$(curl -s https://api.github.com/repos/qdrant/qdrant | jq '.stargazers_count')

if [ -z "$STAR_COUNT" ]; then
    echo "Failed to get the star count"
    exit 1
fi

# humanize the star count like 18322 -> 18.3k
# and if star count is bigger than 1000, then add k at the end
STAR_COUNT=$(echo $STAR_COUNT | awk '{ if($1 > 1000) { printf "%.1fk\n", $1/1000 } else { print $1 } }' | tr ',' '.')

echo "Current star count: $STAR_COUNT"

# Update the star count in the markdown file
echo "Updating the star count in the hero.md file"
sed -i "" "s/.*stars.*$/  stars: $STAR_COUNT/g" ./qdrant-landing/content/headless/main/hero.md
