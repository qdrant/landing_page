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

if [ ! -d ./qdrant-landing/static/articles_data/$2 ]; then
  mkdir ./qdrant-landing/static/articles_data/$2
fi

if [ -f "./qdrant-landing/static/articles_data/${2}/preview.webp" ]; then
  echo "File /qdrant-landing/static/articles_data/${2}/preview.webp already exists\n"
  read -p "Do you want to overwrite it? (y/n)": answer

  if [ "$answer" != "y" ]; then
    echo "Exiting"
    exit 0
  fi

  rm ./qdrant-landing/static/articles_data/${2}/preview.webp
fi

EXTENSION="${1##*.}"

cp "$1" ./qdrant-landing/static/articles_data/$2/preview.$EXTENSION
cwebp -q 95 $1 -o "./qdrant-landing/static/articles_data/${2}/preview.webp"
