#!/bin/bash

set -e

DOC_REP=docs
git clone https://github.com/qdrant/$DOC_REP.git

if [ -d $DOC_REP ]; then
  DOC_VERSION=$(grep -o 'docVersion = .*' ./qdrant-landing/config.toml | awk -F'"' '/(docVersion = )"([^"]+)"/{ print $2 }')
fi;

DOC_DESTINATION=./qdrant-landing/content/documentation
DOC_SOURCE=./docs/qdrant/$DOC_VERSION

DIFFER=$(diff -qr qdrant-landing/content/documentation docs/qdrant/"$DOC_VERSION" | cat);

#if there is no changes, script just exits with code 0
if [ -z "$DIFFER" ]; then
  echo "Sync is not needed, files are identical"
  rm -rf ./$DOC_REP
  exit 0;
fi;

#updates docs
rm -rf $DOC_DESTINATION
mv "$DOC_SOURCE" "$DOC_DESTINATION"
rm -rf ./$DOC_REP