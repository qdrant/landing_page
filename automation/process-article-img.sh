#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Please provide a path to the image"
  exit 1
fi

if [ -z "$2" ]; then
  echo "Please provide an article name alias"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "File $1 does not exist"
  exit 1
fi

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"



PATH_TO_IMAGE=$1 \
STATIC_DIRECTORY_NAME="./qdrant-landing/static/articles_data/${2}" \
SOCIAL_PREVIEW_RESOLUTION="1200x630" \
TITLE_RESOLUTION="898x300" \
PREVIEW_RESOLUTION="530x145" \
bash -x ${DIR}/process-img.sh
