#!/bin/bash

DART_SASS_VERSION=${DART_SASS_VERSION:-1.70.0}
DEPLOY_PRIME_URL=${DEPLOY_PRIME_URL:-"https://qdrant.com"}

CURRENT_DIR=$(pwd)

REQUIRED_HUGO_VERSION="0.160.1"
INSTALLED_HUGO_VERSION=$(hugo version | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | head -1 | tr -d 'v')
if [ "${INSTALLED_HUGO_VERSION}" != "${REQUIRED_HUGO_VERSION}" ]; then
    echo "Error: Hugo version ${REQUIRED_HUGO_VERSION} is required, but found ${INSTALLED_HUGO_VERSION}."
    echo "See https://gohugo.io/installation/ for installation instructions."
    exit 1
fi

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)
case "${OS}" in
    linux)  SASS_OS="linux" ;;
    darwin) SASS_OS="macos" ;;
    *)      echo "Error: Unsupported OS: ${OS}"; exit 1 ;;
esac
case "${ARCH}" in
    x86_64)  SASS_ARCH="x64" ;;
    aarch64|arm64) SASS_ARCH="arm64" ;;
    *)       echo "Error: Unsupported architecture: ${ARCH}"; exit 1 ;;
esac
SASS_ARCHIVE="dart-sass-${DART_SASS_VERSION}-${SASS_OS}-${SASS_ARCH}.tar.gz"

curl -LJO "https://github.com/sass/dart-sass/releases/download/${DART_SASS_VERSION}/${SASS_ARCHIVE}" && \
    tar -xf "${SASS_ARCHIVE}" && \
    rm "${SASS_ARCHIVE}" && \
    export PATH="${CURRENT_DIR}/dart-sass:${PATH}" && \
    cd qdrant-landing && npm install && hugo --gc --minify --config config.toml,config-theme.toml --buildFuture -b ${DEPLOY_PRIME_URL}
