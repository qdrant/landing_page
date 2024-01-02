#!/bin/bash

# directory of the current script

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"


PATH_TO_BLOGS="$DIR/../qdrant-landing/content/blog"

STATIC_FOLDER=$(realpath "$DIR/../qdrant-landing/static")


function get_value_from_md() {
    local key=$1
    local file=$2
    local value=$(grep -m 1 "^$key:" "$file" | sed "s/^$key: //")
    echo "$value"
}


function process_blog() {
    echo "-----"

    echo "Processing $1 file..."

    # Check if draft
    DRAFT=$(get_value_from_md "draft" "$1")

    if [ "$DRAFT" == "true" ]; then
        echo "Draft. Skipping"
        return
    fi

    SLUG=$(get_value_from_md "slug" "$1")

    if [ -z "$SLUG" ]; then        
        SLUG=$(basename "$1" | sed 's/\.md$//')
    fi

    echo "Slug: $SLUG"

    IMAGE_KEY="preview_image" # ToDo: change to generic image key

    SOURCE_IMAGE_PATH=$(get_value_from_md "${IMAGE_KEY}" "$1")

    if [ -z "$SOURCE_IMAGE_PATH" ]; then
        echo "No preview image for $1"
        return
    fi

    FULL_IMAGE_PATH="${STATIC_FOLDER}/${SOURCE_IMAGE_PATH}"

    echo "Source image path: $FULL_IMAGE_PATH"

    PATH_TO_IMAGE="${FULL_IMAGE_PATH}" \
    bash ${DIR}/process-blog-img.sh "$FULL_IMAGE_PATH" "$SLUG"
}



for f in $PATH_TO_BLOGS/*.md; do
    # Absolute path to the file

    abs_path=$(realpath "$f")


    process_blog "$abs_path"
done

