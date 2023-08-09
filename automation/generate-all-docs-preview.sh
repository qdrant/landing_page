#!/bin/bash

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

DOCS_PATH=$(realpath $SCRIPT_DIR/../qdrant-landing/content/documentation)


find $DOCS_PATH -name '*.md' | xargs -I {} bash ${SCRIPT_DIR}/generate-doc-preview.sh {}
