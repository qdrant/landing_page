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


IMG_DESTINATION="./qdrant-landing/static/articles_data/${2}"
mkdir -p $IMG_DESTINATION

convert "$1" "${IMG_DESTINATION}/title.jpg";
mogrify -resize 898x300^ -gravity center -extent 898x300 "${IMG_DESTINATION}/title.jpg";
convert "${IMG_DESTINATION}/title.jpg" -resize 530x145^ -gravity center -extent 530x145 "${IMG_DESTINATION}/preview.jpg";

cwebp -q 95 "${IMG_DESTINATION}/title.jpg" -o "${IMG_DESTINATION}/title.webp";
cwebp -q 95 "${IMG_DESTINATION}/preview.jpg" -o "${IMG_DESTINATION}/preview.webp";