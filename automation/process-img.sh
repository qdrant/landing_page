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

ALLOW_OVERWRITE=${ALLOW_OVERWRITE:-"false"}


if [ -z "$PATH_TO_IMAGE" ]; then
  echo "Please provide a path to the image"
  exit 1
fi

if [ -z "$STATIC_DIRECTORY_NAME" ]; then
  echo "Please provide an directory name to store images"
  exit 1
fi

# Check that PATH_TO_IMAGE exists and have a valid extension (png, jpg, jpeg)
if [ ! -f "$PATH_TO_IMAGE" ]; then
  echo "File $PATH_TO_IMAGE does not exist"
  exit 1
fi

if [[ ! "$PATH_TO_IMAGE" =~ \.(png|jpg|jpeg)$ ]]; then
  echo "File $PATH_TO_IMAGE has invalid extension. Only png, jpg, jpeg are allowed"
  exit 1
fi


IMG_DESTINATION="${STATIC_DIRECTORY_NAME}/preview"
mkdir -p $IMG_DESTINATION

function check_file_exists() {
  local file=$1
  if [ -f "${file}" ] && [ "$ALLOW_OVERWRITE" != "true" ]; then
    echo "$file exists. Please remove it or set ALLOW_OVERWRITE=true"
    exit 0
  fi
}

check_file_exists "${IMG_DESTINATION}/social_preview.jpg"
check_file_exists "${IMG_DESTINATION}/title.jpg"
check_file_exists "${IMG_DESTINATION}/preview.jpg"
check_file_exists "${IMG_DESTINATION}/title.webp"
check_file_exists "${IMG_DESTINATION}/preview.webp"


convert "${PATH_TO_IMAGE}" -resize "${SOCIAL_PREVIEW_RESOLUTION}^" -gravity center -extent $SOCIAL_PREVIEW_RESOLUTION "${IMG_DESTINATION}/social_preview.jpg";
convert "${PATH_TO_IMAGE}" -resize "${TITLE_RESOLUTION}^" -gravity center -extent "${TITLE_RESOLUTION}" "${IMG_DESTINATION}/title.jpg";
convert "${IMG_DESTINATION}/title.jpg" -resize "${PREVIEW_RESOLUTION}^" -gravity center -extent "${PREVIEW_RESOLUTION}" "${IMG_DESTINATION}/preview.jpg";

cwebp -q 95 "${IMG_DESTINATION}/title.jpg" -o "${IMG_DESTINATION}/title.webp";
cwebp -q 95 "${IMG_DESTINATION}/preview.jpg" -o "${IMG_DESTINATION}/preview.webp";

ADD_TO_GIT=${ADD_TO_GIT:-"false"}

if [ "$ADD_TO_GIT" == "true" ]; then
  git add "${IMG_DESTINATION}"
fi


