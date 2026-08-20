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
    cd qdrant-landing && npm install && hugo --gc --minify --config config.toml,config-theme.toml --buildFuture -b ${DEPLOY_PRIME_URL} || exit $?

# Merge the three redirect tables into public/redirects.txt for consumers that
# do not sit behind the CDN -- see automation/generate-redirects-table.py.
# A missing table only degrades the /md/ mirror to its cached copy, so warn
# rather than failing the whole deploy. The "Redirect Table Check" step in
# .github/workflows/internal-dead-links.yml runs this script with --strict, so
# a broken table fails the PR there rather than being swallowed here.
cd "${CURRENT_DIR}" && python3 automation/generate-redirects-table.py || \
    echo "warning: redirect table not regenerated, public/redirects.txt may be stale"
