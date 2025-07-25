#!/bin/bash

# This script is used to process images for content suitable for social networks

set -e


# Example usage
#
#
# PATH_TO_IMAGE="./qdrant-landing/static/blog/qdrant-v-1-7/preview.png"
# STATIC_DIRECTORY_NAME="./qdrant-landing/static/blog/qdrant-v-1-7"


SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

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

MODIFICATION_TIME=$(stat -c %Y "$PATH_TO_IMAGE")

IMG_DESTINATION="${STATIC_DIRECTORY_NAME}/preview"
mkdir -p $IMG_DESTINATION

function check_file_exists_and_new() {
  local file=$1
  if [ -f "${file}" ] && [ "$ALLOW_OVERWRITE" != "true" ]; then
    if [ $MODIFICATION_TIME -le $(stat -c %Y "${file}") ]; then
      echo "$file exists and newer than the source image. Please remove it or set ALLOW_OVERWRITE=true"
      exit 0
    fi
  fi

  abs_path_file=$(realpath "${file}")
  abs_path_to_image=$(realpath "${PATH_TO_IMAGE}")


  if [ "${abs_path_file}" == "${abs_path_to_image}" ]; then
    echo "Source image and destination image are the same. Please provide a different destination"
    exit 1
  fi
}

check_file_exists_and_new "${IMG_DESTINATION}/social_preview.jpg"
check_file_exists_and_new "${IMG_DESTINATION}/title.jpg"
check_file_exists_and_new "${IMG_DESTINATION}/preview.jpg"
check_file_exists_and_new "${IMG_DESTINATION}/title.webp"
check_file_exists_and_new "${IMG_DESTINATION}/preview.webp"


convert "${PATH_TO_IMAGE}" -resize "${SOCIAL_PREVIEW_RESOLUTION}^" -gravity center -extent $SOCIAL_PREVIEW_RESOLUTION "${IMG_DESTINATION}/social_preview.jpg";
convert "${PATH_TO_IMAGE}" -resize "${TITLE_RESOLUTION}^" -gravity center -extent "${TITLE_RESOLUTION}" "${IMG_DESTINATION}/title.jpg";
convert "${IMG_DESTINATION}/title.jpg" -resize "${PREVIEW_RESOLUTION}^" -gravity center -extent "${PREVIEW_RESOLUTION}" "${IMG_DESTINATION}/preview.jpg";

cwebp -q 95 "${IMG_DESTINATION}/title.jpg" -o "${IMG_DESTINATION}/title.webp";
cwebp -q 95 "${IMG_DESTINATION}/preview.jpg" -o "${IMG_DESTINATION}/preview.webp";

ADD_TO_GIT=${ADD_TO_GIT:-"false"}

if [ "$ADD_TO_GIT" == "true" ]; then
  git add "${IMG_DESTINATION}"
fi

if [ -z "$TITLE_TEXT" ] || [ -z "$SUBTITLE_TEXT" ]; then
  echo -e "\033[33mWarning: Social preview is generated without text\033[0m"
  echo "Please provide a TITLE_TEXT and SUBTITLE_TEXT"
  exit 0
fi

export TITLE_TEXT="$TITLE_TEXT"
export SUBTITLE_TEXT="$SUBTITLE_TEXT"
export BACKGROUND_PATH="${IMG_DESTINATION}/social_preview.jpg"
export OUTPUT_PATH="${IMG_DESTINATION}/social_preview.png"

bash $SCRIPT_DIR/template/apply-template.sh

# Convet social_preview.png to jpg
convert "${IMG_DESTINATION}/social_preview.png" "${IMG_DESTINATION}/social_preview.jpg"
rm "${IMG_DESTINATION}/social_preview.png"