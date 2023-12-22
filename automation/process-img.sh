#!/bin/bash

# This script is used to process images for content suitable for social networks

set -e


# Example usage
#
#
# PATH_TO_IMAGE="./qdrant-landing/static/blog_data/qdrant-v-1-7/preview.png"
# STATIC_DIRECTORY_NAME="./qdrant-landing/static/blog_data/qdrant-v-1-7"


PATH_TO_IMAGE=${PATH_TO_IMAGE:-""}
STATIC_DIRECTORY_NAME=${STATIC_DIRECTORY_NAME:-""}


SOCIAL_PREVIEW_RESOLUTION=${SOCIAL_PREVIEW_RESOLUTION:-"1200x630"}
TITLE_RESOLUTION=${TITLE_RESOLUTION:-"898x300"}
PREVIEW_RESOLUTION=${PREVIEW_RESOLUTION:-"530x145"}


if [ -z "$PATH_TO_IMAGE" ]; then
  echo "Please provide a path to the image"
  exit 1
fi

if [ -z "$STATIC_DIRECTORY_NAME" ]; then
  echo "Please provide an directory name to store images"
  exit 1
fi

IMG_DESTINATION="${STATIC_DIRECTORY_NAME}/preview"
mkdir -p $IMG_DESTINATION

convert "$1" -resize "${SOCIAL_PREVIEW_RESOLUTION}^" -gravity center -extent $SOCIAL_PREVIEW_RESOLUTION "${IMG_DESTINATION}/social_preview.jpg";

convert "$1" -resize "${TITLE_RESOLUTION}^" -gravity center -extent "${TITLE_RESOLUTION}" "${IMG_DESTINATION}/title.jpg";
convert "${IMG_DESTINATION}/title.jpg" -resize "${PREVIEW_RESOLUTION}^" -gravity center -extent "${PREVIEW_RESOLUTION}" "${IMG_DESTINATION}/preview.jpg";

cwebp -q 95 "${IMG_DESTINATION}/title.jpg" -o "${IMG_DESTINATION}/title.webp";
cwebp -q 95 "${IMG_DESTINATION}/preview.jpg" -o "${IMG_DESTINATION}/preview.webp";

