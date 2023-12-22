#!/bin/bash

# This script is used to process images for content suitable for social networks

set -e

Help() {
  echo "Usage: bash $0 <path to image> <directory name> <blog post name alias> <options>"
  echo "Example: $0 ./qdrant-landing/static/blog_data/2021-04-01-announcing-qdrant-1-0/qdrant-1-0-social-preview.png ./qdrant-landing/static/blog_data/2021-04-01-announcing-qdrant-1-0/ announcing-qdrant-1-0 1200x630 898x300 530x145"
  echo "Options:"
  echo "h     Print this Help."
  echo "s     Social preview crop in format <width>x<height>. Default: 1200x630"
  echo "t     Title crop in format <width>x<height>. Default: 898x300"
  echo "p     Preview crop in format <width>x<height>. Default: 530x145"
}

while getopts ":hstp" option; do
   case $option in
      h) # display Help
         Help
         exit;;
      s) # social preview crop
          SOCIAL_PREVIEW_CROP_OPT=$OPTARG;;
      t) # title crop
          TITLE_CROP_OPT=$OPTARG;;
      p) # preview crop
          PREVIEW_CROP_OPT=$OPTARG;;
      \?) # incorrect option
          echo "Error: Invalid option"
          exit;;
   esac
done

if [ -z "$1" ]; then
  echo "Please provide a path to the image"
  exit 1
fi

if [ -z "$3" ]; then
  echo "Please provide an blog post name alias"
  exit 1
fi

if [ -z "$2" ]; then
  echo "Please provide an directory name to store images"
  exit 1
fi

if [ ! -f "$1" ]; then
  echo "File $1 does not exist"
  exit 1
fi

IMG_DESTINATION="${2}/${3}/preview"
mkdir -p $IMG_DESTINATION

SOCIAL_PREVIEW_CROP=$SOCIAL_PREVIEW_CROP_OPT || "1200x630"
TITLE_CROP=$TITLE_CROP_OPT || "898x300"
PREVIEW_CROP=$PREVIEW_CROP_OPT || "530x145"

echo "Social preview crop: $SOCIAL_PREVIEW_CROP"
echo "Title crop: $TITLE_CROP"
echo "Preview crop: $PREVIEW_CROP"


convert "$1" -resize "${SOCIAL_PREVIEW_CROP}^" -gravity center -extent $SOCIAL_PREVIEW_CROP "${IMG_DESTINATION}/social_preview.jpg";

convert "$1" -resize 898x300^ -gravity center -extent 898x300 "${IMG_DESTINATION}/title.jpg";
convert "${IMG_DESTINATION}/title.jpg" -resize 530x145^ -gravity center -extent 530x145 "${IMG_DESTINATION}/preview.jpg";

cwebp -q 95 "${IMG_DESTINATION}/title.jpg" -o "${IMG_DESTINATION}/title.webp";
cwebp -q 95 "${IMG_DESTINATION}/preview.jpg" -o "${IMG_DESTINATION}/preview.webp";