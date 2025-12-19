#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

DOCS_PATH=$(realpath $SCRIPT_DIR/../qdrant-landing/content/documentation)

# Check if imagemagik and pngquant are installed
if ! command -v convert &> /dev/null; then
    echo "imagemagik is not installed, please install it with 'sudo apt install imagemagick'"
    exit 1
fi

if ! command -v pngquant &> /dev/null; then
    echo "pngquant is not installed, please install it with 'sudo apt install pngquant'"
    exit 1
fi


find $DOCS_PATH -name '*.md' -not -path '*/headless/*' | xargs -I {} bash ${SCRIPT_DIR}/generate-doc-preview.sh {}

