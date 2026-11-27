#!/bin/bash

MEMMOD="${1:-${MEMORY_MODE:-low}}"

REQUIRED_HUGO_VERSION="0.160.1"
INSTALLED_HUGO_VERSION=$(hugo version | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 | tr -d 'v')
if [ "${INSTALLED_HUGO_VERSION}" != "${REQUIRED_HUGO_VERSION}" ]; then
    echo "Warning: Hugo version ${REQUIRED_HUGO_VERSION} is required, but found ${INSTALLED_HUGO_VERSION}."
    echo "It is recommended to install the correct Hugo version. See https://gohugo.io/installation/ for installation instructions."
fi

if [[ "$MEMMOD" == "low" ]]
then
    echo "Running hugo in low memory mode. To switch to default, set MEMORY_MODE=high in the environment or run: './run.sh high'"
    cd qdrant-landing && npm install && GOMEMLIMIT=500MiB hugo serve
else
    cd qdrant-landing && npm install && hugo serve
fi
