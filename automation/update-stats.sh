#!/bin/bash

set -e

STAR_COUNT=$(curl -s https://api.github.com/repos/qdrant/qdrant | jq '.stargazers_count')
DISCORD_COUNT=$(curl -s https://discord.com/api/v9/invites/qdrant?with_counts=true&with_expiration=true)
DISCORD_COUNT=$(echo $DISCORD_COUNT | jq '.approximate_member_count')

if [ -z "$STAR_COUNT" ]; then
    echo "Failed to get the star count"
    exit 1
fi

# humanize the stats count like 18322 -> 18.3k
# and if star count is bigger than 1000, then add k at the end
STAR_COUNT=$(echo $STAR_COUNT | awk '{ if($1 > 1000) { printf "%.1fk\n", $1/1000 } else { print $1 } }' | tr ',' '.')
DISCORD_COUNT=$(echo $DISCORD_COUNT | awk '{ if($1 > 1000) { printf "%.1fk\n", $1/1000 } else { print $1 } }' | tr ',' '.')

# Update the star count in the markdown file
echo "Current star count: $STAR_COUNT"
echo "Updating the star count in the stats.md file"
sed -i "s/.*githubStars.*$/  githubStars: $STAR_COUNT/g" ./qdrant-landing/content/headless/stats.md
echo "Current discord count: $DISCORD_COUNT"
echo "Updating the discord count in the stats.md file"
sed -i "s/.*discordMembers.*$/  discordMembers: $DISCORD_COUNT/g" ./qdrant-landing/content/headless/stats.md
