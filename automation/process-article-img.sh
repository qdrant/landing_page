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



ARTICLE_TITLE=${ARTICLE_TITLE:-""}

# If the article title is not provided, try to get it from the article info file
if [ -z "$ARTICLE_TITLE" ]; then
  ARTICLE_INFO_PATH="./qdrant-landing/content/articles/${2}.md"
  if [ -f "$ARTICLE_INFO_PATH" ]; then
    ARTICLE_TITLE=$(cat $ARTICLE_INFO_PATH | grep "title:" | head -n 1 | sed 's/title: //g' | sed 's/"//g')
  fi
fi

if [ -z "$ARTICLE_TITLE" ]; then
  echo "Please provide an article title"
  exit 1
fi


# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

TITLE_TEXT="${ARTICLE_TITLE}" \
SUBTITLE_TEXT="Article" \
PATH_TO_IMAGE=$1 \
STATIC_DIRECTORY_NAME="./qdrant-landing/static/articles_data/${2}" \
SOCIAL_PREVIEW_RESOLUTION="1200x630" \
TITLE_RESOLUTION="898x300" \
PREVIEW_RESOLUTION="530x145" \
bash -x ${DIR}/process-img.sh
