#!/bin/bash

# Ensure the SEGMENT_WRITE_KEY environment variable is set
if [ -z "$SEGMENT_WRITE_KEY" ]; then
  echo "Error: SEGMENT_WRITE_KEY environment variable is not set."
  exit 1
fi

# Print the new key for debugging
echo "Adding SEGMENT_WRITE_KEY..."

# Backup the original config.toml file
cp ./qdrant-landing/config.toml ./qdrant-landing/config.toml.bak

# Use awk to remove any existing SEGMENT_WRITE_KEY line and add the new one at the end of [params]
awk -v new_key="$SEGMENT_WRITE_KEY" '
/\[params\]/ { print; in_params = 1; next }
in_params && /^  SEGMENT_WRITE_KEY = / { next }
in_params && /^[ \t]*$/ { in_params = 0; print "  SEGMENT_WRITE_KEY = \"" new_key "\""; }
{ print }
' ./qdrant-landing/config.toml > ./qdrant-landing/config.toml.tmp && mv ./qdrant-landing/config.toml.tmp ./qdrant-landing/config.toml

# Check if the addition was successful
if grep -q "SEGMENT_WRITE_KEY = \"${SEGMENT_WRITE_KEY}\"" ./qdrant-landing/config.toml; then
  echo "Updated SEGMENT_WRITE_KEY in ./qdrant-landing/config.toml."
else
  echo "Failed to update SEGMENT_WRITE_KEY in ./qdrant-landing/config.toml."
  exit 1
fi

# Remove the backup file
rm ./qdrant-landing/config.toml.bak

# Optional: Display the updated file for verification
echo "Updated config.toml content:"
grep "SEGMENT_WRITE_KEY" ./qdrant-landing/config.toml
