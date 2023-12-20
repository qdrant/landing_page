#!/bin/bash

set -e
echo "Processing image: $1"
echo "Alias: $2"

bash -x automation/process-img.sh "$1" "./qdrant-landing/static/blog_data/" "$2"