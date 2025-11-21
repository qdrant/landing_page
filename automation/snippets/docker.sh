#!/usr/bin/env sh

set -e

IMAGE_NAME="snippet-checker"
SCRRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

docker image inspect "$IMAGE_NAME" > /dev/null 2>&1 ||
	docker build -t "$IMAGE_NAME" "$SCRRIPT_DIR/docker"

[ $# -ne 0 ] || set -- bash

[ -t 0 ] && TTY_FLAG=--tty || TTY_FLAG=

docker run \
	--rm \
	--interactive \
	$TTY_FLAG \
	--network host \
	--user "$(id -u):$(id -g)" \
	--volume "$SCRRIPT_DIR:/workspace" \
	--volume "$SCRRIPT_DIR/../../qdrant-landing/content/documentation/headless/snippets:/snippets" \
	"$IMAGE_NAME" \
	uv run "$@"
