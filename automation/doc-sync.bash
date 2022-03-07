#!/bin/bash

set -e

cd "$GITHUB_WORKSPACE"
DOC_REP=docs
git clone git@github.com:qdrant/$DOC_REP.git

if [ -d $DOC_REP ]; then
  DOC_VERSION=$(grep -o 'docVersion = .*' ./qdrant-landing/config.toml | awk -F'"' '/(docVersion = )"([^"]+)"/{ print $2 }')
fi;

DOC_DESTINATION=./qdrant-landing/content/documentation
DOC_SOURCE=./docs/qdrant/$DOC_VERSION

rm -rf ./qdrant-landing/content/documentation
mv "$DOC_SOURCE" "$DOC_DESTINATION"
rm -rf ./$DOC_REP