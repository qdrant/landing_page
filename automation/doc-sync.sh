#!/bin/bash

set -e

DOC_REP=docs
git clone https://github.com/qdrant/$DOC_REP.git


# ToDo: remove before merge
git checkout cloud-docs

if [ -d $DOC_REP ]; then
  QDRANT_DOC_VERSION=$(grep -o 'docVersion = .*' ./qdrant-landing/config.toml | awk -F'"' '/(docVersion = )"([^"]+)"/{ print $2 }')
  echo "Qdrant doc version: $QDRANT_DOC_VERSION"
  CLOUD_DOC_VERSION=$(grep -o 'cloudDocVersion = .*' ./qdrant-landing/config.toml | awk -F'"' '/(cloudDocVersion = )"([^"]+)"/{ print $2 }')
  echo "Cloud doc version: $CLOUD_DOC_VERSION"
fi;

QDRANT_DOC_DESTINATION=./qdrant-landing/content/documentation
QDRANT_DOC_SOURCE=./docs/qdrant/$QDRANT_DOC_VERSION

CLOUD_DOC_DESTINATION=$QDRANT_DOC_DESTINATION/cloud
CLOUD_DOC_SOURCE=./docs/cloud/$CLOUD_DOC_VERSION

DIFFER_QDRANT=$(diff --exclude=cloud -qr qdrant-landing/content/documentation docs/qdrant/"$QDRANT_DOC_VERSION" | cat);

if [ ! -d "$CLOUD_DOC_DESTINATION" ]; then
  mkdir "$CLOUD_DOC_DESTINATION"
fi;

#if there is no changes, script just exits with code 0
if [ -z "$DIFFER_QDRANT" ]; then
  echo "Sync for Qdrant documentation is not needed, files are identical"
  DIFFER_CLOUD=$(diff -qr qdrant-landing/content/documentation/cloud docs/cloud/"$CLOUD_DOC_VERSION" | cat);

  if [ -z "$DIFFER_CLOUD" ]; then
    echo "Sync for Cloud documentation is not needed, files are identical"
    rm -rf ./$DOC_REP
    exit 0;
  fi;

fi;

#updates docs
rm -rf $QDRANT_DOC_DESTINATION
mv "$QDRANT_DOC_SOURCE" "$QDRANT_DOC_DESTINATION"

#updates cloud docs
rm -rf $CLOUD_DOC_DESTINATION
mv "$CLOUD_DOC_SOURCE" "$CLOUD_DOC_DESTINATION"

rm -rf ./$DOC_REP
