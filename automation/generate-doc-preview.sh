#!/bin/bash


SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

PATH_TO_DOC=${1:-""}

if [ -z "$PATH_TO_DOC" ]; then
    echo "No path to doc provided"
    exit 1
fi


PATH_TO_DOCS=$(realpath $SCRIPT_DIR/../qdrant-landing/content/documentation)

PATH_TO_IMAGES=$(realpath $SCRIPT_DIR/../qdrant-landing/static/documentation)

ABS_DOCS_DIR=$(realpath $PATH_TO_DOCS)
ABS_DOC_DIR=$(dirname $(realpath $PATH_TO_DOC))


DOCS_RELATIVE_PATH=$(realpath --relative-to=$ABS_DOCS_DIR $ABS_DOC_DIR)

DOC_FILE_NAME=$(basename $PATH_TO_DOC)

DOC_NAME_WITHOUT_EXTENSION=${DOC_FILE_NAME%.*}

export OUTPUT_PATH="$PATH_TO_IMAGES/${DOCS_RELATIVE_PATH}/${DOC_NAME_WITHOUT_EXTENSION}-social-preview.png"

if [ -f "$OUTPUT_PATH" ]; then
    echo "Preview already exists"
    exit 0
fi


# Check if the doc is in the docs directory
if [ "$DOCS_RELATIVE_PATH" == "." ]; then
    SUBTITLE_TEXT="Documentation"
else
    if [ "$DOC_NAME_WITHOUT_EXTENSION" == "_index" ]; then
        SUBTITLE_TEXT="Documentation"
    else
        SUBSECTION_TITLE=$(cat $ABS_DOC_DIR/_index.md | grep "title:" | head -n 1 | sed 's/title: //g' | sed 's/"//g')
        SUBTITLE_TEXT="Documentation / $SUBSECTION_TITLE"
    fi
fi

TITLE_TEXT=$(cat $PATH_TO_DOC | grep "title:" | head -n 1 | sed 's/title: //g' | sed 's/"//g')

echo $SUBTITLE_TEXT
echo $TITLE_TEXT

PATH_TO_BG_IMAGE="${PATH_TO_IMAGES}/${DOCS_RELATIVE_PATH}/${DOC_NAME_WITHOUT_EXTENSION}-bg.png"

if [ -f "$PATH_TO_BG_IMAGE" ]; then
    BACKGROUND_PATH="$PATH_TO_BG_IMAGE"
else
    BACKGROUND_PATH=""
fi

mkdir -p $PATH_TO_IMAGES/${DOCS_RELATIVE_PATH}

export TITLE_TEXT="$TITLE_TEXT"
export SUBTITLE_TEXT="$SUBTITLE_TEXT"
export BACKGROUND_PATH="$BACKGROUND_PATH"

bash $SCRIPT_DIR/template/apply-template.sh

